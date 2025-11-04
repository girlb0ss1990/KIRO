// Enhanced Alt Text Inspector with MCP Server Integration
class EnhancedAltTextInspector {
  constructor() {
    this.indicators = [];
    this.mcpClient = null;
    this.initializeMCPClient();
  }

  async initializeMCPClient() {
    // Initialize connection to MCP alt-text-generator server
    // This would be handled by Kiro's MCP integration
    this.mcpClient = {
      isAvailable: true,
      callTool: async (toolName, args) => {
        // Simulate MCP call - in production this goes through Kiro's MCP system
        return await this.simulateMCPCall(toolName, args);
      }
    };
  }

  enable() {
    this.inspectImages();
  }

  disable() {
    this.clearIndicators();
  }

  async inspectImages() {
    const images = document.querySelectorAll('img');
    
    for (const img of images) {
      await this.createImageIndicator(img);
    }
  }

  async createImageIndicator(img) {
    const indicator = document.createElement('div');
    const alt = img.getAttribute('alt');
    const rect = img.getBoundingClientRect();
    
    // Determine indicator type and add click handler for MCP integration
    if (!alt || alt.trim() === '' || this.isPlaceholderAlt(alt)) {
      indicator.className = 'accessibility-alt-indicator accessibility-alt-missing clickable';
      indicator.textContent = '⚠️ Generate Alt Text';
      indicator.title = 'Click to generate AI-powered alt text suggestions';
      
      // Add click handler for MCP alt text generation
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAltTextGeneration(img, indicator);
      });
      
    } else {
      indicator.className = 'accessibility-alt-indicator accessibility-alt-present clickable';
      indicator.textContent = `✓ Alt: ${alt.substring(0, 30)}${alt.length > 30 ? '...' : ''}`;
      indicator.title = 'Click to validate or improve alt text';
      
      // Add click handler for alt text validation
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAltTextValidation(img, alt, indicator);
      });
    }
    
    // Position indicator
    indicator.style.left = `${rect.left + window.scrollX}px`;
    indicator.style.top = `${rect.top + window.scrollY}px`;
    indicator.style.cursor = 'pointer';
    indicator.style.zIndex = '10000';
    
    document.body.appendChild(indicator);
    this.indicators.push(indicator);
  }

  async handleAltTextGeneration(img, indicator) {
    try {
      // Show loading state
      indicator.textContent = '🔄 Generating...';
      indicator.style.pointerEvents = 'none';
      
      // Capture image and context data
      const imageData = await this.captureImageData(img);
      const context = this.capturePageContext(img);
      
      // Call MCP server for alt text generation
      const result = await this.mcpClient.callTool('generate_alt_text', {
        image_data: imageData,
        context: context
      });
      
      if (result.success) {
        // Show alt text options modal
        this.showAltTextModal(img, result.alt_suggestions, indicator);
      } else {
        throw new Error(result.error || 'Failed to generate alt text');
      }
      
    } catch (error) {
      console.error('Alt text generation failed:', error);
      indicator.textContent = '❌ Generation Failed';
      indicator.title = 'Click to try again or add manual alt text';
      
      // Show fallback modal with manual input
      this.showFallbackModal(img, indicator);
    }
    
    // Restore click functionality
    setTimeout(() => {
      indicator.style.pointerEvents = 'auto';
    }, 1000);
  }

  async handleAltTextValidation(img, currentAlt, indicator) {
    try {
      // Show loading state
      const originalText = indicator.textContent;
      indicator.textContent = '🔄 Validating...';
      
      // Capture image data for validation
      const imageData = await this.captureImageData(img);
      const context = this.capturePageContext(img);
      
      // Call MCP server for validation
      const result = await this.mcpClient.callTool('validate_alt_text_quality', {
        alt_text: currentAlt,
        image_data: imageData,
        context: context
      });
      
      // Show validation results and improvement suggestions
      this.showValidationModal(img, currentAlt, result, indicator);
      
      // Restore original text
      indicator.textContent = originalText;
      
    } catch (error) {
      console.error('Alt text validation failed:', error);
      indicator.textContent = originalText;
    }
  }

  async captureImageData(img) {
    try {
      // Try to get image as base64 data
      if (img.src.startsWith('data:')) {
        return img.src;
      }
      
      // For external URLs, return the URL (MCP server will handle download)
      if (img.src.startsWith('http')) {
        return img.src;
      }
      
      // For relative URLs, convert to absolute
      const absoluteUrl = new URL(img.src, window.location.href).href;
      return absoluteUrl;
      
    } catch (error) {
      console.error('Failed to capture image data:', error);
      return img.src; // Fallback to original src
    }
  }

  capturePageContext(img) {
    // Capture contextual information for better alt text generation
    const context = {
      page_title: document.title,
      page_topic: this.inferPageTopic(),
      image_filename: this.extractFilename(img.src),
      surrounding_text: this.getSurroundingText(img),
      element_role: this.determineImageRole(img)
    };
    
    return context;
  }

  inferPageTopic() {
    // Simple topic inference from page title and headings
    const title = document.title.toLowerCase();
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.toLowerCase())
      .join(' ');
    
    const combinedText = `${title} ${headings}`;
    
    // Basic keyword detection
    if (combinedText.includes('product') || combinedText.includes('shop')) return 'ecommerce';
    if (combinedText.includes('article') || combinedText.includes('blog')) return 'content';
    if (combinedText.includes('about') || combinedText.includes('team')) return 'corporate';
    if (combinedText.includes('portfolio') || combinedText.includes('gallery')) return 'showcase';
    
    return 'general';
  }

  extractFilename(src) {
    try {
      const url = new URL(src, window.location.href);
      const pathname = url.pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1);
    } catch {
      return '';
    }
  }

  getSurroundingText(img) {
    // Get text content from nearby elements
    const parent = img.parentElement;
    if (!parent) return '';
    
    // Look for captions, nearby paragraphs, or parent text
    const caption = parent.querySelector('figcaption');
    if (caption) return caption.textContent.trim();
    
    // Get text from parent or siblings
    const siblings = Array.from(parent.children);
    const textContent = siblings
      .filter(el => el !== img && el.textContent.trim())
      .map(el => el.textContent.trim())
      .join(' ');
    
    return textContent.substring(0, 200); // Limit context length
  }

  determineImageRole(img) {
    // Determine the image's role in the page
    const parent = img.parentElement;
    const classes = img.className.toLowerCase();
    const parentClasses = parent ? parent.className.toLowerCase() : '';
    
    if (classes.includes('logo') || parentClasses.includes('logo')) return 'logo';
    if (classes.includes('icon') || img.width <= 32 || img.height <= 32) return 'icon';
    if (parent && parent.tagName.toLowerCase() === 'figure') return 'figure';
    if (classes.includes('hero') || parentClasses.includes('hero')) return 'hero';
    if (classes.includes('thumbnail') || parentClasses.includes('thumbnail')) return 'thumbnail';
    
    return 'content';
  }

  showAltTextModal(img, suggestions, indicator) {
    // Create modal for alt text selection
    const modal = document.createElement('div');
    modal.className = 'accessibility-alt-modal';
    modal.innerHTML = `
      <div class="accessibility-modal-content">
        <div class="accessibility-modal-header">
          <h3>🎯 AI-Generated Alt Text Options</h3>
          <button class="accessibility-modal-close">&times;</button>
        </div>
        <div class="accessibility-modal-body">
          <p><strong>Select the best alt text for this image:</strong></p>
          <div class="accessibility-alt-options">
            ${suggestions.map((suggestion, index) => `
              <div class="accessibility-alt-option" data-index="${index}">
                <input type="radio" name="alt-choice" id="alt-${index}" value="${suggestion.text}">
                <label for="alt-${index}">
                  <div class="accessibility-alt-text">"${suggestion.text}"</div>
                  <div class="accessibility-alt-meta">
                    ${suggestion.type} • ${suggestion.length} chars • ${Math.round(suggestion.confidence * 100)}% confidence
                  </div>
                </label>
              </div>
            `).join('')}
            <div class="accessibility-alt-option">
              <input type="radio" name="alt-choice" id="alt-custom" value="">
              <label for="alt-custom">
                <div class="accessibility-alt-text">Custom alt text:</div>
                <input type="text" class="accessibility-custom-alt" placeholder="Enter your own description...">
              </label>
            </div>
          </div>
        </div>
        <div class="accessibility-modal-footer">
          <button class="accessibility-btn-secondary" id="cancel-alt">Cancel</button>
          <button class="accessibility-btn-primary" id="apply-alt">Apply Alt Text</button>
        </div>
      </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    document.body.appendChild(modal);
    
    // Handle modal interactions
    this.setupModalHandlers(modal, img, indicator);
  }

  showValidationModal(img, currentAlt, validationResult, indicator) {
    // Create modal for alt text validation results
    const modal = document.createElement('div');
    modal.className = 'accessibility-validation-modal';
    
    const qualityScore = Math.round(validationResult.quality_score * 100);
    const scoreColor = qualityScore >= 80 ? '#28a745' : qualityScore >= 60 ? '#ffc107' : '#dc3545';
    
    modal.innerHTML = `
      <div class="accessibility-modal-content">
        <div class="accessibility-modal-header">
          <h3>📊 Alt Text Quality Analysis</h3>
          <button class="accessibility-modal-close">&times;</button>
        </div>
        <div class="accessibility-modal-body">
          <div class="accessibility-current-alt">
            <strong>Current Alt Text:</strong> "${currentAlt}"
          </div>
          <div class="accessibility-quality-score" style="color: ${scoreColor}">
            <strong>Quality Score: ${qualityScore}/100</strong>
          </div>
          
          ${validationResult.issues.length > 0 ? `
            <div class="accessibility-issues">
              <h4>⚠️ Issues Found:</h4>
              <ul>
                ${validationResult.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${validationResult.suggestions.length > 0 ? `
            <div class="accessibility-suggestions">
              <h4>💡 Suggestions:</h4>
              <ul>
                ${validationResult.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <div class="accessibility-modal-footer">
          <button class="accessibility-btn-secondary" id="close-validation">Close</button>
          <button class="accessibility-btn-primary" id="improve-alt">Generate Better Options</button>
        </div>
      </div>
    `;
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    document.body.appendChild(modal);
    
    // Handle validation modal interactions
    modal.querySelector('#close-validation').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('#improve-alt').addEventListener('click', () => {
      modal.remove();
      this.handleAltTextGeneration(img, indicator);
    });
    
    modal.querySelector('.accessibility-modal-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  showFallbackModal(img, indicator) {
    // Simple fallback modal for manual alt text entry
    const modal = document.createElement('div');
    modal.className = 'accessibility-fallback-modal';
    modal.innerHTML = `
      <div class="accessibility-modal-content">
        <div class="accessibility-modal-header">
          <h3>✏️ Add Alt Text Manually</h3>
          <button class="accessibility-modal-close">&times;</button>
        </div>
        <div class="accessibility-modal-body">
          <p>AI generation failed. Please enter alt text manually:</p>
          <textarea class="accessibility-manual-alt" placeholder="Describe what you see in this image..." rows="3"></textarea>
          <div class="accessibility-alt-tips">
            <strong>Tips:</strong>
            <ul>
              <li>Be concise but descriptive</li>
              <li>Focus on important visual information</li>
              <li>Consider the image's purpose on the page</li>
            </ul>
          </div>
        </div>
        <div class="accessibility-modal-footer">
          <button class="accessibility-btn-secondary" id="cancel-manual">Cancel</button>
          <button class="accessibility-btn-primary" id="apply-manual">Apply Alt Text</button>
        </div>
      </div>
    `;
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    document.body.appendChild(modal);
    
    // Handle manual entry
    const textarea = modal.querySelector('.accessibility-manual-alt');
    modal.querySelector('#apply-manual').addEventListener('click', () => {
      const altText = textarea.value.trim();
      if (altText) {
        this.applyAltText(img, altText, indicator);
        modal.remove();
      }
    });
    
    modal.querySelector('#cancel-manual').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('.accessibility-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    // Focus textarea
    textarea.focus();
  }

  setupModalHandlers(modal, img, indicator) {
    // Handle alt text selection and application
    modal.querySelector('#apply-alt').addEventListener('click', () => {
      const selectedRadio = modal.querySelector('input[name="alt-choice"]:checked');
      if (selectedRadio) {
        let altText = selectedRadio.value;
        
        // If custom option selected, get text from input
        if (selectedRadio.id === 'alt-custom') {
          altText = modal.querySelector('.accessibility-custom-alt').value.trim();
        }
        
        if (altText) {
          this.applyAltText(img, altText, indicator);
          modal.remove();
        }
      }
    });
    
    modal.querySelector('#cancel-alt').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('.accessibility-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    // Handle custom input radio selection
    modal.querySelector('.accessibility-custom-alt').addEventListener('focus', () => {
      modal.querySelector('#alt-custom').checked = true;
    });
  }

  applyAltText(img, altText, indicator) {
    // Apply the selected alt text to the image
    img.setAttribute('alt', altText);
    
    // Update indicator to show success
    indicator.className = 'accessibility-alt-indicator accessibility-alt-applied';
    indicator.textContent = `✅ Applied: ${altText.substring(0, 30)}${altText.length > 30 ? '...' : ''}`;
    indicator.title = `Alt text applied: "${altText}"`;
    
    // Show success feedback
    this.showSuccessFeedback(indicator);
    
    // Log the change for potential undo functionality
    console.log('Alt text applied:', { element: img, altText: altText });
  }

  showSuccessFeedback(indicator) {
    // Brief success animation
    const originalBg = indicator.style.backgroundColor;
    indicator.style.backgroundColor = '#28a745';
    indicator.style.color = 'white';
    
    setTimeout(() => {
      indicator.style.backgroundColor = originalBg;
      indicator.style.color = '';
    }, 2000);
  }

  isPlaceholderAlt(alt) {
    // Check if alt text is a placeholder or generic
    const placeholders = [
      'image', 'photo', 'picture', 'img', 'graphic',
      'untitled', 'dsc', 'img_', 'photo_', 'image_'
    ];
    
    const lowerAlt = alt.toLowerCase().trim();
    return placeholders.some(placeholder => 
      lowerAlt === placeholder || lowerAlt.startsWith(placeholder)
    );
  }

  async simulateMCPCall(toolName, args) {
    // Simulate MCP server response for development/testing
    // In production, this would go through Kiro's actual MCP integration
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    if (toolName === 'generate_alt_text') {
      return {
        success: true,
        alt_suggestions: [
          {
            type: 'brief',
            text: 'Product image showing key features',
            length: 35,
            confidence: 0.85
          },
          {
            type: 'moderate',
            text: 'Detailed product photo highlighting main functionality and design elements',
            length: 73,
            confidence: 0.92
          },
          {
            type: 'detailed',
            text: 'High-resolution product photograph showcasing the item\'s key features, design aesthetics, and functional components in professional lighting',
            length: 142,
            confidence: 0.88
          }
        ],
        accessibility_analysis: {
          is_decorative: false,
          contains_text: false,
          complexity_level: 'moderate'
        }
      };
    }
    
    if (toolName === 'validate_alt_text_quality') {
      const altText = args.alt_text;
      return {
        alt_text: altText,
        length: altText.length,
        quality_score: Math.min(1.0, altText.length / 50),
        issues: altText.length < 10 ? ['Alt text too brief'] : [],
        suggestions: altText.length < 10 ? ['Provide more descriptive detail'] : ['Consider adding context about the image\'s purpose']
      };
    }
    
    return { success: false, error: 'Unknown tool' };
  }

  clearIndicators() {
    this.indicators.forEach(indicator => indicator.remove());
    this.indicators = [];
  }
}