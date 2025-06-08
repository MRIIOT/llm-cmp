/**
 * Logical Proof Validator
 * Provides formal verification of reasoning chains
 */

import {
  ReasoningChain,
  ReasoningStep,
  LogicalProof,
  Premise,
  LogicalStatement,
  InferenceRule,
  InferenceRuleApplication,
  Conclusion,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Contradiction,
  CompletenessCheck,
  COMMON_INFERENCE_RULES,
  Predicate,
  LogicalConnective
} from '../types/index.js';

export class LogicalProofValidator {
  private inferenceRules: Map<string, InferenceRule>;
  
  constructor() {
    this.inferenceRules = new Map();
    // Load common inference rules
    COMMON_INFERENCE_RULES.forEach(rule => {
      this.inferenceRules.set(rule.name, rule);
    });
  }
  
  /**
   * Validates a reasoning chain and generates a formal logical proof
   */
  validateReasoningChain(chain: ReasoningChain): LogicalProof {
    // Extract premises from observations and assumptions
    const premises = this.extractPremises(chain);
    
    // Identify inference rule applications
    const inferenceApplications = this.identifyInferences(chain, premises);
    
    // Extract conclusions
    const conclusions = this.extractConclusions(chain, inferenceApplications);
    
    // Check for contradictions
    const contradictions = this.findContradictions(premises, conclusions);
    
    // Validate the proof
    const validity = this.validateProof(premises, inferenceApplications, conclusions, contradictions);
    
    // Check completeness
    const completeness = this.checkCompleteness(chain, premises, inferenceApplications, conclusions);
    
    return {
      premises,
      inferenceRules: inferenceApplications,
      conclusions,
      validity,
      contradictions,
      completeness
    };
  }
  
  /**
   * Extract premises from reasoning steps
   */
  private extractPremises(chain: ReasoningChain): Premise[] {
    const premises: Premise[] = [];
    
    chain.steps.forEach(step => {
      if (step.type === 'observation' || step.supporting.length === 0) {
        const statement = step.logicalForm || this.createLogicalStatement(step);
        premises.push({
          id: `premise_${step.id}`,
          statement,
          source: step.id,
          type: step.type === 'observation' ? 'observation' : 'assumption',
          justification: step.content
        });
      }
    });
    
    return premises;
  }
  
  /**
   * Create a logical statement from a reasoning step
   */
  private createLogicalStatement(step: ReasoningStep): LogicalStatement {
    // Parse the step content to extract logical form
    const { predicates, connectives, formalNotation } = this.parseStepContent(step);
    
    return {
      id: `stmt_${step.id}`,
      content: step.content,
      formalNotation,
      predicates,
      quantifiers: [], // Could be enhanced to detect quantifiers
      connectives
    };
  }
  
  /**
   * Parse step content to extract logical components
   */
  private parseStepContent(step: ReasoningStep): {
    predicates: Predicate[],
    connectives: LogicalConnective[],
    formalNotation: string
  } {
    const predicates: Predicate[] = [];
    const connectives: LogicalConnective[] = [];
    let formalNotation = '';
    
    // Simple pattern matching for common logical structures
    const content = step.content.toLowerCase();
    
    // Detect implications
    if (content.includes('therefore') || content.includes('thus') || content.includes('hence')) {
      connectives.push({
        type: 'implies',
        operands: step.supporting
      });
      formalNotation = `${step.supporting.map(id => `P${id}`).join('∧')} → Q${step.id}`;
    }
    
    // Detect causal relationships
    if (content.includes('causes') || content.includes('leads to') || content.includes('results in')) {
      predicates.push({
        symbol: 'Causes',
        arity: 2,
        arguments: [step.concept, 'effect']
      });
      formalNotation = formalNotation || `Causes(${step.concept}, effect)`;
    }
    
    // Detect conditional relationships
    if (content.includes('if') && content.includes('then')) {
      connectives.push({
        type: 'implies',
        operands: ['antecedent', 'consequent']
      });
      formalNotation = formalNotation || 'P → Q';
    }
    
    // Default predicate if none detected
    if (predicates.length === 0) {
      predicates.push({
        symbol: step.concept.replace(/\s+/g, '_'),
        arity: 1,
        arguments: ['x']
      });
      formalNotation = formalNotation || `${step.concept}(x)`;
    }
    
    return { predicates, connectives, formalNotation };
  }
  
