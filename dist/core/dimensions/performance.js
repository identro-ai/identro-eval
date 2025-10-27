/**
 * Performance test dimension - measures latency, throughput, and timeout handling
 */
/**
 * Performance metrics collector
 */
class PerformanceMetrics {
    latencies = [];
    startTime = Date.now();
    endTime = Date.now();
    timeouts = 0;
    errors = 0;
    successful = 0;
    addLatency(latencyMs) {
        this.latencies.push(latencyMs);
        this.successful++;
    }
    addTimeout() {
        this.timeouts++;
    }
    addError() {
        this.errors++;
    }
    setStartTime(time) {
        this.startTime = time;
    }
    setEndTime(time) {
        this.endTime = time;
    }
    getPercentile(percentile) {
        if (this.latencies.length === 0)
            return 0;
        const sorted = [...this.latencies].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
    getThroughput() {
        const durationSeconds = (this.endTime - this.startTime) / 1000;
        const totalRequests = this.successful + this.timeouts + this.errors;
        return {
            requestsPerSecond: durationSeconds > 0 ? totalRequests / durationSeconds : 0,
        };
    }
    getTimeoutRate() {
        const total = this.successful + this.timeouts + this.errors;
        return total > 0 ? this.timeouts / total : 0;
    }
    getErrorRate() {
        const total = this.successful + this.timeouts + this.errors;
        return total > 0 ? this.errors / total : 0;
    }
    getAverageLatency() {
        if (this.latencies.length === 0)
            return 0;
        return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }
}
/**
 * Test performance of agent
 */
export async function testPerformance(runner, inputs, options = {}) {
    const { timeoutMs = 30000, concurrentRequests = 1, warmupRuns = 2, measurementRuns = 10, } = options;
    const metrics = new PerformanceMetrics();
    // Warmup runs (not measured)
    for (let i = 0; i < warmupRuns && i < inputs.length; i++) {
        try {
            await runWithTimeout(runner, inputs[i], timeoutMs);
        }
        catch {
            // Ignore warmup errors
        }
    }
    // Measurement runs
    metrics.setStartTime(Date.now());
    // Process inputs in batches based on concurrency
    for (let i = 0; i < Math.min(measurementRuns, inputs.length); i += concurrentRequests) {
        const batch = inputs.slice(i, Math.min(i + concurrentRequests, inputs.length, i + measurementRuns));
        const promises = batch.map(input => runWithTimeout(runner, input, timeoutMs));
        const results = await Promise.allSettled(promises);
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const testResult = result.value;
                if (testResult.success) {
                    metrics.addLatency(testResult.latencyMs);
                }
                else if (testResult.error?.includes('timeout')) {
                    metrics.addTimeout();
                }
                else {
                    metrics.addError();
                }
            }
            else {
                // Promise rejected
                if (result.reason?.message?.includes('timeout')) {
                    metrics.addTimeout();
                }
                else {
                    metrics.addError();
                }
            }
        });
    }
    metrics.setEndTime(Date.now());
    // Calculate performance score
    const avgLatency = metrics.getAverageLatency();
    const timeoutRate = metrics.getTimeoutRate();
    const errorRate = metrics.getErrorRate();
    // Score calculation (0-1)
    let performanceScore = 1.0;
    // Penalize for high latency (>5s is bad, >10s is very bad)
    if (avgLatency > 10000) {
        performanceScore *= 0.3;
    }
    else if (avgLatency > 5000) {
        performanceScore *= 0.6;
    }
    else if (avgLatency > 2000) {
        performanceScore *= 0.8;
    }
    // Penalize for timeouts
    performanceScore *= (1 - timeoutRate * 0.5);
    // Penalize for errors
    performanceScore *= (1 - errorRate * 0.3);
    return {
        latencyPercentiles: {
            p50: metrics.getPercentile(50),
            p90: metrics.getPercentile(90),
            p95: metrics.getPercentile(95),
            p99: metrics.getPercentile(99),
        },
        throughput: metrics.getThroughput(),
        timeoutRate: metrics.getTimeoutRate(),
        performanceScore: Math.max(0, Math.min(1, performanceScore)),
    };
}
/**
 * Run a test with timeout
 */
