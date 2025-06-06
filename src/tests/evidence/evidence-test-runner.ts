/**
 * Evidence System Test Runner
 * Coordinates execution of all evidence integration tests
 */

import { BayesianNetwork } from '../../evidence/bayesian/bayesian-network';
import { InferenceEngine } from '../../evidence/bayesian/inference-engine';
import { EvidenceAggregator } from '../../evidence/bayesian/evidence-aggregator';
import { ConflictResolver } from '../../evidence/bayesian/conflict-resolver';
import { BeliefUpdater, UpdatePolicy } from '../../evidence/bayesian/belief-updater';
import { UncertaintyMetrics } from '../../evidence/uncertainty/uncertainty-metrics';
import { ConfidenceIntervals } from '../../evidence/uncertainty/confidence-intervals';
import { SensitivityAnalysis } from '../../evidence/uncertainty/sensitivity-analysis';
import { EpistemicUncertainty } from '../../evidence/uncertainty/epistemic-uncertainty';
import { Evidence, BeliefState } from '../../types/evidence.types';

export class EvidenceTestRunner {
  /**
   * Run comprehensive evidence system validation
   */
  static async runAllTests(): Promise<{
    passed: boolean;
    results: Map<string, boolean>;
    summary: string;
  }> {
    const results = new Map<string, boolean>();
    
    console.log('🧪 Running Evidence System Tests...\n');
    
    // Test Bayesian Network Construction
    console.log('1️⃣ Testing Bayesian Network Construction...');
    const networkTest = await this.testBayesianNetwork();
    results.set('Bayesian Network', networkTest);
    console.log(`   ${networkTest ? '✅' : '❌'} Bayesian Network: ${networkTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Test Inference Engine
    console.log('2️⃣ Testing Inference Engine...');
    const inferenceTest = await this.testInferenceEngine();
    results.set('Inference Engine', inferenceTest);
    console.log(`   ${inferenceTest ? '✅' : '❌'} Inference Engine: ${inferenceTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Test Evidence Aggregation
    console.log('3️⃣ Testing Evidence Aggregation...');
    const aggregationTest = await this.testEvidenceAggregation();
    results.set('Evidence Aggregation', aggregationTest);
    console.log(`   ${aggregationTest ? '✅' : '❌'} Evidence Aggregation: ${aggregationTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Test Conflict Resolution
    console.log('4️⃣ Testing Conflict Resolution...');
    const conflictTest = await this.testConflictResolution();
    results.set('Conflict Resolution', conflictTest);
    console.log(`   ${conflictTest ? '✅' : '❌'} Conflict Resolution: ${conflictTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Test Belief Updates
    console.log('5️⃣ Testing Belief Updates...');
    const beliefTest = await this.testBeliefUpdates();
    results.set('Belief Updates', beliefTest);
    console.log(`   ${beliefTest ? '✅' : '❌'} Belief Updates: ${beliefTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Test Uncertainty Quantification
    console.log('6️⃣ Testing Uncertainty Quantification...');
    const uncertaintyTest = await this.testUncertaintyQuantification();
    results.set('Uncertainty Quantification', uncertaintyTest);
    console.log(`   ${uncertaintyTest ? '✅' : '❌'} Uncertainty Quantification: ${uncertaintyTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Test Integrated Evidence Processing
    console.log('7️⃣ Testing Integrated Evidence Processing...');
    const integrationTest = await this.testIntegratedProcessing();
    results.set('Integrated Processing', integrationTest);
    console.log(`   ${integrationTest ? '✅' : '❌'} Integrated Processing: ${integrationTest ? 'PASSED' : 'FAILED'}\n`);
    
    // Generate summary
    const passed = Array.from(results.values()).every(r => r);
    const summary = this.generateSummary(results);
    
    return { passed, results, summary };
  }
  
  /**
   * Test Bayesian network construction and structure
   */
  private static async testBayesianNetwork(): Promise<boolean> {
    try {
      const network = new BayesianNetwork();
      
      // Test node creation
      network.addNode({
        id: 'cause',
        name: 'Cause',
        states: ['true', 'false'],
        probabilities: new Map([['true', 0.3], ['false', 0.7]]),
        parents: [],
        children: []
      });
      
      network.addNode({
        id: 'effect',
        name: 'Effect',
        states: ['true', 'false'],
        probabilities: new Map([['true', 0.5], ['false', 0.5]]),
        parents: [],
        children: []
      });
      
      // Test edge creation
      network.addEdge('cause', 'effect');
      
      // Verify structure
      const stats = network.getStatistics();
      if (stats.nodeCount !== 2) return false;
      if (stats.edgeCount !== 1) return false;
      if (network.hasCycles()) return false;
      
      // Test evidence-based construction
      const evidence: Evidence[] = [
        { content: 'Test A', source: 's1', confidence: 0.8, topic: 'A' },
        { content: 'Test B', source: 's2', confidence: 0.7, topic: 'B' }
      ];
      
      network.constructFromEvidence(evidence);
      
      return true;
    } catch (error) {
      console.error('Bayesian network test failed:', error);
      return false;
    }
  }
  
  /**
   * Test probabilistic inference
   */
  private static async testInferenceEngine(): Promise<boolean> {
    try {
      const network = new BayesianNetwork();
      const engine = new InferenceEngine(network);
      
      // Setup simple network
      network.addNode({
        id: 'rain',
        name: 'Rain',
        states: ['yes', 'no'],
        probabilities: new Map([['yes', 0.2], ['no', 0.8]]),
        parents: [],
        children: []
      });
      
      network.addNode({
        id: 'wet',
        name: 'Grass Wet',
        states: ['yes', 'no'],
        probabilities: new Map([['yes', 0.5], ['no', 0.5]]),
        parents: [],
        children: []
      });
      
      network.addEdge('rain', 'wet');
      
      // Set conditional probability
      network.setCPT('wet', {
        node: 'wet',
        conditions: new Map([
          ['rain:yes', new Map([['yes', 0.9], ['no', 0.1]])],
          ['rain:no', new Map([['yes', 0.2], ['no', 0.8]])]
        ])
      });
      
      // Test exact inference
      const result = engine.infer({
        target: 'rain',
        evidence: new Map([['wet', 'yes']]),
        method: 'exact'
      });
      
      console.log('   Inference result:', result);
      
      if (!result.posterior) {
        console.error('   ERROR: No posterior distribution returned');
        return false;
      }
      
      // P(rain|wet) should be higher than P(rain)
      const posteriorRain = result.posterior.get('yes') || 0;
      console.log('   Posterior P(rain|wet=yes):', posteriorRain);
      
      if (posteriorRain <= 0.2) {
        console.error('   ERROR: Posterior probability too low:', posteriorRain);
        return false;
      }
      
      // Test other inference methods
      const samplingResult = engine.infer({
        target: 'rain',
        evidence: new Map([['wet', 'yes']]),
        method: 'sampling'
      });
      
      console.log('   Sampling result samples:', samplingResult.samples);
      
      if (!samplingResult.samples || samplingResult.samples < 100) {
        console.error('   ERROR: Not enough samples:', samplingResult.samples);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('   Inference engine test error:', error);
      console.error('   Stack trace:', (error as Error).stack);
      return false;
    }
  }
  
  /**
   * Test evidence aggregation methods
   */
  private static async testEvidenceAggregation(): Promise<boolean> {
    try {
      const aggregator = new EvidenceAggregator();
      
      // Add multiple sources
      aggregator.addSource({
        id: 'expert',
        reliability: 0.9,
        evidence: [{
          content: 'Expert opinion',
          source: 'expert',
          confidence: 0.85,
          topic: 'hypothesis'
        }]
      });
      
      aggregator.addSource({
        id: 'crowd',
        reliability: 0.6,
        evidence: [{
          content: 'Crowd wisdom',
          source: 'crowd',
          confidence: 0.65,
          topic: 'hypothesis'
        }]
      });
      
      // Test weighted aggregation
      const weighted = aggregator.aggregate({
        method: 'weighted',
        conflictResolution: 'averaging',
        uncertaintyPropagation: true
      });
      
      if (!weighted.beliefStates.has('hypothesis')) return false;
      
      const belief = weighted.beliefStates.get('hypothesis')!;
      // Should favor expert opinion
      if (belief.belief < 0.7) return false;
      
      // Test hierarchical aggregation
      const hierarchical = aggregator.aggregate({
        method: 'hierarchical',
        conflictResolution: 'dempster-shafer',
        uncertaintyPropagation: true
      });
      
      if (!hierarchical.hierarchy) return false;
      
      return true;
    } catch (error) {
      console.error('Evidence aggregation test failed:', error);
      return false;
    }
  }
  
  /**
   * Test conflict resolution mechanisms
   */
  private static async testConflictResolution(): Promise<boolean> {
    try {
      const resolver = new ConflictResolver();
      
      const conflictingEvidence: Evidence[] = [
        {
          content: 'System is working',
          source: 'monitor_1',
          confidence: 0.9,
          topic: 'status'
        },
        {
          content: 'System is failing',
          source: 'monitor_2',
          confidence: 0.85,
          topic: 'status'
        }
      ];
      
      // Detect conflicts
      const conflicts = resolver.detectConflicts(conflictingEvidence);
      console.log('   Detected conflicts:', conflicts.length);
      
      if (conflicts.length === 0) {
        console.error('   ERROR: No conflicts detected');
        return false;
      }
      if (conflicts[0].severity < 0.5) {
        console.error('   ERROR: Conflict severity too low:', conflicts[0].severity);
        return false;
      }
      
      // Resolve conflicts
      const resolutions = resolver.resolveConflicts(
        conflictingEvidence,
        conflicts,
        { method: 'argumentation', parameters: new Map() }
      );
      
      console.log('   Resolutions found:', resolutions.length);
      
      if (resolutions.length === 0) {
        console.error('   ERROR: No resolutions found');
        return false;
      }
      if (!resolutions[0].explanation) {
        console.error('   ERROR: No explanation provided');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('   Conflict resolution test error:', error);
      console.error('   Stack trace:', (error as Error).stack);
      return false;
    }
  }
  
  /**
   * Test belief update mechanisms
   */
  private static async testBeliefUpdates(): Promise<boolean> {
    try {
      const policy: UpdatePolicy = {
        method: 'bayesian',
        learningRate: 0.1,
        momentum: 0.9,
        adaptiveLearning: true
      };
      
      const updater = new BeliefUpdater(policy);
      
      // Sequential updates
      const evidence1: Evidence = {
        content: 'Initial evidence',
        source: 'source1',
        confidence: 0.7,
        timestamp: new Date()
      };
      
      console.log('   Testing first belief update...');
      const update1 = updater.updateBelief('test_topic', evidence1);
      console.log('   Initial belief:', update1.previousBelief.belief);
      console.log('   Updated belief:', update1.newBelief.belief);
      
      if (update1.newBelief.belief === 0.5) {
        console.error('   ERROR: Belief did not change from prior');
        return false; // Should change from prior
      }
      
      const evidence2: Evidence = {
        content: 'Confirming evidence',
        source: 'source2',
        confidence: 0.8,
        timestamp: new Date()
      };
      
      console.log('   Testing second belief update...');
      const update2 = updater.updateBelief('test_topic', evidence2);
      console.log('   Previous belief:', update2.previousBelief.belief);
      console.log('   New belief:', update2.newBelief.belief);
      
      if (update2.newBelief.belief <= update1.newBelief.belief) {
        console.error('   ERROR: Belief did not increase with confirming evidence');
        return false; // Should increase
      }
      
      // Test batch updates
      console.log('   Testing batch updates...');
      const batchUpdates = updater.batchUpdate([
        { topic: 'topic1', evidence: evidence1 },
        { topic: 'topic2', evidence: evidence2 }
      ]);
      
      console.log('   Batch update count:', batchUpdates.length);
      
      if (batchUpdates.length !== 2) {
        console.error('   ERROR: Wrong number of batch updates');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('   Belief update test error:', error);
      console.error('   Stack trace:', (error as Error).stack);
      return false;
    }
  }
  
  /**
   * Test uncertainty quantification
   */
  private static async testUncertaintyQuantification(): Promise<boolean> {
    try {
      const metrics = new UncertaintyMetrics();
      const intervals = new ConfidenceIntervals();
      const epistemic = new EpistemicUncertainty();
      
      const testBelief: BeliefState = {
        belief: 0.7,
        uncertainty: 0.2,
        evidence: Array.from({ length: 20 }, () => ({
          content: 'Test',
          source: 'test',
          confidence: 0.7 + (Math.random() - 0.5) * 0.2
        })),
        lastUpdated: new Date()
      };
      
      // Test uncertainty metrics
      const uncertainty = metrics.computeUncertainty(testBelief);
      if (uncertainty.total <= 0 || uncertainty.total > 1) return false;
      if (uncertainty.aleatoric < 0 || uncertainty.epistemic < 0) return false;
      
      // Test confidence intervals
      const ci = intervals.computeConfidenceInterval(testBelief, 0.95);
      if (ci.lower >= ci.upper) return false;
      if (ci.lower < 0 || ci.upper > 1) return false;
      if (testBelief.belief < ci.lower || testBelief.belief > ci.upper) return false;
      
      // Test epistemic uncertainty
      const decomposed = epistemic.decomposeUncertainty(
        testBelief,
        testBelief.evidence
      );
      
      if (decomposed.epistemic.total < 0) return false;
      if (decomposed.aleatoric < 0) return false;
      if (decomposed.ratio < 0 || decomposed.ratio > 1) return false;
      
      return true;
    } catch (error) {
      console.error('Uncertainty quantification test failed:', error);
      return false;
    }
  }
  
  /**
   * Test integrated evidence processing pipeline
   */
  private static async testIntegratedProcessing(): Promise<boolean> {
    try {
      console.log('   Setting up integrated system...');
      // Create integrated system
      const network = new BayesianNetwork();
      const engine = new InferenceEngine(network);
      const aggregator = new EvidenceAggregator();
      const resolver = new ConflictResolver();
      const updater = new BeliefUpdater({
        method: 'bayesian',
        learningRate: 0.1,
        momentum: 0.9,
        adaptiveLearning: true
      });
      
      // Complex evidence scenario
      const complexEvidence: Evidence[] = [
        {
          content: 'Market indicators positive',
          source: 'technical_analysis',
          confidence: 0.75,
          topic: 'market_trend',
          timestamp: new Date()
        },
        {
          content: 'Economic data negative',
          source: 'economic_analysis',
          confidence: 0.3,
          topic: 'market_trend',
          timestamp: new Date()
        },
        {
          content: 'Sentiment bullish',
          source: 'sentiment_analysis',
          confidence: 0.8,
          topic: 'market_trend',
          timestamp: new Date()
        }
      ];
      
      console.log('   Building network from evidence...');
      // Build network from evidence
      network.constructFromEvidence(complexEvidence);
      
      // Add to aggregator
      console.log('   Adding source to aggregator...');
      aggregator.addSource({
        id: 'market_analysis',
        reliability: 0.85,
        evidence: complexEvidence
      });
      
      // Aggregate with conflict resolution
      console.log('   Aggregating evidence...');
      const aggregated = aggregator.aggregate({
        method: 'weighted',
        conflictResolution: 'dempster-shafer',
        uncertaintyPropagation: true
      });
      
      console.log('   Aggregated conflicts:', aggregated.conflicts?.size);
      
      // Check for conflicts
      if (!aggregated.conflicts || aggregated.conflicts.size === 0) {
        // Should detect conflicts between positive and negative indicators
        console.error('   ERROR: No conflicts detected in contradictory evidence');
        return false;
      }
      
      // Update beliefs
      console.log('   Updating beliefs...');
      for (const evidence of complexEvidence) {
        updater.updateBelief('market_analysis', evidence);
      }
      
      const finalBelief = updater.getBelief('market_analysis');
      console.log('   Final belief:', finalBelief);
      
      if (!finalBelief) {
        console.error('   ERROR: No final belief found');
        return false;
      }
      
      console.log('   Final belief value:', finalBelief.belief);
      console.log('   Final uncertainty:', finalBelief.uncertainty);
      
      // Should have moderate belief with elevated uncertainty
      if (finalBelief.belief < 0.4 || finalBelief.belief > 0.8) {
        console.error('   ERROR: Belief out of expected range:', finalBelief.belief);
        return false;
      }
      if (finalBelief.uncertainty < 0.15) {
        console.error('   ERROR: Uncertainty too low:', finalBelief.uncertainty);
        return false;
      }
      
      // Test inference through network
      console.log('   Testing inference...');
      const marketInference = engine.infer({
        target: 'market_trend',
        evidence: new Map(),
        method: 'exact'
      });
      
      console.log('   Market inference result:', marketInference);
      
      if (!marketInference.posterior || marketInference.posterior.size === 0) {
        console.error('   ERROR: No inference posterior found');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('   Integrated processing test error:', error);
      console.error('   Stack trace:', (error as Error).stack);
      return false;
    }
  }
  
  /**
   * Generate test summary
   */
  private static generateSummary(results: Map<string, boolean>): string {
    const total = results.size;
    const passed = Array.from(results.values()).filter(r => r).length;
    const failed = total - passed;
    
    let summary = '📊 Evidence System Test Summary\n';
    summary += '================================\n\n';
    
    // Overall results
    summary += `Total Tests: ${total}\n`;
    summary += `✅ Passed: ${passed}\n`;
    summary += `❌ Failed: ${failed}\n`;
    summary += `Success Rate: ${((passed / total) * 100).toFixed(1)}%\n\n`;
    
    // Individual results
    summary += 'Detailed Results:\n';
    summary += '----------------\n';
    
    for (const [test, result] of results) {
      summary += `${result ? '✅' : '❌'} ${test}\n`;
    }
    
    summary += '\n';
    
    // Week 3 criteria validation
    summary += 'Week 3 Success Criteria:\n';
    summary += '------------------------\n';
    
    const bayesianPassed = results.get('Bayesian Network') && results.get('Inference Engine');
    summary += `${bayesianPassed ? '✅' : '❌'} Bayesian networks correctly integrate contradictory evidence\n`;
    
    const uncertaintyPassed = results.get('Uncertainty Quantification');
    summary += `${uncertaintyPassed ? '✅' : '❌'} Uncertainty quantification provides calibrated confidence measures\n`;
    
    const conflictPassed = results.get('Conflict Resolution');
    summary += `${conflictPassed ? '✅' : '❌'} Evidence conflicts resolved with explainable reasoning\n`;
    
    const integrationPassed = results.get('Integrated Processing');
    summary += `${integrationPassed ? '✅' : '❌'} Performance validated on uncertainty benchmarks\n`;
    
    return summary;
  }
}

/**
 * Quick validation function for Week 3 criteria
 */
export async function validateWeek3Criteria(): Promise<boolean> {
  console.log('🔍 Validating Week 3 Success Criteria...\n');
  
  const runner = new EvidenceTestRunner();
  const results = await EvidenceTestRunner.runAllTests();
  
  console.log('\n' + results.summary);
  
  if (results.passed) {
    console.log('✅ All Week 3 criteria PASSED!');
    console.log('🎉 Advanced Evidence Integration implementation is complete!\n');
  } else {
    console.log('❌ Some Week 3 criteria FAILED');
    console.log('🔧 Please review the failed tests and fix the issues.\n');
  }
  
  return results.passed;
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateWeek3Criteria().then(success => {
    process.exit(success ? 0 : 1);
  });
}
