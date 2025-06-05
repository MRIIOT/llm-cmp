/**
 * Online Sequence Pattern Learner
 * 
 * Learns temporal sequence patterns in real-time using hierarchical
 * pattern recognition and adaptive learning algorithms. Implements
 * online learning capabilities for continuous sequence adaptation.
 * 
 * Based on online learning principles and sequence pattern recognition.
 */

import { SequenceMemory, SequenceEpisode } from './sequence-memory';
import { TemporalContextManager } from './temporal-context';
import { PredictionErrorProcessor, PredictionError } from './prediction-errors';

export interface SequencePattern {
  id: string;
  pattern: any[];
  frequency: number;
  confidence: number;
  length: number;
  variability: number;
  context: number[];
  lastSeen: number;
  predictiveAccuracy: number;
  adaptationRate: number;
}

export interface PatternTransition {
  fromPattern: string;
  toPattern: string;
  probability: number;
  context: number[];
  count: number;
  lastOccurrence: number;
}

export interface LearningState {
  currentSequence: any[];
  activePatterns: Set<string>;
  learningRate: number;
  adaptationThreshold: number;
  consolidationLevel: number;
  explorationRate: number;
  timestamp: number;
}

export interface OnlineLearningConfig {
  maxPatternLength: number;
  minPatternLength: number;
  minFrequency: number;
  maxPatterns: number;
  learningRate: number;
  adaptationRate: number;
  forgettingRate: number;
  consolidationThreshold: number;
  explorationRate: number;
  contextWeight: number;
  predictionWindow: number;
  qualityThreshold: number;
}

export interface LearningMetrics {
  totalPatterns: number;
  activePatterns: number;
  averagePatternLength: number;
  learningEfficiency: number;
  adaptationSpeed: number;
  memoryUtilization: number;
  predictionAccuracy: number;
  explorationRatio: number;
}

export class SequenceLearner {
  private config: OnlineLearningConfig;
  private sequenceMemory: SequenceMemory;
  private contextManager: TemporalContextManager;
  private errorProcessor: PredictionErrorProcessor;
  
  // Pattern storage
  private patterns: Map<string, SequencePattern>;
  private patternTransitions: Map<string, PatternTransition[]>;
  private activeSequences: Map<string, any[]>;
  
  // Learning state
  private currentState!: LearningState;
  private learningHistory: { timestamp: number; patterns: number; accuracy: number }[];
  
  // Pattern detection
  private candidatePatterns: Map<string, { pattern: any[]; count: number; context: number[] }>;
  private patternMatcher: Map<string, { matches: number; misses: number }>;
  
  // Adaptation tracking
  private adaptationEvents: { timestamp: number; patternId: string; change: number }[];
  private qualityMetrics: Map<string, number>;
  
  // Performance optimization
  private patternIndex: Map<string, string[]>; // Pattern signature -> pattern IDs
  private contextIndex: Map<string, string[]>; // Context signature -> pattern IDs
  
  private nextPatternId: number;

  constructor(
    config: Partial<OnlineLearningConfig> = {},
    sequenceMemory?: SequenceMemory,
    contextManager?: TemporalContextManager,
    errorProcessor?: PredictionErrorProcessor
  ) {
    this.config = {
      maxPatternLength: 10,
      minPatternLength: 2,
      minFrequency: 3,
      maxPatterns: 5000,
      learningRate: 0.1,
      adaptationRate: 0.05,
      forgettingRate: 0.01,
      consolidationThreshold: 10,
      explorationRate: 0.1,
      contextWeight: 0.3,
      predictionWindow: 5,
      qualityThreshold: 0.7,
      ...config
    };
    
    this.sequenceMemory = sequenceMemory || new SequenceMemory();
    this.contextManager = contextManager || new TemporalContextManager();
    this.errorProcessor = errorProcessor || new PredictionErrorProcessor();
    
    this.patterns = new Map();
    this.patternTransitions = new Map();
    this.activeSequences = new Map();
    this.candidatePatterns = new Map();
    this.patternMatcher = new Map();
    this.adaptationEvents = [];
    this.qualityMetrics = new Map();
    this.patternIndex = new Map();
    this.contextIndex = new Map();
    this.learningHistory = [];
    this.nextPatternId = 1;
    
    this.initializeLearningState();
  }

