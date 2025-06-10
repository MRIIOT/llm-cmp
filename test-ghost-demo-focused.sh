#!/bin/bash

# Test Ghost Token Feature in Agent Demo
echo "🔍 Testing Ghost Token Feature in Agent Demo..."
echo ""

# Export the API key
export OPENAI_API_KEY="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"

# Run with just 3 queries to focus on ghost token demonstration
export QUERIES_LIMIT=3

# Run the agent demo and grep for ghost token related output
echo "Running agent demo with ghost tokens enabled..."
node dist/core/agent-demo.js | grep -A 30 "GHOST TOKEN DEMONSTRATION" || node dist/core/agent-demo.js