async function runWithTimeout(runner, input, timeoutMs) {
    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Test timeout after ${timeoutMs}ms`));
        }, timeoutMs);
        try {
            const startTime = Date.now();
            const result = await runner(input);
            const endTime = Date.now();
            clearTimeout(timeout);
            // Ensure latency is set
            if (!result.latencyMs) {
                result.latencyMs = endTime - startTime;
            }
            resolve(result);
        }
        catch (error) {
            clearTimeout(timeout);
            reject(error);
        }
    });
}
/**
 * Analyze performance results
 */
export function analyzePerformanceResults(results) {
    const recommendations = [];
    let performanceGrade;
    let interpretation = '';
    const p50 = results.latencyPercentiles.p50;
    const p95 = results.latencyPercentiles.p95;
    // Grade based on median latency and consistency
    if (p50 < 500 && p95 < 1000) {
        performanceGrade = 'A';
        interpretation = 'Excellent performance: Fast and consistent response times';
    }
    else if (p50 < 1000 && p95 < 2000) {
        performanceGrade = 'B';
        interpretation = 'Good performance: Acceptable response times with minor variations';
    }
    else if (p50 < 2000 && p95 < 5000) {
        performanceGrade = 'C';
        interpretation = 'Average performance: Response times could be improved';
    }
    else if (p50 < 5000 && p95 < 10000) {
        performanceGrade = 'D';
        interpretation = 'Poor performance: Slow response times affecting user experience';
    }
    else {
        performanceGrade = 'F';
        interpretation = 'Critical performance issues: Unacceptably slow response times';
    }
    // Recommendations based on metrics
    if (p50 > 2000) {
        recommendations.push('Optimize agent processing logic');
        recommendations.push('Consider caching frequently used data');
        recommendations.push('Review LLM model selection (consider faster models)');
    }
    if (p95 > p50 * 3) {
        recommendations.push('High latency variance detected - investigate outliers');
        recommendations.push('Implement request batching or queuing');
    }
    if (results.timeoutRate > 0.1) {
        recommendations.push('High timeout rate - increase timeout or optimize processing');
        recommendations.push('Consider implementing streaming responses');
    }
    if (results.timeoutRate > 0.05) {
        recommendations.push('Some requests timing out - monitor for dimensions');
    }
    if (results.throughput.requestsPerSecond < 1) {
        recommendations.push('Low throughput - consider parallel processing');
        recommendations.push('Implement connection pooling if using external services');
    }
    return {
        interpretation,
        recommendations,
        performanceGrade,
    };
}
/**
 * Generate performance report
 */
export function generatePerformanceReport(results) {
    const analysis = analyzePerformanceResults(results);
    let report = `# Performance Test Report\n\n`;
    report += `**Performance Grade**: ${analysis.performanceGrade}\n`;
    report += `**Performance Score**: ${(results.performanceScore * 100).toFixed(1)}%\n\n`;
    report += `## Latency Metrics\n`;
    report += `- P50 (Median): ${results.latencyPercentiles.p50.toFixed(0)}ms\n`;
    report += `- P90: ${results.latencyPercentiles.p90.toFixed(0)}ms\n`;
    report += `- P95: ${results.latencyPercentiles.p95.toFixed(0)}ms\n`;
    report += `- P99: ${results.latencyPercentiles.p99.toFixed(0)}ms\n\n`;
    report += `## Throughput\n`;
    report += `- Requests/Second: ${results.throughput.requestsPerSecond.toFixed(2)}\n`;
    if (results.throughput.tokensPerSecond) {
        report += `- Tokens/Second: ${results.throughput.tokensPerSecond.toFixed(2)}\n`;
    }
    report += '\n';
    report += `## Reliability\n`;
    report += `- Timeout Rate: ${(results.timeoutRate * 100).toFixed(1)}%\n\n`;
    report += `## Analysis\n`;
    report += `${analysis.interpretation}\n\n`;
    if (analysis.recommendations.length > 0) {
        report += `## Recommendations\n`;
        analysis.recommendations.forEach(rec => {
            report += `- ${rec}\n`;
        });
    }
    return report;
}
/**
 * Compare performance between two test runs
 */
