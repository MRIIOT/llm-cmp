/**
 * Semantic Types and Interfaces
 * Defines the structure for semantic feature extraction and encoding
 */

/**
 * Ghost token representing implicit conceptual bridges between concepts
 */
export interface GhostToken {
  /** The bridging concept/token */
  token: string;
  
  /** Confidence score (0-1) for this bridge */
  probability: number;
  
  /** Type of conceptual bridge */
  type: 'bridge' | 'context' | 'implicit';
}

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
  
  /** Ghost tokens - implicit conceptual bridges between main concepts */
  ghostTokens?: GhostToken[];
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
  
  /** Enable Phase 2 enhancements */
  enablePhase2Enhancements: boolean;
  
  /** Overlap ratio for adaptive column assignment (0-1) */
  columnOverlapRatio: number;
  
  /** Decay factor for relationship weights */
  relationshipDecayFactor: number;
  
  /** Minimum weight threshold for relationships */
  minRelationshipWeight: number;
  
  /** Enable concept normalization */
  enableConceptNormalization: boolean;
  
  /** Enable relationship tracking */
  enableRelationshipTracking: boolean;
  
  /** Enable hierarchical hash encoding for natural concept overlap */
  enableHierarchicalEncoding: boolean;
  
  /** Enable ghost token extraction from LLM */
  enableGhostTokens: boolean;
  
  /** Enable edge toggling for relationship control */
  enableEdgeToggling: boolean;
  
  /** Maximum number of ghost tokens per query */
  maxGhostTokens: number;
  
  /** Minimum probability threshold for ghost tokens */
  minGhostTokenProbability: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_SEMANTIC_CONFIG: SemanticEncodingConfig = {
  numColumns: 2048,
  sparsity: 0.02, // 2% sparsity
  columnsPerConcept: 30, // Increased from 20 for more overlap
  maxCacheSize: 1000,
  similarityThreshold: 0.50, // Reduced from 0.70 for better cache hits with Dice coefficient
  llmTemperature: 0.3,
  llmMaxTokens: 500,
  enablePhase2Enhancements: true, // Phase 2 enhancements enabled by default
  columnOverlapRatio: 0.3, // 30% overlap for related concepts
  relationshipDecayFactor: 0.95,
  minRelationshipWeight: 0.1,
  enableConceptNormalization: true,
  enableRelationshipTracking: true,
  enableHierarchicalEncoding: true, // Enable hierarchical encoding by default
  enableGhostTokens: true, // Enable ghost tokens by default
  enableEdgeToggling: true, // Enable edge toggling by default
  maxGhostTokens: 5, // Limit to 5 ghost tokens per query
  minGhostTokenProbability: 0.3 // Filter out low-confidence ghost tokens
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
