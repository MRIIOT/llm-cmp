/**
 * Prediction Error Processing System
 * 
 * Implements hierarchical prediction error processing based on predictive
 * coding principles. Calculates, propagates, and learns from prediction
 * errors across multiple temporal and spatial scales.
 * 
 * Based on predictive coding theory and error-driven learning.
 */

export interface PredictionError {
  level: number;
  timestamp: number;
  predicted: number[];
  actual: number[];
  error: number[];
  magnitude: number;
  significance: number;
  errorType: 'spatial' | 'temporal' | 'contextual' | 'semantic';
  confidence: number;
}

export interface ErrorSignal {
  errorId: string;
  level: number;
  direction: 'ascending' | 'descending';
  strength: number;
  errorVector: number[];
  learningSignal: number[];
  suppressionMask: boolean[];
  timestamp: number;
}

export interface LearningUpdate {
  targetLevel: number;
  updateType: 'strengthen' | 'weaken' | 'create' | 'prune';
  magnitude: number;
  specificity: number[];
  confidence: number;
  errorContribution: number;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsByLevel: Map<number, number>;
  averageErrorMagnitude: number;
  errorReductionRate: number;
  learningEfficiency: number;
  predictionImprovement: number;
}

export interface PredictionErrorConfig {
  maxLevels: number;
  errorThreshold: number;
  learningRate: number;
  decayRate: number;
  significanceThreshold: number;
  suppressionStrength: number;
  adaptiveLearning: boolean;
  errorWeighting: {
    magnitude: number;
    novelty: number;
    consistency: number;
    contextual: number;
  };
}

export class PredictionErrorProcessor {
  private config: PredictionErrorConfig;
  private errorHistory: Map<number, PredictionError[]>; // Level -> errors
  private activeErrors: Map<string, PredictionError>;
  private errorSignals: Map<number, ErrorSignal[]>; // Level -> signals
  private learningUpdates: LearningUpdate[];
  
  // Error tracking
  private errorStatistics: Map<number, ErrorStatistics>;
  private errorReduction: { timestamp: number; reduction: number }[];
  private learningProgress: { timestamp: number; improvement: number }[];
  
  // Adaptive parameters
  private adaptiveLearningRates: Map<number, number>;
  private errorExpectations: Map<number, number[]>;
  private surpriseDetector: Map<number, number>;
  
  // Error propagation
  private ascendingSignals: Map<number, ErrorSignal[]>;
  private descendingSignals: Map<number, ErrorSignal[]>;
  
  private nextErrorId: number;

  constructor(config: Partial<PredictionErrorConfig> = {}) {
    this.config = {
      maxLevels: 5,
      errorThreshold: 0.01,
      learningRate: 0.1,
      decayRate: 0.95,
      significanceThreshold: 0.1,
      suppressionStrength: 0.3,
      adaptiveLearning: true,
      errorWeighting: {
        magnitude: 0.4,
        novelty: 0.3,
        consistency: 0.2,
        contextual: 0.1
      },
      ...config
    };
    
    this.errorHistory = new Map();
    this.activeErrors = new Map();
    this.errorSignals = new Map();
    this.learningUpdates = [];
    this.errorStatistics = new Map();
    this.errorReduction = [];
    this.learningProgress = [];
    this.adaptiveLearningRates = new Map();
    this.errorExpectations = new Map();
    this.surpriseDetector = new Map();
    this.ascendingSignals = new Map();
    this.descendingSignals = new Map();
    this.nextErrorId = 1;
    
    this.initializeLevels();
  }

  private initializeLevels(): void {
    for (let level = 0; level < this.config.maxLevels; level++) {
      this.errorHistory.set(level, []);
      this.errorSignals.set(level, []);
      this.ascendingSignals.set(level, []);
      this.descendingSignals.set(level, []);
      this.adaptiveLearningRates.set(level, this.config.learningRate);
      this.errorExpectations.set(level, []);
      this.surpriseDetector.set(level, 0);
      
      this.errorStatistics.set(level, {
        totalErrors: 0,
        errorsByType: new Map(),
        errorsByLevel: new Map(),
        averageErrorMagnitude: 0,
        errorReductionRate: 0,
        learningEfficiency: 0,
        predictionImprovement: 0
      });
    }
  }

