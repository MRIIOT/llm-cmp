/**
 * Prediction Engine Validation Tests
 * Tests for 98% accuracy on synthetic data
 */

import { PredictionEngine } from '../../core/htm/prediction-engine';
import { HTMRegion } from '../../core/htm/htm-region';
import { SpatialPooler } from '../../core/htm/spatial-pooler';
import { TemporalPooler } from '../../core/htm/temporal-pooler';

interface SyntheticDataTest {
    name: string;
    dataGenerator: () => { sequences: number[][][], patterns: Map<string, number> };
    targetAccuracy: number;
    maxTrainingEpochs: number;
}

export class PredictionEngineTests {
    private predictionEngine: PredictionEngine;
    private testResults: Map<string, number> = new Map(); // Store accuracy results
    private useJaccardSimilarity: boolean = false; // Flag for online learning test

    constructor() {
        // Create HTM Region first
        const htmRegion = new HTMRegion({
            name: 'test-region',
            numColumns: 1024,
            cellsPerColumn: 32,
            inputSize: 200,
            enableSpatialLearning: true,
            enableTemporalLearning: true,
            learningMode: 'online',
            predictionSteps: 5,
            maxMemoryTraces: 100,
            stabilityThreshold: 0.8
        });

        // Initialize prediction engine with the HTM region
        this.predictionEngine = new PredictionEngine(htmRegion, 50, 1000);
    }

    /**
     * Test prediction accuracy on simple deterministic sequences
     */
    async testDeterministicSequences(): Promise<boolean> {
        console.log("Testing deterministic sequences (target: 98% accuracy)...");

        const testData = this.generateDeterministicSequenceData();
        const accuracy = await this.runPredictionTest(testData, 0.98, 5);

        this.testResults.set('deterministic_sequences', accuracy);

        const passed = accuracy >= 0.98;
        console.log(`Deterministic sequences accuracy: ${(accuracy * 100).toFixed(2)}%`);

        if (!passed) {
            console.error("FAILED: Deterministic sequences test (< 98% accuracy)");
        } else {
            console.log("PASSED: Deterministic sequences test (≥ 98% accuracy)");
        }

        return passed;
    }

    /**
     * Test prediction accuracy on repeating patterns
     */
    async testRepeatingPatterns(): Promise<boolean> {
        console.log("Testing repeating patterns (target: 98% accuracy)...");

        const testData = this.generateRepeatingPatternData();
        const accuracy = await this.runPredictionTest(testData, 0.98, 8);

        this.testResults.set('repeating_patterns', accuracy);

        const passed = accuracy >= 0.98;
        console.log(`Repeating patterns accuracy: ${(accuracy * 100).toFixed(2)}%`);

        if (!passed) {
            console.error("FAILED: Repeating patterns test (< 98% accuracy)");
        } else {
            console.log("PASSED: Repeating patterns test (≥ 98% accuracy)");
        }

        return passed;
    }

    /**
     * Test prediction accuracy on arithmetic sequences
     */
    async testArithmeticSequences(): Promise<boolean> {
        console.log("Testing arithmetic sequences (target: 95% accuracy)...");

        const testData = this.generateArithmeticSequenceData();
        const accuracy = await this.runPredictionTest(testData, 0.95, 15);

        this.testResults.set('arithmetic_sequences', accuracy);

        const passed = accuracy >= 0.95;
        console.log(`Arithmetic sequences accuracy: ${(accuracy * 100).toFixed(2)}%`);

        if (!passed) {
            console.error("FAILED: Arithmetic sequences test (< 95% accuracy)");
        } else {
            console.log("PASSED: Arithmetic sequences test (≥ 95% accuracy)");
        }

        return passed;
    }

    /**
     * Test prediction accuracy on hierarchical patterns
     */
    async testHierarchicalPatterns(): Promise<boolean> {
        console.log("Testing hierarchical patterns (target: 90% accuracy)...");

        const testData = this.generateHierarchicalPatternData();
        const accuracy = await this.runPredictionTest(testData, 0.90, 20);

        this.testResults.set('hierarchical_patterns', accuracy);

        const passed = accuracy >= 0.90;
        console.log(`Hierarchical patterns accuracy: ${(accuracy * 100).toFixed(2)}%`);

        if (!passed) {
            console.error("FAILED: Hierarchical patterns test (< 90% accuracy)");
        } else {
            console.log("PASSED: Hierarchical patterns test (≥ 90% accuracy)");
        }

        return passed;
    }

