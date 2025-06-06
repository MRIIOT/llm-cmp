/**
 * Capability Evolution - Evolutionary capability development system
 * 
 * Implements evolutionary algorithms for capability development including
 * genetic operators, fitness evaluation, population dynamics, and 
 * adaptive evolution strategies for agent capabilities.
 */

import { AgentCapability, AdaptationContext, AgentMorphology, AdaptiveAgent } from './adaptive-agent';

export interface EvolutionParameters {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  selectionPressure: number;
  elitismRate: number;
  diversityWeight: number;
  convergenceThreshold: number;
  maxGenerations: number;
}

export interface FitnessMetrics {
  performance: number;
  adaptability: number;
  efficiency: number;
  stability: number;
  novelty: number;
  specialization: number;
  generalization: number;
  robustness: number;
}

export interface EvolutionaryOperation {
  type: 'mutation' | 'crossover' | 'selection' | 'migration' | 'speciation';
  parameters: any;
  fitness_impact: number;
  success_probability: number;
  computational_cost: number;
}

export interface GeneticOperator {
  name: string;
  apply: (capability: AgentCapability, parameters: any) => Promise<AgentCapability>;
  applicable: (capability: AgentCapability, context: any) => boolean;
  expectedImpact: (capability: AgentCapability, parameters: any) => number;
}

export interface EvolutionStrategy {
  id: string;
  name: string;
  selectionMethod: 'tournament' | 'roulette' | 'rank' | 'elite';
  crossoverMethod: 'uniform' | 'single_point' | 'multi_point' | 'semantic';
  mutationMethod: 'gaussian' | 'uniform' | 'adaptive' | 'directional';
  populationManagement: 'steady_state' | 'generational' | 'island' | 'multi_objective';
  adaptiveParameters: boolean;
}

export interface CapabilityGenome {
  genes: Map<string, any>;
  fitness: FitnessMetrics;
  phenotype: AgentCapability;
  generation: number;
  parentage: string[];
  mutations: string[];
  age: number;
}

/**
 * CapabilityEvolution - Manages evolutionary development of agent capabilities
 */
export class CapabilityEvolution {
  private parameters: EvolutionParameters;
  private strategies: Map<string, EvolutionStrategy>;
  private operators: Map<string, GeneticOperator>;
  private populationHistory: CapabilityGenome[][];
  private fitnessEvaluator: FitnessEvaluator;
  private diversityMaintainer: DiversityMaintainer;
  private adaptiveController: AdaptiveController;
  private currentGeneration: number;

  constructor(config: any = {}) {
    this.parameters = {
      populationSize: config.populationSize || 50,
      mutationRate: config.mutationRate || 0.1,
      crossoverRate: config.crossoverRate || 0.8,
      selectionPressure: config.selectionPressure || 2.0,
      elitismRate: config.elitismRate || 0.1,
      diversityWeight: config.diversityWeight || 0.3,
      convergenceThreshold: config.convergenceThreshold || 0.95,
      maxGenerations: config.maxGenerations || 100,
      ...config
    };

    this.strategies = new Map();
    this.operators = new Map();
    this.populationHistory = [];
    this.currentGeneration = 0;

    this.fitnessEvaluator = new FitnessEvaluator(config.fitness || {});
    this.diversityMaintainer = new DiversityMaintainer(config.diversity || {});
    this.adaptiveController = new AdaptiveController(config.adaptive || {});

    this.initializeStrategies();
    this.initializeOperators();
  }

  /**
   * Evolve capabilities based on performance feedback and context
   */
  async evolveCapabilities(
    currentCapabilities: Map<string, AgentCapability>,
    context: AdaptationContext,
    performanceData: any
  ): Promise<AgentCapability[]> {
    // 1. Convert capabilities to genomes
    const currentGenomes = this.capabilitiesToGenomes(currentCapabilities);

    // 2. Evaluate fitness
    const evaluatedGenomes = await this.evaluateFitness(currentGenomes, context, performanceData);

    // 3. Select evolution strategy
    const strategy = await this.selectEvolutionStrategy(evaluatedGenomes, context);

    // 4. Execute evolutionary operations
    const evolvedGenomes = await this.executeEvolution(evaluatedGenomes, strategy, context);

    // 5. Maintain diversity
    const diverseGenomes = await this.maintainDiversity(evolvedGenomes);

    // 6. Convert back to capabilities
    const evolvedCapabilities = this.genomesToCapabilities(diverseGenomes);

    // 7. Record evolution
    this.recordEvolution(currentGenomes, evolvedGenomes, strategy);

    return evolvedCapabilities;
  }

