// Response Parser
// Converts LLM responses back to CMP format with structured reasoning

import { SemanticPose } from '../core/semantic-pose';
import { LLM_AGENT_TYPES } from '../types';
import { ModelResponse } from './model-adapter';

export interface ParsedResponse {
  reasoning: ReasoningStep[];
  semantic_pose: SemanticPose;
  confidence: number;
  raw_response: string;
  token_usage: {
    total_tokens: number;
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: boolean;
}

export interface ReasoningStep {
  type: string;
  concept: string;
  content: string;
  confidence: number;
}

export class ResponseParser {
  
  parseToCMP(
    llmResponse: ModelResponse, 
    agentType: string, 
    originalPose?: SemanticPose
  ): ParsedResponse {
    try {
      const text = this.extractTextContent(llmResponse);
      
      // Parse into structured reasoning
      const reasoning = this.parseReasoningSteps(text, agentType);
      
      // Calculate confidence based on response quality
      const confidence = this.calculateResponseConfidence(text, reasoning);
      
      // Create semantic pose
      const semanticPose = this.createSemanticPose(reasoning, agentType, originalPose);
      
      return {
        reasoning,
        semantic_pose: semanticPose,
        confidence,
        raw_response: text,
        token_usage: {
          total_tokens: llmResponse.usage?.total_tokens || 0,
          input_tokens: llmResponse.usage?.input_tokens || llmResponse.usage?.prompt_tokens,
          output_tokens: llmResponse.usage?.output_tokens || llmResponse.usage?.completion_tokens
        }
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return this.createErrorResponse(llmResponse, error as Error);
    }
  }

  private extractTextContent(response: ModelResponse): string {
    return response.content || 'No content extracted';
  }

  private parseReasoningSteps(text: string, agentType: string): ReasoningStep[] {
    const lines = text.split('\n').filter(line => line.trim());
    const reasoning: ReasoningStep[] = [];
    
    let currentStep: ReasoningStep | null = null;
    
    for (const line of lines) {
      if (this.isReasoningStep(line)) {
        // Save previous step if exists
        if (currentStep) {
          reasoning.push(currentStep);
        }
        
        // Start new step
        currentStep = {
          type: this.inferStepType(line, agentType),
          concept: this.extractConcept(line),
          content: line.trim(),
          confidence: this.assessLineConfidence(line)
        };
      } else if (currentStep && line.trim()) {
        // Continue current step
        currentStep.content += ' ' + line.trim();
      }
    }
    
    // Add final step
    if (currentStep) {
      reasoning.push(currentStep);
    }
    
    // If no structured reasoning found, create a general step
    if (reasoning.length === 0) {
      reasoning.push({
        type: 'general_response',
        concept: 'unstructured_analysis',
        content: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        confidence: 0.5
      });
    }
    
    return reasoning;
  }

  private isReasoningStep(line: string): boolean {
    const patterns = [
      /^\d+\./,                    // "1. "
      /^[•\-\*]\s/,                // Bullet points
      /^[A-Z][a-z]+:\s/,           // "Premise:", "Conclusion:"
      /^Step \d+/i,                // "Step 1"
      /^[A-Z][A-Z\s]+:/,           // "KEY PREMISES:", "LOGICAL INFERENCE:"
      /^\*\*[^*]+\*\*:/,           // **Bold headers:**
      /^#{1,3}\s/,                 // Markdown headers
    ];
    
    return patterns.some(pattern => pattern.test(line.trim()));
  }

  private inferStepType(line: string, agentType: string): string {
    const lowerLine = line.toLowerCase();
    
    // Generic type keywords
    const typeKeywords: Record<string, string[]> = {
      'premise': ['premise', 'assumption', 'given', 'fact', 'foundation'],
      'inference': ['therefore', 'thus', 'follows', 'implies', 'reasoning', 'logic'],
      'conclusion': ['conclusion', 'result', 'summary', 'final', 'outcome'],
      'creative_idea': ['idea', 'alternative', 'creative', 'novel', 'innovation'],
      'implementation': ['code', 'implement', 'algorithm', 'function', 'technical'],
      'critique': ['issue', 'problem', 'limitation', 'concern', 'risk', 'weakness'],
      'fact': ['data', 'evidence', 'statistic', 'research', 'study'],
      'social_aspect': ['user', 'stakeholder', 'human', 'social', 'ethical', 'cultural'],
      'synthesis': ['integration', 'combination', 'synthesis', 'coordination']
    };
    
    // Check for keyword matches
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        return type;
      }
    }
    
    // Agent-specific defaults
    const agentDefaults: Record<string, string> = {
      [LLM_AGENT_TYPES.REASONING]: 'logical_step',
      [LLM_AGENT_TYPES.CREATIVE]: 'creative_insight',
      [LLM_AGENT_TYPES.FACTUAL]: 'factual_analysis',
      [LLM_AGENT_TYPES.CODE]: 'implementation_step',
      [LLM_AGENT_TYPES.SOCIAL]: 'social_consideration',
      [LLM_AGENT_TYPES.CRITIC]: 'critical_analysis',
      [LLM_AGENT_TYPES.COORDINATOR]: 'coordination_step'
    };
    
