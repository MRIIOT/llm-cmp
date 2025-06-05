/**
 * Agent Test Runner - Week 2 Dynamic Agent Specialization Framework Tests
 * 
 * Comprehensive test suite for validating agent adaptation, specialization,
 * performance improvement, and population diversity maintenance.
 */

import { AdaptationTester, validateAdaptation, testAdaptationBatch } from './adaptation.test';

export class AgentTestRunner {
  private config: any;

  constructor(config: any = {}) {
    this.config = {
      maxAdaptationCycles: config.maxAdaptationCycles || 5,
      successThreshold: config.successThreshold || 0.8,
      populationSize: config.populationSize || 10,
      ...config
    };
  }

  /**
   * Run adaptation tests (novel task adaptation in 5 cycles)
   */
  async runAdaptationTests(): Promise<boolean> {
    console.log('🔄 Running Agent Adaptation Tests...');
    
    try {
      // Import AdaptiveAgent for testing
      const { AdaptiveAgent } = await import('../../agents/dynamic/adaptive-agent');
      
      // Create test agent
      const initialCapabilities = [{
        id: 'reasoning',
        name: 'Reasoning Capability',
        strength: 0.7,
        adaptationRate: 0.8,
        specialization: ['reasoning', 'analytical'],
        morphology: {},
        lastUsed: new Date(),
        performanceHistory: [0.6, 0.7, 0.75]
      }];
      
      const testAgent = new AdaptiveAgent('test_agent_adaptation', initialCapabilities);

      const adaptationTester = new AdaptationTester(this.config);
      
      // Test 1: Single agent adaptation validation
      console.log('  • Testing single agent adaptation...');
      const singleResult = await validateAdaptation(testAgent, this.config.maxAdaptationCycles);
      
      if (!singleResult) {
        console.log('  ❌ Single agent adaptation test FAILED');
        return false;
      }
      console.log('  ✅ Single agent adaptation test PASSED');

      // Test 2: Novel task adaptation across different novelty levels
      console.log('  • Testing adaptation across novelty levels...');
      const speedResults = await adaptationTester.testAdaptationSpeed(testAgent);
      const averageSpeed = speedResults.averageSpeed;
      
      if (averageSpeed > this.config.maxAdaptationCycles) {
        console.log(`  ❌ Adaptation speed test FAILED (${averageSpeed} > ${this.config.maxAdaptationCycles} cycles)`);
        return false;
      }
      console.log(`  ✅ Adaptation speed test PASSED (${averageSpeed.toFixed(1)} avg cycles)`);

      // Test 3: Cross-domain adaptation
      console.log('  • Testing cross-domain adaptation...');
      const crossDomainResults = await adaptationTester.testCrossDomainAdaptation(testAgent);
      const transferSuccess = crossDomainResults.transferSuccess;
      
      if (transferSuccess < 0.7) {
        console.log(`  ❌ Cross-domain adaptation FAILED (${(transferSuccess * 100).toFixed(1)}% success rate)`);
        return false;
      }
      console.log(`  ✅ Cross-domain adaptation PASSED (${(transferSuccess * 100).toFixed(1)}% success rate)`);

      console.log('✅ All adaptation tests PASSED');
      return true;

    } catch (error) {
      console.error('❌ Adaptation tests failed with error:', error);
      return false;
    }
  }

  /**
   * Run specialization emergence tests
   */
  async runSpecializationTests(): Promise<boolean> {
    console.log('🧬 Running Agent Specialization Emergence Tests...');
    
    try {
      // Import required classes
      const { SpecializationEngine } = await import('../../agents/dynamic/specialization-engine');
      const { AdaptiveAgent } = await import('../../agents/dynamic/adaptive-agent');
      
      // Test 1: Specialization emergence from task distribution
      console.log('  • Testing specialization emergence...');
      
      const specializationEngine = new SpecializationEngine({
        learningRate: 0.1,
        specializationThreshold: 0.6
      });

      // Create base agent
      const baseCapabilities = [{
        id: 'general',
        name: 'General Capability',
        strength: 0.5,
        adaptationRate: 0.8,
        specialization: ['general'],
        morphology: {},
        lastUsed: new Date(),
        performanceHistory: [0.5, 0.6]
      }];
      
      const baseAgent = new AdaptiveAgent('test_agent_specialization', baseCapabilities);

      // Simulate task distribution that should drive specialization
      const taskTypes = ['analytical', 'creative', 'technical', 'social'];
      let specializationCount = 0;

      for (const taskType of taskTypes) {
        const specialized = await specializationEngine.evaluateSpecializationNeed(baseAgent, {
          taskType,
          frequency: 0.8,
          complexity: 0.7
        });

        if (specialized) {
          specializationCount++;
        }
      }

      if (specializationCount < 2) {
        console.log(`  ❌ Specialization emergence test FAILED (only ${specializationCount} specializations emerged)`);
        return false;
      }
      console.log(`  ✅ Specialization emergence test PASSED (${specializationCount} specializations)`);

      // Test 2: Specialization quality assessment
      console.log('  • Testing specialization quality...');
      
      const specializedAgent = await specializationEngine.createSpecializedAgent(baseAgent, 'analytical');
      const profile = specializedAgent.getSpecializationProfile();
      
      if (profile.specialization.length === 0 || !profile.specialization.includes('analytical')) {
        console.log('  ❌ Specialization quality test FAILED (no analytical specialization)');
        return false;
      }
      console.log('  ✅ Specialization quality test PASSED');

      console.log('✅ All specialization tests PASSED');
      return true;

    } catch (error) {
      console.error('❌ Specialization tests failed with error:', error);
      return false;
    }
  }

