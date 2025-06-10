// Quick test to run agent-demo example2 with limited queries
const { spawn } = require('child_process');

console.log('Running agent-demo example2 with ghost tokens...\n');

const env = {
  ...process.env,
  OPENAI_API_KEY: "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",
  QUERIES_LIMIT: "2"
};

const demo = spawn('node', ['dist/core/agent-demo.js'], { env });

let output = '';
demo.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

demo.stderr.on('data', (data) => {
  process.stderr.write(data);
});

demo.on('close', (code) => {
  console.log(`\nDemo exited with code ${code}`);
  
  // Check if ghost tokens were displayed
  if (output.includes('Ghost Tokens')) {
    console.log('\n✅ Ghost tokens were displayed successfully!');
  } else {
    console.log('\n⚠️  Ghost tokens section not found in output');
  }
});