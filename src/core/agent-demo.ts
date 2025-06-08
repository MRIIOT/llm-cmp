/**
 * Demo: Advanced Agent Capabilities
 * Showcases HTM, Bayesian reasoning, and adaptive agent features
 */

import { Agent, AgentConfig } from './agent.js';
import {
  LLMRequest,
  LLMResponse,
  Message,
  ReasoningStep,
  Evidence,
  AgentCapability,
  PerformanceMetric,
  BayesianBelief,
  BeliefDistribution
} from '../types/index.js';
import { 
  AgentVisualization,
  displayReasoningChain,
  visualizeHTMState,
  displayUncertaintyAnalysis,
  visualizeEvidenceGraph,
  visualizeTemporalContext,
  visualizeSemanticPosition
} from './agent-demo-utils.js';

/**
 * Mock LLM interface for demonstrations
 * Simulates different reasoning patterns based on query type
 */
async function mockLLMInterface(request: LLMRequest): Promise<LLMResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let content = '';
  
  // Check if this is a semantic feature extraction request
  if (request.metadata?.purpose === 'semantic_feature_extraction') {
    // Return JSON for semantic encoding
    const text = request.prompt.match(/TEXT: "(.+)"/)?.[1] || request.prompt;
    const isQuestion = text.includes('?');
    const hasClimate = text.toLowerCase().includes('climate') || text.toLowerCase().includes('weather');
    const hasQuantum = text.toLowerCase().includes('quantum');
    const hasTech = text.toLowerCase().includes('ai') || text.toLowerCase().includes('intelligence');
    
    const semanticFeatures = {
      concepts: hasClimate ? 
        ['climate', 'feedback_loops', 'temperature', 'greenhouse', 'systems'] :
        hasQuantum ?
        ['quantum', 'superposition', 'measurement', 'computing', 'states'] :
        hasTech ?
        ['intelligence', 'artificial', 'emergence', 'philosophy', 'implications'] :
        ['analysis', 'patterns', 'systems', 'understanding', 'reasoning'],
      categories: hasClimate ? 
        ['environmental', 'science'] :
        hasQuantum ?
        ['physics', 'technology'] :
        hasTech ?
        ['technology', 'philosophy'] :
        ['general', 'analysis'],
      attributes: {
        abstractness: hasQuantum || hasTech ? 0.8 : 0.5,
        specificity: 0.7,
        technicality: hasQuantum ? 0.9 : hasTech ? 0.8 : 0.6,
        certainty: isQuestion ? 0.4 : 0.7,
        actionability: 0.5,
        temporality: hasClimate ? 0.8 : 0.4
      },
      relationships: hasClimate ?
        ['causes', 'affects', 'accelerates'] :
        hasQuantum ?
        ['exists', 'collapses', 'enables'] :
        ['emerges', 'implies', 'requires'],
      intent: isQuestion ? 'question' : 'analysis',
      complexity: 0.7,
      temporalAspect: hasClimate || text.includes('future')
    };
    
    content = JSON.stringify(semanticFeatures);
  } else {
    // Return structured reasoning for regular queries
    const prompt = request.prompt.toLowerCase();
    
    // Generate structured reasoning based on query type with logical forms
    if (prompt.includes('climate') || prompt.includes('weather')) {
      content = `[OBSERVATION:weather_data|Temperature(current, 1.1°C_above_baseline)] Current global temperature trends show a 1.1°C increase since pre-industrial times
[INFERENCE:climate_impact|∀e(TemperatureRise(e) → IncreaseFrequency(ExtremeWeather, e))] Based on temperature rise, we can expect increased frequency of extreme weather events
[ANALOGY:feedback_loops|IceAlbedo(x) ∧ Melting(x) → AcceleratesWarming(x)] Positive feedback mechanisms like ice-albedo effect accelerate warming trends
[DEDUCTION:future_state|CurrentTrend(warming) ∧ NoIntervention → FutureTemperature(2-4°C)] Therefore, without intervention, temperatures will likely rise 2-4°C by 2100
[PREDICTION:regional_effects|∀r(Arctic(r) → WarmingRate(r) > GlobalAverage)] Regional impacts will vary, with Arctic regions warming faster than global average
[SYNTHESIS:action_needed|Limit(warming, 1.5°C) → RequiresAction(immediate)] Immediate action is required to limit warming to 1.5°C target`;
    } else if (prompt.includes('quantum')) {
      content = `[OBSERVATION:quantum_state|∃x(Quantum(x) ∧ Superposition(x))] Quantum particles exist in superposition until measured
[ANALYSIS:wave_function|WaveFunction(ψ) → ProbabilityAmplitude(states)] The wave function describes probability amplitudes for different states
[INFERENCE:measurement_effect|Measure(ψ) → Collapse(ψ, definite_state)] Measurement causes wave function collapse to definite state
[HYPOTHESIS:many_worlds|∀ψ(Measurement(ψ) → ∃w(World(w) ∧ Realizes(w, ψ)))] One interpretation suggests all possibilities occur in parallel universes
[DEDUCTION:computing_power|Superposition(qubits) → ProcessMultipleStates(simultaneous)] Therefore, quantum computers can process multiple states simultaneously
[SYNTHESIS:applications|QuantumAdvantage(problem) ↔ ExponentialSpeedup(problem)] This enables exponential speedup for certain computational problems`;
    } else if (prompt.includes('consciousness')) {
      content = `[OBSERVATION:neural_activity|Correlates(consciousness, IntegratedNeuralActivity)] Consciousness correlates with integrated neural activity patterns
[ANALYSIS:binding_problem|Distributed(processing) ∧ Unified(experience) → BindingProblem] The brain somehow binds distributed processing into unified experience
[HYPOTHESIS:emergence_theory|ComplexIntegration(information) → Emerges(consciousness)] Consciousness may emerge from complex information integration
[INFERENCE:subjective_nature|Subjective(experience) ∧ ¬Mechanistic(explanation)] Subjective experience remains difficult to explain mechanistically
[PREDICTION:future_understanding|AdvancedImaging(brain) → MayReveal(mechanisms)] Advanced brain imaging may reveal consciousness mechanisms
[SYNTHESIS:hard_problem|HardProblem(consciousness) → Unsolved] The "hard problem" of consciousness remains unsolved`;
    } else {
      // Generic reasoning pattern with logical forms
      content = `[OBSERVATION:initial_state|State(query, "${request.prompt}")] The query "${request.prompt}" requires careful analysis
[INFERENCE:key_factors|∃f(Factor(f) ∧ Relevant(f, query))] Several factors must be considered for a comprehensive response
[ANALYSIS:implications|Implications(query) ⊃ Scope(immediate)] The implications extend beyond the immediate question
[DEDUCTION:logical_outcome|AvailableInfo(x) → Conclude(patterns)] Based on available information, we can conclude certain patterns
[PREDICTION:future_trends|EstablishedTrajectory(t) → FutureDevelopment(follows, t)] Future developments will likely follow established trajectories
[SYNTHESIS:summary|∀v(Viewpoint(v) → Consider(v)) → BalancedPerspective] A balanced perspective considering multiple viewpoints is essential`;
    }
  }
  
  return {
    content,
    model: request.model,
    usage: {
      promptTokens: request.prompt.length / 4,
      completionTokens: content.length / 4,
      totalTokens: (request.prompt.length + content.length) / 4,
      cost: 0.001
    },
    latency: 100,
    metadata: { mock: true }
  };
}

