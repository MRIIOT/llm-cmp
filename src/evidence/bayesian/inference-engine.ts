/**
 * Probabilistic Inference Engine
 * Performs exact and approximate inference on Bayesian networks
 */

import { BayesianNetwork, BayesianNode } from './bayesian-network';
import { BeliefState, InferenceResult } from '../../types/evidence.types';

interface Factor {
  variables: string[];
  values: Map<string, number>;
}

export interface InferenceQuery {
  target: string; // Node to query
  evidence: Map<string, string>; // Observed evidence
  method?: 'exact' | 'sampling' | 'variational';
}

export class InferenceEngine {
  private network: BayesianNetwork;
  private cache: Map<string, InferenceResult> = new Map();
  
  constructor(network: BayesianNetwork) {
    this.network = network;
  }
  
  /**
   * Perform inference to compute posterior probabilities
   */
  infer(query: InferenceQuery): InferenceResult {
    const cacheKey = this.getCacheKey(query);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Set evidence in network
    for (const [nodeId, state] of query.evidence.entries()) {
      this.network.setEvidence(nodeId, state);
    }
    
    let result: InferenceResult;
    
    switch (query.method || 'exact') {
      case 'exact':
        result = this.exactInference(query.target);
        break;
      case 'sampling':
        result = this.gibbsSampling(query.target);
        break;
      case 'variational':
        result = this.variationalInference(query.target);
        break;
      default:
        result = this.exactInference(query.target);
    }
    
    // Clear evidence
    this.network.clearEvidence();
    
    // Cache result
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Exact inference using variable elimination
   */
  private exactInference(targetNodeId: string): InferenceResult {
    const targetNode = this.network.getNode(targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }
    
    // For simple case with no intermediate nodes, use Bayes' rule directly
    const evidence = this.getEvidenceNodes();
    
    if (evidence.length === 1 && this.isSimpleNetwork(targetNodeId, evidence[0].id)) {
      // Direct Bayes' rule: P(A|B) = P(B|A) * P(A) / P(B)
      return this.bayesianInference(targetNodeId, evidence[0]);
    }
    
    // For complex networks, use variable elimination
    const allNodes = this.network.getAllNodes();
    const eliminationOrder = this.getEliminationOrder(targetNodeId);
    
    // Initialize factors from CPTs
    const factors = this.createFactorsFromNetwork();
    
    // Apply evidence
    this.applyEvidence(factors);
    
    // Eliminate variables
    for (const nodeId of eliminationOrder) {
      if (nodeId !== targetNodeId && !this.hasEvidence(nodeId)) {
        this.eliminateVariableFromFactors(nodeId, factors);
      }
    }
    
    // Combine remaining factors
    const targetFactor = this.combineFactorsForNode(targetNodeId, factors);
    
    // Normalize to get posterior
    const posterior = this.normalizeFactor(targetFactor);
    
    return {
      nodeId: targetNodeId,
      posterior,
      confidence: this.calculateConfidence(posterior),
      method: 'exact'
    };
  }
  
  /**
   * Direct Bayesian inference for simple networks
   */
  private bayesianInference(targetNodeId: string, evidenceNode: BayesianNode): InferenceResult {
    const targetNode = this.network.getNode(targetNodeId)!;
    const posterior = new Map<string, number>();
    
    // Calculate P(evidence) using law of total probability
    let evidenceProb = 0;
    for (const targetState of targetNode.states) {
      const prior = targetNode.probabilities.get(targetState) || 0;
      const likelihood = this.network.getConditionalProbability(
        evidenceNode.id,
        evidenceNode.evidence!,
        new Map([[targetNodeId, targetState]])
      );
      evidenceProb += likelihood * prior;
    }
    
    // Calculate posterior for each state of target
    for (const targetState of targetNode.states) {
      const prior = targetNode.probabilities.get(targetState) || 0;
      const likelihood = this.network.getConditionalProbability(
        evidenceNode.id,
        evidenceNode.evidence!,
        new Map([[targetNodeId, targetState]])
      );
      
      // Bayes' rule: P(target|evidence) = P(evidence|target) * P(target) / P(evidence)
      const posteriorProb = (likelihood * prior) / evidenceProb;
      posterior.set(targetState, posteriorProb);
    }
    
    return {
      nodeId: targetNodeId,
      posterior,
      confidence: this.calculateConfidence(posterior),
      method: 'exact'
    };
  }
  
  /**
   * Check if network is simple (direct parent-child relationship)
   */
  private isSimpleNetwork(nodeA: string, nodeB: string): boolean {
    const a = this.network.getNode(nodeA)!;
    const b = this.network.getNode(nodeB)!;
    
    return (a.children.includes(nodeB) && b.parents.includes(nodeA)) ||
           (b.children.includes(nodeA) && a.parents.includes(nodeB));
  }
  
  /**
   * Get nodes with evidence set
   */
  private getEvidenceNodes(): BayesianNode[] {
    return this.network.getAllNodes().filter(node => node.evidence !== undefined);
  }
  
  /**
   * Check if node has evidence
   */
  private hasEvidence(nodeId: string): boolean {
    const node = this.network.getNode(nodeId);
    return node?.evidence !== undefined;
  }
  
  /**
   * Create factors from network structure and CPTs
   */
  private createFactorsFromNetwork(): Map<string, Factor> {
    const factors = new Map<string, Factor>();
    
    for (const node of this.network.getAllNodes()) {
      const factor: Factor = {
        variables: [node.id, ...node.parents],
        values: new Map()
      };
      
      // Build factor from CPT or prior
      if (node.parents.length === 0) {
        // Prior probabilities
        for (const state of node.states) {
          factor.values.set(state, node.probabilities.get(state) || 0);
        }
      } else {
        // Conditional probabilities
        const parentCombinations = this.generateStateCombinations(node.parents);
        for (const parentCombo of parentCombinations) {
          const parentStates = new Map<string, string>();
          node.parents.forEach((parent, i) => {
            parentStates.set(parent, parentCombo[i]);
          });
          
          for (const state of node.states) {
            const key = [state, ...parentCombo].join(',');
            const prob = this.network.getConditionalProbability(node.id, state, parentStates);
            factor.values.set(key, prob);
          }
        }
      }
      
      factors.set(node.id, factor);
    }
    
    return factors;
  }
  
  /**
   * Apply evidence to factors
   */
  private applyEvidence(factors: Map<string, Factor>): void {
    for (const node of this.getEvidenceNodes()) {
      const factor = factors.get(node.id);
      if (!factor) continue;
      
      // Zero out entries inconsistent with evidence
      for (const [key, value] of factor.values.entries()) {
        const states = key.split(',');
        if (states[0] !== node.evidence) {
          factor.values.set(key, 0);
        }
      }
    }
  }
  
  /**
   * Eliminate a variable from factors
   */
  private eliminateVariableFromFactors(nodeId: string, factors: Map<string, Factor>): void {
    // Find all factors containing this variable
    const relevantFactors: Factor[] = [];
    const remainingFactors: Factor[] = [];
    
    for (const [id, factor] of factors.entries()) {
      if (factor.variables.includes(nodeId)) {
        relevantFactors.push(factor);
        factors.delete(id);
      } else {
        remainingFactors.push(factor);
      }
    }
    
    if (relevantFactors.length === 0) return;
    
    // Multiply relevant factors
    let combined = relevantFactors[0];
    for (let i = 1; i < relevantFactors.length; i++) {
      combined = this.multiplyFactors(combined, relevantFactors[i]);
    }
    
    // Sum out the variable
    const summed = this.sumOutVariable(combined, nodeId);
    
    // Add back to factors
    factors.set(`eliminated_${nodeId}`, summed);
  }
  
  /**
   * Multiply two factors
   */
  private multiplyFactors(f1: Factor, f2: Factor): Factor {
    const resultVars = Array.from(new Set([...f1.variables, ...f2.variables]));
    const result: Factor = {
      variables: resultVars,
      values: new Map()
    };
    
    // For each assignment to result variables
    const assignments = this.generateAssignments(resultVars);
    for (const assignment of assignments) {
      const assignMap = new Map(resultVars.map((v, i) => [v, assignment[i]]));
      
      // Get values from both factors
      const val1 = this.getFactorValue(f1, assignMap);
      const val2 = this.getFactorValue(f2, assignMap);
      
      result.values.set(assignment.join(','), val1 * val2);
    }
    
    return result;
  }
  
  /**
   * Sum out a variable from a factor
   */
  private sumOutVariable(factor: Factor, variable: string): Factor {
    const newVars = factor.variables.filter(v => v !== variable);
    const result: Factor = {
      variables: newVars,
      values: new Map()
    };
    
    const varIndex = factor.variables.indexOf(variable);
    const node = this.network.getNode(variable)!;
    
    // Group entries by assignments to remaining variables
    const groups = new Map<string, number>();
    
    for (const [key, value] of factor.values.entries()) {
      const states = key.split(',');
      states.splice(varIndex, 1);
      const newKey = states.join(',');
      
      groups.set(newKey, (groups.get(newKey) || 0) + value);
    }
    
    result.values = groups;
    return result;
  }
  
  /**
   * Get factor value for a given assignment
   */
  private getFactorValue(factor: Factor, assignment: Map<string, string>): number {
    const key = factor.variables.map(v => assignment.get(v)).join(',');
    return factor.values.get(key) || 0;
  }
  
  /**
   * Generate all possible assignments to variables
   */
  private generateAssignments(variables: string[]): string[][] {
    if (variables.length === 0) return [[]];
    
    const [first, ...rest] = variables;
    const node = this.network.getNode(first)!;
    const restAssignments = this.generateAssignments(rest);
    
    const result: string[][] = [];
    for (const state of node.states) {
      for (const restAssign of restAssignments) {
        result.push([state, ...restAssign]);
      }
    }
    
    return result;
  }
  
  /**
   * Combine factors for a specific node
   */
  private combineFactorsForNode(nodeId: string, factors: Map<string, Factor>): Map<string, number> {
    const node = this.network.getNode(nodeId)!;
    const relevantFactors: Factor[] = [];
    
    for (const factor of factors.values()) {
      if (factor.variables.includes(nodeId)) {
        relevantFactors.push(factor);
      }
    }
    
    if (relevantFactors.length === 0) {
      // Return uniform distribution
      const uniform = new Map<string, number>();
      const prob = 1.0 / node.states.length;
      for (const state of node.states) {
        uniform.set(state, prob);
      }
      return uniform;
    }
    
    // Combine factors and marginalize to target node
    let combined = relevantFactors[0];
    for (let i = 1; i < relevantFactors.length; i++) {
      combined = this.multiplyFactors(combined, relevantFactors[i]);
    }
    
    // Extract distribution for target node
    const result = new Map<string, number>();
    const targetIndex = combined.variables.indexOf(nodeId);
    
    for (const state of node.states) {
      let sum = 0;
      for (const [key, value] of combined.values.entries()) {
        const states = key.split(',');
        if (states[targetIndex] === state) {
          sum += value;
        }
      }
      result.set(state, sum);
    }
    
    return result;
  }
  
  /**
   * Approximate inference using Gibbs sampling
   */
  private gibbsSampling(targetNodeId: string, iterations: number = 10000): InferenceResult {
    const targetNode = this.network.getNode(targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }
    
    // Initialize random state
    const currentState = this.initializeRandomState();
    
    // Apply evidence
    for (const node of this.network.getAllNodes()) {
      if (node.evidence) {
        currentState.set(node.id, node.evidence);
      }
    }
    
    // Collect samples
    const samples: string[] = [];
    const burnIn = Math.floor(iterations * 0.1);
    
    for (let i = 0; i < iterations; i++) {
      // Sample each non-evidence variable
      for (const node of this.network.getAllNodes()) {
        if (!node.evidence) {
          const newState = this.sampleNode(node, currentState);
          currentState.set(node.id, newState);
        }
      }
      
      // Collect sample after burn-in
      if (i >= burnIn) {
        samples.push(currentState.get(targetNodeId)!);
      }
    }
    
    // Compute posterior from samples
    const posterior = this.computePosteriorFromSamples(targetNode, samples);
    
    return {
      nodeId: targetNodeId,
      posterior,
      confidence: this.calculateConfidence(posterior),
      method: 'sampling',
      samples: samples.length
    };
  }
  
  /**
   * Approximate inference using variational methods
   */
  private variationalInference(targetNodeId: string): InferenceResult {
    const targetNode = this.network.getNode(targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }
    
    // Initialize variational parameters
    const variationalParams = this.initializeVariationalParams();
    
    // Optimize variational parameters
    const maxIterations = 100;
    let converged = false;
    
    for (let iter = 0; iter < maxIterations && !converged; iter++) {
      const oldParams = new Map(variationalParams);
      
      // Update each node's variational parameters
      for (const node of this.network.getAllNodes()) {
        if (!node.evidence) {
          this.updateVariationalParams(node, variationalParams);
        }
      }
      
      // Check convergence
      converged = this.checkConvergence(oldParams, variationalParams);
    }
    
    // Extract posterior for target
    const posterior = variationalParams.get(targetNodeId)!;
    
    return {
      nodeId: targetNodeId,
      posterior,
      confidence: this.calculateConfidence(posterior),
      method: 'variational',
      converged
    };
  }
  
  /**
   * Initialize factors for exact inference
   */
  private initializeFactors(): Map<string, Map<string, number>> {
    const factors = new Map<string, Map<string, number>>();
    
    for (const node of this.network.getAllNodes()) {
      const factor = new Map<string, number>();
      
      // Initialize with CPT or prior probabilities
      for (const state of node.states) {
        if (node.parents.length === 0) {
          factor.set(state, node.probabilities.get(state) || 0);
        } else {
          // For nodes with parents, we'll compute during elimination
          factor.set(state, 1.0);
        }
      }
      
      factors.set(node.id, factor);
    }
    
    return factors;
  }
  
  /**
   * Apply evidence to factors
   */
  private applyEvidenceToFactors(factors: Map<string, Map<string, number>>): void {
    for (const node of this.network.getAllNodes()) {
      if (node.evidence) {
        const factor = factors.get(node.id)!;
        for (const state of node.states) {
          factor.set(state, state === node.evidence ? 1.0 : 0.0);
        }
      }
    }
  }
  
  /**
   * Eliminate a variable from factors
   */
  private eliminateVariable(
    nodeId: string,
    factors: Map<string, Map<string, number>>
  ): void {
    // Sum out the variable
    const node = this.network.getNode(nodeId)!;
    const factor = factors.get(nodeId)!;
    
    // Marginalize over this variable
    let sum = 0;
    for (const state of node.states) {
      sum += factor.get(state) || 0;
    }
    
    // Update factors that depend on this variable
    for (const child of node.children) {
      const childFactor = factors.get(child)!;
      // Simplified - in full implementation would properly handle factor multiplication
      for (const [state, prob] of childFactor.entries()) {
        childFactor.set(state, prob * (sum / node.states.length));
      }
    }
    
    factors.delete(nodeId);
  }
  
  /**
   * Get elimination order using min-fill heuristic
   */
  private getEliminationOrder(targetNodeId: string): string[] {
    const nodes = this.network.getAllNodes()
      .filter(n => n.id !== targetNodeId && !n.evidence)
      .map(n => n.id);
    
    // Simple heuristic: eliminate nodes with fewer connections first
    return nodes.sort((a, b) => {
      const nodeA = this.network.getNode(a)!;
      const nodeB = this.network.getNode(b)!;
      const connectionsA = nodeA.parents.length + nodeA.children.length;
      const connectionsB = nodeB.parents.length + nodeB.children.length;
      return connectionsA - connectionsB;
    });
  }
  
  /**
   * Sample a node given markov blanket
   */
  private sampleNode(
    node: BayesianNode,
    currentState: Map<string, string>
  ): string {
    // Compute probability of each state given markov blanket
    const probs = new Map<string, number>();
    
    for (const state of node.states) {
      // Get parent states
      const parentStates = new Map<string, string>();
      for (const parent of node.parents) {
        parentStates.set(parent, currentState.get(parent)!);
      }
      
      // Compute probability
      let prob = this.network.getConditionalProbability(node.id, state, parentStates);
      
      // Include children in markov blanket
      for (const childId of node.children) {
        const child = this.network.getNode(childId)!;
        const childState = currentState.get(childId)!;
        
        const childParentStates = new Map<string, string>();
        for (const parent of child.parents) {
          if (parent === node.id) {
            childParentStates.set(parent, state);
          } else {
            childParentStates.set(parent, currentState.get(parent)!);
          }
        }
        
        prob *= this.network.getConditionalProbability(childId, childState, childParentStates);
      }
      
      probs.set(state, prob);
    }
    
    // Normalize and sample
    return this.sampleFromDistribution(probs);
  }
  
  /**
   * Sample from a probability distribution
   */
  private sampleFromDistribution(probs: Map<string, number>): string {
    const total = Array.from(probs.values()).reduce((a, b) => a + b, 0);
    const normalized = new Map<string, number>();
    
    for (const [state, prob] of probs.entries()) {
      normalized.set(state, prob / total);
    }
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const [state, prob] of normalized.entries()) {
      cumulative += prob;
      if (random <= cumulative) {
        return state;
      }
    }
    
    return Array.from(probs.keys())[0];
  }
  
