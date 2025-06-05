/**
 * Adaptation Tests - Novel task adaptation in 5 cycles
 * 
 * Tests the ability of adaptive agents to adapt to novel task types
 * within 5 reasoning cycles, measuring adaptation speed, effectiveness,
 * and capability evolution during the adaptation process.
 */

import { AdaptiveAgent, AgentCapability, AdaptationContext } from '../../agents/dynamic/adaptive-agent';

export interface AdaptationTestResult {
  agentId: string;
  initialCapabilities: number;
  finalCapabilities: number;
  adaptationCycles: number;
  adaptationSuccess: boolean;
  performanceImprovement: number;
  capabilityEvolution: any[];
  adaptationMetrics: AdaptationMetrics;
}

export interface AdaptationMetrics {
  adaptationSpeed: number; // Cycles to achieve 80% target performance
  adaptationEfficiency: number; // Performance gain per cycle
  capabilityFlexibility: number; // Ability to modify existing capabilities
  noveltyHandling: number; // Performance on completely novel tasks
  retentionRate: number; // Retention of previous capabilities
  emergentCapabilities: number; // New capabilities developed
}

export interface NovelTask {
  id: string;
  type: string;
  complexity: number;
  requiredCapabilities: string[];
  domain: string;
  noveltyLevel: number; // 0-1, how different from existing tasks
  successCriteria: any;
}

export interface AdaptationTestSuite {
  testId: string;
  novelTasks: NovelTask[];
  targetAdaptationCycles: number;
  successThreshold: number;
  results: AdaptationTestResult[];
  summaryMetrics: any;
}

/**
 * AdaptationTester - Tests agent adaptation capabilities
 */
export class AdaptationTester {
  private testSuites: Map<string, AdaptationTestSuite>;
  private config: any;

  constructor(config: any = {}) {
    this.config = {
      maxAdaptationCycles: config.maxAdaptationCycles || 5,
      successThreshold: config.successThreshold || 0.8,
      performanceBaseline: config.performanceBaseline || 0.3,
      noveltyLevels: config.noveltyLevels || [0.3, 0.5, 0.7, 0.9],
      ...config
    };

    this.testSuites = new Map();
  }

  /**
   * Test agent adaptation to novel tasks
   */
  async testNovelTaskAdaptation(
    agent: AdaptiveAgent,
    novelTasks: NovelTask[]
  ): Promise<AdaptationTestResult[]> {
    const results: AdaptationTestResult[] = [];

    for (const task of novelTasks) {
      console.log(`Testing adaptation to novel task: ${task.type}`);
      
      const result = await this.testSingleTaskAdaptation(agent, task);
      results.push(result);
      
      // Log intermediate results
      console.log(`Adaptation ${result.adaptationSuccess ? 'SUCCESS' : 'FAILED'} in ${result.adaptationCycles} cycles`);
    }

    return results;
  }

  /**
   * Test adaptation speed across different novelty levels
   */
  async testAdaptationSpeed(
    agent: AdaptiveAgent,
    noveltyLevels: number[] = [0.3, 0.5, 0.7, 0.9]
  ): Promise<any> {
    const speedResults = new Map<number, AdaptationMetrics>();

    for (const noveltyLevel of noveltyLevels) {
      const novelTask = this.generateNovelTask(noveltyLevel);
      const result = await this.testSingleTaskAdaptation(agent, novelTask);
      
      speedResults.set(noveltyLevel, result.adaptationMetrics);
    }

    return {
      speedResults: Array.from(speedResults.entries()),
      averageSpeed: this.calculateAverageAdaptationSpeed(speedResults),
      speedTrend: this.analyzeSpeedTrend(speedResults)
    };
  }