  /**
   * Process prediction error at a specific hierarchical level
   */
  public processError(
    level: number,
    predicted: number[],
    actual: number[],
    errorType: 'spatial' | 'temporal' | 'contextual' | 'semantic' = 'temporal',
    confidence: number = 1.0
  ): PredictionError {
    if (level < 0 || level >= this.config.maxLevels) {
      throw new Error(`Level ${level} out of range [0, ${this.config.maxLevels - 1}]`);
    }
    
    if (predicted.length !== actual.length) {
      throw new Error(`Predicted length ${predicted.length} doesn't match actual length ${actual.length}`);
    }

    // Calculate raw error
    const error = this.calculateError(predicted, actual);
    const magnitude = this.calculateErrorMagnitude(error);
    
    // Calculate error significance
    const significance = this.calculateErrorSignificance(level, magnitude, errorType);
    
    // Create prediction error object
    const predictionError: PredictionError = {
      level,
      timestamp: Date.now(),
      predicted: [...predicted],
      actual: [...actual],
      error: [...error],
      magnitude,
      significance,
      errorType,
      confidence
    };
    
    // Store error
    const errorId = this.generateErrorId();
    this.activeErrors.set(errorId, predictionError);
    
    // Add to history
    this.errorHistory.get(level)!.push(predictionError);
    this.maintainErrorHistory(level);
    
    // Update statistics
    this.updateErrorStatistics(level, predictionError);
    
    // Generate error signals if significant
    if (significance > this.config.significanceThreshold) {
      this.generateErrorSignals(errorId, predictionError);
    }
    
    // Update adaptive parameters
    if (this.config.adaptiveLearning) {
      this.updateAdaptiveParameters(level, predictionError);
    }
    
    // Process learning updates
    this.generateLearningUpdates(predictionError);
    
    return predictionError;
  }

  /**
   * Calculate prediction error vector
   */
  private calculateError(predicted: number[], actual: number[]): number[] {
    const error = new Array(predicted.length);
    
    for (let i = 0; i < predicted.length; i++) {
      error[i] = actual[i] - predicted[i];
    }
    
    return error;
  }

  /**
   * Calculate error magnitude
   */
  private calculateErrorMagnitude(error: number[]): number {
    let sumSquares = 0;
    for (const e of error) {
      sumSquares += e * e;
    }
    return Math.sqrt(sumSquares / error.length);
  }

  /**
   * Calculate error significance based on context and history
   */
  private calculateErrorSignificance(
    level: number,
    magnitude: number,
    errorType: string
  ): number {
    // Base significance from magnitude
    let significance = magnitude;
    
    // Adjust based on expected error at this level
    const expectedErrors = this.errorExpectations.get(level) || [];
    if (expectedErrors.length > 0) {
      const avgExpected = expectedErrors.reduce((a, b) => a + b, 0) / expectedErrors.length;
      const surpriseFactor = magnitude / (avgExpected + 0.001); // Avoid division by zero
      significance *= Math.log(surpriseFactor + 1);
    }
    
    // Weight by error type
    const typeWeights: Record<string, number> = {
      'spatial': 1.0,
      'temporal': 1.2,
      'contextual': 1.1,
      'semantic': 1.3
    };
    significance *= typeWeights[errorType] || 1.0;
    
    // Apply novelty detection
    const surprise = this.surpriseDetector.get(level) || 0;
    significance *= (1 + surprise * 0.5);
    
    return Math.min(1.0, significance);
  }

  /**
   * Generate error signals for propagation
   */
  private generateErrorSignals(errorId: string, error: PredictionError): void {
    // Generate ascending error signal (to higher levels)
    if (error.level < this.config.maxLevels - 1) {
      const ascendingSignal = this.createAscendingSignal(errorId, error);
      this.ascendingSignals.get(error.level)!.push(ascendingSignal);
    }
    
    // Generate descending error signal (to lower levels)
    if (error.level > 0) {
      const descendingSignal = this.createDescendingSignal(errorId, error);
      this.descendingSignals.get(error.level)!.push(descendingSignal);
    }
    
    // Generate lateral error signals (same level)
    const lateralSignal = this.createLateralSignal(errorId, error);
    this.errorSignals.get(error.level)!.push(lateralSignal);
  }

  /**
   * Create ascending error signal
   */
  private createAscendingSignal(errorId: string, error: PredictionError): ErrorSignal {
    // Abstract error for higher level processing
    const abstractedError = this.abstractError(error.error);
    const learningSignal = this.generateLearningSignal(abstractedError, 'ascending');
    
    return {
      errorId,
      level: error.level + 1,
      direction: 'ascending',
      strength: error.significance,
      errorVector: abstractedError,
      learningSignal,
      suppressionMask: new Array(abstractedError.length).fill(false),
      timestamp: Date.now()
    };
  }