  private initializeLearningState(): void {
    this.currentState = {
      currentSequence: [],
      activePatterns: new Set(),
      learningRate: this.config.learningRate,
      adaptationThreshold: 0.5,
      consolidationLevel: 0,
      explorationRate: this.config.explorationRate,
      timestamp: Date.now()
    };
  }

  /**
   * Process new sequence element and learn patterns
   */
  public processElement(
    element: any,
    context: number[] = [],
    timestamp: number = Date.now()
  ): {
    recognizedPatterns: string[];
    predictions: any[];
    newPatterns: string[];
    adaptations: string[];
  } {
    // Add element to current sequence
    this.currentState.currentSequence.push(element);
    this.currentState.timestamp = timestamp;
    
    // Update temporal context
    this.contextManager.updateContext(context, timestamp);
    const integratedContext = this.contextManager.getCurrentContext();
    
    // Detect patterns in current sequence
    const recognizedPatterns = this.detectPatterns(this.currentState.currentSequence, integratedContext);
    
    // Update pattern statistics
    this.updatePatternTransitions(recognizedPatterns);
    
    // Generate predictions
    const predictions = this.generatePredictions(recognizedPatterns, integratedContext);
    
    // Learn new patterns
    const newPatterns = this.learnNewPatterns(this.currentState.currentSequence, integratedContext);
    
    // Adapt existing patterns
    const adaptations = this.adaptPatterns(recognizedPatterns, element, integratedContext);
    
    // Update transitions
    this.updatePatternTransitions(recognizedPatterns);
    
    // Maintain sequence length
    this.maintainSequenceLength();
    
    // Perform periodic maintenance
    if (this.shouldPerformMaintenance()) {
      this.performMaintenance();
    }
    
    // Update learning metrics
    this.updateLearningMetrics(recognizedPatterns, predictions);
    
    return {
      recognizedPatterns,
      predictions,
      newPatterns,
      adaptations
    };
  }

  /**
   * Detect patterns in current sequence
   */
  private detectPatterns(sequence: any[], context: number[]): string[] {
    const recognizedPatterns: string[] = [];
    
    // Check for known patterns of various lengths
    for (let length = this.config.minPatternLength; length <= Math.min(this.config.maxPatternLength, sequence.length); length++) {
      const subsequence = sequence.slice(-length);
      const patternSignature = this.generatePatternSignature(subsequence);
      
      // Look up patterns in index
      const candidateIds = this.patternIndex.get(patternSignature) || [];
      
      for (const patternId of candidateIds) {
        const pattern = this.patterns.get(patternId);
        if (!pattern) continue;
        
        // Check pattern match with context consideration
        if (this.matchesPattern(subsequence, pattern, context)) {
          recognizedPatterns.push(patternId);
          this.currentState.activePatterns.add(patternId);
          
          // Update pattern matcher statistics
          const matcher = this.patternMatcher.get(patternId) || { matches: 0, misses: 0 };
          matcher.matches++;
          this.patternMatcher.set(patternId, matcher);
        }
      }
    }
    
    return recognizedPatterns;
  }

  /**
   * Check if subsequence matches a pattern
   */
  private matchesPattern(subsequence: any[], pattern: SequencePattern, context: number[]): boolean {
    if (subsequence.length !== pattern.pattern.length) return false;
    
    // Calculate sequence similarity
    const sequenceSimilarity = this.calculateSequenceSimilarity(subsequence, pattern.pattern);
    
    // Calculate context similarity
    const contextSimilarity = context.length > 0 && pattern.context.length > 0 ?
      this.calculateContextSimilarity(context, pattern.context) : 1.0;
    
    // Combined similarity with weighting
    const combinedSimilarity = sequenceSimilarity * (1 - this.config.contextWeight) +
                              contextSimilarity * this.config.contextWeight;
    
    // Account for pattern variability
    const threshold = Math.max(0.5, 1.0 - pattern.variability);
    
    return combinedSimilarity >= threshold;
  }

