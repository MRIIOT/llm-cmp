// ===============================================
// PHASE 3 DEMONSTRATION
// Agent Specialization System Demo
// ===============================================

/**
 * Phase 3 Demonstration: Agent Specialization System
 * Shows distinct specialized behaviors of different agent types
 */

import { LLMAgent } from '../core/llm-agent.js';
import { SemanticPose } from '../core/semantic-pose.js';
import { PromptTemplateManager } from '../models/prompt-template-manager.js';
import { 
  LLM_AGENT_TYPES, 
  getAgentSpecialization, 
  getReasoningTypesForAgent,
  KNOWLEDGE_FRAMES 
} from '../agents/agent-types.js';
import { SpecializedAgentProcessor } from '../agents/specialized-agents.js';
import { KnowledgeDomainTransformer } from '../core/knowledge-domains.js';
import { ReasoningStep } from '../types/index.js';

/**
 * Phase 3 Demo: Agent Specialization System
 */
export class Phase3Demo {
  private agents: Map<string, LLMAgent>;
  private promptManager: PromptTemplateManager;

  constructor() {
    this.agents = new Map();
    this.promptManager = new PromptTemplateManager();
    this.initializeSpecializedAgents();
  }

  /**
   * Initialize all 7 specialized agents
   */
  private initializeSpecializedAgents(): void {
    const agentConfigs = [
      { type: LLM_AGENT_TYPES.REASONING, model: 'claude-3-opus' },
      { type: LLM_AGENT_TYPES.CREATIVE, model: 'gpt-4-turbo' },
      { type: LLM_AGENT_TYPES.FACTUAL, model: 'claude-3-sonnet' },
      { type: LLM_AGENT_TYPES.CODE, model: 'claude-3-haiku' },
      { type: LLM_AGENT_TYPES.SOCIAL, model: 'gpt-4' },
      { type: LLM_AGENT_TYPES.CRITIC, model: 'claude-3-opus' },
      { type: LLM_AGENT_TYPES.COORDINATOR, model: 'gpt-4-turbo' }
    ];

    agentConfigs.forEach(config => {
      const specialization = getAgentSpecialization(config.type);
      const agent = new LLMAgent(
        config.type, 
        specialization.focus, 
        config.model
      );
      this.agents.set(config.type, agent);
    });

    console.log(`🤖 Initialized ${this.agents.size} specialized agents`);
  }

