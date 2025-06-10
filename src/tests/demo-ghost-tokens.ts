/**
 * Simple demonstration of ghost tokens in the agent
 */

import { Agent, AgentConfig } from '../core/agent.js';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

async function demoGhostTokens() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              GHOST TOKEN DEMONSTRATION WITH AGENT                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Please set OPENAI_API_KEY environment variable');
    return;
  }

  // Create OpenAI adapter
  const openAI = new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-3.5-turbo'
  });

  // Create LLM interface
  const llmInterface = async (request: LLMRequest): Promise<LLMResponse> => {
    return await openAI.generateCompletion(request);
  };

  // Create agent config with ghost tokens enabled
  const config: AgentConfig = {
    id: 'ghost_demo_agent',
    name: 'Ghost Token Demo Agent',
    description: 'Agent configured to demonstrate ghost token functionality',
    initialCapabilities: [{
      id: 'semantic_analysis',
      name: 'Semantic Analysis',
      description: 'Advanced semantic understanding with ghost tokens',
      strength: 0.9,
      adaptationRate: 0.1,
      specializations: ['semantic', 'analytical'],
      morphology: {
        structure: { type: 'neural', layers: 3 },
        connections: new Map([['semantic', 0.9]]),
        emergentProperties: ['ghost_token_extraction'],
        adaptationHistory: []
      },
      lastUsed: new Date(),
      performanceHistory: []
    }],
    config: {
      htm: {
        columnCount: 2048,
        cellsPerColumn: 16,
        maxSequenceLength: 50,
        learningRadius: 512,
        learningRate: 0.1
      },
      semantic: {
        enableHierarchicalEncoding: true,
        enablePhase2Enhancements: true,
        enableGhostTokens: true,
        enableEdgeToggling: true,
        maxGhostTokens: 5,
        minGhostTokenProbability: 0.4
      }
    }
  };

  const agent = new Agent(config);

  // Test queries
  const queries = [
    "What causes market volatility?",
    "How do interest rates affect market volatility?",
    "Can currency fluctuations predict market trends?"
  ];

  console.log('🔍 Processing queries to extract ghost tokens...\n');

  for (let i = 0; i < queries.length; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Query ${i + 1}: "${queries[i]}"`);
    
    // Get semantic features with ghost tokens
    console.log('\n📊 Extracting semantic features...');
    const features = await agent.getSemanticFeatures(queries[i], llmInterface);
    
    if (features) {
      console.log(`\n✅ Main Concepts: ${features.concepts.join(', ')}`);
      
      if (features.ghostTokens && features.ghostTokens.length > 0) {
        console.log(`\n👻 Ghost Tokens (implicit semantic bridges):`);
        
        for (const ghost of features.ghostTokens) {
          const bar = '█'.repeat(Math.floor(ghost.probability * 10)) + '░'.repeat(10 - Math.floor(ghost.probability * 10));
          console.log(`   - ${ghost.token.padEnd(25)} [${bar}] ${(ghost.probability * 100).toFixed(0)}% (${ghost.type})`);
        }
        
        // Show semantic bridge
        if (features.concepts.length >= 2 && features.ghostTokens.length > 0) {
          console.log(`\n🔗 Semantic Bridge Example:`);
          const bridge = features.ghostTokens[0];
          console.log(`   "${features.concepts[0]}" ←→ [${bridge.token}:${(bridge.probability * 100).toFixed(0)}%] ←→ "${features.concepts[1]}"`);
        }
      } else {
        console.log('\n⚠️  No ghost tokens found');
      }
    }
    
    // Process with agent to see HTM response
    console.log('\n🧠 Processing with HTM...');
    const message = await agent.processQuery(queries[i], { sequence: i }, llmInterface);
    
    console.log(`   - HTM Active Columns: ${message.metadata.htmState.activeColumns.length}`);
    console.log(`   - Anomaly Score: ${message.metadata.htmState.anomalyScore === -1 ? 'N/A (first query)' : (message.metadata.htmState.anomalyScore * 100).toFixed(1) + '%'}`);
    console.log(`   - Temporal Stability: ${(message.content.temporalContext.stability * 100).toFixed(1)}%`);
  }

  console.log('\n\n✨ Key Observations:');
  console.log('1. Ghost tokens create semantic bridges between concepts');
  console.log('2. These bridges help reduce anomaly scores for related queries');
  console.log('3. Single queries can establish relationships (no co-occurrence needed)');
  console.log('4. Probability scores indicate strength of semantic connections');
  
  // Show final relationship graph stats
  const semanticEncoder = (agent as any).semanticEncoder;
  if (semanticEncoder) {
    const stats = semanticEncoder.getRelationshipStatus();
    if (!('error' in stats)) {
      console.log('\n📊 Final Relationship Graph:');
      console.log(`   - Total edges: ${stats.totalEdges}`);
      console.log(`   - Ghost edges: ${stats.ghostEdges} (${((stats.ghostEdges / stats.totalEdges) * 100).toFixed(0)}%)`);
      console.log(`   - Active edges: ${stats.activeEdges}`);
    }
  }
}

demoGhostTokens().catch(console.error);