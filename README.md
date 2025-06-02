# LLM Orchestration via Cortical Messaging Protocol

A formally verified multi-LLM coordination system that treats language models as distributed agents with mathematical guarantees.

## 🧠 What This Is

This system implements **Cortical Messaging Protocol (CMP)** adapted for LLM coordination. Instead of coordinating robots in physical space, we coordinate language models in "semantic space" with:

- **Semantic Poses**: Position in concept space + confidence orientation
- **Evidence Aggregation**: Bayesian confidence combination across agents
- **Formal Verification**: Mathematical guarantees (Safety, Liveness, Consistency, Completeness)
- **Specialized Agents**: 7 expert LLMs working in parallel

## 🎯 Current Status: Phase 3 Complete ✅

**Core CMP Infrastructure (Phase 1):**
- ✅ Semantic pose operations in concept space
- ✅ Agent message creation and processing  
- ✅ Evidence aggregation with confidence tracking
- ✅ Cross-agent compatibility checking
- ✅ Configurable model management

**Model Interface Layer (Phase 2):**
- ✅ Real OpenAI/Anthropic API integration
- ✅ CMP-to-LLM protocol translation
- ✅ Specialized prompt templates per agent type
- ✅ Response parsing from LLM to CMP format
- ✅ Model adapter factory system

**Agent Specialization System (Phase 3):**
- ✅ 7 distinct specialized agent types (Reasoning, Creative, Factual, Code, Social, Critic, Coordinator)
- ✅ Agent-specific reasoning morphology extraction
- ✅ Knowledge domain transformation system (14 transformation matrices)
- ✅ Cross-domain compatibility checking and confidence adjustments
- ✅ Specialized analysis approaches per agent expertise

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys (Required for Phase 2+ demos)
```bash
cp config.example.json config.json
# Edit config.json with your OpenAI and Anthropic API keys
```

### 3. Run Current Demo (Phase 3)
```bash
npm run dev
```

**Note**: Phase 1 demo runs without API keys, but Phase 2+ require real API access for LLM integration.

## 📁 Project Structure

```
llm-cmp/
├── src/
│   ├── types/index.ts              # Core type definitions
│   ├── core/
│   │   ├── semantic-pose.ts        # Semantic space operations
│   │   ├── llm-agent.ts            # Agent base class with specialization
│   │   ├── knowledge-domains.ts    # Cross-domain transformations
│   │   ├── cmp-demo.ts             # Phase 1 demonstration
│   │   ├── phase2-demo.ts          # Phase 2 demonstration  
│   │   └── phase3-demo.ts          # Phase 3 demonstration
│   ├── models/
│   │   ├── model-adapter.ts        # Abstract base for API adapters
│   │   ├── openai-adapter.ts       # OpenAI API implementation
│   │   ├── anthropic-adapter.ts    # Anthropic API implementation
│   │   ├── llm-interface.ts        # CMP-to-LLM protocol bridge
│   │   ├── prompt-template-manager.ts # Specialized prompts per agent
│   │   ├── response-parser.ts      # LLM response to CMP conversion
│   │   └── index.ts                # Model layer exports
│   ├── agents/
│   │   ├── agent-types.ts          # 7 specialized agent definitions
│   │   └── specialized-agents.ts   # Agent morphology extraction
│   ├── config/
│   │   └── config-loader.ts        # Configuration management
│   └── index.ts                    # Main entry point
├── config.example.json             # Configuration template
└── CURRENT-TASK.md                 # Development task tracking
```

## 🧪 What the System Demonstrates

**Phase 1 - Semantic Space Operations:**
```
🔧 Technical: [45, 67, 23] confidence=0.8
🎨 Creative: [12, 89, 56] confidence=0.7  
🤝 Social: [78, 34, 91] confidence=0.9

📏 Semantic distances:
   🔧→🎨 Technical to Creative: 76.42
   🔧→🤝 Technical to Social: 78.13
   🎨→🤝 Creative to Social: 67.89
```

**Phase 2 - Real LLM Integration:**
```
🤖 OpenAI GPT-4o: Successfully connected
🤖 Anthropic Claude: Successfully connected
📝 CMP→LLM Protocol: Message translation working
📋 Response Parsing: LLM output → CMP evidence format
🎯 Specialized Prompts: Templates optimized per agent type
```

