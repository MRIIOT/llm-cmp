// Mock Adapter Demonstration
// Shows how the mock adapter works for testing without API calls

import { MockAdapter } from './mock-adapter';
import { ModelOptions } from './model-adapter';

async function demonstrateMockAdapter() {
  console.log('🎭 Mock Adapter Demonstration\n' + '='.repeat(50));

  // Create mock adapters for different agent types
  const adapters = {
    reasoning: new MockAdapter('mock-reasoning', { 
      latencyMs: 200, 
      agentSpecificResponses: true 
    }),
    creative: new MockAdapter('mock-creative', { 
      latencyMs: 150,
      agentSpecificResponses: true
    }),
    factual: new MockAdapter('mock-factual', { 
      latencyMs: 100,
      agentSpecificResponses: true
    }),
    code: new MockAdapter('mock-code', { 
      latencyMs: 300,
      agentSpecificResponses: true
    })
  };

  const testPrompt = "How can we improve team collaboration in remote work environments?";

  console.log(`Test Prompt: "${testPrompt}"\n`);

  // Test each adapter type
  for (const [agentType, adapter] of Object.entries(adapters)) {
    console.log(`\n📊 Testing ${agentType.toUpperCase()} Agent`);
    console.log('-'.repeat(30));

    try {
      const startTime = Date.now();
      
      const systemPrompt = `You are a ${agentType} specialist agent. Focus on ${agentType} aspects of the problem.`;
      const options: ModelOptions = {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 500
      };

      const response = await adapter.generateCompletion(testPrompt, options);
      const duration = Date.now() - startTime;

      console.log(`✅ Response generated in ${duration}ms`);
      console.log(`📝 Content preview: ${response.content.substring(0, 150)}...`);
      console.log(`🔢 Tokens - Input: ${response.usage?.prompt_tokens}, Output: ${response.usage?.completion_tokens}`);
      console.log(`🆔 Response ID: ${response.id}`);

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Demonstrate error simulation
  console.log('\n\n🚨 Error Simulation Demonstration');
  console.log('-'.repeat(30));
  
  const errorAdapter = new MockAdapter('mock-error-test', { 
    errorRate: 0.5, // 50% error rate for testing
    latencyMs: 100
  });

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`\nAttempt ${i}:`);
      const response = await errorAdapter.generateCompletion(`Test call ${i}`, {});
      console.log(`✅ Success: ${response.content.substring(0, 50)}...`);
    } catch (error: any) {
      console.log(`❌ Simulated error: ${error.message}`);
    }
  }

  // Demonstrate caching
  console.log('\n\n💾 Cache Demonstration');
  console.log('-'.repeat(30));
  
  const cacheAdapter = new MockAdapter('mock-cache-test', { latencyMs: 500 });
  const cachePrompt = "This is a cached response test";

  // First call - should be slow
  console.log('\nFirst call (no cache):');
  const start1 = Date.now();
  await cacheAdapter.generateCompletion(cachePrompt, {});
  console.log(`⏱️  Duration: ${Date.now() - start1}ms`);

  // Second call - should be fast (cached)
  console.log('\nSecond call (cached):');
  const start2 = Date.now();
  await cacheAdapter.generateCompletion(cachePrompt, {});
  console.log(`⏱️  Duration: ${Date.now() - start2}ms`);

  // Statistics summary
  console.log('\n\n📈 Statistics Summary');
  console.log('-'.repeat(30));
  
  for (const [agentType, adapter] of Object.entries(adapters)) {
    console.log(`${agentType}: ${adapter.getRequestCount()} requests, cache size: ${adapter.getCacheSize()}`);
  }

  console.log('\n✅ Mock Adapter demonstration complete!');
}

// Demonstrate integration with orchestration system
async function demonstrateOrchestrationIntegration() {
  console.log('\n\n🔄 Orchestration Integration Test\n' + '='.repeat(50));

  try {
    // Import orchestration components
    const { LLMOrchestrator } = await import('../orchestration/llm-orchestrator');
    const { createLLMInterface } = await import('./index');
    
    // Create mock agents with different specializations
    const mockAgents = [
      { 
        id: 'reasoning-mock', 
        type: 'reasoning_specialist',
        name: 'Mock Reasoning Agent',
        getSemanticPose: () => ({ position: [0.8, 0.6, 0.7], confidence: 0.85 })
      },
      { 
        id: 'creative-mock', 
        type: 'creative_specialist',
        name: 'Mock Creative Agent',
        getSemanticPose: () => ({ position: [0.6, 0.8, 0.5], confidence: 0.75 })
      },
      { 
        id: 'factual-mock', 
        type: 'factual_specialist',
        name: 'Mock Factual Agent',
        getSemanticPose: () => ({ position: [0.9, 0.7, 0.8], confidence: 0.90 })
      }
    ];

    // Create mock model interfaces
    const mockInterfaces = mockAgents.map(agent => {
      const adapter = new MockAdapter(`mock-${agent.type}`, {
        latencyMs: 200,
        agentSpecificResponses: true,
        responseVariations: true
      });
      return { agent, adapter };
    });

    console.log('🎭 Created mock agents with specialized responses');
    console.log(`📊 Agent types: ${mockAgents.map(a => a.type).join(', ')}`);

    // Test simple multi-agent response
    const testQuery = "What are the key factors for successful project management?";
    
    console.log(`\n🔍 Testing query: "${testQuery}"`);
    console.log('\nGenerating responses from mock agents...\n');

    for (const { agent, adapter } of mockInterfaces) {
      const systemPrompt = `You are a ${agent.type.replace('_', ' ')} agent specializing in ${agent.type} analysis.`;
      
      try {
        const response = await adapter.generateCompletion(testQuery, { 
          systemPrompt,
          maxTokens: 300 
        });
        
        console.log(`\n${agent.name}:`);
        console.log(`📝 ${response.content.substring(0, 200)}...`);
        
      } catch (error: any) {
        console.log(`❌ ${agent.name} error: ${error.message}`);
      }
    }

    console.log('\n✅ Orchestration integration test complete!');
    
  } catch (error: any) {
    console.log(`❌ Integration test error: ${error.message}`);
    console.log('ℹ️  This is expected if orchestration system is not fully configured for mock adapters');
  }
}

// Main demonstration function
export async function runMockAdapterDemo() {
  try {
    await demonstrateMockAdapter();
    await demonstrateOrchestrationIntegration();
  } catch (error: any) {
    console.error('❌ Demo error:', error.message);
  }
}

// Run demo if called directly
if (require.main === module) {
  runMockAdapterDemo();
}
