/**
 * OpenAI Adapter for  System
 * Supports GPT-4, GPT-3.5, and other OpenAI models
 */

import { 
  LLMRequest, 
  LLMResponse, 
  TokenUsage, 
  LLMError 
} from '../types/index.js';
import { BaseLLMAdapter, LLMAdapterConfig } from './base-llm-adapter.js';

export interface OpenAIConfig extends LLMAdapterConfig {
  organization?: string;
  azureDeployment?: string; // For Azure OpenAI
}

export class OpenAIAdapter extends BaseLLMAdapter {
  private organization?: string;
  private azureDeployment?: string;
  private isAzure: boolean;

  constructor(config: OpenAIConfig) {
    super(config);
    this.organization = config.organization;
    this.azureDeployment = config.azureDeployment;
    this.isAzure = !!config.azureDeployment;
  }

  protected getProviderName(): string {
    return this.isAzure ? 'azure-openai' : 'openai';
  }

  protected getDefaultBaseURL(): string {
    return this.isAzure 
      ? `https://${this.azureDeployment}.openai.azure.com`
      : 'https://api.openai.com/v1';
  }

  protected getDefaultModel(): string {
    return 'gpt-4-turbo-preview';
  }

  protected prepareRequest(request: LLMRequest): any {
    const messages = [];
    
    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });
    
    return {
      model: request.model || this.defaultModel,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
      stream: false
    };
  }

  protected async makeAPICall(preparedRequest: any): Promise<any> {
    const endpoint = this.isAzure 
      ? `${this.baseURL}/openai/deployments/${preparedRequest.model}/chat/completions?api-version=2024-02-15-preview`
      : `${this.baseURL}/chat/completions`;
    
    const headers: Record<string, string> = this.isAzure
      ? {
          ...this.getHeaders(),
          'api-key': this.apiKey
        }
      : {
          ...this.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        };
    
    if (this.organization && !this.isAzure) {
      headers['OpenAI-Organization'] = this.organization;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(preparedRequest),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new LLMError(
          'Request timed out',
          'TIMEOUT_ERROR',
          { timeout: this.timeout }
        );
      }
      
      throw error;
    }
  }

  protected processResponse(response: any, request: LLMRequest): LLMResponse {
    const choice = response.choices[0];
    const usage = response.usage;
    
    const tokenUsage: TokenUsage = {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost: this.calculateCost(
        { 
          promptTokens: usage.prompt_tokens, 
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          cost: 0
        }, 
        request.model || this.defaultModel
      )
    };
    
    return {
      content: choice.message.content,
      model: response.model,
      usage: tokenUsage,
      latency: 0, // Will be set by base class
      metadata: {
        ...request.metadata,
        finishReason: choice.finish_reason,
        systemFingerprint: response.system_fingerprint
      }
    };
  }

  protected calculateCost(usage: TokenUsage, model: string): number {
    // Pricing as of early 2024 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
    };
    
    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    if (this.isAzure) {
      // Azure doesn't have a list models endpoint
      return [
        'gpt-4-turbo',
        'gpt-4',
        'gpt-35-turbo',
        'gpt-35-turbo-16k'
      ];
    }
    
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.startsWith('gpt'))
        .map((model: any) => model.id);
        
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k'
      ];
    }
  }

  /**
   * Check if a model supports function calling
   */
  supportsFunctionCalling(model: string): boolean {
    const functionModels = [
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
    
    return functionModels.some(m => model.includes(m));
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: string): string[] {
    const capabilities = ['text-generation', 'chat'];
    
    if (this.supportsFunctionCalling(model)) {
      capabilities.push('function-calling');
    }
    
    if (model.includes('gpt-4')) {
      capabilities.push('advanced-reasoning', 'code-generation');
    }
    
    return capabilities;
  }
}