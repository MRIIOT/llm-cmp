#!/bin/bash

echo "Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Starting MCP Integration Demo with debugger..."
echo ""
echo "Open your debugger and attach to localhost:9229"
echo ""
echo "In VS Code: Use 'Debug MCP Integration (Remote Attach)' configuration"
echo "In JetBrains: Use 'Debug MCP Integration (Breakpoints)' configuration"
echo ""
echo "Press any key to start the debugger..."
read -n 1 -s

node --inspect-brk=9229 --enable-source-maps dist/demo/mcp-integration-demo.js
