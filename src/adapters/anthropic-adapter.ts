/**
 * Anthropic Adapter for  System
 * Supports Claude 3 Opus, Sonnet, and Haiku models
 */

import { 
  LLMRequest, 
  LLMResponse, 
  TokenUsage, 
  LLMError
} from '../types/index.js';
import { BaseLLMAdapter, LLMAdapterConfig } from './base-llm-adapter.js';

export interface AnthropicConfig extends LLMAdapterConfig {
  anthropicVersion?: string;
  anthropicBeta?: string;
}

export class AnthropicAdapter extends BaseLLMAdapter {
  private anthropicVersion: string;
  private anthropicBeta?: string;

  constructor(config: AnthropicConfig) {
    super(config);
    this.anthropicVersion = config.anthropicVersion || '2023-06-01';
    this.anthropicBeta = config.anthropicBeta;
  }

  protected getProviderName(): string {
    return 'anthropic';
  }

  protected getDefaultBaseURL(): string {
    return 'https://api.anthropic.com/v1';
  }

  protected getDefaultModel(): string {
    return 'claude-3-opus-20240229';
  }

  protected prepareRequest(request: LLMRequest): any {
    const messages = [];
    
    // Add user message
    messages.push({
      role: 'user',
      content: request.prompt
    });
    
    const preparedRequest: any = {
      model: request.model || this.defaultModel,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      top_p: 1,
      stream: false
    };
    
    // Add system prompt if provided
    if (request.systemPrompt) {
      preparedRequest.system = request.systemPrompt;
    }
    
    return preparedRequest;
  }

  protected async makeAPICall(preparedRequest: any): Promise<any> {
    const endpoint = `${this.baseURL}/messages`;
    
    const headers: Record<string, string> = {
      ...this.getHeaders(),
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion
    };
    
    if (this.anthropicBeta) {
      headers['anthropic-beta'] = this.anthropicBeta;
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
    const content = response.content[0].text;
    const usage = response.usage;
    
    const tokenUsage: TokenUsage = {
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
      cost: this.calculateCost(
        { 
          promptTokens: usage.input_tokens, 
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
          cost: 0
        }, 
        request.model || this.defaultModel
      )
    };
    
    return {
      content,
      model: response.model,
      usage: tokenUsage,
      latency: 0, // Will be set by base class
      metadata: {
        ...request.metadata,
        stopReason: response.stop_reason,
        id: response.id
      }
    };
  }

  protected calculateCost(usage: TokenUsage, model: string): number {
    // Pricing as of early 2024 (per 1M tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'claude-2.1': { input: 8, output: 24 },
      'claude-2.0': { input: 8, output: 24 },
      'claude-instant-1.2': { input: 0.8, output: 2.4 }
    };
    
    const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229'];
    
    const inputCost = (usage.promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a list models endpoint, so we return known models
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  /**
   * Get model context window size
   */
  getContextWindow(model: string): number {
    const contextWindows: Record<string, number> = {
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
      'claude-2.1': 200000,
      'claude-2.0': 100000,
      'claude-instant-1.2': 100000
    };
    
    return contextWindows[model] || 100000;
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: string): string[] {
    const capabilities = ['text-generation', 'chat', 'analysis'];
    
    if (model.includes('claude-3')) {
      capabilities.push('vision', 'advanced-reasoning', 'code-generation');
    }
    
    if (model.includes('opus')) {
      capabilities.push('complex-reasoning', 'creative-writing');
    }
    
    return capabilities;
  }

  /**
   * Check if model supports vision
   */
  supportsVision(model: string): boolean {
    return model.includes('claude-3');
  }

  /**
   * Format a message with an image
   */
  formatImageMessage(text: string, imageBase64: string, mimeType: string = 'image/jpeg'): any {
    if (!this.supportsVision(this.defaultModel)) {
      throw new LLMError(
        'Current model does not support vision',
        'VISION_NOT_SUPPORTED',
        { model: this.defaultModel }
      );
    }
    
    return {
      role: 'user',
      content: [
        {
          type: 'text',
          text: text
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: imageBase64
          }
        }
      ]
    };
  }
}