/**
 * Knowledge Domain System
 * Semantic pose transformation between knowledge frames and domain-specific operations
 */

import { SemanticPose } from '../types';
import { 
  KNOWLEDGE_FRAMES, 
  KnowledgeFrame, 
  areDomainsCompatible,
  AgentType,
  LLM_AGENT_TYPES
} from '../agents/agent-types';

export interface DomainTransform {
  sourceFrame: KnowledgeFrame;
  targetFrame: KnowledgeFrame;
  transformMatrix: number[][];
  reliability: number;
  preservationFactors: string[];
}

export interface DomainCompatibility {
  compatible: boolean;
  similarity: number;
  transformationCost: number;
  preservedConcepts: string[];
}

/**
 * Knowledge Domain Transformer
 * Handles semantic pose transformations between different knowledge domains
 */
export class KnowledgeDomainTransformer {
  private static transformMatrices: Map<string, DomainTransform> = new Map();
  
  static {
    this.initializeTransformMatrices();
  }

  /**
   * Transform semantic pose from one knowledge domain to another
   */
  static transform(
    pose: SemanticPose, 
    fromFrame: KnowledgeFrame, 
    toFrame: KnowledgeFrame
  ): SemanticPose {
    if (fromFrame === toFrame) {
      return { ...pose }; // No transformation needed
    }

    const transformKey = `${fromFrame}_to_${toFrame}`;
    const transform = this.transformMatrices.get(transformKey);
    
    if (!transform) {
      // If no direct transform exists, try indirect transformation
      return this.indirectTransform(pose, fromFrame, toFrame);
    }

    // Apply transformation matrix to concept vector
    const transformedConcept = this.applyTransformMatrix(pose.concept, transform.transformMatrix);
    
    // Adjust confidence based on transformation reliability
    const adjustedConfidence = pose.confidence * transform.reliability;

    return {
      concept: transformedConcept,
      confidence: adjustedConfidence,
      context: toFrame,
      reasoning_path: [...(pose.reasoning_path || []), `transform_${fromFrame}_to_${toFrame}`]
    };
  }

  /**
   * Check compatibility between two knowledge domains
   */
  static checkDomainCompatibility(
    domain1: KnowledgeFrame, 
    domain2: KnowledgeFrame
  ): DomainCompatibility {
    const compatible = areDomainsCompatible(domain1, domain2);
    const similarity = this.calculateDomainSimilarity(domain1, domain2);
    const transformationCost = this.calculateTransformationCost(domain1, domain2);
    const preservedConcepts = this.getPreservedConcepts(domain1, domain2);

    return {
      compatible,
      similarity,
      transformationCost,
      preservedConcepts
    };
  }

  /**
   * Get the native knowledge domain for an agent type
   */
  static getAgentNativeDomain(agentType: AgentType): KnowledgeFrame {
    const domainMap = {
      [LLM_AGENT_TYPES.REASONING]: KNOWLEDGE_FRAMES.TECHNICAL,
      [LLM_AGENT_TYPES.CREATIVE]: KNOWLEDGE_FRAMES.CREATIVE,
      [LLM_AGENT_TYPES.FACTUAL]: KNOWLEDGE_FRAMES.FACTUAL,
      [LLM_AGENT_TYPES.CODE]: KNOWLEDGE_FRAMES.TECHNICAL,
      [LLM_AGENT_TYPES.SOCIAL]: KNOWLEDGE_FRAMES.SOCIAL,
      [LLM_AGENT_TYPES.CRITIC]: KNOWLEDGE_FRAMES.META,
      [LLM_AGENT_TYPES.COORDINATOR]: KNOWLEDGE_FRAMES.META
    };

    return domainMap[agentType] || KNOWLEDGE_FRAMES.META;
  }

  /**
   * Apply domain-specific confidence adjustments
   */
  static adjustConfidenceForDomain(
    confidence: number,
    agentType: AgentType,
    targetDomain: KnowledgeFrame
  ): number {
    const nativeDomain = this.getAgentNativeDomain(agentType);
    
    if (nativeDomain === targetDomain) {
      // Agent is working in native domain - confidence boost
      return Math.min(confidence * 1.1, 1.0);
    }

    const compatibility = this.checkDomainCompatibility(nativeDomain, targetDomain);
    
    // Reduce confidence based on domain compatibility
    const domainPenalty = 1.0 - (compatibility.transformationCost * 0.2);
    
    return confidence * domainPenalty;
  }