  /**
   * Test capability evolution during adaptation
   */
  async testCapabilityEvolution(
    agent: AdaptiveAgent,
    task: NovelTask
  ): Promise<any> {
    const initialProfile = agent.getSpecializationProfile();
    const evolutionHistory: any[] = [];
    
    // Record initial state
    evolutionHistory.push({
      cycle: 0,
      capabilities: this.captureCapabilitySnapshot(initialProfile.capabilities),
      adaptationLevel: 0
    });

    let currentAgent = agent;
    
    for (let cycle = 1; cycle <= this.config.maxAdaptationCycles; cycle++) {
      // Attempt adaptation
      const adaptationContext = this.createAdaptationContext(task);
      const adaptationSuccess = await currentAgent.adaptToTask(adaptationContext);
      
      if (adaptationSuccess) {
        const currentProfile = currentAgent.getSpecializationProfile();
        const adaptationLevel = await this.assessTaskPerformance(currentAgent, task);
        
        evolutionHistory.push({
          cycle,
          capabilities: this.captureCapabilitySnapshot(currentProfile.capabilities),
          adaptationLevel,
          evolutionEvents: this.detectEvolutionEvents(evolutionHistory)
        });
        
        // Stop if adaptation successful
        if (adaptationLevel >= this.config.successThreshold) {
          break;
        }
      }
    }

    return {
      evolutionHistory,
      totalEvolution: this.calculateTotalEvolution(evolutionHistory),
      evolutionEfficiency: this.calculateEvolutionEfficiency(evolutionHistory),
      emergentCapabilities: this.identifyEmergentCapabilities(evolutionHistory)
    };
  }

  /**
   * Test adaptation across multiple task domains
   */
  async testCrossDomainAdaptation(
    agent: AdaptiveAgent,
    domains: string[] = ['analytical', 'creative', 'social', 'technical']
  ): Promise<any> {
    const domainResults = new Map<string, AdaptationTestResult>();

    for (const domain of domains) {
      const domainTask = this.generateDomainSpecificTask(domain);
      const result = await this.testSingleTaskAdaptation(agent, domainTask);
      
      domainResults.set(domain, result);
    }

    return {
      domainResults: Array.from(domainResults.entries()),
      crossDomainTransfer: this.analyzeCrossDomainTransfer(domainResults),
      adaptationConsistency: this.calculateAdaptationConsistency(domainResults)
    };
  }

  /**
   * Comprehensive adaptation benchmark
   */
  async runComprehensiveAdaptationBenchmark(
    agents: AdaptiveAgent[]
  ): Promise<AdaptationTestSuite> {
    const testSuite: AdaptationTestSuite = {
      testId: `adaptation_benchmark_${Date.now()}`,
      novelTasks: this.generateComprehensiveBenchmarkTasks(),
      targetAdaptationCycles: this.config.maxAdaptationCycles,
      successThreshold: this.config.successThreshold,
      results: [],
      summaryMetrics: {}
    };

    // Test each agent on all benchmark tasks
    for (const agent of agents) {
      const agentResults = await this.testNovelTaskAdaptation(agent, testSuite.novelTasks);
      testSuite.results.push(...agentResults);
    }

    // Calculate summary metrics
    testSuite.summaryMetrics = this.calculateSummaryMetrics(testSuite);
    
    // Store test suite
    this.testSuites.set(testSuite.testId, testSuite);

    return testSuite;
  }

  /**
   * Generate adaptation test report
   */
  generateAdaptationReport(testSuiteId: string): any {
    const testSuite = this.testSuites.get(testSuiteId);
    if (!testSuite) {
      throw new Error(`Test suite not found: ${testSuiteId}`);
    }

    return {
      testSuiteId,
      executionDate: new Date(),
      overallResults: this.summarizeOverallResults(testSuite),
      adaptationMetrics: this.aggregateAdaptationMetrics(testSuite),
      performanceAnalysis: this.analyzePerformancePatterns(testSuite),
      recommendations: this.generateAdaptationRecommendations(testSuite),
      detailedResults: testSuite.results
    };
  }

  /**
   * Generate novel task for testing (public method for test access)
   */
  public generateNovelTask(noveltyLevel: number): NovelTask {
    const taskTypes = ['analytical_novel', 'creative_synthesis', 'social_dynamics', 'technical_innovation'];
    const domains = ['quantum_computing', 'bioethics', 'space_exploration', 'consciousness_research'];
    
    const selectedType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
    
    return {
      id: `novel_task_${Date.now()}_${Math.random()}`,
      type: selectedType,
      complexity: 0.5 + (noveltyLevel * 0.4), // Scale complexity with novelty
      requiredCapabilities: this.generateRequiredCapabilities(selectedType, noveltyLevel),
      domain: selectedDomain,
      noveltyLevel,
      successCriteria: {
        minPerformance: this.config.successThreshold,
        maxCycles: this.config.maxAdaptationCycles
      }
    };
  }