  /**
   * Perform crossover between two agents for evolutionary development
   */
  async performCrossover(
    agent1: AdaptiveAgent,
    agent2: AdaptiveAgent
  ): Promise<AdaptiveAgent> {
    // 1. Extract capability genomes
    const genome1 = this.extractGenome(agent1);
    const genome2 = this.extractGenome(agent2);

    // 2. Select crossover method
    const crossoverMethod = this.selectCrossoverMethod(genome1, genome2);

    // 3. Perform genetic crossover
    const offspringGenome = await this.applyCrossover(genome1, genome2, crossoverMethod);

    // 4. Apply mutations to offspring
    const mutatedGenome = await this.applyMutations(offspringGenome);

    // 5. Create new agent from genome
    const offspringAgent = await this.createAgentFromGenome(mutatedGenome);

    return offspringAgent;
  }

  /**
   * Optimize capability population through evolutionary pressure
   */
  async optimizePopulation(
    capabilities: AgentCapability[],
    fitnessTargets: any,
    evolutionPressure: any
  ): Promise<AgentCapability[]> {
    let population = this.capabilitiesToGenomes(new Map(capabilities.map(cap => [cap.id, cap])));

    for (let generation = 0; generation < this.parameters.maxGenerations; generation++) {
      // 1. Evaluate fitness
      population = await this.evaluatePopulationFitness(population, fitnessTargets);

      // 2. Check convergence
      if (this.hasConverged(population)) {
        break;
      }

      // 3. Selection
      const selectedParents = await this.selectParents(population, evolutionPressure);

      // 4. Reproduction
      const offspring = await this.reproduce(selectedParents, evolutionPressure);

      // 5. Replacement
      population = await this.replacePopulation(population, offspring);

      // 6. Adaptive parameter adjustment
      this.adaptiveController.adjustParameters(this.parameters, generation, population);

      this.currentGeneration = generation;
    }

    return this.genomesToCapabilities(population);
  }

  /**
   * Adapt evolution parameters based on performance
   */
  adaptEvolutionParameters(performanceHistory: any[]): void {
    this.adaptiveController.adaptParameters(this.parameters, performanceHistory);
  }

  /**
   * Get evolution statistics and metrics
   */
  getEvolutionMetrics(): any {
    return {
      currentGeneration: this.currentGeneration,
      populationSize: this.parameters.populationSize,
      averageFitness: this.calculateAverageFitness(),
      diversityIndex: this.calculateDiversityIndex(),
      convergenceStatus: this.getConvergenceStatus(),
      evolutionHistory: this.getEvolutionHistory()
    };
  }

  // Private implementation methods

  private capabilitiesToGenomes(capabilities: Map<string, AgentCapability>): CapabilityGenome[] {
    return Array.from(capabilities.values()).map(capability => ({
      genes: this.extractGenes(capability),
      fitness: this.initializeFitness(),
      phenotype: capability,
      generation: this.currentGeneration,
      parentage: [],
      mutations: [],
      age: 0
    }));
  }

  private genomesToCapabilities(genomes: CapabilityGenome[]): AgentCapability[] {
    return genomes.map(genome => genome.phenotype);
  }

  private async evaluateFitness(
    genomes: CapabilityGenome[],
    context: AdaptationContext,
    performanceData: any
  ): Promise<CapabilityGenome[]> {
    const evaluatedGenomes = [];

    for (const genome of genomes) {
      const fitness = await this.fitnessEvaluator.evaluate(
        genome.phenotype,
        context,
        performanceData
      );
      genome.fitness = fitness;
      evaluatedGenomes.push(genome);
    }

    return evaluatedGenomes;
  }

