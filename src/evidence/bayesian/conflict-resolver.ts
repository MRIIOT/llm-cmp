/**
 * Evidence Conflict Resolution
 * Resolves contradictions and inconsistencies in evidence
 */

import { Evidence, ConflictResolution } from '../../types/evidence.types';
import { BayesianNetwork } from './bayesian-network';
import { InferenceEngine } from './inference-engine';

export interface ConflictMetrics {
  severity: number;
  type: 'contradiction' | 'inconsistency' | 'uncertainty' | 'ambiguity';
  sources: string[];
  resolution: ConflictResolution;
}

export interface ResolutionStrategy {
  method: 'argumentation' | 'negotiation' | 'voting' | 'hierarchical';
  parameters: Map<string, any>;
}

export class ConflictResolver {
  private network: BayesianNetwork;
  private inferenceEngine: InferenceEngine;
  private resolutionHistory: ConflictMetrics[] = [];
  
  constructor() {
    this.network = new BayesianNetwork();
    this.inferenceEngine = new InferenceEngine(this.network);
  }
  
  /**
   * Detect conflicts in evidence set
   */
  detectConflicts(evidence: Evidence[]): ConflictMetrics[] {
    const conflicts: ConflictMetrics[] = [];
    
    // Check pairwise conflicts
    for (let i = 0; i < evidence.length; i++) {
      for (let j = i + 1; j < evidence.length; j++) {
        const conflict = this.analyzeConflict(evidence[i], evidence[j]);
        
        if (conflict.severity > 0.3) { // Conflict threshold
          conflicts.push(conflict);
        }
      }
    }
    
    // Check multi-way conflicts
    const multiConflicts = this.detectMultiWayConflicts(evidence);
    conflicts.push(...multiConflicts);
    
    // Sort by severity
    conflicts.sort((a, b) => b.severity - a.severity);
    
    return conflicts;
  }
  
  /**
   * Resolve conflicts using specified strategy
   */
  resolveConflicts(
    evidence: Evidence[],
    conflicts: ConflictMetrics[],
    strategy: ResolutionStrategy
  ): ConflictResolution[] {
    const resolutions: ConflictResolution[] = [];
    
    for (const conflict of conflicts) {
      let resolution: ConflictResolution;
      
      switch (strategy.method) {
        case 'argumentation':
          resolution = this.argumentationBasedResolution(evidence, conflict, strategy);
          break;
        case 'negotiation':
          resolution = this.negotiationBasedResolution(evidence, conflict, strategy);
          break;
        case 'voting':
          resolution = this.votingBasedResolution(evidence, conflict, strategy);
          break;
        case 'hierarchical':
          resolution = this.hierarchicalResolution(evidence, conflict, strategy);
          break;
        default:
          resolution = this.defaultResolution(evidence, conflict);
      }
      
      resolutions.push(resolution);
      this.resolutionHistory.push({ ...conflict, resolution });
    }
    
    return resolutions;
  }
  
  /**
   * Analyze conflict between two pieces of evidence
   */
  private analyzeConflict(e1: Evidence, e2: Evidence): ConflictMetrics {
    // Semantic contradiction detection
    const contradiction = this.detectContradiction(e1, e2);
    console.log(`     Contradiction score between "${e1.content}" and "${e2.content}": ${contradiction}`);
    
    if (contradiction > 0.7) {
      return {
        severity: contradiction,
        type: 'contradiction',
        sources: [e1.source, e2.source],
        resolution: {
          method: 'none',
          confidence: 0,
          explanation: 'Direct contradiction detected'
        }
      };
    }
    
    // Logical inconsistency detection
    const inconsistency = this.detectInconsistency(e1, e2);
    console.log(`     Inconsistency score: ${inconsistency}`);
    
    if (inconsistency > 0.5) {
      return {
        severity: inconsistency,
        type: 'inconsistency',
        sources: [e1.source, e2.source],
        resolution: {
          method: 'none',
          confidence: 0,
          explanation: 'Logical inconsistency detected'
        }
      };
    }
    
    // Uncertainty conflict detection
    const uncertaintyConflict = this.detectUncertaintyConflict(e1, e2);
    console.log(`     Uncertainty conflict score: ${uncertaintyConflict}`);
    
    if (uncertaintyConflict > 0.4) {
      return {
        severity: uncertaintyConflict,
        type: 'uncertainty',
        sources: [e1.source, e2.source],
        resolution: {
          method: 'none',
          confidence: 0,
          explanation: 'High uncertainty conflict'
        }
      };
    }
    
    // Ambiguity detection
    const ambiguity = this.detectAmbiguity(e1, e2);
    console.log(`     Ambiguity score: ${ambiguity}`);
    
    return {
      severity: ambiguity,
      type: 'ambiguity',
      sources: [e1.source, e2.source],
      resolution: {
        method: 'none',
        confidence: 0,
        explanation: 'Ambiguous evidence'
      }
    };
  }
  
