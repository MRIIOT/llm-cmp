// ===============================================
// LLM ORCHESTRATOR - MAIN COORDINATION ENGINE
// ===============================================

import { 
  LLMAgentType, 
  CMPMessage, 
  EvidenceItem, 
  ConsensusResult, 
  VerificationProperties,
  LLM_AGENT_TYPES,
  APIConfig
} from '../types/index.js';
import { LLMAgent } from '../core/llm-agent.js';
import { LLMInterface } from '../models/llm-interface.js';
import { createModelInterface } from '../models/index.js';
import { ConfigLoader } from '../config/config-loader.js';
import { SemanticPose } from '../core/semantic-pose.js';

export interface OrchestrationRequest {
  query: string;
  agents: LLMAgentType[];
  context?: any;
  options?: {
    consensusThreshold?: number;
    maxRetries?: number;
    timeoutMs?: number;
    parallelExecution?: boolean;
  };
}

export interface OrchestrationResult {
  consensus: ConsensusResult;
  evidence: Map<string, EvidenceItem>;
  agentResponses: Map<LLMAgentType, CMPMessage>;
  verification: VerificationProperties;
  metadata: {
    totalAgents: number;
    processingTimeMs: number;
    totalTokens: number;
    convergenceSteps: number;
  };
}

export interface AgentExecution {
  agent: LLMAgent;
  interface: LLMInterface;
  response?: CMPMessage;
  error?: Error;
  executionTimeMs?: number;
  tokenUsage?: number;
}

export class LLMOrchestrator {
  private config: APIConfig;
  private agents: Map<LLMAgentType, LLMAgent>;
  private interfaces: Map<LLMAgentType, LLMInterface>;
  private globalEvidence: Map<string, EvidenceItem>;
  private processingHistory: CMPMessage[];

  constructor() {
    this.config = ConfigLoader.getInstance().getConfig();
    this.agents = new Map();
    this.interfaces = new Map();
    this.globalEvidence = new Map();
    this.processingHistory = [];
  }

  // Initialize orchestrator with agent pool
  async initialize(agentTypes: LLMAgentType[]): Promise<void> {
    console.log('\n🚀 Initializing LLM Orchestrator...');
    
    for (const agentType of agentTypes) {
      try {
        // Create agent instance
        const agent = new LLMAgent(
          agentType,
          agentType, // Use type as specialization
          this.getModelForAgent(agentType)
        );
        
        // Create LLM interface for agent
        const llmInterface = createModelInterface(agent);
        
        // Test connection
        const connected = await llmInterface.testConnection();
        if (!connected) {
          console.warn(`⚠️  Connection test failed for ${agentType}`);
        }
        
        this.agents.set(agentType, agent);
        this.interfaces.set(agentType, llmInterface);
        
        console.log(`   ✅ ${agentType} initialized and connected`);
        
      } catch (error) {
        console.error(`❌ Failed to initialize ${agentType}:`, error);
        throw new Error(`Agent initialization failed: ${agentType}`);
      }
    }
    
    console.log(`   🎯 Orchestrator ready with ${agentTypes.length} agents`);
  }

  // Main orchestration method - coordinate multiple agents on a query
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    console.log(`\n🎼 Orchestrating query with ${request.agents.length} agents...`);
    console.log(`   Query: "${request.query}"`);
    
