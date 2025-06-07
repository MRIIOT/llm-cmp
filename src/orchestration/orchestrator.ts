/**
 * Orchestrator Implementation
 * Clean slate design for dynamic agent spawning, consensus, and adaptive coordination
 */

import {
  OrchestrationRequest,
  OrchestrationResult,
  ConsensusRequest,
  ConsensusResult,
  Message,
  AgentCapability,
  PerformanceReport,
  LLMRequest,
  LLMResponse,
  LLMProvider,
  Config,
  ConsensusError,
  LLMError
} from '../types/index.js';

import { Agent, AgentConfig } from '../core/agent';

export interface OrchestratorConfig {
  providers: LLMProvider[];
  config: Partial<Config>;
  agentTemplates?: AgentTemplate[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  preferredProvider?: string;
}

interface ActiveAgent {
  agent: Agent;
  provider: LLMProvider;
  model: string;
  workload: number;
  specialization: string[];
}

interface ConsensusParticipant {
  agent: ActiveAgent;
  message: Message;
  contribution: number;
}

export class Orchestrator {
  // Configuration
  private config: Config;
  private providers: Map<string, LLMProvider>;
  private agentTemplates: Map<string, AgentTemplate>;
  
  // Active agents
  private activeAgents: Map<string, ActiveAgent>;
  private agentPool: Agent[];
  
  // Performance tracking
  private orchestrationHistory: OrchestrationResult[];
  private performanceMetrics: Map<string, number[]>;
  
  // Consensus mechanisms
  private consensusMethods: Map<string, ConsensusMethod>;

  constructor(config: OrchestratorConfig) {
    this.config = this.mergeWithDefaults(config.config);
    
    // Initialize providers
    this.providers = new Map();
    config.providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
    
    // Initialize agent templates
    this.agentTemplates = new Map();
    const templates = config.agentTemplates || this.getDefaultTemplates();
    templates.forEach(template => {
      this.agentTemplates.set(template.id, template);
    });
    
    // Initialize agent management
    this.activeAgents = new Map();
    this.agentPool = [];
    
    // Initialize tracking
    this.orchestrationHistory = [];
    this.performanceMetrics = new Map();
    
    // Initialize consensus methods
    this.consensusMethods = new Map();
    this.initializeConsensusMethods();
  }

  /**
   * Main orchestration method - process request with  coordination
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const orchestrationId = this.generateId('orchestration');
    
    try {
      // 1. Analyze request complexity
      const complexity = await this.analyzeRequestComplexity(request);
      
      // 2. Spawn appropriate agents
      const agents = await this.spawnAgents(request, complexity);
      
      // 3. Distribute work to agents
      const agentMessages = await this.distributeWork(agents, request);
      
      // 4. Build consensus
      const consensus = await this.buildConsensus(agentMessages, request);
      
      // 5. Synthesize final response
      const response = await this.synthesizeResponse(consensus, agentMessages);
      
      // 6. Generate performance report
      const performance = this.generatePerformanceReport(
        startTime,
        agents,
        consensus
      );
      
      // 7. Create result
      const result: OrchestrationResult = {
        response: response.content,
        confidence: response.confidence,
        reasoning: response.reasoning,
        evidence: response.evidence,
        consensus: consensus,
        performance: performance,
        predictions: response.predictions
      };
      
      // 8. Update tracking
      this.updateTracking(result);
      
      // 9. Adapt orchestration strategy
      await this.adaptOrchestration(result, request);
      
      return result;
      
    } catch (error) {
      throw new LLMError(
        `Orchestration failed: ${error instanceof Error ? error.message : String(error)}`,
        'ORCHESTRATION_ERROR',
        { orchestrationId, request, error }
      );
    } finally {
      // Clean up agents if needed
      await this.cleanupAgents(request);
    }
  }

  /**
   * Analyze request complexity to determine agent requirements
   */
  private async analyzeRequestComplexity(request: OrchestrationRequest): Promise<RequestComplexity> {
    // Analyze various complexity factors
    const factors = {
      queryLength: request.query.length,
      contextSize: JSON.stringify(request.context).length,
      constraintCount: Object.keys(request.constraints).length,
      requiredEvidence: request.constraints.requiredEvidence?.length || 0,
      hasTemporalAspect: this.hasTemporalAspect(request.query),
      requiresCreativity: this.requiresCreativity(request.query),
      requiresAnalysis: this.requiresAnalysis(request.query),
      requiresCritique: this.requiresCritique(request.query)
    };
    
    // Calculate overall complexity score
    const complexityScore = this.calculateComplexityScore(factors);
    
    // Determine required capabilities
    const requiredCapabilities = this.determineRequiredCapabilities(factors);
    
    // Estimate agent count
    const agentCount = Math.min(
      Math.max(
        Math.ceil(complexityScore * 10),
        this.config.agents.minAgents
      ),
      this.config.agents.maxAgents
    );
    
    return {
      score: complexityScore,
      factors,
      requiredCapabilities,
      recommendedAgentCount: agentCount
    };
  }

