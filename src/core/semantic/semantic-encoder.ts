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
import { ConceptNormalizer } from './concept-normalizer.js';
import { SemanticRelationshipManager } from './semantic-relationship-manager.js';
import { AdaptiveColumnAssigner } from './adaptive-column-assigner.js';
import { HierarchicalHashEncoder } from './hierarchical-hash-encoder.js';
import { GhostAwareHierarchicalEncoder } from './ghost-aware-hierarchical-encoder.js';
import { ConceptRelationshipGraph, EdgeConfig } from './concept-relationship-graph.js';

export class SemanticEncoder {
  private readonly config: SemanticEncodingConfig;
  private readonly featureExtractor: SemanticFeatureExtractor;
  private readonly featureCache: SemanticFeatureCache;
  private readonly llmInterface: (request: LLMRequest) => Promise<LLMResponse>;
  
  // Phase 2 components
  private readonly conceptNormalizer?: ConceptNormalizer;
  private readonly relationshipManager?: SemanticRelationshipManager;
  private readonly columnAssigner?: AdaptiveColumnAssigner;
  
  // Hierarchical encoder
  private readonly hierarchicalEncoder?: HierarchicalHashEncoder;
  
  // Ghost-aware encoder (Phase 2)
  private readonly ghostAwareEncoder?: GhostAwareHierarchicalEncoder;