    /**
     * Test prediction confidence calibration
     */
    async testConfidenceCalibration(): Promise<boolean> {
        console.log("Testing prediction confidence calibration...");

        // Generate mixed difficulty data
        const easyData = this.generateDeterministicSequenceData();
        const hardData = this.generateNoisySequenceData();

        // Train on mixed data
        await this.trainPredictionEngine([...easyData.sequences, ...hardData.sequences], 5);

        // Test confidence calibration
        let highConfidenceCorrect = 0;
        let highConfidenceTotal = 0;
        let lowConfidenceCorrect = 0;
        let lowConfidenceTotal = 0;

        // Test on easy data (should have high confidence and high accuracy)
        for (const sequence of easyData.sequences.slice(0, 10)) {
            const results = await this.evaluateSequenceWithConfidence(sequence);
            
            for (const result of results) {
                if (result.confidence > 0.8) {
                    highConfidenceTotal++;
                    if (result.correct) highConfidenceCorrect++;
                } else if (result.confidence < 0.4) {
                    lowConfidenceTotal++;
                    if (result.correct) lowConfidenceCorrect++;
                }
            }
        }

        // Test on hard data (should have lower confidence and lower accuracy)
        for (const sequence of hardData.sequences.slice(0, 10)) {
            const results = await this.evaluateSequenceWithConfidence(sequence);
            
            for (const result of results) {
                if (result.confidence > 0.8) {
                    highConfidenceTotal++;
                    if (result.correct) highConfidenceCorrect++;
                } else if (result.confidence < 0.4) {
                    lowConfidenceTotal++;
                    if (result.correct) lowConfidenceCorrect++;
                }
            }
        }

        const highConfidenceAccuracy = highConfidenceTotal > 0 ? highConfidenceCorrect / highConfidenceTotal : 0;
        const lowConfidenceAccuracy = lowConfidenceTotal > 0 ? lowConfidenceCorrect / lowConfidenceTotal : 1;

        // High confidence predictions should be more accurate than low confidence
        // Handle edge case: if no low confidence predictions, check that high confidence is good
        const calibrationOK = lowConfidenceTotal === 0 
            ? highConfidenceAccuracy > 0.9 
            : (highConfidenceAccuracy > lowConfidenceAccuracy && highConfidenceAccuracy > 0.9);

        this.testResults.set('confidence_calibration', calibrationOK ? 1.0 : 0.0);

        console.log(`High confidence accuracy: ${(highConfidenceAccuracy * 100).toFixed(2)}% (${highConfidenceCorrect}/${highConfidenceTotal})`);
        console.log(`Low confidence accuracy: ${(lowConfidenceAccuracy * 100).toFixed(2)}% (${lowConfidenceCorrect}/${lowConfidenceTotal})`);

        if (!calibrationOK) {
            console.error("FAILED: Confidence calibration test");
        } else {
            console.log("PASSED: Confidence calibration test");
        }

        return calibrationOK;
    }

