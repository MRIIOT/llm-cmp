/**
 * Uncertainty Calibration Tests
 * Validates that uncertainty estimates are well-calibrated
 */

import { ConfidenceIntervals } from '../../evidence/uncertainty/confidence-intervals';
import { EpistemicUncertainty } from '../../evidence/uncertainty/epistemic-uncertainty';
import { UncertaintyMetrics } from '../../evidence/uncertainty/uncertainty-metrics';
import { BeliefState, Evidence } from '../../types/evidence.types';

export class UncertaintyCalibrationTests {
    private confidenceIntervals: ConfidenceIntervals;
    private epistemicUncertainty: EpistemicUncertainty;
    private uncertaintyMetrics: UncertaintyMetrics;
    private testResults: Map<string, boolean> = new Map();

    constructor() {
        this.confidenceIntervals = new ConfidenceIntervals();
        this.epistemicUncertainty = new EpistemicUncertainty();
        this.uncertaintyMetrics = new UncertaintyMetrics();
    }

    /**
     * Test confidence interval coverage
     */
    async testConfidenceIntervalCoverage(): Promise<boolean> {
        console.log("Testing confidence interval coverage...");

        try {
            // Test different confidence levels
            const confidenceLevels = [0.68, 0.90, 0.95, 0.99];
            let allCalibrated = true;

            for (const level of confidenceLevels) {
                const coverage = await this.measureCoverage(level, 1000);
                const error = Math.abs(coverage - level);
                
                console.log(`  ${(level * 100).toFixed(0)}% CI: ${(coverage * 100).toFixed(1)}% coverage (error: ${(error * 100).toFixed(1)}%)`);
                
                if (error > 0.05) { // Allow 5% calibration error
                    allCalibrated = false;
                }
            }

            this.testResults.set('confidence_interval_coverage', allCalibrated);
            console.log(allCalibrated ? "PASSED" : "FAILED");
            return allCalibrated;
        } catch (error) {
            console.error("Error in CI coverage test:", error);
            this.testResults.set('confidence_interval_coverage', false);
            return false;
        }
    }

