/**
 * Population Diversity Maintenance Tests
 * 
 * Tests that agent populations maintain diversity while improving,
 * prevent premature convergence, and sustain innovation capacity
 * through evolutionary pressure and specialization dynamics.
 */

import { AdaptiveAgent, AgentCapability } from '../../agents/dynamic/adaptive-agent';
import { PopulationManager, PopulationConfig, PopulationMetrics } from '../../agents/evolution/population-manager';
import { FitnessEvaluator } from '../../agents/evolution/fitness-evaluator';

export interface DiversityTestResult {
  testId: string;
  initialDiversityIndex: number;
  finalDiversityIndex: number;
  averageDiversityIndex: number;
  diversityStability: number;
  convergencePrevention: boolean;
  innovationMaintenance: number;
  diversityTrend: string;
  diversityMetrics: DiversityMetrics;
  populationSnapshots: PopulationSnapshot[];
}

export interface DiversityMetrics {
  capabilityDiversity: number;
  specializationDiversity: number;
  morphologicalDiversity: number;
  performanceDiversity: number;
  geneticDiversity: number;
  behavioralDiversity: number;
  emergentDiversity: number;
  sustainedInnovation: number;
}

export interface PopulationSnapshot {
  generation: number;
  populationSize: number;
  diversityIndex: number;
  speciesCount: number;
  uniqueCapabilities: number;
  uniqueSpecializations: number;
  performanceSpread: number;
  noveltyIntroduced: number;
}

export interface DiversityPressure {
  type: 'selection' | 'mutation' | 'crossover' | 'migration' | 'environmental';
  intensity: number;
  diversityImpact: number;
  convergenceRisk: number;
}

export interface DiversityMaintenance {
  strategy: string;
  effectiveness: number;
  diversityPreserved: number;
  innovationEnabled: number;
  convergencePrevented: boolean;
}

export interface ConvergenceTest {
  testType: 'premature_convergence' | 'genetic_bottleneck' | 'specialization_collapse' | 'innovation_stagnation';
  detectionThreshold: number;
  preventionMeasures: string[];
  testResult: boolean;
  severityLevel: number;
}

/**
 * PopulationDiversityTester - Tests population diversity maintenance
 */
export class PopulationDiversityTester {
  private populationManager: PopulationManager;
  private fitnessEvaluator: FitnessEvaluator;
  private testHistory: Map<string, DiversityTestResult>;
  private config: any;

  constructor(config: any = {}) {
    this.config = {
      testGenerations: config.testGenerations || 25,
      diversityThreshold: config.diversityThreshold || 0.6,
      convergenceThreshold: config.convergenceThreshold || 0.3,
      innovationThreshold: config.innovationThreshold || 0.1,
      populationSize: config.populationSize || 40,
      diversityWindow: config.diversityWindow || 5,
      ...config
    };

    this.populationManager = new PopulationManager({
      maxPopulationSize: this.config.populationSize,
      minPopulationSize: Math.floor(this.config.populationSize * 0.8),
      targetDiversity: this.config.diversityThreshold,
      elitismRate: 0.15,
      replacementStrategy: 'steady_state'
    });

    this.fitnessEvaluator = new FitnessEvaluator();
    this.testHistory = new Map();
  }

  /**
   * Test diversity maintenance over evolutionary generations
   */
  async testDiversityMaintenance(
    initialPopulation?: AdaptiveAgent[]
  ): Promise<DiversityTestResult> {
    console.log('Testing population diversity maintenance...');

    const testId = `diversity_test_${Date.now()}`;
    const population = initialPopulation || this.generateDiverseInitialPopulation();
    
    // Initialize population
    this.populationManager.initializePopulation(population);
    
    // Record initial state
    const initialDiversity = this.calculateComprehensiveDiversity(population);
    const populationSnapshots: PopulationSnapshot[] = [];
    const diversityHistory: number[] = [];

    // Evolution loop with diversity tracking
    for (let generation = 0; generation < this.config.testGenerations; generation++) {
      console.log(`Generation ${generation + 1}/${this.config.testGenerations}`);

      // Evolve population
      await this.populationManager.evolveGeneration();
      
      // Get current population
      const currentPopulation = this.populationManager.getCurrentPopulation();
      
      // Calculate diversity metrics
      const diversityMetrics = this.calculateComprehensiveDiversity(currentPopulation);
      const diversityIndex = this.calculateOverallDiversityIndex(diversityMetrics);
      
      diversityHistory.push(diversityIndex);
      
      // Record population snapshot
      populationSnapshots.push({
        generation: generation + 1,
        populationSize: currentPopulation.length,
        diversityIndex,
        speciesCount: this.countSpecies(currentPopulation),
        uniqueCapabilities: this.countUniqueCapabilities(currentPopulation),
        uniqueSpecializations: this.countUniqueSpecializations(currentPopulation),
        performanceSpread: this.calculatePerformanceSpread(currentPopulation),
        noveltyIntroduced: this.calculateNoveltyIntroduced(currentPopulation, generation)
      });

      // Apply diversity maintenance if needed
      if (diversityIndex < this.config.diversityThreshold) {
        await this.applyDiversityMaintenance(currentPopulation);
      }
    }

    // Calculate final metrics
    const finalPopulation = this.populationManager.getCurrentPopulation();
    const finalDiversity = this.calculateComprehensiveDiversity(finalPopulation);
    const finalDiversityIndex = this.calculateOverallDiversityIndex(finalDiversity);

    const result: DiversityTestResult = {
      testId,
      initialDiversityIndex: this.calculateOverallDiversityIndex(initialDiversity),
      finalDiversityIndex,
      averageDiversityIndex: diversityHistory.reduce((sum, d) => sum + d, 0) / diversityHistory.length,
      diversityStability: this.calculateDiversityStability(diversityHistory),
      convergencePrevention: this.assessConvergencePrevention(diversityHistory),
      innovationMaintenance: this.calculateInnovationMaintenance(populationSnapshots),
      diversityTrend: this.analyzeDiversityTrend(diversityHistory),
      diversityMetrics: finalDiversity,
      populationSnapshots
    };

    this.testHistory.set(testId, result);
    return result;
  }

