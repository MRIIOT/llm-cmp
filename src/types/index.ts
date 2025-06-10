/**
 *  Type System
 * Clean slate design optimized for HTM, Bayesian Evidence, and Dynamic Agents
 */

// ===============================================
// Core Agent Types
// ===============================================

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  strength: number; // 0.0 to 1.0
  adaptationRate: number;
  specializations: string[];
  morphology: AgentMorphology;
  lastUsed: Date;
  performanceHistory: PerformanceMetric[];
}

export interface AgentMorphology {
  structure: any; // Dynamic structure that can evolve
  connections: Map<string, number>; // Inter-capability connections
  emergentProperties: string[];
  adaptationHistory: MorphologyChange[];
}

export interface MorphologyChange {
  timestamp: Date;
  changeType: 'structural' | 'connection' | 'emergent';
  before: any;
  after: any;
  trigger: string;
}

export interface PerformanceMetric {
  timestamp: Date;
  taskType: string;
  accuracy: number;
  efficiency: number;
  adaptability: number;
  quality: number;
}

// ===============================================
//  Message Types
// ===============================================

export interface Message {
  id: string;
  timestamp: Date;
  agentId: string;
  agentCapabilities: string[]; // Active capability IDs
  content: MessageContent;
  metadata: MessageMetadata;
}

export interface MessageContent {
  reasoning: ReasoningChain;
  evidence: Evidence[];
  semanticPosition: SemanticPosition;
  temporalContext: TemporalContext;
  predictions: Prediction[];
}

export interface MessageMetadata {
  htmState: HTMState;
  bayesianBelief: BayesianBelief;
  uncertainty: UncertaintyEstimate;
  morphologySnapshot: any;
  processingTime: number;
}

// ===============================================
// Reasoning and Evidence Types
// ===============================================

export interface ReasoningChain {
  steps: ReasoningStep[];
  confidence: ConfidenceInterval;
  logicalStructure: LogicalStructure;
  temporalPattern: string;
  logicalProof?: LogicalProof; // Added for formal verification
}

export interface ReasoningStep {
  id: string;
  type: ReasoningType;
  content: string;
  concept: string;
  confidence: ConfidenceInterval;
  supporting: string[]; // IDs of supporting steps
  refuting: string[]; // IDs of refuting steps
  logicalForm?: LogicalStatement; // Added for formal logic
  inferenceRule?: InferenceRule; // Added to show how derived
}

export type ReasoningType = 
  | 'observation'
  | 'inference' 
  | 'deduction'
  | 'induction'
  | 'abduction'
  | 'analogy'
  | 'synthesis'
  | 'critique'
  | 'prediction';

export interface LogicalStructure {
  premises: string[]; // Step IDs
  inferences: string[]; // Step IDs
  conclusions: string[]; // Step IDs
  assumptions: string[]; // Step IDs
}

// ===============================================
// Logical Proof Types
// ===============================================

export interface LogicalProof {
  premises: Premise[];
  inferenceRules: InferenceRuleApplication[];
  conclusions: Conclusion[];
  validity: ValidationResult;
  contradictions: Contradiction[];
  completeness: CompletenessCheck;
}

export interface Premise {
  id: string;
  statement: LogicalStatement;
  source: string; // Step ID
  type: 'axiom' | 'assumption' | 'observation' | 'derived';
  justification?: string;
}

export interface LogicalStatement {
  id: string;
  content: string;
  formalNotation: string; // e.g., "P → Q"
  predicates: Predicate[];
  quantifiers: Quantifier[];
  connectives: LogicalConnective[];
}

export interface Predicate {
  symbol: string;
  arity: number;
  arguments: string[];
}

export interface Quantifier {
  type: 'universal' | 'existential';
  variable: string;
  scope: string; // ID of sub-statement
}

export interface LogicalConnective {
  type: 'and' | 'or' | 'not' | 'implies' | 'iff';
  operands: string[]; // Statement IDs
}

