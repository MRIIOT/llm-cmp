/**
 * Semantic Relationship Manager
 * Tracks concept relationships and co-occurrences to build a semantic graph
 */

import { SemanticFeatures } from './semantic-types.js';
import { ConceptNormalizer } from './concept-normalizer.js';

/**
 * Relationship between two concepts
 */
export interface ConceptRelationship {
  concept: string;
  weight: number;
  coOccurrenceCount: number;
  lastSeen: number;
}

/**
 * Concept statistics
 */
export interface ConceptStats {
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  averagePosition: number;
  contextDiversity: number;
}

/**
 * Manages semantic relationships between concepts
 */
export class SemanticRelationshipManager {
  private conceptGraph: Map<string, Map<string, ConceptRelationship>>;
  private conceptStats: Map<string, ConceptStats>;
  private contextHashes: Map<string, Set<string>>;
  private readonly decayFactor: number;
  private readonly minWeight: number;

  constructor(
    decayFactor: number = 0.95,
    minWeight: number = 0.1
  ) {
    this.conceptGraph = new Map();
    this.conceptStats = new Map();
    this.contextHashes = new Map();
    this.decayFactor = decayFactor;
    this.minWeight = minWeight;
  }

  /**
   * Update relationships based on observed features
   */
  async updateRelationships(
    features: SemanticFeatures,
    normalizer: ConceptNormalizer
  ): Promise<void> {
    // Normalize all concepts
    const normalizedConcepts = await normalizer.normalizeMany(features.concepts);
    const concepts = Array.from(normalizedConcepts.values());
    
    // Create context hash for diversity tracking
    const contextHash = this.createContextHash(features);
    
    // Update concept statistics
    concepts.forEach((concept, index) => {
      this.updateConceptStats(concept, index, concepts.length, contextHash);
    });

    // Update co-occurrence relationships
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const weight = this.calculateCoOccurrenceWeight(i, j, concepts.length);
        this.updateRelationship(concepts[i], concepts[j], weight);
      }
    }

    // Update category relationships
    for (const category of features.categories) {
      const normalizedCategory = await normalizer.normalize(category);
      for (const concept of concepts) {
        this.updateRelationship(concept, `_cat_${normalizedCategory}`, 0.3);
      }
    }

    // Update relationship type connections
    for (const relationship of features.relationships) {
      const normalizedRel = await normalizer.normalize(relationship);
      if (concepts.length >= 2) {
        // Connect first two concepts via relationship
        this.updateRelationship(concepts[0], `_rel_${normalizedRel}`, 0.4);
        if (concepts[1]) {
          this.updateRelationship(concepts[1], `_rel_${normalizedRel}`, 0.4);
        }
      }
    }

    // Apply decay to old relationships
    this.applyDecay();
  }

  /**
   * Update concept statistics
   */
  private updateConceptStats(
    concept: string,
    position: number,
    totalConcepts: number,
    contextHash: string
  ): void {
    const now = Date.now();
    
    if (!this.conceptStats.has(concept)) {
      this.conceptStats.set(concept, {
        frequency: 0,
        firstSeen: now,
        lastSeen: now,
        averagePosition: position,
        contextDiversity: 0
      });
      this.contextHashes.set(concept, new Set());
    }

    const stats = this.conceptStats.get(concept)!;
    const contexts = this.contextHashes.get(concept)!;
    
    // Update statistics
    stats.frequency++;
    stats.lastSeen = now;
    stats.averagePosition = (stats.averagePosition * (stats.frequency - 1) + position) / stats.frequency;
    
    // Track context diversity
    contexts.add(contextHash);
    stats.contextDiversity = contexts.size / stats.frequency;
  }

  /**
   * Calculate co-occurrence weight based on positions
   */
  private calculateCoOccurrenceWeight(
    pos1: number,
    pos2: number,
    totalConcepts: number
  ): number {
    const distance = Math.abs(pos1 - pos2);
    const maxDistance = totalConcepts - 1;
    
    // Closer concepts have higher weight
    const proximityWeight = 1.0 - (distance / maxDistance);
    
    // Early concepts are more important
    const positionWeight = 1.0 - ((pos1 + pos2) / (2 * totalConcepts));
    
    return proximityWeight * 0.7 + positionWeight * 0.3;
  }

  /**
   * Update a specific relationship
   */
  private updateRelationship(
    concept1: string,
    concept2: string,
    weight: number
  ): void {
    const now = Date.now();
    
    // Ensure graph nodes exist
    if (!this.conceptGraph.has(concept1)) {
      this.conceptGraph.set(concept1, new Map());
    }
    if (!this.conceptGraph.has(concept2)) {
      this.conceptGraph.set(concept2, new Map());
    }

    // Update bidirectional relationship
    this.updateDirectionalRelationship(concept1, concept2, weight, now);
    this.updateDirectionalRelationship(concept2, concept1, weight, now);
  }

  /**
   * Update directional relationship
   */
  private updateDirectionalRelationship(
    from: string,
    to: string,
    weight: number,
    timestamp: number
  ): void {
    const relationships = this.conceptGraph.get(from)!;
    
    if (relationships.has(to)) {
      const existing = relationships.get(to)!;
      // Exponential moving average
      existing.weight = existing.weight * 0.7 + weight * 0.3;
      existing.coOccurrenceCount++;
      existing.lastSeen = timestamp;
    } else {
      relationships.set(to, {
        concept: to,
        weight,
        coOccurrenceCount: 1,
        lastSeen: timestamp
      });
    }
  }

  /**
   * Apply time-based decay to relationships
   */
  private applyDecay(): void {
    const now = Date.now();
    const hourInMs = 3600000;
    
    for (const [concept, relationships] of this.conceptGraph.entries()) {
      const toRemove: string[] = [];
      
      for (const [related, relationship] of relationships.entries()) {
        const hoursOld = (now - relationship.lastSeen) / hourInMs;
        if (hoursOld > 1) {
          // Apply decay based on age
          relationship.weight *= Math.pow(this.decayFactor, hoursOld);
          
          // Remove if below threshold
          if (relationship.weight < this.minWeight) {
            toRemove.push(related);
          }
        }
      }
      
      // Remove weak relationships
      toRemove.forEach(related => relationships.delete(related));
      
      // Remove empty nodes
      if (relationships.size === 0) {
        this.conceptGraph.delete(concept);
      }
    }
  }

  /**
   * Get related concepts with weights
   */
  getRelatedConcepts(
    concept: string,
    threshold: number = 0.3,
    maxResults: number = 10
  ): Array<{ concept: string; weight: number }> {
    const relationships = this.conceptGraph.get(concept);
    if (!relationships) return [];

    return Array.from(relationships.values())
      .filter(r => r.weight >= threshold && !r.concept.startsWith('_'))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxResults)
      .map(r => ({ concept: r.concept, weight: r.weight }));
  }

  /**
   * Get concept importance based on frequency and relationships
   */
  getConceptImportance(concept: string): number {
    const stats = this.conceptStats.get(concept);
    if (!stats) return 0;

    // Normalize frequency (log scale)
    const maxFrequency = Math.max(...Array.from(this.conceptStats.values()).map(s => s.frequency));
    const freqScore = Math.log(stats.frequency + 1) / Math.log(maxFrequency + 1);

    // Relationship score
    const relationships = this.conceptGraph.get(concept);
    const relationshipCount = relationships ? relationships.size : 0;
    const maxRelationships = Math.max(
      ...Array.from(this.conceptGraph.values()).map(r => r.size)
    );
    const relScore = relationshipCount / Math.max(maxRelationships, 1);

    // Position score (earlier positions are more important)
    const posScore = 1.0 - (stats.averagePosition / 10);

    // Context diversity score
    const diversityScore = stats.contextDiversity;

    // Weighted combination
    return (
      freqScore * 0.3 +
      relScore * 0.3 +
      posScore * 0.2 +
      diversityScore * 0.2
    );
  }

  /**
   * Get strongest relationships in the graph
   */
  getStrongestRelationships(limit: number = 20): Array<{
    concept1: string;
    concept2: string;
    weight: number;
    coOccurrences: number;
  }> {
    const relationships: Array<{
      concept1: string;
      concept2: string;
      weight: number;
      coOccurrences: number;
    }> = [];
    const seen = new Set<string>();

    for (const [concept1, relations] of this.conceptGraph.entries()) {
      for (const [concept2, relationship] of relations.entries()) {
        // Avoid duplicates and special concepts
        const key = [concept1, concept2].sort().join('|');
        if (seen.has(key) || concept2.startsWith('_')) continue;
        
        seen.add(key);
        relationships.push({
          concept1,
          concept2,
          weight: relationship.weight,
          coOccurrences: relationship.coOccurrenceCount
        });
      }
    }

    return relationships
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  /**
   * Create context hash for diversity tracking
   */
  private createContextHash(features: SemanticFeatures): string {
    const elements = [
      ...features.categories,
      features.intent,
      Math.round(features.complexity * 10).toString()
    ];
    return elements.sort().join('|');
  }

  /**
   * Get graph statistics
   */
  getStats() {
    const totalRelationships = Array.from(this.conceptGraph.values())
      .reduce((sum, relations) => sum + relations.size, 0);

    return {
      totalConcepts: this.conceptStats.size,
      totalRelationships: totalRelationships / 2, // Bidirectional counted once
      averageRelationshipsPerConcept: totalRelationships / this.conceptStats.size || 0,
      graphDensity: totalRelationships / (this.conceptStats.size * (this.conceptStats.size - 1)) || 0
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.conceptGraph.clear();
    this.conceptStats.clear();
    this.contextHashes.clear();
  }

  /**
   * Export graph for visualization or persistence
   */
  exportGraph(): {
    nodes: Array<{ id: string; frequency: number; importance: number }>;
    edges: Array<{ source: string; target: string; weight: number }>;
  } {
    const nodes = Array.from(this.conceptStats.entries()).map(([concept, stats]) => ({
      id: concept,
      frequency: stats.frequency,
      importance: this.getConceptImportance(concept)
    }));

    const edges: Array<{ source: string; target: string; weight: number }> = [];
    const seen = new Set<string>();

    for (const [source, relations] of this.conceptGraph.entries()) {
      for (const [target, relationship] of relations.entries()) {
        const key = [source, target].sort().join('|');
        if (!seen.has(key) && !target.startsWith('_')) {
          seen.add(key);
          edges.push({
            source,
            target,
            weight: relationship.weight
          });
        }
      }
    }

    return { nodes, edges };
  }
}
