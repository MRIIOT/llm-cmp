/**
 * Balanced Anomaly Detection Configuration
 * Optimized for detecting topic changes while maintaining domain coherence
 */

import { AgentConfig } from '../agent.js';

export const balancedAnomalyConfig: AgentConfig = {
  id: 'agent_balanced_anomaly',
  name: 'Balanced Anomaly Detection Agent',
  description: 'Detects topic changes while recognizing domain relationships',
  initialCapabilities: [
    {
      id: 'multi_domain_tracker',
      name: 'Multi-Domain Tracker',
      description: 'Tracks multiple semantic domains simultaneously',
      strength: 0.90,
      adaptationRate: 0.25,
      specializations: [
        'multi_domain_tracking',
        'semantic_similarity',
        'topic_classification',
        'pattern_recognition',
        'anomaly_detection'
      ],
      morphology: {
        structure: { 
          type: 'multi_domain_network',
          layers: 6,
          crossConnections: true,
          domainSpecialization: true,
          patternReuse: true
        },
        connections: new Map([
          ['pattern_recognition', 0.85],
          ['semantic_analysis', 0.90],
          ['temporal_learning', 0.75],
          ['domain_memory', 0.80],
          ['concept_linking', 0.70]
        ]),
        emergentProperties: [
          'multi_domain_awareness',
          'semantic_continuity',
          'topic_boundary_detection',
          'graceful_degradation'
        ],
        adaptationHistory: []
      },
      lastUsed: new Date(),
      performanceHistory: []
    }
  ],
  config: {
    agents: { 
      adaptationRate: 0.25,
      minAgents: 8,
      maxAgents: 15,
      baseCapabilities: [
        'reasoning', 
        'analysis', 
        'pattern_recognition',
        'domain_mapping',
        'anomaly_detection'
      ],
      evolutionEnabled: true
    },
    htm: { 
      columnCount: 4096,         // Larger for better pattern diversity
      cellsPerColumn: 24,        // Balanced cell count
      learningRadius: 1536,      // 37.5% - wider learning
      learningRate: 0.2,         // Moderate learning rate
      maxSequenceLength: 100     // Good sequence memory
    },
    bayesian: { 
      uncertaintyThreshold: 0.25,
      priorStrength: 0.3,
      updatePolicy: 'adaptive',
      conflictResolution: 'weighted_consensus'
    },
    semantic: {
      enableHierarchicalEncoding: true,
      enablePhase2Enhancements: true,
      enableConceptNormalization: true,
      enableRelationshipTracking: true,
      enableGhostTokens: true,
      enableEdgeToggling: true,
      
      // Balanced semantic settings
      domainCoherenceMode: true,
      conceptOverlapThreshold: 0.70,      // 70% overlap = same domain
      domainStickiness: 0.50,             // Moderate stickiness
      semanticGeneralization: 0.60,       // Moderate generalization
      crossDomainPenalty: 0.0,            // No penalty - track naturally
      
      // Balanced encoding
      numColumns: 4096,
      sparsity: 0.04,                     // 4% active - balanced overlap
      columnsPerConcept: 25,              // Good redundancy
      columnOverlapRatio: 0.25,           // 25% overlap for related
      activationThreshold: 0.5,           // Moderate threshold
      semanticDecayRate: 0.05,            // Moderate decay
      
      // Moderate pattern reuse
      domainSpecificFeatures: true,
      featureReuse: 0.50,
      conceptSimilarityBoost: 1.5
    },
    anomaly: {
      domainAwareScoring: true,
      
      // Balanced thresholds
      inDomainThreshold: 0.20,           // Below 20% = in-domain
      crossDomainThreshold: 0.60,        // Above 60% = different domain
      
      // Moderate smoothing
      smoothingFactor: 0.5,              // Balanced smoothing
      domainTransitionPenalty: 0.0,      // No artificial penalty
      
      // Reasonable pattern matching
      minPatternOverlap: 0.25,           // 25% overlap needed
      patternSimilarityBoost: 0.3,       // 30% max reduction
      
      // Balanced temporal
      temporalWindow: 10,
      temporalWeight: 0.2,
      
      // Multi-domain memory
      domainMemorySize: 200,             // Track many patterns
      domainDecayRate: 0.98              // Slow decay
    }
  }
};