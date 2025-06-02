// ===============================================
// SEMANTIC POSE IMPLEMENTATION
// ===============================================

import { SemanticPoseData, ReasoningStep, KnowledgeFrame } from '../types/index.js';

export class SemanticPose {
  public concept: number[];
  public confidence: number;
  public context: string;
  public reasoning_path: string[];

  constructor(conceptPosition: number[], confidenceOrientation: number, contextFrame: string) {
    this.concept = conceptPosition;
    this.confidence = Math.max(0, Math.min(1, confidenceOrientation)); // Clamp [0,1]
    this.context = contextFrame;
    this.reasoning_path = [];
  }

  // Transform between knowledge domains
  transform(fromFrame: string, toFrame: string): SemanticPose {
    const transformMatrix = this.getFrameTransform(fromFrame, toFrame);
    const transformedConcept = this.applyTransform(this.concept, transformMatrix);
    
    return new SemanticPose(
      transformedConcept,
      this.confidence * transformMatrix.reliability,
      toFrame
    );
  }

  // Calculate semantic distance to another pose
  distanceTo(other: SemanticPose): number {
    if (this.concept.length !== other.concept.length) {
      // Pad shorter vector with zeros
      const maxLength = Math.max(this.concept.length, other.concept.length);
      const a = this.padVector(this.concept, maxLength);
      const b = this.padVector(other.concept, maxLength);
      return this.euclideanDistance(a, b);
    }
    
    return this.euclideanDistance(this.concept, other.concept);
  }

  // Check compatibility with another pose for reasoning merger
  isCompatibleWith(other: SemanticPose, threshold: number = 0.3): boolean {
    const distance = this.distanceTo(other);
    const contextCompatible = this.context === other.context || 
                            this.isRelatedContext(this.context, other.context);
    
    return distance < threshold && contextCompatible;
  }

  // Update pose based on new reasoning
  updateWithReasoning(reasoning: ReasoningStep[]): void {
    // Extract concepts from reasoning
    const newConcepts = reasoning.map(step => this.hashConcept(step.concept));
    
    // Blend with existing concept vector
    this.concept = this.blendConcepts(this.concept, newConcepts);
    
    // Update reasoning path
    this.reasoning_path.push(...reasoning.map(step => step.type));
    
    // Update confidence based on reasoning quality
    const reasoningConfidence = this.assessReasoningQuality(reasoning);
    this.confidence = this.combineConfidence(this.confidence, reasoningConfidence);
  }

  // Convert to serializable data
  toData(): SemanticPoseData {
    return {
      concept: [...this.concept],
      confidence: this.confidence,
      context: this.context,
      reasoning_path: [...this.reasoning_path]
    };
  }

  // Create from serializable data
  static fromData(data: SemanticPoseData): SemanticPose {
    const pose = new SemanticPose(data.concept, data.confidence, data.context);
    pose.reasoning_path = [...data.reasoning_path];
    return pose;
  }

  // Private helper methods
  private getFrameTransform(from: string, to: string): { matrix: number[][]; reliability: number } {
    // Simplified transform matrices between knowledge domains
    const transforms: Record<string, Record<string, { matrix: number[][]; reliability: number }>> = {
      'technical_domain': {
        'creative_domain': { matrix: [[0.7, 0.3], [0.2, 0.8]], reliability: 0.8 },
        'social_domain': { matrix: [[0.6, 0.4], [0.3, 0.7]], reliability: 0.7 }
      },
      'creative_domain': {
        'technical_domain': { matrix: [[0.8, 0.2], [0.3, 0.7]], reliability: 0.8 },
        'social_domain': { matrix: [[0.9, 0.1], [0.4, 0.6]], reliability: 0.9 }
      },
      'social_domain': {
        'technical_domain': { matrix: [[0.7, 0.3], [0.2, 0.8]], reliability: 0.7 },
        'creative_domain': { matrix: [[0.6, 0.4], [0.1, 0.9]], reliability: 0.9 }
      }
    };

    return transforms[from]?.[to] || { matrix: [[1, 0], [0, 1]], reliability: 1.0 };
  }

  private applyTransform(vector: number[], transform: { matrix: number[][]; reliability: number }): number[] {
    // Simple matrix multiplication for concept transformation
    const matrix = transform.matrix;
    const result: number[] = [];
    
    for (let i = 0; i < matrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < Math.min(vector.length, matrix[i].length); j++) {
        sum += vector[j] * matrix[i][j];
      }
      result.push(sum);
    }
    
    return result.length > 0 ? result : vector;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0)
    );
  }

  private padVector(vector: number[], length: number): number[] {
    const padded = [...vector];
    while (padded.length < length) {
      padded.push(0);
    }
    return padded;
  }

  private isRelatedContext(context1: string, context2: string): boolean {
    const relatedContexts: Record<string, string[]> = {
      'technical_domain': ['factual_domain', 'meta_reasoning'],
      'creative_domain': ['social_domain', 'meta_reasoning'],
      'factual_domain': ['technical_domain', 'meta_reasoning'],
      'social_domain': ['creative_domain', 'meta_reasoning'],
      'meta_reasoning': ['technical_domain', 'creative_domain', 'factual_domain', 'social_domain']
    };

    return relatedContexts[context1]?.includes(context2) || false;
  }

  private hashConcept(concept: string): number {
    // Simple hash function to map concepts to numbers
    return Array.from(concept).reduce((hash, char) => hash + char.charCodeAt(0), 0) % 100;
  }

  private blendConcepts(existing: number[], newConcepts: number[]): number[] {
    const maxLength = Math.max(existing.length, newConcepts.length);
    const blended: number[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const existingVal = existing[i] || 0;
      const newVal = newConcepts[i] || 0;
      // Weighted average favoring new information slightly
      blended.push(existingVal * 0.6 + newVal * 0.4);
    }
    
    return blended;
  }

  private assessReasoningQuality(reasoning: ReasoningStep[]): number {
    if (reasoning.length === 0) return 0.1;
    
    // Quality based on reasoning depth and confidence
    const avgConfidence = reasoning.reduce((sum, step) => sum + step.confidence, 0) / reasoning.length;
    const depthBonus = Math.min(reasoning.length * 0.1, 0.3);
    
    return Math.min(avgConfidence + depthBonus, 1.0);
  }

  private combineConfidence(conf1: number, conf2: number): number {
    // Bayesian confidence combination
    return conf1 + conf2 - (conf1 * conf2);
  }
}
