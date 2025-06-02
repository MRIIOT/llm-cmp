// ===============================================
// LLM AGENT IMPLEMENTATION
// ===============================================

import { 
  LLMAgentType, 
  CMPMessage, 
  ReasoningStep, 
  EvidenceItem, 
  SemanticMorphology,
  ReasoningVote 
} from '../types/index.js';
import { SemanticPose } from './semantic-pose.js';
import { 
  LLM_AGENT_TYPES, 
  AgentType, 
  getAgentSpecialization, 
  getReasoningTypesForAgent,
  KnowledgeFrame
} from '../agents/agent-types.js';
import { SpecializedAgentProcessor } from '../agents/specialized-agents.js';
import { KnowledgeDomainTransformer } from './knowledge-domains.js';

export class LLMAgent {
  public type: LLMAgentType;
  public specialization: string;
  public model: string;
  public evidence: Map<string, EvidenceItem>;
  public inbox: CMPMessage[];
  public reasoning_history: ReasoningStep[];
  public confidence_threshold: number;
  public requestCount: number;
  public nativeDomain: KnowledgeFrame;
  public agentSpecialization: any;

  constructor(agentType: LLMAgentType, specialization: string, model: string) {
    this.type = agentType;
    this.specialization = specialization;
    this.model = model;
    this.evidence = new Map();
    this.inbox = [];
    this.reasoning_history = [];
    this.requestCount = 0;
    
    // Initialize specialization-specific properties
    this.agentSpecialization = getAgentSpecialization(agentType as AgentType);
    this.confidence_threshold = this.agentSpecialization?.confidenceThreshold || 0.7;
    this.nativeDomain = KnowledgeDomainTransformer.getAgentNativeDomain(agentType as AgentType);
  }

  // ⟦CREATE_MSG⟧ adapted for LLMs
  createMessage(msgType: string, reasoning: ReasoningStep[], semanticPose: SemanticPose, confidence: number): CMPMessage {
    const header = {
      sender: this.type,
      timestamp: Date.now(),
      reasoning_depth: reasoning.length,
      specialization: this.specialization,
      model_version: this.model
    };

    return {
      header,
      type: msgType,
      reasoning,
      semantic_pose: semanticPose.toData(),
      confidence,
      reasoning_trace: this.reasoning_history.slice(-5)
    };
  }

  // ⟦PROCESS_OBS⟧ adapted for semantic observations
  processReasoning(message: CMPMessage, currentEvidence: Map<string, EvidenceItem>): Map<string, EvidenceItem> {
    const { reasoning, semantic_pose, confidence } = message;
    
    // Extract semantic morphology
    const semanticMorphology = this.extractSemanticMorphology(reasoning);
    
    // Find compatible reasoning in evidence base
    const matches = Array.from(currentEvidence.entries()).filter(([id, data]) => 
      this.compatibleReasoning(reasoning, data.reasoning) &&
      this.semanticDistance(semantic_pose, data.semantic_pose) < 0.3
    );

    // Update evidence with new reasoning
    const updatedEvidence = new Map(currentEvidence);

    if (matches.length > 0) {
      // Strengthen existing evidence
      matches.forEach(([id, data]) => {
        const combinedConfidence = this.combineConfidence(data.confidence, confidence);
        const mergedReasoning = this.mergeReasoning(data.reasoning, reasoning);
        updatedEvidence.set(id, {
          ...data,
          confidence: combinedConfidence,
          reasoning: mergedReasoning,
          supporting_agents: [...(data.supporting_agents || []), this.type]
        });
      });
    } else {
      // Create new evidence entry
      const evidenceId = `evidence_${Date.now()}_${this.type}`;
      updatedEvidence.set(evidenceId, {
        reasoning,
        semantic_pose,
        confidence,
        source_agent: this.type,
        supporting_agents: [this.type],
        morphology: semanticMorphology,
        timestamp: Date.now()
      });
    }

    return updatedEvidence;
  }