/**
 * Example 1: Basic Query Processing
 * Demonstrates reasoning chain generation and confidence tracking
 */
async function example1_basicQueryProcessing() {
  console.log('\n=== Example 1: Basic Query Processing ===\n');
  
  // Create an agent with analytical capabilities
  const agentConfig: AgentConfig = {
    id: 'agent_analytical_001',
    name: 'Analytical Reasoner',
    description: 'Specialized in logical analysis and structured reasoning',
    initialCapabilities: [
      {
        id: 'analytical_reasoning',
        name: 'Analytical Reasoning',
        description: 'Step-by-step logical analysis',
        strength: 0.9,
        adaptationRate: 0.1,
        specializations: ['analytical', 'logical', 'systematic'],
        morphology: {
          structure: { type: 'hierarchical', depth: 3 },
          connections: new Map([['inference', 0.8], ['deduction', 0.9]]),
          emergentProperties: ['pattern_recognition'],
          adaptationHistory: []
        },
        lastUsed: new Date(),
        performanceHistory: []
      }
    ],
    config: {
      agents: { 
        adaptationRate: 0.1,
        minAgents: 3,
        maxAgents: 15,
        baseCapabilities: ['reasoning', 'analysis'],
        evolutionEnabled: true
      },
      htm: { 
        columnCount: 2048, 
        cellsPerColumn: 16,
        learningRadius: 1024,
        learningRate: 0.1,
        maxSequenceLength: 1000
      },
      bayesian: { 
        uncertaintyThreshold: 0.3,
        priorStrength: 0.1,
        updatePolicy: 'adaptive',
        conflictResolution: 'argumentation'
      }
    }
  };
  
  const agent = new Agent(agentConfig);
  
  // Process a query about climate change
  const query = "What are the primary feedback loops in climate change?";
  console.log(`Query: "${query}"\n`);
  
  const message = await agent.processQuery(query, { domain: 'climate_science' }, mockLLMInterface);
  
  // Display comprehensive reasoning chain visualization
  displayReasoningChain(message);
  
  // Display HTM state visualization
  visualizeHTMState(message.metadata.htmState);
  
  // Display uncertainty analysis with visual bars
  displayUncertaintyAnalysis(message.metadata.uncertainty);
  
  // Display evidence graph
  visualizeEvidenceGraph(message.content.evidence);
  
  // Display semantic position
  visualizeSemanticPosition(message.content.semanticPosition);
  
  // Display temporal context
  visualizeTemporalContext(message.content.temporalContext);
}

