/**
 * Focused test for HTM sequence learning
 * 
 * This test creates simple repeating patterns to verify
 * that the HTM can learn and predict sequences correctly.
 */

import { HTMRegion, createDefaultHTMRegionConfig } from '../core/htm/htm-region.js';

// Create binary patterns that activate multiple columns for better temporal learning
function createPattern(size: number, activeIndices: number[]): boolean[] {
  const pattern = new Array(size).fill(false);
  activeIndices.forEach(idx => {
    if (idx < size) pattern[idx] = true;
  });
  return pattern;
}

// Create a sequence of patterns that will activate multiple columns
// This ensures temporal pooler has enough synaptic connections to learn
function createSimpleSequence(): boolean[][] {
  const size = 100; // Input size
  return [
    // Pattern A - activates ~15-20 bits to ensure multiple columns active
    createPattern(size, [0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50, 51, 52, 60, 61]), 
    
    // Pattern B - different set ensuring multiple columns
    createPattern(size, [5, 6, 7, 15, 16, 17, 25, 26, 27, 35, 36, 37, 45, 46, 47, 55, 56, 57, 65, 66]), 
    
    // Pattern C - another distinct set
    createPattern(size, [3, 4, 8, 13, 14, 18, 23, 24, 28, 33, 34, 38, 43, 44, 48, 53, 54, 58, 63, 64]), 
    
    // Pattern D - final pattern in sequence
    createPattern(size, [9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91])
  ];
}

