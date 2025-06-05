/**
 * Debug script for sequence completion test
 */

import { TemporalPoolerTests } from './temporal-pooler.test';

async function debugSequenceCompletion() {
    console.log("=== DEBUGGING SEQUENCE COMPLETION ===\n");
    
    const tests = new TemporalPoolerTests();
    
    // Run just the sequence completion test with debug output
    await tests.testSequenceCompletion();
    
    console.log("\nDebug complete.");
}

// Run the debug
debugSequenceCompletion().catch(console.error);
