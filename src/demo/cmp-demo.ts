// ===============================================
// CMP PHASE 1 DEMONSTRATION
// ===============================================

import { LLMAgent } from '../core/llm-agent.js';
import { SemanticPose } from '../core/semantic-pose.js';
import { LLM_AGENT_TYPES } from '../types/index.js';
import { ConfigLoader } from '../config/config-loader.js';

export class CMPDemo {
  private agents: Map<string, LLMAgent>;
  private config: any;

  constructor() {
    this.agents = new Map();
    this.config = ConfigLoader.getInstance().getConfig();
  }

  // Initialize agents for Phase 1 demo
  initializeAgents(): void {
    console.log('🤖 Initializing CMP agents...\n');

    // Create specialized agents
    const agentConfigs = [
      { key: 'reasoning', type: LLM_AGENT_TYPES.REASONING, spec: 'logical_analysis' },
      { key: 'creative', type: LLM_AGENT_TYPES.CREATIVE, spec: 'creative_synthesis' },
      { key: 'factual', type: LLM_AGENT_TYPES.FACTUAL, spec: 'knowledge_retrieval' },
      { key: 'code', type: LLM_AGENT_TYPES.CODE, spec: 'programming' }
    ];

    agentConfigs.forEach(({ key, type, spec }) => {
      const modelConfig = this.config.models[key];
      const agent = new LLMAgent(type, spec, modelConfig.model);
      this.agents.set(key, agent);
      
      console.log(`   ✅ ${key.toUpperCase()}: ${type} (${modelConfig.model})`);
    });

    console.log(`\n📊 Total agents initialized: ${this.agents.size}`);
  }

  // Demonstrate semantic pose operations
  demonstrateSemanticPoses(): void {
    console.log('\n🧠 SEMANTIC POSE DEMONSTRATION');
    console.log('=====================================');

    // Create different semantic poses
    const technicalPose = new SemanticPose([45, 67, 23], 0.8, 'technical_domain');
    const creativePose = new SemanticPose([12, 89, 56], 0.7, 'creative_domain');
    const socialPose = new SemanticPose([78, 34, 91], 0.9, 'social_domain');

    console.log('📍 Created semantic poses:');
    console.log(`   🔧 Technical: [${technicalPose.concept.join(', ')}] confidence=${technicalPose.confidence}`);
    console.log(`   🎨 Creative: [${creativePose.concept.join(', ')}] confidence=${creativePose.confidence}`);
    console.log(`   🤝 Social: [${socialPose.concept.join(', ')}] confidence=${socialPose.confidence}`);

    // Test distance calculations
    const techToCreative = technicalPose.distanceTo(creativePose);
    const techToSocial = technicalPose.distanceTo(socialPose);
    const creativeToSocial = creativePose.distanceTo(socialPose);

    console.log('\n📏 Semantic distances:');
    console.log(`   🔧→🎨 Technical to Creative: ${techToCreative.toFixed(2)}`);
    console.log(`   🔧→🤝 Technical to Social: ${techToSocial.toFixed(2)}`);
    console.log(`   🎨→🤝 Creative to Social: ${creativeToSocial.toFixed(2)}`);

    // Test compatibility
    console.log('\n🔄 Compatibility tests:');
    console.log(`   🔧↔🎨 Tech-Creative compatible: ${technicalPose.isCompatibleWith(creativePose)}`);
    console.log(`   🔧↔🤝 Tech-Social compatible: ${technicalPose.isCompatibleWith(socialPose)}`);
    console.log(`   🎨↔🤝 Creative-Social compatible: ${creativePose.isCompatibleWith(socialPose)}`);

    // Test domain transforms
    console.log('\n🌀 Domain transforms:');
    const transformedPose = technicalPose.transform('technical_domain', 'creative_domain');
    console.log(`   🔧→🎨 Technical to Creative: [${transformedPose.concept.join(', ')}] confidence=${transformedPose.confidence.toFixed(3)}`);
  }