    /**
     * Test multi-step prediction capability
     */
    async testMultiStepPrediction(): Promise<boolean> {
        console.log("Testing multi-step prediction capability...");

        const testData = this.generateDeterministicSequenceData();
        
        // Train the model
        await this.trainPredictionEngine(testData.sequences, 8);

        // Test multi-step predictions (1, 2, 3, 4, 5 steps ahead)
        const stepAccuracies: number[] = [];

        for (let steps = 1; steps <= 5; steps++) {
            let correctPredictions = 0;
            let totalPredictions = 0;

            for (const sequence of testData.sequences.slice(0, 20)) {
                if (sequence.length < steps + 3) continue; // Need enough context

                this.predictionEngine.reset();

                // Provide context
                const contextLength = sequence.length - steps - 1;
                for (let i = 0; i < contextLength; i++) {
                    this.predictionEngine.process(sequence[i]);
                }

                // Make multi-step prediction
                const predictions = this.predictionEngine.predictMultiStep(steps);
                
                // Check accuracy at each step
                for (let step = 0; step < steps && step < predictions.length; step++) {
                    const actualIndex = contextLength + step;
                    if (actualIndex < sequence.length) {
                        const predicted = predictions[step];
                        const actual = sequence[actualIndex];
                        
                        const accuracy = this.calculatePatternSimilarity(predicted.pattern, actual);
                        if (accuracy > 0.7) {
                            correctPredictions++;
                        }
                        totalPredictions++;
                    }
                }
            }

            const stepAccuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
            stepAccuracies.push(stepAccuracy);
            console.log(`${steps}-step prediction accuracy: ${(stepAccuracy * 100).toFixed(2)}%`);
        }

        // At least 1-step should be > 95%, and accuracy should degrade gracefully
        const oneStepOK = stepAccuracies[0] > 0.95;
        const gracefulDegradation = stepAccuracies.every((acc, i) => i === 0 || acc >= stepAccuracies[i-1] - 0.2);

        const passed = oneStepOK && gracefulDegradation;
        this.testResults.set('multi_step_prediction', passed ? 1.0 : 0.0);

        if (!passed) {
            console.error("FAILED: Multi-step prediction test");
        } else {
            console.log("PASSED: Multi-step prediction test");
        }

        return passed;
    }

    /**
     * Test online learning and adaptation
     */
    async testOnlineLearning(): Promise<boolean> {
        console.log("Testing online learning and adaptation...");

        // Enable Jaccard similarity for this test (better for sparse patterns)
        this.useJaccardSimilarity = true;

        // Create a completely fresh, untrained prediction engine
        const freshHTMRegion = new HTMRegion({
            name: 'online-test-region',
            numColumns: 1024,
            cellsPerColumn: 32,
            inputSize: 200,
            enableSpatialLearning: true,
            enableTemporalLearning: true,
            learningMode: 'online',
            predictionSteps: 5,
            maxMemoryTraces: 100,
            stabilityThreshold: 0.8
        });
        
        const onlinePredictionEngine = new PredictionEngine(freshHTMRegion, 50, 1000);

        // NO initial training - start completely fresh
        console.log("\n  Starting with completely untrained model");

        // Test on simple deterministic sequences
        const testData = this.generateDeterministicSequenceData();
        console.log("  Testing online learning with deterministic sequences");
        
        let onlineAccuracy = 0;
        let adaptationSteps = 0;

        for (let seqIdx = 0; seqIdx < 10; seqIdx++) {
            const sequence = testData.sequences[seqIdx];
            console.log(`\n  Testing sequence ${seqIdx + 1}/10, length: ${sequence.length}`);
            
            // Test prediction before any training - should be poor
            const preLearningAcc = await this.measureOnlineAccuracy(onlinePredictionEngine, sequence);
            console.log(`    Pre-learning accuracy: ${(preLearningAcc * 100).toFixed(2)}%`);
            
            // Train on this specific sequence
            console.log(`    Training on sequence...`);
            for (let i = 0; i < 5; i++) {
                onlinePredictionEngine.trainOnSequence(sequence);
            }
            adaptationSteps++;

            // Test prediction after learning this specific sequence
            const postLearningAcc = await this.measureOnlineAccuracy(onlinePredictionEngine, sequence);
            console.log(`    Post-learning accuracy: ${(postLearningAcc * 100).toFixed(2)}%`);
            
            const improvement = postLearningAcc - preLearningAcc;
            console.log(`    Improvement: ${(improvement * 100).toFixed(2)}%`);
            
            if (improvement > 0.05) { // Any improvement > 5%
                onlineAccuracy += 1;
                console.log(`    ✓ Improvement detected`);
            } else {
                console.log(`    ✗ No significant improvement`);
            }
        }

        const adaptationRate = onlineAccuracy / adaptationSteps;
        const passed = adaptationRate > 0.7; // 70% of new patterns should improve after online learning

        this.testResults.set('online_learning', adaptationRate);

        console.log(`\nOnline adaptation rate: ${(adaptationRate * 100).toFixed(2)}% (${onlineAccuracy}/${adaptationSteps} sequences improved)`);

        // Reset flag
        this.useJaccardSimilarity = false;

        if (!passed) {
            console.error("FAILED: Online learning test");
        } else {
            console.log("PASSED: Online learning test");
        }

        return passed;
    }

