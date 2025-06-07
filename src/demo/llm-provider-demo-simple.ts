/**
 * Simplified LLM Provider Demo
 * Focuses on demonstrating OpenAI and Anthropic integration
 */

import * as readline from 'readline';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { AnthropicAdapter } from '../adapters/anthropic-adapter.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

interface DemoConfig {
  openaiKey?: string;
  anthropicKey?: string;
}

const DEMO_QUERIES = [
  {
    id: 'analytical',
    title: 'Analytical Question',
    query: 'Analyze the potential impacts of quantum computing on current encryption methods. Focus on: 1) Current vulnerabilities, 2) Timeline for quantum threats, 3) Post-quantum cryptography solutions.',
    systemPrompts: {
      analytical: 'You are an analytical AI assistant specializing in technology assessment. Provide structured, fact-based analysis with clear reasoning.',
      creative: 'You are a creative AI assistant. While maintaining accuracy, explore innovative angles and future possibilities.',
      critical: 'You are a critical evaluator. Identify potential weaknesses, risks, and limitations in the analysis.'
    }
  },
  {
    id: 'creative',
    title: 'Creative Challenge',
    query: 'Design a sustainable city of the future that addresses climate change. Include innovative solutions for energy, transportation, housing, and community.',
    systemPrompts: {
      analytical: 'You are an urban planning analyst. Evaluate the feasibility and impact of sustainable city designs.',
      creative: 'You are a visionary designer. Create bold, innovative solutions for future sustainable cities.',
      critical: 'You are a sustainability critic. Assess the practicality and potential challenges of proposed solutions.'
    }
  },
  {
    id: 'comparison',
    title: 'Provider Comparison',
    query: 'What are the key differences between renewable and nuclear energy for addressing climate change?',
    systemPrompts: {
      analytical: 'Provide a balanced, fact-based comparison of renewable and nuclear energy options.',
      creative: 'Explore innovative combinations and future possibilities for clean energy.',
      critical: 'Critically evaluate the trade-offs and challenges of each energy approach.'
    }
  }
];

class SimpleLLMProviderDemo {
  private rl: readline.Interface;
  private config: DemoConfig = {};
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
      // Configure API keys
      await this.configureAPIKeys();
      
      // Initialize adapters
      await this.initializeAdapters();
      
      // Select and process query
      const query = await this.selectQuery();
      
      // Run parallel processing
      await this.processWithProviders(query);
      
