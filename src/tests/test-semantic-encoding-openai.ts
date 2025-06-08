/**
 * Test Semantic Encoding with Real OpenAI Integration
 * Tests the semantic encoder with actual GPT-4 API calls
 */

import { SemanticEncoder } from '../core/semantic/semantic-encoder.js';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

// Initialize OpenAI adapter
const apiKey = process.env.OPENAI_API_KEY || '';

if (!apiKey) {
  console.error('\x1b[31mError: OPENAI_API_KEY environment variable not set\x1b[0m');
  console.log('\nPlease run with:');
  console.log('  Windows: set OPENAI_API_KEY=your-api-key && node dist/tests/test-semantic-encoding-openai.js');
  console.log('  Mac/Linux: OPENAI_API_KEY=your-api-key node dist/tests/test-semantic-encoding-openai.js\n');
  process.exit(1);
}

const openAIAdapter = new OpenAIAdapter({
  apiKey: apiKey,
  defaultModel: 'gpt-4-turbo-preview',
  timeout: 30000
});

// Create LLM interface using the adapter
const llmInterface = async (request: LLMRequest): Promise<LLMResponse> => {
  return await openAIAdapter.generateCompletion(request);
};

// Test queries grouped by similarity
const testQueries = {
  quantumComputing: [
    "What is the impact of quantum computing on encryption?",
    "How does quantum computing affect cryptography?",
    "Quantum computers and their effect on encryption methods"
  ],
  differentTopics: [
    "What is the weather today?",
    "Recipe for chocolate cake",
    "How to train a neural network"
  ],
  aiRelated: [
    "How does machine learning differ from deep learning?",
    "What are neural networks and how do they work?",
    "Explain the basics of artificial intelligence"
  ]
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

async function testSemanticEncodingWithOpenAI() {
  console.log(`${colors.bright}${colors.blue}Testing Semantic Encoding with OpenAI GPT-4${colors.reset}\n`);

  const encoder = new SemanticEncoder(llmInterface, {
    numColumns: 2048,
    sparsity: 0.02,
    llmTemperature: 0.3,
    llmMaxTokens: 500
  });

  const results: Map<string, any> = new Map();

  // Test each group of queries
  for (const [groupName, queries] of Object.entries(testQueries)) {
    console.log(`${colors.bright}${colors.yellow}Testing ${groupName} queries:${colors.reset}`);
    
    for (const query of queries) {
      try {
        console.log(`\nEncoding: "${query}"`);
        const startTime = Date.now();
        
        const result = await encoder.encode(query);
        const elapsed = Date.now() - startTime;
        
        results.set(query, result);
        
        console.log(`  ${colors.green}✓${colors.reset} Concepts: ${result.features.concepts.join(', ')}`);
        console.log(`  ${colors.green}✓${colors.reset} Categories: ${result.features.categories.join(', ')}`);
        console.log(`  ${colors.green}✓${colors.reset} Intent: ${result.features.intent}`);
        console.log(`  ${colors.green}✓${colors.reset} Active columns: ${result.activeCount} (${(result.sparsity * 100).toFixed(2)}% sparsity)`);
        console.log(`  ${colors.green}✓${colors.reset} From cache: ${result.fromCache}`);
        console.log(`  ${colors.green}✓${colors.reset} Time: ${elapsed}ms`);
        
        // Show attributes
        console.log(`  Attributes:`);
        for (const [attr, value] of Object.entries(result.features.attributes)) {
          const bar = '█'.repeat(Math.round(value * 10));
          const empty = '░'.repeat(10 - Math.round(value * 10));
          console.log(`    ${attr.padEnd(15)} ${bar}${empty} ${value.toFixed(2)}`);
        }
        
      } catch (error) {
        console.error(`  ${colors.red}✗ Error:${colors.reset}`, error);
      }
    }
  }

  // Calculate semantic overlaps
  console.log(`\n${colors.bright}${colors.blue}Calculating Semantic Overlaps${colors.reset}`);
  console.log('(Higher values indicate more semantic similarity)\n');

  // Helper function to calculate and display overlap
  const showOverlap = (query1: string, query2: string) => {
    const result1 = results.get(query1);
    const result2 = results.get(query2);
    
    if (!result1 || !result2) return;
    
    const overlap = SemanticEncoder.calculateOverlap(result1.encoding, result2.encoding);
    const percentage = (overlap * 100).toFixed(2);
    
    // Color code based on expected similarity
    let color = colors.reset;
    const sameGroup = Object.values(testQueries).some(group => 
      group.includes(query1) && group.includes(query2)
    );
    
    if (sameGroup && overlap > 0.4) {
      color = colors.green; // Good - similar queries have high overlap
    } else if (!sameGroup && overlap < 0.2) {
      color = colors.green; // Good - different queries have low overlap
    } else if (sameGroup && overlap < 0.4) {
      color = colors.red; // Bad - similar queries have low overlap
    } else if (!sameGroup && overlap > 0.2) {
      color = colors.yellow; // Warning - different queries have higher overlap
    }
    
    console.log(`${color}${percentage}%${colors.reset} - "${query1.substring(0, 40)}..." vs "${query2.substring(0, 40)}..."`);
  };

  // Compare within groups (should have high overlap)
  console.log(`${colors.bright}Within-Group Comparisons (should be >40%):${colors.reset}`);
  for (const [groupName, queries] of Object.entries(testQueries)) {
    console.log(`\n${groupName}:`);
    for (let i = 0; i < queries.length; i++) {
      for (let j = i + 1; j < queries.length; j++) {
        showOverlap(queries[i], queries[j]);
      }
    }
  }

  // Compare across groups (should have low overlap)
  console.log(`\n${colors.bright}Cross-Group Comparisons (should be <20%):${colors.reset}`);
  const allQueries = Object.values(testQueries).flat();
  const groups = Object.entries(testQueries);
  
  for (let g1 = 0; g1 < groups.length; g1++) {
    for (let g2 = g1 + 1; g2 < groups.length; g2++) {
      const [name1, queries1] = groups[g1];
      const [name2, queries2] = groups[g2];
      console.log(`\n${name1} vs ${name2}:`);
      
      // Just show first query from each group to avoid too much output
      showOverlap(queries1[0], queries2[0]);
    }
  }

  // Cache statistics
  console.log(`\n${colors.bright}${colors.blue}Cache Statistics${colors.reset}`);
  const cacheStats = encoder.getCacheStats();
  console.log(`Cache size: ${cacheStats.cacheSize}`);
  console.log(`Concept mappings: ${cacheStats.conceptMappings}`);
  console.log(`Hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);
  console.log(`Average access count: ${cacheStats.avgAccessCount.toFixed(2)}`);

  // Test cache with similar query
  console.log(`\n${colors.bright}Testing Cache with Similar Query:${colors.reset}`);
  const similarQuery = "How do quantum computers break encryption?";
  console.log(`Query: "${similarQuery}"`);
  const cacheTest = await encoder.encode(similarQuery);
  console.log(`From cache: ${cacheTest.fromCache} (should be true due to similarity)`);
  
  // Final summary
  console.log(`\n${colors.bright}${colors.green}✅ Test Complete!${colors.reset}`);
  
  // Calculate summary statistics
  let withinGroupOverlaps: number[] = [];
  let crossGroupOverlaps: number[] = [];
  
  for (const [groupName, queries] of Object.entries(testQueries)) {
    for (let i = 0; i < queries.length; i++) {
      for (let j = i + 1; j < queries.length; j++) {
        const result1 = results.get(queries[i]);
        const result2 = results.get(queries[j]);
        if (result1 && result2) {
          const overlap = SemanticEncoder.calculateOverlap(result1.encoding, result2.encoding);
          withinGroupOverlaps.push(overlap);
        }
      }
    }
  }
  
  for (let g1 = 0; g1 < groups.length; g1++) {
    for (let g2 = g1 + 1; g2 < groups.length; g2++) {
      const [, queries1] = groups[g1];
      const [, queries2] = groups[g2];
      const result1 = results.get(queries1[0]);
      const result2 = results.get(queries2[0]);
      if (result1 && result2) {
        const overlap = SemanticEncoder.calculateOverlap(result1.encoding, result2.encoding);
        crossGroupOverlaps.push(overlap);
      }
    }
  }
  
  const avgWithinGroup = withinGroupOverlaps.reduce((a, b) => a + b, 0) / withinGroupOverlaps.length;
  const avgCrossGroup = crossGroupOverlaps.reduce((a, b) => a + b, 0) / crossGroupOverlaps.length;
  
  console.log(`\n${colors.bright}Summary Statistics:${colors.reset}`);
  console.log(`Average within-group overlap: ${(avgWithinGroup * 100).toFixed(2)}% (target: >40%)`);
  console.log(`Average cross-group overlap: ${(avgCrossGroup * 100).toFixed(2)}% (target: <20%)`);
}

// Run the test
testSemanticEncodingWithOpenAI().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});
