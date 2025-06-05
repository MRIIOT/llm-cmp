/**
 * Debug runner for temporal pooler scalability test
 */

import { ScalabilityTests } from './scalability.test';

async function debugTemporalScalability() {
    console.log("🔍 DEBUG: Running Temporal Pooler Scalability Test Only");
    console.log("=".repeat(60));
    
    const scalabilityTests = new ScalabilityTests();
    
    try {
        // Run just the temporal pooler scalability test
        const result = await scalabilityTests.testTemporalPoolerScalability();
        
        console.log("\n" + "=".repeat(60));
        console.log(`Test result: ${result ? '✅ PASSED' : '❌ FAILED'}`);
        
    } catch (error) {
        console.error("Test failed with error:", error);
    }
}

// Run the test
debugTemporalScalability();
