/**
 * Sensitivity Analysis
 * Assesses how sensitive beliefs and decisions are to parameter changes
 */

import { BeliefState, Evidence } from '../../types/evidence.types';
import { BayesianNetwork } from '../bayesian/bayesian-network';
import { InferenceEngine } from '../bayesian/inference-engine';

export interface SensitivityResult {
  parameter: string;
  baseline: number;
  sensitivity: number;
  elasticity: number;
  criticalValue?: number;
  robustness: number;
}

export interface GlobalSensitivity {
  mainEffects: Map<string, number>;
  interactions: Map<string, number>;
  totalEffects: Map<string, number>;
  sobolIndices: Map<string, number>;
}

export interface RobustnessAnalysis {
  stableRegion: { min: number; max: number };
  breakpoints: number[];
  worstCase: number;
  bestCase: number;
}

export class SensitivityAnalysis {
  private network: BayesianNetwork;
  private inferenceEngine: InferenceEngine;
  
  constructor() {
    this.network = new BayesianNetwork();
    this.inferenceEngine = new InferenceEngine(this.network);
  }
  
  /**
   * Perform local sensitivity analysis
   */
  localSensitivity(
    belief: BeliefState,
    parameter: string,
    perturbation: number = 0.01
  ): SensitivityResult {
    const baseline = this.extractParameterValue(belief, parameter);
    
    // Compute forward difference
    const beliefPlus = this.perturbBelief(belief, parameter, perturbation);
    const responsePlus = this.computeResponse(beliefPlus);
    
    // Compute backward difference
    const beliefMinus = this.perturbBelief(belief, parameter, -perturbation);
    const responseMinus = this.computeResponse(beliefMinus);
    
    // Central difference approximation
    const sensitivity = (responsePlus - responseMinus) / (2 * perturbation);
    
    // Elasticity (percentage change)
    const baselineResponse = this.computeResponse(belief);
    const elasticity = baseline !== 0 
      ? (sensitivity * baseline) / baselineResponse 
      : 0;
    
    // Find critical value where decision changes
    const criticalValue = this.findCriticalValue(belief, parameter);
    
    // Compute robustness
    const robustness = this.computeRobustness(belief, parameter, sensitivity);
    
    return {
      parameter,
      baseline,
      sensitivity,
      elasticity,
      criticalValue,
      robustness
    };
  }
  
  /**
   * Perform global sensitivity analysis using Sobol method
   */
  globalSensitivity(
    belief: BeliefState,
    parameters: string[],
    samples: number = 1000
  ): GlobalSensitivity {
    // Generate sample matrices
    const { A, B, AB_matrices } = this.generateSobolMatrices(parameters, samples);
    
    // Compute model outputs
    const Y_A = A.map(sample => this.evaluateModel(belief, parameters, sample));
    const Y_B = B.map(sample => this.evaluateModel(belief, parameters, sample));
    const Y_AB = AB_matrices.map(matrix => 
      matrix.map(sample => this.evaluateModel(belief, parameters, sample))
    );
    
    // Compute variance components
    const totalVariance = this.variance(Y_A);
    const mainEffects = new Map<string, number>();
    const totalEffects = new Map<string, number>();
    const sobolIndices = new Map<string, number>();
    
    for (let i = 0; i < parameters.length; i++) {
      // First-order Sobol index
      const firstOrder = this.computeFirstOrderIndex(Y_A, Y_B, Y_AB[i]);
      mainEffects.set(parameters[i], firstOrder * totalVariance);
      sobolIndices.set(parameters[i], firstOrder);
      
      // Total effect index
      const totalEffect = this.computeTotalEffectIndex(Y_A, Y_B, Y_AB[i]);
      totalEffects.set(parameters[i], totalEffect * totalVariance);
    }
    
    // Compute interactions
    const interactions = this.computeInteractions(
      parameters, mainEffects, totalEffects, totalVariance
    );
    
    return {
      mainEffects,
      interactions,
      totalEffects,
      sobolIndices
    };
  }
  
