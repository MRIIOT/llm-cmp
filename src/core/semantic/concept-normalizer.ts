/**
 * Concept Normalizer
 * Uses LLM to normalize concepts to canonical forms and calculate semantic similarity
 */

import { LLMRequest, LLMResponse } from '../../types/index.js';
import { SemanticEncodingError, SemanticEncodingException } from './semantic-types.js';

/**
 * Normalized concept with metadata
 */
export interface NormalizedConcept {
  original: string;
  normalized: string;
  confidence: number;
}

/**
 * Concept similarity result
 */
export interface ConceptSimilarity {
  concept1: string;
  concept2: string;
  similarity: number;
  explanation?: string;
}

/**
 * Concept normalizer using LLM for domain-agnostic normalization
 */
export class ConceptNormalizer {
  private normalizationCache: Map<string, string>;
  private similarityCache: Map<string, number>;
  private readonly llmInterface: (request: LLMRequest) => Promise<LLMResponse>;

  constructor(llmInterface: (request: LLMRequest) => Promise<LLMResponse>) {
    this.llmInterface = llmInterface;
    this.normalizationCache = new Map();
    this.similarityCache = new Map();
  }

  /**
   * Normalize a concept to its canonical form using LLM
   */
  async normalize(concept: string): Promise<string> {
    const trimmedConcept = concept.trim();
    const lowerConcept = trimmedConcept.toLowerCase();
    
    // Check cache first
    if (this.normalizationCache.has(lowerConcept)) {
      return this.normalizationCache.get(lowerConcept)!;
    }

    try {
      const prompt = `Given the concept "${trimmedConcept}", provide the most canonical/standard form.

Rules:
- Use singular form unless inherently plural
- Use the most common technical term
- Expand common abbreviations
- Keep compound concepts together
- Preserve proper nouns as-is
- Return lowercase unless it's a proper noun

Return ONLY the canonical form, nothing else.`;

      const response = await this.llmInterface({
        model: 'gpt-3.5-turbo',
        prompt: prompt,
        systemPrompt: 'You are a linguistic expert specializing in concept normalization. Provide consistent canonical forms.',
        temperature: 0.1, // Very low for consistency
        maxTokens: 50,
        metadata: {
          purpose: "normalize-single"
        }
      });

      const normalized = response.content.trim();
      
      // Cache both original and normalized forms
      this.normalizationCache.set(lowerConcept, normalized);
      if (lowerConcept !== normalized.toLowerCase()) {
        this.normalizationCache.set(normalized.toLowerCase(), normalized);
      }

      return normalized;
    } catch (error) {
      throw new SemanticEncodingException(
        SemanticEncodingError.LLM_EXTRACTION_FAILED,
        `Failed to normalize concept: ${error instanceof Error ? error.message : String(error)}`,
        { concept, error }
      );
    }
  }

  /**
   * Normalize multiple concepts in batch
   */
  async normalizeMany(concepts: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Filter out already cached concepts
    const uncachedConcepts = concepts.filter(c => 
      !this.normalizationCache.has(c.toLowerCase().trim())
    );

    // Get cached results
    for (const concept of concepts) {
      const cached = this.normalizationCache.get(concept.toLowerCase().trim());
      if (cached) {
        results.set(concept, cached);
      }
    }

    // Process uncached concepts
    if (uncachedConcepts.length > 0) {
      // Batch normalization for efficiency
      try {
        const prompt = `Normalize the following concepts to their canonical forms:

${uncachedConcepts.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Rules:
- Use singular form unless inherently plural
- Use the most common technical term
- Expand common abbreviations
- Keep compound concepts together
- Preserve proper nouns as-is
- Return lowercase unless it's a proper noun

Return a JSON array with the normalized forms in the same order, like:
["normalized1", "normalized2", ...]`;

        const response = await this.llmInterface({
          model: 'gpt-3.5-turbo',
          prompt: prompt,
          systemPrompt: 'You are a linguistic expert. Provide consistent canonical forms in JSON format.',
          temperature: 0.1,
          maxTokens: 200,
          metadata: {
            purpose: "normalize-many"
          }
        });

        const normalized = JSON.parse(response.content.trim()) as string[];
        
        if (normalized.length !== uncachedConcepts.length) {
          throw new Error('Normalization count mismatch');
        }

        // Cache and store results
        for (let i = 0; i < uncachedConcepts.length; i++) {
          const original = uncachedConcepts[i];
          const norm = normalized[i];
          this.normalizationCache.set(original.toLowerCase().trim(), norm);
          results.set(original, norm);
        }
      } catch (error) {
        // Fallback to individual normalization
        for (const concept of uncachedConcepts) {
          try {
            const normalized = await this.normalize(concept);
            results.set(concept, normalized);
          } catch (err) {
            // Use original on error
            results.set(concept, concept.toLowerCase().trim());
          }
        }
      }
    }

    return results;
  }

