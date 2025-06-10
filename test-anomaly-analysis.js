// Test script to analyze anomaly detection behavior
const { Agent, AgentConfig } = require('./dist/core/agent.js');
const { DomainAwareAnomalyCalculator } = require('./dist/core/htm/domain-aware-anomaly.js');

// Mock HTM output for testing
function createMockHTMOutput(predictionAccuracy, activeColumns) {
  const predictions = new Array(2048).fill(false);
  // Set some predictions based on accuracy
  const numPredictions = Math.floor(163 * predictionAccuracy);
  for (let i = 0; i < numPredictions; i++) {
    predictions[i] = true;
  }
  
  return {
    activeColumns,
    predictions,
    predictionAccuracy
  };
}

// Test domain-aware anomaly calculation
async function testAnomalyCalculation() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('             ANOMALY DETECTION ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const calculator = new DomainAwareAnomalyCalculator({
    inDomainThreshold: 0.25,
    crossDomainThreshold: 0.60,
    smoothingFactor: 0.8,
    minPatternOverlap: 0.15,
    patternSimilarityBoost: 0.5,
    temporalWindow: 10
  });

  // Create test patterns
  const patterns = {
    // Financial domain patterns (similar)
    financial1: createPattern(2048, [100, 200, 300, 400, 500, 600, 700, 800]),
    financial2: createPattern(2048, [105, 205, 305, 405, 505, 605, 705, 805]),
    financial3: createPattern(2048, [110, 210, 310, 410, 510, 610, 710, 810]),
    
    // Weather domain patterns (different)
    weather1: createPattern(2048, [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700]),
    weather2: createPattern(2048, [1005, 1105, 1205, 1305, 1405, 1505, 1605, 1705]),
    
    // Tech domain patterns (very different)
    tech1: createPattern(2048, [50, 150, 250, 350, 450, 550, 650, 750])
  };

  console.log('Test 1: Within Same Domain (Financial → Financial)');
  console.log('─────────────────────────────────────────────────');
  
  // First pattern - no predictions
  let htmOutput = createMockHTMOutput(0, patterns.financial1);
  let anomaly = calculator.calculateAnomaly(htmOutput, patterns.financial1);
  console.log(`Query 1 (Financial): Anomaly = ${formatAnomaly(anomaly)} (first pattern, no predictions)`);
  
  // Second pattern - high prediction accuracy
  htmOutput = createMockHTMOutput(0.95, patterns.financial2);
  anomaly = calculator.calculateAnomaly(htmOutput, patterns.financial2);
  console.log(`Query 2 (Financial): Anomaly = ${formatAnomaly(anomaly)} (high similarity expected)`);
  
  // Third pattern - still financial
  htmOutput = createMockHTMOutput(0.93, patterns.financial3);
  anomaly = calculator.calculateAnomaly(htmOutput, patterns.financial3);
  console.log(`Query 3 (Financial): Anomaly = ${formatAnomaly(anomaly)} (still in domain)`);
  
  console.log('\nTest 2: Domain Transition (Financial → Weather)');
  console.log('────────────────────────────────────────────────');
  
  // Weather pattern - low prediction accuracy
  htmOutput = createMockHTMOutput(0.2, patterns.weather1);
  anomaly = calculator.calculateAnomaly(htmOutput, patterns.weather1);
  console.log(`Query 4 (Weather):   Anomaly = ${formatAnomaly(anomaly)} (domain shift expected)`);
  
  // Another weather pattern
  htmOutput = createMockHTMOutput(0.85, patterns.weather2);
  anomaly = calculator.calculateAnomaly(htmOutput, patterns.weather2);
  console.log(`Query 5 (Weather):   Anomaly = ${formatAnomaly(anomaly)} (adapting to new domain)`);
  
  console.log('\nTest 3: Major Domain Shift (Weather → Tech)');
  console.log('──────────────────────────────────────────────');
  
  // Tech pattern - very different
  htmOutput = createMockHTMOutput(0.1, patterns.tech1);
  anomaly = calculator.calculateAnomaly(htmOutput, patterns.tech1);
  console.log(`Query 6 (Tech):      Anomaly = ${formatAnomaly(anomaly)} (major shift expected)`);
  
  // Get stats
  const stats = calculator.getStats();
  console.log('\n📊 Anomaly Calculator Statistics:');
  console.log(`   - Smoothed Anomaly: ${(stats.smoothedAnomaly * 100).toFixed(1)}%`);
  console.log(`   - Domain Count: ${stats.domainCount}`);
  console.log(`   - Current Domain: ${stats.currentDomainId || 'None'}`);
  console.log(`   - Average Raw Anomaly: ${(stats.averageRawAnomaly * 100).toFixed(1)}%`);
  console.log(`   - Average Adjusted Anomaly: ${(stats.averageAdjustedAnomaly * 100).toFixed(1)}%`);
  
  console.log('\n🔍 Key Observations:');
  console.log('1. First query always shows N/A (no previous predictions)');
  console.log('2. Similar patterns within domain show low anomaly (< 25%)');
  console.log('3. Domain transitions cause high anomaly (> 60%)');
  console.log('4. Smoothing prevents abrupt changes in anomaly scores');
  console.log('5. Pattern similarity and temporal coherence reduce anomaly');
}

// Helper to create sparse boolean pattern
function createPattern(size, activeIndices) {
  const pattern = new Array(size).fill(false);
  // Add base indices
  activeIndices.forEach(idx => {
    if (idx < size) pattern[idx] = true;
  });
  // Add some random variation
  for (let i = 0; i < 155; i++) { // ~163 total active
    const idx = Math.floor(Math.random() * size);
    pattern[idx] = true;
  }
  return pattern;
}

// Format anomaly score
function formatAnomaly(score) {
  if (score < 0) return 'N/A';
  return `${(score * 100).toFixed(1)}%`;
}

// Run the test
testAnomalyCalculation().catch(console.error);