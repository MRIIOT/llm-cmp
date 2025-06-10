# CURRENT TASK: Improve Semantic Encoding with Hierarchical Hashing and Sparse Distributed Thesaurus

## Objective
Enhance the semantic encoding system to capture relationships between related concepts (e.g., "volatility" and "currency" in financial contexts) while remaining domain-agnostic.

## Problem Statement
Current hash-based encoding treats semantically related concepts as completely distinct, resulting in no column overlap between related terms. This causes high anomaly scores even when topics are related.

## Solution Approach
Implement two complementary improvements:
1. **Hierarchical Hashing**: Multi-level encoding that creates natural overlap based on word structure
2. **Sparse Distributed Thesaurus**: Adaptive concept graph that learns relationships from co-occurrence

## Implementation Plan

### Edge Toggling Example
```
Initial state after query "currency volatility risks":
currency ←→ volatility (direct, weight: 1.0, active: true)
currency ←→ [risk:0.8] ←→ volatility (ghost, active: true)
currency ←→ [exchange:0.7] ←→ volatility (ghost, active: true)

After toggling currency→[risk]→volatility OFF:
currency ←→ volatility (direct, weight: 1.0, active: true)
currency ←→ [risk:0.8] ←→ volatility (ghost, active: false) ❌
currency ←→ [exchange:0.7] ←→ volatility (ghost, active: true)

Result: "risk" ghost path no longer contributes to column overlap
```

### Edge Toggling Impact on Encoding
```typescript
// Before toggling (all edges active)
encode("currency") → columns: [100, 200, 300, 400, 500]  
encode("volatility") → columns: [150, 250, 350, 450, 550]
// Overlap: [none from direct, but ghost tokens add shared columns]

// After toggling risk edge OFF
encode("currency") → columns: [100, 200, 300, 400, 500]
encode("volatility") → columns: [150, 250, 350, 480, 580]  
// Reduced overlap: risk-mediated columns no longer shared
```

### Edge Toggling Use Case Scenario
```typescript
// Debugging high anomaly scores
const stats = encoder.getRelationshipStatus();
console.log(stats); 
// Shows: currency→market→volatility is very active but noisy

// Temporarily disable the noisy path
encoder.toggleRelationship('currency', 'market', false);
encoder.toggleRelationship('market', 'volatility', false);

// Re-run encoding to see if anomaly improves
const newEncoding = encoder.encode("currency volatility");
// Now uses only direct edges and other ghost paths

// A/B test different configurations
const configA = stats.activeEdges;
const configB = toggleSomeEdges(configA);
// Compare anomaly detection performance
```

### Enhanced LLM Prompt Example for Ghost Tokens
```
Extract semantic features from: "What affects currency volatility in emerging markets?"

Return:
1. Main concepts (2-4 key terms)
2. Ghost tokens: 3-5 implicit conceptual bridges between the main concepts with confidence scores (0-1)
   - These should be terms that semantically connect the main concepts
   - Higher scores for stronger conceptual bridges

Expected format:
{
  "concepts": ["currency", "volatility", "emerging markets"],
  "ghostTokens": [
    {"token": "risk", "probability": 0.85, "type": "bridge"},
    {"token": "exchange rate", "probability": 0.75, "type": "bridge"},
    {"token": "economic instability", "probability": 0.70, "type": "context"},
    {"token": "speculation", "probability": 0.60, "type": "implicit"}
  ],
  "intent": "question",
  "domain_indicators": ["finance", "economics"]
}
```

### Phase 1: Hierarchical Hashing Implementation

#### 1. Create HierarchicalHashEncoder class
- [✅] Create new file: `src/core/semantic/hierarchical-hash-encoder.ts`
- [✅] Define interface for multi-level encoding
- [✅] Implement three hash levels:
  - [✅] Level 1: Character bigram hashing (columns 0-511)
  - [✅] Level 2: Full concept hashing (columns 512-1279)
  - [✅] Level 3: Character frequency signature (columns 1280-2047)

#### 2. Implement encoding methods
- [✅] `getBigrams(text: string): string[]` - Extract character pairs
- [✅] `getCharFrequency(text: string): string` - Create frequency signature
- [✅] `encodeHierarchical(concept: string): number[]` - Main encoding method
- [✅] Add configuration for column ranges per level

#### 3. Update SemanticEncoder integration
- [✅] Add `enableHierarchicalEncoding` flag to config
- [✅] Modify `encodeConcepts()` to use hierarchical encoder when enabled
- [✅] Ensure backward compatibility with existing encoding

#### 4. Test Checkpoint 1 - Hierarchical Encoding
- [✅] Create test demonstrating overlap between related words
- [✅] Verify "volatility" and "volatile" share bigram columns
- [✅] Verify "market" and "marketplace" share columns
- [✅] Measure overlap percentages
- [ ] **Human Test**: Run `npm test hierarchical-encoding` and verify overlap metrics

### Phase 2: Sparse Distributed Thesaurus with Ghost Token Implementation

