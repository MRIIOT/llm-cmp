# Fix Concept Extraction in Reasoning Steps

## Problem
The `extractConcept` method in `agent.ts` is extracting meaningless words like "Okay," instead of actual semantic concepts from reasoning steps.

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

### Phase 2: Update Parser Implementation ⚠️
**Status: IN PROGRESS**

Next step: Update `parseReasoningSteps` to handle the new structured format.

The parser needs to:
1. Use regex to match `[TYPE:CONCEPT]` pattern
2. Extract type, concept, and content separately
3. Handle non-conforming lines gracefully
4. Normalize types and concepts

### Phase 3: Enhanced Confidence & Relationships ⚠️
**Status: PENDING**

Will implement:
- Type-based confidence scoring
- Content-based confidence adjustments
- Smart relationship detection between steps

### Phase 4: Testing & Validation ⚠️
**Status: PENDING**

Need to:
- Run the test file to verify prompts work
- Test with actual LLM providers
- Verify concept extraction quality
- Check edge cases

## Current Focus

Working on Phase 2 - Updating the parser to handle structured responses properly.

## Success Criteria

- [x] Updated prompts to request structured format
- [ ] Parser correctly extracts concepts from structured format
- [ ] Fallback handling for non-structured responses
- [ ] No more "Okay," as concepts
- [ ] Meaningful concept extraction
- [ ] Better confidence scoring
- [ ] Proper relationship tracking
- [ ] Tests pass for common patterns
