/**
 * Semantic Feature Extractor
 * Uses LLM to extract semantic features from text for neural encoding
 */

import { LLMRequest, LLMResponse } from '../../types/index.js';
import { 
  SemanticFeatures, 
  SemanticEncodingError, 
  SemanticEncodingException,
  DEFAULT_SEMANTIC_CONFIG 
} from './semantic-types.js';

export class SemanticFeatureExtractor {
  private readonly llmInterface: (request: LLMRequest) => Promise<LLMResponse>;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(
    llmInterface: (request: LLMRequest) => Promise<LLMResponse>,
    temperature: number = DEFAULT_SEMANTIC_CONFIG.llmTemperature,
    maxTokens: number = DEFAULT_SEMANTIC_CONFIG.llmMaxTokens
  ) {
    this.llmInterface = llmInterface;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  /**
   * Extract semantic features from text using LLM
   */
  async extractFeatures(text: string): Promise<SemanticFeatures> {
    try {
      const prompt = this.buildExtractionPrompt(text);
      
      const response = await this.llmInterface({
        model: 'gpt-3.5-turbo', // More reliable for JSON generation
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
        temperature: 0.3, // Lower temperature for more consistent output
        maxTokens: this.maxTokens,
        metadata: { 
          purpose: 'semantic_feature_extraction',
          textLength: text.length 
        }
      });

      return this.parseFeatures(response.content, text);
    } catch (error) {
      // If LLM fails, use fallback immediately
      console.warn('LLM extraction error, using fallback:', error);
      return this.extractFallbackFeatures(text);
    }
  }

  /**
   * Build the extraction prompt
   */
  private buildExtractionPrompt(text: string): string {
    return `Extract semantic features from this text for neural encoding.

TEXT: "${text}"

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "concepts": ["concept1", "concept2", "concept3"],
  "categories": ["category1", "category2"],
  "attributes": {
    "abstractness": 0.5,
    "specificity": 0.5,
    "technicality": 0.5,
    "certainty": 0.5,
    "actionability": 0.5,
    "temporality": 0.5
  },
  "relationships": ["relationship1", "relationship2"],
  "intent": "statement",
  "complexity": 0.5,
  "temporalAspect": false
}

Requirements:
- concepts: 3-7 key concepts as strings
- categories: 2-4 broad categories as strings  
- attributes: all values must be numbers between 0 and 1
- relationships: action verbs as strings
- intent: must be one of: "question", "statement", "command", "analysis"
- complexity: number between 0 and 1
- temporalAspect: boolean true or false

CRITICAL: Return ONLY the JSON object, no other text.`;
  }

  /**
   * Get the system prompt for semantic analysis
   */
  private getSystemPrompt(): string {
    return `You are a semantic analysis expert that ALWAYS returns valid JSON.

CRITICAL RULES:
1. Return ONLY a JSON object, no markdown, no explanation, no extra text
2. Use double quotes for all strings
3. No trailing commas
4. All numeric values must be actual numbers between 0 and 1
5. Boolean values must be true or false (not "true" or "false")

Your task is to extract semantic features from text for neural encoding. Focus on meaning and intent rather than exact words.`;
  }

  /**
   * Parse and validate the LLM response
   */
  private parseFeatures(content: string, originalText: string): SemanticFeatures {
    try {
      // Clean the content to extract JSON
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object in the content
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, try the whole content
        jsonContent = content;
      } else {
        jsonContent = jsonMatch[0];
      }
      
      // Clean up common JSON issues
      // Remove trailing commas
      jsonContent = jsonContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      // Remove comments
      jsonContent = jsonContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      
      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        // If parsing still fails, try to fix common issues
        // Replace single quotes with double quotes
        jsonContent = jsonContent.replace(/'/g, '"');
        
        // Try parsing again
        parsed = JSON.parse(jsonContent);
      }
      
      // Validate and normalize the features
      const features: SemanticFeatures = {
        concepts: this.validateConcepts(parsed.concepts),
        categories: this.validateCategories(parsed.categories),
        attributes: this.validateAttributes(parsed.attributes),
        relationships: this.validateRelationships(parsed.relationships),
        intent: this.validateIntent(parsed.intent),
        complexity: this.validateNumber(parsed.complexity, 0.5),
        temporalAspect: Boolean(parsed.temporalAspect)
      };

      return features;
    } catch (error) {
      // If all parsing attempts fail, use fallback
      console.warn('Failed to parse LLM response, using fallback features:', error);
      return this.extractFallbackFeatures(originalText);
    }
  }

  /**
   * Validate concepts array
   */
  private validateConcepts(concepts: any): string[] {
    if (!Array.isArray(concepts)) {
      throw new Error('Concepts must be an array');
    }

    const validated = concepts
      .filter(c => typeof c === 'string' && c.trim().length > 0)
      .map(c => c.trim().toLowerCase())
      .slice(0, 7); // Maximum 7 concepts

    //if (validated.length < 3) {
      // If we don't have enough concepts, generate some defaults
    //  return ['general', 'concept', 'query', ...validated].slice(0, 3);
    //}

    return validated;
  }

