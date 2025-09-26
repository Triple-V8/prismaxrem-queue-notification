// Popup script for PrismaX AI Queue Monitor extension
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Popup loaded');
  
  const elements = {
    loading: document.getElementById('loading'),
    content: document.getElementById('content'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('errorMessage'),
    monitoringStatus: document.getElementById('monitoringStatus'),
    statusText: document.getElementById('statusText'),
    currentUser: document.getElementById('currentUser'),
    lastUpdate: document.getElementById('lastUpdate'),
    pageUrl: document.getElementById('pageUrl'),
    toggleBtn: document.getElementById('toggleBtn'),
    forceCheckBtn: document.getElementById('forceCheckBtn'),
    openDashboardBtn: document.getElementById('openDashboardBtn')
  };

  let currentTab = null;
  let isMonitoring = false;

  async function init() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      
      console.log('🌐 Current tab URL:', tab.url);
      
      if (!tab.url?.includes('prismax')) {
        showError(`Please navigate to PrismaX AI website to use this extension. Current URL: ${tab.url}`);
        return;
      }
      
      elements.pageUrl.textContent = new URL(tab.url).hostname;
      
      // Load stored status
      await loadStatus();
      
      // Set up event listeners
      setupEventListeners();
      
      // Show content
      elements.loading.style.display = 'none';
      elements.content.style.display = 'block';
      
    } catch (error) {
      console.error('❌ Initialization error:', error);
      showError('Failed to initialize extension');
    }
  }

  async function loadStatus() {
    try {
      // Get last queue status from storage
      const result = await chrome.storage.local.get(['lastQueueStatus']);
      const lastStatus = result.lastQueueStatus;
      
      if (lastStatus) {
        elements.currentUser.innerHTML = lastStatus.currentUserPattern ? 
          `<span class="queue-pattern">${lastStatus.currentUserPattern}</span>` : 
          'Not detected';
        
        elements.lastUpdate.textContent = lastStatus.timestamp ? 
          formatTime(new Date(lastStatus.timestamp)) : 
          'Never';
      }
      
      // Check if content script is monitoring
      const response = await sendMessageToTab({ type: 'GET_QUEUE_STATUS' });
      
      if (response && response.success) {
        isMonitoring = true;
        updateMonitoringStatus(true);
        
        if (response.queueInfo) {
          elements.currentUser.innerHTML = response.queueInfo.currentUserPattern ? 
            `<span class="queue-pattern">${response.queueInfo.currentUserPattern}</span>` : 
            'Not detected';
        }
      } else {
        updateMonitoringStatus(false);
      }
      
    } catch (error) {
      console.error('❌ Failed to load status:', error);
      updateMonitoringStatus(false);
    }
  }

  function setupEventListeners() {
    elements.toggleBtn.addEventListener('click', async () => {
      try {
        elements.toggleBtn.disabled = true;
        
        const response = await sendMessageToTab({ type: 'TOGGLE_MONITORING' });
        
        if (response && response.success) {
          isMonitoring = response.monitoring;
          updateMonitoringStatus(isMonitoring);
          hideError();
        } else {
          const errorMsg = response?.error || 'Failed to toggle monitoring';
          showError(errorMsg);
        }
        
      } catch (error) {
        console.error('❌ Toggle error:', error);
        showError('Failed to toggle monitoring');
      } finally {
        elements.toggleBtn.disabled = false;
      }
    });

    elements.forceCheckBtn.addEventListener('click', async () => {
      try {
        elements.forceCheckBtn.disabled = true;
        elements.forceCheckBtn.textContent = 'Checking...';
        
        const response = await sendMessageToTab({ type: 'FORCE_CHECK' });
        
        if (response && response.success) {
          // Reload status after a short delay
          setTimeout(async () => {
            await loadStatus();
            hideError();
          }, 1000);
        } else {
          showError('Failed to force check');
        }
        
      } catch (error) {
        console.error('❌ Force check error:', error);
        showError('Failed to force check');
      } finally {
        elements.forceCheckBtn.disabled = false;
        elements.forceCheckBtn.textContent = 'Force Check Now';
      }
    });

    elements.openDashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000' });
      window.close();
    });
  }

  async function sendMessageToTab(message) {
    if (!currentTab) {
      console.error('❌ No active tab found');
      return { success: false, error: 'No active tab' };
    }
    
    console.log('📤 Sending message to tab:', currentTab.id, message);
    
    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, message);
      console.log('📥 Received response:', response);
      return response;
    } catch (error) {
      console.error('❌ Message send error:', error);
      
      // Check if content script is injected
      if (error.message?.includes('Could not establish connection') || 
          error.message?.includes('Receiving end does not exist')) {
        console.log('🔄 Content script not responding, trying to inject...');
        
        try {
          // Try to inject the content script manually
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
          });
          
          // Wait a moment for injection
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try sending message again
          const retryResponse = await chrome.tabs.sendMessage(currentTab.id, message);
          console.log('✅ Retry successful:', retryResponse);
          return retryResponse;
          
        } catch (injectError) {
          console.error('❌ Failed to inject content script:', injectError);
          return { 
            success: false, 
            error: 'Content script not responding. Try refreshing the page.' 
          };
        }
      }
      
      return { success: false, error: error.message };
    }
  }

  function updateMonitoringStatus(monitoring) {
    const indicator = elements.monitoringStatus.querySelector('.indicator');
    
    if (monitoring) {
      elements.monitoringStatus.className = 'monitoring-status monitoring-active';
      indicator.className = 'indicator indicator-green';
      elements.statusText.textContent = 'Monitoring Active';
      elements.toggleBtn.textContent = 'Stop Monitoring';
    } else {
      elements.monitoringStatus.className = 'monitoring-status monitoring-inactive';
      indicator.className = 'indicator indicator-red';
      elements.statusText.textContent = 'Monitoring Stopped';
      elements.toggleBtn.textContent = 'Start Monitoring';
    }
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.style.display = 'block';
  }

  function hideError() {
    elements.error.style.display = 'none';
  }

  function formatTime(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Auto-refresh status every 10 seconds
  setInterval(async () => {
    if (elements.content.style.display !== 'none') {
      await loadStatus();
    }
  }, 10000);

  // Initialize popup
  await init();
});