  /**
   * Test single task adaptation (public method for test access)
   */
  public async testSingleTaskAdaptation(
    agent: any,
    task: NovelTask
  ): Promise<AdaptationTestResult> {
    const initialProfile = agent.getSpecializationProfile();
    const initialCapabilityCount = initialProfile.capabilities.length;
    
    let adaptationCycles = 0;
    let adaptationSuccess = false;
    let currentPerformance = 0;
    const capabilityEvolution: any[] = [];

    // Baseline performance measurement
    const baselinePerformance = await this.assessTaskPerformance(agent, task);
    capabilityEvolution.push({
      cycle: 0,
      performance: baselinePerformance,
      capabilities: initialCapabilityCount
    });

    // Adaptation loop
    for (let cycle = 1; cycle <= this.config.maxAdaptationCycles; cycle++) {
      adaptationCycles = cycle;
      
      // Create adaptation context
      const adaptationContext = this.createAdaptationContext(task);
      
      // Attempt adaptation
      const adapted = await agent.adaptToTask(adaptationContext);
      
      if (adapted) {
        // Measure performance after adaptation
        currentPerformance = await this.assessTaskPerformance(agent, task);
        
        // Record evolution step
        const currentProfile = agent.getSpecializationProfile();
        capabilityEvolution.push({
          cycle,
          performance: currentPerformance,
          capabilities: currentProfile.capabilities.length,
          adaptationApplied: true
        });
        
        // Check if adaptation successful
        if (currentPerformance >= this.config.successThreshold) {
          adaptationSuccess = true;
          break;
        }
      } else {
        // Record failed adaptation attempt
        capabilityEvolution.push({
          cycle,
          performance: currentPerformance,
          capabilities: initialCapabilityCount,
          adaptationApplied: false
        });
      }
    }

    const finalProfile = agent.getSpecializationProfile();
    const performanceImprovement = currentPerformance - baselinePerformance;

    return {
      agentId: initialProfile.id,
      initialCapabilities: initialCapabilityCount,
      finalCapabilities: finalProfile.capabilities.length,
      adaptationCycles,
      adaptationSuccess,
      performanceImprovement,
      capabilityEvolution,
      adaptationMetrics: this.calculateAdaptationMetrics(capabilityEvolution, task)
    };
  }

  // Private implementation methods

  private createAdaptationContext(task: NovelTask): AdaptationContext {
    return {
      taskType: task.type,
      complexity: task.complexity,
      domain: task.domain,
      requiredCapabilities: task.requiredCapabilities,
      timeConstraints: 1000,
      qualityThresholds: this.config.successThreshold
    };
  }

  private async assessTaskPerformance(agent: AdaptiveAgent, task: NovelTask): Promise<number> {
    // Simulate task execution and performance assessment
    const profile = agent.getSpecializationProfile();
    
    // Calculate capability match
    const capabilityMatch = this.calculateCapabilityMatch(
      profile.capabilities,
      task.requiredCapabilities
    );
    
    // Factor in agent fitness
    const agentFitness = profile.fitnessScore || 0.5;
    
    // Calculate base performance
    let performance = (capabilityMatch * 0.7) + (agentFitness * 0.3);
    
    // Apply novelty penalty
    const noveltyPenalty = task.noveltyLevel * 0.3;
    performance = Math.max(0, performance - noveltyPenalty);
    
    // Add some randomness to simulate real-world variability
    performance += (Math.random() - 0.5) * 0.1;
    
    return Math.max(0, Math.min(1, performance));
  }

