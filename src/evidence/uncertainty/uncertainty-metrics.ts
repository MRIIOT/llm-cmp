/**
 * Comprehensive Uncertainty Metrics
 * Quantifies various types of uncertainty in evidence and beliefs
 */

import { Evidence, BeliefState } from '../../types/evidence.types';

export interface UncertaintyMeasures {
  aleatoric: number; // Irreducible randomness
  epistemic: number; // Reducible knowledge uncertainty
  total: number; // Combined uncertainty
  entropy: number; // Information-theoretic uncertainty
  variance: number; // Statistical variance
  credibility: number; // Source credibility factor
  conflict: number; // Evidence conflict measure
}

export interface UncertaintyDecomposition {
  dataUncertainty: number;
  modelUncertainty: number;
  predictionUncertainty: number;
  components: Map<string, number>;
}

export class UncertaintyMetrics {
  private readonly EPSILON = 1e-10;
  
  /**
   * Compute comprehensive uncertainty measures
   */
  computeUncertainty(
    belief: BeliefState,
    evidence?: Evidence[]
  ): UncertaintyMeasures {
    const aleatoric = this.computeAleatoric(belief, evidence);
    const epistemic = this.computeEpistemic(belief, evidence);
    const entropy = this.computeEntropy(belief);
    const variance = this.computeVariance(belief, evidence);
    const credibility = this.computeCredibility(evidence || belief.evidence);
    const conflict = this.computeConflict(evidence || belief.evidence);
    
    // Total uncertainty combines all sources
    const total = this.combineTotalUncertainty({
      aleatoric,
      epistemic,
      entropy,
      variance,
      credibility,
      conflict
    });
    
    return {
      aleatoric,
      epistemic,
      total,
      entropy,
      variance,
      credibility,
      conflict
    };
  }
  
  /**
   * Decompose uncertainty into components
   */
  decomposeUncertainty(
    belief: BeliefState,
    evidence: Evidence[]
  ): UncertaintyDecomposition {
    const components = new Map<string, number>();
    
    // Data-related uncertainty
    const dataUncertainty = this.computeDataUncertainty(evidence);
    components.set('data_quality', dataUncertainty.quality);
    components.set('data_completeness', dataUncertainty.completeness);
    components.set('data_consistency', dataUncertainty.consistency);
    
    // Model-related uncertainty
    const modelUncertainty = this.computeModelUncertainty(belief);
    components.set('model_confidence', modelUncertainty.confidence);
    components.set('model_complexity', modelUncertainty.complexity);
    components.set('model_fit', modelUncertainty.fit);
    
    // Prediction-related uncertainty
    const predictionUncertainty = this.computePredictionUncertainty(belief, evidence);
    components.set('prediction_variance', predictionUncertainty.variance);
    components.set('prediction_bias', predictionUncertainty.bias);
    components.set('prediction_stability', predictionUncertainty.stability);
    
    return {
      dataUncertainty: dataUncertainty.total,
      modelUncertainty: modelUncertainty.total,
      predictionUncertainty: predictionUncertainty.total,
      components
    };
  }
  
  /**
   * Compute aleatoric (irreducible) uncertainty
   */
  private computeAleatoric(belief: BeliefState, evidence?: Evidence[]): number {
    // Intrinsic randomness in the data
    const evidenceList = evidence || belief.evidence;
    
    if (evidenceList.length === 0) {
      return 0.5; // Maximum uncertainty
    }
    
    // Measure inherent variability
    const confidences = evidenceList.map(e => e.confidence);
    const mean = this.mean(confidences);
    
    // Aleatoric uncertainty from natural variation
    let aleatoric = 0;
    
    // Check for bimodal distribution (high aleatoric)
    const modes = this.findModes(confidences);
    if (modes.length > 1) {
      aleatoric += 0.3 * (modes.length - 1) / modes.length;
    }
    
    // Add noise-based uncertainty
    const noise = this.estimateNoise(confidences);
    aleatoric += noise * 0.5;
    
    // Temporal variability
    if (evidenceList.every(e => e.timestamp)) {
      const temporal = this.computeTemporalVariability(evidenceList);
      aleatoric += temporal * 0.2;
    }
    
    return Math.min(1, aleatoric);
  }
  
