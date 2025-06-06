/**
 * Epistemic Uncertainty Analysis
 * Distinguishes and quantifies knowledge vs data uncertainty
 */

import { BeliefState, Evidence } from '../../types/evidence.types';
import { UncertaintyMetrics } from './uncertainty-metrics';

export interface EpistemicComponents {
  modelUncertainty: number;
  parameterUncertainty: number;
  structuralUncertainty: number;
  approximationUncertainty: number;
  total: number;
}

export interface KnowledgeGaps {
  missingDomains: string[];
  weakEvidence: string[];
  conflictingTheories: string[];
  unknownUnknowns: number;
}

export interface UncertaintyBounds {
  epistemicLower: number;
  epistemicUpper: number;
  aleatoricLower: number;
  aleatoricUpper: number;
  totalLower: number;
  totalUpper: number;
}

export class EpistemicUncertainty {
  private uncertaintyMetrics: UncertaintyMetrics;
  
  constructor() {
    this.uncertaintyMetrics = new UncertaintyMetrics();
  }
  
  /**
   * Decompose uncertainty into epistemic and aleatoric components
   */
  decomposeUncertainty(
    belief: BeliefState,
    evidence: Evidence[]
  ): {
    epistemic: EpistemicComponents;
    aleatoric: number;
    ratio: number;
  } {
    // Compute base uncertainties
    const measures = this.uncertaintyMetrics.computeUncertainty(belief, evidence);
    
    // Decompose epistemic components
    const epistemic = this.computeEpistemicComponents(belief, evidence);
    
    // Aleatoric is from the base metrics
    const aleatoric = measures.aleatoric;
    
    // Ratio indicates reducibility
    const ratio = epistemic.total / (epistemic.total + aleatoric);
    
    return { epistemic, aleatoric, ratio };
  }
  
  /**
   * Identify knowledge gaps
   */
  identifyKnowledgeGaps(
    belief: BeliefState,
    evidence: Evidence[],
    domainOntology?: Map<string, string[]>
  ): KnowledgeGaps {
    const missingDomains = this.findMissingDomains(evidence, domainOntology);
    const weakEvidence = this.findWeakEvidence(evidence);
    const conflictingTheories = this.findConflictingTheories(evidence);
    const unknownUnknowns = this.estimateUnknownUnknowns(belief, evidence);
    
    return {
      missingDomains,
      weakEvidence,
      conflictingTheories,
      unknownUnknowns
    };
  }
  
  /**
   * Compute uncertainty bounds
   */
  computeUncertaintyBounds(
    belief: BeliefState,
    evidence: Evidence[],
    confidence: number = 0.95
  ): UncertaintyBounds {
    // Bootstrap to get uncertainty of uncertainty estimates
    const bootstrapSamples = 1000;
    const epistemicSamples: number[] = [];
    const aleatoricSamples: number[] = [];
    
    for (let i = 0; i < bootstrapSamples; i++) {
      const sample = this.bootstrapSample(evidence);
      const decomposed = this.decomposeUncertainty(belief, sample);
      
      epistemicSamples.push(decomposed.epistemic.total);
      aleatoricSamples.push(decomposed.aleatoric);
    }
    
    // Compute percentiles
    const alpha = (1 - confidence) / 2;
    
    return {
      epistemicLower: this.percentile(epistemicSamples, alpha),
      epistemicUpper: this.percentile(epistemicSamples, 1 - alpha),
      aleatoricLower: this.percentile(aleatoricSamples, alpha),
      aleatoricUpper: this.percentile(aleatoricSamples, 1 - alpha),
      totalLower: this.percentile(
        epistemicSamples.map((e, i) => e + aleatoricSamples[i]), alpha
      ),
      totalUpper: this.percentile(
        epistemicSamples.map((e, i) => e + aleatoricSamples[i]), 1 - alpha
      )
    };
  }
  
