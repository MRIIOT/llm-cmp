/**
 * Concept Relationship Graph
 * Manages relationships between concepts with support for ghost tokens and edge toggling
 */

import { GhostToken, SemanticFeatures } from './semantic-types.js';

/**
 * Edge interface representing a relationship between concepts
 */
export interface Edge {
  /** Source concept */
  from: string;
  
  /** Target concept */
  to: string;
  
  /** Type of edge (direct co-occurrence or ghost-mediated) */
  type: 'direct' | 'ghost';
  
  /** Ghost token if this is a ghost edge */
  ghostToken?: GhostToken;
  
  /** Combined weight (co-occurrence + ghost probability) */
  weight: number;
  
  /** Whether this edge is currently active */
  active: boolean;
  
  /** Edge metadata for tracking */
  metadata: {
    created: Date;
    lastToggled?: Date;
    toggleCount: number;
    activationHistory: Array<{ timestamp: Date; active: boolean }>;
  };
}

/**
 * Edge analysis results
 */
export interface EdgeAnalysis {
  totalEdges: number;
  activeEdges: number;
  inactiveEdges: number;
  directEdges: number;
  ghostEdges: number;
  mostToggledEdges: Array<{ edge: Edge; toggleCount: number }>;
  averageWeight: number;
  edgeEffectiveness: Map<string, number>; // edge key -> contribution score
}

/**
 * Path through the graph
 */
export interface ConceptPath {
  concepts: string[];
  totalWeight: number;
  edges: Edge[];
  isActive: boolean;
}

/**
 * Edge configuration for import/export
 */
export interface EdgeConfig {
  edges: Array<{
    from: string;
    to: string;
    type: 'direct' | 'ghost';
    ghostToken?: string;
    active: boolean;
  }>;
  version: string;
}

/**
 * Persisted graph structure
 */
export interface PersistedGraph {
  edges: Edge[];
  version: string;
  lastModified: Date;
  edgeStateHistory: {
    [edgeId: string]: Array<{
      timestamp: Date;
      active: boolean;
      reason?: string;
    }>;
  };
}

export class ConceptRelationshipGraph {
  private edges: Map<string, Edge> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();
  private readonly decayFactor: number;
  private readonly minWeight: number;

  constructor(decayFactor: number = 0.95, minWeight: number = 0.1) {
    this.decayFactor = decayFactor;
    this.minWeight = minWeight;
  }

  /**
   * Link two concepts with a direct edge
   */
  linkConcepts(concept1: string, concept2: string, weight: number = 1.0): void {
    const edgeKey = this.getEdgeKey(concept1, concept2);
    const existingEdge = this.edges.get(edgeKey);

    if (existingEdge && existingEdge.type === 'direct') {
      // Update existing edge weight
      existingEdge.weight = Math.min(existingEdge.weight + weight * 0.1, 1.0);
    } else {
      // Create new edge
      const edge: Edge = {
        from: concept1,
        to: concept2,
        type: 'direct',
        weight: weight,
        active: true,
        metadata: {
          created: new Date(),
          toggleCount: 0,
          activationHistory: [{ timestamp: new Date(), active: true }]
        }
      };
      this.edges.set(edgeKey, edge);
      this.updateAdjacencyList(concept1, concept2);
    }
  }

  /**
   * Link two concepts via a ghost token
   */
  linkConceptsViaGhost(concept1: string, ghost: GhostToken, concept2: string): void {
    const edgeKey = this.getGhostEdgeKey(concept1, ghost.token, concept2);
    const existingEdge = this.edges.get(edgeKey);

    if (existingEdge && existingEdge.type === 'ghost') {
      // Update existing ghost edge
      existingEdge.weight = Math.min(
        existingEdge.weight + ghost.probability * 0.1, 
        ghost.probability
      );
      if (existingEdge.ghostToken) {
        existingEdge.ghostToken.probability = Math.max(
          existingEdge.ghostToken.probability,
          ghost.probability
        );
      }
    } else {
      // Create new ghost edge
      const edge: Edge = {
        from: concept1,
        to: concept2,
        type: 'ghost',
        ghostToken: ghost,
        weight: ghost.probability,
        active: true,
        metadata: {
          created: new Date(),
          toggleCount: 0,
          activationHistory: [{ timestamp: new Date(), active: true }]
        }
      };
      this.edges.set(edgeKey, edge);
      this.updateAdjacencyList(concept1, concept2);
    }
  }