  /**
   * Identify inference rule applications in the reasoning chain
   */
  private identifyInferences(chain: ReasoningChain, premises: Premise[]): InferenceRuleApplication[] {
    const applications: InferenceRuleApplication[] = [];
    
    chain.steps.forEach(step => {
      // Any step with supporting steps is an inference
      if (step.supporting.length > 0) {
        // First check if the step already has an identified inference rule
        if (step.inferenceRule) {
          applications.push({
            rule: step.inferenceRule,
            premises: step.supporting,
            conclusion: step.id,
            substitutions: new Map(),
            valid: true
          });
        } else {
          // Try to match against known rules
          const application = this.matchInferenceRule(step, chain.steps);
          if (application) {
            applications.push(application);
          }
        }
      }
    });
    
    return applications;
  }
  
  /**
   * Match a reasoning step to an inference rule
   */
  private matchInferenceRule(step: ReasoningStep, allSteps: ReasoningStep[]): InferenceRuleApplication | null {
    // Get supporting steps
    const supportingSteps = step.supporting.map(id => 
      allSteps.find(s => s.id === id)
    ).filter(Boolean) as ReasoningStep[];
    
    // Try to match against known inference rules
    for (const [ruleName, rule] of this.inferenceRules) {
      const match = this.tryMatchRule(step, supportingSteps, rule);
      if (match) {
        return {
          rule,
          premises: supportingSteps.map(s => s.id),
          conclusion: step.id,
          substitutions: match.substitutions,
          valid: true
        };
      }
    }
    
    // If no exact match, create a custom inference
    return {
      rule: {
        name: 'Custom Inference',
        notation: `${supportingSteps.map(s => s.concept).join(', ')} ⊢ ${step.concept}`,
        premises: supportingSteps.map(s => s.id),
        conclusion: step.id,
        validity: 'valid' // Assume valid unless proven otherwise
      },
      premises: supportingSteps.map(s => s.id),
      conclusion: step.id,
      substitutions: new Map(),
      valid: true
    };
  }
  
  /**
   * Try to match a specific inference rule
   */
  private tryMatchRule(
    conclusion: ReasoningStep,
    premises: ReasoningStep[],
    rule: InferenceRule
  ): { substitutions: Map<string, string> } | null {
    // Simple pattern matching - could be enhanced with more sophisticated logic
    const substitutions = new Map<string, string>();
    
    // Check if number of premises matches
    if (premises.length !== rule.premises.length) {
      return null;
    }
    
    // For now, return a match for any rule with correct premise count
    // In a full implementation, this would do proper pattern matching
    return { substitutions };
  }
  
  /**
   * Extract conclusions from the reasoning chain
   */
  private extractConclusions(
    chain: ReasoningChain,
    inferences: InferenceRuleApplication[]
  ): Conclusion[] {
    const conclusions: Conclusion[] = [];
    
    // Find steps that are conclusions
    chain.steps.forEach(step => {
      // Include deduction, synthesis, and final inferences as conclusions
      if (step.type === 'synthesis' || step.type === 'deduction' || 
          (step.type === 'inference' && !chain.steps.some(s => s.supporting.includes(step.id)))) {
        
        const statement = step.logicalForm || this.createLogicalStatement(step);
        const derivedFrom = step.supporting.length > 0 ? step.supporting : [step.id];
        
        conclusions.push({
          id: `conclusion_${step.id}`,
          statement,
          derivedFrom,
          strength: this.determineConclussionStrength(step),
          confidence: step.confidence
        });
      }
    });
    
    return conclusions;
  }
  
  /**
   * Determine the strength of a conclusion
   */
  private determineConclussionStrength(step: ReasoningStep): 'necessary' | 'probable' | 'possible' {
    if (step.type === 'deduction' && step.confidence.mean > 0.9) {
      return 'necessary';
    } else if (step.confidence.mean > 0.7) {
      return 'probable';
    } else {
      return 'possible';
    }
  }
  
  /**
   * Find contradictions in the logical proof
   */
  private findContradictions(premises: Premise[], conclusions: Conclusion[]): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const allStatements = [
      ...premises.map(p => p.statement),
      ...conclusions.map(c => c.statement)
    ];
    
    // Check for direct contradictions (simplified)
    for (let i = 0; i < allStatements.length; i++) {
      for (let j = i + 1; j < allStatements.length; j++) {
        const stmt1 = allStatements[i];
        const stmt2 = allStatements[j];
        
        if (this.areContradictory(stmt1, stmt2)) {
          contradictions.push({
            statements: [stmt1.id, stmt2.id],
            type: 'direct',
            resolution: 'unresolved',
            explanation: `Statements "${stmt1.content}" and "${stmt2.content}" are contradictory`
          });
        }
      }
    }
    
