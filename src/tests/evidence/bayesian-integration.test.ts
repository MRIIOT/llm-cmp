/**
 * Bayesian Network Integration Tests
 * Validates correct integration of Bayesian evidence processing
 */

import { BayesianNetwork, BayesianNode } from '../../evidence/bayesian/bayesian-network';
import { InferenceEngine } from '../../evidence/bayesian/inference-engine';
import { EvidenceAggregator } from '../../evidence/bayesian/evidence-aggregator';
import { Evidence, BeliefState } from '../../types/evidence.types';

export class BayesianIntegrationTests {
    private network: BayesianNetwork;
    private inferenceEngine: InferenceEngine;
    private aggregator: EvidenceAggregator;
    private testResults: Map<string, boolean> = new Map();

    constructor() {
        this.network = new BayesianNetwork();
        this.inferenceEngine = new InferenceEngine(this.network);
        this.aggregator = new EvidenceAggregator();
    }

    /**
     * Initialize fresh instances for each test
     */
    private resetInstances(): void {
        this.network = new BayesianNetwork();
        this.inferenceEngine = new InferenceEngine(this.network);
        this.aggregator = new EvidenceAggregator();
    }

    /**
     * Test network construction from evidence
     */
    async testNetworkConstruction(): Promise<boolean> {
        console.log("Testing network construction from evidence...");
        this.resetInstances();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Agent consensus achieved with high confidence',
                    source: 'agent_1',
                    confidence: 0.9,
                    topic: 'consensus'
                },
                {
                    content: 'Evidence supports agent belief formation',
                    source: 'agent_2',
                    confidence: 0.85,
                    topic: 'belief'
                },
                {
                    content: 'Consensus influences belief confidence',
                    source: 'agent_3',
                    confidence: 0.8,
                    topic: 'consensus'
                }
            ];

            this.network.constructFromEvidence(evidence);

            // Verify network structure
            const nodes = this.network.getAllNodes();
            const stats = this.network.getStatistics();

            const passed = nodes.length > 0 && 
                          stats.nodeCount > 0 && 
                          stats.edgeCount >= 0 && 
                          !this.network.hasCycles();

            this.testResults.set('network_construction', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in network construction test:", error);
            this.testResults.set('network_construction', false);
            return false;
        }
    }

    /**
     * Test complex evidence relationships
     */
    async testComplexRelationships(): Promise<boolean> {
        console.log("Testing complex evidence relationships...");
        this.resetInstances();

        try {
            // Create nodes with dependencies
            const nodes: BayesianNode[] = [
                {
                    id: 'evidence_quality',
                    name: 'Evidence Quality',
                    states: ['high', 'medium', 'low'],
                    probabilities: new Map([['high', 0.3], ['medium', 0.5], ['low', 0.2]]),
                    parents: [],
                    children: []
                },
                {
                    id: 'source_reliability',
                    name: 'Source Reliability',
                    states: ['reliable', 'unreliable'],
                    probabilities: new Map([['reliable', 0.7], ['unreliable', 0.3]]),
                    parents: [],
                    children: []
                },
                {
                    id: 'belief_confidence',
                    name: 'Belief Confidence',
                    states: ['high', 'low'],
                    probabilities: new Map([['high', 0.5], ['low', 0.5]]),
                    parents: [],
                    children: []
                }
            ];

            // Add nodes
            nodes.forEach(node => this.network.addNode(node));

            // Add dependencies
            this.network.addEdge('evidence_quality', 'belief_confidence');
            this.network.addEdge('source_reliability', 'belief_confidence');

            // Set conditional probability table
            const beliefCPT = {
                node: 'belief_confidence',
                conditions: new Map([
                    ['evidence_quality:high|source_reliability:reliable', new Map([['high', 0.9], ['low', 0.1]])],
                    ['evidence_quality:high|source_reliability:unreliable', new Map([['high', 0.6], ['low', 0.4]])],
                    ['evidence_quality:medium|source_reliability:reliable', new Map([['high', 0.7], ['low', 0.3]])],
                    ['evidence_quality:medium|source_reliability:unreliable', new Map([['high', 0.4], ['low', 0.6]])],
                    ['evidence_quality:low|source_reliability:reliable', new Map([['high', 0.3], ['low', 0.7]])],
                    ['evidence_quality:low|source_reliability:unreliable', new Map([['high', 0.1], ['low', 0.9]])]
                ])
            };

            this.network.setCPT('belief_confidence', beliefCPT);

            // Verify conditional probabilities
            const prob = this.network.getConditionalProbability(
                'belief_confidence',
                'high',
                new Map([['evidence_quality', 'high'], ['source_reliability', 'reliable']])
            );

            const passed = prob === 0.9;
            this.testResults.set('complex_relationships', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in complex relationships test:", error);
            this.testResults.set('complex_relationships', false);
            return false;
        }
    }

    /**
     * Test exact inference
     */
    async testExactInference(): Promise<boolean> {
        console.log("Testing exact inference...");
        this.resetInstances();

        try {
            // Setup simple network
            const causeNode: BayesianNode = {
                id: 'cause',
                name: 'Cause',
                states: ['true', 'false'],
                probabilities: new Map([['true', 0.3], ['false', 0.7]]),
                parents: [],
                children: []
            };

            const effectNode: BayesianNode = {
                id: 'effect',
                name: 'Effect',
                states: ['true', 'false'],
                probabilities: new Map([['true', 0.5], ['false', 0.5]]),
                parents: [],
                children: []
            };

            this.network.addNode(causeNode);
            this.network.addNode(effectNode);
            this.network.addEdge('cause', 'effect');

            // Set CPT for effect given cause
            const effectCPT = {
                node: 'effect',
                conditions: new Map([
                    ['cause:true', new Map([['true', 0.8], ['false', 0.2]])],
                    ['cause:false', new Map([['true', 0.3], ['false', 0.7]])]
                ])
            };

            this.network.setCPT('effect', effectCPT);

            // Query without evidence
            const priorResult = this.inferenceEngine.infer({
                target: 'effect',
                evidence: new Map(),
                method: 'exact'
            });

            // P(effect=true) = P(effect=true|cause=true)*P(cause=true) + P(effect=true|cause=false)*P(cause=false)
            // = 0.8 * 0.3 + 0.3 * 0.7 = 0.24 + 0.21 = 0.45
            const expectedPrior = 0.45;
            const priorCorrect = Math.abs((priorResult.posterior.get('true') || 0) - expectedPrior) < 0.01;

            // Query with evidence
            const posteriorResult = this.inferenceEngine.infer({
                target: 'cause',
                evidence: new Map([['effect', 'true']]),
                method: 'exact'
            });

            // P(cause=true|effect=true) using Bayes rule
            // Should be higher than prior since effect is more likely when cause is true
            const posteriorCorrect = (posteriorResult.posterior.get('true') || 0) > 0.3 &&
                                   posteriorResult.confidence > 0.5;

            const passed = priorCorrect && posteriorCorrect;
            this.testResults.set('exact_inference', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in exact inference test:", error);
            this.testResults.set('exact_inference', false);
            return false;
        }
    }

    /**
     * Test sampling-based inference
     */
    async testSamplingInference(): Promise<boolean> {
        console.log("Testing sampling-based inference...");
        this.resetInstances();

        try {
            // Create larger network for sampling
            const nodes = ['A', 'B', 'C', 'D', 'E'].map(id => ({
                id,
                name: id,
                states: ['true', 'false'],
                probabilities: new Map([['true', 0.5], ['false', 0.5]]),
                parents: [],
                children: []
            }));

            nodes.forEach(node => this.network.addNode(node));

            // Create chain: A -> B -> C -> D -> E
            this.network.addEdge('A', 'B');
            this.network.addEdge('B', 'C');
            this.network.addEdge('C', 'D');
            this.network.addEdge('D', 'E');

            // Perform Gibbs sampling
            const result = this.inferenceEngine.infer({
                target: 'E',
                evidence: new Map([['A', 'true']]),
                method: 'sampling'
            });

            // Verify results
            const probsSum = Array.from(result.posterior.values()).reduce((a, b) => a + b, 0);

            const passed = result.method === 'sampling' &&
                          (result.samples || 0) > 0 &&
                          result.posterior.has('true') &&
                          result.posterior.has('false') &&
                          Math.abs(probsSum - 1.0) < 0.01;

            this.testResults.set('sampling_inference', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in sampling inference test:", error);
            this.testResults.set('sampling_inference', false);
            return false;
        }
    }

    /**
     * Test evidence aggregation from multiple sources
     */
    async testMultiSourceAggregation(): Promise<boolean> {
        console.log("Testing multi-source evidence aggregation...");
        this.resetInstances();

        try {
            const sources = [
                {
                    id: 'expert_1',
                    reliability: 0.9,
                    evidence: [
                        {
                            content: 'Strong evidence for hypothesis',
                            source: 'expert_1',
                            confidence: 0.85,
                            topic: 'hypothesis_A'
                        }
                    ]
                },
                {
                    id: 'expert_2',
                    reliability: 0.8,
                    evidence: [
                        {
                            content: 'Moderate evidence for hypothesis',
                            source: 'expert_2',
                            confidence: 0.65,
                            topic: 'hypothesis_A'
                        }
                    ]
                },
                {
                    id: 'crowd',
                    reliability: 0.6,
                    evidence: [
                        {
                            content: 'Weak evidence against hypothesis',
                            source: 'crowd',
                            confidence: 0.3,
                            topic: 'hypothesis_A'
                        }
                    ]
                }
            ];

            sources.forEach(source => this.aggregator.addSource(source));

            const result = this.aggregator.aggregate({
                method: 'weighted',
                conflictResolution: 'dempster-shafer',
                uncertaintyPropagation: true
            });

            // Check results
            const belief = result.beliefStates.get('hypothesis_A');

            const passed = result.beliefStates.size > 0 &&
                          result.confidence > 0 &&
                          result.sourceCount === 3 &&
                          belief !== undefined &&
                          belief.belief > 0.5 && // Should favor higher reliability sources
                          belief.uncertainty < 0.5;

            this.testResults.set('multi_source_aggregation', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in multi-source aggregation test:", error);
            this.testResults.set('multi_source_aggregation', false);
            return false;
        }
    }

    /**
     * Test hierarchical aggregation
     */
    async testHierarchicalAggregation(): Promise<boolean> {
        console.log("Testing hierarchical aggregation...");
        this.resetInstances();

        try {
            // Create hierarchical sources
            const primarySources = [
                {
                    id: 'primary_1',
                    reliability: 0.95,
                    evidence: [
                        {
                            content: 'Primary evidence',
                            source: 'primary_1',
                            confidence: 0.9,
                            topic: 'fact'
                        }
                    ]
                }
            ];

            const secondarySources = [
                {
                    id: 'secondary_1',
                    reliability: 0.7,
                    evidence: [
                        {
                            content: 'Secondary evidence',
                            source: 'secondary_1',
                            confidence: 0.7,
                            topic: 'fact'
                        }
                    ]
                }
            ];

            primarySources.forEach(s => this.aggregator.addSource(s));
            secondarySources.forEach(s => this.aggregator.addSource(s));

            const result = this.aggregator.aggregate({
                method: 'hierarchical',
                conflictResolution: 'averaging',
                uncertaintyPropagation: true
            });

            // Primary sources should have more influence
            const belief = result.beliefStates.get('fact');

            const passed = result.method === 'hierarchical' &&
                          result.hierarchy !== undefined &&
                          belief !== undefined &&
                          Math.abs(belief.belief - 0.9) < 0.15; // Closer to primary source

            this.testResults.set('hierarchical_aggregation', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in hierarchical aggregation test:", error);
            this.testResults.set('hierarchical_aggregation', false);
            return false;
        }
    }

    /**
     * Test contradictory evidence handling
     */
    async testContradictoryEvidence(): Promise<boolean> {
        console.log("Testing contradictory evidence handling...");
        this.resetInstances();

        try {
            const contradictoryEvidence: Evidence[] = [
                {
                    content: 'System performance is excellent',
                    source: 'team_A',
                    confidence: 0.9,
                    topic: 'performance',
                    sentiment: 1.0
                },
                {
                    content: 'System performance is poor',
                    source: 'team_B',
                    confidence: 0.85,
                    topic: 'performance',
                    sentiment: -1.0
                }
            ];

            this.network.constructFromEvidence(contradictoryEvidence);

            this.aggregator.addSource({
                id: 'teams',
                reliability: 0.8,
                evidence: contradictoryEvidence
            });

            const result = this.aggregator.aggregate({
                method: 'weighted',
                conflictResolution: 'dempster-shafer',
                uncertaintyPropagation: true
            });

            // Should detect conflicts
            const belief = result.beliefStates.get('performance');

            const passed = result.conflicts !== undefined &&
                          result.conflicts.size > 0 &&
                          belief !== undefined &&
                          belief.uncertainty > 0.3; // High uncertainty due to conflict

            this.testResults.set('contradictory_evidence', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in contradictory evidence test:", error);
            this.testResults.set('contradictory_evidence', false);
            return false;
        }
    }

    /**
     * Test performance with large evidence sets
     */
    async testLargeEvidencePerformance(): Promise<boolean> {
        console.log("Testing performance with large evidence sets...");
        this.resetInstances();

        try {
            const largeEvidenceSet: Evidence[] = Array.from({ length: 100 }, (_, i) => ({
                content: `Evidence item ${i}`,
                source: `source_${i % 10}`,
                confidence: 0.5 + (Math.random() * 0.5),
                topic: `topic_${i % 20}`,
                timestamp: new Date(Date.now() - i * 1000000)
            }));

            const startTime = Date.now();
            this.network.constructFromEvidence(largeEvidenceSet);
            const constructionTime = Date.now() - startTime;

            // Verify network is built correctly
            const stats = this.network.getStatistics();

            // Test inference performance
            const inferenceStart = Date.now();
            const result = this.inferenceEngine.infer({
                target: 'topic_0',
                evidence: new Map([['topic_1', 'true']]),
                method: 'exact'
            });
            const inferenceTime = Date.now() - inferenceStart;

            const passed = constructionTime < 1000 && // Should complete in under 1 second
                          stats.nodeCount > 0 &&
                          stats.edgeCount >= 0 &&
                          inferenceTime < 100 && // Inference should be fast
                          result.posterior.size > 0;

            this.testResults.set('performance_large_evidence', passed);
            console.log(`Construction time: ${constructionTime}ms, Inference time: ${inferenceTime}ms`);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in performance test:", error);
            this.testResults.set('performance_large_evidence', false);
            return false;
        }
    }

    /**
     * Run all Bayesian integration tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== BAYESIAN INTEGRATION TESTS ===\n");

        const testMethods = [
            this.testNetworkConstruction.bind(this),
            this.testComplexRelationships.bind(this),
            this.testExactInference.bind(this),
            this.testSamplingInference.bind(this),
            this.testMultiSourceAggregation.bind(this),
            this.testHierarchicalAggregation.bind(this),
            this.testContradictoryEvidence.bind(this),
            this.testLargeEvidencePerformance.bind(this)
        ];

        let allPassed = true;

        for (const testMethod of testMethods) {
            try {
                const result = await testMethod();
                if (!result) {
                    allPassed = false;
                }
            } catch (error) {
                console.error(`Test failed with error: ${error}`);
                allPassed = false;
            }
            console.log(""); // Add spacing between tests
        }

        this.printTestSummary();
        return allPassed;
    }

    private printTestSummary(): void {
        console.log("=== TEST SUMMARY ===");
        let passedCount = 0;
        let totalCount = 0;

        for (const [testName, passed] of this.testResults) {
            console.log(`${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
            if (passed) passedCount++;
            totalCount++;
        }

        console.log(`\nOverall: ${passedCount}/${totalCount} tests passed`);
        console.log(`Success rate: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
    }

    getTestResults(): Map<string, boolean> {
        return new Map(this.testResults);
    }
}
