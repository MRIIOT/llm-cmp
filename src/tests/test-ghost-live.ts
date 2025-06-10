/**
 * Simple test to verify ghost token extraction with live LLM
 */

import { SemanticEncoder } from '../core/semantic/semantic-encoder.js';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

async function testGhostTokensLive() {
  console.log('=== Live Ghost Token Test ===\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    console.error('   Please set it to test with a live LLM');
    return;
  }

  // Create OpenAI adapter
  const openAI = new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-3.5-turbo'
  });

  // Create LLM interface
  const llmInterface = async (request: LLMRequest): Promise<LLMResponse> => {
    console.log('🤖 Sending request to OpenAI...');
    return await openAI.generateCompletion(request);
  };

  // Create semantic encoder with ghost tokens enabled
  const encoder = new SemanticEncoder(llmInterface, {
    enableGhostTokens: true,
    enableEdgeToggling: true,
    enableHierarchicalEncoding: true,
    maxGhostTokens: 5,
    minGhostTokenProbability: 0.3
  });

  // Test queries
  const testQueries = [
    "What affects currency volatility in emerging markets?",
    "How do interest rates impact stock market performance?",
    "What role does inflation play in economic policy?"
  ];

  console.log('Testing ghost token extraction with live LLM...\n');

  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    
    try {
      const result = await encoder.encode(query);
      const features = result.features;
      
      console.log(`\n✅ Extraction successful!`);
      console.log(`   - Main concepts: ${features.concepts.join(', ')}`);
      console.log(`   - Categories: ${features.categories.join(', ')}`);
      console.log(`   - Intent: ${features.intent}`);
      
      if (features.ghostTokens && features.ghostTokens.length > 0) {
        console.log(`\n   👻 Ghost Tokens Found (${features.ghostTokens.length}):`);
        for (const ghost of features.ghostTokens) {
          const confidence = (ghost.probability * 100).toFixed(0);
          console.log(`      - ${ghost.token} (${ghost.type}): ${confidence}% confidence`);
        }
        
        // Show semantic bridge
        if (features.concepts.length >= 2) {
          const bridge = features.ghostTokens[0];
          console.log(`\n   🔗 Semantic Bridge:`);
          console.log(`      "${features.concepts[0]}" ←→ [${bridge.token}] ←→ "${features.concepts[1]}"`);
        }
      } else {
        console.log(`\n   ⚠️  No ghost tokens extracted`);
        console.log(`      This might mean the LLM didn't include them in the response`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    }
    
    console.log('\n' + '─'.repeat(70) + '\n');
  }

  // Test relationship status
  console.log('📊 Checking relationship graph status...');
  const status = encoder.getRelationshipStatus();
  if ('error' in status) {
    console.log(`   Status: ${status.error}`);
  } else {
    console.log(`   - Total edges: ${status.totalEdges}`);
    console.log(`   - Active edges: ${status.activeEdges}`);
    console.log(`   - Ghost edges: ${status.ghostEdges}`);
  }

  console.log('\n✨ Test complete!');
}

// Run the test
testGhostTokensLive().catch(console.error);