/**
 * Example 2: Temporal Pattern Recognition
 * Shows HTM learning and sequence prediction
 */
async function example2_temporalPatterns() {
  console.log('\n\n=== Example 2: Temporal Pattern Recognition ===\n');
  
  const agent = new Agent({
    id: 'agent_temporal_002',
    name: 'Temporal Pattern Analyzer',
    description: 'Specialized in sequence learning and prediction',
    initialCapabilities: [
      {
        id: 'temporal_analysis',
        name: 'Temporal Analysis',
        description: 'Pattern recognition across time',
        strength: 0.85,
        adaptationRate: 0.15,
        specializations: ['temporal', 'predictive', 'pattern_recognition'],
        morphology: {
          structure: { type: 'recurrent', layers: 4 },
          connections: new Map([['prediction', 0.9], ['observation', 0.8]]),
          emergentProperties: ['sequence_learning'],
          adaptationHistory: []
        },
        lastUsed: new Date(),
        performanceHistory: []
      }
    ],
    config: {
      htm: { 
        columnCount: 2048, 
        cellsPerColumn: 16,
        maxSequenceLength: 100,
        learningRadius: 1024,
        learningRate: 0.1
      }
    }
  });
  
  // Process a sequence of related queries
  const queries = [
    "What causes market volatility?",
    "How do interest rates affect market volatility?",
    "Can we predict market volatility patterns?",
    "What indicators suggest increasing volatility?"
  ];
  
  console.log('Processing query sequence to learn temporal patterns...\n');
  
  const messages: Message[] = [];
  for (let i = 0; i < queries.length; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Query ${i + 1}: "${queries[i]}"`);
    const message = await agent.processQuery(queries[i], { sequence: i }, mockLLMInterface);
    messages.push(message);
    
    // Show HTM state visualization
    visualizeHTMState(message.metadata.htmState);
    
    // Show temporal context
    visualizeTemporalContext(message.content.temporalContext);
  }
  
  // Analyze pattern stability across the sequence
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    SEQUENCE LEARNING ANALYSIS                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  const lastMessage = messages[messages.length - 1];
  console.log(`   Final Pattern Stability: ${(lastMessage.content.temporalContext.stability * 100).toFixed(1)}%`);
  console.log(`   Patterns Learned: ${lastMessage.content.temporalContext.patternHistory.length}`);
  console.log(`   Sequence Evolution:`);
  
  // Show pattern evolution
  messages.forEach((msg, idx) => {
    const stability = msg.content.temporalContext.stability;
    const anomaly = msg.metadata.htmState.anomalyScore;
    const bar = '[' + '█'.repeat(Math.round(stability * 10)) + '░'.repeat(10 - Math.round(stability * 10)) + ']';
    console.log(`     Query ${idx + 1}: Stability ${bar} ${(stability * 100).toFixed(0)}% | Anomaly: ${(anomaly * 100).toFixed(0)}%`);
  });
}

/**
 * Example 3: Bayesian Belief Updates
 * Demonstrates evidence accumulation and belief revision
 */
async function example3_bayesianBeliefs() {
  console.log('\n\n=== Example 3: Bayesian Belief Updates ===\n');
  
  const agent = new Agent({
    id: 'agent_bayesian_003',
    name: 'Bayesian Reasoner',
    description: 'Updates beliefs based on evidence',
    initialCapabilities: [
      {
        id: 'bayesian_inference',
        name: 'Bayesian Inference',
        description: 'Probabilistic reasoning with evidence',
        strength: 0.88,
        adaptationRate: 0.12,
        specializations: ['probabilistic', 'evidence_based', 'analytical'],
        morphology: {
          structure: { type: 'network', nodes: 20 },
          connections: new Map([['hypothesis', 0.85], ['observation', 0.9]]),
          emergentProperties: ['belief_revision'],
          adaptationHistory: []
        },
        lastUsed: new Date(),
        performanceHistory: []
      }
    ],
    config: {
      bayesian: {
        priorStrength: 0.1,
        updatePolicy: 'adaptive',
        conflictResolution: 'argumentation',
        uncertaintyThreshold: 0.3
      }
    }
  });
  
  // Process queries that build upon each other
  console.log('Scenario: Investigating a hypothesis with accumulating evidence\n');
  
  const evidenceQueries = [
    { query: "Initial observations suggest quantum effects in biological systems", context: { evidence_type: 'preliminary' } },
    { query: "New experiments show quantum coherence in photosynthesis", context: { evidence_type: 'experimental' } },
    { query: "Theoretical models support quantum biology mechanisms", context: { evidence_type: 'theoretical' } },
    { query: "Counter-evidence shows classical explanations may suffice", context: { evidence_type: 'contradictory' } }
  ];
  
  let previousBelief: any = null;
  const beliefEvolution: Array<{query: string, nodes: number, edges: number}> = [];
  
  for (let i = 0; i < evidenceQueries.length; i++) {
    const { query, context } = evidenceQueries[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Evidence ${i + 1}: "${query}"`);
    
    const message = await agent.processQuery(query, context, mockLLMInterface);
    
    // Show evidence visualization
    visualizeEvidenceGraph(message.content.evidence);
    
    // Show belief network evolution
    const belief = message.metadata.bayesianBelief;
    beliefEvolution.push({
      query: query.substring(0, 40) + '...',
      nodes: belief.network.nodes.length,
      edges: belief.network.edges.length
    });
    
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                      BAYESIAN BELIEF UPDATE                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
    
    // Visualize belief changes
    if (previousBelief && belief.beliefs.size > 0) {
      console.log('   Belief Changes:');
      let significantChanges = 0;
      
      belief.beliefs.forEach((dist, variable) => {
        if (previousBelief.beliefs.has(variable)) {
          const prevDist = previousBelief.beliefs.get(variable);
          const currentProb = dist.states.get('true') || 0;
          const previousProb = prevDist?.states.get('true') || 0.5;
          const change = currentProb - previousProb;
          
          if (Math.abs(change) > 0.05) {
            significantChanges++;
            const changeBar = createBeliefChangeBar(previousProb, currentProb);
            const changeSign = change > 0 ? '+' : '';
            console.log(`   • ${variable}:`);
            console.log(`     ${changeBar}`);
            console.log(`     ${(previousProb * 100).toFixed(0)}% → ${(currentProb * 100).toFixed(0)}% (${changeSign}${(change * 100).toFixed(0)}%)`);
          }
        }
      });
      
      if (significantChanges === 0) {
        console.log('   • No significant belief changes (threshold: 5%)');
      }
    } else {
      console.log('   Initial belief state established');
    }
    
    console.log(`\n   Network Growth:`);
    console.log(`   • Nodes: ${belief.network.nodes.length}`);
    console.log(`   • Edges: ${belief.network.edges.length}`);
    console.log(`   • Entropy: ${calculateNetworkEntropy(belief).toFixed(2)} bits`);
    
    previousBelief = belief;
  }
  
  // Show belief evolution summary
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    BELIEF NETWORK EVOLUTION                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  beliefEvolution.forEach((step, idx) => {
    const nodeBar = '[' + '█'.repeat(Math.min(step.nodes, 20)) + '░'.repeat(Math.max(0, 20 - step.nodes)) + ']';
    console.log(`   ${idx + 1}. ${step.query}`);
    console.log(`      Nodes: ${nodeBar} ${step.nodes} | Edges: ${step.edges}`);
  });
}