  /**
   * Combine semantic poses from different domains
   */
  static combineCrossDomainPoses(
    poses: Array<{ pose: SemanticPose; domain: KnowledgeFrame; weight: number }>
  ): SemanticPose {
    if (poses.length === 0) {
      throw new Error('Cannot combine empty pose array');
    }

    if (poses.length === 1) {
      return { ...poses[0].pose };
    }

    // Transform all poses to META domain for combination
    const transformedPoses = poses.map(({ pose, domain, weight }) => {
      const transformedPose = domain === KNOWLEDGE_FRAMES.META 
        ? pose 
        : this.transform(pose, domain, KNOWLEDGE_FRAMES.META);
      
      return { pose: transformedPose, weight };
    });

    // Weighted combination of concept vectors
    const combinedConcept = this.combineConceptVectors(transformedPoses);
    
    // Weighted average of confidences
    const totalWeight = transformedPoses.reduce((sum, { weight }) => sum + weight, 0);
    const combinedConfidence = transformedPoses.reduce(
      (sum, { pose, weight }) => sum + (pose.confidence * weight), 
      0
    ) / totalWeight;

    // Combine reasoning paths
    const combinedReasoningPath = transformedPoses.flatMap(
      ({ pose }) => pose.reasoning_path || []
    );

    return {
      concept: combinedConcept,
      confidence: combinedConfidence,
      context: KNOWLEDGE_FRAMES.META,
      reasoning_path: [...new Set(combinedReasoningPath)] // Remove duplicates
    };
  }

