/**
 * Utility functions for agent demo visualizations
 * Provides ASCII art and formatted output helpers
 */

import { 
  Message, 
  ReasoningStep, 
  HTMState,
  Evidence,
  BayesianBelief,
  UncertaintyEstimate,
  TemporalContext,
  SemanticPosition,
  LogicalProof,
  InferenceRule
} from '../types/index.js';

import {
  EnhancedLogicalProofValidator,
  type LLMInterface,
  visualizeLogicalProof,
  createLogicalDependencyGraph
} from './logical-proof-validator-enhanced.js';

/**
 * Format and display complete reasoning chain with visual elements
 */
export async function displayReasoningChain(message: Message, llmInterface?: LLMInterface): Promise<void> {
  const reasoning = message.content.reasoning;
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                          REASONING CHAIN                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  // Display each step with connections
  reasoning.steps.forEach((step, idx) => {
    displayReasoningStep(step, idx + 1, reasoning.steps);
  });
  
  // Display overall metrics
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ CHAIN METRICS                                                       │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  console.log(`│ Overall Confidence: ${formatConfidence(reasoning.confidence)}                    │`);
  console.log(`│ Logical Structure:                                                  │`);
  console.log(`│   • Premises: ${reasoning.logicalStructure.premises.length} steps                                          │`);
  console.log(`│   • Inferences: ${reasoning.logicalStructure.inferences.length} steps                                        │`);
  console.log(`│   • Conclusions: ${reasoning.logicalStructure.conclusions.length} steps                                       │`);
  console.log(`│ Temporal Pattern: ${reasoning.temporalPattern.substring(0, 45)}...       │`);
  console.log('└─────────────────────────────────────────────────────────────────────┘');
  
  // Validate and display logical proof if available
  if (!reasoning.logicalProof) {
    // Generate logical proof validation
    // Enhanced validator requires LLM interface
    if (llmInterface) {
      console.log('\n🔬 Using Enhanced Logical Proof Validator with LLM-powered contradiction detection...');
      const validator = new EnhancedLogicalProofValidator(llmInterface, { enableLLMValidation: true });
      const proof = await validator.validateReasoningChainAsync(reasoning);
      reasoning.logicalProof = proof;
    } else {
      console.log('\n⚠️  LLM interface required for logical proof validation');
      console.log('   Enhanced validator requires LLM for accurate contradiction detection');
    }
  }
  
  if (reasoning.logicalProof) {
    console.log(visualizeLogicalProof(reasoning.logicalProof));
    console.log(createLogicalDependencyGraph(reasoning.logicalProof));
  }
}

/**
 * Display a single reasoning step with visual formatting including logical notation
 */
function displayReasoningStep(step: ReasoningStep, num: number, allSteps: ReasoningStep[]): void {
  const typeIcon = getReasoningTypeIcon(step.type);
  const confidenceBar = createConfidenceBar(step.confidence.mean);
  
  console.log(`${num}. ${typeIcon} [${step.type.toUpperCase()}:${step.concept}]`);
  console.log(`   ├─ Content: ${wrapText(step.content, 65, '   │  ')}`);
  
  // Add logical form if available
  if (step.logicalForm) {
    console.log(`   ├─ Logical Form: ${step.logicalForm.formalNotation}`);
  }
  
  // Add inference rule if available
  if (step.inferenceRule) {
    console.log(`   ├─ Inference Rule: ${step.inferenceRule.name} (${step.inferenceRule.notation})`);
  }
  
  console.log(`   ├─ Confidence: ${confidenceBar} ${formatConfidence(step.confidence)}`);
  
  if (step.supporting.length > 0) {
    const supportingNums = step.supporting
      .map(id => allSteps.findIndex(s => s.id === id) + 1)
      .filter(n => n > 0);
    console.log(`   ├─ ✓ Supported by: steps ${supportingNums.join(', ')}`);
  }
  
  if (step.refuting.length > 0) {
    const refutingNums = step.refuting
      .map(id => allSteps.findIndex(s => s.id === id) + 1)
      .filter(n => n > 0);
    console.log(`   ├─ ✗ Conflicts with: steps ${refutingNums.join(', ')}`);
  }
  
  console.log(`   └─────────────────────────────────────────────────────────────────`);
}

/**
 * Create ASCII visualization of HTM state
 */
