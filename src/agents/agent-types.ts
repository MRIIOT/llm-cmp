/**
 * Agent Type Definitions for LLM Orchestration System
 * Defines the 7 specialized agent types and knowledge domains
 */

export const LLM_AGENT_TYPES = {
  REASONING: 'reasoning_specialist',    // Logic, math, analysis
  CREATIVE: 'creative_specialist',      // Writing, ideation, synthesis  
  FACTUAL: 'factual_specialist',       // Knowledge retrieval, facts
  CODE: 'code_specialist',             // Programming, technical
  SOCIAL: 'social_specialist',         // Communication, empathy
  CRITIC: 'critical_specialist',       // Validation, error detection
  COORDINATOR: 'meta_coordinator'       // Orchestration, planning
} as const;

export type AgentType = typeof LLM_AGENT_TYPES[keyof typeof LLM_AGENT_TYPES];

export const KNOWLEDGE_FRAMES = {
  TECHNICAL: 'technical_domain',
  CREATIVE: 'creative_domain', 
  FACTUAL: 'factual_domain',
  SOCIAL: 'social_domain',
  META: 'meta_reasoning'
} as const;

export type KnowledgeFrame = typeof KNOWLEDGE_FRAMES[keyof typeof KNOWLEDGE_FRAMES];

/**
 * Specialization mappings for each agent type
 */
export const AGENT_SPECIALIZATIONS = {
  [LLM_AGENT_TYPES.REASONING]: {
    domain: KNOWLEDGE_FRAMES.TECHNICAL,
    focus: 'logical_analysis',
    strengths: ['deductive_reasoning', 'premise_validation', 'logical_consistency'],
    preferredModels: ['claude-3-opus', 'gpt-4'],
    confidenceThreshold: 0.8
  },
  [LLM_AGENT_TYPES.CREATIVE]: {
    domain: KNOWLEDGE_FRAMES.CREATIVE,
    focus: 'creative_synthesis',
    strengths: ['divergent_thinking', 'novel_combinations', 'alternative_perspectives'],
    preferredModels: ['gpt-4-turbo', 'claude-3-sonnet'],
    confidenceThreshold: 0.6
  },
  [LLM_AGENT_TYPES.FACTUAL]: {
    domain: KNOWLEDGE_FRAMES.FACTUAL,
    focus: 'knowledge_retrieval',
    strengths: ['fact_verification', 'information_synthesis', 'accuracy_assessment'],
    preferredModels: ['claude-3-sonnet', 'gpt-4'],
    confidenceThreshold: 0.85
  },
  [LLM_AGENT_TYPES.CODE]: {
    domain: KNOWLEDGE_FRAMES.TECHNICAL,
    focus: 'programming',
    strengths: ['algorithmic_design', 'code_optimization', 'technical_architecture'],
    preferredModels: ['claude-3-haiku', 'gpt-4'],
    confidenceThreshold: 0.9
  },
  [LLM_AGENT_TYPES.SOCIAL]: {
    domain: KNOWLEDGE_FRAMES.SOCIAL,
    focus: 'communication',
    strengths: ['empathy_modeling', 'stakeholder_analysis', 'communication_strategy'],
    preferredModels: ['gpt-4', 'claude-3-sonnet'],
    confidenceThreshold: 0.7
  },
  [LLM_AGENT_TYPES.CRITIC]: {
    domain: KNOWLEDGE_FRAMES.META,
    focus: 'validation',
    strengths: ['risk_assessment', 'limitation_identification', 'quality_evaluation'],
    preferredModels: ['claude-3-opus', 'gpt-4'],
    confidenceThreshold: 0.75
  },
  [LLM_AGENT_TYPES.COORDINATOR]: {
    domain: KNOWLEDGE_FRAMES.META,
    focus: 'meta_reasoning',
    strengths: ['perspective_synthesis', 'consensus_building', 'orchestration'],
    preferredModels: ['gpt-4-turbo', 'claude-3-opus'],
    confidenceThreshold: 0.8
  }
} as const;

/**
 * Reasoning step types for each agent specialization
 */
export const REASONING_TYPES = {
  // Reasoning Agent
  PREMISE: 'premise',
  INFERENCE: 'inference', 
  CONCLUSION: 'conclusion',
  LOGICAL_VALIDATION: 'logical_validation',
  
  // Creative Agent
  DIVERGENT_EXPLORATION: 'divergent_exploration',
  CREATIVE_SYNTHESIS: 'creative_synthesis',
  NOVEL_PERSPECTIVE: 'novel_perspective',
  IMAGINATIVE_EXTENSION: 'imaginative_extension',
  
  // Factual Agent
  FACT_RETRIEVAL: 'fact_retrieval',
  FACT_VERIFICATION: 'fact_verification',
  SOURCE_ANALYSIS: 'source_analysis',
  KNOWLEDGE_INTEGRATION: 'knowledge_integration',
  
  // Code Agent
  PROBLEM_DECOMPOSITION: 'problem_decomposition',
  ALGORITHM_DESIGN: 'algorithm_design',
  IMPLEMENTATION_STRATEGY: 'implementation_strategy',
  OPTIMIZATION_ANALYSIS: 'optimization_analysis',
  
  // Social Agent
  STAKEHOLDER_ANALYSIS: 'stakeholder_analysis',
  EMPATHY_MODELING: 'empathy_modeling',
  COMMUNICATION_STRATEGY: 'communication_strategy',
  SOCIAL_IMPACT_ASSESSMENT: 'social_impact_assessment',
  
  // Critic Agent
  RISK_IDENTIFICATION: 'risk_identification',
  LIMITATION_ANALYSIS: 'limitation_analysis',
  FAILURE_MODE_ANALYSIS: 'failure_mode_analysis',
  IMPROVEMENT_SUGGESTION: 'improvement_suggestion',
  
  // Coordinator Agent
  PERSPECTIVE_AGGREGATION: 'perspective_aggregation',
  CONSENSUS_BUILDING: 'consensus_building',
  PRIORITY_ASSESSMENT: 'priority_assessment',
  ORCHESTRATION_PLANNING: 'orchestration_planning'
} as const;

