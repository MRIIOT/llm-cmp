// OpenAI API Adapter Implementation
// Handles OpenAI-specific API calls and response formats

import axios, { AxiosResponse } from 'axios';
import { ModelAPIAdapter, ModelResponse, ModelOptions, APIError } from './model-adapter';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIAdapter extends ModelAPIAdapter {
  constructor(modelType: string, apiKey: string) {
    super(modelType, apiKey, 'https://api.openai.com/v1');
  }

  async generateCompletion(prompt: string, options: ModelOptions = {}): Promise<ModelResponse> {
    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`🔄 Cache hit for ${this.modelType}`);
      return this.cache.get(cacheKey)!;
    }

    const messages: OpenAIMessage[] = [];
    
    // Add system message if provided
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: this.truncateToTokenLimit(prompt, options.maxTokens || 2000)
    });

    const payload: OpenAIRequest = {
      model: this.modelType,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 1.0
    };

    try {
      console.log(`📡 OpenAI API call to ${this.modelType}`);
      
      const response: AxiosResponse<OpenAIResponse> = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
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
      console.error(`❌ OpenAI API error for ${this.modelType}:`, error.message);
      
      if (error.response) {
        const statusCode = error.response.status;
        const isRetryable = statusCode >= 500 || statusCode === 429;
        
        throw new APIError(
          `OpenAI ${this.modelType} failed: ${error.response.data?.error?.message || error.message}`,
          statusCode,
          isRetryable
        );
      } else if (error.code === 'ECONNABORTED') {
        throw new APIError(`OpenAI ${this.modelType} timeout`, undefined, true);
      } else {
        throw new APIError(`OpenAI ${this.modelType} network error: ${error.message}`, undefined, true);
      }
    }
  }

  private transformResponse(response: OpenAIResponse): ModelResponse {
    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new APIError('Invalid OpenAI response format');
    }

    return {
      id: response.id,
      content: choice.message.content,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      },
      model: response.model,
      finish_reason: choice.finish_reason
    };
  }

  // Utility method for streaming responses (future enhancement)
  async generateCompletionStream(prompt: string, options: ModelOptions = {}): Promise<AsyncIterable<string>> {
    throw new Error('Streaming not yet implemented for OpenAI adapter');
  }
}
