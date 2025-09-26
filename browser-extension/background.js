// Background script for managing extension state and notifications
console.log('🎯 PrismaX AI Queue Monitor Background Script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ PrismaX AI Queue Monitor installed');
  
  // Set default badge
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SHOW_BADGE':
      chrome.action.setBadgeText({ 
        text: message.text || '!',
        tabId: sender.tab?.id 
      });
      chrome.action.setBadgeBackgroundColor({ 
        color: '#FF5722',
        tabId: sender.tab?.id 
      });
      
      // Clear badge after 30 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: sender.tab?.id });
      }, 30000);
      
      sendResponse({ success: true });
      break;
      
    case 'CLEAR_BADGE':
      chrome.action.setBadgeText({ 
        text: '',
        tabId: sender.tab?.id 
      });
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle tab updates to reset monitoring state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('prismax')) {
    // Reset badge when navigating to PrismaX AI
    chrome.action.setBadgeText({ text: '', tabId });
    console.log(`🔄 Tab updated: ${tab.url}`);
  }
});

// Retry failed queue updates periodically
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get('failedUpdates');
    const failedUpdates = result.failedUpdates || [];
    
    if (failedUpdates.length > 0) {
      console.log(`🔄 Retrying ${failedUpdates.length} failed updates...`);
      
      const retryPromises = failedUpdates.map(async (update, index) => {
        if (update.retries >= 3) {
          console.log('❌ Max retries exceeded, removing update:', update);
          return null; // Mark for removal
        }
        
        try {
          const response = await fetch('https://prismaxrem-queue-notification.onrender.com/api/queue/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentUserPattern: update.currentUserPattern,
              rawContent: update.rawContent,
              timestamp: update.timestamp,
              source: 'browser-extension-retry'
            })
          });
          
          if (response.ok) {
            console.log('✅ Retry successful:', update);
            return null; // Mark for removal
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('❌ Retry failed:', error);
          update.retries = (update.retries || 0) + 1;
          return update; // Keep for next retry
        }
      });
      
      const retryResults = await Promise.all(retryPromises);
      const remainingUpdates = retryResults.filter(update => update !== null);
      
      // Update storage with remaining failed updates
      await chrome.storage.local.set({ failedUpdates: remainingUpdates });
    }
  } catch (error) {
    console.error('❌ Error during retry process:', error);
  }
}, 2 * 60 * 1000); // Every 2 minutes