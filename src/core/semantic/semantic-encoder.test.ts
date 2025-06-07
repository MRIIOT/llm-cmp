/**
 * Test file for Semantic Encoder
 * Verifies semantic encoding functionality
 */

import { SemanticEncoder } from './semantic-encoder.js';
import { LLMRequest, LLMResponse } from '../../types/index.js';

// Mock LLM interface for testing
const mockLLMInterface = async (request: LLMRequest): Promise<LLMResponse> => {
  // Simulate semantic feature extraction based on keywords
  const text = request.prompt.toLowerCase();

  // Extract concepts based on common patterns
  let concepts = ['general', 'query', 'text'];
  let categories = ['general', 'information'];
  let intent: any = 'statement';

  if (text.includes('quantum') && text.includes('computing')) {
    concepts = ['quantum', 'computing', 'encryption', 'cryptography', 'security'];
    categories = ['technology', 'security', 'computing'];
  } else if (text.includes('weather')) {
    concepts = ['weather', 'forecast', 'temperature', 'conditions'];
    categories = ['meteorology', 'environment'];
  } else if (text.includes('neural') && text.includes('network')) {
    concepts = ['neural', 'network', 'training', 'machine_learning', 'ai'];
    categories = ['technology', 'ai', 'computing'];
  } else if (text.includes('recipe') || text.includes('cake')) {
    concepts = ['recipe', 'cooking', 'chocolate', 'cake', 'baking'];
    categories = ['cooking', 'food'];
  }

  if (text.includes('?') || text.includes('what') || text.includes('how')) {
    intent = 'question';
  }

  const features = {
    concepts,
    categories,
    attributes: {
      abstractness: text.includes('concept') || text.includes('theory') ? 0.8 : 0.3,
      specificity: concepts.length > 3 ? 0.7 : 0.4,
      technicality: text.includes('quantum') || text.includes('neural') ? 0.8 : 0.2,
      certainty: text.includes('?') ? 0.3 : 0.7,
      actionability: text.includes('how') || text.includes('train') ? 0.8 : 0.3,
      temporality: text.includes('future') || text.includes('will') ? 0.8 : 0.3
    },
    relationships: ['analyzes', 'describes'],
    intent,
    complexity: concepts.length / 10,
    temporalAspect: text.includes('time') || text.includes('when')
  };

  return {
    content: JSON.stringify(features),
    model: 'mock-model',
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.001
    },
    latency: 100,
    metadata: {}
  };
};

// Test function
export async function testSemanticEncoder() {
  console.log('Testing Semantic Encoder...\n');

  const encoder = new SemanticEncoder(mockLLMInterface);

  // Test queries
  const testQueries = [
    // Similar quantum computing queries
    "What is the impact of quantum computing on encryption?",
    "How does quantum computing affect cryptography?",
    "Quantum computers and their effect on encryption methods",

    // Different domain queries
    "What is the weather today?",
    "Recipe for chocolate cake",
    "How to train a neural network"
  ];

  const results: any[] = [];

  // Encode all queries
  for (const query of testQueries) {
    console.log(`Encoding: "${query}"`);
    const result = await encoder.encode(query);
    results.push({
      query,
      features: result.features,
      activeCount: result.activeCount,
      sparsity: result.sparsity,
      fromCache: result.fromCache,
      encoding: result.encoding
    });

    console.log(`  Concepts: ${result.features.concepts.join(', ')}`);
    console.log(`  Active columns: ${result.activeCount} (${(result.sparsity * 100).toFixed(2)}% sparsity)`);
    console.log(`  From cache: ${result.fromCache}\n`);
  }

  // Calculate overlaps
  console.log('\nCalculating semantic overlaps:');
  console.log('(Higher values indicate more semantic similarity)\n');

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const overlap = SemanticEncoder.calculateOverlap(
        results[i].encoding,
        results[j].encoding
      );

      console.log(`Query ${i + 1} vs Query ${j + 1}: ${(overlap * 100).toFixed(2)}% overlap`);
      console.log(`  "${testQueries[i].substring(0, 40)}..."`);
      console.log(`  "${testQueries[j].substring(0, 40)}..."`);
      console.log('');
    }
  }

  // Test cache
  console.log('\nTesting cache functionality:');
  const cacheStats = encoder.getCacheStats();
  console.log(`Cache size: ${cacheStats.cacheSize}`);
  console.log(`Concept mappings: ${cacheStats.conceptMappings}`);
  console.log(`Hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);

  // Re-encode first query to test cache
  console.log('\nRe-encoding first query to test cache:');
  const cachedResult = await encoder.encode(testQueries[0]);
  console.log(`From cache: ${cachedResult.fromCache}`);

  // Final cache stats
  const finalStats = encoder.getCacheStats();
  console.log(`\nFinal cache hit rate: ${(finalStats.hitRate * 100).toFixed(2)}%`);

  return {
    success: true,
    results,
    cacheStats: finalStats
  };
}

// Main execution
async function main() {
  try {
    const result = await testSemanticEncoder();
    console.log('\n✅ Test completed successfully!');
    return result;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Check if running directly (works in both Node.js CommonJS and ES modules)
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isDirectExecution = process.argv[1] && process.argv[1].endsWith('semantic-encoder.test.js');

if (isMainModule || isDirectExecution) {
  main().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}