  /**
   * Toggle a direct edge between concepts
   */
  toggleEdge(concept1: string, concept2: string, active: boolean): boolean {
    const edgeKey = this.getEdgeKey(concept1, concept2);
    const edge = this.edges.get(edgeKey);

    if (edge && edge.type === 'direct') {
      return this.toggleEdgeInternal(edge, active);
    }
    return false;
  }

  /**
   * Toggle a ghost edge
   */
  toggleGhostEdge(concept1: string, ghost: string, concept2: string, active: boolean): boolean {
    const edgeKey = this.getGhostEdgeKey(concept1, ghost, concept2);
    const edge = this.edges.get(edgeKey);

    if (edge && edge.type === 'ghost') {
      return this.toggleEdgeInternal(edge, active);
    }
    return false;
  }

  /**
   * Batch toggle operations
   */
  toggleEdgesBatch(operations: Array<{ from: string; to: string; active: boolean }>): number {
    let toggledCount = 0;
    for (const op of operations) {
      if (this.toggleEdge(op.from, op.to, op.active)) {
        toggledCount++;
      }
    }
    return toggledCount;
  }

  /**
   * Get all active edges
   */
  getActiveEdges(): Array<{ from: string; to: string; type: 'direct' | 'ghost'; active: boolean; weight: number }> {
    return Array.from(this.edges.values())
      .filter(edge => edge.active)
      .map(edge => ({
        from: edge.from,
        to: edge.to,
        type: edge.type,
        active: edge.active,
        weight: edge.weight
      }));
  }

  /**
   * Get related concepts with path information
   */
  getRelatedConcepts(
    concept: string, 
    threshold: number = 0.1, 
    includeInactive: boolean = false
  ): Array<{ concept: string; weight: number; path: string[]; active: boolean }> {
    const visited = new Set<string>();
    const results = new Map<string, { weight: number; path: string[]; active: boolean }>();

    // Find all paths from the concept
    this.findPaths(concept, concept, [], 1.0, visited, results, threshold, includeInactive);

    return Array.from(results.entries())
      .map(([relatedConcept, data]) => ({
        concept: relatedConcept,
        weight: data.weight,
        path: data.path,
        active: data.active
      }))
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * Update graph from semantic features with ghost tokens
   */
  updateFromFeaturesWithGhosts(features: SemanticFeatures): void {
    // Decay existing edges
    this.decayEdges();

    // Link direct co-occurrences
    const concepts = features.concepts;
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        this.linkConcepts(concepts[i], concepts[j], 0.5);
      }
    }

    // Link via ghost tokens if available
    if (features.ghostTokens) {
      for (const ghost of features.ghostTokens) {
        // Link each concept to each other concept via this ghost token
        for (let i = 0; i < concepts.length; i++) {
          for (let j = i + 1; j < concepts.length; j++) {
            this.linkConceptsViaGhost(concepts[i], ghost, concepts[j]);
          }
        }
      }
    }

