/**
 * Spatial Pooler Validation Tests
 * Tests for stable sparse representations
 */

import { SpatialPooler } from '../../core/htm/spatial-pooler';

interface TestCase {
    name: string;
    inputPatterns: number[][];
    expectedSparsity: number;
    expectedStability: number;
}

export class SpatialPoolerTests {
    private spatialPooler: SpatialPooler;
    private testResults: Map<string, boolean> = new Map();
    private rng: () => number; // Seeded random for deterministic tests

    constructor() {
        // Initialize seeded random for deterministic test patterns
        this.rng = this.createSeededRandom(12345);
        
        // Initialize with conservative HTM parameters for testing
        this.spatialPooler = new SpatialPooler({
            numColumns: 2048,
            columnDimensions: [2048],
            inputDimensions: [1000],
            potentialRadius: 100,
            potentialPct: 0.5,
            globalInhibition: true,
            localAreaDensity: 0.02, // 2% sparsity target
            numActiveColumnsPerInhArea: 40,
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
    }

    /**
     * Create a seeded random number generator
     */
    private createSeededRandom(seed: number): () => number {
        let state = seed;
        return () => {
            state = (state * 1664525 + 1013904223) % 2147483648;
            return state / 2147483648;
        };
    }

    /**
     * Test that spatial pooler produces stable sparse representations
     */
    async testStableSparseRepresentations(): Promise<boolean> {
        console.log("Testing stable sparse representations...");

        const testCases: TestCase[] = [
            {
                name: "Binary Random Patterns",
                inputPatterns: this.generateBinaryPatterns(10, 1000, 0.1),
                expectedSparsity: 0.02,
                expectedStability: 0.95
            },
            {
                name: "Overlapping Patterns",
                inputPatterns: this.generateOverlappingPatterns(10, 1000, 0.8),
                expectedSparsity: 0.02,
                expectedStability: 0.90
            },
            {
                name: "Noisy Patterns",
                inputPatterns: this.generateNoisyPatterns(10, 1000, 0.15),
                expectedSparsity: 0.02,
                expectedStability: 0.85
            }
        ];

        let allPassed = true;

        for (const testCase of testCases) {
            const result = await this.runStabilityTest(testCase);
            this.testResults.set(`stability_${testCase.name}`, result);
            
            if (!result) {
                console.error(`FAILED: ${testCase.name} stability test`);
                allPassed = false;
            } else {
                console.log(`PASSED: ${testCase.name} stability test`);
            }
        }

        return allPassed;
    }

    /**
     * Test sparsity consistency across different input patterns
     */
    async testSparsityConsistency(): Promise<boolean> {
        console.log("Testing sparsity consistency...");

        const inputPatterns = this.generateBinaryPatterns(50, 1000, 0.1);
        const sparsityMeasurements: number[] = [];

        for (const pattern of inputPatterns) {
            const activeColumns = this.spatialPooler.compute(this.convertToBooleanArray(pattern), true);
            const sparsity = activeColumns.filter(x => x).length / activeColumns.length;
            sparsityMeasurements.push(sparsity);
        }

        const avgSparsity = sparsityMeasurements.reduce((a, b) => a + b, 0) / sparsityMeasurements.length;
        const sparsityVariance = sparsityMeasurements.reduce((acc, val) => acc + Math.pow(val - avgSparsity, 2), 0) / sparsityMeasurements.length;
        const sparsityStdDev = Math.sqrt(sparsityVariance);

        // Target sparsity should be around 2% with low variance
        const targetSparsity = 0.02;
        const maxDeviation = 0.005; // 0.5% deviation allowed
        const maxStdDev = 0.002; // Very low standard deviation required

        const sparsityOK = Math.abs(avgSparsity - targetSparsity) < maxDeviation;
        const consistencyOK = sparsityStdDev < maxStdDev;

        const passed = sparsityOK && consistencyOK;
        this.testResults.set('sparsity_consistency', passed);

        console.log(`Average sparsity: ${(avgSparsity * 100).toFixed(2)}% (target: ${(targetSparsity * 100).toFixed(2)}%)`);
        console.log(`Sparsity std dev: ${(sparsityStdDev * 100).toFixed(3)}% (max: ${(maxStdDev * 100).toFixed(3)}%)`);

        if (!passed) {
            console.error("FAILED: Sparsity consistency test");
        } else {
            console.log("PASSED: Sparsity consistency test");
        }

        return passed;
    }

    /**
     * Test overlap patterns and distinctiveness
     */
    async testOverlapDistinctiveness(): Promise<boolean> {
        console.log("Testing overlap distinctiveness...");

        // Create patterns with known overlap relationships
        const basePattern = this.generateBinaryPattern(1000, 0.1);
        const similarPattern = this.addNoise(basePattern, 0.1); // 10% noise
        const dissimilarPattern = this.generateBinaryPattern(1000, 0.1);

        const baseSDR = this.spatialPooler.compute(this.convertToBooleanArray(basePattern), true);
        const similarSDR = this.spatialPooler.compute(this.convertToBooleanArray(similarPattern), true);
        const dissimilarSDR = this.spatialPooler.compute(this.convertToBooleanArray(dissimilarPattern), true);

        const overlapSimilar = this.calculateOverlap(baseSDR, similarSDR);
        const overlapDissimilar = this.calculateOverlap(baseSDR, dissimilarSDR);

        // Similar patterns should have higher overlap than dissimilar ones
        const distinctivenessOK = overlapSimilar > overlapDissimilar;
        const reasonableOverlap = overlapSimilar > 0.1 && overlapSimilar < 0.9; // Not too high or too low

        const passed = distinctivenessOK && reasonableOverlap;
        this.testResults.set('overlap_distinctiveness', passed);

        console.log(`Similar pattern overlap: ${(overlapSimilar * 100).toFixed(2)}%`);
        console.log(`Dissimilar pattern overlap: ${(overlapDissimilar * 100).toFixed(2)}%`);

        if (!passed) {
            console.error("FAILED: Overlap distinctiveness test");
        } else {
            console.log("PASSED: Overlap distinctiveness test");
        }

        return passed;
    }

    /**
     * Test learning and adaptation capabilities
     */
    async testLearningAdaptation(): Promise<boolean> {
        console.log("Testing learning adaptation...");

        const trainingPatterns = this.generateBinaryPatterns(100, 1000, 0.1);
        const testPattern = trainingPatterns[0]; // Use first pattern for stability test

        // Initial response
        const initialSDR = this.spatialPooler.compute(this.convertToBooleanArray(testPattern), true);

        // Train on patterns multiple times
        for (let epoch = 0; epoch < 10; epoch++) {
            for (const pattern of trainingPatterns) {
                this.spatialPooler.compute(this.convertToBooleanArray(pattern), true); // Enable learning
            }
        }

        // Response after training
        const trainedSDR = this.spatialPooler.compute(this.convertToBooleanArray(testPattern), false); // No learning

        // After training, response should be more stable
        const stabilityImprovement = this.calculateOverlap(initialSDR, trainedSDR) > 0.8;
        
        const passed = stabilityImprovement;
        this.testResults.set('learning_adaptation', passed);

        if (!passed) {
            console.error("FAILED: Learning adaptation test");
        } else {
            console.log("PASSED: Learning adaptation test");
        }

        return passed;
    }

    /**
     * Run all spatial pooler tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== SPATIAL POOLER VALIDATION TESTS ===\n");

        const testMethods = [
            this.testStableSparseRepresentations.bind(this),
            this.testSparsityConsistency.bind(this),
            this.testOverlapDistinctiveness.bind(this),
            this.testLearningAdaptation.bind(this)
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

    private async runStabilityTest(testCase: TestCase): Promise<boolean> {
        const sdrMappings: Map<string, boolean[]> = new Map();

        // Train and test stability
        for (let trial = 0; trial < 3; trial++) {
            for (const pattern of testCase.inputPatterns) {
                const activeColumns = this.spatialPooler.compute(this.convertToBooleanArray(pattern), true);
                const patternKey = pattern.join(',');
                
                if (sdrMappings.has(patternKey)) {
                    const previousSDR = sdrMappings.get(patternKey)!;
                    const stability = this.calculateOverlap(previousSDR, activeColumns);
                    if (stability < testCase.expectedStability) {
                        return false;
                    }
                } else {
                    sdrMappings.set(patternKey, activeColumns);
                }

                // Check sparsity
                const sparsity = activeColumns.filter(x => x).length / activeColumns.length;
                if (Math.abs(sparsity - testCase.expectedSparsity) > 0.01) {
                    return false;
                }
            }
        }

        return true;
    }

    private generateBinaryPatterns(count: number, size: number, density: number): number[][] {
        const patterns: number[][] = [];
        for (let i = 0; i < count; i++) {
            patterns.push(this.generateBinaryPattern(size, density));
        }
        return patterns;
    }

    private generateBinaryPattern(size: number, density: number): number[] {
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

    private generateOverlappingPatterns(count: number, size: number, overlapRatio: number): number[][] {
        const basePattern = this.generateBinaryPattern(size, 0.1);
        const patterns: number[][] = [basePattern];

        for (let i = 1; i < count; i++) {
            const newPattern = [...basePattern];
            const changeCount = Math.floor(size * 0.1 * (1 - overlapRatio));
            
            // Change some bits
            for (let j = 0; j < changeCount; j++) {
                const index = Math.floor(this.rng() * size);
                newPattern[index] = 1 - newPattern[index];
            }
            
            patterns.push(newPattern);
        }

        return patterns;
    }

    private generateNoisyPatterns(count: number, size: number, noiseLevel: number): number[][] {
        const basePattern = this.generateBinaryPattern(size, 0.1);
        const patterns: number[][] = [];

        for (let i = 0; i < count; i++) {
            patterns.push(this.addNoise(basePattern, noiseLevel));
        }

        return patterns;
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

    private calculateOverlap(sdr1: boolean[], sdr2: boolean[]): number {
        if (sdr1.length !== sdr2.length) {
            throw new Error("SDR lengths must match");
        }

        let intersection = 0;
        let union = 0;

        for (let i = 0; i < sdr1.length; i++) {
            if (sdr1[i] && sdr2[i]) {
                intersection++;
            }
            if (sdr1[i] || sdr2[i]) {
                union++;
            }
        }

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