  // ⟦MAKE_VOTE⟧ for LLM reasoning
  generateReasoningVote(evidence: Map<string, EvidenceItem>): CMPMessage {
    // Get top reasoning candidates
    const candidates = Array.from(evidence.entries())
      .sort(([,a], [,b]) => b.confidence - a.confidence)
      .slice(0, 3);

    // Normalize evidence across reasoning paths
    const normalized: ReasoningVote[] = candidates.map(([id, data]) => ({
      reasoning_id: id,
      semantic_pose: data.semantic_pose,
      confidence: data.confidence,
      supporting_count: data.supporting_agents.length,
      reasoning_quality: this.assessReasoningQuality(data.reasoning)
    }));

    // Create semantic pose from top candidate
    const topCandidate = candidates[0];
    const semanticPose = topCandidate ? 
      SemanticPose.fromData(topCandidate[1].semantic_pose) :
      new SemanticPose([0,0,0], 0, 'unknown');

    // Generate vote message
    const vote = this.createMessage(
      'REASONING_VOTE',
      normalized.map(n => ({
        type: 'vote',
        concept: n.reasoning_id,
        content: `Vote for reasoning ${n.reasoning_id}`,
        confidence: n.confidence
      })),
      semanticPose,
      this.calculateVoteConfidence(normalized)
    );

    return vote;
  }

  // Process incoming message and update internal state
  processIncomingMessage(message: CMPMessage): void {
    this.inbox.push(message);
    
    // Update evidence with new observation
    this.evidence = this.processReasoning(message, this.evidence);
    
    // Add to reasoning history
    this.reasoning_history.push(...message.reasoning);
    
    // Keep history bounded
    if (this.reasoning_history.length > 50) {
      this.reasoning_history = this.reasoning_history.slice(-50);
    }
  }

  // Get current evidence summary
  getEvidenceSummary(): { total: number; highConfidence: number; avgConfidence: number } {
    const evidenceArray = Array.from(this.evidence.values());
    const highConfidence = evidenceArray.filter(e => e.confidence > this.confidence_threshold).length;
    const avgConfidence = evidenceArray.length > 0 ? 
      evidenceArray.reduce((sum, e) => sum + e.confidence, 0) / evidenceArray.length : 0;

    return {
      total: evidenceArray.length,
      highConfidence,
      avgConfidence
    };
  }

  // Reset agent state
  reset(): void {
    this.evidence.clear();
    this.inbox = [];
    this.reasoning_history = [];
    this.requestCount = 0;
  }

  // Get agent's preferred reasoning types
  getPreferredReasoningTypes(): string[] {
    return getReasoningTypesForAgent(this.type as AgentType);
  }

  // Adjust confidence for cross-domain reasoning
  adjustConfidenceForDomain(confidence: number, targetDomain: KnowledgeFrame): number {
    return KnowledgeDomainTransformer.adjustConfidenceForDomain(
      confidence, 
      this.type as AgentType, 
      targetDomain
    );
  }

  // Transform semantic pose to target domain
  transformToTargetDomain(pose: SemanticPose, targetDomain: KnowledgeFrame): SemanticPose {
    return KnowledgeDomainTransformer.transform(pose, this.nativeDomain, targetDomain);
  }

  // Check if agent can effectively work in target domain
  canWorkInDomain(targetDomain: KnowledgeFrame): boolean {
    const compatibility = KnowledgeDomainTransformer.checkDomainCompatibility(
      this.nativeDomain, 
      targetDomain
    );
    return compatibility.compatible && compatibility.similarity > 0.4;
  }

  // Get agent specialization info
  getSpecializationInfo(): {
    type: string;
    domain: KnowledgeFrame;
    focus: string;
    strengths: string[];
    confidenceThreshold: number;
  } {
    return {
      type: this.type,
      domain: this.nativeDomain,
      focus: this.agentSpecialization?.focus || 'general',
      strengths: this.agentSpecialization?.strengths || [],
      confidenceThreshold: this.confidence_threshold
    };
  }

  // Enhanced reasoning quality assessment using specialization
  assessSpecializedReasoningQuality(reasoning: ReasoningStep[], targetDomain?: KnowledgeFrame): number {
    if (reasoning.length === 0) return 0.1;
    
    const baseQuality = this.assessReasoningQuality(reasoning);
    const preferredTypes = this.getPreferredReasoningTypes();
    
    // Calculate specialization match bonus
    const typeMatchRatio = reasoning.filter(step => 
      preferredTypes.includes(step.type)
    ).length / reasoning.length;
    const specializationBonus = typeMatchRatio * 0.15; // Reduced from 0.2
    
    // Calculate domain compatibility penalty (fixed the bug)
    const workingDomain = targetDomain || this.nativeDomain;
    let domainPenalty = 0;
    if (workingDomain !== this.nativeDomain) {
      const compatibility = KnowledgeDomainTransformer.checkDomainCompatibility(
        this.nativeDomain, 
        workingDomain
      );
      domainPenalty = (1 - compatibility.similarity) * 0.2;
    }
    
    // Calculate reasoning depth and diversity factors
    const depthFactor = this.calculateDepthQuality(reasoning);
    const diversityFactor = this.calculateDiversityQuality(reasoning);
    const coherenceFactor = this.calculateCoherenceQuality(reasoning);
    
    // Weighted combination with more discriminating formula
    const qualityScore = (
      baseQuality * 0.4 +           // Base confidence and structure
      specializationBonus * 0.2 +   // Using appropriate reasoning types
      depthFactor * 0.15 +          // Reasoning depth and complexity
      diversityFactor * 0.15 +      // Diversity of reasoning approaches
      coherenceFactor * 0.1         // Logical coherence and flow
    ) - domainPenalty;
    
    // More realistic scoring range: 0.3 to 0.95 instead of easy 1.0
    return Math.max(0.3, Math.min(qualityScore, 0.95));
  }

