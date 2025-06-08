/**
 * HTM Column State Manager
 * 
 * Manages the state of cortical columns in an HTM region, coordinating
 * between spatial pooler and temporal pooler components. Tracks column
 * activation patterns, learning state, and temporal context.
 * 
 * Based on cortical column principles from Thousand Brains Theory.
 */

import { TemporalState } from './temporal-pooler';

export interface ColumnActivationState {
  isActive: boolean;
  isPredicted: boolean;
  wasPredicted: boolean;
  burstingCells: number[];
  activeCells: number[];
  winnerCells: number[];
  predictiveCells: number[];
  confidence: number;
  timestamp: number;
}

export interface ColumnLearningState {
  // Spatial learning metrics
  overlapScore: number;
  boostFactor: number;
  activeDutyCycle: number;
  overlapDutyCycle: number;
  
  // Temporal learning metrics
  predictionAccuracy: number;
  burstingFrequency: number;
  segmentCount: number;
  synapseCount: number;
  
  // Stability metrics
  representationStability: number;
  learningProgress: number;
  
  lastUpdated: number;
}

export interface ColumnMemoryTrace {
  timestamp: number;
  activationPattern: boolean[];
  temporalContext: number[];
  predictionState: boolean[];
  learningSignal: number;
}

export interface ColumnMetrics {
  // Performance metrics
  stability: number;
  reliability: number;
  selectivity: number;
  predictivity: number;
  
  // Learning metrics
  adaptationRate: number;
  memoryCapacity: number;
  temporalDepth: number;
  
  // Efficiency metrics
  sparsity: number;
  energyEfficiency: number;
}

export class ColumnStateManager {
  private numColumns: number;
  private cellsPerColumn: number;
  private currentStates!: ColumnActivationState[];
  private learningStates!: ColumnLearningState[];
  private memoryTraces!: ColumnMemoryTrace[][];
  private metrics!: ColumnMetrics[];
  
  // Configuration
  private maxMemoryTraces: number;
  private stabilityWindow: number;
  private learningWindow: number;
  
  // Temporal tracking
  private timestep: number;
  private activationHistory!: boolean[][];
  private predictionHistory!: boolean[][];
  
  constructor(
    numColumns: number, 
    cellsPerColumn: number = 32,
    maxMemoryTraces: number = 100
  ) {
    this.numColumns = numColumns;
    this.cellsPerColumn = cellsPerColumn;
    this.maxMemoryTraces = maxMemoryTraces;
    this.stabilityWindow = 50;
    this.learningWindow = 100;
    this.timestep = 0;
    
    this.initializeStates();
  }

  private initializeStates(): void {
    this.currentStates = [];
    this.learningStates = [];
    this.memoryTraces = [];
    this.metrics = [];
    this.activationHistory = [];
    this.predictionHistory = [];
    
    for (let i = 0; i < this.numColumns; i++) {
      // Initialize activation state
      this.currentStates.push({
        isActive: false,
        isPredicted: false,
        wasPredicted: false,
        burstingCells: [],
        activeCells: [],
        winnerCells: [],
        predictiveCells: [],
        confidence: 0,
        timestamp: 0
      });
      
      // Initialize learning state
      this.learningStates.push({
        overlapScore: 0,
        boostFactor: 1.0,
        activeDutyCycle: 0,
        overlapDutyCycle: 0,
        predictionAccuracy: 0,
        burstingFrequency: 0,
        segmentCount: 0,
        synapseCount: 0,
        representationStability: 0,
        learningProgress: 0,
        lastUpdated: 0
      });
      
      // Initialize memory traces
      this.memoryTraces.push([]);
      
      // Initialize metrics
      this.metrics.push({
        stability: 0,
        reliability: 0,
        selectivity: 0,
        predictivity: 0,
        adaptationRate: 0,
        memoryCapacity: 0,
        temporalDepth: 0,
        sparsity: 0,
        energyEfficiency: 0
      });
    }
  }