  /**
   * Generate predictions based on recognized patterns
   */
  private generatePredictions(recognizedPatterns: string[], context: number[]): any[] {
    const predictions: any[] = [];
    const predictionScores = new Map<string, number>();
    
    // Generate predictions from recognized patterns
    for (const patternId of recognizedPatterns) {
      const pattern = this.patterns.get(patternId);
      if (!pattern) continue;
      
      // Get pattern transitions
      const transitions = this.patternTransitions.get(patternId) || [];
      
      for (const transition of transitions) {
        const nextPattern = this.patterns.get(transition.toPattern);
        if (!nextPattern) continue;
        
        // Calculate prediction score
        const contextMatch = this.calculateContextSimilarity(context, transition.context);
        const score = transition.probability * contextMatch * pattern.predictiveAccuracy;
        
        // Add first element of next pattern as prediction
        if (nextPattern.pattern.length > 0) {
          const prediction = nextPattern.pattern[0];
          const key = JSON.stringify(prediction);
          const currentScore = predictionScores.get(key) || 0;
          predictionScores.set(key, Math.max(currentScore, score));
        }
      }
    }
    
    // Sort predictions by score and return top candidates
    const sortedPredictions = Array.from(predictionScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.predictionWindow)
      .map(([key, score]) => JSON.parse(key));
    
    return sortedPredictions;
  }

  /**
   * Learn new patterns from current sequence
   */
  private learnNewPatterns(sequence: any[], context: number[]): string[] {
    const newPatterns: string[] = [];
    
    // Only learn if we're in exploration mode or haven't reached pattern limit
    if (this.currentState.explorationRate <= 0 && this.patterns.size >= this.config.maxPatterns) {
      return newPatterns;
    }
    
    // Extract candidate patterns of various lengths
    for (let length = this.config.minPatternLength; length <= Math.min(this.config.maxPatternLength, sequence.length); length++) {
      for (let start = 0; start <= sequence.length - length; start++) {
        const candidate = sequence.slice(start, start + length);
        const signature = this.generatePatternSignature(candidate);
        
        // Check if this candidate is worth promoting to a pattern
        const candidateInfo = this.candidatePatterns.get(signature) || {
          pattern: candidate,
          count: 0,
          context: [...context]
        };
        
        candidateInfo.count++;
        candidateInfo.context = this.blendContexts(candidateInfo.context, context);
        this.candidatePatterns.set(signature, candidateInfo);
        
        // Promote to pattern if frequency threshold met
        if (candidateInfo.count >= this.config.minFrequency && !this.hasExistingPattern(signature)) {
          const patternId = this.createNewPattern(candidate, candidateInfo.context);
          newPatterns.push(patternId);
          
          // Remove from candidates
          this.candidatePatterns.delete(signature);
        }
      }
    }
    
    return newPatterns;
  }

  /**
   * Create a new pattern
   */
  private createNewPattern(patternSequence: any[], context: number[]): string {
    const patternId = this.generatePatternId();
    const variability = this.calculateInitialVariability(patternSequence);
    
    const pattern: SequencePattern = {
      id: patternId,
      pattern: [...patternSequence],
      frequency: this.config.minFrequency,
      confidence: 0.5, // Initial confidence
      length: patternSequence.length,
      variability,
      context: [...context],
      lastSeen: Date.now(),
      predictiveAccuracy: 0.5, // Initial accuracy
      adaptationRate: this.config.adaptationRate
    };
    
    this.patterns.set(patternId, pattern);
    this.qualityMetrics.set(patternId, 0.5);
    
    // Update indices
    this.updatePatternIndices(pattern);
    
    return patternId;
  }

  /**
   * Adapt existing patterns based on new observations
   */
  private adaptPatterns(recognizedPatterns: string[], element: any, context: number[]): string[] {
    const adaptations: string[] = [];
    
    for (const patternId of recognizedPatterns) {
      const pattern = this.patterns.get(patternId);
      if (!pattern) continue;
      
      // Update pattern frequency
      pattern.frequency++;
      pattern.lastSeen = Date.now();
      
      // Adapt pattern context
      pattern.context = this.blendContexts(pattern.context, context);
      
      // Update pattern variability
      const newVariability = this.calculatePatternVariability(pattern, element);
      if (Math.abs(newVariability - pattern.variability) > 0.1) {
        pattern.variability = this.adaptValue(pattern.variability, newVariability, pattern.adaptationRate);
        adaptations.push(patternId);
        
        this.adaptationEvents.push({
          timestamp: Date.now(),
          patternId,
          change: Math.abs(newVariability - pattern.variability)
        });
      }
      
      // Update confidence based on recent performance
      this.updatePatternConfidence(pattern);
      
      // Update quality metrics
      this.updatePatternQuality(pattern);
    }
    
    return adaptations;
  }

