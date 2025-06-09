/**
 * Domain-Optimized Configuration for Low In-Domain Anomaly
 * 
 * This configuration is specifically tuned to recognize patterns within
 * similar domains while maintaining sensitivity to true domain shifts.
 */

import { AgentConfig } from '../agent.js';

export const domainOptimizedConfig: AgentConfig = {
  id: 'agent_domain_coherent',
  name: 'Domain-Coherent Agent',
  description: 'Optimized for low anomaly within domains, high anomaly across domains',
  initialCapabilities: [
    {
      id: 'domain_pattern_recognition',
      name: 'Domain Pattern Recognition',
      description: 'Specialized in recognizing patterns within semantic domains',
      strength: 0.95,
      adaptationRate: 0.25, // Higher adaptation for faster domain learning
      specializations: [
        'domain_recognition',
        'pattern_matching', 
        'semantic_similarity',
        'concept_clustering',
        'contextual_understanding'
      ],
      morphology: {
        structure: { 
          type: 'hierarchical_network',
          layers: 6, // More layers for nuanced understanding
          crossConnections: true,
          domainSpecialization: true
        },
        connections: new Map([
          ['pattern_recognition', 0.98],
          ['semantic_analysis', 0.95],
          ['temporal_learning', 0.90],
          ['domain_memory', 0.92]
        ]),
        emergentProperties: [
          'domain_coherence',
          'concept_clustering',
          'semantic_generalization'
        ],
        adaptationHistory: []
      },
      lastUsed: new Date(),
      performanceHistory: []
    }
  ],
  config: {
    agents: { 
      adaptationRate: 0.25,      // Faster adaptation within domains
      minAgents: 8,              // More agents for better coverage
      maxAgents: 25,             // Allow growth for complex domains
      baseCapabilities: [
        'reasoning', 
        'analysis', 
        'pattern_recognition',
        'domain_mapping'
      ],
      evolutionEnabled: true
    },
    htm: { 
      columnCount: 8192,         // Much larger for finer pattern discrimination
      cellsPerColumn: 32,        // More cells for richer representations
      learningRadius: 4096,      // Very wide radius for domain-level patterns
      learningRate: 0.25,        // Faster learning for domain patterns
      maxSequenceLength: 500     // Longer memory for domain context
    },
    bayesian: { 
      uncertaintyThreshold: 0.15,  // Lower = more confident in familiar domains
      priorStrength: 0.35,         // Strong priors for domain consistency
      updatePolicy: 'adaptive',
      conflictResolution: 'weighted_consensus' // Better for domain coherence
    },
    semantic: {
      enableHierarchicalEncoding: true,
      enablePhase2Enhancements: true,
      enableConceptNormalization: true,
      enableRelationshipTracking: true,
      
      // Additional semantic parameters for domain coherence
      domainCoherenceMode: true,
      conceptOverlapThreshold: 0.35,      // 35% overlap = same domain
      domainStickiness: 0.85,             // High retention of domain patterns
      semanticGeneralization: 0.75,       // Generalize within domains
      crossDomainPenalty: 2.5,            // Penalty for domain switches
      
      // Sparsity and activation tuning
      sparsity: 0.04,                     // Less sparse = more overlap
      activationThreshold: 0.6,           // Lower threshold for activation
      semanticDecayRate: 0.02,            // Very slow decay for domain memory
      
      // Domain-specific encoding parameters
      domainSpecificFeatures: true,
      featureReuse: 0.8,                  // High reuse of features within domain
      conceptSimilarityBoost: 1.5         // Boost similarity for related concepts
    },
    
    // HTM-specific anomaly tuning
    anomaly: {
      domainAwareScoring: true,
      inDomainThreshold: 0.25,           // Below 25% = in-domain
      crossDomainThreshold: 0.60,        // Above 60% = different domain
      smoothingFactor: 0.8,              // Smooth anomaly scores over time
      domainTransitionPenalty: 0.3       // Additional penalty for domain shifts
    }
  }
};

/**
 * Alternative: Aggressive Domain Coherence Config
 * Even more aggressive parameters for extremely low in-domain anomaly
 */
export const aggressiveDomainConfig: AgentConfig = {
  ...domainOptimizedConfig,
  id: 'agent_aggressive_domain',
  name: 'Aggressive Domain Agent',
  config: {
    ...domainOptimizedConfig.config,
    htm: {
      columnCount: 16384,       // Maximum columns for finest discrimination
      cellsPerColumn: 64,       // Maximum cells
      learningRadius: 8192,     // Half the column space
      learningRate: 0.35,       // Very fast learning
      maxSequenceLength: 1000   // Very long memory
    },
    semantic: {
      ...domainOptimizedConfig.config.semantic!,
      conceptOverlapThreshold: 0.45,    // 45% overlap = same domain
      domainStickiness: 0.95,           // Extreme domain retention
      semanticGeneralization: 0.85,     // High generalization
      sparsity: 0.06,                   // Even less sparse
      activationThreshold: 0.5          // Very low threshold
    }
  }
};

/**
 * Conservative Domain Config
 * More balanced approach with moderate domain coherence
 */
export const conservativeDomainConfig: AgentConfig = {
  ...domainOptimizedConfig,
  id: 'agent_conservative_domain',
  name: 'Conservative Domain Agent',
  config: {
    ...domainOptimizedConfig.config,
    htm: {
      columnCount: 4096,
      cellsPerColumn: 24,
      learningRadius: 2048,
      learningRate: 0.18,
      maxSequenceLength: 300
    },
    semantic: {
      ...domainOptimizedConfig.config.semantic!,
      conceptOverlapThreshold: 0.25,
      domainStickiness: 0.70,
      semanticGeneralization: 0.60,
      sparsity: 0.03,
      activationThreshold: 0.65
    }
  }
};
