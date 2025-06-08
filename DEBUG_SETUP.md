# Debug Configuration Setup

This project includes debug configurations for both JetBrains IDEs (IntelliJ IDEA, WebStorm) and Visual Studio Code.

## Prerequisites

1. **Set your OpenAI API key** in your system environment variables:
   - Windows: System Properties → Environment Variables → Add `OPENAI_API_KEY`
   - Or set temporarily in PowerShell: `$env:OPENAI_API_KEY="sk-..."`

2. **Build the project** before debugging:
   ```bash
   npm run build
   ```

## Debug Options

### Enable Raw OpenAI Response Logging

To see the raw responses from OpenAI (helpful for debugging format issues):

```powershell
# PowerShell
$env:DEBUG_OPENAI_RESPONSES="true"
$env:OPENAI_API_KEY="your-key"
npm run demo
```

## JetBrains IDE (IntelliJ IDEA / WebStorm)

### Using the Pre-configured Debug Configuration

1. Open the project in your JetBrains IDE
2. In the top toolbar, you'll see a dropdown with "Debug Agent Demo"
3. Click the debug button (green bug icon) next to it

### Manual Configuration (if needed)

1. Go to Run → Edit Configurations
2. The "Debug Agent Demo" configuration should already be there
3. If you need to modify it:
   - **Node interpreter**: Your Node.js installation
   - **JavaScript file**: `dist/core/run-agent-demo.js`
   - **Environment variables**: `OPENAI_API_KEY=your-api-key-here`
   - **Before launch**: Build TypeScript

## Visual Studio Code

### Using the Debug Configuration

1. Open the project in VS Code
2. Go to the Debug view (Ctrl+Shift+D or Cmd+Shift+D)
3. Select "Debug Agent Demo" from the dropdown
4. Press F5 or click the green play button

### Setting Breakpoints

1. Open any TypeScript file in the `src` directory
2. Click in the gutter (left of line numbers) to set breakpoints
3. The debugger will stop at these breakpoints when running

### Features

- **Source Maps**: Debug directly in TypeScript files
- **Auto-rebuild**: Automatically builds before debugging
- **Environment Variables**: Reads OPENAI_API_KEY from your system
- **Console Output**: Shows in integrated terminal

## Debugging Tips

1. **Set breakpoints in key locations**:
   - `src/core/agent-demo.ts` - `openAILLMInterface` function
   - `src/adapters/openai-adapter.ts` - `generateCompletion` method
   - `src/core/agent.ts` - `processQuery` method

2. **Watch variables**:
   - `request` - to see what's being sent to OpenAI
   - `response` - to see OpenAI's response
   - `content` - to see the structured reasoning

3. **Step through execution**:
   - F10 (Step Over) - Execute current line
   - F11 (Step Into) - Go into function calls
   - Shift+F11 (Step Out) - Exit current function

## Troubleshooting

### "Cannot find module" errors
- Make sure to run `npm run build` before debugging
- Check that TypeScript compilation succeeded

### "OPENAI_API_KEY not set" error
- Ensure the environment variable is set in your system
- Restart your IDE after setting environment variables

### Breakpoints not working
- Verify source maps are enabled in `tsconfig.json`
- Check that you're setting breakpoints in `.ts` files, not `.js`
- Try rebuilding the project

### API errors (401, 429)
- 401: Check your API key is valid
- 429: You've hit rate limits, wait a moment
