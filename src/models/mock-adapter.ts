// Mock API Adapter Implementation
// Simulates LLM responses for testing without API calls

import { ModelAPIAdapter, ModelResponse, ModelOptions, APIError } from './model-adapter';

interface MockConfiguration {
  latencyMs?: number;
  errorRate?: number;
  agentSpecificResponses?: boolean;
  responseVariations?: boolean;
}

interface AgentResponseTemplate {
  patterns: string[];
  reasoningStyle: string;
  confidence: number;
  specialization: string;
}

export class MockAdapter extends ModelAPIAdapter {
  private config: MockConfiguration;
  private responseCount: number = 0;

  // Agent-specific response templates
  private agentTemplates: Record<string, AgentResponseTemplate> = {
    'reasoning': {
      patterns: [
        'Let me analyze this systematically:\n1. First, I need to understand the core problem\n2. The logical structure suggests...\n3. Therefore, the conclusion is...',
        'Breaking this down logically:\n- Premise A: {input}\n- Premise B: {context}\n- Logical inference: {conclusion}',
        'Using deductive reasoning:\nIf {assumption}, then {consequence}. Given {evidence}, we can conclude {result}.'
      ],
      reasoningStyle: 'structured, step-by-step logical analysis',
      confidence: 0.85,
      specialization: 'logical reasoning and systematic problem-solving'
    },
    'creative': {
      patterns: [
        'Imagine if we approached this creatively...\nWhat if {idea}? This could lead to {innovation}.\nThe artistic perspective reveals {insight}.',
        'Let me explore this imaginatively:\n• {creative_angle}\n• {novel_connection}\n• {innovative_solution}',
        'From a creative standpoint:\nThis reminds me of {metaphor}. The unconventional approach would be {creative_solution}.'
      ],
      reasoningStyle: 'imaginative, metaphorical, and innovative',
      confidence: 0.75,
      specialization: 'creative thinking and novel connections'
    },
    'factual': {
      patterns: [
        'Based on verified information:\n• Fact 1: {fact}\n• Fact 2: {evidence}\n• Conclusion: {result}',
        'According to reliable sources:\nData shows {statistic}. Research indicates {finding}. Therefore {conclusion}.',
        'Factual analysis:\n- Primary evidence: {data}\n- Supporting research: {study}\n- Objective conclusion: {result}'
      ],
      reasoningStyle: 'evidence-based, data-driven, objective',
      confidence: 0.90,
      specialization: 'factual verification and data analysis'
    },
    'code': {
      patterns: [
        'From a technical implementation perspective:\n```\nfunction solution() {\n  // {technical_approach}\n  return {result};\n}\n```',
        'Technical analysis:\n1. Architecture: {design}\n2. Implementation: {code_approach}\n3. Optimization: {performance}',
        'Code-level breakdown:\n- Algorithm: {algorithm}\n- Complexity: O({complexity})\n- Trade-offs: {considerations}'
      ],
      reasoningStyle: 'technical, algorithmic, implementation-focused',
      confidence: 0.80,
      specialization: 'technical implementation and software engineering'
    },
    'social': {
      patterns: [
        'Considering the human and social aspects:\nPeople typically {behavior}. The social dynamics suggest {interaction}. This impacts {outcome}.',
        'From a social perspective:\n• Human factors: {psychology}\n• Cultural context: {culture}\n• Relationship dynamics: {social}',
        'Social analysis:\nCommunication patterns show {communication}. Group dynamics indicate {group_behavior}.'
      ],
      reasoningStyle: 'empathetic, culturally aware, relationship-focused',
      confidence: 0.70,
      specialization: 'social dynamics and human behavior'
    },
    'critical': {
      patterns: [
        'Critical evaluation reveals several concerns:\n⚠️ Assumption: {flaw}\n⚠️ Limitation: {constraint}\n⚠️ Risk: {risk}',
        'Let me challenge this approach:\nPotential problems: {issues}\nAlternative perspectives: {alternatives}\nCounterarguments: {counter}',
        'Critical analysis:\n- Weaknesses identified: {weakness}\n- Biases detected: {bias}\n- Improvements needed: {improvement}'
      ],
      reasoningStyle: 'skeptical, analytical, improvement-focused',
      confidence: 0.65,
      specialization: 'critical evaluation and quality assurance'
    },
    'coordinator': {
      patterns: [
        'Synthesizing multiple perspectives:\n• Reasoning suggests: {logical}\n• Creative input: {creative}\n• Final recommendation: {synthesis}',
        'Coordination summary:\nCombining insights from {sources}. The consensus indicates {agreement}. Next steps: {action}.',
        'Integration analysis:\nBalancing {perspective1} with {perspective2}. The optimal approach is {coordination}.'
      ],
      reasoningStyle: 'integrative, balanced, consensus-building',
      confidence: 0.75,
      specialization: 'coordination and perspective synthesis'
    }
  };