export function visualizeHTMState(htmState: HTMState): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                          HTM STATE VISUALIZATION                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  // Create a mini grid visualization
  const gridSize = 32; // 32x32 grid to represent 1024 columns
  const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill('·'));
  
  // Mark active columns
  htmState.activeColumns.forEach(col => {
    if (col < gridSize * gridSize) {
      const row = Math.floor(col / gridSize);
      const colIdx = col % gridSize;
      grid[row][colIdx] = '█';
    }
  });
  
  // Mark predicted columns
  htmState.predictedColumns.forEach(col => {
    if (col < gridSize * gridSize) {
      const row = Math.floor(col / gridSize);
      const colIdx = col % gridSize;
      if (grid[row][colIdx] === '·') {
        grid[row][colIdx] = '░';
      } else if (grid[row][colIdx] === '█') {
        grid[row][colIdx] = '▓'; // Both active and predicted
      }
    }
  });
  
  console.log('   Active/Predicted Column Grid (32x32 sample of 2048 columns):');
  console.log('   ┌' + '─'.repeat(gridSize * 2) + '┐');
  grid.forEach(row => {
    console.log('   │' + row.join(' ') + '│');
  });
  console.log('   └' + '─'.repeat(gridSize * 2) + '┘');
  
  console.log('\n   Legend: [·] Inactive  [█] Active  [░] Predicted  [▓] Active+Predicted');
  
  // Display metrics
  const anomalyBar = createAnomalyBar(htmState.anomalyScore);
  const anomalyDisplay = htmState.anomalyScore >= 0 ? `${(htmState.anomalyScore * 100).toFixed(1)}%` : 'N/A';
  console.log(`\n   Active Columns: ${htmState.activeColumns.length} / 2048`);
  console.log(`   Predicted Columns: ${htmState.predictedColumns.length}`);
  console.log(`   Anomaly Score: ${anomalyBar} ${anomalyDisplay}`);
  console.log(`   Sequence ID: ${htmState.sequenceId}`);
  console.log(`   Learning: ${htmState.learningEnabled ? '✓ Enabled' : '✗ Disabled'}`);
}

/**
 * Display uncertainty breakdown with visual bars
 */
export function displayUncertaintyAnalysis(uncertainty: UncertaintyEstimate): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                        UNCERTAINTY ANALYSIS                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  const aleatoricBar = createUncertaintyBar(uncertainty.aleatoric);
  const epistemicBar = createUncertaintyBar(uncertainty.epistemic);
  const totalBar = createUncertaintyBar(uncertainty.total);
  
  console.log(`   Aleatoric (data):     ${aleatoricBar} ${(uncertainty.aleatoric * 100).toFixed(1)}%`);
  console.log(`   Epistemic (knowledge): ${epistemicBar} ${(uncertainty.epistemic * 100).toFixed(1)}%`);
  console.log(`   ──────────────────────────────────────────────────────────────────`);
  console.log(`   Total Uncertainty:     ${totalBar} ${(uncertainty.total * 100).toFixed(1)}%`);
  
  console.log('\n   Sources Breakdown:');
  uncertainty.sources.forEach(source => {
    const sourceBar = createUncertaintyBar(source.contribution);
    console.log(`   • ${source.type.padEnd(10)}: ${sourceBar} ${(source.contribution * 100).toFixed(1)}% - ${source.description}`);
  });
}

/**
 * Visualize evidence relationships
 */
export function visualizeEvidenceGraph(evidence: Evidence[]): void {
  if (evidence.length === 0) return;
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                         EVIDENCE GRAPH                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  evidence.forEach((ev, idx) => {
    const typeIcon = getEvidenceTypeIcon(ev.type);
    const reliabilityBar = createConfidenceBar(ev.metadata.reliability);
    const relevanceBar = createConfidenceBar(ev.metadata.relevance);
    
    console.log(`   ${idx + 1}. ${typeIcon} ${ev.type.toUpperCase()}`);
    console.log(`      ├─ Content: ${wrapText(ev.content, 60, '      │  ').substring(0, 65)}...`);
    console.log(`      ├─ Reliability: ${reliabilityBar} ${(ev.metadata.reliability * 100).toFixed(0)}%`);
    console.log(`      ├─ Relevance:   ${relevanceBar} ${(ev.metadata.relevance * 100).toFixed(0)}%`);
    
    if (ev.metadata.corroboration.length > 0) {
      console.log(`      ├─ ✓ Corroborated by: ${ev.metadata.corroboration.length} pieces`);
    }
    if (ev.metadata.conflicts.length > 0) {
      console.log(`      ├─ ✗ Conflicts with: ${ev.metadata.conflicts.length} pieces`);
    }
    console.log(`      └────────────────────────────────────────────────────────`);
  });
}

/**
 * Display temporal context visualization
 */
export function visualizeTemporalContext(context: TemporalContext): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                       TEMPORAL CONTEXT                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  const stabilityBar = createConfidenceBar(context.stability);
  
  console.log(`   Pattern Stability: ${stabilityBar} ${(context.stability * 100).toFixed(1)}%`);
  console.log(`   Current Pattern: ${context.currentPattern.substring(0, 50)}...`);
  
  if (context.patternHistory.length > 0) {
    console.log('\n   Pattern Evolution:');
    const recentPatterns = context.patternHistory.slice(-5);
    recentPatterns.forEach((pattern, idx) => {
      const arrow = idx < recentPatterns.length - 1 ? '→' : '⟹';
      console.log(`     ${pattern.substring(0, 20).padEnd(20)} ${arrow}`);
    });
    console.log(`     ${context.currentPattern.substring(0, 20).padEnd(20)} ← current`);
  }
  
  if (context.predictions.length > 0) {
    console.log('\n   Temporal Predictions:');
    context.predictions.forEach((pred, idx) => {
      const confBar = createConfidenceBar(pred.confidence);
      console.log(`     ${idx + 1}. Pattern: ${pred.pattern.substring(0, 30)}...`);
      console.log(`        Time: +${pred.timeHorizon}ms | Conf: ${confBar} ${(pred.confidence * 100).toFixed(0)}%`);
    });
  }
}

