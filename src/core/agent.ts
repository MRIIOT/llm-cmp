/**
 *  Agent Implementation
 * Clean slate design with HTM, Bayesian reasoning, and adaptive capabilities
 */

import {
  AgentCapability,
  AgentMorphology,
  Message,
  MessageContent,
  MessageMetadata,
  ReasoningChain,
  ReasoningStep,
  Evidence,
  ConfidenceInterval,
  BayesianBelief,
  HTMState,
  TemporalContext,
  SemanticPosition,
  UncertaintyEstimate,
  PerformanceMetric,
  Prediction,
  LLMRequest,
  LLMResponse,
  AgentError,
  Config
} from '../types/index.js';

// Import our  components
import { HTMRegion } from '../core/htm/htm-region.js';
import { SequenceMemory } from '../core/temporal/sequence-memory.js';
import { TemporalContextManager } from '../core/temporal/temporal-context.js';
import { BayesianNetwork } from '../evidence/bayesian/bayesian-network.js';
import { InferenceEngine } from '../evidence/bayesian/inference-engine.js';
import { UncertaintyMetrics } from '../evidence/uncertainty/uncertainty-metrics.js';
import { AdaptiveAgent } from '../agents/dynamic/adaptive-agent.js';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  initialCapabilities: AgentCapability[];
  config: Partial<Config>;
}

export class Agent {
  // Identity
  private id: string;
  private name: string;
  private description: string;
  
  // Capabilities and morphology
  private capabilities: Map<string, AgentCapability>;
  private morphology: AgentMorphology;
  private adaptiveCore: AdaptiveAgent;
  
  // HTM temporal memory - Initialize immediately
  private htmRegion!: HTMRegion;
  private sequenceMemory!: SequenceMemory;
  private temporalContext!: TemporalContextManager;
  
  // Bayesian reasoning - Initialize immediately
  private bayesianNetwork!: BayesianNetwork;
  private inferenceEngine!: InferenceEngine;
  private uncertaintyMetrics!: UncertaintyMetrics;
  
  // State tracking
  private messageHistory: Message[];
  private performanceHistory: PerformanceMetric[];
  private currentHTMState: HTMState;
  private currentBelief: BayesianBelief;
  
  // Configuration
  private config: Config;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    
    // Initialize configuration with defaults
    this.config = this.mergeWithDefaults(config.config);
    
    // Initialize capabilities
    this.capabilities = new Map();
    config.initialCapabilities.forEach(cap => {
      this.capabilities.set(cap.id, cap);
    });
    
    // Initialize morphology
    this.morphology = {
      structure: this.buildInitialStructure(),
      connections: new Map(),
      emergentProperties: [],
      adaptationHistory: []
    };
    
    // Initialize adaptive core
    this.adaptiveCore = new AdaptiveAgent(
      this.id,
      Array.from(this.capabilities.values()).map(cap => ({
        id: cap.id,
        name: cap.name,
        strength: cap.strength,
        adaptationRate: cap.adaptationRate,
        specialization: cap.specializations, // Map specializations to specialization
        morphology: cap.morphology,
        lastUsed: cap.lastUsed,
        performanceHistory: cap.performanceHistory.map(p => p.quality)
      })),
      {
        specialization: { adaptationRate: this.config.agents.adaptationRate },
        morphology: { flexibilityFactor: 0.8 },
        evolution: { mutationRate: 0.05 },
        performance: { historySize: 100 }
      }
    );
    
    // Initialize  components
    this.initializeHTM();
    this.initializeBayesian();
    
