# LLM Orchestration via Cortical Messaging Protocol

A formally verified multi-LLM coordination system that treats language models as distributed agents with mathematical guarantees.

## 🧠 What This Is

This system implements **Cortical Messaging Protocol (CMP)** adapted for LLM coordination. Instead of coordinating robots in physical space, we coordinate language models in "semantic space" with:

- **Semantic Poses**: Position in concept space + confidence orientation
- **Evidence Aggregation**: Bayesian confidence combination across agents
- **Formal Verification**: Mathematical guarantees (Safety, Liveness, Consistency, Completeness)
- **Specialized Agents**: 7 expert LLMs working in parallel
- **External Data Integration**: Live manufacturing data via MTConnect MCP integration
- **Orchestration Engine**: Multi-agent coordination with consensus building

## 🎯 Current Status: Phase 4 Complete ✅

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

**Orchestration Engine (Phase 4):**
- ✅ Multi-agent coordination with parallel execution
- ✅ Consensus building algorithms with formal verification
- ✅ Real-time evidence aggregation and conflict resolution
- ✅ MCP integration for external data sources (MTConnect manufacturing data)
- ✅ Enhanced orchestration requests with external context support

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Choose the appropriate configuration for your setup:

**For OpenAI + Anthropic (recommended):**
```bash
cp config.anthropic_openai.example.json config.json
# Edit config.json with your OpenAI and Anthropic API keys
```

**For OpenAI + Anthropic + Google Gemini:**
```bash
cp config.anthropic_openai_google.example.json config.json
# Edit config.json with your OpenAI, Anthropic, and Google API keys
```

**For LM Studio (local models):**
```bash
cp config.lmstudio.example.json config.json
# Ensure LM Studio is running locally
```

**For Testing (no API keys required):**
```bash
cp config.mock.example.json config.json
# Uses mock responses for development
```

### 3. Run Demonstrations

**Core Phase 4 Orchestration Demo:**
```bash
npm run dev
```

**MCP Integration Demo (Manufacturing Data Analysis):**
```bash
npm run demo:mcp-integration
```

**Debug MCP Integration:**
```bash
npm run debug:mcp-integration
# Or use the included debug scripts:
# ./debug-mcp.sh (Linux/Mac)
# debug-mcp.bat (Windows)
```

**Note**: Phase 1 demo runs without API keys, but Phase 2+ require real API access for LLM integration. MCP integration requires MTConnect MCP server setup.

## 📁 Project Structure

```
llm-cmp/
├── src/
│   ├── types/index.ts              # Core type definitions
│   ├── core/
│   │   ├── semantic-pose.ts        # Semantic space operations
│   │   ├── llm-agent.ts            # Agent base class with specialization
│   │   ├── knowledge-domains.ts    # Cross-domain transformations
│   │   └── ...                     # Core CMP functionality
│   ├── orchestration/              # NEW: Orchestration Engine
│   │   ├── llm-orchestrator.ts     # Multi-agent coordination engine
│   │   ├── enhanced-request.ts     # Enhanced orchestration requests
│   │   └── index.ts                # Orchestration exports
│   ├── mcp/                        # NEW: Model Context Protocol Integration
│   │   └── mcp-client.ts           # MTConnect MCP client
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
│   ├── demo/
│   │   ├── phase1-demo.ts          # Phase 1 demonstration
│   │   ├── phase2-demo.ts          # Phase 2 demonstration  
│   │   ├── phase3-demo.ts          # Phase 3 demonstration
│   │   ├── phase4-demo.ts          # NEW: Phase 4 orchestration demo
│   │   ├── mcp-integration-demo.ts # NEW: MCP manufacturing integration
│   │   ├── gemini-adapter-demo.ts  # NEW: Google Gemini adapter demo
│   │   ├── lmstudio-adapter-demo.ts # NEW: LM Studio adapter demo
│   │   ├── mock-adapter-demo.ts    # NEW: Mock adapter demo
│   │   └── cmp-demo.ts             # Original CMP demonstration
│   ├── config/
│   │   └── config-loader.ts        # Configuration management
│   └── index.ts                    # Main entry point
├── config.anthropic_openai.example.json      # OpenAI + Anthropic config
├── config.anthropic_openai_google.example.json # + Google Gemini config
├── config.lmstudio.example.json              # LM Studio config
├── config.mock.example.json                  # Mock testing config
├── config.openai.example.json                # OpenAI only config
├── debug-mcp.sh                              # MCP debug script (Unix)
├── debug-mcp.bat                             # MCP debug script (Windows)
└── CURRENT-TASK.md                           # Development task tracking
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

**Phase 4 - Orchestration Engine:**
```
🎼 Multi-Agent Coordination:
   🤝 Consensus Building: Thresholds 0.5-0.9, adaptive convergence
   🔍 Evidence Aggregation: Cross-agent evidence synthesis
   🔬 Formal Verification: Safety, Liveness, Consistency, Completeness
   📋 Coordinated Answers: Integrated multi-perspective solutions

