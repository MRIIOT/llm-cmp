/**
 * LLM Adapters for  System
 * Export all adapters and provide factory functions
 */

export * from './base-llm-adapter.js';
export * from './openai-adapter.js';
export * from './anthropic-adapter.js';
export * from './lmstudio-adapter.js';
export * from './gemini-adapter.js';

import { BaseLLMAdapter, LLMAdapterConfig } from './base-llm-adapter.js';
import { OpenAIAdapter, OpenAIConfig } from './openai-adapter.js';
import { AnthropicAdapter, AnthropicConfig } from './anthropic-adapter.js';
import { LMStudioAdapter, LMStudioConfig } from './lmstudio-adapter.js';
import { GeminiAdapter, GeminiConfig } from './gemini-adapter.js';
import { LLMError } from '../types/index.js';

export type AdapterType = 'openai' | 'anthropic' | 'lmstudio' | 'gemini' | 'azure-openai';

export interface AdapterFactoryConfig {
  type: AdapterType;
  config: LLMAdapterConfig | OpenAIConfig | AnthropicConfig | LMStudioConfig | GeminiConfig;
}

/**
 * Factory function to create LLM adapters
 */
export function createLLMAdapter(params: AdapterFactoryConfig): BaseLLMAdapter {
  const { type, config } = params;
  
  switch (type) {
    case 'openai':
      return new OpenAIAdapter(config as OpenAIConfig);
      
    case 'azure-openai':
      // Azure OpenAI uses the same adapter with specific config
      return new OpenAIAdapter({
        ...config as OpenAIConfig,
        azureDeployment: (config as any).azureDeployment || 'default'
      });
      
    case 'anthropic':
      return new AnthropicAdapter(config as AnthropicConfig);
      
    case 'lmstudio':
      return new LMStudioAdapter(config as LMStudioConfig);
      
    case 'gemini':
      return new GeminiAdapter(config as GeminiConfig);
      
    default:
      throw new LLMError(
        `Unknown adapter type: ${type}`,
        'UNKNOWN_ADAPTER_TYPE',
        { type }
      );
  }
}

/**
 * Create multiple adapters from configuration
 */
export function createAdapters(configs: AdapterFactoryConfig[]): Map<string, BaseLLMAdapter> {
  const adapters = new Map<string, BaseLLMAdapter>();
  
  for (const config of configs) {
    const adapter = createLLMAdapter(config);
    adapters.set(config.type, adapter);
  }
  
  return adapters;
}

/**
 * Default adapter configurations for quick setup
 */
export const DEFAULT_ADAPTER_CONFIGS: Record<AdapterType, Partial<LLMAdapterConfig>> = {
  'openai': {
    defaultModel: 'gpt-4-turbo-preview',
    timeout: 30000,
    maxRetries: 3
  },
  'azure-openai': {
    defaultModel: 'gpt-4',
    timeout: 30000,
    maxRetries: 3
  },
  'anthropic': {
    defaultModel: 'claude-3-opus-20240229',
    timeout: 45000,
    maxRetries: 3
  },
  'lmstudio': {
    defaultModel: 'current',
    timeout: 60000,
    maxRetries: 2
  },
  'gemini': {
    defaultModel: 'gemini-pro',
    timeout: 30000,
    maxRetries: 3
  }
};

/**
 * Helper to validate API keys
 */
export function validateApiKey(type: AdapterType, apiKey: string): boolean {
  if (type === 'lmstudio') {
    return true; // LM Studio doesn't need API key
  }
  
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }
  
  // Basic format validation
  const patterns: Record<string, RegExp> = {
    'openai': /^sk-[a-zA-Z0-9]{48}$/,
    'azure-openai': /^[a-zA-Z0-9]{32}$/,
    'anthropic': /^sk-ant-[a-zA-Z0-9-_]{40,}$/,
    'gemini': /^[a-zA-Z0-9-_]{39}$/
  };
  
  const pattern = patterns[type];
  return pattern ? pattern.test(apiKey) : true;
}

/**
 * Get recommended model for a specific use case
 */
export function getRecommendedModel(
  useCase: 'reasoning' | 'creative' | 'code' | 'chat' | 'analysis',
  adapters: Map<string, BaseLLMAdapter>
): { adapter: BaseLLMAdapter; model: string } | null {
  const recommendations: Record<string, { type: AdapterType; model: string }> = {
    'reasoning': { type: 'openai', model: 'gpt-4-turbo-preview' },
    'creative': { type: 'anthropic', model: 'claude-3-opus-20240229' },
    'code': { type: 'openai', model: 'gpt-4-turbo-preview' },
    'chat': { type: 'anthropic', model: 'claude-3-sonnet-20240229' },
    'analysis': { type: 'gemini', model: 'gemini-1.5-pro' }
  };
  
  const rec = recommendations[useCase];
  if (!rec) return null;
  
  const adapter = adapters.get(rec.type);
  if (!adapter) {
    // Fallback to any available adapter
    const available = Array.from(adapters.values())[0];
    if (available) {
      return { adapter: available, model: available['defaultModel'] };
    }
    return null;
  }
  
  return { adapter, model: rec.model };
}

/**
 * Test all configured adapters
 */
export async function testAdapters(
  adapters: Map<string, BaseLLMAdapter>
): Promise<Map<string, { success: boolean; error?: string; latency?: number }>> {
  const results = new Map<string, { success: boolean; error?: string; latency?: number }>();
  
  for (const [type, adapter] of adapters) {
    const startTime = Date.now();
    
    try {
      const response = await adapter.generateCompletion({
        model: adapter['defaultModel'],
        prompt: 'Hello, please respond with "OK" to confirm you are working.',
        systemPrompt: 'You are a helpful assistant. Respond only with "OK".',
        temperature: 0,
        maxTokens: 10,
        metadata: { test: true }
      });
      
      const success = response.content.toLowerCase().includes('ok');
      results.set(type, {
        success,
        latency: Date.now() - startTime,
        error: success ? undefined : 'Invalid response'
      });
      
    } catch (error: any) {
      results.set(type, {
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      });
    }
  }
  
  return results;
}