#### 5. Enhance SemanticFeatures with Ghost Tokens
- [ ] Update `SemanticFeatures` interface to include ghost tokens:
  ```typescript
  interface GhostToken {
    token: string;
    probability: number;  // 0-1 confidence score
    type: 'bridge' | 'context' | 'implicit';
  }
  ```
- [ ] Modify LLM prompt template to extract ghost tokens:
  - [ ] Request implicit conceptual bridges between main concepts
  - [ ] Request confidence scores for each ghost token
  - [ ] Limit to 3-5 ghost tokens per query for efficiency
- [ ] Update `extractSemanticFeatures()` to parse ghost tokens from LLM response

#### 6. Create ConceptRelationshipGraph class
- [ ] Create new file: `src/core/semantic/concept-relationship-graph.ts`
- [ ] Define enhanced graph structure supporting ghost tokens:
  - [ ] Direct edges: concept-to-concept (from co-occurrence)
  - [ ] Ghost edges: concept-to-ghost-to-concept (from ghost tokens)
  - [ ] Edge weights: base weight × ghost token probability
  - [ ] Edge state: active/inactive toggle for each edge
  - [ ] Edge metadata: creation time, last activation, toggle history
- [ ] Define edge interface:
  ```typescript
  interface Edge {
    from: string;
    to: string;
    type: 'direct' | 'ghost';
    ghostToken?: GhostToken;
    weight: number;
    active: boolean;
    metadata: {
      created: Date;
      lastToggled?: Date;
      toggleCount: number;
      activationHistory: Array<{timestamp: Date, active: boolean}>;
    };
  }
  ```
- [ ] Implement methods:
  - [ ] `linkConcepts(concept1: string, concept2: string, weight: number)`
  - [ ] `linkConceptsViaGhost(concept1: string, ghost: GhostToken, concept2: string)`
  - [ ] `toggleEdge(concept1: string, concept2: string, active: boolean): boolean`
  - [ ] `toggleGhostEdge(concept1: string, ghost: string, concept2: string, active: boolean): boolean`
  - [ ] `toggleEdgesBatch(operations: Array<{from: string, to: string, active: boolean}>): number`
  - [ ] `getActiveEdges(): Array<{from: string, to: string, type: 'direct' | 'ghost', active: boolean, weight: number}>`
  - [ ] `getRelatedConcepts(concept: string, threshold: number, includeInactive?: boolean): Array<{concept: string, weight: number, path: string[], active: boolean}>`
  - [ ] `updateFromFeaturesWithGhosts(features: SemanticFeatures)` - Learn from both co-occurrence and ghost tokens
  - [ ] `getOverlapColumns(concept: string, relatedConcept: string, ghostProbability?: number): number[]` - Only uses active edges
  - [ ] `resetAllEdges(active: boolean): void` - Set all edges to active/inactive
- [ ] `analyzeEdgeEffectiveness(): EdgeAnalysis` - Returns metrics on edge contribution to encoding quality

#### 7. Implement ghost-enhanced adaptive learning with edge toggling
- [ ] Track both direct co-occurrence and ghost-mediated relationships
- [ ] Weight calculation formula:
  ```typescript
  effectiveWeight = edge.active ? 
    (directCoOccurrence + sum(ghostProbability * ghostFrequency)) : 
    0
  ```
- [ ] Implement multi-hop path finding through ghost tokens (respecting edge states)
- [ ] Edge toggle use cases:
  - [ ] Manual adjustment of semantic space by users
  - [ ] A/B testing different relationship configurations
  - [ ] Debugging anomaly detection issues
  - [ ] Temporarily disabling noisy relationships
- [ ] Decay mechanism that considers path types and edge activation history
- [ ] Add persistence for edges including their active/inactive states:
  ```typescript
  interface PersistedGraph {
    edges: Edge[];
    version: string;
    lastModified: Date;
    edgeStateHistory: {
      [edgeId: string]: Array<{
        timestamp: Date;
        active: boolean;
        reason?: string; // manual, decay, noise-reduction
      }>;
    };
  }
  ```

#### 8. Integrate with HierarchicalHashEncoder
- [ ] Create `GhostAwareHierarchicalEncoder` combining all approaches
- [ ] Add methods:
  - [ ] `encodeWithGhostRelationships(concept: string, features: SemanticFeatures): number[]`
  - [ ] `calculateGhostOverlap(ghostProbability: number, maxOverlap: number): number`
  - [ ] `updateConceptGraphWithGhosts(features: SemanticFeatures)`
- [ ] Configure overlap based on relationship strength:
  - [ ] Direct co-occurrence: 20% overlap
  - [ ] High-probability ghost (>0.7): 15% overlap
  - [ ] Medium-probability ghost (0.4-0.7): 10% overlap
  - [ ] Low-probability ghost (<0.4): 5% overlap

