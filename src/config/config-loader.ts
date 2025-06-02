// ===============================================
// CONFIGURATION LOADER
// ===============================================

import { readFileSync } from 'fs';
import { join } from 'path';
import { APIConfig } from '../types/index.js';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: APIConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public loadConfig(configPath?: string): APIConfig {
    if (this.config) {
      return this.config;
    }

    const defaultPath = join(process.cwd(), 'config.json');
    const path = configPath || defaultPath;

    try {
      const configData = readFileSync(path, 'utf-8');
      this.config = JSON.parse(configData) as APIConfig;
      
      // Validate configuration
      this.validateConfig(this.config);
      
      console.log('✅ Configuration loaded successfully');
      console.log(`   📊 Models configured: ${Object.keys(this.config.models).length}`);
      
      // Show API key status for providers that need them
      const apiKeyStatus = [];
      if (this.config.apiKeys.openai) apiKeyStatus.push(`OpenAI=${!!this.config.apiKeys.openai}`);
      if (this.config.apiKeys.anthropic) apiKeyStatus.push(`Anthropic=${!!this.config.apiKeys.anthropic}`);
      if (this.config.apiKeys.google) apiKeyStatus.push(`Google=${!!this.config.apiKeys.google}`);
      
      // Check if using local providers
      const hasLMStudio = Object.values(this.config.models).some((model: any) => model.provider === 'lmstudio');
      const hasMock = Object.values(this.config.models).some((model: any) => model.provider === 'mock');
      
      if (apiKeyStatus.length > 0) {
        console.log(`   🔑 API keys: ${apiKeyStatus.join(', ')}`);
      }
      if (hasLMStudio) {
        console.log(`   🏠 LM Studio: Local inference enabled`);
      }
      if (hasMock) {
        console.log(`   🎭 Mock adapter: Testing mode enabled`);
      }
      
      return this.config;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          throw new Error(
            `Configuration file not found at ${path}. ` +
            'Please copy config.example.json to config.json and add your API keys.'
          );
        }
        throw new Error(`Failed to load configuration: ${error.message}`);
      }
      throw new Error('Unknown error loading configuration');
    }
  }

  public getConfig(): APIConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  public getAPIKey(provider: 'openai' | 'anthropic' | 'google' | 'gemini' | 'lmstudio'): string {
    const config = this.getConfig();
    
    // LM Studio doesn't use API keys
    if (provider === 'lmstudio') {
      return 'local-api-key'; // Placeholder for local inference
    }
    
    // Handle provider aliases
    const providerKey = provider === 'gemini' ? 'google' : provider;
    const key = config.apiKeys[providerKey as keyof typeof config.apiKeys];
    
    if (!key || key.includes('your-') || key.includes('here')) {
      throw new Error(
        `Invalid ${provider} API key. Please update config.json with your actual API key.`
      );
    }
    
    return key;
  }

  public getModelConfig(agentType: string): any {
    const config = this.getConfig();
    const modelConfig = config.models[agentType];
    
    if (!modelConfig) {
      throw new Error(`No model configuration found for agent type: ${agentType}`);
    }
    
    return modelConfig;
  }

  public getOrchestrationConfig(): any {
    const config = this.getConfig();
    return config.orchestration;
  }

  private validateConfig(config: APIConfig): void {
    // Validate API keys structure
    if (!config.apiKeys || typeof config.apiKeys !== 'object') {
      throw new Error('Invalid config: apiKeys section required');
    }

    // Check which providers are actually being used
    const usedProviders = new Set(Object.values(config.models).map((model: any) => model.provider));
    
    // Basic API keys should be present for providers that need them
    if (usedProviders.has('openai') && !config.apiKeys.openai) {
      throw new Error('Invalid config: openai API key required when using OpenAI provider');
    }
    
    if (usedProviders.has('anthropic') && !config.apiKeys.anthropic) {
      throw new Error('Invalid config: anthropic API key required when using Anthropic provider');
    }
    
    if ((usedProviders.has('google') || usedProviders.has('gemini')) && !config.apiKeys.google) {
      throw new Error('Invalid config: google API key required when using Google/Gemini provider');
    }

    // Validate models structure
    if (!config.models || typeof config.models !== 'object') {
      throw new Error('Invalid config: models section required');
    }

    const requiredAgents = ['reasoning', 'creative', 'factual', 'code', 'social', 'critic', 'coordinator'];
    for (const agent of requiredAgents) {
      if (!config.models[agent]) {
        throw new Error(`Invalid config: missing model configuration for ${agent} agent`);
      }

      const modelConfig = config.models[agent];
      if (!modelConfig.provider || !modelConfig.model) {
        throw new Error(`Invalid config: ${agent} agent missing provider or model`);
      }

      if (!['openai', 'anthropic', 'google', 'gemini', 'mock', 'lmstudio'].includes(modelConfig.provider)) {
        throw new Error(`Invalid config: ${agent} agent has unsupported provider ${modelConfig.provider}`);
      }

      if (typeof modelConfig.temperature !== 'number' || 
          modelConfig.temperature < 0 || modelConfig.temperature > 2) {
        throw new Error(`Invalid config: ${agent} agent has invalid temperature`);
      }

      if (typeof modelConfig.maxTokens !== 'number' || modelConfig.maxTokens < 1) {
        throw new Error(`Invalid config: ${agent} agent has invalid maxTokens`);
      }
    }

    // Validate orchestration settings
    if (!config.orchestration) {
      throw new Error('Invalid config: orchestration section required');
    }

    const orch = config.orchestration;
    if (typeof orch.consensusThreshold !== 'number' || 
        orch.consensusThreshold < 0 || orch.consensusThreshold > 1) {
      throw new Error('Invalid config: consensusThreshold must be between 0 and 1');
    }

    if (typeof orch.maxRetries !== 'number' || orch.maxRetries < 1) {
      throw new Error('Invalid config: maxRetries must be >= 1');
    }

    if (typeof orch.timeoutMs !== 'number' || orch.timeoutMs < 1000) {
      throw new Error('Invalid config: timeoutMs must be >= 1000');
    }

    if (typeof orch.parallelAgents !== 'number' || orch.parallelAgents < 1) {
      throw new Error('Invalid config: parallelAgents must be >= 1');
    }
  }

  // Helper method to create default config
  public static createDefaultConfig(): APIConfig {
    return {
      apiKeys: {
        openai: "sk-your-openai-key-here",
        anthropic: "sk-ant-your-anthropic-key-here",
        google: "AIza_your_google_ai_studio_api_key_here_39_chars"
      },
      models: {
        reasoning: {
          provider: "anthropic",
          model: "claude-3-opus-20240229",
          temperature: 0.1,
          maxTokens: 3000
        },
        creative: {
          provider: "openai",
          model: "gpt-4-turbo-preview",
          temperature: 0.8,
          maxTokens: 2500
        },
        factual: {
          provider: "google",
          model: "gemini-1.5-pro",
          temperature: 0.2,
          maxTokens: 2000
        },
        code: {
          provider: "anthropic",
          model: "claude-3-haiku-20240307",
          temperature: 0.1,
          maxTokens: 4000
        },
        social: {
          provider: "google",
          model: "gemini-pro",
          temperature: 0.6,
          maxTokens: 2000
        },
        critic: {
          provider: "anthropic",
          model: "claude-3-opus-20240229",
          temperature: 0.3,
          maxTokens: 2500
        },
        coordinator: {
          provider: "openai",
          model: "gpt-4-turbo-preview",
          temperature: 0.5,
          maxTokens: 3000
        }
      },
      orchestration: {
        consensusThreshold: 0.8,
        maxRetries: 3,
        timeoutMs: 30000,
        parallelAgents: 6
      }
    };
  }
}