    // Prune weak edges
    this.pruneWeakEdges();
  }

  /**
   * Calculate overlap columns for two concepts
   */
  getOverlapColumns(concept: string, relatedConcept: string, ghostProbability?: number): number[] {
    // This method would integrate with the encoding system
    // For now, return placeholder
    const overlapRatio = ghostProbability ? ghostProbability * 0.15 : 0.2;
    const numOverlapColumns = Math.floor(30 * overlapRatio); // Assuming 30 columns per concept
    
    const columns: number[] = [];
    for (let i = 0; i < numOverlapColumns; i++) {
      columns.push(i * 10); // Placeholder column indices
    }
    return columns;
  }

  /**
   * Reset all edges to active or inactive
   */
  resetAllEdges(active: boolean): void {
    for (const edge of this.edges.values()) {
      this.toggleEdgeInternal(edge, active, 'reset');
    }
  }

  /**
   * Analyze edge effectiveness
   */
  analyzeEdgeEffectiveness(): EdgeAnalysis {
    const edges = Array.from(this.edges.values());
    
    const analysis: EdgeAnalysis = {
      totalEdges: edges.length,
      activeEdges: edges.filter(e => e.active).length,
      inactiveEdges: edges.filter(e => !e.active).length,
      directEdges: edges.filter(e => e.type === 'direct').length,
      ghostEdges: edges.filter(e => e.type === 'ghost').length,
      mostToggledEdges: edges
        .sort((a, b) => b.metadata.toggleCount - a.metadata.toggleCount)
        .slice(0, 10)
        .map(e => ({ edge: e, toggleCount: e.metadata.toggleCount })),
      averageWeight: edges.reduce((sum, e) => sum + e.weight, 0) / edges.length,
      edgeEffectiveness: new Map()
    };

    // Calculate edge effectiveness (placeholder - would integrate with HTM metrics)
    for (const edge of edges) {
      const key = this.getEdgeIdentifier(edge);
      const effectiveness = edge.active ? edge.weight : 0;
      analysis.edgeEffectiveness.set(key, effectiveness);
    }

    return analysis;
  }

  /**
   * Export edge configuration
   */
  exportEdgeConfiguration(): EdgeConfig {
    const edges = Array.from(this.edges.values()).map(edge => ({
      from: edge.from,
      to: edge.to,
      type: edge.type,
      ghostToken: edge.ghostToken?.token,
      active: edge.active
    }));

    return {
      edges,
      version: '1.0'
    };
  }

  /**
   * Import edge configuration
   */
  importEdgeConfiguration(config: EdgeConfig): void {
    for (const edgeConfig of config.edges) {
      const edgeKey = edgeConfig.type === 'ghost' && edgeConfig.ghostToken
        ? this.getGhostEdgeKey(edgeConfig.from, edgeConfig.ghostToken, edgeConfig.to)
        : this.getEdgeKey(edgeConfig.from, edgeConfig.to);

      const edge = this.edges.get(edgeKey);
      if (edge) {
        this.toggleEdgeInternal(edge, edgeConfig.active, 'import');
      }
    }
  }

  /**
   * Get edge history
   */
  getEdgeHistory(concept1: string, concept2: string): Array<{ timestamp: Date; active: boolean }> {
    const directKey = this.getEdgeKey(concept1, concept2);
    const directEdge = this.edges.get(directKey);
    
    if (directEdge) {
      return directEdge.metadata.activationHistory;
    }

    // Check ghost edges
    const ghostEdges = Array.from(this.edges.values()).filter(
      e => e.from === concept1 && e.to === concept2 && e.type === 'ghost'
    );

    if (ghostEdges.length > 0) {
      // Merge histories from all ghost edges
      const allHistory = ghostEdges.flatMap(e => e.metadata.activationHistory);
      return allHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    return [];
  }

  /**
   * Persist graph to serializable format
   */
  persist(): PersistedGraph {
    const edgeStateHistory: PersistedGraph['edgeStateHistory'] = {};
    
    for (const [key, edge] of this.edges) {
      edgeStateHistory[key] = edge.metadata.activationHistory.map(h => ({
        timestamp: h.timestamp,
        active: h.active,
        reason: undefined // Could be extended to track reason
      }));
    }

    return {
      edges: Array.from(this.edges.values()),
      version: '1.0',
      lastModified: new Date(),
      edgeStateHistory
    };
  }

  /**
   * Load from persisted format
   */
  load(persisted: PersistedGraph): void {
    this.edges.clear();
    this.adjacencyList.clear();

    for (const edge of persisted.edges) {
      const key = this.getEdgeIdentifier(edge);
      this.edges.set(key, edge);
      this.updateAdjacencyList(edge.from, edge.to);
    }
  }

  // Private helper methods

  private getEdgeKey(from: string, to: string): string {
    return from < to ? `${from}::${to}` : `${to}::${from}`;
  }

  private getGhostEdgeKey(from: string, ghost: string, to: string): string {
    return from < to 
      ? `${from}::[${ghost}]::${to}` 
      : `${to}::[${ghost}]::${from}`;
  }

  private getEdgeIdentifier(edge: Edge): string {
    return edge.type === 'ghost' && edge.ghostToken
      ? this.getGhostEdgeKey(edge.from, edge.ghostToken.token, edge.to)
      : this.getEdgeKey(edge.from, edge.to);
  }

  private updateAdjacencyList(concept1: string, concept2: string): void {
    if (!this.adjacencyList.has(concept1)) {
      this.adjacencyList.set(concept1, new Set());
    }
    if (!this.adjacencyList.has(concept2)) {
      this.adjacencyList.set(concept2, new Set());
    }
    this.adjacencyList.get(concept1)!.add(concept2);
    this.adjacencyList.get(concept2)!.add(concept1);
  }

  private toggleEdgeInternal(edge: Edge, active: boolean, reason?: string): boolean {
    if (edge.active === active) {
      return false; // No change
    }

    edge.active = active;
    edge.metadata.toggleCount++;
    edge.metadata.lastToggled = new Date();
    edge.metadata.activationHistory.push({
      timestamp: new Date(),
      active
    });

    return true;
  }

  private findPaths(
    start: string,
    current: string,
    path: string[],
    weight: number,
    visited: Set<string>,
    results: Map<string, { weight: number; path: string[]; active: boolean }>,
    threshold: number,
    includeInactive: boolean
  ): void {
    if (weight < threshold || visited.has(current)) {
      return;
    }

    visited.add(current);
    path = [...path, current];

    if (current !== start) {
      const existing = results.get(current);
      if (!existing || existing.weight < weight) {
        const isActive = this.isPathActive(path);
        if (isActive || includeInactive) {
          results.set(current, { weight, path, active: isActive });
        }
      }
    }

    // Explore neighbors
    const neighbors = this.adjacencyList.get(current) || new Set();
    for (const neighbor of neighbors) {
      const edges = this.getEdgesBetween(current, neighbor);
      for (const edge of edges) {
        if (edge.active || includeInactive) {
          const newWeight = weight * edge.weight * this.decayFactor;
          this.findPaths(start, neighbor, path, newWeight, new Set(visited), results, threshold, includeInactive);
        }
      }
    }
  }

  private getEdgesBetween(concept1: string, concept2: string): Edge[] {
    const directKey = this.getEdgeKey(concept1, concept2);
    const edges: Edge[] = [];
    
    const directEdge = this.edges.get(directKey);
    if (directEdge) {
      edges.push(directEdge);
    }

    // Find all ghost edges between these concepts
    for (const [key, edge] of this.edges) {
      if (edge.type === 'ghost' && 
          ((edge.from === concept1 && edge.to === concept2) ||
           (edge.from === concept2 && edge.to === concept1))) {
        edges.push(edge);
      }
    }

    return edges;
  }

  private isPathActive(path: string[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const edges = this.getEdgesBetween(path[i], path[i + 1]);
      if (!edges.some(e => e.active)) {
        return false;
      }
    }
    return true;
  }

  private decayEdges(): void {
    for (const edge of this.edges.values()) {
      edge.weight *= this.decayFactor;
    }
  }

  private pruneWeakEdges(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, edge] of this.edges) {
      if (edge.weight < this.minWeight) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const edge = this.edges.get(key)!;
      this.edges.delete(key);
      
      // Update adjacency list
      const neighbors1 = this.adjacencyList.get(edge.from);
      if (neighbors1) {
        neighbors1.delete(edge.to);
        if (neighbors1.size === 0) {
          this.adjacencyList.delete(edge.from);
        }
      }
      
      const neighbors2 = this.adjacencyList.get(edge.to);
      if (neighbors2) {
        neighbors2.delete(edge.from);
        if (neighbors2.size === 0) {
          this.adjacencyList.delete(edge.to);
        }
      }
    }
  }
}