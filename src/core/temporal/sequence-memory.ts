/**
 * Episodic Sequence Memory
 * 
 * Stores and retrieves episodic sequences with temporal context.
 * Supports hierarchical sequence organization, similarity-based retrieval,
 * and context-dependent memory consolidation.
 * 
 * Based on episodic memory principles and temporal sequence learning.
 */

export interface SequenceEpisode {
  id: string;
  sequence: any[];
  temporalContext: number[];
  spatialContext: number[];
  timestamp: number;
  importance: number;
  accessCount: number;
  lastAccessed: number;
  
  // Episodic metadata
  tags: string[];
  associations: string[];
  consolidationLevel: number;
  emotionalValence: number;
}

export interface SequenceQuery {
  pattern?: any[];
  temporalContext?: number[];
  spatialContext?: number[];
  timeRange?: { start: number; end: number };
  tags?: string[];
  similarityThreshold: number;
  maxResults: number;
}

export interface SequenceMemoryConfig {
  maxEpisodes: number;
  consolidationThreshold: number;
  decayRate: number;
  similarityThreshold: number;
  importanceWeighting: {
    recency: number;
    frequency: number;
    distinctiveness: number;
    emotional: number;
  };
}

export interface MemoryStats {
  totalEpisodes: number;
  consolidatedEpisodes: number;
  averageSequenceLength: number;
  memoryUtilization: number;
  retrievalAccuracy: number;
  consolidationRate: number;
}

export class SequenceMemory {
  private episodes: Map<string, SequenceEpisode>;
  private temporalIndex: Map<number, string[]>; // Time bucket -> episode IDs
  private contextIndex: Map<string, string[]>; // Context signature -> episode IDs
  private tagIndex: Map<string, string[]>; // Tag -> episode IDs
  private config: SequenceMemoryConfig;
  
  // Consolidation tracking
  private consolidationQueue: string[];
  private recentRetrievals: { episodeId: string; timestamp: number; accuracy: number }[];
  
  // Performance metrics
  private accessPatterns: Map<string, number>;
  private forgettingCurve: { time: number; retention: number }[];
  
  private nextEpisodeId: number;

  constructor(config: Partial<SequenceMemoryConfig> = {}) {
    this.config = {
      maxEpisodes: 10000,
      consolidationThreshold: 5,
      decayRate: 0.01,
      similarityThreshold: 0.7,
      importanceWeighting: {
        recency: 0.3,
        frequency: 0.25,
        distinctiveness: 0.25,
        emotional: 0.2
      },
      ...config
    };
    
    this.episodes = new Map();
    this.temporalIndex = new Map();
    this.contextIndex = new Map();
    this.tagIndex = new Map();
    this.consolidationQueue = [];
    this.recentRetrievals = [];
    this.accessPatterns = new Map();
    this.forgettingCurve = [];
    this.nextEpisodeId = 1;
  }

  /**
   * Store a new sequence episode
   */
  public storeEpisode(
    sequence: any[],
    temporalContext: number[],
    spatialContext: number[],
    tags: string[] = [],
    emotionalValence: number = 0
  ): string {
    const episodeId = this.generateEpisodeId();
    const timestamp = Date.now();
    
    const episode: SequenceEpisode = {
      id: episodeId,
      sequence: [...sequence],
      temporalContext: [...temporalContext],
      spatialContext: [...spatialContext],
      timestamp,
      importance: this.calculateInitialImportance(sequence, emotionalValence),
      accessCount: 0,
      lastAccessed: timestamp,
      tags: [...tags],
      associations: [],
      consolidationLevel: 0,
      emotionalValence
    };
    
    // Store episode
    this.episodes.set(episodeId, episode);
    
    // Update indices
    this.updateIndices(episode);
    
    // Add to consolidation queue if important enough
    if (episode.importance > this.config.consolidationThreshold) {
      this.consolidationQueue.push(episodeId);
    }
    
    // Perform maintenance if needed
    if (this.episodes.size > this.config.maxEpisodes) {
      this.performMaintenance();
    }
    
    return episodeId;
  }

  /**
   * Retrieve episodes matching query criteria
   */
  public retrieveEpisodes(query: SequenceQuery): SequenceEpisode[] {
    const candidates = this.findCandidateEpisodes(query);
    const scored = this.scoreEpisodes(candidates, query);
    const filtered = scored.filter(item => item.score >= query.similarityThreshold);
    
    // Sort by score and limit results
    const results = filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, query.maxResults)
      .map(item => item.episode);
    
