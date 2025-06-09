/**
 * Domain-Aware Anomaly Calculator
 * Reduces anomaly scores for patterns within the same semantic domain
 */

import { HTMRegionOutput } from './htm-region.js';

export interface DomainAnomalyConfig {
  // Basic thresholds
  inDomainThreshold: number;          // Below this = in-domain (default: 0.25)
  crossDomainThreshold: number;       // Above this = different domain (default: 0.60)
  
  // Smoothing and adaptation
  smoothingFactor: number;            // Exponential smoothing (default: 0.8)
  domainTransitionPenalty: number;    // Extra penalty for domain shifts (default: 0.3)
  
  // Pattern similarity
  minPatternOverlap: number;          // Minimum overlap to consider same domain (default: 0.15)
  patternSimilarityBoost: number;     // Boost for similar patterns (default: 0.5)
  
  // Temporal coherence
  temporalWindow: number;             // Number of recent patterns to consider (default: 10)
  temporalWeight: number;             // Weight of temporal coherence (default: 0.3)
  
  // Domain memory
  domainMemorySize: number;           // Number of domain patterns to remember (default: 100)
  domainDecayRate: number;            // How fast domain patterns decay (default: 0.95)
}

export const DEFAULT_DOMAIN_ANOMALY_CONFIG: DomainAnomalyConfig = {
  inDomainThreshold: 0.25,
  crossDomainThreshold: 0.60,
  smoothingFactor: 0.8,
  domainTransitionPenalty: 0.3,
  minPatternOverlap: 0.15,
  patternSimilarityBoost: 0.5,
  temporalWindow: 10,
  temporalWeight: 0.3,
  domainMemorySize: 100,
  domainDecayRate: 0.95
};

interface DomainPattern {
  pattern: boolean[];
  timestamp: number;
  strength: number;
  domainId?: string;
}

export class DomainAwareAnomalyCalculator {
  private config: DomainAnomalyConfig;
  private recentPatterns: DomainPattern[] = [];
  private domainMemory: Map<string, DomainPattern[]> = new Map();
  private smoothedAnomaly: number = 0;
  private currentDomainId?: string;
  private patternHistory: Array<{ raw: number; adjusted: number; timestamp: number }> = [];

  constructor(config: Partial<DomainAnomalyConfig> = {}) {
    this.config = { ...DEFAULT_DOMAIN_ANOMALY_CONFIG, ...config };
  }

  /**
   * Calculate domain-aware anomaly score
   */
  calculateAnomaly(
    htmOutput: HTMRegionOutput,
    currentPattern: boolean[],
    semanticSimilarity?: number
  ): number {
    // Get raw anomaly from HTM
    const rawAnomaly = 1 - htmOutput.predictionAccuracy;
    
    // If no predictions were made (first pattern), return -1 (N/A)
    if (htmOutput.predictions.every((p: boolean) => !p)) {
      return -1;
    }
    
    // Calculate pattern similarity with recent patterns
    const patternSimilarity = this.calculatePatternSimilarity(currentPattern);
    
    // Calculate temporal coherence
    const temporalCoherence = this.calculateTemporalCoherence();
    
    // Check if pattern belongs to a known domain
    const domainMatch = this.findDomainMatch(currentPattern);
    
    // Adjust anomaly based on domain awareness
    let adjustedAnomaly = rawAnomaly;
    
    // 1. Pattern similarity adjustment
    if (patternSimilarity > this.config.minPatternOverlap) {
      const similarityFactor = Math.min(patternSimilarity * this.config.patternSimilarityBoost, 0.5);
      adjustedAnomaly *= (1 - similarityFactor);
    }
    
    // 2. Temporal coherence adjustment
    adjustedAnomaly *= (1 - this.config.temporalWeight * temporalCoherence);
    
    // 3. Domain match adjustment
    if (domainMatch.found) {
      const domainFactor = domainMatch.strength * 0.7;
      adjustedAnomaly *= (1 - domainFactor);
      
      // Update current domain
      if (domainMatch.domainId !== this.currentDomainId) {
        // Domain transition - add penalty
        adjustedAnomaly += this.config.domainTransitionPenalty;
        this.currentDomainId = domainMatch.domainId;
      }
    }
    
    // 4. Semantic similarity boost (if provided)
    if (semanticSimilarity !== undefined && semanticSimilarity > 0.3) {
      adjustedAnomaly *= (1 - semanticSimilarity * 0.4);
    }
    
    // 5. Apply smoothing
    this.smoothedAnomaly = this.config.smoothingFactor * this.smoothedAnomaly + 
                           (1 - this.config.smoothingFactor) * adjustedAnomaly;
    
    // Ensure anomaly is in valid range [0, 1]
    const finalAnomaly = Math.max(0, Math.min(1, this.smoothedAnomaly));
    
    // Update pattern memory
    this.updatePatternMemory(currentPattern, finalAnomaly);
    
    // Store history for analysis
    this.patternHistory.push({
      raw: rawAnomaly,
      adjusted: finalAnomaly,
      timestamp: Date.now()
    });
    
    // Keep history size bounded
    if (this.patternHistory.length > 100) {
      this.patternHistory = this.patternHistory.slice(-100);
    }
    
    return finalAnomaly;
  }