    return agentDefaults[agentType] || 'general_step';
  }

  private extractConcept(line: string): string {
    // Extract key concepts from the line
    const words = line.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !this.isStopWord(w));
    
    return words.slice(0, 3).join('_') || 'unknown_concept';
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 
      'have', 'their', 'said', 'each', 'which', 'them', 'than', 'many', 
      'some', 'time', 'very', 'when', 'much', 'can', 'our', 'would'
    ]);
    return stopWords.has(word);
  }

  private assessLineConfidence(line: string): number {
    const lowerLine = line.toLowerCase();
    
    // High confidence indicators
    const highConfidenceWords = ['clearly', 'obviously', 'definitely', 'proven', 'established', 'certain'];
    const highConfidenceScore = highConfidenceWords.some(word => lowerLine.includes(word)) ? 0.9 : 0;
    
    // Low confidence indicators  
    const lowConfidenceWords = ['might', 'possibly', 'unclear', 'uncertain', 'perhaps', 'maybe'];
    const lowConfidenceScore = lowConfidenceWords.some(word => lowerLine.includes(word)) ? 0.4 : 0;
    
    // Medium confidence indicators
    const mediumConfidenceWords = ['likely', 'probably', 'suggests', 'indicates', 'appears'];
    const mediumConfidenceScore = mediumConfidenceWords.some(word => lowerLine.includes(word)) ? 0.6 : 0;
    
    // Return highest applicable confidence, or default
    if (highConfidenceScore > 0) return highConfidenceScore;
    if (lowConfidenceScore > 0) return lowConfidenceScore;
    if (mediumConfidenceScore > 0) return mediumConfidenceScore;
    
    return 0.7; // Default confidence
  }

  private calculateResponseConfidence(text: string, reasoning: ReasoningStep[]): number {
    const factors = {
      length: Math.min(text.length / 1000, 1.0) * 0.2,
      structure: reasoning.length > 1 ? 0.3 : 0.1,
      specificity: this.countSpecificTerms(text) * 0.1,
      clarity: this.assessClarity(text) * 0.4
    };
    
    return Math.min(Object.values(factors).reduce((sum, val) => sum + val, 0), 1.0);
  }

  private countSpecificTerms(text: string): number {
    const technicalPatterns = [
      /\b\w+\(\)/g,                    // Function calls
      /\b[A-Z]{2,}/g,                  // Acronyms
      /\b\d+\.?\d*%?\b/g,              // Numbers/percentages
      /\b[a-z]+_[a-z]+\b/g,            // Snake_case terms
      /\b[A-Z][a-z]+[A-Z][a-z]+\b/g,   // CamelCase terms
    ];
    
    let count = 0;
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      count += matches ? matches.length : 0;
    });
    
    return Math.min(count / 20, 1.0); // Normalize to 0-1
  }

  private assessClarity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length === 0) return 0.1;
    
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // Optimal sentence length around 15-25 words (75-125 chars)
    if (avgLength >= 75 && avgLength <= 125) {
      return 0.9;
    } else if (avgLength >= 50 && avgLength <= 150) {
      return 0.7;
    } else {
      return 0.5;
    }
  }

  private createSemanticPose(
    reasoning: ReasoningStep[], 
    agentType: string, 
    originalPose?: SemanticPose
  ): SemanticPose {
    // Create concept vector from reasoning
    const conceptVector = reasoning.map(r => this.hashConcept(r.concept));
    
    // Calculate average confidence
    const avgConfidence = reasoning.length > 0 
      ? reasoning.reduce((sum, r) => sum + r.confidence, 0) / reasoning.length
      : 0.5;
    
    // Create specialization context
    const context = this.mapAgentToContext(agentType);
    
    return new SemanticPose(conceptVector, avgConfidence, context);
  }

  private hashConcept(concept: string): number {
    // Simple hash for concept mapping to numerical space
    return Array.from(concept).reduce((hash, char) => hash + char.charCodeAt(0), 0) % 100;
  }

  private mapAgentToContext(agentType: string): string {
    const contextMap: Record<string, string> = {
      [LLM_AGENT_TYPES.REASONING]: 'logical_domain',
      [LLM_AGENT_TYPES.CREATIVE]: 'creative_domain',
      [LLM_AGENT_TYPES.FACTUAL]: 'factual_domain',
      [LLM_AGENT_TYPES.CODE]: 'technical_domain',
      [LLM_AGENT_TYPES.SOCIAL]: 'social_domain',
      [LLM_AGENT_TYPES.CRITIC]: 'critical_domain',
      [LLM_AGENT_TYPES.COORDINATOR]: 'meta_domain'
    };
    
    return contextMap[agentType] || 'unknown_domain';
  }

  private createErrorResponse(response: ModelResponse, error: Error): ParsedResponse {
    return {
      reasoning: [{
        type: 'error',
        concept: 'processing_failure',
        content: `Failed to parse response: ${error.message}`,
        confidence: 0.1
      }],
      semantic_pose: new SemanticPose([0], 0.1, 'error_domain'),
      confidence: 0.1,
      raw_response: response.content || 'No content',
      token_usage: {
        total_tokens: response.usage?.total_tokens || 0
      },
      error: true
    };
  }
}