    try {
      // 1. Phase 1: Parallel agent execution
      const executions = await this.executeAgentsInParallel(request);
      
      // 2. Phase 2: Evidence aggregation
      const aggregatedEvidence = this.aggregateEvidence(executions);
      
      // 3. Phase 3: Consensus building
      const consensus = await this.buildConsensus(executions, request.options?.consensusThreshold || 0.7);
      
      // 4. Phase 4: Formal verification
      const verification = this.performFormalVerification(executions, aggregatedEvidence, consensus);
      
      // 5. Extract results
      const agentResponses = new Map<LLMAgentType, CMPMessage>();
      let totalTokens = 0;
      
      executions.forEach(execution => {
        if (execution.response) {
          agentResponses.set(execution.agent.type, execution.response);
        }
        totalTokens += execution.tokenUsage || 0;
      });
      
      const result: OrchestrationResult = {
        consensus,
        evidence: aggregatedEvidence,
        agentResponses,
        verification,
        metadata: {
          totalAgents: request.agents.length,
          processingTimeMs: Date.now() - startTime,
          totalTokens,
          convergenceSteps: 1 // For now, single iteration
        }
      };
      
      console.log(`   ✅ Orchestration complete in ${result.metadata.processingTimeMs}ms`);
      console.log(`   📊 Consensus confidence: ${consensus.consensus_confidence.toFixed(3)}`);
      console.log(`   🔍 Verification: ${this.formatVerification(verification)}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      throw error;
    }
  }

  // Execute multiple agents in parallel with coordinated messaging
  private async executeAgentsInParallel(request: OrchestrationRequest): Promise<AgentExecution[]> {
    console.log(`\n⚡ Executing ${request.agents.length} agents in parallel...`);
    
    const executions: AgentExecution[] = [];
    const promises: Promise<void>[] = [];
    
    // Create execution context for each agent
    for (const agentType of request.agents) {
      const agent = this.agents.get(agentType);
      const interface_ = this.interfaces.get(agentType);
      
      if (!agent || !interface_) {
        throw new Error(`Agent not initialized: ${agentType}`);
      }
      
      const execution: AgentExecution = { agent, interface: interface_ };
      executions.push(execution);
      
      // Create parallel execution promise
      const promise = this.executeAgent(execution, request);
      promises.push(promise);
    }
    
    // Wait for all agents to complete (with timeout)
    const timeoutMs = request.options?.timeoutMs || this.config.orchestration.timeoutMs;
    
    try {
      await Promise.race([
        Promise.all(promises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Orchestration timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      console.warn(`⚠️  Some agents may have timed out: ${error}`);
    }
    
    // Report execution results
    const successful = executions.filter(e => e.response && !e.error).length;
    const failed = executions.filter(e => e.error).length;
    
    console.log(`   ✅ ${successful} agents completed successfully`);
    if (failed > 0) {
      console.log(`   ❌ ${failed} agents failed or timed out`);
    }
    
    return executions;
  }

  // Execute a single agent
  private async executeAgent(execution: AgentExecution, request: OrchestrationRequest): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create CMP message for agent processing
      const cmpMessage: CMPMessage = {
        header: {
          sender: execution.agent.type,
          timestamp: Date.now(),
          reasoning_depth: 0,
          specialization: execution.agent.specialization,
          model_version: execution.agent.model
        },
        type: 'QUERY_PROCESSING',
        reasoning: [],
        semantic_pose: new SemanticPose([0, 0, 0], 0.5, 'query').toData(),
        confidence: 0.5,
        reasoning_trace: []
      };
      
      // Process through LLM interface
      const response = await execution.interface.processCMPMessage(cmpMessage, {
        query: request.query,
        context: request.context,
        evidence: Array.from(this.globalEvidence.values()),
        orchestration: true
      });
      
      // Convert parsed response to CMP format
      const cmpResponse: CMPMessage = {
        header: {
          sender: execution.agent.type,
          timestamp: Date.now(),
          reasoning_depth: response.reasoning.length,
          specialization: execution.agent.specialization,
          model_version: execution.agent.model
        },
        type: 'QUERY_RESPONSE',
        reasoning: response.reasoning,
        semantic_pose: response.semantic_pose,
        confidence: response.confidence,
        reasoning_trace: response.reasoning
      };
      
      execution.response = cmpResponse;
      execution.executionTimeMs = Date.now() - startTime;
      execution.tokenUsage = response.token_usage?.total_tokens || 0;
      
      // Update agent's internal state
      execution.agent.processIncomingMessage(cmpResponse);
      
    } catch (error) {
      execution.error = error as Error;
      execution.executionTimeMs = Date.now() - startTime;
      console.error(`❌ Agent execution failed (${execution.agent.type}):`, error);
    }
  }

  // Aggregate evidence from all agent executions
  private aggregateEvidence(executions: AgentExecution[]): Map<string, EvidenceItem> {
    console.log('\n🔍 Aggregating evidence from agent responses...');
    
    const aggregatedEvidence = new Map(this.globalEvidence);
    let evidenceCount = 0;
    
    executions.forEach(execution => {
      if (execution.response && execution.agent) {
        // Process agent's response through evidence system
        const agentEvidence = execution.agent.processReasoning(execution.response, aggregatedEvidence);
        
        // Merge into global evidence
        agentEvidence.forEach((evidence, id) => {
          aggregatedEvidence.set(id, evidence);
          evidenceCount++;
        });
      }
    });
    
    console.log(`   ✅ Aggregated ${evidenceCount} evidence items`);
    console.log(`   📊 Total evidence pool: ${aggregatedEvidence.size} items`);
    
    // Update global evidence for future orchestrations
    this.globalEvidence = aggregatedEvidence;
    
    return aggregatedEvidence;
  }

  // Build consensus from agent responses
  private async buildConsensus(executions: AgentExecution[], threshold: number): Promise<ConsensusResult> {
    console.log('\n🤝 Building consensus from agent responses...');
    
    const successfulExecutions = executions.filter(e => e.response && !e.error);
    
    if (successfulExecutions.length === 0) {
      return {
        consensus_confidence: 0,
        participating_agents: 0,
        reasoning_diversity: 0,
        converged: false
      };
    }
    
    // Collect all reasoning steps
    const allReasoning = successfulExecutions.flatMap(e => e.response?.reasoning || []);
    
    // Calculate consensus metrics
    const avgConfidence = allReasoning.length > 0 ? 
      allReasoning.reduce((sum, step) => sum + step.confidence, 0) / allReasoning.length : 0;
    
    // Calculate reasoning diversity (unique reasoning types)
    const uniqueTypes = new Set(allReasoning.map(step => step.type));
    const reasoningDiversity = allReasoning.length > 0 ? uniqueTypes.size / allReasoning.length : 0;
    
    // Determine convergence
    const converged = avgConfidence >= threshold && successfulExecutions.length >= 2;
    
    const consensus: ConsensusResult = {
      consensus_confidence: avgConfidence,
      participating_agents: successfulExecutions.length,
      reasoning_diversity: reasoningDiversity,
      converged
    };
    
    console.log(`   📊 Consensus confidence: ${consensus.consensus_confidence.toFixed(3)}`);
    console.log(`   👥 Participating agents: ${consensus.participating_agents}`);
    console.log(`   🌈 Reasoning diversity: ${consensus.reasoning_diversity.toFixed(3)}`);
    console.log(`   ${consensus.converged ? '✅' : '❌'} Consensus ${consensus.converged ? 'achieved' : 'not achieved'}`);
    
    return consensus;
  }

  // Perform formal verification checks
  private performFormalVerification(
    executions: AgentExecution[], 
    evidence: Map<string, EvidenceItem>, 
    consensus: ConsensusResult
  ): VerificationProperties {
    console.log('\n🔬 Performing formal verification...');
    
    // Safety: All confidence values are valid [0,1]
    const safety = this.verifySafety(executions, evidence);
    
    // Liveness: System makes progress (agents produce responses)
    const liveness = this.verifyLiveness(executions);
    
    // Consistency: Reasoning is coherent across agents
    const consistency = this.verifyConsistency(executions, evidence);
    
    // Completeness: Consensus reached or timeout respected
    const completeness = this.verifyCompleteness(consensus, executions);
    
    const verification: VerificationProperties = {
      safety,
      liveness,
      consistency,
      completeness
    };
    
    const passedChecks = Object.values(verification).filter(Boolean).length;
    console.log(`   🔍 Verification: ${passedChecks}/4 checks passed`);
    
    return verification;
  }

  // Verify safety properties
  private verifySafety(executions: AgentExecution[], evidence: Map<string, EvidenceItem>): boolean {
    // Check all confidence values are in valid range [0,1]
    for (const execution of executions) {
      if (execution.response) {
        const allSteps = execution.response.reasoning;
        for (const step of allSteps) {
          if (step.confidence < 0 || step.confidence > 1) {
            console.log(`   ❌ Safety: Invalid confidence ${step.confidence} in ${execution.agent.type}`);
            return false;
          }
        }
        
        if (execution.response.confidence < 0 || execution.response.confidence > 1) {
          console.log(`   ❌ Safety: Invalid message confidence ${execution.response.confidence}`);
          return false;
        }
      }
    }
    
    // Check evidence confidence values
    for (const evidenceItem of evidence.values()) {
      if (evidenceItem.confidence < 0 || evidenceItem.confidence > 1) {
        console.log(`   ❌ Safety: Invalid evidence confidence ${evidenceItem.confidence}`);
        return false;
      }
    }
    
    console.log('   ✅ Safety: All confidence values valid');
    return true;
  }

  // Verify liveness properties
  private verifyLiveness(executions: AgentExecution[]): boolean {
    const successfulResponses = executions.filter(e => e.response && !e.error).length;
    const progressMade = successfulResponses > 0;
    
    if (!progressMade) {
      console.log('   ❌ Liveness: No agents produced successful responses');
      return false;
    }
    
    console.log(`   ✅ Liveness: ${successfulResponses} agents made progress`);
    return true;
  }

  // Verify consistency properties
  private verifyConsistency(executions: AgentExecution[], evidence: Map<string, EvidenceItem>): boolean {
    const responses = executions.filter(e => e.response).map(e => e.response!);
    
    if (responses.length < 2) {
      console.log('   ⚠️  Consistency: Not enough responses to verify');
      return true; // Trivially consistent
    }
    
    // Check for major contradictions in reasoning
    const allConcepts = responses.flatMap(r => r.reasoning.map(step => step.concept));
    const conceptCounts = new Map<string, number>();
    
    allConcepts.forEach(concept => {
      conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
    });
    
    // If concepts are mentioned by multiple agents, they should be consistent
    let consistencyViolations = 0;
    const commonConcepts = Array.from(conceptCounts.entries()).filter(([_, count]) => count > 1);
    
    for (const [concept, _] of commonConcepts) {
      const confidences = responses.flatMap(r => 
        r.reasoning.filter(step => step.concept === concept).map(step => step.confidence)
      );
      
      if (confidences.length > 1) {
        const variance = this.calculateVariance(confidences);
        if (variance > 0.25) { // High variance indicates inconsistency
          consistencyViolations++;
        }
      }
    }
    
    const consistent = consistencyViolations === 0;
    
    if (consistent) {
      console.log('   ✅ Consistency: No major reasoning contradictions detected');
    } else {
      console.log(`   ❌ Consistency: ${consistencyViolations} potential contradictions found`);
    }
    
    return consistent;
  }

  // Verify completeness properties
  private verifyCompleteness(consensus: ConsensusResult, executions: AgentExecution[]): boolean {
    // Completeness means all agents either responded successfully or failed with an error
    // (i.e., no agents are still pending/hanging)
    const allAgentsResponded = executions.every(e => e.response || e.error);
    
    // Completeness is achieved if all agents finished execution
    // (regardless of whether consensus was reached - that's a separate concern)
    const complete = allAgentsResponded;
    
    if (complete) {
      console.log('   ✅ Completeness: All agents responded, consensus evaluated');
    } else {
      console.log('   ❌ Completeness: Some agents did not complete execution');
    }
    
    return complete;
  }

  // Helper method to calculate variance
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  // Get model name for agent type
  private getModelForAgent(agentType: LLMAgentType): string {
    const agentTypeMap: Record<string, string> = {
      'reasoning_specialist': 'reasoning',
      'creative_specialist': 'creative', 
      'factual_specialist': 'factual',
      'code_specialist': 'code',
      'social_specialist': 'social',
      'critical_specialist': 'critic',
      'meta_coordinator': 'coordinator'
    };
    
    const configKey = agentTypeMap[agentType] || 'reasoning';
    const modelConfig = this.config.models[configKey];
    
    return modelConfig?.model || 'gpt-3.5-turbo';
  }

  // Format verification results for display
  private formatVerification(verification: VerificationProperties): string {
    const checks = Object.entries(verification)
      .map(([prop, passed]) => `${prop}:${passed ? '✅' : '❌'}`)
      .join(' ');
    
    return checks;
  }

  // Get orchestrator status
  getStatus(): {
    agentCount: number;
    evidenceItems: number;
    processingHistory: number;
    isReady: boolean;
  } {
    return {
      agentCount: this.agents.size,
      evidenceItems: this.globalEvidence.size,
      processingHistory: this.processingHistory.length,
      isReady: this.agents.size > 0
    };
  }

  // Reset orchestrator state
  reset(): void {
    this.globalEvidence.clear();
    this.processingHistory = [];
    
    this.agents.forEach(agent => agent.reset());
    
    console.log('🔄 Orchestrator state reset');
  }

  // Clean up resources
  dispose(): void {
    this.interfaces.forEach(interface_ => interface_.clearCache());
    this.reset();
    
    console.log('🧹 Orchestrator disposed');
  }
}