// Helper function for belief change visualization
function createBeliefChangeBar(from: number, to: number): string {
  const width = 40;
  const fromPos = Math.round(from * width);
  const toPos = Math.round(to * width);
  
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i === fromPos && i === toPos) {
      bar += '●';
    } else if (i === fromPos) {
      bar += '○';
    } else if (i === toPos) {
      bar += '●';
    } else if ((fromPos < toPos && i > fromPos && i < toPos) || 
               (fromPos > toPos && i < fromPos && i > toPos)) {
      bar += '─';
    } else {
      bar += '·';
    }
  }
  
  return '[' + bar + ']';
}

// Helper function to calculate network entropy
function calculateNetworkEntropy(belief: BayesianBelief): number {
  let totalEntropy = 0;
  let count = 0;
  
  belief.beliefs.forEach((dist: BeliefDistribution) => {
    totalEntropy += dist.entropy || 0;
    count++;
  });
  
  return count > 0 ? totalEntropy / count : 0;
}

/**
 * Example 4: Adaptive Capabilities
 * Shows performance-based adaptation
 */
async function example4_adaptation() {
  console.log('\n\n=== Example 4: Adaptive Capabilities ===\n');
  
  const agent = new Agent({
    id: 'agent_adaptive_004',
    name: 'Adaptive Agent',
    description: 'Self-modifying based on performance',
    initialCapabilities: [
      {
        id: 'general_reasoning',
        name: 'General Reasoning',
        description: 'Broad reasoning capabilities',
        strength: 0.6, // Start with moderate strength
        adaptationRate: 0.2, // Higher adaptation rate
        specializations: ['general', 'flexible'],
        morphology: {
          structure: { type: 'modular', modules: 5 },
          connections: new Map(),
          emergentProperties: [],
          adaptationHistory: []
        },
        lastUsed: new Date(),
        performanceHistory: []
      }
    ],
    config: {
      agents: { 
        adaptationRate: 0.2,
        evolutionEnabled: true,
        minAgents: 3,
        maxAgents: 15,
        baseCapabilities: ['reasoning', 'analysis']
      }
    }
  });
  
  console.log('Simulating performance degradation and adaptation...\n');
  
  // Simulate queries with varying difficulty
  const testQueries = [
    { query: "Simple addition: 2 + 2", difficulty: 0.1 },
    { query: "Complex physics: Explain quantum field theory", difficulty: 0.9 },
    { query: "Abstract reasoning: What is consciousness?", difficulty: 0.95 },
    { query: "Pattern recognition: Find the next number: 1, 1, 2, 3, 5, ?", difficulty: 0.4 },
    { query: "Creative task: Write a haiku about AI", difficulty: 0.7 }
  ];
  
  console.log('Initial Capability Strength:', agent.getCapabilities()[0].strength.toFixed(2));
  
  for (let i = 0; i < testQueries.length; i++) {
    const { query, difficulty } = testQueries[i];
    console.log(`\n--- Query ${i + 1} (Difficulty: ${difficulty}) ---`);
    console.log(`"${query}"`);
    
    const message = await agent.processQuery(query, { difficulty }, mockLLMInterface);
    
    // Show performance metrics
    const performance = agent.getPerformanceHistory().slice(-1)[0];
    if (performance) {
      console.log('\nPerformance Metrics:');
      console.log(`- Quality: ${(performance.quality * 100).toFixed(1)}%`);
      console.log(`- Efficiency: ${(performance.efficiency * 100).toFixed(1)}%`);
      console.log(`- Adaptability: ${(performance.adaptability * 100).toFixed(1)}%`);
    }
    
    // Check for morphology changes
    const morphologyHistory = agent.getCapabilities()[0].morphology.adaptationHistory;
    if (morphologyHistory.length > 0) {
      const lastChange = morphologyHistory[morphologyHistory.length - 1];
      console.log('\n🔄 ADAPTATION TRIGGERED!');
      console.log(`- Change Type: ${lastChange.changeType}`);
      console.log(`- Trigger: ${lastChange.trigger}`);
      console.log(`- New Structure:`, JSON.stringify(lastChange.after).substring(0, 100) + '...');
    }
  }
  
  console.log('\n\nFinal Capability Analysis:');
  const finalCapability = agent.getCapabilities()[0];
  console.log(`- Strength: ${finalCapability.strength.toFixed(2)}`);
  console.log(`- Emergent Properties: ${finalCapability.morphology.emergentProperties.join(', ') || 'none'}`);
  console.log(`- Adaptation Count: ${finalCapability.morphology.adaptationHistory.length}`);
}

