#!/usr/bin/env python3
"""
Simple Alt Text Generation MCP Server
"""

import asyncio
import json
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alt-text-generator")

class SimpleAltTextServer:
    """Simple MCP server for alt text generation"""
    
    def __init__(self):
        self.tools = [
            {
                "name": "generate_alt_text",
                "description": "Generate descriptive alt text options for images",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "image_data": {"type": "string", "description": "Image URL or base64 data"},
                        "context": {"type": "object", "description": "Page context"}
                    },
                    "required": ["image_data"]
                }
            }
        ]
    
    async def handle_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming MCP messages"""
        method = message.get("method")
        msg_id = message.get("id")
        
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False}
                    },
                    "serverInfo": {
                        "name": "alt-text-generator",
                        "version": "1.0.0"
                    }
                }
            }
        
        elif method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"tools": self.tools}
            }
        
        elif method == "tools/call":
            params = message.get("params", {})
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            if tool_name == "generate_alt_text":
                result = await self.generate_alt_text(arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(result, indent=2)
                            }
                        ]
                    }
                }
        
        # Default error response
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {
                "code": -32601,
                "message": f"Method not found: {method}"
            }
        }
    
    async def generate_alt_text(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Generate alt text suggestions"""
        image_data = arguments.get("image_data", "")
        context = arguments.get("context", {})
        
        # Simulate AI-generated alt text based on context
        page_title = context.get("page_title", "")
        page_topic = context.get("page_topic", "general")
        
        # Generate contextual suggestions
        suggestions = []
        
        if "product" in page_title.lower() or page_topic == "ecommerce":
            suggestions = [
                {
                    "type": "brief",
                    "text": "Product image showing key features",
                    "length": 35,
                    "confidence": 0.85
                },
                {
                    "type": "moderate",
                    "text": "Detailed product photo highlighting main functionality and design",
                    "length": 65,
                    "confidence": 0.90
                },
                {
                    "type": "detailed",
                    "text": "High-quality product photograph showcasing design, features, and build quality in professional lighting setup",
                    "length": 115,
                    "confidence": 0.88
                }
            ]
        else:
            suggestions = [
                {
                    "type": "brief",
                    "text": "Descriptive image relevant to page content",
                    "length": 42,
                    "confidence": 0.80
                },
                {
                    "type": "moderate",
                    "text": "Detailed visual content supporting the main page topic and user context",
                    "length": 75,
                    "confidence": 0.85
                },
                {
                    "type": "detailed",
                    "text": "Comprehensive visual description including key elements, composition, and contextual relevance to surrounding content",
                    "length": 125,
                    "confidence": 0.82
                }
            ]
        
        return {
            "success": True,
            "alt_suggestions": suggestions,
            "accessibility_analysis": {
                "is_decorative": False,
                "contains_text": False,
                "complexity_level": "moderate",
                "recommended_approach": "descriptive"
            },
            "context_used": context
        }

async def main():
    """Run the simple MCP server"""
    server = SimpleAltTextServer()
    
    try:
        while True:
            # Read message from stdin
            line = await asyncio.get_event_loop().run_in_executor(None, input)
            if not line.strip():
                continue
                
            try:
                message = json.loads(line)
                response = await server.handle_message(message)
                print(json.dumps(response))
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON: {e}")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
                
    except EOFError:
        # Client disconnected
        pass
    except KeyboardInterrupt:
        # Server shutdown
        pass

if __name__ == "__main__":
    asyncio.run(main())