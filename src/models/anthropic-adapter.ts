// Anthropic API Adapter Implementation  
// Handles Anthropic Claude-specific API calls and response formats

import axios, { AxiosResponse } from 'axios';
import { ModelAPIAdapter, ModelResponse, ModelOptions, APIError } from './model-adapter';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  temperature?: number;
  system?: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens?: number;
  };
}

export class AnthropicAdapter extends ModelAPIAdapter {
  constructor(modelType: string, apiKey: string) {
    super(modelType, apiKey, 'https://api.anthropic.com/v1');
  }

  async generateCompletion(prompt: string, options: ModelOptions = {}): Promise<ModelResponse> {
    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`🔄 Cache hit for ${this.modelType}`);
      return this.cache.get(cacheKey)!;
    }

    const messages: AnthropicMessage[] = [
      {
        role: 'user',
        content: this.truncateToTokenLimit(prompt, options.maxTokens || 2000)
      }
    ];

    const payload: AnthropicRequest = {
      model: this.modelType,
      max_tokens: options.maxTokens || 2000,
      messages,
      temperature: options.temperature || 0.7
    };

    // Add system prompt if provided
    if (options.systemPrompt) {
      payload.system = options.systemPrompt;
    }

    try {
      console.log(`📡 Anthropic API call to ${this.modelType}`);
      
      const response: AxiosResponse<AnthropicResponse> = await axios.post(
        `${this.baseURL}/messages`,
        payload,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      const modelResponse = this.transformResponse(response.data);
      
      // Cache successful response
      this.cache.set(cacheKey, modelResponse);
      this.requestCount++;
      
      return modelResponse;

    } catch (error: any) {
      console.error(`❌ Anthropic API error for ${this.modelType}:`, error.message);
      
      if (error.response) {
        const statusCode = error.response.status;
        const isRetryable = statusCode >= 500 || statusCode === 429;
        
        throw new APIError(
          `Anthropic ${this.modelType} failed: ${error.response.data?.error?.message || error.message}`,
          statusCode,
          isRetryable
        );
      } else if (error.code === 'ECONNABORTED') {
        throw new APIError(`Anthropic ${this.modelType} timeout`, undefined, true);
      } else {
        throw new APIError(`Anthropic ${this.modelType} network error: ${error.message}`, undefined, true);
      }
    }
  }

  private transformResponse(response: AnthropicResponse): ModelResponse {
    if (!response.content || response.content.length === 0) {
      throw new APIError('Invalid Anthropic response format');
    }

    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    if (!textContent) {
      throw new APIError('No text content in Anthropic response');
    }

    return {
      id: response.id,
      content: textContent,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      finish_reason: response.stop_reason
    };
  }

  // Utility method for streaming responses (future enhancement)
  async generateCompletionStream(prompt: string, options: ModelOptions = {}): Promise<AsyncIterable<string>> {
    throw new Error('Streaming not yet implemented for Anthropic adapter');
  }
}