  /**
   * Analyze robustness of belief to perturbations
   */
  robustnessAnalysis(
    belief: BeliefState,
    parameter: string,
    range: { min: number; max: number },
    steps: number = 100
  ): RobustnessAnalysis {
    const values: number[] = [];
    const responses: number[] = [];
    const breakpoints: number[] = [];
    
    // Sample parameter space
    for (let i = 0; i <= steps; i++) {
      const value = range.min + (range.max - range.min) * i / steps;
      values.push(value);
      
      const perturbedBelief = this.setBelief(belief, parameter, value);
      const response = this.computeResponse(perturbedBelief);
      responses.push(response);
      
      // Check for discontinuities
      if (i > 0 && Math.abs(responses[i] - responses[i - 1]) > 0.3) {
        breakpoints.push(value);
      }
    }
    
    // Find stable region
    const stableRegion = this.findStableRegion(values, responses);
    
    // Worst and best case
    const worstCase = Math.min(...responses);
    const bestCase = Math.max(...responses);
    
    return {
      stableRegion,
      breakpoints,
      worstCase,
      bestCase
    };
  }
  
  /**
   * One-at-a-time (OAT) sensitivity analysis
   */
  oneAtATime(
    belief: BeliefState,
    parameters: string[],
    range: number = 0.2
  ): Map<string, SensitivityResult> {
    const results = new Map<string, SensitivityResult>();
    
    for (const param of parameters) {
      const baseline = this.extractParameterValue(belief, param);
      const responses: Array<{ value: number; response: number }> = [];
      
      // Vary parameter
      for (let mult = 1 - range; mult <= 1 + range; mult += range / 10) {
        const value = baseline * mult;
        const perturbedBelief = this.setBelief(belief, param, value);
        const response = this.computeResponse(perturbedBelief);
        
        responses.push({ value, response });
      }
      
      // Fit linear regression for sensitivity
      const sensitivity = this.computeSlope(responses);
      
      results.set(param, {
        parameter: param,
        baseline,
        sensitivity,
        elasticity: (sensitivity * baseline) / this.computeResponse(belief),
        robustness: 1 / (1 + Math.abs(sensitivity))
      });
    }
    
    return results;
  }
  
  /**
   * Morris method for screening important parameters
   */
  morrisScreening(
    belief: BeliefState,
    parameters: string[],
    trajectories: number = 10,
    levels: number = 4
  ): Map<string, { mean: number; std: number; importance: number }> {
    const results = new Map<string, number[]>();
    
    // Initialize results storage
    for (const param of parameters) {
      results.set(param, []);
    }
    
    // Generate trajectories
    for (let t = 0; t < trajectories; t++) {
      const trajectory = this.generateMorrisTrajectory(parameters, levels);
      
      // Evaluate elementary effects
      for (let i = 0; i < trajectory.length - 1; i++) {
        const changedParam = this.findChangedParameter(
          trajectory[i], trajectory[i + 1], parameters
        );
        
        if (changedParam) {
          const y1 = this.evaluateModel(belief, parameters, trajectory[i]);
          const y2 = this.evaluateModel(belief, parameters, trajectory[i + 1]);
          const delta = trajectory[i + 1][parameters.indexOf(changedParam)] -
                       trajectory[i][parameters.indexOf(changedParam)];
          
          const elementaryEffect = (y2 - y1) / delta;
          results.get(changedParam)!.push(elementaryEffect);
        }
      }
    }
    
    // Compute statistics
    const statistics = new Map<string, { mean: number; std: number; importance: number }>();
    
    for (const [param, effects] of results.entries()) {
      const mean = this.mean(effects);
      const std = this.stdDev(effects);
      const meanAbs = this.mean(effects.map(Math.abs));
      
      statistics.set(param, {
        mean: meanAbs, // Use mean of absolute values
        std,
        importance: Math.sqrt(mean * mean + std * std)
      });
    }
    
    return statistics;
  }
  
