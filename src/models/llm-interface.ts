// LLM Interface
// Bridges CMP abstract concepts to real LLM API calls

import { LLMAgent } from '../core/llm-agent';
import { ModelAPIAdapter, ModelOptions } from './model-adapter';
import { PromptTemplateManager, PromptContext } from './prompt-template-manager';
import { ResponseParser, ParsedResponse } from './response-parser';
import { LLM_AGENT_TYPES } from '../types';

export interface CMPMessage {
  type: string;
  reasoning: any[];
  semantic_pose: any;
  confidence: number;
  header?: {
    sender?: string;
    specialization?: string;
  };
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
}

export class LLMInterface {
  private promptTemplates: PromptTemplateManager;
  private responseParser: ResponseParser;
  private retryConfig: RetryConfig;

  constructor(
    private agent: LLMAgent,
    private modelAdapter: ModelAPIAdapter
  ) {
    this.promptTemplates = new PromptTemplateManager();
    this.responseParser = new ResponseParser();
    this.retryConfig = { maxRetries: 3, backoffMs: 1000 };
  }

  // Main method: Convert CMP message to LLM prompt, call API, parse response
  async processCMPMessage(cmpMessage: CMPMessage, context: any = {}): Promise<ParsedResponse> {
    console.log(`\n🔄 ${this.agent.type} processing CMP message...`);
    
    try {
      // 1. Extract CMP components
      const { type, reasoning, semantic_pose, confidence } = cmpMessage;
      
      // 2. Build specialized prompt based on agent type and message type
      const promptContext: PromptContext = {
        query: context.query,
        reasoning: reasoning,
        context: context,
        evidence: context.evidence,
        votes: context.votes
      };
      
      const prompt = this.promptTemplates.buildPrompt(
        this.agent.specialization,
        type.toLowerCase(),
        promptContext
      );
      
      // 3. Get model parameters based on agent type
      const options = this.getModelOptions();
      
      // 4. Call LLM with retry logic
      const response = await this.callLLMWithRetry(prompt, options);
      
      // 5. Parse response back to CMP format
      const cmpResponse = this.responseParser.parseToCMP(
        response,
        this.agent.type,
        semantic_pose
      );
      
      console.log(`   ✅ ${this.agent.type} generated ${cmpResponse.reasoning.length} reasoning steps`);
      console.log(`   📊 Confidence: ${cmpResponse.confidence.toFixed(3)}`);
      
      return cmpResponse;
      
    } catch (error) {
      console.error(`❌ ${this.agent.type} processing failed:`, error);
      return this.generateErrorResponse(cmpMessage, error as Error);
    }
  }

  // Get model-specific parameters for each agent type
  private getModelOptions(): ModelOptions {
    const agentOptions: Record<string, ModelOptions> = {
      [LLM_AGENT_TYPES.REASONING]: {
        temperature: 0.1,  // Low temp for logical consistency
        maxTokens: 3000,   // Longer for detailed reasoning
        systemPrompt: 'You are a logical reasoning specialist. Provide step-by-step analysis with clear premises, inferences, and conclusions. Be precise and methodical.'
      },
      [LLM_AGENT_TYPES.CREATIVE]: {
        temperature: 0.8,  // High temp for creativity
        maxTokens: 2500,
        systemPrompt: 'You are a creative thinking specialist. Generate innovative ideas and novel approaches. Think outside conventional boundaries.'
      },
      [LLM_AGENT_TYPES.FACTUAL]: {
        temperature: 0.2,  // Low temp for accuracy
        maxTokens: 2000,
        systemPrompt: 'You are a fact-checking specialist. Provide accurate, verifiable information with sources when possible. Focus on empirical evidence.'
      },
      [LLM_AGENT_TYPES.CODE]: {
        temperature: 0.1,  // Very low for code correctness
        maxTokens: 4000,   // Longer for code examples
        systemPrompt: 'You are a programming specialist. Provide clean, efficient, well-documented code solutions. Focus on best practices and implementation details.'
      },
      [LLM_AGENT_TYPES.SOCIAL]: {
        temperature: 0.6,  // Medium temp for natural communication
        maxTokens: 2000,
        systemPrompt: 'You are a communication specialist. Consider human factors, empathy, and social dynamics. Focus on user experience and stakeholder needs.'
      },
      [LLM_AGENT_TYPES.CRITIC]: {
        temperature: 0.3,  // Low-medium for critical analysis
        maxTokens: 2500,
        systemPrompt: 'You are a critical analysis specialist. Identify potential issues, limitations, and improvements. Be thorough in finding weaknesses.'
      },
      [LLM_AGENT_TYPES.COORDINATOR]: {
        temperature: 0.4,  // Balanced for synthesis
        maxTokens: 3000,
        systemPrompt: 'You are a coordination specialist. Synthesize multiple perspectives and provide balanced integration. Focus on high-level orchestration.'
      }
    };
    
    return agentOptions[this.agent.type] || { 
      temperature: 0.7, 
      maxTokens: 2000,
      systemPrompt: 'You are a helpful AI assistant. Provide thoughtful and accurate responses.'
    };
  }

  // Retry logic for API calls with exponential backoff
  private async callLLMWithRetry(prompt: string, options: ModelOptions, attempt: number = 1): Promise<any> {
    try {
      return await this.modelAdapter.generateCompletion(prompt, options);
    } catch (error: any) {
      if (attempt >= this.retryConfig.maxRetries) {
        throw error;
      }
      
      // Check if error is retryable
      if (error.retryable !== false) {
        console.log(`   🔄 Retry ${attempt + 1}/${this.retryConfig.maxRetries} for ${this.agent.type}`);
        
        // Exponential backoff
        const delay = this.retryConfig.backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.callLLMWithRetry(prompt, options, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  // Generate error response in CMP format
  private generateErrorResponse(originalMessage: CMPMessage, error: Error): ParsedResponse {
    return {
      reasoning: [{
        type: 'error',
        concept: 'processing_failure',
        content: `Failed to process: ${error.message}`,
        confidence: 0.1
      }],
      semantic_pose: originalMessage.semantic_pose,
      confidence: 0.1,
      raw_response: `Error: ${error.message}`,
      token_usage: { total_tokens: 0 },
      error: true
    };
  }

  // Utility methods for debugging and monitoring
  getModelInfo(): { modelType: string; requestCount: number; cacheSize: number } {
    return {
      modelType: this.modelAdapter.modelType,
      requestCount: this.modelAdapter.getRequestCount(),
      cacheSize: this.modelAdapter.getCacheSize()
    };
  }

  getAvailablePromptTypes(): string[] {
    return this.promptTemplates.getAvailableMessageTypes(this.agent.specialization);
  }

  // Configure retry behavior
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  // Clear model adapter cache
  clearCache(): void {
    this.modelAdapter.clearCache();
  }

  // Test connection to model API
  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = 'Test connection. Respond with "OK".';
      const response = await this.modelAdapter.generateCompletion(testPrompt, {
        maxTokens: 10,
        temperature: 0
      });
      
      return response.content.trim().toLowerCase().includes('ok');
    } catch (error) {
      console.error(`Connection test failed for ${this.agent.type}:`, error);
      return false;
    }
  }

  // Get prompt preview for debugging
  previewPrompt(messageType: string, context: PromptContext): string {
    return this.promptTemplates.buildPrompt(
      this.agent.specialization,
      messageType,
      context
    );
  }
}