  /**
   * Detect semantic contradiction
   */
  private detectContradiction(e1: Evidence, e2: Evidence): number {
    // Check for explicit negation patterns
    const negationPatterns = [
      { positive: /is\s+working/i, negative: /is\s+failing/i },
      { positive: /is\s+functional/i, negative: /is\s+broken/i },
      { positive: /is\s+true/i, negative: /is\s+false/i },
      { positive: /confirmed/i, negative: /denied/i },
      { positive: /supports/i, negative: /refutes/i },
      { positive: /agree/i, negative: /disagree/i },
      { positive: /success/i, negative: /failure/i },
      { positive: /positive/i, negative: /negative/i }
    ];
    
    for (const pattern of negationPatterns) {
      const e1Positive = pattern.positive.test(e1.content);
      const e1Negative = pattern.negative.test(e1.content);
      const e2Positive = pattern.positive.test(e2.content);
      const e2Negative = pattern.negative.test(e2.content);
      
      if ((e1Positive && e2Negative) || (e1Negative && e2Positive)) {
        // Check if they're about the same topic for higher confidence
        const topicSim = this.topicSimilarity(e1, e2);
        if (topicSim > 0.7 || (e1.topic && e1.topic === e2.topic)) {
          return 0.95; // Very high contradiction
        }
        return 0.85; // High contradiction
      }
    }
    
    // Check for antonym pairs
    const antonymPairs = [
      ['working', 'failing'],
      ['up', 'down'],
      ['good', 'bad'],
      ['yes', 'no'],
      ['true', 'false'],
      ['positive', 'negative'],
      ['success', 'failure']
    ];
    
    const e1Lower = e1.content.toLowerCase();
    const e2Lower = e2.content.toLowerCase();
    
    for (const [word1, word2] of antonymPairs) {
      if ((e1Lower.includes(word1) && e2Lower.includes(word2)) ||
          (e1Lower.includes(word2) && e2Lower.includes(word1))) {
        return 0.8; // High contradiction from antonyms
      }
    }
    
    // Check confidence opposition for same topic
    if (Math.abs(e1.confidence - e2.confidence) > 0.6) {
      // Check if they're about the same topic
      if (this.topicSimilarity(e1, e2) > 0.7) {
        return 0.7; // Moderate contradiction
      }
    }
    
    // Check for explicit contradictory statements
    if (e1.topic === e2.topic && e1.topic !== undefined) {
      // If same topic but very different content
      const contentSim = this.contentSimilarity(e1, e2);
      if (contentSim < 0.2 && Math.abs(e1.confidence - e2.confidence) < 0.1) {
        // High confidence but very different content about same topic
        return 0.6;
      }
    }
    
    return 0;
  }
  
  /**
   * Detect logical inconsistency
   */
  private detectInconsistency(e1: Evidence, e2: Evidence): number {
    // Build logical propositions
    const props1 = this.extractPropositions(e1);
    const props2 = this.extractPropositions(e2);
    
    // Check for logical conflicts
    for (const p1 of props1) {
      for (const p2 of props2) {
        if (this.areInconsistent(p1, p2)) {
          return 0.8;
        }
      }
    }
    
    // Check temporal inconsistency
    if (e1.timestamp && e2.timestamp) {
      const timeDiff = Math.abs(e1.timestamp.getTime() - e2.timestamp.getTime());
      if (timeDiff < 60000 && Math.abs(e1.confidence - e2.confidence) > 0.5) {
        return 0.6; // Rapid change indicates inconsistency
      }
    }
    
    return 0;
  }
  