  /**
   * Update column states with new spatial pooler results
   */
  public updateSpatialStates(
    activeColumns: boolean[],
    overlaps: number[],
    boosts: number[],
    activeDutyCycles: number[],
    overlapDutyCycles: number[]
  ): void {
    if (activeColumns.length !== this.numColumns) {
      throw new Error(`Expected ${this.numColumns} columns, got ${activeColumns.length}`);
    }

    // Add safety checks for all input arrays
    if (!overlaps || overlaps.length === 0) {
      console.warn('Warning: overlaps array is undefined or empty, using defaults');
      overlaps = new Array(this.numColumns).fill(0);
    }
    if (!boosts || boosts.length === 0) {
      console.warn('Warning: boosts array is undefined or empty, using defaults');
      boosts = new Array(this.numColumns).fill(1.0);
    }
    if (!activeDutyCycles || activeDutyCycles.length === 0) {
      console.warn('Warning: activeDutyCycles array is undefined or empty, using defaults');
      activeDutyCycles = new Array(this.numColumns).fill(0);
    }
    if (!overlapDutyCycles || overlapDutyCycles.length === 0) {
      console.warn('Warning: overlapDutyCycles array is undefined or empty, using defaults');
      overlapDutyCycles = new Array(this.numColumns).fill(0);
    }

    for (let i = 0; i < this.numColumns; i++) {
      const state = this.currentStates[i];
      const learningState = this.learningStates[i];
      
      // Update activation state
      state.wasPredicted = state.isPredicted;
      state.isActive = activeColumns[i];
      state.timestamp = this.timestep;
      
      // Update learning metrics
      learningState.overlapScore = overlaps[i] || 0;
      learningState.boostFactor = boosts[i] || 1.0;
      learningState.activeDutyCycle = activeDutyCycles[i] || 0;
      learningState.overlapDutyCycle = overlapDutyCycles[i] || 0;
      learningState.lastUpdated = this.timestep;
    }
  }

  /**
   * Update column states with temporal pooler results
   */
  public updateTemporalStates(
    temporalState: TemporalState,
    predictions: { predictedColumns: boolean[]; confidence: number[] }
  ): void {
    // Add safety check
    if (!temporalState) {
      console.error('updateTemporalStates called with undefined temporalState');
      return;
    }

    // Reduced debug logging for performance
    if (this.timestep % 100 === 0 && temporalState.activeCells.size > 0) {
      const cellIds = Array.from(temporalState.activeCells);
      console.log(`[ColumnStateManager] Active cells: ${temporalState.activeCells.size}, Max cell ID: ${Math.max(...cellIds)}`);
    }

    // Clear previous temporal state
    for (let i = 0; i < this.numColumns; i++) {
      const state = this.currentStates[i];
      state.burstingCells = [];
      state.activeCells = [];
      state.winnerCells = [];
      state.predictiveCells = [];
      state.isPredicted = predictions.predictedColumns[i] || false;
      state.confidence = predictions.confidence[i] || 0;
    }

    // Process active cells with bounds checking
    for (const cellId of temporalState.activeCells) {
      const columnIndex = Math.floor(cellId / this.cellsPerColumn);
      
      // Reduced debug output for performance
      
      // Bounds check
      if (columnIndex >= 0 && columnIndex < this.numColumns) {
        this.currentStates[columnIndex].activeCells.push(cellId);
      } else {
        console.error(`[ColumnStateManager] Cell ID ${cellId} maps to invalid column index ${columnIndex} (max: ${this.numColumns - 1})`);
      }
    }

    // Process winner cells with bounds checking
    for (const cellId of temporalState.winnerCells) {
      const columnIndex = Math.floor(cellId / this.cellsPerColumn);
      if (columnIndex >= 0 && columnIndex < this.numColumns) {
        this.currentStates[columnIndex].winnerCells.push(cellId);
      } else {
        console.error(`[ColumnStateManager] Winner cell ID ${cellId} maps to invalid column index ${columnIndex}`);
      }
    }

    // Process predictive cells with bounds checking
    for (const cellId of temporalState.predictiveCells) {
      const columnIndex = Math.floor(cellId / this.cellsPerColumn);
      if (columnIndex >= 0 && columnIndex < this.numColumns) {
        this.currentStates[columnIndex].predictiveCells.push(cellId);
      } else {
        console.error(`[ColumnStateManager] Predictive cell ID ${cellId} maps to invalid column index ${columnIndex}`);
      }
    }

    // Identify bursting columns
    for (let i = 0; i < this.numColumns; i++) {
      const state = this.currentStates[i];
      const learningState = this.learningStates[i];
      
      if (state.isActive && !state.wasPredicted) {
        // Column is bursting - all cells became active
        state.burstingCells = [];
        const startCellId = i * this.cellsPerColumn;
        for (let j = 0; j < this.cellsPerColumn; j++) {
          state.burstingCells.push(startCellId + j);
        }
        
        // Update bursting frequency
        learningState.burstingFrequency = this.updateMovingAverage(
          learningState.burstingFrequency, 1, this.learningWindow
        );
      } else {
        learningState.burstingFrequency = this.updateMovingAverage(
          learningState.burstingFrequency, 0, this.learningWindow
        );
      }
      
      // Update prediction accuracy
      const wasCorrectlyPredicted = state.wasPredicted && state.isActive;
      const wasIncorrectlyPredicted = state.wasPredicted && !state.isActive;
      
      if (state.wasPredicted) {
        const accuracy = wasCorrectlyPredicted ? 1 : 0;
        learningState.predictionAccuracy = this.updateMovingAverage(
          learningState.predictionAccuracy, accuracy, this.learningWindow
        );
      }
    }
  }