/**
 * Visualize semantic position in space
 */
export function visualizeSemanticPosition(position: SemanticPosition): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                      SEMANTIC POSITION                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  // Create a 2D projection visualization
  const size = 20;
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill('·'));
  
  // Project position to 2D (using first 2 dimensions)
  if (position.coordinates.length >= 2) {
    const x = Math.floor((position.coordinates[0] + 1) / 2 * (size - 1));
    const y = Math.floor((position.coordinates[1] + 1) / 2 * (size - 1));
    
    if (x >= 0 && x < size && y >= 0 && y < size) {
      grid[y][x] = '⊕';
    }
  }
  
  // Add trajectory if available
  if (position.trajectory && position.trajectory.positions.length > 0) {
    position.trajectory.positions.slice(-5).forEach(pos => {
      if (pos.coordinates.length >= 2) {
        const x = Math.floor((pos.coordinates[0] + 1) / 2 * (size - 1));
        const y = Math.floor((pos.coordinates[1] + 1) / 2 * (size - 1));
        if (x >= 0 && x < size && y >= 0 && y < size && grid[y][x] === '·') {
          grid[y][x] = '∘';
        }
      }
    });
  }
  
  console.log('   2D Projection of Semantic Space:');
  console.log('   ┌' + '─'.repeat(size) + '┐');
  grid.forEach(row => {
    console.log('   │' + row.join('') + '│');
  });
  console.log('   └' + '─'.repeat(size) + '┘');
  
  console.log('\n   Legend: [·] Empty  [∘] Past  [⊕] Current');
  
  console.log(`\n   Manifold: ${position.manifold}`);
  console.log(`   Dimensions: ${position.coordinates.length}D`);
  console.log(`   First 5 coords: [${position.coordinates.slice(0, 5).map(c => c.toFixed(2)).join(', ')}...]`);
  console.log(`   Confidence: ${(position.confidence * 100).toFixed(1)}%`);
  
  if (position.trajectory && position.trajectory.velocity.length > 0) {
    const speed = Math.sqrt(position.trajectory.velocity.reduce((sum, v) => sum + v * v, 0));
    console.log(`   Velocity: ${speed.toFixed(3)} units/step`);
  }
}

// === Helper Functions ===

function getReasoningTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'observation': '👁️ ',
    'inference': '💭',
    'deduction': '⟹ ',
    'induction': '⟰ ',
    'abduction': '❓',
    'analogy': '≈ ',
    'synthesis': '⊕ ',
    'critique': '⚖️ ',
    'prediction': '🔮'
  };
  return icons[type] || '• ';
}

function getEvidenceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'empirical': '📊',
    'testimonial': '💬',
    'analytical': '🔍',
    'circumstantial': '🔗',
    'theoretical': '📐'
  };
  return icons[type] || '📎';
}

function createConfidenceBar(confidence: number): string {
  const width = 20;
  // Ensure confidence is within valid range [0, 1]
  const clampedConfidence = Math.max(0, Math.min(1, confidence || 0));
  const filled = Math.round(clampedConfidence * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

function createUncertaintyBar(uncertainty: number): string {
  const width = 20;
  const filled = Math.round(uncertainty * width);
  const empty = width - filled;
  return '[' + '▓'.repeat(filled) + '·'.repeat(empty) + ']';
}

function createAnomalyBar(anomaly: number): string {
  const width = 20;
  
  // Handle special case where anomaly is -1 (N/A)
  if (anomaly < 0) {
    return '[' + '-'.repeat(width) + ']'; // Show as dashes for N/A
  }
  
  const filled = Math.round(anomaly * width);
  const empty = width - filled;
  
  if (anomaly > 0.8) {
    return '[' + '█'.repeat(filled) + '·'.repeat(empty) + ']'; // Red/Critical
  } else if (anomaly > 0.5) {
    return '[' + '▓'.repeat(filled) + '·'.repeat(empty) + ']'; // Yellow/Warning
  } else {
    return '[' + '░'.repeat(filled) + '·'.repeat(empty) + ']'; // Green/Normal
  }
}

function formatConfidence(conf: { mean: number; lower: number; upper: number }): string {
  return `${(conf.mean * 100).toFixed(1)}% (${(conf.lower * 100).toFixed(0)}%-${(conf.upper * 100).toFixed(0)}%)`;
}

function wrapText(text: string, width: number, indent: string = ''): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    if (currentLine.length + word.length + 1 > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n' + indent);
}

// Export visualization suite
export const AgentVisualization = {
  displayReasoningChain,
  visualizeHTMState,
  displayUncertaintyAnalysis,
  visualizeEvidenceGraph,
  visualizeTemporalContext,
  visualizeSemanticPosition
};
