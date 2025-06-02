/**
 * Specialized Agent Processing
 * Agent-specific reasoning morphology analysis and evidence processing
 */

import { 
  LLM_AGENT_TYPES, 
  AgentType, 
  getAgentSpecialization, 
  getReasoningTypesForAgent,
  REASONING_TYPES,
  KnowledgeFrame,
  KNOWLEDGE_FRAMES
} from './agent-types';
import { CMPMessage, ReasoningStep } from '../types';
import { SemanticPose } from '../core/semantic-pose.js';

export interface SemanticMorphology {
  logical_structure?: LogicalStructure;
  concept_relations?: ConceptRelation[];
  evidence_chain?: EvidenceLink[];
  creative_patterns?: CreativePattern[];
  technical_components?: TechnicalComponent[];
  social_dynamics?: SocialDynamic[];
  critical_factors?: CriticalFactor[];
  coordination_elements?: CoordinationElement[];
}

export interface LogicalStructure {
  premises: ReasoningStep[];
  inferences: ReasoningStep[];
  conclusions: ReasoningStep[];
  logical_validity: number;
}

export interface ConceptRelation {
  concept1: string;
  concept2: string;
  relation_type: 'causes' | 'implies' | 'contradicts' | 'supports' | 'extends';
  strength: number;
}

export interface EvidenceLink {
  claim: string;
  evidence: string;
  support_strength: number;
  source_reliability: number;
}

export interface CreativePattern {
  pattern_type: 'analogy' | 'metaphor' | 'synthesis' | 'reframing' | 'extension';
  originality_score: number;
  combination_elements: string[];
}

export interface TechnicalComponent {
  component_type: 'algorithm' | 'architecture' | 'optimization' | 'implementation';
  complexity_level: number;
  feasibility_score: number;
}

export interface SocialDynamic {
  stakeholder: string;
  impact_type: 'positive' | 'negative' | 'neutral';
  impact_magnitude: number;
  mitigation_needed: boolean;
}

export interface CriticalFactor {
  factor_type: 'risk' | 'limitation' | 'assumption' | 'dependency';
  severity: number;
  likelihood: number;
  mitigation_difficulty: number;
}

export interface CoordinationElement {
  element_type: 'consensus' | 'conflict' | 'priority' | 'dependency';
  agents_involved: string[];
  coordination_complexity: number;
}

/**
 * Specialized processing for different agent types
 */
export class SpecializedAgentProcessor {
  
  /**
   * Extract semantic morphology based on agent specialization
   * Returns simplified structure compatible with existing types
   */
  static extractSemanticMorphology(
    reasoning: ReasoningStep[], 
    agentType: AgentType
  ): { logical_structure: { premises: ReasoningStep[]; inferences: ReasoningStep[]; conclusions: ReasoningStep[]; }; concept_relations: string[]; evidence_chain: string[]; } {
    // Extract basic logical structure that all agent types can use
    const premises = reasoning.filter(r => 
      r.type === REASONING_TYPES.PREMISE || 
      r.content.toLowerCase().includes('premise') ||
      r.content.toLowerCase().includes('assumption') ||
      r.content.toLowerCase().includes('given')
    );

    const inferences = reasoning.filter(r => 
      r.type === REASONING_TYPES.INFERENCE ||
      r.content.toLowerCase().includes('therefore') ||
      r.content.toLowerCase().includes('thus') ||
      r.content.toLowerCase().includes('follows')
    );

    const conclusions = reasoning.filter(r => 
      r.type === REASONING_TYPES.CONCLUSION ||
      r.content.toLowerCase().includes('conclusion') ||
      r.content.toLowerCase().includes('result')
    );

    // Extract concept relations as string array
    const concept_relations = reasoning.map(r => r.concept);

    // Extract evidence chain as string array  
    const evidence_chain = reasoning.map(r => r.type);

    return {
      logical_structure: {
        premises,
        inferences,
        conclusions
      },
      concept_relations,
      evidence_chain
    };
  }

