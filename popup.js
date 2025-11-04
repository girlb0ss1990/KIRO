// Popup script for managing extension features
class AccessibilityPopup {
  constructor() {
    this.initializeToggles();
    this.initializeButtons();
    this.initializeFontSelector();
    this.loadSavedStates();
  }

  initializeToggles() {
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const feature = toggle.dataset.feature;
        const isActive = toggle.classList.contains('active');
        
        if (isActive) {
          toggle.classList.remove('active');
          this.disableFeature(feature);
        } else {
          toggle.classList.add('active');
          this.enableFeature(feature);
        }
        
        this.saveState(feature, !isActive);
      });
    });
  }

  initializeButtons() {
    // Color blindness filters
    document.getElementById('protanopia-filter').addEventListener('click', () => {
      this.sendMessage({ action: 'toggleColorFilter', filter: 'protanopia' });
    });
    
    document.getElementById('deuteranopia-filter').addEventListener('click', () => {
      this.sendMessage({ action: 'toggleColorFilter', filter: 'deuteranopia' });
    });
    
    document.getElementById('tritanopia-filter').addEventListener('click', () => {
      this.sendMessage({ action: 'toggleColorFilter', filter: 'tritanopia' });
    });
  }

  initializeFontSelector() {
    const fontSelector = document.getElementById('font-selector');
    fontSelector.addEventListener('change', (e) => {
      const font = e.target.value;
      this.sendMessage({ action: 'changeDyslexiaFont', font });
      this.saveState('dyslexia-font', font);
    });
  }

  enableFeature(feature) {
    this.sendMessage({ action: 'enableFeature', feature });
  }

  disableFeature(feature) {
    this.sendMessage({ action: 'disableFeature', feature });
  }

  async sendMessage(message) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        console.warn('No active tab found');
        return;
      }

      const tab = tabs[0];
      
      // Check if the tab URL is valid for content scripts
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        console.warn('Cannot inject content script into browser pages');
        this.showError('This extension cannot run on browser internal pages');
        return;
      }

      // Try to send the message
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      console.warn('Content script not ready, injecting...', error);
      
      // If content script isn't ready, inject it first
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        
        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });

        // Inject the CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });

        // Wait a moment for the script to initialize, then try again
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, message);
          } catch (retryError) {
            console.error('Failed to send message after injection:', retryError);
            this.showError('Failed to activate feature. Please refresh the page and try again.');
          }
        }, 100);

      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
        this.showError('Cannot activate features on this page. Please try on a regular webpage.');
      }
    }
  }

  showError(message) {
    // Create a temporary error message in the popup
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #dc3545;
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  saveState(feature, state) {
    const key = `accessibility_${feature}`;
    chrome.storage.local.set({ [key]: state });
  }

  async loadSavedStates() {
    const features = [
      'contrast-checker', 'high-contrast', 'focus-order', 'alt-inspector',
      'reading-mode', 'beeline', 'caret-browsing', 'target-size'
    ];

    for (const feature of features) {
      const result = await chrome.storage.local.get(`accessibility_${feature}`);
      const isEnabled = result[`accessibility_${feature}`];
      
      if (isEnabled) {
        const toggle = document.querySelector(`[data-feature="${feature}"]`);
        if (toggle) {
          toggle.classList.add('active');
        }
      }
    }

    // Load font preference
    const fontResult = await chrome.storage.local.get('accessibility_dyslexia-font');
    const savedFont = fontResult['accessibility_dyslexia-font'];
    if (savedFont) {
      document.getElementById('font-selector').value = savedFont;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccessibilityPopup();
});