    // Initialize state
    this.messageHistory = [];
    this.performanceHistory = [];
    this.currentHTMState = this.getInitialHTMState();
    this.currentBelief = this.getInitialBelief();
  }

  /**
   * Process a query and generate a  response
   */
  async processQuery(
    query: string,
    context: any = {},
    llmInterface: (request: LLMRequest) => Promise<LLMResponse>
  ): Promise<Message> {
    const startTime = Date.now();
    
    try {
      // 1. Update temporal context
      const temporalPattern = await this.updateTemporalContext(query);
      
      // 2. Generate reasoning chain
      const reasoning = await this.generateReasoning(query, context, llmInterface);
      
      // 3. Gather evidence
      const evidence = await this.gatherEvidence(query, reasoning, context);
      
      // 4. Update Bayesian beliefs
      const belief = await this.updateBeliefs(evidence, reasoning);
      
      // 5. Calculate semantic position
      const semanticPosition = await this.calculateSemanticPosition(query, reasoning);
      
      // 6. Generate predictions
      const predictions = await this.generatePredictions(reasoning, temporalPattern);
      
      // 7. Estimate uncertainty
      const uncertainty = this.estimateUncertainty(reasoning, evidence, belief);
      
      // 8. Create message
      const message = this.createMessage({
        reasoning,
        evidence,
        semanticPosition,
        temporalContext: temporalPattern,
        predictions
      }, {
        htmState: this.currentHTMState,
        bayesianBelief: belief,
        uncertainty,
        morphologySnapshot: this.morphology,
        processingTime: Date.now() - startTime
      });
      
      // 9. Update performance tracking
      await this.updatePerformance(message, query);
      
      // 10. Adapt if necessary
      await this.adaptIfNecessary(message);
      
      return message;
      
    } catch (error) {
      throw new AgentError(
        `Failed to process query: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        { query, error }
      );
    }
  }

  /**
   * Update temporal context with new query
   */
  private async updateTemporalContext(query: string): Promise<TemporalContext> {
    // Encode query for HTM
    const encoding = this.encodeForHTM(query);
    
    // Process through HTM
    const output = this.htmRegion.compute(encoding, true);
    
    // Update temporal context
    const contextPattern = new Array(50).fill(0); // 50 is the context dimensions
    // Fill pattern with some information from the query
    for (let i = 0; i < Math.min(query.length, 50); i++) {
      contextPattern[i] = query.charCodeAt(i) / 255; // Normalize to 0-1
    }
    
    this.temporalContext.updateContext(contextPattern, Date.now());
    
    // Get current context
    const contextData = this.temporalContext.getCurrentContext();
    
    // Update HTM state
    const activeColumnIndices: number[] = [];
    const predictedColumnIndices: number[] = [];
    
    // Convert boolean arrays to indices
    for (let i = 0; i < output.activeColumns.length; i++) {
      if (output.activeColumns[i]) {
        activeColumnIndices.push(i);
      }
    }
    
    for (let i = 0; i < output.predictions.length; i++) {
      if (output.predictions[i]) {
        predictedColumnIndices.push(i);
      }
    }
    
    this.currentHTMState = {
      activeColumns: activeColumnIndices,
      predictedColumns: predictedColumnIndices,
      anomalyScore: output.predictionAccuracy,
      sequenceId: this.generateSequenceId(),
      learningEnabled: true
    };
    
    // Build temporal context
    return {
      currentPattern: this.extractPatternFromArray(output.activeColumns),
      patternHistory: this.getRecentPatterns(),
      predictions: await this.getTemporalPredictions(),
      stability: output.stability || 0.5,
      periodicity: []
    };
  }

  /**
   * Generate  reasoning chain
   */
  private async generateReasoning(
    query: string,
    context: any,
    llmInterface: (request: LLMRequest) => Promise<LLMResponse>
  ): Promise<ReasoningChain> {
    const steps: ReasoningStep[] = [];
    
    // Select best capabilities for this query
    const selectedCapabilities = this.selectCapabilities(query, context);
    
    // Generate reasoning for each capability
    for (const capability of selectedCapabilities) {
      const prompt = this.buildReasoningPrompt(query, context, capability, steps);
      
      // Call LLM
      const response = await llmInterface({
        model: this.selectModel(capability),
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(capability),
        temperature: 0.7,
        maxTokens: 500,
        metadata: { agentId: this.id, capability: capability.id }
      });
      
      // Parse reasoning steps
      const newSteps = this.parseReasoningSteps(response.content, capability);
      steps.push(...newSteps);
    }
    
    // Build logical structure
    const logicalStructure = this.analyzeLogicalStructure(steps);
    
    // Calculate confidence
    const confidence = this.calculateChainConfidence(steps);
    
    // Extract temporal pattern
    const temporalPattern = this.extractTemporalPattern(steps);
    
    return {
      steps,
      confidence,
      logicalStructure,
      temporalPattern
    };
  }

  /**
   * Gather evidence based on reasoning
   */
  private async gatherEvidence(
    query: string,
    reasoning: ReasoningChain,
    context: any
  ): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    // Extract claims from reasoning
    const claims = this.extractClaims(reasoning);
    
    // Generate evidence for each claim
    for (const claim of claims) {
      const ev: Evidence = {
        id: this.generateId('evidence'),
        source: this.id,
        content: claim.content,
        confidence: claim.confidence,
        timestamp: new Date(),
        type: this.classifyEvidenceType(claim),
        metadata: {
          reliability: this.assessReliability(claim, reasoning),
          relevance: this.assessRelevance(claim, query),
          corroboration: this.findCorroboration(claim, evidence),
          conflicts: this.findConflicts(claim, evidence)
        }
      };
      
      evidence.push(ev);
    }
    
    return evidence;
  }

  /**
   * Update Bayesian beliefs with new evidence
   */
  private async updateBeliefs(
    evidence: Evidence[],
    reasoning: ReasoningChain
  ): Promise<BayesianBelief> {
    // Create nodes for key concepts
    const concepts = this.extractConcepts(reasoning, evidence);
    
    // Update network structure
    for (const concept of concepts) {
      if (!this.bayesianNetwork.getNode(concept)) {
        this.bayesianNetwork.addNode({
          id: concept,
          name: concept,
          states: ['true', 'false'],
          probabilities: new Map([['true', 0.5], ['false', 0.5]]),
          parents: [],
          children: [],
          evidence: undefined
        });
      }
    }
    
    // Add edges based on reasoning connections
    this.updateNetworkEdges(reasoning);
    
    // Set evidence
    const evidenceMap: Record<string, string> = {};
    evidence.forEach(ev => {
      const concept = this.evidenceToConcept(ev);
      if (concept && ev.confidence.mean > 0.7) {
        evidenceMap[concept] = 'true';
      }
    });
    
    // Perform inference
    const beliefs = new Map<string, any>();
    for (const node of this.bayesianNetwork.getAllNodes()) {
      try {
        const marginal = this.inferenceEngine.getMarginal(node.id);
        beliefs.set(node.id, {
          variable: node.id,
          states: new Map(Object.entries(marginal)),
          entropy: this.calculateEntropy(marginal),
          mostLikely: this.getMostLikely(marginal)
        });
      } catch (error) {
        // Handle inference errors gracefully
        beliefs.set(node.id, {
          variable: node.id,
          states: new Map([['true', 0.5], ['false', 0.5]]),
          entropy: 1.0,
          mostLikely: 'unknown'
        });
      }
    }
    
    // Create belief snapshot
    this.currentBelief = {
      beliefs,
      network: {
        nodes: this.bayesianNetwork.getAllNodes().map(n => n.id),
        edges: this.extractNetworkEdges(),
        cpts: new Map() // Simplified for now
      },
      lastUpdate: new Date()
    };
    
    return this.currentBelief;
  }

  /**
   * Calculate semantic position in concept space
   */
  private async calculateSemanticPosition(
    query: string,
    reasoning: ReasoningChain
  ): Promise<SemanticPosition> {
    // Extract semantic features
    const features = this.extractSemanticFeatures(query, reasoning);
    
    // Map to coordinates
    const coordinates = this.featuresToCoordinates(features);
    
    // Calculate trajectory if we have history
    const trajectory = this.calculateTrajectory(coordinates);
    
    return {
      coordinates,
      manifold: 'reasoning_space',
      confidence: reasoning.confidence.mean,
      trajectory
    };
  }

  /**
   * Generate predictions based on current state
   */
  private async generatePredictions(
    reasoning: ReasoningChain,
    temporalContext: TemporalContext
  ): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // Next step prediction
    const nextStep = this.predictNextReasoningStep(reasoning);
    if (nextStep) {
      predictions.push({
        type: 'next_step',
        content: nextStep.content,
        confidence: nextStep.confidence,
        timeframe: 1000, // 1 second
        basis: reasoning.steps.slice(-3).map(s => s.id)
      });
    }
    
    // Sequence prediction
    const sequence = this.predictSequence(temporalContext);
    if (sequence) {
      predictions.push({
        type: 'sequence',
        content: sequence.pattern,
        confidence: {
          mean: sequence.confidence,
          lower: sequence.confidence - 0.1,
          upper: sequence.confidence + 0.1,
          method: 'normal'
        },
        timeframe: 5000, // 5 seconds
        basis: temporalContext.patternHistory.slice(-5)
      });
    }
    
    return predictions;
  }

  /**
   * Estimate uncertainty in the response
   */
  private estimateUncertainty(
    reasoning: ReasoningChain,
    evidence: Evidence[],
    belief: BayesianBelief
  ): UncertaintyEstimate {
    // Calculate aleatoric uncertainty (data uncertainty)
    const aleatoricSources = [
      {
        type: 'data' as const,
        contribution: this.calculateDataUncertainty(evidence),
        description: 'Evidence variability'
      }
    ];
    const aleatoric = aleatoricSources.reduce((sum, s) => sum + s.contribution, 0);
    
    // Calculate epistemic uncertainty (knowledge uncertainty)
    const epistemicSources = [
      {
        type: 'model' as const,
        contribution: this.calculateModelUncertainty(reasoning),
        description: 'Reasoning model uncertainty'
      },
      {
        type: 'parameter' as const,
        contribution: this.calculateParameterUncertainty(belief),
        description: 'Belief parameter uncertainty'
      }
    ];
    const epistemic = epistemicSources.reduce((sum, s) => sum + s.contribution, 0);
    
    return {
      aleatoric,
      epistemic,
      total: Math.sqrt(aleatoric * aleatoric + epistemic * epistemic),
      sources: [...aleatoricSources, ...epistemicSources]
    };
  }

  /**
   * Create  message
   */
  private createMessage(
    content: MessageContent,
    metadata: MessageMetadata
  ): Message {
    const message: Message = {
      id: this.generateId('message'),
      timestamp: new Date(),
      agentId: this.id,
      agentCapabilities: Array.from(this.capabilities.keys()),
      content,
      metadata
    };
    
    // Add to history
    this.messageHistory.push(message);
    
    // Maintain history size
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(-100);
    }
    
    return message;
  }

  /**
   * Update performance tracking
   */
  private async updatePerformance(message: Message, query: string): Promise<void> {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      taskType: this.classifyTaskType(query),
      accuracy: this.assessAccuracy(message),
      efficiency: 1000 / message.metadata.processingTime, // inverse of time
      adaptability: this.assessAdaptability(message),
      quality: this.assessQuality(message)
    };
    
    this.performanceHistory.push(metric);
    
    // Update adaptive core
    await this.adaptiveCore.selfModify({
      performance: metric,
      message: message
    });
  }

  /**
   * Adapt agent if performance indicates need
   */
  private async adaptIfNecessary(message: Message): Promise<void> {
    const recentPerformance = this.performanceHistory.slice(-10);
    if (recentPerformance.length < 5) return; // Not enough data
    
    const avgQuality = recentPerformance.reduce((sum, p) => sum + p.quality, 0) / recentPerformance.length;
    
    if (avgQuality < 0.7) {
      // Trigger adaptation
      await this.adaptiveCore.adaptToTask({
        taskType: 'quality_improvement',
        complexity: 0.8,
        domain: 'reasoning',
        requiredCapabilities: ['analytical', 'synthesis'],
        timeConstraints: 5000,
        qualityThresholds: 0.8
      });
      
      // Update morphology
      this.morphology.adaptationHistory.push({
        timestamp: new Date(),
        changeType: 'structural',
        before: this.morphology.structure,
        after: this.adaptiveCore.getSpecializationProfile().morphology,
        trigger: 'low_quality_performance'
      });
      
      this.morphology.structure = this.adaptiveCore.getSpecializationProfile().morphology;
    }
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
        memoryLimit: 1024 * 1024 * 1024, // 1GB
        adaptiveOptimization: true,
        ...config.performance
      }
    };
  }

  private buildInitialStructure(): any {
    return {
      layers: [
        { type: 'input', size: 100 },
        { type: 'processing', size: 200 },
        { type: 'integration', size: 150 },
        { type: 'output', size: 100 }
      ],
      connections: 'fully_connected'
    };
  }

  private initializeHTM(): void {
    this.htmRegion = new HTMRegion({
      name: `htm_${this.id}`,
      numColumns: this.config.htm.columnCount,
      cellsPerColumn: this.config.htm.cellsPerColumn,
      inputSize: 2048,
      enableSpatialLearning: true,
      enableTemporalLearning: true,
      learningMode: 'online',
      predictionSteps: 5,
      maxMemoryTraces: 100,
      stabilityThreshold: 0.8,
      spatialConfig: {
        synPermActiveInc: this.config.htm.learningRate,
        synPermInactiveDec: this.config.htm.learningRate * 0.1
      }
    });
    
    this.sequenceMemory = new SequenceMemory({
      maxEpisodes: this.config.htm.maxSequenceLength,
      consolidationThreshold: 5,
      decayRate: 0.01,
      similarityThreshold: 0.7
    });
    
    this.temporalContext = new TemporalContextManager({
      contextDimensions: 50,
      adaptationRate: this.config.agents.adaptationRate
    });
  }

  private initializeBayesian(): void {
    this.bayesianNetwork = new BayesianNetwork();
    this.inferenceEngine = new InferenceEngine(this.bayesianNetwork);
    this.uncertaintyMetrics = new UncertaintyMetrics();
  }

  private getInitialHTMState(): HTMState {
    return {
      activeColumns: [],
      predictedColumns: [],
      anomalyScore: 0,
      sequenceId: this.generateSequenceId(),
      learningEnabled: true
    };
  }

  private getInitialBelief(): BayesianBelief {
    return {
      beliefs: new Map(),
      network: {
        nodes: [],
        edges: [],
        cpts: new Map()
      },
      lastUpdate: new Date()
    };
  }

  private encodeForHTM(text: string): boolean[] {
    // Simple encoding - would be more  in production
    const encoding = new Array(2048).fill(false);
    const hash = this.hashString(text);
    
    // Activate sparse bits based on hash
    for (let i = 0; i < 200; i++) {
      const index = (hash + i * 37) % encoding.length;
      encoding[index] = true;
    }
    
    return encoding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getAgentState(): any {
    return {
      id: this.id,
      capabilities: Array.from(this.capabilities.keys()),
      morphology: this.morphology.emergentProperties,
      performance: this.performanceHistory.slice(-1)[0] || null
    };
  }

  private extractNetworkEdges(): Array<[string, string]> {
    const edges: Array<[string, string]> = [];
    const nodes = this.bayesianNetwork.getAllNodes();
    
    for (const node of nodes) {
      for (const childId of node.children) {
        edges.push([node.id, childId]);
      }
    }
    
    return edges;
  }

  private extractPattern(activeColumns: Set<number>): string {
    // Convert active columns to pattern string
    return Array.from(activeColumns).sort().join('-');
  }

  private extractPatternFromArray(activeColumns: boolean[]): string {
    // Convert active columns array to pattern string
    const activeIndices: number[] = [];
    for (let i = 0; i < activeColumns.length; i++) {
      if (activeColumns[i]) {
        activeIndices.push(i);
      }
    }
    return activeIndices.join('-');
  }

  private getRecentPatterns(): string[] {
    return this.messageHistory
      .slice(-10)
      .map(m => m.content.temporalContext.currentPattern);
  }

  private async getTemporalPredictions(): Promise<any[]> {
    // Simplified prediction
    return [{
      pattern: 'next_pattern',
      timeHorizon: 1000,
      confidence: 0.7,
      alternatives: []
    }];
  }

  private generateSequenceId(): string {
    return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private selectCapabilities(query: string, context: any): AgentCapability[] {
    // Select top 3 most relevant capabilities
    const scored = Array.from(this.capabilities.values()).map(cap => ({
      capability: cap,
      score: this.scoreCapabilityRelevance(cap, query, context)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, 3).map(s => s.capability);
  }

  private scoreCapabilityRelevance(cap: AgentCapability, query: string, context: any): number {
    // Simple scoring based on keyword matching and strength
    let score = cap.strength;
    
    // Boost if specialization matches query keywords
    const queryLower = query.toLowerCase();
    cap.specializations.forEach(spec => {
      if (queryLower.includes(spec.toLowerCase())) {
        score += 0.2;
      }
    });
    
    return Math.min(score, 1.0);
  }

  private selectModel(capability: AgentCapability): string {
    // Select model based on capability requirements
    if (capability.specializations.includes('analytical')) {
      return 'gpt-4';
    } else if (capability.specializations.includes('creative')) {
      return 'claude-3-opus';
    }
    return 'gpt-3.5-turbo';
  }

  private buildReasoningPrompt(
    query: string,
    context: any,
    capability: AgentCapability,
    previousSteps: ReasoningStep[]
  ): string {
    const previousContext = previousSteps.length > 0
      ? `\n\nPrevious reasoning:\n${previousSteps.map(s => `- ${s.content}`).join('\n')}`
      : '';
    
    return `As an agent with ${capability.name} capability, analyze the following query:

Query: ${query}

Context: ${JSON.stringify(context, null, 2)}
${previousContext}

Provide a detailed reasoning response focusing on ${capability.specializations.join(', ')}. 
Structure your response as clear reasoning steps.`;
  }

  private getSystemPrompt(capability: AgentCapability): string {
    return `You are a  reasoning agent with specialized capability in ${capability.name}. 
Your specializations include: ${capability.specializations.join(', ')}.
Provide clear, logical reasoning with explicit confidence levels.`;
  }

  private parseReasoningSteps(content: string, capability: AgentCapability): ReasoningStep[] {
    // Parse LLM response into reasoning steps
    const lines = content.split('\n').filter(line => line.trim());
    const steps: ReasoningStep[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        steps.push({
          id: this.generateId('step'),
          type: this.inferReasoningType(line, capability),
          content: line,
          concept: this.extractConcept(line),
          confidence: {
            mean: 0.8 - (index * 0.05), // Decreasing confidence
            lower: 0.7 - (index * 0.05),
            upper: 0.9 - (index * 0.05),
            method: 'normal'
          },
          supporting: index > 0 ? [steps[index - 1].id] : [],
          refuting: []
        });
      }
    });
    
    return steps;
  }

  private inferReasoningType(content: string, capability: AgentCapability): any {
    const lower = content.toLowerCase();
    if (lower.includes('observe') || lower.includes('notice')) return 'observation';
    if (lower.includes('therefore') || lower.includes('thus')) return 'deduction';
    if (lower.includes('likely') || lower.includes('probably')) return 'inference';
    if (lower.includes('predict')) return 'prediction';
    return 'inference';
  }

  private extractConcept(content: string): string {
    // Extract key concept from content
    const words = content.split(' ').filter(w => w.length > 4);
    return words[0] || 'concept';
  }

  private analyzeLogicalStructure(steps: ReasoningStep[]): any {
    return {
      premises: steps.filter(s => s.type === 'observation').map(s => s.id),
      inferences: steps.filter(s => s.type === 'inference').map(s => s.id),
      conclusions: steps.filter(s => s.type === 'deduction').map(s => s.id),
      assumptions: [] // Would need more  analysis
    };
  }

  private calculateChainConfidence(steps: ReasoningStep[]): ConfidenceInterval {
    if (steps.length === 0) {
      return { mean: 0, lower: 0, upper: 0, method: 'normal' };
    }
    
    const confidences = steps.map(s => s.confidence.mean);
    const mean = confidences.reduce((a, b) => a + b) / confidences.length;
    const std = Math.sqrt(
      confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length
    );
    
    return {
      mean,
      lower: Math.max(0, mean - 1.96 * std),
      upper: Math.min(1, mean + 1.96 * std),
      method: 'normal'
    };
  }

  private extractTemporalPattern(steps: ReasoningStep[]): string {
    return steps.map(s => s.type.charAt(0)).join('-');
  }

  private extractClaims(reasoning: ReasoningChain): any[] {
    return reasoning.steps
      .filter(s => s.confidence.mean > 0.6)
      .map(s => ({
        content: s.content,
        confidence: s.confidence,
        step: s
      }));
  }

  private classifyEvidenceType(claim: any): any {
    if (claim.step.type === 'observation') return 'empirical';
    if (claim.step.type === 'inference') return 'analytical';
    return 'theoretical';
  }

  private assessReliability(claim: any, reasoning: ReasoningChain): number {
    // Higher confidence and more support = higher reliability
    const supportCount = claim.step.supporting.length;
    return claim.confidence.mean * (1 + supportCount * 0.1);
  }

  private assessRelevance(claim: any, query: string): number {
    // Simple keyword matching for relevance
    const claimWords = claim.content.toLowerCase().split(' ');
    const queryWords = query.toLowerCase().split(' ');
    const overlap = claimWords.filter((w: string) => queryWords.includes(w)).length;
    return Math.min(overlap / queryWords.length, 1.0);
  }

  private findCorroboration(claim: any, evidence: Evidence[]): string[] {
    return evidence
      .filter(ev => ev.content.includes(claim.step.concept))
      .map(ev => ev.id);
  }

  private findConflicts(claim: any, evidence: Evidence[]): string[] {
    return evidence
      .filter(ev => ev.metadata.conflicts.includes(claim.step.id))
      .map(ev => ev.id);
  }

  private extractConcepts(reasoning: ReasoningChain, evidence: Evidence[]): string[] {
    const concepts = new Set<string>();
    
    reasoning.steps.forEach(step => {
      concepts.add(step.concept);
    });
    
    evidence.forEach(ev => {
      const words = ev.content.split(' ').filter(w => w.length > 4);
      words.slice(0, 2).forEach(w => concepts.add(w));
    });
    
    return Array.from(concepts);
  }

  private updateNetworkEdges(reasoning: ReasoningChain): void {
    reasoning.steps.forEach(step => {
      step.supporting.forEach(supportId => {
        const supportStep = reasoning.steps.find(s => s.id === supportId);
        if (supportStep) {
          this.bayesianNetwork.addEdge(supportStep.concept, step.concept);
        }
      });
    });
  }

  private evidenceToConcept(evidence: Evidence): string {
    return evidence.content.split(' ')[0];
  }

  private calculateEntropy(distribution: any): number {
    let entropy = 0;
    Object.values(distribution).forEach((p: any) => {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });
    return entropy;
  }

  private getMostLikely(distribution: any): string {
    let maxProb = 0;
    let mostLikely = 'unknown';
    
    Object.entries(distribution).forEach(([state, prob]: [string, any]) => {
      if (prob > maxProb) {
        maxProb = prob;
        mostLikely = state;
      }
    });
    
    return mostLikely;
  }

  private extractSemanticFeatures(query: string, reasoning: ReasoningChain): number[] {
    // Simple feature extraction
    const features = new Array(10).fill(0);
    
    // Query length feature
    features[0] = Math.min(query.length / 100, 1);
    
    // Reasoning depth
    features[1] = Math.min(reasoning.steps.length / 20, 1);
    
    // Confidence
    features[2] = reasoning.confidence.mean;
    
    // Type diversity
    const types = new Set(reasoning.steps.map(s => s.type));
    features[3] = types.size / 9; // 9 reasoning types
    
    return features;
  }

  private featuresToCoordinates(features: number[]): number[] {
    // Map features to higher dimensional space
    const coords = [];
    
    for (let i = 0; i < features.length; i++) {
      coords.push(features[i]);
      // Add some non-linear transformations
      coords.push(Math.sin(features[i] * Math.PI));
      coords.push(Math.cos(features[i] * Math.PI));
    }
    
    return coords;
  }

  private calculateTrajectory(coordinates: number[]): any {
    // Need at least 2 positions for trajectory
    if (this.messageHistory.length < 2) {
      return {
        positions: [{ coordinates, manifold: 'reasoning_space', confidence: 1, trajectory: null }],
        velocity: new Array(coordinates.length).fill(0),
        acceleration: new Array(coordinates.length).fill(0),
        curvature: 0
      };
    }
    
    // Get previous position
    const prevMessage = this.messageHistory[this.messageHistory.length - 1];
    const prevCoords = prevMessage.content.semanticPosition.coordinates;
    
    // Calculate velocity
    const velocity = coordinates.map((c, i) => c - (prevCoords[i] || 0));
    
    return {
      positions: [prevMessage.content.semanticPosition],
      velocity,
      acceleration: new Array(coordinates.length).fill(0),
      curvature: 0
    };
  }

  private predictNextReasoningStep(reasoning: ReasoningChain): any {
    if (reasoning.steps.length === 0) return null;
    
    const lastStep = reasoning.steps[reasoning.steps.length - 1];
    
    return {
      content: `Following from "${lastStep.content}", the next logical step would be...`,
      confidence: {
        mean: lastStep.confidence.mean * 0.9,
        lower: lastStep.confidence.lower * 0.9,
        upper: lastStep.confidence.upper * 0.9,
        method: 'normal'
      }
    };
  }

  private predictSequence(context: TemporalContext): any {
    if (context.patternHistory.length < 3) return null;
    
    return {
      pattern: context.patternHistory[context.patternHistory.length - 1] + '-next',
      confidence: 0.7
    };
  }

  private calculateDataUncertainty(evidence: Evidence[]): number {
    if (evidence.length === 0) return 1.0;
    
    const confidences = evidence.map(e => e.confidence.mean);
    const variance = this.calculateVariance(confidences);
    
    return Math.min(variance * 2, 1.0);
  }

  private calculateModelUncertainty(reasoning: ReasoningChain): number {
    // Higher step count = more uncertainty
    return Math.min(reasoning.steps.length * 0.05, 0.5);
  }

  private calculateParameterUncertainty(belief: BayesianBelief): number {
    // Average entropy across beliefs
    let totalEntropy = 0;
    let count = 0;
    
    belief.beliefs.forEach(b => {
      totalEntropy += b.entropy;
      count++;
    });
    
    return count > 0 ? totalEntropy / count : 0.5;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private classifyTaskType(query: string): string {
    const lower = query.toLowerCase();
    if (lower.includes('why') || lower.includes('how')) return 'explanation';
    if (lower.includes('what if') || lower.includes('predict')) return 'prediction';
    if (lower.includes('analyze')) return 'analysis';
    return 'general';
  }

  private assessAccuracy(message: Message): number {
    // Based on confidence and uncertainty
    return message.content.reasoning.confidence.mean * 
           (1 - message.metadata.uncertainty.total);
  }

  private assessAdaptability(message: Message): number {
    // Based on capability usage
    const usedCapabilities = message.agentCapabilities.length;
    const totalCapabilities = this.capabilities.size;
    return usedCapabilities / totalCapabilities;
  }

  private assessQuality(message: Message): number {
    // Composite quality score
    const reasoningDepth = Math.min(message.content.reasoning.steps.length / 10, 1);
    const evidenceQuality = this.assessEvidenceQuality(message.content.evidence);
    const uncertaintyControl = 1 - message.metadata.uncertainty.total;
    
    return (reasoningDepth + evidenceQuality + uncertaintyControl) / 3;
  }

  private assessEvidenceQuality(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    const avgReliability = evidence.reduce((sum, e) => sum + e.metadata.reliability, 0) / evidence.length;
    const avgRelevance = evidence.reduce((sum, e) => sum + e.metadata.relevance, 0) / evidence.length;
    
    return (avgReliability + avgRelevance) / 2;
  }

  // === Public Methods ===

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getCapabilities(): AgentCapability[] {
    return Array.from(this.capabilities.values());
  }

  public getPerformanceHistory(): PerformanceMetric[] {
    return [...this.performanceHistory];
  }

  public async reset(): Promise<void> {
    this.messageHistory = [];
    this.performanceHistory = [];
    this.htmRegion.reset();
    this.bayesianNetwork = new BayesianNetwork();
    this.inferenceEngine = new InferenceEngine(this.bayesianNetwork);
    this.currentHTMState = this.getInitialHTMState();
    this.currentBelief = this.getInitialBelief();
  }
}