/**
 * Memory-Efficient Domain Configuration
 * Optimized for low memory usage while maintaining domain coherence
 */

import { AgentConfig } from '../agent.js';

export const memoryEfficientDomainConfig: AgentConfig = {
  id: 'agent_memory_efficient',
  name: 'Memory-Efficient Domain Agent',
  description: 'Low memory usage with good domain coherence',
  initialCapabilities: [
    {
      id: 'efficient_domain_analysis',
      name: 'Efficient Domain Analysis',
      description: 'Domain recognition with minimal memory footprint',
      strength: 0.88,
      adaptationRate: 0.20,
      specializations: [
        'domain_recognition',
        'pattern_matching', 
        'semantic_similarity'
      ],
      morphology: {
        structure: { 
          type: 'hierarchical_network',
          layers: 3,  // Fewer layers
          crossConnections: true
        },
        connections: new Map([
          ['pattern_recognition', 0.92],
          ['semantic_analysis', 0.88],
          ['temporal_learning', 0.85]
        ]),
        emergentProperties: [
          'domain_coherence',
          'concept_clustering'
        ],
        adaptationHistory: []
      },
      lastUsed: new Date(),
      performanceHistory: []
    }
  ],
  config: {
    agents: { 
      adaptationRate: 0.20,
      minAgents: 3,           // Fewer agents
      maxAgents: 8,           // Lower max
      baseCapabilities: [
        'reasoning', 
        'analysis', 
        'pattern_recognition'
      ],
      evolutionEnabled: true
    },
    htm: { 
      columnCount: 2048,      // Smaller HTM (was 8192)
      cellsPerColumn: 16,     // Fewer cells (was 48)
      learningRadius: 1024,   // Smaller radius
      learningRate: 0.25,     // Still fast learning
      maxSequenceLength: 100  // Shorter memory
    },
    bayesian: { 
      uncertaintyThreshold: 0.15,
      priorStrength: 0.35,
      updatePolicy: 'adaptive',
      conflictResolution: 'weighted_consensus'
    },
    semantic: {
      enableHierarchicalEncoding: true,
      enablePhase2Enhancements: true,
      enableConceptNormalization: true,
      enableRelationshipTracking: true,
      
      // Memory-efficient but still effective
      numColumns: 2048,                   // Match HTM
      sparsity: 0.05,                     // 5% active (balanced)
      columnsPerConcept: 20,              // Fewer columns per concept
      columnOverlapRatio: 0.4,            // Good overlap
      
      // Domain coherence - still strong
      domainCoherenceMode: true,
      conceptOverlapThreshold: 0.35,      
      domainStickiness: 0.85,             
      semanticGeneralization: 0.75,       
      crossDomainPenalty: 3.0,            
      activationThreshold: 0.5,           
      semanticDecayRate: 0.02,            
      domainSpecificFeatures: true,
      featureReuse: 0.85,                 
      conceptSimilarityBoost: 2.0         
    },
    anomaly: {
      domainAwareScoring: true,
      
      // Aggressive anomaly reduction
      inDomainThreshold: 0.35,           
      crossDomainThreshold: 0.55,        
      smoothingFactor: 0.90,             // Still high smoothing
      domainTransitionPenalty: 0.10,     
      
      // Strong pattern matching
      minPatternOverlap: 0.10,           
      patternSimilarityBoost: 0.80,      // 80% reduction
      
      // Moderate memory usage
      temporalWindow: 20,                // Reasonable window
      temporalWeight: 0.45,              
      domainMemorySize: 100,             // Much smaller (was 500)
      domainDecayRate: 0.98              
    }
  }
};

/**
 * Balanced Domain Config
 * Good balance between memory and performance
 */
export const balancedDomainConfig: AgentConfig = {
  ...memoryEfficientDomainConfig,
  id: 'agent_balanced_domain',
  name: 'Balanced Domain Agent',
  config: {
    ...memoryEfficientDomainConfig.config,
    htm: { 
      columnCount: 3072,      // Moderate size
      cellsPerColumn: 20,     
      learningRadius: 1536,   
      learningRate: 0.22,     
      maxSequenceLength: 150  
    },
    semantic: {
      ...memoryEfficientDomainConfig.config.semantic!,
      numColumns: 3072,
      sparsity: 0.06,                     
      columnsPerConcept: 30,              
      columnOverlapRatio: 0.45,
      conceptSimilarityBoost: 2.5
    },
    anomaly: {
      ...memoryEfficientDomainConfig.config.anomaly!,
      patternSimilarityBoost: 0.85,
      temporalWindow: 30,
      domainMemorySize: 150
    }
  }
};

/**
 * Minimal Memory Config
 * For very constrained environments
 */
export const minimalMemoryConfig: AgentConfig = {
  ...memoryEfficientDomainConfig,
  id: 'agent_minimal_memory',
  name: 'Minimal Memory Agent',
  config: {
    ...memoryEfficientDomainConfig.config,
    agents: {
      adaptationRate: 0.20,
      minAgents: 2,
      maxAgents: 5,
      baseCapabilities: [
        'reasoning', 
        'analysis', 
        'pattern_recognition'
      ],
      evolutionEnabled: true
    },
    htm: { 
      columnCount: 1024,      // Very small
      cellsPerColumn: 12,     
      learningRadius: 512,   
      learningRate: 0.3,      // Compensate with faster learning
      maxSequenceLength: 50   
    },
    semantic: {
      ...memoryEfficientDomainConfig.config.semantic!,
      numColumns: 1024,
      sparsity: 0.08,         // Higher sparsity in smaller space
      columnsPerConcept: 15,              
      columnOverlapRatio: 0.5 // Higher overlap to compensate
    },
    anomaly: {
      ...memoryEfficientDomainConfig.config.anomaly!,
      temporalWindow: 10,
      domainMemorySize: 50
    }
  }
};