  /**
   * Initialize transformation matrices between knowledge domains
   */
  private static initializeTransformMatrices(): void {
    // Technical to Creative transformation
    this.transformMatrices.set('technical_domain_to_creative_domain', {
      sourceFrame: KNOWLEDGE_FRAMES.TECHNICAL,
      targetFrame: KNOWLEDGE_FRAMES.CREATIVE,
      transformMatrix: [
        [0.6, 0.3, 0.1, 0.0, 0.0],
        [0.2, 0.7, 0.1, 0.0, 0.0],
        [0.1, 0.4, 0.8, 0.2, 0.1],
        [0.0, 0.1, 0.3, 0.9, 0.2],
        [0.1, 0.2, 0.2, 0.3, 0.8]
      ],
      reliability: 0.7,
      preservationFactors: ['innovation', 'problem_solving', 'systematic_thinking']
    });

    // Creative to Technical transformation
    this.transformMatrices.set('creative_domain_to_technical_domain', {
      sourceFrame: KNOWLEDGE_FRAMES.CREATIVE,
      targetFrame: KNOWLEDGE_FRAMES.TECHNICAL,
      transformMatrix: [
        [0.7, 0.2, 0.1, 0.0, 0.0],
        [0.3, 0.6, 0.1, 0.0, 0.0],
        [0.1, 0.1, 0.7, 0.1, 0.0],
        [0.0, 0.0, 0.2, 0.8, 0.1],
        [0.0, 0.1, 0.1, 0.2, 0.9]
      ],
      reliability: 0.6,
      preservationFactors: ['innovation', 'novel_approaches', 'alternative_solutions']
    });

    // Technical to Factual transformation
    this.transformMatrices.set('technical_domain_to_factual_domain', {
      sourceFrame: KNOWLEDGE_FRAMES.TECHNICAL,
      targetFrame: KNOWLEDGE_FRAMES.FACTUAL,
      transformMatrix: [
        [0.9, 0.1, 0.0, 0.0, 0.0],
        [0.1, 0.8, 0.1, 0.0, 0.0],
        [0.0, 0.1, 0.9, 0.0, 0.0],
        [0.0, 0.0, 0.1, 0.8, 0.1],
        [0.0, 0.0, 0.0, 0.2, 0.9]
      ],
      reliability: 0.85,
      preservationFactors: ['accuracy', 'verifiability', 'logical_consistency']
    });

    // Factual to Technical transformation
    this.transformMatrices.set('factual_domain_to_technical_domain', {
      sourceFrame: KNOWLEDGE_FRAMES.FACTUAL,
      targetFrame: KNOWLEDGE_FRAMES.TECHNICAL,
      transformMatrix: [
        [0.8, 0.2, 0.0, 0.0, 0.0],
        [0.2, 0.7, 0.1, 0.0, 0.0],
        [0.0, 0.1, 0.8, 0.1, 0.0],
        [0.0, 0.0, 0.1, 0.9, 0.0],
        [0.0, 0.0, 0.0, 0.1, 1.0]
      ],
      reliability: 0.8,
      preservationFactors: ['evidence_based', 'systematic_analysis', 'objectivity']
    });

    // Social to Creative transformation
    this.transformMatrices.set('social_domain_to_creative_domain', {
      sourceFrame: KNOWLEDGE_FRAMES.SOCIAL,
      targetFrame: KNOWLEDGE_FRAMES.CREATIVE,
      transformMatrix: [
        [0.5, 0.4, 0.1, 0.0, 0.0],
        [0.3, 0.6, 0.1, 0.0, 0.0],
        [0.2, 0.3, 0.7, 0.2, 0.1],
        [0.1, 0.2, 0.3, 0.8, 0.3],
        [0.0, 0.1, 0.2, 0.4, 0.9]
      ],
      reliability: 0.75,
      preservationFactors: ['human_centered', 'empathy', 'communication']
    });

    // Creative to Social transformation
    this.transformMatrices.set('creative_domain_to_social_domain', {
      sourceFrame: KNOWLEDGE_FRAMES.CREATIVE,
      targetFrame: KNOWLEDGE_FRAMES.SOCIAL,
      transformMatrix: [
        [0.6, 0.3, 0.1, 0.0, 0.0],
        [0.4, 0.5, 0.1, 0.0, 0.0],
        [0.1, 0.2, 0.6, 0.1, 0.0],
        [0.0, 0.1, 0.3, 0.7, 0.2],
        [0.0, 0.0, 0.2, 0.5, 0.8]
      ],
      reliability: 0.7,
      preservationFactors: ['innovation', 'alternative_perspectives', 'creative_solutions']
    });

    // All domains to Meta transformation
    [KNOWLEDGE_FRAMES.TECHNICAL, KNOWLEDGE_FRAMES.CREATIVE, KNOWLEDGE_FRAMES.FACTUAL, KNOWLEDGE_FRAMES.SOCIAL].forEach(frame => {
      this.transformMatrices.set(`${frame}_to_meta_reasoning`, {
        sourceFrame: frame,
        targetFrame: KNOWLEDGE_FRAMES.META,
        transformMatrix: [
          [0.8, 0.1, 0.1, 0.0, 0.0],
          [0.1, 0.8, 0.1, 0.0, 0.0],
          [0.1, 0.1, 0.8, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.9, 0.1],
          [0.0, 0.0, 0.0, 0.1, 0.9]
        ],
        reliability: 0.9,
        preservationFactors: ['meta_analysis', 'synthesis', 'coordination']
      });
    });

    // Meta to all domains transformation
    [KNOWLEDGE_FRAMES.TECHNICAL, KNOWLEDGE_FRAMES.CREATIVE, KNOWLEDGE_FRAMES.FACTUAL, KNOWLEDGE_FRAMES.SOCIAL].forEach(frame => {
      this.transformMatrices.set(`meta_reasoning_to_${frame}`, {
        sourceFrame: KNOWLEDGE_FRAMES.META,
        targetFrame: frame,
        transformMatrix: [
          [0.7, 0.2, 0.1, 0.0, 0.0],
          [0.2, 0.7, 0.1, 0.0, 0.0],
          [0.1, 0.1, 0.7, 0.1, 0.0],
          [0.0, 0.0, 0.1, 0.8, 0.1],
          [0.0, 0.0, 0.0, 0.1, 0.8]
        ],
        reliability: 0.8,
        preservationFactors: ['high_level_insights', 'coordination', 'synthesis']
      });
    });
  }

