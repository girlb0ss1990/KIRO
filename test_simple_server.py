#!/usr/bin/env python3
"""
Test the simple MCP server
"""

import asyncio
import json
import subprocess
import sys

async def test_simple_server():
    """Test the simple MCP server"""
    
    messages = [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test", "version": "1.0.0"}
            }
        },
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        },
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "generate_alt_text",
                "arguments": {
                    "image_data": "https://example.com/product.jpg",
                    "context": {
                        "page_title": "Smartphone Product Page",
                        "page_topic": "ecommerce"
                    }
                }
            }
        }
    ]
    
    try:
        process = subprocess.Popen(
            [sys.executable, "mcp-servers/alt-text-generator/simple_server.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        input_data = "\n".join(json.dumps(msg) for msg in messages) + "\n"
        stdout, stderr = process.communicate(input=input_data, timeout=5)
        
        print("=== Simple Server Test ===")
        print(f"Return code: {process.returncode}")
        
        if stdout:
            print("Responses:")
            for line in stdout.strip().split('\n'):
                if line.strip():
                    try:
                        response = json.loads(line)
                        print(json.dumps(response, indent=2))
                        print("---")
                    except json.JSONDecodeError:
                        print(f"Non-JSON: {line}")
        
        if stderr:
            print(f"STDERR: {stderr}")
            
        return process.returncode == 0
        
    except Exception as e:
        print(f"Test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_simple_server())
    print("✅ Success!" if success else "❌ Failed!")