async function testHTMSequenceLearning() {
  console.log('=== HTM Sequence Learning Test ===\n');
  
  // Create HTM region with configuration optimized for sequence learning
  const config = createDefaultHTMRegionConfig('test_htm', 100, 50);
  config.cellsPerColumn = 4; // Keep small for easier debugging
  config.enableTemporalLearning = true;
  config.enableSpatialLearning = true; // CRITICAL FIX: Enable spatial learning for stable representations
  
  // Configure spatial pooler for better pattern separation
  config.spatialConfig = {
    sparsity: 0.16, // ~8 columns active out of 50 (increased from 0.1)
    boostStrength: 3.0, // Higher boost for better learning (increased from 2.0)
    dutyCyclePeriod: 50, // Shorter period for faster adaptation (reduced from 100)
    globalInhibition: true, // Ensure global inhibition is used
    potentialPct: 0.9, // Higher connectivity for better learning
    synPermActiveInc: 0.08, // Faster synapse strengthening
    synPermInactiveDec: 0.005 // Slower synapse weakening for stability
  };
  
  // Configure temporal pooler with realistic thresholds for multi-column patterns
  config.temporalConfig = {
    cellsPerColumn: 4,
    activationThreshold: 6, // CRITICAL FIX: Lower threshold (was 13, now 6)
    learningThreshold: 4,   // Lower learning threshold too
    initialPermanence: 0.6, // Higher initial permanence for faster learning
    connectedPermanence: 0.5,
    permanenceIncrement: 0.15, // Faster permanence increases
    permanenceDecrement: 0.05, // Slower decreases to maintain stability
    sampleSize: 15, // More synapses per segment
    maxNewSynapseCount: 15,
    seed: 42 // Fixed seed for reproducible results
  };
  
  const htm = new HTMRegion(config);
  
  // Create multi-column sequence patterns
  const sequence = createSimpleSequence();
  console.log(`Testing with sequence of ${sequence.length} patterns`);
  console.log(`Each pattern activates ~20 bits to ensure multiple columns are active`);
  
  // Debug: Show pattern characteristics
  sequence.forEach((pattern, i) => {
    const activeCount = pattern.filter(x => x).length;
    const activeIndices = pattern.map((bit, idx) => bit ? idx : -1).filter(idx => idx >= 0).slice(0, 10);
    console.log(`Pattern ${String.fromCharCode(65 + i)}: ${activeCount} active bits [${activeIndices.join(', ')}...]`);
  });
  console.log();
  
  // Train the HTM on the sequence multiple times
  const numRepetitions = 10;
  let totalPredictions = 0;
  let correctPredictions = 0;
  
  for (let rep = 0; rep < numRepetitions; rep++) {
    console.log(`\n--- Repetition ${rep + 1} ---`);
    
    for (let i = 0; i < sequence.length; i++) {
      const pattern = sequence[i];
      const nextPattern = sequence[(i + 1) % sequence.length];
      
      // Process current pattern
      const output = htm.compute(pattern, true);
      
      // Debug: Show spatial activation
      const activeColumnCount = output.activeColumns.filter(a => a).length;
      console.log(`Pattern ${String.fromCharCode(65 + i)}: ${activeColumnCount} active columns, ${output.activeCells.length} active cells, ${output.predictiveCells.length} predictive cells`);
      
      // Check temporal predictions after first few iterations
      if (rep > 0) { 
        // Count overlapping predictions with next pattern
        let matches = 0;
        let totalActive = 0;
        let totalPredicted = 0;
        
        // Get spatial activation for next pattern (what SHOULD be predicted)
        const nextOutput = htm.compute(nextPattern, false); // Don't learn during prediction check
        htm.compute(pattern, true); // Restore learning on current pattern
        
        for (let j = 0; j < output.predictions.length; j++) {
          if (nextOutput.activeColumns[j]) {
            totalActive++;
            if (output.predictions[j]) {
              matches++;
            }
          }
          if (output.predictions[j]) {
            totalPredicted++;
          }
        }
        
        const accuracy = totalActive > 0 ? matches / totalActive : 0;
        const precision = totalPredicted > 0 ? matches / totalPredicted : 0;
        
        console.log(`  → Predicting ${String.fromCharCode(65 + ((i + 1) % sequence.length))}: ` +
                   `${matches}/${totalActive} columns correct (${(accuracy * 100).toFixed(1)}% recall, ` +
                   `${(precision * 100).toFixed(1)}% precision)`);
        
        if (totalActive > 0) {
          totalPredictions++;
          if (accuracy > 0.5) correctPredictions++;
        }
      }
      
      // Show detailed HTM state for debugging
      if (rep < 3 || rep === numRepetitions - 1) { // Show detail for first few and last repetition
        console.log(`    HTM State: ${(output.predictionAccuracy * 100).toFixed(1)}% accuracy, ` +
                   `${(output.sparsity * 100).toFixed(1)}% sparsity, ` +
                   `${(output.stability * 100).toFixed(1)}% stability`);
      }
    }
    
    // Show learning metrics after each repetition
    const metrics = htm.getPerformanceMetrics();
    console.log(`\nRepetition ${rep + 1} Summary:`);
    console.log(`  Overall accuracy: ${(metrics.predictionAccuracy * 100).toFixed(1)}%`);
    console.log(`  Learning rate: ${(metrics.learningRate * 100).toFixed(2)}%`);
    console.log(`  Stability: ${(metrics.stability * 100).toFixed(1)}%`);
    console.log(`  Sparsity: ${(metrics.sparsity * 100).toFixed(1)}%`);
    
    // Show progress indicators
    if (rep > 2) {
      const recentAccuracy = metrics.predictionAccuracy;
      if (recentAccuracy > 0.1) {
        console.log(`  🟢 Learning detected! Accuracy: ${(recentAccuracy * 100).toFixed(1)}%`);
      } else if (recentAccuracy > 0.05) {
        console.log(`  🟡 Some learning... Accuracy: ${(recentAccuracy * 100).toFixed(1)}%`);
      } else {
        console.log(`  🔴 No significant learning yet`);
      }
    }
  }
  
  // Final summary with improved analysis
  console.log('\n=== Final Results ===');
  const finalMetrics = htm.getPerformanceMetrics();
  console.log(`Final Prediction Accuracy: ${(finalMetrics.predictionAccuracy * 100).toFixed(1)}%`);
  console.log(`Final Learning Rate: ${(finalMetrics.learningRate * 100).toFixed(2)}%`);
  console.log(`Final Stability: ${(finalMetrics.stability * 100).toFixed(1)}%`);
  
  const overallAccuracy = totalPredictions > 0 ? 
    correctPredictions / totalPredictions : 0;
  console.log(`Manual Check Accuracy: ${(overallAccuracy * 100).toFixed(1)}%`);
  
  // Success criteria
  const success = finalMetrics.predictionAccuracy > 0.6; // 60% threshold
  console.log(`\nResult: ${success ? '✅ SUCCESS' : '❌ LEARNING INSUFFICIENT'}`);
  if (success) {
    console.log('HTM successfully learned the temporal sequence!');
  } else {
    console.log('HTM needs more training or parameter adjustment.');
  }
  
  // Test specific prediction with detailed analysis
  console.log('\n=== Prediction Test ===');
  console.log('Testing sequence prediction: A → B → C → D → A...');
  
  for (let i = 0; i < sequence.length; i++) {
    const patternName = String.fromCharCode(65 + i);
    const nextPatternName = String.fromCharCode(65 + ((i + 1) % sequence.length));
    
    console.log(`\nProcessing pattern ${patternName}...`);
    const outputA = htm.compute(sequence[i], false); // Don't learn during test
    
    const predictedColumns = outputA.predictions.filter(p => p).length;
    console.log(`After pattern ${patternName}: predicting ${predictedColumns} columns for ${nextPatternName}`);
    
    // Show confidence levels
    const avgConfidence = outputA.predictionConfidence.reduce((a, b) => a + b, 0) / outputA.predictionConfidence.length;
    console.log(`Average prediction confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // Check against actual next pattern
    const nextPattern = sequence[(i + 1) % sequence.length];
    const nextOutput = htm.compute(nextPattern, false);
    
    let matches = 0;
    let totalExpected = 0;
    for (let j = 0; j < outputA.predictions.length; j++) {
      if (nextOutput.activeColumns[j]) {
        totalExpected++;
        if (outputA.predictions[j]) matches++;
      }
    }
    
    const accuracy = totalExpected > 0 ? matches / totalExpected : 0;
    console.log(`Prediction accuracy for ${patternName}→${nextPatternName}: ${(accuracy * 100).toFixed(1)}%`);
  }
}

// Run the test
testHTMSequenceLearning().catch(console.error);
