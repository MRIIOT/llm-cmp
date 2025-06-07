# Semantic Encoding System

This module provides semantic encoding capabilities for the HTM (Hierarchical Temporal Memory) system, replacing simple hash-based encoding with meaningful semantic representations.

## Overview

The semantic encoding system uses LLM-powered feature extraction to create Sparse Distributed Representations (SDRs) where semantically similar inputs produce overlapping bit patterns. This enables the HTM to learn and generalize across semantic concepts.

## Components

### 1. Semantic Types (`semantic-types.ts`)
Defines all interfaces and types used throughout the semantic encoding system:
- `SemanticFeatures` - Structure for extracted semantic features
- `SemanticEncodingConfig` - Configuration options
- Cache and mapping types

### 2. Feature Extractor (`semantic-feature-extractor.ts`)
Extracts semantic features from text using an LLM:
- Identifies concepts, categories, and relationships
- Analyzes semantic attributes (abstractness, specificity, etc.)
- Includes fallback extraction for when LLM is unavailable

### 3. Feature Cache (`semantic-feature-cache.ts`)
Manages caching and stable concept mappings:
- LRU cache for extracted features
- Similarity-based cache matching (85% threshold)
- Stable concept-to-column mappings for consistency

### 4. Semantic Encoder (`semantic-encoder.ts`)
Converts semantic features to SDRs:
- Maintains 2% sparsity
- Distributes active bits across semantic dimensions
- Ensures similar concepts produce overlapping patterns

## Usage

```typescript
import { SemanticEncoder } from './semantic/index.js';

// Initialize with LLM interface
const encoder = new SemanticEncoder(llmInterface);

// Encode text to SDR
const result = await encoder.encode("What is quantum computing?");
console.log(`Active bits: ${result.activeCount} (${result.sparsity * 100}% sparsity)`);
console.log(`Concepts: ${result.features.concepts.join(', ')}`);

// Encoding is a boolean array suitable for HTM
const sdr = result.encoding; // boolean[2048]
```

## Semantic Overlap

Similar queries produce overlapping SDRs:
```typescript
const enc1 = await encoder.encode("What is the impact of quantum computing?");
const enc2 = await encoder.encode("How does quantum computing affect things?");
const overlap = SemanticEncoder.calculateOverlap(enc1.encoding, enc2.encoding);
// overlap ≈ 0.7 (70% overlap for similar queries)
```

## Configuration

```typescript
const encoder = new SemanticEncoder(llmInterface, {
  numColumns: 2048,          // HTM column count
  sparsity: 0.02,           // 2% active bits
  columnsPerConcept: 20,    // Bits per concept
  maxCacheSize: 1000,       // Cache entries
  similarityThreshold: 0.85, // Cache match threshold
  llmTemperature: 0.3,      // LLM consistency
  llmMaxTokens: 500         // LLM response limit
});
```

## Testing

Run the test suite:
```bash
# Windows
test-semantic-encoder.bat

# Unix/Linux/Mac
./test-semantic-encoder.sh

# Direct
node dist/core/semantic/semantic-encoder.test.js
```

## Integration with HTM

The semantic encoder is integrated into the Agent's temporal context update:
```typescript
// In agent.ts
const encoding = await this.semanticEncoder.encodeWithFallback(query);
const output = this.htmRegion.compute(encoding, true);
```

This allows the HTM to learn semantic patterns rather than arbitrary hash patterns.