  /**
   * Demonstrate distinct agent behaviors on the same query
   */
  async demonstrateAgentSpecialization(): Promise<void> {
    console.log('\n🎯 PHASE 3 DEMONSTRATION: Agent Specialization System');
    console.log('==================================================');

    const testQuery = "How should we implement a real-time collaborative code editor for distributed teams?";
    const context = {
      query: testQuery,
      domain: 'software_engineering',
      constraints: ['real_time', 'collaboration', 'distributed_teams', 'scalability'],
      requirements: ['low_latency', 'conflict_resolution', 'user_experience']
    };

    console.log(`\n📝 Test Query: "${testQuery}"`);
    console.log(`📋 Context: ${JSON.stringify(context, null, 2)}`);

    // Demonstrate each agent's specialized behavior
    const agentResults = new Map();

    for (const [agentType, agent] of this.agents) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤖 ${agentType.toUpperCase()} AGENT ANALYSIS`);
      console.log(`${'='.repeat(60)}`);

      const result = await this.demonstrateAgentBehavior(agent, testQuery, context);
      agentResults.set(agentType, result);
    }

    // Show specialization comparison
    this.showSpecializationComparison(agentResults);

    // Demonstrate knowledge domain transformations
    console.log('\n🔄 KNOWLEDGE DOMAIN TRANSFORMATIONS');
    console.log('=====================================');
    this.demonstrateKnowledgeDomainTransforms(agentResults);

    // Show morphology analysis differences
    console.log('\n🧠 SEMANTIC MORPHOLOGY ANALYSIS');
    console.log('================================');
    this.showMorphologyAnalysis(agentResults);
  }

  /**
   * Demonstrate individual agent behavior
   */
  private async demonstrateAgentBehavior(
    agent: LLMAgent, 
    query: string, 
    context: any
  ): Promise<any> {
    const agentInfo = agent.getSpecializationInfo();
    
    console.log(`📊 Agent Profile:`);
    console.log(`   Type: ${agentInfo.type}`);
    console.log(`   Focus: ${agentInfo.focus}`);
    console.log(`   Domain: ${agentInfo.domain}`);
    console.log(`   Strengths: ${agentInfo.strengths.join(', ')}`);
    console.log(`   Confidence Threshold: ${agentInfo.confidenceThreshold}`);

    // Generate specialized prompt
    const prompt = this.promptManager.buildPrompt(agent.type, 'base', { query, context });
    console.log(`\n💭 Specialized Prompt Generated (${prompt.length} chars)`);

    // Simulate specialized reasoning generation
    const reasoning = await this.generateSpecializedReasoning(agent, query, context);
    console.log(`\n🔍 Generated Reasoning Steps: ${reasoning.length}`);
    
    reasoning.forEach((step, index) => {
      console.log(`   ${index + 1}. [${step.type}] ${step.content.substring(0, 80)}...`);
      console.log(`      Concept: ${step.concept} | Confidence: ${step.confidence.toFixed(3)}`);
    });

    // Extract semantic morphology
    const morphology = SpecializedAgentProcessor.extractDetailedSemanticMorphology(reasoning, agent.type);
    console.log(`\n🧬 Semantic Morphology Extracted:`);
    this.logMorphologyStructure(morphology, agent.type);

    // Create semantic pose
    const semanticPose = new SemanticPose(
      reasoning.map(r => this.hashConcept(r.concept)),
      reasoning.reduce((sum, r) => sum + r.confidence, 0) / reasoning.length,
      agent.nativeDomain
    );

    // Assess reasoning quality
    const qualityScore = agent.assessSpecializedReasoningQuality(reasoning);
    console.log(`\n📈 Specialized Quality Score: ${qualityScore.toFixed(3)}`);

    // Check domain compatibility
    const domainCompatibility = agent.canWorkInDomain(KNOWLEDGE_FRAMES.TECHNICAL);
    console.log(`🔗 Can work in Technical Domain: ${domainCompatibility ? 'Yes' : 'No'}`);

    return {
      agent,
      reasoning,
      morphology,
      semanticPose,
      qualityScore,
      agentInfo,
      prompt
    };
  }

  /**
   * Generate specialized reasoning using real LLM APIs when available
   */
  private async generateSpecializedReasoning(agent: LLMAgent, query: string, context: any): Promise<ReasoningStep[]> {
    const preferredTypes = agent.getPreferredReasoningTypes();
    const specialization = getAgentSpecialization(agent.type);
    
    // Check if we have real API keys configured
    const hasRealAPIs = this.hasRealAPIKeys();
    
    if (hasRealAPIs) {
      console.log(`   🔗 Using REAL LLM API for ${agent.type}`);
      return this.generateRealLLMReasoning(agent, query, context);
    } else {
      console.log(`   🎭 Using simulated responses for ${agent.type}`);
      return this.generateSimulatedReasoning(agent, query, context, preferredTypes);
    }
  }

  /**
   * Check if real API keys are configured
   */
  private hasRealAPIKeys(): boolean {
    try {
      const ConfigLoader = require('../config/config-loader.js').ConfigLoader;
      const configLoader = ConfigLoader.getInstance();
      const config = configLoader.getConfig();
      
      const hasOpenAI = config.apiKeys?.openai && 
                       !config.apiKeys.openai.includes('your-') && 
                       config.apiKeys.openai.startsWith('sk-');
      
      const hasAnthropic = config.apiKeys?.anthropic && 
                          !config.apiKeys.anthropic.includes('your-') && 
                          config.apiKeys.anthropic.startsWith('sk-ant-');
      
      return hasOpenAI || hasAnthropic;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate reasoning using real LLM APIs
   */
  private async generateRealLLMReasoning(agent: LLMAgent, query: string, context: any): Promise<ReasoningStep[]> {
    try {
      // Import model interfaces - use dynamic import to handle module loading
      const modelsModule = await import('../models/index.js');
      
      // Create LLM interface for this agent
      const llmInterface = modelsModule.createModelInterface(agent);
      
      // Test connection first
      console.log(`   🔍 Testing API connection for ${agent.type}...`);
      const connectionOk = await llmInterface.testConnection();
      
      if (!connectionOk) {
        throw new Error('API connection test failed');
      }
      
      console.log(`   ✅ API connection successful`);
      
      // Create CMP message for processing
      const cmpMessage = {
        type: 'ANALYSIS_REQUEST',
        reasoning: [{
          type: 'query',
          concept: agent.type,
          content: query,
          confidence: 0.8
        }],
        semantic_pose: {
          concept: [1, 2, 3],
          confidence: 0.8,
          context: agent.nativeDomain
        },
        confidence: 0.8
      };
      
      // Process with real LLM
      console.log(`   🚀 Calling ${agent.type} LLM API...`);
      const response = await llmInterface.processCMPMessage(cmpMessage, {
        query,
        ...context
      });
      
      console.log(`   📝 Received ${response.reasoning.length} reasoning steps from LLM`);
      
      return response.reasoning;
      
    } catch (error: any) {
      console.warn(`   ⚠️ Real API call failed for ${agent.type}: ${error.message}`);
      console.warn(`   🎭 Falling back to simulation...`);
      return this.generateSimulatedReasoning(agent, query, context, agent.getPreferredReasoningTypes());
    }
  }

  /**
   * Generate simulated reasoning (fallback)
   */
  private generateSimulatedReasoning(agent: LLMAgent, query: string, context: any, preferredTypes: string[]): ReasoningStep[] {
    // Generate reasoning steps specific to agent specialization
    const reasoning: ReasoningStep[] = [];

    preferredTypes.forEach((reasoningType, index) => {
      const step = this.createSpecializedReasoningStep(
        agent.type, 
        reasoningType, 
        query, 
        context, 
        index
      );
      reasoning.push(step);
    });

    // Add some common reasoning steps
    reasoning.push({
      type: 'analysis_summary',
      concept: `${agent.type}_analysis`,
      content: `Summary analysis from ${agent.type} perspective: ${this.generateAgentSummary(agent.type, query)}`,
      confidence: 0.8
    });

    return reasoning;
  }

  /**
   * Create specialized reasoning step for agent type
   */
  private createSpecializedReasoningStep(
    agentType: string, 
    reasoningType: string, 
    query: string, 
    context: any, 
    index: number
  ): ReasoningStep {
    const stepTemplates: Record<string, () => string> = {
      // Reasoning Agent
      'premise': () => `Logical premise ${index + 1}: The collaborative code editor requires real-time synchronization mechanisms to handle concurrent edits from multiple users without conflicts.`,
      'inference': () => `Logical inference ${index + 1}: If we implement operational transformation or conflict-free replicated data types (CRDTs), then we can maintain consistency across distributed clients.`,
      'conclusion': () => `Logical conclusion: A hybrid approach using CRDTs for basic operations and operational transformation for complex edits provides optimal consistency guarantees.`,
      'logical_validation': () => `Validation: The proposed solution satisfies the requirements for consistency, availability, and partition tolerance as per CAP theorem constraints.`,

      // Creative Agent  
      'divergent_exploration': () => `Creative exploration: What if we reimagined collaborative editing as a musical composition where each developer contributes different instruments to create harmony?`,
      'creative_synthesis': () => `Creative synthesis: Combine gaming mechanics with code collaboration - developers earn points for clean merges and helping resolve conflicts.`,
      'novel_perspective': () => `Novel perspective: Instead of traditional conflict resolution, use AI to predict and prevent conflicts before they happen based on typing patterns.`,
      'imaginative_extension': () => `Imaginative extension: Extend collaboration to include AI pair programming assistants that learn from the team's coding style and suggest improvements.`,

      // Factual Agent
      'fact_retrieval': () => `Factual research: Studies show that 73% of development teams using real-time collaborative editors report 40% faster code review cycles.`,
      'fact_verification': () => `Verification: Google Docs uses operational transformation with 99.9% conflict resolution success rate across millions of concurrent users.`,
      'source_analysis': () => `Source analysis: Academic research from MIT (2023) demonstrates CRDT performance superiority for text editing with >10 concurrent users.`,
      'knowledge_integration': () => `Knowledge integration: Industry best practices from VSCode Live Share, Figma, and Notion indicate WebRTC + WebSocket hybrid architecture.`,

      // Code Agent
      'problem_decomposition': () => `Technical decomposition: Break the system into real-time synchronization layer, conflict resolution engine, and user presence management.`,
      'algorithm_design': () => `Algorithm design: Implement three-way merge algorithm with Longest Common Subsequence optimization for efficient diff computation.`,
      'implementation_strategy': () => `Implementation strategy: Use TypeScript + WebSocket for real-time communication, IndexedDB for offline persistence, and Web Workers for background processing.`,
      'optimization_analysis': () => `Optimization: Implement delta compression to reduce network bandwidth by 80% and debounced synchronization to limit API calls.`,

      // Social Agent
      'stakeholder_analysis': () => `Stakeholder analysis: Developers need seamless collaboration, team leads require visibility into contributions, and organizations want improved productivity.`,
      'empathy_modeling': () => `Empathy consideration: Distributed teams face timezone challenges and communication barriers that the editor should help bridge.`,
      'communication_strategy': () => `Communication strategy: Include presence indicators, real-time cursor positions, and integrated chat to maintain human connection.`,
      'social_impact_assessment': () => `Social impact: Tool should promote inclusive collaboration and prevent senior developers from dominating junior contributions.`,

      // Critic Agent
      'risk_identification': () => `Risk identification: Real-time systems face network latency issues, potential data loss during conflicts, and scalability bottlenecks.`,
      'limitation_analysis': () => `Limitation analysis: Current WebSocket technology has connection limits and doesn't handle mobile networks well.`,
      'failure_mode_analysis': () => `Failure analysis: System could fail catastrophically if the central server goes down without proper distributed backup mechanisms.`,
      'improvement_suggestion': () => `Improvement suggestion: Implement offline-first architecture with eventual consistency to handle network failures gracefully.`,

      // Coordinator Agent
      'perspective_aggregation': () => `Perspective aggregation: Combining technical feasibility with user experience requirements and business constraints for balanced solution.`,
      'consensus_building': () => `Consensus building: All stakeholders agree on prioritizing real-time collaboration over advanced IDE features for MVP.`,
      'priority_assessment': () => `Priority assessment: Critical path involves real-time sync (P0), conflict resolution (P0), and user presence (P1).`,
      'orchestration_planning': () => `Orchestration planning: Coordinate development phases - core sync engine first, then UI layer, finally advanced collaboration features.`
    };

