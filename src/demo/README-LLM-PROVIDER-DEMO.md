# LLM Provider Demonstration

This interactive CLI demonstration showcases the LLM-CMP system's integration with OpenAI and Anthropic providers.

## Two Demo Versions

### 1. Simplified Demo (Recommended for Testing Providers)
```bash
npm run demo:providers-simple
```
- Focuses on LLM provider integration
- Shows parallel processing with OpenAI and Anthropic
- Demonstrates multi-agent responses without full orchestration
- Best for testing API connections and provider comparison

### 2. Full System Demo
```bash
npm run demo:providers
```
- Complete orchestration flow with HTM and Bayesian components
- Requires all system components to be fully implemented
- Shows consensus building and advanced metrics
- Currently requires additional setup for agent internals

## Features

- **Real API Integration**: Uses actual OpenAI (GPT-4) and Anthropic (Claude 3) APIs
- **Full Orchestration Flow**: Demonstrates the complete system pipeline
- **Multiple Consensus Methods**: Shows Bayesian aggregation, weighted voting, and other consensus approaches
- **Agent Specialization**: See how different agents (analytical, creative, critical) work together
- **Performance Metrics**: Real-time token usage, costs, and latency tracking
- **Interactive CLI**: User-friendly interface with colored output

## Prerequisites

1. **API Keys**: You'll need valid API keys for both:
   - OpenAI API key (for GPT-4 access)
   - Anthropic API key (for Claude 3 access)

2. **Node.js**: Version 18 or higher

3. **Build the Project**: 
   ```bash
   npm run build
   ```

## Running the Demo

### Method 1: Direct Execution
```bash
node dist/demo/llm-provider-demo.js
```

### Method 2: Using NPM Script
First, add this to your package.json scripts:
```json
"demo:providers": "tsc && node dist/demo/llm-provider-demo.js"
```

Then run:
```bash
npm run demo:providers
```

### Method 3: With Environment Variables
```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
node dist/demo/llm-provider-demo.js
```

## Demo Flow

1. **API Key Configuration**
   - Enter your OpenAI and Anthropic API keys
   - Keys can also be loaded from environment variables

2. **System Initialization**
   - Initializes OpenAI adapter (GPT-4 Turbo)
   - Initializes Anthropic adapter (Claude 3 Opus)
   - Sets up the orchestrator with agent templates

3. **Query Selection**
   - Choose from pre-defined queries:
     - Analytical: Quantum computing impact analysis
     - Creative: Future sustainable city design
     - Complex: Universal basic income analysis
     - Custom: Enter your own query

4. **Processing Visualization**
   - Real-time display of agent processing
   - Shows which provider each agent uses
   - Displays token usage and costs per agent

5. **Results & Analysis**
   - Consensus result with confidence scores
   - Agent contribution breakdown
   - Performance metrics (time, tokens, cost)
   - Reasoning chain summary
   - Optional detailed view

## Example Output

```
═══ Consensus Result ═══

Based on the collective analysis of quantum computing's impact on encryption...
[Full consensus response]

Confidence: 87.3% [0.82 - 0.91] (bayesian)

Consensus Method: bayesian_aggregation
Participants: 5 agents

Agent Contributions:
• Agent 1a2b3c4d (logical_analysis): 28.5% contribution
• Agent 2b3c4d5e (creative_synthesis): 19.2% contribution
• Agent 3c4d5e6f (critical_evaluation): 24.8% contribution
• Agent 4d5e6f7g (logical_analysis): 15.9% contribution
• Agent 5e6f7g8h (creative_synthesis): 11.6% contribution

═══ Performance Metrics ═══
• Total Time: 4523ms
• Agent Count: 5
• Token Usage: 3847
• HTM Utilization: 67.3%
• Bayesian Updates: 15

Estimated Cost: $0.0231
```

## Query Examples

### Analytical Queries
- "Analyze the potential impacts of quantum computing on current encryption methods"
- "Evaluate the effectiveness of different COVID-19 vaccine distribution strategies"
- "Compare the environmental impacts of electric vs hydrogen fuel cell vehicles"

### Creative Queries
- "Design a sustainable city of the future that addresses climate change"
- "Propose innovative solutions for reducing ocean plastic pollution"
- "Create a new educational system for the age of AI"

### Complex Multi-faceted Queries
- "Compare the economic, social, and technological implications of universal basic income"
- "Analyze how artificial general intelligence might transform healthcare, education, and governance"
- "Evaluate the feasibility and implications of colonizing Mars in the next 50 years"

## Cost Considerations

The demo uses real API calls which incur costs:
- **OpenAI GPT-4 Turbo**: ~$0.01 per 1K input tokens, $0.03 per 1K output tokens
- **Anthropic Claude 3 Opus**: ~$15 per 1M input tokens, $75 per 1M output tokens

Typical demo run costs: $0.01 - $0.05 depending on query complexity

## Troubleshooting

### "API key invalid" Error
- Ensure your API keys are correct and have appropriate permissions
- OpenAI keys should have GPT-4 access
- Anthropic keys should have Claude 3 access

### Timeout Errors
- Complex queries may take 30-60 seconds
- Ensure stable internet connection
- Consider using simpler queries for testing

### High Costs
- Monitor token usage in the output
- Use shorter, more focused queries
- Consider using GPT-3.5 and Claude 3 Haiku for testing (modify the code)

## Architecture Notes

The demo showcases:
1. **Adapter Pattern**: Provider-agnostic interfaces to LLMs
2. **Orchestration**: Dynamic agent spawning and work distribution
3. **Consensus Building**: Multiple methods for aggregating agent outputs
4. **Cost Optimization**: Intelligent routing between providers
5. **Error Handling**: Retry logic and fallback mechanisms

## Extending the Demo

To add more providers:
1. Create a new adapter in `src/adapters/`
2. Add the provider configuration in the demo
3. Update the orchestrator configuration

To add more query types:
1. Add entries to the `DEMO_QUERIES` array
2. Consider different complexity levels
3. Test with various consensus methods

## Safety and Best Practices

- **API Key Security**: Never commit API keys to version control
- **Cost Monitoring**: Set spending limits on your API accounts
- **Rate Limiting**: The system respects provider rate limits
- **Error Handling**: Graceful degradation on API failures
