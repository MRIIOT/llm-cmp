/**
 * HTM Test Suite Runner
 * Coordinates and executes all HTM validation tests
 */

import { SpatialPoolerTests } from './spatial-pooler.test';
import { TemporalPoolerTests } from './temporal-pooler.test';
import { PredictionEngineTests } from './prediction-engine.test';
import { ScalabilityTests } from './scalability.test';

interface TestSuiteResult {
    suiteName: string;
    passed: boolean;
    duration: number;
    details?: any;
}

interface HTMTestResults {
    overallPassed: boolean;
    totalDuration: number;
    suiteResults: TestSuiteResult[];
    summary: {
        totalSuites: number;
        passedSuites: number;
        failedSuites: number;
        successRate: number;
    };
}

export class HTMTestRunner {
    private spatialPoolerTests: SpatialPoolerTests;
    private temporalPoolerTests: TemporalPoolerTests;
    private predictionEngineTests: PredictionEngineTests;
    private scalabilityTests: ScalabilityTests;

    constructor() {
        this.spatialPoolerTests = new SpatialPoolerTests();
        this.temporalPoolerTests = new TemporalPoolerTests();
        this.predictionEngineTests = new PredictionEngineTests();
        this.scalabilityTests = new ScalabilityTests();
    }

    /**
     * Run all HTM validation tests in sequence
     */
    async runAllTests(): Promise<HTMTestResults> {
        console.log("🧠 STARTING HTM VALIDATION TEST SUITE");
        console.log("=====================================");
        console.log("Testing Hierarchical Temporal Memory implementation for:");
        console.log("- Stable sparse representations");
        console.log("- Sequence completion accuracy");
        console.log("- 98% prediction accuracy on synthetic data");
        console.log("- Scalability to 10,000+ sequence patterns");
        console.log("");

        const overallStartTime = Date.now();
        const suiteResults: TestSuiteResult[] = [];

        // 1. Spatial Pooler Tests
        console.log("🔄 [1/4] Running Spatial Pooler Tests...\n");
        const spatialResult = await this.runTestSuite(
            "Spatial Pooler",
            () => this.spatialPoolerTests.runAllTests(),
            () => this.spatialPoolerTests.getTestResults()
        );
        suiteResults.push(spatialResult);

        // 2. Temporal Pooler Tests
        console.log("🔄 [2/4] Running Temporal Pooler Tests...\n");
        const temporalResult = await this.runTestSuite(
            "Temporal Pooler",
            () => this.temporalPoolerTests.runAllTests(),
            () => this.temporalPoolerTests.getTestResults()
        );
        suiteResults.push(temporalResult);

        // 3. Prediction Engine Tests (98% accuracy requirement)
        console.log("🔄 [3/4] Running Prediction Engine Tests...\n");
        const predictionResult = await this.runTestSuite(
            "Prediction Engine",
            () => this.predictionEngineTests.runAllTests(),
            () => this.predictionEngineTests.getTestResults()
        );
        suiteResults.push(predictionResult);

        // 4. Scalability Tests (10,000+ patterns requirement)
        console.log("🔄 [4/4] Running Scalability Tests...\n");
        const scalabilityResult = await this.runTestSuite(
            "Scalability",
            () => this.scalabilityTests.runAllTests(),
            () => this.scalabilityTests.getTestResults()
        );
        suiteResults.push(scalabilityResult);

        const overallDuration = Date.now() - overallStartTime;
        const passedSuites = suiteResults.filter(r => r.passed).length;
        const overallPassed = passedSuites === suiteResults.length;

        const results: HTMTestResults = {
            overallPassed,
            totalDuration: overallDuration,
            suiteResults,
            summary: {
                totalSuites: suiteResults.length,
                passedSuites,
                failedSuites: suiteResults.length - passedSuites,
                successRate: (passedSuites / suiteResults.length) * 100
            }
        };

        this.printFinalSummary(results);
        return results;
    }

    /**
     * Run spatial pooler tests only
     */
    async runSpatialPoolerTests(): Promise<boolean> {
        console.log("🔄 Running Spatial Pooler Tests Only...\n");
        return await this.spatialPoolerTests.runAllTests();
    }

    /**
     * Run temporal pooler tests only
     */
    async runTemporalPoolerTests(): Promise<boolean> {
        console.log("🔄 Running Temporal Pooler Tests Only...\n");
        return await this.temporalPoolerTests.runAllTests();
    }

