/**
 * Test the structured reasoning prompt format
 * This file tests that our prompts generate the expected structured output
 */

import { Agent, AgentConfig } from '../core/agent';
import { AgentCapability, LLMRequest, LLMResponse } from '../types';

// Create a mock LLM interface that returns structured responses
const mockStructuredLLM = async (request: LLMRequest): Promise<LLMResponse> => {
  console.log('\n=== LLM Request ===');
  console.log('System Prompt:', request.systemPrompt);
  console.log('User Prompt:', request.prompt);
  
  // Simulate structured response
  const structuredResponse = `[OBSERVATION:quantum_computing] Quantum computing represents a fundamental shift in computational paradigm
[ANALYSIS:encryption_vulnerability] Current RSA and ECC encryption methods rely on mathematical problems that quantum computers can solve efficiently
[INFERENCE:security_impact] This means that once sufficiently powerful quantum computers exist, current public-key cryptography will be broken
[DEDUCTION:mitigation_strategy] Therefore, organizations must begin transitioning to quantum-resistant algorithms
[PREDICTION:timeline_estimate] Based on current progress, we expect cryptographically relevant quantum computers within 10-20 years`;
  
  return {
    content: structuredResponse,
    model: request.model,
    usage: {
      promptTokens: 100,
      completionTokens: 150,
      totalTokens: 250,
      cost: 0.01
    },
    latency: 500,
    metadata: request.metadata
  };
};

// Test function
async function testStructuredPrompts() {
  console.log('Testing Structured Reasoning Prompts\n');
  
  // Create test agent
  const testCapability: AgentCapability = {
    id: 'analytical',
    name: 'Analytical Agent',
    description: 'Test analytical capabilities',
    strength: 0.9,
    adaptationRate: 0.1,
    specializations: ['logical_analysis', 'security_assessment', 'risk_evaluation'],
    morphology: {
      structure: {},
      connections: new Map(),
      emergentProperties: [],
      adaptationHistory: []
    },
    lastUsed: new Date(),
    performanceHistory: []
  };
  
  const agentConfig: AgentConfig = {
    id: 'test_agent_001',
    name: 'Test Structured Agent',
    description: 'Agent for testing structured prompts',
    initialCapabilities: [testCapability],
    config: {}
  };
  
  const agent = new Agent(agentConfig);
  
  // Test query
  const query = "What are the potential impacts of quantum computing on current encryption methods?";
  const context = {
    domain: "cybersecurity",
    focus: "encryption vulnerability"
  };
  
  try {
    // Process query with mock LLM
    const message = await agent.processQuery(query, context, mockStructuredLLM);
    
    console.log('\n=== Generated Message ===');
    console.log('Reasoning Steps:', message.content.reasoning.steps.length);
    
    // Display each reasoning step
    message.content.reasoning.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1}:`);
      console.log(`  Type: ${step.type}`);
      console.log(`  Concept: ${step.concept}`);
      console.log(`  Content: ${step.content.substring(0, 80)}...`);
      console.log(`  Confidence: ${step.confidence.mean.toFixed(2)}`);
    });
    
    // Check if concepts are properly extracted
    const concepts = message.content.reasoning.steps.map(s => s.concept);
    console.log('\n=== Extracted Concepts ===');
    console.log(concepts);
    
    // Verify no "Okay," type concepts
    const badConcepts = concepts.filter(c => 
      c.toLowerCase() === 'okay' || 
      c.includes(',') || 
      c.length < 3
    );
    
    if (badConcepts.length > 0) {
      console.error('\n❌ Found problematic concepts:', badConcepts);
    } else {
      console.log('\n✅ All concepts look good!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testStructuredPrompts().catch(console.error);
