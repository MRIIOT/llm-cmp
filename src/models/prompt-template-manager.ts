// Prompt Template Manager
// Manages specialized prompts for different agent types and message types

import { LLM_AGENT_TYPES } from '../types';

export interface PromptContext {
  query?: string;
  reasoning?: any[];
  context?: any;
  evidence?: any;
  votes?: any[];
}

export interface PromptTemplate {
  base: string;
  observation?: string;
  vote?: string;
  synthesis?: string;
}

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate>;

  constructor() {
    this.templates = this.initializeTemplates();
  }

  private initializeTemplates(): Map<string, PromptTemplate> {
    const templates = new Map<string, PromptTemplate>();

    // REASONING AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.REASONING, {
      base: `Analyze the following request using logical reasoning:

Request: {query}
Context: {context}

Please provide:
1. Key premises and assumptions
2. Logical inference steps  
3. Conclusions with confidence levels
4. Potential logical fallacies or weaknesses

Format your response as structured reasoning steps. Be precise and methodical.`,

      observation: `Process this observation and extract logical insights:

Observation: {reasoning}
Previous Context: {context}

Provide logical analysis of this observation and how it relates to existing knowledge. Focus on:
- Logical consistency
- Valid inferences
- Evidence strength`,

      vote: `Based on the evidence provided, generate a reasoning vote:

Evidence: {reasoning}
Quality Criteria: logical consistency, premise validity, conclusion strength

Rate the reasoning quality and provide your assessment with specific justifications.`
    });

    // CREATIVE AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.CREATIVE, {
      base: `Approach this request with creative thinking:

Request: {query}
Context: {context}

Please provide:
1. Alternative perspectives or framings
2. Novel approaches or solutions
3. Creative synthesis of ideas
4. Imaginative extensions or applications

Think outside conventional boundaries. Generate innovative ideas and unexpected connections.`,

      observation: `Creatively interpret this observation:

Observation: {reasoning}
Context: {context}

What creative insights, patterns, or opportunities do you see? Consider:
- Unexpected connections
- Alternative interpretations
- Novel applications`,

      vote: `Evaluate the creativity and innovation in this reasoning:

Reasoning: {reasoning}

Assess novelty, originality, and creative potential. Consider uniqueness and breakthrough thinking.`
    });

    // FACTUAL AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.FACTUAL, {
      base: `Provide factual analysis for this request:

Request: {query}
Context: {context}

Please provide:
1. Relevant facts and data points
2. Verified information sources
3. Statistical or empirical evidence
4. Accuracy and reliability assessment

Focus on verifiable, objective information with proper sourcing.`,

      observation: `Fact-check and analyze this observation:

Observation: {reasoning}
Context: {context}

Verify the factual accuracy and provide supporting or contradicting evidence.`,

      vote: `Assess the factual accuracy of this reasoning:

Reasoning: {reasoning}

Evaluate fact-checking, source reliability, and empirical support.`
    });

    // CODE AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.CODE, {
      base: `Provide a technical implementation approach:

Request: {query}
Context: {context}

Please provide:
1. Technical architecture overview
2. Key algorithms or data structures
3. Implementation considerations
4. Code examples where relevant
5. Performance and scalability factors

Focus on practical, implementable solutions with clean, efficient code.`,

      observation: `Analyze this from a technical implementation perspective:

Observation: {reasoning}
Context: {context}

Consider technical feasibility, implementation challenges, and code quality aspects.`,

      vote: `Evaluate the technical merit of this reasoning:

Reasoning: {reasoning}

Assess implementation feasibility, code quality, and technical soundness.`
    });

    // SOCIAL AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.SOCIAL, {
      base: `Consider the human and social aspects of this request:

Request: {query}
Context: {context}

Please provide:
1. Stakeholder analysis and human factors
2. Communication strategies
3. Social impact and ethical considerations
4. User experience and accessibility
5. Cultural and diversity implications

Focus on human-centered design and social responsibility.`,

      observation: `Analyze the social implications of this observation:

Observation: {reasoning}
Context: {context}

Consider human factors, social dynamics, and ethical implications.`,

      vote: `Evaluate the social awareness in this reasoning:

Reasoning: {reasoning}

Assess consideration of human factors, social impact, and ethical implications.`
    });

    // CRITIC AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.CRITIC, {
      base: `Critically analyze this request to identify potential issues:

Request: {query}
Context: {context}

Please provide:
1. Risk assessment and failure modes
2. Limitations and boundary conditions
3. Potential negative consequences
4. Missing considerations or blind spots
5. Improvement suggestions

Be thorough in identifying weaknesses and potential problems.`,

      observation: `Critically examine this observation for flaws:

Observation: {reasoning}
Context: {context}

Identify potential issues, limitations, and areas for improvement.`,

      vote: `Critically assess this reasoning for weaknesses:

Reasoning: {reasoning}

Identify logical flaws, missing evidence, and potential improvements.`
    });

    // COORDINATOR AGENT TEMPLATES
    templates.set(LLM_AGENT_TYPES.COORDINATOR, {
      base: `Coordinate and synthesize multiple perspectives on this request:

Request: {query}
Context: {context}

Please provide:
1. Integration of different viewpoints
2. Priority and importance assessment
3. Coordination strategy
4. Decision framework
5. Meta-level insights

Focus on high-level orchestration and synthesis of diverse perspectives.`,

      synthesis: `Synthesize these agent perspectives into a coherent response:

Query: {query}
Agent Votes: {votes}
Consensus Data: {context}

Provide:
1. Integrated summary of all perspectives
2. Identification of consensus and conflicts
3. Balanced final recommendation
4. Meta-analysis of the reasoning process

Create a unified response that leverages the strengths of each specialist.`
    });

    return templates;
  }

  buildPrompt(
    agentType: string, 
    messageType: string = 'base',
    context: PromptContext = {}
  ): string {
    const template = this.templates.get(agentType);
    if (!template) {
      throw new Error(`No template found for agent type: ${agentType}`);
    }

    let promptTemplate: string;
    switch (messageType) {
      case 'observation':
        promptTemplate = template.observation || template.base;
        break;
      case 'vote':
        promptTemplate = template.vote || template.base;
        break;
      case 'synthesis':
        promptTemplate = template.synthesis || template.base;
        break;
      default:
        promptTemplate = template.base;
    }

    // Replace template variables
    return this.replaceTemplateVariables(promptTemplate, context);
  }

  private replaceTemplateVariables(template: string, context: PromptContext): string {
    let result = template;

    // Replace common variables
    result = result.replace('{query}', context.query || 'No query provided');
    result = result.replace('{context}', this.formatContext(context.context));
    result = result.replace('{reasoning}', this.formatReasoning(context.reasoning));
    result = result.replace('{evidence}', this.formatEvidence(context.evidence));
    result = result.replace('{votes}', this.formatVotes(context.votes));

    return result;
  }

  private formatContext(context: any): string {
    if (!context) return 'No additional context';
    if (typeof context === 'string') return context;
    return JSON.stringify(context, null, 2);
  }

  private formatReasoning(reasoning: any[] | undefined): string {
    if (!reasoning || reasoning.length === 0) {
      return 'No reasoning provided';
    }

    return reasoning.map((step, index) => {
      if (typeof step === 'string') return `${index + 1}. ${step}`;
      if (step.content) return `${index + 1}. [${step.type || 'step'}] ${step.content}`;
      return `${index + 1}. ${JSON.stringify(step)}`;
    }).join('\n');
  }

  private formatEvidence(evidence: any): string {
    if (!evidence) return 'No evidence provided';
    if (typeof evidence === 'string') return evidence;
    return JSON.stringify(evidence, null, 2);
  }

  private formatVotes(votes: any[] | undefined): string {
    if (!votes || votes.length === 0) {
      return 'No votes provided';
    }

    return votes.map((vote, index) => {
      const agent = vote.header?.sender || `Agent ${index + 1}`;
      const confidence = vote.confidence || 0;
      const specialization = vote.header?.specialization || 'unknown';
      
      return `${agent} (${specialization}): Confidence ${confidence.toFixed(3)}`;
    }).join('\n');
  }

  // Get available message types for an agent
  getAvailableMessageTypes(agentType: string): string[] {
    const template = this.templates.get(agentType);
    if (!template) return ['base'];

    const types = ['base'];
    if (template.observation) types.push('observation');
    if (template.vote) types.push('vote');
    if (template.synthesis) types.push('synthesis');

    return types;
  }

  // Add custom template for specific use cases
  addCustomTemplate(agentType: string, messageType: string, template: string): void {
    const existing = this.templates.get(agentType) || { base: '' };
    (existing as any)[messageType] = template;
    this.templates.set(agentType, existing);
  }
}
