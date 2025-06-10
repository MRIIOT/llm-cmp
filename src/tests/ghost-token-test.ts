/**
 * Test for Ghost Token Relationships and Edge Toggling
 * Demonstrates the Phase 2 enhancement of semantic encoding
 */

import { SemanticEncoder } from '../core/semantic/semantic-encoder.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

// Mock LLM interface that returns ghost tokens
const mockLLMWithGhostTokens = async (request: LLMRequest): Promise<LLMResponse> => {
  console.log('\n🤖 LLM Request:', request.prompt.substring(0, 100) + '...');
  
  // Parse the query from the request
  const match = request.prompt.match(/TEXT: "(.+?)"/);
  const query = match ? match[1] : '';
  
  let mockResponse: any;
  
  if (query.toLowerCase().includes('currency') && query.toLowerCase().includes('volatility')) {
    mockResponse = {
      concepts: ['currency', 'volatility'],
      categories: ['finance', 'economics'],
      attributes: {
        abstractness: 0.4,
        specificity: 0.7,
        technicality: 0.8,
        certainty: 0.5,
        actionability: 0.3,
        temporality: 0.6
      },
      relationships: ['affects', 'fluctuates'],
      intent: 'question',
      complexity: 0.7,
      temporalAspect: true,
      ghostTokens: [
        { token: 'risk', probability: 0.85, type: 'bridge' },
        { token: 'exchange rate', probability: 0.75, type: 'bridge' },
        { token: 'market', probability: 0.70, type: 'context' },
        { token: 'economic instability', probability: 0.65, type: 'context' },
        { token: 'speculation', probability: 0.60, type: 'implicit' }
      ]
    };
  } else if (query.toLowerCase().includes('interest rate')) {
    mockResponse = {
      concepts: ['interest rate', 'monetary policy'],
      categories: ['finance', 'economics'],
      attributes: {
        abstractness: 0.5,
        specificity: 0.8,
        technicality: 0.7,
        certainty: 0.6,
        actionability: 0.5,
        temporality: 0.7
      },
      relationships: ['determines', 'influences'],
      intent: 'statement',
      complexity: 0.6,
      temporalAspect: true,
      ghostTokens: [
        { token: 'inflation', probability: 0.8, type: 'bridge' },
        { token: 'central bank', probability: 0.75, type: 'context' },
        { token: 'economic growth', probability: 0.7, type: 'bridge' }
      ]
    };
  } else {
    // Default response
    mockResponse = {
      concepts: ['general', 'query'],
      categories: ['general'],
      attributes: {
        abstractness: 0.5,
        specificity: 0.5,
        technicality: 0.5,
        certainty: 0.5,
        actionability: 0.5,
        temporality: 0.5
      },
      relationships: [],
      intent: 'statement',
      complexity: 0.5,
      temporalAspect: false,
      ghostTokens: []
    };
  }
  
  return {
    content: JSON.stringify(mockResponse),
    model: 'mock',
    usage: {
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150,
      cost: 0.001
    },
    latency: 100,
    metadata: { model: 'mock', tokensUsed: 100 }
  };
};

