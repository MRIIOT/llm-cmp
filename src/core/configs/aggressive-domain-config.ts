/**
 * Aggressive Domain Configuration
 * Maximally reduces in-domain anomaly scores through multiple mechanisms
 */

import { AgentConfig } from '../agent.js';

export const aggressiveDomainConfig: AgentConfig = {
  id: 'agent_aggressive_domain',
  name: 'Aggressive Domain-Coherent Agent',
  description: 'Maximally optimized for low in-domain anomaly',
  initialCapabilities: [
    {
      id: 'domain_specialist',
      name: 'Domain Specialist',
      description: 'Extreme domain pattern recognition',
      strength: 0.98,
      adaptationRate: 0.35,
      specializations: [
        'domain_recognition',
        'pattern_matching', 
        'semantic_similarity',
        'concept_clustering',
        'contextual_understanding',
        'domain_memory'
      ],
      morphology: {
        structure: { 
          type: 'hierarchical_network',
          layers: 8,
          crossConnections: true,
          domainSpecialization: true,
          patternReuse: true
        },
        connections: new Map([
          ['pattern_recognition', 0.99],
          ['semantic_analysis', 0.98],
          ['temporal_learning', 0.95],
          ['domain_memory', 0.97],
          ['concept_linking', 0.96]
        ]),
        emergentProperties: [
          'domain_coherence',
          'concept_clustering',
          'semantic_generalization',
          'pattern_reuse',
          'domain_stickiness'
        ],
        adaptationHistory: []
      },
      lastUsed: new Date(),
      performanceHistory: []
    }
  ],
  config: {
    agents: { 
      adaptationRate: 0.35,      // Very fast adaptation
      minAgents: 10,             // Many agents
      maxAgents: 30,             
      baseCapabilities: [
        'reasoning', 
        'analysis', 
        'pattern_recognition',
        'domain_mapping',
        'semantic_clustering'
      ],
      evolutionEnabled: true
    },
    htm: { 
      columnCount: 8192,         // Very large HTM
      cellsPerColumn: 48,        // Many cells
      learningRadius: 6144,      // 75% of columns
      learningRate: 0.35,        // Very fast learning
      maxSequenceLength: 1000    // Very long memory
    },
    bayesian: { 
      uncertaintyThreshold: 0.1,   // Very low uncertainty threshold
      priorStrength: 0.5,          // Very strong priors
      updatePolicy: 'adaptive',
      conflictResolution: 'weighted_consensus'
    },
    semantic: {
      enableHierarchicalEncoding: true,
      enablePhase2Enhancements: true,
      enableConceptNormalization: true,
      enableRelationshipTracking: true,
      
      // Extreme domain coherence settings
      domainCoherenceMode: true,
      conceptOverlapThreshold: 0.50,      // 50% overlap = same domain
      domainStickiness: 0.95,             // Extreme domain retention
      semanticGeneralization: 0.90,       // Very high generalization
      crossDomainPenalty: 5.0,            // Huge penalty for domain switches
      
      // Maximize overlap
      numColumns: 8192,                   // Match HTM columns
      sparsity: 0.08,                     // 8% active = more overlap
      columnsPerConcept: 50,              // Many columns per concept
      columnOverlapRatio: 0.5,            // 50% overlap between related
      activationThreshold: 0.4,           // Very low threshold
      semanticDecayRate: 0.01,            // Extremely slow decay
      
      // Pattern reuse
      domainSpecificFeatures: true,
      featureReuse: 0.95,                 // Extreme feature reuse
      conceptSimilarityBoost: 3.0         // Triple similarity boost
    },
    anomaly: {
      domainAwareScoring: true,
      
      // Extreme thresholds
      inDomainThreshold: 0.40,           // Below 40% = definitely in-domain
      crossDomainThreshold: 0.50,        // Above 50% = different domain
      
      // Very strong smoothing
      smoothingFactor: 0.95,             // Extreme smoothing
      domainTransitionPenalty: 0.05,     // Minimal transition penalty
      
      // Aggressive pattern matching
      minPatternOverlap: 0.05,           // Only 5% overlap needed
      patternSimilarityBoost: 0.90,      // 90% reduction for similar patterns
      
      // Long temporal memory
      temporalWindow: 50,                // Look at last 50 patterns
      temporalWeight: 0.50,              // 50% weight on temporal coherence
      
      // Huge domain memory
      domainMemorySize: 500,             // Remember 500 patterns
      domainDecayRate: 0.995             // Extremely slow decay (0.5% per hour)
    }
  }
};

/**
 * Ultra-Aggressive Config (for testing limits)
 */
export const ultraAggressiveDomainConfig: AgentConfig = {
  ...aggressiveDomainConfig,
  id: 'agent_ultra_aggressive',
  name: 'Ultra-Aggressive Domain Agent',
  config: {
    ...aggressiveDomainConfig.config,
    semantic: {
      ...aggressiveDomainConfig.config.semantic!,
      sparsity: 0.15,                    // 15% active - massive overlap
      columnsPerConcept: 100,            // 100 columns per concept
      columnOverlapRatio: 0.75,          // 75% overlap
      conceptSimilarityBoost: 5.0        // 5x similarity boost
    },
    anomaly: {
      ...aggressiveDomainConfig.config.anomaly!,
      inDomainThreshold: 0.60,          // Below 60% = in-domain
      patternSimilarityBoost: 0.95,     // 95% reduction
      temporalWeight: 0.70,             // 70% temporal weight
      minPatternOverlap: 0.01           // 1% overlap is enough
    }
  }
};
