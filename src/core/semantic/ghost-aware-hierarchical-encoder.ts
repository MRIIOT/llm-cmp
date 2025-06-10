/**
 * Ghost-Aware Hierarchical Encoder
 * Combines hierarchical hash encoding with ghost token relationships
 */

import { HierarchicalHashEncoder } from './hierarchical-hash-encoder.js';
import { ConceptRelationshipGraph } from './concept-relationship-graph.js';
import { SemanticFeatures, SemanticEncodingConfig } from './semantic-types.js';

export class GhostAwareHierarchicalEncoder {
  private hierarchicalEncoder: HierarchicalHashEncoder;
  private conceptGraph: ConceptRelationshipGraph;
  private readonly config: SemanticEncodingConfig;

  constructor(
    numColumns: number,
    columnsPerConcept: number,
    config: SemanticEncodingConfig
  ) {
    this.hierarchicalEncoder = new HierarchicalHashEncoder();
    this.conceptGraph = new ConceptRelationshipGraph(
      config.relationshipDecayFactor,
      config.minRelationshipWeight
    );
    this.config = config;
  }

  /**
   * Encode with ghost relationships
   */
  encodeWithGhostRelationships(concept: string, features: SemanticFeatures): number[] {
    // Get base encoding from hierarchical encoder
    const baseColumns = this.hierarchicalEncoder.encodeHierarchical(concept);
    
    if (!this.config.enableGhostTokens || !features.ghostTokens) {
      return baseColumns;
    }

    // Update concept graph with features
    this.updateConceptGraphWithGhosts(features);

    // Get related concepts through active edges
    const relatedConcepts = this.conceptGraph.getRelatedConcepts(concept, 0.1, false);
    
    // Calculate additional columns based on relationships
    const additionalColumns = new Set<number>();
    
    for (const related of relatedConcepts) {
      if (related.active && related.concept !== concept) {
        // Calculate overlap based on relationship strength
        const overlapColumns = this.calculateGhostOverlap(
          related.weight,
          this.config.columnsPerConcept
        );
        
        // Add overlap columns from related concept's encoding
        const relatedEncoding = this.hierarchicalEncoder.encodeHierarchical(related.concept);
        for (let i = 0; i < overlapColumns && i < relatedEncoding.length; i++) {
          additionalColumns.add(relatedEncoding[i]);
        }
      }
    }

    // Combine base columns with relationship-based columns
    const combinedColumns = [...new Set([...baseColumns, ...additionalColumns])];
    
    // Ensure we don't exceed the desired number of columns
    return combinedColumns.slice(0, this.config.columnsPerConcept);
  }

  /**
   * Calculate overlap based on ghost probability
   */
  calculateGhostOverlap(ghostProbability: number, maxOverlap: number): number {
    // Map probability to overlap percentage
    let overlapPercentage: number;
    
    if (ghostProbability > 0.7) {
      overlapPercentage = 0.15; // High-probability ghost: 15% overlap
    } else if (ghostProbability > 0.4) {
      overlapPercentage = 0.10; // Medium-probability ghost: 10% overlap
    } else {
      overlapPercentage = 0.05; // Low-probability ghost: 5% overlap
    }
    
    return Math.floor(maxOverlap * overlapPercentage);
  }

  /**
   * Update concept graph with ghost tokens
   */
  updateConceptGraphWithGhosts(features: SemanticFeatures): void {
    this.conceptGraph.updateFromFeaturesWithGhosts(features);
  }

  /**
   * Toggle relationship between concepts
   */
  toggleRelationship(concept1: string, concept2: string, active: boolean): boolean {
    return this.conceptGraph.toggleEdge(concept1, concept2, active);
  }

  /**
   * Toggle ghost relationship
   */
  toggleGhostRelationship(concept1: string, ghost: string, concept2: string, active: boolean): boolean {
    return this.conceptGraph.toggleGhostEdge(concept1, ghost, concept2, active);
  }

  /**
   * Get relationship status report
   */
  getRelationshipStatus() {
    return this.conceptGraph.analyzeEdgeEffectiveness();
  }

  /**
   * Export edge configuration
   */
  exportEdgeConfiguration() {
    return this.conceptGraph.exportEdgeConfiguration();
  }

  /**
   * Import edge configuration
   */
  importEdgeConfiguration(config: any) {
    return this.conceptGraph.importEdgeConfiguration(config);
  }

  /**
   * Reset all edge states
   */
  resetEdgeStates(active: boolean = true) {
    this.conceptGraph.resetAllEdges(active);
  }

  /**
   * Get edge history
   */
  getEdgeHistory(concept1: string, concept2: string) {
    return this.conceptGraph.getEdgeHistory(concept1, concept2);
  }

  /**
   * Encode multiple concepts with ghost-aware relationships
   */
  encodeConcepts(concepts: string[], features: SemanticFeatures): number[][] {
    // First update the graph with all features
    this.updateConceptGraphWithGhosts(features);
    
    // Then encode each concept with awareness of others
    return concepts.map(concept => 
      this.encodeWithGhostRelationships(concept, features)
    );
  }

  /**
   * Get statistics about the encoding
   */
  getEncodingStats() {
    const graphStats = this.conceptGraph.analyzeEdgeEffectiveness();
    const encoderConfig = this.hierarchicalEncoder.getConfig();
    
    return {
      hierarchicalEncoder: {
        config: encoderConfig,
        type: 'hierarchical'
      },
      relationshipGraph: graphStats,
      ghostTokensEnabled: this.config.enableGhostTokens,
      edgeTogglingEnabled: this.config.enableEdgeToggling
    };
  }
}