async function testGhostTokenRelationships() {
  console.log('=== Ghost Token Relationship Test ===\n');
  
  // Create encoder with ghost tokens enabled
  const encoder = new SemanticEncoder(mockLLMWithGhostTokens, {
    enableGhostTokens: true,
    enableEdgeToggling: true,
    enableHierarchicalEncoding: true,
    maxGhostTokens: 5,
    minGhostTokenProbability: 0.5
  });
  
  // Test 1: Encode query with ghost tokens
  console.log('📝 Test 1: Encoding "What affects currency volatility?"');
  const result1 = await encoder.encode('What affects currency volatility?');
  
  console.log('\n✅ Encoding result:');
  console.log(`  - Active columns: ${result1.activeCount}`);
  console.log(`  - Sparsity: ${(result1.sparsity * 100).toFixed(2)}%`);
  console.log(`  - Concepts: ${result1.features.concepts.join(', ')}`);
  console.log(`  - Ghost tokens found: ${result1.features.ghostTokens?.length || 0}`);
  
  if (result1.features.ghostTokens) {
    console.log('\n👻 Ghost tokens:');
    for (const ghost of result1.features.ghostTokens) {
      console.log(`  - ${ghost.token} (${ghost.type}): ${(ghost.probability * 100).toFixed(0)}% confidence`);
    }
  }
  
  // Test 2: Check relationship status
  console.log('\n📊 Test 2: Checking relationship status');
  const relationshipStatus = encoder.getRelationshipStatus();
  if ('error' in relationshipStatus) {
    console.log(`  - Status: ${relationshipStatus.error}`);
  } else {
    console.log(`  - Total edges: ${relationshipStatus.totalEdges || 0}`);
    console.log(`  - Active edges: ${relationshipStatus.activeEdges || 0}`);
    console.log(`  - Direct edges: ${relationshipStatus.directEdges || 0}`);
    console.log(`  - Ghost edges: ${relationshipStatus.ghostEdges || 0}`);
  }
  
  // Test 3: Toggle edge off
  console.log('\n🔧 Test 3: Toggle currency→volatility edge OFF');
  try {
    const toggled = encoder.toggleRelationship('currency', 'volatility', false);
    console.log(`  - Edge toggled: ${toggled}`);
  } catch (error) {
    console.log(`  - Note: ${error instanceof Error ? error.message : error}`);
  }
  
  // Test 4: Toggle ghost edge
  console.log('\n🔧 Test 4: Toggle currency→[risk]→volatility ghost edge OFF');
  try {
    const ghostToggled = encoder.toggleGhostRelationship('currency', 'risk', 'volatility', false);
    console.log(`  - Ghost edge toggled: ${ghostToggled}`);
  } catch (error) {
    console.log(`  - Note: ${error instanceof Error ? error.message : error}`);
  }
  
  // Test 5: Re-encode and check overlap
  console.log('\n📝 Test 5: Re-encoding after edge toggling');
  const result2 = await encoder.encode('What affects currency volatility?');
  
  // Calculate overlap
  const overlap = SemanticEncoder.calculateOverlap(result1.encoding, result2.encoding);
  console.log(`  - Encoding overlap: ${(overlap * 100).toFixed(2)}%`);
  console.log(`  - This shows how edge toggling affects encoding similarity`);
  
  // Test 6: Export edge configuration
  console.log('\n💾 Test 6: Export edge configuration');
  const edgeConfig = encoder.exportEdgeConfiguration();
  if (edgeConfig) {
    console.log(`  - Exported ${edgeConfig.edges.length} edge configurations`);
    console.log(`  - Version: ${edgeConfig.version}`);
  }
  
  // Test 7: Encode related concept
  console.log('\n📝 Test 7: Encoding related concept "interest rate policies"');
  const result3 = await encoder.encode('interest rate policies');
  
  // Check for concept relationships via ghost tokens
  const stats = encoder.getEnhancedStats();
  console.log('\n📈 Enhanced statistics:');
  console.log(`  - Cache entries: ${stats.cacheSize}`);
  console.log(`  - Ghost tokens enabled: ${stats.ghostTokens?.ghostTokensEnabled || false}`);
  console.log(`  - Edge toggling enabled: ${stats.ghostTokens?.edgeTogglingEnabled || false}`);
  
  console.log('\n✅ Ghost token test completed!');
  console.log('\nKey observations:');
  console.log('1. Ghost tokens create implicit bridges between concepts');
  console.log('2. Edge toggling allows fine-tuned control over relationships');
  console.log('3. Single query establishes relationships (no multi-query needed)');
  console.log('4. Probability-weighted overlap based on ghost token confidence');
}

// Run the test
testGhostTokenRelationships().catch(console.error);