/**
 * Example 5: Complex Multi-Step Reasoning
 * Demonstrates sophisticated reasoning with multiple evidence sources
 */
async function example5_complexReasoning() {
  console.log('\n\n=== Example 5: Complex Multi-Step Reasoning ===\n');
  
  const agent = new Agent({
    id: 'agent_complex_005',
    name: 'Complex Reasoner',
    description: 'Handles sophisticated multi-step inference',
    initialCapabilities: [
      {
        id: 'deep_analysis',
        name: 'Deep Analysis',
        description: 'Complex reasoning with multiple perspectives',
        strength: 0.92,
        adaptationRate: 0.08,
        specializations: ['analytical', 'synthesis', 'critical_thinking', 'hypothesis_generation'],
        morphology: {
          structure: { 
            type: 'hierarchical_network',
            layers: 5,
            crossConnections: true
          },
          connections: new Map([
            ['observation', 0.9],
            ['inference', 0.85],
            ['deduction', 0.88],
            ['synthesis', 0.82]
          ]),
          emergentProperties: ['meta_reasoning', 'self_critique'],
          adaptationHistory: []
        },
        lastUsed: new Date(),
        performanceHistory: []
      }
    ],
    config: {
      bayesian: { 
        conflictResolution: 'argumentation',
        priorStrength: 0.1,
        updatePolicy: 'adaptive',
        uncertaintyThreshold: 0.3
      },
      htm: { 
        columnCount: 4096, // Larger for complex patterns
        cellsPerColumn: 16,
        learningRadius: 2048,
        learningRate: 0.1,
        maxSequenceLength: 1000
      }
    }
  });
  
  const complexQuery = "How might artificial general intelligence emerge from current machine learning approaches, and what are the philosophical implications?";
  
  console.log(`Complex Query: "${complexQuery}"\n`);
  console.log('Processing with deep reasoning...\n');
  
  const message = await agent.processQuery(complexQuery, { 
    depth: 'deep',
    perspectives: ['technical', 'philosophical', 'societal']
  }, mockLLMInterface);
  
  // Display full reasoning chain with graph
  displayReasoningChain(message);
  
  // Visualize reasoning structure as a graph
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    REASONING GRAPH STRUCTURE                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  const reasoning = message.content.reasoning;
  const steps = reasoning.steps;
  
  // Create dependency graph
  console.log('   Dependency Graph:');
  steps.forEach((step, idx) => {
    const depth = step.supporting.length;
    const indent = '   ' + '  '.repeat(depth);
    const typeIcon = getStepIcon(step.type);
    
    console.log(`${indent}${typeIcon} ${idx + 1}. [${step.type}] ${step.concept}`);
    
    if (step.supporting.length > 0) {
      const supportingNums = step.supporting
        .map(id => steps.findIndex(s => s.id === id) + 1)
        .filter(n => n > 0);
      console.log(`${indent}   └─ relies on: ${supportingNums.join(', ')}`);
    }
    
    if (step.refuting.length > 0) {
      const refutingNums = step.refuting
        .map(id => steps.findIndex(s => s.id === id) + 1)
        .filter(n => n > 0);
      console.log(`${indent}   ⚡ conflicts: ${refutingNums.join(', ')}`);
    }
  });
  
  // Show semantic space navigation
  visualizeSemanticPosition(message.content.semanticPosition);
  
  // Evidence analysis with visual coherence metric
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                      EVIDENCE COHERENCE ANALYSIS                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  const evidence = message.content.evidence;
  let corroborating = 0;
  let conflicting = 0;
  
  evidence.forEach(ev => {
    corroborating += ev.metadata.corroboration.length;
    conflicting += ev.metadata.conflicts.length;
  });
  
  const coherence = (corroborating - conflicting) / (corroborating + conflicting + 1);
  const coherenceBar = createCoherenceBar(coherence);
  
  console.log(`   Evidence Network:`);
  console.log(`   • Total Pieces: ${evidence.length}`);
  console.log(`   • Corroborations: ${corroborating} connections`);
  console.log(`   • Conflicts: ${conflicting} tensions`);
  console.log(`   • Coherence Score: ${coherenceBar} ${(coherence * 100).toFixed(1)}%`);
  
  // Visualize evidence relationships
  visualizeEvidenceGraph(evidence);
  
  // Show synthesis with confidence gradients
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                         SYNTHESIS & CONCLUSIONS                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  const conclusions = steps.filter(s => s.type === 'synthesis' || s.type === 'deduction');
  conclusions.forEach((conclusion, idx) => {
    const confBar = createGradientConfidenceBar(conclusion.confidence);
    console.log(`   ${idx + 1}. ${conclusion.content}`);
    console.log(`      Confidence: ${confBar}`);
    console.log(`      Range: ${(conclusion.confidence.lower * 100).toFixed(0)}% - ${(conclusion.confidence.upper * 100).toFixed(0)}% (μ=${(conclusion.confidence.mean * 100).toFixed(0)}%)\n`);
  });
}

