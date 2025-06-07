# LLM Adapters Technical Documentation

## Overview

The adapters folder implements a flexible, provider-agnostic architecture for integrating multiple Large Language Model (LLM) providers into the system. This design follows the Adapter pattern, allowing seamless switching between different LLM providers while maintaining a consistent interface.

## Architecture

### Design Pattern

The implementation uses the **Adapter Pattern** combined with **Factory Pattern** and **Template Method Pattern**:

- **Adapter Pattern**: Each provider-specific adapter converts the provider's API into our common interface
- **Factory Pattern**: `createLLMAdapter()` creates appropriate adapter instances based on configuration
- **Template Method Pattern**: Base class defines the algorithm skeleton, subclasses implement provider-specific details

### Core Components

#### 1. `base-llm-adapter.ts` - Abstract Base Class

The foundation of the adapter system, providing:

**Configuration Management**
```typescript
interface LLMAdapterConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
```

**Core Functionality**
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Response Caching**: Optional LRU cache for identical requests
- **Metrics Tracking**: Request count, token usage, costs, and latency monitoring
- **Error Handling**: Unified error handling with custom `LLMError` type

**Template Method Implementation**
The `generateCompletion()` method defines the algorithm:
1. Check cache for existing response
2. Prepare provider-specific request
3. Execute API call with retry logic
4. Process response into standard format
5. Update metrics and cache
6. Return standardized response

**Abstract Methods** (implemented by subclasses):
- `getProviderName()`: Provider identification
- `getDefaultBaseURL()`: Default API endpoint
- `getDefaultModel()`: Default model name
- `prepareRequest()`: Convert standard request to provider format
- `makeAPICall()`: Execute HTTP request to provider
- `processResponse()`: Convert provider response to standard format
- `calculateCost()`: Calculate token costs based on provider pricing

**Helper Methods**:
- `isRetryableError()`: Determines if error warrants retry (network, rate limit, 5xx)
- `estimateTokens()`: Rough token count estimation (1 token ≈ 4 characters)
- `updateMetrics()`: Maintains running averages and totals
- `getCacheKey()`: Generates deterministic cache keys from request parameters

#### 2. `index.ts` - Factory and Utilities

Central export point providing:

**Factory Functions**
- `createLLMAdapter()`: Creates single adapter instance based on type and config
- `createAdapters()`: Creates multiple adapters from configuration array

**Type Definitions**
```typescript
type AdapterType = 'openai' | 'anthropic' | 'lmstudio' | 'gemini' | 'azure-openai';
```

**Utility Functions**
- `validateApiKey()`: Provider-specific API key format validation using regex patterns
- `getRecommendedModel()`: Returns optimal model/adapter for specific use cases (reasoning, creative, code, chat, analysis)
- `testAdapters()`: Health check for all configured adapters with simple prompt test

**Default Configurations**
Pre-configured settings for each provider with sensible defaults for timeout, retries, and models.

#### 3. Provider-Specific Adapters

Each adapter extends `BaseLLMAdapter` and implements provider-specific logic:

##### `openai-adapter.ts`
- Supports both OpenAI and Azure OpenAI endpoints
- Implements chat completion API format
- Features:
  - Dynamic endpoint construction for Azure deployments
  - Organization header support
  - Function calling capability detection
  - Model listing API integration
  - Detailed cost calculation based on current pricing

##### `anthropic-adapter.ts`
- Implements Claude API integration
- Handles Anthropic's specific message format
- Manages conversation history and system prompts

##### `gemini-adapter.ts`
- Google's Gemini/PaLM API integration
- Supports multimodal inputs where applicable
- Handles Google's specific authentication and request format

##### `lmstudio-adapter.ts`
- Local LLM integration via LM Studio
- No API key required (local deployment)
- Extended timeout defaults for local processing
- Compatible with various open-source models

##### `adapter-demo.ts`
- Mock adapter for testing and development
- Returns predetermined responses
- Useful for unit testing without API calls

## Request/Response Flow

### 1. Request Flow
```
Application -> LLMRequest -> Adapter.generateCompletion()
    -> Check Cache
    -> prepareRequest() [Convert to provider format]
    -> Retry Loop
        -> makeAPICall() [HTTP request]
        -> Handle errors/retries
    -> processResponse() [Convert to standard format]
    -> Update metrics/cache
    -> Return LLMResponse
```

### 2. Standard Request Format
```typescript
interface LLMRequest {
  model?: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}
```

### 3. Standard Response Format
```typescript
interface LLMResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  latency: number;
  metadata?: Record<string, any>;
}
```

## Error Handling

The system uses a custom `LLMError` class with:
- Error codes for categorization
- Provider context
- Request details for debugging
- Retry eligibility flag

Common error scenarios:
- **Network failures**: Automatic retry with backoff
- **Rate limits (429)**: Retry after delay
- **Server errors (5xx)**: Retry with backoff
- **Authentication errors**: Immediate failure
- **Invalid requests**: Immediate failure with details

## Performance Optimization

### Caching Strategy
- LRU cache with configurable size (default 1000 entries)
- Cache key based on request parameters
- Optional enable/disable per adapter
- Cache hit tracking for performance monitoring

### Retry Strategy
- Exponential backoff: `delay * 2^attempt`
- Configurable max retries (default 3)
- Selective retry based on error type
- Timeout protection with AbortController

### Metrics Collection
- Request counting
- Token usage aggregation
- Cost tracking
- Latency averaging
- Cache performance metrics

## Usage Examples

### Basic Usage
```typescript
const adapter = createLLMAdapter({
  type: 'openai',
  config: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-4-turbo-preview'
  }
});

const response = await adapter.generateCompletion({
  prompt: "Explain quantum computing",
  temperature: 0.7,
  maxTokens: 500
});
```

### Multi-Provider Setup
```typescript
const adapters = createAdapters([
  { type: 'openai', config: { apiKey: 'sk-...' }},
  { type: 'anthropic', config: { apiKey: 'sk-ant-...' }},
  { type: 'lmstudio', config: { baseURL: 'http://localhost:1234' }}
]);

// Test all adapters
const results = await testAdapters(adapters);
```

### Use Case Optimization
```typescript
const recommendation = getRecommendedModel('code', adapters);
if (recommendation) {
  const response = await recommendation.adapter.generateCompletion({
    model: recommendation.model,
    prompt: "Write a Python function to..."
  });
}
```

## Best Practices

1. **Error Handling**: Always wrap adapter calls in try-catch blocks
2. **Timeout Configuration**: Adjust timeouts based on model and expected response size
3. **Cost Management**: Monitor token usage via metrics
4. **Caching**: Enable for repeated queries, disable for unique/dynamic content
5. **Model Selection**: Use `getRecommendedModel()` for optimal model selection
6. **Testing**: Use `testAdapters()` to verify configurations before deployment

## Extension Guide

To add a new provider:

1. Create `new-provider-adapter.ts` extending `BaseLLMAdapter`
2. Implement all abstract methods
3. Add provider type to `AdapterType` in index.ts
4. Update factory function with new case
5. Add default configuration
6. Implement provider-specific features as public methods
7. Add appropriate cost calculation logic
8. Test with `testAdapters()` function

## Security Considerations

- API keys are never logged or exposed in errors
- Timeout protection prevents hanging requests
- Request/response data can be sanitized via metadata
- Cache can be disabled for sensitive content
- Provider-specific security headers are properly set

This architecture provides a robust, extensible foundation for LLM integration while maintaining clean separation of concerns and provider independence.