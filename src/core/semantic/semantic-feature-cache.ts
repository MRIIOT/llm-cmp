/**
 * Semantic Feature Cache
 * Manages caching of semantic features and stable concept-to-column mappings
 */

import { 
  SemanticFeatures, 
  SemanticCacheEntry, 
  ConceptColumnMapping,
  SemanticEncodingConfig,
  DEFAULT_SEMANTIC_CONFIG 
} from './semantic-types.js';

export class SemanticFeatureCache {
  private cache: Map<string, SemanticCacheEntry>;
  private conceptToColumns: Map<string, ConceptColumnMapping>;
  private readonly config: SemanticEncodingConfig;
  private accessOrder: string[]; // For LRU eviction

  constructor(config: Partial<SemanticEncodingConfig> = {}) {
    this.cache = new Map();
    this.conceptToColumns = new Map();
    this.config = { ...DEFAULT_SEMANTIC_CONFIG, ...config };
    this.accessOrder = [];
  }

  /**
   * Get or extract semantic features with caching
   */
  async getFeatures(
    text: string,
    extractor: () => Promise<SemanticFeatures>
  ): Promise<{ features: SemanticFeatures; fromCache: boolean }> {
    const normalizedText = this.normalizeText(text);
    
    // Check exact match
    const exactMatch = this.cache.get(normalizedText);
    if (exactMatch) {
      this.updateAccessOrder(normalizedText);
      exactMatch.accessCount++;
      return { features: exactMatch.features, fromCache: true };
    }

    // Check for similar queries
    const similarEntry = this.findSimilarEntry(normalizedText);
    if (similarEntry) {
      this.updateAccessOrder(similarEntry.normalizedText);
      similarEntry.accessCount++;
      return { features: similarEntry.features, fromCache: true };
    }

    // Extract new features
    const features = await extractor();
    this.addToCache(text, normalizedText, features);
    
    return { features, fromCache: false };
  }

  /**
   * Get stable column assignments for a concept
   */
  getConceptColumns(concept: string, totalColumns: number): number[] {
    const normalizedConcept = concept.toLowerCase().trim();
    
    let mapping = this.conceptToColumns.get(normalizedConcept);
    if (!mapping) {
      // Generate new column assignment
      const columns = this.generateConceptColumns(normalizedConcept, totalColumns);
      mapping = {
        concept: normalizedConcept,
        columns,
        useCount: 0
      };
      this.conceptToColumns.set(normalizedConcept, mapping);
    }
    
    mapping.useCount++;
    return [...mapping.columns]; // Return copy to prevent modification
  }

  /**
   * Generate consistent column assignments for a concept
   */
  private generateConceptColumns(concept: string, totalColumns: number): number[] {
    const conceptHash = this.stableHash(concept);
    const columns: number[] = [];
    const numColumns = this.config.columnsPerConcept;
    
    // Generate columns distributed across the space
    for (let i = 0; i < numColumns; i++) {
      // Use prime numbers for better distribution
      const column = (conceptHash + i * 97) % totalColumns;
      columns.push(column);
    }
    
    // Ensure uniqueness
    const uniqueColumns = Array.from(new Set(columns));
    
    // If we lost some due to collisions, add more
    let attempt = 0;
    while (uniqueColumns.length < numColumns && attempt < 100) {
      const newColumn = (conceptHash + numColumns + attempt * 53) % totalColumns;
      if (!uniqueColumns.includes(newColumn)) {
        uniqueColumns.push(newColumn);
      }
      attempt++;
    }
    
    return uniqueColumns.slice(0, numColumns);
  }

  /**
   * Stable hash function for concept strings
   */
  private stableHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; // hash * 33 + char
    }
    return Math.abs(hash);
  }

  /**
   * Normalize text for caching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ''); // Remove punctuation
  }

  /**
   * Find similar entry in cache
   */
  private findSimilarEntry(normalizedText: string): SemanticCacheEntry | null {
    let bestMatch: SemanticCacheEntry | null = null;
    let bestSimilarity = 0;

    // Extract content words for better similarity matching
    const contentWords1 = this.extractContentWords(normalizedText);

    for (const entry of this.cache.values()) {
      const contentWords2 = this.extractContentWords(entry.normalizedText);
      const similarity = this.calculateContentSimilarity(contentWords1, contentWords2);
      
      if (similarity > this.config.similarityThreshold && similarity > bestSimilarity) {
        bestMatch = entry;
        bestSimilarity = similarity;
      }
    }

    return bestMatch;
  }

  /**
   * Extract content words (remove stop words)
   */
  private extractContentWords(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'can', 'what', 'how', 'when', 'where', 'who',
      'why', 'their', 'them', 'they', 'then', 'there', 'these', 'those'
    ]);
    
    const words = text.split(' ').filter(word => 
      word.length > 2 && !stopWords.has(word)
    );
    
    return new Set(words);
  }

  /**
   * Calculate similarity between content words
   */
  private calculateContentSimilarity(words1: Set<string>, words2: Set<string>): number {
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    // Use Dice coefficient for better similarity (more forgiving than Jaccard)
    const similarity = (2 * intersection.size) / (words1.size + words2.size);
    
    return similarity;
  }

  /**
   * Calculate similarity between two texts (Jaccard similarity)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = intersection.size / union.size;
    
    // Debug logging for testing
    if (text1.includes('quantum') && text2.includes('quantum')) {
      console.log(`  Cache similarity check:`);
      console.log(`    Text 1: "${text1.substring(0, 50)}..."`);
      console.log(`    Text 2: "${text2.substring(0, 50)}..."`);
      console.log(`    Common words: ${Array.from(intersection).join(', ')}`);
      console.log(`    Similarity: ${similarity.toFixed(2)} (threshold: ${this.config.similarityThreshold})`);
    }
    
    return similarity;
  }

  /**
   * Add entry to cache with LRU eviction
   */
  private addToCache(text: string, normalizedText: string, features: SemanticFeatures): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxCacheSize) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.accessOrder.shift();
    }

    const entry: SemanticCacheEntry = {
      text,
      normalizedText,
      features,
      timestamp: Date.now(),
      accessCount: 1
    };

    this.cache.set(normalizedText, entry);
    this.updateAccessOrder(normalizedText);
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    conceptMappings: number;
    hitRate: number;
    avgAccessCount: number;
  } {
    let totalAccess = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      if (entry.accessCount > 1) {
        totalHits += entry.accessCount - 1;
      }
    }

    return {
      cacheSize: this.cache.size,
      conceptMappings: this.conceptToColumns.size,
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
      avgAccessCount: this.cache.size > 0 ? totalAccess / this.cache.size : 0
    };
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    // Keep concept mappings for consistency
  }

  /**
   * Clear everything including concept mappings
   */
  clearAll(): void {
    this.cache.clear();
    this.conceptToColumns.clear();
    this.accessOrder = [];
  }

  /**
   * Export concept mappings for persistence
   */
  exportConceptMappings(): ConceptColumnMapping[] {
    return Array.from(this.conceptToColumns.values());
  }

  /**
   * Import concept mappings
   */
  importConceptMappings(mappings: ConceptColumnMapping[]): void {
    this.conceptToColumns.clear();
    for (const mapping of mappings) {
      this.conceptToColumns.set(mapping.concept, mapping);
    }
  }
}