  private async selectEvolutionStrategy(
    genomes: CapabilityGenome[],
    context: AdaptationContext
  ): Promise<EvolutionStrategy> {
    // Analyze population characteristics
    const populationAnalysis = this.analyzePopulation(genomes);

    // Select strategy based on context and population state
    if (populationAnalysis.diversity < 0.3) {
      return this.strategies.get('diversification')!;
    } else if (populationAnalysis.averageFitness > 0.8) {
      return this.strategies.get('exploitation')!;
    } else {
      return this.strategies.get('balanced')!;
    }
  }

  private async executeEvolution(
    genomes: CapabilityGenome[],
    strategy: EvolutionStrategy,
    context: AdaptationContext
  ): Promise<CapabilityGenome[]> {
    let evolvedPopulation = [...genomes];

    // 1. Selection
    const selectedParents = await this.performSelection(evolvedPopulation, strategy);

    // 2. Crossover
    const offspring = await this.performCrossover_population(selectedParents, strategy);

    // 3. Mutation
    const mutatedOffspring = await this.performMutation(offspring, strategy);

    // 4. Replacement
    evolvedPopulation = await this.performReplacement(
      evolvedPopulation,
      mutatedOffspring,
      strategy
    );

    return evolvedPopulation;
  }

  private async maintainDiversity(genomes: CapabilityGenome[]): Promise<CapabilityGenome[]> {
    return await this.diversityMaintainer.maintainDiversity(genomes, this.parameters);
  }

  private extractGenome(agent: AdaptiveAgent): CapabilityGenome {
    const profile = agent.getSpecializationProfile();
    
    return {
      genes: this.extractGenesFromProfile(profile),
      fitness: this.initializeFitness(),
      phenotype: this.createCapabilityFromProfile(profile),
      generation: profile.generation,
      parentage: [],
      mutations: [],
      age: 0
    };
  }

  private selectCrossoverMethod(genome1: CapabilityGenome, genome2: CapabilityGenome): string {
    // Select crossover method based on genome compatibility
    const compatibility = this.calculateGenomeCompatibility(genome1, genome2);
    
    if (compatibility > 0.8) {
      return 'uniform';
    } else if (compatibility > 0.5) {
      return 'single_point';
    } else {
      return 'semantic';
    }
  }

  private async applyCrossover(
    genome1: CapabilityGenome,
    genome2: CapabilityGenome,
    method: string
  ): Promise<CapabilityGenome> {
    // Create combined genome through crossover
    const offspringGenes = new Map();
    
    // Combine genes based on method
    switch (method) {
      case 'uniform':
        genome1.genes.forEach((value, key) => {
          const useParent1 = Math.random() < 0.5;
          offspringGenes.set(key, useParent1 ? value : genome2.genes.get(key));
        });
        break;
        
      case 'single_point':
        const crossoverPoint = Math.floor(Math.random() * genome1.genes.size);
        let index = 0;
        genome1.genes.forEach((value, key) => {
          const useParent1 = index < crossoverPoint;
          offspringGenes.set(key, useParent1 ? value : genome2.genes.get(key));
          index++;
        });
        break;
        
      case 'multi_point':
        // Multi-point crossover with 2-3 crossover points
        const numPoints = 2 + Math.floor(Math.random() * 2); // 2 or 3 points
        const points = new Set<number>();
        while (points.size < numPoints) {
          points.add(Math.floor(Math.random() * genome1.genes.size));
        }
        const crossoverPoints = Array.from(points).sort((a, b) => a - b);
        
        let geneIndex = 0;
        let currentParent = 1; // Start with parent 1
        let pointIndex = 0;
        
        genome1.genes.forEach((value, key) => {
          // Switch parent at crossover points
          if (pointIndex < crossoverPoints.length && geneIndex >= crossoverPoints[pointIndex]) {
            currentParent = currentParent === 1 ? 2 : 1;
            pointIndex++;
          }
          
          const useParent1 = currentParent === 1;
          offspringGenes.set(key, useParent1 ? value : genome2.genes.get(key));
          geneIndex++;
        });
        break;
        
      case 'semantic':
        offspringGenes.set('strength', (genome1.genes.get('strength') + genome2.genes.get('strength')) / 2);
        offspringGenes.set('adaptationRate', Math.max(genome1.genes.get('adaptationRate'), genome2.genes.get('adaptationRate')));
        offspringGenes.set('specialization', [...genome1.genes.get('specialization'), ...genome2.genes.get('specialization')]);
        break;
        
      default:
        throw new Error(`Unknown crossover method: ${method}`);
    }

    return {
      genes: offspringGenes,
      fitness: this.initializeFitness(),
      phenotype: this.createCapabilityFromGenes(offspringGenes),
      generation: Math.max(genome1.generation, genome2.generation) + 1,
      parentage: [genome1.phenotype.id, genome2.phenotype.id],
      mutations: [],
      age: 0
    };
  }

