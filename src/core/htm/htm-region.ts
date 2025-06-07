/**
 * HTM Region Implementation
 * 
 * Integrates spatial pooler, temporal pooler, and column state management
 * to create a complete HTM processing region. Represents a single cortical
 * region with hierarchical temporal memory capabilities.
 * 
 * Based on Thousand Brains Theory and HTM principles.
 */

import { SpatialPooler, SpatialPoolerConfig, createDefaultSpatialPoolerConfig } from './spatial-pooler';
import { TemporalPooler, TemporalPoolerConfig, createDefaultTemporalPoolerConfig } from './temporal-pooler';
import { ColumnStateManager } from './column-state-manager';

export interface HTMRegionConfig {
  // Region structure
  name: string;
  numColumns: number;
  cellsPerColumn: number;
  inputSize: number;
  
  // Component configurations
  spatialConfig?: Partial<SpatialPoolerConfig>;
  temporalConfig?: Partial<TemporalPoolerConfig>;
  
  // Learning parameters
  enableSpatialLearning: boolean;
  enableTemporalLearning: boolean;
  learningMode: 'online' | 'batch' | 'hybrid';
  
  // Performance parameters
  predictionSteps: number;
  maxMemoryTraces: number;
  stabilityThreshold: number;
}

export interface HTMRegionState {
  // Current state
  spatialActivation: boolean[];
  temporalState: any; // TemporalState from temporal pooler
  predictions: {
    nextStep: boolean[];
    confidence: number[];
    multiStep: boolean[][];
  };
  
  // Learning state
  learningProgress: number;
  stabilityMetrics: any;
  performanceMetrics: any;
  
  // Metadata
  iteration: number;
  timestamp: number;
  regionName: string;
}

export interface HTMRegionOutput {
  // Primary outputs
  activeColumns: boolean[];
  activeCells: number[];
  predictiveCells: number[];
  
  // Predictions
  predictions: boolean[];
  predictionConfidence: number[];
  
  // Context information
  temporalContext: number[];
  semanticFeatures: number[];
  
  // Metrics
  sparsity: number;
  predictionAccuracy: number;
  stability: number;
}

export class HTMRegion {
  private config: HTMRegionConfig;
  private spatialPooler!: SpatialPooler;
  private temporalPooler!: TemporalPooler;
  private columnStateManager!: ColumnStateManager;
  
  // State tracking
  private currentState!: HTMRegionState;
  private previousInputs: boolean[][];
  private learningHistory: number[];
  private performanceHistory: number[];
  
  // Internal metrics
  private iteration: number;
  private lastResetTime: number;

  constructor(config: HTMRegionConfig) {
    this.config = { ...config };
    this.iteration = 0;
    this.lastResetTime = Date.now();
    this.previousInputs = [];
    this.learningHistory = [];
    this.performanceHistory = [];
    
    this.initializeComponents();
    this.initializeState();
  }

  private initializeComponents(): void {
    // Initialize spatial pooler
    const spatialConfig = {
      ...createDefaultSpatialPoolerConfig(this.config.inputSize, this.config.numColumns),
      ...this.config.spatialConfig
    };
    this.spatialPooler = new SpatialPooler(spatialConfig);
    
    // Initialize temporal pooler - ensure cellsPerColumn is consistent
    const temporalConfig = {
      ...createDefaultTemporalPoolerConfig(),
      cellsPerColumn: this.config.cellsPerColumn, // Ensure consistency
      ...this.config.temporalConfig
    };
    
    // Debug log the configuration
    console.log(`[HTMRegion] Initializing with:`);
    console.log(`  - numColumns: ${this.config.numColumns}`);
    console.log(`  - cellsPerColumn: ${this.config.cellsPerColumn}`);
    console.log(`  - temporalConfig.cellsPerColumn: ${temporalConfig.cellsPerColumn}`);
    console.log(`  - Total cells: ${this.config.numColumns * this.config.cellsPerColumn}`);
    
    this.temporalPooler = new TemporalPooler(this.config.numColumns, temporalConfig);
    
    // Initialize column state manager
    this.columnStateManager = new ColumnStateManager(
      this.config.numColumns,
      this.config.cellsPerColumn,
      this.config.maxMemoryTraces
    );
  }