  /**
   * Variance-based sensitivity for evidence quality
   */
  evidenceSensitivity(
    belief: BeliefState,
    targetEvidence: Evidence
  ): {
    influence: number;
    criticalConfidence: number;
    removalImpact: number;
  } {
    // Compute influence of specific evidence
    const baselineResponse = this.computeResponse(belief);
    
    // Remove evidence
    const withoutEvidence: BeliefState = {
      ...belief,
      evidence: belief.evidence.filter(e => e !== targetEvidence)
    };
    const responseWithout = this.computeResponse(withoutEvidence);
    const removalImpact = Math.abs(baselineResponse - responseWithout);
    
    // Find critical confidence where decision changes
    let criticalConfidence = targetEvidence.confidence;
    const originalConfidence = targetEvidence.confidence;
    
    for (let conf = 0; conf <= 1; conf += 0.01) {
      targetEvidence.confidence = conf;
      const response = this.computeResponse(belief);
      
      if (Math.sign(response - 0.5) !== Math.sign(baselineResponse - 0.5)) {
        criticalConfidence = conf;
        break;
      }
    }
    
    targetEvidence.confidence = originalConfidence;
    
    // Compute influence metric
    const influence = removalImpact * (1 / belief.evidence.length);
    
    return {
      influence,
      criticalConfidence,
      removalImpact
    };
  }
  
  /**
   * Network-based sensitivity analysis
   */
  networkSensitivity(
    belief: BeliefState
  ): Map<string, { structural: number; parametric: number }> {
    // Build network from evidence
    this.network.constructFromEvidence(belief.evidence);
    
    const sensitivity = new Map<string, { structural: number; parametric: number }>();
    
    for (const node of this.network.getAllNodes()) {
      // Structural sensitivity (connectivity)
      const structural = this.computeStructuralSensitivity(node.id);
      
      // Parametric sensitivity (CPT changes)
      const parametric = this.computeParametricSensitivity(node.id, belief);
      
      sensitivity.set(node.id, { structural, parametric });
    }
    
    return sensitivity;
  }
  
  /**
   * Helper methods
   */
  
  private extractParameterValue(belief: BeliefState, parameter: string): number {
    switch (parameter) {
      case 'belief':
        return belief.belief;
      case 'uncertainty':
        return belief.uncertainty;
      case 'evidence_count':
        return belief.evidence.length;
      case 'avg_confidence':
        return this.mean(belief.evidence.map(e => e.confidence));
      default:
        return 0;
    }
  }
  
  private perturbBelief(
    belief: BeliefState,
    parameter: string,
    delta: number
  ): BeliefState {
    const perturbed = { ...belief };
    
    switch (parameter) {
      case 'belief':
        perturbed.belief = Math.max(0, Math.min(1, belief.belief + delta));
        break;
      case 'uncertainty':
        perturbed.uncertainty = Math.max(0, Math.min(1, belief.uncertainty + delta));
        break;
      case 'evidence_confidence':
        perturbed.evidence = belief.evidence.map(e => ({
          ...e,
          confidence: Math.max(0, Math.min(1, e.confidence + delta))
        }));
        break;
    }
    
    return perturbed;
  }
  
  private setBelief(
    belief: BeliefState,
    parameter: string,
    value: number
  ): BeliefState {
    const updated = { ...belief };
    
    switch (parameter) {
      case 'belief':
        updated.belief = Math.max(0, Math.min(1, value));
        break;
      case 'uncertainty':
        updated.uncertainty = Math.max(0, Math.min(1, value));
        break;
    }
    
    return updated;
  }
  
  private computeResponse(belief: BeliefState): number {
    // Response function - could be decision threshold, utility, etc.
    return belief.belief * (1 - belief.uncertainty);
  }
  
