/**
 * Population Manager - Agent population dynamics system
 * 
 * Manages agent populations including selection, reproduction, replacement,
 * diversity maintenance, and population-level evolution strategies.
 * Implements various population management algorithms for optimal evolution.
 */

import { AdaptiveAgent, AgentCapability, AdaptationContext } from '../dynamic/adaptive-agent';
import { FitnessProfile, FitnessEvaluator, FitnessContext } from './fitness-evaluator';
import { CrossoverManager, CrossoverResult } from './crossover-operators';
import { MutationManager, MutationResult } from './mutation-strategies';

export interface PopulationConfig {
  maxPopulationSize: number;
  minPopulationSize: number;
  targetDiversity: number;
  elitismRate: number;
  migrationRate: number;
  speciesThreshold: number;
  agingEnabled: boolean;
  maxAgentAge: number;
  selectionPressure: number;
  replacementStrategy: 'generational' | 'steady_state' | 'elite_preserve' | 'island_model';
}

export interface PopulationMetrics {
  size: number;
  averageFitness: number;
  fitnessVariance: number;
  diversityIndex: number;
  speciesCount: number;
  averageAge: number;
  evolutionRate: number;
  stagnationLevel: number;
}

export interface SelectionResult {
  selectedAgents: AdaptiveAgent[];
  selectionPressure: number;
  diversityPreserved: number;
  eliteCount: number;
  methodology: string;
}

export interface PopulationEvolutionResult {
  newPopulation: AdaptiveAgent[];
  generationNumber: number;
  evolutionMetrics: PopulationMetrics;
  improvements: any[];
  extinctions: string[];
  emergentSpecies: any[];
  performanceGains: number;
}

export interface Species {
  id: string;
  representative: AdaptiveAgent;
  members: AdaptiveAgent[];
  averageFitness: number;
  fitnessHistory: number[];
  stagnationCount: number;
  speciesAge: number;
  extinctionRisk: number;
}

export interface Migration {
  sourcePopulation: string;
  targetPopulation: string;
  migrants: AdaptiveAgent[];
  migrationRate: number;
  selectionCriteria: string;
}

export interface PopulationAnalysis {
  fitnessDistribution: any;
  diversityAnalysis: any;
  speciesAnalysis: Species[];
  evolutionTrends: any;
  bottlenecks: string[];
  opportunities: string[];
  recommendations: string[];
}

/**
 * PopulationManager - Manages agent population dynamics
 */
export class PopulationManager {
  private config: PopulationConfig;
  private currentPopulation: AdaptiveAgent[];
  private populationHistory: AdaptiveAgent[][];
  private speciesManager: SpeciesManager;
  private fitnessEvaluator: FitnessEvaluator;
  private crossoverManager: CrossoverManager;
  private mutationManager: MutationManager;
  private diversityMaintainer: DiversityMaintainer;
  private selectionManager: SelectionManager;
  private generationCount: number;
  private populationMetrics: PopulationMetrics[];

  constructor(config: any = {}) {
    this.config = {
      maxPopulationSize: config.maxPopulationSize || 100,
      minPopulationSize: config.minPopulationSize || 20,
      targetDiversity: config.targetDiversity || 0.7,
      elitismRate: config.elitismRate || 0.1,
      migrationRate: config.migrationRate || 0.05,
      speciesThreshold: config.speciesThreshold || 0.6,
      agingEnabled: config.agingEnabled || true,
      maxAgentAge: config.maxAgentAge || 50,
      selectionPressure: config.selectionPressure || 2.0,
      replacementStrategy: config.replacementStrategy || 'steady_state',
      ...config
    };

    this.currentPopulation = [];
    this.populationHistory = [];
    this.generationCount = 0;
    this.populationMetrics = [];

    // Initialize managers
    this.speciesManager = new SpeciesManager(this.config);
    this.fitnessEvaluator = new FitnessEvaluator(config.fitness || {});
    this.crossoverManager = new CrossoverManager(config.crossover || {});
    this.mutationManager = new MutationManager(config.mutation || {});
    this.diversityMaintainer = new DiversityMaintainer(this.config);
    this.selectionManager = new SelectionManager(this.config);
  }

  /**
   * Initialize population with seed agents
   */
  initializePopulation(seedAgents: AdaptiveAgent[] = []): void {
    this.currentPopulation = [...seedAgents];
    
    // Fill population to minimum size if needed
    while (this.currentPopulation.length < this.config.minPopulationSize) {
      const randomAgent = this.createRandomAgent();
      this.currentPopulation.push(randomAgent);
    }
    
    // Initialize species
    this.speciesManager.initializeSpecies(this.currentPopulation);
    
    // Record initial state
    this.recordPopulationState();
  }

  /**
   * Evolve population for one generation
   */
  async evolveGeneration(context?: AdaptationContext): Promise<PopulationEvolutionResult> {
    // 1. Evaluate fitness of current population
    await this.evaluatePopulationFitness(context);
    
    // 2. Update species
    this.speciesManager.updateSpecies(this.currentPopulation);
    
    // 3. Selection
    const selectionResult = await this.selectParents();
    
    // 4. Reproduction (crossover and mutation)
    const offspring = await this.reproduce(selectionResult.selectedAgents, context);
    
    // 5. Population replacement
    const newPopulation = await this.replacePopulation(offspring);
    
    // 6. Aging and lifecycle management
    if (this.config.agingEnabled) {
      this.manageAgentLifecycle(newPopulation);
    }
    
    // 7. Diversity maintenance
    await this.maintainDiversity(newPopulation);
    
    // 8. Update population
    this.currentPopulation = newPopulation;
    this.generationCount++;
    
    // 9. Record evolution results
    const result = await this.recordEvolutionResults();
    
    return result;
  }

