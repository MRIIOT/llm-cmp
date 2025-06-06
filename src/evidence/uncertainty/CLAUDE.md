# Uncertainty Quantification Module - Technical Documentation

## Overview

The uncertainty quantification module provides a comprehensive framework for measuring, decomposing, analyzing, and representing various forms of uncertainty in belief states and evidence. This module implements state-of-the-art statistical and information-theoretic methods to distinguish between different types of uncertainty and provide actionable insights for decision-making under uncertainty.

## Module Architecture

The module consists of four interconnected components:

1. **confidence-intervals.ts** - Statistical interval estimation
2. **epistemic-uncertainty.ts** - Knowledge uncertainty decomposition
3. **sensitivity-analysis.ts** - Parameter sensitivity and robustness analysis
4. **uncertainty-metrics.ts** - Comprehensive uncertainty measurement

## Theoretical Foundations

### Uncertainty Taxonomy

The module distinguishes between two fundamental types of uncertainty:

**Aleatoric Uncertainty** (Irreducible)
- Inherent randomness in the system
- Cannot be reduced with more data
- Examples: Measurement noise, natural variability

**Epistemic Uncertainty** (Reducible)
- Uncertainty due to lack of knowledge
- Can be reduced with more data or better models
- Examples: Model uncertainty, parameter uncertainty

### Mathematical Framework

The total uncertainty is modeled as:

```
U_total = √(U_aleatoric² + U_epistemic²)
```

Where each component is further decomposed into sub-components based on information theory, statistical variance, and structural analysis.

## Component Details

### 1. Confidence Intervals (confidence-intervals.ts)

This module implements multiple methods for computing confidence intervals around belief estimates.

#### Core Functionality

**ConfidenceInterval Interface**
```typescript
interface ConfidenceInterval {
  lower: number;      // Lower bound
  upper: number;      // Upper bound
  confidence: number; // Confidence level (e.g., 0.95)
  method: string;     // Method used
}
```

#### Implemented Methods

**1. Normal Approximation**
- Uses Central Limit Theorem
- Formula: `CI = p ± z * √(p(1-p)/n)`
- Best for large samples (n > 30)
- Assumptions: Normal distribution of estimates

**2. Wilson Score Interval**
- Better for proportions near 0 or 1
- Accounts for binomial nature of data
- Formula includes continuity correction
- Preferred for binary outcomes

**3. Bootstrap Confidence Intervals**
- Non-parametric approach
- Resamples data with replacement
- Computes percentiles of bootstrap distribution
- Robust to non-normal distributions

**4. Bayesian Credible Intervals**
- Uses posterior distribution
- Beta conjugate prior for binary outcomes
- Highest Density Interval (HDI) computation
- Incorporates prior knowledge

#### Advanced Features

**Profile Likelihood Intervals**
- Based on likelihood ratio statistics
- Asymptotically exact
- Handles complex parameter spaces
- Chi-square critical values for boundaries

**Prediction Intervals**
- Accounts for future variability
- Formula: `PI = prediction ± z * √(σ²_param + σ²_future)`
- Coverage probability estimation
- Cross-validation for actual coverage

**Simultaneous Intervals**
- Bonferroni correction for multiple comparisons
- Family-wise error rate control
- Individual confidence: `α_i = 1 - (1 - α_family)/k`

**Tolerance Intervals**
- Contains specified proportion of population
- Two-sided tolerance factors
- Order statistics approach
- Accounts for sample size uncertainty

### 2. Epistemic Uncertainty (epistemic-uncertainty.ts)

This module specializes in decomposing and quantifying knowledge-based uncertainty.

#### Core Components

**EpistemicComponents Interface**
```typescript
interface EpistemicComponents {
  modelUncertainty: number;        // From model selection
  parameterUncertainty: number;    // From parameter estimation
  structuralUncertainty: number;   // From missing relationships
  approximationUncertainty: number; // From computational limits
  total: number;                   // Combined epistemic
}
```

#### Decomposition Methods

**Model Uncertainty**
- Entropy of posterior distribution
- Formula: `H = -Σ p_i * log₂(p_i)`
- Normalized by maximum entropy
- Captures model selection uncertainty

