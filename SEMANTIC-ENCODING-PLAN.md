# True Semantic Encoding Implementation Plan

## Problem
Current encoding is just a character-level hash that produces completely different patterns for semantically similar queries. This defeats HTM's pattern learning capabilities.

## Goal
Create true semantic encoding where similar meanings produce overlapping sparse distributed representations (SDRs), enabling the HTM to learn and generalize across semantic concepts.

## Implementation Strategy

### Phase 1: LLM-Powered Semantic Feature Extraction

#### 1.1 Semantic Feature Extraction Method
```typescript
interface SemanticFeatures {
  concepts: string[];           // Key concepts (3-7)
  categories: string[];         // High-level categories
  attributes: Map<string, number>; // Semantic attributes with weights
  relationships: string[];      // Relationships between concepts
  intent: string;              // Query intent type
  complexity: number;          // Complexity score 0-1
  temporalAspect: boolean;     // Has time-related elements
}

private async extractSemanticFeatures(
  text: string, 
  llmInterface: (request: LLMRequest) => Promise<LLMResponse>
): Promise<SemanticFeatures> {
  const prompt = `Extract semantic features from this text for neural encoding.

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

Be consistent across similar queries. Focus on semantic meaning, not exact words.`;

  const response = await llmInterface({
    model: 'gpt-4',
    prompt: prompt,
    systemPrompt: 'You are a semantic analysis expert. Extract consistent semantic features.',
    temperature: 0.3, // Low temperature for consistency
    maxTokens: 500
  });

  return JSON.parse(response.content);
}
```

#### 1.2 Feature Stability Cache
```typescript
class SemanticFeatureCache {
  private cache: Map<string, SemanticFeatures>;
  private conceptToColumns: Map<string, Set<number>>;
  
  constructor() {
    this.cache = new Map();
    this.conceptToColumns = new Map();
  }
  
  // Ensure consistent column assignments for concepts
  getConceptColumns(concept: string, totalColumns: number): number[] {
    if (!this.conceptToColumns.has(concept)) {
      // Assign ~20 columns per concept, distributed across space
      const columns = this.generateConceptColumns(concept, totalColumns);
      this.conceptToColumns.set(concept, new Set(columns));
    }
    return Array.from(this.conceptToColumns.get(concept)!);
  }
  
  private generateConceptColumns(concept: string, totalColumns: number): number[] {
    // Use consistent hash of concept (not query) for stability
    const conceptHash = this.stableHash(concept);
    const columns: number[] = [];
    
    // Generate 20 columns spread across the space
    for (let i = 0; i < 20; i++) {
      const column = (conceptHash + i * 97) % totalColumns;
      columns.push(column);
    }
    
    return columns;
  }
}
```

### Phase 2: Semantic to SDR Encoding

#### 2.1 Core Encoding Algorithm
```typescript
private async encodeSemanticForHTM(
  text: string,
  llmInterface: (request: LLMRequest) => Promise<LLMResponse>
): Promise<boolean[]> {
  const numColumns = 2048;
  const encoding = new Array(numColumns).fill(false);
  
  // Extract semantic features
  const features = await this.extractSemanticFeatures(text, llmInterface);
  
  // 1. Encode concepts (40% of active columns)
  let activeColumnCount = 0;
  const targetActive = Math.floor(numColumns * 0.02); // 2% sparsity
  const conceptColumns = Math.floor(targetActive * 0.4);
  
  features.concepts.forEach((concept, index) => {
    const weight = 1.0 - (index * 0.1); // Decay weight by importance
    const conceptCols = this.featureCache.getConceptColumns(concept, numColumns);
    const colsToActivate = Math.floor(conceptCols.length * weight);
    
    for (let i = 0; i < colsToActivate && activeColumnCount < conceptColumns; i++) {
      encoding[conceptCols[i]] = true;
      activeColumnCount++;
    }
  });
  
  // 2. Encode categories (20% of active columns)
  const categoryColumns = Math.floor(targetActive * 0.2);
  features.categories.forEach(category => {
    const categoryCols = this.featureCache.getConceptColumns(`_cat_${category}`, numColumns);
    const colsToActivate = Math.min(5, categoryCols.length);
    
    for (let i = 0; i < colsToActivate && activeColumnCount < conceptColumns + categoryColumns; i++) {
      encoding[categoryCols[i]] = true;
      activeColumnCount++;
    }
  });
  
  // 3. Encode attributes (20% of active columns)
  const attributeColumns = Math.floor(targetActive * 0.2);
  const attributeBase = 1000; // Start attributes in middle region
  
  features.attributes.forEach((value, attribute) => {
    const attrStart = attributeBase + this.attributeOffsets.get(attribute)!;
    const numActive = Math.floor(value * 5); // 0-5 columns per attribute
    
    for (let i = 0; i < numActive && activeColumnCount < conceptColumns + categoryColumns + attributeColumns; i++) {
      const col = (attrStart + i * 3) % numColumns;
      encoding[col] = true;
      activeColumnCount++;
    }
  });
  
  // 4. Encode relationships (10% of active columns)
  const relationColumns = Math.floor(targetActive * 0.1);
  features.relationships.forEach(rel => {
    const relCols = this.featureCache.getConceptColumns(`_rel_${rel}`, numColumns);
    if (relCols.length > 0 && activeColumnCount < targetActive - 5) {
      encoding[relCols[0]] = true;
      activeColumnCount++;
    }
  });
  
  // 5. Encode intent and complexity (10% of active columns)
  const metaStart = 1500;
  const intentOffset = this.intentOffsets.get(features.intent) || 0;
  encoding[(metaStart + intentOffset) % numColumns] = true;
  
  const complexityColumns = Math.floor(features.complexity * 5);
  for (let i = 0; i < complexityColumns; i++) {
    encoding[(metaStart + 20 + i) % numColumns] = true;
  }
  
  return encoding;
}
```

