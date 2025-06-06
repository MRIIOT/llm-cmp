/**
 * Dynamic Belief State Updater
 * Updates and maintains belief states over time
 */

import { Evidence, BeliefState, BeliefUpdate } from '../../types/evidence.types';
import { BayesianNetwork, BayesianNode } from './bayesian-network';
import { InferenceEngine } from './inference-engine';

export interface UpdatePolicy {
  method: 'bayesian' | 'jeffrey' | 'pearl' | 'minimal-change';
  learningRate: number;
  momentum: number;
  adaptiveLearning: boolean;
}

export interface BeliefHistory {
  timestamp: Date;
  belief: number;
  uncertainty: number;
  updateType: string;
  evidence?: Evidence;
}

export class BeliefUpdater {
  private beliefs: Map<string, BeliefState> = new Map();
  private history: Map<string, BeliefHistory[]> = new Map();
  private network: BayesianNetwork;
  private inferenceEngine: InferenceEngine;
  private updatePolicy: UpdatePolicy;
  
  constructor(policy: UpdatePolicy) {
    this.updatePolicy = policy;
    this.network = new BayesianNetwork();
    this.inferenceEngine = new InferenceEngine(this.network);
  }
  
  /**
   * Update belief state with new evidence
   */
  updateBelief(
    topic: string,
    evidence: Evidence,
    context?: Map<string, any>
  ): BeliefUpdate {
    const currentBelief = this.beliefs.get(topic) || this.initializeBelief(topic);
    const startTime = Date.now();
    
    let newBelief: BeliefState;
    
    switch (this.updatePolicy.method) {
      case 'bayesian':
        newBelief = this.bayesianUpdate(currentBelief, evidence, context);
        break;
      case 'jeffrey':
        newBelief = this.jeffreyUpdate(currentBelief, evidence, context);
        break;
      case 'pearl':
        newBelief = this.pearlUpdate(currentBelief, evidence, context);
        break;
      case 'minimal-change':
        newBelief = this.minimalChangeUpdate(currentBelief, evidence, context);
        break;
      default:
        newBelief = this.bayesianUpdate(currentBelief, evidence, context);
    }
    
    // Apply learning rate and momentum
    newBelief = this.applyLearningDynamics(currentBelief, newBelief);
    
    // Store updated belief
    this.beliefs.set(topic, newBelief);
    
    // Record history
    this.recordHistory(topic, newBelief, evidence, this.updatePolicy.method);
    
    // Compute update metrics
    const updateMetrics = this.computeUpdateMetrics(currentBelief, newBelief);
    
    return {
      topic,
      previousBelief: currentBelief,
      newBelief,
      evidence,
      updateMethod: this.updatePolicy.method,
      confidence: this.computeUpdateConfidence(newBelief, updateMetrics),
      impact: updateMetrics.impact,
      processingTime: Date.now() - startTime
    };
  }
  
  /**
   * Batch update multiple beliefs
   */
  batchUpdate(updates: Array<{ topic: string; evidence: Evidence }>): BeliefUpdate[] {
    const results: BeliefUpdate[] = [];
    
    // Build joint update network
    const allEvidence = updates.map(u => u.evidence);
    this.network.constructFromEvidence(allEvidence);
    
    // Perform coordinated updates
    for (const update of updates) {
      const result = this.updateBelief(update.topic, update.evidence);
      results.push(result);
    }
    
    // Propagate belief changes
    this.propagateBeliefChanges(results);
    
    return results;
  }
  
