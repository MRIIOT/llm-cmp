/**
 * Integrated LLM-CMP System Demonstration
 * 
 * This demo showcases:
 * - Multiple specialized agents with different capabilities
 * - HTM neural processing and pattern learning
 * - Semantic encoding of concepts
 * - Multi-agent orchestration and consensus building
 * - Live OpenAI API integration
 * - Evidence-based reasoning and uncertainty quantification
 */

import { config } from 'dotenv';
import * as readline from 'readline';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { Orchestrator, OrchestratorConfig } from '../orchestration/orchestrator.js';
import { SemanticEncoder } from '../core/semantic/semantic-encoder.js';
import { HTMRegion } from '../core/htm/htm-region.js';
import { TemporalContextManager } from '../core/temporal/temporal-context.js';
import { Agent } from '../core/agent.js';
import { LLMProvider, LLMRequest, LLMResponse } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables
config();

// Demonstration scenarios
const DEMO_SCENARIOS = [
  {
    name: "Multi-Modal Problem Solving",
    description: "Agents collaborate to solve a complex problem requiring different types of reasoning",
    query: "Analyze the impact of emerging AI technologies on global employment patterns over the next decade. Consider technological, economic, social, and ethical dimensions.",
    expectedCapabilities: ['analytical', 'creative', 'critical', 'temporal', 'integrator']
  },
  {
    name: "Scientific Hypothesis Testing",
    description: "Agents work together to evaluate a scientific hypothesis",
    query: "Evaluate the hypothesis that quantum computing will solve the protein folding problem within 5 years. Provide evidence for and against, considering current technological limitations and breakthroughs.",
    expectedCapabilities: ['analytical', 'critical', 'temporal']
  },
  {
    name: "Creative Design Challenge",
    description: "Agents collaborate on a creative design task",
    query: "Design an innovative educational system that combines AI tutoring, gamification, and real-world project-based learning for K-12 students. Consider accessibility, engagement, and measurable outcomes.",
    expectedCapabilities: ['creative', 'analytical', 'integrator']
  },
  {
    name: "Temporal Pattern Analysis",
    description: "Agents analyze patterns across time using HTM capabilities",
    query: "Identify recurring patterns in technological adoption cycles from the past century and predict the adoption curve for brain-computer interfaces. Consider historical precedents and current acceleration factors.",
    expectedCapabilities: ['temporal', 'analytical', 'integrator']
  }
];

// Visualization utilities
class DemoVisualizer {
  static printHeader(title: string): void {
    console.log('\n' + '='.repeat(80));
    console.log(`  ${title}`);
    console.log('='.repeat(80) + '\n');
  }

  static printSection(title: string): void {
    console.log('\n' + '-'.repeat(60));
    console.log(`  ${title}`);
    console.log('-'.repeat(60));
  }

  static printAgentInfo(agent: Agent): void {
    const capabilities = agent.getCapabilities();
    console.log(`\n🤖 Agent: ${agent.getName()}`);
    console.log(`   ID: ${agent.getId()}`);
    console.log(`   Capabilities:`);
    capabilities.forEach(cap => {
      console.log(`     - ${cap.name}: ${cap.specializations.join(', ')}`);
      console.log(`       Strength: ${(cap.strength * 100).toFixed(0)}%`);
    });
  }

  static printHTMState(state: any): void {
    console.log('\n🧠 HTM Neural State:');
    console.log(`   Active Columns: ${state.activeColumns.length}`);
    console.log(`   Predicted Columns: ${state.predictedColumns.length}`);
    console.log(`   Anomaly Score: ${(state.anomalyScore * 100).toFixed(1)}%`);
    console.log(`   Learning Enabled: ${state.learningEnabled}`);
  }

  static printSemanticEncoding(encoding: any): void {
    console.log('\n📊 Semantic Encoding:');
    console.log(`   Feature Dimensions: ${encoding.features?.length || 'N/A'}`);
    console.log(`   Sparsity: ${encoding.sparsity || 'N/A'}`);
    console.log(`   Semantic Concepts: ${encoding.concepts?.join(', ') || 'N/A'}`);
  }