  /**
   * Calculate semantic similarity between two concepts using LLM
   */
  async calculateSimilarity(concept1: string, concept2: string): Promise<number> {
    // Normalize concepts first
    const norm1 = await this.normalize(concept1);
    const norm2 = await this.normalize(concept2);
    
    // Check if they're identical after normalization
    if (norm1 === norm2) {
      return 1.0;
    }

    // Create cache key
    const cacheKey = [norm1, norm2].sort().join('|');
    
    // Check cache
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey)!;
    }

    try {
      const prompt = `Rate the semantic similarity between these two concepts on a scale of 0.0 to 1.0:

Concept 1: "${norm1}"
Concept 2: "${norm2}"

Guidelines:
- 1.0 = identical or interchangeable concepts
- 0.8-0.9 = very similar, same domain
- 0.5-0.7 = related but distinct
- 0.2-0.4 = loosely related
- 0.0-0.1 = unrelated

Consider:
- Domain overlap
- Hierarchical relationships (is-a, part-of)
- Functional similarity
- Contextual usage

Return ONLY a number between 0.0 and 1.0`;

      const response = await this.llmInterface({
        model: 'gpt-3.5-turbo',
        prompt: prompt,
        systemPrompt: 'You are an expert in semantic similarity. Provide consistent similarity scores.',
        temperature: 0.1,
        maxTokens: 10,
        metadata: {}
      });

      const similarity = parseFloat(response.content.trim());
      
      if (isNaN(similarity) || similarity < 0 || similarity > 1) {
        throw new Error('Invalid similarity score');
      }

      // Cache the result
      this.similarityCache.set(cacheKey, similarity);
      
      return similarity;
    } catch (error) {
      // Default to low similarity on error
      console.warn('Failed to calculate similarity:', error);
      return 0.1;
    }
  }

  /**
   * Calculate similarity matrix for multiple concepts
   */
  async calculateSimilarityMatrix(concepts: string[]): Promise<Map<string, Map<string, number>>> {
    const matrix = new Map<string, Map<string, number>>();
    
    // Initialize matrix
    for (const concept of concepts) {
      matrix.set(concept, new Map());
    }

    // Calculate pairwise similarities
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i; j < concepts.length; j++) {
        const similarity = i === j ? 1.0 : await this.calculateSimilarity(concepts[i], concepts[j]);
        
        matrix.get(concepts[i])!.set(concepts[j], similarity);
        if (i !== j) {
          matrix.get(concepts[j])!.set(concepts[i], similarity);
        }
      }
    }

    return matrix;
  }

  /**
   * Find similar concepts from a list
   */
  async findSimilarConcepts(
    targetConcept: string, 
    concepts: string[], 
    threshold: number = 0.5
  ): Promise<ConceptSimilarity[]> {
    const results: ConceptSimilarity[] = [];
    
    for (const concept of concepts) {
      if (concept === targetConcept) continue;
      
      const similarity = await this.calculateSimilarity(targetConcept, concept);
      if (similarity >= threshold) {
        results.push({
          concept1: targetConcept,
          concept2: concept,
          similarity
        });
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      normalizationCacheSize: this.normalizationCache.size,
      similarityCacheSize: this.similarityCache.size,
      totalCacheEntries: this.normalizationCache.size + this.similarityCache.size
    };
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.normalizationCache.clear();
    this.similarityCache.clear();
  }

  /**
   * Export cache for persistence
   */
  exportCache(): {
    normalizations: Array<[string, string]>;
    similarities: Array<[string, number]>;
  } {
    return {
      normalizations: Array.from(this.normalizationCache.entries()),
      similarities: Array.from(this.similarityCache.entries())
    };
  }

  /**
   * Import cache from persistence
   */
  importCache(data: {
    normalizations: Array<[string, string]>;
    similarities: Array<[string, number]>;
  }) {
    this.normalizationCache = new Map(data.normalizations);
    this.similarityCache = new Map(data.similarities);
  }
}