  /**
   * Update segment and synapse statistics
   */
  public updateSegmentStats(cellSegmentCounts: Map<number, number>, cellSynapseCounts: Map<number, number>): void {
    for (let i = 0; i < this.numColumns; i++) {
      const learningState = this.learningStates[i];
      let totalSegments = 0;
      let totalSynapses = 0;
      
      // Aggregate for all cells in column
      const startCellId = i * this.cellsPerColumn;
      for (let j = 0; j < this.cellsPerColumn; j++) {
        const cellId = startCellId + j;
        totalSegments += cellSegmentCounts.get(cellId) || 0;
        totalSynapses += cellSynapseCounts.get(cellId) || 0;
      }
      
      learningState.segmentCount = totalSegments;
      learningState.synapseCount = totalSynapses;
    }
  }

  /**
   * Add memory trace for temporal context
   */
  public addMemoryTrace(
    activationPattern: boolean[],
    temporalContext: number[],
    predictionState: boolean[],
    learningSignal: number
  ): void {
    const trace: ColumnMemoryTrace = {
      timestamp: this.timestep,
      activationPattern: [...activationPattern],
      temporalContext: [...temporalContext],
      predictionState: [...predictionState],
      learningSignal
    };

    for (let i = 0; i < this.numColumns; i++) {
      this.memoryTraces[i].push(trace);
      
      // Maintain memory trace limit
      if (this.memoryTraces[i].length > this.maxMemoryTraces) {
        this.memoryTraces[i].shift();
      }
    }
  }

  /**
   * Update all column metrics
   */
  public updateMetrics(): void {
    // Track activation and prediction history
    const currentActivation = this.currentStates.map(state => state.isActive);
    const currentPrediction = this.currentStates.map(state => state.isPredicted);
    
    this.activationHistory.push(currentActivation);
    this.predictionHistory.push(currentPrediction);
    
    // Maintain history window
    if (this.activationHistory.length > this.stabilityWindow) {
      this.activationHistory.shift();
      this.predictionHistory.shift();
    }

    // Calculate metrics for each column
    for (let i = 0; i < this.numColumns; i++) {
      this.metrics[i] = this.calculateColumnMetrics(i);
    }
  }

  /**
   * Calculate comprehensive metrics for a column
   */
  private calculateColumnMetrics(columnIndex: number): ColumnMetrics {
    const state = this.currentStates[columnIndex];
    const learningState = this.learningStates[columnIndex];
    const traces = this.memoryTraces[columnIndex];
    
    // Stability: consistency of activation patterns
    const stability = this.calculateStability(columnIndex);
    
    // Reliability: prediction accuracy
    const reliability = learningState.predictionAccuracy;
    
    // Selectivity: how sparse the column's activation is
    const selectivity = 1 - learningState.activeDutyCycle;
    
    // Predictivity: how often column predicts correctly
    const predictivity = this.calculatePredictivity(columnIndex);
    
    // Adaptation rate: how quickly column adapts to new patterns
    const adaptationRate = this.calculateAdaptationRate(columnIndex);
    
    // Memory capacity: ability to maintain distinct representations
    const memoryCapacity = this.calculateMemoryCapacity(columnIndex);
    
    // Temporal depth: how far back temporal dependencies extend
    const temporalDepth = this.calculateTemporalDepth(columnIndex);
    
    // Sparsity: current activation sparsity
    const sparsity = state.activeCells.length / this.cellsPerColumn;
    
    // Energy efficiency: activation efficiency relative to information content
    const energyEfficiency = this.calculateEnergyEfficiency(columnIndex);
    
    return {
      stability,
      reliability,
      selectivity,
      predictivity,
      adaptationRate,
      memoryCapacity,
      temporalDepth,
      sparsity,
      energyEfficiency
    };
  }

  /**
   * Calculate stability metric
   */
  private calculateStability(columnIndex: number): number {
    if (this.activationHistory.length < 2) return 0;
    
    let consistentActivations = 0;
    const recentHistory = this.activationHistory.slice(-this.stabilityWindow);
    
    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i - 1][columnIndex];
      const curr = recentHistory[i][columnIndex];
      