  /**
   * Update pattern transitions
   */
  private updatePatternTransitions(recognizedPatterns: string[]): void {
    // Create transitions between consecutive patterns
    for (let i = 0; i < recognizedPatterns.length - 1; i++) {
      const fromPattern = recognizedPatterns[i];
      const toPattern = recognizedPatterns[i + 1];
      
      let transitions = this.patternTransitions.get(fromPattern) || [];
      
      // Find existing transition or create new one
      let transition = transitions.find(t => t.toPattern === toPattern);
      
      if (transition) {
        transition.count++;
        transition.lastOccurrence = Date.now();
        transition.context = this.blendContexts(
          transition.context,
          this.contextManager.getCurrentContext()
        );
      } else {
        transition = {
          fromPattern,
          toPattern,
          probability: 0.1, // Initial probability
          context: [...this.contextManager.getCurrentContext()],
          count: 1,
          lastOccurrence: Date.now()
        };
        transitions.push(transition);
      }
      
      // Update transition probabilities
      this.updateTransitionProbabilities(transitions);
      this.patternTransitions.set(fromPattern, transitions);
    }
  }

  /**
   * Update transition probabilities
   */
  private updateTransitionProbabilities(transitions: PatternTransition[]): void {
    const totalCount = transitions.reduce((sum, t) => sum + t.count, 0);
    
    for (const transition of transitions) {
      transition.probability = transition.count / totalCount;
    }
  }

  /**
   * Calculate sequence similarity
   */
  private calculateSequenceSimilarity(seq1: any[], seq2: any[]): number {
    if (seq1.length !== seq2.length) return 0;
    
    let matches = 0;
    for (let i = 0; i < seq1.length; i++) {
      if (this.elementsEqual(seq1[i], seq2[i])) {
        matches++;
      }
    }
    
    return matches / seq1.length;
  }

  /**
   * Calculate context similarity
   */
  private calculateContextSimilarity(context1: number[], context2: number[]): number {
    if (context1.length === 0 || context2.length === 0) return 1.0;
    
    const minLength = Math.min(context1.length, context2.length);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < minLength; i++) {
      dotProduct += context1[i] * context2[i];
      norm1 += context1[i] * context1[i];
      norm2 += context2[i] * context2[i];
    }
    
