# HTM (Hierarchical Temporal Memory) Module - Technical Documentation

## Overview

This module implements a complete Hierarchical Temporal Memory (HTM) system based on the Thousand Brains Theory of Intelligence and HTM principles from Numenta research. The implementation provides a biologically-inspired neural architecture capable of learning temporal sequences, making predictions, and detecting anomalies in streaming data.

## Architecture Components

### 1. Spatial Pooler (`spatial-pooler.ts`)

**Purpose**: Transforms input patterns into sparse distributed representations (SDRs) that form the foundation of HTM processing.

**Key Classes**:
- `SpatialPooler`: Main implementation class
- `SpatialPoolerConfig`: Configuration parameters
- `ColumnState`: Individual column state tracking
- `SynapseConnection`: Synapse permanence management

**Core Methodology**:
1. **Column Initialization**: Each column connects to a random subset of input bits through potential synapses
2. **Overlap Calculation**: Computes overlap between input pattern and each column's connected synapses
3. **Inhibition**: Applies global/local inhibition to enforce sparsity (typically 2% activation)
4. **Learning**: Adapts synapse permanences based on Hebbian principles
5. **Homeostasis**: Maintains stable activation patterns through boosting and duty cycle regulation

**Technical Details**:
- Uses seeded random number generator for reproducibility
- Implements competitive learning with winner-take-all dynamics
- Maintains moving averages for duty cycle calculations
- Supports both global and local inhibition modes
- Permanence values range from 0.0 to 1.0 with connection threshold at 0.1

**Key Functions**:
- `compute()`: Main processing function converting boolean input to sparse column activation
- `calculateOverlaps()`: Determines column activation strength based on input
- `inhibitColumns()`: Enforces sparsity through competition
- `adaptSynapses()`: Implements Hebbian learning rule
- `updateBoostFactors()`: Maintains homeostatic balance

### 2. Temporal Pooler (`temporal-pooler.ts`)

**Purpose**: Learns temporal sequences in sparse representations and generates predictions based on temporal context.

**Key Classes**:
- `TemporalPooler`: Sequence memory implementation
- `Cell`: Individual neuron within a column
- `Segment`: Dendritic segment containing synapses
- `Synapse`: Connection between cells
- `TemporalState`: Current activation and prediction state

**Core Methodology**:
1. **Cell Structure**: Each column contains multiple cells (default: 32) for context representation
2. **Dendritic Segments**: Each cell has multiple segments learning different contexts
3. **Prediction**: Segments become active when recognizing learned temporal patterns
4. **Bursting**: Unpredicted columns activate all cells, signaling unexpected input
5. **Winner Cells**: One cell per active column chosen to represent current context

**Technical Implementation**:
- **Segment Activation**: Threshold-based (default: 13 synapses) for robust pattern matching
- **Learning Rule**: Strengthens synapses to previously active cells when predictions succeed
- **Segment Creation**: New segments formed when no existing segment predicted current input
- **Synapse Management**: Permanence-based with connected threshold at 0.5
- **Capacity Management**: Limits segments per cell (255) and synapses per segment (255)

**Key Functions**:
- `compute()`: Processes active columns and updates temporal state
- `calculatePredictiveState()`: Determines which cells should be predictive
- `processActiveColumns()`: Handles column activation and winner cell selection
- `learnOnSegments()`: Implements temporal learning algorithm
- `getPredictions()`: Generates predictions for next timestep
- `getNextTimestepPredictions()`: Returns predictive cells for sequence completion

### 3. Column State Manager (`column-state-manager.ts`)

**Purpose**: Comprehensive state management and metrics tracking for cortical columns in the HTM region.

**Key Classes**:
- `ColumnStateManager`: Central management class
- `ColumnActivationState`: Current activation and prediction state
- `ColumnLearningState`: Learning metrics and progress tracking
- `ColumnMemoryTrace`: Historical activation patterns
- `ColumnMetrics`: Performance and efficiency metrics

**Core Features**:
1. **State Tracking**: Maintains activation, prediction, and learning states per column
2. **Memory Traces**: Records temporal history for pattern analysis
3. **Metric Calculation**: Computes stability, reliability, selectivity, and efficiency
4. **Learning Progress**: Tracks adaptation rates and prediction accuracy
5. **Region Statistics**: Aggregates column-level metrics for global analysis