    const templateFn = stepTemplates[reasoningType];
    const content = templateFn ? templateFn() : `${reasoningType}: Analysis from ${agentType} perspective on collaborative code editor implementation.`;

    return {
      type: reasoningType,
      concept: `${agentType}_${reasoningType}`,
      content,
      confidence: this.generateRealisticConfidence(reasoningType, content, agentType)
    };
  }

  /**
   * Generate agent-specific summary
   */
  private generateAgentSummary(agentType: string, query: string): string {
    const summaries: Record<string, string> = {
      [LLM_AGENT_TYPES.REASONING]: 'Systematic logical analysis focusing on consistency guarantees and theoretical foundations.',
      [LLM_AGENT_TYPES.CREATIVE]: 'Innovative approaches that reimagine collaboration paradigms and user engagement models.',
      [LLM_AGENT_TYPES.FACTUAL]: 'Evidence-based recommendations grounded in research data and industry best practices.',
      [LLM_AGENT_TYPES.CODE]: 'Technical implementation strategy with concrete algorithms and architectural decisions.',
      [LLM_AGENT_TYPES.SOCIAL]: 'Human-centered design considerations addressing team dynamics and user experience.',
      [LLM_AGENT_TYPES.CRITIC]: 'Risk assessment and limitation analysis to prevent potential implementation failures.',
      [LLM_AGENT_TYPES.COORDINATOR]: 'Strategic synthesis of all perspectives into cohesive implementation roadmap.'
    };

    return summaries[agentType] || 'General analysis of the collaborative code editor requirements.';
  }

  /**
   * Generate realistic confidence values based on reasoning type and content characteristics
   */
  private generateRealisticConfidence(reasoningType: string, content: string, agentType: string): number {
    // Base confidence levels by reasoning type
    const typeBaseConfidence: Record<string, number> = {
      'premise': 0.8,              // Premises tend to be well-established
      'fact': 0.85,               // Facts should be high confidence
      'inference': 0.65,          // Inferences involve reasoning, lower confidence
      'conclusion': 0.75,         // Conclusions are somewhat confident
      'creative_idea': 0.55,      // Creative ideas are more speculative
      'creative_insight': 0.6,    // Creative insights are somewhat speculative
      'implementation': 0.7,      // Implementation steps are practical
      'implementation_step': 0.7, // Implementation steps are practical
      'critique': 0.65,           // Critiques involve subjective assessment
      'critical_analysis': 0.65,  // Critical analysis is thorough but uncertain
      'social_aspect': 0.6,       // Social aspects are subjective
      'social_consideration': 0.6, // Social considerations are subjective
      'coordination_step': 0.7,   // Coordination tends to be planned
      'factual_analysis': 0.8,    // Factual analysis should be confident
      'logical_step': 0.75        // Logical steps are reasoned
    };

    // Agent-specific confidence modifiers
    const agentModifiers: Record<string, number> = {
      [LLM_AGENT_TYPES.REASONING]: 0.05,   // Reasoning agent is more confident in logic
      [LLM_AGENT_TYPES.CREATIVE]: -0.1,    // Creative agent is less certain
      [LLM_AGENT_TYPES.FACTUAL]: 0.1,      // Factual agent is more confident
      [LLM_AGENT_TYPES.CODE]: 0.05,        // Code agent is confident in implementation
      [LLM_AGENT_TYPES.SOCIAL]: -0.05,     // Social agent deals with subjective issues
      [LLM_AGENT_TYPES.CRITIC]: -0.05,     // Critical agent identifies uncertainties
      [LLM_AGENT_TYPES.COORDINATOR]: 0.0   // Coordinator is balanced
    };

    // Content-based adjustments
    let contentAdjustment = 0;
    const lowerContent = content.toLowerCase();
    
    // Technical specificity increases confidence
    const technicalPatterns = [
      /\b\w+\(\)/g,                    // Function calls
      /\b[A-Z]{2,}\b/g,                // Acronyms  
      /\b\d+\.?\d*%?\b/g,              // Numbers/percentages
      /\b[a-z]+[_-][a-z]+\b/gi,        // Technical terms
    ];
    
    let technicalCount = 0;
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      technicalCount += matches ? matches.length : 0;
    });
    contentAdjustment += Math.min(technicalCount * 0.02, 0.1);
    
    // Evidence words increase confidence
    const evidenceWords = ['research', 'study', 'data', 'proven', 'documented', 'verified'];
    const evidenceCount = evidenceWords.filter(word => lowerContent.includes(word)).length;
    contentAdjustment += evidenceCount * 0.03;
    
    // Uncertainty words decrease confidence
    const uncertaintyWords = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'uncertain'];
    const uncertaintyCount = uncertaintyWords.filter(word => lowerContent.includes(word)).length;
    contentAdjustment -= uncertaintyCount * 0.05;
    
    // Content length assessment
    if (content.length >= 100 && content.length <= 200) {
      contentAdjustment += 0.05; // Good detail level
    } else if (content.length < 50) {
      contentAdjustment -= 0.05; // Too brief
    }
    
    // Calculate final confidence
    const baseConfidence = typeBaseConfidence[reasoningType] || 0.65;
    const agentModifier = agentModifiers[agentType] || 0;
    
    // Add some realistic randomness (±0.08)
    const randomVariation = (Math.random() - 0.5) * 0.16;
    
    const finalConfidence = baseConfidence + agentModifier + contentAdjustment + randomVariation;
    
    // Ensure realistic range
    return Math.max(0.35, Math.min(0.92, Math.round(finalConfidence * 1000) / 1000));
  }

  /**
   * Show comparison of agent specializations
   */
  private showSpecializationComparison(agentResults: Map<string, any>): void {
    console.log('\n📊 SPECIALIZATION COMPARISON');
    console.log('=============================');

    const comparison = Array.from(agentResults.entries()).map(([agentType, result]) => ({
      agent: agentType,
      domain: result.agentInfo.domain,
      focus: result.agentInfo.focus,
      reasoningSteps: result.reasoning.length,
      qualityScore: result.qualityScore,
      confidence: result.semanticPose.confidence,
      strengths: result.agentInfo.strengths.length
    }));

    console.log('\nAgent Performance Summary:');
    console.log('Agent               | Domain     | Quality | Confidence | Steps | Strengths');
    console.log('-'.repeat(75));
    
    comparison.forEach(c => {
      console.log(
        `${c.agent.padEnd(18)} | ${c.domain.padEnd(9)} | ${c.qualityScore.toFixed(3).padStart(7)} | ${c.confidence.toFixed(3).padStart(10)} | ${c.reasoningSteps.toString().padStart(5)} | ${c.strengths.toString().padStart(9)}`
      );
    });

    // Find best performers
    const bestQuality = comparison.reduce((best, current) => 
      current.qualityScore > best.qualityScore ? current : best
    );
    const bestConfidence = comparison.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    console.log(`\n🏆 Highest Quality: ${bestQuality.agent} (${bestQuality.qualityScore.toFixed(3)})`);
    console.log(`🎯 Highest Confidence: ${bestConfidence.agent} (${bestConfidence.confidence.toFixed(3)})`);
  }

  /**
   * Demonstrate knowledge domain transformations
   */
  private demonstrateKnowledgeDomainTransforms(agentResults: Map<string, any>): void {
    const transformationExamples = [
      { from: KNOWLEDGE_FRAMES.CREATIVE, to: KNOWLEDGE_FRAMES.TECHNICAL },
      { from: KNOWLEDGE_FRAMES.SOCIAL, to: KNOWLEDGE_FRAMES.FACTUAL },
      { from: KNOWLEDGE_FRAMES.TECHNICAL, to: KNOWLEDGE_FRAMES.META }
    ];

    transformationExamples.forEach(({ from, to }) => {
      console.log(`\n🔄 Transforming ${from} → ${to}:`);
      
      // Find agents in source and target domains
      const sourceAgent = Array.from(agentResults.entries()).find(([_, result]) => 
        result.agentInfo.domain === from
      );
      
      if (sourceAgent) {
        const [agentType, result] = sourceAgent;
        const originalPose = result.semanticPose;
        
        console.log(`   Source Agent: ${agentType}`);
        console.log(`   Original Pose: [${originalPose.concept.slice(0, 3).map((n: number) => n.toFixed(2)).join(', ')}...] confidence: ${originalPose.confidence.toFixed(3)}`);
        
        // Perform transformation
        const transformedPose = KnowledgeDomainTransformer.transform(originalPose, from, to);
        console.log(`   Transformed: [${transformedPose.concept.slice(0, 3).map((n: number) => n.toFixed(2)).join(', ')}...] confidence: ${transformedPose.confidence.toFixed(3)}`);
        
        // Check compatibility
        const compatibility = KnowledgeDomainTransformer.checkDomainCompatibility(from, to);
        console.log(`   Compatibility: ${compatibility.similarity.toFixed(3)} | Cost: ${compatibility.transformationCost.toFixed(3)}`);
        console.log(`   Preserved Concepts: ${compatibility.preservedConcepts.join(', ')}`);
      }
    });

    // Show transformation statistics
    const stats = KnowledgeDomainTransformer.getDomainTransformationStats();
    console.log(`\n📈 Transformation System Stats:`);
    console.log(`   Total Transform Matrices: ${stats.totalTransforms}`);
    console.log(`   Average Reliability: ${stats.averageReliability.toFixed(3)}`);
    console.log(`   Available Paths: ${stats.availablePaths.length}`);
  }

  /**
   * Show morphology analysis differences
   */
  private showMorphologyAnalysis(agentResults: Map<string, any>): void {
    Array.from(agentResults.entries()).forEach(([agentType, result]) => {
      console.log(`\n🧬 ${agentType.toUpperCase()} Morphology:`);
      this.logMorphologyStructure(result.morphology, agentType);
    });
  }

  /**
   * Log morphology structure details
   */
  private logMorphologyStructure(morphology: any, agentType: string): void {
    Object.entries(morphology).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        console.log(`   ${key}: ${value.length} items`);
        if (value.length > 0 && value.length <= 3) {
          value.forEach((item: any, index: number) => {
            if (typeof item === 'object') {
              const preview = JSON.stringify(item).substring(0, 60);
              console.log(`     ${index + 1}. ${preview}...`);
            } else {
              console.log(`     ${index + 1}. ${item}`);
            }
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log(`   ${key}:`);
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (Array.isArray(subValue)) {
            console.log(`     ${subKey}: ${subValue.length} items`);
          } else {
            console.log(`     ${subKey}: ${subValue}`);
          }
        });
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
  }

  /**
   * Simple hash function for concept mapping
   */
  private hashConcept(concept: string): number {
    return Array.from(concept).reduce((hash, char) => hash + char.charCodeAt(0), 0) % 100;
  }

  /**
   * Run the complete Phase 3 demonstration
   */
  static async run(): Promise<void> {
    console.log('🚀 Starting Phase 3 Agent Specialization Demonstration...\n');
    
    try {
      const demo = new Phase3Demo();
      await demo.demonstrateAgentSpecialization();
      
      console.log('\n✅ Phase 3 Demonstration completed successfully!');
      console.log('================================================');
      console.log('🎯 Key Achievements:');
      console.log('   • 7 specialized agent types with distinct behaviors');
      console.log('   • Agent-specific reasoning morphology extraction');
      console.log('   • Knowledge domain transformation system');
      console.log('   • Cross-domain compatibility checking');
      console.log('   • Specialized prompt templates for each agent');
      console.log('\n🔄 Ready for Phase 4: Orchestration Engine');
      
    } catch (error) {
      console.error('❌ Phase 3 demonstration failed:', error);
      throw error;
    }
  }
}

// Export for use in main demo runner
export async function runPhase3Demo(): Promise<void> {
  await Phase3Demo.run();
}