  private initializeState(): void {
    this.currentState = {
      spatialActivation: new Array(this.config.numColumns).fill(false),
      temporalState: null,
      predictions: {
        nextStep: new Array(this.config.numColumns).fill(false),
        confidence: new Array(this.config.numColumns).fill(0),
        multiStep: []
      },
      learningProgress: 0,
      stabilityMetrics: null,
      performanceMetrics: null,
      iteration: 0,
      timestamp: Date.now(),
      regionName: this.config.name
    };
  }

  /**
   * Main computation method - processes input through HTM region
   */
  public compute(input: boolean[], learn: boolean = true): HTMRegionOutput {
    if (input.length !== this.config.inputSize) {
      throw new Error(`Input size ${input.length} doesn't match expected ${this.config.inputSize}`);
    }

    // Store input for temporal context
    this.previousInputs.push([...input]);
    if (this.previousInputs.length > 10) {
      this.previousInputs.shift();
    }

    // Phase 1: Spatial Processing
    const spatialActivation = this.spatialPooler.compute(input, learn && this.config.enableSpatialLearning);
    
    // Phase 2: Temporal Processing
    const temporalState = this.temporalPooler.compute(spatialActivation, learn && this.config.enableTemporalLearning);
    
    // Phase 3: Generate Predictions
    const predictions = this.temporalPooler.getPredictions();
    
    // Phase 4: Update Column States
    this.updateColumnStates(spatialActivation, temporalState, predictions);
    
    // Phase 5: Calculate Multi-step Predictions
    const multiStepPredictions = this.generateMultiStepPredictions();
    
    // Phase 6: Update Learning Metrics
    if (learn) {
      this.updateLearningMetrics();
    }
    
    // Phase 7: Create Output
    const output = this.createOutput(spatialActivation, temporalState, predictions, multiStepPredictions);
    
    // Update state
    this.updateRegionState(spatialActivation, temporalState, predictions);
    
    this.iteration++;
    this.columnStateManager.step();
    
    return output;
  }

  /**
   * Update column states with current computation results
   */
  private updateColumnStates(
    spatialActivation: boolean[],
    temporalState: any,
    predictions: any
  ): void {
    // Get spatial pooler metrics
    const spatialMetrics = this.spatialPooler.getStabilityMetrics();
    const sparsity = this.spatialPooler.getCurrentSparsity();
    
    // Update spatial states
    const overlaps = new Array(this.config.numColumns).fill(0); // Would need to expose from spatial pooler
    const boosts = new Array(this.config.numColumns).fill(1.0);
    const activeDutyCycles = new Array(this.config.numColumns).fill(spatialMetrics?.avgActiveDutyCycle || 0);
    const overlapDutyCycles = new Array(this.config.numColumns).fill(spatialMetrics?.avgOverlapDutyCycle || 0);
    
    this.columnStateManager.updateSpatialStates(
      spatialActivation,
      overlaps,
      boosts,
      activeDutyCycles,
      overlapDutyCycles
    );
    
    // Update temporal states
    this.columnStateManager.updateTemporalStates(temporalState, predictions);
    
    // Update metrics
    this.columnStateManager.updateMetrics();
  }

  /**
   * Generate multi-step predictions
   */
  private generateMultiStepPredictions(): boolean[][] {
    const multiStepPredictions: boolean[][] = [];
    const maxSteps = this.config.predictionSteps;
    
    // Simulate future states by feeding predictions back
    let currentState = this.temporalPooler.getCurrentState();
    
    for (let step = 0; step < maxSteps; step++) {
      const futureState = this.temporalPooler.compute(
        this.currentState.spatialActivation, 
        false // Don't learn during prediction
      );
      
      const futurePredictions = this.temporalPooler.getPredictions();
      multiStepPredictions.push([...futurePredictions.predictedColumns]);
    }
    
    return multiStepPredictions;
  }

  /**
   * Update learning metrics and history
   */
  private updateLearningMetrics(): void {
    const spatialMetrics = this.spatialPooler.getStabilityMetrics();
    const temporalMetrics = this.temporalPooler.getLearningMetrics();
    const regionStats = this.columnStateManager.getRegionStats();
    
    // Calculate overall learning progress
    const stabilityScore = spatialMetrics.stabilityScore;
    const predictionAccuracy = temporalMetrics.predictionAccuracy;
    const learningProgress = (stabilityScore + predictionAccuracy) / 2;
    
    this.learningHistory.push(learningProgress);
    this.performanceHistory.push(predictionAccuracy);
    
    // Maintain history window
    if (this.learningHistory.length > 1000) {
      this.learningHistory.shift();
      this.performanceHistory.shift();
    }
  }