export function comparePerformance(baseline, current) {
    const baselineP50 = baseline.latencyPercentiles.p50;
    const currentP50 = current.latencyPercentiles.p50;
    const latencyChange = ((currentP50 - baselineP50) / baselineP50) * 100;
    const baselineThroughput = baseline.throughput.requestsPerSecond;
    const currentThroughput = current.throughput.requestsPerSecond;
    const throughputChange = ((currentThroughput - baselineThroughput) / baselineThroughput) * 100;
    const improved = latencyChange < 0 || throughputChange > 0;
    let summary = '';
    if (improved) {
        if (latencyChange < -20) {
            summary = `Significant performance improvement: ${Math.abs(latencyChange).toFixed(1)}% faster`;
        }
        else if (latencyChange < 0) {
            summary = `Performance improved: ${Math.abs(latencyChange).toFixed(1)}% faster`;
        }
        else if (throughputChange > 20) {
            summary = `Throughput improved: ${throughputChange.toFixed(1)}% higher`;
        }
        else {
            summary = 'Minor performance improvement';
        }
    }
    else {
        if (latencyChange > 20) {
            summary = `Performance degraded: ${latencyChange.toFixed(1)}% slower`;
        }
        else if (throughputChange < -20) {
            summary = `Throughput degraded: ${Math.abs(throughputChange).toFixed(1)}% lower`;
        }
        else {
            summary = 'Performance relatively unchanged';
        }
    }
    return {
        improved,
        latencyChange,
        throughputChange,
        summary,
    };
}
/**
 * Performance dimension definition
 *
 * IMPORTANT: This dimension file contains ONLY prompts and metadata.
 * ALL configuration values (test_count, timeout_ms, strictness, etc.)
 * come from eval.config.yml
 */
export const PERFORMANCE_DIMENSION_DEFINITION = {
    name: 'performance',
    description: 'Tests agent performance including response time, throughput, and resource efficiency',
    short_description: 'Test performance metrics',
    priority: 6,
    // NO configuration here - all settings come from eval.config.yml
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When performance is poor, users abandon the agent and costs escalate:
- **User abandonment**: Slow responses cause users to quit before completion
- **Poor UX**: Latency creates frustrating, unusable experiences
- **Higher costs**: Slow agents consume more compute resources per request
- **Reduced capacity**: Poor throughput limits how many users can be served
- **Competitive disadvantage**: Users switch to faster alternatives

REAL-WORLD CONSEQUENCES:
- Customer service agent taking 30+ seconds per response (users hang up)
- Research assistant timing out on complex queries (task incomplete)
- Code generator taking minutes per function (developer flow disrupted)
- Data analysis agent processing slowly (blocking business decisions)
- API responses exceeding SLA thresholds (contract violations)

COST & SCALE IMPACT:
Performance directly affects operating costs (compute time) and scaling limits (concurrent users). A 2x performance improvement doubles capacity and halves costs.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Test Early):
- Customer-facing agents in real-time interactions (chat, support)
- High-volume applications serving many concurrent users
- Agents in critical paths affecting business operations
- Systems with strict SLA requirements
- Agents integrated into time-sensitive workflows
- Cost-sensitive deployments where compute costs matter

MEDIUM PRIORITY (Important - Test Before Production):
- Internal tools where reasonable latency is acceptable
- Batch processing agents with flexible timing
- Research assistants where accuracy matters more than speed
- Agents with moderate user load expectations

LOWER PRIORITY (Nice-to-have):
- Offline processing with no time constraints
- One-off tasks where completion matters more than speed
- Prototype agents in development
- Low-usage internal tools
`,
    },
    prompts: {
        agent_requirements: `PERFORMANCE DIMENSION:

Generate tests that verify the agent meets performance requirements.