  static printConsensusResult(consensus: any): void {
    console.log('\n🤝 Consensus Building:');
    console.log(`   Method: ${consensus.method}`);
    console.log(`   Confidence: ${(consensus.confidence.mean * 100).toFixed(1)}%`);
    console.log(`   Participants: ${consensus.participants.length} agents`);
    console.log(`   Dissent: ${consensus.dissent.length} alternative views`);
    
    if (consensus.dissent.length > 0) {
      console.log('\n   Alternative Perspectives:');
      consensus.dissent.forEach((d: any) => {
        console.log(`     - Agent ${d.agentId}: ${d.position.substring(0, 100)}...`);
      });
    }
  }

  static printReasoningChain(reasoning: any): void {
    console.log('\n💭 Reasoning Chain:');
    console.log(`   Total Steps: ${reasoning.steps.length}`);
    console.log(`   Confidence: ${(reasoning.confidence.mean * 100).toFixed(1)}%`);
    console.log(`   Pattern: ${reasoning.temporalPattern}`);
    
    console.log('\n   Key Steps:');
    reasoning.steps.slice(0, 5).forEach((step: any, idx: number) => {
      console.log(`     ${idx + 1}. [${step.type.toUpperCase()}] ${step.concept}`);
      console.log(`        ${step.content.substring(0, 120)}...`);
      console.log(`        Confidence: ${(step.confidence.mean * 100).toFixed(0)}%`);
    });
  }