  /**
   * Compute epistemic (reducible) uncertainty
   */
  private computeEpistemic(belief: BeliefState, evidence?: Evidence[]): number {
    const evidenceList = evidence || belief.evidence;
    
    // Knowledge uncertainty - reducible with more data
    let epistemic = 0;
    
    // Data sparsity
    const sparsity = Math.exp(-evidenceList.length / 10);
    epistemic += sparsity * 0.4;
    
    // Coverage gaps
    const coverage = this.computeCoverage(evidenceList);
    epistemic += (1 - coverage) * 0.3;
    
    // Model uncertainty
    if (belief.posterior) {
      const modelUncertainty = this.computePosteriorUncertainty(belief.posterior);
      epistemic += modelUncertainty * 0.3;
    }
    
    return Math.min(1, epistemic);
  }
  
  /**
   * Compute entropy-based uncertainty
   */
  private computeEntropy(belief: BeliefState): number {
    if (!belief.posterior || belief.posterior.size === 0) {
      // Binary entropy for simple belief
      const p = belief.belief;
      if (p <= 0 || p >= 1) return 0;
      return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
    }
    
    // Shannon entropy for posterior distribution
    let entropy = 0;
    for (const prob of belief.posterior.values()) {
      if (prob > this.EPSILON) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    // Normalize by maximum entropy
    const maxEntropy = Math.log2(belief.posterior.size);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }
  
  /**
   * Compute statistical variance
   */
  private computeVariance(belief: BeliefState, evidence?: Evidence[]): number {
    const evidenceList = evidence || belief.evidence;
    
    if (evidenceList.length < 2) {
      return belief.uncertainty || 0.5;
    }
    
    const confidences = evidenceList.map(e => e.confidence);
    const mean = this.mean(confidences);
    const variance = this.variance(confidences, mean);
    
    // Weight by evidence quality
    const weights = evidenceList.map(e => this.computeEvidenceQuality(e));
    const weightedVariance = this.weightedVariance(confidences, weights);
    
    return Math.sqrt(Math.max(variance, weightedVariance));
  }
  
  /**
   * Compute credibility-based uncertainty
   */
  private computeCredibility(evidence: Evidence[]): number {
    if (evidence.length === 0) return 1.0;
    
    // Analyze source credibility
    const sourceCredibility = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    
    for (const e of evidence) {
      const credibility = this.assessSourceCredibility(e);
      
      if (!sourceCredibility.has(e.source)) {
        sourceCredibility.set(e.source, 0);
        sourceCounts.set(e.source, 0);
      }
      
      sourceCredibility.set(
        e.source,
        sourceCredibility.get(e.source)! + credibility
      );
      sourceCounts.set(e.source, sourceCounts.get(e.source)! + 1);
    }
    
    // Average credibility per source
    let totalCredibility = 0;
    let sourceCount = 0;
    
    for (const [source, sumCred] of sourceCredibility.entries()) {
      const count = sourceCounts.get(source)!;
      totalCredibility += sumCred / count;
      sourceCount++;
    }
    
    const avgCredibility = sourceCount > 0 ? totalCredibility / sourceCount : 0.5;
    
    // Uncertainty is inverse of credibility
    return 1 - avgCredibility;
  }
  
  /**
   * Compute conflict-based uncertainty
   */
  private computeConflict(evidence: Evidence[]): number {
    if (evidence.length < 2) return 0;
    
    let totalConflict = 0;
    let pairs = 0;
    
    // Pairwise conflict assessment
    for (let i = 0; i < evidence.length; i++) {
      for (let j = i + 1; j < evidence.length; j++) {
        const conflict = this.assessConflict(evidence[i], evidence[j]);
        totalConflict += conflict;
        pairs++;
      }
    }
    
    return pairs > 0 ? totalConflict / pairs : 0;
  }
  
  /**
   * Combine uncertainty measures into total
   */
  private combineTotalUncertainty(measures: Omit<UncertaintyMeasures, 'total'>): number {
    // Weighted combination with interaction effects
    const weights = {
      aleatoric: 0.25,
      epistemic: 0.25,
      entropy: 0.20,
      variance: 0.15,
      credibility: 0.10,
      conflict: 0.05
    };
    
    let total = 0;
    
    // Linear combination
    total += weights.aleatoric * measures.aleatoric;
    total += weights.epistemic * measures.epistemic;
    total += weights.entropy * measures.entropy;
    total += weights.variance * measures.variance;
    total += weights.credibility * measures.credibility;
    total += weights.conflict * measures.conflict;
    
    // Interaction effects
    if (measures.conflict > 0.5 && measures.credibility > 0.5) {
      total += 0.1; // High conflict with low credibility
    }
    
    if (measures.epistemic > 0.7 && measures.aleatoric > 0.7) {
      total += 0.05; // Both types of uncertainty high
    }
    
    return Math.min(1, total);
  }
  
  /**
   * Compute data uncertainty components
   */
  private computeDataUncertainty(evidence: Evidence[]): {
    quality: number;
    completeness: number;
    consistency: number;
    total: number;
  } {
    const quality = this.assessDataQuality(evidence);
    const completeness = this.assessDataCompleteness(evidence);
    const consistency = this.assessDataConsistency(evidence);
    
    const total = (quality + completeness + consistency) / 3;
    
    return { quality, completeness, consistency, total };
  }
  
  /**
   * Compute model uncertainty components
   */
  private computeModelUncertainty(belief: BeliefState): {
    confidence: number;
    complexity: number;
    fit: number;
    total: number;
  } {
    const confidence = 1 - (belief.uncertainty || 0.5);
    
    // Model complexity from posterior distribution
    let complexity = 0;
    if (belief.posterior) {
      // More states = more complex model
      complexity = Math.log2(belief.posterior.size) / 10;
    }
    
    // Model fit from evidence alignment
    const fit = this.assessModelFit(belief);
    
    const total = (1 - confidence + complexity + (1 - fit)) / 3;
    
    return { confidence, complexity, fit, total };
  }
  
  /**
   * Compute prediction uncertainty components
   */
  private computePredictionUncertainty(
    belief: BeliefState,
    evidence: Evidence[]
  ): {
    variance: number;
    bias: number;
    stability: number;
    total: number;
  } {
    const variance = this.computeVariance(belief, evidence);
    const bias = this.assessPredictionBias(belief, evidence);
    const stability = this.assessPredictionStability(belief, evidence);
    
    const total = (variance + bias + (1 - stability)) / 3;
    
    return { variance, bias, stability, total };
  }
  
  /**
   * Find modes in distribution
   */
  private findModes(values: number[]): number[] {
    if (values.length < 3) return [this.mean(values)];
    
    const sorted = [...values].sort((a, b) => a - b);
    const bandwidth = 0.1;
    const modes: number[] = [];
    
    // Kernel density estimation
    for (let i = 0; i < sorted.length; i++) {
      const point = sorted[i];
      let density = 0;
      
      for (const value of sorted) {
        const diff = Math.abs(value - point);
        if (diff < bandwidth) {
          density += Math.exp(-diff * diff / (2 * bandwidth * bandwidth));
        }
      }
      
      // Check if local maximum
      const prevDensity = i > 0 ? this.kernelDensity(sorted[i - 1], sorted, bandwidth) : 0;
      const nextDensity = i < sorted.length - 1 ? 
        this.kernelDensity(sorted[i + 1], sorted, bandwidth) : 0;
      
      if (density > prevDensity && density > nextDensity) {
        modes.push(point);
      }
    }
    
    return modes.length > 0 ? modes : [this.mean(values)];
  }
  
  /**
   * Kernel density at point
   */
  private kernelDensity(point: number, values: number[], bandwidth: number): number {
    let density = 0;
    
    for (const value of values) {
      const diff = Math.abs(value - point);
      if (diff < bandwidth) {
        density += Math.exp(-diff * diff / (2 * bandwidth * bandwidth));
      }
    }
    
    return density;
  }
  
  /**
   * Estimate noise in measurements
   */
  private estimateNoise(values: number[]): number {
    if (values.length < 3) return 0.1;
    
    // Compute successive differences
    const diffs: number[] = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(Math.abs(values[i] - values[i - 1]));
    }
    
    // MAD estimator for noise
    const medianDiff = this.median(diffs);
    const mad = this.median(diffs.map(d => Math.abs(d - medianDiff)));
    
    // Scale to [0, 1]
    return Math.min(1, mad * 1.4826); // MAD to std deviation
  }
  
