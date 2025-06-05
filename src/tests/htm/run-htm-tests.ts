#!/usr/bin/env node
/**
 * HTM Tests Entry Point
 * Main script for running all HTM validation tests
 */

import { HTMTestRunner, runHTMValidation, runQuickHTMValidation, validateHTMWeek1Criteria } from './htm-test-runner';

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';

    console.log(`🧠 HTM Test Execution Mode: ${mode}`);
    console.log('=' .repeat(50));

    try {
        switch (mode.toLowerCase()) {
            case 'all':
            case 'full':
                console.log('Running full HTM validation suite...\n');
                const fullResults = await runHTMValidation();
                process.exit(fullResults.overallPassed ? 0 : 1);
                break;

            case 'quick':
            case 'fast':
                console.log('Running quick HTM validation...\n');
                const quickPassed = await runQuickHTMValidation();
                console.log(`\n⚡ Quick validation: ${quickPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(quickPassed ? 0 : 1);
                break;

            case 'week1':
            case 'criteria':
                console.log('Running Week 1 criteria validation...\n');
                const week1Passed = await validateHTMWeek1Criteria();
                process.exit(week1Passed ? 0 : 1);
                break;

            case 'spatial':
                console.log('Running Spatial Pooler tests only...\n');
                const runner = new HTMTestRunner();
                const spatialPassed = await runner.runSpatialPoolerTests();
                console.log(`\n🔄 Spatial Pooler tests: ${spatialPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(spatialPassed ? 0 : 1);
                break;

            case 'temporal':
                console.log('Running Temporal Pooler tests only...\n');
                const temporalRunner = new HTMTestRunner();
                const temporalPassed = await temporalRunner.runTemporalPoolerTests();
                console.log(`\n🔄 Temporal Pooler tests: ${temporalPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(temporalPassed ? 0 : 1);
                break;

            case 'prediction':
                console.log('Running Prediction Engine tests only...\n');
                const predictionRunner = new HTMTestRunner();
                const predictionPassed = await predictionRunner.runPredictionEngineTests();
                console.log(`\n🔄 Prediction Engine tests: ${predictionPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(predictionPassed ? 0 : 1);
                break;

            case 'scalability':
            case 'scale':
                console.log('Running Scalability tests only...\n');
                const scalabilityRunner = new HTMTestRunner();
                const scalabilityPassed = await scalabilityRunner.runScalabilityTests();
                console.log(`\n🔄 Scalability tests: ${scalabilityPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(scalabilityPassed ? 0 : 1);
                break;

            case 'help':
            case '--help':
            case '-h':
                printUsage();
                process.exit(0);
                break;

            default:
                console.error(`❌ Unknown test mode: ${mode}`);
                printUsage();
                process.exit(1);
        }

    } catch (error) {
        console.error(`\n❌ HTM Test execution failed:`);
        console.error(error);
        process.exit(1);
    }
}

function printUsage() {
    console.log(`
🧠 HTM Test Runner - Usage:

node dist/tests/htm/run-htm-tests.js [mode]

Available test modes:
  all, full         - Run complete HTM validation suite (default)
  quick, fast       - Run quick validation tests for fast feedback
  week1, criteria   - Run Week 1 success criteria validation
  spatial           - Run Spatial Pooler tests only
  temporal          - Run Temporal Pooler tests only
  prediction        - Run Prediction Engine tests only
  scalability, scale - Run Scalability tests only
  help, --help, -h  - Show this usage information

Examples:
  node dist/tests/htm/run-htm-tests.js              # Run all tests
  node dist/tests/htm/run-htm-tests.js quick        # Quick validation
  node dist/tests/htm/run-htm-tests.js spatial      # Spatial pooler only
  node dist/tests/htm/run-htm-tests.js week1        # Week 1 criteria

Exit codes:
  0 - All tests passed
  1 - Tests failed or error occurred
`);
}

// Run the main function
main().catch(error => {
    console.error('Unhandled error in HTM test runner:', error);
    process.exit(1);
});
