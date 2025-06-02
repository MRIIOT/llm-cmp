// Google Gemini Adapter Demonstration
// Shows how the Gemini adapter works with Google AI Studio API

import { GeminiAdapter } from '../models/gemini-adapter';
import { ModelOptions } from '../models/model-adapter';

async function demonstrateGeminiAdapter() {
  console.log('🌟 Google Gemini Adapter Demonstration\n' + '='.repeat(50));

  // Try to get API key from config first, then environment
  let apiKey = 'your-google-api-key-here';
  
  try {
    const { ConfigLoader } = require('../config/config-loader.js');
    const configLoader = ConfigLoader.getInstance();
    const config = configLoader.getConfig();
    
    // Check for Google API key in config
    apiKey = config.apiKeys.google || config.apiKeys.gemini || process.env.GOOGLE_API_KEY || apiKey;
    console.log('📋 Reading API key from configuration...');
    
  } catch (error) {
    console.log('⚠️  Config not available, checking environment variable...');
    apiKey = process.env.GOOGLE_API_KEY || apiKey;
  }
  
  if (!apiKey || apiKey.includes('your-')) {
    console.log('⚠️  Google API key not configured');
    console.log('   Add "google": "AIza..." to apiKeys in config.json');
    console.log('   Or set GOOGLE_API_KEY environment variable');
    console.log('   Get API key from: https://makersuite.google.com/app/apikey\n');
    console.log('🎭 Switching to mock demonstration mode...\n');
    await demonstrateMockGemini();
    return;
  }

  // Validate API key format
  if (!GeminiAdapter.validateApiKey(apiKey)) {
    console.log('⚠️  Invalid Google API key format');
    console.log('   Google AI Studio keys should start with "AIza" and be 39 characters long\n');
    console.log('🎭 Switching to mock demonstration mode...\n');
    await demonstrateMockGemini();
    return;
  }

  console.log('🔑 Using configured Google API key');
  console.log(`📋 Available models: ${GeminiAdapter.getAvailableModels().join(', ')}\n`);

  // Test different Gemini models
  const models = ['gemini-pro', 'gemini-1.5-pro'];
  const testPrompt = "Explain the concept of artificial intelligence in simple terms, including its applications and potential impact on society.";

  for (const model of models) {
    console.log(`\n🧠 Testing ${model.toUpperCase()}`);
    console.log('-'.repeat(40));

    try {
      const adapter = new GeminiAdapter(model, apiKey);
      console.log(`📊 Token limit: ${adapter.tokenLimit.toLocaleString()}`);
      console.log(`🎯 Model supports vision: ${adapter.supportsVision()}`);

      const startTime = Date.now();
      
      const options: ModelOptions = {
        systemPrompt: `You are an AI expert providing clear, accurate explanations. Focus on being educational and accessible.`,
        temperature: 0.7,
        maxTokens: 1000
      };

      console.log(`📡 Sending request to ${model}...`);
      const response = await adapter.generateCompletion(testPrompt, options);
      const duration = Date.now() - startTime;

      console.log(`✅ Response received in ${duration}ms`);
      console.log(`📝 Content length: ${response.content.length} characters`);
      console.log(`🔢 Token usage - Input: ${response.usage?.prompt_tokens}, Output: ${response.usage?.completion_tokens}`);
      console.log(`🏁 Finish reason: ${response.finish_reason}`);
      console.log(`\n📄 Response preview:`);
      console.log(`"${response.content.substring(0, 200)}..."`);

      // Test caching
      console.log(`\n💾 Testing response caching...`);
      const startTime2 = Date.now();
      await adapter.generateCompletion(testPrompt, options);
      const duration2 = Date.now() - startTime2;
      console.log(`⚡ Cached response time: ${duration2}ms (should be much faster)`);

    } catch (error: any) {
      console.log(`❌ Error with ${model}: ${error.message}`);
      
      if (error.message.includes('API_KEY_INVALID')) {
        console.log('💡 Check your Google API key configuration');
      } else if (error.message.includes('quota')) {
        console.log('💡 API quota exceeded - try again later');
      } else if (error.message.includes('safety')) {
        console.log('💡 Content was blocked by safety filters');
      }
    }
  }

  // Test agent-specific model recommendations
  console.log('\n\n🎯 Agent-Specific Model Recommendations');
  console.log('-'.repeat(45));
  
  const agentTypes = ['reasoning', 'creative', 'factual', 'code', 'social', 'critical', 'coordinator'];
  for (const agentType of agentTypes) {
    const recommendedModel = GeminiAdapter.getRecommendedModel(agentType);
    console.log(`${agentType.padEnd(12)}: ${recommendedModel}`);
  }

  console.log('\n✅ Gemini adapter demonstration complete!');
}