  /**
   * Compute temporal variability
   */
  private computeTemporalVariability(evidence: Evidence[]): number {
    const timeSeries = evidence
      .filter(e => e.timestamp)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
    
    if (timeSeries.length < 2) return 0;
    
    // Compute autocorrelation
    const values = timeSeries.map(e => e.confidence);
    const acf = this.autocorrelation(values, 1);
    
    // High autocorrelation = low variability
    return 1 - Math.abs(acf);
  }
  
  /**
   * Compute evidence coverage
   */
  private computeCoverage(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    // Topic coverage
    const topics = new Set(evidence.map(e => e.topic || 'unknown'));
    const topicCoverage = Math.min(1, topics.size / 10); // Assume 10 topics full coverage
    
    // Source diversity
    const sources = new Set(evidence.map(e => e.source));
    const sourceDiversity = Math.min(1, sources.size / 5); // Assume 5 sources full coverage
    
    // Temporal coverage
    let temporalCoverage = 0;
    if (evidence.every(e => e.timestamp)) {
      const timestamps = evidence.map(e => e.timestamp!.getTime());
      const range = Math.max(...timestamps) - Math.min(...timestamps);
      const gaps = this.findTemporalGaps(timestamps);
      temporalCoverage = gaps.length === 0 ? 1 : 1 / (1 + gaps.length);
    }
    
    return (topicCoverage + sourceDiversity + temporalCoverage) / 3;
  }
  
