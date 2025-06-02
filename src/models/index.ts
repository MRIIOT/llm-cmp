// Model Interface Layer Exports
// Centralized exports for all model-related components

// Base adapter and types
export { ModelAPIAdapter, APIError } from './model-adapter';
export type { ModelResponse, ModelOptions } from './model-adapter';

// Specific API adapters
export { OpenAIAdapter } from './openai-adapter';
export { AnthropicAdapter } from './anthropic-adapter';
export { MockAdapter } from './mock-adapter';
export { GeminiAdapter } from './gemini-adapter';
export { LMStudioAdapter } from './lmstudio-adapter';

// Interface components
export { LLMInterface } from './llm-interface';
export type { CMPMessage, RetryConfig } from './llm-interface';

// Prompt and response handling
export { PromptTemplateManager } from './prompt-template-manager';
export type { PromptContext, PromptTemplate } from './prompt-template-manager';

export { ResponseParser } from './response-parser';
export type { ParsedResponse, ReasoningStep } from './response-parser';

// Import all necessary types for factory functions
import { ModelAPIAdapter } from './model-adapter';
import { OpenAIAdapter } from './openai-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { MockAdapter } from './mock-adapter';
import { GeminiAdapter } from './gemini-adapter';
import { LMStudioAdapter } from './lmstudio-adapter';
import { LLMInterface } from './llm-interface';

// Factory function for creating adapters based on model type
export function createModelAdapter(modelType: string, apiKey: string): ModelAPIAdapter {
  if (modelType.startsWith('mock-') || modelType.includes('mock')) {
    // Mock adapter doesn't need real API key, configure for testing
    return new MockAdapter(modelType, {
      latencyMs: 300,
      errorRate: 0.01, // 1% error rate for testing
      agentSpecificResponses: true,
      responseVariations: true
    });
  } else if (modelType.startsWith('gpt-') || modelType.includes('openai')) {
    return new OpenAIAdapter(modelType, apiKey);
  } else if (modelType.startsWith('claude-') || modelType.includes('anthropic')) {
    return new AnthropicAdapter(modelType, apiKey);
  } else if (modelType.startsWith('gemini-') || modelType.includes('gemini')) {
    return new GeminiAdapter(modelType, apiKey);
  } else if (modelType.includes('lmstudio') || modelType.includes('local')) {
    // LM Studio adapter uses model name and optional config, not API key
    const config = typeof apiKey === 'object' ? apiKey : {};
    return new LMStudioAdapter(modelType, config);
  } else {
    throw new Error(`Unsupported model type: ${modelType}`);
  }
}

// Factory function for creating LLM interfaces
export function createLLMInterface(agent: any, modelType: string, apiKey: string): LLMInterface {
  const adapter = createModelAdapter(modelType, apiKey);
  return new LLMInterface(agent, adapter);
}

// Factory function for creating model interface using configuration
export function createModelInterface(agent: any): LLMInterface {
  try {
    const { ConfigLoader } = require('../config/config-loader.js');
    const configLoader = ConfigLoader.getInstance();
    const config = configLoader.getConfig();
    
    // Get agent type mapping
    const agentTypeMap: Record<string, string> = {
      'reasoning_specialist': 'reasoning',
      'creative_specialist': 'creative', 
      'factual_specialist': 'factual',
      'code_specialist': 'code',
      'social_specialist': 'social',
      'critical_specialist': 'critic',
      'meta_coordinator': 'coordinator'
    };
    
    const configKey = agentTypeMap[agent.type] || 'reasoning';
    const modelConfig = config.models[configKey];
    
    if (!modelConfig) {
      throw new Error(`No model configuration found for agent type: ${agent.type}`);
    }
    
    // Get API key based on provider
    let apiKey: string;
    if (modelConfig.provider === 'mock') {
      apiKey = 'mock-api-key';
    } else if (modelConfig.provider === 'openai') {
      apiKey = config.apiKeys.openai;
    } else if (modelConfig.provider === 'anthropic') {
      apiKey = config.apiKeys.anthropic;
    } else if (modelConfig.provider === 'google' || modelConfig.provider === 'gemini') {
      // Support both 'google' and 'gemini' as provider names
      apiKey = config.apiKeys.google || config.apiKeys.gemini || '';
    } else if (modelConfig.provider === 'lmstudio') {
      // LM Studio doesn't use API keys, pass configuration instead
      apiKey = modelConfig.config || { baseUrl: 'http://localhost:1234', timeout: 120000 };
    } else {
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }
    
    if (modelConfig.provider !== 'mock' && modelConfig.provider !== 'lmstudio' && (!apiKey || apiKey.includes('your-') || apiKey.includes('_here'))) {
      throw new Error(`Invalid API key for provider: ${modelConfig.provider}`);
    }
    
    const adapter = createModelAdapter(modelConfig.model, apiKey);
    return new LLMInterface(agent, adapter);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create model interface: ${errorMessage}`);
  }
}