  /**
   * Create output structure
   */
  private createOutput(
    spatialActivation: boolean[],
    temporalState: any,
    predictions: any,
    multiStepPredictions: boolean[][]
  ): HTMRegionOutput {
    const activeCells = Array.from(temporalState.activeCells) as number[];
    const predictiveCells = Array.from(temporalState.predictiveCells) as number[];
    
    // Generate temporal context vector
    const temporalContext = this.generateTemporalContext(activeCells);
    
    // Generate semantic features
    const semanticFeatures = this.generateSemanticFeatures(spatialActivation, activeCells);
    
    // Calculate metrics
    const sparsity = activeCells.length / (this.config.numColumns * this.config.cellsPerColumn);
    const regionStats = this.columnStateManager.getRegionStats();
    
    return {
      activeColumns: [...spatialActivation],
      activeCells,
      predictiveCells,
      predictions: [...predictions.predictedColumns],
      predictionConfidence: [...predictions.confidence],
      temporalContext,
      semanticFeatures,
      sparsity,
      predictionAccuracy: regionStats.avgReliability,
      stability: regionStats.avgStability
    };
  }

  /**
   * Generate temporal context vector
   */
  private generateTemporalContext(activeCells: number[]): number[] {
    const contextSize = Math.min(100, this.config.numColumns);
    const context = new Array(contextSize).fill(0);
    
    // Encode recent activation patterns into context vector
    for (let i = 0; i < Math.min(this.previousInputs.length, 5); i++) {
      const weight = 1.0 - (i * 0.2); // Decay with time
      const input = this.previousInputs[this.previousInputs.length - 1 - i];
      
      for (let j = 0; j < Math.min(input.length, contextSize); j++) {
        if (input[j]) {
          context[j] += weight;
        }
      }
    }
    
    // Normalize
    const maxValue = Math.max(...context);
    if (maxValue > 0) {
      for (let i = 0; i < context.length; i++) {
        context[i] /= maxValue;
      }
    }
    
    return context;
  }

  /**
   * Generate semantic features
   */
  private generateSemanticFeatures(spatialActivation: boolean[], activeCells: number[]): number[] {
    const featureSize = 50;
    const features = new Array(featureSize).fill(0);
    
    // Combine spatial and temporal information
    let activeCount = 0;
    for (let i = 0; i < spatialActivation.length && i < featureSize; i++) {
      if (spatialActivation[i]) {
        features[i] += 0.5;
        activeCount++;
      }
    }
    
    // Add temporal information
    for (const cellId of activeCells) {
      const featureIndex = cellId % featureSize;
      features[featureIndex] += 0.3;
    }
    
    // Normalize by activation level
    if (activeCount > 0) {
      const normalizer = 1.0 / Math.sqrt(activeCount);
      for (let i = 0; i < features.length; i++) {
        features[i] *= normalizer;
      }
    }
    
    return features;
  }

  /**
   * Update internal region state
   */
  private updateRegionState(
    spatialActivation: boolean[],
    temporalState: any,
    predictions: any
  ): void {
    this.currentState.spatialActivation = [...spatialActivation];
    this.currentState.temporalState = temporalState;
    this.currentState.predictions = {
      nextStep: [...predictions.predictedColumns],
      confidence: [...predictions.confidence],
      multiStep: this.generateMultiStepPredictions()
    };
    
    // Update learning progress
    const recentLearning = this.learningHistory.slice(-50);
    this.currentState.learningProgress = recentLearning.length > 0 ?
      recentLearning.reduce((a, b) => a + b, 0) / recentLearning.length : 0;
    
    this.currentState.iteration = this.iteration;
    this.currentState.timestamp = Date.now();
    
    // Update metrics
    this.currentState.stabilityMetrics = this.columnStateManager.getRegionStats();
    this.currentState.performanceMetrics = this.getPerformanceMetrics();
  }

