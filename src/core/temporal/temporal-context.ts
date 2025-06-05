/**
 * Dynamic Temporal Context Manager
 * 
 * Manages temporal context information across multiple timescales and
 * hierarchical levels. Provides context-dependent processing and
 * maintains temporal continuity for sequence learning.
 * 
 * Based on hierarchical temporal memory and contextual processing principles.
 */

export interface TemporalScale {
  name: string;
  timespan: number; // milliseconds
  resolution: number; // temporal bins
  decay: number; // decay rate for this timescale
  weight: number; // importance weight for this scale
}

export interface ContextState {
  timestamp: number;
  activationPattern: number[];
  confidence: number;
  stability: number;
  novelty: number;
  scale: string;
}

export interface ContextTransition {
  fromState: ContextState;
  toState: ContextState;
  transitionType: 'smooth' | 'abrupt' | 'periodic' | 'novel';
  probability: number;
  timestamp: number;
}

export interface TemporalContextConfig {
  scales: TemporalScale[];
  maxHistoryLength: number;
  contextDimensions: number;
  adaptationRate: number;
  stabilityThreshold: number;
  noveltyThreshold: number;
  integrationWeight: {
    recency: number;
    frequency: number;
    stability: number;
    predictability: number;
  };
}

export interface ContextPrediction {
  nextContext: number[];
  confidence: number;
  timeHorizon: number;
  alternatives: { context: number[]; probability: number }[];
}

export class TemporalContextManager {
  private config: TemporalContextConfig;
  private contextHistory: Map<string, ContextState[]>; // Scale -> history
  private transitionHistory: ContextTransition[];
  private currentContexts: Map<string, ContextState>;
  
  // Context integration
  private integratedContext: number[];
  private contextWeights: Map<string, number>;
  
  // Adaptation tracking
  private adaptationHistory: { timestamp: number; change: number }[];
  private stabilityTracker: Map<string, number[]>;
  
  // Pattern detection
  private periodicPatterns: Map<string, { period: number; strength: number; phase: number }>;
  private transitionPatterns: Map<string, Map<string, Map<string, number>>>; // Scale -> From context -> To context -> probability
  
  // Performance metrics
  private predictionAccuracy: number[];
  private contextStability: number[];

  constructor(config: Partial<TemporalContextConfig> = {}) {
    this.config = {
      scales: this.createDefaultScales(),
      maxHistoryLength: 1000,
      contextDimensions: 50,
      adaptationRate: 0.1,
      stabilityThreshold: 0.8,
      noveltyThreshold: 0.7,
      integrationWeight: {
        recency: 0.4,
        frequency: 0.3,
        stability: 0.2,
        predictability: 0.1
      },
      ...config
    };
    
    this.contextHistory = new Map();
    this.transitionHistory = [];
    this.currentContexts = new Map();
    this.integratedContext = new Array(this.config.contextDimensions).fill(0);
    this.contextWeights = new Map();
    this.adaptationHistory = [];
    this.stabilityTracker = new Map();
    this.periodicPatterns = new Map();
    this.transitionPatterns = new Map();
    this.predictionAccuracy = [];
    this.contextStability = [];
    
    this.initializeScales();
  }

  private createDefaultScales(): TemporalScale[] {
    return [
      { name: 'immediate', timespan: 1000, resolution: 10, decay: 0.1, weight: 0.4 },      // 1 second
      { name: 'short', timespan: 10000, resolution: 20, decay: 0.05, weight: 0.3 },       // 10 seconds  
      { name: 'medium', timespan: 60000, resolution: 30, decay: 0.02, weight: 0.2 },      // 1 minute
      { name: 'long', timespan: 300000, resolution: 50, decay: 0.01, weight: 0.1 }        // 5 minutes
    ];
  }

  private initializeScales(): void {
    for (const scale of this.config.scales) {
      this.contextHistory.set(scale.name, []);
      this.currentContexts.set(scale.name, this.createEmptyContextState(scale.name));
      this.contextWeights.set(scale.name, scale.weight);
      this.stabilityTracker.set(scale.name, []);
      this.transitionPatterns.set(scale.name, new Map<string, Map<string, number>>());
    }
  }