  /**
   * Run multi-generation evolution
   */
  async evolveMultipleGenerations(
    generations: number,
    context?: AdaptationContext
  ): Promise<PopulationEvolutionResult[]> {
    const results: PopulationEvolutionResult[] = [];
    
    for (let i = 0; i < generations; i++) {
      const result = await this.evolveGeneration(context);
      results.push(result);
      
      // Check for convergence or stagnation
      if (this.checkConvergence() || this.checkStagnation()) {
        console.log(`Evolution stopped at generation ${i + 1} due to convergence/stagnation`);
        break;
      }
    }
    
    return results;
  }

  /**
   * Add agent to population
   */
  addAgent(agent: AdaptiveAgent): boolean {
    if (this.currentPopulation.length >= this.config.maxPopulationSize) {
      return this.tryReplaceWeakestAgent(agent);
    }
    
    this.currentPopulation.push(agent);
    this.speciesManager.assignToSpecies(agent, this.currentPopulation);
    return true;
  }

  /**
   * Remove agent from population
   */
  removeAgent(agentId: string): boolean {
    const index = this.currentPopulation.findIndex(
      agent => agent.getSpecializationProfile().id === agentId
    );
    
    if (index >= 0) {
      const removedAgent = this.currentPopulation.splice(index, 1)[0];
      this.speciesManager.removeFromSpecies(removedAgent);
      return true;
    }
    
    return false;
  }

  /**
   * Get population statistics
   */
  getPopulationMetrics(): PopulationMetrics {
    return this.calculatePopulationMetrics();
  }

  /**
   * Get best agents in population
   */
  getBestAgents(count: number = 10): AdaptiveAgent[] {
    const sortedAgents = [...this.currentPopulation].sort((a, b) => {
      const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
      const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
      return fitnessB - fitnessA;
    });
    
    return sortedAgents.slice(0, count);
  }

