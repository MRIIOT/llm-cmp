# Bayesian Evidence System - Technical Documentation

This directory contains a  Bayesian evidence system designed for probabilistic reasoning, belief updating, and evidence aggregation in the LLM-CMP (Large Language Model Consensus Modeling Platform) project. The system implements dynamic Bayesian networks with multiple inference methods, advanced conflict resolution, and multi-source evidence aggregation.

## System Architecture Overview

The Bayesian evidence system consists of five core components that work together to provide a complete probabilistic reasoning framework:

1. **BayesianNetwork** - Dynamic network construction and management
2. **BeliefUpdater** - Temporal belief state evolution
3. **ConflictResolver** - Evidence contradiction resolution
4. **EvidenceAggregator** - Multi-source evidence fusion
5. **InferenceEngine** - Probabilistic inference computation

## Component Details

### 1. BayesianNetwork (`bayesian-network.ts`)

The `BayesianNetwork` class implements a dynamic Bayesian network that can be automatically constructed from evidence patterns.

#### Key Features:
- **Dynamic Network Construction**: Automatically builds network topology from evidence relationships
- **Cycle Detection**: Ensures the network remains a Directed Acyclic Graph (DAG)
- **Topological Ordering**: Maintains efficient node ordering for inference
- **Entity Extraction**: Intelligently extracts entities and relationships from unstructured evidence

#### Core Methods:

**`constructFromEvidence(evidenceSet: Evidence[])`**
- Analyzes evidence to extract topics, sources, and entities
- Identifies relationships based on shared sources and co-occurrence patterns
- Builds network structure while preventing cycles
- Uses multiple entity extraction strategies:
  - Capitalized word detection (proper nouns)
  - Quoted term extraction
  - Key phrase pattern matching
  - Domain-specific term frequency analysis

**`addNode(node: BayesianNode)` and `addEdge(parentId, childId)`**
- Manages network structure with parent-child relationships
- Updates topological ordering after each modification
- Validates edge additions to prevent cycles

**`getConditionalProbability(nodeId, state, parentStates)`**
- Retrieves conditional probabilities from CPTs (Conditional Probability Tables)
- Falls back to base probabilities when CPT is unavailable
- Supports complex conditioning on multiple parent states

### 2. BeliefUpdater (`belief-updater.ts`)

The `BeliefUpdater` implements  belief revision algorithms that update probability distributions as new evidence arrives.

#### Update Methods:

**Bayesian Update**
- Classic Bayes' rule implementation: P(H|E) = P(E|H) × P(H) / P(E)
- Adjusts for source reliability and temporal factors
- Maintains full posterior distributions
- Formula: `posterior = (likelihood × prior) / marginal_likelihood`

**Jeffrey's Rule Update**
- Handles uncertain evidence with probability distributions over evidence states
- Decomposes evidence into multiple states (supports, opposes, uncertain)
- Updates beliefs using: P(H|E*) = Σ P(H|Ei) × P(Ei|E*)
- Particularly useful when evidence itself is probabilistic

**Pearl's Belief Propagation**
- Integrates with the Bayesian network for structured updates
- Adds evidence nodes dynamically to the network
- Performs exact inference using the InferenceEngine
- Maintains consistency across the entire belief network

**Minimal Change Update**
- Implements principle of minimal belief revision
- Minimizes KL divergence between old and new beliefs
- Uses sigmoid smoothing for large changes
- Conservative update strategy: `α = 2/(1 + exp(-2×diff)) - 1`

#### Advanced Features:

**Learning Dynamics**
- Adaptive learning rates based on belief change magnitude
- Momentum tracking from historical updates
- Formula: `new_belief = current + learning_rate × (proposed - current) + momentum`

**Belief Propagation**
- Propagates belief changes through related topics
- Computes influence based on network structure and semantic similarity
- Implements cascade effects for strongly connected beliefs

### 3. ConflictResolver (`conflict-resolver.ts`)

The `ConflictResolver` handles contradictions and inconsistencies in evidence using multiple resolution strategies.

#### Conflict Detection:

**Contradiction Detection**
- Pattern-based analysis for explicit negations
- Antonym pair recognition (e.g., positive/negative, success/failure)
- Confidence opposition detection for same topics
- Semantic analysis of opposing claims

**Inconsistency Detection**
- Logical proposition extraction and analysis
- Temporal inconsistency checking
- Rapid belief change detection

**Multi-way Conflicts**
- Groups evidence by topic
- Computes consensus metrics
- Identifies breakdown in group agreement

#### Resolution Strategies:

**Argumentation-Based Resolution**
- Builds formal argumentation frameworks
- Computes attack relationships between arguments
- Uses grounded semantics to find acceptable arguments
- Selects winning arguments based on strength and acceptability

**Negotiation-Based Resolution**
- Models evidence sources as negotiating agents
- Implements concession strategies
- Seeks convergent agreement through iterative rounds
- Tracks utility and minimum acceptable positions

**Voting-Based Resolution**
- Supports multiple voting methods:
  - Plurality: Simple majority wins
  - Borda Count: Ranked preference aggregation
  - Approval: Multi-winner selection
- Computes confidence based on voting margins

**Hierarchical Resolution**
- Builds authority hierarchies from source metadata
- Weights evidence by hierarchical position
- Supports primary/secondary/tertiary source classification

### 4. EvidenceAggregator (`evidence-aggregator.ts`)

The `EvidenceAggregator` combines evidence from multiple sources using  fusion techniques.

#### Aggregation Methods:

