#!/bin/bash

echo "Building project..."
npm run build
echo ""
echo "Running semantic encoder test..."
node dist/core/semantic/semantic-encoder.test.js
