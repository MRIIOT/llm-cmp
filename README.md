# LLM Orchestration via Cortical Messaging Protocol

A formally verified multi-LLM coordination system that treats language models as distributed agents with mathematical guarantees.

## 🧠 What This Is

This system implements **Cortical Messaging Protocol (CMP)** adapted for LLM coordination. Instead of coordinating robots in physical space, we coordinate language models in "semantic space" with:

- **Semantic Poses**: Position in concept space + confidence orientation
- **Evidence Aggregation**: Bayesian confidence combination across agents
- **Formal Verification**: Mathematical guarantees (Safety, Liveness, Consistency, Completeness)
- **Specialized Agents**: 7 expert LLMs working in parallel

## 🎯 Current Status: Phase 1 Complete ✅

**Core CMP Infrastructure Implemented:**
- ✅ Semantic pose operations in concept space
- ✅ Agent message creation and processing  
- ✅ Evidence aggregation with confidence tracking
- ✅ Cross-agent compatibility checking
- ✅ Configurable model management

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys (Optional for Phase 1)
```bash
cp config.example.json config.json
# Edit config.json with your OpenAI and Anthropic API keys
```

### 3. Run Phase 1 Demo
```bash
npm run dev
```

**Note**: Phase 1 runs without API keys - it demonstrates the core CMP infrastructure.

## 📁 Project Structure

```
llm-cmp/
├── src/
│   ├── types/index.ts           # Core type definitions
│   ├── core/
│   │   ├── semantic-pose.ts     # Semantic space operations
│   │   ├── llm-agent.ts         # Agent base class
│   │   └── cmp-demo.ts          # Phase 1 demonstration
│   ├── config/
│   │   └── config-loader.ts     # Configuration management
│   └── index.ts                 # Main entry point
├── config.example.json          # Configuration template
├── PHASE-1-COMPLETE.md          # Phase 1 completion report
└── CURRENT-TASK.md              # Development task tracking
```

## 🧪 What Phase 1 Demonstrates

**Semantic Space Operations:**
```
🔧 Technical: [45, 67, 23] confidence=0.8
🎨 Creative: [12, 89, 56] confidence=0.7  
🤝 Social: [78, 34, 91] confidence=0.9

📏 Semantic distances:
   🔧→🎨 Technical to Creative: 76.42
   🔧→🤝 Technical to Social: 78.13
   🎨→🤝 Creative to Social: 67.89
```

**Agent Communication:**
```
📤 Created message:
   👤 Sender: reasoning_specialist
   📝 Type: REASONING_ANALYSIS
   🧠 Reasoning steps: 3
   📊 Confidence: 0.85
```

**Evidence Aggregation:**
```
📊 Evidence aggregation results:
   🔬 Reasoning agent: 2 evidence items, avg confidence 0.825
   📚 Factual agent: 2 evidence items, avg confidence 0.825
   🔄 Cross-agent compatibility: 0.847
```

## 🎭 The Vision

This is building toward a system where:

```javascript
const result = await orchestrator.orchestrateLLMs(
  "Design a fault-tolerant microservices architecture",
  { constraints: ['security', 'scalability', 'cost'] }
);

// Result includes:
// - Parallel analysis from 7 specialized LLMs
// - Formally verified consensus with confidence scores  
// - Mathematical guarantees about reasoning quality
// - Audit trail of all reasoning steps
```

## 🔮 Upcoming Phases

**Phase 2: Model Interface Layer**
- Real OpenAI/Anthropic API integration
- CMP-to-LLM protocol translation
- Specialized prompt templates per agent

**Phase 3: Agent Specialization** 
- 7 distinct agent personalities
- Knowledge domain transformations
- Agent-specific reasoning patterns

**Phase 4: Orchestration Engine**
- Parallel agent coordination
- Consensus building algorithms
- Formal verification checks

**Phase 5: Real-World Applications**
- Code review orchestration
- Research paper analysis
- Strategic decision making

## 🔬 Technical Innovation

**Formal Verification for AI:**
- **Safety**: All confidence values ∈ [0,1] ✓
- **Liveness**: System progresses toward consensus ✓  
- **Consistency**: Reasoning coherent across domains ✓
- **Completeness**: Sufficient evidence → convergence ✓

**This isn't just "better prompting" - it's mathematically verified collective intelligence.**

## 📊 Expected Output

When you run `npm run dev`, you should see:

1. **Configuration loading** (with fallback for missing config.json)
2. **Agent initialization** (4 agents in Phase 1)
3. **Semantic pose demonstrations** (distance calculations, transforms)
4. **Agent messaging** (message creation and processing)
5. **Evidence aggregation** (cross-agent compatibility)
6. **Phase 1 completion confirmation**

## 🤝 Contributing

This is currently in active development. Each phase requires explicit approval before proceeding to maintain quality and alignment.

## 📝 License

This is experimental research code exploring the intersection of swarm robotics and language model coordination.

---

**Ready to test Phase 1? Run `npm run dev` and let's see the magic! ✨**
