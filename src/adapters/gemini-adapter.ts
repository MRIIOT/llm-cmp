/**
 * Google Gemini Adapter for  System
 * Supports Gemini Pro, Ultra, and other Google AI models
 */

import { 
  LLMRequest, 
  LLMResponse, 
  TokenUsage, 
  LLMError 
} from '../types/index.js';
import { BaseLLMAdapter, LLMAdapterConfig } from './base-llm-adapter.js';

export interface GeminiConfig extends LLMAdapterConfig {
  projectId?: string;
  location?: string;
}

export class GeminiAdapter extends BaseLLMAdapter {
  private projectId?: string;
  private location: string;

  constructor(config: GeminiConfig) {
    super(config);
    this.projectId = config.projectId;
    this.location = config.location || 'us-central1';
  }

  protected getProviderName(): string {
    return 'gemini';
  }

  protected getDefaultBaseURL(): string {
    return `https://generativelanguage.googleapis.com/v1beta`;
  }

  protected getDefaultModel(): string {
    return 'gemini-pro';
  }

  protected prepareRequest(request: LLMRequest): any {
    const contents = [];
    
    // Add system instruction if provided (Gemini uses systemInstruction)
    let systemInstruction = undefined;
    if (request.systemPrompt) {
      systemInstruction = {
        parts: [{ text: request.systemPrompt }]
      };
    }
    
    // Add user message
    contents.push({
      role: 'user',
      parts: [{ text: request.prompt }]
    });
    
    const preparedRequest: any = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        topP: 1,
        topK: 1,
        maxOutputTokens: request.maxTokens ?? 2048,
        stopSequences: []
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
    
    if (systemInstruction) {
      preparedRequest.systemInstruction = systemInstruction;
    }
    
    return preparedRequest;
  }

  protected async makeAPICall(preparedRequest: any): Promise<any> {
    const model = preparedRequest.model || this.defaultModel;
    const endpoint = `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`;
    
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
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        
        // Handle specific Gemini errors
        if (response.status === 429) {
          throw new LLMError(
            'Rate limit exceeded',
            'RATE_LIMIT_ERROR',
            { retryAfter: response.headers.get('Retry-After') }
          );
        }
        
        if (error.error?.status === 'INVALID_ARGUMENT') {
          throw new LLMError(
            'Invalid request parameters',
            'INVALID_ARGUMENT',
            { details: error.error.message }
          );
        }
        
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
    // Check for blocked content
    if (!response.candidates || response.candidates.length === 0) {
      throw new LLMError(
        'No response generated - content may have been blocked',
        'CONTENT_BLOCKED',
        { promptFeedback: response.promptFeedback }
      );
    }
    
    const candidate = response.candidates[0];
    
    // Check finish reason
    if (candidate.finishReason === 'SAFETY') {
      throw new LLMError(
        'Response blocked due to safety filters',
        'SAFETY_FILTER',
        { safetyRatings: candidate.safetyRatings }
      );
    }
    
    const content = candidate.content.parts[0].text;
    const usage = response.usageMetadata || {};
    
    const tokenUsage: TokenUsage = {
      promptTokens: usage.promptTokenCount || this.estimateTokens(request.prompt),
      completionTokens: usage.candidatesTokenCount || this.estimateTokens(content),
      totalTokens: usage.totalTokenCount || 0,
      cost: 0 // Will be calculated
    };
    
    // Ensure totalTokens is set
    if (tokenUsage.totalTokens === 0) {
      tokenUsage.totalTokens = tokenUsage.promptTokens + tokenUsage.completionTokens;
    }
    
    // Calculate cost
    tokenUsage.cost = this.calculateCost(tokenUsage, request.model || this.defaultModel);
    
    return {
      content,
      model: request.model || this.defaultModel,
      usage: tokenUsage,
      latency: 0, // Will be set by base class
      metadata: {
        ...request.metadata,
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        citationMetadata: candidate.citationMetadata
      }
    };
  }

  protected calculateCost(usage: TokenUsage, model: string): number {
    // Pricing as of early 2024 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-pro': { input: 0.0005, output: 0.0015 },
      'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
      'gemini-ultra': { input: 0.007, output: 0.021 },
      'gemini-1.0-pro': { input: 0.0005, output: 0.0015 },
      'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
      'gemini-1.5-flash': { input: 0.00035, output: 0.00105 }
    };
    
    const modelPricing = pricing[model] || pricing['gemini-pro'];
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/models?key=${this.apiKey}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.models
        .filter((model: any) => model.supportedGenerationMethods.includes('generateContent'))
        .map((model: any) => model.name.replace('models/', ''));
        
    } catch (error) {
      console.error('Failed to fetch Gemini models:', error);
      return [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-ultra',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ];
    }
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: string): string[] {
    const capabilities = ['text-generation', 'chat'];
    
    if (model.includes('vision')) {
      capabilities.push('vision', 'image-understanding');
    }
    
    if (model.includes('ultra') || model.includes('1.5-pro')) {
      capabilities.push('advanced-reasoning', 'code-generation', 'long-context');
    }
    
    if (model.includes('1.5')) {
      capabilities.push('multimodal', 'audio', 'video');
    }
    
    return capabilities;
  }

  /**
   * Check if model supports vision
   */
  supportsVision(model: string): boolean {
    return model.includes('vision') || model.includes('1.5');
  }

  /**
   * Check if model supports multimodal input
   */
  supportsMultimodal(model: string): boolean {
    return model.includes('1.5');
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
      parts: [
        { text },
        {
          inlineData: {
            mimeType,
            data: imageBase64
          }
        }
      ]
    };
  }

  /**
   * Count tokens using Gemini's API
   */
  async countTokens(text: string, model?: string): Promise<number> {
    const targetModel = model || this.defaultModel;
    const endpoint = `${this.baseURL}/models/${targetModel}:countTokens?key=${this.apiKey}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to count tokens');
      }
      
      const data = await response.json();
      return data.totalTokens;
      
    } catch (error) {
      // Fallback to estimation
      return this.estimateTokens(text);
    }
  }

  /**
   * Get model context window
   */
  getContextWindow(model: string): number {
    const contextWindows: Record<string, number> = {
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-ultra': 32768,
      'gemini-1.0-pro': 32768,
      'gemini-1.5-pro': 1048576, // 1M tokens
      'gemini-1.5-flash': 1048576 // 1M tokens
    };
    
    return contextWindows[model] || 32768;
  }
}