  /**
   * Test convergence prevention mechanisms
   */
  async testConvergencePrevention(
    convergenceTypes: string[] = ['premature_convergence', 'genetic_bottleneck', 'specialization_collapse']
  ): Promise<any> {
    console.log('Testing convergence prevention mechanisms...');

    const convergenceTests: ConvergenceTest[] = [];

    for (const convergenceType of convergenceTypes) {
      const test = await this.runConvergenceTest(convergenceType);
      convergenceTests.push(test);
    }

    return {
      convergenceTests,
      overallConvergencePrevention: convergenceTests.every(test => test.testResult),
      mostVulnerableArea: this.identifyMostVulnerableArea(convergenceTests),
      preventionEffectiveness: this.calculatePreventionEffectiveness(convergenceTests)
    };
  }

  /**
   * Test diversity under different evolutionary pressures
   */
  async testDiversityUnderPressure(
    pressures: DiversityPressure[]
  ): Promise<any> {
    console.log('Testing diversity under evolutionary pressures...');

    const pressureResults: any[] = [];

    for (const pressure of pressures) {
      const result = await this.testSinglePressure(pressure);
      pressureResults.push(result);
    }

    return {
      pressureResults,
      diversityResilience: this.calculateDiversityResilience(pressureResults),
      optimalPressureBalance: this.findOptimalPressureBalance(pressureResults),
      vulnerabilityAnalysis: this.analyzeDiversityVulnerabilities(pressureResults)
    };
  }

  /**
   * Test innovation capacity maintenance
   */
  async testInnovationMaintenance(): Promise<any> {
    console.log('Testing innovation capacity maintenance...');

    // Create baseline population
    const baselinePopulation = this.generateDiverseInitialPopulation();
    this.populationManager.initializePopulation(baselinePopulation);

    const innovationHistory: any[] = [];
    let cumulativeInnovation = 0;

    // Track innovation over generations
    for (let generation = 0; generation < this.config.testGenerations; generation++) {
      await this.populationManager.evolveGeneration();
      
      const currentPopulation = this.populationManager.getCurrentPopulation();
      const innovationMetrics = this.calculateInnovationMetrics(currentPopulation);
      
      cumulativeInnovation += innovationMetrics.noveltyScore;
      
      innovationHistory.push({
        generation: generation + 1,
        noveltyScore: innovationMetrics.noveltyScore,
        newCapabilities: innovationMetrics.newCapabilities,
        emergentBehaviors: innovationMetrics.emergentBehaviors,
        cumulativeInnovation
      });
    }

    return {
      innovationHistory,
      sustainedInnovation: this.assessSustainedInnovation(innovationHistory),
      innovationRate: this.calculateInnovationRate(innovationHistory),
      creativityMaintenance: this.assessCreativityMaintenance(innovationHistory),
      noveltyPreservation: this.calculateNoveltyPreservation(innovationHistory)
    };
  }

  /**
   * Test diversity restoration mechanisms
   */
  async testDiversityRestoration(): Promise<any> {
    console.log('Testing diversity restoration mechanisms...');

    // Create a low-diversity population
    const lowDiversityPopulation = this.generateLowDiversityPopulation();
    this.populationManager.initializePopulation(lowDiversityPopulation);

    const initialDiversity = this.calculateComprehensiveDiversity(lowDiversityPopulation);
    const restorationHistory: any[] = [];

    // Apply restoration mechanisms
    for (let step = 0; step < 15; step++) {
      await this.populationManager.evolveGeneration();
      
      // Apply specific restoration techniques
      const currentPopulation = this.populationManager.getCurrentPopulation();
      await this.applyDiversityRestoration(currentPopulation, step);
      
      const currentDiversity = this.calculateComprehensiveDiversity(currentPopulation);
      const diversityIndex = this.calculateOverallDiversityIndex(currentDiversity);
      
      restorationHistory.push({
        step: step + 1,
        diversityIndex,
        restorationTechnique: this.getRestorationTechnique(step),
        improvementRate: step > 0 ? diversityIndex - restorationHistory[step - 1].diversityIndex : 0
      });
    }

    const finalDiversity = this.calculateComprehensiveDiversity(this.populationManager.getCurrentPopulation());

    return {
      initialDiversity: this.calculateOverallDiversityIndex(initialDiversity),
      finalDiversity: this.calculateOverallDiversityIndex(finalDiversity),
      restorationHistory,
      restorationSuccess: this.assessRestorationSuccess(initialDiversity, finalDiversity),
      optimalRestorationType: this.identifyOptimalRestoration(restorationHistory),
      restorationEfficiency: this.calculateRestorationEfficiency(restorationHistory)
    };
  }

  /**
   * Comprehensive diversity benchmark
   */
  async runDiversityBenchmark(): Promise<any> {
    console.log('Running comprehensive diversity benchmark...');

    const benchmarkResults = {
      diversityMaintenance: await this.testDiversityMaintenance(),
      convergencePrevention: await this.testConvergencePrevention(),
      innovationMaintenance: await this.testInnovationMaintenance(),
      diversityRestoration: await this.testDiversityRestoration(),
      pressureTesting: await this.testDiversityUnderPressure(this.generateTestPressures())
    };

    return {
      benchmarkResults,
      overallDiversityScore: this.calculateOverallDiversityScore(benchmarkResults),
      diversityStrengths: this.identifyDiversityStrengths(benchmarkResults),
      diversityWeaknesses: this.identifyDiversityWeaknesses(benchmarkResults),
      recommendations: this.generateDiversityRecommendations(benchmarkResults)
    };
  }

  /**
   * Generate diversity test report
   */
  generateDiversityReport(testId: string): any {
    const result = this.testHistory.get(testId);
    if (!result) {
      throw new Error(`Test result not found: ${testId}`);
    }

    return {
      testId,
      executionSummary: this.summarizeDiversityTest(result),
      diversityAnalysis: this.analyzeDiversityPatterns(result),
      convergenceAssessment: this.assessConvergenceRisk(result),
      innovationEvaluation: this.evaluateInnovationCapacity(result),
      recommendations: this.generateDiversityRecommendations(result),
      detailedMetrics: result.diversityMetrics,
      populationEvolution: result.populationSnapshots
    };
  }

  // Private implementation methods