  /**
   * Analyze population characteristics
   */
  analyzePopulation(): PopulationAnalysis {
    return {
      fitnessDistribution: this.analyzeFitnessDistribution(),
      diversityAnalysis: this.analyzeDiversity(),
      speciesAnalysis: this.speciesManager.getSpeciesAnalysis(),
      evolutionTrends: this.analyzeEvolutionTrends(),
      bottlenecks: this.identifyBottlenecks(),
      opportunities: this.identifyOpportunities(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Perform population migration
   */
  async migrateAgents(
    targetPopulation: PopulationManager,
    migrationCount?: number
  ): Promise<Migration> {
    const count = migrationCount || Math.floor(this.currentPopulation.length * this.config.migrationRate);
    
    // Select migrants (typically high-fitness individuals)
    const migrants = this.selectMigrants(count);
    
    // Add migrants to target population
    const successfulMigrations = migrants.filter(migrant => targetPopulation.addAgent(migrant));
    
    // Remove migrants from source population
    successfulMigrations.forEach(migrant => {
      this.removeAgent(migrant.getSpecializationProfile().id);
    });
    
    return {
      sourcePopulation: 'current',
      targetPopulation: 'target',
      migrants: successfulMigrations,
      migrationRate: successfulMigrations.length / this.currentPopulation.length,
      selectionCriteria: 'fitness_based'
    };
  }

  /**
   * Get current population
   */
  getCurrentPopulation(): AdaptiveAgent[] {
    return [...this.currentPopulation];
  }

  /**
   * Get population history
   */
  getPopulationHistory(): AdaptiveAgent[][] {
    return this.populationHistory;
  }

  /**
   * Assess population diversity (alias for getPopulationMetrics)
   */
  async assessPopulationDiversity(): Promise<any> {
    const metrics = this.getPopulationMetrics();
    return {
      overallDiversity: metrics.diversityIndex,
      speciesCount: metrics.speciesCount,
      fitnessVariance: metrics.fitnessVariance,
      populationSize: metrics.size,
      averageFitness: metrics.averageFitness,
      diversityBreakdown: this.analyzeDiversity()
    };
  }

  /**
   * Evolve population for specified number of generations
   */
  async evolvePopulation(generations: number, context?: AdaptationContext): Promise<any> {
    const results = await this.evolveMultipleGenerations(generations, context);
    
    return {
      success: results.length > 0,
      generationsCompleted: results.length,
      finalMetrics: results.length > 0 ? results[results.length - 1].evolutionMetrics : null,
      overallImprovement: this.calculateOverallImprovement(results),
      evolutionHistory: results
    };
  }

  private calculateOverallImprovement(results: PopulationEvolutionResult[]): number {
    if (results.length === 0) return 0;
    
    const initialFitness = results[0].evolutionMetrics.averageFitness;
    const finalFitness = results[results.length - 1].evolutionMetrics.averageFitness;
    
    return finalFitness - initialFitness;
  }
  resetPopulation(): void {
    this.currentPopulation = [];
    this.populationHistory = [];
    this.generationCount = 0;
    this.populationMetrics = [];
    this.speciesManager.reset();
  }

  // Private implementation methods

  private async evaluatePopulationFitness(context?: AdaptationContext): Promise<void> {
    const fitnessContext: FitnessContext = {
      taskDomain: context?.domain || 'general',
      complexityLevel: context?.complexity || 0.5,
      timeConstraints: context?.timeConstraints || 1000,
      resourceLimitations: {},
      collaborationRequirements: 0.5,
      adaptationPressure: 0.6,
      innovationDemand: 0.4,
      stabilityRequirement: 0.7
    };

    // Evaluate fitness for each agent
    for (const agent of this.currentPopulation) {
      const fitness = await this.fitnessEvaluator.evaluateFitness(agent, fitnessContext);
      this.updateAgentFitness(agent, fitness);
    }
  }

  private updateAgentFitness(agent: AdaptiveAgent, fitness: FitnessProfile): void {
    // Update agent's fitness score
    const profile = agent.getSpecializationProfile();
    profile.fitnessScore = fitness.overall;
    
    // Store fitness details (would extend agent profile to include this)
    profile.detailedFitness = fitness;
  }

  private async selectParents(): Promise<SelectionResult> {
    return this.selectionManager.selectParents(
      this.currentPopulation,
      Math.floor(this.currentPopulation.length * 0.6) // Select 60% as parents
    );
  }

  private async reproduce(
    parents: AdaptiveAgent[],
    context?: AdaptationContext
  ): Promise<AdaptiveAgent[]> {
    const offspring: AdaptiveAgent[] = [];
    
    // Crossover operations
    const crossoverPairs = this.generateCrossoverPairs(parents);
    for (const [parent1, parent2] of crossoverPairs) {
      try {
        const crossoverResult = await this.crossoverManager.performCrossover(parent1, parent2, context);
        offspring.push(crossoverResult.offspring1, crossoverResult.offspring2);
      } catch (error) {
        console.warn('Crossover failed:', error);
      }
    }
    
    // Mutation operations
    const mutationResults = await this.mutationManager.mutatePopulation(offspring, context);
    const mutatedOffspring = mutationResults.map(result => result.mutatedAgent);
    
    return [...offspring, ...mutatedOffspring];
  }

  private generateCrossoverPairs(parents: AdaptiveAgent[]): [AdaptiveAgent, AdaptiveAgent][] {
    const pairs: [AdaptiveAgent, AdaptiveAgent][] = [];
    
    // Random pairing with fitness-based probability
    for (let i = 0; i < parents.length - 1; i += 2) {
      pairs.push([parents[i], parents[i + 1]]);
    }
    
    return pairs;
  }

  private async replacePopulation(offspring: AdaptiveAgent[]): Promise<AdaptiveAgent[]> {
    switch (this.config.replacementStrategy) {
      case 'generational':
        return this.generationalReplacement(offspring);
      case 'steady_state':
        return this.steadyStateReplacement(offspring);
      case 'elite_preserve':
        return this.elitePreserveReplacement(offspring);
      case 'island_model':
        return this.islandModelReplacement(offspring);
      default:
        return this.steadyStateReplacement(offspring);
    }
  }

  private generationalReplacement(offspring: AdaptiveAgent[]): AdaptiveAgent[] {
    // Replace entire population except elite
    const eliteCount = Math.floor(this.currentPopulation.length * this.config.elitismRate);
    const elite = this.getBestAgents(eliteCount);
    
    // Combine elite with best offspring
    const combinedPopulation = [...elite, ...offspring];
    combinedPopulation.sort((a, b) => {
      const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
      const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
      return fitnessB - fitnessA;
    });
    
    return combinedPopulation.slice(0, this.config.maxPopulationSize);
  }

  private steadyStateReplacement(offspring: AdaptiveAgent[]): AdaptiveAgent[] {
    // Replace worst individuals with best offspring
    const combinedPopulation = [...this.currentPopulation, ...offspring];
    combinedPopulation.sort((a, b) => {
      const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
      const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
      return fitnessB - fitnessA;
    });
    
    return combinedPopulation.slice(0, this.config.maxPopulationSize);
  }

  private elitePreserveReplacement(offspring: AdaptiveAgent[]): AdaptiveAgent[] {
    // Always preserve top performers
    const eliteCount = Math.floor(this.currentPopulation.length * this.config.elitismRate);
    const elite = this.getBestAgents(eliteCount);
    
    // Fill remaining slots with diverse individuals
    const remaining = [...this.currentPopulation, ...offspring].filter(
      agent => !elite.includes(agent)
    );
    
    const diverseSelection = this.diversityMaintainer.selectDiverseAgents(
      remaining,
      this.config.maxPopulationSize - eliteCount
    );
    
    return [...elite, ...diverseSelection];
  }

  private islandModelReplacement(offspring: AdaptiveAgent[]): AdaptiveAgent[] {
    // Island model with species-based replacement
    return this.speciesManager.performSpeciesBasedReplacement(
      this.currentPopulation,
      offspring,
      this.config.maxPopulationSize
    );
  }

  private manageAgentLifecycle(population: AdaptiveAgent[]): void {
    // Age agents and remove those exceeding max age
    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.age = (profile.age || 0) + 1;
      
      // Mark for removal if too old and not elite
      if (profile.age > this.config.maxAgentAge) {
        const isElite = this.getBestAgents(Math.floor(population.length * this.config.elitismRate))
          .includes(agent);
        
        if (!isElite) {
          profile.markedForRemoval = true;
        }
      }
    });
    
    // Remove aged agents
    const survivingAgents = population.filter(agent => 
      !agent.getSpecializationProfile().markedForRemoval
    );
    
    // Replace removed agents with new random agents if needed
    while (survivingAgents.length < this.config.minPopulationSize) {
      survivingAgents.push(this.createRandomAgent());
    }
    
    population.splice(0, population.length, ...survivingAgents);
  }

  private async maintainDiversity(population: AdaptiveAgent[]): Promise<void> {
    const currentDiversity = this.calculateDiversityIndex(population);
    
    if (currentDiversity < this.config.targetDiversity) {
      // Inject diversity
      await this.diversityMaintainer.injectDiversity(
        population,
        this.config.targetDiversity - currentDiversity
      );
    }
  }

  private calculatePopulationMetrics(): PopulationMetrics {
    const fitnesses = this.currentPopulation.map(agent => 
      agent.getSpecializationProfile().fitnessScore || 0
    );
    
    const averageFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
    const fitnessVariance = this.calculateVariance(fitnesses);
    const diversityIndex = this.calculateDiversityIndex(this.currentPopulation);
    const speciesCount = this.speciesManager.getSpeciesCount();
    
    const ages = this.currentPopulation.map(agent => 
      agent.getSpecializationProfile().age || 0
    );
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    
    return {
      size: this.currentPopulation.length,
      averageFitness,
      fitnessVariance,
      diversityIndex,
      speciesCount,
      averageAge,
      evolutionRate: this.calculateEvolutionRate(),
      stagnationLevel: this.calculateStagnationLevel()
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateDiversityIndex(population: AdaptiveAgent[]): number {
    return this.diversityMaintainer.calculateDiversityIndex(population);
  }

  private calculateEvolutionRate(): number {
    if (this.populationMetrics.length < 2) return 0;
    
    const current = this.populationMetrics[this.populationMetrics.length - 1];
    const previous = this.populationMetrics[this.populationMetrics.length - 2];
    
    return current.averageFitness - previous.averageFitness;
  }

  private calculateStagnationLevel(): number {
    if (this.populationMetrics.length < 5) return 0;
    
    const recentMetrics = this.populationMetrics.slice(-5);
    const fitnessChanges = recentMetrics.slice(1).map((metric, index) => 
      metric.averageFitness - recentMetrics[index].averageFitness
    );
    
    const avgChange = fitnessChanges.reduce((sum, change) => sum + Math.abs(change), 0) / fitnessChanges.length;
    return Math.max(0, 1 - (avgChange * 10)); // Normalize stagnation level
  }

  private createRandomAgent(): AdaptiveAgent {
    const capabilities: AgentCapability[] = [];
    const capabilityTypes = ['reasoning', 'creative', 'analytical', 'social', 'technical'];
    
    // Create 2-5 random capabilities
    const capabilityCount = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < capabilityCount; i++) {
      const type = capabilityTypes[Math.floor(Math.random() * capabilityTypes.length)];
      
      capabilities.push({
        id: `${type}_${Date.now()}_${Math.random()}`,
        name: `${type} Capability`,
        strength: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
        adaptationRate: 0.05 + Math.random() * 0.1, // 0.05 to 0.15
        specialization: [type],
        morphology: { type: 'random', created: new Date() },
        lastUsed: new Date(),
        performanceHistory: []
      });
    }
    
    return new AdaptiveAgent(
      `random_${Date.now()}_${Math.random()}`,
      capabilities
    );
  }

  private recordPopulationState(): void {
    this.populationHistory.push([...this.currentPopulation]);
    this.populationMetrics.push(this.calculatePopulationMetrics());
    
    // Maintain history size
    if (this.populationHistory.length > 100) {
      this.populationHistory = this.populationHistory.slice(-100);
      this.populationMetrics = this.populationMetrics.slice(-100);
    }
  }

  private async recordEvolutionResults(): Promise<PopulationEvolutionResult> {
    const currentMetrics = this.calculatePopulationMetrics();
    const previousMetrics = this.populationMetrics[this.populationMetrics.length - 1];
    
    this.recordPopulationState();
    
    return {
      newPopulation: [...this.currentPopulation],
      generationNumber: this.generationCount,
      evolutionMetrics: currentMetrics,
      improvements: this.identifyImprovements(previousMetrics, currentMetrics),
      extinctions: this.speciesManager.getRecentExtinctions(),
      emergentSpecies: this.speciesManager.getEmergentSpecies(),
      performanceGains: currentMetrics.averageFitness - (previousMetrics?.averageFitness || 0)
    };
  }

  private identifyImprovements(previous: PopulationMetrics | undefined, current: PopulationMetrics): any[] {
    if (!previous) return [];
    
    const improvements = [];
    
    if (current.averageFitness > previous.averageFitness) {
      improvements.push({
        type: 'fitness_improvement',
        magnitude: current.averageFitness - previous.averageFitness
      });
    }
    
    if (current.diversityIndex > previous.diversityIndex) {
      improvements.push({
        type: 'diversity_increase',
        magnitude: current.diversityIndex - previous.diversityIndex
      });
    }
    
    return improvements;
  }

  private checkConvergence(): boolean {
    if (this.populationMetrics.length < 10) return false;
    
    const recent = this.populationMetrics.slice(-10);
    const fitnessVariance = this.calculateVariance(recent.map(m => m.averageFitness));
    
    return fitnessVariance < 0.001; // Very low variance indicates convergence
  }

  private checkStagnation(): boolean {
    if (this.populationMetrics.length < 20) return false;
    
    const currentMetrics = this.populationMetrics[this.populationMetrics.length - 1];
    return currentMetrics.stagnationLevel > 0.9;
  }

  private tryReplaceWeakestAgent(newAgent: AdaptiveAgent): boolean {
    // Find weakest agent
    let weakestAgent = this.currentPopulation[0];
    let weakestFitness = weakestAgent.getSpecializationProfile().fitnessScore || 0;
    
    for (const agent of this.currentPopulation) {
      const fitness = agent.getSpecializationProfile().fitnessScore || 0;
      if (fitness < weakestFitness) {
        weakestFitness = fitness;
        weakestAgent = agent;
      }
    }
    
    // Replace if new agent is better
    const newAgentFitness = newAgent.getSpecializationProfile().fitnessScore || 0;
    if (newAgentFitness > weakestFitness) {
      const index = this.currentPopulation.indexOf(weakestAgent);
      this.currentPopulation[index] = newAgent;
      this.speciesManager.assignToSpecies(newAgent, this.currentPopulation);
      return true;
    }
    
    return false;
  }

  private selectMigrants(count: number): AdaptiveAgent[] {
    // Select high-fitness, diverse agents for migration
    const candidates = [...this.currentPopulation];
    candidates.sort((a, b) => {
      const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
      const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
      return fitnessB - fitnessA;
    });
    
    // Select top performers with diversity consideration
    const migrants: AdaptiveAgent[] = [];
    
    for (const candidate of candidates) {
      if (migrants.length >= count) break;
      
      const isDiverse = this.diversityMaintainer.isAgentDiverse(candidate, migrants);
      if (isDiverse || migrants.length < count / 2) {
        migrants.push(candidate);
      }
    }
    
    return migrants;
  }

  // Analysis methods

  private analyzeFitnessDistribution(): any {
    const fitnesses = this.currentPopulation.map(agent => 
      agent.getSpecializationProfile().fitnessScore || 0
    );
    
    return {
      mean: fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length,
      median: this.calculateMedian(fitnesses),
      min: Math.min(...fitnesses),
      max: Math.max(...fitnesses),
      standardDeviation: Math.sqrt(this.calculateVariance(fitnesses))
    };
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private analyzeDiversity(): any {
    return this.diversityMaintainer.analyzeDiversity(this.currentPopulation);
  }

  private analyzeEvolutionTrends(): any {
    if (this.populationMetrics.length < 5) return null;
    
    const recentMetrics = this.populationMetrics.slice(-10);
    
    return {
      fitnessTrajectory: recentMetrics.map(m => m.averageFitness),
      diversityTrajectory: recentMetrics.map(m => m.diversityIndex),
      sizeTrajectory: recentMetrics.map(m => m.size),
      trend: this.calculateTrend(recentMetrics.map(m => m.averageFitness))
    };
  }

  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const currentMetrics = this.calculatePopulationMetrics();
    
    if (currentMetrics.diversityIndex < 0.3) {
      bottlenecks.push('low_diversity');
    }
    
    if (currentMetrics.stagnationLevel > 0.7) {
      bottlenecks.push('evolutionary_stagnation');
    }
    
    if (currentMetrics.averageAge > this.config.maxAgentAge * 0.8) {
      bottlenecks.push('population_aging');
    }
    
    return bottlenecks;
  }

  private identifyOpportunities(): string[] {
    const opportunities: string[] = [];
    const currentMetrics = this.calculatePopulationMetrics();
    
    if (currentMetrics.diversityIndex > 0.8) {
      opportunities.push('high_diversity_exploration');
    }
    
    if (currentMetrics.evolutionRate > 0.1) {
      opportunities.push('rapid_improvement_potential');
    }
    
    if (currentMetrics.speciesCount > 3) {
      opportunities.push('multi_species_collaboration');
    }
    
    return opportunities;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const bottlenecks = this.identifyBottlenecks();
    const opportunities = this.identifyOpportunities();
    
    if (bottlenecks.includes('low_diversity')) {
      recommendations.push('Increase mutation rate and introduce novel agents');
    }
    
    if (bottlenecks.includes('evolutionary_stagnation')) {
      recommendations.push('Implement migration or environmental pressure changes');
    }
    
    if (opportunities.includes('high_diversity_exploration')) {
      recommendations.push('Focus on crossover operations to combine diverse traits');
    }
    
    return recommendations;
  }
}

/**
 * SpeciesManager - Manages species formation and evolution
 */
class SpeciesManager {
  private species: Map<string, Species>;
  private config: any;
  private extinctionHistory: string[];

  constructor(config: any) {
    this.config = config;
    this.species = new Map();
    this.extinctionHistory = [];
  }

  initializeSpecies(population: AdaptiveAgent[]): void {
    this.species.clear();
    
    population.forEach(agent => {
      this.assignToSpecies(agent, population);
    });
  }

  assignToSpecies(agent: AdaptiveAgent, population: AdaptiveAgent[]): void {
    // Find compatible species or create new one
    for (const [speciesId, species] of this.species) {
      if (this.isCompatible(agent, species.representative)) {
        species.members.push(agent);
        return;
      }
    }
    
    // Create new species
    const newSpeciesId = `species_${this.species.size}_${Date.now()}`;
    this.species.set(newSpeciesId, {
      id: newSpeciesId,
      representative: agent,
      members: [agent],
      averageFitness: agent.getSpecializationProfile().fitnessScore || 0,
      fitnessHistory: [],
      stagnationCount: 0,
      speciesAge: 0,
      extinctionRisk: 0
    });
  }

  updateSpecies(population: AdaptiveAgent[]): void {
    // Clear species membership
    this.species.forEach(species => {
      species.members = [];
    });
    
    // Reassign all agents
    population.forEach(agent => {
      this.assignToSpecies(agent, population);
    });
    
    // Update species metrics
    this.species.forEach(species => {
      if (species.members.length === 0) {
        this.markForExtinction(species);
      } else {
        this.updateSpeciesMetrics(species);
      }
    });
    
    // Remove extinct species
    this.removeExtinctSpecies();
  }

  private isCompatible(agent: AdaptiveAgent, representative: AdaptiveAgent): boolean {
    // Calculate compatibility based on capabilities and specializations
    const profile1 = agent.getSpecializationProfile();
    const profile2 = representative.getSpecializationProfile();
    
    const capabilityOverlap = this.calculateCapabilityOverlap(profile1, profile2);
    const specializationOverlap = this.calculateSpecializationOverlap(profile1, profile2);
    
    const compatibility = (capabilityOverlap * 0.6) + (specializationOverlap * 0.4);
    
    return compatibility >= this.config.speciesThreshold;
  }

  private calculateCapabilityOverlap(profile1: any, profile2: any): number {
    const caps1 = new Set(profile1.capabilities.map((cap: any) => cap.id));
    const caps2 = new Set(profile2.capabilities.map((cap: any) => cap.id));
    
    const intersection = new Set([...caps1].filter(id => caps2.has(id)));
    const union = new Set([...caps1, ...caps2]);
    
    return intersection.size / union.size;
  }

  private calculateSpecializationOverlap(profile1: any, profile2: any): number {
    const specs1 = new Set(profile1.specializations);
    const specs2 = new Set(profile2.specializations);
    
    const intersection = new Set([...specs1].filter(spec => specs2.has(spec)));
    const union = new Set([...specs1, ...specs2]);
    
    return intersection.size / union.size;
  }

  private updateSpeciesMetrics(species: Species): void {
    const fitnesses = species.members.map(agent => 
      agent.getSpecializationProfile().fitnessScore || 0
    );
    
    const newAverageFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
    
    // Check for stagnation
    if (species.fitnessHistory.length > 0) {
      const lastFitness = species.fitnessHistory[species.fitnessHistory.length - 1];
      if (Math.abs(newAverageFitness - lastFitness) < 0.01) {
        species.stagnationCount++;
      } else {
        species.stagnationCount = 0;
      }
    }
    
    species.averageFitness = newAverageFitness;
    species.fitnessHistory.push(newAverageFitness);
    species.speciesAge++;
    
    // Calculate extinction risk
    species.extinctionRisk = this.calculateExtinctionRisk(species);
    
    // Maintain history size
    if (species.fitnessHistory.length > 20) {
      species.fitnessHistory = species.fitnessHistory.slice(-20);
    }
  }

  private calculateExtinctionRisk(species: Species): number {
    let risk = 0;
    
    // Small population risk
    if (species.members.length < 3) risk += 0.3;
    
    // Stagnation risk
    if (species.stagnationCount > 10) risk += 0.4;
    
    // Low fitness risk
    if (species.averageFitness < 0.3) risk += 0.3;
    
    return Math.min(1, risk);
  }

  private markForExtinction(species: Species): void {
    species.extinctionRisk = 1.0;
  }

  private removeExtinctSpecies(): void {
    const extinctSpecies: string[] = [];
    
    this.species.forEach((species, id) => {
      if (species.members.length === 0 || species.extinctionRisk >= 1.0) {
        extinctSpecies.push(id);
        this.extinctionHistory.push(id);
      }
    });
    
    extinctSpecies.forEach(id => this.species.delete(id));
  }

  removeFromSpecies(agent: AdaptiveAgent): void {
    this.species.forEach(species => {
      const index = species.members.indexOf(agent);
      if (index >= 0) {
        species.members.splice(index, 1);
      }
    });
  }

  getSpeciesCount(): number {
    return this.species.size;
  }

  getSpeciesAnalysis(): Species[] {
    return Array.from(this.species.values());
  }

  getRecentExtinctions(): string[] {
    return this.extinctionHistory.slice(-5); // Last 5 extinctions
  }

  getEmergentSpecies(): any[] {
    // Return species that emerged in recent generations
    return Array.from(this.species.values())
      .filter(species => species.speciesAge <= 3)
      .map(species => ({
        id: species.id,
        age: species.speciesAge,
        memberCount: species.members.length,
        averageFitness: species.averageFitness
      }));
  }

  performSpeciesBasedReplacement(
    currentPopulation: AdaptiveAgent[],
    offspring: AdaptiveAgent[],
    maxSize: number
  ): AdaptiveAgent[] {
    // Implement species-based replacement strategy
    const newPopulation: AdaptiveAgent[] = [];
    
    // Allocate slots to species based on fitness
    this.species.forEach(species => {
      if (species.members.length > 0) {
        const allocation = Math.max(1, Math.floor(
          (species.averageFitness / this.getTotalSpeciesFitness()) * maxSize
        ));
        
        // Select best members from species
        const sortedMembers = species.members.sort((a, b) => {
          const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
          const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
          return fitnessB - fitnessA;
        });
        
        newPopulation.push(...sortedMembers.slice(0, allocation));
      }
    });
    
    return newPopulation.slice(0, maxSize);
  }

  private getTotalSpeciesFitness(): number {
    let total = 0;
    this.species.forEach(species => {
      total += species.averageFitness;
    });
    return total || 1; // Avoid division by zero
  }

  reset(): void {
    this.species.clear();
    this.extinctionHistory = [];
  }
}

/**
 * DiversityMaintainer - Maintains population diversity
 */
class DiversityMaintainer {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  calculateDiversityIndex(population: AdaptiveAgent[]): number {
    // Calculate diversity based on capability and specialization variety
    const capabilityTypes = new Set();
    const specializations = new Set();
    
    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.capabilities.forEach((cap: any) => capabilityTypes.add(cap.id));
      profile.specializations.forEach((spec: string) => specializations.add(spec));
    });
    
    // Normalize diversity index
    const maxPossibleTypes = population.length * 3; // Assume max 3 types per agent
    const actualTypes = capabilityTypes.size + specializations.size;
    
    return Math.min(1, actualTypes / maxPossibleTypes);
  }