    /**
     * Measure accuracy for online learning with a specific engine
     */
    private async measureOnlineAccuracy(engine: PredictionEngine, sequence: number[][]): Promise<number> {
        let correctPredictions = 0;
        let totalPredictions = 0;
        const similarities: number[] = [];

        // Reset engine for clean measurement
        engine.reset();

        // For completely untrained model, we need to give at least one pattern as context
        // Otherwise it has no basis for prediction
        if (sequence.length > 1) {
            engine.process(sequence[0]);
        }

        // Measure predictions on the rest of the sequence
        for (let i = 1; i < sequence.length - 1 && i < 4; i++) { // Limit to first few for debugging
            const prediction = engine.predict(sequence[i]);
            const actual = sequence[i + 1];

            if (prediction && 'pattern' in prediction) {
                const similarity = this.calculatePatternSimilarity(prediction.pattern, actual);
                similarities.push(similarity);
                
                // Debug: show details for first prediction
                if (i === 1) {
                    const predActive = prediction.pattern.filter(p => p > 0.5).length;
                    const actualActive = actual.filter(a => a > 0.5).length;
                    console.log(`      First prediction details:`);
                    console.log(`        Predicted active bits: ${predActive}`);
                    console.log(`        Actual active bits: ${actualActive}`);
                    console.log(`        Similarity: ${similarity.toFixed(3)}`);
                    console.log(`        Confidence: ${prediction.confidence.toFixed(3)}`);
                    
                    // Show Jaccard calculation if using it
                    if (this.useJaccardSimilarity && (predActive > 0 || actualActive > 0)) {
                        let intersection = 0;
                        let union = 0;
                        for (let j = 0; j < prediction.pattern.length; j++) {
                            const bit1 = prediction.pattern[j] > 0.5 ? 1 : 0;
                            const bit2 = actual[j] > 0.5 ? 1 : 0;
                            if (bit1 === 1 || bit2 === 1) {
                                union++;
                                if (bit1 === 1 && bit2 === 1) {
                                    intersection++;
                                }
                            }
                        }
                        console.log(`        Jaccard: ${intersection}∩/${union}∪ = ${similarity.toFixed(3)}`);
                    }
                }
                
                if (similarity > 0.7) {
                    correctPredictions++;
                }
            } else {
                similarities.push(0);
                if (i === 1) {
                    console.log(`      First prediction: NO PREDICTION`);
                }
            }
            totalPredictions++;

            // Process the actual pattern for context
            engine.process(sequence[i]);
        }

        // Continue measuring rest of sequence without debug output
        for (let i = 4; i < sequence.length - 1; i++) {
            const prediction = engine.predict(sequence[i]);
            const actual = sequence[i + 1];

            if (prediction && 'pattern' in prediction) {
                const similarity = this.calculatePatternSimilarity(prediction.pattern, actual);
                if (similarity > 0.7) {
                    correctPredictions++;
                }
            }
            totalPredictions++;
            engine.process(sequence[i]);
        }

        // Show similarity distribution
        if (similarities.length > 0) {
            const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
            console.log(`      Average similarity: ${avgSim.toFixed(3)}`);
        }

        return totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    }