  private calculateCapabilityMatch(
    agentCapabilities: AgentCapability[],
    requiredCapabilities: string[]
  ): number {
    if (requiredCapabilities.length === 0) return 1;
    
    const agentCapabilityIds = new Set(agentCapabilities.map(cap => cap.id));
    const agentSpecializations = new Set(
      agentCapabilities.flatMap(cap => cap.specialization)
    );
    
    let matches = 0;
    
    for (const required of requiredCapabilities) {
      if (agentCapabilityIds.has(required) || agentSpecializations.has(required)) {
        matches++;
      }
    }
    
    return matches / requiredCapabilities.length;
  }

  private calculateAdaptationMetrics(
    evolutionHistory: any[],
    task: NovelTask
  ): AdaptationMetrics {
    const performances = evolutionHistory.map(step => step.performance);
    const cycles = evolutionHistory.length - 1; // Exclude baseline
    
    // Adaptation speed: cycles to reach 80% of target
    let adaptationSpeed = cycles;
    for (let i = 1; i < performances.length; i++) {
      if (performances[i] >= this.config.successThreshold * 0.8) {
        adaptationSpeed = i;
        break;
      }
    }
    
    // Adaptation efficiency: average performance gain per cycle
    const totalGain = performances[performances.length - 1] - performances[0];
    const adaptationEfficiency = cycles > 0 ? totalGain / cycles : 0;
    
    // Capability flexibility: capability changes during adaptation
    const capabilityChanges = evolutionHistory.filter(step => step.adaptationApplied).length;
    const capabilityFlexibility = capabilityChanges / Math.max(1, cycles);
    
    // Novelty handling: performance relative to novelty level
    const finalPerformance = performances[performances.length - 1];
    const noveltyHandling = finalPerformance / (1 - task.noveltyLevel * 0.5);
    
    return {
      adaptationSpeed: Math.max(1, adaptationSpeed),
      adaptationEfficiency: Math.max(0, adaptationEfficiency),
      capabilityFlexibility: Math.min(1, capabilityFlexibility),
      noveltyHandling: Math.min(1, Math.max(0, noveltyHandling)),
      retentionRate: 0.8, // Placeholder - would track capability retention
      emergentCapabilities: this.countEmergentCapabilities(evolutionHistory)
    };
  }

  private countEmergentCapabilities(evolutionHistory: any[]): number {
    if (evolutionHistory.length < 2) return 0;
    
    const initial = evolutionHistory[0].capabilities;
    const final = evolutionHistory[evolutionHistory.length - 1].capabilities;
    
    return Math.max(0, final - initial);
  }

  private generateRequiredCapabilities(taskType: string, noveltyLevel: number): string[] {
    const baseCapabilities: { [key: string]: string[] } = {
      'analytical_novel': ['reasoning', 'analytical', 'critical'],
      'creative_synthesis': ['creative', 'synthesis', 'innovation'],
      'social_dynamics': ['social', 'communication', 'empathy'],
      'technical_innovation': ['technical', 'engineering', 'problem_solving']
    };
    
    const base = baseCapabilities[taskType] || ['reasoning'];
    
    // Add novel capabilities based on novelty level
    if (noveltyLevel > 0.5) {
      base.push('meta_cognitive');
    }
    if (noveltyLevel > 0.7) {
      base.push('quantum_reasoning');
    }
    if (noveltyLevel > 0.9) {
      base.push('emergent_thinking');
    }
    
    return base;
  }

  private generateDomainSpecificTask(domain: string): NovelTask {
    const domainTasks: { [key: string]: any } = {
      'analytical': {
        type: 'data_analysis',
        capabilities: ['analytical', 'reasoning', 'statistical'],
        complexity: 0.7
      },
      'creative': {
        type: 'creative_problem_solving',
        capabilities: ['creative', 'innovation', 'synthesis'],
        complexity: 0.6
      },
      'social': {
        type: 'social_coordination',
        capabilities: ['social', 'communication', 'negotiation'],
        complexity: 0.8
      },
      'technical': {
        type: 'technical_design',
        capabilities: ['technical', 'engineering', 'optimization'],
        complexity: 0.9
      }
    };
    
    const taskSpec = domainTasks[domain] || domainTasks['analytical'];
    
    return {
      id: `domain_task_${domain}_${Date.now()}`,
      type: taskSpec.type,
      complexity: taskSpec.complexity,
      requiredCapabilities: taskSpec.capabilities,
      domain,
      noveltyLevel: 0.5,
      successCriteria: {
        minPerformance: this.config.successThreshold,
        maxCycles: this.config.maxAdaptationCycles
      }
    };
  }

