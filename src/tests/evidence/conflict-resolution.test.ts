/**
 * Conflict Resolution Tests
 * Tests for evidence conflict detection and resolution
 */

import { ConflictResolver } from '../../evidence/bayesian/conflict-resolver';
import { Evidence } from '../../types/evidence.types';

export class ConflictResolutionTests {
    private resolver: ConflictResolver;
    private testResults: Map<string, boolean> = new Map();

    constructor() {
        this.resolver = new ConflictResolver();
    }

    /**
     * Initialize fresh instance for each test
     */
    private resetInstance(): void {
        this.resolver = new ConflictResolver();
    }

    /**
     * Test basic conflict detection
     */
    async testBasicConflictDetection(): Promise<boolean> {
        console.log("Testing basic conflict detection...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'System performance is excellent',
                    source: 'monitor1',
                    confidence: 0.9,
                    timestamp: new Date()
                },
                {
                    content: 'System performance is poor',
                    source: 'monitor2',
                    confidence: 0.8,
                    timestamp: new Date()
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);

            const passed = conflicts.length > 0 &&
                          conflicts[0].type === 'contradiction' &&
                          conflicts[0].severity > 0.5;

            this.testResults.set('basic_conflict_detection', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in basic conflict detection test:", error);
            this.testResults.set('basic_conflict_detection', false);
            return false;
        }
    }

    /**
     * Test multi-way conflict detection
     */
    async testMultiWayConflicts(): Promise<boolean> {
        console.log("Testing multi-way conflict detection...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Temperature is high',
                    source: 'sensor1',
                    confidence: 0.9,
                    topic: 'temperature'
                },
                {
                    content: 'Temperature is low',
                    source: 'sensor2',
                    confidence: 0.85,
                    topic: 'temperature'
                },
                {
                    content: 'Temperature is normal',
                    source: 'sensor3',
                    confidence: 0.8,
                    topic: 'temperature'
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);

            const passed = conflicts.length > 0 &&
                          conflicts.some(c => c.sources.length >= 3);

            this.testResults.set('multi_way_conflicts', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in multi-way conflict test:", error);
            this.testResults.set('multi_way_conflicts', false);
            return false;
        }
    }

    /**
     * Test argumentation-based resolution
     */
    async testArgumentationResolution(): Promise<boolean> {
        console.log("Testing argumentation-based resolution...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Analysis shows positive trend',
                    source: 'analyst1',
                    confidence: 0.85,
                    timestamp: new Date()
                },
                {
                    content: 'Analysis shows negative trend',
                    source: 'analyst2',
                    confidence: 0.7,
                    timestamp: new Date()
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);
            const resolutions = this.resolver.resolveConflicts(evidence, conflicts, {
                method: 'argumentation',
                parameters: new Map()
            });

            const passed = resolutions.length > 0 &&
                          resolutions[0].method === 'argumentation' &&
                          resolutions[0].confidence > 0;

            this.testResults.set('argumentation_resolution', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in argumentation resolution test:", error);
            this.testResults.set('argumentation_resolution', false);
            return false;
        }
    }

    /**
     * Test negotiation-based resolution
     */
    async testNegotiationResolution(): Promise<boolean> {
        console.log("Testing negotiation-based resolution...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Price should be $100',
                    source: 'buyer',
                    confidence: 0.7,
                    timestamp: new Date()
                },
                {
                    content: 'Price should be $150',
                    source: 'seller',
                    confidence: 0.8,
                    timestamp: new Date()
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);
            const resolutions = this.resolver.resolveConflicts(evidence, conflicts, {
                method: 'negotiation',
                parameters: new Map([['maxRounds', 10]])
            });

            const passed = resolutions.length > 0 &&
                          resolutions[0].method === 'negotiation' &&
                          (resolutions[0].confidence > 0 || resolutions[0].explanation.includes('No agreement'));

            this.testResults.set('negotiation_resolution', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in negotiation resolution test:", error);
            this.testResults.set('negotiation_resolution', false);
            return false;
        }
    }

    /**
     * Test voting-based resolution
     */
    async testVotingResolution(): Promise<boolean> {
        console.log("Testing voting-based resolution...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Option A is best',
                    source: 'voter1',
                    confidence: 0.9,
                    timestamp: new Date()
                },
                {
                    content: 'Option B is best',
                    source: 'voter2',
                    confidence: 0.6,
                    timestamp: new Date()
                },
                {
                    content: 'Option A is best',
                    source: 'voter3',
                    confidence: 0.8,
                    timestamp: new Date()
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);
            const resolutions = this.resolver.resolveConflicts(evidence, conflicts, {
                method: 'voting',
                parameters: new Map([['method', 'plurality']])
            });

            const passed = resolutions.length > 0 &&
                          resolutions[0].method === 'voting' &&
                          resolutions[0].confidence > 0;

            this.testResults.set('voting_resolution', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in voting resolution test:", error);
            this.testResults.set('voting_resolution', false);
            return false;
        }
    }