  /**
   * Create descending error signal
   */
  private createDescendingSignal(errorId: string, error: PredictionError): ErrorSignal {
    // Elaborate error for lower level correction
    const elaboratedError = this.elaborateError(error.error);
    const learningSignal = this.generateLearningSignal(elaboratedError, 'descending');
    
    return {
      errorId,
      level: error.level - 1,
      direction: 'descending',
      strength: error.significance * this.config.suppressionStrength,
      errorVector: elaboratedError,
      learningSignal,
      suppressionMask: this.generateSuppressionMask(elaboratedError),
      timestamp: Date.now()
    };
  }

  /**
   * Create lateral error signal
   */
  private createLateralSignal(errorId: string, error: PredictionError): ErrorSignal {
    const learningSignal = this.generateLearningSignal(error.error, 'lateral');
    
    return {
      errorId,
      level: error.level,
      direction: 'ascending', // Default direction
      strength: error.significance,
      errorVector: [...error.error],
      learningSignal,
      suppressionMask: new Array(error.error.length).fill(false),
      timestamp: Date.now()
    };
  }

  /**
   * Abstract error for higher level processing
   */
  private abstractError(error: number[]): number[] {
    // Compress error by combining adjacent elements
    const abstracted = [];
    const chunkSize = Math.max(1, Math.floor(error.length / 4));
    
    for (let i = 0; i < error.length; i += chunkSize) {
      const chunk = error.slice(i, i + chunkSize);
      const avgError = chunk.reduce((a, b) => a + b, 0) / chunk.length;
      abstracted.push(avgError);
    }
    
    return abstracted;
  }

  /**
   * Elaborate error for lower level correction
   */
  private elaborateError(error: number[]): number[] {
    // Expand error with interpolation
    const elaborated = [];
    
    for (let i = 0; i < error.length; i++) {
      elaborated.push(error[i]);
      
      // Add interpolated values
      if (i < error.length - 1) {
        const interpolated = (error[i] + error[i + 1]) / 2;
        elaborated.push(interpolated);
      }
    }
    
    return elaborated;
  }

  /**
   * Generate learning signal from error
   */
  private generateLearningSignal(
    error: number[],
    direction: 'ascending' | 'descending' | 'lateral'
  ): number[] {
    const learningSignal = new Array(error.length);
    
    for (let i = 0; i < error.length; i++) {
      // Apply appropriate learning rate
      const level = direction === 'ascending' ? 1 : (direction === 'descending' ? -1 : 0);
      const learningRate = this.config.learningRate * (1 + level * 0.1);
      
      // Apply error weighting
      const weightedError = this.applyErrorWeighting(error[i]);
      
      learningSignal[i] = learningRate * weightedError;
    }
    
    return learningSignal;
  }

  /**
   * Apply error weighting based on configuration
   */
  private applyErrorWeighting(error: number): number {
    const weights = this.config.errorWeighting;
    
    // Apply magnitude weighting
    const magnitude = Math.abs(error);
    const magnitudeWeight = weights.magnitude * Math.tanh(magnitude);
    
    // Apply novelty weighting (simplified)
    const noveltyWeight = weights.novelty * Math.log(magnitude + 1);
    
    // Apply consistency weighting (requires history)
    const consistencyWeight = weights.consistency;
    
    // Apply contextual weighting
    const contextualWeight = weights.contextual;
    
    const totalWeight = magnitudeWeight + noveltyWeight + consistencyWeight + contextualWeight;
    return error * totalWeight;
  }

  /**
   * Generate suppression mask for descending signals
   */
  private generateSuppressionMask(error: number[]): boolean[] {
    const mask = new Array(error.length);
    
    for (let i = 0; i < error.length; i++) {
      // Suppress large errors to prevent overcorrection
      mask[i] = Math.abs(error[i]) > this.config.errorThreshold * 5;
    }
    
    return mask;
  }

  /**
   * Generate learning updates from prediction errors
   */
  private generateLearningUpdates(error: PredictionError): void {
    // Determine update type based on error characteristics
    let updateType: 'strengthen' | 'weaken' | 'create' | 'prune';
    
    if (error.magnitude > this.config.errorThreshold * 2) {
      updateType = error.significance > 0.7 ? 'create' : 'strengthen';
    } else if (error.magnitude < this.config.errorThreshold * 0.5) {
      updateType = 'weaken';
    } else {
      updateType = 'strengthen';
    }
    
    // Calculate update specificity
    const specificity = this.calculateUpdateSpecificity(error);
    
    // Create learning update
    const learningUpdate: LearningUpdate = {
      targetLevel: error.level,
      updateType,
      magnitude: error.magnitude,
      specificity,
      confidence: error.confidence,
      errorContribution: error.significance
    };
    
    this.learningUpdates.push(learningUpdate);
    
    // Maintain update history
    if (this.learningUpdates.length > 1000) {
      this.learningUpdates.shift();
    }
  }