  private generateComprehensiveBenchmarkTasks(): NovelTask[] {
    const tasks: NovelTask[] = [];
    
    // Generate tasks across different novelty levels
    for (const noveltyLevel of this.config.noveltyLevels) {
      tasks.push(this.generateNovelTask(noveltyLevel));
    }
    
    // Generate domain-specific tasks
    const domains = ['analytical', 'creative', 'social', 'technical'];
    for (const domain of domains) {
      tasks.push(this.generateDomainSpecificTask(domain));
    }
    
    return tasks;
  }

  private captureCapabilitySnapshot(capabilities: AgentCapability[]): any {
    return {
      count: capabilities.length,
      averageStrength: capabilities.reduce((sum, cap) => sum + cap.strength, 0) / capabilities.length,
      specializations: capabilities.flatMap(cap => cap.specialization),
      adaptationRate: capabilities.reduce((sum, cap) => sum + cap.adaptationRate, 0) / capabilities.length
    };
  }

  private detectEvolutionEvents(evolutionHistory: any[]): string[] {
    if (evolutionHistory.length < 2) return [];
    
    const events: string[] = [];
    const current = evolutionHistory[evolutionHistory.length - 1];
    const previous = evolutionHistory[evolutionHistory.length - 2];
    
    if (current.capabilities.count > previous.capabilities.count) {
      events.push('capability_addition');
    }
    
    if (current.capabilities.averageStrength > previous.capabilities.averageStrength + 0.1) {
      events.push('strength_improvement');
    }
    
    if (current.capabilities.specializations.length > previous.capabilities.specializations.length) {
      events.push('specialization_expansion');
    }
    
    return events;
  }

  private calculateTotalEvolution(evolutionHistory: any[]): number {
    if (evolutionHistory.length < 2) return 0;
    
    const initial = evolutionHistory[0];
    const final = evolutionHistory[evolutionHistory.length - 1];
    
    const performanceEvolution = final.adaptationLevel - initial.adaptationLevel;
    const capabilityEvolution = (final.capabilities.count - initial.capabilities.count) / Math.max(1, initial.capabilities.count);
    
    return (performanceEvolution * 0.7) + (capabilityEvolution * 0.3);
  }

  private calculateEvolutionEfficiency(evolutionHistory: any[]): number {
    const totalEvolution = this.calculateTotalEvolution(evolutionHistory);
    const cycles = evolutionHistory.length - 1;
    
    return cycles > 0 ? totalEvolution / cycles : 0;
  }

  private identifyEmergentCapabilities(evolutionHistory: any[]): string[] {
    // Identify capabilities that emerged during evolution
    const emergent: string[] = [];
    
    if (evolutionHistory.length >= 2) {
      const initial = evolutionHistory[0].capabilities.specializations;
      const final = evolutionHistory[evolutionHistory.length - 1].capabilities.specializations;
      
      final.forEach((spec: string) => {
        if (!initial.includes(spec)) {
          emergent.push(spec);
        }
      });
    }
    
    return emergent;
  }

  private calculateAverageAdaptationSpeed(speedResults: Map<number, AdaptationMetrics>): number {
    const speeds = Array.from(speedResults.values()).map(metrics => metrics.adaptationSpeed);
    return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  }

