/**
 * Semantic Types and Interfaces
 * Defines the structure for semantic feature extraction and encoding
 */

/**
 * Semantic features extracted from text by LLM
 */
export interface SemanticFeatures {
  /** Key concepts/entities (3-7 items, most important first) */
  concepts: string[];
  
  /** High-level categories (2-4 items) */
  categories: string[];
  
  /** Semantic attributes with normalized weights (0-1) */
  attributes: {
    abstractness: number;      // How abstract vs concrete
    specificity: number;       // How specific vs general  
    technicality: number;      // Technical complexity
    certainty: number;         // Certainty level expressed
    actionability: number;     // Action-oriented vs descriptive
    temporality: number;       // Past/present/future focus
  };
  
  /** Key relationships between concepts */
  relationships: string[];
  
  /** Query intent type */
  intent: 'question' | 'statement' | 'command' | 'analysis';
  
  /** Overall complexity score (0-1) */
  complexity: number;
  
  /** Whether the text has time-related elements */
  temporalAspect: boolean;
}

/**
 * Cache entry for semantic features
 */
export interface SemanticCacheEntry {
  /** Original text that was analyzed */
  text: string;
  
  /** Normalized version for similarity matching */
  normalizedText: string;
  
  /** Extracted semantic features */
  features: SemanticFeatures;
  
  /** Timestamp of extraction */
  timestamp: number;
  
  /** Number of times this entry was accessed */
  accessCount: number;
}

/**
 * Concept to column mapping for stable encoding
 */
export interface ConceptColumnMapping {
  /** The concept string */
  concept: string;
  
  /** Assigned column indices */
  columns: number[];
  
  /** Number of times this concept was encoded */
  useCount: number;
}

/**
 * Configuration for semantic encoding
 */
export interface SemanticEncodingConfig {
  /** Total number of columns in HTM */
  numColumns: number;
  
  /** Target sparsity (percentage of active columns) */
  sparsity: number;
  
  /** Number of columns per concept */
  columnsPerConcept: number;
  
  /** Maximum cache size */
  maxCacheSize: number;
  
  /** Similarity threshold for cache matching (0-1) */
  similarityThreshold: number;
  
  /** LLM temperature for feature extraction */
  llmTemperature: number;
  
  /** Maximum tokens for LLM response */
  llmMaxTokens: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_SEMANTIC_CONFIG: SemanticEncodingConfig = {
  numColumns: 2048,
  sparsity: 0.02, // 2% sparsity
  columnsPerConcept: 20,
  maxCacheSize: 1000,
  similarityThreshold: 0.85,
  llmTemperature: 0.3,
  llmMaxTokens: 500
};

/**
 * Attribute offset mappings for consistent encoding
 */
export const ATTRIBUTE_OFFSETS = new Map<string, number>([
  ['abstractness', 0],
  ['specificity', 10],
  ['technicality', 20],
  ['certainty', 30],
  ['actionability', 40],
  ['temporality', 50]
]);

/**
 * Intent offset mappings for consistent encoding
 */
export const INTENT_OFFSETS = new Map<string, number>([
  ['question', 0],
  ['statement', 5],
  ['command', 10],
  ['analysis', 15]
]);

/**
 * Result of semantic encoding
 */
export interface SemanticEncodingResult {
  /** The encoded SDR (boolean array) */
  encoding: boolean[];
  
  /** Features that were used for encoding */
  features: SemanticFeatures;
  
  /** Whether features came from cache */
  fromCache: boolean;
  
  /** Number of active columns */
  activeCount: number;
  
  /** Actual sparsity achieved */
  sparsity: number;
}

/**
 * Error types for semantic encoding
 */
export enum SemanticEncodingError {
  LLM_EXTRACTION_FAILED = 'LLM_EXTRACTION_FAILED',
  INVALID_FEATURES = 'INVALID_FEATURES',
  ENCODING_FAILED = 'ENCODING_FAILED',
  CACHE_ERROR = 'CACHE_ERROR'
}

/**
 * Semantic encoding exception
 */
export class SemanticEncodingException extends Error {
  constructor(
    public readonly errorType: SemanticEncodingError,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SemanticEncodingException';
  }
}