  /**
   * Detect uncertainty conflict
   */
  private detectUncertaintyConflict(e1: Evidence, e2: Evidence): number {
    // Both have low confidence but disagree
    if (e1.confidence < 0.5 && e2.confidence < 0.5) {
      const contentSimilarity = this.contentSimilarity(e1, e2);
      if (contentSimilarity < 0.3) {
        return 0.7; // High uncertainty conflict
      }
    }
    
    // One certain, one uncertain about same topic
    const confDiff = Math.abs(e1.confidence - e2.confidence);
    if (confDiff > 0.6 && this.topicSimilarity(e1, e2) > 0.8) {
      return confDiff * 0.8;
    }
    
    return 0;
  }
  
  /**
   * Detect ambiguity
   */
  private detectAmbiguity(e1: Evidence, e2: Evidence): number {
    // Check for vague language
    const vagueTerms = ['maybe', 'possibly', 'might', 'could', 'perhaps', 'unclear'];
    const e1Vague = vagueTerms.some(term => e1.content.toLowerCase().includes(term));
    const e2Vague = vagueTerms.some(term => e2.content.toLowerCase().includes(term));
    
    if (e1Vague && e2Vague) {
      return 0.6;
    }
    
    // Check for incomplete information
    if (e1.content.length < 50 || e2.content.length < 50) {
      return 0.4;
    }
    
    return 0;
  }
  