#### 9. Update SemanticEncoder for full integration
- [ ] Add `enableGhostTokens` flag to config
- [ ] Add `enableEdgeToggling` flag to config
- [ ] Modify LLM interaction to request ghost tokens
- [ ] Implement `encodeConceptsWithGhosts()` method
- [ ] Add ghost token and edge statistics to `getEnhancedStats()`:
  - [ ] Total edges (direct vs ghost)
  - [ ] Active vs inactive edge counts
  - [ ] Most toggled edges (potential noise indicators)
  - [ ] Ghost token effectiveness metrics
- [ ] Implement edge management interface:
  - [ ] `toggleRelationship(concept1: string, concept2: string, active: boolean)`
  - [ ] `toggleGhostRelationship(concept1: string, ghost: string, concept2: string, active: boolean)`
  - [ ] `getRelationshipStatus(): EdgeStatusReport`
  - [ ] `exportEdgeConfiguration(): EdgeConfig`
  - [ ] `importEdgeConfiguration(config: EdgeConfig): void`
  - [ ] `resetEdgeStates(): void`
  - [ ] `getEdgeHistory(concept1: string, concept2: string): EdgeHistory`
- [ ] Ensure single LLM call extracts both concepts and ghost tokens

#### 10. Test Checkpoint 2 - Ghost Token Relationships and Edge Toggling
- [ ] Create test sequence demonstrating ghost token mechanism:
  - [ ] Query: "What affects currency volatility?"
    - Concepts: ["currency", "volatility"]
    - Expected ghost tokens: ["risk":0.8, "exchange":0.7, "market":0.6]
  - [ ] Verify ghost tokens create weighted relationships
  - [ ] Test column overlap based on ghost probability levels
- [ ] Test edge toggling functionality:
  - [ ] Toggle currency→volatility edge OFF
  - [ ] Verify encoding shows no overlap when edge is inactive
  - [ ] Toggle edge back ON and verify overlap returns
  - [ ] Test ghost edge toggling (currency→risk→volatility)
  - [ ] Verify only active edges contribute to encoding
- [ ] Verify faster relationship building (single query vs multiple)
- [ ] Test that ghost-mediated relationships decay appropriately
- [ ] Measure improved anomaly reduction with ghost tokens
- [ ] Test edge state persistence across sessions
- [ ] **Human Test**: Run `npm test ghost-relationships` and verify probability-based overlap with edge control

### Phase 3: Integration Testing and Refinement

#### 10. Full HTM integration testing
- [ ] Update agent-demo.ts to show improved encoding
- [ ] Test with original volatility → currency sequence
- [ ] Verify reduced anomaly scores for related concepts
- [ ] Ensure unrelated concepts still show high anomaly
- [ ] **Human Test**: Run `npm run demo:agent` and observe anomaly scores

#### 11. Performance optimization
- [ ] Profile encoding performance
- [ ] Optimize hash calculations
- [ ] Add caching where beneficial
- [ ] Ensure encoding remains under 10ms per query

#### 12. Configuration and documentation
- [ ] Add configuration options to DEFAULT_SEMANTIC_CONFIG
- [ ] Document new encoding approach in CLAUDE.md
- [ ] Add examples of overlap patterns
- [ ] Create visualization of column distribution

### Success Criteria
1. Related concepts (e.g., "volatility" and "currency") share 20-30% of columns when directly co-occurring or connected via high-probability ghost tokens
2. Ghost-mediated relationships create 5-15% overlap based on probability
3. Unrelated concepts maintain <5% overlap
4. Encoding performance remains under 10ms (including ghost token processing)
5. Anomaly detection improves for related topic transitions
6. System remains fully domain-agnostic
7. Single query can establish relationships via ghost tokens (no multi-query requirement)
8. Edge toggling provides real-time control over semantic space without rebuilding the graph

### Current Status
✅ **Phase 1 Complete (except human testing)** - Hierarchical Hash Encoder implemented and integrated

### Next Steps
1. Human to run `npm test hierarchical-encoding` to verify the implementation
2. Once verified, proceed to Phase 2: Sparse Distributed Thesaurus Implementation

### Notes
- Hierarchical encoder successfully implemented with three levels of encoding
- Bigram level creates natural overlap between structurally similar words
- Full concept level maintains unique identity for each concept
- Frequency signature level captures statistical patterns
- Integration with SemanticEncoder complete - uses hierarchical encoding when enabled
- Backward compatibility maintained - original hash-based encoding still available
- Test file demonstrates expected overlap patterns between related concepts
- **Phase 2 Enhancement**: Ghost token mechanism will enable richer relationship building:
  - LLM extracts implicit conceptual bridges (ghost tokens) with probabilities
  - Example: "currency" ←→ [risk:0.8] ←→ "volatility"
  - Faster learning: relationships form from single query instead of requiring multiple co-occurrences
  - Probability-weighted overlap: stronger ghost tokens create more column sharing
  - **Edge toggling**: Each relationship can be activated/deactivated for fine-tuned control
  - Use cases: debugging, A/B testing, noise reduction, manual semantic space adjustment
  - Maintains domain-agnostic approach while capturing nuanced semantic relationships
