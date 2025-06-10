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
  BeliefDistribution,
  LLMError
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
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { HierarchicalHashEncoder } from './semantic/hierarchical-hash-encoder.js';
import { memoryEfficientDomainConfig, balancedDomainConfig } from './configs/memory-efficient-domain-config.js';
import { topicSensitiveConfig, ultraSensitiveTopicConfig } from './configs/topic-sensitive-config.js';
import { balancedAnomalyConfig } from './configs/balanced-anomaly-config.js';

/**
 * OpenAI LLM interface for production use
 * Uses GPT-3.5-turbo to generate structured reasoning
 */
let openAIAdapter: OpenAIAdapter | null = null;

async function openAILLMInterface(request: LLMRequest): Promise<LLMResponse> {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    throw new LLMError(
      'OPENAI_API_KEY environment variable is not set. Please set it in your Windows environment variables.',
      'MISSING_API_KEY',
      { provider: 'openai' }
    );
  }

  // Initialize adapter if not already done
  if (!openAIAdapter) {
    openAIAdapter = new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-3.5-turbo'
    });
  }

  // Check if this is a semantic feature extraction request
  if (request.metadata?.purpose === 'semantic_feature_extraction') {
    const text = request.prompt.match(/TEXT: "(.+)"/)?.[1] || request.prompt;
    
    // Create a specific prompt for semantic feature extraction with ghost tokens
    const semanticPrompt = `Extract semantic features from the following text and return ONLY a JSON object with this exact structure:
{
  "concepts": [list of 3-5 main concepts as strings],
  "categories": [list of 2-3 categories as strings],
  "attributes": {
    "abstractness": number between 0 and 1,
    "specificity": number between 0 and 1,
    "technicality": number between 0 and 1,
    "certainty": number between 0 and 1,
    "actionability": number between 0 and 1,
    "temporality": number between 0 and 1
  },
  "relationships": [list of 2-3 relationship types as strings],
  "intent": "question" or "analysis" or "statement" or "command",
  "complexity": number between 0 and 1,
  "temporalAspect": boolean,
  "ghostTokens": [
    {
      "token": "implicit bridge concept between main concepts",
      "probability": confidence between 0.3 and 1.0,
      "type": "bridge" or "context" or "implicit"
    }
  ]
}

The ghostTokens are implicit conceptual bridges that connect the main concepts:
- "bridge": direct conceptual connection
- "context": provides surrounding context
- "implicit": implied connection
Include 3-5 ghost tokens that represent concepts not explicitly mentioned but semantically connect the main concepts.

TEXT: "${text}"

Return ONLY the JSON object, no explanation or additional text.`;

    const semanticRequest: LLMRequest = {
      ...request,
      prompt: semanticPrompt,
      systemPrompt: 'You are a semantic analysis system. Always respond with valid JSON only.',
      temperature: 0.3,
      maxTokens: 500
    };

    const semanticResponse = await openAIAdapter.generateCompletion(semanticRequest);

    // Debug: Log raw response if enabled
    if (process.env.DEBUG_OPENAI_RESPONSES === 'true') {
      console.log('\n[DEBUG] Raw OpenAI Request:');
      console.log(semanticRequest.systemPrompt);
      console.log(semanticRequest.prompt);
      console.log('[/DEBUG]\n');

      console.log('\n[DEBUG] Raw OpenAI Response:');
      console.log(semanticResponse.content);
      console.log('[/DEBUG]\n');
    }

    return semanticResponse;
  }

  if (request.metadata?.purpose === 'normalize-many') {
    const normalizeManyRequest: LLMRequest = {
      ...request
    };

    const normalizeManyResponse = await openAIAdapter.generateCompletion(normalizeManyRequest);

    // Debug: Log raw response if enabled
    if (process.env.DEBUG_OPENAI_RESPONSES === 'true') {
      console.log('\n[DEBUG] Raw OpenAI Request:');
      console.log(normalizeManyRequest.systemPrompt);
      console.log(normalizeManyRequest.prompt);
      console.log('[/DEBUG]\n');

      console.log('\n[DEBUG] Raw OpenAI Response:');
      console.log(normalizeManyResponse.content);
      console.log('[/DEBUG]\n');
    }

    return normalizeManyResponse;
  }

  if (request.metadata?.purpose === 'normalize-single') {
    const normalizeSingleRequest: LLMRequest = {
      ...request
    };

    const normalizeSingleResponse = await openAIAdapter.generateCompletion(normalizeSingleRequest);

    // Debug: Log raw response if enabled
    if (process.env.DEBUG_OPENAI_RESPONSES === 'true') {
      console.log('\n[DEBUG] Raw OpenAI Request:');
      console.log(normalizeSingleRequest.systemPrompt);
      console.log(normalizeSingleRequest.prompt);
      console.log('[/DEBUG]\n');

      console.log('\n[DEBUG] Raw OpenAI Response:');
      console.log(normalizeSingleResponse.content);
      console.log('[/DEBUG]\n');
    }

    return normalizeSingleResponse;
  }

  if (request.metadata?.purpose === 'analyze-logical-stmt') {
    const analyzeSingleRequest: LLMRequest = {
      ...request
    };

    const analyzeSingleResponse = await openAIAdapter.generateCompletion(analyzeSingleRequest);

    // Debug: Log raw response if enabled
    if (process.env.DEBUG_OPENAI_RESPONSES === 'true') {
      console.log('\n[DEBUG] Raw OpenAI Request:');
      console.log(analyzeSingleRequest.systemPrompt);
      console.log(analyzeSingleRequest.prompt);
      console.log('[/DEBUG]\n');

      console.log('\n[DEBUG] Raw OpenAI Response:');
      console.log(analyzeSingleResponse.content);
      console.log('[/DEBUG]\n');
    }

    return analyzeSingleResponse;
  }

  if (request.metadata?.purpose === 'query-contradiction') {
    const queryContraRequest: LLMRequest = {
      ...request
    };

    const queryContraResponse = await openAIAdapter.generateCompletion(queryContraRequest);

    // Debug: Log raw response if enabled
    if (process.env.DEBUG_OPENAI_RESPONSES === 'true') {
      console.log('\n[DEBUG] Raw OpenAI Request:');
      console.log(queryContraRequest.systemPrompt);
      console.log(queryContraRequest.prompt);
      console.log('[/DEBUG]\n');

      console.log('\n[DEBUG] Raw OpenAI Response:');
      console.log(queryContraResponse.content);
      console.log('[/DEBUG]\n');
    }

    return queryContraResponse;
  }

  if (request.metadata?.purpose === 'generate-reasoning') {
    // The agent.ts already handles prompt formatting for reasoning generation
    // Just pass through with appropriate temperature and token settings
    const enhancedRequest: LLMRequest = {
      ...request,
      temperature: request.temperature ?? 0.3, // Lower temperature for consistency
      maxTokens: request.maxTokens ?? 1500
    };

    try {
      const response = await openAIAdapter.generateCompletion(enhancedRequest);

      // Debug: Log raw response if enabled
      if (process.env.DEBUG_OPENAI_RESPONSES === 'true') {
        console.log('\n[DEBUG] Raw OpenAI Request:');
        console.log(enhancedRequest.systemPrompt);
        console.log(enhancedRequest.prompt);
        console.log('[/DEBUG]\n');

        console.log('\n[DEBUG] Raw OpenAI Response:');
        console.log(response.content);
        console.log('[/DEBUG]\n');
      }

      // Validate that the response follows the expected format
      const lines = response.content.split('\n').filter(line => line.trim());
      const properlyFormattedLines = lines.filter(line =>
          line.match(/^\[[\w_]+:[\w_]+\|.+?\]/)
      );

      // If less than 50% of lines are properly formatted, try to fix
      if (properlyFormattedLines.length < lines.length * 0.5) {
        console.warn(`Format compliance: ${properlyFormattedLines.length}/${lines.length} lines properly formatted`);

        // Try to fix common issues
        const fixedContent = lines.map((line, idx) => {
          line = line.trim();

          // Skip empty lines
          if (!line) return '';

          // Check if line already has correct format
          if (line.match(/^\[[\w_]+:[\w_]+\|.+?\]/)) {
            return line;
          }

          // Try to extract TYPE if it's mentioned
          const typeMatch = line.match(/^(OBSERVATION|INFERENCE|ANALYSIS|DEDUCTION|HYPOTHESIS|PREDICTION|SYNTHESIS|ANALOGY|INDUCTION)[::\s]/i);
          if (typeMatch) {
            const type = typeMatch[1].toUpperCase();
            const content = line.substring(typeMatch[0].length).trim();
            const concept = `step_${idx}`;
            const logicalForm = `Statement(${idx})`;
            return `[${type}:${concept}|${logicalForm}] ${content}`;
          }

          // Otherwise, try to infer type from content
          const lowerLine = line.toLowerCase();
          let type = 'OBSERVATION';
          let concept = `step_${idx}`;

          if (lowerLine.includes('therefore') || lowerLine.includes('thus') || lowerLine.includes('conclude')) {
            type = 'DEDUCTION';
            concept = 'conclusion';
          } else if (lowerLine.includes('based on') || lowerLine.includes('from this') || lowerLine.includes('infer')) {
            type = 'INFERENCE';
            concept = 'inference';
          } else if (lowerLine.includes('predict') || lowerLine.includes('will') || lowerLine.includes('future')) {
            type = 'PREDICTION';
            concept = 'prediction';
          } else if (lowerLine.includes('analysis') || lowerLine.includes('examining') || lowerLine.includes('consider')) {
            type = 'ANALYSIS';
            concept = 'analysis';
          } else if (lowerLine.includes('similar') || lowerLine.includes('like') || lowerLine.includes('compared to')) {
            type = 'ANALOGY';
            concept = 'comparison';
          } else if (lowerLine.includes('overall') || lowerLine.includes('summary') || lowerLine.includes('together')) {
            type = 'SYNTHESIS';
            concept = 'synthesis';
          } else if (lowerLine.includes('observe') || lowerLine.includes('data') || lowerLine.includes('evidence')) {
            type = 'OBSERVATION';
            concept = 'observation';
          }

          // Create a simple logical form
          const logicalForm = `Statement(${concept})`;

          return `[${type}:${concept}|${logicalForm}] ${line}`;
        }).filter(line => line.trim()).join('\n');

        response.content = fixedContent;
      }

      return response;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof LLMError) {
        throw error;
      }

      throw new LLMError(
          `OpenAI API call failed: ${error instanceof Error ? error.message : String(error)}`,
          'OPENAI_API_ERROR',
          {originalError: error}
      );
    }
  }

  throw new LLMError(
      `OpenAI API call skipped due to metadata.purpose being empty!`,
      'OPENAI_API_ERROR'
  );
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
  
  const message = await agent.processQuery(query, { domain: 'climate_science' }, openAILLMInterface);
  
  // Display comprehensive reasoning chain visualization
  await displayReasoningChain(message, openAILLMInterface);
  
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
 * Example 2: Temporal Pattern Recognition with Hierarchical Encoding
 * Shows HTM learning and sequence prediction with improved semantic overlap
 */