  static printPerformanceMetrics(performance: any): void {
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Total Time: ${performance.totalTime}ms`);
    console.log(`   Agent Count: ${performance.agentCount}`);
    console.log(`   HTM Utilization: ${(performance.htmUtilization * 100).toFixed(1)}%`);
    console.log(`   Bayesian Updates: ${performance.bayesianUpdates}`);
    console.log(`   Token Usage: ~${performance.tokenUsage} tokens`);
  }

  static async saveResults(scenario: any, result: any): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `demo_${scenario.name.replace(/\s+/g, '_')}_${timestamp}.json`;
    const filepath = path.join('logs', filename);
    
    try {
      await fs.mkdir('logs', { recursive: true });
      await fs.writeFile(filepath, JSON.stringify({
        scenario,
        result,
        timestamp: new Date().toISOString()
      }, null, 2));
      console.log(`\n📁 Results saved to: ${filepath}`);
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }
}

// HTM Learning Demonstration
class HTMDemonstrator {
  private htmRegion: HTMRegion;
  private semanticEncoder: SemanticEncoder;
  private temporalContext: TemporalContextManager;
  
  constructor(llmInterface: (request: LLMRequest) => Promise<LLMResponse>) {
    this.htmRegion = new HTMRegion({
      name: 'demo_htm',
      numColumns: 2048,
      cellsPerColumn: 16,
      inputSize: 2048,
      enableSpatialLearning: true,
      enableTemporalLearning: true,
      learningMode: 'online',
      predictionSteps: 5,
      maxMemoryTraces: 100,
      stabilityThreshold: 0.8
    });
    
    this.semanticEncoder = new SemanticEncoder(llmInterface, {
      numColumns: 2048,
      sparsity: 0.02
    });
    
    this.temporalContext = new TemporalContextManager({
      contextDimensions: 50,
      adaptationRate: 0.1
    });
  }
  
  async demonstrateHTMLearning(queries: string[]): Promise<void> {
    DemoVisualizer.printSection('HTM Learning Demonstration');
    
    console.log('\n🎯 Training HTM with sequential queries...');
    
    // Get initial metrics
    const initialMetrics = this.htmRegion.getPerformanceMetrics();
    console.log(`\n📊 Initial HTM State:`);
    console.log(`   Total segments: ${this.getSegmentCount()}`);
    console.log(`   Prediction accuracy: ${(initialMetrics.predictionAccuracy * 100).toFixed(1)}%`);
    
    for (let i = 0; i < queries.length; i++) {
      console.log(`\n📝 Query ${i + 1}: "${queries[i].substring(0, 80)}..."`);
      
      // Encode query
      const encoding = await this.semanticEncoder.encodeWithFallback(queries[i]);
      
      // Process through HTM
      const output = this.htmRegion.compute(encoding, true);
      
      // Update temporal context
      const pattern = this.extractPattern(output.activeColumns);
      this.temporalContext.updateContext(pattern, Date.now());
      
      // Show results
      console.log(`   Spatial Pooling: ${this.countActive(output.activeColumns)} active columns`);
      console.log(`   Prediction Accuracy: ${(output.predictionAccuracy * 100).toFixed(1)}%`);
      
      // Use stability as a proxy for anomaly detection
      const anomalyLevel = 1 - output.stability;
      console.log(`   Anomaly Detection: ${anomalyLevel > 0.8 ? '⚠️ HIGH' : '✅ Normal'}`);
      
      // Show segment growth
      const currentSegments = this.getSegmentCount();
      console.log(`   Total Segments: ${currentSegments}`);
      
      // Show active and predictive cells
      console.log(`   Active Cells: ${output.activeCells.length}`);
      console.log(`   Predictive Cells: ${output.predictiveCells.length}`);
      
      // Show learning progress
      const metrics = this.htmRegion.getPerformanceMetrics();
      if (i > 0) {
        const improvement = metrics.predictionAccuracy - initialMetrics.predictionAccuracy;
        console.log(`   Learning Progress: ${improvement >= 0 ? '+' : ''}${(improvement * 100).toFixed(1)}%`);
      }
    }
    
    // Show final learned patterns
    console.log('\n📈 Learned Temporal Patterns:');
    const contextVector = this.temporalContext.getCurrentContext();
    const stabilityMetrics = this.temporalContext.getStabilityMetrics();
    const finalMetrics = this.htmRegion.getPerformanceMetrics();
    
    console.log(`   Context dimensions: ${contextVector.length}`);
    console.log(`   Pattern stability: ${(stabilityMetrics.overall * 100).toFixed(1)}%`);
    console.log(`   Final prediction accuracy: ${(finalMetrics.predictionAccuracy * 100).toFixed(1)}%`);
    console.log(`   Learning rate: ${(finalMetrics.learningRate * 100).toFixed(1)}%`);
    console.log(`   Total segments learned: ${this.getSegmentCount()}`);
  }
  
  private getSegmentCount(): number {
    // Access the temporal pooler through HTM region's internal state
    // This is a simplified count - in reality we'd need to expose this from temporal pooler
    const state = this.htmRegion.getCurrentState();
    return state.performanceMetrics?.totalSegments || 0;
  }
  
  private extractPattern(activeColumns: boolean[]): number[] {
    const pattern = new Array(50).fill(0);
    let idx = 0;
    for (let i = 0; i < activeColumns.length && idx < 50; i++) {
      if (activeColumns[i]) {
        pattern[idx++] = i / activeColumns.length;
      }
    }
    return pattern;
  }
  
  private countActive(columns: boolean[]): number {
    return columns.filter(c => c).length;
  }
}

// Main demonstration
async function runIntegratedDemo(): Promise<void> {
  DemoVisualizer.printHeader('LLM-CMP Integrated System Demonstration');
  
  console.log('This demonstration showcases the complete LLM-CMP system with:');
  console.log('- Multiple specialized agents (Analytical, Creative, Critical, Temporal, Integration)');
  console.log('- HTM neural processing for pattern recognition and learning');
  console.log('- Semantic encoding of concepts');
  console.log('- Multi-agent orchestration with consensus building');
  console.log('- Live OpenAI API integration');
  console.log('- Evidence-based reasoning with uncertainty quantification\n');
  
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.log('Please set your OpenAI API key in a .env file');
    return;
  }
  
  // Initialize OpenAI adapter
  console.log('🔧 Initializing OpenAI adapter...');
  const openaiAdapter = new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // Test connection
  try {
    await openaiAdapter.generateCompletion({
      model: 'gpt-3.5-turbo',
      prompt: 'Test connection',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 10,
      metadata: {}
    });
    console.log('✅ OpenAI connection established');
  } catch (error) {
    console.error('❌ Failed to connect to OpenAI:', error);
    return;
  }
  
  // Initialize orchestrator with multiple providers (in this demo, just OpenAI)
  const orchestratorConfig: OrchestratorConfig = {
    providers: [{
      id: 'openai',
      name: 'OpenAI',
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          contextWindow: 8192,
          capabilities: ['reasoning', 'analysis', 'creativity'],
          costPerToken: 0.00003, // $0.03 per 1k tokens
          latency: 2000
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          contextWindow: 4096,
          capabilities: ['reasoning', 'analysis'],
          costPerToken: 0.000001, // $0.001 per 1k tokens
          latency: 1000
        }
      ],
      rateLimit: { 
        requestsPerMinute: 60, 
        tokensPerMinute: 90000,
        concurrentRequests: 10
      },
      capabilities: ['text-generation', 'chat', 'reasoning'],
      supportsBatching: true,
      maxBatchSize: 20,
      headers: {},
      complete: async (request: LLMRequest): Promise<LLMResponse> => {
        return await openaiAdapter.generateCompletion(request);
      }
    } as LLMProvider],
    config: {
      agents: {
        minAgents: 3,
        maxAgents: 8,
        baseCapabilities: ['reasoning', 'analysis', 'synthesis'],
        adaptationRate: 0.1,
        evolutionEnabled: true
      },
      htm: {
        columnCount: 2048,
        cellsPerColumn: 16,
        learningRadius: 1024,
        learningRate: 0.1,
        maxSequenceLength: 1000
      },
      consensus: {
        defaultMethod: 'bayesian_aggregation',
        minParticipants: 3,
        qualityThreshold: 0.7,
        timeoutMs: 30000
      }
    }
  };
  
  console.log('🎭 Initializing multi-agent orchestrator...');
  const orchestrator = new Orchestrator(orchestratorConfig);
  
  // Demonstrate HTM learning first
  const llmInterface = async (request: LLMRequest): Promise<LLMResponse> => {
    return await openaiAdapter.generateCompletion({
      ...request,
      model: request.model || 'gpt-3.5-turbo'
    });
  };
  
  const htmDemo = new HTMDemonstrator(llmInterface);
  await htmDemo.demonstrateHTMLearning([
    "What are the fundamental principles of machine learning?",
    "How do neural networks learn from data?",
    "What is the role of backpropagation in deep learning?",
    "How do transformers differ from traditional neural networks?",
    "What are the key innovations in large language models?"
  ]);
  
  // Run demonstration scenarios
  for (const scenario of DEMO_SCENARIOS) {
    DemoVisualizer.printHeader(`Scenario: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`Query: "${scenario.query}"`);
    console.log(`Expected Capabilities: ${scenario.expectedCapabilities.join(', ')}`);
    