#### 2.2 Semantic Similarity Preservation
```typescript
// Initialize stable mappings
private initializeSemanticMappings(): void {
  // Attribute offsets (consistent across all queries)
  this.attributeOffsets = new Map([
    ['abstractness', 0],
    ['specificity', 10],
    ['technicality', 20],
    ['certainty', 30],
    ['actionability', 40],
    ['temporality', 50]
  ]);
  
  // Intent offsets
  this.intentOffsets = new Map([
    ['question', 0],
    ['statement', 5],
    ['command', 10],
    ['analysis', 15]
  ]);
}
```

### Phase 3: Integration with HTM

#### 3.1 Enhanced Temporal Context Update
```typescript
private async updateTemporalContext(query: string): Promise<TemporalContext> {
  // Use semantic encoding instead of hash-based
  const encoding = await this.encodeSemanticForHTM(query, this.llmInterface);
  
  // Process through HTM - now with meaningful patterns!
  const output = this.htmRegion.compute(encoding, true);
  
  // The HTM can now learn that:
  // - "What is AI?" and "Tell me about AI" have overlapping patterns
  // - "Quantum computing impact" and "Impact of quantum computing" are similar
  // - Related concepts activate nearby columns
  
  // ... rest of the method
}
```

### Phase 4: Optimization and Caching

#### 4.1 Semantic Feature Caching
```typescript
private async getCachedSemanticFeatures(
  text: string,
  llmInterface: (request: LLMRequest) => Promise<LLMResponse>
): Promise<SemanticFeatures> {
  // Check exact match cache
  if (this.semanticCache.has(text)) {
    return this.semanticCache.get(text)!;
  }
  
  // Check for similar queries (using simple similarity)
  const normalized = text.toLowerCase().trim();
  for (const [cached, features] of this.semanticCache.entries()) {
    if (this.calculateSimilarity(normalized, cached.toLowerCase()) > 0.85) {
      return features;
    }
  }
  
  // Extract new features
  const features = await this.extractSemanticFeatures(text, llmInterface);
  this.semanticCache.set(text, features);
  
  // Maintain cache size
  if (this.semanticCache.size > 1000) {
    const firstKey = this.semanticCache.keys().next().value;
    this.semanticCache.delete(firstKey);
  }
  
  return features;
}
```

### Phase 5: Testing and Validation

#### 5.1 Semantic Similarity Tests
```typescript
describe('Semantic Encoding', () => {
  it('should produce overlapping patterns for similar queries', async () => {
    const queries = [
      "What is the impact of quantum computing on encryption?",
      "How does quantum computing affect cryptography?",
      "Quantum computers and their effect on encryption methods"
    ];
    
    const encodings = await Promise.all(
      queries.map(q => encoder.encodeSemanticForHTM(q, mockLLM))
    );
    
    // Calculate overlap between encodings
    const overlap01 = calculateOverlap(encodings[0], encodings[1]);
    const overlap02 = calculateOverlap(encodings[0], encodings[2]);
    const overlap12 = calculateOverlap(encodings[1], encodings[2]);
    
    // Should have significant overlap (40-70%)
    expect(overlap01).toBeGreaterThan(0.4);
    expect(overlap02).toBeGreaterThan(0.4);
    expect(overlap12).toBeGreaterThan(0.4);
  });
  
  it('should produce different patterns for unrelated queries', async () => {
    const encoding1 = await encoder.encodeSemanticForHTM(
      "quantum computing encryption", mockLLM
    );
    const encoding2 = await encoder.encodeSemanticForHTM(
      "recipe for chocolate cake", mockLLM
    );
    
    const overlap = calculateOverlap(encoding1, encoding2);
    expect(overlap).toBeLessThan(0.2); // Little overlap
  });
});
```

## Benefits of This Approach

1. **True Semantic Understanding**: LLM extracts meaning, not just character patterns
2. **Generalization**: Similar concepts produce overlapping SDRs
3. **Domain Agnostic**: Works for any topic the LLM understands
4. **Stable Representations**: Same concepts always map to same columns
5. **HTM Learning**: The HTM can now learn meaningful sequences and patterns
6. **Controllable Sparsity**: Maintains proper 2% sparsity for HTM

## Implementation Priority

1. **Phase 1**: LLM semantic extraction (Critical)
2. **Phase 2**: SDR encoding algorithm (Critical)
3. **Phase 3**: HTM integration (Critical)
4. **Phase 4**: Caching optimization (Important)
5. **Phase 5**: Testing framework (Important)

## Estimated Complexity

- **Development Time**: 2-3 days
- **Additional LLM Calls**: 1 per unique query (cached)
- **Added Latency**: ~200-500ms per new query (cached: <1ms)
- **Memory Overhead**: ~10MB for concept/feature caches

## Success Metrics

- [ ] Semantic similarity preserved in encodings (>40% overlap)
- [ ] Unrelated queries have minimal overlap (<20%)
- [ ] HTM successfully learns semantic sequences
- [ ] Caching reduces LLM calls by >80%
- [ ] System generalizes across domains without retraining
