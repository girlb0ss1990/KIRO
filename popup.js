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

  sendMessage(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
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