  constructor(modelType: string, config: MockConfiguration = {}) {
    super(modelType, 'mock-api-key', 'http://localhost:mock');
    this.config = {
      latencyMs: 500,
      errorRate: 0.02, // 2% error rate
      agentSpecificResponses: true,
      responseVariations: true,
      ...config
    };
  }

  async generateCompletion(prompt: string, options: ModelOptions = {}): Promise<ModelResponse> {
    // Simulate network latency
    if (this.config.latencyMs && this.config.latencyMs > 0) {
      await this.simulateLatency();
    }

    // Simulate occasional errors
    if (this.config.errorRate && Math.random() < this.config.errorRate) {
      throw new APIError(
        `Mock ${this.modelType} simulated error`,
        500,
        true
      );
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(prompt, options);
    if (this.cache.has(cacheKey)) {
      console.log(`🔄 Mock cache hit for ${this.modelType}`);
      return this.cache.get(cacheKey)!;
    }

    // Generate response
    console.log(`🎭 Mock API call to ${this.modelType}`);
    const response = this.generateMockResponse(prompt, options);
    
    // Cache the response
    this.cache.set(cacheKey, response);
    this.requestCount++;
    
    return response;
  }

  private async simulateLatency(): Promise<void> {
    const variance = 0.3; // ±30% variance
    const baseLatency = this.config.latencyMs!;
    const actualLatency = baseLatency * (1 + (Math.random() - 0.5) * variance);
    
    await new Promise(resolve => setTimeout(resolve, actualLatency));
  }

  private generateMockResponse(prompt: string, options: ModelOptions): ModelResponse {
    this.responseCount++;
    
    // Detect agent type from prompt or system prompt
    const agentType = this.detectAgentType(prompt, options.systemPrompt);
    
    // Generate content based on agent type
    const content = this.config.agentSpecificResponses 
      ? this.generateAgentSpecificContent(agentType, prompt)
      : this.generateGenericContent(prompt);

    // Simulate token usage
    const promptTokens = this.estimateTokens(prompt + (options.systemPrompt || ''));
    const completionTokens = this.estimateTokens(content);

    return {
      id: `mock-${Date.now()}-${this.responseCount}`,
      content,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      },
      model: this.modelType,
      finish_reason: 'stop'
    };
  }

  private detectAgentType(prompt: string, systemPrompt?: string): string {
    const combined = (prompt + ' ' + (systemPrompt || '')).toLowerCase();
    
    // Check for agent-specific keywords
    if (combined.includes('reasoning') || combined.includes('logical') || combined.includes('systematic')) {
      return 'reasoning';
    }
    if (combined.includes('creative') || combined.includes('imaginative') || combined.includes('artistic')) {
      return 'creative';
    }
    if (combined.includes('factual') || combined.includes('evidence') || combined.includes('data')) {
      return 'factual';
    }
    if (combined.includes('code') || combined.includes('technical') || combined.includes('implementation')) {
      return 'code';
    }
    if (combined.includes('social') || combined.includes('cultural') || combined.includes('relationship')) {
      return 'social';
    }
    if (combined.includes('critical') || combined.includes('evaluate') || combined.includes('challenge')) {
      return 'critical';
    }
    if (combined.includes('coordinate') || combined.includes('synthesize') || combined.includes('integrate')) {
      return 'coordinator';
    }
    
    // Default to reasoning if no specific type detected
    return 'reasoning';
  }