  selectDiverseAgents(candidates: AdaptiveAgent[], count: number): AdaptiveAgent[] {
    if (candidates.length <= count) return candidates;
    
    const selected: AdaptiveAgent[] = [];
    const remaining = [...candidates];
    
    // Select first agent randomly
    const firstIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(firstIndex, 1)[0]);
    
    // Select remaining agents based on diversity
    while (selected.length < count && remaining.length > 0) {
      let mostDiverseAgent = remaining[0];
      let maxDiversityScore = this.calculateDiversityScore(mostDiverseAgent, selected);
      
      for (let i = 1; i < remaining.length; i++) {
        const diversityScore = this.calculateDiversityScore(remaining[i], selected);
        if (diversityScore > maxDiversityScore) {
          maxDiversityScore = diversityScore;
          mostDiverseAgent = remaining[i];
        }
      }
      
      selected.push(mostDiverseAgent);
      remaining.splice(remaining.indexOf(mostDiverseAgent), 1);
    }
    
    return selected;
  }

  private calculateDiversityScore(candidate: AdaptiveAgent, existing: AdaptiveAgent[]): number {
    if (existing.length === 0) return 1;
    
    let totalDistance = 0;
    
    existing.forEach(agent => {
      totalDistance += this.calculateAgentDistance(candidate, agent);
    });
    
    return totalDistance / existing.length;
  }

  private calculateAgentDistance(agent1: AdaptiveAgent, agent2: AdaptiveAgent): number {
    const profile1 = agent1.getSpecializationProfile();
    const profile2 = agent2.getSpecializationProfile();
    
    // Calculate distance based on capabilities and specializations
    const capabilityDistance = this.calculateCapabilityDistance(profile1, profile2);
    const specializationDistance = this.calculateSpecializationDistance(profile1, profile2);
    
    return (capabilityDistance * 0.6) + (specializationDistance * 0.4);
  }

  private calculateCapabilityDistance(profile1: any, profile2: any): number {
    // Simple distance calculation
    return 1 - this.calculateCapabilityOverlap(profile1, profile2);
  }

  private calculateCapabilityOverlap(profile1: any, profile2: any): number {
    const caps1 = new Set(profile1.capabilities.map((cap: any) => cap.id));
    const caps2 = new Set(profile2.capabilities.map((cap: any) => cap.id));
    
    const intersection = new Set([...caps1].filter(id => caps2.has(id)));
    const union = new Set([...caps1, ...caps2]);
    
    return intersection.size / union.size;
  }

  private calculateSpecializationDistance(profile1: any, profile2: any): number {
    const specs1 = new Set(profile1.specializations);
    const specs2 = new Set(profile2.specializations);
    
    const intersection = new Set([...specs1].filter(spec => specs2.has(spec)));
    const union = new Set([...specs1, ...specs2]);
    
    return 1 - (intersection.size / union.size);
  }

  isAgentDiverse(candidate: AdaptiveAgent, existing: AdaptiveAgent[]): boolean {
    const diversityScore = this.calculateDiversityScore(candidate, existing);
    return diversityScore > 0.5; // Threshold for diversity
  }

  async injectDiversity(population: AdaptiveAgent[], diversityDeficit: number): Promise<void> {
    // Calculate how many diverse agents to inject
    const injectCount = Math.floor(diversityDeficit * population.length);
    
    // Create diverse agents
    for (let i = 0; i < injectCount; i++) {
      const diverseAgent = this.createDiverseAgent(population);
      population.push(diverseAgent);
    }
    
    // Remove least diverse agents if population exceeds limit
    if (population.length > this.config.maxPopulationSize) {
      this.removeLeastDiverseAgents(population, population.length - this.config.maxPopulationSize);
    }
  }

  private createDiverseAgent(population: AdaptiveAgent[]): AdaptiveAgent {
    // Create agent with capabilities not well represented in population
    const existingCapabilities = new Set<string>();
    const existingSpecializations = new Set<string>();
    
    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      profile.capabilities.forEach((cap: any) => existingCapabilities.add(cap.id));
      profile.specializations.forEach((spec: string) => existingSpecializations.add(spec));
    });
    
    // Create capabilities different from existing ones
    const novelCapabilities = this.generateNovelCapabilities(existingCapabilities, existingSpecializations);
    
    return new AdaptiveAgent(
      `diverse_${Date.now()}_${Math.random()}`,
      novelCapabilities
    );
  }

  private generateNovelCapabilities(existingCaps: Set<string>, existingSpecs: Set<string>): AgentCapability[] {
    const novelTypes = ['quantum_reasoning', 'empathic_analysis', 'fractal_creativity', 'meta_learning', 'systemic_thinking'];
    const capabilities: AgentCapability[] = [];
    
    // Select types not well represented
    const underrepresentedTypes = novelTypes.filter(type => !existingSpecs.has(type));
    
    for (let i = 0; i < Math.min(3, underrepresentedTypes.length); i++) {
      const type = underrepresentedTypes[i];
      
      capabilities.push({
        id: `diverse_${type}_${Date.now()}_${i}`,
        name: `Diverse ${type} Capability`,
        strength: 0.4 + Math.random() * 0.3,
        adaptationRate: 0.08 + Math.random() * 0.12,
        specialization: [type],
        morphology: { type: 'diverse', novel: true },
        lastUsed: new Date(),
        performanceHistory: []
      });
    }
    
    return capabilities;
  }

  private removeLeastDiverseAgents(population: AdaptiveAgent[], removeCount: number): void {
    // Calculate diversity contribution of each agent
    const diversityScores = population.map(agent => ({
      agent,
      score: this.calculateDiversityContribution(agent, population)
    }));
    
    // Sort by diversity contribution (ascending)
    diversityScores.sort((a, b) => a.score - b.score);
    
    // Remove least diverse agents
    for (let i = 0; i < removeCount; i++) {
      const index = population.indexOf(diversityScores[i].agent);
      if (index >= 0) {
        population.splice(index, 1);
      }
    }
  }

  private calculateDiversityContribution(agent: AdaptiveAgent, population: AdaptiveAgent[]): number {
    // Calculate how much diversity this agent contributes to the population
    const otherAgents = population.filter(a => a !== agent);
    return this.calculateDiversityScore(agent, otherAgents);
  }

  analyzeDiversity(population: AdaptiveAgent[]): any {
    const diversityIndex = this.calculateDiversityIndex(population);
    
    // Analyze capability distribution
    const capabilityDistribution = new Map();
    const specializationDistribution = new Map();
    
    population.forEach(agent => {
      const profile = agent.getSpecializationProfile();
      
      profile.capabilities.forEach((cap: any) => {
        capabilityDistribution.set(cap.id, (capabilityDistribution.get(cap.id) || 0) + 1);
      });
      
      profile.specializations.forEach((spec: string) => {
        specializationDistribution.set(spec, (specializationDistribution.get(spec) || 0) + 1);
      });
    });
    
    return {
      diversityIndex,
      capabilityDistribution: Array.from(capabilityDistribution.entries()),
      specializationDistribution: Array.from(specializationDistribution.entries()),
      uniqueCapabilities: capabilityDistribution.size,
      uniqueSpecializations: specializationDistribution.size
    };
  }
}

