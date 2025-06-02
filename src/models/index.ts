// Model Interface Layer Exports
// Centralized exports for all model-related components

// Base adapter and types
export { ModelAPIAdapter, APIError } from './model-adapter';
export type { ModelResponse, ModelOptions } from './model-adapter';

// Specific API adapters
export { OpenAIAdapter } from './openai-adapter';
export { AnthropicAdapter } from './anthropic-adapter';

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
import { LLMInterface } from './llm-interface';

// Factory function for creating adapters based on model type
export function createModelAdapter(modelType: string, apiKey: string): ModelAPIAdapter {
  if (modelType.startsWith('gpt-') || modelType.includes('openai')) {
    return new OpenAIAdapter(modelType, apiKey);
  } else if (modelType.startsWith('claude-') || modelType.includes('anthropic')) {
    return new AnthropicAdapter(modelType, apiKey);
  } else {
    throw new Error(`Unsupported model type: ${modelType}`);
  }
}

// Factory function for creating LLM interfaces
export function createLLMInterface(agent: any, modelType: string, apiKey: string): LLMInterface {
  const adapter = createModelAdapter(modelType, apiKey);
  return new LLMInterface(agent, adapter);
}
