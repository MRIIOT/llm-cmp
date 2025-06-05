/**
 * HTM Temporal Pooler Implementation
 * 
 * The temporal pooler learns temporal sequences and patterns in the sparse
 * distributed representations from the spatial pooler. It implements the 
 * sequence memory algorithm from HTM theory.
 * 
 * Key responsibilities:
 * - Learn temporal sequences of spatial patterns
 * - Predict next elements in sequences
 * - Maintain temporal context through dendritic segments
 * - Form predictive states for anticipatory processing
 */

export interface TemporalPoolerConfig {
  // Cell parameters
  cellsPerColumn: number;
  activationThreshold: number;
  learningThreshold: number;
  
  // Segment parameters
  maxSegmentsPerCell: number;
  maxSynapsesPerSegment: number;
  initialPermanence: number;
  connectedPermanence: number;
  permanenceIncrement: number;
  permanenceDecrement: number;
  predictedSegmentDecrement: number;
  
  // Learning parameters
  minThreshold: number;
  sampleSize: number;
  permanenceThreshold: number;
  maxNewSynapseCount: number;
  
  // Random seed for reproducibility
  seed?: number;
}

export interface Synapse {
  presynapticCell: number;
  permanence: number;
}

export interface Segment {
  synapses: Synapse[];
  lastUsedIteration: number;
}

export interface Cell {
  columnIndex: number;
  cellIndex: number;
  segments: Segment[];
}

export interface TemporalState {
  activeCells: Set<number>;
  winnerCells: Set<number>;
  predictiveCells: Set<number>;
  activeSegments: Set<number>;
  learningSegments: Set<number>;
  matchingSegments: Set<number>;
}

export class TemporalPooler {
  private config: TemporalPoolerConfig;
  private numColumns: number;
  private numCells: number;
  private cells!: Cell[];
  private currentState!: TemporalState;
  private previousState!: TemporalState;
  private iteration: number;
  private segments!: Segment[];
  private nextSegmentId: number;
  private rng: () => number;
  
  // Sequence learning metrics
  private predictionAccuracy: number[];
  private burstingColumns: number[];

  constructor(numColumns: number, config: Partial<TemporalPoolerConfig> = {}) {
    this.numColumns = numColumns;
    this.config = this.createDefaultConfig(config);
    this.numCells = numColumns * this.config.cellsPerColumn;
    this.iteration = 0;
    this.nextSegmentId = 0;
    this.predictionAccuracy = [];
    this.burstingColumns = [];
    
    // Initialize seeded random number generator
    this.rng = this.createSeededRandom(this.config.seed || 42);
    
    this.initializeCells();
    this.resetState();
  }

  /**
   * Create a seeded random number generator
   * Uses a linear congruential generator for deterministic randomness
   */
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      const result = state / 0x80000000;
      
      // DEBUG: Check RNG output
      if (this.iteration < 5 && Math.random() < 0.1) {
        console.log(`        [DEBUG RNG] state=${state}, result=${result.toFixed(6)}`);
      }
      