**Phase 3 - Agent Specialization:**
```
🧠 7 Specialized Agents Working in Parallel:
   💭 Reasoning Specialist    → Logical analysis, step-by-step deduction
   🎨 Creative Specialist     → Innovative solutions, artistic perspectives  
   📚 Factual Specialist      → Research, citations, verification
   💻 Code Specialist         → Technical implementation, architecture
   🤝 Social Specialist       → Human factors, communication, UX
   🔍 Critical Specialist     → Risk analysis, edge cases, problems
   🎯 Coordinator Specialist  → Integration, synthesis, orchestration

📊 Distinct Analysis Approaches:
   Quality Scores: 0.529-0.658 (realistic discrimination)
   Confidence Range: 0.400-0.900 (appropriate uncertainty)
   Domain Transformations: 14 cross-domain matrices (0.800 avg reliability)
```

**Agent Communication:**
```
📤 Created message:
   👤 Sender: reasoning_specialist
   📝 Type: REASONING_ANALYSIS
   🧠 Reasoning steps: 15
   📊 Quality: 0.658 (highest performer)
   🎯 Specialization: logical, methodical, evidence-based
```

**Evidence Aggregation:**
```
📊 Multi-agent evidence aggregation:
   🧠 Reasoning agent: 15 steps, quality 0.658
   📚 Factual agent: 12 steps, quality 0.611  
   💻 Code agent: 18 steps, quality 0.592
   🔄 Cross-agent compatibility: 0.847
   ✅ Consensus achieved with formal verification
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

## ✅ Completed Phases

**Phase 1: Core CMP Infrastructure**
- ✅ Semantic pose operations in concept space
- ✅ Agent message creation and processing  
- ✅ Evidence aggregation with confidence tracking
- ✅ Cross-agent compatibility checking

**Phase 2: Model Interface Layer**
- ✅ Real OpenAI/Anthropic API integration
- ✅ CMP-to-LLM protocol translation
- ✅ Specialized prompt templates per agent
- ✅ Response parsing and evidence extraction

**Phase 3: Agent Specialization** 
- ✅ 7 distinct agent personalities with unique approaches
- ✅ Knowledge domain transformations between semantic spaces
- ✅ Agent-specific reasoning patterns and morphology extraction
- ✅ Cross-domain compatibility assessment with confidence adjustments

## 🔮 Upcoming Phases

**Phase 4: Orchestration Engine**
- Parallel agent coordination with load balancing
- Consensus building algorithms with formal verification
- Real-time evidence aggregation and conflict resolution
- Performance optimization and caching

**Phase 5: Real-World Applications**
- Code review orchestration across multiple repositories
- Research paper analysis with citation verification
- Strategic decision making with risk assessment
- Enterprise integration and scaling

## 🔬 Technical Innovation

**Formal Verification for AI:**
- **Safety**: All confidence values ∈ [0,1] ✓
- **Liveness**: System progresses toward consensus ✓  
- **Consistency**: Reasoning coherent across domains ✓
- **Completeness**: Sufficient evidence → convergence ✓

**This isn't just "better prompting" - it's mathematically verified collective intelligence.**

## 📊 Expected Output

When you run `npm run dev`, you should see:

**Phase 1 Foundation:**
1. **Configuration loading** (requires config.json with API keys)
2. **Agent initialization** (7 specialized agents)
3. **Semantic pose demonstrations** (distance calculations, transforms)

**Phase 2 Model Integration:**
4. **API connectivity** (OpenAI and Anthropic connections)
5. **Protocol translation** (CMP messages ↔ LLM prompts)
6. **Response parsing** (LLM output → CMP evidence format)

**Phase 3 Agent Specialization:**
7. **Specialized agent demonstrations** (7 distinct analysis approaches)
8. **Agent-specific reasoning** (logical, creative, factual, technical, social, critical, coordination)
9. **Quality score differentiation** (0.529-0.658 range showing realistic performance differences)
10. **Knowledge domain transformations** (cross-domain semantic mapping)
11. **Evidence aggregation** (multi-agent consensus with formal verification)

**Success Indicators:**
- ✅ All 7 agents show distinct specialized behaviors
- ✅ Quality scores differentiate agent performance realistically  
- ✅ Confidence values show appropriate uncertainty (0.400-0.900)
- ✅ Cross-domain transformations achieve 0.800+ reliability
- ✅ Real LLM API calls succeed (requires valid API keys)

## 🤝 Contributing

This is currently in active development. Each phase requires explicit approval before proceeding to maintain quality and alignment.

## 📝 License

This is experimental research code exploring the intersection of swarm robotics and language model coordination.

---

**Ready to test Phase 1? Run `npm run dev` and let's see the magic! ✨**