    return contradictions;
  }
  
  /**
   * Check if two statements are contradictory
   */
  private areContradictory(stmt1: LogicalStatement, stmt2: LogicalStatement): boolean {
    // Simplified contradiction detection
    // In a full implementation, this would use proper logical analysis
    
    // Check for negation patterns
    if (stmt1.content.includes('not') && stmt2.content.includes(stmt1.content.replace('not ', ''))) {
      return true;
    }
    
    // Check for opposite predicates
    const opposites = [
      ['increase', 'decrease'],
      ['positive', 'negative'],
      ['true', 'false'],
      ['always', 'never']
    ];
    
    for (const [word1, word2] of opposites) {
      if ((stmt1.content.includes(word1) && stmt2.content.includes(word2)) ||
          (stmt1.content.includes(word2) && stmt2.content.includes(word1))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Validate the overall proof
   */
  private validateProof(
    premises: Premise[],
    inferences: InferenceRuleApplication[],
    conclusions: Conclusion[],
    contradictions: Contradiction[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check for contradictions
    if (contradictions.length > 0) {
      errors.push({
        type: 'contradiction',
        location: contradictions.flatMap(c => c.statements),
        description: `Found ${contradictions.length} contradiction(s) in the proof`,
        severity: 'critical'
      });
    }
    
    // Check for circular reasoning
    const circularDeps = this.findCircularDependencies(inferences);
    if (circularDeps.length > 0) {
      errors.push({
        type: 'circular_reasoning',
        location: circularDeps,
        description: 'Circular dependencies detected in reasoning',
        severity: 'critical'
      });
    }
    
    // Check inference validity
    inferences.forEach(inf => {
      if (!inf.valid) {
        errors.push({
          type: 'invalid_inference',
          location: [inf.conclusion],
          description: `Invalid application of ${inf.rule.name}`,
          severity: 'major'
        });
      }
    });
    
    // Check for weak inferences
    inferences.forEach(inf => {
      if (inf.rule.validity !== 'sound') {
        warnings.push({
          type: 'weak_inference',
          location: [inf.conclusion],
          description: `Inference using ${inf.rule.name} is not sound`
        });
      }
    });
    
    // Check for assumption-heavy reasoning
    const assumptionRatio = premises.filter(p => p.type === 'assumption').length / premises.length;
    if (assumptionRatio > 0.5) {
      warnings.push({
        type: 'assumption_heavy',
        location: premises.filter(p => p.type === 'assumption').map(p => p.source),
        description: `Proof relies heavily on assumptions (${(assumptionRatio * 100).toFixed(0)}%)`
      });
    }
    
    const isValid = errors.filter(e => e.severity === 'critical').length === 0;
    const isSoundCompound = isValid && warnings.length === 0;
    const isComplete = conclusions.length > 0 && premises.length > 0;
    
    return {
      isValid,
      isSoundCompound,
      isComplete,
      errors,
      warnings
    };
  }
  
  /**
   * Find circular dependencies in inferences
   */
  private findCircularDependencies(inferences: InferenceRuleApplication[]): string[] {
    const dependencies = new Map<string, Set<string>>();
    
    // Build dependency graph
    inferences.forEach(inf => {
      if (!dependencies.has(inf.conclusion)) {
        dependencies.set(inf.conclusion, new Set());
      }
      inf.premises.forEach(p => {
        dependencies.get(inf.conclusion)!.add(p);
      });
    });
    
    // Check for cycles using DFS
    const circular: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      
      const deps = dependencies.get(node) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            circular.push(node);
            return true;
          }
        } else if (recursionStack.has(dep)) {
          circular.push(node);
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const node of dependencies.keys()) {
      if (!visited.has(node)) {
        hasCycle(node);
      }
    }
    
    return circular;
  }
  
  /**
   * Check proof completeness
   */
  private checkCompleteness(
    chain: ReasoningChain,
    premises: Premise[],
    inferences: InferenceRuleApplication[],
    conclusions: Conclusion[]
  ): CompletenessCheck {
    const missingElements: string[] = [];
    
    // Check if all premises are justified
    const unjustifiedPremises = premises.filter(p => 
      p.type === 'assumption' && !p.justification
    );
    
    if (unjustifiedPremises.length > 0) {
      missingElements.push(`${unjustifiedPremises.length} unjustified premise(s)`);
    }
    
    // Check if all inferences are valid
    const invalidInferences = inferences.filter(inf => !inf.valid);
    if (invalidInferences.length > 0) {
      missingElements.push(`${invalidInferences.length} invalid inference(s)`);
    }
    
    // Check if conclusions are properly supported
    const unsupportedConclusions = conclusions.filter(c => 
      c.derivedFrom.length === 0
    );
    
    if (unsupportedConclusions.length > 0) {
      missingElements.push(`${unsupportedConclusions.length} unsupported conclusion(s)`);
    }
    
    return {
      allPremisesJustified: unjustifiedPremises.length === 0,
      allInferencesValid: invalidInferences.length === 0,
      conclusionsSupported: unsupportedConclusions.length === 0,
      missingElements
    };
  }
}

/**
 * Create a visual representation of the logical proof
 */
export function visualizeLogicalProof(proof: LogicalProof): string {
  let visualization = '\n╔══════════════════════════════════════════════════════════════════════╗\n';
  visualization += '║                        LOGICAL PROOF STRUCTURE                        ║\n';
  visualization += '╚══════════════════════════════════════════════════════════════════════╝\n\n';
  
  // Display premises
  visualization += '📋 PREMISES:\n';
  proof.premises.forEach((premise, idx) => {
    const icon = premise.type === 'axiom' ? '🔸' : 
                 premise.type === 'observation' ? '👁️' : 
                 premise.type === 'assumption' ? '💭' : '📌';
    visualization += `   ${idx + 1}. ${icon} [${premise.type.toUpperCase()}] ${premise.statement.formalNotation}\n`;
    visualization += `      "${premise.statement.content}"\n`;
    if (premise.justification) {
      visualization += `      Justification: ${premise.justification}\n`;
    }
    visualization += '\n';
  });
  
  // Display inference rules
  visualization += '\n⚙️ INFERENCE RULES APPLIED:\n';
  proof.inferenceRules.forEach((app, idx) => {
    const validIcon = app.valid ? '✅' : '❌';
    visualization += `   ${idx + 1}. ${validIcon} ${app.rule.name}: ${app.rule.notation}\n`;
    visualization += `      From: ${app.premises.join(', ')} → ${app.conclusion}\n`;
    if (app.substitutions.size > 0) {
      visualization += `      Substitutions: {${Array.from(app.substitutions.entries()).map(([k, v]) => `${k}=${v}`).join(', ')}}\n`;
    }
    visualization += '\n';
  });
  
  // Display conclusions
  visualization += '\n🎯 CONCLUSIONS:\n';
  proof.conclusions.forEach((conclusion, idx) => {
    const strengthIcon = conclusion.strength === 'necessary' ? '⭐' :
                        conclusion.strength === 'probable' ? '🔹' : '◇';
    visualization += `   ${idx + 1}. ${strengthIcon} [${conclusion.strength.toUpperCase()}] ${conclusion.statement.formalNotation}\n`;
    visualization += `      "${conclusion.statement.content}"\n`;
    visualization += `      Confidence: ${(conclusion.confidence.mean * 100).toFixed(1)}% `;
    visualization += `[${(conclusion.confidence.lower * 100).toFixed(0)}%-${(conclusion.confidence.upper * 100).toFixed(0)}%]\n`;
    visualization += `      Derived from: ${conclusion.derivedFrom.join(', ')}\n`;
    visualization += '\n';
  });
  
  // Display validation results
  visualization += '\n🔍 VALIDATION RESULTS:\n';
  const validityIcon = proof.validity.isValid ? '✅' : '❌';
  const soundnessIcon = proof.validity.isSoundCompound ? '✅' : '⚠️';
  const completenessIcon = proof.validity.isComplete ? '✅' : '⚠️';
  
  visualization += `   Validity: ${validityIcon} ${proof.validity.isValid ? 'Valid' : 'Invalid'}\n`;
  visualization += `   Soundness: ${soundnessIcon} ${proof.validity.isSoundCompound ? 'Sound' : 'Unsound'}\n`;
  visualization += `   Completeness: ${completenessIcon} ${proof.validity.isComplete ? 'Complete' : 'Incomplete'}\n`;
  
  if (proof.validity.errors.length > 0) {
    visualization += '\n   ❌ ERRORS:\n';
    proof.validity.errors.forEach(error => {
      visualization += `      • [${error.severity.toUpperCase()}] ${error.type}: ${error.description}\n`;
      visualization += `        Location: ${error.location.join(', ')}\n`;
    });
  }
  
  if (proof.validity.warnings.length > 0) {
    visualization += '\n   ⚠️ WARNINGS:\n';
    proof.validity.warnings.forEach(warning => {
      visualization += `      • ${warning.type}: ${warning.description}\n`;
    });
  }
  
  if (proof.contradictions.length > 0) {
    visualization += '\n   ⚡ CONTRADICTIONS:\n';
    proof.contradictions.forEach(contradiction => {
      visualization += `      • ${contradiction.type} contradiction between ${contradiction.statements.join(' and ')}\n`;
      visualization += `        ${contradiction.explanation}\n`;
      visualization += `        Resolution: ${contradiction.resolution}\n`;
    });
  }
  
  // Display completeness check
  visualization += '\n📊 COMPLETENESS CHECK:\n';
  visualization += `   • All premises justified: ${proof.completeness.allPremisesJustified ? '✅' : '❌'}\n`;
  visualization += `   • All inferences valid: ${proof.completeness.allInferencesValid ? '✅' : '❌'}\n`;
  visualization += `   • Conclusions supported: ${proof.completeness.conclusionsSupported ? '✅' : '❌'}\n`;
  
  if (proof.completeness.missingElements.length > 0) {
    visualization += `   • Missing elements: ${proof.completeness.missingElements.join(', ')}\n`;
  }
  
  visualization += '\n';
  return visualization;
}

/**
 * Create a logical dependency graph
 */
export function createLogicalDependencyGraph(proof: LogicalProof): string {
  let graph = '\n📊 LOGICAL DEPENDENCY GRAPH:\n\n';
  
  // Build a map of all nodes
  const nodeMap = new Map<string, { type: string, label: string }>();
  
  // Add premises
  proof.premises.forEach(p => {
    nodeMap.set(p.source, {
      type: 'premise',
      label: p.statement.formalNotation || p.statement.content.substring(0, 50) + '...'
    });
  });
  
  // Add inference conclusions
  proof.inferenceRules.forEach(inf => {
    const step = nodeMap.get(inf.conclusion);
    if (!step) {
      nodeMap.set(inf.conclusion, {
        type: 'inference',
        label: inf.rule.name
      });
    }
  });
  
  // Add conclusions
  proof.conclusions.forEach(c => {
    const sourceId = c.derivedFrom[0]; // Use first source as the primary
    nodeMap.set(sourceId, {
      type: 'conclusion',
      label: c.statement.formalNotation || c.statement.content.substring(0, 50) + '...'
    });
  });
  
  // Build adjacency list from inference rules
  const dependencies = new Map<string, string[]>();
  
  proof.inferenceRules.forEach(inf => {
    dependencies.set(inf.conclusion, inf.premises);
  });
  
  proof.conclusions.forEach(c => {
    if (c.derivedFrom.length > 1) {
      dependencies.set(c.id, c.derivedFrom);
    }
  });
  
  // Visualize as ASCII tree
  const visited = new Set<string>();
  const drawn = new Set<string>();
  
  const drawNode = (nodeId: string, indent: number = 0, isLast: boolean = true): string => {
    if (drawn.has(nodeId)) {
      return ' '.repeat(indent) + `↻ (see above: ${nodeId.substring(0, 20)}...)\n`;
    }
    
    drawn.add(nodeId);
    let result = ' '.repeat(indent);
    
    // Get node info
    const node = nodeMap.get(nodeId);
    if (!node) return '';
    
    // Determine icon based on type
    const icon = node.type === 'premise' ? '📋' :
                 node.type === 'inference' ? '⚙️' :
                 node.type === 'conclusion' ? '🎯' : '•';
    
    result += `${icon} ${node.label}\n`;
    
    // Draw dependencies
    const deps = dependencies.get(nodeId) || [];
    deps.forEach((dep, idx) => {
      const isLastDep = idx === deps.length - 1;
      const prefix = ' '.repeat(indent) + (isLastDep ? '└─ ' : '├─ ');
      result += prefix;
      result += drawNode(dep, indent + 4, isLastDep);
    });
    
    return result;
  };
  
  // Start from conclusions and work backwards
  if (proof.conclusions.length > 0) {
    proof.conclusions.forEach((c, idx) => {
      const sourceId = c.derivedFrom[0];
      graph += drawNode(sourceId);
      if (idx < proof.conclusions.length - 1) {
        graph += '\n';
      }
    });
  } else {
    // If no conclusions, show from inference rules
    const topLevel = Array.from(nodeMap.keys()).filter(id => 
      !Array.from(dependencies.values()).some(deps => deps.includes(id))
    );
    
    topLevel.forEach((nodeId, idx) => {
      graph += drawNode(nodeId);
      if (idx < topLevel.length - 1) {
        graph += '\n';
      }
    });
  }
  
  return graph;
}
