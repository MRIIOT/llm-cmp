# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Run
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Build and run the application
- `npm run demo` - Run basic demo with default memory allocation
- `npm run demo:agent` - Run demo with 2GB memory allocation
- `npm run demo:agent:lowmem` - Run demo with 1GB memory allocation
- `npm run demo:debug` - Run demo with Node.js debugger enabled

### Testing and Linting
No test or lint commands are currently configured. Consider implementing these if needed.

## Architecture Overview

This is a **Cortical Messaging Protocol (CMP)** system - a biologically-inspired multi-agent orchestration framework for LLMs.

### Core Components

1. **Orchestrator** (`src/orchestration/orchestrator.ts`)
   - Manages multiple agents and coordinates their responses
   - Implements consensus mechanisms (majority voting, weighted voting, Bayesian aggregation, game theoretic)
   - Handles complex query decomposition and result synthesis

2. **Agents** (`src/core/agent.ts`)
   - Individual reasoning units with HTM, Bayesian inference, and adaptive capabilities
   - Specialized types: Analytical, Creative, Critical, Temporal
   - Each agent maintains its own state and evidence network

3. **HTM System** (`src/core/htm/`)
   - Hierarchical Temporal Memory implementation for pattern recognition
   - Spatial pooling, temporal pooling, and prediction engines
   - Domain-aware anomaly detection

4. **Bayesian Evidence** (`src/evidence/bayesian/`)
   - Belief networks for probabilistic reasoning
   - Uncertainty quantification and conflict resolution
   - Evidence aggregation across agents

5. **Semantic Encoding** (`src/core/semantic/`)
   - Hierarchical hash encoding for semantic space representation
   - Concept normalization and relationship management
   - Feature extraction and caching

6. **LLM Adapters** (`src/adapters/`)
   - Unified interface for different LLM providers
   - Implementations for OpenAI, Anthropic, Gemini, and LMStudio
   - Base adapter pattern for easy extension

### Key Architectural Patterns

- **Multi-Agent Consensus**: Multiple agents process queries independently, then results are aggregated
- **Adaptive Morphology**: Agents evolve capabilities based on performance metrics
- **Logical Proof Validation**: Formal logic system with inference rules and contradiction detection
- **Memory-Efficient Design**: Configurable memory profiles for different deployment scenarios

### Type System

Strong TypeScript types defined in `src/types/index.ts`:
- `BeliefState`, `Evidence`, `InferenceResult` for reasoning
- `ConsensusMethod`, `AgentRole` for orchestration
- `HTMConfig`, `SemanticConfig` for configuration

### Environment Variables

Required in `.env`:
- `OPENAI_API_KEY` - For OpenAI adapter
- `ANTHROPIC_API_KEY` - For Anthropic adapter
- `GEMINI_API_KEY` - For Gemini adapter
- Additional provider-specific keys as needed

### Development Guidelines

From existing documentation:
- Conservative, conscientious approach to code changes
- Preserve existing functionality while adding enhancements
- Strong emphasis on type safety and error handling
- Modular design allows independent component evolution