  /**
   * Find temporal gaps in evidence
   */
  private findTemporalGaps(timestamps: number[]): number[] {
    const sorted = [...timestamps].sort((a, b) => a - b);
    const gaps: number[] = [];
    
    // Expected interval
    const avgInterval = (sorted[sorted.length - 1] - sorted[0]) / (sorted.length - 1);
    
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap > avgInterval * 2) {
        gaps.push(gap);
      }
    }
    
    return gaps;
  }
  
  /**
   * Compute posterior uncertainty
   */
  private computePosteriorUncertainty(posterior: Map<string, number>): number {
    // Gini coefficient for distribution inequality
    const values = Array.from(posterior.values()).sort((a, b) => a - b);
    const n = values.length;
    
    if (n === 0) return 1;
    
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * values[i];
    }
    
    gini = gini / (n * this.sum(values));
    
    // High Gini = concentrated distribution = low uncertainty
    return 1 - Math.abs(gini);
  }
  
  /**
   * Compute evidence quality
   */
  private computeEvidenceQuality(evidence: Evidence): number {
    let quality = evidence.confidence;
    
    // Adjust for metadata indicators
    if (evidence.metadata) {
      if (evidence.metadata.has('verified')) {
        quality *= evidence.metadata.get('verified') ? 1.2 : 0.8;
      }
      if (evidence.metadata.has('sample_size')) {
        const sampleSize = evidence.metadata.get('sample_size');
        quality *= Math.min(1.5, 1 + Math.log10(sampleSize) / 10);
      }
    }
    
    // Recency factor
    if (evidence.timestamp) {
      const age = Date.now() - evidence.timestamp.getTime();
      const ageDays = age / (1000 * 60 * 60 * 24);
      quality *= Math.exp(-ageDays / 365); // Decay over a year
    }
    
    return Math.min(1, quality);
  }
  
  /**
   * Assess source credibility
   */
  private assessSourceCredibility(evidence: Evidence): number {
    // Base credibility from confidence
    let credibility = evidence.confidence;
    
    // Source reputation (simplified)
    const trustedSources = ['official', 'verified', 'expert', 'primary'];
    const untrustedSources = ['anonymous', 'unverified', 'rumor'];
    
    for (const trusted of trustedSources) {
      if (evidence.source.toLowerCase().includes(trusted)) {
        credibility *= 1.2;
      }
    }
    
    for (const untrusted of untrustedSources) {
      if (evidence.source.toLowerCase().includes(untrusted)) {
        credibility *= 0.7;
      }
    }
    
    return Math.min(1, Math.max(0, credibility));
  }
  
  /**
   * Assess conflict between evidence
   */
  private assessConflict(e1: Evidence, e2: Evidence): number {
    // Confidence disagreement
    const confDiff = Math.abs(e1.confidence - e2.confidence);
    
    // Sentiment disagreement
    let sentimentDiff = 0;
    if (e1.sentiment !== undefined && e2.sentiment !== undefined) {
      sentimentDiff = Math.abs(e1.sentiment - e2.sentiment) / 2;
    }
    
    // Topic mismatch
    let topicMismatch = 0;
    if (e1.topic && e2.topic && e1.topic !== e2.topic) {
      topicMismatch = 0.3;
    }
    
    return Math.min(1, confDiff * 0.5 + sentimentDiff * 0.3 + topicMismatch * 0.2);
  }
  
  /**
   * Assess data quality
   */
  private assessDataQuality(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    let totalQuality = 0;
    for (const e of evidence) {
      totalQuality += this.computeEvidenceQuality(e);
    }
    
    return totalQuality / evidence.length;
  }
  
  /**
   * Assess data completeness
   */
  private assessDataCompleteness(evidence: Evidence[]): number {
    const requiredFields = ['content', 'source', 'confidence', 'timestamp', 'topic'];
    let totalCompleteness = 0;
    
    for (const e of evidence) {
      let fields = 0;
      if (e.content) fields++;
      if (e.source) fields++;
      if (e.confidence !== undefined) fields++;
      if (e.timestamp) fields++;
      if (e.topic) fields++;
      
      totalCompleteness += fields / requiredFields.length;
    }
    
    return evidence.length > 0 ? totalCompleteness / evidence.length : 0;
  }
  
  /**
   * Assess data consistency
   */
  private assessDataConsistency(evidence: Evidence[]): number {
    if (evidence.length < 2) return 1;
    
    // Measure consistency of confidence values
    const confidences = evidence.map(e => e.confidence);
    const cv = this.coefficientOfVariation(confidences);
    
    // Lower CV = more consistent
    return Math.exp(-cv);
  }
  
  /**
   * Assess model fit
   */
  private assessModelFit(belief: BeliefState): number {
    if (belief.evidence.length === 0) return 0.5;
    
    // How well does belief align with evidence
    const evidenceMean = this.mean(belief.evidence.map(e => e.confidence));
    const fit = 1 - Math.abs(belief.belief - evidenceMean);
    
    return fit;
  }
  
  /**
   * Assess prediction bias
   */
  private assessPredictionBias(belief: BeliefState, evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    const predictions = evidence.map(e => e.confidence);
    const actual = belief.belief;
    
    // Systematic over/under estimation
    const errors = predictions.map(p => p - actual);
    const meanError = this.mean(errors);
    
    return Math.abs(meanError);
  }
  
  /**
   * Assess prediction stability
   */
  private assessPredictionStability(belief: BeliefState, evidence: Evidence[]): number {
    if (evidence.length < 3) return 0.5;
    
    // Sort by timestamp if available
    const sorted = evidence.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
      return 0;
    });
    
    // Measure volatility
    const values = sorted.map(e => e.confidence);
    const volatility = this.computeVolatility(values);
    
    // Lower volatility = higher stability
    return Math.exp(-volatility);
  }
  
  /**
   * Compute volatility
   */
  private computeVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      const ret = Math.log(values[i] / values[i - 1]);
      returns.push(ret);
    }
    
    return this.stdDev(returns);
  }
  
  /**
   * Helper statistics functions
   */
  private mean(values: number[]): number {
    return values.length > 0 ? this.sum(values) / values.length : 0;
  }
  
  private sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }
  
  private variance(values: number[], mean?: number): number {
    const m = mean ?? this.mean(values);
    return values.length > 0
      ? values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length
      : 0;
  }
  
  private stdDev(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }
  
  private median(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  private weightedVariance(values: number[], weights: number[]): number {
    const weightedMean = this.weightedMean(values, weights);
    const totalWeight = this.sum(weights);
    
    if (totalWeight === 0) return 0;
    
    let weightedVar = 0;
    for (let i = 0; i < values.length; i++) {
      weightedVar += weights[i] * Math.pow(values[i] - weightedMean, 2);
    }
    
    return weightedVar / totalWeight;
  }
  
  private weightedMean(values: number[], weights: number[]): number {
    const totalWeight = this.sum(weights);
    if (totalWeight === 0) return 0;
    
    let weightedSum = 0;
    for (let i = 0; i < values.length; i++) {
      weightedSum += values[i] * weights[i];
    }
    
    return weightedSum / totalWeight;
  }
  
  private autocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;
    
    const mean = this.mean(values);
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < values.length - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }
  
  private coefficientOfVariation(values: number[]): number {
    const mean = this.mean(values);
    const std = this.stdDev(values);
    
    return mean > 0 ? std / mean : 0;
  }
}