  private generateAgentSpecificContent(agentType: string, prompt: string): string {
    const template = this.agentTemplates[agentType] || this.agentTemplates.reasoning;
    
    // Select a random pattern if variations are enabled
    const pattern = this.config.responseVariations 
      ? template.patterns[Math.floor(Math.random() * template.patterns.length)]
      : template.patterns[0];

    // Replace placeholders with contextual content
    let content = pattern
      .replace('{input}', this.extractKeyPhrase(prompt))
      .replace('{context}', 'the given information')
      .replace('{conclusion}', 'a well-reasoned result')
      .replace('{assumption}', 'our current approach')
      .replace('{consequence}', 'logical outcomes follow')
      .replace('{evidence}', 'the available data')
      .replace('{result}', 'the optimal solution')
      .replace('{idea}', 'a novel approach')
      .replace('{innovation}', 'breakthrough insights')
      .replace('{insight}', 'deeper understanding')
      .replace('{creative_angle}', 'unconventional perspective')
      .replace('{novel_connection}', 'unexpected relationships')
      .replace('{innovative_solution}', 'creative resolution')
      .replace('{metaphor}', 'artistic parallels')
      .replace('{creative_solution}', 'imaginative approach')
      .replace('{fact}', 'verified information')
      .replace('{statistic}', 'quantitative evidence')
      .replace('{finding}', 'research conclusions')
      .replace('{data}', 'empirical evidence')
      .replace('{study}', 'peer-reviewed research')
      .replace('{technical_approach}', 'algorithmic solution')
      .replace('{design}', 'modular architecture')
      .replace('{code_approach}', 'implementation strategy')
      .replace('{performance}', 'efficiency optimization')
      .replace('{algorithm}', 'efficient algorithm')
      .replace('{complexity}', 'n log n')
      .replace('{considerations}', 'memory vs speed')
      .replace('{behavior}', 'respond positively')
      .replace('{interaction}', 'collaborative engagement')
      .replace('{outcome}', 'positive results')
      .replace('{psychology}', 'cognitive patterns')
      .replace('{culture}', 'cultural norms')
      .replace('{social}', 'interpersonal dynamics')
      .replace('{communication}', 'clear information exchange')
      .replace('{group_behavior}', 'collective decision-making')
      .replace('{flaw}', 'unverified assumptions')
      .replace('{constraint}', 'resource limitations')
      .replace('{risk}', 'potential negative outcomes')
      .replace('{issues}', 'methodological concerns')
      .replace('{alternatives}', 'different approaches')
      .replace('{counter}', 'opposing viewpoints')
      .replace('{weakness}', 'structural deficiencies')
      .replace('{bias}', 'cognitive biases')
      .replace('{improvement}', 'optimization opportunities')
      .replace('{logical}', 'systematic analysis')
      .replace('{creative}', 'innovative perspectives')
      .replace('{synthesis}', 'balanced integration')
      .replace('{sources}', 'multiple agents')
      .replace('{agreement}', 'convergent insights')
      .replace('{action}', 'implementation steps')
      .replace('{perspective1}', 'analytical viewpoint')
      .replace('{perspective2}', 'creative insights')
      .replace('{coordination}', 'synthesized approach');

    // Add agent-specific metadata
    content += `\n\n[Agent: ${agentType} | Style: ${template.reasoningStyle} | Confidence: ${template.confidence}]`;
    
    return content;
  }

  private generateGenericContent(prompt: string): string {
    const responses = [
      `Based on the query "${this.extractKeyPhrase(prompt)}", I can provide the following analysis:\n\n1. Initial assessment suggests multiple valid approaches\n2. The optimal solution depends on specific constraints\n3. Recommended next steps include further investigation`,
      `Analyzing the request for "${this.extractKeyPhrase(prompt)}":\n\n• Primary considerations: context and requirements\n• Potential solutions: several viable options\n• Implementation approach: systematic methodology`,
      `In response to "${this.extractKeyPhrase(prompt)}":\n\nThis requires careful consideration of multiple factors. The approach should balance effectiveness with practicality while ensuring robust results.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private extractKeyPhrase(prompt: string): string {
    // Extract a meaningful phrase from the prompt (simplified)
    const words = prompt.split(/\s+/).slice(0, 5);
    return words.join(' ');
  }

  // Configuration methods
  updateConfiguration(newConfig: Partial<MockConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfiguration(): MockConfiguration {
    return { ...this.config };
  }

  // Testing utilities
  simulateError(): void {
    this.config.errorRate = 1.0; // Force next call to error
  }

  resetErrorRate(): void {
    this.config.errorRate = 0.02; // Reset to 2%
  }

  setLatency(ms: number): void {
    this.config.latencyMs = ms;
  }

  getResponseCount(): number {
    return this.responseCount;
  }

  resetStats(): void {
    this.responseCount = 0;
    this.requestCount = 0;
    this.clearCache();
  }
}
