#!/usr/bin/env python3
"""
Descriptive Alt Text Generation MCP Server
Specialized Computer Vision server for generating accessibility-focused alt text
"""

import asyncio
import base64
import json
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import httpx
from mcp.server import Server
import mcp.server.stdio
import mcp.types as types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alt-text-generator")

class AltTextGenerator:
    """Computer Vision-powered alt text generation service"""
    
    def __init__(self):
        self.openai_api_key = None
        self.max_image_size = 2048
        self.supported_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
        
    async def analyze_image(self, image_data: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze image and generate descriptive alt text options
        
        Args:
            image_data: Base64 encoded image or image URL
            context: Additional context (page title, surrounding text, etc.)
            
        Returns:
            Dictionary with alt text suggestions and analysis
        """
        try:
            # Determine if input is URL or base64 data
            if image_data.startswith('http'):
                image_input = await self._process_image_url(image_data)
            else:
                image_input = await self._process_base64_image(image_data)
                
            if not image_input:
                return self._create_error_response("Invalid image format or size")
                
            # Generate alt text using OpenAI Vision API
            alt_suggestions = await self._generate_alt_text_options(image_input, context)
            
            # Analyze image for accessibility relevance
            accessibility_analysis = await self._analyze_accessibility_context(image_input, context)
            
            return {
                "success": True,
                "alt_suggestions": alt_suggestions,
                "accessibility_analysis": accessibility_analysis,
                "context_used": context
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return self._create_error_response(f"Analysis failed: {str(e)}")
    
    async def _process_image_url(self, url: str) -> Optional[str]:
        """Download and validate image from URL"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                if not any(fmt in content_type for fmt in self.supported_formats):
                    return None
                    
                # Check file size (limit to prevent abuse)
                if len(response.content) > 5 * 1024 * 1024:  # 5MB limit
                    return None
                    
                return base64.b64encode(response.content).decode('utf-8')
                
        except Exception as e:
            logger.error(f"Error processing image URL: {str(e)}")
            return None
    
    async def _process_base64_image(self, base64_data: str) -> Optional[str]:
        """Validate and process base64 image data"""
        try:
            # Remove data URL prefix if present
            if base64_data.startswith('data:'):
                base64_data = base64_data.split(',')[1]
                
            # Validate base64 format
            image_bytes = base64.b64decode(base64_data)
            
            # Check size limit
            if len(image_bytes) > 5 * 1024 * 1024:  # 5MB limit
                return None
                
            return base64_data
            
        except Exception as e:
            logger.error(f"Error processing base64 image: {str(e)}")
            return None
    
    async def _generate_alt_text_options(self, image_data: str, context: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate multiple alt text options using OpenAI Vision API"""
        
        # Build context-aware prompt
        context_prompt = self._build_context_prompt(context)
        
        system_prompt = """You are an accessibility expert specializing in creating descriptive alt text for images. 
        Generate 3-5 different alt text options that are:
        1. Descriptive and specific
        2. Concise but informative (under 125 characters when possible)
        3. Focused on the image's purpose and context
        4. Accessible to screen reader users
        5. Varied in detail level (brief, moderate, detailed)
        
        Consider the page context provided and prioritize information that would be most valuable to someone who cannot see the image."""
        
        try:
            # Simulate OpenAI Vision API call (replace with actual API integration)
            # For demo purposes, generating contextual suggestions
            suggestions = [
                {
                    "type": "brief",
                    "text": "Descriptive image relevant to page content",
                    "length": 42,
                    "confidence": 0.85
                },
                {
                    "type": "moderate", 
                    "text": "Detailed description based on visual analysis and page context",
                    "length": 68,
                    "confidence": 0.90
                },
                {
                    "type": "detailed",
                    "text": "Comprehensive description including key visual elements, colors, composition, and contextual relevance to surrounding content",
                    "length": 134,
                    "confidence": 0.88
                }
            ]
            
            # In production, this would make actual API calls:
            # response = await self._call_openai_vision_api(image_data, system_prompt + context_prompt)
            # suggestions = self._parse_openai_response(response)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating alt text: {str(e)}")
            return [{"type": "fallback", "text": "Image description unavailable", "length": 32, "confidence": 0.5}]
    
    def _build_context_prompt(self, context: Dict[str, Any]) -> str:
        """Build context-aware prompt from page information"""
        prompt_parts = []
        
        if context.get('page_title'):
            prompt_parts.append(f"Page title: {context['page_title']}")
            
        if context.get('surrounding_text'):
            prompt_parts.append(f"Surrounding text: {context['surrounding_text'][:200]}...")
            
        if context.get('image_filename'):
            prompt_parts.append(f"Image filename: {context['image_filename']}")
            
        if context.get('page_topic'):
            prompt_parts.append(f"Page topic: {context['page_topic']}")
            
        return "\n".join(prompt_parts) if prompt_parts else "No additional context available."
    
    async def _analyze_accessibility_context(self, image_data: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze image for accessibility-specific insights"""
        return {
            "is_decorative": False,  # Would use CV to determine
            "contains_text": False,  # OCR analysis
            "complexity_level": "moderate",  # Visual complexity assessment
            "recommended_approach": "descriptive",  # Based on content analysis
            "wcag_considerations": [
                "Ensure description conveys essential information",
                "Consider if image contains important text that should be transcribed",
                "Evaluate if image is purely decorative"
            ]
        }
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            "success": False,
            "error": error_message,
            "alt_suggestions": [
                {
                    "type": "fallback",
                    "text": "Image description unavailable - please add manual alt text",
                    "length": 58,
                    "confidence": 0.0
                }
            ]
        }

# Initialize the MCP server
server = Server("alt-text-generator")
alt_text_service = AltTextGenerator()

@server.list_tools()
async def handle_list_tools() -> List[types.Tool]:
    """List available tools for alt text generation"""
    return [
        types.Tool(
            name="generate_alt_text",
            description="Generate descriptive alt text options for images using Computer Vision",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_data": {
                        "type": "string",
                        "description": "Base64 encoded image data or image URL"
                    },
                    "context": {
                        "type": "object",
                        "description": "Page context information",
                        "properties": {
                            "page_title": {"type": "string"},
                            "surrounding_text": {"type": "string"},
                            "image_filename": {"type": "string"},
                            "page_topic": {"type": "string"},
                            "element_role": {"type": "string"}
                        }
                    }
                },
                "required": ["image_data"]
            }
        ),
        types.Tool(
            name="analyze_image_context",
            description="Analyze image for accessibility context and recommendations",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_data": {"type": "string"},
                    "current_alt": {"type": "string", "description": "Existing alt text if any"},
                    "context": {"type": "object"}
                },
                "required": ["image_data"]
            }
        ),
        types.Tool(
            name="validate_alt_text_quality",
            description="Validate and score existing alt text quality",
            inputSchema={
                "type": "object",
                "properties": {
                    "alt_text": {"type": "string"},
                    "image_data": {"type": "string"},
                    "context": {"type": "object"}
                },
                "required": ["alt_text", "image_data"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
    """Handle tool calls for alt text generation"""
    
    if name == "generate_alt_text":
        image_data = arguments.get("image_data", "")
        context = arguments.get("context", {})
        
        result = await alt_text_service.analyze_image(image_data, context)
        
        return [
            types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )
        ]
    
    elif name == "analyze_image_context":
        image_data = arguments.get("image_data", "")
        current_alt = arguments.get("current_alt", "")
        context = arguments.get("context", {})
        
        # Analyze image and provide accessibility recommendations
        analysis = await alt_text_service._analyze_accessibility_context(image_data, context)
        analysis["current_alt_evaluation"] = {
            "text": current_alt,
            "length": len(current_alt) if current_alt else 0,
            "quality_score": 0.5 if current_alt else 0.0,
            "recommendations": [
                "Consider more descriptive language" if current_alt else "Add descriptive alt text",
                "Ensure essential information is conveyed",
                "Keep under 125 characters when possible"
            ]
        }
        
        return [
            types.TextContent(
                type="text", 
                text=json.dumps(analysis, indent=2)
            )
        ]
    
    elif name == "validate_alt_text_quality":
        alt_text = arguments.get("alt_text", "")
        image_data = arguments.get("image_data", "")
        context = arguments.get("context", {})
        
        # Score alt text quality
        quality_analysis = {
            "alt_text": alt_text,
            "length": len(alt_text),
            "quality_score": min(1.0, len(alt_text) / 50) if alt_text else 0.0,
            "issues": [],
            "suggestions": []
        }
        
        # Basic quality checks
        if not alt_text:
            quality_analysis["issues"].append("Missing alt text")
            quality_analysis["suggestions"].append("Add descriptive alt text")
        elif len(alt_text) < 10:
            quality_analysis["issues"].append("Alt text too brief")
            quality_analysis["suggestions"].append("Provide more descriptive detail")
        elif len(alt_text) > 125:
            quality_analysis["issues"].append("Alt text may be too long")
            quality_analysis["suggestions"].append("Consider condensing to essential information")
            
        return [
            types.TextContent(
                type="text",
                text=json.dumps(quality_analysis, indent=2)
            )
        ]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    """Run the MCP server"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    asyncio.run(main())