    try {
      // Process query through orchestrator
      console.log('\n🚀 Processing query through multi-agent system...');
      
      const startTime = Date.now();
      const result = await orchestrator.orchestrate({
        query: scenario.query,
        context: {
          scenario: scenario.name,
          timestamp: new Date().toISOString()
        },
        constraints: {
          minConfidence: 0.7,
          maxTime: 60000, // 60 seconds
          maxCost: 1.0, // $1
          requiredEvidence: []
        },
        metadata: {
          userId: 'demo-user',
          sessionId: 'demo-session',
          previousQueries: [],
          preferences: {}
        }
      });
      
      const processingTime = Date.now() - startTime;
      
      // Display results
      DemoVisualizer.printSection('Results');
      
      // Show participating agents
      console.log('\n👥 Participating Agents:');
      result.consensus.participants.forEach((p: any) => {
        console.log(`   • Agent ${p.agentId.substring(0, 12)}...`);
        console.log(`     Capabilities: ${p.capabilities.join(', ')}`);
        console.log(`     Contribution: ${(p.contribution * 100).toFixed(0)}%`);
        console.log(`     Confidence: ${(p.confidence * 100).toFixed(0)}%`);
      });
      
      // Show consensus result
      DemoVisualizer.printConsensusResult(result.consensus);
      
      // Show reasoning process
      if (result.reasoning) {
        DemoVisualizer.printReasoningChain(result.reasoning);
      }
      
      // Show final response
      console.log('\n📋 Final Response:');
      console.log(result.response.substring(0, 500) + '...\n');
      
      // Show confidence and uncertainty
      console.log('📊 Confidence Analysis:');
      console.log(`   Overall Confidence: ${(result.confidence.mean * 100).toFixed(1)}%`);
      console.log(`   Confidence Range: ${(result.confidence.lower * 100).toFixed(1)}% - ${(result.confidence.upper * 100).toFixed(1)}%`);
      
      // Show performance metrics
      DemoVisualizer.printPerformanceMetrics({
        ...result.performance,
        totalTime: processingTime
      });
      
      // Show evidence if available
      if (result.evidence && result.evidence.length > 0) {
        console.log('\n🔍 Evidence Summary:');
        console.log(`   Total Evidence: ${result.evidence.length} pieces`);
        console.log(`   High Confidence: ${result.evidence.filter((e: any) => e.confidence.mean > 0.8).length}`);
        console.log(`   Types: ${[...new Set(result.evidence.map((e: any) => e.type))].join(', ')}`);
      }
      
      // Save results
      await DemoVisualizer.saveResults(scenario, result);
      
      // Brief pause between scenarios
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`\n❌ Error processing scenario: ${error}`);
      console.error(error);
    }
  }
  
  // Show system statistics
  DemoVisualizer.printHeader('System Performance Summary');
  
  const metrics = orchestrator.getPerformanceMetrics();
  console.log('📈 Aggregate Metrics:');
  console.log(`   Average Processing Time: ${metrics.avgTime.toFixed(0)}ms`);
  console.log(`   Average Confidence: ${(metrics.avgConfidence * 100).toFixed(1)}%`);
  console.log(`   Average Agents Used: ${metrics.avgAgents.toFixed(1)}`);
  console.log(`   Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
  
  console.log('\n🏁 Demonstration Complete!');
  console.log('\nKey Takeaways:');
  console.log('- Multiple agents with different specializations collaborated effectively');
  console.log('- HTM showed learning and pattern recognition across queries');
  console.log('- Consensus mechanisms integrated diverse perspectives');
  console.log('- System adapted to query complexity by spawning appropriate agents');
  console.log('- Uncertainty quantification provided calibrated confidence estimates');
}

// Interactive mode
async function runInteractiveMode(): Promise<void> {
  DemoVisualizer.printHeader('Interactive LLM-CMP Demo');
  
  console.log('Enter your own queries to see the system in action!');
  console.log('Type "exit" to quit, "help" for commands\n');
  
  // Initialize system
  const openaiAdapter = new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY!
  });
  
  const orchestrator = new Orchestrator({
    providers: [{
      id: 'openai',
      name: 'OpenAI',
      models: [{
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        contextWindow: 4096,
        capabilities: ['reasoning', 'analysis'],
        costPerToken: 0.000001,
        latency: 1000
      }],
      supportsBatching: false,
      maxBatchSize: 1,
      rateLimit: { 
        requestsPerMinute: 60, 
        tokensPerMinute: 90000,
        concurrentRequests: 5
      },
      capabilities: ['text-generation', 'chat'],
      headers: {},
      complete: async (request: LLMRequest): Promise<LLMResponse> => await openaiAdapter.generateCompletion(request)
    } as LLMProvider],
    config: {
      agents: { 
        minAgents: 2, 
        maxAgents: 5,
        baseCapabilities: ['reasoning'],
        adaptationRate: 0.1,
        evolutionEnabled: false
      }
    }
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };
  
  while (true) {
    const query = await askQuestion('\n💭 Your query: ');
    
    if (query.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      break;
    }
    
    if (query.toLowerCase() === 'help') {
      console.log('\nCommands:');
      console.log('  exit - Quit the demo');
      console.log('  help - Show this help');
      console.log('  stats - Show system statistics');
      console.log('  reset - Reset the system');
      console.log('\nOr enter any question or task for the agents to work on!');
      continue;
    }
    
    if (query.toLowerCase() === 'stats') {
      const metrics = orchestrator.getPerformanceMetrics();
      DemoVisualizer.printPerformanceMetrics(metrics);
      continue;
    }
    
    if (query.toLowerCase() === 'reset') {
      await orchestrator.reset();
      console.log('✅ System reset');
      continue;
    }
    
    // Process query
    try {
      console.log('\n⏳ Processing...');
      const result = await orchestrator.orchestrate({
        query,
        context: { interactive: true },
        constraints: { 
          maxTime: 30000,
          maxCost: 0.1,
          minConfidence: 0.5,
          requiredEvidence: []
        },
        metadata: {
          userId: 'interactive-user',
          sessionId: Date.now().toString(),
          previousQueries: [],
          preferences: {}
        }
      });
      
      console.log('\n📊 Results:');
      console.log(`Confidence: ${(result.confidence.mean * 100).toFixed(1)}%`);
      console.log(`Agents Used: ${result.performance.agentCount}`);
      console.log(`\n${result.response}`);
      
    } catch (error) {
      console.error('\n❌ Error:', error);
    }
  }
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await runInteractiveMode();
  } else {
    await runIntegratedDemo();
  }
}

export { runIntegratedDemo, runInteractiveMode, main };
