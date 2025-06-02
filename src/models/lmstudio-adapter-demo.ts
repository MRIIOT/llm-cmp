import { LMStudioAdapter } from './lmstudio-adapter';
import { LLM_AGENT_TYPES } from '../agents/agent-types';

/**
 * LM Studio Adapter Demonstration
 * 
 * This demo showcases the LM Studio adapter functionality including:
 * - Local server connection testing
 * - Model availability checking
 * - Agent-specific model recommendations
 * - Local inference capabilities
 * - Privacy-focused operation
 */

async function demonstrateLMStudioAdapter() {
    console.log('\n🏠 LM Studio Adapter Demonstration');
    console.log('=====================================\n');

    try {
        // Initialize LM Studio adapter with default local configuration
        console.log('1. Initializing LM Studio adapter...');
        const adapter = new LMStudioAdapter('lmstudio-local', {
            baseUrl: 'http://localhost:1234',  // Default LM Studio server
            timeout: 120000                    // 2 minutes for local inference
        });

        // Display adapter capabilities
        console.log('\n2. Adapter Capabilities:');
        const capabilities = adapter.getCapabilities();
        console.log(`   Provider: ${capabilities.provider}`);
        console.log(`   Base URL: ${capabilities.baseUrl}`);
        console.log(`   Supports Local Models: ${capabilities.supportsLocalModels}`);
        console.log(`   Requires API Key: ${capabilities.requiresApiKey}`);
        console.log(`   Offline Capable: ${capabilities.offlineCapable}`);
        console.log(`   Max Context: ${capabilities.maxContextTokens}`);
        console.log(`   Features: ${capabilities.features.join(', ')}`);

        // Test server connection
        console.log('\n3. Testing LM Studio Server Connection...');
        const connectionTest = await adapter.testConnection();
        
        if (connectionTest.success) {
            console.log(`   ✅ ${connectionTest.message}`);
            if (connectionTest.serverInfo) {
                console.log(`   📍 Base URL: ${connectionTest.serverInfo.baseUrl}`);
                console.log(`   🤖 Model Loaded: ${connectionTest.serverInfo.hasModelLoaded}`);
                if (connectionTest.serverInfo.modelInfo) {
                    console.log(`   📋 Model: ${connectionTest.serverInfo.modelInfo.id}`);
                }
                console.log(`   📚 Available Models: ${connectionTest.serverInfo.availableModels.join(', ')}`);
            }
        } else {
            console.log(`   ❌ ${connectionTest.message}`);
            console.log('\n   💡 To use LM Studio:');
            console.log('      1. Download and install LM Studio from https://lmstudio.ai/');
            console.log('      2. Download a model (e.g., Llama 2, Mistral, CodeLlama)');
            console.log('      3. Start the local server (Server tab → Start Server)');
            console.log('      4. Load a model in the server');
            console.log('      5. Ensure server is running on http://localhost:1234');
            
            // Continue demo with simulation mode
            console.log('\n   🔄 Continuing demo in simulation mode...');
        }

        // Check server status in detail
        console.log('\n4. Detailed Server Status...');
        const serverStatus = await adapter.checkServerStatus();
        console.log(`   Server Running: ${serverStatus.isRunning ? '✅' : '❌'}`);
        console.log(`   Model Loaded: ${serverStatus.hasModelLoaded ? '✅' : '❌'}`);
        if (serverStatus.error) {
            console.log(`   Error: ${serverStatus.error}`);
        }
        if (serverStatus.modelInfo) {
            console.log(`   Current Model: ${serverStatus.modelInfo.id}`);
        }

        // Show model recommendations for different agent types
        console.log('\n5. Agent-Specific Model Recommendations:');
        const recommendations = adapter.getModelRecommendations();
        Object.entries(recommendations).forEach(([agentType, recommendation]) => {
            const emoji = agentType === 'reasoning' ? '🧠' :
                         agentType === 'creative' ? '🎨' :
                         agentType === 'factual' ? '📊' :
                         agentType === 'code' ? '💻' :
                         agentType === 'social' ? '👥' :
                         agentType === 'critic' ? '🔍' :
                         agentType === 'coordinator' ? '🎯' : '🤖';
            console.log(`   ${emoji} ${agentType}: ${recommendation}`);
        });

        // Test actual completion if server is available
        if (connectionTest.success) {
            console.log('\n6. Testing Local Model Inference...');
            
            try {
                const testRequest = {
                    prompt: 'Explain the concept of artificial intelligence in one paragraph.',
                    model: 'local-model',
                    maxTokens: 150,
                    temperature: 0.7,
                    systemPrompt: 'You are a knowledgeable AI assistant. Provide clear, concise explanations.'
                };

                console.log('   📤 Sending test request to local model...');
                const response = await adapter.generateCompletion(
                    testRequest.prompt,
                    {
                        maxTokens: testRequest.maxTokens,
                        temperature: testRequest.temperature,
                        systemPrompt: testRequest.systemPrompt
                    }
                );

                console.log('   📥 Response received:');
                console.log(`   Model: ${response.model}`);
                console.log(`   Tokens: ${response.usage?.total_tokens || 'unknown'}`);
                console.log(`   Content Preview: ${response.content.substring(0, 100)}...`);

                // Test agent-specific inference
                console.log('\n7. Testing Agent-Specific Inference...');
                
                const agentTests = [
                    {
                        type: 'reasoning',
                        prompt: 'What are the logical steps to solve a complex problem?',
                        systemPrompt: 'You are a reasoning specialist. Think step-by-step and provide logical analysis.'
                    },
                    {
                        type: 'creative',
                        prompt: 'Write a creative opening line for a science fiction story.',
                        systemPrompt: 'You are a creative writing specialist. Be imaginative and original.'
                    }
                ];

                for (const test of agentTests) {
                    console.log(`\n   🔄 Testing ${test.type} agent specialization...`);
                    
                    const agentResponse = await adapter.generateCompletion(
                        test.prompt,
                        {
                            maxTokens: 100,
                            temperature: test.type === 'creative' ? 0.9 : 0.5,
                            systemPrompt: test.systemPrompt
                        }
                    );

                    console.log(`   ✅ ${test.type} response:`);
                    console.log(`   "${agentResponse.content.substring(0, 80)}..."`);
                }

            } catch (inferenceError) {
                console.log(`   ❌ Local inference failed: ${inferenceError instanceof Error ? inferenceError.message : 'Unknown error'}`);
                console.log('   💡 This might be due to:');
                console.log('      - Model not properly loaded in LM Studio');
                console.log('      - Server configuration issues');
                console.log('      - Model compatibility problems');
            }
        }

        // Show privacy and offline benefits
        console.log('\n8. Privacy & Offline Benefits:');
        console.log('   🔒 Privacy: All inference happens locally, no data sent to external servers');
        console.log('   📡 Offline: Works without internet connection once model is downloaded');
        console.log('   💾 Control: Full control over model selection and parameters');
        console.log('   🚀 Performance: No network latency, speed depends on local hardware');
        console.log('   💰 Cost: No per-token charges, only local compute resources');

        // Integration guidance
        console.log('\n9. Integration with CMP System:');
        console.log('   📝 Configuration: Add LM Studio settings to config.json');
        console.log('   🏭 Factory: Use createModelAdapter("lmstudio", config) to create instances');
        console.log('   🎭 Orchestration: All agents can use local models for specialized tasks');
        console.log('   🔄 Fallback: Can be used as backup when external APIs are unavailable');

        console.log('\n✅ LM Studio adapter demonstration complete!');
        console.log('🏠 Local LLM inference ready for privacy-focused AI orchestration');

    } catch (error) {
        console.error('\n❌ LM Studio adapter demonstration failed:', error);
        console.log('\n💡 Common issues and solutions:');
        console.log('   - Ensure LM Studio is installed and running');
        console.log('   - Verify a model is loaded in LM Studio');
        console.log('   - Check that the server is started (Server tab in LM Studio)');
        console.log('   - Confirm the server URL is http://localhost:1234');
        console.log('   - Try restarting LM Studio if connection fails');
    }
}

// Auto-run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateLMStudioAdapter().catch(console.error);
}

export { demonstrateLMStudioAdapter };