  private analyzeSpeedTrend(speedResults: Map<number, AdaptationMetrics>): string {
    const sortedResults = Array.from(speedResults.entries()).sort((a, b) => a[0] - b[0]);
    
    if (sortedResults.length < 2) return 'insufficient_data';
    
    const speeds = sortedResults.map(([_, metrics]) => metrics.adaptationSpeed);
    const firstHalf = speeds.slice(0, Math.floor(speeds.length / 2));
    const secondHalf = speeds.slice(Math.floor(speeds.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, speed) => sum + speed, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, speed) => sum + speed, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.5) return 'deteriorating'; // Higher speed = worse (more cycles)
    if (secondAvg < firstAvg - 0.5) return 'improving';
    return 'stable';
  }

  private analyzeCrossDomainTransfer(domainResults: Map<string, AdaptationTestResult>): any {
    const results = Array.from(domainResults.values());
    
    return {
      transferSuccess: results.filter(r => r.adaptationSuccess).length / results.length,
      averageTransferCycles: results.reduce((sum, r) => sum + r.adaptationCycles, 0) / results.length,
      transferEfficiency: results.reduce((sum, r) => sum + r.adaptationMetrics.adaptationEfficiency, 0) / results.length
    };
  }

  private calculateAdaptationConsistency(domainResults: Map<string, AdaptationTestResult>): number {
    const efficiencies = Array.from(domainResults.values()).map(r => r.adaptationMetrics.adaptationEfficiency);
    
    const mean = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;
    const variance = efficiencies.reduce((sum, eff) => sum + Math.pow(eff - mean, 2), 0) / efficiencies.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - Math.sqrt(variance));
  }

  private calculateSummaryMetrics(testSuite: AdaptationTestSuite): any {
    const results = testSuite.results;
    
    return {
      totalTests: results.length,
      successRate: results.filter(r => r.adaptationSuccess).length / results.length,
      averageAdaptationCycles: results.reduce((sum, r) => sum + r.adaptationCycles, 0) / results.length,
      averagePerformanceImprovement: results.reduce((sum, r) => sum + r.performanceImprovement, 0) / results.length,
      averageCapabilityGrowth: results.reduce((sum, r) => sum + (r.finalCapabilities - r.initialCapabilities), 0) / results.length
    };
  }

  private summarizeOverallResults(testSuite: AdaptationTestSuite): any {
    const summary = testSuite.summaryMetrics;
    
    return {
      overallSuccess: summary.successRate >= 0.8,
      adaptationEffectiveness: summary.averageAdaptationCycles <= this.config.maxAdaptationCycles,
      performanceGains: summary.averagePerformanceImprovement > 0.2,
      capabilityEvolution: summary.averageCapabilityGrowth > 0
    };
  }

  private aggregateAdaptationMetrics(testSuite: AdaptationTestSuite): any {
    const allMetrics = testSuite.results.map(r => r.adaptationMetrics);
    
    return {
      averageAdaptationSpeed: allMetrics.reduce((sum, m) => sum + m.adaptationSpeed, 0) / allMetrics.length,
      averageAdaptationEfficiency: allMetrics.reduce((sum, m) => sum + m.adaptationEfficiency, 0) / allMetrics.length,
      averageCapabilityFlexibility: allMetrics.reduce((sum, m) => sum + m.capabilityFlexibility, 0) / allMetrics.length,
      averageNoveltyHandling: allMetrics.reduce((sum, m) => sum + m.noveltyHandling, 0) / allMetrics.length
    };
  }

  private analyzePerformancePatterns(testSuite: AdaptationTestSuite): any {
    const results = testSuite.results;
    
    // Group by task characteristics
    const byNovelty = new Map<number, AdaptationTestResult[]>();
    const byComplexity = new Map<number, AdaptationTestResult[]>();
    
    testSuite.novelTasks.forEach((task, index) => {
      const result = results[index];
      if (result) {
        // Group by novelty level (rounded to nearest 0.1)
        const noveltyKey = Math.round(task.noveltyLevel * 10) / 10;
        if (!byNovelty.has(noveltyKey)) byNovelty.set(noveltyKey, []);
        byNovelty.get(noveltyKey)!.push(result);
        
        // Group by complexity level (rounded to nearest 0.1)
        const complexityKey = Math.round(task.complexity * 10) / 10;
        if (!byComplexity.has(complexityKey)) byComplexity.set(complexityKey, []);
        byComplexity.get(complexityKey)!.push(result);
      }
    });
    
    return {
      noveltyPatterns: this.analyzeGroupedResults(byNovelty),
      complexityPatterns: this.analyzeGroupedResults(byComplexity),
      adaptationTrends: this.identifyAdaptationTrends(results)
    };
  }

  private analyzeGroupedResults(groupedResults: Map<number, AdaptationTestResult[]>): any {
    const analysis: any = {};
    
    groupedResults.forEach((results, key) => {
      analysis[key] = {
        count: results.length,
        successRate: results.filter(r => r.adaptationSuccess).length / results.length,
        averageCycles: results.reduce((sum, r) => sum + r.adaptationCycles, 0) / results.length,
        averageImprovement: results.reduce((sum, r) => sum + r.performanceImprovement, 0) / results.length
      };
    });
    
    return analysis;
  }

  private identifyAdaptationTrends(results: AdaptationTestResult[]): string[] {
    const trends: string[] = [];
    
    // Analyze success rate trend
    const midpoint = Math.floor(results.length / 2);
    const firstHalfSuccess = results.slice(0, midpoint).filter(r => r.adaptationSuccess).length / midpoint;
    const secondHalfSuccess = results.slice(midpoint).filter(r => r.adaptationSuccess).length / (results.length - midpoint);
    
    if (secondHalfSuccess > firstHalfSuccess + 0.1) {
      trends.push('improving_success_rate');
    } else if (secondHalfSuccess < firstHalfSuccess - 0.1) {
      trends.push('declining_success_rate');
    }
    
    // Analyze adaptation speed trend
    const firstHalfCycles = results.slice(0, midpoint).reduce((sum, r) => sum + r.adaptationCycles, 0) / midpoint;
    const secondHalfCycles = results.slice(midpoint).reduce((sum, r) => sum + r.adaptationCycles, 0) / (results.length - midpoint);
    
    if (secondHalfCycles < firstHalfCycles - 0.5) {
      trends.push('improving_adaptation_speed');
    } else if (secondHalfCycles > firstHalfCycles + 0.5) {
      trends.push('declining_adaptation_speed');
    }
    
    return trends;
  }

  private generateAdaptationRecommendations(testSuite: AdaptationTestSuite): string[] {
    const recommendations: string[] = [];
    const summary = testSuite.summaryMetrics;
    
    if (summary.successRate < 0.7) {
      recommendations.push('Improve adaptation algorithms - success rate below target');
    }
    
    if (summary.averageAdaptationCycles > this.config.maxAdaptationCycles * 0.8) {
      recommendations.push('Optimize adaptation speed - taking too many cycles');
    }
    
    if (summary.averagePerformanceImprovement < 0.2) {
      recommendations.push('Enhance capability evolution - insufficient performance gains');
    }
    
    if (summary.averageCapabilityGrowth < 0.5) {
      recommendations.push('Increase capability acquisition rate - limited capability growth');
    }
    
    return recommendations;
  }
}