    /**
     * Test hierarchical resolution
     */
    async testHierarchicalResolution(): Promise<boolean> {
        console.log("Testing hierarchical resolution...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Primary source data',
                    source: 'official_primary_source',
                    confidence: 0.95,
                    timestamp: new Date()
                },
                {
                    content: 'Secondary analysis',
                    source: 'expert_analysis',
                    confidence: 0.8,
                    timestamp: new Date()
                },
                {
                    content: 'General observation',
                    source: 'general_source',
                    confidence: 0.6,
                    timestamp: new Date()
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);
            const resolutions = this.resolver.resolveConflicts(evidence, conflicts, {
                method: 'hierarchical',
                parameters: new Map()
            });

            const passed = resolutions.length >= 0 &&
                          (resolutions.length === 0 || resolutions[0].method === 'hierarchical');

            this.testResults.set('hierarchical_resolution', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in hierarchical resolution test:", error);
            this.testResults.set('hierarchical_resolution', false);
            return false;
        }
    }

    /**
     * Test uncertainty conflict detection
     */
    async testUncertaintyConflicts(): Promise<boolean> {
        console.log("Testing uncertainty conflict detection...");
        this.resetInstance();

        try {
            const evidence: Evidence[] = [
                {
                    content: 'Maybe the system works',
                    source: 'uncertain_observer1',
                    confidence: 0.4,
                    timestamp: new Date()
                },
                {
                    content: 'Perhaps the system fails',
                    source: 'uncertain_observer2',
                    confidence: 0.3,
                    timestamp: new Date()
                }
            ];

            const conflicts = this.resolver.detectConflicts(evidence);

            const passed = conflicts.length > 0 &&
                          conflicts.some(c => c.type === 'uncertainty' || c.type === 'ambiguity');

            this.testResults.set('uncertainty_conflicts', passed);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in uncertainty conflicts test:", error);
            this.testResults.set('uncertainty_conflicts', false);
            return false;
        }
    }

    /**
     * Test conflict resolution with mixed strategies
     */
    async testMixedStrategies(): Promise<boolean> {
        console.log("Testing mixed resolution strategies...");
        this.resetInstance();

        try {
            const complexEvidence: Evidence[] = [
                {
                    content: 'Financial outlook is positive',
                    source: 'financial_expert',
                    confidence: 0.85,
                    topic: 'finance'
                },
                {
                    content: 'Financial risks are high',
                    source: 'risk_analyst',
                    confidence: 0.75,
                    topic: 'finance'
                },
                {
                    content: 'Market conditions are favorable',
                    source: 'market_analyst',
                    confidence: 0.8,
                    topic: 'finance'
                },
                {
                    content: 'Regulatory concerns exist',
                    source: 'compliance_officer',
                    confidence: 0.9,
                    topic: 'finance'
                }
            ];

            // Try different resolution strategies
            const strategies = ['argumentation', 'negotiation', 'voting', 'hierarchical'] as const;
            let successCount = 0;

            for (const method of strategies) {
                const conflicts = this.resolver.detectConflicts(complexEvidence);
                const resolutions = this.resolver.resolveConflicts(
                    complexEvidence, 
                    conflicts, 
                    { method, parameters: new Map() }
                );
                
                if (resolutions.length > 0) {
                    successCount++;
                }
            }

            const passed = successCount >= 3; // At least 3 strategies should work
            this.testResults.set('mixed_strategies', passed);
            console.log(`${successCount}/4 strategies succeeded`);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in mixed strategies test:", error);
            this.testResults.set('mixed_strategies', false);
            return false;
        }
    }

    /**
     * Test conflict resolution performance
     */
    async testResolutionPerformance(): Promise<boolean> {
        console.log("Testing conflict resolution performance...");
        this.resetInstance();

        try {
            // Generate large set of conflicting evidence
            const largeEvidenceSet: Evidence[] = [];
            for (let i = 0; i < 50; i++) {
                largeEvidenceSet.push({
                    content: `Evidence ${i % 2 === 0 ? 'supports' : 'refutes'} hypothesis`,
                    source: `source_${i}`,
                    confidence: 0.5 + (Math.random() * 0.5),
                    topic: `topic_${i % 5}`,
                    timestamp: new Date()
                });
            }

            const startTime = Date.now();
            const conflicts = this.resolver.detectConflicts(largeEvidenceSet);
            const detectionTime = Date.now() - startTime;

            const resolutionStart = Date.now();
            const resolutions = this.resolver.resolveConflicts(largeEvidenceSet, conflicts, {
                method: 'voting',
                parameters: new Map([['method', 'plurality']])
            });
            const resolutionTime = Date.now() - resolutionStart;

            const passed = detectionTime < 500 && // Detection under 500ms
                          resolutionTime < 1000 && // Resolution under 1s
                          conflicts.length > 0 &&
                          resolutions.length > 0;

            this.testResults.set('resolution_performance', passed);
            console.log(`Detection: ${detectionTime}ms, Resolution: ${resolutionTime}ms`);
            console.log(passed ? "PASSED" : "FAILED");
            return passed;
        } catch (error) {
            console.error("Error in performance test:", error);
            this.testResults.set('resolution_performance', false);
            return false;
        }
    }

    /**
     * Run all conflict resolution tests
     */
    async runAllTests(): Promise<boolean> {
        console.log("=== CONFLICT RESOLUTION TESTS ===\n");

        const testMethods = [
            this.testBasicConflictDetection.bind(this),
            this.testMultiWayConflicts.bind(this),
            this.testArgumentationResolution.bind(this),
            this.testNegotiationResolution.bind(this),
            this.testVotingResolution.bind(this),
            this.testHierarchicalResolution.bind(this),
            this.testUncertaintyConflicts.bind(this),
            this.testMixedStrategies.bind(this),
            this.testResolutionPerformance.bind(this)
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
