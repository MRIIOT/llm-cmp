/**
 * Mutation Strategies - Beneficial mutation mechanisms
 * 
 * Implements various mutation strategies for evolving agent capabilities
 * including gaussian mutations, adaptive mutations, directional mutations,
 * and specialized domain-aware mutation mechanisms.
 */

import { AgentCapability, AdaptationContext, AgentMorphology, AdaptiveAgent } from '../dynamic/adaptive-agent';
import { FitnessProfile } from './fitness-evaluator';

export interface MutationResult {
  mutatedAgent: AdaptiveAgent;
  mutationType: string;
  mutationPoints: MutationPoint[];
  mutationStrength: number;
  expectedImpact: number;
  riskLevel: number;
  reversible: boolean;
}

export interface MutationPoint {
  location: string; // capability ID or morphology component
  type: 'capability' | 'morphology' | 'structure' | 'parameter';
  originalValue: any;
  mutatedValue: any;
  mutationVector: number[];
  confidence: number;
}

export interface MutationStrategy {
  name: string;
  type: 'gaussian' | 'uniform' | 'adaptive' | 'directional' | 'structural' | 'creative';
  applicability: (agent: AdaptiveAgent, context: AdaptationContext) => number;
  execute: (agent: AdaptiveAgent, config: MutationConfig) => Promise<MutationResult>;
  parameterRequirements: string[];
  expectedBenefit: (agent: AdaptiveAgent, context: AdaptationContext) => number;
  riskAssessment: (agent: AdaptiveAgent, context: AdaptationContext) => number;
}

export interface MutationConfig {
  mutationRate: number;
  mutationStrength: number;
  adaptiveMutation: boolean;
  preserveCore: boolean;
  enableStructuralMutation: boolean;
  mutationBounds: any;
  fitnessContext: FitnessProfile;
  performanceHistory: any[];
  direction?: DirectionalMutation;
  structuralMutation?: StructuralMutation;
}

export interface DirectionalMutation {
  direction: 'improve_performance' | 'increase_diversity' | 'enhance_stability' | 'boost_creativity';
  targetDimensions: string[];
  gradientVector: number[];
  stepSize: number;
  confidence: number;
}

export interface StructuralMutation {
  mutationType: 'add_capability' | 'remove_capability' | 'merge_capabilities' | 'split_capability' | 'restructure';
  targetStructure: string;
  parameters: any;
  reversibilityInfo: any;
  structuralImpact: number;
}

export interface AdaptiveMutationParams {
  baseRate: number;
  performanceModifier: number;
  diversityModifier: number;
  stabilityModifier: number;
  contextualFactors: any;
  learningRate: number;
  confidence?: number;
  effectiveStrength?: number;
}

export interface MutationAnalysis {
  mutationPotential: number;
  recommendedStrategies: string[];
  riskFactors: string[];
  expectedOutcomes: any[];
  optimalMutationRate: number;
  diversityImpact: number;
}

/**
 * MutationManager - Manages all mutation operations
 */
export class MutationManager {
  private strategies: Map<string, MutationStrategy>;
  private config: MutationConfig;
  private mutationHistory: any[];
  private performanceAnalyzer: MutationPerformanceAnalyzer;
  private adaptiveController: AdaptiveMutationController;
  private riskAssessor: MutationRiskAssessor;

  constructor(config: any = {}) {
    this.config = {
      mutationRate: config.mutationRate || 0.1,
      mutationStrength: config.mutationStrength || 0.1,
      adaptiveMutation: config.adaptiveMutation || true,
      preserveCore: config.preserveCore || true,
      enableStructuralMutation: config.enableStructuralMutation || true,
      mutationBounds: config.mutationBounds || { min: -0.5, max: 0.5 },
      fitnessContext: config.fitnessContext || null,
      performanceHistory: config.performanceHistory || [],
      ...config
    };

    this.strategies = new Map();
    this.mutationHistory = [];
    this.performanceAnalyzer = new MutationPerformanceAnalyzer();
    this.adaptiveController = new AdaptiveMutationController();
    this.riskAssessor = new MutationRiskAssessor();

    this.initializeStrategies();
  }

