# Fix Concept Extraction in Reasoning Steps

## Problem
The `extractConcept` method in `agent.ts` was extracting meaningless words like "Okay," instead of actual semantic concepts from reasoning steps.

## Implementation Progress

### Phase 1: Update Reasoning Prompt Structure ✅
**Status: COMPLETE**

Updated `buildReasoningPrompt` method to:
- Request structured format: `[TYPE:CONCEPT] reasoning content`
- Provide clear examples and instructions
- Show how to build on previous steps

Updated `getSystemPrompt` method to:
- Reinforce the formatting rules
- List valid reasoning types
- Emphasize structured thinking

Created test file: `src/tests/test-structured-prompts.ts`

### Phase 2: Update Parser Implementation ✅
**Status: COMPLETE**

Updated `parseReasoningSteps` to:
- Use regex pattern `/^\[([A-Z_]+):([^\]]+)\]\s*(.+)$/` to match structured format
- Extract type, concept, and content separately
- Handle non-conforming lines gracefully with fallback
- Normalize types and concepts

Added helper methods:
- `normalizeType`: Maps prompt types to ReasoningType enum values
- `normalizeConcept`: Cleans and formats concepts (lowercase, underscores)
- `extractFallbackConcept`: Handles non-structured responses

### Phase 3: Enhanced Confidence & Relationships ✅
**Status: COMPLETE**

Implemented:
- **Type-based confidence scoring**: Different base confidence for each reasoning type
  - Observations: 0.85 (high confidence)
  - Deductions: 0.80
  - Inferences: 0.70
  - Predictions: 0.65 (lowest confidence)
- **Content-based adjustments**: Detect uncertainty/certainty markers in text
- **Smart relationship detection**: 
  - `findSupportingSteps`: Detects logical connectors (therefore, because, etc.)
  - `findRefutingSteps`: Detects contradictions (however, despite, etc.)

### Phase 4: Testing & Validation ✅
**Status: COMPLETE**

Test results show:
- ✅ LLM responds with correct structured format
- ✅ Parser correctly extracts concepts (e.g., "quantum_computing", "encryption_vulnerability")
- ✅ No more "Okay," type concepts
- ✅ Confidence scores vary by reasoning type
- ✅ Fallback handling for malformed responses

## Test Output Example

```
Step 1:
  Type: observation
  Concept: quantum_computing
  Content: Quantum computing represents a fundamental shift...
  Confidence: 0.85

Step 2:
  Type: analogy
  Concept: encryption_vulnerability
  Content: Current RSA and ECC encryption methods rely on...
  Confidence: 0.75
```

## Success Criteria

- [x] Updated prompts to request structured format
- [x] Parser correctly extracts concepts from structured format
- [x] Fallback handling for non-structured responses
- [x] No more "Okay," as concepts
- [x] Meaningful concept extraction
- [x] Better confidence scoring based on type and content
- [x] Proper relationship tracking between steps
- [x] Tests pass for common patterns

## Solution Summary

The fix involved:
1. **Structured Output**: Making LLMs output `[TYPE:CONCEPT]` format explicitly
2. **Robust Parsing**: Regex-based extraction with proper fallbacks
3. **Smart Confidence**: Type-based baseline with content analysis
4. **Relationship Tracking**: Detecting logical connections between steps

This approach is **domain-agnostic** and works for any subject matter, as the LLM provides appropriate concepts directly rather than relying on extraction heuristics.
