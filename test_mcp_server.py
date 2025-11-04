#!/usr/bin/env python3
"""
Simple test script for the MCP alt-text-generator server
"""

import asyncio
import json
import subprocess
import sys

async def test_mcp_server():
    """Test the MCP server by sending a simple request"""
    
    # Initialize message
    init_message = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        }
    }
    
    # List tools message
    list_tools_message = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    }
    
    # Test tool call
    test_call_message = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "generate_alt_text",
            "arguments": {
                "image_data": "https://example.com/test.jpg",
                "context": {
                    "page_title": "Test Page",
                    "page_topic": "testing"
                }
            }
        }
    }
    
    try:
        # Start the MCP server process
        process = subprocess.Popen(
            [sys.executable, "mcp-servers/alt-text-generator/server.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Send messages
        messages = [init_message, list_tools_message, test_call_message]
        input_data = "\n".join(json.dumps(msg) for msg in messages) + "\n"
        
        # Communicate with the server
        stdout, stderr = process.communicate(input=input_data, timeout=10)
        
        print("=== MCP Server Test Results ===")
        print(f"Return code: {process.returncode}")
        print(f"STDOUT:\n{stdout}")
        if stderr:
            print(f"STDERR:\n{stderr}")
            
        # Parse responses
        if stdout:
            lines = stdout.strip().split('\n')
            for i, line in enumerate(lines):
                if line.strip():
                    try:
                        response = json.loads(line)
                        print(f"\nResponse {i+1}:")
                        print(json.dumps(response, indent=2))
                    except json.JSONDecodeError:
                        print(f"Non-JSON line: {line}")
        
        return process.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("Server test timed out")
        process.kill()
        return False
    except Exception as e:
        print(f"Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_mcp_server())
    if success:
        print("\n✅ MCP Server test completed successfully!")
    else:
        print("\n❌ MCP Server test failed!")
        sys.exit(1)