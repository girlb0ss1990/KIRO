// Content script for accessibility features
class AccessibilityToolkit {
  constructor() {
    this.features = new Map();
    this.initializeFeatures();
    this.setupMessageListener();
    this.loadSavedStates();
  }

  initializeFeatures() {
    this.features.set('contrast-checker', new ContrastChecker());
    this.features.set('high-contrast', new HighContrastMode());
    this.features.set('focus-order', new FocusOrderChecker());
    this.features.set('alt-inspector', new AltTextInspector());
    this.features.set('reading-mode', new ReadingMode());
    this.features.set('tts', new TextToSpeech());
    this.features.set('beeline', new BeelineReader());
    this.features.set('caret-browsing', new CaretBrowsing());
    this.features.set('target-size', new TargetSizeChecker());
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'enableFeature':
          this.enableFeature(message.feature);
          break;
        case 'disableFeature':
          this.disableFeature(message.feature);
          break;
        case 'toggleColorFilter':
          this.toggleColorFilter(message.filter);
          break;
        case 'changeDyslexiaFont':
          this.changeDyslexiaFont(message.font);
          break;
      }
    });
  }

  enableFeature(featureName) {
    const feature = this.features.get(featureName);
    if (feature) {
      feature.enable();
    }
  }

  disableFeature(featureName) {
    const feature = this.features.get(featureName);
    if (feature) {
      feature.disable();
    }
  }

  toggleColorFilter(filter) {
    document.body.className = document.body.className.replace(/accessibility-(protanopia|deuteranopia|tritanopia)/g, '');
    document.body.classList.add(`accessibility-${filter}`);
    this.addColorBlindnessFilters();
  }

  changeDyslexiaFont(font) {
    document.body.className = document.body.className.replace(/accessibility-font-\w+/g, '');
    if (font !== 'default') {
      document.body.classList.add(`accessibility-font-${font}`);
    }
  }

  addColorBlindnessFilters() {
    if (document.getElementById('accessibility-filters')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'accessibility-filters';
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  async loadSavedStates() {
    const result = await chrome.storage.local.get();
    
    for (const [key, value] of Object.entries(result)) {
      if (key.startsWith('accessibility_') && value) {
        const feature = key.replace('accessibility_', '');
        
        if (feature === 'dyslexia-font') {
          this.changeDyslexiaFont(value);
        } else if (this.features.has(feature)) {
          this.enableFeature(feature);
        }
      }
    }
  }
}

// Feature Classes
class ContrastChecker {
  constructor() {
    this.isEnabled = false;
    this.indicators = [];
  }

  enable() {
    this.isEnabled = true;
    document.addEventListener('mouseover', this.checkContrast.bind(this));
  }

  disable() {
    this.isEnabled = false;
    document.removeEventListener('mouseover', this.checkContrast.bind(this));
    this.clearIndicators();
  }

  checkContrast(event) {
    if (!this.isEnabled) return;
    
    const element = event.target;
    const styles = window.getComputedStyle(element);
    const bgColor = styles.backgroundColor;
    const textColor = styles.color;
    
    if (bgColor && textColor && element.textContent.trim()) {
      const ratio = this.calculateContrastRatio(textColor, bgColor);
      this.showContrastIndicator(element, ratio);
    }
  }

  calculateContrastRatio(color1, color2) {
    const rgb1 = this.parseRGB(color1);
    const rgb2 = this.parseRGB(color2);
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  parseRGB(color) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0];
  }

  getLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  showContrastIndicator(element, ratio) {
    this.clearIndicators();
    
    const indicator = document.createElement('div');
    indicator.className = `accessibility-contrast-indicator ${ratio >= 4.5 ? 'accessibility-contrast-pass' : 'accessibility-contrast-fail'}`;
    indicator.textContent = `Contrast: ${ratio.toFixed(2)}:1 ${ratio >= 4.5 ? '✓' : '✗'}`;
    
    const rect = element.getBoundingClientRect();
    indicator.style.left = `${rect.left + window.scrollX}px`;
    indicator.style.top = `${rect.top + window.scrollY - 30}px`;
    
    document.body.appendChild(indicator);
    this.indicators.push(indicator);
    
    setTimeout(() => this.clearIndicators(), 3000);
  }

  clearIndicators() {
    this.indicators.forEach(indicator => indicator.remove());
    this.indicators = [];
  }
}

class HighContrastMode {
  enable() {
    document.body.classList.add('accessibility-high-contrast');
  }

  disable() {
    document.body.classList.remove('accessibility-high-contrast');
  }
}

class FocusOrderChecker {
  constructor() {
    this.indicators = [];
  }

  enable() {
    this.showFocusOrder();
  }

  disable() {
    this.clearIndicators();
  }

  showFocusOrder() {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      const indicator = document.createElement('div');
      indicator.className = 'accessibility-focus-indicator';
      indicator.textContent = index + 1;
      
      const rect = element.getBoundingClientRect();
      indicator.style.left = `${rect.left + window.scrollX}px`;
      indicator.style.top = `${rect.top + window.scrollY}px`;
      
      document.body.appendChild(indicator);
      this.indicators.push(indicator);
    });
  }

  clearIndicators() {
    this.indicators.forEach(indicator => indicator.remove());
    this.indicators = [];
  }
}

