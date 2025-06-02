// ===============================================
// ORCHESTRATION MODULE EXPORTS
// ===============================================

// Main orchestrator
export { LLMOrchestrator } from './llm-orchestrator.js';
export type { 
  OrchestrationRequest, 
  OrchestrationResult, 
  AgentExecution 
} from './llm-orchestrator.js';

// Demonstration
export { demonstrateOrchestration } from './phase4-demo.js';