  /**
   * Validate categories array
   */
  private validateCategories(categories: any): string[] {
    if (!Array.isArray(categories)) {
      return ['general', 'query'];
    }

    const validated = categories
      .filter(c => typeof c === 'string' && c.trim().length > 0)
      .map(c => c.trim().toLowerCase())
      .slice(0, 4); // Maximum 4 categories

    if (validated.length < 2) {
      return ['general', 'query', ...validated].slice(0, 2);
    }

    return validated;
  }

  /**
   * Validate attributes object
   */
  private validateAttributes(attributes: any): SemanticFeatures['attributes'] {
    const defaults = {
      abstractness: 0.5,
      specificity: 0.5,
      technicality: 0.5,
      certainty: 0.5,
      actionability: 0.5,
      temporality: 0.5
    };

    if (!attributes || typeof attributes !== 'object') {
      return defaults;
    }

    return {
      abstractness: this.validateNumber(attributes.abstractness, defaults.abstractness),
      specificity: this.validateNumber(attributes.specificity, defaults.specificity),
      technicality: this.validateNumber(attributes.technicality, defaults.technicality),
      certainty: this.validateNumber(attributes.certainty, defaults.certainty),
      actionability: this.validateNumber(attributes.actionability, defaults.actionability),
      temporality: this.validateNumber(attributes.temporality, defaults.temporality)
    };
  }

  /**
   * Validate relationships array
   */
  private validateRelationships(relationships: any): string[] {
    if (!Array.isArray(relationships)) {
      return [];
    }

    return relationships
      .filter(r => typeof r === 'string' && r.trim().length > 0)
      .map(r => r.trim().toLowerCase())
      .slice(0, 5); // Maximum 5 relationships
  }

  /**
   * Validate intent
   */
  private validateIntent(intent: any): SemanticFeatures['intent'] {
    const validIntents: SemanticFeatures['intent'][] = ['question', 'statement', 'command', 'analysis'];
    
    if (validIntents.includes(intent)) {
      return intent;
    }

    // Default based on common patterns
    return 'statement';
  }

  /**
   * Validate a number between 0 and 1
   */
  private validateNumber(value: any, defaultValue: number): number {
    const num = Number(value);
    
    if (isNaN(num)) {
      return defaultValue;
    }

    return Math.max(0, Math.min(1, num));
  }

  /**
   * Extract features with fallback to simpler extraction
   */
  async extractFeaturesWithFallback(text: string): Promise<SemanticFeatures> {
    try {
      return await this.extractFeatures(text);
    } catch (error) {
      console.warn('LLM extraction failed, using fallback:', error);
      return this.extractFallbackFeatures(text);
    }
  }

  /**
   * Simple fallback feature extraction without LLM
   */
  private extractFallbackFeatures(text: string): SemanticFeatures {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = Array.from(new Set(words));
    
    // Extract key concepts by finding important words
    const importantWords = uniqueWords
      .filter(w => !['this', 'that', 'what', 'which', 'when', 'where', 'have', 'been', 'will', 'from', 'with'].includes(w))
      .slice(0, 7);
    
    // Simple heuristics
    const isQuestion = text.includes('?') || /^(what|how|why|when|where|who|which)/i.test(text.trim());
    const isCommand = /^(create|design|build|make|analyze|evaluate|assess)/i.test(text.trim());
    const isAnalysis = text.toLowerCase().includes('analyze') || text.toLowerCase().includes('evaluate') || 
                      text.toLowerCase().includes('assess') || text.toLowerCase().includes('consider');
    
    const hasNumbers = /\d/.test(text);
    const hasTechnicalTerms = words.some(w => 
      w.includes('_') || w.includes('-') || w.length > 10 || 
      ['ai', 'technology', 'system', 'data', 'algorithm', 'model'].includes(w)
    );
    
    // Determine categories based on content
    const categories: string[] = ['general'];
    if (hasTechnicalTerms || text.toLowerCase().includes('technolog')) categories.push('technology');
    if (text.toLowerCase().includes('employ') || text.toLowerCase().includes('work')) categories.push('economics');
    if (text.toLowerCase().includes('social') || text.toLowerCase().includes('ethic')) categories.push('society');
    if (isAnalysis) categories.push('analysis');
    
    // Extract relationships (verbs)
    const verbs = words.filter(w => 
      ['analyze', 'impact', 'affect', 'change', 'create', 'develop', 'consider', 'evaluate'].some(v => w.includes(v))
    ).slice(0, 5);
    
    return {
      concepts: importantWords.length > 0 ? importantWords : ['general', 'query', 'analysis'],
      categories: categories.slice(0, 4),
      attributes: {
        abstractness: text.toLowerCase().includes('concept') || text.toLowerCase().includes('theor') ? 0.8 : 0.4,
        specificity: uniqueWords.length > 20 ? 0.7 : 0.3,
        technicality: hasTechnicalTerms ? 0.7 : 0.3,
        certainty: isQuestion ? 0.3 : 0.7,
        actionability: isCommand || verbs.length > 0 ? 0.7 : 0.3,
        temporality: text.includes('future') || text.includes('will') || text.includes('next') ? 0.8 : 0.3
      },
      relationships: verbs,
      intent: isQuestion ? 'question' : isCommand ? 'command' : isAnalysis ? 'analysis' : 'statement',
      complexity: Math.min(words.length / 30, 1),
      temporalAspect: text.includes('when') || text.includes('time') || text.includes('decade') || 
                     text.includes('year') || text.includes('future') || hasNumbers
    };
  }
}