class AltTextInspector {
  constructor() {
    this.indicators = [];
  }

  enable() {
    this.inspectImages();
  }

  disable() {
    this.clearIndicators();
  }

  inspectImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const indicator = document.createElement('div');
      const alt = img.getAttribute('alt');
      
      if (!alt || alt.trim() === '') {
        indicator.className = 'accessibility-alt-indicator accessibility-alt-missing';
        indicator.textContent = 'Missing Alt Text';
      } else {
        indicator.className = 'accessibility-alt-indicator';
        indicator.textContent = `Alt: ${alt}`;
      }
      
      const rect = img.getBoundingClientRect();
      indicator.style.left = `${rect.left + window.scrollX}px`;
      indicator.style.top = `${rect.top + window.scrollY}px`;
      
      document.body.appendChild(indicator);
      this.indicators.push(indicator);
    });
  }

  clearIndicators() {
    this.indicators.forEach(indicator => indicator.remove());
    this.indicators = [];
  }
}

class ReadingMode {
  enable() {
    document.body.classList.add('accessibility-reading-mode');
  }

  disable() {
    document.body.classList.remove('accessibility-reading-mode');
  }
}

class TextToSpeech {
  constructor() {
    this.isEnabled = false;
    this.currentUtterance = null;
  }

  enable() {
    this.isEnabled = true;
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
  }

  disable() {
    this.isEnabled = false;
    document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
    this.stopSpeaking();
  }

  handleTextSelection() {
    if (!this.isEnabled) return;
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      this.speak(text);
      this.highlightText(selection);
    }
  }

  speak(text) {
    this.stopSpeaking();
    
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = 0.8;
    this.currentUtterance.pitch = 1;
    
    speechSynthesis.speak(this.currentUtterance);
  }

  stopSpeaking() {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  highlightText(selection) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'accessibility-tts-highlight';
    
    try {
      range.surroundContents(span);
      setTimeout(() => {
        if (span.parentNode) {
          span.outerHTML = span.innerHTML;
        }
      }, 3000);
    } catch (e) {
      // Handle cases where range spans multiple elements
    }
  }
}

class BeelineReader {
  enable() {
    const textElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      if (element.textContent.trim() && !element.querySelector('*')) {
        element.classList.add('accessibility-beeline-text');
      }
    });
  }

  disable() {
    const elements = document.querySelectorAll('.accessibility-beeline-text');
    elements.forEach(element => {
      element.classList.remove('accessibility-beeline-text');
    });
  }
}

class CaretBrowsing {
  constructor() {
    this.isEnabled = false;
    this.caret = null;
    this.currentPosition = 0;
  }

  enable() {
    this.isEnabled = true;
    this.createCaret();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  disable() {
    this.isEnabled = false;
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    if (this.caret) {
      this.caret.remove();
      this.caret = null;
    }
  }

  createCaret() {
    this.caret = document.createElement('div');
    this.caret.className = 'accessibility-caret';
    document.body.appendChild(this.caret);
    this.updateCaretPosition();
  }

  handleKeydown(event) {
    if (!this.isEnabled) return;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.moveCaret('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveCaret('down');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.moveCaret('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveCaret('right');
        break;
    }
  }

  moveCaret(direction) {
    // Simplified caret movement - in a full implementation,
    // this would need to handle text nodes and positioning more precisely
    const rect = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.getBoundingClientRect();
    if (rect) {
      this.caret.style.left = `${rect.left}px`;
      this.caret.style.top = `${rect.top}px`;
    }
  }

  updateCaretPosition() {
    if (this.caret) {
      this.caret.style.left = '10px';
      this.caret.style.top = '10px';
    }
  }
}

class TargetSizeChecker {
  constructor() {
    this.indicators = [];
  }

  enable() {
    this.checkTargetSizes();
  }

  disable() {
    this.clearIndicators();
    const elements = document.querySelectorAll('.accessibility-small-target');
    elements.forEach(element => {
      element.classList.remove('accessibility-small-target');
    });
  }

  checkTargetSizes() {
    const interactiveElements = document.querySelectorAll(
      'button, a, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [onclick]'
    );

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG recommended minimum
      
      if (rect.width < minSize || rect.height < minSize) {
        element.classList.add('accessibility-small-target');
        
        const indicator = document.createElement('div');
        indicator.className = 'accessibility-target-tooltip';
        indicator.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}px (min: 44×44px)`;
        
        indicator.style.left = `${rect.left + window.scrollX}px`;
        indicator.style.top = `${rect.top + window.scrollY - 30}px`;
        
        document.body.appendChild(indicator);
        this.indicators.push(indicator);
      }
    });
  }

  clearIndicators() {
    this.indicators.forEach(indicator => indicator.remove());
    this.indicators = [];
  }
}

// Initialize the toolkit when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityToolkit();
  });
} else {
  new AccessibilityToolkit();
}