/**
 * Quick adaptation validation function
 */
export async function validateAdaptation(
  agent: AdaptiveAgent,
  targetAdaptationCycles: number = 5
): Promise<boolean> {
  const tester = new AdaptationTester({ maxAdaptationCycles: targetAdaptationCycles });
  
  // Generate a medium-novelty task
  const testTask = tester.generateNovelTask(0.6);
  
  const result = await tester.testSingleTaskAdaptation(agent, testTask);
  
  console.log(`Adaptation validation: ${result.adaptationSuccess ? 'PASS' : 'FAIL'} (${result.adaptationCycles} cycles)`);
  
  return result.adaptationSuccess && result.adaptationCycles <= targetAdaptationCycles;
}

/**
 * Batch adaptation testing function
 */
export async function testAdaptationBatch(
  agents: AdaptiveAgent[],
  testConfig: any = {}
): Promise<any> {
  const tester = new AdaptationTester(testConfig);
  
  const batchResults = await Promise.all(
    agents.map(agent => validateAdaptation(agent, testConfig.maxAdaptationCycles))
  );
  
  const successCount = batchResults.filter(result => result).length;
  const successRate = successCount / agents.length;
  
  console.log(`Batch adaptation test: ${successCount}/${agents.length} agents passed (${(successRate * 100).toFixed(1)}%)`);
  
  return {
    totalAgents: agents.length,
    successfulAdaptations: successCount,
    successRate,
    passed: successRate >= 0.8
  };
}