  /**
   * Run performance improvement tests
   */
  async runPerformanceTests(): Promise<boolean> {
    console.log('📈 Running Agent Performance Improvement Tests...');
    
    try {
      // Import required classes
      const { PerformanceTracker } = await import('../../agents/dynamic/performance-tracker');
      const { AdaptiveAgent } = await import('../../agents/dynamic/adaptive-agent');
      
      // Test 1: Performance tracking and improvement
      console.log('  • Testing performance tracking...');
      
      const performanceTracker = new PerformanceTracker({
        windowSize: 10,
        improvementThreshold: 0.1
      });

      const performanceCapabilities = [{
        id: 'reasoning',
        name: 'Reasoning Capability',
        strength: 0.6,
        adaptationRate: 0.8,
        specialization: ['reasoning'],
        morphology: {},
        lastUsed: new Date(),
        performanceHistory: [0.5, 0.6]
      }];
      
      const testAgent = new AdaptiveAgent('test_agent_performance', performanceCapabilities);

      // Simulate performance improvements over time
      const performanceHistory: number[] = [];
      for (let i = 0; i < 10; i++) {
        const performance = 0.3 + (i * 0.07) + (Math.random() * 0.05); // Improving trend
        performanceHistory.push(performance);
        
        await performanceTracker.recordPerformance(
          {
            id: `task_${i}`,
            type: 'reasoning',
            complexity: 0.6,
            context: {}
          }, 
          {
            accuracy: performance,
            efficiency: 0.7,
            quality: performance,
            executionTime: 1000
          },
          [{
            id: 'reasoning',
            name: 'Reasoning Capability', 
            strength: 0.7,
            adaptationRate: 0.1,
            specialization: ['reasoning'],
            morphology: {},
            lastUsed: new Date(),
            performanceHistory: []
          }]
        );
      }

      const improvement = await performanceTracker.analyzePerformanceImprovement(testAgent.getSpecializationProfile().id);
      
      if (!improvement.isImproving || improvement.improvementRate < 0.05) {
        console.log(`  ❌ Performance improvement test FAILED (improvement rate: ${improvement.improvementRate.toFixed(3)})`);
        return false;
      }
      console.log(`  ✅ Performance improvement test PASSED (improvement rate: ${improvement.improvementRate.toFixed(3)})`);

      // Test 2: Performance benchmarking
      console.log('  • Testing performance benchmarking...');
      
      const benchmarkResults = await performanceTracker.runPerformanceBenchmark(testAgent);
      
      if (!benchmarkResults.passed || benchmarkResults.overallScore < 0.6) {
        console.log(`  ❌ Performance benchmark test FAILED (score: ${benchmarkResults.overallScore.toFixed(2)})`);
        return false;
      }
      console.log(`  ✅ Performance benchmark test PASSED (score: ${benchmarkResults.overallScore.toFixed(2)})`);

      console.log('✅ All performance tests PASSED');
      return true;

    } catch (error) {
      console.error('❌ Performance tests failed with error:', error);
      return false;
    }
  }