// Helper functions for visualization
function getStepIcon(type: string): string {
  const icons: Record<string, string> = {
    'observation': '👁️',
    'inference': '💭',
    'deduction': '⟹',
    'synthesis': '⊕',
    'analogy': '≈',
    'prediction': '🔮'
  };
  return icons[type] || '•';
}

function createCoherenceBar(coherence: number): string {
  const width = 30;
  const normalizedCoherence = (coherence + 1) / 2; // Convert from [-1, 1] to [0, 1]
  const filled = Math.round(normalizedCoherence * width);
  
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i < filled) {
      if (normalizedCoherence > 0.8) bar += '█';
      else if (normalizedCoherence > 0.6) bar += '▓';
      else if (normalizedCoherence > 0.4) bar += '▒';
      else bar += '░';
    } else {
      bar += '·';
    }
  }
  
  return '[' + bar + ']';
}

function createGradientConfidenceBar(conf: {mean: number, lower: number, upper: number}): string {
  const width = 40;
  const lowerPos = Math.round(conf.lower * width);
  const meanPos = Math.round(conf.mean * width);
  const upperPos = Math.round(conf.upper * width);
  
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i >= lowerPos && i <= upperPos) {
      if (i === meanPos) bar += '█';
      else if (i >= meanPos - 1 && i <= meanPos + 1) bar += '▓';
      else bar += '░';
    } else {
      bar += '·';
    }
  }
  
  return '[' + bar + ']';
}

