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
  ReasoningType,
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
  Config,
  LogicalStatement,
  InferenceRule,
  Predicate,
  Quantifier,
  LogicalConnective,
  COMMON_INFERENCE_RULES
} from '../types/index.js';

// Import our  components
import { HTMRegion } from '../core/htm/htm-region.js';
import { SequenceMemory } from '../core/temporal/sequence-memory.js';
import { TemporalContextManager } from '../core/temporal/temporal-context.js';
import { BayesianNetwork } from '../evidence/bayesian/bayesian-network.js';
import { InferenceEngine } from '../evidence/bayesian/inference-engine.js';
import { UncertaintyMetrics } from '../evidence/uncertainty/uncertainty-metrics.js';
import { AdaptiveAgent } from '../agents/dynamic/adaptive-agent.js';
import { SemanticEncoder } from './semantic/index.js';
import { DomainAwareAnomalyCalculator } from './htm/domain-aware-anomaly.js';

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
  
  // Semantic encoding
  private semanticEncoder!: SemanticEncoder;
  
  // Domain-aware anomaly detection
  private domainAnomalyCalculator?: DomainAwareAnomalyCalculator;
  
  // State tracking
  private messageHistory: Message[];
  private performanceHistory: PerformanceMetric[];
  private currentHTMState: HTMState;
  private currentBelief: BayesianBelief;
  private previousHTMPredictions: number[] = [];
  private iteration: number = 0;
  
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
    
    // Initialize semantic encoder if not already done
    if (!this.semanticEncoder) {
      this.semanticEncoder = new SemanticEncoder(llmInterface, {
        numColumns: this.config.htm.columnCount,
        sparsity: 0.02,
        // Pass through semantic configuration if provided
        ...(this.config.semantic || {})
      });
    }
    
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
      
      // 11. Increment iteration counter
      this.iteration++;
      
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
    // Encode query using semantic encoding
    const encoding = await this.semanticEncoder.encodeWithFallback(query);
    
    // Process through HTM
    const output = this.htmRegion.compute(encoding, true);
    
    // Update temporal context
    const contextPattern = new Array(50).fill(0); // 50 is the context dimensions
    // Fill pattern with semantic information
    const activeIndices = encoding.map((bit, idx) => bit ? idx : -1).filter(idx => idx >= 0);
    for (let i = 0; i < Math.min(activeIndices.length, 50); i++) {
      contextPattern[i] = activeIndices[i] / this.config.htm.columnCount; // Normalize to 0-1
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
    
    // Check if we had predictions to compare against
    // If this is the first query or there were no previous predictions, set anomaly to -1 (N/A)
    let anomalyScore: number;
    if (this.iteration === 0 || output.predictionAccuracy === 0) {
      // No previous predictions to compare against or no predictions made
      // Check if we actually had predictions from previous step
      const hadPreviousPredictions = this.previousHTMPredictions && this.previousHTMPredictions.length > 0;
      if (!hadPreviousPredictions) {
        anomalyScore = -1; // Sentinel value meaning "N/A"
      } else {
        // We had predictions but accuracy is 0 - this is a real 100% anomaly
        anomalyScore = 1.0;
      }
    } else {
      // Normal case: we have predictions to compare against
      anomalyScore = 1 - output.predictionAccuracy; // Invert: high accuracy = low anomaly
    }
    
    // Use domain-aware anomaly calculation if available
    if (this.domainAnomalyCalculator && anomalyScore >= 0) {
      // Calculate semantic similarity if we have previous messages
      let semanticSimilarity: number | undefined;
      if (this.messageHistory.length > 0) {
        const lastMessage = this.messageHistory[this.messageHistory.length - 1];
        const lastEncoding = lastMessage.metadata.htmState.activeColumns.map(idx => {
          const arr = new Array(this.config.htm.columnCount).fill(false);
          arr[idx] = true;
          return arr;
        }).reduce((acc, arr) => {
          arr.forEach((val, idx) => acc[idx] = acc[idx] || val);
          return acc;
        }, new Array(this.config.htm.columnCount).fill(false));
        
        // Calculate overlap between current and previous encoding
        let overlap = 0;
        let active1 = 0;
        let active2 = 0;
        for (let i = 0; i < encoding.length; i++) {
          if (encoding[i]) active1++;
          if (lastEncoding[i]) active2++;
          if (encoding[i] && lastEncoding[i]) overlap++;
        }
        semanticSimilarity = (active1 > 0 && active2 > 0) ? overlap / Math.min(active1, active2) : 0;
      }
      
      // Use domain-aware calculation
      anomalyScore = this.domainAnomalyCalculator.calculateAnomaly(
        output,
        encoding,
        semanticSimilarity
      );
    }
    
    this.currentHTMState = {
      activeColumns: activeColumnIndices,
      predictedColumns: predictedColumnIndices,
      anomalyScore: anomalyScore,
      sequenceId: this.generateSequenceId(),
      learningEnabled: true
    };
    
    // Store current predictions for next iteration
    this.previousHTMPredictions = predictedColumnIndices;
    
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
        metadata: { agentId: this.id, capability: capability.id, purpose: "generate-reasoning" }
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
      },
      semantic: config.semantic ? { ...config.semantic } : undefined,
      anomaly: config.anomaly ? { ...config.anomaly } : undefined
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
    // Debug log HTM configuration
    console.log(`[Agent] Initializing HTM with config:`, {
      columnCount: this.config.htm.columnCount,
      cellsPerColumn: this.config.htm.cellsPerColumn,
      totalCells: this.config.htm.columnCount * this.config.htm.cellsPerColumn
    });
    
    this.htmRegion = new HTMRegion({
      name: `htm_${this.id}`,
      numColumns: this.config.htm.columnCount,
      cellsPerColumn: this.config.htm.cellsPerColumn,
      inputSize: this.config.htm.columnCount,  // Use configured column count instead of hardcoded 2048
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
    
    // Initialize domain-aware anomaly calculator if configured
    if (this.config.anomaly?.domainAwareScoring) {
      this.domainAnomalyCalculator = new DomainAwareAnomalyCalculator(this.config.anomaly);
    }
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

  /**
   * @deprecated Replaced by SemanticEncoder.encodeWithFallback
   * Original hash-based encoding kept for reference
   */
  /*
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
  */

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
      return 'gpt-3.5-turbo';
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
      ? `\n\nPrevious reasoning steps:\n${previousSteps.map(s => 
          `- [${s.type.toUpperCase()}:${s.concept}${s.logicalForm ? '|' + s.logicalForm.formalNotation : ''}] ${s.content}`
        ).join('\n')}`
      : '';
    
    return `You are a specialized reasoning agent with ${capability.name} capability.

QUERY: ${query}

CONTEXT: ${JSON.stringify(context, null, 2)}
${previousContext}

INSTRUCTIONS:
Generate reasoning steps in this EXACT format. Each line must follow this pattern:

[TYPE:CONCEPT|LOGICAL_FORM] reasoning content here

Where:
- TYPE is one of: OBSERVATION, INFERENCE, DEDUCTION, ANALYSIS, PREDICTION, HYPOTHESIS, SYNTHESIS
- CONCEPT is a short descriptor (1-3 words, use underscores for spaces)
- LOGICAL_FORM is optional formal notation using predicate logic

LOGICAL NOTATION GUIDE:
- Predicates: Temperature(x), Causes(x,y), Increases(x)
- Quantifiers: ∀x (for all), ∃x (exists)
- Connectives: ∧ (and), ∨ (or), → (implies), ¬ (not), ↔ (iff)
- Examples: ∀x(P(x) → Q(x)), Causes(warming, storms) ∧ Increases(frequency)

EXAMPLES:
[OBSERVATION:temperature_data|Temperature(current, 1.1°C_above_baseline)] Current global temperature shows 1.1°C increase
[INFERENCE:causal_link|Temperature(↑) → ExtremeWeather(↑)] Rising temperatures lead to more extreme weather
[DEDUCTION:future_impact|NoAction → Temperature(+2-4°C)] Without intervention, temperatures will rise 2-4°C
[SYNTHESIS:action_required|Limit(1.5°C) → RequiresAction(immediate)] Immediate action needed to limit warming

IMPORTANT:
- Each reasoning step MUST start with [TYPE:CONCEPT] (logical form optional)
- Use formal notation when relationships/logic are clear
- Build logical chains that support your conclusions
- Focus your analysis on: ${capability.specializations.join(', ')}

Begin your reasoning:`;
  }

  private getSystemPrompt(capability: AgentCapability): string {
    return `You are an expert reasoning agent specialized in ${capability.name}.

Your core competencies: ${capability.specializations.join(', ')}

CRITICAL FORMATTING RULES:
1. Every reasoning step must begin with [TYPE:CONCEPT|LOGICAL_FORM] format
2. Types: OBSERVATION, INFERENCE, DEDUCTION, ANALYSIS, PREDICTION, HYPOTHESIS, SYNTHESIS
3. Concepts should be 1-3 words, descriptive, using underscores for spaces
4. Logical forms are optional but encouraged for formal reasoning
5. Use predicate logic notation: P(x), ∀x, ∃x, →, ∧, ∨, ¬, ↔
6. One reasoning step per line
7. Build logical connections between steps

LOGICAL NOTATION:
- Predicates: CapitalCase(args) e.g., Temperature(high), Causes(x,y)
- Universal: ∀x(P(x) → Q(x)) means "for all x, if P(x) then Q(x)"
- Existential: ∃x(P(x) ∧ Q(x)) means "there exists x such that P(x) and Q(x)"
- Implication: P → Q (if P then Q)
- Conjunction: P ∧ Q (P and Q)
- Disjunction: P ∨ Q (P or Q)
- Negation: ¬P (not P)

You excel at structured, logical thinking and always follow the specified format precisely.`;
  }

  private parseReasoningSteps(content: string, capability: AgentCapability): ReasoningStep[] {
    const steps: ReasoningStep[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    // Enhanced regex to match [TYPE:CONCEPT|LOGICAL_FORM] format
    const stepPattern = /^\[([A-Z_]+):([^\]|]+)(?:\|([^\]]+))?\]\s*(.+)$/;
    
    lines.forEach((line, index) => {
      const match = line.match(stepPattern);
      
      if (match) {
        const [_, type, concept, logicalFormNotation, reasoning] = match;
        
        // Create logical form if notation provided
        let logicalForm: LogicalStatement | undefined;
        let inferenceRule: InferenceRule | undefined;
        
        if (logicalFormNotation) {
          logicalForm = {
            id: this.generateId('stmt'),
            content: reasoning.trim(),
            formalNotation: logicalFormNotation.trim(),
            predicates: this.extractPredicates(logicalFormNotation),
            quantifiers: this.extractQuantifiers(logicalFormNotation),
            connectives: this.extractConnectives(logicalFormNotation)
          };
          
          // Check if this step uses a known inference rule
          inferenceRule = this.matchInferenceRule(type, logicalFormNotation, steps);
        }
        
        steps.push({
          id: this.generateId('step'),
          type: this.normalizeType(type),
          content: reasoning.trim(),
          concept: this.normalizeConcept(concept),
          confidence: this.calculateStepConfidence(reasoning, type, steps),
          supporting: this.findSupportingSteps(reasoning, concept, steps),
          refuting: this.findRefutingSteps(reasoning, concept, steps),
          logicalForm,
          inferenceRule
        });
      } else {
        // Fallback for non-conforming lines
        console.warn(`Line doesn't match expected format: ${line}`);
        
        // Try to salvage what we can
        steps.push({
          id: this.generateId('step'),
          type: this.inferReasoningType(line, capability),
          content: line,
          concept: this.extractFallbackConcept(line),
          confidence: { mean: 0.5, lower: 0.4, upper: 0.6, method: 'normal' },
          supporting: [],
          refuting: []
        });
      }
    });
    
    return steps;
  }

  private extractPredicates(logicalNotation: string): Predicate[] {
    const predicates: Predicate[] = [];
    // Match predicate patterns like Temperature(current, 1.1°C)
    const predicatePattern = /([A-Z][a-zA-Z]*)\(([^)]+)\)/g;
    let match;
    
    while ((match = predicatePattern.exec(logicalNotation)) !== null) {
      const [_, symbol, argsStr] = match;
      const args = argsStr.split(',').map(arg => arg.trim());
      predicates.push({
        symbol,
        arity: args.length,
        arguments: args
      });
    }
    
    return predicates;
  }

  private extractQuantifiers(logicalNotation: string): Quantifier[] {
    const quantifiers: Quantifier[] = [];
    // Match quantifier patterns like ∀x or ∃y
    const quantifierPattern = /(∀|∃)([a-z])/g;
    let match;
    
    while ((match = quantifierPattern.exec(logicalNotation)) !== null) {
      const [_, type, variable] = match;
      quantifiers.push({
        type: type === '∀' ? 'universal' : 'existential',
        variable,
        scope: this.generateId('scope')
      });
    }
    
    return quantifiers;
  }

  private extractConnectives(logicalNotation: string): LogicalConnective[] {
    const connectives: LogicalConnective[] = [];
    // Map symbols to connective types
    const connectiveMap: Record<string, LogicalConnective['type']> = {
      '∧': 'and',
      '∨': 'or',
      '¬': 'not',
      '→': 'implies',
      '↔': 'iff',
      '⊃': 'implies'
    };
    
    Object.entries(connectiveMap).forEach(([symbol, type]) => {
      if (logicalNotation.includes(symbol)) {
        connectives.push({
          type,
          operands: [] // Would need more sophisticated parsing for operands
        });
      }
    });
    
    return connectives;
  }

  private matchInferenceRule(type: string, logicalNotation: string, previousSteps: ReasoningStep[]): InferenceRule | undefined {
    // Check for common inference patterns
    if (type === 'DEDUCTION' && logicalNotation.includes('→')) {
      // Check for modus ponens pattern
      if (previousSteps.length >= 2) {
        const hasImplication = previousSteps.some(s => 
          s.logicalForm?.formalNotation.includes('→')
        );
        if (hasImplication) {
          return COMMON_INFERENCE_RULES.find(r => r.name === 'Modus Ponens');
        }
      }
      
      // Check for hypothetical syllogism
      const implicationCount = previousSteps.filter(s => 
        s.logicalForm?.formalNotation.includes('→')
      ).length;
      if (implicationCount >= 2) {
        return COMMON_INFERENCE_RULES.find(r => r.name === 'Hypothetical Syllogism');
      }
    }
    
    // Check for universal instantiation
    if (logicalNotation.includes('∀') && previousSteps.some(s => 
      s.logicalForm?.formalNotation.includes('∀')
    )) {
      return COMMON_INFERENCE_RULES.find(r => r.name === 'Universal Instantiation');
    }
    
    return undefined;
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

  private normalizeType(type: string): ReasoningType {
    const typeMap: Record<string, ReasoningType> = {
      'OBSERVATION': 'observation',
      'INFERENCE': 'inference',
      'DEDUCTION': 'deduction',
      'ANALYSIS': 'analogy',  // Map ANALYSIS to analogy
      'PREDICTION': 'prediction',
      'HYPOTHESIS': 'abduction',  // Map HYPOTHESIS to abduction
      'CONCLUSION': 'synthesis',  // Map CONCLUSION to synthesis
      'SYNTHESIS': 'synthesis'   // Also map SYNTHESIS directly
    };
    
    return typeMap[type.toUpperCase()] || 'inference';
  }

  private normalizeConcept(concept: string): string {
    return concept
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 50); // limit length
  }

  private calculateStepConfidence(
    content: string,
    type: string,
    previousSteps: ReasoningStep[]
  ): ConfidenceInterval {
    let baseConfidence = 0.75;
    
    // Type-based confidence adjustments
    const typeConfidence: Record<string, number> = {
      'observation': 0.85,    // Direct observations are high confidence
      'deduction': 0.80,      // Logical deductions are fairly confident
      'synthesis': 0.80,      // Conclusions/synthesis from evidence
      'analogy': 0.75,        // Analysis involves interpretation
      'inference': 0.70,      // Inferences have more uncertainty
      'prediction': 0.65,     // Predictions are inherently uncertain
      'abduction': 0.60,      // Hypotheses are most uncertain
      'induction': 0.70,      // Inductive reasoning
      'critique': 0.75        // Critical evaluation
    };
    
    baseConfidence = typeConfidence[this.normalizeType(type)] || 0.70;
    
    // Content-based adjustments
    const uncertaintyMarkers = [
      { pattern: /\b(might|may|possibly|perhaps)\b/i, penalty: 0.15 },
      { pattern: /\b(could|potentially|likely)\b/i, penalty: 0.10 },
      { pattern: /\b(probably|seems|appears)\b/i, penalty: 0.05 }
    ];
    
    const certaintyMarkers = [
      { pattern: /\b(definitely|certainly|clearly)\b/i, bonus: 0.10 },
      { pattern: /\b(must|will|always)\b/i, bonus: 0.08 },
      { pattern: /\b(evidence shows|data indicates)\b/i, bonus: 0.12 }
    ];
    
    uncertaintyMarkers.forEach(marker => {
      if (marker.pattern.test(content)) {
        baseConfidence -= marker.penalty;
      }
    });
    
    certaintyMarkers.forEach(marker => {
      if (marker.pattern.test(content)) {
        baseConfidence += marker.bonus;
      }
    });
    
    // Support from previous steps
    const supportBonus = previousSteps.filter(step => 
      content.toLowerCase().includes(step.concept.replace(/_/g, ' '))
    ).length * 0.02;
    
    baseConfidence = Math.max(0.1, Math.min(0.95, baseConfidence + supportBonus));
    
    return {
      mean: baseConfidence,
      lower: Math.max(0, baseConfidence - 0.15),
      upper: Math.min(1, baseConfidence + 0.15),
      method: 'normal'
    };
  }

  private findSupportingSteps(
    content: string,
    concept: string,
    previousSteps: ReasoningStep[]
  ): string[] {
    const supporting: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Logical connectors that indicate support
    const supportIndicators = [
      'therefore', 'thus', 'hence', 'consequently',
      'as a result', 'because of', 'due to', 'based on',
      'following from', 'given that', 'since', 'as'
    ];
    
    previousSteps.forEach(step => {
      // Direct concept reference
      if (contentLower.includes(step.concept.replace(/_/g, ' '))) {
        supporting.push(step.id);
        return;
      }
      
      // Logical connection indicators
      for (const indicator of supportIndicators) {
        if (contentLower.includes(indicator)) {
          // Check if this step is referenced near the indicator
          const indicatorIndex = contentLower.indexOf(indicator);
          const contextWindow = contentLower.substring(
            Math.max(0, indicatorIndex - 50),
            indicatorIndex + 50
          );
          
          if (contextWindow.includes(step.concept.replace(/_/g, ' '))) {
            supporting.push(step.id);
            break;
          }
        }
      }
    });
    
    // If no explicit support found but concepts are related
    if (supporting.length === 0 && previousSteps.length > 0) {
      const lastStep = previousSteps[previousSteps.length - 1];
      const conceptWords = concept.split('_');
      const lastConceptWords = lastStep.concept.split('_');
      
      // Check for concept similarity
      const overlap = conceptWords.filter(w => 
        lastConceptWords.includes(w)
      ).length;
      
      if (overlap > 0) {
        supporting.push(lastStep.id);
      }
    }
    
    return supporting;
  }

  private findRefutingSteps(
    content: string,
    concept: string,
    previousSteps: ReasoningStep[]
  ): string[] {
    const refuting: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Contradiction indicators
    const contradictionIndicators = [
      'however', 'but', 'although', 'despite',
      'contrary to', 'in contrast', 'nevertheless',
      'on the other hand', 'alternatively', 'yet'
    ];
    
    previousSteps.forEach(step => {
      for (const indicator of contradictionIndicators) {
        if (contentLower.includes(indicator)) {
          const indicatorIndex = contentLower.indexOf(indicator);
          const contextWindow = contentLower.substring(
            Math.max(0, indicatorIndex - 50),
            indicatorIndex + 50
          );
          
          if (contextWindow.includes(step.concept.replace(/_/g, ' '))) {
            refuting.push(step.id);
            break;
          }
        }
      }
    });
    
    return refuting;
  }

  private extractFallbackConcept(content: string): string {
    // Remove common starting words
    const cleaned = content
      .toLowerCase()
      .replace(/^(the|a|an|this|that|these|those|it|we|i|you)\s+/i, '');
    
    // Extract potential concept words (nouns and noun phrases)
    const words = cleaned.split(/\s+/).filter(w => w.length > 3);
    
    // Look for noun indicators
    const nounPatterns = [
      /.*tion$/, /.*ment$/, /.*ness$/, /.*ity$/, 
      /.*ence$/, /.*ance$/, /.*ship$/, /.*ism$/
    ];
    
    const nouns = words.filter(word => 
      nounPatterns.some(pattern => pattern.test(word))
    );
    
    if (nouns.length > 0) {
      return nouns[0];
    }
    
    // Find the first verb (often indicates the action/concept)
    const verbIndicators = ['ing', 'ed', 'es'];
    const verbs = words.filter(word => 
      verbIndicators.some(ending => word.endsWith(ending))
    );
    
    if (verbs.length > 0) {
      return verbs[0].replace(/ing$|ed$|es$/, '');
    }
    
    // Last resort: longest word
    return words.sort((a, b) => b.length - a.length)[0] || 'unknown';
  }

  private analyzeLogicalStructure(steps: ReasoningStep[]): any {
    const premises: string[] = [];
    const inferences: string[] = [];
    const conclusions: string[] = [];
    const assumptions: string[] = [];
    
    steps.forEach(step => {
      switch (step.type) {
        case 'observation':
          premises.push(step.id);
          break;
        case 'inference':
          inferences.push(step.id);
          break;
        case 'deduction':
        case 'synthesis':
          conclusions.push(step.id);
          break;
        case 'abduction':
        case 'prediction':
          if (step.supporting.length === 0) {
            assumptions.push(step.id);
          } else {
            inferences.push(step.id);
          }
          break;
        default:
          inferences.push(step.id);
      }
    });
    
    return {
      premises,
      inferences,
      conclusions,
      assumptions
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
    this.previousHTMPredictions = [];
    this.iteration = 0;
  }
}