  /**
   * Calculate update specificity vector
   */
  private calculateUpdateSpecificity(error: PredictionError): number[] {
    const specificity = new Array(error.error.length);
    
    for (let i = 0; i < error.error.length; i++) {
      // Higher specificity for larger errors
      const errorMagnitude = Math.abs(error.error[i]);
      specificity[i] = Math.min(1.0, errorMagnitude / this.config.errorThreshold);
    }
    
    return specificity;
  }

  /**
   * Update adaptive parameters based on error patterns
   */
  private updateAdaptiveParameters(level: number, error: PredictionError): void {
    // Update adaptive learning rate
    const currentRate = this.adaptiveLearningRates.get(level)!;
    const errorHistory = this.errorHistory.get(level)!;
    
    if (errorHistory.length > 5) {
      const recentErrors = errorHistory.slice(-5);
      const avgRecentError = recentErrors.reduce((sum, e) => sum + e.magnitude, 0) / recentErrors.length;
      
      // Adjust learning rate based on error trend
      if (avgRecentError > error.magnitude) {
        // Errors decreasing - maintain or slightly increase rate
        this.adaptiveLearningRates.set(level, Math.min(0.5, currentRate * 1.05));
      } else {
        // Errors increasing - decrease rate
        this.adaptiveLearningRates.set(level, Math.max(0.01, currentRate * 0.95));
      }
    }
    
    // Update error expectations
    const expectations = this.errorExpectations.get(level)!;
    expectations.push(error.magnitude);
    
    if (expectations.length > 100) {
      expectations.shift();
    }
    
    // Update surprise detector
    if (expectations.length > 1) {
      const avgExpected = expectations.slice(0, -1).reduce((a, b) => a + b, 0) / (expectations.length - 1);
      const surprise = Math.abs(error.magnitude - avgExpected) / (avgExpected + 0.001);
      this.surpriseDetector.set(level, surprise);
    }
  }

  /**
   * Propagate error signals between levels
   */
  public propagateErrorSignals(): void {
    // Process ascending signals
    for (let level = 0; level < this.config.maxLevels - 1; level++) {
      const signals = this.ascendingSignals.get(level)!;
      
      for (const signal of signals) {
        this.processAscendingSignal(signal);
      }
      
      // Clear processed signals
      this.ascendingSignals.set(level, []);
    }
    
    // Process descending signals
    for (let level = this.config.maxLevels - 1; level > 0; level--) {
      const signals = this.descendingSignals.get(level)!;
      
      for (const signal of signals) {
        this.processDescendingSignal(signal);
      }
      
      // Clear processed signals
      this.descendingSignals.set(level, []);
    }
    
    // Apply decay to all error signals
    this.applyErrorDecay();
  }

  /**
   * Process ascending error signal
   */
  private processAscendingSignal(signal: ErrorSignal): void {
    // Add to target level's error signals
    this.errorSignals.get(signal.level)!.push(signal);
    
    // Update level statistics
    const stats = this.errorStatistics.get(signal.level)!;
    stats.totalErrors++;
  }

  /**
   * Process descending error signal
   */
  private processDescendingSignal(signal: ErrorSignal): void {
    // Apply suppression to lower level
    const targetSignals = this.errorSignals.get(signal.level)!;
    
    for (const targetSignal of targetSignals) {
      this.applySuppression(targetSignal, signal);
    }
  }

  /**
   * Apply suppression from higher level
   */
  private applySuppression(targetSignal: ErrorSignal, suppressionSignal: ErrorSignal): void {
    for (let i = 0; i < Math.min(targetSignal.errorVector.length, suppressionSignal.errorVector.length); i++) {
      if (suppressionSignal.suppressionMask[i]) {
        targetSignal.errorVector[i] *= (1 - suppressionSignal.strength * this.config.suppressionStrength);
      }
    }
  }

