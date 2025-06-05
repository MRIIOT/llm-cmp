import { SpatialPooler } from './src/core/htm/spatial-pooler';

// Create spatial pooler with test configuration
const sp = new SpatialPooler({
    numColumns: 2048,
    columnDimensions: [2048],
    inputDimensions: [1000],
    potentialRadius: 100,
    potentialPct: 0.5,
    globalInhibition: true,
    localAreaDensity: 0.02,
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

// Generate a base pattern with fixed seed for reproducibility
function generateBinaryPatternWithSeed(size: number, density: number, seed: number): number[] {
    // Simple linear congruential generator for reproducibility
    let rng = seed;
    const random = () => {
        rng = (rng * 1664525 + 1013904223) % 2147483648;
        return rng / 2147483648;
    };
    
    const pattern = new Array(size).fill(0);
    const activeCount = Math.floor(size * density);
    const indices: number[] = [];
    
    // Generate all indices
    for (let i = 0; i < size; i++) {
        indices.push(i);
    }
    
    // Shuffle and pick first activeCount
    for (let i = 0; i < activeCount; i++) {
        const j = Math.floor(random() * (size - i)) + i;
        [indices[i], indices[j]] = [indices[j], indices[i]];
        pattern[indices[i]] = 1;
    }
    
    return pattern;
}

// Add noise to pattern with fixed seed
function addNoiseWithSeed(pattern: number[], noiseLevel: number, seed: number): number[] {
    let rng = seed;
    const random = () => {
        rng = (rng * 1664525 + 1013904223) % 2147483648;
        return rng / 2147483648;
    };
    
    const noisyPattern = [...pattern];
    const noiseCount = Math.floor(pattern.length * noiseLevel);
    const indices: number[] = [];
    
    // Generate all indices
    for (let i = 0; i < pattern.length; i++) {
        indices.push(i);
    }
    
    // Shuffle and flip first noiseCount bits
    for (let i = 0; i < noiseCount; i++) {
        const j = Math.floor(random() * (pattern.length - i)) + i;
        [indices[i], indices[j]] = [indices[j], indices[i]];
        noisyPattern[indices[i]] = 1 - noisyPattern[indices[i]];
    }

    return noisyPattern;
}

// Calculate overlap between two SDRs
function calculateOverlap(sdr1: boolean[], sdr2: boolean[]): number {
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

// Test noisy pattern stability
console.log("Testing noisy pattern stability with fixed patterns...\n");

const basePattern = generateBinaryPatternWithSeed(1000, 0.1, 12345);
const noisyPatterns: number[][] = [];

// Generate 10 FIXED noisy patterns using seeds
console.log("Generating fixed noisy patterns...");
for (let i = 0; i < 10; i++) {
    const noisyPattern = addNoiseWithSeed(basePattern, 0.15, 1000 + i);
    noisyPatterns.push(noisyPattern);
}

// Verify patterns are different but consistent
console.log("\nPattern differences from base:");
for (let i = 0; i < noisyPatterns.length; i++) {
    let diffs = 0;
    for (let j = 0; j < basePattern.length; j++) {
        if (basePattern[j] !== noisyPatterns[i][j]) diffs++;
    }
    console.log(`Pattern ${i}: ${diffs} bits different (${(diffs/basePattern.length*100).toFixed(1)}%)`);
}

// Store SDRs for each pattern
const sdrMap = new Map<string, boolean[]>();
const stabilityResults: number[] = [];

// Run 3 trials
console.log("\n\nRunning stability test with 3 trials...");
for (let trial = 0; trial < 3; trial++) {
    console.log(`\n=== Trial ${trial + 1} ===`);
    
    for (let i = 0; i < noisyPatterns.length; i++) {
        const pattern = noisyPatterns[i];
        const patternKey = pattern.join(',');
        
        // Convert to boolean array
        const inputVector = pattern.map(x => x > 0);
        
        // Compute SDR
        const sdr = sp.compute(inputVector, true);
        
        if (sdrMap.has(patternKey)) {
            const previousSDR = sdrMap.get(patternKey)!;
            const overlap = calculateOverlap(previousSDR, sdr);
            console.log(`Pattern ${i}: Overlap = ${(overlap * 100).toFixed(2)}% ${overlap >= 0.85 ? '✓' : '✗ FAILED'}`);
            stabilityResults.push(overlap);
        } else {
            sdrMap.set(patternKey, sdr);
            console.log(`Pattern ${i}: First encounter (storing SDR)`);
        }
        
        // Check sparsity
        const activeCount = sdr.filter(x => x).length;
        const sparsity = activeCount / sdr.length;
        if (Math.abs(sparsity - 0.02) > 0.01) {
            console.log(`  WARNING: Sparsity = ${(sparsity * 100).toFixed(2)}% (expected ~2%)`);
        }
    }
}

// Summary statistics
if (stabilityResults.length > 0) {
    const avgStability = stabilityResults.reduce((a, b) => a + b, 0) / stabilityResults.length;
    const minStability = Math.min(...stabilityResults);
    const maxStability = Math.max(...stabilityResults);
    
    console.log("\n=== Summary ===");
    console.log(`Average stability: ${(avgStability * 100).toFixed(2)}%`);
    console.log(`Min stability: ${(minStability * 100).toFixed(2)}%`);
    console.log(`Max stability: ${(maxStability * 100).toFixed(2)}%`);
    console.log(`Required: >= 85%`);
    console.log(`Test result: ${minStability >= 0.85 ? 'PASS' : 'FAIL'}`);
}