/**
 * Get specialization info for an agent type
 */
export function getAgentSpecialization(agentType: AgentType) {
  return AGENT_SPECIALIZATIONS[agentType];
}

/**
 * Get preferred reasoning types for an agent
 */
export function getReasoningTypesForAgent(agentType: AgentType): string[] {
  const typeMap = {
    [LLM_AGENT_TYPES.REASONING]: [
      REASONING_TYPES.PREMISE,
      REASONING_TYPES.INFERENCE,
      REASONING_TYPES.CONCLUSION,
      REASONING_TYPES.LOGICAL_VALIDATION
    ],
    [LLM_AGENT_TYPES.CREATIVE]: [
      REASONING_TYPES.DIVERGENT_EXPLORATION,
      REASONING_TYPES.CREATIVE_SYNTHESIS,
      REASONING_TYPES.NOVEL_PERSPECTIVE,
      REASONING_TYPES.IMAGINATIVE_EXTENSION
    ],
    [LLM_AGENT_TYPES.FACTUAL]: [
      REASONING_TYPES.FACT_RETRIEVAL,
      REASONING_TYPES.FACT_VERIFICATION,
      REASONING_TYPES.SOURCE_ANALYSIS,
      REASONING_TYPES.KNOWLEDGE_INTEGRATION
    ],
    [LLM_AGENT_TYPES.CODE]: [
      REASONING_TYPES.PROBLEM_DECOMPOSITION,
      REASONING_TYPES.ALGORITHM_DESIGN,
      REASONING_TYPES.IMPLEMENTATION_STRATEGY,
      REASONING_TYPES.OPTIMIZATION_ANALYSIS
    ],
    [LLM_AGENT_TYPES.SOCIAL]: [
      REASONING_TYPES.STAKEHOLDER_ANALYSIS,
      REASONING_TYPES.EMPATHY_MODELING,
      REASONING_TYPES.COMMUNICATION_STRATEGY,
      REASONING_TYPES.SOCIAL_IMPACT_ASSESSMENT
    ],
    [LLM_AGENT_TYPES.CRITIC]: [
      REASONING_TYPES.RISK_IDENTIFICATION,
      REASONING_TYPES.LIMITATION_ANALYSIS,
      REASONING_TYPES.FAILURE_MODE_ANALYSIS,
      REASONING_TYPES.IMPROVEMENT_SUGGESTION
    ],
    [LLM_AGENT_TYPES.COORDINATOR]: [
      REASONING_TYPES.PERSPECTIVE_AGGREGATION,
      REASONING_TYPES.CONSENSUS_BUILDING,
      REASONING_TYPES.PRIORITY_ASSESSMENT,
      REASONING_TYPES.ORCHESTRATION_PLANNING
    ]
  };
  
  return typeMap[agentType] || [];
}

/**
 * Check if two agents are in compatible knowledge domains
 */
export function areDomainsCompatible(domain1: KnowledgeFrame, domain2: KnowledgeFrame): boolean {
  // Define compatibility matrix
  const compatibility: Record<KnowledgeFrame, KnowledgeFrame[]> = {
    [KNOWLEDGE_FRAMES.TECHNICAL]: [KNOWLEDGE_FRAMES.TECHNICAL, KNOWLEDGE_FRAMES.META],
    [KNOWLEDGE_FRAMES.CREATIVE]: [KNOWLEDGE_FRAMES.CREATIVE, KNOWLEDGE_FRAMES.SOCIAL],
    [KNOWLEDGE_FRAMES.FACTUAL]: [KNOWLEDGE_FRAMES.FACTUAL, KNOWLEDGE_FRAMES.TECHNICAL, KNOWLEDGE_FRAMES.META],
    [KNOWLEDGE_FRAMES.SOCIAL]: [KNOWLEDGE_FRAMES.SOCIAL, KNOWLEDGE_FRAMES.CREATIVE, KNOWLEDGE_FRAMES.META],
    [KNOWLEDGE_FRAMES.META]: [KNOWLEDGE_FRAMES.META, KNOWLEDGE_FRAMES.TECHNICAL, KNOWLEDGE_FRAMES.FACTUAL, KNOWLEDGE_FRAMES.SOCIAL]
  };
  
  return compatibility[domain1]?.includes(domain2) || false;
}