  constructor(
    llmInterface: (request: LLMRequest) => Promise<LLMResponse>,
    config: Partial<SemanticEncodingConfig> = {}
  ) {
    this.config = { ...DEFAULT_SEMANTIC_CONFIG, ...config };
    this.llmInterface = llmInterface;
    this.featureExtractor = new SemanticFeatureExtractor(
      llmInterface,
      this.config.llmTemperature,
      this.config.llmMaxTokens,
      this.config
    );
    this.featureCache = new SemanticFeatureCache(this.config);
    
    // Initialize Hierarchical Encoder if enabled
    if (this.config.enableHierarchicalEncoding) {
      this.hierarchicalEncoder = new HierarchicalHashEncoder({
        // Use default config for now, can be customized later
      });
      
      // Initialize Ghost-Aware encoder if ghost tokens are enabled
      if (this.config.enableGhostTokens) {
        this.ghostAwareEncoder = new GhostAwareHierarchicalEncoder(
          this.config.numColumns,
          this.config.columnsPerConcept,
          this.config
        );
      }
    }
    
    // Initialize Phase 2 components if enabled
    if (this.config.enablePhase2Enhancements) {
      if (this.config.enableConceptNormalization) {
        this.conceptNormalizer = new ConceptNormalizer(llmInterface);
      }
      
      if (this.config.enableRelationshipTracking) {
        this.relationshipManager = new SemanticRelationshipManager(
          this.config.relationshipDecayFactor,
          this.config.minRelationshipWeight
        );
      }
      
      this.columnAssigner = new AdaptiveColumnAssigner(
        this.config.numColumns,
        this.config.columnOverlapRatio
      );
    }
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

      // Use Phase 2 enhancements if enabled
      let encoding: boolean[];
      
      // Combine all enhancement approaches when available
      if (this.config.enablePhase2Enhancements && this.columnAssigner) {
        // Start with semantic enhancements (adaptive columns, normalization, etc.)
        encoding = await this.encodeWithSemanticEnhancements(features);
        
        // If ghost tokens are also enabled, enhance the encoding further
        if (this.config.enableGhostTokens && this.ghostAwareEncoder) {
          encoding = await this.enhanceWithGhostTokens(encoding, features);
        }
      } else if (this.config.enableGhostTokens && this.ghostAwareEncoder) {
        // Use only ghost-aware encoding if semantic enhancements are disabled
        encoding = await this.encodeWithGhostTokens(features);
      } else {
        // Fallback to basic encoding
        encoding = this.featuresToSDR(features);
      }

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
   * Enhance existing encoding with ghost token relationships
   * This adds ghost-aware columns while preserving the base encoding
   */
  private async enhanceWithGhostTokens(
    baseEncoding: boolean[], 
    features: SemanticFeatures
  ): Promise<boolean[]> {
    // Create a copy to avoid modifying the original
    const enhancedEncoding = [...baseEncoding];
    
    if (!features.ghostTokens || features.ghostTokens.length === 0) {
      return enhancedEncoding; // No ghost tokens to enhance with
    }
    
    // Update the concept graph with ghost tokens
    this.ghostAwareEncoder!.updateConceptGraphWithGhosts(features);
    
    // Get ghost-based column additions for each concept pair
    for (let i = 0; i < features.concepts.length; i++) {
      for (let j = i + 1; j < features.concepts.length; j++) {
        const concept1 = features.concepts[i];
        const concept2 = features.concepts[j];
        
        // Find ghost tokens that might bridge these concepts
        const bridgingGhosts = features.ghostTokens.filter(ghost => 
          ghost.type === 'bridge' && ghost.probability >= this.config.minGhostTokenProbability
        );
        
        if (bridgingGhosts.length > 0) {
          // Get overlap columns based on ghost relationships
          const ghostColumns = await this.getGhostOverlapColumns(
            concept1, 
            concept2, 
            bridgingGhosts[0].probability
          );
          
          // Add ghost-influenced columns (up to a limit to maintain sparsity)
          const maxGhostColumns = Math.floor(this.config.columnsPerConcept * 0.2); // 20% additional
          let addedCount = 0;
          
          for (const col of ghostColumns) {
            if (col < enhancedEncoding.length && !enhancedEncoding[col] && addedCount < maxGhostColumns) {
              enhancedEncoding[col] = true;
              addedCount++;
            }
          }
        }
      }
    }
    
    return enhancedEncoding;
  }

  /**
   * Get ghost-influenced overlap columns for concept pair
   */
  private async getGhostOverlapColumns(
    concept1: string, 
    concept2: string, 
    ghostProbability: number
  ): Promise<number[]> {
    // Calculate overlap based on ghost probability
    const overlapRatio = ghostProbability * 0.15; // Max 15% overlap for high-confidence ghosts
    const numOverlapColumns = Math.floor(this.config.columnsPerConcept * overlapRatio);
    
    // Generate deterministic columns based on concept pair and ghost relationship
    const columns: number[] = [];
    const seed = this.hashString(`${concept1}_ghost_${concept2}`);
    
    for (let i = 0; i < numOverlapColumns; i++) {
      const col = (seed + i * 37) % this.config.numColumns;
      columns.push(col);
    }
    
    return columns;
  }

  /**
   * Encoding with ghost token relationships (standalone)
   */
  private async encodeWithGhostTokens(features: SemanticFeatures): Promise<boolean[]> {
    const encoding = new Array(this.config.numColumns).fill(false);
    
    // Encode each concept with ghost awareness
    const conceptEncodings = await this.ghostAwareEncoder!.encodeConcepts(
      features.concepts,
      features
    );
    
    // Merge all concept encodings
    for (const conceptColumns of conceptEncodings) {
      for (const col of conceptColumns) {
        if (col < encoding.length) {
          encoding[col] = true;
        }
      }
    }
    
    // Also encode other features (categories, attributes, etc.)
    const targetActive = Math.floor(this.config.numColumns * this.config.sparsity);
    const currentActive = encoding.filter(bit => bit).length;
    const remainingColumns = Math.max(0, targetActive - currentActive);
    
    if (remainingColumns > 0) {
      // Add category encodings
      const categoryColumns = Math.floor(remainingColumns * 0.4);
      this.encodeCategories(features.categories, encoding, categoryColumns, currentActive);
      
      // Add attribute encodings
      const attributeColumns = Math.floor(remainingColumns * 0.3);
      this.encodeAttributes(features.attributes, encoding, attributeColumns, currentActive);
      
      // Add metadata
      const metaColumns = Math.floor(remainingColumns * 0.3);
      this.encodeMetadata(features, encoding, metaColumns, currentActive);
    }
    
    return encoding;
  }

  /**
   * Enhanced encoding with Phase 2 components
   */
  private async encodeWithSemanticEnhancements(features: SemanticFeatures): Promise<boolean[]> {
    const encoding = new Array(this.config.numColumns).fill(false);
    const targetActive = Math.floor(this.config.numColumns * this.config.sparsity);
    
    // Update relationship graph if enabled
    if (this.relationshipManager && this.conceptNormalizer) {
      await this.relationshipManager.updateRelationships(features, this.conceptNormalizer);
    }
    
    // Process concepts with normalization and adaptive column assignment
    let activeColumnCount = 0;
    
    // 1. Encode concepts with semantic enhancements (50% of active columns)
    const conceptColumns = Math.floor(targetActive * 0.5);
    activeColumnCount += await this.encodeConceptsEnhanced(
      features.concepts,
      encoding,
      conceptColumns
    );
    
    // 2. Encode categories (25% of active columns)
    const categoryColumns = Math.floor(targetActive * 0.25);
    activeColumnCount += await this.encodeCategoriesEnhanced(
      features.categories,
      encoding,
      categoryColumns
    );
    
    // 3. Encode attributes (15% of active columns)
    const attributeColumns = Math.floor(targetActive * 0.15);
    activeColumnCount += this.encodeAttributes(
      features.attributes,
      encoding,
      attributeColumns,
      activeColumnCount
    );
    
    // 4. Encode relationships (5% of active columns)
    const relationColumns = Math.floor(targetActive * 0.05);
    activeColumnCount += this.encodeRelationships(
      features.relationships,
      encoding,
      relationColumns,
      activeColumnCount
    );
    
    // 5. Encode metadata (5% of active columns)
    const metaColumns = Math.floor(targetActive * 0.05);
    activeColumnCount += this.encodeMetadata(
      features,
      encoding,
      metaColumns,
      activeColumnCount
    );
    
    return encoding;
  }

  /**
   * Enhanced concept encoding with normalization and adaptive columns
   */
  private async encodeConceptsEnhanced(
    concepts: string[],
    encoding: boolean[],
    maxColumns: number
  ): Promise<number> {
    if (!this.conceptNormalizer || !this.columnAssigner) {
      return this.encodeConcepts(concepts, encoding, maxColumns, 0);
    }
    
    let activated = 0;
    
    // Normalize concepts
    const normalizedMap = await this.conceptNormalizer.normalizeMany(concepts);
    const normalizedConcepts = concepts.map(c => normalizedMap.get(c) || c);
    
    // Use hierarchical encoding if available
    if (this.hierarchicalEncoder) {
      const hierarchicalEncoder = this.hierarchicalEncoder; // Capture for TypeScript
      
      // Process each concept with hierarchical encoding
      for (let i = 0; i < normalizedConcepts.length && activated < maxColumns; i++) {
        const concept = normalizedConcepts[i];
        const weight = 1.0 - (i * 0.07); // Position-based importance
        
        // Get hierarchical encoding for the concept
        const hierarchicalColumns: number[] = hierarchicalEncoder.encodeHierarchical(concept);
        
        // Get related concepts from relationship manager
        let relatedConcepts: Array<{ concept: string; weight: number }> = [];
        if (this.relationshipManager) {
          const importance = this.relationshipManager.getConceptImportance(concept);
          const finalWeight = weight * (0.7 + importance * 0.3);
          relatedConcepts = this.relationshipManager.getRelatedConcepts(concept, 0.3);
        }
        
        // Determine columns to activate based on weight and relationships
        const columnsToActivate = Math.max(
          Math.floor(hierarchicalColumns.length * weight * 0.7),
          Math.min(5, hierarchicalColumns.length)
        );
        
        // Activate hierarchical columns
        for (let j = 0; j < columnsToActivate && activated < maxColumns; j++) {
          const col = hierarchicalColumns[j];
          if (col < encoding.length && !encoding[col]) {
            encoding[col] = true;
            activated++;
          }
        }
        
        // Also activate some columns from related concepts if they exist
        for (const related of relatedConcepts.slice(0, 2)) { // Top 2 related
          const relatedColumns: number[] = hierarchicalEncoder.encodeHierarchical(related.concept);
          const relatedToActivate = Math.floor(related.weight * 5); // 0-5 columns based on weight
          
          for (let k = 0; k < relatedToActivate && activated < maxColumns; k++) {
            const col = relatedColumns[k];
            if (col < encoding.length && !encoding[col]) {
              encoding[col] = true;
              activated++;
            }
          }
        }
      }
    } else {
      // Original adaptive column assignment
      for (let i = 0; i < normalizedConcepts.length && activated < maxColumns; i++) {
        const concept = normalizedConcepts[i];
        const weight = 1.0 - (i * 0.07); // Position-based importance
        
        // Get related concepts from relationship manager
        let relatedConcepts: Array<{ concept: string; weight: number }> = [];
        if (this.relationshipManager) {
          const importance = this.relationshipManager.getConceptImportance(concept);
          const finalWeight = weight * (0.7 + importance * 0.3);
          relatedConcepts = this.relationshipManager.getRelatedConcepts(concept, 0.3);
        }
        
        // Assign columns with semantic overlap
        const columnsPerConcept = Math.max(
          Math.floor(this.config.columnsPerConcept * weight),
          5 // Minimum 5 columns per concept
        );
        
        const assignedColumns = await this.columnAssigner.assignColumns(
          concept,
          relatedConcepts,
          columnsPerConcept
        );
        
        // Activate assigned columns
        for (const col of assignedColumns) {
          if (!encoding[col] && activated < maxColumns) {
            encoding[col] = true;
            activated++;
          }
        }
      }
    }
    
    return activated;
  }

  /**
   * Enhanced category encoding
   */
  private async encodeCategoriesEnhanced(
    categories: string[],
    encoding: boolean[],
    maxColumns: number
  ): Promise<number> {
    if (!this.conceptNormalizer || !this.columnAssigner) {
      return this.encodeCategories(categories, encoding, maxColumns, 0);
    }
    
    let activated = 0;
    
    // Normalize categories
    const normalizedMap = await this.conceptNormalizer.normalizeMany(categories);
    
    for (const category of categories) {
      const normalized = normalizedMap.get(category) || category;
      const categoryKey = `_cat_${normalized}`;
      
      // Use column assigner for categories too
      const assignedColumns = await this.columnAssigner.assignColumns(
        categoryKey,
        [], // Categories don't have related concepts
        8   // Fixed 8 columns per category
      );
      
      for (const col of assignedColumns) {
        if (!encoding[col] && activated < maxColumns) {
          encoding[col] = true;
          activated++;
        }
      }
    }
    
    return activated;
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

    // 1. Encode concepts (50% of active columns) - Increased from 40%
    const conceptColumns = Math.floor(targetActive * 0.5);
    activeColumnCount += this.encodeConcepts(
      features.concepts,
      encoding,
      conceptColumns,
      activeColumnCount
    );

    // 2. Encode categories (25% of active columns) - Increased from 20%
    const categoryColumns = Math.floor(targetActive * 0.25);
    activeColumnCount += this.encodeCategories(
      features.categories,
      encoding,
      categoryColumns,
      activeColumnCount
    );

    // 3. Encode attributes (15% of active columns) - Reduced from 20%
    const attributeColumns = Math.floor(targetActive * 0.15);
    activeColumnCount += this.encodeAttributes(
      features.attributes,
      encoding,
      attributeColumns,
      activeColumnCount
    );

    // 4. Encode relationships (5% of active columns) - Reduced from 10%
    const relationColumns = Math.floor(targetActive * 0.05);
    activeColumnCount += this.encodeRelationships(
      features.relationships,
      encoding,
      relationColumns,
      activeColumnCount
    );

    // 5. Encode intent and complexity (5% of active columns) - Reduced from 10%
    const metaColumns = Math.floor(targetActive * 0.05);
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

    // Use hierarchical encoding if enabled
    if (this.hierarchicalEncoder) {
      const hierarchicalEncoder = this.hierarchicalEncoder; // Capture for TypeScript
      
      concepts.forEach((concept, index) => {
        // Weight by importance (first concepts are more important)
        const weight = 1.0 - (index * 0.07);
        
        // Get hierarchical encoding for the concept
        const hierarchicalColumns: number[] = hierarchicalEncoder.encodeHierarchical(concept);
        
        // Determine how many columns to activate based on weight
        const columnsToActivate = Math.max(
          Math.floor(hierarchicalColumns.length * weight * 0.7), // Use 70% of available columns
          Math.min(5, hierarchicalColumns.length) // Ensure at least 5 columns
        );
        
        // Activate columns
        for (let i = 0; i < columnsToActivate && activated < maxColumns; i++) {
          const col = hierarchicalColumns[i];
          if (col < encoding.length && !encoding[col]) {
            encoding[col] = true;
            activated++;
          }
        }
      });
    } else {
      // Original hash-based encoding
      concepts.forEach((concept, index) => {
        // Weight by importance (first concepts are more important)
        // Adjusted weighting to maintain more columns for important concepts
        const weight = 1.0 - (index * 0.07); // Reduced decay from 0.1 to 0.07
        const conceptColumns = this.featureCache.getConceptColumns(
          concept,
          this.config.numColumns
        );
        
        const columnsToActivate = Math.max(
          Math.floor(conceptColumns.length * weight),
          Math.min(5, conceptColumns.length) // Ensure at least 5 columns for each concept
        );
        
        for (let i = 0; i < columnsToActivate && activated < maxColumns; i++) {
          if (!encoding[conceptColumns[i]]) {
            encoding[conceptColumns[i]] = true;
            activated++;
          }
        }
      });
    }

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
      
      // Increased from 5 to 8 columns per category for stronger grouping
      const columnsToActivate = Math.min(8, categoryColumns.length);
      
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
      
      // Activate up to 3 columns per relationship (was 1)
      const columnsToActivate = Math.min(3, relColumns.length);
      
      for (let i = 0; i < columnsToActivate && activated < maxColumns; i++) {
        if (!encoding[relColumns[i]]) {
          encoding[relColumns[i]] = true;
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
   * Get comprehensive statistics including Phase 2 components
   */
  getEnhancedStats() {
    const baseStats = this.featureCache.getStats();
    
    const enhancedStats: any = { ...baseStats };
    
    if (this.conceptNormalizer) {
      enhancedStats.conceptNormalizer = this.conceptNormalizer.getCacheStats();
    }
    
    if (this.relationshipManager) {
      enhancedStats.relationshipManager = this.relationshipManager.getStats();
    }
    
    if (this.columnAssigner) {
      enhancedStats.columnAssigner = this.columnAssigner.getColumnDistributionStats();
    }
    
    if (this.ghostAwareEncoder) {
      enhancedStats.ghostTokens = this.ghostAwareEncoder.getEncodingStats();
    }
    
    return enhancedStats;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.featureCache.clear();
    
    // Clear Phase 2 component caches
    if (this.conceptNormalizer) {
      this.conceptNormalizer.clearCache();
    }
    
    if (this.relationshipManager) {
      this.relationshipManager.clear();
    }
    
    if (this.columnAssigner) {
      this.columnAssigner.clear();
    }
  }

  /**
   * Export configuration
   */
  getConfig(): SemanticEncodingConfig {
    return { ...this.config };
  }

  // Ghost Token and Edge Toggling Methods

  /**
   * Encode concepts with ghost token relationships
   */
  async encodeConceptsWithGhosts(concepts: string[], features: SemanticFeatures): Promise<number[][]> {
    if (!this.ghostAwareEncoder) {
      throw new Error('Ghost token encoding is not enabled. Set enableGhostTokens to true in config.');
    }
    
    return this.ghostAwareEncoder.encodeConcepts(concepts, features);
  }

  /**
   * Toggle a relationship between two concepts
   */
  toggleRelationship(concept1: string, concept2: string, active: boolean): boolean {
    if (!this.ghostAwareEncoder) {
      throw new Error('Edge toggling is not enabled. Set enableEdgeToggling to true in config.');
    }
    
    return this.ghostAwareEncoder.toggleRelationship(concept1, concept2, active);
  }

  /**
   * Toggle a ghost-mediated relationship
   */
  toggleGhostRelationship(concept1: string, ghost: string, concept2: string, active: boolean): boolean {
    if (!this.ghostAwareEncoder) {
      throw new Error('Edge toggling is not enabled. Set enableEdgeToggling to true in config.');
    }
    
    return this.ghostAwareEncoder.toggleGhostRelationship(concept1, ghost, concept2, active);
  }

  /**
   * Get relationship status report
   */
  getRelationshipStatus() {
    if (!this.ghostAwareEncoder) {
      return { error: 'Ghost token encoding not enabled' };
    }
    
    return this.ghostAwareEncoder.getRelationshipStatus();
  }

  /**
   * Export edge configuration
   */
  exportEdgeConfiguration(): EdgeConfig | null {
    if (!this.ghostAwareEncoder) {
      return null;
    }
    
    return this.ghostAwareEncoder.exportEdgeConfiguration();
  }

  /**
   * Import edge configuration
   */
  importEdgeConfiguration(config: EdgeConfig): void {
    if (!this.ghostAwareEncoder) {
      throw new Error('Ghost token encoding is not enabled.');
    }
    
    this.ghostAwareEncoder.importEdgeConfiguration(config);
  }

  /**
   * Reset all edge states
   */
  resetEdgeStates(): void {
    if (!this.ghostAwareEncoder) {
      throw new Error('Ghost token encoding is not enabled.');
    }
    
    this.ghostAwareEncoder.resetEdgeStates();
  }

  /**
   * Get edge history between two concepts
   */
  getEdgeHistory(concept1: string, concept2: string) {
    if (!this.ghostAwareEncoder) {
      return [];
    }
    
    return this.ghostAwareEncoder.getEdgeHistory(concept1, concept2);
  }
}
