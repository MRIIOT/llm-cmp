/**
 * Multi-Domain Anomaly Calculator
 * Tracks multiple semantic domains and provides nuanced anomaly detection
 */

import { HTMRegionOutput } from './htm-region.js';
import { DomainAnomalyConfig, DEFAULT_DOMAIN_ANOMALY_CONFIG } from './domain-aware-anomaly.js';

interface DomainProfile {
  id: string;
  patterns: boolean[][];
  centroid: number[];
  lastSeen: number;
  strength: number;
  queryCount: number;
}

interface AnomalyContext {
  rawAnomaly: number;
  domainAnomaly: number;
  transitionAnomaly: number;
  noveltyAnomaly: number;
  finalAnomaly: number;
  activeDomains: string[];
  isTransition: boolean;
  isNovel: boolean;
}

export class MultiDomainAnomalyCalculator {
  private config: DomainAnomalyConfig;
  private domains: Map<string, DomainProfile> = new Map();
  private currentDomains: Set<string> = new Set();
  private recentAnomalies: number[] = [];
  private transitionHistory: Array<{ from: string[], to: string[], timestamp: number }> = [];
  
  constructor(config: Partial<DomainAnomalyConfig> = {}) {
    this.config = { ...DEFAULT_DOMAIN_ANOMALY_CONFIG, ...config };
  }

  calculateAnomaly(
    htmOutput: HTMRegionOutput,
    currentPattern: boolean[],
    semanticSimilarity?: number
  ): number {
    // Get raw anomaly
    const rawAnomaly = 1 - htmOutput.predictionAccuracy;
    
    // Handle no predictions case gracefully
    if (htmOutput.predictions.every((p: boolean) => !p)) {
      // Instead of returning -1, return high anomaly with fallback predictions
      return this.handleNovelPattern(currentPattern, semanticSimilarity);
    }
    
    // Multi-domain analysis
    const context = this.analyzeMultiDomain(currentPattern, rawAnomaly, semanticSimilarity);
    
    // Update history
    this.recentAnomalies.push(context.finalAnomaly);
    if (this.recentAnomalies.length > 20) {
      this.recentAnomalies.shift();
    }
    
    return context.finalAnomaly;
  }
  
  private analyzeMultiDomain(
    pattern: boolean[],
    rawAnomaly: number,
    semanticSimilarity?: number
  ): AnomalyContext {
    // Find matching domains
    const domainMatches = this.findDomainMatches(pattern);
    const activeDomains = domainMatches
      .filter(m => m.similarity > 0.25)
      .map(m => m.domainId);
    
    // Detect domain transition
    const previousDomains = Array.from(this.currentDomains);
    const isTransition = !this.areDomainsEqual(previousDomains, activeDomains);
    
    // Calculate domain-specific anomaly
    let domainAnomaly = rawAnomaly;
    if (domainMatches.length > 0 && domainMatches[0].similarity > 0.4) {
      // Strong domain match - reduce anomaly
      domainAnomaly *= (1 - domainMatches[0].similarity * 0.5);
    }
    
    // Calculate transition anomaly
    let transitionAnomaly = 0;
    if (isTransition) {
      if (activeDomains.length === 0) {
        // Leaving all known domains - high anomaly
        transitionAnomaly = 0.7;
      } else if (previousDomains.length > 0) {
        // Switching between known domains - moderate anomaly
        transitionAnomaly = 0.4;
      } else {
        // Entering first domain - low anomaly
        transitionAnomaly = 0.2;
      }
    }
    
    // Calculate novelty anomaly
    const isNovel = activeDomains.length === 0 && rawAnomaly > 0.5;
    const noveltyAnomaly = isNovel ? 0.8 : 0;
    
    // Combine anomalies intelligently
    let finalAnomaly = rawAnomaly;
    
    if (isNovel) {
      // Novel pattern - use high anomaly
      finalAnomaly = Math.max(noveltyAnomaly, rawAnomaly);
    } else if (isTransition) {
      // Domain transition - blend transition and domain anomalies
      finalAnomaly = 0.6 * transitionAnomaly + 0.4 * domainAnomaly;
    } else {
      // Within domain - use domain anomaly with temporal smoothing
      finalAnomaly = this.applyTemporalSmoothing(domainAnomaly);
    }
    
    // Apply semantic similarity if available
    if (semanticSimilarity !== undefined) {
      if (semanticSimilarity > 0.7) {
        // High similarity - reduce anomaly
        finalAnomaly *= (1 - (semanticSimilarity - 0.7) * 0.5);
      } else if (semanticSimilarity < 0.3 && !isNovel) {
        // Low similarity but not novel - increase anomaly
        finalAnomaly = Math.min(1, finalAnomaly * 1.3);
      }
    }
    
    // Update domains
    this.updateDomains(pattern, activeDomains, domainMatches);
    this.currentDomains = new Set(activeDomains);
    
    // Record transition if occurred
    if (isTransition) {
      this.transitionHistory.push({
        from: previousDomains,
        to: activeDomains,
        timestamp: Date.now()
      });
      if (this.transitionHistory.length > 50) {
        this.transitionHistory.shift();
      }
    }
    
    return {
      rawAnomaly,
      domainAnomaly,
      transitionAnomaly,
      noveltyAnomaly,
      finalAnomaly,
      activeDomains,
      isTransition,
      isNovel
    };
  }
  