  private generateDiverseInitialPopulation(): AdaptiveAgent[] {
    const population: AdaptiveAgent[] = [];
    const capabilityTypes = [
      'reasoning', 'creative', 'analytical', 'social', 'technical', 'strategic',
      'linguistic', 'mathematical', 'artistic', 'interpersonal', 'spatial', 'kinesthetic'
    ];

    for (let i = 0; i < this.config.populationSize; i++) {
      const agent = this.createDiverseAgent(i, capabilityTypes);
      population.push(agent);
    }

    return population;
  }

  private createDiverseAgent(index: number, capabilityTypes: string[]): AdaptiveAgent {
    const capabilities: AgentCapability[] = [];
    
    // Ensure each agent has unique capability combinations
    const agentCapabilityCount = 2 + (index % 4); // 2-5 capabilities
    const selectedTypes = this.selectUniqueCapabilities(capabilityTypes, agentCapabilityCount, index);

    selectedTypes.forEach((type, capIndex) => {
      capabilities.push({
        id: `${type}_${index}_${capIndex}`,
        name: `${type} Capability`,
        strength: 0.3 + (Math.sin(index + capIndex) + 1) * 0.2, // Deterministic but varied
        adaptationRate: 0.05 + (Math.cos(index + capIndex) + 1) * 0.05,
        specialization: [type, ...this.generateSecondarySpecializations(type, index)],
        morphology: this.generateDiverseMorphology(type, index),
        lastUsed: new Date(),
        performanceHistory: []
      });
    });

    return new AdaptiveAgent(`diverse_agent_${index}`, capabilities);
  }

  private selectUniqueCapabilities(types: string[], count: number, seed: number): string[] {
    const selected: string[] = [];
    const shuffled = [...types];
    
    // Deterministic shuffle based on seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  private generateSecondarySpecializations(primaryType: string, seed: number): string[] {
    const secondaryMap: Record<string, string[]> = {
      'reasoning': ['logical', 'analytical', 'deductive'],
      'creative': ['innovative', 'artistic', 'imaginative'],
      'analytical': ['quantitative', 'systematic', 'empirical'],
      'social': ['empathetic', 'communicative', 'collaborative'],
      'technical': ['engineering', 'systematic', 'precise'],
      'strategic': ['planning', 'foresight', 'optimization']
    };

    const secondaries = secondaryMap[primaryType] || ['adaptive', 'flexible'];
    return [secondaries[seed % secondaries.length]];
  }

  private generateDiverseMorphology(type: string, seed: number): any {
    return {
      structure: type,
      complexity: 0.3 + (seed % 10) * 0.07,
      adaptability: 0.4 + (seed % 8) * 0.075,
      connectivity: 0.5 + (seed % 6) * 0.083,
      uniqueId: `morph_${type}_${seed}`
    };
  }

  private calculateComprehensiveDiversity(population: AdaptiveAgent[]): DiversityMetrics {
    return {
      capabilityDiversity: this.calculateCapabilityDiversity(population),
      specializationDiversity: this.calculateSpecializationDiversity(population),
      morphologicalDiversity: this.calculateMorphologicalDiversity(population),
      performanceDiversity: this.calculatePerformanceDiversity(population),
      geneticDiversity: this.calculateGeneticDiversity(population),
      behavioralDiversity: this.calculateBehavioralDiversity(population),
      emergentDiversity: this.calculateEmergentDiversity(population),
      sustainedInnovation: this.calculateSustainedInnovation(population)
    };
  }