**Parameter Uncertainty**
- Coefficient of variation in estimates
- Accounts for evidence variability
- Formula: `CV = σ/μ`
- Bounded to [0, 1] range

**Structural Uncertainty**
- Missing relationships between variables
- Topic and source diversity metrics
- Connection ratio: actual/expected
- Weighted combination of coverage gaps

**Approximation Uncertainty**
- Finite sample effects
- Discretization errors
- Numerical precision limits
- Computational approximations

#### Advanced Analysis

**Knowledge Gap Identification**
```typescript
interface KnowledgeGaps {
  missingDomains: string[];     // Uncovered areas
  weakEvidence: string[];       // Low-confidence sources
  conflictingTheories: string[]; // Disagreeing evidence
  unknownUnknowns: number;      // Estimated missing knowledge
}
```

**Deep Uncertainty (Knightian)**
- Scenarios without probabilities
- Info-gap decision theory
- Robustness radius computation
- Ambiguity quantification

**Information-Theoretic Measures**
- Mutual information: `I(X;Y) = H(X) - H(X|Y)`
- Expected information gain
- Value of perfect information
- Entropy reduction potential

### 3. Sensitivity Analysis (sensitivity-analysis.ts)

This module analyzes how sensitive beliefs and decisions are to parameter variations.

#### Core Methods

**Local Sensitivity**
- Partial derivatives approach
- Central difference approximation: `∂f/∂x ≈ (f(x+h) - f(x-h))/2h`
- Elasticity: percentage change response
- Critical value identification

**Global Sensitivity (Sobol Method)**
- Variance decomposition
- First-order indices: main effects
- Total effect indices: including interactions
- Sobol sequence sampling

#### Implementation Details

**Sobol Indices Computation**
1. Generate sample matrices A, B (size n×k)
2. Create AB matrices with column substitutions
3. Evaluate model at all sample points
4. Compute variance components:
   - First-order: `S_i = V[E(Y|X_i)]/V(Y)`
   - Total effect: `ST_i = 1 - V[E(Y|X_~i)]/V(Y)`

**Morris Screening Method**
- Elementary effects approach
- One-at-a-time (OAT) trajectories
- Mean absolute effects for importance
- Standard deviation for interactions

**Robustness Analysis**
```typescript
interface RobustnessAnalysis {
  stableRegion: { min: number; max: number };
  breakpoints: number[];   // Discontinuities
  worstCase: number;       // Minimum response
  bestCase: number;        // Maximum response
}
```

#### Network Sensitivity

**Structural Sensitivity**
- Based on node connectivity
- In-degree and out-degree analysis
- Normalized by network size
- Identifies influential nodes

**Parametric Sensitivity**
- CPT (Conditional Probability Table) perturbations
- KL-divergence impact measurement
- Propagation through network
- Identifies sensitive parameters

### 4. Uncertainty Metrics (uncertainty-metrics.ts)

This module provides comprehensive uncertainty measurement across multiple dimensions.

#### Core Metrics

**UncertaintyMeasures Interface**
```typescript
interface UncertaintyMeasures {
  aleatoric: number;    // Irreducible randomness
  epistemic: number;    // Knowledge uncertainty
  total: number;        // Combined measure
  entropy: number;      // Information uncertainty
  variance: number;     // Statistical spread
  credibility: number;  // Source reliability
  conflict: number;     // Evidence disagreement
}
```

#### Measurement Methods

**Aleatoric Uncertainty**
1. **Intrinsic Variability**
   - Bimodal distribution detection
   - Mode counting via kernel density
   - Natural variation quantification

2. **Noise Estimation**
   - Successive differences method
   - MAD (Median Absolute Deviation) estimator
   - Scaled to standard deviation

3. **Temporal Variability**
   - Autocorrelation analysis
   - ACF(1) for time series
   - Stability assessment

**Epistemic Uncertainty**
1. **Data Sparsity**
   - Exponential decay: `exp(-n/10)`
   - Sample size effects
   - Coverage assessment

