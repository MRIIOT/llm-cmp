// ===============================================
// CORE CMP TYPE DEFINITIONS
// ===============================================

export const LLM_AGENT_TYPES = {
  REASONING: 'reasoning_specialist',
  CREATIVE: 'creative_specialist', 
  FACTUAL: 'factual_specialist',
  CODE: 'code_specialist',
  SOCIAL: 'social_specialist',
  CRITIC: 'critical_specialist',
  COORDINATOR: 'meta_coordinator'
} as const;

export type LLMAgentType = typeof LLM_AGENT_TYPES[keyof typeof LLM_AGENT_TYPES];

export const KNOWLEDGE_FRAMES = {
  TECHNICAL: 'technical_domain',
  CREATIVE: 'creative_domain',
  FACTUAL: 'factual_domain', 
  SOCIAL: 'social_domain',
  META: 'meta_reasoning'
} as const;

export type KnowledgeFrame = typeof KNOWLEDGE_FRAMES[keyof typeof KNOWLEDGE_FRAMES];

// ===============================================
// SEMANTIC SPACE DEFINITIONS
// ===============================================

export interface SemanticPoseData {
  concept: number[];           // Vector in concept space
  confidence: number;          // Certainty orientation [0,1]
  context: string;            // Knowledge domain
  reasoning_path: string[];   // Chain of reasoning types
}

export interface ReasoningStep {
  type: string;
  concept: string;
  content: string;
  confidence: number;
}

export interface CMPMessage {
  header: {
    sender: LLMAgentType;
    timestamp: number;
    reasoning_depth: number;
    specialization: string;
    model_version: string;
  };
  type: string;
  reasoning: ReasoningStep[];
  semantic_pose: SemanticPoseData;
  confidence: number;
  reasoning_trace: ReasoningStep[];
}

export interface EvidenceItem {
  reasoning: ReasoningStep[];
  semantic_pose: SemanticPoseData;
  confidence: number;
  source_agent: LLMAgentType;
  supporting_agents: LLMAgentType[];
  morphology: SemanticMorphology;
  timestamp: number;
}

export interface SemanticMorphology {
  logical_structure: {
    premises: ReasoningStep[];
    inferences: ReasoningStep[];
    conclusions: ReasoningStep[];
  };
  concept_relations: string[];
  evidence_chain: string[];
}

export interface ReasoningVote {
  reasoning_id: string;
  semantic_pose: SemanticPoseData;
  confidence: number;
  supporting_count: number;
  reasoning_quality: number;
}

export interface ConsensusResult {
  consensus_confidence: number;
  participating_agents: number;
  reasoning_diversity: number;
  converged: boolean;
}

export interface VerificationProperties {
  safety: boolean;      // All confidence values valid
  liveness: boolean;    // System makes progress
  consistency: boolean; // Reasoning coherent
  completeness: boolean;// Consensus reached
}

// ===============================================
// CONFIGURATION TYPES
// ===============================================

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'gemini' | 'mock' | 'lmstudio';
  model: string;
  temperature: number;
  maxTokens: number;
  config?: any; // For provider-specific configuration (e.g., LM Studio baseUrl)
}

export interface APIConfig {
  apiKeys: {
    openai: string;
    anthropic: string;
    google?: string;
  };
  models: Record<string, ModelConfig>;
  orchestration: {
    consensusThreshold: number;
    maxRetries: number;
    timeoutMs: number;
    parallelAgents: number;
  };
}

export interface LLMResponse {
  id: string;
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model: string;
  finish_reason?: string;
}