  // Demonstrate agent message creation and processing
  demonstrateAgentMessaging(): void {
    console.log('\n📨 AGENT MESSAGING DEMONSTRATION');
    console.log('=====================================');

    const reasoningAgent = this.agents.get('reasoning')!;
    const creativeAgent = this.agents.get('creative')!;

    // Create sample reasoning steps
    const sampleReasoning = [
      {
        type: 'premise',
        concept: 'distributed_systems',
        content: 'Microservices require fault tolerance mechanisms',
        confidence: 0.9
      },
      {
        type: 'inference',
        concept: 'fault_tolerance',
        content: 'Circuit breakers prevent cascade failures',
        confidence: 0.8
      },
      {
        type: 'conclusion',
        concept: 'system_design',
        content: 'Implement circuit breaker pattern for resilience',
        confidence: 0.85
      }
    ];

    // Create semantic pose from reasoning
    const reasoningPose = new SemanticPose([45, 67, 23], 0.85, 'technical_domain');
    reasoningPose.updateWithReasoning(sampleReasoning);

    // Create message
    const message = reasoningAgent.createMessage(
      'REASONING_ANALYSIS',
      sampleReasoning,
      reasoningPose,
      0.85
    );

    console.log('📤 Created message:');
    console.log(`   👤 Sender: ${message.header.sender}`);
    console.log(`   📝 Type: ${message.type}`);
    console.log(`   🧠 Reasoning steps: ${message.reasoning.length}`);
    console.log(`   📊 Confidence: ${message.confidence}`);
    console.log(`   🎯 Semantic pose: [${message.semantic_pose.concept.slice(0, 3).join(', ')}...]`);

    // Process message with creative agent
    console.log('\n🔄 Processing message with creative agent...');
    creativeAgent.processIncomingMessage(message);

    const evidenceSummary = creativeAgent.getEvidenceSummary();
    console.log('📊 Creative agent evidence summary:');
    console.log(`   📚 Total evidence: ${evidenceSummary.total}`);
    console.log(`   ⭐ High confidence: ${evidenceSummary.highConfidence}`);
    console.log(`   📈 Average confidence: ${evidenceSummary.avgConfidence.toFixed(3)}`);

    // Generate reasoning vote
    console.log('\n🗳️ Generating reasoning vote...');
    const vote = creativeAgent.generateReasoningVote(creativeAgent.evidence);
    
    console.log('📤 Vote created:');
    console.log(`   👤 Voter: ${vote.header.sender}`);
    console.log(`   📝 Vote type: ${vote.type}`);
    console.log(`   📊 Vote confidence: ${vote.confidence.toFixed(3)}`);
    console.log(`   🎯 Vote reasoning steps: ${vote.reasoning.length}`);
  }

  // Demonstrate evidence aggregation
  demonstrateEvidenceAggregation(): void {
    console.log('\n🧩 EVIDENCE AGGREGATION DEMONSTRATION');
    console.log('=====================================');

    const reasoningAgent = this.agents.get('reasoning')!;
    const factualAgent = this.agents.get('factual')!;

    // Create multiple compatible reasoning chains
    const reasoningChains = [
      [
        {
          type: 'premise',
          concept: 'microservices',
          content: 'Microservices enable independent deployment',
          confidence: 0.9
        },
        {
          type: 'inference', 
          concept: 'scalability',
          content: 'Independent deployment improves scalability',
          confidence: 0.8
        }
      ],
      [
        {
          type: 'premise',
          concept: 'microservices',
          content: 'Microservices increase system complexity',
          confidence: 0.85
        },
        {
          type: 'inference',
          concept: 'complexity',
          content: 'Complexity requires better monitoring',
          confidence: 0.75
        }
      ]
    ];

    console.log('📝 Processing multiple reasoning chains...');

    reasoningChains.forEach((chain, index) => {
      const pose = new SemanticPose([40 + index * 5, 60 + index * 3, 20 + index * 2], 0.8, 'technical_domain');
      const message = reasoningAgent.createMessage(
        'REASONING_CHAIN',
        chain,
        pose,
        0.8
      );

      // Process with both agents
      reasoningAgent.processIncomingMessage(message);
      factualAgent.processIncomingMessage(message);
    });

    console.log('\n📊 Evidence aggregation results:');
    
    const reasoningEvidence = reasoningAgent.getEvidenceSummary();
    const factualEvidence = factualAgent.getEvidenceSummary();

    console.log(`   🔬 Reasoning agent: ${reasoningEvidence.total} evidence items, avg confidence ${reasoningEvidence.avgConfidence.toFixed(3)}`);
    console.log(`   📚 Factual agent: ${factualEvidence.total} evidence items, avg confidence ${factualEvidence.avgConfidence.toFixed(3)}`);

    // Show evidence compatibility
    const reasoningEvidenceList = Array.from(reasoningAgent.evidence.values());
    const factualEvidenceList = Array.from(factualAgent.evidence.values());

    if (reasoningEvidenceList.length > 0 && factualEvidenceList.length > 0) {
      const crossAgentCompatibility = this.checkCrossAgentCompatibility(
        reasoningEvidenceList[0],
        factualEvidenceList[0]
      );
      console.log(`   🔄 Cross-agent compatibility: ${crossAgentCompatibility.toFixed(3)}`);
    }
  }

  // Run complete Phase 1 demonstration
  runDemo(): void {
    console.log('🚀 CMP PHASE 1 DEMONSTRATION');
    console.log('=====================================\n');

    try {
      this.initializeAgents();
      this.demonstrateSemanticPoses();
      this.demonstrateAgentMessaging();
      this.demonstrateEvidenceAggregation();

      console.log('\n✅ PHASE 1 DEMONSTRATION COMPLETE');
      console.log('=====================================');
      console.log('🧠 Core CMP infrastructure verified:');
      console.log('   ✅ Semantic pose operations');
      console.log('   ✅ Agent message creation/processing');
      console.log('   ✅ Evidence aggregation');
      console.log('   ✅ Reasoning compatibility checks');
      console.log('   ✅ Cross-agent communication');
      
      console.log('\n🎯 READY FOR PHASE 2: Model Interface Layer');

    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  // Helper method
  private checkCrossAgentCompatibility(evidence1: any, evidence2: any): number {
    const pose1 = SemanticPose.fromData(evidence1.semantic_pose);
    const pose2 = SemanticPose.fromData(evidence2.semantic_pose);
    
    const distance = pose1.distanceTo(pose2);
    const maxDistance = 100; // Reasonable max for demo
    
    return Math.max(0, 1 - (distance / maxDistance));
  }
}