  /**
   * Calculate similarity between current pattern and recent patterns
   */
  private calculatePatternSimilarity(currentPattern: boolean[]): number {
    if (this.recentPatterns.length === 0) return 0;
    
    let maxSimilarity = 0;
    const windowSize = Math.min(this.config.temporalWindow, this.recentPatterns.length);
    
    // Check similarity with recent patterns
    for (let i = this.recentPatterns.length - windowSize; i < this.recentPatterns.length; i++) {
      const pattern = this.recentPatterns[i];
      const similarity = this.jaccardSimilarity(currentPattern, pattern.pattern);
      
      // Weight by recency and strength
      const recencyWeight = 1 - (this.recentPatterns.length - i - 1) / windowSize * 0.3;
      const weightedSimilarity = similarity * recencyWeight * pattern.strength;
      
      maxSimilarity = Math.max(maxSimilarity, weightedSimilarity);
    }
    
    return maxSimilarity;
  }

  /**
   * Calculate Jaccard similarity between two patterns
   */
  private jaccardSimilarity(pattern1: boolean[], pattern2: boolean[]): number {
    if (pattern1.length !== pattern2.length) return 0;
    
    let intersection = 0;
    let union = 0;
    
    for (let i = 0; i < pattern1.length; i++) {
      if (pattern1[i] || pattern2[i]) union++;
      if (pattern1[i] && pattern2[i]) intersection++;
    }
    
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Calculate temporal coherence based on recent anomaly trends
   */
  private calculateTemporalCoherence(): number {
    if (this.patternHistory.length < 3) return 0.5;
    
    // Look at recent adjusted anomaly scores
    const recentScores = this.patternHistory.slice(-5).map(h => h.adjusted);
    
    // Calculate variance - low variance means high coherence
    const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length;
    
    // Convert variance to coherence (inverse relationship)
    const coherence = 1 / (1 + variance * 10);
    
    return coherence;
  }

  /**
   * Find if pattern matches a known domain
   */
  private findDomainMatch(pattern: boolean[]): { found: boolean; strength: number; domainId?: string } {
    let bestMatch = { found: false, strength: 0, domainId: undefined as string | undefined };
    
    // Check each domain in memory
    for (const [domainId, patterns] of this.domainMemory) {
      let domainSimilarity = 0;
      let count = 0;
      
      // Calculate average similarity with domain patterns
      for (const domainPattern of patterns) {
        const similarity = this.jaccardSimilarity(pattern, domainPattern.pattern);
        domainSimilarity += similarity * domainPattern.strength;
        count += domainPattern.strength;
      }
      
      if (count > 0) {
        const avgSimilarity = domainSimilarity / count;
        if (avgSimilarity > bestMatch.strength && avgSimilarity > this.config.minPatternOverlap) {
          bestMatch = {
            found: true,
            strength: avgSimilarity,
            domainId
          };
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Update pattern memory and domain assignments
   */
  private updatePatternMemory(pattern: boolean[], anomaly: number): void {
    const strength = 1 - anomaly; // High strength for low anomaly patterns
    
    // Add to recent patterns
    this.recentPatterns.push({
      pattern: [...pattern], // Copy to avoid reference issues
      timestamp: Date.now(),
      strength,
      domainId: this.currentDomainId
    });
    
    // Maintain window size
    if (this.recentPatterns.length > this.config.temporalWindow * 2) {
      this.recentPatterns = this.recentPatterns.slice(-this.config.temporalWindow);
    }
    
    // Update domain memory if pattern is stable (low anomaly)
    if (anomaly < this.config.inDomainThreshold) {
      const domainId = this.currentDomainId || this.inferDomainId(pattern);
      
      if (!this.domainMemory.has(domainId)) {
        this.domainMemory.set(domainId, []);
      }
      
      const domainPatterns = this.domainMemory.get(domainId)!;
      domainPatterns.push({
        pattern: [...pattern],
        timestamp: Date.now(),
        strength,
        domainId
      });
      
      // Apply decay to old patterns
      this.applyDomainDecay(domainId);
      
      // Limit domain memory size
      if (domainPatterns.length > this.config.domainMemorySize) {
        // Keep strongest patterns
        domainPatterns.sort((a, b) => b.strength - a.strength);
        this.domainMemory.set(domainId, domainPatterns.slice(0, this.config.domainMemorySize));
      }
    }
  }

  /**
   * Apply decay to domain patterns
   */
  private applyDomainDecay(domainId: string): void {
    const patterns = this.domainMemory.get(domainId);
    if (!patterns) return;
    
    const now = Date.now();
    const updatedPatterns = patterns
      .map(p => ({
        ...p,
        strength: p.strength * Math.pow(this.config.domainDecayRate, (now - p.timestamp) / 3600000) // Decay per hour
      }))
      .filter(p => p.strength > 0.1); // Remove very weak patterns
    
    this.domainMemory.set(domainId, updatedPatterns);
  }

  /**
   * Infer domain ID from pattern characteristics
   */
  private inferDomainId(pattern: boolean[]): string {
    // Simple hash-based domain ID
    let hash = 0;
    let activeCount = 0;
    
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i]) {
        hash = ((hash << 5) - hash) + i;
        hash = hash & hash;
        activeCount++;
      }
    }
    
    // Include sparsity in domain ID
    const sparsity = Math.floor(activeCount / pattern.length * 10);
    return `domain_${Math.abs(hash) % 1000}_s${sparsity}`;
  }

  /**
   * Get anomaly statistics
   */
  getStats(): {
    smoothedAnomaly: number;
    currentDomainId?: string;
    domainCount: number;
    recentPatterns: number;
    averageRawAnomaly: number;
    averageAdjustedAnomaly: number;
  } {
    const rawAnomalies = this.patternHistory.map(h => h.raw);
    const adjustedAnomalies = this.patternHistory.map(h => h.adjusted);
    
    return {
      smoothedAnomaly: this.smoothedAnomaly,
      currentDomainId: this.currentDomainId,
      domainCount: this.domainMemory.size,
      recentPatterns: this.recentPatterns.length,
      averageRawAnomaly: rawAnomalies.length > 0 
        ? rawAnomalies.reduce((a, b) => a + b, 0) / rawAnomalies.length 
        : 0,
      averageAdjustedAnomaly: adjustedAnomalies.length > 0
        ? adjustedAnomalies.reduce((a, b) => a + b, 0) / adjustedAnomalies.length
        : 0
    };
  }

  /**
   * Reset calculator state
   */
  reset(): void {
    this.recentPatterns = [];
    this.domainMemory.clear();
    this.smoothedAnomaly = 0;
    this.currentDomainId = undefined;
    this.patternHistory = [];
  }
}
