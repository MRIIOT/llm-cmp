/**
 * LM Studio Adapter for  System
 * Supports local models running in LM Studio
 */

import { 
  LLMRequest, 
  LLMResponse, 
  TokenUsage, 
  LLMError 
} from '../types/index.js';
import { BaseLLMAdapter, LLMAdapterConfig } from './base-llm-adapter.js';

export interface LMStudioConfig extends LLMAdapterConfig {
  port?: number;
  enableGPU?: boolean;
}

export class LMStudioAdapter extends BaseLLMAdapter {
  private port: number;
  private enableGPU: boolean;
  private isConnected: boolean = false;

  constructor(config: LMStudioConfig) {
    // LM Studio doesn't need an API key
    super({ ...config, apiKey: config.apiKey || 'not-required' });
    this.port = config.port || 1234;
    this.enableGPU = config.enableGPU ?? true;
    
    // Update base URL with port
    this.baseURL = `http://localhost:${this.port}/v1`;
  }

  protected getProviderName(): string {
    return 'lmstudio';
  }

  protected getDefaultBaseURL(): string {
    return `http://localhost:${this.port}/v1`;
  }

  protected getDefaultModel(): string {
    // LM Studio uses the currently loaded model
    return 'current';
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
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
      stream: false,
      // LM Studio specific options
      stop: [],
      repeat_penalty: 1.1
    };
  }

  protected async makeAPICall(preparedRequest: any): Promise<any> {
    const endpoint = `${this.baseURL}/chat/completions`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(preparedRequest),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new LLMError(
            'LM Studio is not running or no model is loaded',
            'LMSTUDIO_NOT_READY',
            { port: this.port }
          );
        }
        
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }
      
      this.isConnected = true;
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
      
      if (error.code === 'ECONNREFUSED') {
        throw new LLMError(
          'Cannot connect to LM Studio. Make sure it is running.',
          'CONNECTION_REFUSED',
          { port: this.port }
        );
      }
      
      throw error;
    }
  }

  protected processResponse(response: any, request: LLMRequest): LLMResponse {
    const choice = response.choices[0];
    const usage = response.usage || {};
    
    // LM Studio might not provide detailed token counts
    const promptTokens = usage.prompt_tokens || this.estimateTokens(request.prompt);
    const completionTokens = usage.completion_tokens || this.estimateTokens(choice.message.content);
    
    const tokenUsage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens: usage.total_tokens || (promptTokens + completionTokens),
      cost: 0 // Local models have no API cost
    };
    
    return {
      content: choice.message.content,
      model: response.model || 'local-model',
      usage: tokenUsage,
      latency: 0, // Will be set by base class
      metadata: {
        ...request.metadata,
        finishReason: choice.finish_reason,
        localModel: true,
        gpuEnabled: this.enableGPU
      }
    };
  }

  protected calculateCost(usage: TokenUsage, model: string): number {
    // Local models have no API cost
    return 0;
  }

  /**
   * Check if LM Studio is running
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      this.isConnected = response.ok;
      return response.ok;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get currently loaded model info
   */
  async getCurrentModel(): Promise<any> {
    if (!await this.checkConnection()) {
      throw new LLMError(
        'LM Studio is not connected',
        'NOT_CONNECTED',
        { port: this.port }
      );
    }
    
    try {
      const response = await fetch(`${this.baseURL}/models`);
      
      if (!response.ok) {
        throw new Error('Failed to get model info');
      }
      
      const data = await response.json();
      return data.data?.[0] || null;
      
    } catch (error) {
      throw new LLMError(
        'Failed to get current model info',
        'MODEL_INFO_ERROR',
        { error }
      );
    }
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<any> {
    try {
      const modelInfo = await this.getCurrentModel();
      
      return {
        connected: true,
        port: this.port,
        model: modelInfo?.id || 'Unknown',
        gpuEnabled: this.enableGPU,
        ready: !!modelInfo
      };
    } catch (error) {
      return {
        connected: false,
        port: this.port,
        model: null,
        gpuEnabled: this.enableGPU,
        ready: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Wait for LM Studio to be ready
   */
  async waitForReady(maxAttempts: number = 30, delayMs: number = 1000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.checkConnection()) {
        const model = await this.getCurrentModel();
        if (model) {
          return;
        }
      }
      
      if (i < maxAttempts - 1) {
        await this.delay(delayMs);
      }
    }
    
    throw new LLMError(
      'LM Studio did not become ready in time',
      'TIMEOUT_WAITING_FOR_READY',
      { maxAttempts, delayMs }
    );
  }

  /**
   * Get model capabilities (for local models, we estimate)
   */
  getModelCapabilities(model: string): string[] {
    // Basic capabilities that most local models support
    const capabilities = ['text-generation', 'chat'];
    
    // Add capabilities based on model name patterns
    if (model.toLowerCase().includes('code')) {
      capabilities.push('code-generation');
    }
    
    if (model.toLowerCase().includes('instruct') || model.toLowerCase().includes('chat')) {
      capabilities.push('instruction-following');
    }
    
    return capabilities;
  }

  /**
   * Get recommended settings for different model types
   */
  getRecommendedSettings(modelType: string): any {
    const settings: Record<string, any> = {
      'llama': {
        temperature: 0.7,
        top_p: 0.95,
        repeat_penalty: 1.1,
        max_tokens: 2048
      },
      'mistral': {
        temperature: 0.7,
        top_p: 0.95,
        repeat_penalty: 1.15,
        max_tokens: 4096
      },
      'phi': {
        temperature: 0.7,
        top_p: 0.95,
        repeat_penalty: 1.1,
        max_tokens: 2048
      },
      'codellama': {
        temperature: 0.2,
        top_p: 0.95,
        repeat_penalty: 1.0,
        max_tokens: 4096
      }
    };
    
    // Find matching settings based on model type
    for (const [key, value] of Object.entries(settings)) {
      if (modelType.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    // Default settings
    return {
      temperature: 0.7,
      top_p: 0.95,
      repeat_penalty: 1.1,
      max_tokens: 2048
    };
  }
}