async function demonstrateMockGemini() {
  console.log('🎭 Mock Gemini Demonstration (API key not available)\n');
  
  // Show what the adapter would do with proper configuration
  console.log('📋 Available Gemini models:');
  GeminiAdapter.getAvailableModels().forEach(model => {
    console.log(`   • ${model} (${new GeminiAdapter(model, 'mock-key').tokenLimit.toLocaleString()} tokens)`);
  });

  console.log('\n🎯 Model recommendations by agent type:');
  const agentTypes = ['reasoning', 'creative', 'factual', 'code', 'social', 'critical', 'coordinator'];
  agentTypes.forEach(agentType => {
    const recommended = GeminiAdapter.getRecommendedModel(agentType);
    console.log(`   ${agentType.padEnd(12)}: ${recommended}`);
  });

  console.log('\n📡 Simulating API call structure...');
  console.log('   POST /v1beta/models/gemini-pro:generateContent');
  console.log('   Headers: Content-Type: application/json');
  console.log('   URL: ?key=YOUR_API_KEY');
  
  console.log('\n📝 Request body structure:');
  console.log(`   {
     "contents": [{"parts": [{"text": "user_prompt"}], "role": "user"}],
     "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2000},
     "systemInstruction": {"parts": [{"text": "system_prompt"}]},
     "safetySettings": [...]
   }`);

  console.log('\n📄 Response structure:');
  console.log(`   {
     "candidates": [{"content": {"parts": [{"text": "response"}]}}],
     "usageMetadata": {"promptTokenCount": N, "candidatesTokenCount": M}
   }`);

  console.log('\n💡 To use Gemini adapter:');
  console.log('   1. Get API key from https://makersuite.google.com/app/apikey');
  console.log('   2. Add "google": "AIza..." to apiKeys in config.json');
  console.log('   3. Set provider to "google" or "gemini" in model config');
  console.log('   4. Use models: gemini-pro, gemini-1.5-pro, etc.');
}

// Test integration with orchestration system
async function demonstrateGeminiIntegration() {
  console.log('\n\n🔄 Gemini Integration Test\n' + '='.repeat(40));

  try {
    // Test model factory with Gemini
    const { createModelAdapter } = await import('../models/index');
    
    console.log('🏭 Testing model factory with Gemini models...');
    
    const geminiModels = ['gemini-pro', 'gemini-1.5-pro', 'gemini-ultra'];
    
    for (const model of geminiModels) {
      try {
        const adapter = createModelAdapter(model, 'AIza_mock_key_for_testing_123456789012345');
        console.log(`✅ ${model}: Factory created ${adapter.constructor.name}`);
        console.log(`   Token limit: ${adapter.tokenLimit.toLocaleString()}`);
        
      } catch (error: any) {
        console.log(`❌ ${model}: ${error.message}`);
      }
    }

    console.log('\n✅ Integration test complete!');
    
  } catch (error: any) {
    console.log(`❌ Integration test error: ${error.message}`);
  }
}

// Main demonstration function
export async function runGeminiAdapterDemo() {
  try {
    await demonstrateGeminiAdapter();
    await demonstrateGeminiIntegration();
  } catch (error: any) {
    console.error('❌ Demo error:', error.message);
  }
}

// Run demo if called directly
if (require.main === module) {
  runGeminiAdapterDemo();
}
