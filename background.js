// Background script for the accessibility extension
class AccessibilityBackground {
  constructor() {
    this.setupInstallListener();
    this.setupActionListener();
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.log('Universal Accessibility Toolkit installed');
        this.setDefaultSettings();
      }
    });
  }

  setupActionListener() {
    chrome.action.onClicked.addListener((tab) => {
      // This will open the popup, but we can add additional logic here if needed
      console.log('Extension icon clicked for tab:', tab.id);
    });
  }

  async setDefaultSettings() {
    // Set default preferences
    const defaultSettings = {
      accessibility_contrast_threshold: 4.5,
      accessibility_tts_rate: 0.8,
      accessibility_tts_pitch: 1.0,
      accessibility_font_size_multiplier: 1.0
    };

    await chrome.storage.local.set(defaultSettings);
  }

  // Handle messages from content scripts or popup
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'getSettings':
          this.getSettings().then(sendResponse);
          return true; // Indicates async response
        
        case 'saveSettings':
          this.saveSettings(message.settings).then(() => {
            sendResponse({ success: true });
          });
          return true;
        
        case 'resetSettings':
          this.resetSettings().then(() => {
            sendResponse({ success: true });
          });
          return true;
      }
    });
  }

  async getSettings() {
    return await chrome.storage.local.get();
  }

  async saveSettings(settings) {
    await chrome.storage.local.set(settings);
  }

  async resetSettings() {
    await chrome.storage.local.clear();
    await this.setDefaultSettings();
  }
}

// Initialize background script
new AccessibilityBackground();