  /**
   * Run population diversity tests
   */
  async runPopulationTests(): Promise<boolean> {
    console.log('🌍 Running Agent Population Diversity Tests...');
    
    try {
      // Import required classes
      const { PopulationManager } = await import('../../agents/evolution/population-manager');
      const { AdaptiveAgent } = await import('../../agents/dynamic/adaptive-agent');
      
      // Test 1: Population diversity maintenance
      console.log('  • Testing population diversity maintenance...');
      
      const populationManager = new PopulationManager({
        maxPopulationSize: this.config.populationSize,
        diversityThreshold: 0.7,
        elitismRate: 0.2
      });

      // Create initial diverse population
      const initialAgents: any[] = [];
      const specializations = ['analytical', 'creative', 'technical', 'social', 'critical'];
      
      for (let i = 0; i < this.config.populationSize; i++) {
        const specialization = specializations[i % specializations.length];
        const capabilities = [{
          id: specialization,
          name: `${specialization} Capability`,
          strength: 0.5 + (Math.random() * 0.3),
          adaptationRate: 0.5 + (Math.random() * 0.4),
          specialization: [specialization],
          morphology: {},
          lastUsed: new Date(),
          performanceHistory: [0.5, 0.6]
        }];
        
        const agent = new AdaptiveAgent(`agent_${i}`, capabilities);
        initialAgents.push(agent);
      }

      await populationManager.initializePopulation(initialAgents);
      
      // Test diversity metrics
      const diversityMetrics = await populationManager.assessPopulationDiversity();
      
      if (diversityMetrics.overallDiversity < 0.6) {
        console.log(`  ❌ Population diversity test FAILED (diversity: ${diversityMetrics.overallDiversity.toFixed(2)})`);
        return false;
      }
      console.log(`  ✅ Population diversity test PASSED (diversity: ${diversityMetrics.overallDiversity.toFixed(2)})`);

      // Test 2: Population evolution
      console.log('  • Testing population evolution...');
      
      const evolutionResults = await populationManager.evolvePopulation(5);
      
      if (!evolutionResults.success || evolutionResults.generationsCompleted < 3) {
        console.log(`  ❌ Population evolution test FAILED (${evolutionResults.generationsCompleted} generations)`);
        return false;
      }
      console.log(`  ✅ Population evolution test PASSED (${evolutionResults.generationsCompleted} generations)`);

      // Test 3: Diversity preservation during evolution
      console.log('  • Testing diversity preservation...');
      
      const finalDiversity = await populationManager.assessPopulationDiversity();
      const diversityLoss = diversityMetrics.overallDiversity - finalDiversity.overallDiversity;
      
      if (diversityLoss > 0.3) {
        console.log(`  ❌ Diversity preservation test FAILED (loss: ${diversityLoss.toFixed(2)})`);
        return false;
      }
      console.log(`  ✅ Diversity preservation test PASSED (loss: ${diversityLoss.toFixed(2)})`);

      console.log('✅ All population tests PASSED');
      return true;

    } catch (error) {
      console.error('❌ Population tests failed with error:', error);
      return false;
    }
  }

  /**
   * Run Week 2 success criteria validation
   */
  async validateWeek2Criteria(): Promise<boolean> {
    console.log('🎯 Validating Week 2 Success Criteria...');
    console.log('=' .repeat(50));

    let criteriaResults = {
      adaptation: false,
      specialization: false,
      performance: false,
      diversity: false
    };

    // Criterion 1: Agents adapt to novel task types within 5 reasoning cycles
    console.log('\n1️⃣ Testing: Agents adapt to novel task types within 5 reasoning cycles');
    criteriaResults.adaptation = await this.runAdaptationTests();

    // Criterion 2: Specialization emerges naturally from task distribution  
    console.log('\n2️⃣ Testing: Specialization emerges naturally from task distribution');
    criteriaResults.specialization = await this.runSpecializationTests();

    // Criterion 3: Performance improvement demonstrated on benchmarks
    console.log('\n3️⃣ Testing: Performance improvement demonstrated on benchmarks');
    criteriaResults.performance = await this.runPerformanceTests();

    // Criterion 4: Agent population maintains diversity while improving
    console.log('\n4️⃣ Testing: Agent population maintains diversity while improving');
    criteriaResults.diversity = await this.runPopulationTests();

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 WEEK 2 SUCCESS CRITERIA RESULTS:');
    console.log(`   Adaptation (≤5 cycles): ${criteriaResults.adaptation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Specialization emergence: ${criteriaResults.specialization ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Performance improvement: ${criteriaResults.performance ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Diversity maintenance: ${criteriaResults.diversity ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(criteriaResults).every(result => result);
    console.log(`\n🎯 OVERALL WEEK 2 RESULT: ${allPassed ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 Week 2 Dynamic Agent Specialization Framework is ready for production!');
    } else {
      console.log('\n⚠️ Week 2 implementation needs fixes before proceeding to Week 3.');
    }

    return allPassed;
  }
}

/**
 * Quick agent validation function
 */
export async function runQuickAgentValidation(): Promise<boolean> {
  console.log('⚡ Running Quick Agent Validation...');
  
  try {
    const { AdaptiveAgent } = await import('../../agents/dynamic/adaptive-agent');
    
    // Quick adaptation test
    const quickCapabilities = [{
      id: 'reasoning',
      name: 'Reasoning Capability',
      strength: 0.7,
      adaptationRate: 0.8,
      specialization: ['reasoning'],
      morphology: {},
      lastUsed: new Date(),
      performanceHistory: [0.6, 0.7]
    }];
    
    const testAgent = new AdaptiveAgent('quick_test_agent', quickCapabilities);

    const adaptationSuccess = await validateAdaptation(testAgent, 5);
    
    console.log(`⚡ Quick validation: ${adaptationSuccess ? 'PASSED' : 'FAILED'}`);
    return adaptationSuccess;

  } catch (error) {
    console.error('❌ Quick validation failed:', error);
    return false;
  }
}

/**
 * Run full agent validation suite
 */
export async function runAgentValidation(): Promise<any> {
  const runner = new AgentTestRunner();
  
  const results = {
    adaptation: await runner.runAdaptationTests(),
    specialization: await runner.runSpecializationTests(), 
    performance: await runner.runPerformanceTests(),
    diversity: await runner.runPopulationTests(),
    overallPassed: false
  };

  results.overallPassed = Object.values(results).slice(0, 4).every(result => result);

  return results;
}