  // Helper methods
  private extractSemanticMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    // Use specialized processor for agent-specific morphology extraction
    return SpecializedAgentProcessor.extractSemanticMorphology(reasoning, this.type as AgentType);
  }

  // Calculate depth quality based on reasoning complexity and chain length
  private calculateDepthQuality(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0;
    
    // Analyze reasoning chain depth
    const chainDepth = reasoning.length;
    const avgContentLength = reasoning.reduce((sum, step) => sum + step.content.length, 0) / reasoning.length;
    
    // Optimal range: 15-40 reasoning steps with substantial content
    const depthScore = chainDepth >= 15 && chainDepth <= 40 ? 0.8 : 
                     chainDepth >= 10 && chainDepth <= 50 ? 0.6 :
                     chainDepth >= 5 ? 0.4 : 0.2;
    
    const contentScore = avgContentLength >= 100 ? 0.8 :
                        avgContentLength >= 50 ? 0.6 : 0.4;
    
    return (depthScore + contentScore) / 2;
  }

  // Calculate diversity quality based on reasoning type variety
  private calculateDiversityQuality(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0;
    
    const uniqueTypes = new Set(reasoning.map(r => r.type));
    const typeRatio = uniqueTypes.size / reasoning.length;
    
    // Balance between diversity and focus
    if (typeRatio > 0.7) return 0.4; // Too scattered
    if (typeRatio >= 0.3 && typeRatio <= 0.6) return 0.8; // Good balance
    if (typeRatio >= 0.2) return 0.6; // Somewhat focused
    return 0.3; // Too repetitive
  }

  // Calculate coherence quality based on logical flow and concept consistency
  private calculateCoherenceQuality(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0;
    
    // Check for logical flow patterns
    const hasValidFlow = this.checkLogicalFlow(reasoning);
    const conceptConsistency = this.checkConceptConsistency(reasoning);
    const confidenceStability = this.checkConfidenceStability(reasoning);
    
    return (hasValidFlow + conceptConsistency + confidenceStability) / 3;
  }

  // Check for logical flow in reasoning chain
  private checkLogicalFlow(reasoning: ReasoningStep[]): number {
    let flowScore = 0;
    let validTransitions = 0;
    
    for (let i = 0; i < reasoning.length - 1; i++) {
      const current = reasoning[i];
      const next = reasoning[i + 1];
      
      // Check for logical progression
      if (this.isValidReasoningTransition(current.type, next.type)) {
        validTransitions++;
      }
    }
    
    flowScore = reasoning.length > 1 ? validTransitions / (reasoning.length - 1) : 0.5;
    return flowScore;
  }

  // Check if transition between reasoning types is logically valid
  private isValidReasoningTransition(fromType: string, toType: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'premise': ['inference', 'logical_step', 'analysis'],
      'inference': ['conclusion', 'logical_step', 'implementation'],
      'fact': ['factual_analysis', 'synthesis', 'implementation'],
      'creative_insight': ['creative_idea', 'implementation', 'novel_perspective'],
      'implementation_step': ['implementation', 'optimization', 'conclusion'],
      'social_aspect': ['social_consideration', 'implementation', 'coordination_step'],
      'critical_analysis': ['critique', 'implementation', 'improvement'],
      'coordination_step': ['consensus', 'priority', 'implementation']
    };
    
    return validTransitions[fromType]?.includes(toType) || 
           toType === 'implementation' || // Implementation is generally a valid next step
           fromType === toType; // Same type transitions are valid
  }

  // Check consistency of concepts across reasoning chain
  private checkConceptConsistency(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0;
    
    const concepts = reasoning.map(r => r.concept);
    const uniqueConcepts = new Set(concepts);
    
    // Some repetition is good for coherence, but too much is redundant
    const repetitionRatio = 1 - (uniqueConcepts.size / concepts.length);
    
    if (repetitionRatio >= 0.3 && repetitionRatio <= 0.6) return 0.8; // Good coherence
    if (repetitionRatio >= 0.1 && repetitionRatio <= 0.7) return 0.6; // Acceptable
    return 0.4; // Either too scattered or too repetitive
  }

  // Check stability of confidence scores across reasoning
  private checkConfidenceStability(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0;
    
    const confidences = reasoning.map(r => r.confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower variance indicates more stable confidence (better quality)
    if (stdDev <= 0.1) return 0.8; // Very stable
    if (stdDev <= 0.2) return 0.6; // Reasonably stable  
    if (stdDev <= 0.3) return 0.4; // Somewhat unstable
    return 0.2; // Very unstable
  }

  private compatibleReasoning(reasoning1: ReasoningStep[], reasoning2: ReasoningStep[]): boolean {
    const concepts1 = new Set(reasoning1.map(r => r.concept));
    const concepts2 = new Set(reasoning2.map(r => r.concept));
    const intersection = new Set([...concepts1].filter(x => concepts2.has(x)));
    
    const minSize = Math.min(concepts1.size, concepts2.size);
    return minSize > 0 ? intersection.size / minSize > 0.3 : false;
  }

  private semanticDistance(pose1: any, pose2: any): number {
    const p1 = SemanticPose.fromData(pose1);
    const p2 = SemanticPose.fromData(pose2);
    return p1.distanceTo(p2);
  }

  private combineConfidence(conf1: number, conf2: number): number {
    // Bayesian confidence combination
    return conf1 + conf2 - (conf1 * conf2);
  }

  private mergeReasoning(reasoning1: ReasoningStep[], reasoning2: ReasoningStep[]): ReasoningStep[] {
    // Merge reasoning steps, avoiding duplicates
    const merged = [...reasoning1];
    
    reasoning2.forEach(step2 => {
      const exists = reasoning1.some(step1 => 
        step1.concept === step2.concept && step1.type === step2.type
      );
      
      if (!exists) {
        merged.push(step2);
      }
    });
    
    return merged;
  }

  private assessReasoningQuality(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0.1;
    
    // More discriminating quality factors
    const avgConfidence = reasoning.reduce((sum, step) => sum + step.confidence, 0) / reasoning.length;
    
    // Penalize overly confident reasoning (unrealistic)
    const confidenceRealism = avgConfidence > 0.9 ? 0.6 : // Too overconfident
                             avgConfidence >= 0.7 && avgConfidence <= 0.85 ? 0.8 : // Realistic confidence
                             avgConfidence >= 0.5 ? 0.7 : // Modest confidence
                             0.5; // Low confidence
    
    // Depth bonus - but with diminishing returns
    const optimalLength = 25; // Optimal reasoning chain length
    const lengthRatio = reasoning.length / optimalLength;
    const depthBonus = lengthRatio <= 1 ? lengthRatio * 0.15 : // Growing bonus up to optimal
                      lengthRatio <= 2 ? 0.15 - (lengthRatio - 1) * 0.05 : // Diminishing returns
                      0.1; // Too long, penalty
    
    // Diversity bonus - but more conservative
    const uniqueTypes = new Set(reasoning.map(r => r.type));
    const diversityRatio = uniqueTypes.size / Math.max(reasoning.length, 1);
    const diversityBonus = diversityRatio >= 0.3 && diversityRatio <= 0.6 ? 0.1 : // Good balance
                          diversityRatio >= 0.2 ? 0.05 : // Some diversity
                          0; // Too repetitive or too scattered
    
    // Content quality assessment
    const avgContentLength = reasoning.reduce((sum, step) => sum + step.content.length, 0) / reasoning.length;
    const contentQuality = avgContentLength >= 150 ? 0.1 : // Substantial content
                          avgContentLength >= 80 ? 0.05 : // Adequate content
                          0; // Too brief
    
    return Math.min(confidenceRealism + depthBonus + diversityBonus + contentQuality, 0.9);
  }

  private calculateVoteConfidence(votes: ReasoningVote[]): number {
    if (votes.length === 0) return 0.1;
    
    // Weighted by reasoning quality and support
    const totalWeight = votes.reduce((sum, vote) => sum + vote.reasoning_quality, 0);
    
    if (totalWeight === 0) return 0.1;
    
    const weightedConfidence = votes.reduce((sum, vote) => {
      const weight = vote.reasoning_quality / totalWeight;
      return sum + (vote.confidence * weight);
    }, 0);
    
    return Math.min(weightedConfidence, 1.0);
  }
}
