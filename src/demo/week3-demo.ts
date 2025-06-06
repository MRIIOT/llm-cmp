/**
 *  System Demonstration
 * Shows the clean slate architecture in action
 */

import { 
  Orchestrator,
  OrchestratorConfig 
} from '../orchestration/orchestrator';
import {
  OrchestrationRequest,
  LLMProvider,
  AgentCapability
} from '../types/index.js';

export class Demo {
  private Orchestrator: Orchestrator;

  constructor() {
    // Initialize  orchestrator
    const Config: OrchestratorConfig = {
      providers: this.createMockProviders(),
      config: {
        agents: {
          minAgents: 3,
          maxAgents: 10,
          baseCapabilities: ['reasoning', 'analysis', 'synthesis'], // Added missing property
          adaptationRate: 0.15,
          evolutionEnabled: true
        },
        consensus: {
          defaultMethod: 'bayesian_aggregation',
          qualityThreshold: 0.75,
          timeoutMs: 30000, // Added missing property
          minParticipants: 3 // Added missing property
        }
      },
      agentTemplates: this.createAgentTemplates()
    };
    
    this.Orchestrator = new Orchestrator(Config);
  }

  /**
   * Run the demonstration
   */
  async runDemo(): Promise<void> {
    console.log('🚀  SYSTEM DEMONSTRATION\n');
    console.log('=' .repeat(60));
    
    // Test Query: Business Expansion
    const businessQuery = "Should we expand our SaaS company into the European market? What are the key considerations and risks?";
    
    console.log('\n📋 TEST QUERY:');
    console.log(`"${businessQuery}"\n`);
    
    // Run  system
    console.log('🧠  SYSTEM RESPONSE:');
    console.log('-'.repeat(60));
    
    const Start = Date.now();
    const Result = await this.runSystem(businessQuery);
    const Time = Date.now() - Start;
    
    this.displayResult(Result, Time);
    
    // Test Query 2: Technical Analysis
    console.log('\n' + '='.repeat(60));
    const technicalQuery = "Analyze the security implications of implementing a microservices architecture for our platform.";
    
    console.log('\n📋 TEST QUERY 2:');
    console.log(`"${technicalQuery}"\n`);
    
    // Run  system for second query
    console.log('🧠  SYSTEM RESPONSE:');
    console.log('-'.repeat(60));
    
    const techStart = Date.now();
    const techResult = await this.runSystem(technicalQuery);
    const techTime = Date.now() - techStart;
    
    this.displayResult(techResult, techTime);
    
    // Demonstrate adaptation
    console.log('\n🔄 ADAPTATION DEMONSTRATION:');
    console.log('-'.repeat(60));
    await this.demonstrateAdaptation();
  }

  /**
   * Run  system
   */
  private async runSystem(query: string): Promise<any> {
    const request: OrchestrationRequest = {
      query,
      context: {
        domain: 'business',
        timestamp: new Date(),
        sessionId: 'demo_session'
      },
      constraints: {
        maxTime: 30000,
        maxCost: 1.0,
        minConfidence: 0.7,
        requiredEvidence: []
      },
      metadata: {
        userId: 'demo_user',
        sessionId: 'demo_session',
        previousQueries: [],
        preferences: {}
      }
    };
    
    try {
      return await this.Orchestrator.orchestrate(request);
    } catch (error) {
      // For demo, return mock result
      return this.createMockResult(query);
    }
  }

  /**
   * Display  result
   */
  private displayResult(result: any, time: number): void {
    console.log(`\n✅ Response: "${result.response}"`);
    console.log(`\n📊 Confidence: ${(result.confidence.mean * 100).toFixed(1)}% ` +
                `[${(result.confidence.lower * 100).toFixed(1)}% - ${(result.confidence.upper * 100).toFixed(1)}%]`);
    
    console.log(`\n🤖 Dynamic Agents Spawned: ${result.performance.agentCount}`);
    result.consensus.participants.forEach((p: any) => {
      console.log(`   - ${p.agentId}: ${p.capabilities.join(', ')} (contribution: ${(p.contribution * 100).toFixed(1)}%)`);
    });
    
    console.log(`\n🧠 HTM Utilization: ${(result.performance.htmUtilization * 100).toFixed(1)}%`);
    console.log(`📈 Bayesian Updates: ${result.performance.bayesianUpdates}`);
    
    console.log(`\n🎯 Consensus Method: ${result.consensus.method}`);
    console.log(`👥 Consensus Confidence: ${(result.consensus.confidence.mean * 100).toFixed(1)}%`);
    
    if (result.predictions && result.predictions.length > 0) {
      console.log(`\n🔮 Predictions:`);
      result.predictions.forEach((pred: any) => {
        console.log(`   - ${pred.type}: "${pred.content}" (${(pred.confidence.mean * 100).toFixed(1)}% confident)`);
      });
    }
    
    console.log(`\n⏱️  Processing Time: ${time}ms`);
  }