      // Show consensus
      await this.showConsensus();
      
    } catch (error) {
      console.error(`${colors.red}Error: ${error}${colors.reset}`);
    } finally {
      this.rl.close();
    }
  }

  private printHeader() {
    console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════════╗
║        LLM Provider Demo - OpenAI & Anthropic                ║
║        Simplified Multi-Agent Demonstration                   ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  }

  private async configureAPIKeys() {
    console.log(`\n${colors.yellow}Step 1: Configure API Keys${colors.reset}`);
    
    this.config.openaiKey = await this.question('OpenAI API key (or press Enter for env): ');
    if (!this.config.openaiKey) {
      this.config.openaiKey = process.env.OPENAI_API_KEY;
      if (this.config.openaiKey) {
        console.log(`${colors.green}✓ Using OpenAI key from environment${colors.reset}`);
      }
    }

    this.config.anthropicKey = await this.question('Anthropic API key (or press Enter for env): ');
    if (!this.config.anthropicKey) {
      this.config.anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (this.config.anthropicKey) {
        console.log(`${colors.green}✓ Using Anthropic key from environment${colors.reset}`);
      }
    }

    if (!this.config.openaiKey || !this.config.anthropicKey) {
      throw new Error('Both API keys are required');
    }
  }

  private async initializeAdapters() {
    console.log(`\n${colors.yellow}Step 2: Initializing Adapters${colors.reset}`);
    
    this.openaiAdapter = new OpenAIAdapter({
      apiKey: this.config.openaiKey!,
      defaultModel: 'gpt-4-turbo-preview'
    });
    console.log('✓ OpenAI adapter ready (GPT-4 Turbo)');

    this.anthropicAdapter = new AnthropicAdapter({
      apiKey: this.config.anthropicKey!,
      defaultModel: 'claude-3-opus-20240229'
    });
    console.log('✓ Anthropic adapter ready (Claude 3 Opus)');
  }

  private async selectQuery(): Promise<any> {
    console.log(`\n${colors.yellow}Step 3: Select Query${colors.reset}`);
    
    DEMO_QUERIES.forEach((q, i) => {
      console.log(`${i + 1}. ${q.title}`);
      console.log(`   ${colors.dim}${q.query.substring(0, 80)}...${colors.reset}`);
    });

    const choice = await this.question('\nSelect (1-3): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= DEMO_QUERIES.length) {
      throw new Error('Invalid selection');
    }

    return DEMO_QUERIES[index];
  }

  private async processWithProviders(query: any) {
    console.log(`\n${colors.yellow}Step 4: Processing Query${colors.reset}`);
    console.log(`${colors.cyan}Query: "${query.query}"${colors.reset}\n`);

    const agents = [
      { name: 'Analytical Agent', role: 'analytical', provider: 'openai' },
      { name: 'Creative Agent', role: 'creative', provider: 'anthropic' },
      { name: 'Critical Agent', role: 'critical', provider: 'openai' },
      { name: 'Synthesis Agent', role: 'analytical', provider: 'anthropic' }
    ];

    const responses: any[] = [];

    for (const agent of agents) {
      console.log(`\n${colors.magenta}[${agent.name}]${colors.reset} → ${colors.blue}${agent.provider === 'openai' ? 'OpenAI GPT-4' : 'Anthropic Claude 3'}${colors.reset}`);
      
      const adapter = agent.provider === 'openai' ? this.openaiAdapter! : this.anthropicAdapter!;
      
      const request: LLMRequest = {
        model: agent.provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-opus-20240229',
        prompt: query.query,
        systemPrompt: query.systemPrompts[agent.role],
        temperature: agent.role === 'creative' ? 0.8 : 0.7,
        maxTokens: 500,
        metadata: { agent: agent.name }
      };

      try {
        const startTime = Date.now();
        const response = await adapter.generateCompletion(request);
        const duration = Date.now() - startTime;
        
        console.log(`${colors.dim}Tokens: ${response.usage.totalTokens} | Cost: $${response.usage.cost.toFixed(4)} | Time: ${duration}ms${colors.reset}`);
        console.log(`${colors.dim}Preview: ${response.content.substring(0, 100)}...${colors.reset}`);
        
        responses.push({
          agent: agent.name,
          provider: agent.provider,
          content: response.content,
          usage: response.usage,
          duration
        });
        
      } catch (error) {
        console.error(`${colors.red}Failed: ${error}${colors.reset}`);
      }
    }

    // Store for consensus
    (global as any).__demo_responses = responses;
  }

  private async showConsensus() {
    console.log(`\n${colors.yellow}Step 5: Building Consensus${colors.reset}`);
    
    const responses = (global as any).__demo_responses || [];
    
    if (responses.length === 0) {
      console.log(`${colors.red}No responses to build consensus${colors.reset}`);
      return;
    }

    // Simple consensus: Show key points from each agent
    console.log(`\n${colors.cyan}${colors.bright}═══ Multi-Agent Analysis ═══${colors.reset}\n`);
    
    // Summary stats
    const totalTokens = responses.reduce((sum: number, r: any) => sum + r.usage.totalTokens, 0);
    const totalCost = responses.reduce((sum: number, r: any) => sum + r.usage.cost, 0);
    const avgTime = responses.reduce((sum: number, r: any) => sum + r.duration, 0) / responses.length;
    
    console.log(`${colors.cyan}Performance Summary:${colors.reset}`);
    console.log(`• Agents: ${responses.length}`);
    console.log(`• Total Tokens: ${totalTokens}`);
    console.log(`• Total Cost: $${totalCost.toFixed(4)}`);
    console.log(`• Average Response Time: ${avgTime.toFixed(0)}ms`);
    
    // Provider comparison
    const openaiResponses = responses.filter((r: any) => r.provider === 'openai');
    const anthropicResponses = responses.filter((r: any) => r.provider === 'anthropic');
    
    console.log(`\n${colors.cyan}Provider Comparison:${colors.reset}`);
    console.log(`• OpenAI: ${openaiResponses.length} agents, avg ${(openaiResponses.reduce((s: number, r: any) => s + r.duration, 0) / openaiResponses.length).toFixed(0)}ms`);
    console.log(`• Anthropic: ${anthropicResponses.length} agents, avg ${(anthropicResponses.reduce((s: number, r: any) => s + r.duration, 0) / anthropicResponses.length).toFixed(0)}ms`);
    
    // Show responses
    console.log(`\n${colors.cyan}Agent Responses:${colors.reset}`);
    for (const response of responses) {
      console.log(`\n${colors.magenta}[${response.agent}]${colors.reset} via ${response.provider}:`);
      console.log(this.extractKeyPoints(response.content));
    }
    
    // Ask for detailed view
    const viewDetails = await this.question(`\n${colors.yellow}View full responses? (y/n): ${colors.reset}`);
    if (viewDetails.toLowerCase() === 'y') {
      for (const response of responses) {
        console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.magenta}${response.agent}${colors.reset} (${response.provider})`);
        console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        console.log(response.content);
      }
    }
  }

  private extractKeyPoints(content: string): string {
    // Extract first paragraph or up to 200 characters
    const firstPara = content.split('\n\n')[0];
    if (firstPara.length <= 200) {
      return firstPara;
    }
    return firstPara.substring(0, 197) + '...';
  }

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Main execution
async function main() {
  const demo = new SimpleLLMProviderDemo();
  await demo.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SimpleLLMProviderDemo };