  /**
   * Bayesian belief update
   */
  private bayesianUpdate(
    current: BeliefState,
    evidence: Evidence,
    context?: Map<string, any>
  ): BeliefState {
    // For evidence with confidence c:
    // If c > 0.5, evidence supports hypothesis
    // If c < 0.5, evidence opposes hypothesis
    
    const prior = current.belief;
    
    // Likelihood P(E|H=true): How likely is this evidence if hypothesis is true
    // If evidence supports (c > 0.5), then P(E|H=true) = c
    // If evidence opposes (c < 0.5), then P(E|H=true) = 1-c
    const likelihoodTrue = evidence.confidence;
    
    // P(E|H=false): How likely is this evidence if hypothesis is false
    const likelihoodFalse = 1 - evidence.confidence;
    
    // Compute marginal likelihood P(E)
    const marginalLikelihood = likelihoodTrue * prior + likelihoodFalse * (1 - prior);
    
    // Bayesian update: P(H|E) = P(E|H) * P(H) / P(E)
    const posterior = (likelihoodTrue * prior) / marginalLikelihood;
    
    // Adjust for source reliability
    const sourceReliability = this.estimateSourceReliability(evidence.source);
    const adjustedPosterior = prior + (posterior - prior) * sourceReliability;
    
    // Update uncertainty
    const uncertainty = this.updateUncertainty(
      current.uncertainty,
      evidence.confidence,
      sourceReliability
    );
    
    // Update posterior distribution if available
    let posteriorDist: Map<string, number> | undefined;
    if (current.posterior) {
      posteriorDist = this.updatePosteriorDistribution(
        current.posterior,
        evidence,
        likelihoodTrue
      );
    }
    
    return {
      belief: Math.max(0, Math.min(1, adjustedPosterior)),
      uncertainty,
      evidence: [...(current.evidence || []), evidence],
      posterior: posteriorDist,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Jeffrey's rule update
   */
  private jeffreyUpdate(
    current: BeliefState,
    evidence: Evidence,
    context?: Map<string, any>
  ): BeliefState {
    // Jeffrey's rule for uncertain evidence
    const evidenceStates = this.extractEvidenceStates(evidence);
    let newBelief = 0;
    
    for (const [state, prob] of evidenceStates.entries()) {
      const conditionalBelief = this.computeConditionalBelief(current, state);
      newBelief += prob * conditionalBelief;
    }
    
    // Update uncertainty based on evidence uncertainty
    const evidenceUncertainty = this.computeEvidenceUncertainty(evidenceStates);
    const uncertainty = Math.sqrt(
      Math.pow(current.uncertainty, 2) + Math.pow(evidenceUncertainty, 2)
    );
    
    return {
      belief: newBelief,
      uncertainty,
      evidence: [...(current.evidence || []), evidence],
      lastUpdated: new Date()
    };
  }
  
  /**
   * Pearl's belief propagation update
   */
  private pearlUpdate(
    current: BeliefState,
    evidence: Evidence,
    context?: Map<string, any>
  ): BeliefState {
    // Add evidence to network
    const evidenceNode = this.addEvidenceToNetwork(evidence);
    
    // Set evidence
    this.network.setEvidence(evidenceNode.id, 'observed');
    
    // Perform belief propagation
    const query = {
      target: evidence.topic || 'belief',
      evidence: new Map([[evidenceNode.id, 'observed']]),
      method: 'exact' as const
    };
    
    const result = this.inferenceEngine.infer(query);
    
    // Extract belief from posterior
    const belief = result.posterior.get('true') || current.belief;
    
    return {
      belief,
      uncertainty: 1 - result.confidence,
      evidence: [...(current.evidence || []), evidence],
      posterior: result.posterior,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Minimal change update
   */
  private minimalChangeUpdate(
    current: BeliefState,
    evidence: Evidence,
    context?: Map<string, any>
  ): BeliefState {
    // Compute minimal change needed to accommodate evidence
    const targetBelief = evidence.confidence;
    const currentBelief = current.belief;
    
    // Minimize KL divergence between old and new beliefs
    const alpha = this.computeMinimalChangeAlpha(currentBelief, targetBelief);
    const newBelief = currentBelief + alpha * (targetBelief - currentBelief);
    
    // Minimal uncertainty update
    const uncertaintyChange = Math.abs(alpha) * 0.1;
    const uncertainty = current.uncertainty + uncertaintyChange;
    
    return {
      belief: newBelief,
      uncertainty: Math.min(1, uncertainty),
      evidence: [...(current.evidence || []), evidence],
      lastUpdated: new Date()
    };
  }
  
  /**
   * Apply learning rate and momentum
   */
  private applyLearningDynamics(
    current: BeliefState,
    proposed: BeliefState
  ): BeliefState {
    const learningRate = this.updatePolicy.adaptiveLearning
      ? this.computeAdaptiveLearningRate(current, proposed)
      : this.updatePolicy.learningRate;
    
    // Apply momentum if history available
    const history = this.history.get(current.evidence?.[0]?.topic || '');
    let momentum = 0;
    
    if (history && history.length > 1) {
      const recent = history.slice(-2);
      momentum = (recent[1].belief - recent[0].belief) * this.updatePolicy.momentum;
    }
    
    // Update with learning rate and momentum
    const newBelief = current.belief + 
      learningRate * (proposed.belief - current.belief) + 
      momentum;
    
    return {
      ...proposed,
      belief: Math.max(0, Math.min(1, newBelief))
    };
  }
  
  /**
   * Compute likelihood of evidence given current belief
   */
  private computeLikelihood(evidence: Evidence, belief: BeliefState): number {
    // P(E|H) - likelihood of seeing this evidence given hypothesis is true
    
    // If evidence supports hypothesis (high confidence), and we believe hypothesis (high belief),
    // then likelihood is high
    // If evidence opposes hypothesis (low confidence), and we believe hypothesis (high belief),
    // then likelihood is low
    
    // For confirming evidence: P(E|H=true) = evidence.confidence
    // This represents how likely we are to see this evidence if the hypothesis is true
    const likelihood = evidence.confidence;
    
    // Adjust for source reliability
    const sourceReliability = this.estimateSourceReliability(evidence.source);
    
    return likelihood * sourceReliability;
  }
  
  /**
   * Compute marginal likelihood
   */
  private computeMarginalLikelihood(
    evidence: Evidence,
    context?: Map<string, any>
  ): number {
    // P(E) - probability of seeing this evidence regardless of hypothesis
    
    // Use context if available
    if (context && context.has('marginal_likelihood')) {
      return context.get('marginal_likelihood');
    }
    
    // For binary hypothesis (true/false), compute total probability
    // P(E) = P(E|H=true) * P(H=true) + P(E|H=false) * P(H=false)
    
    // Assume uniform prior if no belief exists
    const priorTrue = 0.5;
    const priorFalse = 0.5;
    
    // P(E|H=true) - evidence aligns with hypothesis
    const likelihoodGivenTrue = evidence.confidence;
    
    // P(E|H=false) - evidence contradicts hypothesis  
    const likelihoodGivenFalse = 1 - evidence.confidence;
    
    // Total probability
    const marginal = likelihoodGivenTrue * priorTrue + likelihoodGivenFalse * priorFalse;
    
    // Ensure non-zero to avoid division by zero
    return Math.max(0.01, marginal);
  }
  
  /**
   * Update uncertainty based on new evidence
   */
  private updateUncertainty(
    currentUncertainty: number,
    evidenceConfidence: number,
    likelihood: number
  ): number {
    // Reduce uncertainty with high-confidence, high-likelihood evidence
    const reductionFactor = evidenceConfidence * likelihood;
    const newUncertainty = currentUncertainty * (1 - reductionFactor * 0.3);
    
    // Ensure minimum uncertainty
    return Math.max(0.05, newUncertainty);
  }
  
  /**
   * Update posterior distribution
   */
  private updatePosteriorDistribution(
    current: Map<string, number>,
    evidence: Evidence,
    likelihood: number
  ): Map<string, number> {
    const updated = new Map<string, number>();
    
    // Update each hypothesis
    for (const [hypothesis, prior] of current.entries()) {
      const posterior = (likelihood * prior) / this.computeNormalizationConstant(current, likelihood);
      updated.set(hypothesis, posterior);
    }
    
    return updated;
  }
  
  /**
   * Extract evidence states for Jeffrey's rule
   */
  private extractEvidenceStates(evidence: Evidence): Map<string, number> {
    const states = new Map<string, number>();
    
    // Simple binary partition based on confidence
    states.set('supports', evidence.confidence);
    states.set('opposes', 1 - evidence.confidence);
    
    // Add uncertainty state if significant
    if (evidence.confidence > 0.3 && evidence.confidence < 0.7) {
      states.set('uncertain', 0.2);
      // Normalize
      states.set('supports', evidence.confidence * 0.8);
      states.set('opposes', (1 - evidence.confidence) * 0.8);
    }
    
    return states;
  }
  
  /**
   * Compute conditional belief
   */
  private computeConditionalBelief(belief: BeliefState, condition: string): number {
    if (belief.posterior) {
      return belief.posterior.get(condition) || belief.belief;
    }
    
    // Simple conditional based on condition type
    switch (condition) {
      case 'supports':
        return Math.min(1, belief.belief * 1.5);
      case 'opposes':
        return Math.max(0, belief.belief * 0.5);
      case 'uncertain':
        return belief.belief;
      default:
        return belief.belief;
    }
  }
  
  /**
   * Compute evidence uncertainty
   */
  private computeEvidenceUncertainty(states: Map<string, number>): number {
    // Entropy-based uncertainty
    let entropy = 0;
    
    for (const prob of states.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    // Normalize to [0, 1]
    const maxEntropy = Math.log2(states.size);
    return entropy / maxEntropy;
  }
  
  /**
   * Add evidence to Bayesian network
   */
  private addEvidenceToNetwork(evidence: Evidence): BayesianNode {
    const nodeId = `evidence_${Date.now()}`;
    
    const node: BayesianNode = {
      id: nodeId,
      name: evidence.source,
      states: ['observed', 'not_observed'],
      probabilities: new Map([
        ['observed', evidence.confidence],
        ['not_observed', 1 - evidence.confidence]
      ]),
      parents: [],
      children: []
    };
    
    this.network.addNode(node);
    
    // Connect to relevant belief nodes
    const beliefNode = this.network.getNode(evidence.topic || 'belief');
    if (beliefNode) {
      this.network.addEdge(beliefNode.id, nodeId);
    }
    
    return node;
  }
  
  /**
   * Compute minimal change alpha
   */
  private computeMinimalChangeAlpha(current: number, target: number): number {
    // Minimize KL divergence
    const diff = target - current;
    
    // Use sigmoid to smooth large changes
    const alpha = 2 / (1 + Math.exp(-2 * diff)) - 1;
    
    return alpha * 0.5; // Conservative update
  }
  
  /**
   * Compute adaptive learning rate
   */
  private computeAdaptiveLearningRate(
    current: BeliefState,
    proposed: BeliefState
  ): number {
    const beliefChange = Math.abs(proposed.belief - current.belief);
    const uncertaintyRatio = proposed.uncertainty / (current.uncertainty + 0.01);
    
    // Larger changes with lower uncertainty get smaller learning rates
    let rate = this.updatePolicy.learningRate;
    
    if (beliefChange > 0.5) {
      rate *= 0.5; // Conservative for large changes
    }
    
    if (uncertaintyRatio < 0.5) {
      rate *= 1.5; // More aggressive when uncertainty decreases
    }
    
    return Math.max(0.01, Math.min(1.0, rate));
  }
  
  /**
   * Initialize belief state
   */
  private initializeBelief(topic: string): BeliefState {
    return {
      belief: 0.5, // Uninformative prior
      uncertainty: 0.5,
      evidence: [],
      lastUpdated: new Date()
    };
  }
  
  /**
   * Record belief history
   */
  private recordHistory(
    topic: string,
    belief: BeliefState,
    evidence: Evidence,
    updateType: string
  ): void {
    if (!this.history.has(topic)) {
      this.history.set(topic, []);
    }
    
    this.history.get(topic)!.push({
      timestamp: new Date(),
      belief: belief.belief,
      uncertainty: belief.uncertainty,
      updateType,
      evidence
    });
    
    // Limit history size
    const maxHistory = 1000;
    const history = this.history.get(topic)!;
    if (history.length > maxHistory) {
      history.splice(0, history.length - maxHistory);
    }
  }
  
  /**
   * Compute update metrics
   */
  private computeUpdateMetrics(
    previous: BeliefState,
    current: BeliefState
  ): { impact: number; convergence: number; stability: number } {
    const impact = Math.abs(current.belief - previous.belief);
    
    // Check convergence from history
    const history = this.history.get(current.evidence?.[0]?.topic || '');
    let convergence = 1.0;
    let stability = 1.0;
    
    if (history && history.length > 5) {
      const recent = history.slice(-5);
      const variance = this.computeVariance(recent.map(h => h.belief));
      convergence = 1 / (1 + variance);
      
      // Check oscillation
      let oscillations = 0;
      for (let i = 1; i < recent.length - 1; i++) {
        if ((recent[i].belief - recent[i-1].belief) * 
            (recent[i+1].belief - recent[i].belief) < 0) {
          oscillations++;
        }
      }
      stability = 1 - (oscillations / (recent.length - 2));
    }
    
    return { impact, convergence, stability };
  }
  
  /**
   * Compute update confidence
   */
  private computeUpdateConfidence(
    belief: BeliefState,
    metrics: { impact: number; convergence: number; stability: number }
  ): number {
    // Combine belief certainty with update quality metrics
    const certainty = 1 - belief.uncertainty;
    const quality = (metrics.convergence + metrics.stability) / 2;
    
    return certainty * quality;
  }
  
  /**
   * Propagate belief changes through network
   */
  private propagateBeliefChanges(updates: BeliefUpdate[]): void {
    // Build propagation network
    const propagated = new Set<string>();
    const queue: string[] = updates.map(u => u.topic);
    
    while (queue.length > 0) {
      const topic = queue.shift()!;
      if (propagated.has(topic)) continue;
      
      propagated.add(topic);
      
      // Find related topics
      const related = this.findRelatedTopics(topic);
      
      for (const relatedTopic of related) {
        if (!propagated.has(relatedTopic)) {
          // Compute influence
          const influence = this.computeInfluence(topic, relatedTopic);
          
          if (influence > 0.3) {
            // Propagate belief change
            const currentBelief = this.beliefs.get(topic);
            const relatedBelief = this.beliefs.get(relatedTopic);
            
            if (currentBelief && relatedBelief) {
              const propagatedBelief = this.propagateBelief(
                currentBelief,
                relatedBelief,
                influence
              );
              
              this.beliefs.set(relatedTopic, propagatedBelief);
              queue.push(relatedTopic);
            }
          }
        }
      }
    }
  }
  
  /**
   * Find related topics
   */
  private findRelatedTopics(topic: string): string[] {
    const related: string[] = [];
    
    // Use network structure
    const node = this.network.getNode(topic);
    if (node) {
      related.push(...node.children, ...node.parents);
    }
    
    // Check semantic similarity
    for (const [otherTopic] of this.beliefs.entries()) {
      if (otherTopic !== topic) {
        const similarity = this.computeTopicSimilarity(topic, otherTopic);
        if (similarity > 0.7) {
          related.push(otherTopic);
        }
      }
    }
    
    return [...new Set(related)];
  }
  
  /**
   * Compute influence between topics
   */
  private computeInfluence(source: string, target: string): number {
    // Check network connection strength
    const sourceNode = this.network.getNode(source);
    const targetNode = this.network.getNode(target);
    
    if (sourceNode && targetNode) {
      if (sourceNode.children.includes(target)) {
        return 0.8; // Direct influence
      }
      if (sourceNode.parents.includes(target)) {
        return 0.6; // Reverse influence
      }
    }
    
    // Semantic influence
    return this.computeTopicSimilarity(source, target) * 0.5;
  }
  
  /**
   * Propagate belief between topics
   */
  private propagateBelief(
    source: BeliefState,
    target: BeliefState,
    influence: number
  ): BeliefState {
    const beliefChange = (source.belief - target.belief) * influence * 0.3;
    
    return {
      ...target,
      belief: Math.max(0, Math.min(1, target.belief + beliefChange)),
      uncertainty: target.uncertainty + Math.abs(beliefChange) * 0.1,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Estimate source reliability
   */
  private estimateSourceReliability(source: string): number {
    // Check historical accuracy
    let correct = 0;
    let total = 0;
    
    for (const [_, history] of this.history.entries()) {
      for (const entry of history) {
        if (entry.evidence?.source === source) {
          total++;
          // Simplified: check if belief moved in right direction
          if (entry.belief > 0.5 && entry.evidence.confidence > 0.5) {
            correct++;
          } else if (entry.belief < 0.5 && entry.evidence.confidence < 0.5) {
            correct++;
          }
        }
      }
    }
    
    if (total === 0) return 0.7; // Default reliability
    
    return correct / total;
  }
  
  /**
   * Find similar evidence
   */
  private findSimilarEvidence(evidence: Evidence): Evidence[] {
    const similar: Evidence[] = [];
    
    for (const belief of this.beliefs.values()) {
      if (belief.evidence) {
        for (const e of belief.evidence) {
          const similarity = this.computeEvidenceSimilarity(evidence, e);
          if (similarity > 0.7) {
            similar.push(e);
          }
        }
      }
    }
    
    return similar;
  }
  
  /**
   * Get total evidence count
   */
  private getTotalEvidenceCount(): number {
    let count = 0;
    
    for (const belief of this.beliefs.values()) {
      count += belief.evidence?.length || 0;
    }
    
    return count;
  }
  
  /**
   * Compute normalization constant
   */
  private computeNormalizationConstant(
    distribution: Map<string, number>,
    likelihood: number
  ): number {
    let sum = 0;
    
    for (const prior of distribution.values()) {
      sum += likelihood * prior;
    }
    
    return sum > 0 ? sum : 1;
  }
  
  /**
   * Compute variance
   */
  private computeVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return variance;
  }
  
  /**
   * Compute topic similarity
   */
  private computeTopicSimilarity(topic1: string, topic2: string): number {
    // Simple word overlap
    const words1 = new Set(topic1.toLowerCase().split(/\s+/));
    const words2 = new Set(topic2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Compute evidence similarity
   */
  private computeEvidenceSimilarity(e1: Evidence, e2: Evidence): number {
    // Content similarity
    const contentSim = this.computeContentSimilarity(e1.content, e2.content);
    
    // Confidence similarity
    const confSim = 1 - Math.abs(e1.confidence - e2.confidence);
    
    // Source similarity
    const sourceSim = e1.source === e2.source ? 1 : 0.5;
    
    return (contentSim + confSim + sourceSim) / 3;
  }
  
  /**
   * Compute content similarity
   */
  private computeContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Get current belief state
   */
  getBelief(topic: string): BeliefState | undefined {
    return this.beliefs.get(topic);
  }
  
  /**
   * Get belief history
   */
  getHistory(topic: string): BeliefHistory[] {
    return this.history.get(topic) || [];
  }
  
  /**
   * Get all beliefs
   */
  getAllBeliefs(): Map<string, BeliefState> {
    return new Map(this.beliefs);
  }
  
  /**
   * Clear belief state
   */
  clearBelief(topic: string): void {
    this.beliefs.delete(topic);
    this.history.delete(topic);
  }
  
  /**
   * Reset all beliefs
   */
  resetAllBeliefs(): void {
    this.beliefs.clear();
    this.history.clear();
    this.network = new BayesianNetwork();
    this.inferenceEngine = new InferenceEngine(this.network);
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalBeliefs: number;
    avgConfidence: number;
    avgUncertainty: number;
    totalUpdates: number;
  } {
    let totalConfidence = 0;
    let totalUncertainty = 0;
    let totalUpdates = 0;
    
    for (const belief of this.beliefs.values()) {
      totalConfidence += belief.belief;
      totalUncertainty += belief.uncertainty;
    }
    
    for (const history of this.history.values()) {
      totalUpdates += history.length;
    }
    
    const count = this.beliefs.size;
    
    return {
      totalBeliefs: count,
      avgConfidence: count > 0 ? totalConfidence / count : 0,
      avgUncertainty: count > 0 ? totalUncertainty / count : 0,
      totalUpdates
    };
  }
}