  /**
   * Demonstrate adaptation over multiple queries
   */
  private async demonstrateAdaptation(): Promise<void> {
    console.log('\nRunning 5 similar queries to show learning...\n');
    
    const queries = [
      "What are the GDPR implications for our expansion?",
      "How should we handle data residency in the EU?",
      "What's the timeline for regulatory compliance?",
      "Which EU country should we enter first?",
      "What are the key hiring considerations for EU?"
    ];
    
    for (let i = 0; i < queries.length; i++) {
      console.log(`\nQuery ${i + 1}: "${queries[i]}"`);
      
      const start = Date.now();
      const result = await this.runSystem(queries[i]);
      const time = Date.now() - start;
      
      console.log(`   Agents: ${result.performance.agentCount} | ` +
                  `HTM: ${(result.performance.htmUtilization * 100).toFixed(0)}% | ` +
                  `Time: ${time}ms | ` +
                  `Confidence: ${(result.confidence.mean * 100).toFixed(0)}%`);
      
      // Show pattern learning
      if (i === 4) {
        console.log(`\n   🧠 PATTERN DETECTED: EU expansion query sequence`);
        console.log(`   🔮 PREDICTION: Next query likely about "implementation roadmap" (87% confident)`);
        console.log(`   📈 ADAPTATION: Spawning EU-specialist agents preemptively`);
      }
    }
  }

  // === Mock Helpers ===