  /**
   * Spawn appropriate agents based on complexity analysis
   */
  private async spawnAgents(
    request: OrchestrationRequest,
    complexity: RequestComplexity
  ): Promise<ActiveAgent[]> {
    const agents: ActiveAgent[] = [];
    
    // Check if we can reuse pooled agents
    const reusableAgents = this.findReusableAgents(complexity.requiredCapabilities);
    agents.push(...reusableAgents);
    
    // Spawn new agents as needed
    const additionalNeeded = complexity.recommendedAgentCount - agents.length;
    
    for (let i = 0; i < additionalNeeded; i++) {
      const template = this.selectAgentTemplate(complexity.requiredCapabilities, agents);
      const agent = await this.createAgent(template, request);
      const provider = this.selectProvider(template);
      
      const activeAgent: ActiveAgent = {
        agent,
        provider,
        model: this.selectModel(provider, template),
        workload: 0,
        specialization: template.capabilities.map(c => c.id)
      };
      
      agents.push(activeAgent);
      this.activeAgents.set(agent.getId(), activeAgent);
    }
    
    return agents;
  }

  /**
   * Distribute work to agents with load balancing
   */
  private async distributeWork(
    agents: ActiveAgent[],
    request: OrchestrationRequest
  ): Promise<ConsensusParticipant[]> {
    const participants: ConsensusParticipant[] = [];
    
    // Create sub-queries based on agent specializations
    const subQueries = this.decomposeQuery(request.query, agents);
    
    // Assign work to agents
    const promises = agents.map(async (activeAgent, index) => {
      const subQuery = subQueries[index % subQueries.length];
      
      // Create LLM interface for this agent
      const llmInterface = this.createLLMInterface(activeAgent);
      
      // Process query
      const message = await activeAgent.agent.processQuery(
        subQuery.query,
        {
          ...request.context,
          subQueryContext: subQuery.context
        },
        llmInterface
      );
      
      // Update workload
      activeAgent.workload++;
      
      return {
        agent: activeAgent,
        message,
        contribution: this.assessContribution(message, request)
      };
    });
    
    // Wait for all agents with timeout
    const results = await Promise.allSettled(promises);
    
    // Collect successful results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        participants.push(result.value);
      }
    });
    
    if (participants.length < this.config.consensus.minParticipants) {
      throw new ConsensusError(
        `Insufficient participants: ${participants.length} < ${this.config.consensus.minParticipants}`,
        request.query
      );
    }
    
    return participants;
  }

  /**
   * Build  consensus from agent messages
   */
  private async buildConsensus(
    participants: ConsensusParticipant[],
    request: OrchestrationRequest
  ): Promise<ConsensusResult> {
    // Select consensus method based on configuration and context
    const method = this.selectConsensusMethod(participants, request);
    const consensusMethod = this.consensusMethods.get(method);
    
    if (!consensusMethod) {
      throw new ConsensusError(`Unknown consensus method: ${method}`, request.query);
    }
    
    // Build consensus request
    const consensusRequest: ConsensusRequest = {
      id: this.generateId('consensus'),
      question: request.query,
      context: request.context,
      constraints: {
        minAgents: this.config.consensus.minParticipants,
        maxAgents: participants.length,
        requiredCapabilities: [],
        consensusThreshold: request.constraints.minConfidence || this.config.consensus.qualityThreshold,
        timeLimit: request.constraints.maxTime || this.config.consensus.timeoutMs
      },
      deadline: new Date(Date.now() + this.config.consensus.timeoutMs)
    };
    
    // Execute consensus method
    const result = await consensusMethod.execute(participants, consensusRequest);
    
    // Validate consensus quality
    if (result.confidence.mean < consensusRequest.constraints.consensusThreshold) {
      throw new ConsensusError(
        `Consensus quality below threshold: ${result.confidence.mean} < ${consensusRequest.constraints.consensusThreshold}`,
        request.query,
        { result }
      );
    }
    
    return result;
  }

  /**
   * Synthesize final response from consensus and agent messages
   */
  private async synthesizeResponse(
    consensus: ConsensusResult,
    participants: ConsensusParticipant[]
  ): Promise<any> {
    // Aggregate reasoning chains
    const allReasoning = participants.flatMap(p => p.message.content.reasoning.steps);
    
    // Aggregate evidence
    const allEvidence = participants.flatMap(p => p.message.content.evidence);
    
    // Aggregate predictions
    const allPredictions = participants.flatMap(p => p.message.content.predictions);
    
    // Build synthesized reasoning chain
    const reasoning = {
      steps: this.deduplicateAndOrder(allReasoning),
      confidence: consensus.confidence,
      logicalStructure: this.mergeLogicalStructures(
        participants.map(p => p.message.content.reasoning.logicalStructure)
      ),
      temporalPattern: this.extractConsensusPattern(participants)
    };
    
    // Deduplicate and rank evidence
    const evidence = this.rankEvidence(this.deduplicateEvidence(allEvidence));
    
    // Select best predictions
    const predictions = this.selectBestPredictions(allPredictions);
    
    return {
      content: consensus.consensus,
      confidence: consensus.confidence,
      reasoning,
      evidence,
      predictions
    };
  }

  /**
   * Generate performance report
   */
  private generatePerformanceReport(
    startTime: number,
    agents: ActiveAgent[],
    consensus: ConsensusResult
  ): PerformanceReport {
    const totalTime = Date.now() - startTime;
    
    // Calculate token usage
    let tokenUsage = 0;
    agents.forEach(agent => {
      // Estimate based on message size
      const messageSize = JSON.stringify(agent).length;
      tokenUsage += Math.ceil(messageSize / 4); // Rough estimate
    });
    
    // Calculate HTM utilization
    let htmUtilization = 0;
    agents.forEach(agent => {
      const state = agent.agent['currentHTMState'];
      if (state && state.activeColumns.length > 0) {
        htmUtilization += state.activeColumns.length / 2048; // Normalized
      }
    });
    htmUtilization = htmUtilization / agents.length;
    
    // Count Bayesian updates
    let bayesianUpdates = 0;
    consensus.participants.forEach(p => {
      // Count beliefs based on participants who have votes
      // Each participant contributes to Bayesian updates
      if (p.vote) {
        bayesianUpdates += 1; // Simplified count
      }
    });
    
    return {
      totalTime,
      agentCount: agents.length,
      tokenUsage,
      htmUtilization,
      bayesianUpdates,
      consensusRounds: 1 // Simplified for now
    };
  }

  /**
   * Initialize consensus methods
   */
  private initializeConsensusMethods(): void {
    // Simple majority
    this.consensusMethods.set('simple_majority', {
      execute: async (participants, request) => this.simpleMajorityConsensus(participants, request)
    });
    
    // Weighted voting
    this.consensusMethods.set('weighted_voting', {
      execute: async (participants, request) => this.weightedVotingConsensus(participants, request)
    });
    
    // Bayesian aggregation
    this.consensusMethods.set('bayesian_aggregation', {
      execute: async (participants, request) => this.bayesianAggregationConsensus(participants, request)
    });
    
    // Game theoretic
    this.consensusMethods.set('game_theoretic', {
      execute: async (participants, request) => this.gameTheoreticConsensus(participants, request)
    });
  }

  /**
   * Simple majority consensus
   */
  private async simpleMajorityConsensus(
    participants: ConsensusParticipant[],
    request: ConsensusRequest
  ): Promise<ConsensusResult> {
    // Extract positions
    const positions = new Map<string, number>();
    
    participants.forEach(p => {
      const position = this.extractPosition(p.message);
      positions.set(position, (positions.get(position) || 0) + 1);
    });
    
    // Find majority position
    let majorityPosition = '';
    let maxVotes = 0;
    
    positions.forEach((votes, position) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        majorityPosition = position;
      }
    });
    
    // Calculate confidence based on majority strength
    const confidence = {
      mean: maxVotes / participants.length,
      lower: (maxVotes - 1) / participants.length,
      upper: Math.min((maxVotes + 1) / participants.length, 1),
      method: 'normal' as const
    };
    
    return {
      id: this.generateId('consensus'),
      requestId: request.id,
      consensus: majorityPosition,
      confidence,
      participants: participants.map(p => ({
        agentId: p.agent.agent.getId(),
        capabilities: p.agent.specialization,
        contribution: p.contribution,
        vote: this.extractPosition(p.message),
        confidence: p.message.content.reasoning.confidence.mean
      })),
      dissent: this.extractDissent(participants, majorityPosition),
      method: 'simple_majority',
      timestamp: new Date()
    };
  }

  /**
   * Weighted voting consensus
   */
  private async weightedVotingConsensus(
    participants: ConsensusParticipant[],
    request: ConsensusRequest
  ): Promise<ConsensusResult> {
    // Calculate weights based on contribution and confidence
    const weightedVotes = new Map<string, number>();
    
    participants.forEach(p => {
      const position = this.extractPosition(p.message);
      const weight = p.contribution * p.message.content.reasoning.confidence.mean;
      weightedVotes.set(position, (weightedVotes.get(position) || 0) + weight);
    });
    
    // Find weighted majority
    let bestPosition = '';
    let maxWeight = 0;
    let totalWeight = 0;
    
    weightedVotes.forEach((weight, position) => {
      totalWeight += weight;
      if (weight > maxWeight) {
        maxWeight = weight;
        bestPosition = position;
      }
    });
    
    // Calculate confidence
    const confidence = {
      mean: maxWeight / totalWeight,
      lower: Math.max(0, (maxWeight - 0.1) / totalWeight),
      upper: Math.min(1, (maxWeight + 0.1) / totalWeight),
      method: 'normal' as const
    };
    
    return {
      id: this.generateId('consensus'),
      requestId: request.id,
      consensus: bestPosition,
      confidence,
      participants: participants.map(p => ({
        agentId: p.agent.agent.getId(),
        capabilities: p.agent.specialization,
        contribution: p.contribution,
        vote: this.extractPosition(p.message),
        confidence: p.message.content.reasoning.confidence.mean
      })),
      dissent: this.extractDissent(participants, bestPosition),
      method: 'weighted_voting',
      timestamp: new Date()
    };
  }

  /**
   * Bayesian aggregation consensus
   */
  private async bayesianAggregationConsensus(
    participants: ConsensusParticipant[],
    request: ConsensusRequest
  ): Promise<ConsensusResult> {
    // Aggregate Bayesian beliefs
    const aggregatedBeliefs = new Map<string, number>();
    
    participants.forEach(p => {
      p.message.metadata.bayesianBelief.beliefs.forEach((belief, variable) => {
        const current = aggregatedBeliefs.get(variable) || 0;
        aggregatedBeliefs.set(variable, current + belief.mostLikely === 'true' ? 1 : 0);
      });
    });
    
    // Normalize beliefs
    aggregatedBeliefs.forEach((count, variable) => {
      aggregatedBeliefs.set(variable, count / participants.length);
    });
    
    // Extract consensus from beliefs
    const consensus = this.extractConsensusFromBeliefs(aggregatedBeliefs, participants);
    
    // Calculate uncertainty-aware confidence
    const uncertainties = participants.map(p => p.message.metadata.uncertainty.total);
    const avgUncertainty = uncertainties.reduce((a, b) => a + b) / uncertainties.length;
    
    const confidence = {
      mean: 1 - avgUncertainty,
      lower: 1 - Math.max(...uncertainties),
      upper: 1 - Math.min(...uncertainties),
      method: 'bayesian' as const
    };
    
    return {
      id: this.generateId('consensus'),
      requestId: request.id,
      consensus,
      confidence,
      participants: participants.map(p => ({
        agentId: p.agent.agent.getId(),
        capabilities: p.agent.specialization,
        contribution: p.contribution,
        vote: this.extractPosition(p.message),
        confidence: p.message.content.reasoning.confidence.mean
      })),
      dissent: this.extractDissent(participants, consensus),
      method: 'bayesian_aggregation',
      timestamp: new Date()
    };
  }

  /**
   * Game theoretic consensus
   */
  private async gameTheoreticConsensus(
    participants: ConsensusParticipant[],
    request: ConsensusRequest
  ): Promise<ConsensusResult> {
    // Model as a coordination game
    const strategies = this.extractStrategies(participants);
    
    // Calculate payoff matrix
    const payoffMatrix = this.calculatePayoffMatrix(strategies, participants);
    
    // Find Nash equilibrium
    const equilibrium = this.findNashEquilibrium(payoffMatrix);
    
    // Extract consensus from equilibrium
    const consensus = strategies[equilibrium.strategy];
    
    // Calculate confidence based on equilibrium stability
    const confidence = {
      mean: equilibrium.stability,
      lower: equilibrium.stability - 0.1,
      upper: Math.min(equilibrium.stability + 0.1, 1),
      method: 'normal' as const
    };
    
    return {
      id: this.generateId('consensus'),
      requestId: request.id,
      consensus,
      confidence,
      participants: participants.map(p => ({
        agentId: p.agent.agent.getId(),
        capabilities: p.agent.specialization,
        contribution: p.contribution,
        vote: this.extractPosition(p.message),
        confidence: p.message.content.reasoning.confidence.mean
      })),
      dissent: this.extractDissent(participants, consensus),
      method: 'game_theoretic',
      timestamp: new Date()
    };
  }

  // === Helper Methods ===

  private mergeWithDefaults(config: Partial<Config>): Config {
    return {
      agents: {
        minAgents: 3,
        maxAgents: 15,
        baseCapabilities: ['reasoning', 'analysis', 'synthesis'],
        adaptationRate: 0.1,
        evolutionEnabled: true,
        ...config.agents
      },
      htm: {
        columnCount: 2048,
        cellsPerColumn: 16,
        learningRadius: 1024,
        learningRate: 0.1,
        maxSequenceLength: 1000,
        ...config.htm
      },
      bayesian: {
        priorStrength: 0.1,
        updatePolicy: 'adaptive',
        conflictResolution: 'argumentation',
        uncertaintyThreshold: 0.3,
        ...config.bayesian
      },
      consensus: {
        defaultMethod: 'bayesian_aggregation',
        timeoutMs: 30000,
        minParticipants: 3,
        qualityThreshold: 0.7,
        ...config.consensus
      },
      performance: {
        enableCaching: true,
        parallelExecution: true,
        gpuAcceleration: false,
        memoryLimit: 1024 * 1024 * 1024,
        adaptiveOptimization: true,
        ...config.performance
      }
    };
  }

  private getDefaultTemplates(): AgentTemplate[] {
    return [
      {
        id: 'analytical',
        name: 'Analytical Agent',
        description: 'Specializes in logical reasoning and data analysis',
        capabilities: [
          {
            id: 'logical_analysis',
            name: 'Logical Analysis',
            description: 'Deep logical reasoning and data analysis',
            strength: 0.9,
            adaptationRate: 0.05,
            specializations: ['logical_analysis', 'data_analysis', 'mathematical_reasoning'],
            morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
            lastUsed: new Date(),
            performanceHistory: []
          }
        ]
      },
      {
        id: 'creative',
        name: 'Creative Agent',
        description: 'Focuses on creative solutions and novel approaches',
        capabilities: [
          {
            id: 'creative_synthesis',
            name: 'Creative Synthesis',
            description: 'Creative generation and brainstorming',
            strength: 0.85,
            adaptationRate: 0.15,
            specializations: ['creative_generation', 'brainstorming', 'synthesis'],
            morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
            lastUsed: new Date(),
            performanceHistory: []
          }
        ]
      },
      {
        id: 'critical',
        name: 'Critical Analysis Agent',
        description: 'Evaluates and critiques proposed solutions',
        capabilities: [
          {
            id: 'critical_evaluation',
            name: 'Critical Evaluation',
            description: 'Critical thinking and error detection',
            strength: 0.87,
            adaptationRate: 0.08,
            specializations: ['critical_thinking', 'error_detection', 'validation'],
            morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
            lastUsed: new Date(),
            performanceHistory: []
          }
        ]
      },
      {
        id: 'integrator',
        name: 'Integration Agent',
        description: 'Integrates diverse perspectives into coherent solutions',
        capabilities: [
          {
            id: 'integration',
            name: 'Integration',
            description: 'Synthesis and pattern recognition',
            strength: 0.88,
            adaptationRate: 0.10,
            specializations: ['synthesis', 'pattern_recognition', 'holistic_thinking'],
            morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
            lastUsed: new Date(),
            performanceHistory: []
          }
        ]
      },
      {
        id: 'temporal',
        name: 'Temporal Pattern Agent',
        description: 'Analyzes temporal patterns and sequences (HTM-enhanced)',
        capabilities: [
          {
            id: 'temporal_analysis',
            name: 'Temporal Analysis',
            description: 'Temporal reasoning and sequence prediction',
            strength: 0.86,
            adaptationRate: 0.12,
            specializations: ['temporal_reasoning', 'sequence_prediction', 'pattern_recognition'],
            morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
            lastUsed: new Date(),
            performanceHistory: []
          }
        ]
      }
    ];
  }

  private generateId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hasTemporalAspect(query: string): boolean {
    const temporalKeywords = ['when', 'timeline', 'sequence', 'before', 'after', 'during'];
    return temporalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private requiresCreativity(query: string): boolean {
    const creativeKeywords = ['create', 'design', 'imagine', 'invent', 'brainstorm'];
    return creativeKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private requiresAnalysis(query: string): boolean {
    const analyticalKeywords = ['analyze', 'evaluate', 'assess', 'examine', 'investigate'];
    return analyticalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private requiresCritique(query: string): boolean {
    const criticalKeywords = ['critique', 'risk', 'problem', 'weakness', 'flaw'];
    return criticalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private calculateComplexityScore(factors: any): number {
    let score = 0;
    
    // Length factors
    score += Math.min(factors.queryLength / 500, 0.2);
    score += Math.min(factors.contextSize / 5000, 0.2);
    
    // Constraint factors
    score += factors.constraintCount * 0.05;
    score += factors.requiredEvidence * 0.02;
    
    // Capability factors
    if (factors.hasTemporalAspect) score += 0.1;
    if (factors.requiresCreativity) score += 0.1;
    if (factors.requiresAnalysis) score += 0.1;
    if (factors.requiresCritique) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private determineRequiredCapabilities(factors: any): string[] {
    const capabilities: string[] = [];
    
    // Always include at least one base capability
    capabilities.push('reasoning');
    
    // Add diverse capabilities based on query characteristics
    if (factors.hasTemporalAspect) {
      capabilities.push('temporal_analysis');
    }
    if (factors.requiresCreativity) {
      capabilities.push('creative_synthesis');
    }
    if (factors.requiresAnalysis) {
      capabilities.push('logical_analysis');
    }
    if (factors.requiresCritique) {
      capabilities.push('critical_evaluation');
    }
    
    // Always add integration for synthesis
    capabilities.push('integration');
    
    // Ensure we have enough diversity - add more capabilities if needed
    if (capabilities.length < 3) {
      const additionalCaps = [
        'logical_analysis',
        'creative_synthesis',
        'critical_evaluation',
        'temporal_analysis',
        'integration'
      ].filter(cap => !capabilities.includes(cap));
      
      // Add random additional capabilities
      while (capabilities.length < 3 && additionalCaps.length > 0) {
        const randomIndex = Math.floor(Math.random() * additionalCaps.length);
        capabilities.push(additionalCaps.splice(randomIndex, 1)[0]);
      }
    }
    
    return capabilities;
  }

  private findReusableAgents(requiredCapabilities: string[]): ActiveAgent[] {
    const reusable: ActiveAgent[] = [];
    
    this.activeAgents.forEach(agent => {
      // Check if agent has required capabilities and low workload
      const hasCapabilities = requiredCapabilities.every(cap =>
        agent.specialization.includes(cap)
      );
      
      if (hasCapabilities && agent.workload < 3) {
        reusable.push(agent);
      }
    });
    
    return reusable;
  }

  private selectAgentTemplate(requiredCapabilities: string[], existingAgents: ActiveAgent[]): AgentTemplate {
    // Track which templates have been used to ensure diversity
    const usedTemplateIds = new Set<string>(
      existingAgents.map(agent => {
        // Extract template ID from agent specialization
        const capId = agent.specialization[0];
        if (capId === 'logical_analysis') return 'analytical';
        if (capId === 'creative_synthesis') return 'creative';
        if (capId === 'critical_evaluation') return 'critical';
        if (capId === 'integration') return 'integrator';
        if (capId === 'temporal_analysis') return 'temporal';
        return 'analytical'; // default
      })
    );
    
    // Get all available templates
    const availableTemplates = Array.from(this.agentTemplates.values());
    
    // First, try to find an unused template that matches required capabilities
    let selectedTemplate: AgentTemplate | null = null;
    let bestScore = -1;
    
    availableTemplates.forEach(template => {
      // Skip if already used (for diversity)
      if (usedTemplateIds.has(template.id) && existingAgents.length < availableTemplates.length) {
        return;
      }
      
      const templateCaps = template.capabilities.map(c => c.id);
      const matchScore = requiredCapabilities.filter(req =>
        templateCaps.some(cap => cap.includes(req))
      ).length;
      
      // Prefer unused templates with any match
      const diversityBonus = usedTemplateIds.has(template.id) ? 0 : 1;
      const totalScore = matchScore + diversityBonus;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        selectedTemplate = template;
      }
    });
    
    // If no good match found, use round-robin for diversity
    if (!selectedTemplate || bestScore <= 0) {
      const templateArray = Array.from(this.agentTemplates.values());
      const index = existingAgents.length % templateArray.length;
      selectedTemplate = templateArray[index];
    }
    
    return selectedTemplate || this.getDefaultTemplates()[0];
  }

  private async createAgent(template: AgentTemplate, request: OrchestrationRequest): Promise<Agent> {
    const config: AgentConfig = {
      id: this.generateId('agent'),
      name: `${template.name}_${Date.now()}`,
      description: template.description,
      initialCapabilities: template.capabilities,
      config: this.config
    };
    
    return new Agent(config);
  }

  private selectProvider(template: AgentTemplate): LLMProvider {
    if (template.preferredProvider) {
      const preferred = this.providers.get(template.preferredProvider);
      if (preferred) return preferred;
    }
    
    // Select provider with lowest current load
    let bestProvider: LLMProvider | null = null;
    let lowestLoad = Infinity;
    
    this.providers.forEach(provider => {
      const load = this.calculateProviderLoad(provider);
      if (load < lowestLoad) {
        lowestLoad = load;
        bestProvider = provider;
      }
    });
    
    return bestProvider || Array.from(this.providers.values())[0];
  }

  private calculateProviderLoad(provider: LLMProvider): number {
    let load = 0;
    
    this.activeAgents.forEach(agent => {
      if (agent.provider.id === provider.id) {
        load += agent.workload;
      }
    });
    
    return load;
  }

  private selectModel(provider: LLMProvider, template: AgentTemplate): string {
    // Select most capable model within cost constraints
    const models = provider.models.sort((a, b) =>
      b.capabilities.length - a.capabilities.length
    );
    
    return models[0]?.id || 'default';
  }

  private decomposeQuery(query: string, agents: ActiveAgent[]): any[] {
    // Simple decomposition - in production would be more 
    const subQueries: any[] = [];
    
    agents.forEach((agent, index) => {
      subQueries.push({
        query: query,
        context: {
          focus: agent.specialization,
          agentIndex: index,
          totalAgents: agents.length
        }
      });
    });
    
    return subQueries;
  }

  private createLLMInterface(activeAgent: ActiveAgent): (request: LLMRequest) => Promise<LLMResponse> {
    return async (request: LLMRequest) => {
      // Simulate LLM call - in production would use actual provider API
      const response: LLMResponse = {
        content: `Response from ${activeAgent.agent.getName()} using ${activeAgent.model}: ${request.prompt}`,
        model: activeAgent.model,
        usage: {
          promptTokens: Math.ceil(request.prompt.length / 4),
          completionTokens: 100,
          totalTokens: Math.ceil(request.prompt.length / 4) + 100,
          cost: 0.01
        },
        latency: Math.random() * 1000 + 500,
        metadata: { agentId: activeAgent.agent.getId() }
      };
      
      return response;
    };
  }

  private assessContribution(message: Message, request: OrchestrationRequest): number {
    // Assess based on relevance, quality, and uncertainty
    const relevance = this.assessRelevance(message, request.query);
    const quality = this.assessQuality(message);
    const certainty = 1 - message.metadata.uncertainty.total;
    
    return (relevance + quality + certainty) / 3;
  }

  private assessRelevance(message: Message, query: string): number {
    // Simple keyword matching
    const messageText = JSON.stringify(message.content).toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    const matches = queryWords.filter(word => messageText.includes(word)).length;
    
    return Math.min(matches / queryWords.length, 1.0);
  }

  private assessQuality(message: Message): number {
    const reasoningDepth = Math.min(message.content.reasoning.steps.length / 10, 1);
    const evidenceCount = Math.min(message.content.evidence.length / 5, 1);
    const confidence = message.content.reasoning.confidence.mean;
    
    return (reasoningDepth + evidenceCount + confidence) / 3;
  }

  private selectConsensusMethod(participants: ConsensusParticipant[], request: OrchestrationRequest): string {
    // Select based on participant characteristics and request constraints
    if (participants.length > 10) {
      return 'bayesian_aggregation'; // Better for large groups
    }
    
    if (request.constraints.minConfidence > 0.9) {
      return 'game_theoretic'; // Most rigorous
    }
    
    return this.config.consensus.defaultMethod;
  }

  private extractPosition(message: Message): string {
    // Extract the main conclusion
    const conclusions = message.content.reasoning.logicalStructure.conclusions;
    if (conclusions.length > 0) {
      const conclusionStep = message.content.reasoning.steps.find(s => s.id === conclusions[0]);
      return conclusionStep?.content || 'unknown';
    }
    
    return message.content.reasoning.steps[message.content.reasoning.steps.length - 1]?.content || 'unknown';
  }

  private extractDissent(participants: ConsensusParticipant[], consensus: string): any[] {
    const dissent: any[] = [];
    
    participants.forEach(p => {
      const position = this.extractPosition(p.message);
      if (position !== consensus) {
        dissent.push({
          agentId: p.agent.agent.getId(),
          position,
          reasoning: p.message.content.reasoning.steps.slice(-3).map(s => s.content).join(' '),
          confidence: p.message.content.reasoning.confidence.mean
        });
      }
    });
    
    return dissent;
  }

  private deduplicateAndOrder(steps: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];
    
    steps.forEach(step => {
      const key = `${step.type}_${step.concept}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(step);
      }
    });
    
    // Order by confidence
    return unique.sort((a, b) => b.confidence.mean - a.confidence.mean);
  }

  private mergeLogicalStructures(structures: any[]): any {
    const merged: Record<string, string[]> = {
      premises: [] as string[],
      inferences: [] as string[],
      conclusions: [] as string[],
      assumptions: [] as string[]
    };
    
    structures.forEach(struct => {
      merged.premises.push(...struct.premises);
      merged.inferences.push(...struct.inferences);
      merged.conclusions.push(...struct.conclusions);
      merged.assumptions.push(...struct.assumptions);
    });
    
    // Deduplicate
    Object.keys(merged).forEach(key => {
      merged[key] = Array.from(new Set(merged[key]));
    });
    
    return merged;
  }

  private extractConsensusPattern(participants: ConsensusParticipant[]): string {
    // Find most common pattern
    const patterns = participants.map(p => p.message.content.reasoning.temporalPattern);
    const patternCounts = new Map<string, number>();
    
    patterns.forEach(pattern => {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    });
    
    let bestPattern = '';
    let maxCount = 0;
    
    patternCounts.forEach((count, pattern) => {
      if (count > maxCount) {
        maxCount = count;
        bestPattern = pattern;
      }
    });
    
    return bestPattern;
  }

  private deduplicateEvidence(evidence: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];
    
    evidence.forEach(ev => {
      if (!seen.has(ev.content)) {
        seen.add(ev.content);
        unique.push(ev);
      }
    });
    
    return unique;
  }

  private rankEvidence(evidence: any[]): any[] {
    return evidence.sort((a, b) => {
      const scoreA = a.confidence.mean * a.metadata.reliability * a.metadata.relevance;
      const scoreB = b.confidence.mean * b.metadata.reliability * b.metadata.relevance;
      return scoreB - scoreA;
    });
  }

  private selectBestPredictions(predictions: any[]): any[] {
    // Group by type
    const byType = new Map<string, any[]>();
    
    predictions.forEach(pred => {
      const list = byType.get(pred.type) || [];
      list.push(pred);
      byType.set(pred.type, list);
    });
    
    // Select best from each type
    const best: any[] = [];
    
    byType.forEach((preds, type) => {
      const sorted = preds.sort((a, b) => b.confidence.mean - a.confidence.mean);
      if (sorted.length > 0) {
        best.push(sorted[0]);
      }
    });
    
    return best;
  }

  private updateTracking(result: OrchestrationResult): void {
    this.orchestrationHistory.push(result);
    
    // Update performance metrics
    const metrics = [
      result.performance.totalTime,
      result.performance.tokenUsage,
      result.confidence.mean
    ];
    
    this.performanceMetrics.set(result.consensus.id, metrics);
    
    // Maintain history size
    if (this.orchestrationHistory.length > 100) {
      this.orchestrationHistory = this.orchestrationHistory.slice(-100);
    }
  }

  private async adaptOrchestration(result: OrchestrationResult, request: OrchestrationRequest): Promise<void> {
    // Analyze performance trends
    const recentResults = this.orchestrationHistory.slice(-10);
    
    if (recentResults.length >= 5) {
      const avgConfidence = recentResults.reduce((sum, r) => sum + r.confidence.mean, 0) / recentResults.length;
      
      // Adapt consensus method if confidence is low
      if (avgConfidence < 0.7) {
        const currentMethod = this.config.consensus.defaultMethod;
        const methods = ['simple_majority', 'weighted_voting', 'bayesian_aggregation', 'game_theoretic'];
        const nextIndex = (methods.indexOf(currentMethod) + 1) % methods.length;
        this.config.consensus.defaultMethod = methods[nextIndex] as any;
      }
      
      // Adapt agent count if performance is poor
      const avgTime = recentResults.reduce((sum, r) => sum + r.performance.totalTime, 0) / recentResults.length;
      
      if (avgTime > request.constraints.maxTime * 0.8) {
        // Reduce agents
        this.config.agents.maxAgents = Math.max(3, this.config.agents.maxAgents - 1);
      } else if (avgConfidence < 0.8 && this.config.agents.maxAgents < 15) {
        // Increase agents
        this.config.agents.maxAgents = Math.min(15, this.config.agents.maxAgents + 1);
      }
    }
  }

  private async cleanupAgents(request: OrchestrationRequest): Promise<void> {
    // Return low-workload agents to pool
    const toPool: string[] = [];
    
    this.activeAgents.forEach((agent, id) => {
      if (agent.workload <= 1) {
        this.agentPool.push(agent.agent);
        toPool.push(id);
      }
    });
    
    toPool.forEach(id => this.activeAgents.delete(id));
    
    // Limit pool size
    if (this.agentPool.length > 20) {
      this.agentPool = this.agentPool.slice(-20);
    }
  }

  private extractConsensusFromBeliefs(beliefs: Map<string, number>, participants: ConsensusParticipant[]): string {
    // Find most agreed upon conclusion
    const conclusions = participants.flatMap(p =>
      p.message.content.reasoning.steps.filter(s =>
        p.message.content.reasoning.logicalStructure.conclusions.includes(s.id)
      )
    );
    
    if (conclusions.length > 0) {
      // Return most common conclusion
      const conclusionCounts = new Map<string, number>();
      conclusions.forEach(c => {
        conclusionCounts.set(c.content, (conclusionCounts.get(c.content) || 0) + 1);
      });
      
      let bestConclusion = '';
      let maxCount = 0;
      
      conclusionCounts.forEach((count, conclusion) => {
        if (count > maxCount) {
          maxCount = count;
          bestConclusion = conclusion;
        }
      });
      
      return bestConclusion;
    }
    
    return 'No clear consensus reached';
  }

  private extractStrategies(participants: ConsensusParticipant[]): string[] {
    const strategies = new Set<string>();
    
    participants.forEach(p => {
      strategies.add(this.extractPosition(p.message));
    });
    
    return Array.from(strategies);
  }

  private calculatePayoffMatrix(strategies: string[], participants: ConsensusParticipant[]): number[][] {
    const n = strategies.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    // Calculate payoffs based on agreement
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          // Coordination payoff
          matrix[i][j] = 1.0;
        } else {
          // Disagreement penalty
          matrix[i][j] = -0.5;
        }
      }
    }
    
    return matrix;
  }

  private findNashEquilibrium(payoffMatrix: number[][]): { strategy: number; stability: number } {
    // Simplified Nash equilibrium finder
    // In production would use more  algorithm
    
    const n = payoffMatrix.length;
    let bestStrategy = 0;
    let bestPayoff = -Infinity;
    
    for (let i = 0; i < n; i++) {
      const avgPayoff = payoffMatrix[i].reduce((a, b) => a + b) / n;
      if (avgPayoff > bestPayoff) {
        bestPayoff = avgPayoff;
        bestStrategy = i;
      }
    }
    
    return {
      strategy: bestStrategy,
      stability: (bestPayoff + 1) / 2 // Normalize to [0, 1]
    };
  }

  // === Public Methods ===

  public getActiveAgentCount(): number {
    return this.activeAgents.size;
  }

  public getPooledAgentCount(): number {
    return this.agentPool.length;
  }

  public getPerformanceMetrics(): any {
    const recent = this.orchestrationHistory.slice(-10);
    
    if (recent.length === 0) {
      return {
        avgTime: 0,
        avgConfidence: 0,
        avgAgents: 0,
        successRate: 0
      };
    }
    
    return {
      avgTime: recent.reduce((sum, r) => sum + r.performance.totalTime, 0) / recent.length,
      avgConfidence: recent.reduce((sum, r) => sum + r.confidence.mean, 0) / recent.length,
      avgAgents: recent.reduce((sum, r) => sum + r.performance.agentCount, 0) / recent.length,
      successRate: recent.filter(r => r.confidence.mean > 0.7).length / recent.length
    };
  }

  public async reset(): Promise<void> {
    // Reset all agents
    for (const agent of this.agentPool) {
      await agent.reset();
    }
    
    for (const activeAgent of this.activeAgents.values()) {
      await activeAgent.agent.reset();
    }
    
    // Clear tracking
    this.orchestrationHistory = [];
    this.performanceMetrics.clear();
    this.activeAgents.clear();
    this.agentPool = [];
  }
}

// Type definitions for internal use

interface RequestComplexity {
  score: number;
  factors: any;
  requiredCapabilities: string[];
  recommendedAgentCount: number;
}

interface ConsensusMethod {
  execute: (participants: ConsensusParticipant[], request: ConsensusRequest) => Promise<ConsensusResult>;
}