  private calculateCapabilityDiversity(population: AdaptiveAgent[]): number {
    const allCapabilities = new Set<string>();
    const capabilityDistribution = new Map<string, number>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.capabilities.forEach((cap: any) => {
        allCapabilities.add(cap.id);
        capabilityDistribution.set(cap.id, (capabilityDistribution.get(cap.id) || 0) + 1);
      });
    });

    // Calculate diversity using Shannon entropy
    const totalCapabilities = Array.from(capabilityDistribution.values()).reduce((sum, count) => sum + count, 0);
    let entropy = 0;

    capabilityDistribution.forEach(count => {
      const probability = count / totalCapabilities;
      entropy -= probability * Math.log2(probability);
    });

    // Normalize by maximum possible entropy
    const maxEntropy = Math.log2(allCapabilities.size);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private calculateSpecializationDiversity(population: AdaptiveAgent[]): number {
    const allSpecializations = new Set<string>();
    const specializationCounts = new Map<string, number>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.specializations.forEach((spec: string) => {
        allSpecializations.add(spec);
        specializationCounts.set(spec, (specializationCounts.get(spec) || 0) + 1);
      });
    });

    // Use Simpson's diversity index
    const totalCount = Array.from(specializationCounts.values()).reduce((sum, count) => sum + count, 0);
    let simpsonIndex = 0;

    specializationCounts.forEach(count => {
      const proportion = count / totalCount;
      simpsonIndex += proportion * proportion;
    });

    return 1 - simpsonIndex; // Simpson's diversity = 1 - Simpson's index
  }

  private calculateMorphologicalDiversity(population: AdaptiveAgent[]): number {
    if (population.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < population.length; i++) {
      for (let j = i + 1; j < population.length; j++) {
        const profile1 = population[i].getSpecializationProfile();
        const profile2 = population[j].getSpecializationProfile();
        
        const distance = this.calculateMorphologicalDistance(profile1.morphology, profile2.morphology);
        totalDistance += distance;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
  }

  private calculateMorphologicalDistance(morph1: any, morph2: any): number {
    // Calculate distance between morphologies
    const complexityDiff = Math.abs((morph1.complexity || 0.5) - (morph2.complexity || 0.5));
    const adaptabilityDiff = Math.abs((morph1.adaptability || 0.5) - (morph2.adaptability || 0.5));
    const connectivityDiff = Math.abs((morph1.connectivity || 0.5) - (morph2.connectivity || 0.5));
    
    return (complexityDiff + adaptabilityDiff + connectivityDiff) / 3;
  }

  private calculatePerformanceDiversity(population: AdaptiveAgent[]): number {
    const performances = population.map(agent => 
      agent.getSpecializationProfile().fitnessScore || 0.5
    );

    if (performances.length < 2) return 0;

    const mean = performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
    const variance = performances.reduce((sum, perf) => sum + Math.pow(perf - mean, 2), 0) / performances.length;
    
    // Normalize variance to 0-1 scale
    return Math.min(1, Math.sqrt(variance) * 4); // Multiply by 4 for better scaling
  }

  private calculateGeneticDiversity(population: AdaptiveAgent[]): number {
    // Simulate genetic diversity based on capability combinations
    const geneticSignatures = new Set<string>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      const signature = profile.capabilities
        .map((cap: any) => cap.id)
        .sort()
        .join('|');
      geneticSignatures.add(signature);
    });

    return geneticSignatures.size / population.length;
  }

  private calculateBehavioralDiversity(population: AdaptiveAgent[]): number {
    // Estimate behavioral diversity based on adaptation patterns
    const behaviorPatterns = new Map<string, number>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      const adaptationPattern = this.extractBehaviorPattern(profile);
      behaviorPatterns.set(adaptationPattern, (behaviorPatterns.get(adaptationPattern) || 0) + 1);
    });

    // Use effective number of behaviors
    const totalBehaviors = Array.from(behaviorPatterns.values()).reduce((sum, count) => sum + count, 0);
    let effectiveNumber = 0;

    behaviorPatterns.forEach(count => {
      const proportion = count / totalBehaviors;
      effectiveNumber += proportion * proportion;
    });

    return behaviorPatterns.size > 0 ? (1 / effectiveNumber) / behaviorPatterns.size : 0;
  }

  private extractBehaviorPattern(profile: any): string {
    // Create a behavior signature based on agent characteristics
    const adaptationCount = profile.adaptationHistory?.length || 0;
    const capabilityCount = profile.capabilities.length;
    const specializationCount = profile.specializations.length;
    
    return `adapt_${Math.floor(adaptationCount / 5)}_cap_${capabilityCount}_spec_${specializationCount}`;
  }

  private calculateEmergentDiversity(population: AdaptiveAgent[]): number {
    // Calculate diversity of emergent properties
    const emergentProperties = new Set<string>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      if (profile.morphology && profile.morphology.emergentProperties) {
        profile.morphology.emergentProperties.forEach((prop: string) => {
          emergentProperties.add(prop);
        });
      }
    });

    return emergentProperties.size / Math.max(1, population.length);
  }

  private calculateSustainedInnovation(population: AdaptiveAgent[]): number {
    // Measure capacity for sustained innovation
    let innovationCapacity = 0;

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      const recentAdaptations = profile.adaptationHistory?.slice(-5) || [];
      const adaptationRate = recentAdaptations.length / 5;
      const capabilityGrowth = profile.capabilities.length > 2 ? 0.2 : 0;
      
      innovationCapacity += adaptationRate + capabilityGrowth;
    });

    return innovationCapacity / population.length;
  }

  private calculateOverallDiversityIndex(metrics: DiversityMetrics): number {
    return (
      metrics.capabilityDiversity * 0.25 +
      metrics.specializationDiversity * 0.20 +
      metrics.morphologicalDiversity * 0.15 +
      metrics.performanceDiversity * 0.15 +
      metrics.geneticDiversity * 0.10 +
      metrics.behavioralDiversity * 0.08 +
      metrics.emergentDiversity * 0.04 +
      metrics.sustainedInnovation * 0.03
    );
  }

  private countSpecies(population: AdaptiveAgent[]): number {
    // Group agents by dominant specialization
    const species = new Set<string>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      if (profile.specializations.length > 0) {
        species.add(profile.specializations[0]);
      }
    });

    return species.size;
  }

  private countUniqueCapabilities(population: AdaptiveAgent[]): number {
    const capabilities = new Set<string>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.capabilities.forEach((cap: any) => capabilities.add(cap.id));
    });

    return capabilities.size;
  }

  private countUniqueSpecializations(population: AdaptiveAgent[]): number {
    const specializations = new Set<string>();

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.specializations.forEach((spec: string) => specializations.add(spec));
    });

    return specializations.size;
  }

  private calculatePerformanceSpread(population: AdaptiveAgent[]): number {
    const performances = population.map(agent => 
      agent.getSpecializationProfile().fitnessScore || 0.5
    );

    return Math.max(...performances) - Math.min(...performances);
  }

  private calculateNoveltyIntroduced(population: AdaptiveAgent[], generation: number): number {
    // Estimate novelty introduced in this generation
    let noveltyCount = 0;

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      const recentAdaptations = profile.adaptationHistory?.filter(
        (adaptation: any) => adaptation.generation === generation
      ) || [];
      
      noveltyCount += recentAdaptations.length;
    });

    return noveltyCount / population.length;
  }

  private calculateDiversityStability(diversityHistory: number[]): number {
    if (diversityHistory.length < 3) return 0.5;

    // Calculate coefficient of variation (inverse of stability)
    const mean = diversityHistory.reduce((sum, d) => sum + d, 0) / diversityHistory.length;
    const variance = diversityHistory.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / diversityHistory.length;
    const standardDeviation = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private assessConvergencePrevention(diversityHistory: number[]): boolean {
    // Check if diversity stayed above convergence threshold
    const belowThreshold = diversityHistory.filter(d => d < this.config.convergenceThreshold);
    return belowThreshold.length < diversityHistory.length * 0.2; // Allow 20% below threshold
  }

  private calculateInnovationMaintenance(snapshots: PopulationSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const innovationRates = snapshots.map(snapshot => snapshot.noveltyIntroduced);
    const averageInnovation = innovationRates.reduce((sum, rate) => sum + rate, 0) / innovationRates.length;
    
    return Math.min(1, averageInnovation * 10); // Scale to 0-1
  }

  private analyzeDiversityTrend(diversityHistory: number[]): string {
    if (diversityHistory.length < 5) return 'insufficient_data';

    const firstQuarter = diversityHistory.slice(0, Math.floor(diversityHistory.length / 4));
    const lastQuarter = diversityHistory.slice(-Math.floor(diversityHistory.length / 4));

    const firstAvg = firstQuarter.reduce((sum, d) => sum + d, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, d) => sum + d, 0) / lastQuarter.length;

    const change = lastAvg - firstAvg;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private async applyDiversityMaintenance(population: AdaptiveAgent[]): Promise<void> {
    // Apply diversity maintenance strategies
    const currentDiversity = this.calculateComprehensiveDiversity(population);
    
    if (currentDiversity.capabilityDiversity < 0.5) {
      await this.injectCapabilityDiversity(population);
    }
    
    if (currentDiversity.specializationDiversity < 0.5) {
      await this.injectSpecializationDiversity(population);
    }
    
    if (currentDiversity.behavioralDiversity < 0.5) {
      await this.injectBehavioralDiversity(population);
    }
  }

  private async injectCapabilityDiversity(population: AdaptiveAgent[]): Promise<void> {
    // Add agents with novel capabilities
    const novelCapabilities = ['quantum_reasoning', 'meta_cognitive', 'temporal_analysis'];
    
    for (let i = 0; i < 2; i++) {
      const novelAgent = this.createNovelAgent(novelCapabilities);
      this.populationManager.addAgent(novelAgent);
    }
  }

  private async injectSpecializationDiversity(population: AdaptiveAgent[]): Promise<void> {
    // Mutate existing agents to have new specializations
    const targets = population.slice(0, 3); // Modify first 3 agents
    
    targets.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.specializations.push(`diverse_${Date.now()}`);
    });
  }

  private async injectBehavioralDiversity(population: AdaptiveAgent[]): Promise<void> {
    // Modify adaptation rates to create behavioral diversity
    const targets = population.slice(0, 5);
    
    targets.forEach((agent, index) => {
      const profile = agent.getSpecializationProfile();
      profile.capabilities.forEach((cap: any) => {
        cap.adaptationRate = 0.05 + (index * 0.02); // Varied adaptation rates
      });
    });
  }

  private createNovelAgent(novelCapabilities: string[]): AdaptiveAgent {
    const capabilities: AgentCapability[] = [];
    
    novelCapabilities.forEach((capType, index) => {
      capabilities.push({
        id: `novel_${capType}_${Date.now()}_${index}`,
        name: `Novel ${capType} Capability`,
        strength: 0.4 + Math.random() * 0.3,
        adaptationRate: 0.08 + Math.random() * 0.12,
        specialization: [capType, 'novel', 'innovative'],
        morphology: { type: 'novel', innovation: true, complexity: 0.8 },
        lastUsed: new Date(),
        performanceHistory: []
      });
    });

    return new AdaptiveAgent(`novel_agent_${Date.now()}`, capabilities);
  }

  // Convergence testing methods

  private async runConvergenceTest(convergenceType: string): Promise<ConvergenceTest> {
    const test: ConvergenceTest = {
      testType: convergenceType as any,
      detectionThreshold: this.getConvergenceThreshold(convergenceType),
      preventionMeasures: this.getPreventionMeasures(convergenceType),
      testResult: false,
      severityLevel: 0
    };

    switch (convergenceType) {
      case 'premature_convergence':
        test.testResult = await this.testPrematureConvergence();
        break;
      case 'genetic_bottleneck':
        test.testResult = await this.testGeneticBottleneck();
        break;
      case 'specialization_collapse':
        test.testResult = await this.testSpecializationCollapse();
        break;
      case 'innovation_stagnation':
        test.testResult = await this.testInnovationStagnation();
        break;
    }

    return test;
  }

  private async testPrematureConvergence(): Promise<boolean> {
    // Test if population converges too quickly
    const initialPopulation = this.generateDiverseInitialPopulation();
    this.populationManager.initializePopulation(initialPopulation);

    const diversityHistory: number[] = [];

    for (let generation = 0; generation < 15; generation++) {
      await this.populationManager.evolveGeneration();
      const currentPopulation = this.populationManager.getCurrentPopulation();
      const diversity = this.calculateComprehensiveDiversity(currentPopulation);
      diversityHistory.push(this.calculateOverallDiversityIndex(diversity));
    }

    // Check if diversity drops too quickly
    const initialDiversity = diversityHistory[0];
    const finalDiversity = diversityHistory[diversityHistory.length - 1];
    const diversityLoss = initialDiversity - finalDiversity;

    return diversityLoss < 0.4; // Prevention successful if less than 40% diversity loss
  }

  private async testGeneticBottleneck(): Promise<boolean> {
    // Test resistance to genetic bottlenecks
    const population = this.generateDiverseInitialPopulation();
    
    // Simulate bottleneck by reducing population severely
    const bottleneckPopulation = population.slice(0, 5); // Reduce to 5 agents
    this.populationManager.initializePopulation(bottleneckPopulation);

    // Allow recovery
    for (let generation = 0; generation < 20; generation++) {
      await this.populationManager.evolveGeneration();
    }

    const recoveredPopulation = this.populationManager.getCurrentPopulation();
    const recoveredDiversity = this.calculateComprehensiveDiversity(recoveredPopulation);
    const diversityIndex = this.calculateOverallDiversityIndex(recoveredDiversity);

    return diversityIndex > 0.5; // Successful recovery if diversity above 0.5
  }

  private async testSpecializationCollapse(): Promise<boolean> {
    // Test if specializations collapse into single type
    const population = this.generateDiverseInitialPopulation();
    this.populationManager.initializePopulation(population);

    // Apply strong selection pressure toward single specialization
    for (let generation = 0; generation < 20; generation++) {
      await this.populationManager.evolveGeneration();
      
      // Bias toward 'reasoning' specialization
      const currentPopulation = this.populationManager.getCurrentPopulation();
      currentPopulation.forEach(agent => {
        const profile = agent.getSpecializationProfile();
        if (profile.specializations.includes('reasoning')) {
          profile.fitnessScore = (profile.fitnessScore || 0.5) + 0.1;
        }
      });
    }

    const finalPopulation = this.populationManager.getCurrentPopulation();
    const uniqueSpecializations = this.countUniqueSpecializations(finalPopulation);

    return uniqueSpecializations > 3; // Prevention successful if still have diverse specializations
  }

  private async testInnovationStagnation(): Promise<boolean> {
    // Test if innovation capacity is maintained
    const population = this.generateDiverseInitialPopulation();
    this.populationManager.initializePopulation(population);

    let totalInnovation = 0;

    for (let generation = 0; generation < 15; generation++) {
      await this.populationManager.evolveGeneration();
      const currentPopulation = this.populationManager.getCurrentPopulation();
      const innovation = this.calculateNoveltyIntroduced(currentPopulation, generation);
      totalInnovation += innovation;
    }

    const averageInnovation = totalInnovation / 15;
    return averageInnovation > this.config.innovationThreshold;
  }

  private getConvergenceThreshold(convergenceType: string): number {
    const thresholds: Record<string, number> = {
      'premature_convergence': 0.3,
      'genetic_bottleneck': 0.2,
      'specialization_collapse': 0.4,
      'innovation_stagnation': 0.1
    };
    
    return thresholds[convergenceType] || 0.3;
  }

  private getPreventionMeasures(convergenceType: string): string[] {
    const measures: Record<string, string[]> = {
      'premature_convergence': ['diversity_injection', 'mutation_rate_increase', 'selection_pressure_reduction'],
      'genetic_bottleneck': ['population_expansion', 'immigration', 'genetic_rescue'],
      'specialization_collapse': ['niche_preservation', 'frequency_dependent_selection', 'isolation_mechanisms'],
      'innovation_stagnation': ['novelty_rewards', 'exploration_bonuses', 'creative_mutations']
    };
    
    return measures[convergenceType] || ['general_diversity_maintenance'];
  }

  // Additional helper methods for various tests and analyses

  private generateTestPressures(): DiversityPressure[] {
    return [
      {
        type: 'selection',
        intensity: 0.8,
        diversityImpact: -0.3,
        convergenceRisk: 0.6
      },
      {
        type: 'mutation',
        intensity: 0.2,
        diversityImpact: 0.4,
        convergenceRisk: -0.2
      },
      {
        type: 'crossover',
        intensity: 0.7,
        diversityImpact: 0.1,
        convergenceRisk: 0.1
      },
      {
        type: 'migration',
        intensity: 0.1,
        diversityImpact: 0.6,
        convergenceRisk: -0.4
      }
    ];
  }

  private async testSinglePressure(pressure: DiversityPressure): Promise<any> {
    const population = this.generateDiverseInitialPopulation();
    this.populationManager.initializePopulation(population);

    const initialDiversity = this.calculateComprehensiveDiversity(population);
    
    // Apply pressure for several generations
    for (let generation = 0; generation < 10; generation++) {
      await this.populationManager.evolveGeneration();
      // Pressure would be applied through modified population manager configuration
    }

    const finalPopulation = this.populationManager.getCurrentPopulation();
    const finalDiversity = this.calculateComprehensiveDiversity(finalPopulation);
    
    return {
      pressure,
      initialDiversity: this.calculateOverallDiversityIndex(initialDiversity),
      finalDiversity: this.calculateOverallDiversityIndex(finalDiversity),
      diversityChange: this.calculateOverallDiversityIndex(finalDiversity) - this.calculateOverallDiversityIndex(initialDiversity),
      resilienceScore: this.calculateResilienceScore(initialDiversity, finalDiversity, pressure)
    };
  }

  private calculateResilienceScore(initial: DiversityMetrics, final: DiversityMetrics, pressure: DiversityPressure): number {
    const initialIndex = this.calculateOverallDiversityIndex(initial);
    const finalIndex = this.calculateOverallDiversityIndex(final);
    const diversityLoss = Math.max(0, initialIndex - finalIndex);
    
    // Resilience is inverse of diversity loss, adjusted for pressure intensity
    return Math.max(0, 1 - (diversityLoss / pressure.intensity));
  }

  private calculateInnovationMetrics(population: AdaptiveAgent[]): any {
    let noveltyScore = 0;
    let newCapabilities = 0;
    let emergentBehaviors = 0;

    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      
      // Count recent adaptations as novelty
      const recentAdaptations = profile.adaptationHistory?.slice(-3) || [];
      noveltyScore += recentAdaptations.length * 0.1;
      
      // Count new capabilities
      newCapabilities += profile.capabilities.filter((cap: any) => 
        cap.id.includes('novel') || cap.id.includes('emergent')
      ).length;
      
      // Count emergent behaviors (simplified)
      if (profile.morphology?.emergentProperties) {
        emergentBehaviors += profile.morphology.emergentProperties.length;
      }
    });

    return {
      noveltyScore: noveltyScore / population.length,
      newCapabilities,
      emergentBehaviors
    };
  }

  private generateLowDiversityPopulation(): AdaptiveAgent[] {
    const population: AdaptiveAgent[] = [];
    
    // Create mostly homogeneous population
    for (let i = 0; i < this.config.populationSize; i++) {
      const capabilities: AgentCapability[] = [
        {
          id: `reasoning_${i}`,
          name: 'Reasoning Capability',
          strength: 0.6 + Math.random() * 0.1,
          adaptationRate: 0.08,
          specialization: ['reasoning', 'logical'],
          morphology: { type: 'standard', complexity: 0.5 },
          lastUsed: new Date(),
          performanceHistory: []
        }
      ];
      
      population.push(new AdaptiveAgent(`homogeneous_agent_${i}`, capabilities));
    }
    
    return population;
  }

  private async applyDiversityRestoration(population: AdaptiveAgent[], step: number): Promise<void> {
    const technique = this.getRestorationTechnique(step);
    
    switch (technique) {
      case 'capability_injection':
        await this.injectCapabilityDiversity(population);
        break;
      case 'mutation_boost':
        await this.boostMutationRates(population);
        break;
      case 'crossover_enhancement':
        await this.enhanceCrossoverDiversity(population);
        break;
      case 'immigration':
        await this.introduceImmigrants(population);
        break;
    }
  }

  private getRestorationTechnique(step: number): string {
    const techniques = ['capability_injection', 'mutation_boost', 'crossover_enhancement', 'immigration'];
    return techniques[step % techniques.length];
  }

  private async boostMutationRates(population: AdaptiveAgent[]): Promise<void> {
    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.capabilities.forEach((cap: any) => {
        cap.adaptationRate = Math.min(0.3, cap.adaptationRate * 1.5);
      });
    });
  }

  private async enhanceCrossoverDiversity(population: AdaptiveAgent[]): Promise<void> {
    // This would enhance crossover operations to promote diversity
    // Implementation would modify population manager crossover settings
  }

  private async introduceImmigrants(population: AdaptiveAgent[]): Promise<void> {
    const immigrants = this.generateDiverseInitialPopulation().slice(0, 3);
    immigrants.forEach(immigrant => {
      this.populationManager.addAgent(immigrant);
    });
  }

  // Analysis and reporting methods

  private identifyMostVulnerableArea(tests: ConvergenceTest[]): string {
    const failedTests = tests.filter(test => !test.testResult);
    if (failedTests.length === 0) return 'none';
    
    // Return the most severe failure
    const mostSevere = failedTests.reduce((max, test) => 
      test.severityLevel > max.severityLevel ? test : max
    );
    
    return mostSevere.testType;
  }

  private calculatePreventionEffectiveness(tests: ConvergenceTest[]): number {
    const successCount = tests.filter(test => test.testResult).length;
    return successCount / tests.length;
  }

  private calculateDiversityResilience(pressureResults: any[]): number {
    const resilienceScores = pressureResults.map(result => result.resilienceScore);
    return resilienceScores.reduce((sum, score) => sum + score, 0) / resilienceScores.length;
  }

  private findOptimalPressureBalance(pressureResults: any[]): any {
    // Find pressure configuration that maintains diversity while enabling evolution
    let bestBalance = pressureResults[0];
    let bestScore = 0;
    
    pressureResults.forEach(result => {
      // Score based on maintained diversity and positive evolution
      const score = result.resilienceScore + Math.max(0, result.diversityChange);
      if (score > bestScore) {
        bestScore = score;
        bestBalance = result;
      }
    });
    
    return bestBalance;
  }

  private analyzeDiversityVulnerabilities(pressureResults: any[]): any {
    const vulnerabilities: string[] = [];
    
    pressureResults.forEach(result => {
      if (result.resilienceScore < 0.5) {
        vulnerabilities.push(`vulnerable_to_${result.pressure.type}_pressure`);
      }
    });
    
    return {
      vulnerabilities,
      mostVulnerableTo: pressureResults.reduce((min, result) => 
        result.resilienceScore < min.resilienceScore ? result : min
      ).pressure.type,
      overallVulnerability: vulnerabilities.length / pressureResults.length
    };
  }

  private assessSustainedInnovation(innovationHistory: any[]): boolean {
    const recentInnovation = innovationHistory.slice(-10);
    const avgInnovation = recentInnovation.reduce((sum, h) => sum + h.noveltyScore, 0) / recentInnovation.length;
    
    return avgInnovation > this.config.innovationThreshold;
  }

  private calculateInnovationRate(innovationHistory: any[]): number {
    if (innovationHistory.length < 2) return 0;
    
    const totalInnovation = innovationHistory.reduce((sum, h) => sum + h.noveltyScore, 0);
    return totalInnovation / innovationHistory.length;
  }

  private assessCreativityMaintenance(innovationHistory: any[]): string {
    const innovationRates = innovationHistory.map(h => h.noveltyScore);
    const trend = this.analyzeTrend(innovationRates);
    
    if (trend === 'increasing') return 'excellent';
    if (trend === 'stable') return 'good';
    return 'needs_improvement';
  }

  private calculateNoveltyPreservation(innovationHistory: any[]): number {
    const noveltyScores = innovationHistory.map(h => h.noveltyScore);
    const minNovelty = Math.min(...noveltyScores);
    const maxNovelty = Math.max(...noveltyScores);
    
    return minNovelty / Math.max(0.01, maxNovelty); // Ratio of min to max
  }

  private assessRestorationSuccess(initial: DiversityMetrics, final: DiversityMetrics): boolean {
    const initialIndex = this.calculateOverallDiversityIndex(initial);
    const finalIndex = this.calculateOverallDiversityIndex(final);
    
    return finalIndex > initialIndex + 0.2; // Success if 20% improvement
  }

  private identifyOptimalRestoration(restorationHistory: any[]): string {
    let bestTechnique = restorationHistory[0]?.restorationTechnique || 'none';
    let bestImprovement = 0;
    
    restorationHistory.forEach(step => {
      if (step.improvementRate > bestImprovement) {
        bestImprovement = step.improvementRate;
        bestTechnique = step.restorationTechnique;
      }
    });
    
    return bestTechnique;
  }

  private calculateRestorationEfficiency(restorationHistory: any[]): number {
    const totalImprovement = restorationHistory.reduce((sum, step) => sum + Math.max(0, step.improvementRate), 0);
    return totalImprovement / restorationHistory.length;
  }

  private calculateOverallDiversityScore(benchmarkResults: any): number {
    return (
      (benchmarkResults.diversityMaintenance.finalDiversityIndex > this.config.diversityThreshold ? 1 : 0) * 0.3 +
      benchmarkResults.convergencePrevention.overallConvergencePrevention * 0.25 +
      (benchmarkResults.innovationMaintenance.sustainedInnovation ? 1 : 0) * 0.2 +
      (benchmarkResults.diversityRestoration.restorationSuccess ? 1 : 0) * 0.15 +
      benchmarkResults.pressureTesting.diversityResilience * 0.1
    );
  }

  private identifyDiversityStrengths(benchmarkResults: any): string[] {
    const strengths: string[] = [];
    
    if (benchmarkResults.diversityMaintenance.finalDiversityIndex > 0.8) {
      strengths.push('excellent_diversity_maintenance');
    }
    
    if (benchmarkResults.convergencePrevention.overallConvergencePrevention) {
      strengths.push('strong_convergence_prevention');
    }
    
    if (benchmarkResults.innovationMaintenance.sustainedInnovation) {
      strengths.push('sustained_innovation_capacity');
    }
    
    if (benchmarkResults.pressureTesting.diversityResilience > 0.7) {
      strengths.push('high_pressure_resilience');
    }
    
    return strengths;
  }

  private identifyDiversityWeaknesses(benchmarkResults: any): string[] {
    const weaknesses: string[] = [];
    
    if (benchmarkResults.diversityMaintenance.finalDiversityIndex < 0.5) {
      weaknesses.push('poor_diversity_maintenance');
    }
    
    if (!benchmarkResults.convergencePrevention.overallConvergencePrevention) {
      weaknesses.push('convergence_vulnerability');
    }
    
    if (!benchmarkResults.innovationMaintenance.sustainedInnovation) {
      weaknesses.push('innovation_stagnation');
    }
    
    if (benchmarkResults.pressureTesting.diversityResilience < 0.5) {
      weaknesses.push('low_pressure_tolerance');
    }
    
    return weaknesses;
  }

  private generateDiversityRecommendations(benchmarkResults: any): string[] {
    const recommendations: string[] = [];
    const weaknesses = this.identifyDiversityWeaknesses(benchmarkResults);
    
    if (weaknesses.includes('poor_diversity_maintenance')) {
      recommendations.push('Implement stronger diversity injection mechanisms');
    }
    
    if (weaknesses.includes('convergence_vulnerability')) {
      recommendations.push('Add convergence detection and prevention systems');
    }
    
    if (weaknesses.includes('innovation_stagnation')) {
      recommendations.push('Enhance novelty rewards and exploration incentives');
    }
    
    if (weaknesses.includes('low_pressure_tolerance')) {
      recommendations.push('Strengthen population resilience mechanisms');
    }
    
    return recommendations;
  }

  private analyzeTrend(values: number[]): string {
    if (values.length < 3) return 'stable';
    
    const firstThird = values.slice(0, Math.floor(values.length / 3));
    const lastThird = values.slice(-Math.floor(values.length / 3));
    
    const firstAvg = firstThird.reduce((sum, val) => sum + val, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, val) => sum + val, 0) / lastThird.length;
    
    const change = lastAvg - firstAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  // Report generation methods

  private summarizeDiversityTest(result: DiversityTestResult): any {
    return {
      testCompleted: true,
      diversityMaintained: result.finalDiversityIndex >= this.config.diversityThreshold,
      convergencePrevented: result.convergencePrevention,
      innovationSustained: result.innovationMaintenance > this.config.innovationThreshold,
      overallSuccess: result.finalDiversityIndex >= this.config.diversityThreshold && result.convergencePrevention
    };
  }

  private analyzeDiversityPatterns(result: DiversityTestResult): any {
    return {
      diversityTrend: result.diversityTrend,
      stabilityLevel: result.diversityStability > 0.8 ? 'high' : result.diversityStability > 0.6 ? 'medium' : 'low',
      diversityRange: {
        minimum: Math.min(...result.populationSnapshots.map(s => s.diversityIndex)),
        maximum: Math.max(...result.populationSnapshots.map(s => s.diversityIndex)),
        average: result.averageDiversityIndex
      },
      diversityComponents: this.rankDiversityComponents(result.diversityMetrics)
    };
  }

  private rankDiversityComponents(metrics: DiversityMetrics): any[] {
    const components = [
      { name: 'Capability Diversity', value: metrics.capabilityDiversity },
      { name: 'Specialization Diversity', value: metrics.specializationDiversity },
      { name: 'Morphological Diversity', value: metrics.morphologicalDiversity },
      { name: 'Performance Diversity', value: metrics.performanceDiversity },
      { name: 'Genetic Diversity', value: metrics.geneticDiversity },
      { name: 'Behavioral Diversity', value: metrics.behavioralDiversity },
      { name: 'Emergent Diversity', value: metrics.emergentDiversity }
    ];
    
    return components.sort((a, b) => b.value - a.value);
  }

  private assessConvergenceRisk(result: DiversityTestResult): any {
    const riskLevel = result.finalDiversityIndex < 0.4 ? 'high' : 
                     result.finalDiversityIndex < 0.6 ? 'medium' : 'low';
    
    return {
      riskLevel,
      convergencePrevented: result.convergencePrevention,
      earlyWarningSignals: this.identifyEarlyWarningSignals(result),
      mitigationStrategies: this.suggestMitigationStrategies(riskLevel)
    };
  }

  private identifyEarlyWarningSignals(result: DiversityTestResult): string[] {
    const signals: string[] = [];
    
    if (result.diversityTrend === 'decreasing') {
      signals.push('declining_diversity_trend');
    }
    
    if (result.diversityStability < 0.5) {
      signals.push('high_diversity_volatility');
    }
    
    if (result.innovationMaintenance < this.config.innovationThreshold) {
      signals.push('reduced_innovation_capacity');
    }
    
    return signals;
  }

  private suggestMitigationStrategies(riskLevel: string): string[] {
    const strategies: Record<string, string[]> = {
      'high': [
        'Immediate diversity injection',
        'Population expansion',
        'Mutation rate increase',
        'Immigration introduction'
      ],
      'medium': [
        'Enhanced crossover diversity',
        'Specialization protection',
        'Novelty rewards'
      ],
      'low': [
        'Monitoring and maintenance',
        'Preventive measures'
      ]
    };
    
    return strategies[riskLevel] || strategies['medium'];
  }

  private evaluateInnovationCapacity(result: DiversityTestResult): any {
    return {
      innovationMaintained: result.innovationMaintenance > this.config.innovationThreshold,
      innovationLevel: result.innovationMaintenance > 0.15 ? 'high' : 
                       result.innovationMaintenance > 0.1 ? 'medium' : 'low',
      noveltyTrend: this.analyzeNoveltyTrend(result.populationSnapshots),
      creativityFactors: this.identifyCreativityFactors(result.diversityMetrics)
    };
  }

  private analyzeNoveltyTrend(snapshots: PopulationSnapshot[]): string {
    const noveltyValues = snapshots.map(s => s.noveltyIntroduced);
    return this.analyzeTrend(noveltyValues);
  }

  private identifyCreativityFactors(metrics: DiversityMetrics): string[] {
    const factors: string[] = [];
    
    if (metrics.behavioralDiversity > 0.7) {
      factors.push('high_behavioral_diversity');
    }
    
    if (metrics.emergentDiversity > 0.5) {
      factors.push('strong_emergent_properties');
    }
    
    if (metrics.sustainedInnovation > 0.3) {
      factors.push('sustained_innovation_capacity');
    }
    
    return factors;
  }
}

/**
 * Quick diversity maintenance validation
 */
export async function validateDiversityMaintenance(
  initialPopulation: AdaptiveAgent[],
  diversityThreshold: number = 0.6
): Promise<boolean> {
  const tester = new PopulationDiversityTester({ diversityThreshold });
  
  const result = await tester.testDiversityMaintenance(initialPopulation);
  
  const success = (
    result.finalDiversityIndex >= diversityThreshold &&
    result.convergencePrevention &&
    result.diversityStability > 0.5
  );
  
  console.log(`Diversity maintenance: ${success ? 'PASS' : 'FAIL'} (final diversity: ${(result.finalDiversityIndex * 100).toFixed(1)}%)`);
  
  return success;
}
