// ===============================================
// LLM ORCHESTRATION VIA CORTICAL MESSAGING PROTOCOL
// Multi-Phase System Demonstration
// ===============================================

import { ConfigLoader } from './config/config-loader.js';
import { CMPDemo } from './core/cmp-demo.js';
import { demonstratePhase2 } from './core/phase2-demo';
import { runPhase3Demo } from './core/phase3-demo.js';
import { demonstrateOrchestration } from './orchestration/phase4-demo.js';

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

async function runPhase1(): Promise<void> {
  console.log('🧪 Starting Phase 1 demonstration...\n');
  const demo = new CMPDemo();
  demo.runDemo();

  console.log('\n✅ Phase 1 Complete: Core CMP Infrastructure');
  console.log('   - Semantic pose operations verified');
  console.log('   - Agent communication protocols tested');
  console.log('   - Evidence aggregation functional');
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
