/**
 * Semantic Encoder
 * Converts semantic features to Sparse Distributed Representations (SDRs)
 */

import { LLMRequest, LLMResponse } from '../../types/index.js';
import {
  SemanticFeatures,
  SemanticEncodingConfig,
  SemanticEncodingResult,
  SemanticEncodingError,
  SemanticEncodingException,
  DEFAULT_SEMANTIC_CONFIG,
  ATTRIBUTE_OFFSETS,
  INTENT_OFFSETS
} from './semantic-types.js';
import { SemanticFeatureExtractor } from './semantic-feature-extractor.js';
import { SemanticFeatureCache } from './semantic-feature-cache.js';

export class SemanticEncoder {
  private readonly config: SemanticEncodingConfig;
  private readonly featureExtractor: SemanticFeatureExtractor;
  private readonly featureCache: SemanticFeatureCache;
  private readonly llmInterface: (request: LLMRequest) => Promise<LLMResponse>;

  constructor(
    llmInterface: (request: LLMRequest) => Promise<LLMResponse>,
    config: Partial<SemanticEncodingConfig> = {}
  ) {
    this.config = { ...DEFAULT_SEMANTIC_CONFIG, ...config };
    this.llmInterface = llmInterface;
    this.featureExtractor = new SemanticFeatureExtractor(
      llmInterface,
      this.config.llmTemperature,
      this.config.llmMaxTokens
    );
    this.featureCache = new SemanticFeatureCache(this.config);
  }

  /**
   * Encode text to SDR using semantic features
   */
  async encode(text: string): Promise<SemanticEncodingResult> {
    try {
      // Get features (from cache or extract new)
      const { features, fromCache } = await this.featureCache.getFeatures(
        text,
        () => this.featureExtractor.extractFeatures(text)
      );

      // Convert features to SDR
      const encoding = this.featuresToSDR(features);

      // Calculate statistics
      const activeCount = encoding.filter(bit => bit).length;
      const sparsity = activeCount / encoding.length;

      return {
        encoding,
        features,
        fromCache,
        activeCount,
        sparsity
      };
    } catch (error) {
      if (error instanceof SemanticEncodingException) {
        throw error;
      }
      throw new SemanticEncodingException(
        SemanticEncodingError.ENCODING_FAILED,
        `Failed to encode text: ${error instanceof Error ? error.message : String(error)}`,
        { text, error }
      );
    }
  }

  /**
   * Encode with fallback to hash-based encoding
   */
  async encodeWithFallback(text: string): Promise<boolean[]> {
    try {
      const result = await this.encode(text);
      return result.encoding;
    } catch (error) {
      console.warn('Semantic encoding failed, using hash fallback:', error);
      return this.hashBasedEncoding(text);
    }
  }

  /**
   * Convert semantic features to SDR
   */
  private featuresToSDR(features: SemanticFeatures): boolean[] {
    const encoding = new Array(this.config.numColumns).fill(false);
    const targetActive = Math.floor(this.config.numColumns * this.config.sparsity);
    let activeColumnCount = 0;

    // 1. Encode concepts (40% of active columns)
    const conceptColumns = Math.floor(targetActive * 0.4);
    activeColumnCount += this.encodeConcepts(
      features.concepts,
      encoding,
      conceptColumns,
      activeColumnCount
    );

    // 2. Encode categories (20% of active columns)
    const categoryColumns = Math.floor(targetActive * 0.2);
    activeColumnCount += this.encodeCategories(
      features.categories,
      encoding,
      categoryColumns,
      activeColumnCount
    );

    // 3. Encode attributes (20% of active columns)
    const attributeColumns = Math.floor(targetActive * 0.2);
    activeColumnCount += this.encodeAttributes(
      features.attributes,
      encoding,
      attributeColumns,
      activeColumnCount
    );

    // 4. Encode relationships (10% of active columns)
    const relationColumns = Math.floor(targetActive * 0.1);
    activeColumnCount += this.encodeRelationships(
      features.relationships,
      encoding,
      relationColumns,
      activeColumnCount
    );

    // 5. Encode intent and complexity (10% of active columns)
    const metaColumns = Math.floor(targetActive * 0.1);
    activeColumnCount += this.encodeMetadata(
      features,
      encoding,
      metaColumns,
      activeColumnCount
    );

    return encoding;
  }

  /**
   * Encode concepts with importance weighting
   */
  private encodeConcepts(
    concepts: string[],
    encoding: boolean[],
    maxColumns: number,
    currentActive: number
  ): number {
    let activated = 0;

    concepts.forEach((concept, index) => {
      // Weight by importance (first concepts are more important)
      const weight = 1.0 - (index * 0.1);
      const conceptColumns = this.featureCache.getConceptColumns(
        concept,
        this.config.numColumns
      );
      
      const columnsToActivate = Math.floor(conceptColumns.length * weight);
      
      for (let i = 0; i < columnsToActivate && activated < maxColumns; i++) {
        if (!encoding[conceptColumns[i]]) {
          encoding[conceptColumns[i]] = true;
          activated++;
        }
      }
    });

    return activated;
  }

