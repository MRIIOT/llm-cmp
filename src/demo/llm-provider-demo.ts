/**
 * LLM Provider Demo - Interactive CLI demonstration
 * Shows full system flow using OpenAI and Anthropic providers
 */

import * as readline from 'readline';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { AnthropicAdapter } from '../adapters/anthropic-adapter.js';
import { Orchestrator, OrchestratorConfig } from '../orchestration/orchestrator.js';
import {
  LLMProvider,
  OrchestrationRequest,
  OrchestrationResult,
  LLMRequest,
  LLMResponse,
  LLMModel
} from '../types/index.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Demo configuration
interface DemoConfig {
  openaiKey?: string;
  anthropicKey?: string;
  selectedQuery?: string;
  customQuery?: string;
}

// Pre-defined demo queries
const DEMO_QUERIES = [
  {
    id: 'analytical',
    title: 'Analytical Question',
    query: 'Analyze the potential impacts of quantum computing on current encryption methods',
    complexity: 'medium'
  },
  {
    id: 'creative',
    title: 'Creative Challenge',
    query: 'Design a sustainable city of the future that addresses climate change',
    complexity: 'high'
  },
  {
    id: 'complex',
    title: 'Complex Multi-faceted',
    query: 'Compare the economic, social, and technological implications of universal basic income across different cultural contexts',
    complexity: 'very high'
  },
  {
    id: 'custom',
    title: 'Custom Query',
    query: '',
    complexity: 'variable'
  }
];

class LLMProviderDemo {
  private rl: readline.Interface;
  private config: DemoConfig = {};
  private orchestrator?: Orchestrator;
  private openaiAdapter?: OpenAIAdapter;
  private anthropicAdapter?: AnthropicAdapter;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    console.clear();
    this.printHeader();
    
