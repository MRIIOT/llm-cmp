/**
 * Topic-Sensitive Configuration
 * Optimized for detecting topic changes and domain shifts
 */

import { AgentConfig } from '../agent.js';

export const topicSensitiveConfig: AgentConfig = {
  id: 'agent_topic_sensitive',
  name: 'Topic-Sensitive Agent',
  description: 'Optimized for detecting topic changes and domain shifts',
  initialCapabilities: [
    {
      id: 'topic_detector',
      name: 'Topic Change Detector',
      description: 'Sensitive to semantic domain shifts',
      strength: 0.95,
      adaptationRate: 0.15, // Slower adaptation to preserve boundaries
      specializations: [
        'domain_boundary_detection',
        'semantic_discontinuity',
        'topic_classification',
        'context_switching',
        'anomaly_amplification'
      ],
      morphology: {
        structure: { 
          type: 'boundary_sensitive_network',
          layers: 6,
          crossConnections: false, // Less cross-connection to preserve boundaries
          domainSpecialization: true,
          patternReuse: false // Don't reuse patterns across domains
        },
        connections: new Map([
          ['pattern_recognition', 0.7],
          ['semantic_analysis', 0.9],
          ['temporal_learning', 0.6],
          ['domain_memory', 0.5],
          ['concept_linking', 0.4] // Weak linking to preserve boundaries
        ]),
        emergentProperties: [
          'topic_boundary_detection',
          'semantic_discontinuity_amplification',
          'domain_isolation',
          'context_switching_penalty'
        ],
        adaptationHistory: []
      },
      lastUsed: new Date(),
      performanceHistory: []
    }
  ],
  config: {
    agents: { 
      adaptationRate: 0.15,      // Slow adaptation
      minAgents: 5,              // Fewer agents for clearer boundaries
      maxAgents: 10,             
      baseCapabilities: [
        'reasoning', 
        'analysis', 
        'boundary_detection',
        'topic_classification'
      ],
      evolutionEnabled: true
    },
    htm: { 
      columnCount: 2048,         // Standard HTM size
      cellsPerColumn: 32,        // Standard cells
      learningRadius: 512,       // 25% of columns - tighter learning
      learningRate: 0.1,         // Slow learning to preserve patterns
      maxSequenceLength: 50      // Shorter memory for clearer boundaries
    },
    bayesian: { 
      uncertaintyThreshold: 0.4,   // Higher uncertainty threshold
      priorStrength: 0.1,          // Weak priors for flexibility
      updatePolicy: 'conservative',
      conflictResolution: 'hierarchical'
    },
    semantic: {
      enableHierarchicalEncoding: true,
      enablePhase2Enhancements: true,
      enableConceptNormalization: true,
      enableRelationshipTracking: true,
      
      // Topic-sensitive settings
      domainCoherenceMode: false,         // Don't force coherence
      conceptOverlapThreshold: 0.80,      // 80% overlap needed for same domain
      domainStickiness: 0.20,             // Low stickiness - easy to switch
      semanticGeneralization: 0.30,       // Low generalization
      crossDomainPenalty: 0.8,            // High penalty for domain switches
      
      // Minimal overlap for clear boundaries
      numColumns: 2048,                   // Match HTM columns
      sparsity: 0.02,                     // 2% active = less overlap
      columnsPerConcept: 10,              // Few columns per concept
      columnOverlapRatio: 0.1,            // 10% overlap between related
      activationThreshold: 0.7,           // High threshold
      semanticDecayRate: 0.1,             // Fast decay
      
      // Disable pattern reuse
      domainSpecificFeatures: true,
      featureReuse: 0.1,                  // Minimal feature reuse
      conceptSimilarityBoost: 0.5         // Small similarity boost
    },
    anomaly: {
      domainAwareScoring: true,
      
      // Sensitive thresholds
      inDomainThreshold: 0.15,           // Below 15% = definitely in-domain
      crossDomainThreshold: 0.35,        // Above 35% = different domain
      
      // Minimal smoothing for spike preservation
      smoothingFactor: 0.3,              // Light smoothing
      domainTransitionPenalty: 0.6,      // High transition penalty
      
      // Strict pattern matching
      minPatternOverlap: 0.40,           // 40% overlap needed
      patternSimilarityBoost: 0.2,       // Small reduction for similar patterns
      
      // Short temporal memory
      temporalWindow: 5,                 // Look at last 5 patterns only
      temporalWeight: 0.1,               // Low weight on temporal coherence
      
      // Small domain memory
      domainMemorySize: 20,              // Remember only 20 patterns
      domainDecayRate: 0.90              // Fast decay (10% per hour)
    }
  }
};

/**
 * Ultra-Sensitive Config (for maximum topic change detection)
 */
export const ultraSensitiveTopicConfig: AgentConfig = {
  ...topicSensitiveConfig,
  id: 'agent_ultra_sensitive',
  name: 'Ultra-Sensitive Topic Agent',
  config: {
    ...topicSensitiveConfig.config,
    semantic: {
      ...topicSensitiveConfig.config.semantic!,
      sparsity: 0.01,                    // 1% active - minimal overlap
      columnsPerConcept: 5,              // Very few columns
      columnOverlapRatio: 0.05,          // 5% overlap
      conceptSimilarityBoost: 0.1        // Tiny similarity boost
    },
    anomaly: {
      ...topicSensitiveConfig.config.anomaly!,
      inDomainThreshold: 0.10,          // Below 10% = in-domain
      crossDomainThreshold: 0.25,       // Above 25% = different domain
      patternSimilarityBoost: 0.1,      // 10% max reduction
      temporalWeight: 0.05,             // Almost no temporal weight
      minPatternOverlap: 0.60           // 60% overlap needed
    }
  }
};