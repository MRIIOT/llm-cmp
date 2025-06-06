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
    // Build network structure from evidence topics and relationships
    const topicNodes = new Map<string, Set<string>>();
    const sourceNodes = new Set<string>();
    const relationships = new Map<string, Set<string>>();
    
    // Extract topics and sources from evidence
    for (const evidence of evidenceSet) {
      // Create nodes for topics if they exist
      if (evidence.topic) {
        if (!topicNodes.has(evidence.topic)) {
          topicNodes.set(evidence.topic, new Set());
        }
        topicNodes.get(evidence.topic)!.add(evidence.source);
      }
      
      // Track sources
      sourceNodes.add(evidence.source);
      
      // Extract any additional entities from content
      const entities = this.extractEntities(evidence);
      entities.forEach(entity => {
        if (!topicNodes.has(entity)) {
          topicNodes.set(entity, new Set());
        }
        topicNodes.get(entity)!.add(evidence.source);
      });
    }
    
    // Create nodes for topics
    for (const [topicId, sources] of topicNodes.entries()) {
      this.addNode({
        id: topicId,
        name: topicId,
        states: ['true', 'false'],
        probabilities: new Map([['true', 0.5], ['false', 0.5]]),
        parents: [],
        children: []
      });
    }
    
    // Create nodes for sources (if needed for network structure)
    for (const sourceId of sourceNodes) {
      if (!this.nodes.has(sourceId)) {
        this.addNode({
          id: sourceId,
          name: sourceId,
          states: ['reliable', 'unreliable'],
          probabilities: new Map([['reliable', 0.7], ['unreliable', 0.3]]),
          parents: [],
          children: []
        });
      }
    }
    
    // Infer relationships based on shared sources or co-occurrence
    const topicList = Array.from(topicNodes.keys());
    for (let i = 0; i < topicList.length; i++) {
      for (let j = i + 1; j < topicList.length; j++) {
        const topic1 = topicList[i];
        const topic2 = topicList[j];
        const sources1 = topicNodes.get(topic1)!;
        const sources2 = topicNodes.get(topic2)!;
        
        // Check for shared sources
        const sharedSources = Array.from(sources1).filter(s => sources2.has(s));
        if (sharedSources.length > 0) {
          const key = `${topic1}-${topic2}`;
          relationships.set(key, new Set(sharedSources));
        }
      }
    }
    
    // Add edges based on relationship strength
    for (const [relationship, sources] of relationships.entries()) {
      if (sources.size >= 1) { // Even single source can establish relationship
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
    // Generic entity extraction based on content analysis
    const entities: string[] = [];
    const content = evidence.content.toLowerCase();
    
    // Extract potential entities using various patterns
    
    // 1. Extract capitalized words (potential proper nouns)
    const capitalizedWords = evidence.content.match(/\b[A-Z][a-z]+\b/g) || [];
    entities.push(...capitalizedWords.map(w => w.toLowerCase()));
    
    // 2. Extract quoted terms
    const quotedTerms = content.match(/"([^"]+)"/g) || [];
    entities.push(...quotedTerms.map(t => t.replace(/"/g, '')));
    
    // 3. Extract key phrases based on common patterns
    const keyPatterns = [
      /\b(\w+)\s+(is|are|was|were)\s+(\w+)/g,  // "X is Y" patterns
      /\b(\w+)\s+(indicates?|shows?|suggests?)\s+/g,  // indicator patterns
      /\b(positive|negative|bullish|bearish|high|low|increasing|decreasing)\b/g,  // sentiment/direction
    ];
    
    for (const pattern of keyPatterns) {
      const matches = content.match(pattern) || [];
      entities.push(...matches);
    }
    
    // 4. Extract domain-specific terms if they appear multiple times
    const words = content.split(/\s+/);
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      const cleaned = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleaned.length > 3) {  // Skip short words
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    }
    
    // Add words that appear multiple times or are notably long
    for (const [word, freq] of wordFreq.entries()) {
      if (freq > 1 || word.length > 7) {
        entities.push(word);
      }
    }
    
    // 5. If topic is specified, include related terms
    if (evidence.topic) {
      entities.push(evidence.topic);
      // Add variations of the topic
      const topicWords = evidence.topic.split(/[_\s-]+/);
      entities.push(...topicWords);
    }
    
    // Remove duplicates and filter out common words
    const commonWords = new Set(['the', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'for', 'with']);
    const uniqueEntities = Array.from(new Set(entities))
      .filter(e => e.length > 2 && !commonWords.has(e));
    
    return uniqueEntities;
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
