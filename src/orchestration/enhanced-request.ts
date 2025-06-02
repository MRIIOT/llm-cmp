// ===============================================
// ENHANCED ORCHESTRATION REQUEST
// Supports external context from MCP servers
// ===============================================

import { LLM_AGENT_TYPES, LLMAgentType } from '../types/index.js';

export interface ExternalContext {
  source: 'mcp-mtconnect' | 'mcp-filesystem' | 'mcp-database' | 'mcp-api' | string;
  data: any;
  metadata: {
    timestamp: string;
    server_info: {
      name: string;
      version?: string;
      capabilities?: string[];
    };
    data_quality: {
      completeness: number; // 0-1 score
      freshness: string;    // how recent the data is
      reliability: number;  // 0-1 score
    };
    query_context: {
      tool_used: string;
      parameters: Record<string, any>;
      response_time_ms: number;
    };
  };
}

export interface EnhancedOrchestrationRequest {
  query: string;
  agents: LLMAgentType[];
  externalContext?: ExternalContext;
  options?: {
    consensusThreshold?: number;
    parallelExecution?: boolean;
    timeoutMs?: number;
    includeExternalDataInPrompts?: boolean;
    externalDataWeight?: number; // How much to weight external vs internal knowledge
  };
}

export interface EnhancedOrchestrationResult {
  // Standard orchestration results
  consensus: {
    converged: boolean;
    consensus_confidence: number;
    participating_agents: number;
    reasoning_diversity: number;
  };
  agentResponses: Map<string, any>;
  evidence: Map<string, any>;
  verification: {
    safety: boolean;
    liveness: boolean;
    consistency: boolean;
    completeness: boolean;
  };
  metadata: {
    totalAgents: number;
    processingTimeMs: number;
    totalTokens: number;
  };
  
  // Enhanced with external context
  externalDataIntegration?: {
    data_sources: string[];
    data_quality_score: number;
    external_evidence_count: number;
    internal_external_consistency: number; // How well external data aligns with agent knowledge
    confidence_boost: number; // How much external data improved confidence
  };
}

// MTConnect-specific context helpers
export class MTConnectContextBuilder {
  static buildDeviceAnalysisContext(
    devices: any[],
    currentStates: any[],
    observations: any[]
  ): ExternalContext {
    return {
      source: 'mcp-mtconnect',
      data: {
        devices,
        current_states: currentStates,
        observations,
        summary: {
          total_devices: devices.length,
          active_devices: currentStates.filter(state => state.status === 'active').length,
          total_observations: observations.reduce((sum, obs) => sum + (obs.data?.length || 0), 0)
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        server_info: {
          name: 'MTConnect MCP Server',
          capabilities: ['device_monitoring', 'real_time_data', 'quality_alerting']
        },
        data_quality: {
          completeness: MTConnectContextBuilder.calculateCompleteness(devices, currentStates),
          freshness: MTConnectContextBuilder.calculateFreshness(observations),
          reliability: MTConnectContextBuilder.calculateReliability(devices, currentStates)
        },
        query_context: {
          tool_used: 'multiple_mtconnect_tools',
          parameters: { devices: devices.map(d => d.id) },
          response_time_ms: 0 // Will be filled by actual timing
        }
      }
    };
  }

  private static calculateCompleteness(devices: any[], currentStates: any[]): number {
    if (devices.length === 0) return 0;
    const devicesWithState = currentStates.length;
    return Math.min(devicesWithState / devices.length, 1.0);
  }

  private static calculateFreshness(observations: any[]): string {
    if (observations.length === 0) return 'no_data';
    
    // Find most recent observation
    let mostRecent = 0;
    observations.forEach(obs => {
      if (obs.data && Array.isArray(obs.data)) {
        obs.data.forEach((item: any) => {
          if (item.timestamp) {
            const timestamp = new Date(item.timestamp).getTime();
            if (timestamp > mostRecent) {
              mostRecent = timestamp;
            }
          }
        });
      }
    });

    if (mostRecent === 0) return 'unknown';
    
    const ageMs = Date.now() - mostRecent;
    const ageMinutes = ageMs / (1000 * 60);
    
    if (ageMinutes < 1) return 'real_time';
    if (ageMinutes < 5) return 'very_fresh';
    if (ageMinutes < 30) return 'fresh';
    if (ageMinutes < 60) return 'recent';
    return 'stale';
  }

  private static calculateReliability(devices: any[], currentStates: any[]): number {
    if (devices.length === 0) return 0;
    
    // Calculate based on data quality indicators
    let totalQuality = 0;
    let qualityCount = 0;
    
    currentStates.forEach(state => {
      // Look for quality indicators in the state data
      if (state.data_quality) {
        totalQuality += parseFloat(state.data_quality);
        qualityCount++;
      } else if (state.status === 'active') {
        // If no explicit quality metric, assume good quality for active devices
        totalQuality += 0.9;
        qualityCount++;
      } else if (state.status === 'inactive') {
        totalQuality += 0.1;
        qualityCount++;
      }
    });
    
    return qualityCount > 0 ? totalQuality / qualityCount : 0.5;
  }
}

// Manufacturing-specific agent configuration for MTConnect data
export const MANUFACTURING_AGENT_CONFIG = {
  agents: [
    LLM_AGENT_TYPES.FACTUAL,    // Analyze device specifications and historical data
    LLM_AGENT_TYPES.REASONING,  // Logical analysis of equipment performance
    LLM_AGENT_TYPES.CRITIC,     // Risk assessment and quality evaluation
    LLM_AGENT_TYPES.COORDINATOR // Synthesis of manufacturing insights
  ],
  options: {
    consensusThreshold: 0.7,
    includeExternalDataInPrompts: true,
    externalDataWeight: 0.8, // High weight for real-time manufacturing data
    timeoutMs: 30000
  }
};