    try {
      // Step 1: Configure API keys
      await this.configureAPIKeys();
      
      // Step 2: Initialize adapters and orchestrator
      await this.initializeSystem();
      
      // Step 3: Select query
      await this.selectQuery();
      
      // Step 4: Process query with visualization
      await this.processQuery();
      
      // Step 5: Show results and metrics
      await this.showResults();
      
    } catch (error) {
      console.error(`${colors.red}Error: ${error}${colors.reset}`);
    } finally {
      this.rl.close();
    }
  }

  private printHeader() {
    console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════════╗
║          LLM-CMP System Demonstration                         ║
║          OpenAI & Anthropic Provider Integration              ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  }

  private async configureAPIKeys() {
    console.log(`\n${colors.yellow}Step 1: Configure API Keys${colors.reset}`);
    console.log(`${colors.dim}Your API keys will be used to make real calls to OpenAI and Anthropic${colors.reset}\n`);

    // Get OpenAI key
    this.config.openaiKey = await this.question('Enter your OpenAI API key: ');
    if (!this.config.openaiKey) {
      this.config.openaiKey = process.env.OPENAI_API_KEY;
      if (this.config.openaiKey) {
        console.log(`${colors.green}Using OpenAI API key from environment${colors.reset}`);
      }
    }

    // Get Anthropic key
    this.config.anthropicKey = await this.question('Enter your Anthropic API key: ');
    if (!this.config.anthropicKey) {
      this.config.anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (this.config.anthropicKey) {
        console.log(`${colors.green}Using Anthropic API key from environment${colors.reset}`);
      }
    }

    // Validate keys
    if (!this.config.openaiKey || !this.config.anthropicKey) {
      throw new Error('Both API keys are required for this demo');
    }

    console.log(`\n${colors.green}✓ API keys configured${colors.reset}`);
  }

  private async initializeSystem() {
    console.log(`\n${colors.yellow}Step 2: Initializing System${colors.reset}`);
    
    // Initialize adapters
    console.log('• Initializing OpenAI adapter...');
    this.openaiAdapter = new OpenAIAdapter({
      apiKey: this.config.openaiKey!,
      defaultModel: 'gpt-4-turbo-preview'
    });

    console.log('• Initializing Anthropic adapter...');
    this.anthropicAdapter = new AnthropicAdapter({
      apiKey: this.config.anthropicKey!,
      defaultModel: 'claude-3-opus-20240229'
    });

    // Create LLM providers
    const providers: LLMProvider[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        models: [
          {
            id: 'gpt-4-turbo-preview',
            name: 'GPT-4 Turbo',
            contextWindow: 128000,
            capabilities: ['text-generation', 'chat', 'reasoning', 'code-generation'],
            costPerToken: 0.00001,
            latency: 1000
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            contextWindow: 16000,
            capabilities: ['text-generation', 'chat'],
            costPerToken: 0.0000005,
            latency: 500
          }
        ],
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 90000,
          concurrentRequests: 5
        },
        capabilities: ['text-generation', 'chat', 'function-calling']
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: [
          {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            contextWindow: 200000,
            capabilities: ['text-generation', 'chat', 'reasoning', 'vision', 'code-generation'],
            costPerToken: 0.000015,
            latency: 1200
          },
          {
            id: 'claude-3-sonnet-20240229',
            name: 'Claude 3 Sonnet',
            contextWindow: 200000,
            capabilities: ['text-generation', 'chat', 'reasoning', 'vision'],
            costPerToken: 0.000003,
            latency: 800
          }
        ],
        rateLimit: {
          requestsPerMinute: 50,
          tokensPerMinute: 100000,
          concurrentRequests: 5
        },
        capabilities: ['text-generation', 'chat', 'vision']
      }
    ];

    // Initialize orchestrator
    console.log('• Initializing orchestrator...');
    const orchestratorConfig: OrchestratorConfig = {
      providers,
      config: {
        agents: {
          minAgents: 3,
          maxAgents: 6,
          baseCapabilities: ['reasoning', 'analysis', 'synthesis'],
          adaptationRate: 0.1,
          evolutionEnabled: true
        },
        consensus: {
          defaultMethod: 'bayesian_aggregation',
          timeoutMs: 60000,
          minParticipants: 3,
          qualityThreshold: 0.7
        }
      }
    };

    this.orchestrator = new Orchestrator(orchestratorConfig);

    // Create adapter interfaces for the orchestrator
    this.setupAdapterInterfaces();

    console.log(`${colors.green}✓ System initialized${colors.reset}`);
  }

  private setupAdapterInterfaces() {
    // This would normally be done internally, but for the demo we'll make it explicit
    // The orchestrator will use these when creating LLM interfaces for agents
    (global as any).__demo_adapters = {
      openai: this.openaiAdapter,
      anthropic: this.anthropicAdapter
    };
  }

  private async selectQuery() {
    console.log(`\n${colors.yellow}Step 3: Select Query${colors.reset}`);
    
    // Display options
    DEMO_QUERIES.forEach((query, index) => {
      console.log(`${index + 1}. ${query.title} ${colors.dim}(${query.complexity})${colors.reset}`);
      if (query.query) {
        console.log(`   ${colors.dim}"${query.query}"${colors.reset}`);
      }
    });

    const choice = await this.question('\nSelect query (1-4): ');
    const selectedIndex = parseInt(choice) - 1;

    if (selectedIndex < 0 || selectedIndex >= DEMO_QUERIES.length) {
      throw new Error('Invalid selection');
    }

    const selected = DEMO_QUERIES[selectedIndex];
    this.config.selectedQuery = selected.id;

    if (selected.id === 'custom') {
      this.config.customQuery = await this.question('Enter your custom query: ');
      if (!this.config.customQuery) {
        throw new Error('Custom query cannot be empty');
      }
    }

    console.log(`${colors.green}✓ Query selected${colors.reset}`);
  }

  private async processQuery() {
    console.log(`\n${colors.yellow}Step 4: Processing Query${colors.reset}`);
    
    const query = this.config.selectedQuery === 'custom' 
      ? this.config.customQuery!
      : DEMO_QUERIES.find(q => q.id === this.config.selectedQuery)!.query;

    console.log(`\n${colors.cyan}Query: "${query}"${colors.reset}\n`);

    // Create orchestration request
    const request: OrchestrationRequest = {
      query,
      context: {
        demo: true,
        timestamp: new Date(),
        source: 'interactive-cli'
      },
      constraints: {
        maxTime: 60000,
        maxCost: 1.0,
        minConfidence: 0.5,
        requiredEvidence: []
      },
      metadata: {
        userId: 'demo-user',
        sessionId: `demo-${Date.now()}`,
        previousQueries: [],
        preferences: {}
      }
    };

    // Process with real-time updates
    console.log(`${colors.dim}═══ Starting Orchestration ═══${colors.reset}`);
    
    // Simulate real-time updates (in production, would use event emitters)
    const updateInterval = setInterval(() => {
      const dots = '.'.repeat((Date.now() / 500) % 4);
      process.stdout.write(`\r${colors.dim}Processing${dots}    ${colors.reset}`);
    }, 100);

    try {
      const startTime = Date.now();
      
      // Override the LLM interface creation in orchestrator
      this.patchOrchestratorForDemo();
      
      // Process the request
      const result = await this.orchestrator!.orchestrate(request);
      
      clearInterval(updateInterval);
      process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear the line
      
      const processingTime = Date.now() - startTime;
      
      // Store result for display
      (global as any).__demo_result = result;
      (global as any).__demo_processing_time = processingTime;
      
      console.log(`${colors.green}✓ Processing complete (${processingTime}ms)${colors.reset}`);
      
    } catch (error) {
      clearInterval(updateInterval);
      throw error;
    }
  }

  private patchOrchestratorForDemo() {
    // Patch the orchestrator's createLLMInterface method to use our real adapters
    const orchestrator = this.orchestrator as any;
    const originalCreateLLMInterface = orchestrator.createLLMInterface.bind(orchestrator);
    
    orchestrator.createLLMInterface = (activeAgent: any) => {
      return async (request: LLMRequest): Promise<LLMResponse> => {
        // Determine which adapter to use based on agent assignment
        const adapter = activeAgent.provider.id === 'openai' 
          ? this.openaiAdapter! 
          : this.anthropicAdapter!;
        
        // Show which provider is being used
        console.log(`\n${colors.magenta}[${activeAgent.agent.getName()}]${colors.reset} → ${colors.blue}${activeAgent.provider.name}${colors.reset}`);
        
        // Make the actual API call
        const response = await adapter.generateCompletion(request);
        
        // Show token usage
        console.log(`${colors.dim}  Tokens: ${response.usage.totalTokens} | Cost: $${response.usage.cost.toFixed(4)} | Latency: ${response.latency}ms${colors.reset}`);
        
        return response;
      };
    };
  }

  private async showResults() {
    console.log(`\n${colors.yellow}Step 5: Results & Analysis${colors.reset}`);
    
    const result = (global as any).__demo_result as OrchestrationResult;
    const processingTime = (global as any).__demo_processing_time as number;
    
    if (!result) {
      console.log(`${colors.red}No results to display${colors.reset}`);
      return;
    }

    // Display consensus result
    console.log(`\n${colors.cyan}${colors.bright}═══ Consensus Result ═══${colors.reset}`);
    console.log(`\n${result.response}\n`);
    
    // Display confidence
    console.log(`${colors.cyan}Confidence:${colors.reset} ${this.formatConfidence(result.confidence.mean)}`);
    console.log(`${colors.dim}[${result.confidence.lower.toFixed(2)} - ${result.confidence.upper.toFixed(2)}] (${result.confidence.method})${colors.reset}`);
    
    // Display consensus details
    console.log(`\n${colors.cyan}Consensus Method:${colors.reset} ${result.consensus.method}`);
    console.log(`${colors.cyan}Participants:${colors.reset} ${result.consensus.participants.length} agents`);
    
    // Show participant breakdown
    console.log(`\n${colors.cyan}Agent Contributions:${colors.reset}`);
    result.consensus.participants.forEach(p => {
      const capability = p.capabilities.join(', ');
      console.log(`• Agent ${p.agentId.substring(0, 8)} (${capability}): ${(p.contribution * 100).toFixed(1)}% contribution`);
    });
    
    // Display performance metrics
    console.log(`\n${colors.cyan}${colors.bright}═══ Performance Metrics ═══${colors.reset}`);
    console.log(`• Total Time: ${colors.bright}${processingTime}ms${colors.reset}`);
    console.log(`• Agent Count: ${result.performance.agentCount}`);
    console.log(`• Token Usage: ${result.performance.tokenUsage}`);
    console.log(`• HTM Utilization: ${(result.performance.htmUtilization * 100).toFixed(1)}%`);
    console.log(`• Bayesian Updates: ${result.performance.bayesianUpdates}`);
    
    // Show cost breakdown
    const estimatedCost = this.estimateTotalCost(result);
    console.log(`\n${colors.cyan}Estimated Cost:${colors.reset} $${estimatedCost.toFixed(4)}`);
    
    // Show reasoning chain summary
    if (result.reasoning && result.reasoning.steps.length > 0) {
      console.log(`\n${colors.cyan}Reasoning Chain:${colors.reset} ${result.reasoning.steps.length} steps`);
      console.log(`${colors.dim}Types: ${this.summarizeReasoningTypes(result.reasoning.steps)}${colors.reset}`);
    }
    
    // Show evidence summary
    if (result.evidence && result.evidence.length > 0) {
      console.log(`\n${colors.cyan}Evidence:${colors.reset} ${result.evidence.length} pieces`);
      console.log(`${colors.dim}Types: ${this.summarizeEvidenceTypes(result.evidence)}${colors.reset}`);
    }
    
    // Ask if user wants detailed view
    const viewDetails = await this.question(`\n${colors.yellow}View detailed results? (y/n): ${colors.reset}`);
    if (viewDetails.toLowerCase() === 'y') {
      await this.showDetailedResults(result);
    }
  }

  private formatConfidence(confidence: number): string {
    const percentage = (confidence * 100).toFixed(1);
    if (confidence >= 0.9) {
      return `${colors.green}${colors.bright}${percentage}%${colors.reset}`;
    } else if (confidence >= 0.7) {
      return `${colors.yellow}${percentage}%${colors.reset}`;
    } else {
      return `${colors.red}${percentage}%${colors.reset}`;
    }
  }

  private estimateTotalCost(result: OrchestrationResult): number {
    // Estimate based on token usage and typical costs
    const avgCostPerToken = 0.000005; // Rough average
    return result.performance.tokenUsage * avgCostPerToken;
  }

  private summarizeReasoningTypes(steps: any[]): string {
    const types = new Set(steps.map(s => s.type));
    return Array.from(types).join(', ');
  }

  private summarizeEvidenceTypes(evidence: any[]): string {
    const types = new Set(evidence.map(e => e.type));
    return Array.from(types).join(', ');
  }

  private async showDetailedResults(result: OrchestrationResult) {
    console.log(`\n${colors.cyan}${colors.bright}═══ Detailed Analysis ═══${colors.reset}`);
    
    // Show reasoning steps
    console.log(`\n${colors.yellow}Reasoning Steps:${colors.reset}`);
    result.reasoning.steps.slice(0, 5).forEach((step, i) => {
      console.log(`${i + 1}. [${step.type}] ${step.content.substring(0, 100)}...`);
      console.log(`   ${colors.dim}Confidence: ${(step.confidence.mean * 100).toFixed(1)}%${colors.reset}`);
    });
    
    if (result.reasoning.steps.length > 5) {
      console.log(`   ${colors.dim}... and ${result.reasoning.steps.length - 5} more steps${colors.reset}`);
    }
    
    // Show dissent if any
    if (result.consensus.dissent && result.consensus.dissent.length > 0) {
      console.log(`\n${colors.yellow}Dissenting Views:${colors.reset}`);
      result.consensus.dissent.forEach(d => {
        console.log(`• Agent ${d.agentId.substring(0, 8)}: ${d.position}`);
        console.log(`  ${colors.dim}${d.reasoning.substring(0, 100)}...${colors.reset}`);
      });
    }
    
    // Show predictions if any
    if (result.predictions && result.predictions.length > 0) {
      console.log(`\n${colors.yellow}Predictions:${colors.reset}`);
      result.predictions.forEach(p => {
        console.log(`• ${p.content}`);
        console.log(`  ${colors.dim}Type: ${p.type} | Confidence: ${(p.confidence.mean * 100).toFixed(1)}% | Timeframe: ${p.timeframe}ms${colors.reset}`);
      });
    }
  }

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Main execution
async function main() {
  const demo = new LLMProviderDemo();
  await demo.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { LLMProviderDemo };
