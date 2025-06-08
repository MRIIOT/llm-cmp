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

### Phase 1: Hierarchical Hashing Implementation

#### 1. Create HierarchicalHashEncoder class
- [ ] Create new file: `src/core/semantic/hierarchical-hash-encoder.ts`
- [ ] Define interface for multi-level encoding
- [ ] Implement three hash levels:
  - [ ] Level 1: Character bigram hashing (columns 0-511)
  - [ ] Level 2: Full concept hashing (columns 512-1279) 
  - [ ] Level 3: Character frequency signature (columns 1280-2047)

#### 2. Implement encoding methods
- [ ] `getBigrams(text: string): string[]` - Extract character pairs
- [ ] `getCharFrequency(text: string): string` - Create frequency signature
- [ ] `encodeHierarchical(concept: string): number[]` - Main encoding method
- [ ] Add configuration for column ranges per level

#### 3. Update SemanticEncoder integration
- [ ] Add `enableHierarchicalEncoding` flag to config
- [ ] Modify `encodeConcepts()` to use hierarchical encoder when enabled
- [ ] Ensure backward compatibility with existing encoding

#### 4. Test Checkpoint 1 - Hierarchical Encoding
- [ ] Create test demonstrating overlap between related words
- [ ] Verify "volatility" and "volatile" share bigram columns
- [ ] Verify "market" and "marketplace" share columns
- [ ] Measure overlap percentages
- [ ] **Human Test**: Run `npm test hierarchical-encoding` and verify overlap metrics

### Phase 2: Sparse Distributed Thesaurus Implementation

#### 5. Create ConceptRelationshipGraph class
- [ ] Create new file: `src/core/semantic/concept-relationship-graph.ts`
- [ ] Define graph structure for concept relationships
- [ ] Implement methods:
  - [ ] `linkConcepts(concept1: string, concept2: string, weight: number)`
  - [ ] `getRelatedConcepts(concept: string, threshold: number): Array<{concept: string, weight: number}>`
  - [ ] `updateFromFeatures(features: SemanticFeatures)` - Learn from co-occurrence
  - [ ] `getOverlapColumns(concept: string, maxOverlap: number): number[]`

#### 6. Implement adaptive learning
- [ ] Track concept co-occurrence across queries
- [ ] Decay old relationships over time
- [ ] Implement weight normalization
- [ ] Add persistence mechanism (save/load graph)

#### 7. Integrate with HierarchicalHashEncoder
- [ ] Create `AdaptiveHierarchicalEncoder` combining both approaches
- [ ] Add methods:
  - [ ] `encodeWithRelationships(concept: string, features: SemanticFeatures): number[]`
  - [ ] `updateConceptGraph(features: SemanticFeatures)`
- [ ] Configure overlap percentage (default 20% for related concepts)

#### 8. Update SemanticEncoder for full integration
- [ ] Add `enableConceptGraph` flag to config
- [ ] Modify encoding pipeline to update concept graph
- [ ] Implement `encodeConceptsAdaptive()` method
- [ ] Add graph statistics to `getEnhancedStats()`

#### 9. Test Checkpoint 2 - Concept Relationships
- [ ] Create test sequence with related financial queries
- [ ] Verify "volatility" and "currency" develop shared columns after co-occurrence
- [ ] Test that unrelated concepts remain distinct
- [ ] Measure adaptation over multiple queries
- [ ] **Human Test**: Run `npm test concept-relationships` and verify adaptive overlap

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
1. Related concepts (e.g., "volatility" and "currency") share 20-30% of columns when they co-occur
2. Unrelated concepts maintain <5% overlap
3. Encoding performance remains under 10ms
4. Anomaly detection improves for related topic transitions
5. System remains fully domain-agnostic

### Current Status
⚠️ **Starting implementation** - No work begun yet

### Next Steps
1. Create HierarchicalHashEncoder class structure
2. Implement basic bigram extraction
3. Test with simple examples

### Notes
- Maintain backward compatibility with existing encoding
- Keep all improvements domain-agnostic (no pre-trained models)
- Focus on computational efficiency
- Test with diverse query types beyond financial examples