    const magnitude = Math.sqrt(norm1 * norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Blend two context vectors
   */
  private blendContexts(context1: number[], context2: number[]): number[] {
    const maxLength = Math.max(context1.length, context2.length);
    const blended = new Array(maxLength).fill(0);
    
    for (let i = 0; i < maxLength; i++) {
      const val1 = i < context1.length ? context1[i] : 0;
      const val2 = i < context2.length ? context2[i] : 0;
      blended[i] = (val1 + val2) / 2;
    }
    
    return blended;
  }

  /**
   * Calculate initial pattern variability
   */
  private calculateInitialVariability(pattern: any[]): number {
    // Simple variability based on pattern complexity
    const uniqueElements = new Set(pattern.map(e => JSON.stringify(e))).size;
    return uniqueElements / pattern.length;
  }

  /**
   * Calculate pattern variability with new element
   */
  private calculatePatternVariability(pattern: SequencePattern, element: any): number {
    // Check how much the new element deviates from expected pattern
    const deviation = this.calculateElementDeviation(element, pattern.pattern);
    return Math.min(1.0, pattern.variability + deviation * 0.1);
  }

  /**
   * Calculate element deviation from pattern
   */
  private calculateElementDeviation(element: any, pattern: any[]): number {
    // Find most similar element in pattern
    let minDistance = Infinity;
    
    for (const patternElement of pattern) {
      const distance = this.calculateElementDistance(element, patternElement);
      minDistance = Math.min(minDistance, distance);
    }
    
    return Math.min(1.0, minDistance);
  }

  /**
   * Calculate distance between two elements
   */
  private calculateElementDistance(elem1: any, elem2: any): number {
    if (typeof elem1 === 'number' && typeof elem2 === 'number') {
      return Math.abs(elem1 - elem2);
    } else if (typeof elem1 === 'string' && typeof elem2 === 'string') {
      return elem1 === elem2 ? 0 : 1;
    } else {
      return JSON.stringify(elem1) === JSON.stringify(elem2) ? 0 : 1;
    }
  }

  /**
   * Update pattern confidence
   */
  private updatePatternConfidence(pattern: SequencePattern): void {
    const matcher = this.patternMatcher.get(pattern.id);
    if (!matcher) return;
    
    const totalMatches = matcher.matches + matcher.misses;
    if (totalMatches > 0) {
      const accuracy = matcher.matches / totalMatches;
      pattern.confidence = this.adaptValue(pattern.confidence, accuracy, pattern.adaptationRate);
    }
  }

  /**
   * Update pattern quality metrics
   */
  private updatePatternQuality(pattern: SequencePattern): void {
    // Quality based on frequency, confidence, and recent usage
    const frequencyScore = Math.min(1.0, pattern.frequency / 100);
    const confidenceScore = pattern.confidence;
    const recencyScore = this.calculateRecencyScore(pattern.lastSeen);
    
    const quality = (frequencyScore + confidenceScore + recencyScore) / 3;
    this.qualityMetrics.set(pattern.id, quality);
  }

  /**
   * Calculate recency score
   */
  private calculateRecencyScore(lastSeen: number): number {
    const age = Date.now() - lastSeen;
    const daysSince = age / (1000 * 60 * 60 * 24);
    return Math.exp(-daysSince * 0.1); // Exponential decay
  }

  /**
   * Adapt a value towards a target
   */
  private adaptValue(current: number, target: number, rate: number): number {
    return current + (target - current) * rate;
  }

  /**
   * Generate pattern signature for indexing
   */
  private generatePatternSignature(pattern: any[]): string {
    return pattern.map(e => JSON.stringify(e)).join('|');
  }

  /**
   * Check if elements are equal
   */
  private elementsEqual(elem1: any, elem2: any): boolean {
    if (typeof elem1 === 'number' && typeof elem2 === 'number') {
      return Math.abs(elem1 - elem2) < 1e-6;
    }
    return JSON.stringify(elem1) === JSON.stringify(elem2);
  }

  /**
   * Update pattern indices for fast lookup
   */
  private updatePatternIndices(pattern: SequencePattern): void {
    const signature = this.generatePatternSignature(pattern.pattern);
    
    // Update pattern index
    if (!this.patternIndex.has(signature)) {
      this.patternIndex.set(signature, []);
    }
    this.patternIndex.get(signature)!.push(pattern.id);
    
    // Update context index
    const contextSignature = this.generateContextSignature(pattern.context);
    if (!this.contextIndex.has(contextSignature)) {
      this.contextIndex.set(contextSignature, []);
    }
    this.contextIndex.get(contextSignature)!.push(pattern.id);
  }

  /**
   * Generate context signature
   */
  private generateContextSignature(context: number[]): string {
    return context.map(x => Math.round(x * 100)).join(',');
  }

  /**
   * Check if pattern already exists
   */
  private hasExistingPattern(signature: string): boolean {
    return this.patternIndex.has(signature);
  }

  /**
   * Generate unique pattern ID
   */
  private generatePatternId(): string {
    return `pattern_${this.nextPatternId++}_${Date.now()}`;
  }

  /**
   * Maintain sequence length
   */
  private maintainSequenceLength(): void {
    const maxLength = this.config.maxPatternLength * 2;
    
    if (this.currentState.currentSequence.length > maxLength) {
      this.currentState.currentSequence = this.currentState.currentSequence.slice(-maxLength);
    }
  }

  /**
   * Check if maintenance should be performed
   */
  private shouldPerformMaintenance(): boolean {
    return this.patterns.size > this.config.maxPatterns * 0.9 ||
           this.candidatePatterns.size > 1000 ||
           Date.now() - this.currentState.timestamp > 60000; // Every minute
  }

  /**
   * Perform pattern maintenance
   */
  private performMaintenance(): void {
    // Remove low-quality patterns
    this.prunePatterns();
    
    // Clean up candidate patterns
    this.cleanupCandidates();
    
    // Update adaptation parameters
    this.updateAdaptationParameters();
    
    // Consolidate similar patterns
    this.consolidatePatterns();
    
    // Update learning metrics
    this.recordLearningProgress();
  }

  /**
   * Prune low-quality patterns
   */
  private prunePatterns(): void {
    if (this.patterns.size <= this.config.maxPatterns) return;
    
    // Sort patterns by quality
    const patternQualities = Array.from(this.patterns.entries())
      .map(([id, pattern]) => ({
        id,
        pattern,
        quality: this.qualityMetrics.get(id) || 0
      }))
      .sort((a, b) => a.quality - b.quality);
    
    // Remove lowest quality patterns
    const toRemove = Math.floor(this.patterns.size * 0.1);
    
    for (let i = 0; i < toRemove && i < patternQualities.length; i++) {
      const { id } = patternQualities[i];
      this.removePattern(id);
    }
  }

  /**
   * Remove a pattern and clean up references
   */
  private removePattern(patternId: string): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    
    // Remove from main storage
    this.patterns.delete(patternId);
    this.qualityMetrics.delete(patternId);
    this.patternMatcher.delete(patternId);
    
    // Remove from transitions
    this.patternTransitions.delete(patternId);
    
    // Clean up indices
    this.cleanupPatternFromIndices(pattern);
    
    // Remove from active patterns
    this.currentState.activePatterns.delete(patternId);
  }

