/**
 * Runner script for agent demo
 * Use this to execute the agent demonstration
 */

import { runAgentDemo } from './agent-demo.js';

// Run the demo
runAgentDemo()
  .then(() => {
    console.log('\n\n🎉 Demo runner completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n\n❌ Demo runner failed:', error);
    process.exit(1);
  });
