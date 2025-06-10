#!/bin/bash

# Test Ghost Token Demo
# This script runs the agent demo with a limited number of queries to test ghost token functionality

echo "Testing Ghost Token Feature with Live LLM..."
echo "Make sure OPENAI_API_KEY is set in your environment"
echo ""

# Run with a subset of queries and debug mode
QUERIES_LIMIT=5 DEBUG_GHOST_TOKENS=true node dist/core/agent-demo.js