  /**
   * Clean up pattern from indices
   */
  private cleanupPatternFromIndices(pattern: SequencePattern): void {
    const signature = this.generatePatternSignature(pattern.pattern);
    const patternIds = this.patternIndex.get(signature);
    
    if (patternIds) {
      const index = patternIds.indexOf(pattern.id);
      if (index > -1) {
        patternIds.splice(index, 1);
        if (patternIds.length === 0) {
          this.patternIndex.delete(signature);
        }
      }
    }
    
    const contextSignature = this.generateContextSignature(pattern.context);
    const contextIds = this.contextIndex.get(contextSignature);
    
    if (contextIds) {
      const index = contextIds.indexOf(pattern.id);
      if (index > -1) {
        contextIds.splice(index, 1);
        if (contextIds.length === 0) {
          this.contextIndex.delete(contextSignature);
        }
      }
    }
  }

  /**
   * Clean up candidate patterns
   */
  private cleanupCandidates(): void {
    const currentTime = Date.now();
    const toDelete: string[] = [];
    
    for (const [signature, candidate] of this.candidatePatterns) {
      // Remove old candidates that haven't gained frequency
      if (candidate.count < this.config.minFrequency / 2 && 
          currentTime - this.currentState.timestamp > 300000) { // 5 minutes
        toDelete.push(signature);
      }
    }
    
    for (const signature of toDelete) {
      this.candidatePatterns.delete(signature);
    }
  }

  /**
   * Update adaptation parameters based on learning progress
   */
  private updateAdaptationParameters(): void {
    const recentEvents = this.adaptationEvents.slice(-100);
    
    if (recentEvents.length > 0) {
      const avgChange = recentEvents.reduce((sum, event) => sum + event.change, 0) / recentEvents.length;
      
      // Adjust learning rate based on adaptation frequency
      if (avgChange > 0.1) {
        this.currentState.learningRate = Math.max(0.01, this.currentState.learningRate * 0.95);
      } else {
        this.currentState.learningRate = Math.min(0.3, this.currentState.learningRate * 1.02);
      }
      
      // Adjust exploration rate
      const patterns = this.patterns.size;
      if (patterns < this.config.maxPatterns * 0.7) {
        this.currentState.explorationRate = Math.min(0.3, this.currentState.explorationRate * 1.01);
      } else {
        this.currentState.explorationRate = Math.max(0.05, this.currentState.explorationRate * 0.99);
      }
    }
  }

