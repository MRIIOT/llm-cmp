// Model API Adapter Interface
// Abstract base class for different LLM API implementations

export interface ModelResponse {
  id: string;
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
  model: string;
  finish_reason?: string;
}

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export abstract class ModelAPIAdapter {
  protected requestCount: number = 0;
  protected cache: Map<string, ModelResponse> = new Map();
  
  constructor(
    public readonly modelType: string,
    protected readonly apiKey: string,
    protected readonly baseURL: string
  ) {}

  abstract generateCompletion(prompt: string, options?: ModelOptions): Promise<ModelResponse>;

  get tokenLimit(): number {
    const limits: Record<string, number> = {
      'gpt-4-turbo': 128000,
      'gpt-4': 32000,
      'gpt-4o': 128000,
      'claude-3-opus': 200000,
      'claude-3-sonnet': 200000,
      'claude-3-haiku': 200000,
      'claude-3.5-sonnet': 200000,
      'llama-2-70b': 4096,
      'gemini-pro': 32000
    };
    return limits[this.modelType] || 4096;
  }

  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  truncateToTokenLimit(text: string, reserveTokens: number = 1000): string {
    const maxChars = (this.tokenLimit - reserveTokens) * 4;
    return text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
  }

  protected generateCacheKey(prompt: string, options: ModelOptions = {}): string {
    const optionsKey = JSON.stringify(options);
    return `${this.modelType}_${prompt.substring(0, 50)}_${optionsKey}`;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
