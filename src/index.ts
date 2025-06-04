// ===============================================
// LLM ORCHESTRATION VIA CORTICAL MESSAGING PROTOCOL
// Multi-Phase System Demonstration
// ===============================================

import { ConfigLoader } from './config/config-loader.js';
import { runPhase1 } from './demo/phase1-demo.js';
import { demonstratePhase2 } from './demo/phase2-demo.js';
import { runPhase3Demo } from './demo/phase3-demo.js';
import { demonstrateOrchestration } from './demo/phase4-demo.js';
import { runMockAdapterDemo } from './demo/mock-adapter-demo.js';
import { runGeminiAdapterDemo } from './demo/gemini-adapter-demo.js';
import { demonstrateLMStudioAdapter } from './demo/lmstudio-adapter-demo.js';
import { runMCPIntegrationDemo } from './demo/mcp-integration-demo.js';
import { demonstrateExecutiveConsensus } from './demo/executive-consensus-demo.js';

async function main(): Promise<void> {
  console.log('🌟 LLM Orchestration System');
  console.log('============================\n');

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const phase = args[0] || 'all';

    // Load configuration
    console.log('📋 Loading configuration...');
    const configLoader = ConfigLoader.getInstance();
    
    try {
      configLoader.loadConfig();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        console.log('⚠️  No config.json found. Creating demo configuration...');
        console.log('   (For real API calls, copy config.example.json to config.json)\n');
        
        // Create a minimal config for demo
        const demoConfig = ConfigLoader.createDefaultConfig();
        (configLoader as any).config = demoConfig;
      } else {
        throw error;
      }
    }

    // Run requested phase(s)
    if (phase === 'phase1') {
      console.log('🔧 Running Phase 1: Core CMP Infrastructure\n');
      await runPhase1();
    } else if (phase === 'phase2') {
      console.log('🔌 Running Phase 2: Model Interface Layer\n');
      await demonstratePhase2();
    } else if (phase === 'phase3') {
      console.log('🤖 Running Phase 3: Agent Specialization\n');
      await runPhase3Demo();
    } else if (phase === 'phase4') {
      console.log('🎼 Running Phase 4: Orchestration Engine\n');
      await demonstrateOrchestration();
    } else if (phase === 'mock') {
      console.log('🎭 Running Mock Adapter Demonstration\n');
      await runMockAdapterDemo();
    } else if (phase === 'gemini') {
      console.log('🌟 Running Gemini Adapter Demonstration\n');
      await runGeminiAdapterDemo();
    } else if (phase === 'lmstudio') {
      console.log('🏠 Running LM Studio Adapter Demonstration\n');
      await demonstrateLMStudioAdapter();
    } else if (phase === 'mcp') {
      console.log('🏭 Running MCP Integration Demonstration\n');
      await runMCPIntegrationDemo();
    } else if (phase === 'executive') {
      console.log('🎯 Running Executive Consensus Demonstration\n');
      await demonstrateExecutiveConsensus();
    } else {
      console.log('🚀 Running Complete System Demonstration\n');
      
      console.log('🔧 Phase 1: Core CMP Infrastructure');
      console.log('=====================================');
      await runPhase1();
      
      console.log('\n🔌 Phase 2: Model Interface Layer');
      console.log('=================================');
      await demonstratePhase2();
      
      console.log('\n🤖 Phase 3: Agent Specialization');
      console.log('================================');
      await runPhase3Demo();
      
      console.log('\n🎼 Phase 4: Orchestration Engine');
      console.log('===============================');
      await demonstrateOrchestration();
    }

    console.log('\n🎉 System demonstration completed successfully!');
    console.log('=====================================');
    console.log('Usage:');
    console.log('  npm run dev         # Run all phases');
    console.log('  npm run dev phase1  # Run Phase 1 only');
    console.log('  npm run dev phase2  # Run Phase 2 only');
    console.log('  npm run dev phase3  # Run Phase 3 only');
    console.log('  npm run dev phase4  # Run Phase 4 only');
    console.log('  npm run dev mock    # Run Mock Adapter Demo');
    console.log('  npm run dev gemini  # Run Gemini Adapter Demo');
    console.log('  npm run dev lmstudio # Run LM Studio Adapter Demo');
    console.log('  npm run dev mcp     # Run MCP Integration Demo');
    console.log('  npm run dev executive # Run Executive Consensus Demo');

  } catch (error) {
    console.error('\n❌ System demonstration failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      if (error.message.includes('API key')) {
        console.log('\n💡 Fix API key issues:');
        console.log('   - Ensure config.json exists');
        console.log('   - Add valid OpenAI and Anthropic API keys');
        console.log('   - Remove placeholder text from keys');
      }
    }
    
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down CMP system...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the system
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