📊 Orchestration Metrics:
   Participating agents: 5/7
   Processing time: 2,847ms
   Consensus confidence: 0.742 (High)
   Reasoning diversity: 0.834
   Verification: 4/4 checks passed ✅
```

**MCP Manufacturing Integration:**
```
🏭 MTConnect Data Analysis:
   📊 Analyzing data from 2 devices...
   📈 Processing 12 observations...
   🎯 Data quality: 95.0% reliable

🔗 Multi-Agent Manufacturing Analysis:
   📊 Factual Specialist: Device performance metrics analysis
   🧠 Reasoning Specialist: Systematic equipment evaluation  
   ⚠️ Critical Specialist: Risk assessment and maintenance alerts
   🎯 Meta Coordinator: Manufacturing optimization recommendations

📈 Analysis Quality:
   • Overall Confidence: 0.918 (High)
   • Expert Consensus: ✅ Achieved
   • Data Integration: ✅ Successful
   • Agent Alignment: 4/4 specialists agreed
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
// - External data integration (manufacturing, IoT, etc.)
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

**Phase 4: Orchestration Engine**
- ✅ Parallel agent coordination with load balancing
- ✅ Consensus building algorithms with formal verification
- ✅ Real-time evidence aggregation and conflict resolution
- ✅ External data integration via MCP (MTConnect manufacturing data)
- ✅ Enhanced orchestration requests with external context support

## 🔮 Upcoming Phases

**Phase 5: Real-World Applications**
- Code review orchestration across multiple repositories
- Research paper analysis with citation verification
- Strategic decision making with risk assessment
- Enterprise integration and scaling

**Phase 6: Advanced Integration**
- Multi-modal data sources (IoT sensors, databases, APIs)
- Real-time streaming data analysis
- Adaptive agent specialization based on domain
- Cross-organizational collaboration protocols

## 🔬 Technical Innovation

**Formal Verification for AI:**
- **Safety**: All confidence values ∈ [0,1] ✓
- **Liveness**: System progresses toward consensus ✓  
- **Consistency**: Reasoning coherent across domains ✓
- **Completeness**: Sufficient evidence → convergence ✓

**External Data Integration:**
- **MCP Protocol**: Model Context Protocol for live data feeds
- **Manufacturing Integration**: MTConnect device data analysis
- **Quality Assurance**: Data reliability and freshness metrics
- **Context Preservation**: External data maintains provenance through agent processing

**This isn't just "better prompting" - it's mathematically verified collective intelligence with real-world data integration.**

## 📊 Expected Output

When you run the different demonstrations:

### Core Orchestration Demo (`npm run dev`)

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

**Phase 4 Orchestration Engine:**
11. **Multi-agent coordination** (parallel execution and load balancing)
12. **Evidence aggregation** (cross-agent evidence synthesis)
13. **Consensus building** (adaptive thresholds and convergence)
14. **Formal verification** (4-point verification checks)
15. **Coordinated final answers** (integrated multi-perspective solutions)

### MCP Integration Demo (`npm run demo:mcp-integration`)

**Manufacturing Data Integration:**
1. **MCP Server Connection** (MTConnect device discovery)
2. **Live Device Data** (current states and observations)
3. **Multi-Agent Manufacturing Analysis** (specialized perspectives on equipment)
4. **Data Quality Assessment** (reliability, freshness, completeness metrics)
5. **Device-Specific Insights** (targeted equipment recommendations)
6. **Integrated Manufacturing Analysis** (coordinated optimization strategies)

**Success Indicators:**
- ✅ All 7 agents show distinct specialized behaviors
- ✅ Quality scores differentiate agent performance realistically  
- ✅ Confidence values show appropriate uncertainty (0.400-0.900)
- ✅ Cross-domain transformations achieve 0.800+ reliability
- ✅ Real LLM API calls succeed (requires valid API keys)
- ✅ Consensus building achieves convergence with formal verification
- ✅ External data integration maintains quality and provenance
- ✅ Manufacturing analysis provides actionable insights

## 🤝 Contributing

This is currently in active development. Each phase requires explicit approval before proceeding to maintain quality and alignment.

## 📝 License

This is experimental research code exploring the intersection of swarm robotics and language model coordination.

---

**Ready to test the orchestration engine? Run `npm run dev` for Phase 4 demos or `npm run demo:mcp-integration` for manufacturing data analysis! ✨**
