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
        model: 'gpt-4-turbo-preview',
        prompt: prompt,
        systemPrompt: this.getSystemPrompt(),
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        metadata: { 
          purpose: 'semantic_feature_extraction',
          textLength: text.length 
        }
      });

      return this.parseFeatures(response.content, text);
    } catch (error) {
      throw new SemanticEncodingException(
        SemanticEncodingError.LLM_EXTRACTION_FAILED,
        `Failed to extract semantic features: ${error instanceof Error ? error.message : String(error)}`,
        { text, error }
      );
    }
  }

  /**
   * Build the extraction prompt
   */
  private buildExtractionPrompt(text: string): string {
    return `Extract semantic features from this text for neural encoding.

TEXT: "${text}"

Provide a JSON response with:
{
  "concepts": [3-7 key concepts/entities, most important first],
  "categories": [2-4 high-level categories like "technology", "prediction", "analysis"],
  "attributes": {
    "abstractness": 0-1,      // How abstract vs concrete
    "specificity": 0-1,       // How specific vs general  
    "technicality": 0-1,      // Technical complexity
    "certainty": 0-1,         // Certainty level expressed
    "actionability": 0-1,     // Action-oriented vs descriptive
    "temporality": 0-1        // Past/present/future focus
  },
  "relationships": [key relationships like "analyzes", "predicts", "compares"],
  "intent": "question|statement|command|analysis",
  "complexity": 0-1,
  "temporalAspect": true/false
}

IMPORTANT:
- Be consistent across similar queries
- Focus on semantic meaning, not exact words
- Concepts should be single words or short phrases
- Categories should be broad domains
- Relationships should be verbs that connect concepts
- All numeric values must be between 0 and 1
- Return ONLY valid JSON, no additional text`;
  }

  /**
   * Get the system prompt for semantic analysis
   */
  private getSystemPrompt(): string {
    return `You are a semantic analysis expert. Extract consistent semantic features from text for neural encoding.

Key principles:
1. Consistency: Similar texts should produce similar features
2. Precision: Extract the most salient semantic information
3. Structure: Follow the exact JSON format requested
4. Normalization: All numeric values between 0-1

Focus on meaning and intent rather than surface-level word matching.`;
  }

  /**
   * Parse and validate the LLM response
   */
  private parseFeatures(content: string, originalText: string): SemanticFeatures {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
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
      throw new SemanticEncodingException(
        SemanticEncodingError.INVALID_FEATURES,
        `Failed to parse semantic features: ${error instanceof Error ? error.message : String(error)}`,
        { content, originalText, error }
      );
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

    if (validated.length < 3) {
      // If we don't have enough concepts, generate some defaults
      return ['general', 'concept', 'query', ...validated].slice(0, 3);
    }

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
    
    // Simple heuristics
    const isQuestion = text.includes('?') || text.toLowerCase().startsWith('what') || 
                      text.toLowerCase().startsWith('how') || text.toLowerCase().startsWith('why');
    
    const hasNumbers = /\d/.test(text);
    const hasTechnicalTerms = words.some(w => 
      w.includes('_') || w.includes('-') || w.length > 10
    );
    
    return {
      concepts: uniqueWords.slice(0, 5),
      categories: ['general', 'text'],
      attributes: {
        abstractness: 0.5,
        specificity: Math.min(words.length / 20, 1),
        technicality: hasTechnicalTerms ? 0.7 : 0.3,
        certainty: isQuestion ? 0.3 : 0.7,
        actionability: text.includes('do') || text.includes('make') ? 0.7 : 0.3,
        temporality: text.includes('will') || text.includes('future') ? 0.8 : 0.3
      },
      relationships: [],
      intent: isQuestion ? 'question' : 'statement',
      complexity: Math.min(words.length / 50, 1),
      temporalAspect: text.includes('when') || text.includes('time') || hasNumbers
    };
  }
}
