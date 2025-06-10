/**
 * Test integrated semantic enhancements with ghost tokens
 */

import { SemanticEncoder } from '../core/semantic/semantic-encoder.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

// Mock LLM that returns features with ghost tokens
const mockLLM = async (request: LLMRequest): Promise<LLMResponse> => {
  const response = {
    concepts: ['market', 'volatility', 'analysis'],
    categories: ['finance', 'economics'],
    attributes: {
      abstractness: 0.4,
      specificity: 0.7,
      technicality: 0.8,
      certainty: 0.6,
      actionability: 0.3,
      temporality: 0.5
    },
    relationships: ['affects', 'predicts'],
    intent: 'analysis' as const,
    complexity: 0.7,
    temporalAspect: true,
    ghostTokens: [
      { token: 'risk', probability: 0.85, type: 'bridge' as const },
      { token: 'economic indicators', probability: 0.75, type: 'context' as const },
      { token: 'trading', probability: 0.6, type: 'implicit' as const }
    ]
  };

  return {
    content: JSON.stringify(response),
    model: 'mock',
    usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150, cost: 0.001 },
    latency: 10,
    metadata: {}
  };
};

async function testIntegratedEnhancements() {
  console.log('=== Testing Integrated Semantic Enhancements ===\n');

  // Test 1: Basic encoding (no enhancements)
  console.log('1️⃣ Basic Encoding (no enhancements):');
  const basicEncoder = new SemanticEncoder(mockLLM, {
    numColumns: 2048,
    sparsity: 0.02,
    enablePhase2Enhancements: false,
    enableGhostTokens: false
  });
  
  const basicResult = await basicEncoder.encode('market volatility analysis');
  console.log(`   Active columns: ${basicResult.activeCount}`);
  console.log(`   Sparsity: ${(basicResult.sparsity * 100).toFixed(2)}%`);

  // Test 2: Phase 2 enhancements only
  console.log('\n2️⃣ Phase 2 Enhancements Only:');
  const phase2Encoder = new SemanticEncoder(mockLLM, {
    numColumns: 2048,
    sparsity: 0.02,
    enablePhase2Enhancements: true,
    enableConceptNormalization: true,
    enableRelationshipTracking: true,
    enableHierarchicalEncoding: true,
    enableGhostTokens: false
  });
  
  const phase2Result = await phase2Encoder.encode('market volatility analysis');
  console.log(`   Active columns: ${phase2Result.activeCount}`);
  console.log(`   Sparsity: ${(phase2Result.sparsity * 100).toFixed(2)}%`);

  // Test 3: Ghost tokens only
  console.log('\n3️⃣ Ghost Tokens Only:');
  const ghostEncoder = new SemanticEncoder(mockLLM, {
    numColumns: 2048,
    sparsity: 0.02,
    enablePhase2Enhancements: false,
    enableGhostTokens: true,
    maxGhostTokens: 5,
    minGhostTokenProbability: 0.4
  });
  
  const ghostResult = await ghostEncoder.encode('market volatility analysis');
  console.log(`   Active columns: ${ghostResult.activeCount}`);
  console.log(`   Sparsity: ${(ghostResult.sparsity * 100).toFixed(2)}%`);
  console.log(`   Ghost tokens found: ${ghostResult.features.ghostTokens?.length || 0}`);

  // Test 4: Both enhancements integrated
  console.log('\n4️⃣ Integrated Enhancements (Phase 2 + Ghost Tokens):');
  const integratedEncoder = new SemanticEncoder(mockLLM, {
    numColumns: 2048,
    sparsity: 0.02,
    enablePhase2Enhancements: true,
    enableConceptNormalization: true,
    enableRelationshipTracking: true,
    enableHierarchicalEncoding: true,
    enableGhostTokens: true,
    maxGhostTokens: 5,
    minGhostTokenProbability: 0.4
  });
  
  const integratedResult = await integratedEncoder.encode('market volatility analysis');
  console.log(`   Active columns: ${integratedResult.activeCount}`);
  console.log(`   Sparsity: ${(integratedResult.sparsity * 100).toFixed(2)}%`);
  console.log(`   Ghost tokens found: ${integratedResult.features.ghostTokens?.length || 0}`);

  // Compare overlap between encodings
  console.log('\n📊 Encoding Comparison:');
  
  const overlap12 = SemanticEncoder.calculateOverlap(basicResult.encoding, phase2Result.encoding);
  const overlap13 = SemanticEncoder.calculateOverlap(basicResult.encoding, ghostResult.encoding);
  const overlap14 = SemanticEncoder.calculateOverlap(basicResult.encoding, integratedResult.encoding);
  const overlap34 = SemanticEncoder.calculateOverlap(ghostResult.encoding, integratedResult.encoding);
  
  console.log(`   Basic vs Phase2: ${(overlap12 * 100).toFixed(1)}% overlap`);
  console.log(`   Basic vs Ghost: ${(overlap13 * 100).toFixed(1)}% overlap`);
  console.log(`   Basic vs Integrated: ${(overlap14 * 100).toFixed(1)}% overlap`);
  console.log(`   Ghost vs Integrated: ${(overlap34 * 100).toFixed(1)}% overlap`);

  console.log('\n✅ Key Observations:');
  console.log('   - Integrated encoding should have more active columns than individual approaches');
  console.log('   - Ghost tokens add semantic bridges on top of Phase 2 enhancements');
  console.log('   - The integrated approach provides the richest semantic representation');
}

testIntegratedEnhancements().catch(console.error);