  /**
   * Apply temporal decay to error signals
   */
  private applyErrorDecay(): void {
    const currentTime = Date.now();
    
    for (let level = 0; level < this.config.maxLevels; level++) {
      const signals = this.errorSignals.get(level)!;
      
      for (const signal of signals) {
        const age = currentTime - signal.timestamp;
        const decayFactor = Math.exp(-age * this.config.decayRate / 10000); // 10 second half-life
        
        signal.strength *= decayFactor;
        
        for (let i = 0; i < signal.errorVector.length; i++) {
          signal.errorVector[i] *= decayFactor;
          signal.learningSignal[i] *= decayFactor;
        }
      }
      
      // Remove weak signals
      const filteredSignals = signals.filter(signal => signal.strength > 0.01);
      this.errorSignals.set(level, filteredSignals);
    }
  }

  /**
   * Get current error signals at a level
   */
  public getErrorSignals(level: number): ErrorSignal[] {
    return [...(this.errorSignals.get(level) || [])];
  }

  /**
   * Get learning updates since last call
   */
  public getLearningUpdates(): LearningUpdate[] {
    const updates = [...this.learningUpdates];
    this.learningUpdates = []; // Clear after retrieval
    return updates;
  }

  /**
   * Get error statistics for a level
   */
  public getErrorStatistics(level: number): ErrorStatistics | null {
    return this.errorStatistics.get(level) || null;
  }

  /**
   * Get comprehensive error analysis
   */
  public getErrorAnalysis(): {
    totalActiveErrors: number;
    errorsByLevel: Map<number, number>;
    averageSignificance: number;
    learningEfficiency: number;
    predictionImprovement: number;
  } {
    const totalActiveErrors = this.activeErrors.size;
    const errorsByLevel = new Map<number, number>();
    let totalSignificance = 0;
    
    for (const error of this.activeErrors.values()) {
      const currentCount = errorsByLevel.get(error.level) || 0;
      errorsByLevel.set(error.level, currentCount + 1);
      totalSignificance += error.significance;
    }
    
    const averageSignificance = totalActiveErrors > 0 ? totalSignificance / totalActiveErrors : 0;
    
    // Calculate learning efficiency
    const recentUpdates = this.learningUpdates.slice(-100);
    const learningEfficiency = recentUpdates.length > 0 ?
      recentUpdates.reduce((sum, update) => sum + update.confidence, 0) / recentUpdates.length : 0;
    
    // Calculate prediction improvement
    const recentImprovement = this.learningProgress.slice(-10);
    const predictionImprovement = recentImprovement.length > 0 ?
      recentImprovement.reduce((sum, progress) => sum + progress.improvement, 0) / recentImprovement.length : 0;
    
    return {
      totalActiveErrors,
      errorsByLevel,
      averageSignificance,
      learningEfficiency,
      predictionImprovement
    };
  }

  /**
   * Update error statistics
   */
  private updateErrorStatistics(level: number, error: PredictionError): void {
    const stats = this.errorStatistics.get(level)!;
    
    stats.totalErrors++;
    
    // Update error by type
    const typeCount = stats.errorsByType.get(error.errorType) || 0;
    stats.errorsByType.set(error.errorType, typeCount + 1);
    
    // Update error by level
    const levelCount = stats.errorsByLevel.get(level) || 0;
    stats.errorsByLevel.set(level, levelCount + 1);
    
    // Update average magnitude
    stats.averageErrorMagnitude = (stats.averageErrorMagnitude * (stats.totalErrors - 1) + error.magnitude) / stats.totalErrors;
    
    // Calculate error reduction rate
    const history = this.errorHistory.get(level)!;
    if (history.length > 10) {
      const recent = history.slice(-10);
      const older = history.slice(-20, -10);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, e) => sum + e.magnitude, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.magnitude, 0) / older.length;
        stats.errorReductionRate = (olderAvg - recentAvg) / olderAvg;
      }
    }
  }

  /**
   * Maintain error history size
   */
  private maintainErrorHistory(level: number): void {
    const history = this.errorHistory.get(level)!;
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${this.nextErrorId++}_${Date.now()}`;
  }

  /**
   * Reset prediction error processor
   */
  public reset(): void {
    this.errorHistory.clear();
    this.activeErrors.clear();
    this.errorSignals.clear();
    this.learningUpdates = [];
    this.errorReduction = [];
    this.learningProgress = [];
    this.adaptiveLearningRates.clear();
    this.errorExpectations.clear();
    this.surpriseDetector.clear();
    this.ascendingSignals.clear();
    this.descendingSignals.clear();
    this.nextErrorId = 1;
    
    this.initializeLevels();
  }
}
