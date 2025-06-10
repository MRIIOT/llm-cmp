#!/bin/bash

echo "Testing improved anomaly detection for topic changes..."
echo "=========================================="
echo ""
echo "Running with topic-sensitive configuration..."
echo ""

# Set queries limit to test specific examples
export QUERIES_LIMIT=30

# Run the agent demo
cd /mnt/c/source/llm/llm-cmp
npm run demo:agent 2>&1 | grep -E "(Query [0-9]+:|Anomaly Score:|👻 Ghost Tokens|hiking trails|capital movements)" | tail -20