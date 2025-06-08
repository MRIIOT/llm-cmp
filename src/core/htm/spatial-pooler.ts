/**
 * HTM Spatial Pooler Implementation
 * 
 * The spatial pooler is responsible for creating sparse distributed representations
 * of input patterns. It learns which combinations of input bits should activate
 * which columns in the HTM region.
 * 
 * Based on Thousand Brains Theory and HTM principles from Numenta research.
 */

export interface SpatialPoolerConfig {
  // Column dimensions
  numColumns: number;
  columnDimensions: number[];
  
  // Input dimensions
  inputDimensions: number[];
  inputSize?: number; // For backward compatibility
  potentialRadius: number;
  potentialPct: number;
  
  // Learning parameters
  globalInhibition: boolean;
  localAreaDensity: number;
  numActiveColumnsPerInhArea: number;
  stimulusThreshold: number;
  synPermInactiveDec: number;
  synPermActiveInc: number;
  synPermConnected: number;
  
  // Boosting parameters
  minPctOverlapDutyCycle: number;
  dutyCyclePeriod: number;
  boostStrength: number;
  
  // Sparse representation parameters
  sparsity: number; // Target sparsity (e.g., 0.02 for 2% activation)
  
  // Random seed for reproducibility
  seed?: number;
  
  // Verbosity for debugging (optional)
  spVerbosity?: number;
}

export interface SynapseConnection {
  inputIndex: number;
  permanence: number;
  connected: boolean;
}

export interface ColumnState {
  id: number;
  overlaps: number;
  boost: number;
  activeDutyCycle: number;
  overlapDutyCycle: number;
  potentialSynapses: SynapseConnection[];
  connectedSynapses: number[];
}

export class SpatialPooler {
  private config: SpatialPoolerConfig;
  private columns!: ColumnState[];
  private inhibitionRadius: number;
  private updatePeriod: number;
  private iterationNum: number;
  private minOverlapDutyCycles: number[];
  private rng: () => number; // Seeded random number generator

