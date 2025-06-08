# Integrated LLM-CMP System Demonstration

This demonstration showcases the complete LLM-CMP (Large Language Model Cognitive Modeling Platform) system with all its advanced features working together.

## Features Demonstrated

### 1. Multi-Agent Collaboration
- **Analytical Agent**: Specializes in logical reasoning and data analysis
- **Creative Agent**: Focuses on creative solutions and novel approaches  
- **Critical Agent**: Evaluates and critiques proposed solutions
- **Temporal Agent**: Analyzes patterns across time using HTM capabilities
- **Integration Agent**: Synthesizes diverse perspectives into coherent solutions

### 2. HTM Neural Processing
- Hierarchical Temporal Memory for pattern recognition
- Online learning from sequential queries
- Anomaly detection and prediction
- Temporal context management across multiple time scales

### 3. Semantic Encoding
- LLM-powered semantic feature extraction
- Sparse distributed representations
- Concept normalization and relationship mapping
- Adaptive column assignment for optimal encoding

### 4. Consensus Mechanisms
- Simple majority voting
- Weighted voting based on confidence
- Bayesian aggregation with uncertainty
- Game-theoretic consensus for strategic alignment

### 5. Evidence-Based Reasoning
- Structured reasoning chains with typed steps
- Evidence gathering and corroboration
- Bayesian belief updates
- Uncertainty quantification (aleatoric & epistemic)

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to run the demo
2. **Environment Setup**: Create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

## Running the Demo

### Full Demonstration Mode
This runs through several pre-defined scenarios showcasing different capabilities:

```bash
npm run demo:integrated
```

The demo will:
1. Test the OpenAI connection
2. Demonstrate HTM learning with sequential queries
3. Run through 4 complex scenarios:
   - Multi-Modal Problem Solving
   - Scientific Hypothesis Testing
   - Creative Design Challenge
   - Temporal Pattern Analysis

### Interactive Mode
This allows you to interact with the system directly:

```bash
npm run demo:integrated-interactive
```

Commands in interactive mode:
- Type any question or task for the agents to process
- `help` - Show available commands
- `stats` - Display system performance statistics
- `reset` - Reset the system state
- `exit` - Quit the demo

## Demo Scenarios

### 1. Multi-Modal Problem Solving
**Query**: "Analyze the impact of emerging AI technologies on global employment patterns over the next decade."

This scenario demonstrates:
- Multiple agent types working together
- Integration of analytical, creative, and critical thinking
- Temporal pattern analysis for future predictions
- Consensus building from diverse perspectives

### 2. Scientific Hypothesis Testing
**Query**: "Evaluate the hypothesis that quantum computing will solve the protein folding problem within 5 years."

This scenario showcases:
- Critical evaluation of claims
- Evidence-based reasoning
- Temporal analysis of technological progress
- Uncertainty quantification in predictions

### 3. Creative Design Challenge
**Query**: "Design an innovative educational system that combines AI tutoring, gamification, and project-based learning."

This demonstrates:
- Creative problem solving
- Integration of multiple concepts
- Practical constraint consideration
- Synthesis of novel solutions

### 4. Temporal Pattern Analysis
**Query**: "Identify recurring patterns in technological adoption cycles and predict adoption for brain-computer interfaces."

This highlights:
- HTM pattern recognition capabilities
- Historical pattern analysis
- Future prediction based on learned patterns
- Multi-scale temporal reasoning

## Output Interpretation

### Agent Information
```
🤖 Agent: Analytical Agent_1234567890
   ID: agent_1234567890_abc123
   Capabilities:
     - Logical Analysis: logical_analysis, data_analysis, mathematical_reasoning
       Strength: 90%
```

### HTM Neural State
```
🧠 HTM Neural State:
   Active Columns: 204
   Predicted Columns: 189
   Anomaly Score: 12.3%
   Learning Enabled: true
```

### Consensus Building
```
🤝 Consensus Building:
   Method: bayesian_aggregation
   Confidence: 84.2%
   Participants: 5 agents
   Dissent: 1 alternative views
```

### Performance Metrics
```
⚡ Performance Metrics:
   Total Time: 3450ms
   Agent Count: 5
   HTM Utilization: 67.3%
   Bayesian Updates: 23
   Token Usage: ~2150 tokens
```

## Results Storage

All demonstration results are automatically saved to the `logs/` directory with timestamps:
- `logs/demo_Multi-Modal_Problem_Solving_2024-01-15T10-30-45-123Z.json`

Each log file contains:
- Complete scenario details
- Full orchestration results
- All agent contributions
- Consensus details
- Performance metrics
- Timestamps

## Customization

You can modify the demonstration by:

1. **Adding New Scenarios**: Edit `DEMO_SCENARIOS` in the source file
2. **Adjusting Agent Types**: Modify the agent templates in the orchestrator
3. **Changing Consensus Methods**: Update the consensus configuration
4. **Tuning HTM Parameters**: Adjust the HTM configuration for different learning behaviors

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your OpenAI API key is correctly set in `.env`
2. **Rate Limiting**: The demo includes delays between scenarios to avoid rate limits
3. **Memory Usage**: For long-running sessions, monitor memory usage
4. **Timeout Errors**: Increase `maxTime` in constraints for complex queries

### Performance Tips

- Use GPT-3.5-turbo for faster responses during testing
- Reduce `maxAgents` for quicker processing
- Enable caching in production environments
- Monitor token usage to control costs

## Architecture Overview

```
User Query
    ↓
Orchestrator (Complexity Analysis)
    ↓
Agent Spawning (Based on Requirements)
    ↓
Parallel Processing
    ├── Semantic Encoding
    ├── HTM Processing
    ├── Reasoning Generation
    └── Evidence Gathering
    ↓
Consensus Building
    ↓
Response Synthesis
    ↓
Performance Tracking & Adaptation
```

## Next Steps

1. **Experiment with Different Queries**: Try various types of problems
2. **Analyze Saved Results**: Review the JSON logs for insights
3. **Monitor Learning**: Observe how HTM patterns evolve over time
4. **Test Edge Cases**: Push the system with ambiguous or complex queries
5. **Customize Agents**: Create specialized agents for your domain

## Additional Resources

- [LLM-CMP Architecture Documentation](../../docs/llm_cmp_sophistication_plan.md)
- [HTM Implementation Details](../../src/core/htm/CLAUDE.md)
- [Agent System Design](../../src/agents/CLAUDE.md)
- [Evidence Processing](../../src/evidence/CLAUDE.md)