  /**
   * Get comprehensive performance metrics
   */
  public getPerformanceMetrics(): {
    predictionAccuracy: number;
    learningRate: number;
    stability: number;
    sparsity: number;
    efficiency: number;
    adaptability: number;
  } {
    const spatialMetrics = this.spatialPooler.getStabilityMetrics();
    const temporalMetrics = this.temporalPooler.getLearningMetrics();
    const regionStats = this.columnStateManager.getRegionStats();
    
    // Calculate learning rate based on recent improvement
    let learningRate = 0;
    if (this.learningHistory.length > 10) {
      const recent = this.learningHistory.slice(-10);
      const older = this.learningHistory.slice(-20, -10);
      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        learningRate = Math.max(0, recentAvg - olderAvg);
      }
    }
    
    // Calculate efficiency (performance per computational cost)
    const efficiency = regionStats.avgReliability / (regionStats.avgSparsity + 0.01);
    
    // Calculate adaptability (how quickly region adapts to new patterns)
    const adaptability = 1.0 - regionStats.burstingRate; // Lower bursting = better adaptation
    
    return {
      predictionAccuracy: temporalMetrics.predictionAccuracy,
      learningRate,
      stability: regionStats.avgStability,
      sparsity: regionStats.avgSparsity,
      efficiency,
      adaptability
    };
  }

  /**
   * Get current region state
   */
  public getCurrentState(): HTMRegionState {
    return { ...this.currentState };
  }

  /**
   * Get learning history
   */
  public getLearningHistory(): number[] {
    return [...this.learningHistory];
  }

  /**
   * Get column states
   */
  public getColumnStates() {
    return this.columnStateManager.getColumnStates();
  }

  /**
   * Predict next input based on current state
   */
  public predictNextInput(): {
    prediction: boolean[];
    confidence: number;
    alternatives: boolean[][];
  } {
    const predictions = this.temporalPooler.getPredictions();
    
    // Convert column predictions back to input space (simplified)
    const inputPrediction = new Array(this.config.inputSize).fill(false);
    
    // This would require knowledge of the spatial pooler's mapping
    // For now, we'll create a simplified mapping
    for (let i = 0; i < Math.min(predictions.predictedColumns.length, inputPrediction.length); i++) {
      inputPrediction[i] = predictions.predictedColumns[i];
    }
    
    // Calculate overall confidence
    const avgConfidence = predictions.confidence.reduce((a, b) => a + b, 0) / predictions.confidence.length;
    
    // Generate alternative predictions (simplified)
    const alternatives = [inputPrediction]; // Would generate multiple alternatives
    
    return {
      prediction: inputPrediction,
      confidence: avgConfidence,
      alternatives
    };
  }

  /**
   * Train the region on a sequence
   */
  public trainSequence(sequence: boolean[][], repetitions: number = 1): void {
    for (let rep = 0; rep < repetitions; rep++) {
      for (const input of sequence) {
        this.compute(input, true);
      }
      
      // Reset temporal state between repetitions but keep spatial learning
      this.temporalPooler.reset();
    }
  }

  /**
   * Reset the HTM region
   */
  public reset(): void {
    this.spatialPooler.reset();
    this.temporalPooler.reset();
    this.columnStateManager.reset();
    this.iteration = 0;
    this.lastResetTime = Date.now();
    this.previousInputs = [];
    this.learningHistory = [];
    this.performanceHistory = [];
    this.initializeState();
  }

  /**
   * Save region state for later restoration
   */
  public saveState(): any {
    return {
      config: this.config,
      iteration: this.iteration,
      learningHistory: [...this.learningHistory],
      performanceHistory: [...this.performanceHistory],
      currentState: { ...this.currentState }
    };
  }

  /**
   * Load previously saved state
   */
  public loadState(savedState: any): void {
    this.iteration = savedState.iteration;
    this.learningHistory = [...savedState.learningHistory];
    this.performanceHistory = [...savedState.performanceHistory];
    this.currentState = { ...savedState.currentState };
  }
}

/**
 * Create a default HTM region configuration
 */
export function createDefaultHTMRegionConfig(
  name: string,
  inputSize: number,
  numColumns?: number
): HTMRegionConfig {
  const columnCount = numColumns || Math.floor(inputSize * 0.5);
  
  return {
    name,
    numColumns: columnCount,
    cellsPerColumn: 32,
    inputSize,
    enableSpatialLearning: true,
    enableTemporalLearning: true,
    learningMode: 'online',
    predictionSteps: 5,
    maxMemoryTraces: 100,
    stabilityThreshold: 0.8
  };
}
