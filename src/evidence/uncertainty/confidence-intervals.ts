/**
 * Confidence Interval Computation
 * Calculates various types of confidence intervals for beliefs and predictions
 */

import { BeliefState, Evidence } from '../../types/evidence.types';

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
  method: string;
}

export interface PredictionInterval {
  lower: number;
  upper: number;
  confidence: number;
  coverage: number;
}

export interface CredibleInterval {
  lower: number;
  upper: number;
  credibility: number;
  hdi: boolean; // Highest Density Interval
}

export class ConfidenceIntervals {
  private readonly Z_SCORES = new Map<number, number>([
    [0.90, 1.645],
    [0.95, 1.96],
    [0.99, 2.576],
    [0.999, 3.291]
  ]);
  
  /**
   * Compute confidence interval for belief
   */
  computeConfidenceInterval(
    belief: BeliefState,
    confidence: number = 0.95,
    method: 'normal' | 'bootstrap' | 'wilson' | 'bayesian' = 'wilson'
  ): ConfidenceInterval {
    switch (method) {
      case 'normal':
        return this.normalConfidenceInterval(belief, confidence);
      case 'bootstrap':
        return this.bootstrapConfidenceInterval(belief, confidence);
      case 'wilson':
        return this.wilsonConfidenceInterval(belief, confidence);
      case 'bayesian':
        return this.bayesianCredibleInterval(belief, confidence);
      default:
        return this.wilsonConfidenceInterval(belief, confidence);
    }
  }
  
  /**
   * Compute prediction interval
   */
  computePredictionInterval(
    belief: BeliefState,
    futureEvidence: number = 1,
    confidence: number = 0.95
  ): PredictionInterval {
    const point = belief.belief;
    const uncertainty = belief.uncertainty;
    
    // Account for both parameter uncertainty and future variability
    const paramVar = Math.pow(uncertainty, 2);
    const futureVar = this.estimateFutureVariance(belief, futureEvidence);
    const totalVar = paramVar + futureVar;
    
    const z = this.getZScore(confidence);
    const margin = z * Math.sqrt(totalVar);
    
    // Coverage probability
    const coverage = this.computeCoverage(belief, confidence);
    
    return {
      lower: Math.max(0, point - margin),
      upper: Math.min(1, point + margin),
      confidence,
      coverage
    };
  }
  
  /**
   * Normal approximation confidence interval
   */
  private normalConfidenceInterval(
    belief: BeliefState,
    confidence: number
  ): ConfidenceInterval {
    const n = belief.evidence.length || 1;
    const p = belief.belief;
    const se = Math.sqrt(p * (1 - p) / n);
    
    const z = this.getZScore(confidence);
    const margin = z * se;
    
    return {
      lower: Math.max(0, p - margin),
      upper: Math.min(1, p + margin),
      confidence,
      method: 'normal'
    };
  }
  
  /**
   * Bootstrap confidence interval
   */
  private bootstrapConfidenceInterval(
    belief: BeliefState,
    confidence: number,
    iterations: number = 1000
  ): ConfidenceInterval {
    if (belief.evidence.length === 0) {
      return {
        lower: 0,
        upper: 1,
        confidence,
        method: 'bootstrap'
      };
    }
    
    const bootstrapSamples: number[] = [];
    
    // Generate bootstrap samples
    for (let i = 0; i < iterations; i++) {
      const sample = this.bootstrapSample(belief.evidence);
      const sampleBelief = this.computeSampleBelief(sample);
      bootstrapSamples.push(sampleBelief);
    }
    
    // Sort samples
    bootstrapSamples.sort((a, b) => a - b);
    
    // Compute percentiles
    const alpha = 1 - confidence;
    const lowerIdx = Math.floor(iterations * alpha / 2);
    const upperIdx = Math.floor(iterations * (1 - alpha / 2));
    
    return {
      lower: bootstrapSamples[lowerIdx],
      upper: bootstrapSamples[upperIdx],
      confidence,
      method: 'bootstrap'
    };
  }
  
