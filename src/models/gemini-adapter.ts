// Google Gemini API Adapter Implementation
// Handles Google AI Studio API calls for Gemini Pro/Ultra models

import axios, { AxiosResponse } from 'axios';
import { ModelAPIAdapter, ModelResponse, ModelOptions, APIError } from './model-adapter';

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
  role?: 'user' | 'model';
}

interface GeminiGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

interface GeminiSafetySettings {
  category: string;
  threshold: string;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
  safetySettings?: GeminiSafetySettings[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
}

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason: string;
  index: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
}

export class GeminiAdapter extends ModelAPIAdapter {
  constructor(modelType: string, apiKey: string) {
    super(modelType, apiKey, 'https://generativelanguage.googleapis.com/v1beta');
  }

  async generateCompletion(prompt: string, options: ModelOptions = {}): Promise<ModelResponse> {
    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`🔄 Cache hit for ${this.modelType}`);
      return this.cache.get(cacheKey)!;
    }

    // Build request contents
    const contents: GeminiContent[] = [
      {
        parts: [{ text: this.truncateToTokenLimit(prompt, options.maxTokens || 2000) }],
        role: 'user'
      }
    ];

    const payload: GeminiRequest = {
      contents,
      generationConfig: {
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.95,
        topK: 40,
        maxOutputTokens: options.maxTokens || 2000
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    // Add system instruction if provided
    if (options.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: options.systemPrompt }]
      };
    }

    try {
      console.log(`📡 Gemini API call to ${this.modelType}`);
      
      const response: AxiosResponse<GeminiResponse> = await axios.post(
        `${this.baseURL}/models/${this.modelType}:generateContent?key=${this.apiKey}`,
        payload,
        {
          headers: {
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
      console.error(`❌ Gemini API error for ${this.modelType}:`, error.message);
      
      if (error.response) {
        const statusCode = error.response.status;
        const isRetryable = statusCode >= 500 || statusCode === 429;
        
        // Handle specific Gemini API errors
        const errorData = error.response.data;
        let errorMessage = `Gemini ${this.modelType} failed`;
        
        if (errorData?.error?.message) {
          errorMessage += `: ${errorData.error.message}`;
        } else if (errorData?.error?.details) {
          errorMessage += `: ${JSON.stringify(errorData.error.details)}`;
        } else {
          errorMessage += `: ${error.message}`;
        }
        
        throw new APIError(errorMessage, statusCode, isRetryable);
      } else if (error.code === 'ECONNABORTED') {
        throw new APIError(`Gemini ${this.modelType} timeout`, undefined, true);
      } else {
        throw new APIError(`Gemini ${this.modelType} network error: ${error.message}`, undefined, true);
      }
    }
  }

  private transformResponse(response: GeminiResponse): ModelResponse {
    if (!response.candidates || response.candidates.length === 0) {
      throw new APIError('No candidates in Gemini response');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new APIError('Invalid Gemini response format - no content parts');
    }

    // Combine all text parts
    const content = candidate.content.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join('');

    if (!content) {
      throw new APIError('No text content in Gemini response');
    }

    // Generate a unique ID since Gemini doesn't provide one
    const id = `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      content,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || this.estimateTokens(content),
        completion_tokens: response.usageMetadata?.candidatesTokenCount || this.estimateTokens(content),
        total_tokens: response.usageMetadata?.totalTokenCount || this.estimateTokens(content) * 2
      },
      model: this.modelType,
      finish_reason: this.mapFinishReason(candidate.finishReason)
    };
  }

  private mapFinishReason(geminiReason: string): string {
    // Map Gemini finish reasons to standard format
    const reasonMap: Record<string, string> = {
      'STOP': 'stop',
      'MAX_TOKENS': 'length',
      'SAFETY': 'content_filter',
      'RECITATION': 'content_filter',
      'OTHER': 'stop'
    };
    
    return reasonMap[geminiReason] || 'stop';
  }

  // Override token limit getter for Gemini models
  get tokenLimit(): number {
    const limits: Record<string, number> = {
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-ultra': 32768,
      'gemini-1.0-pro': 32768,
      'gemini-1.5-pro': 1048576, // 1M tokens
      'gemini-1.5-flash': 1048576
    };
    return limits[this.modelType] || 32768;
  }

  // Utility method for streaming responses (future enhancement)
  async generateCompletionStream(prompt: string, options: ModelOptions = {}): Promise<AsyncIterable<string>> {
    throw new Error('Streaming not yet implemented for Gemini adapter');
  }

  // Helper method to check if model supports vision
  supportsVision(): boolean {
    return this.modelType.includes('vision') || this.modelType.includes('1.5');
  }

  // Helper method to validate API key format
  static validateApiKey(apiKey: string): boolean {
    // Google AI Studio API keys typically start with 'AIza' and are 39 characters long
    return apiKey.startsWith('AIza') && apiKey.length === 39;
  }

  // Method to get available models (informational)
  static getAvailableModels(): string[] {
    return [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-ultra',
      'gemini-1.0-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
  }

  // Method to get recommended model for agent type
  static getRecommendedModel(agentType: string): string {
    const recommendations: Record<string, string> = {
      'reasoning': 'gemini-1.5-pro',     // Best for complex reasoning
      'creative': 'gemini-pro',          // Good balance for creativity
      'factual': 'gemini-1.5-pro',      // Best for factual accuracy
      'code': 'gemini-1.5-pro',         // Best for code understanding
      'social': 'gemini-pro',           // Good for social understanding
      'critical': 'gemini-1.5-pro',     // Best for critical analysis
      'coordinator': 'gemini-1.5-pro'   // Best for synthesis
    };
    
    return recommendations[agentType] || 'gemini-pro';
  }
}
