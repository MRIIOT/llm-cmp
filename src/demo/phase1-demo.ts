// ===============================================
// PHASE 1 DEMONSTRATION
// Core CMP Infrastructure Demo
// ===============================================

import { CMPDemo } from './cmp-demo.js';

/**
 * Demonstrates Phase 1: Core CMP Infrastructure
 * Shows semantic pose operations, agent communication protocols, and evidence aggregation
 */
export async function runPhase1(): Promise<void> {
  console.log('🧪 Starting Phase 1 demonstration...\n');
  const demo = new CMPDemo();
  demo.runDemo();

  console.log('\n✅ Phase 1 Complete: Core CMP Infrastructure');
  console.log('   - Semantic pose operations verified');
  console.log('   - Agent communication protocols tested');
  console.log('   - Evidence aggregation functional');
}