2. **Coverage Gaps**
   - Topic diversity metrics
   - Source variety analysis
   - Temporal coverage

3. **Model Uncertainty**
   - Posterior distribution analysis
   - Gini coefficient for concentration
   - Parameter uncertainty

**Entropy Computation**
- Shannon entropy: `H = -Σ p_i * log₂(p_i)`
- Binary entropy for simple beliefs
- Normalized by maximum entropy
- Information-theoretic foundation

**Conflict Assessment**
- Pairwise evidence comparison
- Confidence disagreement
- Sentiment analysis
- Topic mismatch detection

#### Uncertainty Decomposition

**Data Uncertainty Components**
- Quality: evidence reliability scores
- Completeness: field coverage analysis
- Consistency: coefficient of variation

**Model Uncertainty Components**
- Confidence: belief strength
- Complexity: log₂(states) normalization
- Fit: evidence alignment measurement

**Prediction Uncertainty Components**
- Variance: statistical spread
- Bias: systematic errors
- Stability: volatility analysis

## Integration Patterns

### Cross-Module Interactions

1. **Confidence Intervals + Epistemic Uncertainty**
   - Bayesian credible intervals use epistemic decomposition
   - Uncertainty bounds inform interval widths
   - Knowledge gaps affect coverage probabilities

2. **Sensitivity Analysis + Uncertainty Metrics**
   - Sensitivity results feed into uncertainty quantification
   - High sensitivity parameters increase epistemic uncertainty
   - Robustness analysis validates uncertainty estimates

3. **All Modules + Belief State**
   - Shared BeliefState and Evidence interfaces
   - Consistent uncertainty propagation
   - Unified reporting framework

### Usage Patterns

**Basic Uncertainty Quantification**
```typescript
const metrics = new UncertaintyMetrics();
const measures = metrics.computeUncertainty(belief, evidence);
```

**Comprehensive Analysis Pipeline**
```typescript
// 1. Compute base uncertainty
const uncertainty = uncertaintyMetrics.computeUncertainty(belief);

// 2. Decompose epistemic components  
const epistemic = epistemicUncertainty.decomposeUncertainty(belief, evidence);

// 3. Compute confidence intervals
const interval = confidenceIntervals.computeConfidenceInterval(belief, 0.95);

// 4. Analyze sensitivity
const sensitivity = sensitivityAnalysis.globalSensitivity(belief, parameters);
```

## Performance Considerations

### Computational Complexity

- **Confidence Intervals**: O(n) for normal, O(n²) for bootstrap
- **Epistemic Analysis**: O(n·m) for n evidence, m relationships
- **Sensitivity Analysis**: O(k·s) for k parameters, s samples
- **Uncertainty Metrics**: O(n²) for conflict assessment

### Optimization Strategies

1. **Caching**
   - Store computed intervals
   - Memoize sensitivity results
   - Cache uncertainty decompositions

2. **Sampling**
   - Adaptive sampling for sensitivity
   - Importance sampling for rare events
   - Quasi-random sequences for efficiency

3. **Approximations**
   - Use analytical formulas when available
   - Early stopping for convergence
   - Hierarchical decomposition

## Best Practices

1. **Method Selection**
   - Use Wilson intervals for proportions
   - Bootstrap for non-normal data
   - Sobol for global sensitivity
   - Morris for screening

2. **Uncertainty Reporting**
   - Always report confidence levels
   - Distinguish epistemic vs aleatoric
   - Provide sensitivity measures
   - Include robustness analysis

3. **Validation**
   - Cross-validate coverage probabilities
   - Test sensitivity to perturbations
   - Verify uncertainty decomposition
   - Check computational stability

## Future Enhancements

1. **Advanced Methods**
   - Polynomial chaos expansion
   - Gaussian process uncertainty
   - Deep uncertainty quantification
   - Imprecise probability theory

2. **Integration**
   - Real-time uncertainty tracking
   - Adaptive sampling strategies
   - Online sensitivity updates
   - Uncertainty visualization

3. **Applications**
   - Decision support systems
   - Risk assessment frameworks
   - Robust optimization
   - Uncertainty-aware ML