  /**
   * Apply mutations to an agent
   */
  async mutateAgent(
    agent: AdaptiveAgent,
    context?: AdaptationContext
  ): Promise<MutationResult> {
    // 1. Analyze mutation potential
    const analysis = await this.analyzeMutationPotential(agent, context);
    
    if (analysis.mutationPotential < 0.1) {
      throw new Error('Agent has insufficient mutation potential');
    }

    // 2. Select optimal mutation strategy
    const strategyName = this.selectOptimalStrategy(agent, context, analysis);
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Mutation strategy not found: ${strategyName}`);
    }

    // 3. Adapt mutation parameters
    const adaptedConfig = this.adaptMutationConfig(agent, context, analysis);

    // 4. Execute mutation
    const result = await strategy.execute(agent, adaptedConfig);

    // 5. Record mutation for learning
    this.recordMutation(agent, result, analysis);

    return result;
  }

  /**
   * Apply batch mutations to a population
   */
  async mutatePopulation(
    agents: AdaptiveAgent[],
    context?: AdaptationContext
  ): Promise<MutationResult[]> {
    const results: MutationResult[] = [];
    
    for (const agent of agents) {
      if (Math.random() < this.config.mutationRate) {
        try {
          const result = await this.mutateAgent(agent, context);
          results.push(result);
        } catch (error) {
          console.warn(`Mutation failed for agent ${agent.getSpecializationProfile().id}:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Apply directional mutation towards specific goals
   */
  async mutateDirectional(
    agent: AdaptiveAgent,
    direction: DirectionalMutation,
    context?: AdaptationContext
  ): Promise<MutationResult> {
    const strategyName = this.selectDirectionalStrategy(direction);
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Directional strategy not found: ${strategyName}`);
    }

    const directionConfig = {
      ...this.config,
      direction,
      mutationStrength: direction.stepSize,
      targetDimensions: direction.targetDimensions
    };

    return await strategy.execute(agent, directionConfig);
  }

  /**
   * Apply structural mutations
   */
  async mutateStructural(
    agent: AdaptiveAgent,
    structuralMutation: StructuralMutation,
    context?: AdaptationContext
  ): Promise<MutationResult> {
    if (!this.config.enableStructuralMutation) {
      throw new Error('Structural mutations are disabled');
    }

    const strategy = this.strategies.get('structural');
    if (!strategy) {
      throw new Error('Structural mutation strategy not available');
    }

    const structuralConfig = {
      ...this.config,
      structuralMutation,
      mutationStrength: structuralMutation.structuralImpact
    };

    return await strategy.execute(agent, structuralConfig);
  }

  /**
   * Analyze mutation potential of an agent
   */
  async analyzeMutationPotential(
    agent: AdaptiveAgent,
    context?: AdaptationContext
  ): Promise<MutationAnalysis> {
    const profile = agent.getSpecializationProfile();
    
    return {
      mutationPotential: this.calculateMutationPotential(profile),
      recommendedStrategies: this.recommendMutationStrategies(profile, context),
      riskFactors: this.identifyRiskFactors(profile),
      expectedOutcomes: this.predictMutationOutcomes(profile, context),
      optimalMutationRate: this.calculateOptimalMutationRate(profile),
      diversityImpact: this.estimateDiversityImpact(profile)
    };
  }

  /**
   * Get mutation performance statistics
   */
  getMutationStatistics(): any {
    return this.performanceAnalyzer.generateStatistics(this.mutationHistory);
  }

  /**
   * Update mutation parameters based on performance
   */
  updateParameters(performanceData: any): void {
    if (this.config.adaptiveMutation) {
      this.adaptiveController.updateParameters(this.config, performanceData);
    }
  }

  // Private implementation methods

  private initializeStrategies(): void {
    // Gaussian Mutation Strategy
    this.strategies.set('gaussian', {
      name: 'Gaussian Mutation',
      type: 'gaussian',
      applicability: (agent, context) => this.calculateGaussianApplicability(agent, context),
      execute: async (agent, config) => this.executeGaussianMutation(agent, config),
      parameterRequirements: ['mutationStrength', 'variance'],
      expectedBenefit: (agent, context) => this.calculateGaussianBenefit(agent, context),
      riskAssessment: (agent, context) => this.assessGaussianRisk(agent, context)
    });

    // Uniform Mutation Strategy
    this.strategies.set('uniform', {
      name: 'Uniform Mutation',
      type: 'uniform',
      applicability: (agent, context) => this.calculateUniformApplicability(agent, context),
      execute: async (agent, config) => this.executeUniformMutation(agent, config),
      parameterRequirements: ['mutationRange'],
      expectedBenefit: (agent, context) => this.calculateUniformBenefit(agent, context),
      riskAssessment: (agent, context) => this.assessUniformRisk(agent, context)
    });

    // Adaptive Mutation Strategy
    this.strategies.set('adaptive', {
      name: 'Adaptive Mutation',
      type: 'adaptive',
      applicability: (agent, context) => this.calculateAdaptiveApplicability(agent, context),
      execute: async (agent, config) => this.executeAdaptiveMutation(agent, config),
      parameterRequirements: ['adaptiveParams', 'performanceHistory'],
      expectedBenefit: (agent, context) => this.calculateAdaptiveBenefit(agent, context),
      riskAssessment: (agent, context) => this.assessAdaptiveRisk(agent, context)
    });

    // Directional Mutation Strategy
    this.strategies.set('directional', {
      name: 'Directional Mutation',
      type: 'directional',
      applicability: (agent, context) => this.calculateDirectionalApplicability(agent, context),
      execute: async (agent, config) => this.executeDirectionalMutation(agent, config),
      parameterRequirements: ['direction', 'gradientVector'],
      expectedBenefit: (agent, context) => this.calculateDirectionalBenefit(agent, context),
      riskAssessment: (agent, context) => this.assessDirectionalRisk(agent, context)
    });

    // Structural Mutation Strategy
    this.strategies.set('structural', {
      name: 'Structural Mutation',
      type: 'structural',
      applicability: (agent, context) => this.calculateStructuralApplicability(agent, context),
      execute: async (agent, config) => this.executeStructuralMutation(agent, config),
      parameterRequirements: ['structuralMutation'],
      expectedBenefit: (agent, context) => this.calculateStructuralBenefit(agent, context),
      riskAssessment: (agent, context) => this.assessStructuralRisk(agent, context)
    });

    // Creative Mutation Strategy
    this.strategies.set('creative', {
      name: 'Creative Mutation',
      type: 'creative',
      applicability: (agent, context) => this.calculateCreativeApplicability(agent, context),
      execute: async (agent, config) => this.executeCreativeMutation(agent, config),
      parameterRequirements: ['creativityParams'],
      expectedBenefit: (agent, context) => this.calculateCreativeBenefit(agent, context),
      riskAssessment: (agent, context) => this.assessCreativeRisk(agent, context)
    });
  }

  // Mutation strategy implementations

  private async executeGaussianMutation(
    agent: AdaptiveAgent,
    config: MutationConfig
  ): Promise<MutationResult> {
    const profile = agent.getSpecializationProfile();
    const mutatedCapabilities: AgentCapability[] = [];
    const mutationPoints: MutationPoint[] = [];

    // Apply Gaussian mutations to capabilities
    for (const capability of profile.capabilities) {
      const mutatedCapability = this.applyGaussianMutationToCapability(capability, config);
      mutatedCapabilities.push(mutatedCapability);

      if (mutatedCapability !== capability) {
        mutationPoints.push({
          location: capability.id,
          type: 'capability',
          originalValue: capability.strength,
          mutatedValue: mutatedCapability.strength,
          mutationVector: [mutatedCapability.strength - capability.strength],
          confidence: 0.8
        });
      }
    }

    // Create mutated agent
    const mutatedAgent = new AdaptiveAgent(
      `mutated_${profile.id}_${Date.now()}`,
      mutatedCapabilities
    );

    return {
      mutatedAgent,
      mutationType: 'gaussian',
      mutationPoints,
      mutationStrength: config.mutationStrength,
      expectedImpact: this.calculateExpectedImpact(mutationPoints),
      riskLevel: this.calculateRiskLevel(mutationPoints),
      reversible: true
    };
  }

  private async executeUniformMutation(
    agent: AdaptiveAgent,
    config: MutationConfig
  ): Promise<MutationResult> {
    const profile = agent.getSpecializationProfile();
    const mutatedCapabilities: AgentCapability[] = [];
    const mutationPoints: MutationPoint[] = [];

    // Apply uniform mutations to capabilities
    for (const capability of profile.capabilities) {
      const mutatedCapability = this.applyUniformMutationToCapability(capability, config);
      mutatedCapabilities.push(mutatedCapability);

      if (mutatedCapability !== capability) {
        mutationPoints.push({
          location: capability.id,
          type: 'capability',
          originalValue: capability.strength,
          mutatedValue: mutatedCapability.strength,
          mutationVector: [mutatedCapability.strength - capability.strength],
          confidence: 0.7
        });
      }
    }

    const mutatedAgent = new AdaptiveAgent(
      `mutated_${profile.id}_${Date.now()}`,
      mutatedCapabilities
    );

    return {
      mutatedAgent,
      mutationType: 'uniform',
      mutationPoints,
      mutationStrength: config.mutationStrength,
      expectedImpact: this.calculateExpectedImpact(mutationPoints),
      riskLevel: this.calculateRiskLevel(mutationPoints),
      reversible: true
    };
  }

  private async executeAdaptiveMutation(
    agent: AdaptiveAgent,
    config: MutationConfig
  ): Promise<MutationResult> {
    const profile = agent.getSpecializationProfile();
    
    // Determine adaptive mutation parameters
    const adaptiveParams = this.calculateAdaptiveMutationParams(profile, config);
    
    // Apply adaptive mutations based on performance and context
    const mutatedCapabilities: AgentCapability[] = [];
    const mutationPoints: MutationPoint[] = [];

    for (const capability of profile.capabilities) {
      const localMutationRate = this.calculateLocalMutationRate(capability, adaptiveParams);
      
      if (Math.random() < localMutationRate) {
        const mutatedCapability = this.applyAdaptiveMutationToCapability(capability, adaptiveParams);
        mutatedCapabilities.push(mutatedCapability);

        mutationPoints.push({
          location: capability.id,
          type: 'capability',
          originalValue: capability.strength,
          mutatedValue: mutatedCapability.strength,
          mutationVector: [mutatedCapability.strength - capability.strength],
          confidence: adaptiveParams.confidence || 0.9
        });
      } else {
        mutatedCapabilities.push(capability);
      }
    }

    const mutatedAgent = new AdaptiveAgent(
      `mutated_${profile.id}_${Date.now()}`,
      mutatedCapabilities
    );

    return {
      mutatedAgent,
      mutationType: 'adaptive',
      mutationPoints,
      mutationStrength: adaptiveParams.effectiveStrength || this.config.mutationStrength,
      expectedImpact: this.calculateExpectedImpact(mutationPoints),
      riskLevel: this.calculateRiskLevel(mutationPoints),
      reversible: true
    };
  }

  private async executeDirectionalMutation(
    agent: AdaptiveAgent,
    config: MutationConfig
  ): Promise<MutationResult> {
    const profile = agent.getSpecializationProfile();
    const direction = config.direction as DirectionalMutation;
    
    // Apply mutations in specific direction
    const mutatedCapabilities: AgentCapability[] = [];
    const mutationPoints: MutationPoint[] = [];

    for (const capability of profile.capabilities) {
      if (direction.targetDimensions.includes(capability.id) || direction.targetDimensions.includes('all')) {
        const mutatedCapability = this.applyDirectionalMutationToCapability(
          capability, 
          direction, 
          config
        );
        mutatedCapabilities.push(mutatedCapability);

        mutationPoints.push({
          location: capability.id,
          type: 'capability',
          originalValue: capability.strength,
          mutatedValue: mutatedCapability.strength,
          mutationVector: direction.gradientVector,
          confidence: direction.confidence
        });
      } else {
        mutatedCapabilities.push(capability);
      }
    }

    const mutatedAgent = new AdaptiveAgent(
      `mutated_${profile.id}_${Date.now()}`,
      mutatedCapabilities
    );

    return {
      mutatedAgent,
      mutationType: 'directional',
      mutationPoints,
      mutationStrength: direction.stepSize,
      expectedImpact: this.calculateDirectionalImpact(direction, mutationPoints),
      riskLevel: this.calculateDirectionalRisk(direction, mutationPoints),
      reversible: true
    };
  }

  private async executeStructuralMutation(
    agent: AdaptiveAgent,
    config: MutationConfig
  ): Promise<MutationResult> {
    const profile = agent.getSpecializationProfile();
    const structuralMutation = config.structuralMutation as StructuralMutation;
    
    let mutatedCapabilities: AgentCapability[] = [...profile.capabilities];
    const mutationPoints: MutationPoint[] = [];

    switch (structuralMutation.mutationType) {
      case 'add_capability':
        const newCapability = this.createNewCapability(profile, structuralMutation);
        mutatedCapabilities.push(newCapability);
        mutationPoints.push({
          location: newCapability.id,
          type: 'capability',
          originalValue: null,
          mutatedValue: newCapability,
          mutationVector: [1], // Addition vector
          confidence: 0.6
        });
        break;

      case 'remove_capability':
        const removeIndex = this.selectCapabilityForRemoval(profile, structuralMutation);
        if (removeIndex >= 0) {
          const removedCapability = mutatedCapabilities.splice(removeIndex, 1)[0];
          mutationPoints.push({
            location: removedCapability.id,
            type: 'capability',
            originalValue: removedCapability,
            mutatedValue: null,
            mutationVector: [-1], // Removal vector
            confidence: 0.7
          });
        }
        break;

      case 'merge_capabilities':
        const mergeResult = this.mergeCapabilities(profile, structuralMutation);
        if (mergeResult) {
          mutatedCapabilities = mutatedCapabilities.filter(cap => 
            !mergeResult.sourceIds.includes(cap.id)
          );
          mutatedCapabilities.push(mergeResult.mergedCapability);
          
          mutationPoints.push({
            location: mergeResult.mergedCapability.id,
            type: 'capability',
            originalValue: mergeResult.sourceCapabilities,
            mutatedValue: mergeResult.mergedCapability,
            mutationVector: [0.5], // Merge vector
            confidence: 0.8
          });
        }
        break;
    }

    const mutatedAgent = new AdaptiveAgent(
      `mutated_${profile.id}_${Date.now()}`,
      mutatedCapabilities
    );

    return {
      mutatedAgent,
      mutationType: 'structural',
      mutationPoints,
      mutationStrength: structuralMutation.structuralImpact,
      expectedImpact: this.calculateStructuralImpact(structuralMutation, mutationPoints),
      riskLevel: this.calculateStructuralRiskLevel(structuralMutation, mutationPoints),
      reversible: structuralMutation.reversibilityInfo.reversible || false
    };
  }

  private async executeCreativeMutation(
    agent: AdaptiveAgent,
    config: MutationConfig
  ): Promise<MutationResult> {
    const profile = agent.getSpecializationProfile();
    
    // Apply creative mutations that introduce novelty
    const mutatedCapabilities: AgentCapability[] = [];
    const mutationPoints: MutationPoint[] = [];

    for (const capability of profile.capabilities) {
      if (Math.random() < config.mutationRate * 2) { // Higher rate for creativity
        const mutatedCapability = this.applyCreativeMutationToCapability(capability, config);
        mutatedCapabilities.push(mutatedCapability);

        mutationPoints.push({
          location: capability.id,
          type: 'capability',
          originalValue: capability,
          mutatedValue: mutatedCapability,
          mutationVector: this.calculateCreativeMutationVector(capability, mutatedCapability),
          confidence: 0.5 // Lower confidence for creative mutations
        });
      } else {
        mutatedCapabilities.push(capability);
      }
    }

    // Potentially add a completely novel capability
    if (Math.random() < 0.3) {
      const novelCapability = this.createNovelCapability(profile);
      mutatedCapabilities.push(novelCapability);
      
      mutationPoints.push({
        location: novelCapability.id,
        type: 'capability',
        originalValue: null,
        mutatedValue: novelCapability,
        mutationVector: [1, 0, 0], // Novel creation vector
        confidence: 0.4
      });
    }

    const mutatedAgent = new AdaptiveAgent(
      `mutated_${profile.id}_${Date.now()}`,
      mutatedCapabilities
    );

    return {
      mutatedAgent,
      mutationType: 'creative',
      mutationPoints,
      mutationStrength: config.mutationStrength,
      expectedImpact: this.calculateCreativeImpact(mutationPoints),
      riskLevel: this.calculateCreativeRisk(mutationPoints),
      reversible: false // Creative mutations are typically not reversible
    };
  }

  // Capability mutation methods

  private applyGaussianMutationToCapability(
    capability: AgentCapability,
    config: MutationConfig
  ): AgentCapability {
    if (Math.random() > config.mutationRate) {
      return capability; // No mutation
    }

    const mutatedCapability = { ...capability };
    
    // Apply Gaussian noise to strength
    const strengthMutation = this.gaussianRandom(0, config.mutationStrength);
    mutatedCapability.strength = Math.max(0, Math.min(1, capability.strength + strengthMutation));
    
    // Apply Gaussian noise to adaptation rate
    const adaptationMutation = this.gaussianRandom(0, config.mutationStrength * 0.1);
    mutatedCapability.adaptationRate = Math.max(0.01, Math.min(0.5, capability.adaptationRate + adaptationMutation));

    return mutatedCapability;
  }

  private applyUniformMutationToCapability(
    capability: AgentCapability,
    config: MutationConfig
  ): AgentCapability {
    if (Math.random() > config.mutationRate) {
      return capability; // No mutation
    }

    const mutatedCapability = { ...capability };
    const range = config.mutationBounds.max - config.mutationBounds.min;
    
    // Apply uniform mutation to strength
    const strengthMutation = (Math.random() - 0.5) * range * config.mutationStrength;
    mutatedCapability.strength = Math.max(0, Math.min(1, capability.strength + strengthMutation));
    
    // Apply uniform mutation to adaptation rate
    const adaptationMutation = (Math.random() - 0.5) * range * config.mutationStrength * 0.1;
    mutatedCapability.adaptationRate = Math.max(0.01, Math.min(0.5, capability.adaptationRate + adaptationMutation));

    return mutatedCapability;
  }

  private applyAdaptiveMutationToCapability(
    capability: AgentCapability,
    adaptiveParams: AdaptiveMutationParams
  ): AgentCapability {
    const mutatedCapability = { ...capability };
    
    // Adaptive mutation strength based on performance
    const adaptiveStrength = this.calculateAdaptiveMutationStrength(capability, adaptiveParams);
    
    // Apply mutation with adaptive strength
    const strengthMutation = this.gaussianRandom(0, adaptiveStrength);
    mutatedCapability.strength = Math.max(0, Math.min(1, capability.strength + strengthMutation));
    
    // Adapt the adaptation rate itself
    const adaptationRateModifier = adaptiveParams.learningRate * adaptiveParams.performanceModifier;
    mutatedCapability.adaptationRate = Math.max(0.01, Math.min(0.5, 
      capability.adaptationRate * (1 + adaptationRateModifier)
    ));

    return mutatedCapability;
  }

  private applyDirectionalMutationToCapability(
    capability: AgentCapability,
    direction: DirectionalMutation,
    config: MutationConfig
  ): AgentCapability {
    const mutatedCapability = { ...capability };
    
    // Apply mutation in the specified direction
    switch (direction.direction) {
      case 'improve_performance':
        mutatedCapability.strength = Math.min(1, capability.strength + direction.stepSize);
        break;
        
      case 'increase_diversity':
        // Add new specialization or modify existing ones
        if (Math.random() < 0.5 && mutatedCapability.specialization.length < 5) {
          mutatedCapability.specialization.push(this.generateNovelSpecialization());
        }
        break;
        
      case 'enhance_stability':
        mutatedCapability.adaptationRate = Math.max(0.01, capability.adaptationRate * 0.8);
        break;
        
      case 'boost_creativity':
        mutatedCapability.adaptationRate = Math.min(0.5, capability.adaptationRate * 1.2);
        mutatedCapability.strength += this.gaussianRandom(0, direction.stepSize);
        break;
    }

    return mutatedCapability;
  }

  private applyCreativeMutationToCapability(
    capability: AgentCapability,
    config: MutationConfig
  ): AgentCapability {
    const mutatedCapability = { ...capability };
    
    // Creative mutations introduce novel elements
    
    // 1. Novel specialization combinations
    if (Math.random() < 0.4) {
      const novelSpec = this.generateNovelSpecialization();
      if (!mutatedCapability.specialization.includes(novelSpec)) {
        mutatedCapability.specialization.push(novelSpec);
      }
    }
    
    // 2. Non-linear strength modifications
    if (Math.random() < 0.6) {
      const creativeFactor = Math.random() * 2; // 0 to 2
      mutatedCapability.strength = Math.max(0, Math.min(1, 
        capability.strength * creativeFactor * config.mutationStrength
      ));
    }
    
    // 3. Morphology innovation
    mutatedCapability.morphology = {
      ...capability.morphology,
      creativeElement: `novel_${Date.now()}`,
      innovationLevel: Math.random()
    };

    return mutatedCapability;
  }

  // Structural mutation methods

  private createNewCapability(profile: any, structuralMutation: StructuralMutation): AgentCapability {
    const capabilities = ['reasoning', 'creative', 'analytical', 'social', 'technical', 'strategic'];
    const randomCapability = capabilities[Math.floor(Math.random() * capabilities.length)];
    
    return {
      id: `new_${randomCapability}_${Date.now()}`,
      name: `New ${randomCapability} Capability`,
      strength: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
      adaptationRate: 0.05 + Math.random() * 0.1, // 0.05 to 0.15
      specialization: [randomCapability],
      morphology: { type: 'new', created: new Date() },
      lastUsed: new Date(),
      performanceHistory: []
    };
  }

  private selectCapabilityForRemoval(profile: any, structuralMutation: StructuralMutation): number {
    // Remove weakest capability if more than 2 capabilities exist
    if (profile.capabilities.length <= 2) return -1;
    
    let weakestIndex = 0;
    let weakestStrength = profile.capabilities[0].strength;
    
    for (let i = 1; i < profile.capabilities.length; i++) {
      if (profile.capabilities[i].strength < weakestStrength) {
        weakestStrength = profile.capabilities[i].strength;
        weakestIndex = i;
      }
    }
    
    return weakestIndex;
  }

  private mergeCapabilities(profile: any, structuralMutation: StructuralMutation): any {
    if (profile.capabilities.length < 2) return null;
    
    // Select two capabilities to merge
    const cap1 = profile.capabilities[0];
    const cap2 = profile.capabilities[1];
    
    const mergedCapability: AgentCapability = {
      id: `merged_${cap1.id}_${cap2.id}`,
      name: `Merged ${cap1.name}-${cap2.name}`,
      strength: (cap1.strength + cap2.strength) / 2 + 0.1, // Small bonus for merging
      adaptationRate: Math.max(cap1.adaptationRate, cap2.adaptationRate),
      specialization: [...new Set([...cap1.specialization, ...cap2.specialization])],
      morphology: { ...cap1.morphology, ...cap2.morphology, merged: true },
      lastUsed: new Date(),
      performanceHistory: []
    };
    
    return {
      mergedCapability,
      sourceCapabilities: [cap1, cap2],
      sourceIds: [cap1.id, cap2.id]
    };
  }

  private createNovelCapability(profile: any): AgentCapability {
    const novelSpecs = ['quantum_reasoning', 'empathic_analysis', 'fractal_creativity', 'meta_learning'];
    const novelSpec = novelSpecs[Math.floor(Math.random() * novelSpecs.length)];
    
    return {
      id: `novel_${novelSpec}_${Date.now()}`,
      name: `Novel ${novelSpec.replace('_', ' ')} Capability`,
      strength: 0.2 + Math.random() * 0.3, // Lower initial strength for novel capabilities
      adaptationRate: 0.1 + Math.random() * 0.2, // Higher adaptation rate for learning
      specialization: [novelSpec],
      morphology: { type: 'novel', innovation: true, created: new Date() },
      lastUsed: new Date(),
      performanceHistory: []
    };
  }

  // Helper methods

  private gaussianRandom(mean: number, std: number): number {
    // Box-Muller transform for Gaussian random numbers
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * std + mean;
  }

  private generateNovelSpecialization(): string {
    const novelSpecs = [
      'meta_cognitive', 'quantum_intuitive', 'systemic_holistic', 
      'emergent_adaptive', 'multi_dimensional', 'cross_modal',
      'temporal_predictive', 'contextual_dynamic', 'pattern_synthesis'
    ];
    return novelSpecs[Math.floor(Math.random() * novelSpecs.length)];
  }

  private calculateCreativeMutationVector(original: AgentCapability, mutated: AgentCapability): number[] {
    return [
      mutated.strength - original.strength,
      mutated.adaptationRate - original.adaptationRate,
      mutated.specialization.length - original.specialization.length
    ];
  }

  // Analysis and calculation methods

  private calculateMutationPotential(profile: any): number {
    // Calculate how much an agent can benefit from mutation
    const fitnessScore = profile.fitnessScore || 0.5;
    const capabilityDiversity = this.calculateCapabilityDiversity(profile.capabilities);
    const adaptationHistory = profile.adaptationHistory.length;
    
    // Higher potential for lower fitness, lower diversity, less adaptation history
    const fitnessPotential = 1 - fitnessScore;
    const diversityPotential = 1 - capabilityDiversity;
    const adaptationPotential = Math.max(0, 1 - (adaptationHistory / 100));
    
    return (fitnessPotential * 0.5) + (diversityPotential * 0.3) + (adaptationPotential * 0.2);
  }

  private calculateCapabilityDiversity(capabilities: AgentCapability[]): number {
    const uniqueSpecs = new Set();
    capabilities.forEach(cap => {
      cap.specialization.forEach(spec => uniqueSpecs.add(spec));
    });
    
    return uniqueSpecs.size / Math.max(1, capabilities.length * 2); // Normalize
  }

  private recommendMutationStrategies(profile: any, context?: AdaptationContext): string[] {
    const recommendations: string[] = [];
    
    const fitnessScore = profile.fitnessScore || 0.5;
    const capabilityCount = profile.capabilities.length;
    
    if (fitnessScore < 0.4) {
      recommendations.push('directional'); // Focus on improvement
    }
    
    if (capabilityCount < 3) {
      recommendations.push('structural'); // Add capabilities
    }
    
    if (fitnessScore > 0.7) {
      recommendations.push('creative'); // Explore novelty
    } else {
      recommendations.push('gaussian'); // Safe improvement
    }
    
    recommendations.push('adaptive'); // Always consider adaptive
    
    return recommendations;
  }

  private identifyRiskFactors(profile: any): string[] {
    const risks: string[] = [];
    
    if (profile.capabilities.length <= 2) {
      risks.push('too_few_capabilities');
    }
    
    if (profile.fitnessScore > 0.8) {
      risks.push('high_fitness_degradation_risk');
    }
    
    if (profile.adaptationHistory.length < 5) {
      risks.push('insufficient_adaptation_history');
    }
    
    return risks;
  }

  private predictMutationOutcomes(profile: any, context?: AdaptationContext): any[] {
    return [
      { outcome: 'fitness_improvement', probability: 0.4 },
      { outcome: 'capability_diversification', probability: 0.6 },
      { outcome: 'fitness_degradation', probability: 0.2 },
      { outcome: 'novel_emergence', probability: 0.3 }
    ];
  }

  private calculateOptimalMutationRate(profile: any): number {
    const fitnessScore = profile.fitnessScore || 0.5;
    const baseRate = 0.1;
    
    // Higher mutation rate for lower fitness
    const fitnessFactor = (1 - fitnessScore) * 0.2;
    
    return Math.max(0.05, Math.min(0.3, baseRate + fitnessFactor));
  }

  private estimateDiversityImpact(profile: any): number {
    // Estimate how mutation will impact diversity
    return 0.3; // Placeholder
  }

  private selectOptimalStrategy(
    agent: AdaptiveAgent,
    context: AdaptationContext | undefined,
    analysis: MutationAnalysis
  ): string {
    // Select strategy based on analysis
    if (analysis.recommendedStrategies.length > 0) {
      return analysis.recommendedStrategies[0];
    }
    
    // Default to adaptive strategy
    return 'adaptive';
  }

  private adaptMutationConfig(
    agent: AdaptiveAgent,
    context: AdaptationContext | undefined,
    analysis: MutationAnalysis
  ): MutationConfig {
    const adaptedConfig = { ...this.config };
    
    // Adapt mutation rate based on analysis
    adaptedConfig.mutationRate = analysis.optimalMutationRate;
    
    // Adapt mutation strength based on fitness
    const fitnessScore = agent.getSpecializationProfile().fitnessScore || 0.5;
    adaptedConfig.mutationStrength *= (1 - fitnessScore) + 0.5; // 0.5 to 1.5 multiplier
    
    return adaptedConfig;
  }

  private recordMutation(
    agent: AdaptiveAgent,
    result: MutationResult,
    analysis: MutationAnalysis
  ): void {
    this.mutationHistory.push({
      timestamp: new Date(),
      agentId: agent.getSpecializationProfile().id,
      mutationType: result.mutationType,
      mutationStrength: result.mutationStrength,
      expectedImpact: result.expectedImpact,
      riskLevel: result.riskLevel,
      mutationPotential: analysis.mutationPotential,
      pointCount: result.mutationPoints.length
    });
    
    // Maintain history size
    if (this.mutationHistory.length > 1000) {
      this.mutationHistory = this.mutationHistory.slice(-1000);
    }
  }

  private selectDirectionalStrategy(direction: DirectionalMutation): string {
    // Always use directional strategy for directional mutations
    return 'directional';
  }

  private calculateAdaptiveMutationParams(profile: any, config: MutationConfig): AdaptiveMutationParams {
    const recentPerformance = this.calculateRecentPerformance(profile);
    
    return {
      baseRate: config.mutationRate,
      performanceModifier: 1 - recentPerformance, // Higher modifier for lower performance
      diversityModifier: this.calculateDiversityNeed(profile),
      stabilityModifier: this.calculateStabilityNeed(profile),
      contextualFactors: {},
      learningRate: 0.1,
      confidence: 0.8,
      effectiveStrength: config.mutationStrength * (1 - recentPerformance + 0.5)
    };
  }

  private calculateLocalMutationRate(capability: AgentCapability, params: AdaptiveMutationParams): number {
    // Calculate mutation rate specific to this capability
    const capabilityPerformance = this.calculateCapabilityPerformance(capability);
    return params.baseRate * (1 - capabilityPerformance + 0.2);
  }

  private calculateAdaptiveMutationStrength(capability: AgentCapability, params: AdaptiveMutationParams): number {
    const capabilityPerformance = this.calculateCapabilityPerformance(capability);
    return params.baseRate * params.performanceModifier * (1 - capabilityPerformance);
  }

  private calculateRecentPerformance(profile: any): number {
    // Calculate recent performance score
    return profile.fitnessScore || 0.5;
  }

  private calculateDiversityNeed(profile: any): number {
    const diversity = this.calculateCapabilityDiversity(profile.capabilities);
    return Math.max(0, 0.7 - diversity); // Need is higher when diversity is lower
  }

  private calculateStabilityNeed(profile: any): number {
    // Calculate need for stability (lower for volatile agents)
    return 0.3; // Placeholder
  }

  private calculateCapabilityPerformance(capability: AgentCapability): number {
    // Calculate performance of individual capability
    const recentHistory = capability.performanceHistory.slice(-5);
    if (recentHistory.length === 0) return capability.strength;
    
    return recentHistory.reduce((sum, perf) => sum + perf, 0) / recentHistory.length;
  }

  // Impact and risk calculation methods

  private calculateExpectedImpact(mutationPoints: MutationPoint[]): number {
    return mutationPoints.reduce((sum, point) => sum + Math.abs(point.mutationVector[0] || 0), 0) / Math.max(1, mutationPoints.length);
  }

  private calculateRiskLevel(mutationPoints: MutationPoint[]): number {
    // Calculate risk based on mutation magnitude and confidence
    let totalRisk = 0;
    
    mutationPoints.forEach(point => {
      const magnitude = Math.abs(point.mutationVector[0] || 0);
      const uncertaintyRisk = 1 - point.confidence;
      totalRisk += magnitude * uncertaintyRisk;
    });
    
    return totalRisk / Math.max(1, mutationPoints.length);
  }

  private calculateDirectionalImpact(direction: DirectionalMutation, points: MutationPoint[]): number {
    // Calculate expected impact of directional mutation
    return direction.stepSize * direction.confidence;
  }

  private calculateDirectionalRisk(direction: DirectionalMutation, points: MutationPoint[]): number {
    // Calculate risk of directional mutation
    return Math.max(0, direction.stepSize - direction.confidence);
  }

  private calculateStructuralImpact(mutation: StructuralMutation, points: MutationPoint[]): number {
    return mutation.structuralImpact;
  }

  private calculateStructuralRiskLevel(mutation: StructuralMutation, points: MutationPoint[]): number {
    // Structural mutations are generally riskier
    const baseRisk = 0.4;
    const reversibilityBonus = mutation.reversibilityInfo.reversible ? -0.1 : 0.1;
    return Math.max(0, baseRisk + reversibilityBonus);
  }

  private calculateCreativeImpact(points: MutationPoint[]): number {
    // Creative mutations have high potential impact
    return 0.7;
  }

  private calculateCreativeRisk(points: MutationPoint[]): number {
    // Creative mutations are inherently risky
    return 0.6;
  }

  // Applicability, benefit, and risk assessment methods for each strategy
  // (These would be fully implemented with proper logic)

  private calculateGaussianApplicability(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.8; // Gaussian is generally applicable
  }

  private calculateGaussianBenefit(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.6; // Moderate benefit
  }

  private assessGaussianRisk(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.3; // Low risk
  }

  private calculateUniformApplicability(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.7;
  }

  private calculateUniformBenefit(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.5;
  }

  private assessUniformRisk(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.4;
  }

  private calculateAdaptiveApplicability(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 1.0; // Always applicable
  }

  private calculateAdaptiveBenefit(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.8; // High benefit when done right
  }

  private assessAdaptiveRisk(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.2; // Low risk due to adaptation
  }

  private calculateDirectionalApplicability(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.9; // Highly applicable when direction is known
  }

  private calculateDirectionalBenefit(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.9; // High benefit when targeting specific improvements
  }

  private assessDirectionalRisk(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.3; // Moderate risk
  }

  private calculateStructuralApplicability(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.6; // Only when structural changes are beneficial
  }

  private calculateStructuralBenefit(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.7; // High potential benefit
  }

  private assessStructuralRisk(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.7; // High risk
  }

  private calculateCreativeApplicability(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.5; // Only for exploration phases
  }

  private calculateCreativeBenefit(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.8; // High novelty benefit
  }

  private assessCreativeRisk(agent: AdaptiveAgent, context?: AdaptationContext): number {
    return 0.8; // High risk
  }
}

/**
 * MutationPerformanceAnalyzer - Analyzes mutation performance
 */
class MutationPerformanceAnalyzer {
  generateStatistics(history: any[]): any {
    if (history.length === 0) return null;
    
    const strategyStats = new Map();
    
    history.forEach(record => {
      const type = record.mutationType;
      if (!strategyStats.has(type)) {
        strategyStats.set(type, {
          count: 0,
          totalImpact: 0,
          totalRisk: 0,
          successCount: 0
        });
      }
      
      const stats = strategyStats.get(type);
      stats.count++;
      stats.totalImpact += record.expectedImpact;
      stats.totalRisk += record.riskLevel;
      if (record.expectedImpact > 0.1) stats.successCount++;
    });
    
    // Calculate averages
    strategyStats.forEach(stats => {
      stats.avgImpact = stats.totalImpact / stats.count;
      stats.avgRisk = stats.totalRisk / stats.count;
      stats.successRate = stats.successCount / stats.count;
    });
    
    return {
      totalMutations: history.length,
      strategyPerformance: Array.from(strategyStats.entries())
    };
  }
}

/**
 * AdaptiveMutationController - Controls adaptive mutation parameters
 */
class AdaptiveMutationController {
  updateParameters(config: MutationConfig, performanceData: any): void {
    // Update mutation parameters based on performance
    if (performanceData.successRate < 0.3) {
      config.mutationRate *= 0.9; // Reduce mutation rate if success is low
    } else if (performanceData.successRate > 0.7) {
      config.mutationRate *= 1.1; // Increase if success is high
    }
    
    // Clamp values
    config.mutationRate = Math.max(0.05, Math.min(0.3, config.mutationRate));
  }
}

/**
 * MutationRiskAssessor - Assesses mutation risks
 */
class MutationRiskAssessor {
  assessRisk(agent: AdaptiveAgent, mutationType: string): number {
    // Assess risk for specific mutation type
    const riskMap: { [key: string]: number } = {
      gaussian: 0.3,
      uniform: 0.4,
      adaptive: 0.2,
      directional: 0.3,
      structural: 0.7,
      creative: 0.8
    };
    
    return riskMap[mutationType] || 0.5;
  }
}
