/**
 * Hierarchical Hash Encoder
 * 
 * Implements multi-level encoding to create natural overlap between related concepts:
 * - Level 1 (columns 0-511): Character bigram hashing - captures structural similarity
 * - Level 2 (columns 512-1279): Full concept hashing - unique concept identity
 * - Level 3 (columns 1280-2047): Character frequency signature - statistical patterns
 */

import { createHash } from 'crypto';

export interface HierarchicalEncodingConfig {
  // Column ranges for each level
  bigramColumns: { start: number; end: number };      // Default: 0-511
  conceptColumns: { start: number; end: number };     // Default: 512-1279
  frequencyColumns: { start: number; end: number };   // Default: 1280-2047
  
  // Number of active columns per level
  bigramActivations: number;     // Default: 20
  conceptActivations: number;    // Default: 40
  frequencyActivations: number;  // Default: 15
}

export const DEFAULT_HIERARCHICAL_CONFIG: HierarchicalEncodingConfig = {
  bigramColumns: { start: 0, end: 511 },
  conceptColumns: { start: 512, end: 1279 },
  frequencyColumns: { start: 1280, end: 2047 },
  bigramActivations: 20,
  conceptActivations: 40,
  frequencyActivations: 15
};

export class HierarchicalHashEncoder {
  private config: HierarchicalEncodingConfig;

  constructor(config: Partial<HierarchicalEncodingConfig> = {}) {
    this.config = { ...DEFAULT_HIERARCHICAL_CONFIG, ...config };
  }

  /**
   * Extract character bigrams from text
   * e.g., "market" -> ["ma", "ar", "rk", "ke", "et"]
   */
  getBigrams(text: string): string[] {
    const normalized = text.toLowerCase().trim();
    const bigrams: string[] = [];
    
    // Add start and end markers for better edge detection
    const marked = `^${normalized}$`;
    
    for (let i = 0; i < marked.length - 1; i++) {
      bigrams.push(marked.slice(i, i + 2));
    }
    
    return bigrams;
  }

  /**
   * Create character frequency signature
   * Captures statistical patterns in the text
   */
  getCharFrequency(text: string): string {
    const normalized = text.toLowerCase();
    const frequency: Record<string, number> = {};
    
    // Count character frequencies
    for (const char of normalized) {
      if (/[a-z0-9]/.test(char)) {
        frequency[char] = (frequency[char] || 0) + 1;
      }
    }
    
    // Create a stable signature by sorting by frequency then alphabetically
    const sorted = Object.entries(frequency)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]; // Higher frequency first
        return a[0].localeCompare(b[0]); // Then alphabetically
      })
      .map(([char, count]) => `${char}${count}`)
      .join('');
    
    return sorted;
  }

  /**
   * Hash a value to column indices within a specific range
   */
  private hashToColumns(
    value: string,
    columnRange: { start: number; end: number },
    numActivations: number
  ): number[] {
    const rangeSize = columnRange.end - columnRange.start + 1;
    const columns: Set<number> = new Set();
    
    // Use multiple hash variations to get distributed columns
    for (let i = 0; columns.size < numActivations && i < numActivations * 2; i++) {
      const hash = createHash('sha256')
        .update(`${value}-${i}`)
        .digest();
      
      // Extract column index from hash
      const hashValue = hash.readUInt32BE(0);
      const column = columnRange.start + (hashValue % rangeSize);
      columns.add(column);
    }
    
    return Array.from(columns).sort((a, b) => a - b);
  }

  /**
   * Main encoding method - creates hierarchical representation
   */
  encodeHierarchical(concept: string): number[] {
    const activeColumns: Set<number> = new Set();
    
    // Level 1: Bigram encoding
    const bigrams = this.getBigrams(concept);
    if (bigrams.length > 0) {
      // Hash each bigram and collect columns
      const bigramColumns: Set<number> = new Set();
      bigrams.forEach(bigram => {
        const cols = this.hashToColumns(
          bigram,
          this.config.bigramColumns,
          Math.ceil(this.config.bigramActivations / bigrams.length)
        );
        cols.forEach(col => bigramColumns.add(col));
      });
      
      // Limit to configured number of activations
      const bigramArray = Array.from(bigramColumns).slice(0, this.config.bigramActivations);
      bigramArray.forEach(col => activeColumns.add(col));
    }
    
    // Level 2: Full concept encoding
    const conceptColumns = this.hashToColumns(
      concept,
      this.config.conceptColumns,
      this.config.conceptActivations
    );
    conceptColumns.forEach(col => activeColumns.add(col));
    
    // Level 3: Character frequency encoding
    const freqSignature = this.getCharFrequency(concept);
    if (freqSignature) {
      const freqColumns = this.hashToColumns(
        freqSignature,
        this.config.frequencyColumns,
        this.config.frequencyActivations
      );
      freqColumns.forEach(col => activeColumns.add(col));
    }
    
    return Array.from(activeColumns).sort((a, b) => a - b);
  }

  /**
   * Calculate overlap between two encoded concepts
   */
  calculateOverlap(columns1: number[], columns2: number[]): {
    overlapCount: number;
    overlapPercentage: number;
    sharedColumns: number[];
  } {
    const set1 = new Set(columns1);
    const set2 = new Set(columns2);
    const sharedColumns: number[] = [];
    
    for (const col of set1) {
      if (set2.has(col)) {
        sharedColumns.push(col);
      }
    }
    
    const totalUnique = new Set([...columns1, ...columns2]).size;
    const overlapPercentage = totalUnique > 0 
      ? (sharedColumns.length / totalUnique) * 100 
      : 0;
    
    return {
      overlapCount: sharedColumns.length,
      overlapPercentage,
      sharedColumns: sharedColumns.sort((a, b) => a - b)
    };
  }

  /**
   * Get configuration
   */
  getConfig(): HierarchicalEncodingConfig {
    return { ...this.config };
  }
}