    /**
     * Measure accuracy on a single sequence without resetting the prediction engine
     */
    private async measureSingleSequenceAccuracy(sequence: number[][]): Promise<number> {
        let correctPredictions = 0;
        let totalPredictions = 0;

        // Process first few patterns to build context without measuring
        const contextSize = Math.min(3, Math.floor(sequence.length / 2));
        for (let i = 0; i < contextSize; i++) {
            this.predictionEngine.process(sequence[i]);
        }

        // Now measure predictions
        for (let i = contextSize; i < sequence.length - 1; i++) {
            const prediction = this.predictionEngine.predict(sequence[i]);
            const actual = sequence[i + 1];

            if (prediction && 'pattern' in prediction) {
                const similarity = this.calculatePatternSimilarity(prediction.pattern, actual);
                if (similarity > 0.7) {
                    correctPredictions++;
                }
            }
            totalPredictions++;

            // Process the actual pattern for context
            this.predictionEngine.process(sequence[i]);
        }

        return totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    }

    /**
     * Run all prediction engine tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== PREDICTION ENGINE VALIDATION TESTS ===\n");

        const testMethods = [
            this.testOnlineLearning.bind(this),
            this.testDeterministicSequences.bind(this),
            this.testRepeatingPatterns.bind(this),
            this.testArithmeticSequences.bind(this),
            this.testHierarchicalPatterns.bind(this),
            this.testConfidenceCalibration.bind(this),
            this.testMultiStepPrediction.bind(this)
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

    private async runPredictionTest(testData: { sequences: number[][][], patterns: Map<string, number> }, targetAccuracy: number, maxEpochs: number): Promise<number> {
        // Split data into training and testing
        const trainSequences = testData.sequences.slice(0, Math.floor(testData.sequences.length * 0.8));
        const testSequences = testData.sequences.slice(Math.floor(testData.sequences.length * 0.8));

        // Train the model
        await this.trainPredictionEngine(trainSequences, maxEpochs);

        // Test accuracy
        return await this.measureCurrentAccuracy(testSequences);
    }

    private async trainPredictionEngine(sequences: number[][][], epochs: number): Promise<void> {
        for (let epoch = 0; epoch < epochs; epoch++) {
            for (const sequence of sequences) {
                this.predictionEngine.trainOnSequence(sequence);
            }
        }
    }

    private async measureCurrentAccuracy(sequences: number[][][]): Promise<number> {
        let correctPredictions = 0;
        let totalPredictions = 0;

        for (const sequence of sequences) {
            this.predictionEngine.reset();

            for (let i = 0; i < sequence.length - 1; i++) {
                const prediction = this.predictionEngine.predict(sequence[i]);
                const actual = sequence[i + 1];

                if (prediction && 'pattern' in prediction) {
                    const similarity = this.calculatePatternSimilarity(prediction.pattern, actual);
                    if (similarity > 0.7) {
                        correctPredictions++;
                    }
                }
                totalPredictions++;

                // Process the actual pattern for context
                this.predictionEngine.process(sequence[i]);
            }
        }

        return totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    }

    private async evaluateSequenceWithConfidence(sequence: number[][]): Promise<Array<{correct: boolean, confidence: number}>> {
        this.predictionEngine.reset();
        const results: Array<{correct: boolean, confidence: number}> = [];

        for (let i = 0; i < sequence.length - 1; i++) {
            const prediction = this.predictionEngine.predict(sequence[i]);
            const actual = sequence[i + 1];

            if (prediction && 'pattern' in prediction) {
                const similarity = this.calculatePatternSimilarity(prediction.pattern, actual);
                results.push({
                    correct: similarity > 0.7,
                    confidence: typeof prediction.confidence === 'number' ? prediction.confidence : prediction.confidence[0] || 0
                });
            } else {
                results.push({
                    correct: false,
                    confidence: 0
                });
            }

            this.predictionEngine.process(sequence[i]);
        }

        return results;
    }

    private generateDeterministicSequenceData(): { sequences: number[][][], patterns: Map<string, number> } {
        const sequences: number[][][] = [];
        const patterns = new Map<string, number>();

        // Generate simple repeating sequences like A-B-C-A-B-C
        const basePatterns = [
            this.generateNumberPattern([1, 0, 0, 0, 0]),
            this.generateNumberPattern([0, 1, 0, 0, 0]),
            this.generateNumberPattern([0, 0, 1, 0, 0]),
            this.generateNumberPattern([0, 0, 0, 1, 0]),
            this.generateNumberPattern([0, 0, 0, 0, 1])
        ];

        for (let seq = 0; seq < 10; seq++) {
            const sequence: number[][] = [];
            const patternLength = 3 + (seq % 3); // Vary pattern length

            for (let i = 0; i < 10; i++) {
                const patternIndex = i % patternLength;
                sequence.push([...basePatterns[patternIndex]]);
            }
            sequences.push(sequence);
        }

        return { sequences, patterns };
    }

    private generateRepeatingPatternData(): { sequences: number[][][], patterns: Map<string, number> } {
        const sequences: number[][][] = [];
        const patterns = new Map<string, number>();

        // Generate patterns that repeat with slight variations
        for (let seq = 0; seq < 25; seq++) {
            const sequence: number[][] = [];
            const basePattern = this.generateRandomBinaryPattern(200, 0.1);
            const period = 4 + (seq % 4);

            for (let i = 0; i < 30; i++) {
                if (i % period === 0) {
                    sequence.push([...basePattern]);
                } else {
                    // Slight variation
                    const variant = [...basePattern];
                    const changeCount = Math.floor(variant.length * 0.02); // 2% change
                    for (let j = 0; j < changeCount; j++) {
                        const idx = Math.floor(Math.random() * variant.length);
                        variant[idx] = 1 - variant[idx];
                    }
                    sequence.push(variant);
                }
            }
            sequences.push(sequence);
        }

        return { sequences, patterns };
    }

    private generateArithmeticSequenceData(): { sequences: number[][][], patterns: Map<string, number> } {
        const sequences: number[][][] = [];
        const patterns = new Map<string, number>();

        // Generate arithmetic sequences encoded as binary patterns
        for (let seq = 0; seq < 20; seq++) {
            const sequence: number[][] = [];
            const start = seq % 10;
            const step = 1 + (seq % 3);

            for (let i = 0; i < 15; i++) {
                const value = (start + i * step) % 20; // Keep values in range
                sequence.push(this.encodeNumberAsBinaryPattern(value, 200));
            }
            sequences.push(sequence);
        }

        return { sequences, patterns };
    }

    private generateHierarchicalPatternData(): { sequences: number[][][], patterns: Map<string, number> } {
        const sequences: number[][][] = [];
        const patterns = new Map<string, number>();

        // Generate hierarchical patterns: macro-patterns containing micro-patterns
        const microPatterns = [
            this.generateRandomBinaryPattern(50, 0.1),
            this.generateRandomBinaryPattern(50, 0.1),
            this.generateRandomBinaryPattern(50, 0.1),
            this.generateRandomBinaryPattern(50, 0.1)
        ];

        for (let seq = 0; seq < 15; seq++) {
            const sequence: number[][] = [];
            const macroPattern = [0, 1, 2, 1, 3, 2, 0]; // Pattern of micro-pattern indices

            for (let i = 0; i < 21; i++) {
                const macroIndex = i % macroPattern.length;
                const microIndex = macroPattern[macroIndex];
                
                // Create full pattern by combining micro-pattern with context
                const fullPattern = new Array(200).fill(0);
                
                // Insert micro-pattern at position based on macro-pattern
                const offset = microIndex * 50;
                for (let j = 0; j < microPatterns[microIndex].length; j++) {
                    if (offset + j < fullPattern.length) {
                        fullPattern[offset + j] = microPatterns[microIndex][j];
                    }
                }
                
                sequence.push(fullPattern);
            }
            sequences.push(sequence);
        }

        return { sequences, patterns };
    }

    private generateNoisySequenceData(): { sequences: number[][][], patterns: Map<string, number> } {
        const cleanData = this.generateDeterministicSequenceData();
        const noisySequences: number[][][] = [];

        for (const sequence of cleanData.sequences) {
            const noisySequence: number[][] = [];
            for (const pattern of sequence) {
                const noisyPattern = [...pattern];
                // Add 5% noise
                const noiseCount = Math.floor(pattern.length * 0.05);
                for (let i = 0; i < noiseCount; i++) {
                    const idx = Math.floor(Math.random() * pattern.length);
                    noisyPattern[idx] = 1 - noisyPattern[idx];
                }
                noisySequence.push(noisyPattern);
            }
            noisySequences.push(noisySequence);
        }

        return { sequences: noisySequences, patterns: cleanData.patterns };
    }

    private generateNumberPattern(oneHot: number[]): number[] {
        const pattern = new Array(200).fill(0);
        // Encode one-hot as distributed pattern
        for (let i = 0; i < oneHot.length; i++) {
            if (oneHot[i] === 1) {
                const start = i * 40; // 40 bits per category
                for (let j = 0; j < 20; j++) { // 20 active bits per category
                    pattern[start + j] = 1;
                }
            }
        }
        return pattern;
    }

    private generateRandomBinaryPattern(size: number, density: number): number[] {
        const pattern = new Array(size).fill(0);
        const activeCount = Math.floor(size * density);
        
        for (let i = 0; i < activeCount; i++) {
            let index;
            do {
                index = Math.floor(Math.random() * size);
            } while (pattern[index] === 1);
            pattern[index] = 1;
        }
        
        return pattern;
    }

    private encodeNumberAsBinaryPattern(num: number, patternSize: number): number[] {
        const pattern = new Array(patternSize).fill(0);
        
        // Use distributed encoding for numbers
        const bitsPerNumber = Math.floor(patternSize / 20); // Support numbers 0-19
        const start = (num % 20) * bitsPerNumber;
        const activeBits = Math.floor(bitsPerNumber * 0.5); // 50% density
        
        for (let i = 0; i < activeBits; i++) {
            if (start + i < pattern.length) {
                pattern[start + i] = 1;
            }
        }
        
        return pattern;
    }

    private calculatePatternSimilarity(pattern1: number[], pattern2: number[]): number {
        if (pattern1.length !== pattern2.length) {
            return 0;
        }

        // For online learning test, use Jaccard similarity for sparse patterns
        if (this.useJaccardSimilarity) {
            return this.calculateJaccardSimilarity(pattern1, pattern2);
        }

        // For other tests, use simple accuracy metric
        let matches = 0;
        for (let i = 0; i < pattern1.length; i++) {
            // Convert to boolean for comparison (handle both number and boolean arrays)
            const bit1 = pattern1[i] > 0.5 ? 1 : 0;
            const bit2 = pattern2[i] > 0.5 ? 1 : 0;
            
            if (bit1 === bit2) {
                matches++;
            }
        }

        return matches / pattern1.length;
    }

    /**
     * Calculate Jaccard similarity for sparse patterns
     * Better for online learning test where patterns have few active bits
     */
    private calculateJaccardSimilarity(pattern1: number[], pattern2: number[]): number {
        let intersection = 0;
        let union = 0;
        
        for (let i = 0; i < pattern1.length; i++) {
            const bit1 = pattern1[i] > 0.5 ? 1 : 0;
            const bit2 = pattern2[i] > 0.5 ? 1 : 0;
            
            if (bit1 === 1 || bit2 === 1) {
                union++;
                if (bit1 === 1 && bit2 === 1) {
                    intersection++;
                }
            }
        }

        // If both patterns are all zeros, consider them different (not similar)
        if (union === 0) {
            return 0.0;
        }

        return intersection / union;
    }

    private printTestSummary(): void {
        console.log("=== TEST SUMMARY ===");
        let totalScore = 0;
        let testCount = 0;

        for (const [testName, accuracy] of this.testResults) {
            const percentage = (accuracy * 100).toFixed(2);
            const status = accuracy >= 0.8 ? 'PASSED' : 'FAILED';
            console.log(`${testName}: ${percentage}% (${status})`);
            totalScore += accuracy;
            testCount++;
        }

        const avgAccuracy = testCount > 0 ? totalScore / testCount : 0;
        console.log(`\nOverall average accuracy: ${(avgAccuracy * 100).toFixed(2)}%`);
        
        const overallPassed = avgAccuracy >= 0.9; // 90% overall target
        console.log(`Overall result: ${overallPassed ? 'PASSED' : 'FAILED'}`);
    }

    getTestResults(): Map<string, number> {
        return new Map(this.testResults);
    }
}