  private findCriticalValue(
    belief: BeliefState,
    parameter: string
  ): number | undefined {
    const baseline = this.computeResponse(belief);
    const threshold = 0.5; // Decision threshold
    
    // Binary search for critical value
    let low = 0;
    let high = 1;
    let iterations = 0;
    
    while (high - low > 0.001 && iterations < 50) {
      const mid = (low + high) / 2;
      const perturbed = this.setBelief(belief, parameter, mid);
      const response = this.computeResponse(perturbed);
      
      if ((baseline < threshold && response >= threshold) ||
          (baseline >= threshold && response < threshold)) {
        return mid;
      }
      
      if (response < threshold) {
        low = mid;
      } else {
        high = mid;
      }
      
      iterations++;
    }
    
    return undefined;
  }
  
  private computeRobustness(
    belief: BeliefState,
    parameter: string,
    sensitivity: number
  ): number {
    // Robustness inversely related to sensitivity
    const normalizedSensitivity = Math.abs(sensitivity) / (1 + Math.abs(sensitivity));
    return 1 - normalizedSensitivity;
  }
  
  private generateSobolMatrices(
    parameters: string[],
    samples: number
  ): {
    A: number[][];
    B: number[][];
    AB_matrices: number[][][];
  } {
    const k = parameters.length;
    const A: number[][] = [];
    const B: number[][] = [];
    const AB_matrices: number[][][] = [];
    
    // Generate quasi-random samples
    for (let i = 0; i < samples; i++) {
      A.push(this.sobolSequence(i, k));
      B.push(this.sobolSequence(i + samples, k));
    }
    
    // Generate AB matrices
    for (let j = 0; j < k; j++) {
      const AB_j: number[][] = [];
      
      for (let i = 0; i < samples; i++) {
        const row = [...A[i]];
        row[j] = B[i][j]; // Replace j-th column
        AB_j.push(row);
      }
      
      AB_matrices.push(AB_j);
    }
    
    return { A, B, AB_matrices };
  }
  
  private sobolSequence(n: number, dim: number): number[] {
    // Simplified Sobol sequence generator
    const sequence: number[] = [];
    
    for (let d = 0; d < dim; d++) {
      // Van der Corput sequence as approximation
      let value = 0;
      let base = 2;
      let f = 1 / base;
      let i = n;
      
      while (i > 0) {
        value += f * (i % base);
        i = Math.floor(i / base);
        f /= base;
      }
      
      sequence.push(value);
    }
    
    return sequence;
  }
  
  private evaluateModel(
    belief: BeliefState,
    parameters: string[],
    sample: number[]
  ): number {
    // Create perturbed belief with sample values
    let perturbed = { ...belief };
    
    for (let i = 0; i < parameters.length; i++) {
      perturbed = this.setBelief(perturbed, parameters[i], sample[i]);
    }
    
    return this.computeResponse(perturbed);
  }
  
  private computeFirstOrderIndex(Y_A: number[], Y_B: number[], Y_AB_i: number[]): number {
    const n = Y_A.length;
    let numerator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += Y_B[i] * (Y_AB_i[i] - Y_A[i]);
    }
    
    const V_i = numerator / n;
    const V_total = this.variance(Y_A);
    