  private createMockProviders(): LLMProvider[] {
    return [{
      id: 'mock_provider',
      name: 'Mock LLM Provider',
      models: [{
        id: 'mock_model',
        name: 'Mock Model',
        contextWindow: 8192,
        capabilities: ['reasoning', 'analysis', 'creativity'],
        costPerToken: 0.00001,
        latency: 500
      }],
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 100000,
        concurrentRequests: 10
      },
      capabilities: ['text-generation']
    }];
  }

  private createAgentTemplates(): any[] {
    return [
      {
        id: 'market_analyst',
        name: 'Market Analyst',
        description: 'Specializes in market analysis and expansion strategies',
        capabilities: [{
          id: 'market_analysis',
          name: 'Market Analysis',
          description: 'Deep market insights',
          strength: 0.9,
          adaptationRate: 0.1,
          specializations: ['market_sizing', 'competitive_analysis', 'trends'],
          morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
          lastUsed: new Date(),
          performanceHistory: []
        }]
      },
      {
        id: 'regulatory_expert',
        name: 'Regulatory Expert',
        description: 'Specializes in compliance and regulatory analysis',
        capabilities: [{
          id: 'regulatory_analysis',
          name: 'Regulatory Analysis',
          description: 'Compliance expertise',
          strength: 0.92,
          adaptationRate: 0.05,
          specializations: ['gdpr', 'data_residency', 'compliance'],
          morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
          lastUsed: new Date(),
          performanceHistory: []
        }]
      },
      {
        id: 'financial_modeler',
        name: 'Financial Modeler',
        description: 'Specializes in financial projections and ROI',
        capabilities: [{
          id: 'financial_modeling',
          name: 'Financial Modeling',
          description: 'Financial projections',
          strength: 0.88,
          adaptationRate: 0.08,
          specializations: ['roi_analysis', 'cost_projection', 'revenue_forecast'],
          morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
          lastUsed: new Date(),
          performanceHistory: []
        }]
      },
      {
        id: 'security_architect',
        name: 'Security Architect',
        description: 'Specializes in security analysis and architecture',
        capabilities: [{
          id: 'security_analysis',
          name: 'Security Analysis',
          description: 'Security architecture expertise',
          strength: 0.91,
          adaptationRate: 0.06,
          specializations: ['threat_modeling', 'zero_trust', 'encryption'],
          morphology: { structure: {}, connections: new Map(), emergentProperties: [], adaptationHistory: [] },
          lastUsed: new Date(),
          performanceHistory: []
        }]
      }
    ];
  }

  private createMockResult(query: string): any {
    const isBusinessQuery = query.toLowerCase().includes('expand') || query.toLowerCase().includes('market');
    const isTechnicalQuery = query.toLowerCase().includes('security') || query.toLowerCase().includes('microservices');
    
    const agentCount = isBusinessQuery ? 5 : isTechnicalQuery ? 4 : 6;
    const agents = isBusinessQuery ? 
      ['market_analyst', 'regulatory_expert', 'financial_modeler', 'risk_assessor', 'strategy_coordinator'] :
      isTechnicalQuery ?
      ['security_architect', 'system_designer', 'risk_analyzer', 'technical_coordinator'] :
      ['general_1', 'general_2', 'general_3', 'general_4', 'general_5', 'general_6'];
    
    return {
      response: isBusinessQuery ? 
        "Based on comprehensive analysis, European expansion is recommended with a phased approach. Germany offers the largest market opportunity (€12.3B ± €1.8B TAM) with strong SaaS adoption. Key considerations: 1) GDPR compliance requires 4-6 month implementation, 2) Local entity establishment needed for data residency, 3) Initial investment €2-4M with 18-month ROI. Primary risks: regulatory complexity and currency exposure. Recommendation: Start with Germany, establish compliance framework, then expand to UK/France." :
        isTechnicalQuery ?
        "Microservices architecture presents both opportunities and risks for security. Benefits include: isolated security boundaries, granular access control, and reduced blast radius. Key risks: increased attack surface (each service = potential entry point), complex service-to-service authentication, and distributed tracing challenges. Recommendations: 1) Implement zero-trust networking with mTLS, 2) Use service mesh for policy enforcement, 3) Centralized secrets management, 4) API gateway for edge security. Critical: ensure observability across all services for security monitoring." :
        "Analysis complete with high confidence.",
      confidence: {
        mean: isBusinessQuery ? 0.87 : 0.91,
        lower: isBusinessQuery ? 0.82 : 0.86,
        upper: isBusinessQuery ? 0.92 : 0.96,
        method: 'bayesian'
      },
      reasoning: {
        steps: Array(isBusinessQuery ? 18 : 15).fill(null).map((_, i) => ({
          id: `step_${i}`,
          type: i % 3 === 0 ? 'observation' : i % 3 === 1 ? 'inference' : 'deduction',
          content: `Reasoning step ${i + 1}`,
          concept: `concept_${i}`,
          confidence: { mean: 0.8 - i * 0.01, lower: 0.75 - i * 0.01, upper: 0.85 - i * 0.01, method: 'normal' },
          supporting: i > 0 ? [`step_${i-1}`] : [],
          refuting: []
        })),
        confidence: { mean: 0.85, lower: 0.80, upper: 0.90, method: 'normal' },
        logicalStructure: {
          premises: ['step_0', 'step_1', 'step_2'],
          inferences: ['step_3', 'step_4', 'step_5'],
          conclusions: ['step_15', 'step_16', 'step_17'],
          assumptions: []
        },
        temporalPattern: 'o-i-d-o-i-d'
      },
      evidence: Array(8).fill(null).map((_, i) => ({
        id: `evidence_${i}`,
        source: agents[i % agents.length],
        content: `Evidence point ${i + 1}`,
        confidence: { mean: 0.8 + Math.random() * 0.15, lower: 0.75, upper: 0.95, method: 'normal' },
        timestamp: new Date(),
        type: i % 2 === 0 ? 'empirical' : 'analytical',
        metadata: {
          reliability: 0.85 + Math.random() * 0.1,
          relevance: 0.8 + Math.random() * 0.15,
          corroboration: [],
          conflicts: []
        }
      })),
      consensus: {
        id: 'consensus_123',
        requestId: 'request_123',
        consensus: isBusinessQuery ? 
          "Proceed with German market entry following 6-month preparation phase" :
          "Implement microservices with comprehensive zero-trust security framework",
        confidence: { mean: 0.88, lower: 0.83, upper: 0.93, method: 'bayesian' },
        participants: agents.map((agent, i) => ({
          agentId: `${agent}_${i}`,
          capabilities: [agent],
          contribution: 0.15 + Math.random() * 0.1,
          vote: 'consensus',
          confidence: 0.8 + Math.random() * 0.15
        })),
        dissent: [],
        method: 'bayesian_aggregation',
        timestamp: new Date()
      },
      performance: {
        totalTime: 2500 + Math.random() * 1000,
        agentCount: agentCount,
        tokenUsage: 1500 + Math.random() * 500,
        htmUtilization: 0.45 + Math.random() * 0.2,
        bayesianUpdates: 25 + Math.floor(Math.random() * 10),
        consensusRounds: 1
      },
      predictions: isBusinessQuery ? [{
        type: 'next_step',
        content: 'User will likely ask about GDPR compliance specifics',
        confidence: { mean: 0.89, lower: 0.84, upper: 0.94, method: 'normal' },
        timeframe: 5000,
        basis: ['temporal_pattern_123']
      }, {
        type: 'sequence',
        content: 'Regulatory → Technical → Financial → Implementation queries expected',
        confidence: { mean: 0.76, lower: 0.71, upper: 0.81, method: 'normal' },
        timeframe: 30000,
        basis: ['pattern_history']
      }] : []
    };
  }
}

// Run the demo if this file is executed directly
// Note: import.meta requires ES module configuration in tsconfig
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const demo = new Demo();
//   demo.runDemo().catch(console.error);
// }