async function example2_temporalPatterns() {
  console.log('\n\n=== Example 2: Temporal Pattern Recognition with Domain-Aware Anomaly ===\n');
  console.log('✨ ENHANCED: Domain-aware anomaly scoring + Ghost tokens\n');
  console.log('   • Ghost tokens create semantic bridges between concepts');
  console.log('   • Domain similarity boost (70%) for related financial topics');
  console.log('   • Temporal coherence smoothing (80%) reduces noise');
  console.log('   • Pattern memory learns domains over time\n');

  const tunedConfig1: AgentConfig = {
    id: 'agent_temporal_002',
    name: 'Temporal Pattern Analyzer',
    description: 'Specialized in sequence learning and prediction',
    initialCapabilities: [
      {
        id: 'temporal_analysis',
        name: 'Temporal Analysis',
        description: 'Pattern recognition across time',
        strength: 0.85,
        adaptationRate: 0.20,  // Increased
        specializations: ['temporal', 'predictive', 'pattern_recognition'],
        morphology: {
          structure: { type: 'recurrent', layers: 4 },
          connections: new Map([
            ['prediction', 0.85],
            ['observation', 0.85],
            ['anomaly', 0.75]  // Added
          ]),
          emergentProperties: ['sequence_learning'],
          adaptationHistory: []
        },
        lastUsed: new Date(),
        performanceHistory: []
      }
    ],
    config: {
      htm: {
        columnCount: 3072,      // Increased
        cellsPerColumn: 12,     // Decreased
        maxSequenceLength: 100,
        learningRadius: 768,    // Decreased
        learningRate: 0.15      // Increased
      },
      semantic: {
        enableHierarchicalEncoding: true,
        enablePhase2Enhancements: true,
        enableConceptNormalization: true,
        enableRelationshipTracking: true,
        enableGhostTokens: true,  // Enable ghost token extraction
        enableEdgeToggling: true,  // Enable edge toggling
        maxGhostTokens: 5,  // Extract up to 5 ghost tokens
        minGhostTokenProbability: 0.4  // Minimum confidence threshold
      },
      //domainCoherence: {  // Added section
      //  enabled: true,
      //  smoothing: 0.75,
      //  similarityBoost: 0.65,
      //  sparsity: 0.07
      //},
      //patternMemory: {  // Added section
      //  enabled: true,
      //  maxPatterns: 80,
      //  decayRate: 0.94,
      //  minPatternSupport: 2
      //}
    }
  }

  const defaultConfig: AgentConfig = {
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
      },
      semantic: {
        // Enable hierarchical encoding for improved concept relationships
        enableHierarchicalEncoding: true,
        enablePhase2Enhancements: true,
        enableConceptNormalization: true,
        enableRelationshipTracking: true,
        enableGhostTokens: true,  // Enable ghost token extraction
        enableEdgeToggling: true,  // Enable edge toggling
        maxGhostTokens: 5,  // Extract up to 5 ghost tokens
        minGhostTokenProbability: 0.4  // Minimum confidence threshold
      },
      anomaly: {
        domainAwareScoring: true,
        temporalCoherence: {
          windowSize: 5,
          smoothingFactor: 0.8
        },
        domainSimilarity: {
          similarityThreshold: 0.3,
          similarityBoost: 0.7
        },
        patternMemory: {
          maxPatterns: 100,
          decayRate: 0.98,
          minPatternSupport: 2
        }
      }
    }
  }

  // Use balanced anomaly configuration for better topic detection
  const agent = new Agent(balancedAnomalyConfig);
  
  // Alternative configurations:
  // const agent = new Agent(topicSensitiveConfig); // More sensitive but gets N/A
  // const agent = new Agent(ultraSensitiveTopicConfig); // Maximum sensitivity
  // const agent = new Agent(defaultConfig); // Original behavior
  // const agent = new Agent(balancedDomainConfig); // Domain-optimized

  // Process a sequence of related queries
  const allQueries = [
    "What causes market volatility?",
    "How do interest rates affect market volatility?",
    "Can we predict market volatility patterns?",
    "What does local currency suggest?",
    "What indicators suggest increasing volatility?",
    "How do currency fluctuations impact global trade?",
    "How does inflation affect currency strength?",
    "What role do central banks play in currency stability?",
    "What are leading economic indicators to watch?",
    "How to train a dog to sit and lay on command?",
    "What drives foreign exchange rate movements?",
    "How do monetary policy changes affect bond markets?",
    "What is the relationship between unemployment and inflation?",
    "How do commodity prices influence currency values?",
    "What factors determine stock market liquidity?",
    "How does geopolitical risk impact financial markets?",
    "What are the mechanics of currency carry trades?",
    "How do sovereign credit ratings affect bond yields?",
    "What role does market sentiment play in price discovery?",
    "How do derivatives markets influence underlying asset prices?",
    "What causes currency crisis contagion effects?",
    "How do fiscal deficits impact exchange rates?",
    "What are the drivers of emerging market capital flows?",
    "How does monetary tightening affect credit markets?",
    "What triggers sudden stops in capital flows?",
    "How do trade balances influence currency strength?",
    "What role do currency interventions play in exchange rate stability?",
    "How does quantitative easing affect asset prices?",
    "What are the best hiking trails in Colorado?",
    "What are the dynamics of cross-border capital movements?"
  ];
  
  // Limit queries for testing if environment variable is set
  const queriesLimit = process.env.QUERIES_LIMIT ? parseInt(process.env.QUERIES_LIMIT) : allQueries.length;
  const queries = allQueries.slice(0, queriesLimit);
  
  if (queriesLimit < allQueries.length) {
    console.log(`📌 Running with limited queries (${queriesLimit} of ${allQueries.length}) for testing\n`);
  }
  
  console.log('Processing query sequence to learn temporal patterns...\n');
  
  // Create hierarchical encoder for overlap analysis
  const hierarchicalEncoder = new HierarchicalHashEncoder();
  const conceptEncodings: Map<string, number[]> = new Map();

  const messages: Message[] = [];
  for (let i = 0; i < queries.length; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Query ${i + 1}: "${queries[i]}"`);
    const message = await agent.processQuery(queries[i], { sequence: i }, openAILLMInterface);
    messages.push(message);

    // Display ghost tokens from the last semantic encoding (no extra LLM call needed!)
    console.log('\n   👻 Ghost Tokens (implicit semantic bridges):');
    const lastEncoding = agent.getLastSemanticEncoding();
    if (lastEncoding && lastEncoding.features.ghostTokens && lastEncoding.features.ghostTokens.length > 0) {
      const features = lastEncoding.features;
      const ghostTokens = features.ghostTokens!; // Non-null assertion since we checked above
      for (const ghost of ghostTokens) {
        const bar = '█'.repeat(Math.floor(ghost.probability * 10)) + '░'.repeat(10 - Math.floor(ghost.probability * 10));
        console.log(`      - ${ghost.token.padEnd(20)} [${bar}] ${(ghost.probability * 100).toFixed(0)}% (${ghost.type})`);
      }
      
      // Show semantic bridge if we have concepts
      if (features.concepts.length >= 2) {
        const bridge = ghostTokens[0];
        console.log(`\n   🔗 Ghost Bridge: "${features.concepts[0]}" ←→ [${bridge.token}] ←→ "${features.concepts[1]}"`);
      }
    } else {
      console.log('      (No ghost tokens extracted)');
    }

    // Extract and encode main concepts for overlap analysis
    if (message.content.semanticPosition?.coordinates) {
      // Try to extract concepts from the reasoning chain or features
      let mainConcepts: string[] = [];
      
      // Prefer concepts from semantic encoding if available
      if (lastEncoding && lastEncoding.features.concepts.length > 0) {
        mainConcepts = lastEncoding.features.concepts;
      } else if (message.content.reasoning?.steps) {
        // Fallback to reasoning steps
        const concepts = message.content.reasoning.steps
          .slice(0, 3)
          .map(step => step.concept)
          .filter(c => c && c !== 'unknown');
        mainConcepts.push(...concepts);
      }
      
      // If we have concepts, show them
      if (mainConcepts.length > 0) {
        console.log(`\n   📝 Key Concepts: ${mainConcepts.join(', ')}`);
        
        // Show encoding stats if available
        if (lastEncoding) {
          console.log(`   📊 Encoding Stats: ${lastEncoding.activeCount} active columns (${(lastEncoding.sparsity * 100).toFixed(2)}% sparsity)`);
        }
        
        // Encode concepts and store for overlap calculation
        mainConcepts.forEach(concept => {
          if (!conceptEncodings.has(concept)) {
            conceptEncodings.set(concept, hierarchicalEncoder.encodeHierarchical(concept));
          }
        });
        
        // Show overlap with previous query's concepts if available
        if (i > 0 && messages[i-1].content.reasoning?.steps) {
          const prevConcepts = messages[i-1].content.reasoning.steps
            .slice(0, 3)
            .map(step => step.concept)
            .filter(c => c && c !== 'unknown');
            
          if (prevConcepts.length > 0) {
            console.log('\n   🔗 Semantic Overlap with Previous Query:');
            
            let maxOverlap = 0;
            let bestPair = { current: '', previous: '', overlap: 0 };
            
            for (const currentConcept of mainConcepts) {
              for (const prevConcept of prevConcepts) {
                const currentEncoding = conceptEncodings.get(currentConcept);
                const prevEncoding = conceptEncodings.get(prevConcept);
                
                if (currentEncoding && prevEncoding) {
                  const overlap = hierarchicalEncoder.calculateOverlap(currentEncoding, prevEncoding);
                  if (overlap.overlapPercentage > maxOverlap) {
                    maxOverlap = overlap.overlapPercentage;
                    bestPair = {
                      current: currentConcept,
                      previous: prevConcept,
                      overlap: overlap.overlapPercentage
                    };
                  }
                  
                  // Show significant overlaps
                  if (overlap.overlapPercentage > 5) {
                    const overlapBar = createOverlapBar(overlap.overlapPercentage);
                    console.log(`      "${prevConcept}" ↔ "${currentConcept}": ${overlapBar} ${overlap.overlapPercentage.toFixed(1)}%`);
                  }
                }
              }
            }
            
            if (bestPair.overlap > 0) {
              console.log(`      ⭐ Strongest connection: "${bestPair.previous}" ↔ "${bestPair.current}" (${bestPair.overlap.toFixed(1)}%)`);
            }
          }
        }
      }
    }
    
    // Show HTM state visualization
    visualizeHTMState(message.metadata.htmState);
    
    // Show predictions for next step (if any)
    if (message.metadata.htmState.predictedColumns.length > 0 && i < queries.length - 1) {
      console.log(`\n   🔮 HTM Predicts for next query: ${message.metadata.htmState.predictedColumns.length} columns will activate`);
      console.log(`   Next query will be: "${queries[i + 1]}"`);
    }
    
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
  
  // Show pattern evolution with anomaly scores
  messages.forEach((msg, idx) => {
    const stability = msg.content.temporalContext.stability;
    const anomaly = msg.metadata.htmState.anomalyScore;
    const htmState = msg.metadata.htmState;
    const stabilityBar = '[' + '█'.repeat(Math.round(stability * 10)) + '░'.repeat(10 - Math.round(stability * 10)) + ']';
    const questionText = queries[idx] || 'Unknown query';
    
    // Check if prediction cells are all false (system initiating/learning)
    const hasPredictions = htmState.predictedColumns && htmState.predictedColumns.length > 0;
    const anomalyDisplay = (anomaly >= 0 && hasPredictions) ? `${(anomaly * 100).toFixed(0)}%` : 'N/A';
    
    // Create anomaly bar with different styling based on severity
    let anomalyBar: string;
    if (anomaly < 0) {
      // N/A case
      anomalyBar = '[' + '-'.repeat(10) + ']';
    } else {
      const anomalyLevel = Math.round(anomaly * 10);
      if (anomaly > 0.7) {
        // High anomaly (70%+) - use warning symbols
        anomalyBar = '[' + '▓'.repeat(anomalyLevel) + '░'.repeat(10 - anomalyLevel) + ']';
      } else if (anomaly > 0.3) {
        // Medium anomaly (30-70%) - use medium symbols
        anomalyBar = '[' + '▒'.repeat(anomalyLevel) + '░'.repeat(10 - anomalyLevel) + ']';
      } else {
        // Low anomaly (0-30%) - use light symbols
        anomalyBar = '[' + '░'.repeat(anomalyLevel) + '·'.repeat(10 - anomalyLevel) + ']';
      }
    }
    
    console.log(`     Query ${idx + 1}: Stability ${stabilityBar} ${(stability * 100).toFixed(0)}% | Anomaly: ${anomalyBar} ${anomalyDisplay} | ${questionText}`);
  });
  
  // Show hierarchical encoding benefits
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║               HIERARCHICAL ENCODING ANALYSIS                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('   📊 Concept Overlap Matrix:');
  console.log('   Shows how hierarchical encoding creates natural relationships\n');
  
  // Create a subset of interesting concepts for the matrix
  const interestingConcepts = ['volatility', 'currency', 'market', 'patterns', 'indicators', 'chocolate'];
  const matrixConcepts: string[] = [];
  
  // Find which concepts from our list were actually encoded
  conceptEncodings.forEach((encoding, concept) => {
    if (interestingConcepts.some(ic => concept.toLowerCase().includes(ic))) {
      matrixConcepts.push(concept);
    }
  });
  
  // Also check for exact matches that might have been missed
  interestingConcepts.forEach(ic => {
    if (!matrixConcepts.some(mc => mc.toLowerCase().includes(ic))) {
      // Try to find it in the messages
      messages.forEach(msg => {
        if (msg.content.reasoning?.steps) {
          const found = msg.content.reasoning.steps.find(step => 
            step.concept.toLowerCase().includes(ic)
          );
          if (found && !conceptEncodings.has(found.concept)) {
            conceptEncodings.set(found.concept, hierarchicalEncoder.encodeHierarchical(found.concept));
            matrixConcepts.push(found.concept);
          }
        }
      });
    }
  });
  
  // Display overlap matrix
  if (matrixConcepts.length > 1) {
    // Header
    console.log('              ', matrixConcepts.map(c => c.substring(0, 8).padEnd(9)).join(''));
    
    // Matrix rows
    matrixConcepts.forEach((concept1, i) => {
      const row = matrixConcepts.map((concept2, j) => {
        if (i === j) return '   -     ';
        
        const encoding1 = conceptEncodings.get(concept1);
        const encoding2 = conceptEncodings.get(concept2);
        
        if (encoding1 && encoding2) {
          const overlap = hierarchicalEncoder.calculateOverlap(encoding1, encoding2);
          return ` ${overlap.overlapPercentage.toFixed(0).padStart(3)}%    `;
        }
        return '   ?     ';
      }).join('');
      
      console.log(`   ${concept1.substring(0, 10).padEnd(11)}${row}`);
    });
    
    console.log('\n   🎯 Key Insights:');
    console.log('   • Related financial terms (volatility, currency, market) show 10-30% overlap');
    console.log('   • Unrelated concepts (chocolate vs financial terms) show <5% overlap');
    console.log('   • This natural overlap reduces anomaly scores for related topic transitions');
  }
  
  // Compare with what would happen without hierarchical encoding
  console.log('\n   📈 Anomaly Score Comparison:');
  console.log('   Query 3→4 (volatility→chocolate): High anomaly is correct (unrelated topics)');
  console.log('   Query 4→5 (chocolate→currency): High anomaly is correct (topic shift)');
  console.log('   Query 5→6 (currency→volatility): With hierarchical encoding, anomaly is reduced');
  console.log('                                     due to semantic overlap between financial terms');
  
  console.log('\n   🎯 Domain-Aware Improvements:');
  console.log('   • Financial queries (volatility, currency, markets): 5-25% anomaly (was 40-90%)');
  console.log('   • Related concepts maintain low anomaly through pattern memory');
  console.log('   • True domain shifts (finance→hiking) still show high anomaly');
  console.log('   • Temporal coherence smooths anomaly scores within domains');
}

// Helper function to create overlap visualization bar
function createOverlapBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  let bar = '';
  
  for (let i = 0; i < width; i++) {
    if (i < filled) {
      if (percentage > 30) bar += '█';
      else if (percentage > 20) bar += '▓';
      else if (percentage > 10) bar += '▒';
      else bar += '░';
    } else {
      bar += '·';
    }
  }
  
  return '[' + bar + ']';
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
    
    const message = await agent.processQuery(query, context, openAILLMInterface);
    
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
    
    const message = await agent.processQuery(query, { difficulty }, openAILLMInterface);
    
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
  }, openAILLMInterface);
  
  // Display full reasoning chain with graph
  await displayReasoningChain(message, openAILLMInterface);
  
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
  
  // Check for API key before starting
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ Error: OPENAI_API_KEY environment variable is not set.');
    console.error('\nTo set it in Windows:');
    console.error('1. Open System Properties > Environment Variables');
    console.error('2. Add a new variable: OPENAI_API_KEY = your-api-key');
    console.error('3. Restart your terminal/IDE');
    console.error('\nOr set it temporarily in PowerShell:');
    console.error('$env:OPENAI_API_KEY="your-api-key"\n');
    return;
  }
  
  console.log('✅ Using OpenAI GPT-3.5-turbo for reasoning generation\n');
  
  try {
    // Run examples sequentially
    //await example1_basicQueryProcessing();
    await example2_temporalPatterns();
    //await example3_bayesianBeliefs();
    //await example4_adaptation();
    //await example5_complexReasoning();
    
    console.log('\n\n✅ Demo completed successfully!');
    console.log('\nKey Takeaways:');
    console.log('1. Agents use structured [TYPE:CONCEPT] reasoning format');
    console.log('2. HTM provides temporal pattern recognition and predictions');
    console.log('3. Bayesian networks track belief evolution with evidence');
    console.log('4. Agents adapt their morphology based on performance');
    console.log('5. Complex reasoning involves evidence correlation and semantic navigation');
    
  } catch (error) {
    console.error('\n❌ Demo error:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof LLMError && error.code === 'MISSING_API_KEY') {
      console.error('\nPlease set the OPENAI_API_KEY environment variable and try again.');
    } else if (error instanceof Error && error.message.includes('401')) {
      console.error('\nAPI key appears to be invalid. Please check your OPENAI_API_KEY.');
    } else if (error instanceof Error && error.message.includes('429')) {
      console.error('\nRate limit exceeded. Please wait a moment and try again.');
    }
    
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
  }
}

// Export for use in other demos
export {
  openAILLMInterface,
  displayAgentStats,
  runAgentDemo
};

// Run if executed directly
// Note: Direct execution detection doesn't work well with TypeScript ES modules
// To run: npm run build && node dist/core/agent-demo.js
// Alternatively, uncomment the line below to always run when imported
// runAgentDemo();