  /**
   * Wilson score interval (better for proportions)
   */
  private wilsonConfidenceInterval(
    belief: BeliefState,
    confidence: number
  ): ConfidenceInterval {
    const n = belief.evidence.length || 1;
    const p = belief.belief;
    const z = this.getZScore(confidence);
    const z2 = z * z;
    
    // Wilson score formula
    const denominator = 1 + z2 / n;
    const center = (p + z2 / (2 * n)) / denominator;
    const margin = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denominator;
    
    return {
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin),
      confidence,
      method: 'wilson'
    };
  }
  
  /**
   * Bayesian credible interval
   */
  private bayesianCredibleInterval(
    belief: BeliefState,
    credibility: number
  ): ConfidenceInterval {
    if (!belief.posterior || belief.posterior.size === 0) {
      // Use beta distribution for binary belief
      return this.betaCredibleInterval(belief, credibility);
    }
    
    // Use posterior distribution
    const hdi = this.highestDensityInterval(belief.posterior, credibility);
    
    return {
      lower: hdi.lower,
      upper: hdi.upper,
      confidence: credibility,
      method: 'bayesian'
    };
  }
  
  /**
   * Beta distribution credible interval
   */
  private betaCredibleInterval(
    belief: BeliefState,
    credibility: number
  ): ConfidenceInterval {
    // Use Beta conjugate prior
    const successes = belief.evidence.filter(e => e.confidence > 0.5).length;
    const failures = belief.evidence.length - successes;
    
    // Add prior (uniform Beta(1,1))
    const alpha = successes + 1;
    const beta = failures + 1;
    
    // Compute quantiles
    const lowerQ = (1 - credibility) / 2;
    const upperQ = 1 - lowerQ;
    
    const lower = this.betaQuantile(lowerQ, alpha, beta);
    const upper = this.betaQuantile(upperQ, alpha, beta);
    
    return {
      lower,
      upper,
      confidence: credibility,
      method: 'bayesian-beta'
    };
  }
  
  /**
   * Compute highest density interval
   */
  highestDensityInterval(
    posterior: Map<string, number>,
    credibility: number
  ): CredibleInterval {
    // Convert to sorted array
    const items = Array.from(posterior.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by probability descending
    
    // Find smallest interval containing credibility mass
    let mass = 0;
    let lower = Infinity;
    let upper = -Infinity;
    
    for (const [value, prob] of items) {
      mass += prob;
      
      const numValue = this.parseValue(value);
      lower = Math.min(lower, numValue);
      upper = Math.max(upper, numValue);
      
      if (mass >= credibility) break;
    }
    
    return {
      lower,
      upper,
      credibility,
      hdi: true
    };
  }
  
  /**
   * Compute simultaneous confidence intervals (Bonferroni)
   */
  simultaneousConfidenceIntervals(
    beliefs: BeliefState[],
    familyConfidence: number = 0.95
  ): ConfidenceInterval[] {
    const k = beliefs.length;
    const individualConfidence = 1 - (1 - familyConfidence) / k;
    
    return beliefs.map(belief => 
      this.computeConfidenceInterval(belief, individualConfidence)
    );
  }
  
  /**
   * Compute confidence band for time series
   */
  computeConfidenceBand(
    beliefHistory: Array<{ timestamp: Date; belief: BeliefState }>,
    confidence: number = 0.95
  ): Array<{
    timestamp: Date;
    lower: number;
    upper: number;
    prediction: number;
  }> {
    const band: Array<{
      timestamp: Date;
      lower: number;
      upper: number;
      prediction: number;
    }> = [];
    
    // Sort by timestamp
    const sorted = [...beliefHistory].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    for (let i = 0; i < sorted.length; i++) {
      const { timestamp, belief } = sorted[i];
      
      // Compute local confidence interval
      const ci = this.computeConfidenceInterval(belief, confidence);
      
      // Add temporal smoothing
      if (i > 0) {
        const prevBand = band[i - 1];
        const smoothing = 0.3;
        
        ci.lower = ci.lower * (1 - smoothing) + prevBand.lower * smoothing;
        ci.upper = ci.upper * (1 - smoothing) + prevBand.upper * smoothing;
      }
      
      band.push({
        timestamp,
        lower: ci.lower,
        upper: ci.upper,
        prediction: belief.belief
      });
    }
    
    return band;
  }
  
  /**
   * Compute tolerance interval
   */
  computeToleranceInterval(
    belief: BeliefState,
    coverage: number = 0.95,
    confidence: number = 0.95
  ): {
    lower: number;
    upper: number;
    coverage: number;
    confidence: number;
  } {
    const n = belief.evidence.length || 1;
    const values = belief.evidence.map(e => e.confidence);
    
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    
    // Compute order statistics for tolerance interval
    const k = this.toleranceFactor(n, coverage, confidence);
    const lowerIdx = Math.floor(k);
    const upperIdx = Math.ceil(n - k);
    
    return {
      lower: sorted[Math.max(0, lowerIdx - 1)],
      upper: sorted[Math.min(n - 1, upperIdx - 1)],
      coverage,
      confidence
    };
  }
  
  /**
   * Compute profile likelihood confidence interval
   */
  profileLikelihoodInterval(
    belief: BeliefState,
    confidence: number = 0.95
  ): ConfidenceInterval {
    const logLikelihood = (p: number): number => {
      let ll = 0;
      for (const e of belief.evidence) {
        ll += e.confidence * Math.log(p) + (1 - e.confidence) * Math.log(1 - p);
      }
      return ll;
    };
    
    // Find MLE
    const mle = belief.belief;
    const maxLL = logLikelihood(mle);
    
    // Chi-square critical value
    const chiSquare = this.chiSquareQuantile(confidence, 1);
    const threshold = maxLL - chiSquare / 2;
    
    // Find bounds where log-likelihood drops by threshold
    const lower = this.bisectionSearch(
      p => logLikelihood(p) - threshold,
      0, mle, 0.0001
    );
    
    const upper = this.bisectionSearch(
      p => threshold - logLikelihood(p),
      mle, 1, 0.0001
    );
    
    return {
      lower,
      upper,
      confidence,
      method: 'profile-likelihood'
    };
  }
  
  /**
   * Helper functions
   */
  
  private getZScore(confidence: number): number {
    // Find closest available z-score
    let closest = 0.95;
    let minDiff = Math.abs(confidence - 0.95);
    
    for (const [conf] of this.Z_SCORES.entries()) {
      const diff = Math.abs(confidence - conf);
      if (diff < minDiff) {
        minDiff = diff;
        closest = conf;
      }
    }
    
    return this.Z_SCORES.get(closest)!;
  }
  
  private estimateFutureVariance(
    belief: BeliefState,
    futureN: number
  ): number {
    if (belief.evidence.length < 2) {
      return 0.25; // Maximum variance for binary
    }
    
    // Estimate from historical variance
    const values = belief.evidence.map(e => e.confidence);
    const variance = this.variance(values);
    
    // Adjust for future sample size
    return variance / Math.sqrt(futureN);
  }
  
  private computeCoverage(
    belief: BeliefState,
    nominal: number
  ): number {
    // Estimate actual coverage probability
    if (belief.evidence.length < 10) {
      return nominal; // Not enough data
    }
    
    // Use cross-validation
    let covered = 0;
    
    for (let i = 0; i < belief.evidence.length; i++) {
      // Leave one out
      const subset = belief.evidence.filter((_, idx) => idx !== i);
      const subsetBelief: BeliefState = {
        ...belief,
        evidence: subset,
        belief: this.computeSampleBelief(subset)
      };
      
      const ci = this.computeConfidenceInterval(subsetBelief, nominal);
      
      if (belief.evidence[i].confidence >= ci.lower && 
          belief.evidence[i].confidence <= ci.upper) {
        covered++;
      }
    }
    
    return covered / belief.evidence.length;
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
  
  private computeSampleBelief(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0.5;
    
    const sum = evidence.reduce((acc, e) => acc + e.confidence, 0);
    return sum / evidence.length;
  }
  
  private parseValue(value: string): number {
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
    
    // Binary mapping
    if (value === 'true' || value === 'yes' || value === 'positive') return 1;
    if (value === 'false' || value === 'no' || value === 'negative') return 0;
    
    // Default
    return 0.5;
  }
  
  private betaQuantile(q: number, alpha: number, beta: number): number {
    // Newton-Raphson approximation for beta quantile
    let x = alpha / (alpha + beta); // Initial guess
    
    for (let i = 0; i < 20; i++) {
      const cdf = this.betaCDF(x, alpha, beta);
      const pdf = this.betaPDF(x, alpha, beta);
      
      if (Math.abs(cdf - q) < 1e-6) break;
      
      x = x - (cdf - q) / pdf;
      x = Math.max(0.0001, Math.min(0.9999, x));
    }
    
    return x;
  }
  
  private betaCDF(x: number, alpha: number, beta: number): number {
    // Regularized incomplete beta function approximation
    return this.incompleteBeta(x, alpha, beta) / this.betaFunction(alpha, beta);
  }
  
  private betaPDF(x: number, alpha: number, beta: number): number {
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / 
           this.betaFunction(alpha, beta);
  }
  
  private betaFunction(alpha: number, beta: number): number {
    // Using Stirling's approximation for large values
    return Math.exp(
      this.logGamma(alpha) + this.logGamma(beta) - this.logGamma(alpha + beta)
    );
  }
  
  private logGamma(x: number): number {
    // Stirling's approximation
    if (x < 1) return this.logGamma(x + 1) - Math.log(x);
    
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) +
           1 / (12 * x) - 1 / (360 * x * x * x);
  }
  
  private incompleteBeta(x: number, a: number, b: number): number {
    // Continued fraction approximation
    const bt = x === 0 || x === 1 ? 0 :
      Math.exp(this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
               a * Math.log(x) + b * Math.log(1 - x));
    
    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaContinuedFraction(x, a, b) / a;
    } else {
      return 1 - bt * this.betaContinuedFraction(1 - x, b, a) / b;
    }
  }
  
  private betaContinuedFraction(x: number, a: number, b: number): number {
    const maxIterations = 100;
    const epsilon = 1e-10;
    
    let m = 1;
    let h = 1;
    let k = 1;
    let aa = a;
    let bb = b;
    
    for (let i = 0; i < maxIterations; i++) {
      const m2 = 2 * m;
      let anum = m * (b - m) * x / ((aa + m2 - 1) * (aa + m2));
      h = 1 + anum * h;
      k = 1 + anum / k;
      h = h === 0 ? epsilon : h;
      k = k === 0 ? epsilon : k;
      
      anum = -(a + m) * (aa + bb + m) * x / ((aa + m2) * (aa + m2 + 1));
      h = h + anum;
      k = k + anum / k;
      
      if (Math.abs(h * k - 1) < epsilon) break;
      
      m++;
    }
    
    return h / k;
  }
  
  private toleranceFactor(n: number, p: number, conf: number): number {
    // Approximate tolerance factor
    const z = this.getZScore(conf);
    const chi2 = this.chiSquareQuantile(p, n - 1);
    
    return n * (1 - p) / 2 + z * Math.sqrt(n * p * (1 - p) * chi2 / (n - 1));
  }
  
  private chiSquareQuantile(p: number, df: number): number {
    // Wilson-Hilferty approximation
    const z = this.normalQuantile(p);
    const h = 2 / (9 * df);
    
    return df * Math.pow(1 - h + z * Math.sqrt(h), 3);
  }
  
  private normalQuantile(p: number): number {
    // Inverse normal CDF approximation (Acklam)
    const a = [-3.969683028665376e+01, 2.209460984245205e+02,
               -2.759285104469687e+02, 1.383577518672690e+02,
               -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02,
               -1.556989798598866e+02, 6.680131188771972e+01,
               -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01,
               -2.400758277161838e+00, -2.549732539343734e+00,
                4.374664141464968e+00,  2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01,
                2.445134137142996e+00, 3.754408661907416e+00];
    
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    
    let q: number, r: number;
    
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
              (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
  }
  
  private bisectionSearch(
    f: (x: number) => number,
    a: number,
    b: number,
    tolerance: number
  ): number {
    let left = a;
    let right = b;
    
    while (right - left > tolerance) {
      const mid = (left + right) / 2;
      
      if (f(mid) > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }
    
    return (left + right) / 2;
  }
  
  private variance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}