  /**
   * Quantify reducible uncertainty
   */
  quantifyReducibleUncertainty(
    belief: BeliefState,
    evidence: Evidence[],
    additionalSamples: number = 10
  ): {
    currentEpistemic: number;
    projectedEpistemic: number;
    reductionPotential: number;
    samplesNeeded: number;
  } {
    const current = this.decomposeUncertainty(belief, evidence);
    
    // Model epistemic uncertainty reduction with more data
    const n = evidence.length;
    const projectedEpistemic = current.epistemic.total * Math.sqrt(n / (n + additionalSamples));
    
    // Estimate samples needed for target reduction
    const targetReduction = 0.5; // 50% reduction
    const targetEpistemic = current.epistemic.total * targetReduction;
    const samplesNeeded = Math.ceil(n * (Math.pow(current.epistemic.total / targetEpistemic, 2) - 1));
    
    return {
      currentEpistemic: current.epistemic.total,
      projectedEpistemic,
      reductionPotential: current.epistemic.total - projectedEpistemic,
      samplesNeeded
    };
  }
  
  /**
   * Analyze model uncertainty
   */
  analyzeModelUncertainty(
    belief: BeliefState,
    alternativeModels?: Array<(b: BeliefState) => number>
  ): {
    modelVariance: number;
    modelBias: number;
    ensembleUncertainty: number;
  } {
    if (!alternativeModels || alternativeModels.length === 0) {
      return { modelVariance: 0, modelBias: 0, ensembleUncertainty: belief.uncertainty };
    }
    
    // Evaluate all models
    const predictions = alternativeModels.map(model => model(belief));
    const ensembleMean = this.mean(predictions);
    
    // Model variance (disagreement)
    const modelVariance = this.variance(predictions);
    
    // Model bias (deviation from belief)
    const modelBias = Math.abs(ensembleMean - belief.belief);
    
    // Ensemble uncertainty combines all
    const ensembleUncertainty = Math.sqrt(
      modelVariance + Math.pow(modelBias, 2) + Math.pow(belief.uncertainty, 2)
    );
    
    return {
      modelVariance,
      modelBias,
      ensembleUncertainty
    };
  }
  
  /**
   * Propagate epistemic uncertainty
   */
  propagateEpistemicUncertainty(
    beliefs: BeliefState[],
    transformation: (beliefs: number[]) => number
  ): {
    propagatedValue: number;
    propagatedUncertainty: number;
    epistemicContribution: number;
    aleatoricContribution: number;
  } {
    // Monte Carlo propagation
    const samples = 10000;
    const results: number[] = [];
    const epistemicResults: number[] = [];
    const aleatoricResults: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      // Sample from epistemic distribution
      const epistemicSample = beliefs.map(b => 
        b.belief + this.sampleEpistemic(b) * b.uncertainty
      );
      
      // Sample from aleatoric distribution
      const aleatoricSample = beliefs.map(b =>
        b.belief + this.sampleAleatoric(b) * b.uncertainty
      );
      
      // Transform samples
      const result = transformation(epistemicSample.map((e, j) => 
        (e + aleatoricSample[j]) / 2
      ));
      results.push(result);
      
      // Track contributions
      epistemicResults.push(transformation(epistemicSample));
      aleatoricResults.push(transformation(aleatoricSample));
    }
    
    // Compute statistics
    const propagatedValue = this.mean(results);
    const totalVar = this.variance(results);
    const epistemicVar = this.variance(epistemicResults);
    const aleatoricVar = this.variance(aleatoricResults);
    
