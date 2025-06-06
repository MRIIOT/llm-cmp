/**
 * Dynamic Bayesian Network Construction
 * Builds and manages probabilistic graphical models for evidence reasoning
 */

import { Evidence, BeliefState } from '../../types/evidence.types';

export interface BayesianNode {
  id: string;
  name: string;
  states: string[];
  probabilities: Map<string, number>;
  parents: string[];
  children: string[];
  evidence?: string;
}

export interface ConditionalProbabilityTable {
  node: string;
  conditions: Map<string, Map<string, number>>;
}

export class BayesianNetwork {
  private nodes: Map<string, BayesianNode> = new Map();
  private cpts: Map<string, ConditionalProbabilityTable> = new Map();
  private topologicalOrder: string[] = [];
  
  constructor() {
    this.initializeNetwork();
  }
  
  private initializeNetwork(): void {
    // Network will be dynamically constructed based on evidence patterns
  }
  
  /**
   * Add a node to the Bayesian network
   */
  addNode(node: BayesianNode): void {
    this.nodes.set(node.id, node);
    this.updateTopologicalOrder();
  }
  
  /**
   * Add an edge between nodes
   */
  addEdge(parentId: string, childId: string): void {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    
    if (!parent || !child) {
      throw new Error(`Invalid edge: ${parentId} -> ${childId}`);
    }
    
    parent.children.push(childId);
    child.parents.push(parentId);
    this.updateTopologicalOrder();
  }
  
  /**
   * Set conditional probability table for a node
   */
  setCPT(nodeId: string, cpt: ConditionalProbabilityTable): void {
    this.cpts.set(nodeId, cpt);
  }
  
  /**
   * Update topological ordering for efficient inference
   */
  private updateTopologicalOrder(): void {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) {
        for (const parent of node.parents) {
          visit(parent);
        }
        order.push(nodeId);
      }
    };
    
    for (const nodeId of this.nodes.keys()) {
      visit(nodeId);
    }
    
    this.topologicalOrder = order;
  }
  
  /**
   * Get the probability of a node state given parent states
   */
  getConditionalProbability(
    nodeId: string,
    state: string,
    parentStates: Map<string, string>
  ): number {
    const cpt = this.cpts.get(nodeId);
    if (!cpt) {
      // If no CPT, use node's base probabilities
      const node = this.nodes.get(nodeId);
      return node?.probabilities.get(state) || 0;
    }
    
    // Build condition key from parent states
    const conditionKey = Array.from(parentStates.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([parent, state]) => `${parent}:${state}`)
      .join('|');
    
    const conditionProbs = cpt.conditions.get(conditionKey);
    return conditionProbs?.get(state) || 0;
  }
  
  /**
   * Set evidence for a node
   */
  setEvidence(nodeId: string, state: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.evidence = state;
    }
  }
  
  /**
   * Clear all evidence from the network
   */
  clearEvidence(): void {
    for (const node of this.nodes.values()) {
      node.evidence = undefined;
    }
  }
  
  /**
   * Get all nodes in topological order
   */
  getTopologicalOrder(): string[] {
    return [...this.topologicalOrder];
  }
  
  /**
   * Get a node by ID
   */
  getNode(nodeId: string): BayesianNode | undefined {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get all nodes
   */
  getAllNodes(): BayesianNode[] {
    return Array.from(this.nodes.values());
  }
  
  /**
   * Check if network has cycles
   */
  hasCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) {
        for (const child of node.children) {
          if (!visited.has(child)) {
            if (hasCycleDFS(child)) return true;
          } else if (recursionStack.has(child)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true;
      }
    }
    
    return false;
  }
  
  /**
   * Construct network from evidence patterns
   */
  constructFromEvidence(evidenceSet: Evidence[]): void {
    // Analyze evidence patterns to build network structure
    const nodeIds = new Set<string>();
    const relationships = new Map<string, Set<string>>();
    
    // Extract entities and relationships from evidence
    for (const evidence of evidenceSet) {
      const entities = this.extractEntities(evidence);
      entities.forEach(entity => nodeIds.add(entity));
      
      // Infer relationships based on co-occurrence
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const key = `${entities[i]}-${entities[j]}`;
          if (!relationships.has(key)) {
            relationships.set(key, new Set());
          }
          relationships.get(key)!.add(evidence.source);
        }
      }
    }
    
    // Create nodes for entities
    for (const nodeId of nodeIds) {
      this.addNode({
        id: nodeId,
        name: nodeId,
        states: ['true', 'false'],
        probabilities: new Map([['true', 0.5], ['false', 0.5]]),
        parents: [],
        children: []
      });
    }
    
    // Add edges based on relationship strength
    for (const [relationship, sources] of relationships.entries()) {
      if (sources.size >= 2) { // Require multiple sources
        const [parent, child] = relationship.split('-');
        if (!this.wouldCreateCycle(parent, child)) {
          this.addEdge(parent, child);
        }
      }
    }
  }
  
  /**
   * Extract entities from evidence
   */
  private extractEntities(evidence: Evidence): string[] {
    // Simplified entity extraction - in production would use NLP
    const entities: string[] = [];
    const words = evidence.content.toLowerCase().split(/\s+/);
    
    // Look for key terms (simplified for example)
    const keyTerms = ['agent', 'consensus', 'evidence', 'belief', 'confidence'];
    for (const word of words) {
      if (keyTerms.some(term => word.includes(term))) {
        entities.push(word);
      }
    }
    
    return entities;
  }
  
  /**
   * Check if adding an edge would create a cycle
   */
  private wouldCreateCycle(parentId: string, childId: string): boolean {
    // Temporarily add edge and check for cycles
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    
    if (!parent || !child) return false;
    
    parent.children.push(childId);
    child.parents.push(parentId);
    
    const hasCycle = this.hasCycles();
    
    // Remove temporary edge
    parent.children.pop();
    child.parents.pop();
    
    return hasCycle;
  }
  
  /**
   * Get network statistics
   */
  getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
    avgConnectivity: number;
  } {
    let edgeCount = 0;
    let totalConnections = 0;
    
    for (const node of this.nodes.values()) {
      edgeCount += node.children.length;
      totalConnections += node.parents.length + node.children.length;
    }
    
    const maxDepth = this.calculateMaxDepth();
    const avgConnectivity = this.nodes.size > 0 
      ? totalConnections / this.nodes.size 
      : 0;
    
    return {
      nodeCount: this.nodes.size,
      edgeCount,
      maxDepth,
      avgConnectivity
    };
  }
  
  /**
   * Calculate maximum depth of the network
   */
  private calculateMaxDepth(): number {
    const depths = new Map<string, number>();
    
    const calculateNodeDepth = (nodeId: string): number => {
      if (depths.has(nodeId)) {
        return depths.get(nodeId)!;
      }
      
      const node = this.nodes.get(nodeId);
      if (!node || node.parents.length === 0) {
        depths.set(nodeId, 0);
        return 0;
      }
      
      let maxParentDepth = 0;
      for (const parent of node.parents) {
        maxParentDepth = Math.max(maxParentDepth, calculateNodeDepth(parent));
      }
      
      const depth = maxParentDepth + 1;
      depths.set(nodeId, depth);
      return depth;
    };
    
    let maxDepth = 0;
    for (const nodeId of this.nodes.keys()) {
      maxDepth = Math.max(maxDepth, calculateNodeDepth(nodeId));
    }
    
    return maxDepth;
  }
}