  constructor(config: SpatialPoolerConfig) {
    this.config = { ...config };
    this.iterationNum = 0;
    this.updatePeriod = 50;
    this.inhibitionRadius = 0;
    this.minOverlapDutyCycles = [];
    
    // Initialize seeded random number generator
    this.rng = this.createSeededRandom(config.seed || Date.now());
    
    this.initializeColumns();
    this.updateInhibitionRadius();
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 2147483648;
      return state / 2147483648;
    };
  }

  /**
   * Initialize all columns with random potential synapses
   */
  private initializeColumns(): void {
    this.columns = [];
    const numInputs = this.config.inputDimensions.reduce((a, b) => a * b, 1);
    
    // DEBUG: Log initialization parameters
    //console.log(`[DEBUG SP] Initializing ${this.config.numColumns} columns with ${numInputs} inputs`);
    //console.log(`[DEBUG SP] Potential radius: ${this.config.potentialRadius}, potential pct: ${this.config.potentialPct}`);
    
    // DEBUG: Track which columns get connections to which input ranges
    const columnInputRanges = new Map<string, number>();
    
    for (let c = 0; c < this.config.numColumns; c++) {
      const column: ColumnState = {
        id: c,
        overlaps: 0,
        boost: 1.0,
        activeDutyCycle: 0.0,
        overlapDutyCycle: 0.0,
        potentialSynapses: [],
        connectedSynapses: []
      };

      // Create potential synapses for this column
      const numPotentialSynapses = Math.floor(numInputs * this.config.potentialPct);
      const potentialInputs = this.sampleInputs(numInputs, numPotentialSynapses);
      
      // DEBUG: Track input range for first few columns and some spread out columns
      if (c < 5 || c === 255 || c === 256 || c === 512 || c === 1024 || c === 2047) {
        const minInput = Math.min(...potentialInputs);
        const maxInput = Math.max(...potentialInputs);
        //console.log(`[DEBUG SP] Column ${c}: connected to inputs ${minInput}-${maxInput} (${potentialInputs.length} synapses)`);
      }
      
      for (const inputIndex of potentialInputs) {
        const permanence = this.initPermanence();
        const synapse: SynapseConnection = {
          inputIndex,
          permanence,
          connected: permanence >= this.config.synPermConnected
        };
        column.potentialSynapses.push(synapse);
        
        if (synapse.connected) {
          column.connectedSynapses.push(inputIndex);
        }
      }

      this.columns.push(column);
    }
    
    //console.log(`[DEBUG SP] Column initialization complete`);
  }

  /**
   * Sample random input indices for potential synapses
   */
  private sampleInputs(numInputs: number, numSamples: number): number[] {
    const indices = Array.from({ length: numInputs }, (_, i) => i);
    const sampled = [];
    
    for (let i = 0; i < numSamples && indices.length > 0; i++) {
      const randomIndex = Math.floor(this.rng() * indices.length);
      sampled.push(indices.splice(randomIndex, 1)[0]);
    }
    
    return sampled;
  }

  /**
   * Initialize synapse permanence with random value
   */
  private initPermanence(): number {
    // Initialize around the connection threshold with some variation
    const baseValue = this.config.synPermConnected;
    const variation = 0.1;
    return baseValue + (this.rng() - 0.5) * variation * 2;
  }

  /**
   * Main spatial pooling computation
   * Converts input to sparse distributed representation
   */
  public compute(inputVector: boolean[], learn: boolean = true): boolean[] {
    if (inputVector.length !== this.config.inputDimensions.reduce((a, b) => a * b, 1)) {
      throw new Error(`Input vector length ${inputVector.length} doesn't match expected ${this.config.inputDimensions.reduce((a, b) => a * b, 1)}`);
    }

    // Phase 1: Calculate overlap scores for all columns
    this.calculateOverlaps(inputVector);

    // Phase 2: Apply inhibition to select winning columns
    const activeColumns = this.inhibitColumns();

    // Phase 3: Learning - adapt synapses based on activity
    if (learn) {
      this.adaptSynapses(inputVector, activeColumns);
      this.updateDutyCycles(activeColumns);
      this.bumpUpWeakColumns();
      this.updateBoostFactors();
    }

    this.iterationNum++;

    // Convert active columns to output bit vector
    return this.createOutputVector(activeColumns);
  }

  /**
   * Calculate overlap scores between input and each column's connected synapses
   */
  private calculateOverlaps(inputVector: boolean[]): void {
    // Safety check
    if (!this.columns || this.columns.length === 0) {
      console.error('SpatialPooler: columns array not initialized in calculateOverlaps!');
      return;
    }

    // DEBUG: Check input pattern characteristics
    if (this.iterationNum < 5 || this.iterationNum % 100 === 0) {
      const activeInputs = inputVector.filter(x => x).length;
      const firstActiveInput = inputVector.findIndex(x => x);
      const lastActiveInput = inputVector.lastIndexOf(true);
      //console.log(`[DEBUG SP] Input pattern: ${activeInputs} active bits, range ${firstActiveInput}-${lastActiveInput}`);
    }
    
    // DEBUG: Track overlap distribution
    let columnsWithNonZeroOverlap = 0;
    let maxOverlapColumn = -1;
    let maxOverlap = 0;
    
    for (const column of this.columns) {
      if (!column) {
        console.error('SpatialPooler: undefined column found in columns array!');
        continue;
      }

      let overlap = 0;
      
      // Count how many connected synapses have active inputs
      for (const inputIndex of column.connectedSynapses) {
        if (inputVector[inputIndex]) {
          overlap++;
        }
      }

      // Apply stimulus threshold and boost factor
      if (overlap < this.config.stimulusThreshold) {
        overlap = 0;
      } else {
        overlap = Math.floor(overlap * column.boost);
      }

      column.overlaps = overlap;
      
      // DEBUG: Track statistics
      if (overlap > 0) {
        columnsWithNonZeroOverlap++;
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          maxOverlapColumn = column.id;
        }
      }
    }
    
    // DEBUG: Log overlap statistics
    if (this.iterationNum < 5 || this.iterationNum % 100 === 0) {
      //console.log(`[DEBUG SP] Columns with non-zero overlap: ${columnsWithNonZeroOverlap}/${this.config.numColumns}`);
      //console.log(`[DEBUG SP] Max overlap: ${maxOverlap} at column ${maxOverlapColumn}`);
      
      // Check specific columns - add safety checks
      const checkColumns = [0, 255, 256, 512, 1024, 2047];
      const validCheckColumns = checkColumns.filter(c => c < this.columns.length && this.columns[c]);
      const overlapsAtColumns = validCheckColumns.map(c => `${c}:${this.columns[c].overlaps}`).join(', ');
      //console.log(`[DEBUG SP] Overlaps at columns [${overlapsAtColumns}]`);
    }
  }

  /**
   * Apply inhibition to select sparse set of winning columns
   */
  private inhibitColumns(): number[] {
    const activeColumns: number[] = [];

    if (!this.columns || this.columns.length === 0) {
      console.error('SpatialPooler: columns array not initialized!');
      return activeColumns;
    }

    if (this.config.globalInhibition) {
      // Global inhibition: select top k columns globally
      const numActive = Math.floor(this.config.numColumns * this.config.sparsity);
      
      // DEBUG: Log overlap distribution
      if (this.iterationNum < 5 || this.iterationNum % 100 === 0) {
        const columnsWithOverlap = this.columns.filter(col => col && col.overlaps > 0).length;
        const maxColumnWithOverlap = Math.max(...this.columns.map((col, idx) => (col && col.overlaps > 0) ? idx : -1));
        //console.log(`[DEBUG SP] Iteration ${this.iterationNum}: ${columnsWithOverlap} columns have overlap, max column index with overlap: ${maxColumnWithOverlap}`);
        
        // Check overlap distribution across column ranges
        const ranges = [
          { name: "0-255", start: 0, end: 255 },
          { name: "256-511", start: 256, end: 511 },
          { name: "512-1023", start: 512, end: 1023 },
          { name: "1024-2047", start: 1024, end: 2047 }
        ];
        
        for (const range of ranges) {
          const overlapsInRange = this.columns
            .slice(range.start, range.end + 1)
            .filter(col => col && col.overlaps > 0).length;
          if (overlapsInRange > 0) {
            //console.log(`  Range ${range.name}: ${overlapsInRange} columns with overlap`);
          }
        }
      }
      
      const sortedColumns = this.columns
        .map((col, index) => ({ index, overlap: col ? col.overlaps : 0 }))
        .filter(col => col.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, numActive);
      
      const selectedIndices = sortedColumns.map(col => col.index);
      
      // DEBUG: Log selected columns
      if (this.iterationNum < 5 || this.iterationNum % 100 === 0) {
        //console.log(`[DEBUG SP] Selecting ${numActive} columns from ${this.config.numColumns} total (${(this.config.sparsity * 100).toFixed(1)}% sparsity)`);
        //console.log(`[DEBUG SP] Selected columns: [${selectedIndices.slice(0, 10).join(', ')}...] (showing first 10)`);
        const maxSelectedColumn = Math.max(...selectedIndices);
        //console.log(`[DEBUG SP] Max selected column index: ${maxSelectedColumn}`);
      }

      return selectedIndices;
    } else {
      // Local inhibition: compete within neighborhoods
      for (let c = 0; c < this.config.numColumns; c++) {
        if (this.columns[c] && this.columns[c].overlaps > 0) {
          const neighbors = this.getNeighbors(c);
          const kthScore = this.kthScore(neighbors, this.config.numActiveColumnsPerInhArea);
          
          if (this.columns[c].overlaps >= kthScore) {
            activeColumns.push(c);
          }
        }
      }
    }

    return activeColumns;
  }

  /**
   * Get neighboring columns for local inhibition
   */
  private getNeighbors(columnIndex: number): number[] {
    // For simplicity, using circular neighborhood
    const neighbors = [];
    const start = Math.max(0, columnIndex - this.inhibitionRadius);
    const end = Math.min(this.config.numColumns - 1, columnIndex + this.inhibitionRadius);
    
    for (let i = start; i <= end; i++) {
      if (i !== columnIndex) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  /**
   * Find the kth highest score among neighbors
   */
  private kthScore(neighborIndices: number[], k: number): number {
    const scores = neighborIndices
      .map(index => (this.columns[index] ? this.columns[index].overlaps : 0))
      .sort((a, b) => b - a);
    
    return scores[Math.min(k - 1, scores.length - 1)] || 0;
  }

  /**
   * Adapt synapse permanences based on activity
   */
  private adaptSynapses(inputVector: boolean[], activeColumns: number[]): void {
    const activeSet = new Set(activeColumns);

    for (const column of this.columns) {
      if (activeSet.has(column.id)) {
        // For active columns, strengthen synapses to active inputs
        // and weaken synapses to inactive inputs
        for (const synapse of column.potentialSynapses) {
          if (inputVector[synapse.inputIndex]) {
            synapse.permanence += this.config.synPermActiveInc;
          } else {
            synapse.permanence -= this.config.synPermInactiveDec;
          }

          // Clip permanence values
          synapse.permanence = Math.max(0, Math.min(1, synapse.permanence));
          
          // Update connection status
          const wasConnected = synapse.connected;
          synapse.connected = synapse.permanence >= this.config.synPermConnected;
          
          // Update connected synapses list
          if (!wasConnected && synapse.connected) {
            column.connectedSynapses.push(synapse.inputIndex);
          } else if (wasConnected && !synapse.connected) {
            const index = column.connectedSynapses.indexOf(synapse.inputIndex);
            if (index > -1) {
              column.connectedSynapses.splice(index, 1);
            }
          }
        }
      }
    }
  }

  /**
   * Update duty cycles for columns
   */
  private updateDutyCycles(activeColumns: number[]): void {
    const activeSet = new Set(activeColumns);
    
    for (const column of this.columns) {
      const isActive = activeSet.has(column.id);
      const hasOverlap = column.overlaps > 0;
      
      // Update moving averages
      column.activeDutyCycle = this.updateMovingAverage(
        column.activeDutyCycle, 
        isActive ? 1 : 0
      );
      
      column.overlapDutyCycle = this.updateMovingAverage(
        column.overlapDutyCycle,
        hasOverlap ? 1 : 0
      );
    }

    // Update minimum duty cycles
    this.updateMinDutyCycles();
  }

  /**
   * Update exponential moving average
   */
  private updateMovingAverage(current: number, newValue: number): number {
    const period = this.config.dutyCyclePeriod;
    return ((period - 1) * current + newValue) / period;
  }

  /**
   * Update minimum duty cycles based on neighbors
   */
  private updateMinDutyCycles(): void {
    this.minOverlapDutyCycles = new Array(this.config.numColumns).fill(0);
    
    for (let c = 0; c < this.config.numColumns; c++) {
      const neighbors = this.getNeighbors(c);
      const dutyCycles = neighbors
        .filter(n => this.columns[n]) // Filter out undefined columns
        .map(n => this.columns[n].overlapDutyCycle);
      
      if (dutyCycles.length > 0) {
        const maxDutyCycle = Math.max(...dutyCycles);
        this.minOverlapDutyCycles[c] = this.config.minPctOverlapDutyCycle * maxDutyCycle;
      } else {
        this.minOverlapDutyCycles[c] = 0;
      }
    }
  }

  /**
   * Boost columns that are performing poorly
   */
  private bumpUpWeakColumns(): void {
    for (let c = 0; c < this.config.numColumns; c++) {
      const column = this.columns[c];
      
      if (column.overlapDutyCycle < this.minOverlapDutyCycles[c]) {
        // Boost weak synapses
        for (const synapse of column.potentialSynapses) {
          synapse.permanence += 0.1 * this.config.synPermConnected;
          synapse.permanence = Math.min(1.0, synapse.permanence);
          
          // Update connection status
          const wasConnected = synapse.connected;
          synapse.connected = synapse.permanence >= this.config.synPermConnected;
          
          if (!wasConnected && synapse.connected) {
            column.connectedSynapses.push(synapse.inputIndex);
          }
        }
      }
    }
  }

  /**
   * Update boost factors based on duty cycles
   */
  private updateBoostFactors(): void {
    for (const column of this.columns) {
      if (column.activeDutyCycle > 0) {
        const targetDensity = this.config.sparsity;
        column.boost = Math.exp((targetDensity - column.activeDutyCycle) * this.config.boostStrength);
      } else {
        column.boost = 1.0;
      }
    }
  }

  /**
   * Update inhibition radius based on average receptive field size
   */
  private updateInhibitionRadius(): void {
    const avgConnectedSpan = this.averageReceptiveFieldSize();
    this.inhibitionRadius = Math.max(1, Math.floor(avgConnectedSpan / 2));
  }

  /**
   * Calculate average receptive field size across all columns
   */
  private averageReceptiveFieldSize(): number {
    let totalSpan = 0;
    let numColumns = 0;

    for (const column of this.columns) {
      if (column.connectedSynapses.length > 0) {
        const minIndex = Math.min(...column.connectedSynapses);
        const maxIndex = Math.max(...column.connectedSynapses);
        totalSpan += (maxIndex - minIndex + 1);
        numColumns++;
      }
    }

    return numColumns > 0 ? totalSpan / numColumns : 1;
  }

  /**
   * Create output bit vector from active columns
   */
  private createOutputVector(activeColumns: number[]): boolean[] {
    const output = new Array(this.config.numColumns).fill(false);
    for (const columnIndex of activeColumns) {
      output[columnIndex] = true;
    }
    return output;
  }

  /**
   * Get current sparsity level
   */
  public getCurrentSparsity(): number {
    const numActive = this.columns.filter(col => col.overlaps > 0).length;
    return numActive / this.config.numColumns;
  }

  /**
   * Get stability metrics for the spatial pooler
   */
  public getStabilityMetrics(): {
    avgActiveDutyCycle: number;
    avgOverlapDutyCycle: number;
    avgBoost: number;
    stabilityScore: number;
  } {
    const totalActive = this.columns.reduce((sum, col) => sum + col.activeDutyCycle, 0);
    const totalOverlap = this.columns.reduce((sum, col) => sum + col.overlapDutyCycle, 0);
    const totalBoost = this.columns.reduce((sum, col) => sum + col.boost, 0);
    
    const avgActiveDutyCycle = totalActive / this.config.numColumns;
    const avgOverlapDutyCycle = totalOverlap / this.config.numColumns;
    const avgBoost = totalBoost / this.config.numColumns;
    
    // Stability score based on how close duty cycles are to target
    const targetDuty = this.config.sparsity;
    const variance = this.columns.reduce((sum, col) => 
      sum + Math.pow(col.activeDutyCycle - targetDuty, 2), 0) / this.config.numColumns;
    const stabilityScore = Math.exp(-variance * 100); // Higher score = more stable

    return {
      avgActiveDutyCycle,
      avgOverlapDutyCycle,
      avgBoost,
      stabilityScore
    };
  }

  /**
   * Reset the spatial pooler state
   */
  public reset(): void {
    this.iterationNum = 0;
    for (const column of this.columns) {
      column.activeDutyCycle = 0;
      column.overlapDutyCycle = 0;
      column.boost = 1.0;
    }
  }
}

/**
 * Create default spatial pooler configuration
 */
export function createDefaultSpatialPoolerConfig(
  inputSize: number,
  columnCount: number = Math.floor(inputSize * 0.5)
): SpatialPoolerConfig {
  return {
    numColumns: columnCount,
    columnDimensions: [columnCount],
    inputDimensions: [inputSize],
    potentialRadius: Math.floor(inputSize * 0.5),
    potentialPct: 0.8,
    globalInhibition: true,
    localAreaDensity: -1,
    numActiveColumnsPerInhArea: Math.floor(columnCount * 0.02),
    stimulusThreshold: 0,
    synPermInactiveDec: 0.005, // REDUCED: Slower weakening for stability (was 0.008)
    synPermActiveInc: 0.08,    // INCREASED: Faster strengthening (was 0.05)
    synPermConnected: 0.10,
    minPctOverlapDutyCycle: 0.001,
    dutyCyclePeriod: 1000,
    boostStrength: 2.0,        // INCREASED: More aggressive boosting (was 0.0)
    sparsity: 0.08            // INCREASED: More columns active (was 0.02)
  };
}