export interface InferenceRule {
  name: string;
  notation: string;
  premises: string[]; // Formal patterns like "P→Q", "P"
  conclusion: string; // Formal pattern like "Q"
  validity: 'sound' | 'valid' | 'invalid';
}

export interface InferenceRuleApplication {
  rule: InferenceRule;
  premises: string[]; // Actual statement IDs
  conclusion: string; // Actual statement ID
  substitutions: Map<string, string>; // Variable bindings
  valid: boolean;
}

export interface Conclusion {
  id: string;
  statement: LogicalStatement;
  derivedFrom: string[]; // Premise/inference IDs
  strength: 'necessary' | 'probable' | 'possible';
  confidence: ConfidenceInterval;
}

export interface ValidationResult {
  isValid: boolean;
  isSoundCompound: boolean;
  isComplete: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'invalid_inference' | 'contradiction' | 'circular_reasoning' | 'missing_premise';
  location: string[]; // Step IDs
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ValidationWarning {
  type: 'weak_inference' | 'assumption_heavy' | 'low_confidence';
  location: string[]; // Step IDs
  description: string;
}

export interface Contradiction {
  statements: string[]; // Statement IDs that contradict
  type: 'direct' | 'indirect' | 'semantic';
  resolution: 'unresolved' | 'premise_rejected' | 'context_dependent';
  explanation: string;
}

export interface CompletenessCheck {
  allPremisesJustified: boolean;
  allInferencesValid: boolean;
  conclusionsSupported: boolean;
  missingElements: string[];
}

// Common inference rules
export const COMMON_INFERENCE_RULES: InferenceRule[] = [
  {
    name: 'Modus Ponens',
    notation: 'P→Q, P ⊢ Q',
    premises: ['P→Q', 'P'],
    conclusion: 'Q',
    validity: 'sound'
  },
  {
    name: 'Modus Tollens',
    notation: 'P→Q, ¬Q ⊢ ¬P',
    premises: ['P→Q', '¬Q'],
    conclusion: '¬P',
    validity: 'sound'
  },
  {
    name: 'Hypothetical Syllogism',
    notation: 'P→Q, Q→R ⊢ P→R',
    premises: ['P→Q', 'Q→R'],
    conclusion: 'P→R',
    validity: 'sound'
  },
  {
    name: 'Disjunctive Syllogism',
    notation: 'P∨Q, ¬P ⊢ Q',
    premises: ['P∨Q', '¬P'],
    conclusion: 'Q',
    validity: 'sound'
  },
  {
    name: 'Universal Instantiation',
    notation: '∀x P(x) ⊢ P(a)',
    premises: ['∀x P(x)'],
    conclusion: 'P(a)',
    validity: 'sound'
  }
];

export interface Evidence {
  id: string;
  source: string;
  content: string;
  confidence: ConfidenceInterval;
  timestamp: Date;
  type: EvidenceType;
  metadata: EvidenceMetadata;
}

export type EvidenceType = 
  | 'empirical'
  | 'testimonial'
  | 'analytical'
  | 'circumstantial'
  | 'theoretical';

export interface EvidenceMetadata {
  reliability: number;
  relevance: number;
  corroboration: string[]; // IDs of corroborating evidence
  conflicts: string[]; // IDs of conflicting evidence
}

// ===============================================
// Bayesian Types
// ===============================================

export interface BayesianBelief {
  beliefs: Map<string, BeliefDistribution>;
  network: BayesianNetworkSnapshot;
  lastUpdate: Date;
}

export interface BeliefDistribution {
  variable: string;
  states: Map<string, number>; // state -> probability
  entropy: number;
  mostLikely: string;
}

export interface BayesianNetworkSnapshot {
  nodes: string[];
  edges: Array<[string, string]>;
  cpts: Map<string, any>; // Conditional probability tables
}

export interface ConfidenceInterval {
  mean: number;
  lower: number; // 95% CI lower bound
  upper: number; // 95% CI upper bound
  method: 'wilson' | 'normal' | 'bootstrap' | 'bayesian';
}

export interface UncertaintyEstimate {
  aleatoric: number; // Irreducible uncertainty
  epistemic: number; // Reducible uncertainty
  total: number;
  sources: UncertaintySource[];
}

export interface UncertaintySource {
  type: 'data' | 'model' | 'parameter' | 'structural';
  contribution: number;
  description: string;
}

// ===============================================
// HTM and Temporal Types
// ===============================================

export interface HTMState {
  activeColumns: number[];
  predictedColumns: number[];
  anomalyScore: number;
  sequenceId: string;
  learningEnabled: boolean;
}

export interface TemporalContext {
  currentPattern: string;
  patternHistory: string[];
  predictions: TemporalPrediction[];
  stability: number;
  periodicity: PeriodicPattern[];
}

export interface TemporalPrediction {
  pattern: string;
  timeHorizon: number;
  confidence: number;
  alternatives: Array<{pattern: string; probability: number}>;
}

export interface PeriodicPattern {
  period: number;
  strength: number;
  phase: number;
  lastOccurrence: Date;
}

export interface Prediction {
  type: 'next_step' | 'sequence' | 'outcome';
  content: string;
  confidence: ConfidenceInterval;
  timeframe: number; // milliseconds
  basis: string[]; // Evidence/reasoning IDs
}

// ===============================================
// Semantic Space Types
// ===============================================

export interface SemanticPosition {
  coordinates: number[]; // N-dimensional position
  manifold: string; // Which semantic manifold
  confidence: number;
  trajectory: SemanticTrajectory;
}

export interface SemanticTrajectory {
  positions: SemanticPosition[];
  velocity: number[];
  acceleration: number[];
  curvature: number;
}

export interface SemanticManifold {
  id: string;
  dimensions: number;
  metric: (p1: number[], p2: number[]) => number;
  regions: SemanticRegion[];
}

export interface SemanticRegion {
  id: string;
  center: number[];
  radius: number;
  concepts: string[];
  density: number;
}

// ===============================================
// Consensus Types
// ===============================================

export interface ConsensusRequest {
  id: string;
  question: string;
  context: any;
  constraints: ConsensusConstraints;
  deadline: Date;
}

export interface ConsensusConstraints {
  minAgents: number;
  maxAgents: number;
  requiredCapabilities: string[];
  consensusThreshold: number;
  timeLimit: number;
}

export interface ConsensusResult {
  id: string;
  requestId: string;
  consensus: string;
  confidence: ConfidenceInterval;
  participants: ParticipantInfo[];
  dissent: DissentInfo[];
  method: ConsensusMethod;
  timestamp: Date;
}

export interface ParticipantInfo {
  agentId: string;
  capabilities: string[];
  contribution: number;
  vote: string;
  confidence: number;
}

export interface DissentInfo {
  agentId: string;
  position: string;
  reasoning: string;
  confidence: number;
}

export type ConsensusMethod = 
  | 'simple_majority'
  | 'weighted_voting'
  | 'bayesian_aggregation'
  | 'game_theoretic'
  | 'hierarchical';

// ===============================================
// Orchestration Types
// ===============================================

export interface OrchestrationRequest {
  query: string;
  context: any;
  constraints: OrchestrationConstraints;
  metadata: RequestMetadata;
}

export interface OrchestrationConstraints {
  maxTime: number;
  maxCost: number;
  minConfidence: number;
  requiredEvidence: string[];
}

export interface RequestMetadata {
  userId: string;
  sessionId: string;
  previousQueries: string[];
  preferences: any;
}

export interface OrchestrationResult {
  response: string;
  confidence: ConfidenceInterval;
  reasoning: ReasoningChain;
  evidence: Evidence[];
  consensus: ConsensusResult;
  performance: PerformanceReport;
  predictions: Prediction[];
}

export interface PerformanceReport {
  totalTime: number;
  agentCount: number;
  tokenUsage: number;
  htmUtilization: number;
  bayesianUpdates: number;
  consensusRounds: number;
}

// ===============================================
// Configuration Types
// ===============================================

export interface Config {
  agents: AgentConfig;
  htm: HTMConfig;
  bayesian: BayesianConfig;
  consensus: ConsensusConfig;
  performance: PerformanceConfig;
  semantic?: SemanticConfig;
  anomaly?: AnomalyConfig;
}

export interface AgentConfig {
  minAgents: number;
  maxAgents: number;
  baseCapabilities: string[];
  adaptationRate: number;
  evolutionEnabled: boolean;
}

export interface HTMConfig {
  columnCount: number;
  cellsPerColumn: number;
  learningRadius: number;
  learningRate: number;
  maxSequenceLength: number;
}

export interface BayesianConfig {
  priorStrength: number;
  updatePolicy: 'conservative' | 'aggressive' | 'adaptive';
  conflictResolution: 'voting' | 'argumentation' | 'hierarchical' | 'weighted_consensus';
  uncertaintyThreshold: number;
}

export interface ConsensusConfig {
  defaultMethod: ConsensusMethod;
  timeoutMs: number;
  minParticipants: number;
  qualityThreshold: number;
}

export interface PerformanceConfig {
  enableCaching: boolean;
  parallelExecution: boolean;
  gpuAcceleration: boolean;
  memoryLimit: number;
  adaptiveOptimization: boolean;
}

export interface SemanticConfig {
  enableHierarchicalEncoding?: boolean;
  enablePhase2Enhancements?: boolean;
  enableConceptNormalization?: boolean;
  enableRelationshipTracking?: boolean;
  numColumns?: number;
  sparsity?: number;
  columnsPerConcept?: number;
  columnOverlapRatio?: number;
  // Domain coherence parameters
  domainCoherenceMode?: boolean;
  conceptOverlapThreshold?: number;
  domainStickiness?: number;
  semanticGeneralization?: number;
  crossDomainPenalty?: number;
  activationThreshold?: number;
  semanticDecayRate?: number;
  domainSpecificFeatures?: boolean;
  featureReuse?: number;
  conceptSimilarityBoost?: number;
  // Ghost token parameters
  enableGhostTokens?: boolean;
  enableEdgeToggling?: boolean;
  maxGhostTokens?: number;
  minGhostTokenProbability?: number;
}

export interface AnomalyConfig {
  domainAwareScoring?: boolean;
  temporalCoherence?: {
    windowSize: number;
    smoothingFactor: number;
  };
  domainSimilarity?: {
    similarityThreshold: number;
    similarityBoost: number;
  };
  patternMemory?: {
    maxPatterns: number;
    decayRate: number;
    minPatternSupport: number;
  };
  // Legacy properties for backward compatibility
  inDomainThreshold?: number;
  crossDomainThreshold?: number;
  smoothingFactor?: number;
  domainTransitionPenalty?: number;
  minPatternOverlap?: number;
  patternSimilarityBoost?: number;
  temporalWindow?: number;
  temporalWeight?: number;
  domainMemorySize?: number;
  domainDecayRate?: number;
}

// ===============================================
// LLM Integration Types
// ===============================================

export interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  rateLimit: RateLimit;
  capabilities: string[];
}

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  capabilities: string[];
  costPerToken: number;
  latency: number; // average ms
}

export interface RateLimit {
  requestsPerMinute: number;
  tokensPerMinute: number;
  concurrentRequests: number;
}

export interface LLMRequest {
  model: string;
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  metadata: any;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  latency: number;
  metadata: any;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

// ===============================================
// Error Types
// ===============================================

export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class AgentError extends LLMError {
  constructor(message: string, agentId: string, context?: any) {
    super(message, 'AGENT_ERROR', { agentId, ...context });
  }
}

export class ConsensusError extends LLMError {
  constructor(message: string, requestId: string, context?: any) {
    super(message, 'CONSENSUS_ERROR', { requestId, ...context });
  }
}

export class HTMError extends LLMError {
  constructor(message: string, context?: any) {
    super(message, 'HTM_ERROR', context);
  }
}

export class BayesianError extends LLMError {
  constructor(message: string, context?: any) {
    super(message, 'BAYESIAN_ERROR', context);
  }
}