  /**
   * Apply transformation matrix to concept vector
   */
  private static applyTransformMatrix(
    conceptVector: number[], 
    transformMatrix: number[][]
  ): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < transformMatrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < Math.min(conceptVector.length, transformMatrix[i].length); j++) {
        sum += conceptVector[j] * transformMatrix[i][j];
      }
      result.push(sum);
    }

    return result;
  }

  /**
   * Indirect transformation through META domain
   */
  private static indirectTransform(
    pose: SemanticPose,
    fromFrame: KnowledgeFrame,
    toFrame: KnowledgeFrame
  ): SemanticPose {
    // Transform to META first, then to target
    const metaPose = fromFrame === KNOWLEDGE_FRAMES.META 
      ? pose 
      : this.transform(pose, fromFrame, KNOWLEDGE_FRAMES.META);
    
    return toFrame === KNOWLEDGE_FRAMES.META 
      ? metaPose 
      : this.transform(metaPose, KNOWLEDGE_FRAMES.META, toFrame);
  }

  /**
   * Calculate similarity between two knowledge domains
   */
  private static calculateDomainSimilarity(
    domain1: KnowledgeFrame, 
    domain2: KnowledgeFrame
  ): number {
    if (domain1 === domain2) return 1.0;

    // Define similarity matrix
    const similarities = {
      [`${KNOWLEDGE_FRAMES.TECHNICAL}_${KNOWLEDGE_FRAMES.FACTUAL}`]: 0.8,
      [`${KNOWLEDGE_FRAMES.FACTUAL}_${KNOWLEDGE_FRAMES.TECHNICAL}`]: 0.8,
      [`${KNOWLEDGE_FRAMES.CREATIVE}_${KNOWLEDGE_FRAMES.SOCIAL}`]: 0.7,
      [`${KNOWLEDGE_FRAMES.SOCIAL}_${KNOWLEDGE_FRAMES.CREATIVE}`]: 0.7,
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.TECHNICAL}`]: 0.6,
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.FACTUAL}`]: 0.7,
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.CREATIVE}`]: 0.5,
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.SOCIAL}`]: 0.6
    };

    const key = `${domain1}_${domain2}`;
    return similarities[key] || similarities[`${domain2}_${domain1}`] || 0.3;
  }

  /**
   * Calculate transformation cost between domains
   */
  private static calculateTransformationCost(
    domain1: KnowledgeFrame, 
    domain2: KnowledgeFrame
  ): number {
    const similarity = this.calculateDomainSimilarity(domain1, domain2);
    return 1.0 - similarity;
  }

  /**
   * Get concepts preserved during domain transformation
   */
  private static getPreservedConcepts(
    domain1: KnowledgeFrame, 
    domain2: KnowledgeFrame
  ): string[] {
    const preservationMap = {
      [`${KNOWLEDGE_FRAMES.TECHNICAL}_${KNOWLEDGE_FRAMES.FACTUAL}`]: ['accuracy', 'logic', 'evidence'],
      [`${KNOWLEDGE_FRAMES.CREATIVE}_${KNOWLEDGE_FRAMES.SOCIAL}`]: ['innovation', 'human_factors', 'communication'],
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.TECHNICAL}`]: ['analysis', 'systematic_thinking'],
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.FACTUAL}`]: ['objectivity', 'synthesis'],
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.CREATIVE}`]: ['perspective', 'synthesis'],
      [`${KNOWLEDGE_FRAMES.META}_${KNOWLEDGE_FRAMES.SOCIAL}`]: ['coordination', 'perspective']
    };

    const key = `${domain1}_${domain2}`;
    return preservationMap[key] || preservationMap[`${domain2}_${domain1}`] || ['general_concepts'];
  }

  /**
   * Combine concept vectors with weights
   */
  private static combineConceptVectors(
    poses: Array<{ pose: SemanticPose; weight: number }>
  ): number[] {
    if (poses.length === 0) return [];

    const maxLength = Math.max(...poses.map(({ pose }) => pose.concept.length));
    const result: number[] = new Array(maxLength).fill(0);
    const totalWeight = poses.reduce((sum, { weight }) => sum + weight, 0);

    poses.forEach(({ pose, weight }) => {
      const normalizedWeight = weight / totalWeight;
      pose.concept.forEach((value, index) => {
        if (index < result.length) {
          result[index] += value * normalizedWeight;
        }
      });
    });

    return result;
  }

  /**
   * Get domain transformation statistics
   */
  static getDomainTransformationStats(): {
    totalTransforms: number;
    availablePaths: string[];
    averageReliability: number;
  } {
    const transforms = Array.from(this.transformMatrices.values());
    
    return {
      totalTransforms: transforms.length,
      availablePaths: Array.from(this.transformMatrices.keys()),
      averageReliability: transforms.reduce((sum, t) => sum + t.reliability, 0) / transforms.length
    };
  }
}