  /**
   * Extract detailed semantic morphology for demonstration purposes
   * This provides the full specialized analysis per agent type
   */
  static extractDetailedSemanticMorphology(
    reasoning: ReasoningStep[], 
    agentType: AgentType
  ): SemanticMorphology {
    switch (agentType) {
      case LLM_AGENT_TYPES.REASONING:
        return this.extractLogicalMorphology(reasoning);
      case LLM_AGENT_TYPES.CREATIVE:
        return this.extractCreativeMorphology(reasoning);
      case LLM_AGENT_TYPES.FACTUAL:
        return this.extractFactualMorphology(reasoning);
      case LLM_AGENT_TYPES.CODE:
        return this.extractTechnicalMorphology(reasoning);
      case LLM_AGENT_TYPES.SOCIAL:
        return this.extractSocialMorphology(reasoning);
      case LLM_AGENT_TYPES.CRITIC:
        return this.extractCriticalMorphology(reasoning);
      case LLM_AGENT_TYPES.COORDINATOR:
        return this.extractCoordinationMorphology(reasoning);
      default:
        return {};
    }
  }

  /**
   * REASONING AGENT: Extract logical structure and inference chains
   */
  private static extractLogicalMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const premises = reasoning.filter(r => 
      r.type === REASONING_TYPES.PREMISE || 
      r.content.toLowerCase().includes('premise') ||
      r.content.toLowerCase().includes('assumption') ||
      r.content.toLowerCase().includes('given')
    );

    const inferences = reasoning.filter(r => 
      r.type === REASONING_TYPES.INFERENCE ||
      r.content.toLowerCase().includes('therefore') ||
      r.content.toLowerCase().includes('thus') ||
      r.content.toLowerCase().includes('follows')
    );

    const conclusions = reasoning.filter(r => 
      r.type === REASONING_TYPES.CONCLUSION ||
      r.content.toLowerCase().includes('conclusion') ||
      r.content.toLowerCase().includes('result')
    );

    // Calculate logical validity based on structure
    const logical_validity = this.calculateLogicalValidity(premises, inferences, conclusions);

    // Extract concept relations
    const concept_relations = this.extractConceptRelations(reasoning);

    // Extract evidence chains
    const evidence_chain = this.extractEvidenceChains(reasoning);