/**
 * SelectionManager - Manages parent selection strategies
 */
class SelectionManager {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async selectParents(population: AdaptiveAgent[], parentCount: number): Promise<SelectionResult> {
    // Tournament selection with diversity consideration
    const selectedAgents: AdaptiveAgent[] = [];
    const tournamentSize = Math.max(2, Math.floor(population.length * 0.1));
    
    for (let i = 0; i < parentCount; i++) {
      const tournament = this.createTournament(population, tournamentSize);
      const winner = this.selectTournamentWinner(tournament);
      selectedAgents.push(winner);
    }
    
    // Calculate elite count
    const sortedPopulation = [...population].sort((a, b) => {
      const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
      const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
      return fitnessB - fitnessA;
    });
    
    const eliteCount = Math.floor(population.length * this.config.elitismRate);
    const elite = sortedPopulation.slice(0, eliteCount);
    const diversityPreserved = this.calculateDiversityPreserved(selectedAgents, population);
    
    return {
      selectedAgents,
      selectionPressure: this.config.selectionPressure,
      diversityPreserved,
      eliteCount,
      methodology: 'tournament_with_diversity'
    };
  }

  private createTournament(population: AdaptiveAgent[], size: number): AdaptiveAgent[] {
    const tournament: AdaptiveAgent[] = [];
    
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    
    return tournament;
  }

  private selectTournamentWinner(tournament: AdaptiveAgent[]): AdaptiveAgent {
    // Select winner based on fitness with some randomness
    tournament.sort((a, b) => {
      const fitnessA = a.getSpecializationProfile().fitnessScore || 0;
      const fitnessB = b.getSpecializationProfile().fitnessScore || 0;
      return fitnessB - fitnessA;
    });
    
    // Use rank-based selection with some randomness
    const rank = Math.floor(Math.random() * Math.min(3, tournament.length));
    return tournament[rank];
  }

  private calculateDiversityPreserved(selected: AdaptiveAgent[], population: AdaptiveAgent[]): number {
    // Calculate how much diversity is preserved in selection
    const diversityMaintainer = new DiversityMaintainer(this.config);
    const originalDiversity = diversityMaintainer.calculateDiversityIndex(population);
    const selectedDiversity = diversityMaintainer.calculateDiversityIndex(selected);
    
    return selectedDiversity / originalDiversity;
  }
}