  /**
   * Initialize random state for sampling
   */
  private initializeRandomState(): Map<string, string> {
    const state = new Map<string, string>();
    
    for (const node of this.network.getAllNodes()) {
      const randomIndex = Math.floor(Math.random() * node.states.length);
      state.set(node.id, node.states[randomIndex]);
    }
    
    return state;
  }
  
  /**
   * Compute posterior from samples
   */
  private computePosteriorFromSamples(
    node: BayesianNode,
    samples: string[]
  ): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const state of node.states) {
      counts.set(state, 0);
    }
    
    for (const sample of samples) {
      counts.set(sample, (counts.get(sample) || 0) + 1);
    }
    
    const posterior = new Map<string, number>();
    for (const [state, count] of counts.entries()) {
      posterior.set(state, count / samples.length);
    }
    
    return posterior;
  }
  
  /**
   * Initialize variational parameters
   */
  private initializeVariationalParams(): Map<string, Map<string, number>> {
    const params = new Map<string, Map<string, number>>();
    
    for (const node of this.network.getAllNodes()) {
      const nodeParams = new Map<string, number>();
      
      if (node.evidence) {
        // Evidence nodes have fixed parameters
        for (const state of node.states) {
          nodeParams.set(state, state === node.evidence ? 1.0 : 0.0);
        }
      } else {
        // Initialize with uniform distribution
        for (const state of node.states) {
          nodeParams.set(state, 1.0 / node.states.length);
        }
      }
      
      params.set(node.id, nodeParams);
    }
    
    return params;
  }
  
  /**
   * Update variational parameters for a node
   */
  private updateVariationalParams(
    node: BayesianNode,
    params: Map<string, Map<string, number>>
  ): void {
    const newParams = new Map<string, number>();
    
    for (const state of node.states) {
      let logProb = 0;
      
      // Parent contribution
      if (node.parents.length > 0) {
        const parentStates = new Map<string, string>();
        // Use expected values from variational params
        for (const parent of node.parents) {
          const parentParams = params.get(parent)!;
          // Use most likely state as approximation
          let maxProb = 0;
          let maxState = '';
          for (const [s, p] of parentParams.entries()) {
            if (p > maxProb) {
              maxProb = p;
              maxState = s;
            }
          }
          parentStates.set(parent, maxState);
        }
        
        logProb += Math.log(this.network.getConditionalProbability(node.id, state, parentStates));
      }
      
      // Children contribution
      for (const childId of node.children) {
        const child = this.network.getNode(childId)!;
        const childParams = params.get(childId)!;
        
        for (const [childState, childProb] of childParams.entries()) {
          const parentStates = new Map<string, string>();
          parentStates.set(node.id, state);
          
          logProb += childProb * Math.log(
            this.network.getConditionalProbability(childId, childState, parentStates)
          );
        }
      }
      
      newParams.set(state, Math.exp(logProb));
    }
    
    // Normalize
    const normalized = this.normalizeFactor(newParams);
    params.set(node.id, normalized);
  }
  
  /**
   * Check convergence of variational parameters
   */
  private checkConvergence(
    oldParams: Map<string, Map<string, number>>,
    newParams: Map<string, Map<string, number>>,
    threshold: number = 0.001
  ): boolean {
    for (const [nodeId, nodeParams] of newParams.entries()) {
      const oldNodeParams = oldParams.get(nodeId)!;
      
      for (const [state, prob] of nodeParams.entries()) {
        const oldProb = oldNodeParams.get(state) || 0;
        if (Math.abs(prob - oldProb) > threshold) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Normalize a factor
   */
  private normalizeFactor(factor: Map<string, number>): Map<string, number> {
    const sum = Array.from(factor.values()).reduce((a, b) => a + b, 0);
    const normalized = new Map<string, number>();
    
    if (sum > 0) {
      for (const [state, prob] of factor.entries()) {
        normalized.set(state, prob / sum);
      }
    } else {
      // Uniform if sum is 0
      const uniform = 1.0 / factor.size;
      for (const state of factor.keys()) {
        normalized.set(state, uniform);
      }
    }
    
    return normalized;
  }
  
  /**
   * Calculate confidence from posterior distribution
   */
  private calculateConfidence(posterior: Map<string, number>): number {
    // Use entropy-based confidence
    let entropy = 0;
    
    for (const prob of posterior.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    const maxEntropy = Math.log2(posterior.size);
    const confidence = 1 - (entropy / maxEntropy);
    
    return confidence;
  }
  
  /**
   * Get cache key for query
   */
  private getCacheKey(query: InferenceQuery): string {
    const evidenceStr = Array.from(query.evidence.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return `${query.target}|${evidenceStr}|${query.method || 'exact'}`;
  }
  
  /**
   * Clear inference cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get marginal probability for a node
   */
  getMarginal(nodeId: string): Map<string, number> {
    const result = this.infer({
      target: nodeId,
      evidence: new Map(),
      method: 'exact'
    });
    
    return result.posterior;
  }
  
  /**
   * Compute joint probability for multiple nodes
   */
  computeJoint(nodeIds: string[]): Map<string, number> {
    // For simplicity, compute product of marginals
    // In full implementation would compute true joint
    const joint = new Map<string, number>();
    const marginals = nodeIds.map(id => this.getMarginal(id));
    
    // Generate all combinations
    const combinations = this.generateStateCombinations(nodeIds);
    
    for (const combo of combinations) {
      let prob = 1.0;
      for (let i = 0; i < nodeIds.length; i++) {
        prob *= marginals[i].get(combo[i]) || 0;
      }
      joint.set(combo.join(','), prob);
    }
    
    return joint;
  }
  
  /**
   * Generate all state combinations for nodes
   */
  private generateStateCombinations(nodeIds: string[]): string[][] {
    const nodes = nodeIds.map(id => this.network.getNode(id)!);
    const combinations: string[][] = [];
    
    const generate = (index: number, current: string[]): void => {
      if (index === nodes.length) {
        combinations.push([...current]);
        return;
      }
      
      for (const state of nodes[index].states) {
        current.push(state);
        generate(index + 1, current);
        current.pop();
      }
    };
    
    generate(0, []);
    return combinations;
  }
}
