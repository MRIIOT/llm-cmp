/**
 * Uncertainty Benchmark Tests
 * Validates uncertainty quantification against standard benchmarks
 */

import { UncertaintyMetrics } from '../../evidence/uncertainty/uncertainty-metrics';
import { BeliefUpdater } from '../../evidence/bayesian/belief-updater';
import { EvidenceAggregator } from '../../evidence/bayesian/evidence-aggregator';
import { Evidence, BeliefState } from '../../types/evidence.types';

export class UncertaintyBenchmarkTests {
    private metrics: UncertaintyMetrics;
    private testResults: Map<string, boolean> = new Map();

    constructor() {
        this.metrics = new UncertaintyMetrics();
    }

    /**
     * Test uncertainty calibration on known distributions
     */
    async testUncertaintyCalibration(): Promise<boolean> {
        console.log("Testing uncertainty calibration...");

        try {
            // Test with known normal distribution
            const normalSamples = this.generateNormalSamples(1000, 0.5, 0.1);
            const normalBelief: BeliefState = {
                belief: 0.5,
                uncertainty: 0.1,
                evidence: normalSamples.map(s => ({
                    content: 'sample',
                    source: 'normal',
                    confidence: s
                })),
                lastUpdated: new Date()
            };

            const normalUncertainty = this.metrics.computeUncertainty(normalBelief);
            
            // Uncertainty should be well-calibrated
            const calibrationError = Math.abs(normalUncertainty.total - 0.1);
            const normalCalibrated = calibrationError < 0.02;

            // Test with uniform distribution
            const uniformSamples = this.generateUniformSamples(1000, 0.2, 0.8);
            const uniformBelief: BeliefState = {
                belief: 0.5,
                uncertainty: 0.17, // sqrt(1/12) * range for uniform
                evidence: uniformSamples.map(s => ({
                    content: 'sample',
                    source: 'uniform',
                    confidence: s
                })),
                lastUpdated: new Date()
            };

            const uniformUncertainty = this.metrics.computeUncertainty(uniformBelief);
            const uniformCalibrated = Math.abs(uniformUncertainty.total - 0.17) < 0.03;

            const passed = normalCalibrated && uniformCalibrated;
            this.testResults.set('uncertainty_calibration', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in calibration test:", error);
            this.testResults.set('uncertainty_calibration', false);
            return false;
        }
    }

    /**
     * Test Monte Carlo dropout simulation
     */
    async testMonteCarloDropout(): Promise<boolean> {
        console.log("Testing Monte Carlo dropout uncertainty...");

        try {
            // Simulate multiple forward passes with dropout
            const dropoutRuns = 50;
            const predictions: number[] = [];

            for (let i = 0; i < dropoutRuns; i++) {
                // Simulate dropout by randomly masking some evidence
                const dropoutRate = 0.2;
                const baseConfidence = 0.7;
                const noise = (Math.random() - 0.5) * 0.2;
                const dropped = Math.random() < dropoutRate ? 0 : 1;
                
                predictions.push(baseConfidence + noise * dropped);
            }

            const mcBelief: BeliefState = {
                belief: predictions.reduce((a, b) => a + b) / predictions.length,
                uncertainty: this.computeStdDev(predictions),
                evidence: predictions.map(p => ({
                    content: 'mc_sample',
                    source: 'dropout',
                    confidence: p
                })),
                lastUpdated: new Date()
            };

            const mcUncertainty = this.metrics.computeUncertainty(mcBelief);

            // MC dropout should capture epistemic uncertainty
            const passed = mcUncertainty.epistemic > 0.05 &&
                          mcUncertainty.total > 0.1;

            this.testResults.set('monte_carlo_dropout', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in MC dropout test:", error);
            this.testResults.set('monte_carlo_dropout', false);
            return false;
        }
    }

    /**
     * Test evidence conflict uncertainty
     */
    async testEvidenceConflictUncertainty(): Promise<boolean> {
        console.log("Testing evidence conflict uncertainty...");

        try {
            const aggregator = new EvidenceAggregator();

            // Add conflicting sources
            aggregator.addSource({
                id: 'optimist',
                reliability: 0.8,
                evidence: [{
                    content: 'Highly positive outlook',
                    source: 'optimist',
                    confidence: 0.9,
                    topic: 'forecast'
                }]
            });

            aggregator.addSource({
                id: 'pessimist',
                reliability: 0.8,
                evidence: [{
                    content: 'Highly negative outlook',
                    source: 'pessimist',
                    confidence: 0.1,
                    topic: 'forecast'
                }]
            });

            const result = aggregator.aggregate({
                method: 'weighted',
                conflictResolution: 'dempster-shafer',
                uncertaintyPropagation: true
            });

            const forecastBelief = result.beliefStates.get('forecast');
            if (!forecastBelief) return false;

            const conflictUncertainty = this.metrics.computeUncertainty(forecastBelief);

            // High conflict should lead to high uncertainty
            const passed = conflictUncertainty.total > 0.3 &&
                          conflictUncertainty.epistemic > 0.2;

            this.testResults.set('conflict_uncertainty', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in conflict uncertainty test:", error);
            this.testResults.set('conflict_uncertainty', false);
            return false;
        }
    }

    /**
     * Test entropy-based uncertainty
     */
    async testEntropyUncertainty(): Promise<boolean> {
        console.log("Testing entropy-based uncertainty...");

        try {
            // Test maximum entropy (uniform distribution)
            const uniformEvidence: Evidence[] = Array.from({ length: 10 }, (_, i) => ({
                content: `option_${i}`,
                source: 'uniform',
                confidence: 0.5
            }));

            const uniformBelief: BeliefState = {
                belief: 0.5,
                uncertainty: 0.5,
                evidence: uniformEvidence,
                posterior: new Map(Array.from({ length: 10 }, (_, i) => [`state_${i}`, 0.1])),
                lastUpdated: new Date()
            };

            const uniformUncertainty = this.metrics.computeUncertainty(uniformBelief);
            const uniformEntropy = uniformUncertainty.entropy;
            const maxEntropy = Math.log(10) / Math.log(2); // log2(n) for uniform

            // Test low entropy (peaked distribution)
            const peakedBelief: BeliefState = {
                belief: 0.9,
                uncertainty: 0.1,
                evidence: [{
                    content: 'high_confidence',
                    source: 'expert',
                    confidence: 0.9
                }],
                posterior: new Map([['true', 0.9], ['false', 0.1]]),
                lastUpdated: new Date()
            };

            const peakedUncertainty = this.metrics.computeUncertainty(peakedBelief);
            const peakedEntropy = peakedUncertainty.entropy;

            const passed = Math.abs(uniformEntropy - maxEntropy) < 0.1 &&
                          peakedEntropy < 0.5;

            this.testResults.set('entropy_uncertainty', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in entropy test:", error);
            this.testResults.set('entropy_uncertainty', false);
            return false;
        }
    }

    /**
     * Test uncertainty propagation through belief updates
     */
    async testUncertaintyPropagation(): Promise<boolean> {
        console.log("Testing uncertainty propagation...");

        try {
            const updater = new BeliefUpdater({
                method: 'bayesian',
                learningRate: 0.2,
                momentum: 0.8,
                adaptiveLearning: true
            });

            // Start with uncertain prior
            const initialEvidence: Evidence = {
                content: 'Uncertain initial observation',
                source: 'initial',
                confidence: 0.5,
                metadata: new Map([['uncertainty', 0.3]])
            };

            const initial = updater.updateBelief('test', initialEvidence);

            // Add confirming evidence with lower uncertainty
            const confirmingEvidence: Evidence = {
                content: 'Confirming observation',
                source: 'confirming',
                confidence: 0.7,
                metadata: new Map([['uncertainty', 0.1]])
            };

            const confirmed = updater.updateBelief('test', confirmingEvidence);

            // Uncertainty should decrease with confirming evidence
            const uncertaintyDecreased = confirmed.newBelief.uncertainty < initial.newBelief.uncertainty;

            // Add conflicting evidence
            const conflictingEvidence: Evidence = {
                content: 'Conflicting observation',
                source: 'conflicting',
                confidence: 0.2,
                metadata: new Map([['uncertainty', 0.15]])
            };

            const conflicted = updater.updateBelief('test', conflictingEvidence);

            // Uncertainty should increase with conflicting evidence
            const uncertaintyIncreased = conflicted.newBelief.uncertainty > confirmed.newBelief.uncertainty;

            const passed = uncertaintyDecreased && uncertaintyIncreased;
            this.testResults.set('uncertainty_propagation', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in propagation test:", error);
            this.testResults.set('uncertainty_propagation', false);
            return false;
        }
    }

    /**
     * Test the Monty Hall problem
     */
    async testMontyHallProblem(): Promise<boolean> {
        console.log("Testing Monty Hall problem...");

        try {
            const updater = new BeliefUpdater({
                method: 'bayesian',
                learningRate: 1.0, // Full update for exact Bayesian
                momentum: 0,
                adaptiveLearning: false
            });

            // Initial belief: car equally likely behind any door
            const initialEvidence: Evidence = {
                content: 'Car behind one of three doors',
                source: 'setup',
                confidence: 0.333,
                topic: 'door1'
            };

            updater.updateBelief('door1', initialEvidence);
            updater.updateBelief('door2', { ...initialEvidence, topic: 'door2' });
            updater.updateBelief('door3', { ...initialEvidence, topic: 'door3' });

            // Host opens door 3 (no car)
            const hostOpensEvidence: Evidence = {
                content: 'Host opens door 3, shows goat',
                source: 'host',
                confidence: 0.0, // No car behind door 3
                topic: 'door3'
            };

            updater.updateBelief('door3', hostOpensEvidence);

            // Update beliefs for remaining doors given new information
            // P(door2|door3_empty) = 2/3, P(door1|door3_empty) = 1/3
            const door1Belief = updater.getBelief('door1');
            const door2Belief = updater.getBelief('door2');

            // After host reveals, switching doubles probability
            // This is a simplified test - in reality would need proper Bayesian network
            const switchingBetter = door1Belief && door2Belief &&
                                  door2Belief.belief > door1Belief.belief;

            const passed = switchingBetter === true; // Ensure boolean
            this.testResults.set('monty_hall', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in Monty Hall test:", error);
            this.testResults.set('monty_hall', false);
            return false;
        }
    }

    /**
     * Test calibration on prediction intervals
     */
    async testPredictionIntervalCalibration(): Promise<boolean> {
        console.log("Testing prediction interval calibration...");

        try {
            // Generate predictions with known coverage
            const numPredictions = 100;
            const targetCoverage = 0.9; // 90% prediction interval
            let correctPredictions = 0;

            for (let i = 0; i < numPredictions; i++) {
                // True value from normal distribution
                const trueValue = 0.5 + this.gaussianRandom() * 0.1;

                // Predicted value with uncertainty
                const predictedValue = trueValue + this.gaussianRandom() * 0.05;
                const uncertainty = 0.15;

                // Check if true value falls within prediction interval
                const lower = predictedValue - 1.645 * uncertainty; // 90% interval
                const upper = predictedValue + 1.645 * uncertainty;

                if (trueValue >= lower && trueValue <= upper) {
                    correctPredictions++;
                }
            }

            const empiricalCoverage = correctPredictions / numPredictions;
            const calibrationError = Math.abs(empiricalCoverage - targetCoverage);

            const passed = calibrationError < 0.1; // Allow 10% calibration error
            this.testResults.set('interval_calibration', passed);
            console.log(`Coverage: ${empiricalCoverage.toFixed(2)} (target: ${targetCoverage})`);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in interval calibration test:", error);
            this.testResults.set('interval_calibration', false);
            return false;
        }
    }

    /**
     * Test Simpson's Paradox handling
     */
    async testSimpsonsParadox(): Promise<boolean> {
        console.log("Testing Simpson's Paradox handling...");

        try {
            const aggregator = new EvidenceAggregator();

            // Overall data shows negative correlation
            // But within each group, correlation is positive
            
            // Group A: High baseline, positive trend
            aggregator.addSource({
                id: 'group_a',
                reliability: 0.9,
                evidence: [
                    {
                        content: 'Group A treatment effective',
                        source: 'group_a',
                        confidence: 0.8,
                        topic: 'treatment',
                        metadata: new Map([['group', 'A'], ['baseline', 'high']])
                    }
                ]
            });

            // Group B: Low baseline, positive trend
            aggregator.addSource({
                id: 'group_b',
                reliability: 0.9,
                evidence: [
                    {
                        content: 'Group B treatment effective',
                        source: 'group_b',
                        confidence: 0.6,
                        topic: 'treatment',
                        metadata: new Map([['group', 'B'], ['baseline', 'low']])
                    }
                ]
            });

            // Aggregate ignoring groups
            const naiveResult = aggregator.aggregate({
                method: 'weighted',
                conflictResolution: 'averaging',
                uncertaintyPropagation: false
            });

            // Aggregate considering groups (hierarchical)
            const stratifiedResult = aggregator.aggregate({
                method: 'hierarchical',
                conflictResolution: 'dempster-shafer',
                uncertaintyPropagation: true
            });

            // Stratified should show higher uncertainty due to paradox
            const naiveBelief = naiveResult.beliefStates.get('treatment');
            const stratifiedBelief = stratifiedResult.beliefStates.get('treatment');

            const passed = stratifiedBelief !== undefined && naiveBelief !== undefined &&
                          stratifiedBelief.uncertainty >= naiveBelief.uncertainty;

            this.testResults.set('simpsons_paradox', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in Simpson's Paradox test:", error);
            this.testResults.set('simpsons_paradox', false);
            return false;
        }
    }

    /**
     * Run all uncertainty benchmark tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== UNCERTAINTY BENCHMARK TESTS ===\n");

        const testMethods = [
            this.testUncertaintyCalibration.bind(this),
            this.testMonteCarloDropout.bind(this),
            this.testEvidenceConflictUncertainty.bind(this),
            this.testEntropyUncertainty.bind(this),
            this.testUncertaintyPropagation.bind(this),
            this.testMontyHallProblem.bind(this),
            this.testPredictionIntervalCalibration.bind(this),
            this.testSimpsonsParadox.bind(this)
        ];

        let allPassed = true;

        for (const testMethod of testMethods) {
            try {
                const result = await testMethod();
                if (!result) {
                    allPassed = false;
                }
            } catch (error) {
                console.error(`Test failed with error: ${error}`);
                allPassed = false;
            }
            console.log(""); // Add spacing between tests
        }

        this.printTestSummary();
        return allPassed;
    }

    // Helper methods

    private generateNormalSamples(n: number, mean: number, stdDev: number): number[] {
        const samples: number[] = [];
        for (let i = 0; i < n; i++) {
            samples.push(mean + this.gaussianRandom() * stdDev);
        }
        return samples;
    }

    private generateUniformSamples(n: number, min: number, max: number): number[] {
        const samples: number[] = [];
        for (let i = 0; i < n; i++) {
            samples.push(min + Math.random() * (max - min));
        }
        return samples;
    }

    private gaussianRandom(): number {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    private computeStdDev(values: number[]): number {
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    private printTestSummary(): void {
        console.log("=== TEST SUMMARY ===");
        let passedCount = 0;
        let totalCount = 0;

        for (const [testName, passed] of this.testResults) {
            console.log(`${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
            if (passed) passedCount++;
            totalCount++;
        }

        console.log(`\nOverall: ${passedCount}/${totalCount} tests passed`);
        console.log(`Success rate: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
    }

    getTestResults(): Map<string, boolean> {
        return new Map(this.testResults);
    }
}