      return result;
    };
  }

  private createDefaultConfig(overrides: Partial<TemporalPoolerConfig>): TemporalPoolerConfig {
    return {
      cellsPerColumn: 32,
      activationThreshold: 13,
      learningThreshold: 10,
      maxSegmentsPerCell: 255,
      maxSynapsesPerSegment: 255,
      initialPermanence: 0.21,
      connectedPermanence: 0.50,
      permanenceIncrement: 0.10,
      permanenceDecrement: 0.10,
      predictedSegmentDecrement: 0.002,
      minThreshold: 8,
      sampleSize: 20,
      permanenceThreshold: 0.1,
      maxNewSynapseCount: 20,
      seed: 42,  // Add default seed
      ...overrides
    };
  }

  private initializeCells(): void {
    this.cells = [];
    this.segments = [];
    
    for (let columnIndex = 0; columnIndex < this.numColumns; columnIndex++) {
      for (let cellIndex = 0; cellIndex < this.config.cellsPerColumn; cellIndex++) {
        const cell: Cell = {
          columnIndex,
          cellIndex,
          segments: []
        };
        this.cells.push(cell);
      }
    }
  }

  /**
   * Reset only the current state, preserving learned segments
   */
  public resetState(): void {
    this.currentState = {
      activeCells: new Set<number>(),
      winnerCells: new Set<number>(),
      predictiveCells: new Set<number>(),
      activeSegments: new Set<number>(),
      learningSegments: new Set<number>(),
      matchingSegments: new Set<number>()
    };
    
    this.previousState = {
      activeCells: new Set<number>(),
      winnerCells: new Set<number>(),
      predictiveCells: new Set<number>(),
      activeSegments: new Set<number>(),
      learningSegments: new Set<number>(),
      matchingSegments: new Set<number>()
    };
  }

  /**
   * Main temporal memory computation
   * Processes current active columns and learns temporal sequences
   */
  public compute(activeColumns: boolean[], learn: boolean = true): TemporalState {
    // Save previous state
    this.previousState = this.deepCopyState(this.currentState);
    
    // Reset current state
    this.currentState = {
      activeCells: new Set<number>(),
      winnerCells: new Set<number>(),
      predictiveCells: new Set<number>(),
      activeSegments: new Set<number>(),
      learningSegments: new Set<number>(),
      matchingSegments: new Set<number>()
    };

    // Phase 1: Calculate predictive state from previous timestep
    this.calculatePredictiveState();

    // Phase 2: Process active columns
    const burstingColumnIndices = this.processActiveColumns(activeColumns);

    // Phase 3: Learning
    if (learn) {
      this.learnOnSegments();
      this.adaptSegments();
      this.trackPredictionAccuracy(activeColumns);
    }

    this.iteration++;
    
    return this.deepCopyState(this.currentState);
  }

  /**
   * Calculate which cells should be in predictive state
   */
  private calculatePredictiveState(): void {
    // Debug: log previous state info
    if (this.iteration % 100 === 0 && this.previousState.winnerCells.size > 0) {
      //console.log(`      [DEBUG] Iteration ${this.iteration}: Previous winner cells: ${this.previousState.winnerCells.size}, Previous active cells: ${this.previousState.activeCells.size}`);
    }
    
    let totalSegments = 0;
    let segmentsWithOverlap = 0;
    let cellsChecked = 0;
    let cellsWithSegments = 0;
    
    for (let cellId = 0; cellId < this.numCells; cellId++) {
      const cell = this.cells[cellId];
      cellsChecked++;
      
      if (cell.segments.length > 0) {
        cellsWithSegments++;
      }
      
      for (let segmentIdx = 0; segmentIdx < cell.segments.length; segmentIdx++) {
        const segment = cell.segments[segmentIdx];
        const segmentId = this.getSegmentId(cellId, segmentIdx);
        totalSegments++;
        
        // CRITICAL FIX: Use winner cells for prediction, not all active cells
        // Segments learn from winner cells, so they should predict based on winner cells
        const overlap = this.calculateSegmentOverlap(segment, this.previousState.winnerCells);
        
        if (overlap > 0) {
          segmentsWithOverlap++;
          if (this.iteration % 100 === 0 && segmentsWithOverlap < 5) {
            //console.log(`      [DEBUG] Cell ${cellId} Segment ${segmentIdx}: overlap ${overlap} (threshold: ${this.config.activationThreshold}), synapses: ${segment.synapses.length}`);
          }
        }
        
        if (overlap >= this.config.activationThreshold) {
          this.currentState.predictiveCells.add(cellId);
          this.currentState.activeSegments.add(segmentId);
        }
        
        if (overlap >= this.config.learningThreshold) {
          this.currentState.learningSegments.add(segmentId);
        }
        
        if (overlap >= this.config.minThreshold) {
          this.currentState.matchingSegments.add(segmentId);
        }
      }
    }
    
    if (this.iteration % 100 === 0) {
      //console.log(`      [DEBUG] Cells with segments: ${cellsWithSegments}/${cellsChecked}`);
      //console.log(`      [DEBUG] Total segments: ${totalSegments}, Segments with overlap: ${segmentsWithOverlap}, Predictive cells: ${this.currentState.predictiveCells.size}`);
    }
  }

  /**
   * Process currently active columns
   */
  private processActiveColumns(activeColumns: boolean[]): number[] {
    const burstingColumnIndices: number[] = [];
    
    // Debug logging
    const activeCount = activeColumns.filter(x => x).length;
    if (this.iteration % 100 === 0) {
      //console.log(`      [DEBUG] Processing ${activeCount} active columns`);
    }
    
    for (let columnIndex = 0; columnIndex < activeColumns.length; columnIndex++) {
      if (!activeColumns[columnIndex]) continue;
      
      const columnCells = this.getColumnCells(columnIndex);
      const predictedCells = columnCells.filter(cellId => 
        this.currentState.predictiveCells.has(cellId)
      );
      
      if (predictedCells.length > 0) {
        // Column was predicted - activate predicted cells
        for (const cellId of predictedCells) {
          // DEBUG: Validate predicted cell IDs
          const maxValidCellId = this.numCells - 1;
          if (cellId > maxValidCellId || cellId < 0) {
            console.error(`      [ERROR] Invalid predicted cell ID: ${cellId} (max valid: ${maxValidCellId})`);
          }
          
          this.currentState.activeCells.add(cellId);
          this.currentState.winnerCells.add(cellId);
        }
      } else {
        // Column was not predicted - burst all cells
        burstingColumnIndices.push(columnIndex);
        
        for (const cellId of columnCells) {
          this.currentState.activeCells.add(cellId);
        }
        
        // Choose winner cell (cell with best matching segment)
        const winnerCell = this.chooseBestMatchingCell(columnIndex);
        
        // DEBUG: Validate winner cell ID
        const maxValidCellId = this.numCells - 1;
        if (winnerCell > maxValidCellId || winnerCell < 0) {
          console.error(`      [ERROR] Invalid winner cell ID: ${winnerCell} (max valid: ${maxValidCellId})`);
          console.error(`      [ERROR] Column index: ${columnIndex}, cells per column: ${this.config.cellsPerColumn}`);
        }
        
        this.currentState.winnerCells.add(winnerCell);
      }
    }
    
    if (this.iteration % 100 === 0) {
      //console.log(`      [DEBUG] Active cells: ${this.currentState.activeCells.size}, Winner cells: ${this.currentState.winnerCells.size}, Bursting columns: ${burstingColumnIndices.length}`);
    }
    
    this.burstingColumns.push(burstingColumnIndices.length);
    return burstingColumnIndices;
  }

  /**
   * Choose the cell with the best matching segment as winner
   */
  private chooseBestMatchingCell(columnIndex: number): number {
    const columnCells = this.getColumnCells(columnIndex);
    let bestCell = columnCells[0];
    let bestScore = -1;
    
    for (const cellId of columnCells) {
      const cell = this.cells[cellId];
      let maxOverlap = 0;
      
      for (const segment of cell.segments) {
        // FIX: Use winner cells for consistency
        const overlap = this.calculateSegmentOverlap(segment, this.previousState.winnerCells);
        maxOverlap = Math.max(maxOverlap, overlap);
      }
      
      if (maxOverlap > bestScore) {
        bestScore = maxOverlap;
        bestCell = cellId;
      }
    }
    
    return bestCell;
  }

  /**
   * Learn on active segments
   */
  private learnOnSegments(): void {
    // Learn on segments that became active
    for (const segmentId of this.currentState.learningSegments) {
      const { cellId, segmentIdx } = this.parseSegmentId(segmentId);
      const cell = this.cells[cellId];
      const segment = cell.segments[segmentIdx];
      
      this.adaptSegment(segment, this.previousState.winnerCells, true);
      segment.lastUsedIteration = this.iteration;
    }

    // Create new segments for winner cells without active segments
    for (const cellId of this.currentState.winnerCells) {
      const hasLearningSegment = this.cellHasLearningSegment(cellId);
      
      if (!hasLearningSegment && this.previousState.winnerCells.size > 0) {
        this.createNewSegment(cellId);
      }
    }
  }

  /**
   * Create a new segment for a cell
   */
  private createNewSegment(cellId: number): void {
    const cell = this.cells[cellId];
    
    // Remove oldest segment if at capacity
    if (cell.segments.length >= this.config.maxSegmentsPerCell) {
      this.destroyLeastRecentlyUsedSegment(cell);
    }
    
    const newSegment: Segment = {
      synapses: [],
      lastUsedIteration: this.iteration
    };
    
    // Add synapses to random subset of winner cells from previous timestep
    const presynapticCells = Array.from(this.previousState.winnerCells);
    const sampleSize = Math.min(this.config.sampleSize, presynapticCells.length);
    
    // CRITICAL DEBUG: Check for invalid cell IDs
    const maxValidCellId = this.numCells - 1;
    const invalidCells = presynapticCells.filter(cellId => cellId > maxValidCellId || cellId < 0);
    if (invalidCells.length > 0) {
      console.error(`      [ERROR] Invalid cell IDs in previousState.winnerCells! Max valid: ${maxValidCellId}`);
      console.error(`      [ERROR] Invalid cells: [${invalidCells.join(', ')}]`);
      console.error(`      [ERROR] All previous winner cells: [${presynapticCells.join(', ')}]`);
    }
    
    const sampledCells = this.sampleArray(presynapticCells, sampleSize);
    
    // Debug logging
    if (this.iteration % 100 === 0 || this.iteration < 20) {
      console.log(`      [DEBUG] Creating segment for cell ${cellId}: ${presynapticCells.length} previous winner cells, sampling ${sampledCells.length}`);
      console.log(`      [DEBUG] Previous winner cells: [${presynapticCells.slice(0, 5).join(', ')}...]`);
      console.log(`      [DEBUG] Sampled cells: [${sampledCells.slice(0, 5).join(', ')}...]`);
      console.log(`      [DEBUG] Max valid cell ID: ${maxValidCellId}, numCells: ${this.numCells}`);
    }
    
    for (const presynapticCell of sampledCells) {
      const synapse: Synapse = {
        presynapticCell,
        permanence: this.config.initialPermanence
      };
      newSegment.synapses.push(synapse);
    }
    
    cell.segments.push(newSegment);
    
    // Mark as learning segment
    const segmentId = this.getSegmentId(cellId, cell.segments.length - 1);
    this.currentState.learningSegments.add(segmentId);
    
    if (this.iteration % 100 === 0 || this.iteration < 20) {
      console.log(`      [DEBUG] Created segment ${segmentId} with ${newSegment.synapses.length} synapses, initial permanence: ${this.config.initialPermanence}`);
      console.log(`      [DEBUG] First 3 synapses connect to cells: [${newSegment.synapses.slice(0, 3).map(s => s.presynapticCell).join(', ')}]`);
    }
  }

  /**
   * Adapt permanences on segment synapses
   */
  private adaptSegment(segment: Segment, activeCells: Set<number>, reinforceConnected: boolean): void {
    for (const synapse of segment.synapses) {
      if (activeCells.has(synapse.presynapticCell)) {
        // Strengthen synapses to active cells
        synapse.permanence += this.config.permanenceIncrement;
        synapse.permanence = Math.min(1.0, synapse.permanence);
      } else if (reinforceConnected) {
        // Weaken synapses to inactive cells
        synapse.permanence -= this.config.permanenceDecrement;
        synapse.permanence = Math.max(0.0, synapse.permanence);
      }
    }
    
    // Remove synapses below threshold
    segment.synapses = segment.synapses.filter(
      synapse => synapse.permanence >= this.config.permanenceThreshold
    );
  }

  /**
   * Adapt segments based on predicted state
   */
  private adaptSegments(): void {
    // Punish segments that predicted incorrectly
    for (const segmentId of this.currentState.activeSegments) {
      const { cellId } = this.parseSegmentId(segmentId);
      
      if (!this.currentState.activeCells.has(cellId)) {
        // This segment predicted but cell didn't become active
        const { segmentIdx } = this.parseSegmentId(segmentId);
        const segment = this.cells[cellId].segments[segmentIdx];
        
        for (const synapse of segment.synapses) {
          // FIX: Use winner cells for consistency with learning and prediction
          if (this.previousState.winnerCells.has(synapse.presynapticCell)) {
            synapse.permanence -= this.config.predictedSegmentDecrement;
            synapse.permanence = Math.max(0.0, synapse.permanence);
          }
        }
      }
    }
  }

  /**
   * Calculate overlap between segment and active cells with detailed debugging
   */
  private calculateSegmentOverlapDebug(segment: Segment, activeCells: Set<number>, cellId: number, segIdx: number): number {
    let overlap = 0;
    let connectedSynapses = 0;
    let totalSynapses = segment.synapses.length;
    
    for (const synapse of segment.synapses) {
      if (synapse.permanence >= this.config.connectedPermanence) {
        connectedSynapses++;
        if (activeCells.has(synapse.presynapticCell)) {
          overlap++;
        }
      }
    }
    
    // Debug logging for segments with some overlap
    if (overlap > 0 && overlap < 10) { // Only log first few interesting cases
      console.log(`          DEBUG cell=${cellId} seg=${segIdx}: ${totalSynapses} synapses, ${connectedSynapses} connected, ${overlap} active, perm_threshold=${this.config.connectedPermanence}`);
      
      // Sample a few synapses for detailed analysis
      const sampleSynapses = segment.synapses.slice(0, 3);
      for (let i = 0; i < sampleSynapses.length; i++) {
        const syn = sampleSynapses[i];
        const isConnected = syn.permanence >= this.config.connectedPermanence;
        const isActive = activeCells.has(syn.presynapticCell);
        console.log(`            synapse ${i}: presynCell=${syn.presynapticCell}, perm=${syn.permanence.toFixed(3)}, connected=${isConnected}, active=${isActive}`);
      }
    }
    
    return overlap;
  }

  /**
   * Calculate overlap between segment and active cells
   */
  private calculateSegmentOverlap(segment: Segment, activeCells: Set<number>): number {
    let overlap = 0;
    let connectedSynapses = 0;
    
    for (const synapse of segment.synapses) {
      if (synapse.permanence >= this.config.connectedPermanence) {
        connectedSynapses++;
        if (activeCells.has(synapse.presynapticCell)) {
          overlap++;
        }
      }
    }
    
    // Debug logging for very verbose debugging
    if (this.iteration % 100 === 0 && segment.synapses.length > 0 && Math.random() < 0.01) {
      //console.log(`      [DEBUG] Segment overlap calc: ${segment.synapses.length} synapses, ${connectedSynapses} connected, ${overlap} overlap with ${activeCells.size} active cells`);
    }
    
    return overlap;
  }

  /**
   * Check if cell has a learning segment
   */
  private cellHasLearningSegment(cellId: number): boolean {
    const cell = this.cells[cellId];
    
    for (let segmentIdx = 0; segmentIdx < cell.segments.length; segmentIdx++) {
      const segmentId = this.getSegmentId(cellId, segmentIdx);
      if (this.currentState.learningSegments.has(segmentId)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Destroy the least recently used segment
   */
  private destroyLeastRecentlyUsedSegment(cell: Cell): void {
    let oldestIdx = 0;
    let oldestIteration = cell.segments[0].lastUsedIteration;
    
    for (let i = 1; i < cell.segments.length; i++) {
      if (cell.segments[i].lastUsedIteration < oldestIteration) {
        oldestIteration = cell.segments[i].lastUsedIteration;
        oldestIdx = i;
      }
    }
    
    cell.segments.splice(oldestIdx, 1);
  }

  /**
   * Get cells belonging to a column
   */
  private getColumnCells(columnIndex: number): number[] {
    const cells: number[] = [];
    const startCellId = columnIndex * this.config.cellsPerColumn;
    
    for (let i = 0; i < this.config.cellsPerColumn; i++) {
      cells.push(startCellId + i);
    }
    
    return cells;
  }

  /**
   * Generate unique segment ID
   */
  private getSegmentId(cellId: number, segmentIdx: number): number {
    return cellId * 1000 + segmentIdx; // Simple encoding
  }

  /**
   * Parse segment ID back to cell and segment index
   */
  private parseSegmentId(segmentId: number): { cellId: number; segmentIdx: number } {
    const cellId = Math.floor(segmentId / 1000);
    const segmentIdx = segmentId % 1000;
    return { cellId, segmentIdx };
  }

  /**
   * Sample random elements from array
   */
  private sampleArray<T>(array: T[], sampleSize: number): T[] {
    const shuffled = [...array];
    
    // DEBUG: Log the input and shuffled arrays
    if (this.iteration < 20 && array.length > 0 && array.length <= 50) {
      console.log(`        [DEBUG sampleArray] Input array (first 5): [${array.slice(0, 5).join(', ')}]`);
      console.log(`        [DEBUG sampleArray] Array length: ${array.length}, sampleSize: ${sampleSize}`);
    }
    
    // Fisher-Yates shuffle using seeded RNG
    for (let i = shuffled.length - 1; i > 0; i--) {
      const rngValue = this.rng();
      const j = Math.floor(rngValue * (i + 1));
      
      // DEBUG: Log first few swaps
      if (this.iteration < 20 && array.length > 0 && array.length <= 50 && i >= shuffled.length - 3) {
        console.log(`        [DEBUG sampleArray] i=${i}, rng=${rngValue.toFixed(4)}, j=${j}, swapping ${shuffled[i]} <-> ${shuffled[j]}`);
      }
      
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const result = shuffled.slice(0, sampleSize);
    
    // DEBUG: Log the result
    if (this.iteration < 20 && array.length > 0 && array.length <= 50) {
      console.log(`        [DEBUG sampleArray] After shuffle (first 10): [${shuffled.slice(0, 10).join(', ')}]`);
      console.log(`        [DEBUG sampleArray] Result (first 5): [${result.slice(0, 5).join(', ')}]`);
    }
    
    return result;
  }

  /**
   * Deep copy state object
   */
  private deepCopyState(state: TemporalState): TemporalState {
    // DEBUG: Validate cell IDs before copying
    const maxValidCellId = this.numCells - 1;
    const invalidWinnerCells = Array.from(state.winnerCells).filter(cellId => cellId > maxValidCellId || cellId < 0);
    if (invalidWinnerCells.length > 0) {
      console.error(`      [ERROR] Invalid cell IDs found in state.winnerCells during copy!`);
      console.error(`      [ERROR] Invalid cells: [${invalidWinnerCells.join(', ')}]`);
      console.error(`      [ERROR] Max valid cell ID: ${maxValidCellId}`);
    }
    
    return {
      activeCells: new Set(state.activeCells),
      winnerCells: new Set(state.winnerCells),
      predictiveCells: new Set(state.predictiveCells),
      activeSegments: new Set(state.activeSegments),
      learningSegments: new Set(state.learningSegments),
      matchingSegments: new Set(state.matchingSegments)
    };
  }

  /**
   * Track prediction accuracy for metrics
   */
  private trackPredictionAccuracy(activeColumns: boolean[]): void {
    let correctPredictions = 0;
    let totalPredictions = 0;
    
    for (let columnIndex = 0; columnIndex < this.numColumns; columnIndex++) {
      const columnCells = this.getColumnCells(columnIndex);
      const wasPredicted = columnCells.some(cellId => 
        this.previousState.predictiveCells.has(cellId)
      );
      
      if (wasPredicted) {
        totalPredictions++;
        if (activeColumns[columnIndex]) {
          correctPredictions++;
        }
      }
    }
    
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    this.predictionAccuracy.push(accuracy);
    
    // Keep only recent accuracy measurements
    if (this.predictionAccuracy.length > 1000) {
      this.predictionAccuracy = this.predictionAccuracy.slice(-1000);
    }
  }

  /**
   * Generate predictions for next timestep
   * This method calculates what patterns will be active in the NEXT timestep
   * based on the current state
   */
  public getPredictions(): {
    predictedColumns: boolean[];
    confidence: number[];
    cellLevelPredictions: Map<number, number>;
  } {
    const predictedColumns = new Array(this.numColumns).fill(false);
    const confidence = new Array(this.numColumns).fill(0);
    const cellLevelPredictions = new Map<number, number>();
    
    // CRITICAL FIX: Calculate predictions for NEXT timestep based on CURRENT winner cells
    // When pattern A is active (current winner cells), predict pattern B (next pattern)
    const predictiveCellsForNext = new Set<number>();
    
    // Calculate which cells should be predictive for the next timestep
    for (let cellId = 0; cellId < this.numCells; cellId++) {
      const cell = this.cells[cellId];
      
      for (const segment of cell.segments) {
        // Use CURRENT winner cells to predict next pattern
        const overlap = this.calculateSegmentOverlap(segment, this.currentState.winnerCells);
        
        if (overlap >= this.config.activationThreshold) {
          predictiveCellsForNext.add(cellId);
          
          // Calculate confidence based on segment strength
          const segmentConfidence = Math.min(1.0, overlap / this.config.activationThreshold);
          cellLevelPredictions.set(cellId, segmentConfidence);
          
          const columnIndex = Math.floor(cellId / this.config.cellsPerColumn);
          predictedColumns[columnIndex] = true;
          confidence[columnIndex] = Math.max(confidence[columnIndex], segmentConfidence);
        }
      }
    }
    
    return {
      predictedColumns,
      confidence,
      cellLevelPredictions
    };
  }

  /**
   * Get predictions for the next timestep as a set of cell IDs
   * This is the key method for sequence completion testing
   */
  public getNextTimestepPredictions(): Set<number> {
    console.log(`        DEBUG: getNextTimestepPredictions() called at iteration ${this.iteration}`);
    
    const predictiveCells = new Set<number>();
    
    // DEBUG: Track statistics for debugging
    let totalCells = 0;
    let cellsWithSegments = 0;
    let totalSegments = 0;
    let segmentsChecked = 0;
    let segmentsWithOverlap = 0;
    let maxOverlapSeen = 0;
    let segmentsAtThreshold = 0;
    
    // DEBUG: Log current winner cells and state
    console.log(`        DEBUG getNextTimestepPredictions: ${this.currentState.winnerCells.size} current winner cells, iteration=${this.iteration}, threshold=${this.config.activationThreshold}`);
    if (this.currentState.winnerCells.size > 0) {
      const winnerCellsArray = Array.from(this.currentState.winnerCells);
      const sampleWinners = winnerCellsArray.slice(0, Math.min(5, winnerCellsArray.length));
      console.log(`        DEBUG winner cells sample: [${sampleWinners.join(', ')}]`);
    } else {
      console.log(`        WARNING: No winner cells available for prediction!`);
    }
    
    // Calculate predictions based on current winner cells
    for (let cellId = 0; cellId < this.numCells; cellId++) {
      const cell = this.cells[cellId];
      totalCells++;
      
      if (cell.segments.length > 0) {
        cellsWithSegments++;
        totalSegments += cell.segments.length;
      }
      
      for (let segIdx = 0; segIdx < cell.segments.length; segIdx++) {
        const segment = cell.segments[segIdx];
        segmentsChecked++;
        
        // Use debug overlap calculation for detailed logging
        const overlap = segmentsWithOverlap < 5 ? 
          this.calculateSegmentOverlapDebug(segment, this.currentState.winnerCells, cellId, segIdx) :
          this.calculateSegmentOverlap(segment, this.currentState.winnerCells);
        
        maxOverlapSeen = Math.max(maxOverlapSeen, overlap);
        
        if (overlap > 0) {
          segmentsWithOverlap++;
          
          // DEBUG: Log first few segments with overlap
          if (segmentsWithOverlap <= 5) {
            console.log(`        DEBUG segment cell=${cellId} seg=${segIdx}: overlap=${overlap}, synapses=${segment.synapses.length}, threshold=${this.config.activationThreshold}`);
            
            // Check connected synapses
            let connectedSynapses = 0;
            let activeSynapses = 0;
            for (const synapse of segment.synapses) {
              if (synapse.permanence >= this.config.connectedPermanence) {
                connectedSynapses++;
                if (this.currentState.winnerCells.has(synapse.presynapticCell)) {
                  activeSynapses++;
                }
              }
            }
            console.log(`          Connected synapses: ${connectedSynapses}, Active connected: ${activeSynapses}`);
          }
        }
        
        if (overlap >= this.config.activationThreshold) {
          predictiveCells.add(cellId);
          segmentsAtThreshold++;
          break; // Only need to add cell once
        }
      }
    }
    
    // DEBUG: Summary statistics
    console.log(`        DEBUG Summary: ${totalCells} cells, ${cellsWithSegments} with segments, ${totalSegments} total segments`);
    console.log(`        DEBUG Checked ${segmentsChecked} segments, ${segmentsWithOverlap} with overlap > 0, max overlap = ${maxOverlapSeen}`);
    console.log(`        DEBUG ${segmentsAtThreshold} segments at threshold, ${predictiveCells.size} predictive cells`);
    
    return predictiveCells;
  }

  /**
   * Get current learning metrics
   */
  public getLearningMetrics(): {
    predictionAccuracy: number;
    burstingRate: number;
    totalSegments: number;
    avgSynapsesPerSegment: number;
    entropy: number;
  } {
    const recentAccuracy = this.predictionAccuracy.slice(-100);
    const avgAccuracy = recentAccuracy.length > 0 ? 
      recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length : 0;
    
    const recentBursting = this.burstingColumns.slice(-100);
    const avgBursting = recentBursting.length > 0 ?
      recentBursting.reduce((a, b) => a + b, 0) / recentBursting.length : 0;
    const burstingRate = avgBursting / this.numColumns;
    
    let totalSegments = 0;
    let totalSynapses = 0;
    
    for (const cell of this.cells) {
      totalSegments += cell.segments.length;
      for (const segment of cell.segments) {
        totalSynapses += segment.synapses.length;
      }
    }
    
    const avgSynapsesPerSegment = totalSegments > 0 ? totalSynapses / totalSegments : 0;
    
    // Calculate entropy of active cells (measure of representation diversity)
    const activeCellCount = this.currentState.activeCells.size;
    const entropy = activeCellCount > 0 ? 
      Math.log2(activeCellCount / this.numCells) + Math.log2(this.numCells) : 0;
    
    return {
      predictionAccuracy: avgAccuracy,
      burstingRate,
      totalSegments,
      avgSynapsesPerSegment,
      entropy
    };
  }

  /**
   * Reset temporal memory state
   */
  public reset(): void {
    this.resetState();
    this.iteration = 0;
    this.predictionAccuracy = [];
    this.burstingColumns = [];
    
    // Clear all segments
    for (const cell of this.cells) {
      cell.segments = [];
    }
  }

  /**
   * Get current temporal state
   */
  public getCurrentState(): TemporalState {
    return this.deepCopyState(this.currentState);
  }
}

/**
 * Create a default temporal pooler configuration
 */
export function createDefaultTemporalPoolerConfig(
  overrides: Partial<TemporalPoolerConfig> = {}
): TemporalPoolerConfig {
  return {
    cellsPerColumn: 32,
    activationThreshold: 13,
    learningThreshold: 10,
    maxSegmentsPerCell: 255,
    maxSynapsesPerSegment: 255,
    initialPermanence: 0.21,
    connectedPermanence: 0.50,
    permanenceIncrement: 0.10,
    permanenceDecrement: 0.10,
    predictedSegmentDecrement: 0.002,
    minThreshold: 8,
    sampleSize: 20,
    permanenceThreshold: 0.1,
    maxNewSynapseCount: 20,
    ...overrides
  };
}