  /**
   * Encode categories
   */
  private encodeCategories(
    categories: string[],
    encoding: boolean[],
    maxColumns: number,
    currentActive: number
  ): number {
    let activated = 0;

    categories.forEach(category => {
      const categoryColumns = this.featureCache.getConceptColumns(
        `_cat_${category}`,
        this.config.numColumns
      );
      
      const columnsToActivate = Math.min(5, categoryColumns.length);
      
      for (let i = 0; i < columnsToActivate && activated < maxColumns; i++) {
        if (!encoding[categoryColumns[i]]) {
          encoding[categoryColumns[i]] = true;
          activated++;
        }
      }
    });

    return activated;
  }

  /**
   * Encode attributes as continuous values
   */
  private encodeAttributes(
    attributes: SemanticFeatures['attributes'],
    encoding: boolean[],
    maxColumns: number,
    currentActive: number
  ): number {
    let activated = 0;
    const attributeBase = 1000; // Start attributes in middle region

    Object.entries(attributes).forEach(([attribute, value]) => {
      const offset = ATTRIBUTE_OFFSETS.get(attribute) || 0;
      const attrStart = attributeBase + offset;
      
      // Number of columns proportional to attribute value
      const numActive = Math.floor(value * 5); // 0-5 columns per attribute
      
      for (let i = 0; i < numActive && activated < maxColumns; i++) {
        const col = (attrStart + i * 3) % this.config.numColumns;
        if (!encoding[col]) {
          encoding[col] = true;
          activated++;
        }
      }
    });

    return activated;
  }

  /**
   * Encode relationships
   */
  private encodeRelationships(
    relationships: string[],
    encoding: boolean[],
    maxColumns: number,
    currentActive: number
  ): number {
    let activated = 0;

    relationships.forEach(rel => {
      const relColumns = this.featureCache.getConceptColumns(
        `_rel_${rel}`,
        this.config.numColumns
      );
      
      if (relColumns.length > 0 && activated < maxColumns) {
        if (!encoding[relColumns[0]]) {
          encoding[relColumns[0]] = true;
          activated++;
        }
      }
    });

    return activated;
  }

  /**
   * Encode intent and complexity metadata
   */
  private encodeMetadata(
    features: SemanticFeatures,
    encoding: boolean[],
    maxColumns: number,
    currentActive: number
  ): number {
    let activated = 0;
    const metaStart = 1500; // Metadata region

    // Encode intent
    const intentOffset = INTENT_OFFSETS.get(features.intent) || 0;
    const intentCol = (metaStart + intentOffset) % this.config.numColumns;
    if (!encoding[intentCol] && activated < maxColumns) {
      encoding[intentCol] = true;
      activated++;
    }

    // Encode complexity
    const complexityColumns = Math.floor(features.complexity * 5);
    for (let i = 0; i < complexityColumns && activated < maxColumns; i++) {
      const col = (metaStart + 20 + i) % this.config.numColumns;
      if (!encoding[col]) {
        encoding[col] = true;
        activated++;
      }
    }

    // Encode temporal aspect
    if (features.temporalAspect && activated < maxColumns) {
      const temporalCol = (metaStart + 30) % this.config.numColumns;
      if (!encoding[temporalCol]) {
        encoding[temporalCol] = true;
        activated++;
      }
    }

    return activated;
  }

  /**
   * Fallback hash-based encoding (original method)
   */
  private hashBasedEncoding(text: string): boolean[] {
    const encoding = new Array(this.config.numColumns).fill(false);
    const hash = this.hashString(text);
    const targetActive = Math.floor(this.config.numColumns * this.config.sparsity);
    
    // Activate sparse bits based on hash
    for (let i = 0; i < targetActive; i++) {
      const index = (hash + i * 37) % encoding.length;
      encoding[index] = true;
    }
    
    return encoding;
  }

  /**
   * Simple hash function
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

  /**
   * Calculate overlap between two encodings
   */
  static calculateOverlap(encoding1: boolean[], encoding2: boolean[]): number {
    if (encoding1.length !== encoding2.length) {
      throw new Error('Encodings must have the same length');
    }

    let overlap = 0;
    let active1 = 0;
    let active2 = 0;

    for (let i = 0; i < encoding1.length; i++) {
      if (encoding1[i]) active1++;
      if (encoding2[i]) active2++;
      if (encoding1[i] && encoding2[i]) overlap++;
    }

    if (active1 === 0 || active2 === 0) return 0;

    // Jaccard similarity
    return overlap / (active1 + active2 - overlap);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.featureCache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.featureCache.clear();
  }

  /**
   * Export configuration
   */
  getConfig(): SemanticEncodingConfig {
    return { ...this.config };
  }
}