FOCUS AREAS:
- Response time and latency
- Throughput capabilities
- Resource usage efficiency
- Performance under load

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific performance aspect
- Use clear, measurable language
- Focus on realistic performance expectations for the agent's domain

EXAMPLE GOOD CRITERIA:
✅ "Response time is under 2 seconds for typical inputs"
✅ "Agent processes at least 10 requests per minute"
✅ "Performance remains stable under increased load"

EXAMPLE BAD CRITERIA:
❌ "Generate latency thresholds"  (meta-instruction, not a criterion)
❌ "Agent is fast"  (vague, not measurable)
❌ "Include resource usage metrics"  (meta-instruction)

Generate realistic tests based on the agent's actual use cases and expected workload.`,
        team_requirements: `PERFORMANCE DIMENSION FOR TEAMS:

Generate tests that verify teams/crews meet performance requirements.

FOCUS AREAS:
- Coordination efficiency
- Parallel processing capabilities
- End-to-end workflow performance
- Scalability under load

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific performance aspect
- Use clear, measurable language
- Focus on realistic expectations for team workflows

EXAMPLE GOOD CRITERIA:
✅ "End-to-end workflow completes within 10 seconds"
✅ "Team processes multiple tasks in parallel efficiently"
✅ "Coordination overhead is minimal (< 20% of total time)"

EXAMPLE BAD CRITERIA:
❌ "Create throughput metrics"  (meta-instruction)
❌ "Team is efficient"  (vague)
❌ "Test scalability scenarios"  (meta-instruction)

Generate realistic tests based on the team's actual workflows and expected workload.`,
        flow_requirements: `PERFORMANCE DIMENSION FOR FLOWS:

Generate tests that verify flows meet END-TO-END performance requirements.

FOCUS AREAS:
- Final output delivery time (5-15 minutes typical for complex flows)
- Performance across different execution paths
- Artifact generation efficiency
- Synthetic inputs for human-in-the-loop points

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific performance aspect of FINAL OUTPUT
- Use clear, measurable language
- Focus on end-to-end performance, not internal mechanics

EXAMPLE GOOD CRITERIA:
✅ "Flow completes and delivers final output within 10 minutes"
✅ "Generated artifacts are produced efficiently without delays"
✅ "Performance remains consistent across different execution paths"

EXAMPLE BAD CRITERIA:
❌ "Generate latency thresholds"  (meta-instruction)
❌ "Flow runs fast"  (vague)
❌ "Test internal step performance"  (wrong focus - should be end-to-end only)

SYNTHETIC INPUTS:
- Generate quick human approval scenarios (immediate responses)
- Create efficient user feedback that simulates optimal timing
- Store in eval-spec.json for user editing

Generate realistic tests based on the flow's actual complexity and expected execution time.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating test results against specific performance criteria. For each criterion:

1. **Understand Context**:
   - Review the criterion's evaluation_strictness (0-100, higher = stricter)
   - Consider any special_instructions provided
   - Review performance metrics (latency, throughput, etc.)

2. **Analyze Performance**:
   - Examine actual latency/throughput measurements
   - Look for specific evidence of performance characteristics
   - Consider whether performance meets domain-appropriate expectations

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating confidence
   - Document specific performance metrics as evidence

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific performance metrics. Example: 'Average latency: 1.2s, P95: 2.1s, Throughput: 15 req/min'",
  "reasoning": "Brief explanation of the pass/fail decision."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, allow slower performance
- 41-60: Lenient, focus on acceptable performance
- 61-80: Moderate, expect good performance
- 81-90: Strict, require fast performance
- 91-100: Very strict, require optimal performance

PERFORMANCE EVALUATION:
- Use actual measured metrics (latency, throughput)
- Consider domain-appropriate expectations
- Provide concrete numbers from test runs
- Focus on whether performance is acceptable for the use case`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['performance', 'latency', 'throughput', 'efficiency'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'core',
        displayName: 'Performance',
    },
    // NO variables section - deprecated
    // NO settings section - comes from eval.config.yml
};
//# sourceMappingURL=performance.js.map