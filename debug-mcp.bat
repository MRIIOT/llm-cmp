@echo off
echo Building TypeScript...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Starting MCP Integration Demo with debugger...
echo.
echo Open your debugger and attach to localhost:9229
echo.
echo In VS Code: Use "Debug MCP Integration (Remote Attach)" configuration
echo In JetBrains: Use "Debug MCP Integration (Breakpoints)" configuration
echo.
echo Press any key to start the debugger...
pause > nul

node --inspect-brk=9229 --enable-source-maps dist/demo/mcp-integration-demo.js