  /**
   * Update temporal context with new activation pattern
   */
  public updateContext(
    activationPattern: number[],
    timestamp: number = Date.now()
  ): void {
    if (activationPattern.length !== this.config.contextDimensions) {
      throw new Error(`Activation pattern length ${activationPattern.length} doesn't match context dimensions ${this.config.contextDimensions}`);
    }

    // Process context at each temporal scale
    for (const scale of this.config.scales) {
      const previousContext = this.currentContexts.get(scale.name)!;
      const newContext = this.processContextAtScale(
        activationPattern,
        timestamp,
        scale,
        previousContext
      );
      
      // Detect transitions
      const transition = this.detectTransition(previousContext, newContext);
      if (transition) {
        this.transitionHistory.push(transition);
        this.updateTransitionPatterns(scale.name, transition);
      }
      
      // Update current context
      this.currentContexts.set(scale.name, newContext);
      
      // Add to history
      const history = this.contextHistory.get(scale.name)!;
      history.push(newContext);
      
      // Maintain history length
      if (history.length > this.config.maxHistoryLength) {
        history.shift();
      }
      
      // Update stability tracking
      this.updateStabilityTracking(scale.name, newContext);
    }
    
    // Integrate contexts across scales
    this.integrateContexts(timestamp);
    
    // Detect periodic patterns
    this.detectPeriodicPatterns();
    
    // Adapt context weights
    this.adaptContextWeights();
    
    // Update performance metrics
    this.updatePerformanceMetrics();
  }

  /**
   * Process context at a specific temporal scale
   */
  private processContextAtScale(
    activationPattern: number[],
    timestamp: number,
    scale: TemporalScale,
    previousContext: ContextState
  ): ContextState {
    // Calculate temporal decay based on time elapsed
    const timeDelta = timestamp - previousContext.timestamp;
    const decayFactor = Math.exp(-timeDelta * scale.decay / scale.timespan);
    
    // Blend new activation with decayed previous context
    const blendedActivation = new Array(this.config.contextDimensions);
    for (let i = 0; i < this.config.contextDimensions; i++) {
      blendedActivation[i] = (1 - this.config.adaptationRate) * previousContext.activationPattern[i] * decayFactor +
                            this.config.adaptationRate * activationPattern[i];
    }
    
    // Calculate context properties
    const confidence = this.calculateContextConfidence(blendedActivation, previousContext);
    const stability = this.calculateContextStability(blendedActivation, scale.name);
    const novelty = this.calculateContextNovelty(blendedActivation, scale.name);
    
    return {
      timestamp,
      activationPattern: blendedActivation,
      confidence,
      stability,
      novelty,
      scale: scale.name
    };
  }

  /**
   * Calculate context confidence based on consistency
   */
  private calculateContextConfidence(
    activationPattern: number[],
    previousContext: ContextState
  ): number {
    // Confidence based on similarity to previous context
    const similarity = this.calculateVectorSimilarity(
      activationPattern,
      previousContext.activationPattern
    );
    
    // Higher similarity = higher confidence (more predictable)
    return Math.min(1.0, similarity + 0.1);
  }

