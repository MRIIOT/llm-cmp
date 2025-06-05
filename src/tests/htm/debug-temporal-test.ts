/**
 * Debug test to investigate temporal pooler sequence learning issues
 */

import { TemporalPooler } from '../../core/htm/temporal-pooler';
import { SpatialPooler } from '../../core/htm/spatial-pooler';

export async function debugTemporalPoolerTest() {
    console.log("=== DEBUG: TEMPORAL POOLER SEQUENCE LEARNING ===\n");

    // Initialize spatial pooler with fixed seed
    const spatialPooler = new SpatialPooler({
        numColumns: 512,
        columnDimensions: [512],
        inputDimensions: [100],
        potentialRadius: 50,
        potentialPct: 0.5,
        globalInhibition: true,
        localAreaDensity: 0.02,
        numActiveColumnsPerInhArea: 10,
        stimulusThreshold: 0,
        synPermInactiveDec: 0.008,
        synPermActiveInc: 0.05,
        synPermConnected: 0.10,
        minPctOverlapDutyCycle: 0.001,
        dutyCyclePeriod: 1000,
        boostStrength: 0.0,
        sparsity: 0.02,
        seed: 42,
        spVerbosity: 0
    });

    // Initialize temporal pooler
    const temporalPooler = new TemporalPooler(512, {
        cellsPerColumn: 32,
        activationThreshold: 3,
        initialPermanence: 0.51,
        connectedPermanence: 0.50,
        minThreshold: 2,
        learningThreshold: 3,
        maxNewSynapseCount: 20,
        permanenceIncrement: 0.10,
        permanenceDecrement: 0.10,
        predictedSegmentDecrement: 0.0,
        seed: 42,
        maxSegmentsPerCell: 255,
        maxSynapsesPerSegment: 255,
        sampleSize: 20,
        permanenceThreshold: 0.1
    });

    // Test 1: Verify spatial pooler consistency
    console.log("TEST 1: Spatial Pooler Consistency");
    const testPattern = createDeterministicPattern(100, 0.1, 12345);
    const boolPattern = testPattern.map(x => x > 0);
    
    console.log(`Input pattern: ${testPattern.filter(x => x > 0).length} active bits`);
    
    // Run same pattern multiple times
    const sdrs: boolean[][] = [];
    for (let i = 0; i < 3; i++) {
        const sdr = spatialPooler.compute(boolPattern, false);
        sdrs.push(sdr);
        const activeColumns = sdr.filter(x => x).length;
        const activeIndices = sdr.map((v, idx) => v ? idx : -1).filter(idx => idx >= 0);
        console.log(`  Run ${i + 1}: ${activeColumns} active columns - [${activeIndices.slice(0, 5).join(', ')}...]`);
    }
    
    // Check if SDRs are identical
    let consistent = true;
    for (let i = 1; i < sdrs.length; i++) {
        for (let j = 0; j < sdrs[i].length; j++) {
            if (sdrs[i][j] !== sdrs[0][j]) {
                consistent = false;
                break;
            }
        }
    }
    console.log(`  Spatial pooler consistency: ${consistent ? 'PASS' : 'FAIL'}\n`);

    // Test 2: Simple deterministic sequence learning
    console.log("TEST 2: Simple Deterministic Sequence");
    
    // Create a simple 3-pattern sequence
    const simpleSequence = [
        createDeterministicPattern(100, 0.1, 1000),
        createDeterministicPattern(100, 0.1, 2000),
        createDeterministicPattern(100, 0.1, 3000)
    ];
    
    // Convert to SDRs
    const sequenceSDRs = simpleSequence.map(pattern => 
        spatialPooler.compute(pattern.map(x => x > 0), false)
    );
    
    console.log("  Sequence SDRs:");
    sequenceSDRs.forEach((sdr, i) => {
        const activeColumns = sdr.map((v, idx) => v ? idx : -1).filter(idx => idx >= 0);
        console.log(`    Pattern ${i}: [${activeColumns.slice(0, 5).join(', ')}...] (${activeColumns.length} columns)`);
    });
    
    // Train on this sequence multiple times
    console.log("\n  Training phase:");
    temporalPooler.reset(); // Clear any previous state
    
    for (let epoch = 0; epoch < 5; epoch++) {
        temporalPooler.resetState();
        console.log(`    Epoch ${epoch + 1}:`);
        
        // Train the complete cycle: 0→1→2→0
        for (let cycle = 0; cycle < 2; cycle++) { // Do 2 complete cycles per epoch
            for (let i = 0; i < sequenceSDRs.length; i++) {
                const state = temporalPooler.compute(sequenceSDRs[i], true);
                if (epoch === 0 && cycle === 0) {
                    console.log(`      Step ${i}: active=${state.activeCells.size}, winner=${state.winnerCells.size}, predictive=${state.predictiveCells.size}`);
                }
            }
        }
        
        const metrics = temporalPooler.getLearningMetrics();
        console.log(`      Total segments: ${metrics.totalSegments}`);
    }
    
    // Test prediction
    console.log("\n  Testing phase:");
    temporalPooler.resetState();
    
    // Present first pattern
    console.log("    Presenting pattern 0...");
    let state = temporalPooler.compute(sequenceSDRs[0], false);
    console.log(`      State: active=${state.activeCells.size}, predictive=${state.predictiveCells.size}`);
    console.log(`      Note: No predictions yet because previousState was empty after reset`);
    
    // Present pattern 1 and check what happens
    console.log("\n    Presenting pattern 1...");
    state = temporalPooler.compute(sequenceSDRs[1], false);
    console.log(`      State: active=${state.activeCells.size}, predictive=${state.predictiveCells.size}`);
    if (state.activeCells.size === 10) {
        console.log(`      Pattern 1 WAS PREDICTED! Only 10 cells active instead of 320 bursting.`);
    }
    
    // Now check what's predicted for the next timestep
    const nextPredictiveCells = temporalPooler.getNextTimestepPredictions();
    const predictedColumns = new Set<number>();
    for (const cellId of nextPredictiveCells) {
        predictedColumns.add(Math.floor(cellId / 32));
    }
    
    const actualColumnsPattern2 = sequenceSDRs[2].map((v, idx) => v ? idx : -1).filter(idx => idx >= 0);
    let correctPredictions = 0;
    for (const col of actualColumnsPattern2) {
        if (predictedColumns.has(col)) {
            correctPredictions++;
        }
    }
    
    const accuracy = actualColumnsPattern2.length > 0 ? correctPredictions / actualColumnsPattern2.length : 0;
    console.log(`    Prediction accuracy for pattern 2: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`      Predicted columns: [${Array.from(predictedColumns).slice(0, 5).join(', ')}...] (${predictedColumns.size} total)`);
    console.log(`      Actual columns: [${actualColumnsPattern2.slice(0, 5).join(', ')}...] (${actualColumnsPattern2.length} total)`);
    
    // Let's trace what's happening - check segments on cells in pattern 2 columns
    console.log("\n    Checking segments on pattern 2 cells:");
    const tp = temporalPooler as any;
    for (const col of actualColumnsPattern2.slice(0, 2)) { // Check first 2 columns
        const cellId = col * 32; // First cell in column
        const cell = tp.cells[cellId];
        if (cell.segments.length > 0) {
            console.log(`      Cell ${cellId} (column ${col}) has ${cell.segments.length} segments`);
            const segment = cell.segments[0];
            const presynapticColumns = segment.synapses
                .filter((s: any) => s.permanence >= 0.5)
                .map((s: any) => Math.floor(s.presynapticCell / 32));
            console.log(`        Segment 0 connects to columns: [${presynapticColumns.slice(0, 5).join(', ')}...]`);
            
            // Check overlap with current winner cells
            const overlap = segment.synapses
                .filter((s: any) => s.permanence >= 0.5 && state.winnerCells.has(s.presynapticCell))
                .length;
            console.log(`        Overlap with current winner cells: ${overlap}`);
        }
    }
    
    // Present pattern 2 and check predictions for cycling back to pattern 0
    console.log("\n    Presenting pattern 2...");
    state = temporalPooler.compute(sequenceSDRs[2], false);
    console.log(`      State: active=${state.activeCells.size}, predictive=${state.predictiveCells.size}`);
    if (state.activeCells.size === 10) {
        console.log(`      Pattern 2 WAS PREDICTED! Only 10 cells active instead of 320 bursting.`);
    }
    
    // Check detailed segment information
    console.log("\n  Segment Analysis:");
    let cellsWithSegments = 0;
    let totalSegments = 0;
    
    for (let i = 0; i < tp.cells.length; i++) {
        const cell = tp.cells[i];
        if (cell.segments.length > 0) {
            cellsWithSegments++;
            totalSegments += cell.segments.length;
            
            // Show details for first few cells with segments
            if (cellsWithSegments <= 3) {
                console.log(`    Cell ${i} (column ${Math.floor(i / 32)}):`);
                for (let j = 0; j < Math.min(2, cell.segments.length); j++) {
                    const segment = cell.segments[j];
                    const connectedSynapses = segment.synapses.filter((s: any) => s.permanence >= 0.5).length;
                    console.log(`      Segment ${j}: ${segment.synapses.length} synapses (${connectedSynapses} connected)`);
                    
                    // Check which cells this segment connects to
                    const connectedCells = segment.synapses
                        .filter((s: any) => s.permanence >= 0.5)
                        .map((s: any) => s.presynapticCell);
                    const connectedColumns = connectedCells.map((c: number) => Math.floor(c / 32));
                    console.log(`        Connects to columns: [${connectedColumns.slice(0, 5).join(', ')}...]`);
                }
            }
        }
    }
    
    console.log(`\n  Summary: ${cellsWithSegments} cells have segments (${totalSegments} total segments)`);
}

function createDeterministicPattern(size: number, density: number, seed: number): number[] {
    // Simple LCG for deterministic patterns
    let rng = seed;
    const next = () => {
        rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        return rng / 0x80000000;
    };

    const pattern = new Array(size).fill(0);
    const activeCount = Math.floor(size * density);
    
    for (let i = 0; i < activeCount; i++) {
        let index;
        do {
            index = Math.floor(next() * size);
        } while (pattern[index] === 1);
        pattern[index] = 1;
    }
    
    return pattern;
}

// Run the debug test
if (require.main === module) {
    debugTemporalPoolerTest().catch(console.error);
}