**Technical Metrics**:
- **Stability**: Consistency of activation patterns over time
- **Reliability**: Prediction accuracy and success rate
- **Selectivity**: Sparsity of column responses
- **Predictivity**: Forward prediction capability
- **Adaptation Rate**: Speed of learning new patterns
- **Memory Capacity**: Ability to maintain distinct representations
- **Temporal Depth**: Extent of temporal dependencies
- **Energy Efficiency**: Information per activation cost ratio

**Key Functions**:
- `updateSpatialStates()`: Integrates spatial pooler results
- `updateTemporalStates()`: Incorporates temporal pooler predictions
- `updateMetrics()`: Calculates comprehensive performance metrics
- `addMemoryTrace()`: Records activation patterns for analysis
- `getRegionStats()`: Provides aggregate statistics

### 4. HTM Region (`htm-region.ts`)

**Purpose**: Integrates spatial pooler, temporal pooler, and column state management into a complete HTM processing region.

**Key Classes**:
- `HTMRegion`: Main integration class
- `HTMRegionConfig`: Configuration for all components
- `HTMRegionState`: Complete region state
- `HTMRegionOutput`: Processed output with predictions

**Integration Architecture**:
1. **Component Orchestration**: Coordinates spatial and temporal processing phases
2. **State Management**: Maintains coherent state across components
3. **Multi-step Prediction**: Generates predictions multiple timesteps ahead
4. **Context Generation**: Creates temporal and semantic feature vectors
5. **Learning Control**: Manages online/batch learning modes

**Processing Pipeline**:
1. Input validation and storage
2. Spatial pooling for SDR generation
3. Temporal processing for sequence learning
4. Column state updates
5. Multi-step prediction generation
6. Metric calculation and tracking
7. Output formatting with confidence scores

**Key Functions**:
- `compute()`: Main processing pipeline
- `generateMultiStepPredictions()`: Future state prediction
- `generateTemporalContext()`: Context vector creation
- `generateSemanticFeatures()`: Feature extraction
- `trainSequence()`: Batch sequence learning
- `predictNextInput()`: Single-step prediction

### 5. Prediction Engine (`prediction-engine.ts`)

**Purpose**: Advanced prediction system leveraging HTM regions for sophisticated forecasting, anomaly detection, and pattern recognition.

**Key Classes**:
- `PredictionEngine`: Main prediction system
- `PredictionResult`: Comprehensive prediction output
- `PredictionPattern`: Learned pattern storage
- `AnomalyThresholds`: Anomaly detection parameters

**Advanced Features**:
1. **Multi-step Forecasting**: Predictions with confidence intervals
2. **Alternative Scenarios**: Multiple prediction paths with probabilities
3. **Anomaly Detection**: Four-tier anomaly scoring system
4. **Pattern Library**: Stores and retrieves learned sequences
5. **Uncertainty Quantification**: Prediction intervals and confidence metrics

**Anomaly Detection System**:
- **Prediction Error**: Deviation from expected patterns
- **Temporal Deviation**: Unusual sequence transitions
- **Spatial Deviation**: Abnormal activation patterns
- **Contextual Anomaly**: Inconsistent temporal context

**Pattern Management**:
- **Signature Generation**: Compact pattern representation
- **Similarity Matching**: Jaccard similarity for pattern comparison
- **Adaptive Library**: Maintains most predictive patterns
- **Frequency Tracking**: Pattern occurrence statistics

**Key Functions**:
- `predict()`: Main prediction interface with multiple modes
- `predictMultiStep()`: Generate sequence predictions
- `detectAnomalies()`: Comprehensive anomaly analysis
- `validatePredictions()`: Accuracy tracking and validation
- `trainOnSequence()`: Pattern library building
- `findSimilarPatterns()`: Pattern matching and retrieval

## Data Flow

1. **Input Processing**:
   - Boolean arrays representing sensory input
   - Spatial pooler creates sparse representation
   - Maintains input history for context

2. **Temporal Processing**:
   - Active columns feed into temporal pooler
   - Cells compete for representation rights
   - Segments learn temporal transitions