  /**
   * Calculate context stability for a given scale
   */
  private calculateContextStability(activationPattern: number[], scaleName: string): number {
    const history = this.contextHistory.get(scaleName) || [];
    if (history.length < 5) return 0.5; // Default stability for insufficient history
    
    // Calculate variance across recent history
    const recentHistory = history.slice(-10);
    const variances = new Array(this.config.contextDimensions).fill(0);
    
    for (let dim = 0; dim < this.config.contextDimensions; dim++) {
      const values = recentHistory.map(ctx => ctx.activationPattern[dim]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      variances[dim] = variance;
    }
    
    const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    
    // Lower variance = higher stability
    return Math.exp(-avgVariance * 10);
  }

  /**
   * Calculate context novelty
   */
  private calculateContextNovelty(activationPattern: number[], scaleName: string): number {
    const history = this.contextHistory.get(scaleName) || [];
    if (history.length === 0) return 1.0; // Maximum novelty for first context
    
    // Find most similar historical context
    let maxSimilarity = 0;
    for (const historicalContext of history) {
      const similarity = this.calculateVectorSimilarity(
        activationPattern,
        historicalContext.activationPattern
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    // Novelty is inverse of maximum similarity
    return 1 - maxSimilarity;
  }

  /**
   * Detect transitions between contexts
   */
  private detectTransition(
    previousContext: ContextState,
    currentContext: ContextState
  ): ContextTransition | null {
    const similarity = this.calculateVectorSimilarity(
      previousContext.activationPattern,
      currentContext.activationPattern
    );
    
    let transitionType: 'smooth' | 'abrupt' | 'periodic' | 'novel';
    
    if (similarity > 0.9) {
      transitionType = 'smooth';
    } else if (similarity < 0.3) {
      transitionType = 'abrupt';
    } else if (currentContext.novelty > this.config.noveltyThreshold) {
      transitionType = 'novel';
    } else {
      transitionType = 'periodic';
    }
    
    // Only record significant transitions
    if (transitionType === 'smooth' && similarity > 0.95) {
      return null; // Too similar to be worth recording
    }
    
    return {
      fromState: previousContext,
      toState: currentContext,
      transitionType,
      probability: this.calculateTransitionProbability(previousContext, currentContext),
      timestamp: currentContext.timestamp
    };
  }

  /**
   * Calculate transition probability
   */
  private calculateTransitionProbability(
    fromContext: ContextState,
    toContext: ContextState
  ): number {
    // Look up historical transition patterns
    const fromSignature = this.generateContextSignature(fromContext.activationPattern);
    const toSignature = this.generateContextSignature(toContext.activationPattern);
    
    const scalePatterns = this.transitionPatterns.get(fromContext.scale);
    if (!scalePatterns) return 0.5; // Default probability
    
    const transitionMap = scalePatterns.get(fromSignature) as Map<string, number> | undefined;
    if (!transitionMap) return 0.1; // Low probability for unseen transition
    
    return transitionMap.get(toSignature) || 0.1;
  }

  /**
   * Generate compact signature for context pattern
   */
  private generateContextSignature(activationPattern: number[]): string {
    // Quantize and create signature
    const quantized = activationPattern.map(x => Math.round(x * 10)).join(',');
    return quantized;
  }

  /**
   * Update transition patterns for learning
   */
  private updateTransitionPatterns(scaleName: string, transition: ContextTransition): void {
    const fromSignature = this.generateContextSignature(transition.fromState.activationPattern);
    const toSignature = this.generateContextSignature(transition.toState.activationPattern);
    
    const scalePatterns = this.transitionPatterns.get(scaleName)!;
    
    if (!scalePatterns.has(fromSignature)) {
      scalePatterns.set(fromSignature, new Map<string, number>());
    }
    
    const transitionMap = scalePatterns.get(fromSignature) as Map<string, number>;
    const currentCount = transitionMap.get(toSignature) || 0;
    const updatedCount = currentCount + 1;
    
    // Normalize to probability
    const totalTransitions = Array.from(transitionMap.values()).reduce((a: number, b: number) => a + b, 0) + 1;
    transitionMap.set(toSignature, updatedCount / totalTransitions);
  }

  /**
   * Integrate contexts across temporal scales
   */
  private integrateContexts(timestamp: number): void {
    const weightedContext = new Array(this.config.contextDimensions).fill(0);
    let totalWeight = 0;
    
    for (const scale of this.config.scales) {
      const context = this.currentContexts.get(scale.name)!;
      const weight = this.contextWeights.get(scale.name)! * context.confidence;
      
      for (let i = 0; i < this.config.contextDimensions; i++) {
        weightedContext[i] += context.activationPattern[i] * weight;
      }
      totalWeight += weight;
    }
    
    // Normalize by total weight
    if (totalWeight > 0) {
      for (let i = 0; i < this.config.contextDimensions; i++) {
        weightedContext[i] /= totalWeight;
      }
    }
    
    this.integratedContext = weightedContext;
    
    // Record adaptation
    const change = this.calculateVectorDistance(this.integratedContext, weightedContext);
    this.adaptationHistory.push({ timestamp, change });
    
    // Maintain adaptation history
    if (this.adaptationHistory.length > 1000) {
      this.adaptationHistory.shift();
    }
  }

  /**
   * Detect periodic patterns in context
   */
  private detectPeriodicPatterns(): void {
    for (const scale of this.config.scales) {
      const history = this.contextHistory.get(scale.name) || [];
      if (history.length < 20) continue; // Need sufficient history
      
      const periods = this.findPeriodicities(history);
      for (const period of periods) {
        this.periodicPatterns.set(`${scale.name}_${period.period}`, period);
      }
    }
  }

  /**
   * Find periodicities in context history
   */
  private findPeriodicities(
    history: ContextState[]
  ): { period: number; strength: number; phase: number }[] {
    const periodicities: { period: number; strength: number; phase: number }[] = [];
    const maxPeriod = Math.min(50, Math.floor(history.length / 4));
    
    for (let period = 2; period <= maxPeriod; period++) {
      const strength = this.calculatePeriodStrength(history, period);
      if (strength > 0.6) { // Significant periodicity threshold
        const phase = this.calculatePhase(history, period);
        periodicities.push({ period, strength, phase });
      }
    }
    
    return periodicities.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Calculate strength of a potential period
   */
  private calculatePeriodStrength(history: ContextState[], period: number): number {
    let totalCorrelation = 0;
    let count = 0;
    
    for (let i = period; i < history.length; i++) {
      const correlation = this.calculateVectorSimilarity(
        history[i].activationPattern,
        history[i - period].activationPattern
      );
      totalCorrelation += correlation;
      count++;
    }
    
    return count > 0 ? totalCorrelation / count : 0;
  }

  /**
   * Calculate phase offset for a period
   */
  private calculatePhase(history: ContextState[], period: number): number {
    // Find the offset that maximizes correlation
    let bestPhase = 0;
    let bestCorrelation = 0;
    
    for (let phase = 0; phase < period; phase++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = period + phase; i < history.length; i += period) {
        if (i - period >= 0) {
          correlation += this.calculateVectorSimilarity(
            history[i].activationPattern,
            history[i - period].activationPattern
          );
          count++;
        }
      }
      
      const avgCorrelation = count > 0 ? correlation / count : 0;
      if (avgCorrelation > bestCorrelation) {
        bestCorrelation = avgCorrelation;
        bestPhase = phase;
      }
    }
    
    return bestPhase;
  }

  /**
   * Adapt context weights based on performance
   */
  private adaptContextWeights(): void {
    const recentAccuracy = this.predictionAccuracy.slice(-50);
    if (recentAccuracy.length === 0) return;
    
    const avgAccuracy = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
    
    // Adjust weights based on scale performance
    for (const scale of this.config.scales) {
      const context = this.currentContexts.get(scale.name)!;
      const currentWeight = this.contextWeights.get(scale.name)!;
      
      // Increase weight for stable, confident contexts
      const performanceFactor = context.stability * context.confidence;
      const adjustment = (performanceFactor - 0.5) * 0.01; // Small adjustments
      
      const newWeight = Math.max(0.01, Math.min(1.0, currentWeight + adjustment));
      this.contextWeights.set(scale.name, newWeight);
    }
    
    // Renormalize weights
    this.normalizeWeights();
  }

  /**
   * Normalize context weights to sum to 1
   */
  private normalizeWeights(): void {
    const totalWeight = Array.from(this.contextWeights.values()).reduce((a, b) => a + b, 0);
    
    if (totalWeight > 0) {
      for (const [scale, weight] of this.contextWeights) {
        this.contextWeights.set(scale, weight / totalWeight);
      }
    }
  }

  /**
   * Update stability tracking
   */
  private updateStabilityTracking(scaleName: string, context: ContextState): void {
    const tracker = this.stabilityTracker.get(scaleName)!;
    tracker.push(context.stability);
    
    // Maintain tracker size
    if (tracker.length > 100) {
      tracker.shift();
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Calculate overall context stability
    let totalStability = 0;
    let count = 0;
    
    for (const context of this.currentContexts.values()) {
      totalStability += context.stability;
      count++;
    }
    
    const avgStability = count > 0 ? totalStability / count : 0;
    this.contextStability.push(avgStability);
    
    // Maintain metrics history
    if (this.contextStability.length > 1000) {
      this.contextStability.shift();
    }
  }

  /**
   * Predict future context
   */
  public predictContext(timeHorizon: number): ContextPrediction {
    const currentTime = Date.now();
    const targetTime = currentTime + timeHorizon;
    
    // Find the most appropriate scale for this time horizon
    const scale = this.selectScaleForPrediction(timeHorizon);
    const context = this.currentContexts.get(scale.name)!;
    
    // Look for periodic patterns that might apply
    const applicablePatterns = this.findApplicablePatterns(scale.name, timeHorizon);
    
    // Generate base prediction
    let predictedContext = [...context.activationPattern];
    let confidence = context.confidence;
    
    // Apply periodic predictions if available
    if (applicablePatterns.length > 0) {
      const pattern = applicablePatterns[0]; // Use strongest pattern
      predictedContext = this.applyPeriodicPattern(predictedContext, pattern, timeHorizon);
      confidence *= pattern.strength;
    }
    
    // Apply decay for longer horizons
    const decayFactor = Math.exp(-timeHorizon * scale.decay / scale.timespan);
    for (let i = 0; i < predictedContext.length; i++) {
      predictedContext[i] *= decayFactor;
    }
    
    // Generate alternative predictions
    const alternatives = this.generateAlternativePredictions(scale.name, timeHorizon);
    
    return {
      nextContext: predictedContext,
      confidence: confidence * decayFactor,
      timeHorizon,
      alternatives
    };
  }

  /**
   * Select appropriate scale for prediction time horizon
   */
  private selectScaleForPrediction(timeHorizon: number): TemporalScale {
    let bestScale = this.config.scales[0];
    let bestScore = Math.abs(bestScale.timespan - timeHorizon);
    
    for (const scale of this.config.scales) {
      const score = Math.abs(scale.timespan - timeHorizon);
      if (score < bestScore) {
        bestScore = score;
        bestScale = scale;
      }
    }
    
    return bestScale;
  }

  /**
   * Find applicable periodic patterns for prediction
   */
  private findApplicablePatterns(
    scaleName: string,
    timeHorizon: number
  ): { period: number; strength: number; phase: number }[] {
    const applicable: { period: number; strength: number; phase: number }[] = [];
    
    for (const [key, pattern] of this.periodicPatterns) {
      if (key.startsWith(scaleName)) {
        // Check if pattern period is relevant for time horizon
        if (pattern.period <= timeHorizon && timeHorizon <= pattern.period * 5) {
          applicable.push(pattern);
        }
      }
    }
    
    return applicable.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Apply periodic pattern to prediction
   */
  private applyPeriodicPattern(
    baseContext: number[],
    pattern: { period: number; strength: number; phase: number },
    timeHorizon: number
  ): number[] {
    // Apply phase-shifted periodic modulation
    const phaseShift = (timeHorizon + pattern.phase) % pattern.period;
    const periodFactor = Math.sin(2 * Math.PI * phaseShift / pattern.period);
    
    return baseContext.map(value => 
      value * (1 + pattern.strength * periodFactor * 0.1) // Small modulation
    );
  }

  /**
   * Generate alternative context predictions
   */
  private generateAlternativePredictions(
    scaleName: string,
    timeHorizon: number
  ): { context: number[]; probability: number }[] {
    const alternatives: { context: number[]; probability: number }[] = [];
    const transitionMap = this.transitionPatterns.get(scaleName);
    
    if (!transitionMap) return alternatives;
    
    const currentContext = this.currentContexts.get(scaleName)!;
    const currentSignature = this.generateContextSignature(currentContext.activationPattern);
    
    const possibleTransitions = transitionMap.get(currentSignature) as Map<string, number> | undefined;
    if (!possibleTransitions) return alternatives;
    
    // Get top alternative transitions
    const sortedTransitions = Array.from(possibleTransitions.entries())
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3); // Top 3 alternatives
    
    for (const [signature, probability] of sortedTransitions) {
      if ((probability as number) > 0.1) { // Minimum probability threshold
        const alternativeContext = this.reconstructContextFromSignature(signature);
        alternatives.push({ context: alternativeContext, probability: probability as number });
      }
    }
    
    return alternatives;
  }

  /**
   * Reconstruct context from signature (simplified)
   */
  private reconstructContextFromSignature(signature: string): number[] {
    const values = signature.split(',').map(x => parseInt(x) / 10);
    
    // Pad or truncate to match context dimensions
    while (values.length < this.config.contextDimensions) {
      values.push(0);
    }
    
    return values.slice(0, this.config.contextDimensions);
  }

  /**
   * Get current integrated context
   */
  public getCurrentContext(): number[] {
    return [...this.integratedContext];
  }

  /**
   * Get context at specific scale
   */
  public getContextAtScale(scaleName: string): ContextState | null {
    return this.currentContexts.get(scaleName) || null;
  }

  /**
   * Get context history for a scale
   */
  public getContextHistory(scaleName: string, length?: number): ContextState[] {
    const history = this.contextHistory.get(scaleName) || [];
    return length ? history.slice(-length) : [...history];
  }

  /**
   * Get context stability metrics
   */
  public getStabilityMetrics(): {
    overall: number;
    byScale: Map<string, number>;
    trend: number;
  } {
    const recent = this.contextStability.slice(-20);
    const overall = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    
    const byScale = new Map<string, number>();
    for (const [scale, tracker] of this.stabilityTracker) {
      const recentStability = tracker.slice(-10);
      const avgStability = recentStability.length > 0 ? 
        recentStability.reduce((a, b) => a + b, 0) / recentStability.length : 0;
      byScale.set(scale, avgStability);
    }
    
    // Calculate trend
    let trend = 0;
    if (this.contextStability.length > 10) {
      const recent10 = this.contextStability.slice(-10);
      const older10 = this.contextStability.slice(-20, -10);
      if (older10.length > 0) {
        const recentAvg = recent10.reduce((a, b) => a + b, 0) / recent10.length;
        const olderAvg = older10.reduce((a, b) => a + b, 0) / older10.length;
        trend = recentAvg - olderAvg;
      }
    }
    
    return { overall, byScale, trend };
  }

  /**
   * Get transition statistics
   */
  public getTransitionStats(): {
    totalTransitions: number;
    transitionTypes: Map<string, number>;
    averageTransitionTime: number;
  } {
    const totalTransitions = this.transitionHistory.length;
    const transitionTypes = new Map<string, number>();
    
    let totalTime = 0;
    
    for (const transition of this.transitionHistory) {
      const type = transition.transitionType;
      transitionTypes.set(type, (transitionTypes.get(type) || 0) + 1);
      
      totalTime += transition.toState.timestamp - transition.fromState.timestamp;
    }
    
    const averageTransitionTime = totalTransitions > 0 ? totalTime / totalTransitions : 0;
    
    return { totalTransitions, transitionTypes, averageTransitionTime };
  }

  /**
   * Calculate vector similarity (cosine similarity)
   */
  private calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(norm1 * norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Calculate Euclidean distance between vectors
   */
  private calculateVectorDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return Infinity;
    
    let sumSquares = 0;
    for (let i = 0; i < vec1.length; i++) {
      sumSquares += Math.pow(vec1[i] - vec2[i], 2);
    }
    
    return Math.sqrt(sumSquares);
  }

  /**
   * Create empty context state
   */
  private createEmptyContextState(scaleName: string): ContextState {
    return {
      timestamp: Date.now(),
      activationPattern: new Array(this.config.contextDimensions).fill(0),
      confidence: 0.5,
      stability: 0.5,
      novelty: 0,
      scale: scaleName
    };
  }

  /**
   * Reset temporal context manager
   */
  public reset(): void {
    this.contextHistory.clear();
    this.transitionHistory = [];
    this.currentContexts.clear();
    this.integratedContext = new Array(this.config.contextDimensions).fill(0);
    this.adaptationHistory = [];
    this.stabilityTracker.clear();
    this.periodicPatterns.clear();
    this.transitionPatterns.clear();
    this.predictionAccuracy = [];
    this.contextStability = [];
    
    this.initializeScales();
  }
}