/**
 * Utility: Display agent statistics
 */
function displayAgentStats(agent: Agent) {
  console.log('\n📊 Agent Statistics:');
  console.log(`- ID: ${agent.getId()}`);
  console.log(`- Name: ${agent.getName()}`);
  console.log(`- Capabilities: ${agent.getCapabilities().map(c => c.name).join(', ')}`);
  
  const performance = agent.getPerformanceHistory();
  if (performance.length > 0) {
    const avgQuality = performance.reduce((sum, p) => sum + p.quality, 0) / performance.length;
    console.log(`- Average Quality: ${(avgQuality * 100).toFixed(1)}%`);
    console.log(`- Total Queries: ${performance.length}`);
  }
}

/**
 * Main demo runner
 */
async function runAgentDemo() {
  console.log('🤖 Advanced Agent Capabilities Demo\n');
  console.log('This demo showcases:');
  console.log('- Structured reasoning chains with confidence tracking');
  console.log('- HTM temporal pattern learning');
  console.log('- Bayesian belief updates');
  console.log('- Adaptive morphology');
  console.log('- Complex multi-step inference\n');
  
  try {
    // Run examples sequentially
    await example1_basicQueryProcessing();
    await example2_temporalPatterns();
    await example3_bayesianBeliefs();
    await example4_adaptation();
    await example5_complexReasoning();
    
    console.log('\n\n✅ Demo completed successfully!');
    console.log('\nKey Takeaways:');
    console.log('1. Agents use structured [TYPE:CONCEPT] reasoning format');
    console.log('2. HTM provides temporal pattern recognition and predictions');
    console.log('3. Bayesian networks track belief evolution with evidence');
    console.log('4. Agents adapt their morphology based on performance');
    console.log('5. Complex reasoning involves evidence correlation and semantic navigation');
    
  } catch (error) {
    console.error('\n❌ Demo error:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
  }
}

// Export for use in other demos
export {
  mockLLMInterface,
  displayAgentStats,
  runAgentDemo
};

// Run if executed directly
// Note: Direct execution detection doesn't work well with TypeScript ES modules
// To run: npm run build && node dist/core/agent-demo.js
// Alternatively, uncomment the line below to always run when imported
// runAgentDemo();