    return {
      propagatedValue,
      propagatedUncertainty: Math.sqrt(totalVar),
      epistemicContribution: Math.sqrt(epistemicVar),
      aleatoricContribution: Math.sqrt(aleatoricVar)
    };
  }
  
  /**
   * Information-theoretic epistemic uncertainty
   */
  informationTheoreticUncertainty(
    belief: BeliefState,
    maxInformation: number = 1.0
  ): {
    mutualInformation: number;
    expectedInfoGain: number;
    valueOfInformation: number;
  } {
    // Mutual information between belief and evidence
    const mutualInformation = this.computeMutualInformation(belief);
    
    // Expected information gain from additional evidence
    const currentEntropy = this.computeEntropy(belief);
    const expectedPostEntropy = currentEntropy * Math.exp(-belief.evidence.length / 10);
    const expectedInfoGain = currentEntropy - expectedPostEntropy;
    
    // Value of perfect information
    const valueOfInformation = Math.min(
      maxInformation,
      currentEntropy * (1 - belief.belief) * belief.uncertainty
    );
    
    return {
      mutualInformation,
      expectedInfoGain,
      valueOfInformation
    };
  }
  
  /**
   * Deep uncertainty analysis (Knightian uncertainty)
   */
  deepUncertaintyAnalysis(
    belief: BeliefState,
    scenarios?: Array<{ name: string; probability?: number; impact: number }>
  ): {
    ambiguity: number;
    scenarioSpread: number;
    robustness: number;
    infoGapRadius: number;
  } {
    // Ambiguity from missing probabilities
    let ambiguity = belief.uncertainty;
    
    if (scenarios && scenarios.length > 0) {
      const definedProb = scenarios
        .filter(s => s.probability !== undefined)
        .reduce((sum, s) => sum + s.probability!, 0);
      
      ambiguity = Math.max(ambiguity, 1 - definedProb);
      
      // Scenario spread
      const impacts = scenarios.map(s => s.impact);
      const scenarioSpread = Math.max(...impacts) - Math.min(...impacts);
      
      // Robustness to worst case
      const worstCase = Math.min(...impacts);
      const robustness = 1 - Math.abs(worstCase) / (1 + Math.abs(worstCase));
      
      // Info-gap radius of uncertainty
      const infoGapRadius = this.computeInfoGapRadius(belief, scenarios);
      
      return {
        ambiguity,
        scenarioSpread,
        robustness,
        infoGapRadius
      };
    }
    
    return {
      ambiguity,
      scenarioSpread: 0,
      robustness: 0.5,
      infoGapRadius: ambiguity
    };
  }
  
  /**
   * Private helper methods
   */
  
  private computeEpistemicComponents(
    belief: BeliefState,
    evidence: Evidence[]
  ): EpistemicComponents {
    // Model uncertainty from posterior spread
    const modelUncertainty = this.computeModelUncertainty(belief);
    
    // Parameter uncertainty from evidence variability
    const parameterUncertainty = this.computeParameterUncertainty(evidence);
    
    // Structural uncertainty from missing relationships
    const structuralUncertainty = this.computeStructuralUncertainty(belief, evidence);
    
    // Approximation uncertainty from computational limits
    const approximationUncertainty = this.computeApproximationUncertainty(belief);
    
    // Total epistemic uncertainty
    const total = Math.sqrt(
      Math.pow(modelUncertainty, 2) +
      Math.pow(parameterUncertainty, 2) +
      Math.pow(structuralUncertainty, 2) +
      Math.pow(approximationUncertainty, 2)
    );
    
    return {
      modelUncertainty,
      parameterUncertainty,
      structuralUncertainty,
      approximationUncertainty,
      total
    };
  }
  
  private computeModelUncertainty(belief: BeliefState): number {
    if (!belief.posterior || belief.posterior.size === 0) {
      return 0.3; // Default model uncertainty
    }
    
    // Entropy of posterior distribution
    let entropy = 0;
    for (const prob of belief.posterior.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    // Normalize
    const maxEntropy = Math.log2(belief.posterior.size);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }
  
  private computeParameterUncertainty(evidence: Evidence[]): number {
    if (evidence.length < 2) return 0.5;
    
    // Coefficient of variation in confidence values
    const confidences = evidence.map(e => e.confidence);
    const mean = this.mean(confidences);
    const std = this.stdDev(confidences);
    
    const cv = mean > 0 ? std / mean : 0;
    return Math.min(1, cv);
  }
  
  private computeStructuralUncertainty(
    belief: BeliefState,
    evidence: Evidence[]
  ): number {
    // Missing relationships between evidence
    const topics = new Set(evidence.map(e => e.topic || 'unknown'));
    const sources = new Set(evidence.map(e => e.source));
    
    // Structural complexity
    const topicDiversity = Math.min(1, topics.size / 10);
    const sourceDiversity = Math.min(1, sources.size / 5);
    
    // Missing connections
    const expectedConnections = Math.min(topics.size * sources.size, 20);
    const actualConnections = evidence.length;
    const connectionRatio = actualConnections / expectedConnections;
    
    return (1 - connectionRatio) * 0.5 + (1 - topicDiversity) * 0.25 + (1 - sourceDiversity) * 0.25;
  }
  
  private computeApproximationUncertainty(belief: BeliefState): number {
    // Uncertainty from computational approximations
    let approximation = 0;
    
    // Finite sample effects
    if (belief.evidence.length < 30) {
      approximation += 0.1 * (1 - belief.evidence.length / 30);
    }
    
    // Discretization effects
    if (belief.posterior && belief.posterior.size < 10) {
      approximation += 0.05 * (1 - belief.posterior.size / 10);
    }
    
    // Numerical precision
    approximation += 0.01;
    
    return Math.min(0.2, approximation);
  }
  
  private findMissingDomains(
    evidence: Evidence[],
    ontology?: Map<string, string[]>
  ): string[] {
    if (!ontology) return [];
    
    const coveredTopics = new Set(evidence.map(e => e.topic || 'unknown'));
    const missingDomains: string[] = [];
    
    for (const [domain, topics] of ontology.entries()) {
      const coverage = topics.filter(t => coveredTopics.has(t)).length / topics.length;
      if (coverage < 0.3) {
        missingDomains.push(domain);
      }
    }
    
    return missingDomains;
  }
  
  private findWeakEvidence(evidence: Evidence[]): string[] {
    const weak: string[] = [];
    
    for (const e of evidence) {
      if (e.confidence < 0.3 || !e.topic) {
        weak.push(e.source);
      }
    }
    
    return [...new Set(weak)];
  }
  
  private findConflictingTheories(evidence: Evidence[]): string[] {
    const theories: string[] = [];
    
    // Group by topic
    const byTopic = new Map<string, Evidence[]>();
    for (const e of evidence) {
      const topic = e.topic || 'unknown';
      if (!byTopic.has(topic)) {
        byTopic.set(topic, []);
      }
      byTopic.get(topic)!.push(e);
    }
    
    // Find conflicts
    for (const [topic, group] of byTopic.entries()) {
      if (group.length >= 2) {
        const confidences = group.map(e => e.confidence);
        const std = this.stdDev(confidences);
        
        if (std > 0.3) {
          theories.push(topic);
        }
      }
    }
    
    return theories;
  }
  
  private estimateUnknownUnknowns(
    belief: BeliefState,
    evidence: Evidence[]
  ): number {
    // Estimate based on evidence sparsity and uncertainty
    const sparsity = Math.exp(-evidence.length / 20);
    const uncertainty = belief.uncertainty;
    
    // Higher with less evidence and more uncertainty
    return sparsity * uncertainty;
  }
  
  private bootstrapSample(evidence: Evidence[]): Evidence[] {
    const n = evidence.length;
    const sample: Evidence[] = [];
    
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      sample.push(evidence[idx]);
    }
    
    return sample;
  }
  
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.floor(p * (sorted.length - 1));
    return sorted[idx];
  }
  
  private sampleEpistemic(belief: BeliefState): number {
    // Sample from epistemic distribution (normal)
    return this.normalRandom() * 0.5;
  }
  
  private sampleAleatoric(belief: BeliefState): number {
    // Sample from aleatoric distribution (uniform)
    return (Math.random() - 0.5) * 2;
  }
  
  private normalRandom(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  
  private computeMutualInformation(belief: BeliefState): number {
    // Simplified mutual information calculation
    if (!belief.posterior || belief.evidence.length === 0) return 0;
    
    // I(X;Y) = H(X) - H(X|Y)
    const marginalEntropy = this.computeEntropy(belief);
    const conditionalEntropy = marginalEntropy * (1 - belief.belief);
    
    return Math.max(0, marginalEntropy - conditionalEntropy);
  }
  
  private computeEntropy(belief: BeliefState): number {
    if (!belief.posterior) {
      // Binary entropy
      const p = belief.belief;
      if (p <= 0 || p >= 1) return 0;
      return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
    }
    
    let entropy = 0;
    for (const prob of belief.posterior.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    return entropy;
  }
  
  private computeInfoGapRadius(
    belief: BeliefState,
    scenarios: Array<{ name: string; probability?: number; impact: number }>
  ): number {
    // Info-gap radius based on scenario uncertainty
    const definedScenarios = scenarios.filter(s => s.probability !== undefined);
    const undefinedScenarios = scenarios.filter(s => s.probability === undefined);
    
    if (undefinedScenarios.length === 0) {
      return belief.uncertainty * 0.5;
    }
    
    // Radius grows with undefined scenarios
    const radius = belief.uncertainty * (1 + undefinedScenarios.length / scenarios.length);
    
    return Math.min(1, radius);
  }
  
  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  private variance(values: number[]): number {
    const m = this.mean(values);
    return values.length > 0
      ? values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length
      : 0;
  }
  
  private stdDev(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }
}