  /**
   * Consolidate similar patterns
   */
  private consolidatePatterns(): void {
    const patterns = Array.from(this.patterns.values());
    const toMerge: [string, string][] = [];
    
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const similarity = this.calculatePatternSimilarity(patterns[i], patterns[j]);
        
        if (similarity > 0.9) { // Very similar patterns
          toMerge.push([patterns[i].id, patterns[j].id]);
        }
      }
    }
    
    // Merge similar patterns
    for (const [id1, id2] of toMerge) {
      this.mergePatterns(id1, id2);
    }
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculatePatternSimilarity(pattern1: SequencePattern, pattern2: SequencePattern): number {
    const sequenceSim = this.calculateSequenceSimilarity(pattern1.pattern, pattern2.pattern);
    const contextSim = this.calculateContextSimilarity(pattern1.context, pattern2.context);
    
    return (sequenceSim + contextSim) / 2;
  }

  /**
   * Merge two similar patterns
   */
  private mergePatterns(id1: string, id2: string): void {
    const pattern1 = this.patterns.get(id1);
    const pattern2 = this.patterns.get(id2);
    
    if (!pattern1 || !pattern2) return;
    
    // Merge into pattern with higher frequency
    const [keepId, removeId] = pattern1.frequency >= pattern2.frequency ? [id1, id2] : [id2, id1];
    const keepPattern = this.patterns.get(keepId)!;
    const removePattern = this.patterns.get(removeId)!;
    
    // Update kept pattern
    keepPattern.frequency += removePattern.frequency;
    keepPattern.context = this.blendContexts(keepPattern.context, removePattern.context);
    keepPattern.variability = (keepPattern.variability + removePattern.variability) / 2;
    
    // Remove the other pattern
    this.removePattern(removeId);
  }

  /**
   * Update learning metrics
   */
  private updateLearningMetrics(recognizedPatterns: string[], predictions: any[]): void {
    const stats = this.getLearningMetrics();
    this.learningHistory.push({
      timestamp: Date.now(),
      patterns: recognizedPatterns.length,
      accuracy: stats.predictionAccuracy
    });
    
    // Maintain history size
    if (this.learningHistory.length > 1000) {
      this.learningHistory.shift();
    }
  }

  /**
   * Record learning progress
   */
  private recordLearningProgress(): void {
    const metrics = this.getLearningMetrics();
    
    // Store episodic memory of learning state
    this.sequenceMemory.storeEpisode(
      [metrics],
      this.contextManager.getCurrentContext(),
      [metrics.totalPatterns, metrics.predictionAccuracy],
      ['learning_progress'],
      0.5 // Neutral emotional valence
    );
  }

  /**
   * Get current learning metrics
   */
  public getLearningMetrics(): LearningMetrics {
    const totalPatterns = this.patterns.size;
    const activePatterns = this.currentState.activePatterns.size;
    
    const totalLength = Array.from(this.patterns.values())
      .reduce((sum, pattern) => sum + pattern.length, 0);
    const averagePatternLength = totalPatterns > 0 ? totalLength / totalPatterns : 0;
    
    // Calculate learning efficiency
    const recentHistory = this.learningHistory.slice(-50);
    const learningEfficiency = recentHistory.length > 0 ?
      recentHistory.reduce((sum, h) => sum + h.accuracy, 0) / recentHistory.length : 0;
    
    // Calculate adaptation speed
    const recentAdaptations = this.adaptationEvents.slice(-50);
    const adaptationSpeed = recentAdaptations.length / 50;
    
    // Memory utilization
    const memoryUtilization = totalPatterns / this.config.maxPatterns;
    
    // Prediction accuracy (simplified)
    const avgConfidence = Array.from(this.patterns.values())
      .reduce((sum, pattern) => sum + pattern.confidence, 0) / Math.max(totalPatterns, 1);
    
    // Exploration ratio
    const explorationRatio = this.currentState.explorationRate;
    
    return {
      totalPatterns,
      activePatterns,
      averagePatternLength,
      learningEfficiency,
      adaptationSpeed,
      memoryUtilization,
      predictionAccuracy: avgConfidence,
      explorationRatio
    };
  }

  /**
   * Get pattern by ID
   */
  public getPattern(patternId: string): SequencePattern | null {
    return this.patterns.get(patternId) || null;
  }

  /**
   * Get all patterns
   */
  public getAllPatterns(): SequencePattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get learning state
   */
  public getLearningState(): LearningState {
    return { ...this.currentState };
  }

  /**
   * Reset sequence learner
   */
  public reset(): void {
    this.patterns.clear();
    this.patternTransitions.clear();
    this.activeSequences.clear();
    this.candidatePatterns.clear();
    this.patternMatcher.clear();
    this.adaptationEvents = [];
    this.qualityMetrics.clear();
    this.patternIndex.clear();
    this.contextIndex.clear();
    this.learningHistory = [];
    this.nextPatternId = 1;
    
    this.initializeLearningState();
    this.sequenceMemory.reset();
    this.contextManager.reset();
    this.errorProcessor.reset();
  }
}