    /**
     * Run prediction engine tests only
     */
    async runPredictionEngineTests(): Promise<boolean> {
        console.log("🔄 Running Prediction Engine Tests Only...\n");
        return await this.predictionEngineTests.runAllTests();
    }

    /**
     * Run scalability tests only
     */
    async runScalabilityTests(): Promise<boolean> {
        console.log("🔄 Running Scalability Tests Only...\n");
        return await this.scalabilityTests.runAllTests();
    }

    /**
     * Run quick validation (subset of tests for faster feedback)
     */
    async runQuickValidation(): Promise<boolean> {
        console.log("⚡ QUICK HTM VALIDATION");
        console.log("======================");
        console.log("Running essential tests for fast feedback...\n");

        const results: boolean[] = [];

        try {
            // Quick spatial pooler validation
            console.log("Testing spatial pooler basics...");
            const spatialQuick = await this.spatialPoolerTests.testSparsityConsistency();
            results.push(spatialQuick);

            // Quick temporal pooler validation
            console.log("Testing temporal sequence learning...");
            const temporalQuick = await this.temporalPoolerTests.testTemporalPrediction();
            results.push(temporalQuick);

            // Quick prediction validation
            console.log("Testing prediction accuracy...");
            const predictionQuick = await this.predictionEngineTests.testDeterministicSequences();
            results.push(predictionQuick);

            const allPassed = results.every(r => r);
            
            console.log(`\n⚡ QUICK VALIDATION: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`Results: ${results.filter(r => r).length}/${results.length} tests passed`);

            return allPassed;

        } catch (error) {
            console.error(`Quick validation failed: ${error}`);
            return false;
        }
    }

    /**
     * Validate Week 1 success criteria specifically
     */
    async validateWeek1Criteria(): Promise<boolean> {
        console.log("📋 WEEK 1 SUCCESS CRITERIA VALIDATION");
        console.log("======================================");
        console.log("Checking specific Week 1 requirements...\n");

        const criteria = {
            htmLearning: false,
            spatialStability: false,
            temporalCompletion: false,
            memoryScaling: false,
            predictionAccuracy: false
        };

        try {
            // Criterion 1: HTM can learn and predict simple sequences (98% accuracy)
            console.log("✓ Testing HTM sequence learning and prediction...");
            const predictionAccuracy = await this.predictionEngineTests.testDeterministicSequences();
            criteria.htmLearning = predictionAccuracy;
            console.log(`  HTM learning: ${predictionAccuracy ? '✅ PASSED' : '❌ FAILED'}`);

            // Criterion 2: Spatial pooler produces stable sparse representations
            console.log("✓ Testing spatial pooler stability...");
            const spatialStability = await this.spatialPoolerTests.testStableSparseRepresentations();
            criteria.spatialStability = spatialStability;
            console.log(`  Spatial stability: ${spatialStability ? '✅ PASSED' : '❌ FAILED'}`);

            // Criterion 3: Temporal pooler demonstrates sequence completion
            console.log("✓ Testing temporal sequence completion...");
            const temporalCompletion = await this.temporalPoolerTests.testSequenceCompletion();
            criteria.temporalCompletion = temporalCompletion;
            console.log(`  Temporal completion: ${temporalCompletion ? '✅ PASSED' : '❌ FAILED'}`);

            // Criterion 4: Memory scales to 10,000+ patterns
            console.log("✓ Testing memory scaling...");
            const memoryScaling = await this.scalabilityTests.testSpatialPoolerScalability();
            criteria.memoryScaling = memoryScaling;
            console.log(`  Memory scaling: ${memoryScaling ? '✅ PASSED' : '❌ FAILED'}`);

            // Criterion 5: All tests pass with buildable state maintained
            console.log("✓ Checking prediction accuracy threshold...");
            const accuracyTest = await this.predictionEngineTests.testArithmeticSequences();
            criteria.predictionAccuracy = accuracyTest;
            console.log(`  Prediction accuracy: ${accuracyTest ? '✅ PASSED' : '❌ FAILED'}`);

            const allCriteriaMet = Object.values(criteria).every(c => c);
            
            console.log("\n📋 WEEK 1 CRITERIA SUMMARY:");
            console.log(`HTM Learning & Prediction (98%): ${criteria.htmLearning ? '✅' : '❌'}`);
            console.log(`Spatial Pooler Stability: ${criteria.spatialStability ? '✅' : '❌'}`);
            console.log(`Temporal Sequence Completion: ${criteria.temporalCompletion ? '✅' : '❌'}`);
            console.log(`Memory Scaling (10K+ patterns): ${criteria.memoryScaling ? '✅' : '❌'}`);
            console.log(`Prediction Accuracy Tests: ${criteria.predictionAccuracy ? '✅' : '❌'}`);
            
            console.log(`\n🎯 WEEK 1 SUCCESS: ${allCriteriaMet ? '✅ ALL CRITERIA MET' : '❌ CRITERIA NOT MET'}`);

            return allCriteriaMet;

        } catch (error) {
            console.error(`Week 1 validation failed: ${error}`);
            return false;
        }
    }

    private async runTestSuite(
        suiteName: string, 
        testRunner: () => Promise<boolean>,
        resultGetter: () => any
    ): Promise<TestSuiteResult> {
        const startTime = Date.now();
        
        try {
            const passed = await testRunner();
            const duration = Date.now() - startTime;
            const details = resultGetter();

            return {
                suiteName,
                passed,
                duration,
                details
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`${suiteName} test suite failed with error: ${error}`);
            
            return {
                suiteName,
                passed: false,
                duration,
                details: { error: (error as Error).toString() }
            };
        }
    }

    private printFinalSummary(results: HTMTestResults): void {
        console.log("\n" + "=".repeat(60));
        console.log("🧠 HTM VALIDATION TEST SUITE COMPLETE");
        console.log("=".repeat(60));
        
        console.log(`\n📊 OVERALL RESULTS:`);
        console.log(`Success Rate: ${results.summary.successRate.toFixed(1)}%`);
        console.log(`Total Duration: ${(results.totalDuration / 1000).toFixed(1)} seconds`);
        console.log(`Suites Passed: ${results.summary.passedSuites}/${results.summary.totalSuites}`);
        
        console.log(`\n📋 SUITE BREAKDOWN:`);
        for (const suite of results.suiteResults) {
            const status = suite.passed ? '✅ PASSED' : '❌ FAILED';
            const duration = (suite.duration / 1000).toFixed(1);
            console.log(`${suite.suiteName}: ${status} (${duration}s)`);
        }

        console.log(`\n🎯 PHASE 1.3 STATUS:`);
        if (results.overallPassed) {
            console.log("✅ HTM Testing Suite Implementation: COMPLETE");
            console.log("✅ All spatial pooler validation tests: PASSED");
            console.log("✅ All temporal pooler validation tests: PASSED");
            console.log("✅ Prediction engine tests (98% accuracy): PASSED");
            console.log("✅ Scalability tests (10,000+ patterns): PASSED");
            console.log("\n🚀 READY TO PROCEED: Phase 1.3 successfully completed!");
            console.log("   Next: Request human approval to proceed to Week 2");
        } else {
            console.log("❌ HTM Testing Suite: ISSUES DETECTED");
            console.log("   Failed suites need attention before proceeding");
            console.log("   Review individual test results above");
        }

        console.log("\n" + "=".repeat(60));
    }

    /**
     * Get detailed test results for external analysis
     */
    getDetailedResults(): {
        spatialPooler: any;
        temporalPooler: any;
        predictionEngine: any;
        scalability: any;
    } {
        return {
            spatialPooler: this.spatialPoolerTests.getTestResults(),
            temporalPooler: this.temporalPoolerTests.getTestResults(),
            predictionEngine: this.predictionEngineTests.getTestResults(),
            scalability: this.scalabilityTests.getTestResults()
        };
    }
}

/**
 * Convenience function to run all HTM tests
 */
export async function runHTMValidation(): Promise<HTMTestResults> {
    const runner = new HTMTestRunner();
    return await runner.runAllTests();
}

/**
 * Convenience function for quick validation
 */
export async function runQuickHTMValidation(): Promise<boolean> {
    const runner = new HTMTestRunner();
    return await runner.runQuickValidation();
}

/**
 * Convenience function for Week 1 criteria validation
 */
export async function validateHTMWeek1Criteria(): Promise<boolean> {
    const runner = new HTMTestRunner();
    return await runner.validateWeek1Criteria();
}