3. **State Management**:
   - Column states updated with metrics
   - Memory traces recorded
   - Performance metrics calculated

4. **Prediction Generation**:
   - Current state analyzed for patterns
   - Future states predicted through simulation
   - Confidence scores assigned

5. **Output Formation**:
   - Active cells and predictions packaged
   - Context vectors generated
   - Anomaly scores calculated

## Learning Mechanisms

### Spatial Learning
- **Hebbian Rule**: "Cells that fire together wire together"
- **Homeostasis**: Boost factors maintain balanced activation
- **Competition**: Local/global inhibition enforces sparsity

### Temporal Learning
- **Sequence Memory**: Segments learn temporal transitions
- **Context Representation**: Multiple cells per column encode context
- **Prediction Learning**: Successful predictions strengthen synapses

### Adaptation Strategies
- **Online Learning**: Continuous adaptation during processing
- **Batch Learning**: Repeated sequence presentation
- **Hybrid Mode**: Combines online and batch approaches

## Performance Optimizations

1. **Sparse Data Structures**: Sets for active cell tracking
2. **Lazy Evaluation**: Calculations performed only when needed
3. **Bounded Resources**: Limits on segments and synapses
4. **Efficient Sampling**: Seeded random sampling for consistency
5. **Moving Averages**: Exponential decay for metric tracking

## Configuration Guidelines

### Spatial Pooler
- `numColumns`: Typically 2048 for good capacity
- `sparsity`: 2% (0.02) for optimal information encoding
- `potentialRadius`: Half of input size for broad receptive fields
- `boostStrength`: 0.0 to disable, >0 for homeostasis

### Temporal Pooler
- `cellsPerColumn`: 32 provides good context capacity
- `activationThreshold`: 13 for noise resistance
- `initialPermanence`: 0.51 (above connected) for immediate learning
- `maxSegmentsPerCell`: 255 for extensive pattern capacity

### Prediction Engine
- `maxSequenceLength`: 50 for reasonable temporal depth
- `maxPatterns`: 1000 for pattern library size
- `anomalyThresholds`: Tune based on application sensitivity

## Usage Patterns

### Basic Sequence Learning
```typescript
const region = new HTMRegion(config);
const engine = new PredictionEngine(region);

// Train on sequences
engine.trainOnSequence(trainingData);

// Make predictions
const result = engine.predict(currentInput);
```

### Anomaly Detection
```typescript
const request = {
  currentInput: sensorData,
  predictionSteps: 5,
  anomalyDetection: true,
  includeAlternatives: true
};

const prediction = engine.predict(request);
if (prediction.isAnomalous) {
  console.log(prediction.anomalyExplanation);
}
```

### Multi-step Forecasting
```typescript
const predictions = engine.predictMultiStep(10);
for (const step of predictions) {
  console.log(`Confidence: ${step.confidence}`);
}
```

## Theoretical Foundation

The implementation is grounded in:
1. **Thousand Brains Theory**: Multiple models voting on interpretations
2. **Sparse Distributed Representations**: High capacity with few active bits
3. **Predictive Coding**: Brain as prediction machine
4. **Hebbian Learning**: Synaptic plasticity rules
5. **Homeostatic Regulation**: Maintaining stable dynamics

## Performance Characteristics

- **Memory Usage**: O(columns × cells × segments × synapses)
- **Computation**: O(columns × average_segments) per timestep
- **Learning Rate**: Adaptive based on prediction success
- **Capacity**: Exponential in number of columns
- **Noise Tolerance**: High due to distributed representation

## Debugging and Monitoring

The implementation includes extensive debugging capabilities:
- Detailed logging of overlap calculations
- State validation and error checking
- Metric tracking for performance analysis
- Pattern library inspection
- Anomaly explanation generation

## Future Extensions

Potential enhancements:
1. **Attention Mechanisms**: Dynamic column importance weighting
2. **Hierarchical Regions**: Multi-level temporal abstraction
3. **Lateral Connections**: Direct column-to-column communication
4. **Continuous Learning**: Adaptive forgetting mechanisms
5. **GPU Acceleration**: Parallel processing optimizations