    return {
      logical_structure: {
        premises,
        inferences,
        conclusions,
        logical_validity
      },
      concept_relations,
      evidence_chain
    };
  }

  /**
   * CREATIVE AGENT: Extract creative patterns and originality indicators
   */
  private static extractCreativeMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const creative_patterns: CreativePattern[] = [];

    reasoning.forEach(step => {
      const content = step.content.toLowerCase();
      
      // Detect analogies
      if (content.includes('like') || content.includes('similar to') || content.includes('analogous')) {
        creative_patterns.push({
          pattern_type: 'analogy',
          originality_score: this.assessOriginality(step.content),
          combination_elements: this.extractCombinationElements(step.content)
        });
      }

      // Detect metaphors
      if (content.includes('metaphor') || this.containsMetaphoricalLanguage(content)) {
        creative_patterns.push({
          pattern_type: 'metaphor',
          originality_score: this.assessOriginality(step.content),
          combination_elements: this.extractCombinationElements(step.content)
        });
      }

      // Detect synthesis
      if (content.includes('combine') || content.includes('merge') || content.includes('synthesize')) {
        creative_patterns.push({
          pattern_type: 'synthesis',
          originality_score: this.assessOriginality(step.content),
          combination_elements: this.extractCombinationElements(step.content)
        });
      }

      // Detect reframing
      if (content.includes('perspective') || content.includes('view') || content.includes('frame')) {
        creative_patterns.push({
          pattern_type: 'reframing',
          originality_score: this.assessOriginality(step.content),
          combination_elements: this.extractCombinationElements(step.content)
        });
      }
    });

    return { creative_patterns };
  }

  /**
   * FACTUAL AGENT: Extract evidence chains and fact verification
   */
  private static extractFactualMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const evidence_chain: EvidenceLink[] = [];

    reasoning.forEach(step => {
      const content = step.content;
      
      // Extract claims and evidence
      const claims = this.extractClaims(content);
      const evidence = this.extractEvidence(content);
      const sources = this.extractSources(content);

      claims.forEach(claim => {
        evidence_chain.push({
          claim,
          evidence: evidence.join('; '),
          support_strength: this.assessSupportStrength(claim, evidence),
          source_reliability: this.assessSourceReliability(sources)
        });
      });
    });

    return { evidence_chain };
  }

  /**
   * CODE AGENT: Extract technical components and implementation details
   */
  private static extractTechnicalMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const technical_components: TechnicalComponent[] = [];

    reasoning.forEach(step => {
      const content = step.content.toLowerCase();

      // Detect algorithms
      if (content.includes('algorithm') || content.includes('sort') || content.includes('search')) {
        technical_components.push({
          component_type: 'algorithm',
          complexity_level: this.assessComplexity(step.content),
          feasibility_score: this.assessFeasibility(step.content)
        });
      }

      // Detect architecture
      if (content.includes('architecture') || content.includes('design') || content.includes('structure')) {
        technical_components.push({
          component_type: 'architecture',
          complexity_level: this.assessComplexity(step.content),
          feasibility_score: this.assessFeasibility(step.content)
        });
      }

      // Detect optimization
      if (content.includes('optimize') || content.includes('performance') || content.includes('efficient')) {
        technical_components.push({
          component_type: 'optimization',
          complexity_level: this.assessComplexity(step.content),
          feasibility_score: this.assessFeasibility(step.content)
        });
      }

      // Detect implementation
      if (content.includes('implement') || content.includes('code') || content.includes('function')) {
        technical_components.push({
          component_type: 'implementation',
          complexity_level: this.assessComplexity(step.content),
          feasibility_score: this.assessFeasibility(step.content)
        });
      }
    });

    return { technical_components };
  }

  /**
   * SOCIAL AGENT: Extract social dynamics and stakeholder impacts
   */
  private static extractSocialMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const social_dynamics: SocialDynamic[] = [];

    reasoning.forEach(step => {
      const stakeholders = this.extractStakeholders(step.content);
      
      stakeholders.forEach(stakeholder => {
        const impact_type = this.assessImpactType(step.content, stakeholder);
        const impact_magnitude = this.assessImpactMagnitude(step.content);
        
        social_dynamics.push({
          stakeholder,
          impact_type,
          impact_magnitude,
          mitigation_needed: impact_type === 'negative' && impact_magnitude > 0.5
        });
      });
    });

    return { social_dynamics };
  }

  /**
   * CRITIC AGENT: Extract critical factors and risk assessments
   */
  private static extractCriticalMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const critical_factors: CriticalFactor[] = [];

    reasoning.forEach(step => {
      const content = step.content.toLowerCase();

      // Detect risks
      if (content.includes('risk') || content.includes('danger') || content.includes('threat')) {
        critical_factors.push({
          factor_type: 'risk',
          severity: this.assessSeverity(step.content),
          likelihood: this.assessLikelihood(step.content),
          mitigation_difficulty: this.assessMitigationDifficulty(step.content)
        });
      }

      // Detect limitations
      if (content.includes('limitation') || content.includes('constraint') || content.includes('boundary')) {
        critical_factors.push({
          factor_type: 'limitation',
          severity: this.assessSeverity(step.content),
          likelihood: 1.0, // Limitations are certain
          mitigation_difficulty: this.assessMitigationDifficulty(step.content)
        });
      }

      // Detect assumptions
      if (content.includes('assumption') || content.includes('assume') || content.includes('presume')) {
        critical_factors.push({
          factor_type: 'assumption',
          severity: this.assessSeverity(step.content),
          likelihood: this.assessLikelihood(step.content),
          mitigation_difficulty: this.assessMitigationDifficulty(step.content)
        });
      }
    });

    return { critical_factors };
  }

  /**
   * COORDINATOR AGENT: Extract coordination elements and consensus patterns
   */
  private static extractCoordinationMorphology(reasoning: ReasoningStep[]): SemanticMorphology {
    const coordination_elements: CoordinationElement[] = [];

    reasoning.forEach(step => {
      const content = step.content.toLowerCase();

      // Detect consensus
      if (content.includes('consensus') || content.includes('agreement') || content.includes('align')) {
        coordination_elements.push({
          element_type: 'consensus',
          agents_involved: this.extractMentionedAgents(step.content),
          coordination_complexity: this.assessCoordinationComplexity(step.content)
        });
      }

      // Detect conflicts
      if (content.includes('conflict') || content.includes('disagree') || content.includes('contradict')) {
        coordination_elements.push({
          element_type: 'conflict',
          agents_involved: this.extractMentionedAgents(step.content),
          coordination_complexity: this.assessCoordinationComplexity(step.content)
        });
      }

      // Detect priorities
      if (content.includes('priority') || content.includes('important') || content.includes('critical')) {
        coordination_elements.push({
          element_type: 'priority',
          agents_involved: this.extractMentionedAgents(step.content),
          coordination_complexity: this.assessCoordinationComplexity(step.content)
        });
      }
    });

    return { coordination_elements };
  }

  // Helper methods for morphology extraction

  private static calculateLogicalValidity(
    premises: ReasoningStep[], 
    inferences: ReasoningStep[], 
    conclusions: ReasoningStep[]
  ): number {
    // Simple validity assessment based on structure
    const hasValidStructure = premises.length > 0 && conclusions.length > 0;
    const hasInferences = inferences.length > 0;
    const balancedRatio = Math.min(premises.length / Math.max(conclusions.length, 1), 1);
    
    return hasValidStructure ? (hasInferences ? 0.8 : 0.6) * balancedRatio : 0.3;
  }

  private static extractConceptRelations(reasoning: ReasoningStep[]): ConceptRelation[] {
    const relations: ConceptRelation[] = [];
    
    reasoning.forEach(step => {
      const content = step.content.toLowerCase();
      
      // Simple relation detection
      if (content.includes('causes') || content.includes('leads to')) {
        relations.push({
          concept1: step.concept || 'unknown',
          concept2: 'effect',
          relation_type: 'causes',
          strength: 0.7
        });
      }
      
      if (content.includes('implies') || content.includes('suggests')) {
        relations.push({
          concept1: step.concept || 'unknown',
          concept2: 'implication',
          relation_type: 'implies',
          strength: 0.6
        });
      }
    });
    
    return relations;
  }

  private static extractEvidenceChains(reasoning: ReasoningStep[]): EvidenceLink[] {
    return reasoning.map(step => ({
      claim: step.content.substring(0, 100),
      evidence: step.content,
      support_strength: step.confidence || 0.5,
      source_reliability: 0.7 // Default reliability
    }));
  }

  private static assessOriginality(content: string): number {
    // Simple originality assessment based on content characteristics
    const uniqueWords = new Set(content.toLowerCase().split(/\W+/)).size;
    const length = content.length;
    const complexityIndicators = (content.match(/however|nevertheless|furthermore|moreover/gi) || []).length;
    
    return Math.min((uniqueWords / 20) + (length / 500) + (complexityIndicators * 0.1), 1.0);
  }

  private static extractCombinationElements(content: string): string[] {
    // Extract potential combination elements (simplified)
    const words = content.toLowerCase().split(/\W+/);
    return words.filter(word => word.length > 4).slice(0, 5);
  }

  private static containsMetaphoricalLanguage(content: string): boolean {
    const metaphorIndicators = ['bridge', 'foundation', 'building', 'flow', 'path', 'journey', 'web', 'tree'];
    return metaphorIndicators.some(indicator => content.includes(indicator));
  }

  private static extractClaims(content: string): string[] {
    // Simple claim extraction - sentences that make assertions
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(sentence => 
      sentence.trim().length > 10 && 
      !sentence.toLowerCase().includes('question')
    ).slice(0, 3);
  }

  private static extractEvidence(content: string): string[] {
    // Extract evidence indicators
    const evidenceKeywords = ['data', 'study', 'research', 'statistics', 'survey', 'experiment'];
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(sentence => 
      evidenceKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
  }

  private static extractSources(content: string): string[] {
    // Extract source mentions (simplified)
    const sourcePatterns = /\b\w+\s+(study|research|report|paper|article)\b/gi;
    return (content.match(sourcePatterns) || []).slice(0, 3);
  }

  private static assessSupportStrength(claim: string, evidence: string[]): number {
    // Assess how well evidence supports the claim
    const evidenceCount = evidence.length;
    const evidenceLength = evidence.join('').length;
    return Math.min((evidenceCount * 0.2) + (evidenceLength / 500), 1.0);
  }

  private static assessSourceReliability(sources: string[]): number {
    // Simple source reliability assessment
    const reliableIndicators = ['university', 'journal', 'institute', 'government', 'official'];
    const reliableCount = sources.filter(source => 
      reliableIndicators.some(indicator => source.toLowerCase().includes(indicator))
    ).length;
    
    return sources.length > 0 ? (reliableCount / sources.length) : 0.5;
  }

  private static assessComplexity(content: string): number {
    // Assess technical complexity
    const complexityIndicators = ['algorithm', 'optimization', 'architecture', 'scalability', 'distributed'];
    const matches = complexityIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    return Math.min(matches * 0.2, 1.0);
  }

  private static assessFeasibility(content: string): number {
    // Assess implementation feasibility
    const feasibilityIndicators = ['simple', 'straightforward', 'standard', 'proven'];
    const difficultyIndicators = ['complex', 'challenging', 'difficult', 'experimental'];
    
    const feasible = feasibilityIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    const difficult = difficultyIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    
    return Math.max(0.1, 0.7 + (feasible * 0.1) - (difficult * 0.2));
  }

  private static extractStakeholders(content: string): string[] {
    // Extract stakeholder mentions
    const stakeholderKeywords = ['user', 'customer', 'team', 'developer', 'manager', 'client', 'stakeholder'];
    const found = stakeholderKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    return found.length > 0 ? found : ['general_stakeholder'];
  }

  private static assessImpactType(content: string, stakeholder: string): 'positive' | 'negative' | 'neutral' {
    const contentLower = content.toLowerCase();
    const positiveWords = ['benefit', 'improve', 'enhance', 'positive', 'good', 'better'];
    const negativeWords = ['problem', 'issue', 'negative', 'worse', 'difficult', 'challenge'];
    
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static assessImpactMagnitude(content: string): number {
    // Assess magnitude of impact
    const magnitudeWords = ['significant', 'major', 'critical', 'important', 'substantial'];
    const matches = magnitudeWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    return Math.min(0.3 + (matches * 0.2), 1.0);
  }

  private static assessSeverity(content: string): number {
    // Assess severity of issues
    const severityWords = ['critical', 'severe', 'major', 'serious', 'significant'];
    const matches = severityWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    return Math.min(0.2 + (matches * 0.2), 1.0);
  }

  private static assessLikelihood(content: string): number {
    // Assess likelihood of occurrence
    const likelihoodWords = ['likely', 'probable', 'certain', 'definitely', 'surely'];
    const uncertaintyWords = ['unlikely', 'maybe', 'possibly', 'uncertain'];
    
    const likelihood = likelihoodWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    const uncertainty = uncertaintyWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    return Math.max(0.1, 0.5 + (likelihood * 0.2) - (uncertainty * 0.2));
  }

  private static assessMitigationDifficulty(content: string): number {
    // Assess difficulty of mitigation
    const easyWords = ['simple', 'easy', 'straightforward', 'quick'];
    const hardWords = ['complex', 'difficult', 'challenging', 'impossible'];
    
    const easy = easyWords.filter(word => content.toLowerCase().includes(word)).length;
    const hard = hardWords.filter(word => content.toLowerCase().includes(word)).length;
    
    return Math.max(0.1, 0.5 - (easy * 0.2) + (hard * 0.2));
  }

  private static extractMentionedAgents(content: string): string[] {
    // Extract mentions of agent types or roles
    const agentKeywords = ['reasoning', 'creative', 'factual', 'code', 'social', 'critic', 'coordinator'];
    return agentKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private static assessCoordinationComplexity(content: string): number {
    // Assess coordination complexity
    const complexityWords = ['complex', 'multiple', 'various', 'different', 'conflicting'];
    const matches = complexityWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    return Math.min(0.3 + (matches * 0.2), 1.0);
  }
}