      // Count consistent state transitions
      if (prev === curr) {
        consistentActivations++;
      }
    }
    
    return consistentActivations / (recentHistory.length - 1);
  }

  /**
   * Calculate predictivity metric
   */
  private calculatePredictivity(columnIndex: number): number {
    if (this.predictionHistory.length < 2) return 0;
    
    let correctPredictions = 0;
    let totalPredictions = 0;
    
    for (let i = 1; i < this.activationHistory.length; i++) {
      const predicted = this.predictionHistory[i - 1][columnIndex];
      const actual = this.activationHistory[i][columnIndex];
      
      if (predicted) {
        totalPredictions++;
        if (actual) {
          correctPredictions++;
        }
      }
    }
    
    return totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
  }

  /**
   * Calculate adaptation rate
   */
  private calculateAdaptationRate(columnIndex: number): number {
    const traces = this.memoryTraces[columnIndex];
    if (traces.length < 2) return 0;
    
    let adaptationSum = 0;
    let count = 0;
    
    for (let i = 1; i < traces.length; i++) {
      const learningSignal = traces[i].learningSignal;
      if (learningSignal > 0) {
        adaptationSum += learningSignal;
        count++;
      }
    }
    
    return count > 0 ? adaptationSum / count : 0;
  }

  /**
   * Calculate memory capacity
   */
  private calculateMemoryCapacity(columnIndex: number): number {
    const traces = this.memoryTraces[columnIndex];
    if (traces.length === 0) return 0;
    
    // Count unique activation patterns
    const uniquePatterns = new Set();
    for (const trace of traces) {
      const pattern = trace.activationPattern.join('');
      uniquePatterns.add(pattern);
    }
    
    return uniquePatterns.size / traces.length;
  }

  /**
   * Calculate temporal depth
   */
  private calculateTemporalDepth(columnIndex: number): number {
    const state = this.currentStates[columnIndex];
    const learningState = this.learningStates[columnIndex];
    
    // Estimate based on segment count and prediction accuracy
    const segmentDepth = Math.log(learningState.segmentCount + 1);
    const accuracyDepth = learningState.predictionAccuracy * 10;
    
    return Math.min(segmentDepth + accuracyDepth, 20); // Cap at reasonable depth
  }

  /**
   * Calculate energy efficiency
   */
  private calculateEnergyEfficiency(columnIndex: number): number {
    const state = this.currentStates[columnIndex];
    const learningState = this.learningStates[columnIndex];
    
    // Efficiency = Information / Energy_Cost
    const information = learningState.predictionAccuracy * state.confidence;
    const energyCost = (state.activeCells.length / this.cellsPerColumn) + 
                      (learningState.segmentCount / 100); // Normalize
    
    return energyCost > 0 ? information / energyCost : 0;
  }

  /**
   * Update moving average
   */
  private updateMovingAverage(current: number, newValue: number, period: number): number {
    return ((period - 1) * current + newValue) / period;
  }

  /**
   * Get current column states
   */
  public getColumnStates(): ColumnActivationState[] {
    return this.currentStates.map(state => ({ ...state }));
  }

  /**
   * Get learning states
   */
  public getLearningStates(): ColumnLearningState[] {
    return this.learningStates.map(state => ({ ...state }));
  }

  /**
   * Get column metrics
   */
  public getMetrics(): ColumnMetrics[] {
    return this.metrics.map(metric => ({ ...metric }));
  }

  /**
   * Get memory traces for a specific column
   */
  public getMemoryTraces(columnIndex: number): ColumnMemoryTrace[] {
    if (columnIndex < 0 || columnIndex >= this.numColumns) {
      throw new Error(`Column index ${columnIndex} out of range`);
    }
    return [...this.memoryTraces[columnIndex]];
  }

  /**
   * Get global region statistics
   */
  public getRegionStats(): {
    totalActiveColumns: number;
    totalPredictedColumns: number;
    avgStability: number;
    avgReliability: number;
    avgSparsity: number;
    burstingRate: number;
  } {
    const activeCount = this.currentStates.filter(state => state.isActive).length;
    const predictedCount = this.currentStates.filter(state => state.isPredicted).length;
    
    const totalStability = this.metrics.reduce((sum, metric) => sum + metric.stability, 0);
    const totalReliability = this.metrics.reduce((sum, metric) => sum + metric.reliability, 0);
    const totalSparsity = this.metrics.reduce((sum, metric) => sum + metric.sparsity, 0);
    const totalBursting = this.learningStates.reduce((sum, state) => sum + state.burstingFrequency, 0);
    
    return {
      totalActiveColumns: activeCount,
      totalPredictedColumns: predictedCount,
      avgStability: totalStability / this.numColumns,
      avgReliability: totalReliability / this.numColumns,
      avgSparsity: totalSparsity / this.numColumns,
      burstingRate: totalBursting / this.numColumns
    };
  }

  /**
   * Advance timestep
   */
  public step(): void {
    this.timestep++;
  }

  /**
   * Reset all column states
   */
  public reset(): void {
    this.timestep = 0;
    this.activationHistory = [];
    this.predictionHistory = [];
    
    for (let i = 0; i < this.numColumns; i++) {
      this.memoryTraces[i] = [];
    }
    
    this.initializeStates();
  }
}