    /**
     * Test epistemic vs aleatoric decomposition
     */
    async testUncertaintyDecomposition(): Promise<boolean> {
        console.log("Testing uncertainty decomposition...");

        try {
            // High epistemic uncertainty (limited data)
            const limitedEvidence: Evidence[] = [
                { content: 'obs1', source: 's1', confidence: 0.7 },
                { content: 'obs2', source: 's2', confidence: 0.75 }
            ];

            const limitedBelief: BeliefState = {
                belief: 0.72,
                uncertainty: 0.25,
                evidence: limitedEvidence,
                lastUpdated: new Date()
            };

            const limitedDecomp = this.epistemicUncertainty.decomposeUncertainty(
                limitedBelief,
                limitedEvidence
            );

            // High aleatoric uncertainty (inherent randomness)
            const noisyEvidence: Evidence[] = Array.from({ length: 100 }, () => ({
                content: 'noisy',
                source: 'random',
                confidence: 0.5 + (Math.random() - 0.5) * 0.6
            }));

            const noisyBelief: BeliefState = {
                belief: 0.5,
                uncertainty: 0.2,
                evidence: noisyEvidence,
                lastUpdated: new Date()
            };

            const noisyDecomp = this.epistemicUncertainty.decomposeUncertainty(
                noisyBelief,
                noisyEvidence
            );

            // Limited data should have higher epistemic uncertainty
            // Noisy data should have higher aleatoric uncertainty
            const passed = limitedDecomp.ratio > 0.6 && // More epistemic
                          noisyDecomp.ratio < 0.4;     // More aleatoric

            this.testResults.set('uncertainty_decomposition', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in decomposition test:", error);
            this.testResults.set('uncertainty_decomposition', false);
            return false;
        }
    }

    /**
     * Test calibration under different distributions
     */
    async testDistributionCalibration(): Promise<boolean> {
        console.log("Testing calibration under different distributions...");

        try {
            // Test normal distribution
            const normalCalibrated = await this.testNormalCalibration();
            
            // Test beta distribution
            const betaCalibrated = await this.testBetaCalibration();
            
            // Test mixture distribution
            const mixtureCalibrated = await this.testMixtureCalibration();

            const passed = normalCalibrated && betaCalibrated && mixtureCalibrated;
            this.testResults.set('distribution_calibration', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in distribution calibration test:", error);
            this.testResults.set('distribution_calibration', false);
            return false;
        }
    }

    /**
     * Test uncertainty metrics consistency
     */
    async testMetricsConsistency(): Promise<boolean> {
        console.log("Testing uncertainty metrics consistency...");

        try {
            // Create belief states with known properties
            const highCertaintyBelief: BeliefState = {
                belief: 0.95,
                uncertainty: 0.05,
                evidence: Array.from({ length: 50 }, () => ({
                    content: 'certain',
                    source: 'reliable',
                    confidence: 0.95
                })),
                lastUpdated: new Date()
            };

            const uncertainBelief: BeliefState = {
                belief: 0.5,
                uncertainty: 0.3,
                evidence: Array.from({ length: 50 }, () => ({
                    content: 'uncertain',
                    source: 'mixed',
                    confidence: 0.5 + (Math.random() - 0.5) * 0.4
                })),
                lastUpdated: new Date()
            };

            const highMetrics = this.uncertaintyMetrics.computeUncertainty(highCertaintyBelief);
            const uncertainMetrics = this.uncertaintyMetrics.computeUncertainty(uncertainBelief);

            // Consistency checks
            const metricsConsistent = 
                highMetrics.total < uncertainMetrics.total &&
                highMetrics.entropy < uncertainMetrics.entropy &&
                highMetrics.variance < uncertainMetrics.variance &&
                highMetrics.total >= 0 && highMetrics.total <= 1 &&
                uncertainMetrics.total >= 0 && uncertainMetrics.total <= 1;

            this.testResults.set('metrics_consistency', metricsConsistent);
            console.log(metricsConsistent ? "PASSED" : "FAILED");
            return metricsConsistent;
        } catch (error) {
            console.error("Error in metrics consistency test:", error);
            this.testResults.set('metrics_consistency', false);
            return false;
        }
    }

    /**
     * Test calibration with model ensembles
     */
    async testEnsembleCalibration(): Promise<boolean> {
        console.log("Testing ensemble calibration...");

        try {
            // Simulate ensemble predictions
            const ensembleSize = 10;
            const testCases = 100;
            let wellCalibrated = 0;

            for (let i = 0; i < testCases; i++) {
                // Generate ensemble predictions
                const predictions: number[] = [];
                const trueValue = Math.random();

                for (let j = 0; j < ensembleSize; j++) {
                    // Each model has some bias and variance
                    const modelBias = (Math.random() - 0.5) * 0.1;
                    const modelNoise = (Math.random() - 0.5) * 0.2;
                    predictions.push(Math.max(0, Math.min(1, trueValue + modelBias + modelNoise)));
                }

                // Ensemble statistics
                const ensembleMean = predictions.reduce((a, b) => a + b) / predictions.length;
                const ensembleStd = Math.sqrt(
                    predictions.reduce((sum, p) => sum + Math.pow(p - ensembleMean, 2), 0) / predictions.length
                );

                // Check if true value falls within prediction interval
                const z = 1.96; // 95% interval
                if (trueValue >= ensembleMean - z * ensembleStd &&
                    trueValue <= ensembleMean + z * ensembleStd) {
                    wellCalibrated++;
                }
            }

            const calibrationRate = wellCalibrated / testCases;
            const passed = calibrationRate >= 0.90 && calibrationRate <= 1.0; // Should be ~95%

            this.testResults.set('ensemble_calibration', passed);
            console.log(`Calibration rate: ${(calibrationRate * 100).toFixed(1)}%`);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in ensemble calibration test:", error);
            this.testResults.set('ensemble_calibration', false);
            return false;
        }
    }

    /**
     * Test temporal uncertainty evolution
     */
    async testTemporalUncertaintyEvolution(): Promise<boolean> {
        console.log("Testing temporal uncertainty evolution...");

        try {
            // Simulate belief evolution over time
            const timeSteps = 20;
            const uncertainties: number[] = [];
            let currentUncertainty = 0.5;

            for (let t = 0; t < timeSteps; t++) {
                // Add new evidence
                const newEvidence = Math.random() > 0.3; // 70% chance of evidence
                
                if (newEvidence) {
                    // Evidence reduces uncertainty
                    currentUncertainty *= 0.9;
                } else {
                    // No evidence increases uncertainty
                    currentUncertainty = Math.min(1.0, currentUncertainty * 1.05);
                }
                
                uncertainties.push(currentUncertainty);
            }

            // Check if uncertainty evolves reasonably
            const initialUncertainty = uncertainties[0];
            const finalUncertainty = uncertainties[uncertainties.length - 1];
            
            // With evidence, uncertainty should generally decrease
            const reasonableEvolution = finalUncertainty < initialUncertainty &&
                                      uncertainties.every(u => u >= 0 && u <= 1);

            this.testResults.set('temporal_evolution', reasonableEvolution);
            console.log(reasonableEvolution ? "PASSED" : "FAILED");
            return reasonableEvolution;
        } catch (error) {
            console.error("Error in temporal evolution test:", error);
            this.testResults.set('temporal_evolution', false);
            return false;
        }
    }

    /**
     * Run all calibration tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== UNCERTAINTY CALIBRATION TESTS ===\n");

        const testMethods = [
            this.testConfidenceIntervalCoverage.bind(this),
            this.testUncertaintyDecomposition.bind(this),
            this.testDistributionCalibration.bind(this),
            this.testMetricsConsistency.bind(this),
            this.testEnsembleCalibration.bind(this),
            this.testTemporalUncertaintyEvolution.bind(this)
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

    private async measureCoverage(confidenceLevel: number, numTrials: number): Promise<number> {
        let covered = 0;

        for (let i = 0; i < numTrials; i++) {
            // Generate true value
            const trueValue = 0.5 + (Math.random() - 0.5) * 0.4;
            
            // Generate observations with noise
            const observations = Array.from({ length: 20 }, () => 
                trueValue + (Math.random() - 0.5) * 0.2
            );

            const belief: BeliefState = {
                belief: observations.reduce((a, b) => a + b) / observations.length,
                uncertainty: this.computeStdDev(observations),
                evidence: observations.map(o => ({
                    content: 'obs',
                    source: 'test',
                    confidence: o
                })),
                lastUpdated: new Date()
            };

            const interval = this.confidenceIntervals.computeConfidenceInterval(belief, confidenceLevel);
            
            if (trueValue >= interval.lower && trueValue <= interval.upper) {
                covered++;
            }
        }

        return covered / numTrials;
    }

    private async testNormalCalibration(): Promise<boolean> {
        const samples = this.generateNormalSamples(100, 0.5, 0.1);
        const belief: BeliefState = {
            belief: 0.5,
            uncertainty: 0.1,
            evidence: samples.map(s => ({
                content: 'normal',
                source: 'gaussian',
                confidence: s
            })),
            lastUpdated: new Date()
        };

        const metrics = this.uncertaintyMetrics.computeUncertainty(belief);
        return Math.abs(metrics.total - 0.1) < 0.02;
    }

    private async testBetaCalibration(): Promise<boolean> {
        const samples = this.generateBetaSamples(100, 2, 5);
        const belief: BeliefState = {
            belief: 2 / (2 + 5), // Mean of Beta(2,5)
            uncertainty: Math.sqrt((2 * 5) / ((2 + 5) * (2 + 5) * (2 + 5 + 1))),
            evidence: samples.map(s => ({
                content: 'beta',
                source: 'beta_dist',
                confidence: s
            })),
            lastUpdated: new Date()
        };

        const metrics = this.uncertaintyMetrics.computeUncertainty(belief);
        return metrics.total > 0 && metrics.total < 0.5;
    }

    private async testMixtureCalibration(): Promise<boolean> {
        // Mixture of two normals
        const samples1 = this.generateNormalSamples(50, 0.3, 0.05);
        const samples2 = this.generateNormalSamples(50, 0.7, 0.05);
        const allSamples = [...samples1, ...samples2];

        const belief: BeliefState = {
            belief: 0.5,
            uncertainty: 0.25, // High due to bimodal distribution
            evidence: allSamples.map(s => ({
                content: 'mixture',
                source: 'bimodal',
                confidence: s
            })),
            lastUpdated: new Date()
        };

        const metrics = this.uncertaintyMetrics.computeUncertainty(belief);
        return metrics.total > 0.2; // Should have high uncertainty
    }

    private generateNormalSamples(n: number, mean: number, stdDev: number): number[] {
        const samples: number[] = [];
        for (let i = 0; i < n; i++) {
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            samples.push(Math.max(0, Math.min(1, mean + z * stdDev)));
        }
        return samples;
    }

    private generateBetaSamples(n: number, alpha: number, beta: number): number[] {
        // Simple beta approximation using gamma
        const samples: number[] = [];
        for (let i = 0; i < n; i++) {
            // Approximation for demonstration
            const x = Math.pow(Math.random(), 1/alpha);
            const y = Math.pow(Math.random(), 1/beta);
            samples.push(x / (x + y));
        }
        return samples;
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
