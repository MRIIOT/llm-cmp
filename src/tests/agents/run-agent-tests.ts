#!/usr/bin/env node
/**
 * Agent Tests Entry Point - Week 2 Dynamic Agent Specialization Framework
 * Main script for running all Week 2 agent validation tests
 */

import { AgentTestRunner, runAgentValidation, runQuickAgentValidation } from './agent-test-runner';

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';

    console.log(`🤖 Agent Test Execution Mode: ${mode}`);
    console.log('=' .repeat(50));

    try {
        switch (mode.toLowerCase()) {
            case 'all':
            case 'full':
                console.log('Running full Agent validation suite...\n');
                const fullResults = await runAgentValidation();
                process.exit(fullResults.overallPassed ? 0 : 1);
                break;

            case 'quick':
            case 'fast':
                console.log('Running quick Agent validation...\n');
                const quickPassed = await runQuickAgentValidation();
                console.log(`\n⚡ Quick validation: ${quickPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(quickPassed ? 0 : 1);
                break;

            case 'week2':
            case 'criteria':
                console.log('Running Week 2 criteria validation...\n');
                const runner = new AgentTestRunner();
                const week2Passed = await runner.validateWeek2Criteria();
                process.exit(week2Passed ? 0 : 1);
                break;

            case 'adaptation':
                console.log('Running Adaptation tests only...\n');
                const adaptationRunner = new AgentTestRunner();
                const adaptationPassed = await adaptationRunner.runAdaptationTests();
                console.log(`\n🔄 Adaptation tests: ${adaptationPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(adaptationPassed ? 0 : 1);
                break;

            case 'specialization':
                console.log('Running Specialization tests only...\n');
                const specializationRunner = new AgentTestRunner();
                const specializationPassed = await specializationRunner.runSpecializationTests();
                console.log(`\n🧬 Specialization tests: ${specializationPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(specializationPassed ? 0 : 1);
                break;

            case 'performance':
                console.log('Running Performance tests only...\n');
                const performanceRunner = new AgentTestRunner();
                const performancePassed = await performanceRunner.runPerformanceTests();
                console.log(`\n📈 Performance tests: ${performancePassed ? 'PASSED' : 'FAILED'}`);
                process.exit(performancePassed ? 0 : 1);
                break;

            case 'population':
            case 'diversity':
                console.log('Running Population Diversity tests only...\n');
                const populationRunner = new AgentTestRunner();
                const populationPassed = await populationRunner.runPopulationTests();
                console.log(`\n🌍 Population tests: ${populationPassed ? 'PASSED' : 'FAILED'}`);
                process.exit(populationPassed ? 0 : 1);
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
        console.error(`\n❌ Agent Test execution failed:`);
        console.error(error);
        process.exit(1);
    }
}

function printUsage() {
    console.log(`
🤖 Agent Test Runner - Week 2 Dynamic Agent Specialization Framework

Usage: node dist/tests/agents/run-agent-tests.js [mode]

Available test modes:
  all, full         - Run complete Agent validation suite (default)
  quick, fast       - Run quick validation tests for fast feedback
  week2, criteria   - Run Week 2 success criteria validation
  adaptation        - Run Adaptation tests only (≤5 cycles)
  specialization    - Run Specialization emergence tests only
  performance       - Run Performance improvement tests only
  population        - Run Population diversity tests only
  help, --help, -h  - Show this usage information

Examples:
  node dist/tests/agents/run-agent-tests.js              # Run all tests
  node dist/tests/agents/run-agent-tests.js quick        # Quick validation
  node dist/tests/agents/run-agent-tests.js adaptation   # Adaptation only
  node dist/tests/agents/run-agent-tests.js week2        # Week 2 criteria

Week 2 Success Criteria:
  ✅ Agents adapt to novel task types within 5 reasoning cycles
  ✅ Specialization emerges naturally from task distribution
  ✅ Performance improvement demonstrated on benchmarks
  ✅ Agent population maintains diversity while improving

Exit codes:
  0 - All tests passed
  1 - Tests failed or error occurred
`);
}

// Run the main function
main().catch(error => {
    console.error('Unhandled error in Agent test runner:', error);
    process.exit(1);
});