**Weighted Aggregation**
- Computes source-specific reliability weights
- Adjusts for expertise matching and temporal decay
- Formula: `weight = base_reliability × expertise_match × exp(-age/30)`
- Handles conflicts through configurable resolution

**Hierarchical Aggregation**
- Multi-level evidence fusion based on source hierarchy
- Processes evidence level by level (primary → secondary → tertiary)
- Combines beliefs with level-specific weights
- Preserves source authority relationships

**Opinion Pooling**
- Linear Opinion Pool: `belief = Σ(weight_i × belief_i) / Σweight_i`
- Logarithmic Opinion Pool: `belief = exp(Σ(weight_i × log(belief_i)) / Σweight_i)`
- Adaptive blending for extreme beliefs
- Handles both consensus and divergent opinions

#### Conflict Detection and Resolution:

**Conflict Scoring**
- Sentiment analysis for opposing viewpoints
- Opposite claim detection using linguistic patterns
- Confidence divergence measurement
- Returns normalized conflict scores [0,1]

**Dempster-Shafer Combination**
- Implements evidence theory for uncertain reasoning
- Handles conflicting mass functions
- Normalizes by conflict mass: `m(A) = Σ(m1(X) × m2(Y)) / (1 - K)`
- Where K is the conflict mass

### 5. InferenceEngine (`inference-engine.ts`)

The `InferenceEngine` performs probabilistic inference on the Bayesian network using multiple algorithms.

#### Inference Methods:

**Exact Inference (Variable Elimination)**
- Implements the variable elimination algorithm
- Optimizes elimination ordering using min-fill heuristic
- Factor manipulation operations:
  - Factor multiplication: Combines probability tables
  - Variable summation: Marginalizes out variables
  - Evidence application: Zeros inconsistent entries

**Gibbs Sampling (MCMC)**
- Markov Chain Monte Carlo approximation
- Samples from full conditionals given Markov blanket
- Burn-in period for chain convergence (10% of iterations)
- Computes posteriors from sample frequencies

**Variational Inference**
- Mean-field approximation for complex networks
- Iterative parameter optimization
- Convergence checking with configurable threshold
- Balances accuracy with computational efficiency

#### Additional Capabilities:

**Caching System**
- Memoizes inference results for repeated queries
- Cache key includes target, evidence, and method
- Significantly improves performance for repeated inference

**Marginal and Joint Computation**
- Computes marginal probabilities for individual nodes
- Calculates joint distributions for node sets
- Supports complex probabilistic queries

## Mathematical Foundations

### Bayes' Rule
The fundamental equation underlying belief updates:
```
P(H|E) = P(E|H) × P(H) / P(E)
```
Where:
- P(H|E) = Posterior probability of hypothesis given evidence
- P(E|H) = Likelihood of evidence given hypothesis
- P(H) = Prior probability of hypothesis
- P(E) = Marginal likelihood of evidence

### Jeffrey's Rule
For uncertain evidence with probability distribution over states:
```
P(H|E*) = Σi P(H|Ei) × P(Ei|E*)
```

### Dempster-Shafer Theory
For combining independent evidence sources:
```
m12(A) = Σ{B∩C=A} m1(B) × m2(C) / (1 - K)
```
Where K = Σ{B∩C=∅} m1(B) × m2(C) is the conflict mass

### KL Divergence Minimization
For minimal change updates:
```
D_KL(P||Q) = Σi P(i) × log(P(i)/Q(i))
```

## Integration Points

The Bayesian evidence system integrates with the broader LLM-CMP architecture:

1. **Evidence Collection**: Receives evidence from multiple LLM agents
2. **Belief State Management**: Maintains temporal belief evolution
3. **Conflict Resolution**: Handles contradictory agent outputs
4. **Uncertainty Quantification**: Provides calibrated uncertainty estimates
5. **Network Visualization**: Supports graphical representation of relationships

## Performance Considerations

- **Network Complexity**: O(n²) for cycle detection, O(n) for topological sort
- **Inference Complexity**: 
  - Exact: Exponential in treewidth
  - Sampling: Linear in iterations
  - Variational: Linear in network size
- **Memory Usage**: Stores full CPTs, belief histories, and inference cache
- **Optimization Strategies**:
  - Elimination ordering heuristics
  - Factor caching
  - Incremental updates
  - Sparse representations

## Usage Patterns

### Basic Belief Update
```typescript
const updater = new BeliefUpdater({ method: 'bayesian', learningRate: 0.1, momentum: 0.9 });
const update = updater.updateBelief('topic', evidence);
```

### Conflict Resolution
```typescript
const resolver = new ConflictResolver();
const conflicts = resolver.detectConflicts(evidenceArray);
const resolutions = resolver.resolveConflicts(evidenceArray, conflicts, { method: 'argumentation' });
```

### Evidence Aggregation
```typescript
const aggregator = new EvidenceAggregator();
aggregator.addSource({ id: 'agent1', reliability: 0.9, evidence: [...] });
const result = aggregator.aggregate({ method: 'hierarchical', conflictResolution: 'dempster-shafer' });
```

### Probabilistic Inference
```typescript
const engine = new InferenceEngine(network);
const result = engine.infer({ target: 'hypothesis', evidence: new Map([['observation', 'true']]), method: 'exact' });
```

## Future Enhancements

1. **Continuous Variables**: Extend beyond discrete states
2. **Temporal Dynamics**: Dynamic Bayesian Networks (DBN)
3. **Structure Learning**: Automatic network topology discovery
4. **Causal Inference**: Incorporate causal reasoning
5. **Approximate Inference**: Additional algorithms (BP, EP)
6. **Distributed Computation**: Parallel evidence processing
