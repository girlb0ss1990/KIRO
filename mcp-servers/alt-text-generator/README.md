# Alt Text CV Server - MCP Server

A specialized Model Context Protocol (MCP) server that provides AI-powered descriptive alt text generation for accessibility compliance. This server integrates Computer Vision capabilities to analyze images and generate multiple high-quality alt text options.

## Features

- **Multi-Option Generation**: Provides 3-5 alt text suggestions with varying detail levels
- **Context-Aware Analysis**: Uses page context (title, surrounding text) for better descriptions
- **Accessibility Focus**: Optimized for screen reader users and WCAG compliance
- **Quality Validation**: Scores and validates existing alt text quality
- **Format Support**: Handles URLs and base64 image data
- **Size Limits**: Built-in protection against large file abuse

## Tools Provided

### `generate_alt_text`
Generates multiple descriptive alt text options for images.

**Parameters:**
- `image_data` (required): Base64 encoded image or image URL
- `context` (optional): Page context information
  - `page_title`: Current page title
  - `surrounding_text`: Text near the image
  - `image_filename`: Original filename
  - `page_topic`: General page topic
  - `element_role`: Image's role in the page

**Returns:**
```json
{
  "success": true,
  "alt_suggestions": [
    {
      "type": "brief",
      "text": "Concise description",
      "length": 25,
      "confidence": 0.85
    },
    {
      "type": "moderate",
      "text": "More detailed description with context",
      "length": 45,
      "confidence": 0.90
    }
  ],
  "accessibility_analysis": {
    "is_decorative": false,
    "contains_text": true,
    "complexity_level": "moderate"
  }
}
```

### `analyze_image_context`
Analyzes images for accessibility context and provides recommendations.

**Parameters:**
- `image_data` (required): Image to analyze
- `current_alt` (optional): Existing alt text
- `context` (optional): Page context

### `validate_alt_text_quality`
Validates and scores existing alt text quality.

**Parameters:**
- `alt_text` (required): Alt text to validate
- `image_data` (required): Associated image
- `context` (optional): Page context

## Integration with Triple-Threat Audit Orchestrator

This MCP server integrates seamlessly with your accessibility extension:

1. **Detection**: Your `AltTextInspector` detects missing/poor alt text
2. **Context Capture**: Extension captures image data and page context
3. **AI Analysis**: MCP server generates quality alt text options
4. **User Selection**: Kiro presents options in remediation modal
5. **Implementation**: User selects and applies the best option

## Installation

### Via uvx (Recommended)
```bash
uvx alt-text-cv-server@latest
```

### From Source
```bash
git clone <repository-url>
cd alt-text-cv-server
pip install -e .
```

## Configuration

Add to your MCP configuration (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "alt-text-generator": {
      "command": "uvx",
      "args": ["alt-text-cv-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "INFO",
        "CV_MODEL_PROVIDER": "openai",
        "MAX_IMAGE_SIZE": "2048"
      },
      "disabled": false,
      "autoApprove": [
        "generate_alt_text",
        "analyze_image_context", 
        "validate_alt_text_quality"
      ]
    }
  }
}
```

## Environment Variables

- `CV_MODEL_PROVIDER`: AI provider (default: "openai")
- `OPENAI_API_KEY`: OpenAI API key for vision analysis
- `MAX_IMAGE_SIZE`: Maximum image dimension in pixels
- `FASTMCP_LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Usage Examples

### Basic Alt Text Generation
```python
# Via MCP client
result = await mcp_client.call_tool(
    "generate_alt_text",
    {
        "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
        "context": {
            "page_title": "Product Catalog",
            "surrounding_text": "Our latest smartphone features..."
        }
    }
)
```

### Quality Validation
```python
# Validate existing alt text
validation = await mcp_client.call_tool(
    "validate_alt_text_quality",
    {
        "alt_text": "phone",
        "image_data": "https://example.com/phone.jpg"
    }
)
```

## Development

### Setup Development Environment
```bash
git clone <repository-url>
cd alt-text-cv-server
pip install -e ".[dev]"
```

### Run Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black .
mypy .
```

## Security Considerations

- **Image Size Limits**: 5MB maximum to prevent abuse
- **Format Validation**: Only supports common web image formats
- **No External Storage**: Images are processed in memory only
- **Rate Limiting**: Built-in protection against excessive requests
- **API Key Security**: Secure handling of AI provider credentials

## Performance

- **Response Time**: < 3 seconds for typical images
- **Concurrent Requests**: Supports multiple simultaneous analyses
- **Memory Usage**: Efficient processing with automatic cleanup
- **Caching**: Optional result caching for repeated requests

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/your-org/alt-text-cv-server/issues)
- Documentation: [Full Documentation](https://docs.example.com/alt-text-cv-server)
- Community: [Accessibility Discord](https://discord.gg/accessibility)