    return V_total > 0 ? V_i / V_total : 0;
  }
  
  private computeTotalEffectIndex(Y_A: number[], Y_B: number[], Y_AB_i: number[]): number {
    const n = Y_A.length;
    let numerator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += Math.pow(Y_A[i] - Y_AB_i[i], 2);
    }
    
    const E_i = numerator / (2 * n);
    const V_total = this.variance(Y_A);
    
    return V_total > 0 ? E_i / V_total : 0;
  }
  
  private computeInteractions(
    parameters: string[],
    mainEffects: Map<string, number>,
    totalEffects: Map<string, number>,
    totalVariance: number
  ): Map<string, number> {
    const interactions = new Map<string, number>();
    
    for (const param of parameters) {
      const main = mainEffects.get(param) || 0;
      const total = totalEffects.get(param) || 0;
      const interaction = total - main;
      
      if (interaction > 0.01 * totalVariance) {
        interactions.set(param, interaction);
      }
    }
    
    return interactions;
  }
  
  private findStableRegion(
    values: number[],
    responses: number[]
  ): { min: number; max: number } {
    // Find region with minimal variation
    let minVar = Infinity;
    let bestStart = 0;
    let bestEnd = values.length - 1;
    
    const windowSize = Math.floor(values.length / 4);
    
    for (let start = 0; start <= values.length - windowSize; start++) {
      const window = responses.slice(start, start + windowSize);
      const variance = this.variance(window);
      
      if (variance < minVar) {
        minVar = variance;
        bestStart = start;
        bestEnd = start + windowSize - 1;
      }
    }
    
    return {
      min: values[bestStart],
      max: values[bestEnd]
    };
  }
  
  private computeSlope(points: Array<{ value: number; response: number }>): number {
    const n = points.length;
    if (n < 2) return 0;
    
    // Linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (const point of points) {
      sumX += point.value;
      sumY += point.response;
      sumXY += point.value * point.response;
      sumX2 += point.value * point.value;
    }
    
    const denominator = n * sumX2 - sumX * sumX;
    return denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  }
  
  private generateMorrisTrajectory(
    parameters: string[],
    levels: number
  ): number[][] {
    const k = parameters.length;
    const trajectory: number[][] = [];
    
    // Random starting point
    const start = parameters.map(() => Math.floor(Math.random() * levels) / (levels - 1));
    trajectory.push(start);
    
    // Generate trajectory with one change at a time
    const order = this.shuffle([...Array(k).keys()]);
    
    for (const idx of order) {
      const current = [...trajectory[trajectory.length - 1]];
      const delta = 1 / (levels - 1);
      
      // Move in positive or negative direction
      if (current[idx] < 0.5) {
        current[idx] = Math.min(1, current[idx] + delta);
      } else {
        current[idx] = Math.max(0, current[idx] - delta);
      }
      
      trajectory.push(current);
    }
    
    return trajectory;
  }
  
  private findChangedParameter(
    point1: number[],
    point2: number[],
    parameters: string[]
  ): string | null {
    for (let i = 0; i < point1.length; i++) {
      if (Math.abs(point1[i] - point2[i]) > 0.001) {
        return parameters[i];
      }
    }
    return null;
  }
  
  private computeStructuralSensitivity(nodeId: string): number {
    const node = this.network.getNode(nodeId);
    if (!node) return 0;
    
    // Sensitivity based on network connectivity
    const inDegree = node.parents.length;
    const outDegree = node.children.length;
    const totalDegree = inDegree + outDegree;
    
    // Normalize by network size
    const networkSize = this.network.getAllNodes().length;
    return totalDegree / (networkSize - 1);
  }
  
  private computeParametricSensitivity(
    nodeId: string,
    belief: BeliefState
  ): number {
    // Sensitivity to CPT parameter changes
    const baseline = this.inferenceEngine.getMarginal(nodeId);
    let totalSensitivity = 0;
    let count = 0;
    
    // Perturb CPT entries
    for (const [state, prob] of baseline.entries()) {
      const perturbation = 0.1;
      const perturbed = new Map(baseline);
      
      perturbed.set(state, Math.min(1, prob + perturbation));
      // Renormalize
      const sum = Array.from(perturbed.values()).reduce((a, b) => a + b, 0);
      for (const [s, p] of perturbed.entries()) {
        perturbed.set(s, p / sum);
      }
      
      // Measure impact
      const impact = this.klDivergence(baseline, perturbed);
      totalSensitivity += impact;
      count++;
    }
    
    return count > 0 ? totalSensitivity / count : 0;
  }
  
  private klDivergence(p: Map<string, number>, q: Map<string, number>): number {
    let kl = 0;
    
    for (const [state, pProb] of p.entries()) {
      const qProb = q.get(state) || 1e-10;
      if (pProb > 0) {
        kl += pProb * Math.log(pProb / qProb);
      }
    }
    
    return kl;
  }
  
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
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
