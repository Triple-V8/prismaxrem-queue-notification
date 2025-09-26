// Content script that monitors the PrismaX AI queue
console.log('🎯 PrismaX AI Queue Monitor loaded');

class QueueMonitor {
  constructor() {
    this.backendUrl = 'https://prismaxrem-queue-notification.onrender.com/api';
    this.isMonitoring = false;
    this.lastQueueStatus = null;
    this.debounceTimer = null;
    this.monitoringInterval = null;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    console.log('📊 Starting queue monitoring...');
    this.isMonitoring = true;
    this.checkQueue();
    
    this.monitoringInterval = setInterval(() => {
      this.checkQueue();
    }, 30000);
  }

  stopMonitoring() {
    console.log('⏹️ Stopping queue monitoring...');
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  extractQueueInfo() {
    try {
      console.log('🔍 Looking for PrismaX AI queue structure...');
      
      // Try to find the queue list
      const queueList = document.querySelector('.QueuePanel_queueList__B2z+J') || 
                        document.querySelector('[class*="queueList"]');
      
      if (!queueList) {
        console.log('❌ Queue list not found, trying fallback...');
        return this.extractQueueInfoFallback();
      }
      
      // Get queue items
      const queueItems = queueList.querySelectorAll('.QueuePanel_queueItem__jK2hp') ||
                         queueList.querySelectorAll('[class*="queueItem"]');
      
      if (queueItems.length < 2) {
        console.log('⚠️ Less than 2 queue items found');
        return this.extractQueueInfoFallback();
      }
      
      // Get second item (position 02)
      const secondItem = queueItems[1];
      const userSpan = secondItem.querySelector('.QueuePanel_queueUser__ql2R9 span') ||
                       secondItem.querySelector('span');
      
      if (!userSpan) {
        console.log('⚠️ User span not found');
        return this.extractQueueInfoFallback();
      }
      
      const currentUserPattern = userSpan.textContent.trim();
      console.log(`🎯 Found pattern: "${currentUserPattern}"`);
      
      if (!currentUserPattern.includes('..')) {
        return this.extractQueueInfoFallback();
      }
      
      return {
        currentUserPattern: currentUserPattern,
        rawContent: `Queue Position 02: ${currentUserPattern}`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error extracting queue info:', error);
      return this.extractQueueInfoFallback();
    }
  }

  extractQueueInfoFallback() {
    console.log('🔄 Using fallback extraction...');
    
    try {
      const bodyText = document.body.textContent || '';
      console.log('📄 Page content sample:', bodyText.substring(0, 300));
      
      // Look for pattern in page text
      const pattern = /([a-zA-Z0-9]{3,8}\.\.{1,2}[a-zA-Z0-9]{3})/g;
      const matches = bodyText.match(pattern);
      
      if (matches && matches.length > 0) {
        const currentUserPattern = matches[0];
        console.log(`🎯 Found pattern via fallback: "${currentUserPattern}"`);
        
        return {
          currentUserPattern: currentUserPattern,
          rawContent: `Fallback extraction: ${currentUserPattern}`,
          timestamp: new Date().toISOString()
        };
      }
      
      console.log('❌ No pattern found');
      return null;
      
    } catch (error) {
      console.error('❌ Fallback error:', error);
      return null;
    }
  }

  async checkQueue() {
    if (!this.isMonitoring) return;
    
    try {
      const queueInfo = this.extractQueueInfo();
      
      if (!queueInfo) {
        console.log('⚠️ No queue info found');
        return;
      }
      
      const { currentUserPattern, rawContent } = queueInfo;
      
      if (this.lastQueueStatus && this.lastQueueStatus.currentUserPattern === currentUserPattern) {
        console.log('ℹ️ Queue unchanged');
        return;
      }
      
      console.log(`🔔 Queue change: ${currentUserPattern}`);
      this.lastQueueStatus = queueInfo;
      
      await this.sendQueueUpdate(currentUserPattern, rawContent);
      
    } catch (error) {
      console.error('❌ Check queue error:', error);
    }
  }

  async sendQueueUpdate(currentUserPattern, rawContent) {
    try {
      console.log('📤 Sending update to backend...');
      
      const response = await fetch(`${this.backendUrl}/queue/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserPattern,
          rawContent,
          timestamp: new Date().toISOString(),
          source: 'browser-extension'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Update sent:', result);
      } else {
        console.error('❌ Update failed:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Network error:', error);
    }
  }
}

// Initialize the queue monitor
const queueMonitor = new QueueMonitor();

// Handle extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message);
  
  try {
    switch (message.type) {
      case 'GET_QUEUE_STATUS':
        const queueInfo = queueMonitor.extractQueueInfo();
        sendResponse({ success: true, queueInfo });
        break;
        
      case 'FORCE_CHECK':
        queueMonitor.checkQueue();
        sendResponse({ success: true, message: 'Force check initiated' });
        break;
        
      case 'TOGGLE_MONITORING':
        if (queueMonitor.isMonitoring) {
          queueMonitor.stopMonitoring();
          sendResponse({ success: true, monitoring: false });
        } else {
          queueMonitor.startMonitoring();
          sendResponse({ success: true, monitoring: true });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('❌ Message error:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});

// Auto-start monitoring
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => queueMonitor.startMonitoring());
} else {
  queueMonitor.startMonitoring();
}
