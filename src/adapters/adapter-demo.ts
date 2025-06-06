/**
 * Demo: How to use the  LLM Adapters
 * Shows basic usage patterns and features
 */

import { 
  createLLMAdapter, 
  createAdapters,
  testAdapters,
  getRecommendedModel,
  AdapterType,
  BaseLLMAdapter
} from './index.js';
import { LLMRequest, LLMResponse } from '../types/index.js';

/**
 * Example 1: Create a single adapter
 */
async function example1_singleAdapter() {
  console.log('\n=== Example 1: Single Adapter ===\n');
  
  // Create OpenAI adapter
  const openaiAdapter = createLLMAdapter({
    type: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'sk-your-api-key',
      defaultModel: 'gpt-4-turbo-preview',
      timeout: 30000,
      maxRetries: 3
    }
  });
  
  // Enable caching for repeated requests
  openaiAdapter.setCacheEnabled(true);
  
  // Make a request
  const request: LLMRequest = {
    model: 'gpt-4-turbo-preview',
    prompt: 'What are the key principles of clean code architecture?',
    systemPrompt: 'You are a software architecture expert. Be concise but thorough.',
    temperature: 0.7,
    maxTokens: 500,
    metadata: { 
      purpose: 'educational',
      topic: 'software-architecture' 
    }
  };
  
  try {
    const response = await openaiAdapter.generateCompletion(request);
    
    console.log('Response:', response.content);
    console.log('\nMetrics:');
    console.log('- Model:', response.model);
    console.log('- Tokens:', response.usage.totalTokens);
    console.log('- Cost: $', response.usage.cost.toFixed(4));
    console.log('- Latency:', response.latency, 'ms');
    
    // Get adapter metrics
    const metrics = openaiAdapter.getMetrics();
    console.log('\nAdapter Metrics:', metrics);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Example 2: Multiple adapters with factory
 */
async function example2_multipleAdapters() {
  console.log('\n=== Example 2: Multiple Adapters ===\n');
  
  // Create multiple adapters at once
  const adapters = createAdapters([
    {
      type: 'openai',
      config: {
        apiKey: process.env.OPENAI_API_KEY || 'sk-your-api-key',
        defaultModel: 'gpt-4-turbo-preview'
      }
    },
    {
      type: 'anthropic',
      config: {
        apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-your-api-key',
        defaultModel: 'claude-3-opus-20240229'
      }
    },
    {
      type: 'gemini',
      config: {
        apiKey: process.env.GEMINI_API_KEY || 'your-gemini-key',
        defaultModel: 'gemini-pro'
      }
    },
    {
      type: 'lmstudio',
      config: {
        apiKey: 'not-required', // LMStudio doesn't need an API key
        port: 1234,
        enableGPU: true
      }
    }
  ]);
  
  // Test all adapters
  console.log('Testing all adapters...');
  const testResults = await testAdapters(adapters);
  
  for (const [type, result] of testResults) {
    console.log(`\n${type}:`);
    console.log('- Success:', result.success);
    if (result.error) console.log('- Error:', result.error);
    if (result.latency) console.log('- Latency:', result.latency, 'ms');
  }
}

/**
 * Example 3: Use case specific model selection
 */
async function example3_useCaseSelection() {
  console.log('\n=== Example 3: Use Case Selection ===\n');
  
  // Create adapters
  const adapters = createAdapters([
    {
      type: 'openai',
      config: { apiKey: process.env.OPENAI_API_KEY || 'sk-test' }
    },
    {
      type: 'anthropic',
      config: { apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-test' }
    }
  ]);
  
  // Get recommended models for different use cases
  const useCases = ['reasoning', 'creative', 'code', 'chat', 'analysis'] as const;
  
  for (const useCase of useCases) {
    const recommendation = getRecommendedModel(useCase, adapters);
    
    if (recommendation) {
      console.log(`\n${useCase}:`);
      console.log('- Adapter:', recommendation.adapter.constructor.name);
      console.log('- Model:', recommendation.model);
      
      // Example request for this use case
      const request: LLMRequest = {
        model: recommendation.model,
        prompt: getExamplePrompt(useCase),
        systemPrompt: getSystemPrompt(useCase),
        temperature: getTemperature(useCase),
        maxTokens: 300,
        metadata: { useCase }
      };
      
      console.log('- Example prompt:', request.prompt.substring(0, 50) + '...');
    }
  }
}

/**
 * Example 4: LM Studio local model
 */
async function example4_localModel() {
  console.log('\n=== Example 4: Local Model with LM Studio ===\n');
  
  const lmStudioAdapter = createLLMAdapter({
    type: 'lmstudio',
    config: {
      apiKey: 'not-required', // LMStudio doesn't need an API key
      port: 1234,
      enableGPU: true,
      timeout: 60000 // Longer timeout for local models
    }
  }) as any; // Type assertion for accessing specific methods
  
  // Check connection
  console.log('Checking LM Studio connection...');
  const status = await lmStudioAdapter.getServerStatus();
  console.log('Status:', status);
  
  if (!status.connected) {
    console.log('\nLM Studio is not running. Please start LM Studio and load a model.');
    return;
  }
  
  // Wait for ready
  if (!status.ready) {
    console.log('Waiting for LM Studio to be ready...');
    await lmStudioAdapter.waitForReady(10, 2000);
  }
  
  // Get current model info
  const modelInfo = await lmStudioAdapter.getCurrentModel();
  console.log('\nLoaded model:', modelInfo?.id || 'Unknown');
  
  // Make a request
  const request: LLMRequest = {
    model: 'current',
    prompt: 'Explain quantum computing in simple terms.',
    systemPrompt: 'You are a patient teacher. Explain complex topics simply.',
    temperature: 0.7,
    maxTokens: 200,
    metadata: { local: true }
  };
  
  try {
    const response = await lmStudioAdapter.generateCompletion(request);
    console.log('\nResponse:', response.content);
    console.log('\nLocal model metrics:');
    console.log('- Tokens:', response.usage.totalTokens);
    console.log('- Latency:', response.latency, 'ms');
    console.log('- GPU enabled:', response.metadata.gpuEnabled);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Example 5: Advanced features
 */
async function example5_advancedFeatures() {
  console.log('\n=== Example 5: Advanced Features ===\n');
  
  const adapter = createLLMAdapter({
    type: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY || 'sk-test',
      defaultModel: 'gpt-4-turbo-preview'
    }
  });
  
  // 1. Caching demo
  console.log('1. Caching Demo:');
  adapter.setCacheEnabled(true);
  
  const cachedRequest: LLMRequest = {
    model: 'gpt-4-turbo-preview',
    prompt: 'What is 2+2?',
    systemPrompt: 'Answer directly.',
    temperature: 0,
    maxTokens: 10,
    metadata: {}
  };
  
  // First call - not cached
  const start1 = Date.now();
  await adapter.generateCompletion(cachedRequest);
  const time1 = Date.now() - start1;
  
  // Second call - should be cached
  const start2 = Date.now();
  const cached = await adapter.generateCompletion(cachedRequest);
  const time2 = Date.now() - start2;
  
  console.log('- First call:', time1, 'ms');
  console.log('- Cached call:', time2, 'ms (from cache:', cached.metadata.fromCache, ')');
  
  // 2. Metrics tracking
  console.log('\n2. Metrics After Multiple Calls:');
  const metrics = adapter.getMetrics();
  console.log('- Total requests:', metrics.totalRequests);
  console.log('- Total tokens:', metrics.totalTokens);
  console.log('- Total cost: $', metrics.totalCost.toFixed(4));
  console.log('- Average latency:', Math.round(metrics.averageLatency), 'ms');
  console.log('- Cache size:', metrics.cacheSize);
  
  // 3. Clear cache and reset metrics
  console.log('\n3. Cleanup:');
  adapter.clearCache();
  adapter.resetMetrics();
  console.log('- Cache cleared');
  console.log('- Metrics reset');
}

// === Helper Functions ===

function getExamplePrompt(useCase: string): string {
  const prompts: Record<string, string> = {
    reasoning: 'Analyze the logical implications of autonomous vehicles on urban planning.',
    creative: 'Write a short story about a time traveler who can only move forward 5 minutes at a time.',
    code: 'Write a Python function to efficiently find all prime numbers up to n using the Sieve of Eratosthenes.',
    chat: 'Hi! I\'m planning a trip to Japan. What are some must-see places in Tokyo?',
    analysis: 'Analyze the trends in renewable energy adoption over the past decade.'
  };
  return prompts[useCase] || 'Hello, how can you help me today?';
}

function getSystemPrompt(useCase: string): string {
  const prompts: Record<string, string> = {
    reasoning: 'You are a logical reasoning expert. Provide step-by-step analysis.',
    creative: 'You are a creative writer. Be imaginative and engaging.',
    code: 'You are an expert programmer. Write clean, efficient, well-commented code.',
    chat: 'You are a friendly and helpful assistant.',
    analysis: 'You are a data analyst. Provide insights based on available information.'
  };
  return prompts[useCase] || 'You are a helpful AI assistant.';
}

function getTemperature(useCase: string): number {
  const temps: Record<string, number> = {
    reasoning: 0.3,
    creative: 0.9,
    code: 0.2,
    chat: 0.7,
    analysis: 0.5
  };
  return temps[useCase] || 0.7;
}

// === Run Examples ===

async function runAllExamples() {
  console.log('🚀  LLM Adapter Demo\n');
  
  try {
    // Comment out examples you don't want to run
    // await example1_singleAdapter();
    // await example2_multipleAdapters();
    await example3_useCaseSelection();
    // await example4_localModel();
    // await example5_advancedFeatures();
    
  } catch (error) {
    console.error('\nDemo error:', error instanceof Error ? error.message : String(error));
  }
}

// Run if this file is executed directly
// Note: import.meta requires ES module configuration in tsconfig
// if (import.meta.url === `file://${process.argv[1]}`) {
//   runAllExamples();
// }