/**
 * Base LLM Adapter for  System
 * Provides common functionality for all LLM providers
 */

import { 
  LLMRequest, 
  LLMResponse, 
  TokenUsage, 
  LLMError 
} from '../types/index.js';

export interface LLMAdapterConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export abstract class BaseLLMAdapter {
  protected apiKey: string;
  protected baseURL: string;
  protected defaultModel: string;
  protected timeout: number;
  protected maxRetries: number;
  protected retryDelay: number;
  
  // Metrics tracking
  protected totalRequests: number = 0;
  protected totalTokens: number = 0;
  protected totalCost: number = 0;
  protected averageLatency: number = 0;
  
  // Cache for responses (optional)
  protected cache: Map<string, LLMResponse> = new Map();
  protected cacheEnabled: boolean = false;
  protected cacheMaxSize: number = 1000;

  constructor(config: LLMAdapterConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || this.getDefaultBaseURL();
    this.defaultModel = config.defaultModel || this.getDefaultModel();
    this.timeout = config.timeout || 30000; // 30 seconds
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  /**
   * Main method to generate completion
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Check cache if enabled
    const cacheKey = this.getCacheKey(request);
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        metadata: { ...cached.metadata, fromCache: true }
      };
    }
    
    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Prepare request
        const preparedRequest = this.prepareRequest(request);
        
        // Make API call
        const response = await this.makeAPICall(preparedRequest);
        
        // Process response
        const processedResponse = this.processResponse(response, request);
        
        // Calculate metrics
        const latency = Date.now() - startTime;
        this.updateMetrics(processedResponse, latency);
        
        // Add latency to response
        const finalResponse: LLMResponse = {
          ...processedResponse,
          latency
        };
        
        // Cache if enabled
        if (this.cacheEnabled) {
          this.addToCache(cacheKey, finalResponse);
        }
        
        return finalResponse;
        
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === this.maxRetries - 1) {
          throw new LLMError(
            `LLM API call failed: ${error instanceof Error ? error.message : String(error)}`,
            'LLM_API_ERROR',
            { provider: this.getProviderName(), request, error },
            false
          );
        }
        
        // Wait before retry with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }
    
    throw new LLMError(
      `Failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      'LLM_MAX_RETRIES',
      { provider: this.getProviderName(), request, lastError }
    );
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      totalRequests: this.totalRequests,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      averageLatency: this.averageLatency,
      cacheSize: this.cache.size,
      cacheHitRate: this.getCacheHitRate()
    };
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.cache.clear();
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.totalRequests = 0;
    this.totalTokens = 0;
    this.totalCost = 0;
    this.averageLatency = 0;
  }

  // === Abstract methods to be implemented by providers ===

  protected abstract getProviderName(): string;
  protected abstract getDefaultBaseURL(): string;
  protected abstract getDefaultModel(): string;
  protected abstract prepareRequest(request: LLMRequest): any;
  protected abstract makeAPICall(preparedRequest: any): Promise<any>;
  protected abstract processResponse(response: any, request: LLMRequest): LLMResponse;
  protected abstract calculateCost(usage: TokenUsage, model: string): number;
  
  // === Helper methods ===

  protected getCacheKey(request: LLMRequest): string {
    const key = {
      model: request.model,
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    };
    return JSON.stringify(key);
  }

  protected addToCache(key: string, response: LLMResponse): void {
    // Implement LRU cache
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, response);
  }

  protected updateMetrics(response: LLMResponse, latency: number): void {
    this.totalRequests++;
    this.totalTokens += response.usage.totalTokens;
    this.totalCost += response.usage.cost;
    
    // Update average latency
    this.averageLatency = 
      (this.averageLatency * (this.totalRequests - 1) + latency) / this.totalRequests;
  }

  protected getCacheHitRate(): number {
    // This would need to track hits vs misses
    return 0; // Simplified for now
  }

  protected isRetryableError(error: any): boolean {
    // Retry on network errors or rate limits
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // Check for rate limit errors (status 429)
    if (error.status === 429 || error.statusCode === 429) {
      return true;
    }
    
    // Check for server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    return false;
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate token count (rough approximation)
   */
  protected estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    // This varies by model and tokenizer
    return Math.ceil(text.length / 4);
  }

  /**
   * Get headers for API requests
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': '-LLM-System/1.0'
    };
  }
}