    // Update access patterns
    for (const episode of results) {
      this.recordAccess(episode.id);
    }
    
    return results;
  }

  /**
   * Find the most similar episode to a given pattern
   */
  public findMostSimilar(
    pattern: any[],
    temporalContext?: number[],
    spatialContext?: number[]
  ): SequenceEpisode | null {
    const query: SequenceQuery = {
      pattern,
      temporalContext,
      spatialContext,
      similarityThreshold: 0.1, // Low threshold for finding anything similar
      maxResults: 1
    };
    
    const results = this.retrieveEpisodes(query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get episodes by temporal range
   */
  public getEpisodesByTimeRange(startTime: number, endTime: number): SequenceEpisode[] {
    const episodes: SequenceEpisode[] = [];
    
    for (const episode of this.episodes.values()) {
      if (episode.timestamp >= startTime && episode.timestamp <= endTime) {
        episodes.push(episode);
      }
    }
    
    return episodes.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get episodes by tags
   */
  public getEpisodesByTags(tags: string[]): SequenceEpisode[] {
    const episodeIds = new Set<string>();
    
    for (const tag of tags) {
      const tagEpisodes = this.tagIndex.get(tag) || [];
      tagEpisodes.forEach(id => episodeIds.add(id));
    }
    
    return Array.from(episodeIds)
      .map(id => this.episodes.get(id))
      .filter(episode => episode !== undefined) as SequenceEpisode[];
  }

  /**
   * Consolidate memories based on access patterns and importance
   */
  public consolidateMemories(): void {
    const toConsolidate = [...this.consolidationQueue];
    this.consolidationQueue = [];
    
    for (const episodeId of toConsolidate) {
      const episode = this.episodes.get(episodeId);
      if (!episode) continue;
      
      // Increase consolidation level
      episode.consolidationLevel = Math.min(1.0, episode.consolidationLevel + 0.1);
      
      // Find and strengthen associations
      this.strengthenAssociations(episode);
      
      // Update importance based on consolidation
      episode.importance *= (1 + episode.consolidationLevel * 0.2);
    }
  }

  /**
   * Apply forgetting to reduce memory load
   */
  public applyForgetting(): void {
    const currentTime = Date.now();
    const toForget: string[] = [];
    
    for (const [episodeId, episode] of this.episodes) {
      // Calculate forgetting factor based on time and access patterns
      const timeSinceAccess = currentTime - episode.lastAccessed;
      const forgettingFactor = Math.exp(-timeSinceAccess * this.config.decayRate / (1000 * 60 * 60 * 24)); // Daily decay
      
      // Apply consolidation protection
      const consolidationProtection = episode.consolidationLevel;
      const protectedForgetting = forgettingFactor * (1 - consolidationProtection);
      
      // Reduce importance
      episode.importance *= (1 - protectedForgetting);
      
      // Mark for deletion if importance drops too low
      if (episode.importance < 0.1 && episode.consolidationLevel < 0.3) {
        toForget.push(episodeId);
      }
    }
    
    // Remove forgotten episodes
    for (const episodeId of toForget) {
      this.forgetEpisode(episodeId);
    }
    
    // Record forgetting curve data
    this.recordForgettingCurve();
  }

  /**
   * Create associations between related episodes
   */
  public createAssociation(episodeId1: string, episodeId2: string, strength: number = 1.0): void {
    const episode1 = this.episodes.get(episodeId1);
    const episode2 = this.episodes.get(episodeId2);
    
    if (!episode1 || !episode2) return;
    
    // Add bidirectional associations
    const association1 = `${episodeId2}:${strength}`;
    const association2 = `${episodeId1}:${strength}`;
    
    if (!episode1.associations.includes(association1)) {
      episode1.associations.push(association1);
    }
    
    if (!episode2.associations.includes(association2)) {
      episode2.associations.push(association2);
    }
  }

  /**
   * Get associated episodes for a given episode
   */
  public getAssociatedEpisodes(episodeId: string): { episode: SequenceEpisode; strength: number }[] {
    const episode = this.episodes.get(episodeId);
    if (!episode) return [];
    
    const associated: { episode: SequenceEpisode; strength: number }[] = [];
    
    for (const association of episode.associations) {
      const [assocId, strengthStr] = association.split(':');
      const assocEpisode = this.episodes.get(assocId);
      
      if (assocEpisode) {
        associated.push({
          episode: assocEpisode,
          strength: parseFloat(strengthStr) || 1.0
        });
      }
    }
    
    return associated.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(): MemoryStats {
    const totalEpisodes = this.episodes.size;
    const consolidatedEpisodes = Array.from(this.episodes.values())
      .filter(episode => episode.consolidationLevel > 0.5).length;
    
    const totalSequenceLength = Array.from(this.episodes.values())
      .reduce((sum, episode) => sum + episode.sequence.length, 0);
    const averageSequenceLength = totalEpisodes > 0 ? totalSequenceLength / totalEpisodes : 0;
    
    const memoryUtilization = totalEpisodes / this.config.maxEpisodes;
    
    const recentAccuracy = this.recentRetrievals.slice(-100);
    const retrievalAccuracy = recentAccuracy.length > 0 ?
      recentAccuracy.reduce((sum, r) => sum + r.accuracy, 0) / recentAccuracy.length : 0;
    
    const consolidationRate = totalEpisodes > 0 ? consolidatedEpisodes / totalEpisodes : 0;
    
    return {
      totalEpisodes,
      consolidatedEpisodes,
      averageSequenceLength,
      memoryUtilization,
      retrievalAccuracy,
      consolidationRate
    };
  }

  /**
   * Search for episodes containing a specific subsequence
   */
  public searchSubsequence(subsequence: any[], similarityThreshold: number = 0.8): SequenceEpisode[] {
    const matches: SequenceEpisode[] = [];
    
    for (const episode of this.episodes.values()) {
      if (this.containsSubsequence(episode.sequence, subsequence, similarityThreshold)) {
        matches.push(episode);
      }
    }
    
    return matches.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Generate episode ID
   */
  private generateEpisodeId(): string {
    return `episode_${this.nextEpisodeId++}_${Date.now()}`;
  }

  /**
   * Calculate initial importance of an episode
   */
  private calculateInitialImportance(sequence: any[], emotionalValence: number): number {
    // Base importance on sequence length and uniqueness
    const lengthFactor = Math.log(sequence.length + 1);
    const uniquenessFactor = this.calculateUniqueness(sequence);
    const emotionalFactor = Math.abs(emotionalValence);
    
    return lengthFactor * uniquenessFactor * (1 + emotionalFactor);
  }

  /**
   * Calculate uniqueness of a sequence
   */
  private calculateUniqueness(sequence: any[]): number {
    // Compare with existing episodes to determine uniqueness
    let maxSimilarity = 0;
    
    for (const episode of this.episodes.values()) {
      const similarity = this.calculateSequenceSimilarity(sequence, episode.sequence);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    return 1 - maxSimilarity;
  }

  /**
   * Update indices for fast retrieval
   */
  private updateIndices(episode: SequenceEpisode): void {
    // Temporal index (bucket by day)
    const dayBucket = Math.floor(episode.timestamp / (1000 * 60 * 60 * 24));
    if (!this.temporalIndex.has(dayBucket)) {
      this.temporalIndex.set(dayBucket, []);
    }
    this.temporalIndex.get(dayBucket)!.push(episode.id);
    
    // Context index
    const contextSignature = this.generateContextSignature(episode.temporalContext, episode.spatialContext);
    if (!this.contextIndex.has(contextSignature)) {
      this.contextIndex.set(contextSignature, []);
    }
    this.contextIndex.get(contextSignature)!.push(episode.id);
    
    // Tag index
    for (const tag of episode.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, []);
      }
      this.tagIndex.get(tag)!.push(episode.id);
    }
  }

  /**
   * Generate context signature for indexing
   */
  private generateContextSignature(temporalContext: number[], spatialContext: number[]): string {
    // Create a compact signature from context vectors
    const temporal = temporalContext.map(x => Math.round(x * 10)).join(',');
    const spatial = spatialContext.map(x => Math.round(x * 10)).join(',');
    return `${temporal}|${spatial}`;
  }

  /**
   * Find candidate episodes for a query
   */
  private findCandidateEpisodes(query: SequenceQuery): SequenceEpisode[] {
    let candidates = new Set<string>();
    
    // Search by temporal context
    if (query.temporalContext) {
      const signature = this.generateContextSignature(query.temporalContext, query.spatialContext || []);
      const contextCandidates = this.contextIndex.get(signature) || [];
      contextCandidates.forEach(id => candidates.add(id));
    }
    
    // Search by tags
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        const tagCandidates = this.tagIndex.get(tag) || [];
        tagCandidates.forEach(id => candidates.add(id));
      }
    }
    
    // Search by time range
    if (query.timeRange) {
      const startBucket = Math.floor(query.timeRange.start / (1000 * 60 * 60 * 24));
      const endBucket = Math.floor(query.timeRange.end / (1000 * 60 * 60 * 24));
      
      for (let bucket = startBucket; bucket <= endBucket; bucket++) {
        const timeCandidates = this.temporalIndex.get(bucket) || [];
        timeCandidates.forEach(id => candidates.add(id));
      }
    }
    
    // If no specific criteria, return all episodes
    if (candidates.size === 0) {
      return Array.from(this.episodes.values());
    }
    
    return Array.from(candidates)
      .map(id => this.episodes.get(id))
      .filter(episode => episode !== undefined) as SequenceEpisode[];
  }

  /**
   * Score episodes based on query similarity
   */
  private scoreEpisodes(
    candidates: SequenceEpisode[],
    query: SequenceQuery
  ): { episode: SequenceEpisode; score: number }[] {
    return candidates.map(episode => ({
      episode,
      score: this.calculateEpisodeScore(episode, query)
    }));
  }

  /**
   * Calculate similarity score between episode and query
   */
  private calculateEpisodeScore(episode: SequenceEpisode, query: SequenceQuery): number {
    let score = 0;
    let weights = 0;
    
    // Pattern similarity
    if (query.pattern) {
      const patternSimilarity = this.calculateSequenceSimilarity(query.pattern, episode.sequence);
      score += patternSimilarity * 0.4;
      weights += 0.4;
    }
    
    // Temporal context similarity
    if (query.temporalContext) {
      const temporalSimilarity = this.calculateVectorSimilarity(query.temporalContext, episode.temporalContext);
      score += temporalSimilarity * 0.3;
      weights += 0.3;
    }
    
    // Spatial context similarity
    if (query.spatialContext) {
      const spatialSimilarity = this.calculateVectorSimilarity(query.spatialContext, episode.spatialContext);
      score += spatialSimilarity * 0.2;
      weights += 0.2;
    }
    
    // Importance weighting
    const importanceScore = Math.min(1.0, episode.importance / 10);
    score += importanceScore * 0.1;
    weights += 0.1;
    
    return weights > 0 ? score / weights : 0;
  }

  /**
   * Calculate similarity between two sequences
   */
  private calculateSequenceSimilarity(seq1: any[], seq2: any[]): number {
    if (seq1.length === 0 && seq2.length === 0) return 1.0;
    if (seq1.length === 0 || seq2.length === 0) return 0.0;
    
    // Use longest common subsequence similarity
    const lcs = this.longestCommonSubsequence(seq1, seq2);
    return (2 * lcs) / (seq1.length + seq2.length);
  }

  /**
   * Calculate similarity between two vectors
   */
  private calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(norm1 * norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Calculate longest common subsequence length
   */
  private longestCommonSubsequence(seq1: any[], seq2: any[]): number {
    const m = seq1.length;
    const n = seq2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (this.elementsEqual(seq1[i - 1], seq2[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    return dp[m][n];
  }

  /**
   * Check if two elements are equal (with tolerance for numbers)
   */
  private elementsEqual(elem1: any, elem2: any): boolean {
    if (typeof elem1 === 'number' && typeof elem2 === 'number') {
      return Math.abs(elem1 - elem2) < 1e-6;
    }
    return elem1 === elem2;
  }

  /**
   * Check if sequence contains subsequence
   */
  private containsSubsequence(sequence: any[], subsequence: any[], threshold: number): boolean {
    for (let i = 0; i <= sequence.length - subsequence.length; i++) {
      const slice = sequence.slice(i, i + subsequence.length);
      const similarity = this.calculateSequenceSimilarity(slice, subsequence);
      if (similarity >= threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Record access to an episode
   */
  private recordAccess(episodeId: string): void {
    const episode = this.episodes.get(episodeId);
    if (!episode) return;
    
    episode.accessCount++;
    episode.lastAccessed = Date.now();
    
    // Update importance based on access
    episode.importance *= 1.05; // Small boost for being accessed
    
    // Track access patterns
    const count = this.accessPatterns.get(episodeId) || 0;
    this.accessPatterns.set(episodeId, count + 1);
  }

  /**
   * Strengthen associations between related episodes
   */
  private strengthenAssociations(episode: SequenceEpisode): void {
    // Find episodes with similar context
    const similarEpisodes = this.findSimilarEpisodes(episode, 0.7);
    
    for (const similar of similarEpisodes.slice(0, 5)) { // Top 5 most similar
      this.createAssociation(episode.id, similar.episode.id, similar.similarity);
    }
  }

  /**
   * Find episodes similar to a given episode
   */
  private findSimilarEpisodes(
    episode: SequenceEpisode,
    threshold: number
  ): { episode: SequenceEpisode; similarity: number }[] {
    const similar: { episode: SequenceEpisode; similarity: number }[] = [];
    
    for (const candidate of this.episodes.values()) {
      if (candidate.id === episode.id) continue;
      
      const similarity = this.calculateEpisodeSimilarity(episode, candidate);
      if (similarity >= threshold) {
        similar.push({ episode: candidate, similarity });
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate similarity between two episodes
   */
  private calculateEpisodeSimilarity(episode1: SequenceEpisode, episode2: SequenceEpisode): number {
    const sequenceSim = this.calculateSequenceSimilarity(episode1.sequence, episode2.sequence);
    const temporalSim = this.calculateVectorSimilarity(episode1.temporalContext, episode2.temporalContext);
    const spatialSim = this.calculateVectorSimilarity(episode1.spatialContext, episode2.spatialContext);
    
    return (sequenceSim + temporalSim + spatialSim) / 3;
  }

  /**
   * Perform memory maintenance
   */
  private performMaintenance(): void {
    // Apply forgetting
    this.applyForgetting();
    
    // Consolidate important memories
    this.consolidateMemories();
    
    // Clean up indices
    this.cleanupIndices();
  }

  /**
   * Remove an episode from memory
   */
  private forgetEpisode(episodeId: string): void {
    const episode = this.episodes.get(episodeId);
    if (!episode) return;
    
    // Remove from main storage
    this.episodes.delete(episodeId);
    
    // Remove from indices
    this.removeFromIndices(episode);
    
    // Remove from consolidation queue
    const queueIndex = this.consolidationQueue.indexOf(episodeId);
    if (queueIndex > -1) {
      this.consolidationQueue.splice(queueIndex, 1);
    }
    
    // Remove access patterns
    this.accessPatterns.delete(episodeId);
  }

  /**
   * Remove episode from all indices
   */
  private removeFromIndices(episode: SequenceEpisode): void {
    // Remove from temporal index
    const dayBucket = Math.floor(episode.timestamp / (1000 * 60 * 60 * 24));
    const temporalEpisodes = this.temporalIndex.get(dayBucket);
    if (temporalEpisodes) {
      const index = temporalEpisodes.indexOf(episode.id);
      if (index > -1) {
        temporalEpisodes.splice(index, 1);
      }
    }
    
    // Remove from context index
    const contextSignature = this.generateContextSignature(episode.temporalContext, episode.spatialContext);
    const contextEpisodes = this.contextIndex.get(contextSignature);
    if (contextEpisodes) {
      const index = contextEpisodes.indexOf(episode.id);
      if (index > -1) {
        contextEpisodes.splice(index, 1);
      }
    }
    
    // Remove from tag indices
    for (const tag of episode.tags) {
      const tagEpisodes = this.tagIndex.get(tag);
      if (tagEpisodes) {
        const index = tagEpisodes.indexOf(episode.id);
        if (index > -1) {
          tagEpisodes.splice(index, 1);
        }
      }
    }
  }

  /**
   * Clean up empty index entries
   */
  private cleanupIndices(): void {
    // Clean temporal index
    for (const [bucket, episodes] of this.temporalIndex) {
      if (episodes.length === 0) {
        this.temporalIndex.delete(bucket);
      }
    }
    
    // Clean context index
    for (const [signature, episodes] of this.contextIndex) {
      if (episodes.length === 0) {
        this.contextIndex.delete(signature);
      }
    }
    
    // Clean tag index
    for (const [tag, episodes] of this.tagIndex) {
      if (episodes.length === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }

  /**
   * Record forgetting curve data
   */
  private recordForgettingCurve(): void {
    const currentTime = Date.now();
    const totalEpisodes = this.episodes.size;
    const retainedEpisodes = Array.from(this.episodes.values())
      .filter(episode => episode.importance > 0.1).length;
    
    const retention = totalEpisodes > 0 ? retainedEpisodes / totalEpisodes : 1;
    
    this.forgettingCurve.push({ time: currentTime, retention });
    
    // Keep only recent data
    if (this.forgettingCurve.length > 1000) {
      this.forgettingCurve.shift();
    }
  }

  /**
   * Reset memory
   */
  public reset(): void {
    this.episodes.clear();
    this.temporalIndex.clear();
    this.contextIndex.clear();
    this.tagIndex.clear();
    this.consolidationQueue = [];
    this.recentRetrievals = [];
    this.accessPatterns.clear();
    this.forgettingCurve = [];
    this.nextEpisodeId = 1;
  }
}