  private handleNovelPattern(pattern: boolean[], semanticSimilarity?: number): number {
    // For completely novel patterns, return high anomaly
    // but not 1.0 to allow for some variation
    let novelAnomaly = 0.85;
    
    // If we have semantic similarity, use it to adjust
    if (semanticSimilarity !== undefined) {
      if (semanticSimilarity > 0.5) {
        // Some semantic similarity - reduce anomaly slightly
        novelAnomaly = 0.7;
      } else if (semanticSimilarity < 0.2) {
        // Very low similarity - maximum anomaly
        novelAnomaly = 0.95;
      }
    }
    
    return novelAnomaly;
  }
  
  private findDomainMatches(pattern: boolean[]): Array<{ domainId: string; similarity: number }> {
    const matches: Array<{ domainId: string; similarity: number }> = [];
    
    for (const [domainId, domain] of this.domains) {
      // Calculate similarity with domain centroid
      const similarity = this.cosineSimilarity(pattern, domain.centroid);
      
      // Also check similarity with recent patterns
      let maxPatternSim = 0;
      for (const domainPattern of domain.patterns.slice(-5)) {
        const patternSim = this.jaccardSimilarity(pattern, domainPattern);
        maxPatternSim = Math.max(maxPatternSim, patternSim);
      }
      
      // Combined similarity
      const combinedSim = 0.6 * similarity + 0.4 * maxPatternSim;
      
      matches.push({ domainId, similarity: combinedSim });
    }
    
    // Sort by similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return matches;
  }
  
  private updateDomains(
    pattern: boolean[],
    activeDomains: string[],
    matches: Array<{ domainId: string; similarity: number }>
  ): void {
    // Update existing domains
    for (const domainId of activeDomains) {
      const domain = this.domains.get(domainId);
      if (domain) {
        domain.patterns.push([...pattern]);
        if (domain.patterns.length > 20) {
          domain.patterns.shift();
        }
        domain.lastSeen = Date.now();
        domain.queryCount++;
        domain.strength = Math.min(1, domain.strength * 1.1);
        
        // Update centroid
        this.updateCentroid(domain);
      }
    }
    
    // Create new domain if pattern is novel
    if (activeDomains.length === 0 && matches.every(m => m.similarity < 0.25)) {
      const newDomainId = `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.domains.set(newDomainId, {
        id: newDomainId,
        patterns: [[...pattern]],
        centroid: pattern.map(b => b ? 1 : 0),
        lastSeen: Date.now(),
        strength: 0.5,
        queryCount: 1
      });
      
      // Limit total domains
      if (this.domains.size > 20) {
        // Remove oldest weak domain
        let oldestDomain: string | null = null;
        let oldestTime = Infinity;
        
        for (const [id, domain] of this.domains) {
          if (domain.strength < 0.3 && domain.lastSeen < oldestTime) {
            oldestTime = domain.lastSeen;
            oldestDomain = id;
          }
        }
        
        if (oldestDomain) {
          this.domains.delete(oldestDomain);
        }
      }
    }
    
    // Decay inactive domains
    for (const [domainId, domain] of this.domains) {
      if (!activeDomains.includes(domainId)) {
        domain.strength *= this.config.domainDecayRate;
      }
    }
  }
  
  private updateCentroid(domain: DomainProfile): void {
    const centroid = new Array(domain.patterns[0].length).fill(0);
    
    for (const pattern of domain.patterns) {
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i]) centroid[i]++;
      }
    }
    
    // Normalize
    for (let i = 0; i < centroid.length; i++) {
      centroid[i] /= domain.patterns.length;
    }
    
    domain.centroid = centroid;
  }
  
  private applyTemporalSmoothing(anomaly: number): number {
    if (this.recentAnomalies.length < 3) {
      return anomaly;
    }
    
    // Calculate weighted average with recent anomalies
    const weights = [0.5, 0.3, 0.2]; // Current, previous, 2-ago
    let smoothed = anomaly * weights[0];
    
    for (let i = 1; i < Math.min(weights.length, this.recentAnomalies.length); i++) {
      smoothed += this.recentAnomalies[this.recentAnomalies.length - i] * weights[i];
    }
    
    return smoothed;
  }
  
  private jaccardSimilarity(a: boolean[], b: boolean[]): number {
    if (a.length !== b.length) return 0;
    
    let intersection = 0;
    let union = 0;
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] || b[i]) union++;
      if (a[i] && b[i]) intersection++;
    }
    
    return union === 0 ? 0 : intersection / union;
  }
  
  private cosineSimilarity(pattern: boolean[], centroid: number[]): number {
    if (pattern.length !== centroid.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < pattern.length; i++) {
      const a = pattern[i] ? 1 : 0;
      const b = centroid[i];
      
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
  
  private areDomainsEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    return b.every(d => setA.has(d));
  }
  
  getStats(): {
    domainCount: number;
    activeDomains: string[];
    transitionCount: number;
    averageAnomaly: number;
    domainProfiles: Array<{
      id: string;
      strength: number;
      queryCount: number;
      lastSeen: number;
    }>;
  } {
    return {
      domainCount: this.domains.size,
      activeDomains: Array.from(this.currentDomains),
      transitionCount: this.transitionHistory.length,
      averageAnomaly: this.recentAnomalies.length > 0
        ? this.recentAnomalies.reduce((a, b) => a + b, 0) / this.recentAnomalies.length
        : 0,
      domainProfiles: Array.from(this.domains.values()).map(d => ({
        id: d.id,
        strength: d.strength,
        queryCount: d.queryCount,
        lastSeen: d.lastSeen
      }))
    };
  }
  
  reset(): void {
    this.domains.clear();
    this.currentDomains.clear();
    this.recentAnomalies = [];
    this.transitionHistory = [];
  }
}