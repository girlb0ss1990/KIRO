# Universal Accessibility Toolkit - Chrome Extension

A comprehensive Chrome extension that combines multiple accessibility tools to help users with visual, cognitive, and motor accessibility needs.

## Features

### 🎨 Visual Accessibility
- **Color Contrast Checker**: Real-time WCAG contrast ratio checking on hover
- **High Contrast Mode**: Inverts page colors for better visibility
- **Color Blindness Filters**: Protanopia, Deuteranopia, and Tritanopia simulation filters
- **Focus Order Checker**: Shows keyboard navigation order with numbered indicators
- **Alt Text Inspector**: Displays alt text for all images, highlights missing alt text

### 🧠 Cognitive Accessibility
- **Reading Mode**: Removes distractions and presents clean, readable content
- **Text-to-Speech**: Reads selected text aloud with highlighting
- **BeeLine Reader**: Applies color gradients to guide eye movement across lines
- **Dyslexia-Friendly Fonts**: OpenDyslexic, Comic Sans MS, and Verdana options

### ⌨️ Motor Accessibility
- **Caret Browsing**: Navigate pages using arrow keys like a text document
- **Target Size Checker**: Identifies interactive elements smaller than WCAG recommendations (44x44px)

## Installation

### From Source (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

### Usage
1. Click the extension icon in your Chrome toolbar
2. Toggle individual features on/off using the switches
3. Use the color blindness filter buttons for temporary filters
4. Select dyslexia-friendly fonts from the dropdown
5. Features will remain active until manually disabled

## Technical Details

### Files Structure
- `manifest.json` - Extension configuration and permissions
- `popup.html/js` - Extension popup interface
- `content.js/css` - Main accessibility features implementation
- `background.js` - Background service worker

### Permissions Required
- `activeTab` - Access current tab content
- `storage` - Save user preferences
- `scripting` - Inject accessibility features
- `tts` - Text-to-speech functionality

## Development

### Adding New Features
1. Create a new feature class in `content.js`
2. Add the feature to the `AccessibilityToolkit.initializeFeatures()` method
3. Add UI controls in `popup.html`
4. Add corresponding styles in `content.css`

### Testing
- Test on various websites with different layouts
- Verify WCAG compliance for contrast ratios
- Test keyboard navigation and screen reader compatibility
- Validate color blindness filters with simulation tools

## Browser Compatibility
- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
MIT License - see LICENSE file for details

## Accessibility Standards
This extension aims to support:
- WCAG 2.1 AA compliance
- Section 508 standards
- ADA accessibility requirements