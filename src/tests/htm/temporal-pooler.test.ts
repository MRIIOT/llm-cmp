/**
 * Temporal Pooler Validation Tests
 * Tests for sequence completion and temporal memory
 */

import { TemporalPooler } from '../../core/htm/temporal-pooler';
import { SpatialPooler } from '../../core/htm/spatial-pooler';

interface SequenceTestCase {
    name: string;
    sequences: number[][][]; // Array of sequences, each sequence is array of patterns
    completionThreshold: number;
    predictionAccuracy: number;
}

export class TemporalPoolerTests {
    private temporalPooler: TemporalPooler;
    private spatialPooler: SpatialPooler;
    private testResults: Map<string, boolean> = new Map();
    private rng: () => number;

    constructor() {
        // Initialize seeded random for deterministic testing
        this.rng = this.createSeededRandom(12345);
        
        // Initialize spatial pooler for sequence encoding
        this.spatialPooler = new SpatialPooler({
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

        // Initialize temporal pooler with adjusted parameters for testing
        this.temporalPooler = new TemporalPooler(512, {
            cellsPerColumn: 32,
            activationThreshold: 3,  // Much lower - only need 3 active connections for sparse patterns
            initialPermanence: 0.51,  // Above connected threshold so new segments work immediately
            connectedPermanence: 0.50,
            minThreshold: 2,  // Lowered from 4
            learningThreshold: 3,  // Lowered from 6
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
    }

    /**
     * Create a seeded random number generator for deterministic tests
     */
    private createSeededRandom(seed: number): () => number {
        let state = seed;
        return () => {
            state = (state * 1103515245 + 12345) & 0x7fffffff;
            return state / 0x80000000;
        };
    }

    /**
     * Test basic sequence learning and completion
     */
    async testSequenceCompletion(): Promise<boolean> {
        console.log("Testing sequence completion...");

        const testCases: SequenceTestCase[] = [
            {
                name: "Simple Sequences",
                sequences: this.generateSimpleSequences(5, 4), // 5 sequences of length 4
                completionThreshold: 0.8,
                predictionAccuracy: 0.7
            },
            {
                name: "Complex Sequences",
                sequences: this.generateComplexSequences(10, 6), // 10 sequences of length 6
                completionThreshold: 0.7,
                predictionAccuracy: 0.6
            },
            {
                name: "Overlapping Sequences",
                sequences: this.generateOverlappingSequences(8, 5), // 8 overlapping sequences
                completionThreshold: 0.6,
                predictionAccuracy: 0.5
            }
        ];

        let allPassed = true;

        for (const testCase of testCases) {
            const result = await this.runSequenceCompletionTest(testCase);
            this.testResults.set(`sequence_completion_${testCase.name}`, result);
            
            if (!result) {
                console.error(`FAILED: ${testCase.name} sequence completion test`);
                allPassed = false;
            } else {
                console.log(`PASSED: ${testCase.name} sequence completion test`);
            }
        }

        return allPassed;
    }

    /**
     * Test temporal context and prediction accuracy
     */
    async testTemporalPrediction(): Promise<boolean> {
        console.log("Testing temporal prediction accuracy...");

        // Create deterministic sequences
        const sequences = this.generateDeterministicSequences(10, 5);
        
        // Train on sequences multiple times
        for (let epoch = 0; epoch < 5; epoch++) {
            for (let seqIdx = 0; seqIdx < sequences.length; seqIdx++) {
                // Reset state between different sequences
                if (seqIdx > 0) {
                    this.temporalPooler.resetState();
                }
                await this.trainOnSequence(sequences[seqIdx], true);
            }
        }

        // Test prediction accuracy
        let totalPredictions = 0;
        let correctPredictions = 0;

        for (const sequence of sequences) {
            this.temporalPooler.resetState(); // Reset state but preserve learned segments
            
            // Warm up: present first pattern without measuring to establish previous winner cells
            const firstSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[0]), false);
            this.temporalPooler.compute(firstSDR, false);
            
            // Now test predictions starting from second pattern
            for (let i = 1; i < sequence.length - 1; i++) {
                const currentSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i]), false);
                this.temporalPooler.compute(currentSDR, false);
                
                // CRITICAL FIX: Get predictions for NEXT timestep
                const nextPredictiveCells = this.temporalPooler.getNextTimestepPredictions();
                
                // Check if prediction matches next element
                const nextSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i + 1]), false);
                const accuracy = this.calculatePredictionAccuracy(Array.from(nextPredictiveCells), nextSDR);
                
                if (accuracy > 0.5) {
                    correctPredictions++;
                }
                totalPredictions++;
            }
        }

        const overallAccuracy = correctPredictions / totalPredictions;
        const passed = overallAccuracy > 0.6; // 60% accuracy threshold

        this.testResults.set('temporal_prediction', passed);

        console.log(`Prediction accuracy: ${(overallAccuracy * 100).toFixed(2)}% (${correctPredictions}/${totalPredictions})`);

        if (!passed) {
            console.error("FAILED: Temporal prediction test");
        } else {
            console.log("PASSED: Temporal prediction test");
        }

        return passed;
    }

    /**
     * Test sequence disambiguation (multiple sequences with shared prefixes)
     */
    async testSequenceDisambiguation(): Promise<boolean> {
        console.log("Testing sequence disambiguation...");

        // Create sequences with shared prefixes but different endings
        const sharedPrefix = this.generateRandomPattern(100, 0.1);
        const sequences = [
            [sharedPrefix, this.generateRandomPattern(100, 0.1), this.generateRandomPattern(100, 0.1)],
            [sharedPrefix, this.generateRandomPattern(100, 0.1), this.generateRandomPattern(100, 0.1)],
            [sharedPrefix, this.generateRandomPattern(100, 0.1), this.generateRandomPattern(100, 0.1)]
        ];

        // Train on sequences
        for (let epoch = 0; epoch < 10; epoch++) {
            for (let seqIdx = 0; seqIdx < sequences.length; seqIdx++) {
                // Reset state between different sequences
                if (seqIdx > 0) {
                    this.temporalPooler.resetState();
                }
                await this.trainOnSequence(sequences[seqIdx], true);
            }
        }

        // Test disambiguation - after shared prefix, predictions should be different
        const predictions: any[] = [];
        
        for (const sequence of sequences) {
            this.temporalPooler.resetState(); // Reset state but preserve learned segments
            
            // Present shared prefix
            const prefixSDR = this.spatialPooler.compute(sharedPrefix.map(val => val > 0.5), false);
            const prediction = this.temporalPooler.compute(prefixSDR, false);
            predictions.push(prediction.predictiveCells);
        }

        // Check that predictions are sufficiently different
        let allDifferent = true;
        for (let i = 0; i < predictions.length; i++) {
            for (let j = i + 1; j < predictions.length; j++) {
                const similarity = this.calculateArrayOverlap(predictions[i], predictions[j]);
                if (similarity > 0.7) { // Too similar
                    allDifferent = false;
                    break;
                }
            }
            if (!allDifferent) break;
        }

        const passed = allDifferent;
        this.testResults.set('sequence_disambiguation', passed);

        if (!passed) {
            console.error("FAILED: Sequence disambiguation test");
        } else {
            console.log("PASSED: Sequence disambiguation test");
        }

        return passed;
    }

    /**
     * Test temporal memory capacity and retention
     */
    async testTemporalMemoryCapacity(): Promise<boolean> {
        console.log("Testing temporal memory capacity...");

        // Generate many sequences to test capacity
        const sequences = this.generateRandomSequences(50, 4); // 50 sequences of length 4

        // Train on all sequences
        for (let epoch = 0; epoch < 3; epoch++) {
            for (let seqIdx = 0; seqIdx < sequences.length; seqIdx++) {
                // Reset state between different sequences
                if (seqIdx > 0) {
                    this.temporalPooler.resetState();
                }
                await this.trainOnSequence(sequences[seqIdx], true);
            }
        }

        // Test memory retention by checking how many sequences are still remembered
        let rememberedSequences = 0;

        for (const sequence of sequences) {
            this.temporalPooler.resetState(); // Reset state but preserve learned segments
            
            // Warm up with first pattern to establish winner cells
            const firstSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[0]), false);
            this.temporalPooler.compute(firstSDR, false);
            
            let sequenceRecognized = true;
            for (let i = 1; i < sequence.length - 1; i++) {
                const currentSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i]), false);
                this.temporalPooler.compute(currentSDR, false);
                
                // CRITICAL FIX: Get predictions for NEXT timestep
                const nextPredictiveCells = this.temporalPooler.getNextTimestepPredictions();
                
                const nextSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i + 1]), false);
                const accuracy = this.calculatePredictionAccuracy(Array.from(nextPredictiveCells), nextSDR);
                
                if (accuracy < 0.3) {
                    sequenceRecognized = false;
                    break;
                }
            }
            
            if (sequenceRecognized) {
                rememberedSequences++;
            }
        }

        const retentionRate = rememberedSequences / sequences.length;
        const passed = retentionRate > 0.4; // At least 40% retention

        this.testResults.set('temporal_memory_capacity', passed);

        console.log(`Memory retention: ${(retentionRate * 100).toFixed(2)}% (${rememberedSequences}/${sequences.length})`);

        if (!passed) {
            console.error("FAILED: Temporal memory capacity test");
        } else {
            console.log("PASSED: Temporal memory capacity test");
        }

        return passed;
    }

    /**
     * Test sequence noise tolerance
     */
    async testSequenceNoiseTolerance(): Promise<boolean> {
        console.log("Testing sequence noise tolerance...");

        const cleanSequences = this.generateDeterministicSequences(5, 4);
        
        // Train on clean sequences
        for (let epoch = 0; epoch < 5; epoch++) {
            for (let seqIdx = 0; seqIdx < cleanSequences.length; seqIdx++) {
                // Reset state between different sequences
                if (seqIdx > 0) {
                    this.temporalPooler.resetState();
                }
                await this.trainOnSequence(cleanSequences[seqIdx], true);
            }
        }

        // Test with noisy sequences
        let noisyCorrectPredictions = 0;
        let noisyTotalPredictions = 0;

        for (const cleanSequence of cleanSequences) {
            // Add noise to each element of the sequence
            const noisySequence = cleanSequence.map(pattern => this.addNoise(pattern, 0.05)); // 5% noise
            
            this.temporalPooler.resetState(); // Reset state but preserve learned segments
            
            // Warm up with first pattern to establish winner cells
            const firstSDR = this.spatialPooler.compute(this.convertToBooleanArray(noisySequence[0]), false);
            this.temporalPooler.compute(firstSDR, false);
            
            for (let i = 1; i < noisySequence.length - 1; i++) {
                const currentSDR = this.spatialPooler.compute(this.convertToBooleanArray(noisySequence[i]), false);
                this.temporalPooler.compute(currentSDR, false);
                
                // CRITICAL FIX: Get predictions for NEXT timestep
                const nextPredictiveCells = this.temporalPooler.getNextTimestepPredictions();
                
                const nextSDR = this.spatialPooler.compute(this.convertToBooleanArray(noisySequence[i + 1]), false);
                const accuracy = this.calculatePredictionAccuracy(Array.from(nextPredictiveCells), nextSDR);
                
                if (accuracy > 0.3) {
                    noisyCorrectPredictions++;
                }
                noisyTotalPredictions++;
            }
        }

        const noiseAccuracy = noisyCorrectPredictions / noisyTotalPredictions;
        const passed = noiseAccuracy > 0.4; // 40% accuracy with noise

        this.testResults.set('sequence_noise_tolerance', passed);

        console.log(`Noise tolerance accuracy: ${(noiseAccuracy * 100).toFixed(2)}%`);

        if (!passed) {
            console.error("FAILED: Sequence noise tolerance test");
        } else {
            console.log("PASSED: Sequence noise tolerance test");
        }

        return passed;
    }

    /**
     * Run all temporal pooler tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== TEMPORAL POOLER VALIDATION TESTS ===\n");

        const testMethods = [
            this.testSequenceCompletion.bind(this),
            this.testTemporalPrediction.bind(this),
            this.testSequenceDisambiguation.bind(this),
            this.testTemporalMemoryCapacity.bind(this),
            this.testSequenceNoiseTolerance.bind(this)
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

    private async runSequenceCompletionTest(testCase: SequenceTestCase): Promise<boolean> {
        console.log(`\n  Running ${testCase.name} test...`);
        console.log(`  - Sequences: ${testCase.sequences.length}, Length: ${testCase.sequences[0].length}`);
        console.log(`  - Completion threshold: ${testCase.completionThreshold * 100}%`);
        console.log(`  - Prediction accuracy required: ${testCase.predictionAccuracy * 100}%`);
        
        // Special debugging for overlapping sequences
        if (testCase.name === "Overlapping Sequences") {
            console.log(`  DEBUG: Analyzing overlapping sequences structure...`);
            // Check how many sequences share the same first pattern
            const firstPatterns = testCase.sequences.map(seq => seq[0]);
            const uniqueFirsts = new Set(firstPatterns.map(p => p.join(''))).size;
            console.log(`    - Unique first patterns: ${uniqueFirsts}/${testCase.sequences.length}`);
            
            // Check pattern overlap within sequences
            for (let i = 0; i < Math.min(3, testCase.sequences.length); i++) {
                const seq = testCase.sequences[i];
                const patterns = seq.map(p => p.join(''));
                const uniquePatterns = new Set(patterns).size;
                console.log(`    - Sequence ${i + 1}: ${uniquePatterns}/${seq.length} unique patterns`);
            }
        }
        
        // Train on sequences
        console.log(`  Training phase...`);
        for (let epoch = 0; epoch < 3; epoch++) {
            console.log(`    Epoch ${epoch + 1}/3`);
            for (let seqIdx = 0; seqIdx < testCase.sequences.length; seqIdx++) {
                // Reset state between different sequences
                if (seqIdx > 0) {
                    this.temporalPooler.resetState();
                }
                await this.trainOnSequence(testCase.sequences[seqIdx], true);
            }
        }
        
        // Get learning metrics after training
        const metrics = this.temporalPooler.getLearningMetrics();
        console.log(`  Learning metrics after training:`);
        console.log(`    - Total segments: ${metrics.totalSegments}`);
        console.log(`    - Avg synapses per segment: ${metrics.avgSynapsesPerSegment.toFixed(2)}`);

        // Test completion accuracy
        let completionCount = 0;
        let totalTests = 0;

        for (const sequence of testCase.sequences) {
            this.temporalPooler.resetState(); // Reset state but preserve learned segments
            
            // Warm up with first pattern to establish winner cells
            console.log(`    Testing sequence ${totalTests + 1}...`);
            
            // DEBUG: Check pattern consistency
            if (totalTests === 0 || testCase.name === "Overlapping Sequences") {
                console.log(`      DEBUG: Checking pattern consistency for sequence ${totalTests + 1}...`);
                for (let i = 0; i < Math.min(3, sequence.length); i++) {
                    const pattern = sequence[i];
                    const sdr = this.spatialPooler.compute(this.convertToBooleanArray(pattern), false);
                    const activeIndices = sdr.map((v, idx) => v ? idx : -1).filter(idx => idx >= 0);
                    console.log(`        Pattern ${i}: ${pattern.filter(x => x > 0).length} active inputs -> ${activeIndices.length} active columns`);
                }
            }
            
            const firstSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[0]), false);
            const warmupState = this.temporalPooler.compute(firstSDR, false);
            console.log(`      Warm-up: winner cells = ${warmupState.winnerCells.size}, active cells = ${warmupState.activeCells.size}`);
            
            // Present partial sequence (starting from second pattern)
            const partialLength = Math.floor(sequence.length * 0.7); // Present 70% of sequence
            console.log(`      Presenting partial sequence (positions 1-${partialLength-1})...`);
            
            for (let i = 1; i < partialLength; i++) {
                const sdr = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i]), false);
                const state = this.temporalPooler.compute(sdr, false);
                if (i === 1 || i === partialLength - 1) {
                    console.log(`        Position ${i}: predictive cells = ${state.predictiveCells.size}, winner cells = ${state.winnerCells.size}`);
                }
            }

            // Check if remaining elements can be predicted
            let sequenceCompleted = true;
            let accuracies: number[] = [];
            
            console.log(`    Testing completion from position ${partialLength}...`);
            
            // CRITICAL FIX: Use the new method to get predictions for NEXT timestep
            // After presenting patterns up to partialLength-1, get predictions for partialLength
            const nextPredictiveCells = this.temporalPooler.getNextTimestepPredictions();
            const currentPredictiveCells = Array.from(nextPredictiveCells);
            
            // Check if the pattern at partialLength is predicted
            const firstUnseenSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[partialLength]), false);
            const firstAccuracy = this.calculatePredictionAccuracy(currentPredictiveCells, firstUnseenSDR);
            
            console.log(`      Position ${partialLength}: prediction accuracy = ${(firstAccuracy * 100).toFixed(1)}%`);
            
            if (firstAccuracy < testCase.predictionAccuracy) {
                sequenceCompleted = false;
                console.log(`      Failed at position ${partialLength} (needed ${(testCase.predictionAccuracy * 100).toFixed(1)}%)`);
                accuracies.push(firstAccuracy);
            } else {
                accuracies.push(firstAccuracy);
                
                // Now check remaining positions
                for (let i = partialLength; i < sequence.length - 1; i++) {
                    // Present this pattern
                    const currentSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i]), false);
                    this.temporalPooler.compute(currentSDR, false);
                    
                    // CRITICAL FIX: Use the new method to get predictions for NEXT pattern
                    const nextPredictiveCells = this.temporalPooler.getNextTimestepPredictions();
                    const predictiveCellsArray = Array.from(nextPredictiveCells);
                    
                    // Check if NEXT pattern is predicted
                    const nextSDR = this.spatialPooler.compute(this.convertToBooleanArray(sequence[i + 1]), false);
                    const predictionAccuracy = this.calculatePredictionAccuracy(predictiveCellsArray, nextSDR);
                    accuracies.push(predictionAccuracy);
                    
                    console.log(`      Position ${i + 1}: prediction accuracy = ${(predictionAccuracy * 100).toFixed(1)}%`);
                    
                    if (predictionAccuracy < testCase.predictionAccuracy) {
                        sequenceCompleted = false;
                        console.log(`      Failed at position ${i + 1} (needed ${(testCase.predictionAccuracy * 100).toFixed(1)}%)`);
                        break;
                    }
                }
            }
            
            if (accuracies.length > 0) {
                console.log(`    Sequence ${totalTests + 1} accuracies: ${accuracies.map(a => (a * 100).toFixed(1) + '%').join(', ')}`);
            }
            
            if (sequenceCompleted) {
                completionCount++;
            }
            totalTests++;
        }

        const completionRate = completionCount / totalTests;
        console.log(`  - Completion rate: ${(completionRate * 100).toFixed(1)}% (${completionCount}/${totalTests})`);
        console.log(`  - Test ${completionRate >= testCase.completionThreshold ? 'PASSED' : 'FAILED'}`);
        
        return completionRate >= testCase.completionThreshold;
    }

    private async trainOnSequence(sequence: number[][], learn: boolean): Promise<void> {
        // Train on the complete sequence INCLUDING the wrap-around transition
        // This ensures we learn the last→first pattern transition
        
        for (let i = 0; i < sequence.length; i++) {
            const pattern = sequence[i];
            const sdr = this.spatialPooler.compute(this.convertToBooleanArray(pattern), false);
            
            // Debug: check how many columns are active
            const activeCount = sdr.filter(x => x).length;
            if (i === 0) {
                //console.log(`      First pattern in sequence: ${activeCount} active columns`);
            }
            
            const state = this.temporalPooler.compute(sdr, learn);
            
            // Debug: check if we're creating segments
            if (i === sequence.length - 1 && learn) {
                // Present first pattern again to learn the wrap-around transition
                const firstPattern = sequence[0];
                const firstSdr = this.spatialPooler.compute(this.convertToBooleanArray(firstPattern), false);
                this.temporalPooler.compute(firstSdr, learn);
                
                const metrics = this.temporalPooler.getLearningMetrics();
                //console.log(`      After sequence (with wrap-around): ${metrics.totalSegments} segments`);
            }
        }
    }

    private generateSimpleSequences(count: number, length: number): number[][][] {
        const sequences: number[][][] = [];
        
        for (let i = 0; i < count; i++) {
            const sequence: number[][] = [];
            for (let j = 0; j < length; j++) {
                sequence.push(this.generateRandomPattern(100, 0.1));
            }
            sequences.push(sequence);
        }
        
        return sequences;
    }

    private generateComplexSequences(count: number, length: number): number[][][] {
        const sequences: number[][][] = [];
        
        for (let i = 0; i < count; i++) {
            const sequence: number[][] = [];
            for (let j = 0; j < length; j++) {
                // More complex patterns with varying density
                const density = 0.05 + (j / length) * 0.15; // Increasing density
                sequence.push(this.generateRandomPattern(100, density));
            }
            sequences.push(sequence);
        }
        
        return sequences;
    }

    private generateOverlappingSequences(count: number, length: number): number[][][] {
        const sequences: number[][][] = [];
        const sharedElements = this.generateRandomPattern(100, 0.1);
        
        for (let i = 0; i < count; i++) {
            const sequence: number[][] = [];
            
            // Each sequence starts with shared element
            sequence.push([...sharedElements]);
            
            for (let j = 1; j < length; j++) {
                if (this.rng() < 0.3) {
                    // 30% chance to reuse shared element
                    sequence.push([...sharedElements]);
                } else {
                    sequence.push(this.generateRandomPattern(100, 0.1));
                }
            }
            sequences.push(sequence);
        }
        
        return sequences;
    }

    private generateDeterministicSequences(count: number, length: number): number[][][] {
        const sequences: number[][][] = [];
        
        for (let i = 0; i < count; i++) {
            const sequence: number[][] = [];
            const seed = i * 1000; // Different seed for each sequence
            
            for (let j = 0; j < length; j++) {
                sequence.push(this.generateSeededPattern(100, 0.1, seed + j));
            }
            sequences.push(sequence);
        }
        
        return sequences;
    }

    private generateRandomSequences(count: number, length: number): number[][][] {
        const sequences: number[][][] = [];
        
        for (let i = 0; i < count; i++) {
            const sequence: number[][] = [];
            for (let j = 0; j < length; j++) {
                sequence.push(this.generateRandomPattern(100, 0.1));
            }
            sequences.push(sequence);
        }
        
        return sequences;
    }

    private generateRandomPattern(size: number, density: number): number[] {
        const pattern = new Array(size).fill(0);
        const activeCount = Math.floor(size * density);
        
        for (let i = 0; i < activeCount; i++) {
            let index;
            do {
                index = Math.floor(this.rng() * size);
            } while (pattern[index] === 1);
            pattern[index] = 1;
        }
        
        return pattern;
    }

    private generateSeededPattern(size: number, density: number, seed: number): number[] {
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

    private addNoise(pattern: number[], noiseLevel: number): number[] {
        const noisyPattern = [...pattern];
        const noiseCount = Math.floor(pattern.length * noiseLevel);

        for (let i = 0; i < noiseCount; i++) {
            const index = Math.floor(this.rng() * pattern.length);
            noisyPattern[index] = 1 - noisyPattern[index];
        }

        return noisyPattern;
    }

    private calculatePredictionAccuracy(predictiveCells: number[], actualSDR: boolean[]): number {
        // Convert predictive cells to column indices (assuming cells per column = 32)
        const cellsPerColumn = 32;
        const predictedColumns = new Set<number>();
        
        for (const cellIndex of predictiveCells) {
            predictedColumns.add(Math.floor(cellIndex / cellsPerColumn));
        }

        const activeColumns = new Set<number>();
        for (let i = 0; i < actualSDR.length; i++) {
            if (actualSDR[i]) {
                activeColumns.add(i);
            }
        }

        if (activeColumns.size === 0) return 0;

        let intersection = 0;
        for (const col of predictedColumns) {
            if (activeColumns.has(col)) {
                intersection++;
            }
        }

        const accuracy = intersection / activeColumns.size;
        
        // Debug logging
        if (predictiveCells.length === 0) {
            console.log(`      No predictive cells! Active columns: ${activeColumns.size}`);
            // Additional debug info
            const state = this.temporalPooler.getCurrentState();
            const metrics = this.temporalPooler.getLearningMetrics();
            //console.log(`      [DEBUG TEST] Previous winner cells: ${state.winnerCells.size}, Total segments: ${metrics.totalSegments}`);
            
            // Deep debug: check what's in the segments
            let segmentDebugInfo = {
                totalCells: 0,
                cellsWithSegments: 0,
                totalSegments: 0,
                avgSynapses: 0,
                connectedSynapses: 0
            };
            
            // Access internal cells via reflection (for debugging only)
            const tp = this.temporalPooler as any;
            for (let i = 0; i < tp.cells.length; i++) {
                const cell = tp.cells[i];
                segmentDebugInfo.totalCells++;
                if (cell.segments.length > 0) {
                    segmentDebugInfo.cellsWithSegments++;
                    segmentDebugInfo.totalSegments += cell.segments.length;
                    
                    for (const segment of cell.segments) {
                        segmentDebugInfo.avgSynapses += segment.synapses.length;
                        for (const synapse of segment.synapses) {
                            if (synapse.permanence >= 0.5) {
                                segmentDebugInfo.connectedSynapses++;
                            }
                        }
                    }
                }
            }
            
            if (segmentDebugInfo.totalSegments > 0) {
                segmentDebugInfo.avgSynapses /= segmentDebugInfo.totalSegments;
            }
            
            //console.log(`      [DEEP DEBUG] Cells with segments: ${segmentDebugInfo.cellsWithSegments}/${segmentDebugInfo.totalCells}`);
            //console.log(`      [DEEP DEBUG] Connected synapses: ${segmentDebugInfo.connectedSynapses}, Avg synapses/segment: ${segmentDebugInfo.avgSynapses.toFixed(2)}`);
        }
        
        return accuracy;
    }

    private calculateArrayOverlap(arr1: number[], arr2: number[]): number {
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        
        let intersection = 0;
        for (const item of set1) {
            if (set2.has(item)) {
                intersection++;
            }
        }

        const union = set1.size + set2.size - intersection;
        return union > 0 ? intersection / union : 0;
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

    /**
     * Convert number array to boolean array for spatial pooler
     */
    private convertToBooleanArray(pattern: number[]): boolean[] {
        return pattern.map(x => x > 0);
    }
}
