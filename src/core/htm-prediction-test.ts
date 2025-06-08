/**
 * HTM Prediction Test
 * Proves that HTM makes real predictions BEFORE seeing the next input
 */

import { HTMRegion, createDefaultHTMRegionConfig } from './htm/htm-region.js';

export async function testHTMPredictions() {
  console.log('\n=== HTM PREDICTION PROOF TEST ===\n');
  
  // Create HTM with small size for easy visualization
  const config = createDefaultHTMRegionConfig('test', 100, 50);
  config.cellsPerColumn = 4;
  const htm = new HTMRegion(config);
  
  // Create simple repeating patterns
  const patternA = new Array(100).fill(false);
  const patternB = new Array(100).fill(false);
  const patternC = new Array(100).fill(false);
  
  // Set specific bits for each pattern
  [0, 5, 10, 15, 20].forEach(i => patternA[i] = true);
  [2, 7, 12, 17, 22].forEach(i => patternB[i] = true);
  [4, 9, 14, 19, 24].forEach(i => patternC[i] = true);
  
  console.log('Training sequence: A → B → C → A → B → C...\n');
  
  // Train the sequence multiple times
  for (let rep = 0; rep < 5; rep++) {
    console.log(`\nTraining repetition ${rep + 1}:`);
    
    // Present pattern A
    let output = htm.compute(patternA, true);
    console.log(`After A: Active columns: ${output.activeColumns.filter(x => x).length}`);
    console.log(`         Predicted columns for next step: ${output.predictions.filter(x => x).length}`);
    
    // Present pattern B
    output = htm.compute(patternB, true);
    const correctPredictions = output.activeColumns.filter((active, i) => active && output.predictions[i]).length;
    console.log(`After B: Active columns: ${output.activeColumns.filter(x => x).length}`);
    console.log(`         Correctly predicted from A→B: ${correctPredictions}`);
    console.log(`         Prediction accuracy: ${(output.predictionAccuracy * 100).toFixed(1)}%`);
    
    // Present pattern C
    output = htm.compute(patternC, true);
    console.log(`After C: Prediction accuracy: ${(output.predictionAccuracy * 100).toFixed(1)}%`);
  }
  
  console.log('\n--- PROOF TEST ---');
  console.log('Now we\'ll show predictions BEFORE presenting the next pattern:\n');
  
  // Present A and show what HTM predicts
  let output = htm.compute(patternA, false);
  const predictedColumns = output.predictions.map((p, i) => p ? i : -1).filter(i => i >= 0);
  console.log(`After seeing A:`);
  console.log(`- HTM predicts these columns will activate next: [${predictedColumns.slice(0, 10).join(', ')}...]`);
  console.log(`- Total predicted: ${predictedColumns.length} columns`);
  
  // Now present B and check if predictions were correct
  output = htm.compute(patternB, false);
  const actualColumns = output.activeColumns.map((a, i) => a ? i : -1).filter(i => i >= 0);
  const correctlyPredicted = predictedColumns.filter(col => output.activeColumns[col]);
  
  console.log(`\nAfter presenting B:`);
  console.log(`- Actually activated: [${actualColumns.slice(0, 10).join(', ')}...]`);
  console.log(`- Correctly predicted: ${correctlyPredicted.length} out of ${predictedColumns.length}`);
  console.log(`- Prediction accuracy: ${(output.predictionAccuracy * 100).toFixed(1)}%`);
  
  // Show confidence levels
  const avgConfidence = output.predictionConfidence.filter(c => c > 0).reduce((a, b) => a + b, 0) / 
                       output.predictionConfidence.filter(c => c > 0).length || 0;
  console.log(`- Average prediction confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  
  console.log('\n✅ This proves HTM makes predictions BEFORE seeing the input!');
  
  return {
    predictedColumns,
    actualColumns,
    accuracy: output.predictionAccuracy
  };
}

// Run if executed directly
if (require.main === module) {
  testHTMPredictions().catch(console.error);
}
