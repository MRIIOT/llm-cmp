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
  assessSpecializedReasoningQuality(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0.1;
    
    const baseQuality = this.assessReasoningQuality(reasoning);
    const preferredTypes = this.getPreferredReasoningTypes();
    
    // Bonus for using agent's preferred reasoning types
    const typeMatchBonus = reasoning.filter(step => 
      preferredTypes.includes(step.type)
    ).length / reasoning.length * 0.2;
    
    // Penalty for working outside native domain
    const domainPenalty = this.nativeDomain === this.nativeDomain ? 0 : 0.1;
    
    return Math.min(baseQuality + typeMatchBonus - domainPenalty, 1.0);
  }

  // Helper methods
  private extractSemanticMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    // Use specialized processor for agent-specific morphology extraction
    return SpecializedAgentProcessor.extractSemanticMorphology(reasoning, this.type as AgentType);
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
    
    // Quality factors
    const avgConfidence = reasoning.reduce((sum, step) => sum + step.confidence, 0) / reasoning.length;
    const depthBonus = Math.min(reasoning.length * 0.05, 0.2);
    const diversityBonus = new Set(reasoning.map(r => r.type)).size * 0.1;
    
    return Math.min(avgConfidence + depthBonus + diversityBonus, 1.0);
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