  /**
   * Detect multi-way conflicts
   */
  private detectMultiWayConflicts(evidence: Evidence[]): ConflictMetrics[] {
    const conflicts: ConflictMetrics[] = [];
    
    // Group by topic
    const topicGroups = this.groupByTopic(evidence);
    
    for (const [topic, group] of topicGroups.entries()) {
      if (group.length >= 3) {
        // Check for consensus breakdown
        const consensusMetric = this.computeConsensusMetric(group);
        
        if (consensusMetric < 0.3) { // Low consensus
          conflicts.push({
            severity: 1 - consensusMetric,
            type: 'inconsistency',
            sources: group.map(e => e.source),
            resolution: {
              method: 'none',
              confidence: 0,
              explanation: 'Multi-way consensus breakdown'
            }
          });
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Argumentation-based resolution
   */
  private argumentationBasedResolution(
    evidence: Evidence[],
    conflict: ConflictMetrics,
    strategy: ResolutionStrategy
  ): ConflictResolution {
    // Build argumentation framework
    const args = this.buildArgumentationFramework(evidence, conflict);
    
    // Compute grounded extension
    const groundedExtension = this.computeGroundedExtension(args);
    
    // Select winning argument
    const winner = this.selectWinningArgument(groundedExtension);
    
    if (winner) {
      return {
        method: 'argumentation',
        resolvedEvidence: winner.evidence,
        confidence: winner.strength,
        explanation: `Argument ${winner.id} prevails based on grounded semantics`,
        supportingEvidence: groundedExtension.map(a => a.evidence)
      };
    }
    
    return {
      method: 'argumentation',
      confidence: 0,
      explanation: 'No acceptable argument found'
    };
  }
  
  /**
   * Negotiation-based resolution
   */
  private negotiationBasedResolution(
    evidence: Evidence[],
    conflict: ConflictMetrics,
    strategy: ResolutionStrategy
  ): ConflictResolution {
    // Initialize negotiation positions
    const positions = this.initializeNegotiationPositions(evidence, conflict);
    
    // Run negotiation rounds
    const maxRounds = strategy.parameters.get('maxRounds') || 10;
    let agreement: any = null;
    
    for (let round = 0; round < maxRounds; round++) {
      // Update positions based on concessions
      this.updateNegotiationPositions(positions);
      
      // Check for agreement
      agreement = this.checkAgreement(positions);
      if (agreement) break;
    }
    
    if (agreement) {
      return {
        method: 'negotiation',
        resolvedEvidence: agreement.evidence,
        confidence: agreement.confidence,
        explanation: `Agreement reached after ${agreement.rounds} rounds`,
        compromise: agreement.compromise
      };
    }
    
    return {
      method: 'negotiation',
      confidence: 0,
      explanation: 'No agreement reached'
    };
  }
  
  /**
   * Voting-based resolution
   */
  private votingBasedResolution(
    evidence: Evidence[],
    conflict: ConflictMetrics,
    strategy: ResolutionStrategy
  ): ConflictResolution {
    // Get voting method
    const votingMethod = strategy.parameters.get('method') || 'plurality';
    
    // Collect votes
    const votes = this.collectVotes(evidence, conflict);
    
    // Apply voting rule
    let winner: Evidence | null = null;
    let confidence = 0;
    
    switch (votingMethod) {
      case 'plurality':
        winner = this.pluralityVoting(votes);
        confidence = this.computePluralityConfidence(votes, winner);
        break;
      case 'borda':
        winner = this.bordaCountVoting(votes);
        confidence = this.computeBordaConfidence(votes, winner);
        break;
      case 'approval':
        winner = this.approvalVoting(votes);
        confidence = this.computeApprovalConfidence(votes, winner);
        break;
    }
    
    if (winner) {
      return {
        method: 'voting',
        resolvedEvidence: winner,
        confidence,
        explanation: `Selected by ${votingMethod} voting`,
        votingResults: this.summarizeVotes(votes)
      };
    }
    
    return {
      method: 'voting',
      confidence: 0,
      explanation: 'No clear winner in voting'
    };
  }
  
  /**
   * Hierarchical resolution
   */
  private hierarchicalResolution(
    evidence: Evidence[],
    conflict: ConflictMetrics,
    strategy: ResolutionStrategy
  ): ConflictResolution {
    // Build evidence hierarchy
    const hierarchy = this.buildEvidenceHierarchy(evidence);
    
    // Find highest authority evidence
    let topEvidence: Evidence | null = null;
    let maxAuthority = 0;
    
    for (const e of evidence) {
      const authority = this.computeAuthority(e, hierarchy);
      if (authority > maxAuthority) {
        maxAuthority = authority;
        topEvidence = e;
      }
    }
    
    if (topEvidence) {
      return {
        method: 'hierarchical',
        resolvedEvidence: topEvidence,
        confidence: maxAuthority,
        explanation: `Selected based on hierarchical authority (${maxAuthority.toFixed(2)})`,
        hierarchy
      };
    }
    
    return {
      method: 'hierarchical',
      confidence: 0,
      explanation: 'No clear hierarchical winner'
    };
  }
  
  /**
   * Default resolution fallback
   */
  private defaultResolution(
    evidence: Evidence[],
    conflict: ConflictMetrics
  ): ConflictResolution {
    // Use weighted average based on source reliability
    const weights = evidence.map(e => e.confidence);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    if (totalWeight > 0) {
      // Create synthetic resolved evidence
      const resolvedContent = 'Weighted consensus: ' + 
        evidence.map(e => `${e.content} (${e.confidence.toFixed(2)})`).join('; ');
      
      const resolvedEvidence: Evidence = {
        content: resolvedContent,
        source: 'conflict_resolver',
        confidence: weights.reduce((a, b) => a + b) / weights.length,
        timestamp: new Date()
      };
      
      return {
        method: 'weighted_average',
        resolvedEvidence,
        confidence: 0.5,
        explanation: 'Resolved using weighted average'
      };
    }
    
    return {
      method: 'none',
      confidence: 0,
      explanation: 'Unable to resolve conflict'
    };
  }
  
  /**
   * Extract logical propositions from evidence
   */
  private extractPropositions(evidence: Evidence): string[] {
    // Simplified proposition extraction
    const props: string[] = [];
    const sentences = evidence.content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.trim().length > 10) {
        // Extract subject-predicate structure
        const words = sentence.trim().split(/\s+/);
        if (words.length >= 3) {
          props.push(words.slice(0, 3).join(' '));
        }
      }
    }
    
    return props;
  }
  
  /**
   * Check if two propositions are inconsistent
   */
  private areInconsistent(p1: string, p2: string): boolean {
    // Simplified inconsistency check
    const negations = ['not', 'no', 'never', 'false'];
    
    for (const neg of negations) {
      if (p1.includes(neg) && !p2.includes(neg)) {
        // Check if they're about the same subject
        const words1 = p1.split(/\s+/);
        const words2 = p2.split(/\s+/);
        
        if (words1[0] === words2[0]) { // Same subject
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Compute topic similarity
   */
  private topicSimilarity(e1: Evidence, e2: Evidence): number {
    // Use provided topics or extract from content
    const topic1 = e1.topic || this.extractTopic(e1);
    const topic2 = e2.topic || this.extractTopic(e2);
    
    if (topic1 === topic2) return 1.0;
    
    // Compute word overlap
    const words1 = new Set(topic1.toLowerCase().split(/\s+/));
    const words2 = new Set(topic2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Compute content similarity
   */
  private contentSimilarity(e1: Evidence, e2: Evidence): number {
    const words1 = new Set(e1.content.toLowerCase().split(/\s+/));
    const words2 = new Set(e2.content.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Extract topic from evidence
   */
  private extractTopic(evidence: Evidence): string {
    // Take first few significant words
    const words = evidence.content
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    return words.slice(0, 3).join(' ');
  }
  
  /**
   * Group evidence by topic
   */
  private groupByTopic(evidence: Evidence[]): Map<string, Evidence[]> {
    const groups = new Map<string, Evidence[]>();
    
    for (const e of evidence) {
      const topic = e.topic || this.extractTopic(e);
      
      if (!groups.has(topic)) {
        groups.set(topic, []);
      }
      groups.get(topic)!.push(e);
    }
    
    return groups;
  }
  
  /**
   * Compute consensus metric for evidence group
   */
  private computeConsensusMetric(group: Evidence[]): number {
    if (group.length < 2) return 1.0;
    
    // Compute pairwise agreement
    let totalAgreement = 0;
    let pairs = 0;
    
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const agreement = 1 - Math.abs(group[i].confidence - group[j].confidence);
        totalAgreement += agreement;
        pairs++;
      }
    }
    
    return pairs > 0 ? totalAgreement / pairs : 0;
  }
  
  /**
   * Build argumentation framework
   */
  private buildArgumentationFramework(
    evidence: Evidence[],
    conflict: ConflictMetrics
  ): any[] {
    const args: any[] = [];
    
    // Create arguments from evidence
    for (let i = 0; i < evidence.length; i++) {
      args.push({
        id: `arg_${i}`,
        evidence: evidence[i],
        strength: evidence[i].confidence,
        attacks: [],
        supporters: []
      });
    }
    
    // Determine attack relations
    for (let i = 0; i < args.length; i++) {
      for (let j = 0; j < args.length; j++) {
        if (i !== j) {
          const attackStrength = this.computeAttackStrength(
            args[i].evidence,
            args[j].evidence
          );
          
          if (attackStrength > 0.5) {
            args[i].attacks.push({ target: j, strength: attackStrength });
          }
        }
      }
    }
    
    return args;
  }
  
  /**
   * Compute attack strength between arguments
   */
  private computeAttackStrength(e1: Evidence, e2: Evidence): number {
    const contradiction = this.detectContradiction(e1, e2);
    const inconsistency = this.detectInconsistency(e1, e2);
    
    return Math.max(contradiction, inconsistency * 0.8);
  }
  
  /**
   * Compute grounded extension
   */
  private computeGroundedExtension(args: any[]): any[] {
    const extension: any[] = [];
    const defeated = new Set<number>();
    
    // Iteratively build extension
    let changed = true;
    while (changed) {
      changed = false;
      
      for (let i = 0; i < args.length; i++) {
        if (!extension.includes(args[i]) && !defeated.has(i)) {
          // Check if all attackers are defeated
          let canAdd = true;
          
          for (const arg of args) {
            if (arg.attacks.some((a: any) => a.target === i && !defeated.has(args.indexOf(arg)))) {
              canAdd = false;
              break;
            }
          }
          
          if (canAdd) {
            extension.push(args[i]);
            changed = true;
            
            // Defeat all arguments attacked by this one
            for (const attack of args[i].attacks) {
              defeated.add(attack.target);
            }
          }
        }
      }
    }
    
    return extension;
  }
  
  /**
   * Select winning argument
   */
  private selectWinningArgument(extension: any[]): any | null {
    if (extension.length === 0) return null;
    
    // Select argument with highest strength
    return extension.reduce((best, arg) => 
      arg.strength > best.strength ? arg : best
    );
  }
  
  /**
   * Initialize negotiation positions
   */
  private initializeNegotiationPositions(
    evidence: Evidence[],
    conflict: ConflictMetrics
  ): any[] {
    return evidence.map((e, i) => ({
      agent: e.source,
      position: e.confidence,
      utility: e.confidence,
      concession: 0,
      minAcceptable: e.confidence * 0.7
    }));
  }
  
  /**
   * Update negotiation positions
   */
  private updateNegotiationPositions(positions: any[]): void {
    // Simple concession strategy
    const avgPosition = positions.reduce((sum, p) => sum + p.position, 0) / positions.length;
    
    for (const pos of positions) {
      const diff = avgPosition - pos.position;
      pos.concession = diff * 0.1; // 10% concession toward average
      pos.position += pos.concession;
    }
  }
  
  /**
   * Check for negotiation agreement
   */
  private checkAgreement(positions: any[]): any | null {
    // Check if positions converged
    const variance = this.computeVariance(positions.map(p => p.position));
    
    if (variance < 0.01) {
      const avgPosition = positions.reduce((sum, p) => sum + p.position, 0) / positions.length;
      
      return {
        evidence: {
          content: 'Negotiated consensus',
          source: 'negotiation',
          confidence: avgPosition,
          timestamp: new Date()
        },
        confidence: 1 - variance,
        rounds: positions[0].concession / 0.1,
        compromise: avgPosition
      };
    }
    
    return null;
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
   * Collect votes for resolution
   */
  private collectVotes(evidence: Evidence[], conflict: ConflictMetrics): any {
    // Simulate voting by using evidence confidence as preferences
    return evidence.map((e, i) => ({
      candidate: i,
      evidence: e,
      votes: Math.floor(e.confidence * 100),
      preferences: evidence
        .map((_, j) => ({ candidate: j, rank: Math.random() }))
        .sort((a, b) => a.rank - b.rank)
        .map(p => p.candidate)
    }));
  }
  
  /**
   * Plurality voting
   */
  private pluralityVoting(votes: any[]): Evidence | null {
    const maxVotes = Math.max(...votes.map(v => v.votes));
    const winner = votes.find(v => v.votes === maxVotes);
    return winner ? winner.evidence : null;
  }
  
  /**
   * Compute plurality confidence
   */
  private computePluralityConfidence(votes: any[], winner: Evidence | null): number {
    if (!winner) return 0;
    
    const totalVotes = votes.reduce((sum, v) => sum + v.votes, 0);
    const winnerVotes = votes.find(v => v.evidence === winner)?.votes || 0;
    
    return totalVotes > 0 ? winnerVotes / totalVotes : 0;
  }
  
  /**
   * Borda count voting
   */
  private bordaCountVoting(votes: any[]): Evidence | null {
    const scores = new Map<number, number>();
    
    for (const vote of votes) {
      for (let i = 0; i < vote.preferences.length; i++) {
        const candidate = vote.preferences[i];
        const score = vote.preferences.length - i - 1;
        scores.set(candidate, (scores.get(candidate) || 0) + score);
      }
    }
    
    let maxScore = 0;
    let winner = -1;
    
    for (const [candidate, score] of scores.entries()) {
      if (score > maxScore) {
        maxScore = score;
        winner = candidate;
      }
    }
    
    return winner >= 0 ? votes[winner].evidence : null;
  }
  
  /**
   * Compute Borda confidence
   */
  private computeBordaConfidence(votes: any[], winner: Evidence | null): number {
    if (!winner) return 0;
    
    // Normalized Borda score
    const maxPossibleScore = votes.length * (votes.length - 1);
    const winnerIndex = votes.findIndex(v => v.evidence === winner);
    
    if (winnerIndex < 0) return 0;
    
    let winnerScore = 0;
    for (const vote of votes) {
      const rank = vote.preferences.indexOf(winnerIndex);
      winnerScore += votes.length - rank - 1;
    }
    
    return maxPossibleScore > 0 ? winnerScore / maxPossibleScore : 0;
  }
  
  /**
   * Approval voting
   */
  private approvalVoting(votes: any[]): Evidence | null {
    const approvals = new Map<number, number>();
    
    for (const vote of votes) {
      // Approve top half of candidates
      const threshold = vote.preferences.length / 2;
      for (let i = 0; i < threshold; i++) {
        const candidate = vote.preferences[i];
        approvals.set(candidate, (approvals.get(candidate) || 0) + 1);
      }
    }
    
    let maxApprovals = 0;
    let winner = -1;
    
    for (const [candidate, count] of approvals.entries()) {
      if (count > maxApprovals) {
        maxApprovals = count;
        winner = candidate;
      }
    }
    
    return winner >= 0 ? votes[winner].evidence : null;
  }
  
  /**
   * Compute approval confidence
   */
  private computeApprovalConfidence(votes: any[], winner: Evidence | null): number {
    if (!winner) return 0;
    
    const winnerIndex = votes.findIndex(v => v.evidence === winner);
    if (winnerIndex < 0) return 0;
    
    let approvals = 0;
    for (const vote of votes) {
      const rank = vote.preferences.indexOf(winnerIndex);
      if (rank < vote.preferences.length / 2) {
        approvals++;
      }
    }
    
    return votes.length > 0 ? approvals / votes.length : 0;
  }
  
  /**
   * Summarize voting results
   */
  private summarizeVotes(votes: any[]): any {
    return {
      totalVotes: votes.length,
      distribution: votes.map(v => ({
        candidate: v.candidate,
        votes: v.votes,
        percentage: votes.length > 0 ? v.votes / votes.length : 0
      }))
    };
  }
  
  /**
   * Build evidence hierarchy
   */
  private buildEvidenceHierarchy(evidence: Evidence[]): any {
    // Create hierarchy based on source authority
    const hierarchy = {
      levels: [
        { name: 'primary', sources: [] as string[], weight: 1.0 },
        { name: 'secondary', sources: [] as string[], weight: 0.7 },
        { name: 'tertiary', sources: [] as string[], weight: 0.4 }
      ]
    };
    
    // Classify sources (simplified)
    for (const e of evidence) {
      if (e.source.includes('official') || e.source.includes('primary')) {
        hierarchy.levels[0].sources.push(e.source);
      } else if (e.source.includes('expert') || e.source.includes('analysis')) {
        hierarchy.levels[1].sources.push(e.source);
      } else {
        hierarchy.levels[2].sources.push(e.source);
      }
    }
    
    return hierarchy;
  }
  
  /**
   * Compute authority score
   */
  private computeAuthority(evidence: Evidence, hierarchy: any): number {
    for (const level of hierarchy.levels) {
      if (level.sources.includes(evidence.source)) {
        return level.weight * evidence.confidence;
      }
    }
    
    return evidence.confidence * 0.5; // Default weight
  }
  
  /**
   * Get conflict resolution statistics
   */
  getStatistics(): {
    totalConflicts: number;
    resolutionRate: number;
    avgSeverity: number;
    conflictTypes: Map<string, number>;
  } {
    const typeCount = new Map<string, number>();
    let totalSeverity = 0;
    let resolved = 0;
    
    for (const metric of this.resolutionHistory) {
      typeCount.set(metric.type, (typeCount.get(metric.type) || 0) + 1);
      totalSeverity += metric.severity;
      
      if (metric.resolution.confidence > 0) {
        resolved++;
      }
    }
    
    return {
      totalConflicts: this.resolutionHistory.length,
      resolutionRate: this.resolutionHistory.length > 0 
        ? resolved / this.resolutionHistory.length 
        : 0,
      avgSeverity: this.resolutionHistory.length > 0
        ? totalSeverity / this.resolutionHistory.length
        : 0,
      conflictTypes: typeCount
    };
  }
}
