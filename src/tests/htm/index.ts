/**
 * HTM Testing Suite - Index
 * Central exports for all HTM validation tests
 */

// Test Suite Classes
export { SpatialPoolerTests } from './spatial-pooler.test';
export { TemporalPoolerTests } from './temporal-pooler.test';
export { PredictionEngineTests } from './prediction-engine.test';
export { ScalabilityTests } from './scalability.test';

// Test Runner and Convenience Functions
export { 
    HTMTestRunner,
    runHTMValidation,
    runQuickHTMValidation,
    validateHTMWeek1Criteria
} from './htm-test-runner';

// Type Definitions for Test Results
export interface HTMTestResults {
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

export interface TestSuiteResult {
    suiteName: string;
    passed: boolean;
    duration: number;
    details?: any;
}

export interface ScalabilityMetrics {
    patternCount: number;
    memoryUsageMB: number;
    processingTimeMs: number;
    accuracy: number;
    throughputPatternsPerSecond: number;
}


/**
 * Usage Examples:
 * 
 * // Run all HTM validation tests
 * import { runHTMValidation } from './src/tests/htm';
 * const results = await runHTMValidation();
 * 
 * // Quick validation for development
 * import { runQuickHTMValidation } from './src/tests/htm';
 * const passed = await runQuickHTMValidation();
 * 
 * // Validate Week 1 success criteria
 * import { validateHTMWeek1Criteria } from './src/tests/htm';
 * const week1Success = await validateHTMWeek1Criteria();
 * 
 * // Run individual test suites
 * import { HTMTestRunner } from './src/tests/htm';
 * const runner = new HTMTestRunner();
 * const spatialResults = await runner.runSpatialPoolerTests();
 * 
 * // Get detailed results for analysis
 * const detailedResults = runner.getDetailedResults();
 */
