/**
 * Evidence and Belief System Types
 */

export interface Evidence {
  content: string;
  source: string;
  confidence: number;
  timestamp?: Date;
  topic?: string;
  sentiment?: number;
  metadata?: Map<string, any>;
}

export interface BeliefState {
  belief: number; // 0-1 probability
  uncertainty: number; // 0-1 uncertainty measure
  evidence: Evidence[];
  posterior?: Map<string, number>; // Posterior distribution over states
  lastUpdated: Date;
}

export interface InferenceResult {
  nodeId: string;
  posterior: Map<string, number>;
  confidence: number;
  method: 'exact' | 'sampling' | 'variational';
  samples?: number;
  converged?: boolean;
}

export interface ConflictResolution {
  method: string;
  resolvedEvidence?: Evidence;
  confidence: number;
  explanation: string;
  supportingEvidence?: Evidence[];
  compromise?: any;
  votingResults?: any;
  hierarchy?: any;
}

export interface AggregatedEvidence {
  beliefStates: Map<string, BeliefState>;
  confidence: number;
  uncertainty?: Map<string, number>;
  conflicts?: Map<string, Evidence[]>;
  method: string;
  timestamp?: Date;
  processingTime?: number;
  sourceCount?: number;
  hierarchy?: any;
}

export interface BeliefUpdate {
  topic: string;
  previousBelief: BeliefState;
  newBelief: BeliefState;
  evidence: Evidence;
  updateMethod: string;
  confidence: number;
  impact: number;
  processingTime: number;
}