  private async applyMutations(genome: CapabilityGenome): Promise<CapabilityGenome> {
    const mutatedGenome = JSON.parse(JSON.stringify(genome));
    const mutationOperators = ['strength_mutation', 'adaptation_mutation', 'specialization_mutation'];

    for (const operatorName of mutationOperators) {
      if (Math.random() < this.parameters.mutationRate) {
        const operator = this.operators.get(operatorName);
        if (operator && operator.applicable(genome.phenotype, {})) {
          mutatedGenome.phenotype = await operator.apply(genome.phenotype, {});
          mutatedGenome.mutations.push(operatorName);
        }
      }
    }

    // Update genes from mutated phenotype
    mutatedGenome.genes = this.extractGenes(mutatedGenome.phenotype);

    return mutatedGenome;
  }

  private async createAgentFromGenome(genome: CapabilityGenome): Promise<AdaptiveAgent> {
    const agentId = `evolved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const capabilities = [genome.phenotype];
    
    return new AdaptiveAgent(agentId, capabilities);
  }

  // Evolution operation methods

  private async performSelection(
    population: CapabilityGenome[],
    strategy: EvolutionStrategy
  ): Promise<CapabilityGenome[]> {
    switch (strategy.selectionMethod) {
      case 'tournament':
        return this.tournamentSelection(population);
      case 'roulette':
        return this.rouletteSelection(population);
      case 'rank':
        return this.rankSelection(population);
      case 'elite':
        return this.eliteSelection(population);
      default:
        return this.tournamentSelection(population);
    }
  }

  private async performCrossover_population(
    parents: CapabilityGenome[],
    strategy: EvolutionStrategy
  ): Promise<CapabilityGenome[]> {
    const offspring: CapabilityGenome[] = [];
    
    for (let i = 0; i < parents.length - 1; i += 2) {
      if (Math.random() < this.parameters.crossoverRate) {
        const child1 = await this.applyCrossover(parents[i], parents[i + 1], strategy.crossoverMethod);
        const child2 = await this.applyCrossover(parents[i + 1], parents[i], strategy.crossoverMethod);
        offspring.push(child1, child2);
      } else {
        offspring.push(parents[i], parents[i + 1]);
      }
    }
    
    return offspring;
  }

  private async performMutation(
    population: CapabilityGenome[],
    strategy: EvolutionStrategy
  ): Promise<CapabilityGenome[]> {
    const mutatedPopulation: CapabilityGenome[] = [];
    
    for (const genome of population) {
      const mutated = await this.applyMutations(genome);
      mutatedPopulation.push(mutated);
    }
    
    return mutatedPopulation;
  }

  private async performReplacement(
    oldPopulation: CapabilityGenome[],
    newOffspring: CapabilityGenome[],
    strategy: EvolutionStrategy
  ): Promise<CapabilityGenome[]> {
    // Combine populations
    const combined = [...oldPopulation, ...newOffspring];
    
    // Sort by fitness
    combined.sort((a, b) => this.compareFitness(b.fitness, a.fitness));
    
    // Keep top individuals (elitism) + diversity
    const eliteCount = Math.floor(this.parameters.populationSize * this.parameters.elitismRate);
    const elite = combined.slice(0, eliteCount);
    const remaining = combined.slice(eliteCount);
    
    // Select diverse individuals from remaining
    const diverse = this.selectDiverseIndividuals(
      remaining,
      this.parameters.populationSize - eliteCount
    );
    
    return [...elite, ...diverse];
  }

  // Selection methods

  private tournamentSelection(population: CapabilityGenome[]): CapabilityGenome[] {
    const selected: CapabilityGenome[] = [];
    const tournamentSize = Math.max(2, Math.floor(population.length * 0.1));
    
    for (let i = 0; i < population.length; i++) {
      const tournament: CapabilityGenome[] = [];
      
      for (let j = 0; j < tournamentSize; j++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
      }
      
      tournament.sort((a, b) => this.compareFitness(b.fitness, a.fitness));
      selected.push(tournament[0]);
    }
    
    return selected;
  }

  private rouletteSelection(population: CapabilityGenome[]): CapabilityGenome[] {
    const selected: CapabilityGenome[] = [];
    const totalFitness = population.reduce((sum, genome) => sum + this.calculateOverallFitness(genome.fitness), 0);
    
    for (let i = 0; i < population.length; i++) {
      let randomValue = Math.random() * totalFitness;
      
      for (const genome of population) {
        randomValue -= this.calculateOverallFitness(genome.fitness);
        if (randomValue <= 0) {
          selected.push(genome);
          break;
        }
      }
    }
    
    return selected;
  }

  private rankSelection(population: CapabilityGenome[]): CapabilityGenome[] {
    const sorted = [...population].sort((a, b) => this.compareFitness(a.fitness, b.fitness));
    const selected: CapabilityGenome[] = [];
    
    for (let i = 0; i < population.length; i++) {
      const rank = sorted.indexOf(population[i]) + 1;
      const selectionProbability = rank / population.length;
      
      if (Math.random() < selectionProbability) {
        selected.push(population[i]);
      }
    }
    
    return selected;
  }

  private eliteSelection(population: CapabilityGenome[]): CapabilityGenome[] {
    const sorted = [...population].sort((a, b) => this.compareFitness(b.fitness, a.fitness));
    const eliteCount = Math.floor(population.length * this.parameters.elitismRate);
    
    return sorted.slice(0, eliteCount);
  }

  // Helper methods

  private initializeStrategies(): void {
    this.strategies.set('balanced', {
      id: 'balanced',
      name: 'Balanced Evolution',
      selectionMethod: 'tournament',
      crossoverMethod: 'uniform',
      mutationMethod: 'adaptive',
      populationManagement: 'steady_state',
      adaptiveParameters: true
    });

    this.strategies.set('exploitation', {
      id: 'exploitation',
      name: 'Exploitation Focus',
      selectionMethod: 'elite',
      crossoverMethod: 'single_point',
      mutationMethod: 'gaussian',
      populationManagement: 'generational',
      adaptiveParameters: false
    });

    this.strategies.set('diversification', {
      id: 'diversification',
      name: 'Diversity Focus',
      selectionMethod: 'roulette',
      crossoverMethod: 'multi_point',
      mutationMethod: 'uniform',
      populationManagement: 'island',
      adaptiveParameters: true
    });
  }

  private initializeOperators(): void {
    // Mutation operators
    this.operators.set('strength_mutation', {
      name: 'Strength Mutation',
      apply: async (capability: AgentCapability, params: any) => {
        const mutated = { ...capability };
        const mutationStrength = params.strength || 0.1;
        mutated.strength = Math.max(0, Math.min(1, capability.strength + (Math.random() - 0.5) * mutationStrength));
        return mutated;
      },
      applicable: (capability: AgentCapability, context: any) => true,
      expectedImpact: (capability: AgentCapability, params: any) => 0.1
    });

    this.operators.set('adaptation_mutation', {
      name: 'Adaptation Rate Mutation',
      apply: async (capability: AgentCapability, params: any) => {
        const mutated = { ...capability };
        const mutationStrength = params.strength || 0.05;
        mutated.adaptationRate = Math.max(0.01, Math.min(0.5, capability.adaptationRate + (Math.random() - 0.5) * mutationStrength));
        return mutated;
      },
      applicable: (capability: AgentCapability, context: any) => true,
      expectedImpact: (capability: AgentCapability, params: any) => 0.05
    });

    this.operators.set('specialization_mutation', {
      name: 'Specialization Mutation',
      apply: async (capability: AgentCapability, params: any) => {
        const mutated = { ...capability };
        
        if (Math.random() < 0.5 && mutated.specialization.length > 1) {
          // Remove a specialization
          const removeIndex = Math.floor(Math.random() * mutated.specialization.length);
          mutated.specialization.splice(removeIndex, 1);
        } else {
          // Add a specialization
          const possibleSpecializations = ['analytical', 'creative', 'technical', 'social', 'strategic'];
          const newSpec = possibleSpecializations[Math.floor(Math.random() * possibleSpecializations.length)];
          if (!mutated.specialization.includes(newSpec)) {
            mutated.specialization.push(newSpec);
          }
        }
        
        return mutated;
      },
      applicable: (capability: AgentCapability, context: any) => true,
      expectedImpact: (capability: AgentCapability, params: any) => 0.2
    });
  }

  private extractGenes(capability: AgentCapability): Map<string, any> {
    const genes = new Map();
    genes.set('strength', capability.strength);
    genes.set('adaptationRate', capability.adaptationRate);
    genes.set('specialization', [...capability.specialization]);
    genes.set('morphology', capability.morphology);
    return genes;
  }

  private initializeFitness(): FitnessMetrics {
    return {
      performance: 0.5,
      adaptability: 0.5,
      efficiency: 0.5,
      stability: 0.5,
      novelty: 0.5,
      specialization: 0.5,
      generalization: 0.5,
      robustness: 0.5
    };
  }

  private extractGenesFromProfile(profile: any): Map<string, any> {
    const genes = new Map();
    genes.set('capabilities', profile.capabilities);
    genes.set('morphology', profile.morphology);
    genes.set('specializations', profile.specializations);
    genes.set('fitnessScore', profile.fitnessScore);
    return genes;
  }

  private createCapabilityFromProfile(profile: any): AgentCapability {
    return {
      id: `evolved_${Date.now()}`,
      name: 'Evolved Capability',
      strength: profile.fitnessScore || 0.5,
      adaptationRate: 0.1,
      specialization: profile.specializations || [],
      morphology: profile.morphology || {},
      lastUsed: new Date(),
      performanceHistory: []
    };
  }

  private createCapabilityFromGenes(genes: Map<string, any>): AgentCapability {
    return {
      id: `capability_${Date.now()}`,
      name: 'Generated Capability',
      strength: genes.get('strength') || 0.5,
      adaptationRate: genes.get('adaptationRate') || 0.1,
      specialization: genes.get('specialization') || [],
      morphology: genes.get('morphology') || {},
      lastUsed: new Date(),
      performanceHistory: []
    };
  }

  private calculateGenomeCompatibility(genome1: CapabilityGenome, genome2: CapabilityGenome): number {
    // Calculate compatibility based on gene similarity
    let compatibility = 0;
    let geneCount = 0;
    
    genome1.genes.forEach((value, key) => {
      if (genome2.genes.has(key)) {
        const value2 = genome2.genes.get(key);
        if (typeof value === 'number' && typeof value2 === 'number') {
          compatibility += 1 - Math.abs(value - value2);
        } else if (Array.isArray(value) && Array.isArray(value2)) {
          const overlap = value.filter(v => value2.includes(v)).length;
          const total = new Set([...value, ...value2]).size;
          compatibility += overlap / Math.max(1, total);
        }
        geneCount++;
      }
    });
    
    return geneCount > 0 ? compatibility / geneCount : 0;
  }

  private analyzePopulation(genomes: CapabilityGenome[]): any {
    const fitnesses = genomes.map(g => this.calculateOverallFitness(g.fitness));
    
    return {
      size: genomes.length,
      averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      maxFitness: Math.max(...fitnesses),
      minFitness: Math.min(...fitnesses),
      diversity: this.calculatePopulationDiversity(genomes)
    };
  }

  private calculateOverallFitness(fitness: FitnessMetrics): number {
    return (
      fitness.performance * 0.25 +
      fitness.adaptability * 0.15 +
      fitness.efficiency * 0.15 +
      fitness.stability * 0.15 +
      fitness.novelty * 0.1 +
      fitness.specialization * 0.1 +
      fitness.generalization * 0.05 +
      fitness.robustness * 0.05
    );
  }

  private compareFitness(fitness1: FitnessMetrics, fitness2: FitnessMetrics): number {
    return this.calculateOverallFitness(fitness1) - this.calculateOverallFitness(fitness2);
  }

  private calculatePopulationDiversity(genomes: CapabilityGenome[]): number {
    // Simple diversity calculation based on gene variance
    if (genomes.length < 2) return 0;
    
    let totalVariance = 0;
    let geneCount = 0;
    
    const geneKeys = Array.from(genomes[0].genes.keys());
    
    for (const key of geneKeys) {
      const values = genomes.map(g => g.genes.get(key)).filter(v => typeof v === 'number');
      if (values.length > 1) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        totalVariance += variance;
        geneCount++;
      }
    }
    
    return geneCount > 0 ? totalVariance / geneCount : 0;
  }

  private selectDiverseIndividuals(
    population: CapabilityGenome[],
    count: number
  ): CapabilityGenome[] {
    if (population.length <= count) return population;
    
    const selected: CapabilityGenome[] = [];
    const remaining = [...population];
    
    // Select first individual randomly
    const firstIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(firstIndex, 1)[0]);
    
    // Select remaining individuals based on diversity
    while (selected.length < count && remaining.length > 0) {
      let maxDiversity = -1;
      let bestIndex = 0;
      
      for (let i = 0; i < remaining.length; i++) {
        const diversity = this.calculateDiversityScore(remaining[i], selected);
        if (diversity > maxDiversity) {
          maxDiversity = diversity;
          bestIndex = i;
        }
      }
      
      selected.push(remaining.splice(bestIndex, 1)[0]);
    }
    
    return selected;
  }

  private calculateDiversityScore(candidate: CapabilityGenome, selected: CapabilityGenome[]): number {
    if (selected.length === 0) return 1;
    
    const distances = selected.map(individual => this.calculateGenomeDistance(candidate, individual));
    return Math.min(...distances);
  }

  private calculateGenomeDistance(genome1: CapabilityGenome, genome2: CapabilityGenome): number {
    let distance = 0;
    let geneCount = 0;
    
    genome1.genes.forEach((value, key) => {
      if (genome2.genes.has(key)) {
        const value2 = genome2.genes.get(key);
        if (typeof value === 'number' && typeof value2 === 'number') {
          distance += Math.abs(value - value2);
        }
        geneCount++;
      }
    });
    
    return geneCount > 0 ? distance / geneCount : 1;
  }

  private hasConverged(population: CapabilityGenome[]): boolean {
    const diversity = this.calculatePopulationDiversity(population);
    return diversity < (1 - this.parameters.convergenceThreshold);
  }

  private async evaluatePopulationFitness(
    population: CapabilityGenome[],
    fitnessTargets: any
  ): Promise<CapabilityGenome[]> {
    return population.map(genome => {
      genome.fitness = this.fitnessEvaluator.evaluateAgainstTargets(genome.phenotype, fitnessTargets);
      return genome;
    });
  }

  private async selectParents(
    population: CapabilityGenome[],
    evolutionPressure: any
  ): Promise<CapabilityGenome[]> {
    return this.tournamentSelection(population);
  }

  private async reproduce(
    parents: CapabilityGenome[],
    evolutionPressure: any
  ): Promise<CapabilityGenome[]> {
    return this.performCrossover_population(parents, this.strategies.get('balanced')!);
  }

  private async replacePopulation(
    oldPopulation: CapabilityGenome[],
    offspring: CapabilityGenome[]
  ): Promise<CapabilityGenome[]> {
    return this.performReplacement(oldPopulation, offspring, this.strategies.get('balanced')!);
  }

  private recordEvolution(
    before: CapabilityGenome[],
    after: CapabilityGenome[],
    strategy: EvolutionStrategy
  ): void {
    this.populationHistory.push([...after]);
    this.currentGeneration++;
  }

  private calculateAverageFitness(): number {
    if (this.populationHistory.length === 0) return 0;
    
    const lastGeneration = this.populationHistory[this.populationHistory.length - 1];
    const fitnesses = lastGeneration.map(g => this.calculateOverallFitness(g.fitness));
    
    return fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
  }

  private calculateDiversityIndex(): number {
    if (this.populationHistory.length === 0) return 0;
    
    const lastGeneration = this.populationHistory[this.populationHistory.length - 1];
    return this.calculatePopulationDiversity(lastGeneration);
  }

  private getConvergenceStatus(): any {
    return {
      hasConverged: this.populationHistory.length > 0 ? this.hasConverged(this.populationHistory[this.populationHistory.length - 1]) : false,
      convergenceMetric: this.calculateDiversityIndex(),
      threshold: this.parameters.convergenceThreshold
    };
  }

  private getEvolutionHistory(): any[] {
    return this.populationHistory.map((generation, index) => ({
      generation: index,
      populationSize: generation.length,
      averageFitness: generation.reduce((sum, g) => sum + this.calculateOverallFitness(g.fitness), 0) / generation.length,
      diversity: this.calculatePopulationDiversity(generation)
    }));
  }
}

/**
 * FitnessEvaluator - Evaluates capability fitness across multiple dimensions
 */
class FitnessEvaluator {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async evaluate(
    capability: AgentCapability,
    context: AdaptationContext,
    performanceData: any
  ): Promise<FitnessMetrics> {
    return {
      performance: this.evaluatePerformance(capability, performanceData),
      adaptability: this.evaluateAdaptability(capability, context),
      efficiency: this.evaluateEfficiency(capability, performanceData),
      stability: this.evaluateStability(capability),
      novelty: this.evaluateNovelty(capability),
      specialization: this.evaluateSpecialization(capability),
      generalization: this.evaluateGeneralization(capability),
      robustness: this.evaluateRobustness(capability)
    };
  }

  evaluateAgainstTargets(capability: AgentCapability, targets: any): FitnessMetrics {
    // Evaluate capability against specific fitness targets
    return {
      performance: Math.min(1.0, capability.strength / (targets.performance || 1)),
      adaptability: Math.min(1.0, capability.adaptationRate / (targets.adaptability || 0.1)),
      efficiency: 0.8, // Placeholder
      stability: 0.7, // Placeholder
      novelty: 0.6, // Placeholder
      specialization: capability.specialization.length / 5,
      generalization: Math.max(0, 1 - (capability.specialization.length / 10)),
      robustness: 0.8 // Placeholder
    };
  }

  private evaluatePerformance(capability: AgentCapability, performanceData: any): number {
    const recentPerformance = capability.performanceHistory.slice(-5);
    if (recentPerformance.length === 0) return capability.strength;
    
    return recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
  }

  private evaluateAdaptability(capability: AgentCapability, context: AdaptationContext): number {
    return Math.min(1.0, capability.adaptationRate * 10);
  }

  private evaluateEfficiency(capability: AgentCapability, performanceData: any): number {
    // Placeholder for efficiency evaluation
    return 0.7;
  }

  private evaluateStability(capability: AgentCapability): number {
    const variance = this.calculatePerformanceVariance(capability.performanceHistory);
    return Math.max(0, 1 - variance);
  }

  private evaluateNovelty(capability: AgentCapability): number {
    // Placeholder for novelty evaluation
    return 0.5;
  }

  private evaluateSpecialization(capability: AgentCapability): number {
    return Math.min(1.0, capability.specialization.length / 3);
  }

  private evaluateGeneralization(capability: AgentCapability): number {
    return Math.max(0, 1 - (capability.specialization.length / 10));
  }

  private evaluateRobustness(capability: AgentCapability): number {
    // Placeholder for robustness evaluation
    return 0.8;
  }

  private calculatePerformanceVariance(history: number[]): number {
    if (history.length < 2) return 0;
    
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / history.length;
    
    return variance;
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

  async maintainDiversity(
    population: CapabilityGenome[],
    parameters: EvolutionParameters
  ): Promise<CapabilityGenome[]> {
    // Implement diversity maintenance strategies
    return population; // Placeholder
  }
}

/**
 * AdaptiveController - Controls adaptive parameter adjustment
 */
class AdaptiveController {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  adjustParameters(
    parameters: EvolutionParameters,
    generation: number,
    population: CapabilityGenome[]
  ): void {
    // Adjust evolution parameters based on population state
    // Placeholder for adaptive parameter control
  }

  adaptParameters(parameters: EvolutionParameters, performanceHistory: any[]): void {
    // Adapt parameters based on performance history
    // Placeholder for parameter adaptation
  }
}
