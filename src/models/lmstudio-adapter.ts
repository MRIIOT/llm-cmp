import { ModelAPIAdapter, ModelResponse, ModelOptions, APIError } from './model-adapter';
import axios, { AxiosError } from 'axios';

/**
 * LM Studio Adapter
 * 
 * Interfaces with LM Studio server for local model inference.
 * Provides offline, privacy-focused local LLM execution.
 * 
 * Features:
 * - Local server communication (default: http://localhost:1234)
 * - Support for any model loaded in LM Studio
 * - Offline operation capability
 * - Privacy-focused (no data leaves local machine)
 * - OpenAI-compatible API format
 */
export class LMStudioAdapter extends ModelAPIAdapter {
    private timeout: number;

    constructor(modelType: string = 'lmstudio-local', config: any = {}) {
        const baseUrl = config.baseUrl || 'http://localhost:1234';
        super(modelType, 'local-api-key', baseUrl); // LM Studio doesn't use real API keys
        this.timeout = config.timeout || 120000; // 2 minutes for local inference
        
        // Validate base URL format
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            throw new Error('LM Studio base URL must start with http:// or https://');
        }
    }

    /**
     * Get adapter capabilities and status
     */
    getCapabilities() {
        return {
            provider: 'lmstudio',
            baseUrl: this.baseURL,
            supportsLocalModels: true,
            requiresApiKey: false,
            offlineCapable: true,
            maxContextTokens: 'Model-dependent',
            features: [
                'Local inference',
                'Privacy-focused',
                'Offline operation',
                'Custom model support',
                'OpenAI-compatible API'
            ]
        };
    }

    /**
     * Check if LM Studio server is running and has a model loaded
     */
    async checkServerStatus(): Promise<{
        isRunning: boolean;
        hasModelLoaded: boolean;
        modelInfo?: any;
        error?: string;
    }> {
        try {
            // Check server health
            const healthResponse = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });

            // Try to get model info
            try {
                const modelsResponse = await axios.get(`${this.baseURL}/v1/models`, {
                    timeout: 5000
                });

                const models = modelsResponse.data?.data || [];
                const hasModel = models.length > 0;

                return {
                    isRunning: true,
                    hasModelLoaded: hasModel,
                    modelInfo: hasModel ? models[0] : null
                };
            } catch (modelError) {
                // Server running but no model endpoint or no models loaded
                return {
                    isRunning: true,
                    hasModelLoaded: false,
                    error: 'No models loaded in LM Studio'
                };
            }
        } catch (error) {
            return {
                isRunning: false,
                hasModelLoaded: false,
                error: `LM Studio server not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get available models from LM Studio server
     */
    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseURL}/v1/models`, {
                timeout: 10000
            });

            const models = response.data?.data || [];
            return models.map((model: any) => model.id || 'unknown-model');
        } catch (error) {
            console.warn('Could not fetch models from LM Studio:', error instanceof Error ? error.message : error);
            return ['lm-studio-model']; // Default fallback
        }
    }

    /**
     * Generate completion using LM Studio server
     */
    async generateCompletion(prompt: string, options: ModelOptions = {}): Promise<ModelResponse> {
        try {
            // Check server status first
            const status = await this.checkServerStatus();
            if (!status.isRunning) {
                throw new APIError(`LM Studio server not running: ${status.error}`, undefined, false);
            }
            if (!status.hasModelLoaded) {
                throw new APIError(`No model loaded in LM Studio: ${status.error}`, undefined, false);
            }

            // Build request payload in OpenAI-compatible format
            const messages = [];
            
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

            const payload = {
                model: this.modelType,
                messages,
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7,
                stream: false
            };

            console.log(`🏠 LM Studio Request to ${this.baseURL}/v1/chat/completions`);
            
            const startTime = Date.now();
            const response = await axios.post(
                `${this.baseURL}/v1/chat/completions`,
                payload,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Extract response content
            const choice = response.data?.choices?.[0];
            if (!choice) {
                throw new APIError('No response choice returned from LM Studio');
            }

            const content = choice.message?.content || choice.text || '';
            if (!content) {
                throw new APIError('Empty response content from LM Studio');
            }

            // Extract usage information
            const usage = response.data?.usage || {};

            console.log(`✅ LM Studio response received (${responseTime}ms, ${usage.total_tokens || 'unknown'} tokens)`);

            // Transform to ModelResponse format
            const modelResponse: ModelResponse = {
                id: response.data?.id || `lmstudio-${Date.now()}`,
                content: content.trim(),
                model: response.data?.model || this.modelType,
                usage: {
                    prompt_tokens: usage.prompt_tokens || null,
                    completion_tokens: usage.completion_tokens || null,
                    total_tokens: usage.total_tokens || null
                },
                finish_reason: choice.finish_reason || 'completed'
            };

            // Cache successful response
            const cacheKey = this.generateCacheKey(prompt, options);
            this.cache.set(cacheKey, modelResponse);
            this.requestCount++;

            return modelResponse;

        } catch (error) {
            console.error('LM Studio API Error:', error);

            if (error instanceof APIError) {
                throw error;
            }

            if (error instanceof AxiosError) {
                if (error.code === 'ECONNREFUSED') {
                    throw new APIError(`LM Studio server not running at ${this.baseURL}. Please start LM Studio and load a model.`, undefined, false);
                }
                if (error.response?.status === 404) {
                    throw new APIError(`LM Studio API endpoint not found. Please check that LM Studio server is running with API enabled.`, 404, false);
                }
                if (error.response?.status === 500) {
                    throw new APIError(`LM Studio server error: ${error.response.data?.error?.message || 'Internal server error'}`, 500, true);
                }
                throw new APIError(`LM Studio API error (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`, error.response?.status, true);
            }

            throw new APIError(`LM Studio request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, false);
        }
    }

    /**
     * Get model-specific recommendations for agent types
     */
    getModelRecommendations() {
        return {
            reasoning: 'Any loaded model with strong reasoning capabilities',
            creative: 'Any loaded model with creative writing strengths',
            factual: 'Any loaded model with factual knowledge',
            code: 'Code-specialized models if available (CodeLlama, etc.)',
            social: 'General conversation models',
            critic: 'Models with analytical capabilities',
            coordinator: 'Balanced general-purpose models',
            default: 'Currently loaded model in LM Studio'
        };
    }

    /**
     * Test connection to LM Studio server
     */
    async testConnection(): Promise<{
        success: boolean;
        message: string;
        serverInfo?: any;
    }> {
        try {
            const status = await this.checkServerStatus();
            
            if (!status.isRunning) {
                return {
                    success: false,
                    message: `LM Studio server not accessible: ${status.error}`
                };
            }

            if (!status.hasModelLoaded) {
                return {
                    success: false,
                    message: `LM Studio server running but no model loaded: ${status.error}`
                };
            }

            const models = await this.getAvailableModels();

            return {
                success: true,
                message: `LM Studio server running with ${models.length} model(s) loaded`,
                serverInfo: {
                    baseUrl: this.baseURL,
                    hasModelLoaded: status.hasModelLoaded,
                    modelInfo: status.modelInfo,
                    availableModels: models
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `LM Studio connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
