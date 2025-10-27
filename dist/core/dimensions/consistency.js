/**
 * Consistency test dimension - tests output consistency across multiple runs
 */
/**
 * Default similarity function using string comparison
 */
function defaultSimilarity(a, b) {
    const strA = JSON.stringify(a);
    const strB = JSON.stringify(b);
    if (strA === strB)
        return 1.0;
    // Calculate Levenshtein distance-based similarity
    const maxLen = Math.max(strA.length, strB.length);
    if (maxLen === 0)
        return 1.0;
    const distance = levenshteinDistance(strA, strB);
    return 1 - (distance / maxLen);
}
/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
/**
 * Test consistency of agent outputs
 */
export async function testConsistency(runner, inputs, options = {}) {
    const { runsPerInput = 5, similarityThreshold = 0.8, similarityFn = defaultSimilarity } = options;
    const allSimilarityScores = [];
    const outputsByInput = new Map();
    // Run each input multiple times
    for (const input of inputs) {
        const inputKey = JSON.stringify(input);
        const outputs = [];
        for (let run = 0; run < runsPerInput; run++) {
            const result = await runner(input);
            if (result.success) {
                outputs.push(result.output);
            }
        }
        outputsByInput.set(inputKey, outputs);
        // Calculate pairwise similarities for this input
        for (let i = 0; i < outputs.length; i++) {
            for (let j = i + 1; j < outputs.length; j++) {
                const similarity = similarityFn(outputs[i], outputs[j]);
                allSimilarityScores.push(similarity);
            }
        }
    }
    // Calculate overall metrics
    const avgSimilarity = allSimilarityScores.length > 0
        ? allSimilarityScores.reduce((a, b) => a + b, 0) / allSimilarityScores.length
        : 0;
    const variance = calculateVariance(allSimilarityScores);
    const isConsistent = avgSimilarity >= similarityThreshold;
    // Calculate confidence based on number of samples
    const sampleSize = inputs.length * runsPerInput;
    const confidence = Math.min(1.0, sampleSize / 50); // Max confidence at 50 samples
    return {
        outputVariance: variance,
        similarityScores: allSimilarityScores,
        isConsistent,
        confidence
    };
}
/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values) {
    if (values.length === 0)
        return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}
/**
 * Analyze consistency dimensions
 */
export function analyzeConsistencyDimensions(results) {
    const avgSimilarity = results.similarityScores.length > 0
        ? results.similarityScores.reduce((a, b) => a + b, 0) / results.similarityScores.length
        : 0;
    let interpretation = '';
    const recommendations = [];
    let score = avgSimilarity;
    if (results.isConsistent) {
        if (avgSimilarity > 0.95) {
            interpretation = 'Highly consistent: Agent produces nearly identical outputs for same inputs';
        }
        else if (avgSimilarity > 0.85) {
            interpretation = 'Consistent: Agent outputs are similar with minor variations';
        }
        else {
            interpretation = 'Moderately consistent: Agent outputs follow similar dimensions';
        }
    }
    else {
        if (avgSimilarity < 0.5) {
            interpretation = 'Highly inconsistent: Agent outputs vary significantly';
            recommendations.push('Consider setting a fixed random seed');
            recommendations.push('Review temperature settings in LLM configuration');
            recommendations.push('Implement output validation and normalization');
        }
        else {
            interpretation = 'Inconsistent: Agent outputs show notable variations';
            recommendations.push('Reduce temperature for more deterministic outputs');
            recommendations.push('Add output structure constraints');
        }
    }
    if (results.outputVariance > 0.2) {
        recommendations.push('High variance detected - consider implementing output stabilization');
    }
    if (results.confidence < 0.5) {
        recommendations.push('Low confidence due to limited test samples - consider running more tests');
    }
    return {
        interpretation,
        recommendations,
        score
    };
}
/**
 * Consistency dimension definition
 *
 * IMPORTANT: This dimension file contains ONLY prompts and metadata.
 * ALL configuration values (test_count, runs_per_input, strictness, etc.)
 * come from eval.config.yml
 */
export const CONSISTENCY_DIMENSION_DEFINITION = {
    name: 'consistency',
    description: 'Tests response consistency across multiple runs with same input to verify reliable outputs',
    short_description: 'Verify reliable outputs',
    priority: 5,
    // NO configuration here - all settings come from eval.config.yml
    /**
     * Optional context for LLM prompt enrichment
     * Helps LLM understand business impact and generate more relevant tests
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When consistency fails, users experience:
- **Loss of trust**: Different answers to the same question erode confidence
- **Operational chaos**: Teams can't rely on agent outputs for decisions
- **Support burden**: Inconsistent responses generate support tickets and complaints
- **Compliance risks**: Financial/healthcare agents must be deterministic for regulatory compliance

REAL-WORLD CONSEQUENCES:
- Customer service bots giving contradictory refund policies in same conversation
- Financial agents calculating different investment returns for identical portfolios
- Healthcare chatbots providing inconsistent medical guidance
- Legal assistants producing varying interpretations of same contract clauses

TECHNICAL IMPACT:
- Can't confidently deploy to production
- Debugging becomes nearly impossible (can't reproduce issues)
- A/B testing and quality measurement become unreliable
- User experience degrades unpredictably
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Test Early):
- Production customer-facing agents where trust is paramount
- Financial/healthcare/legal domains requiring deterministic behavior
- Agents making decisions that directly affect users or business operations
- Systems where outputs are cached or stored for future reference
- Multi-agent workflows where downstream agents depend on consistent inputs

MEDIUM PRIORITY (Important - Test Before Production):
- Internal tools where consistency improves workflow reliability
- Automated reporting/analytics systems
- Content generation where brand voice must be stable
- Data processing pipelines with quality requirements

LOWER PRIORITY (Nice-to-have):
- Creative content generation where variation is desirable (brainstorming, ideation)
- Exploratory research assistants where diverse perspectives add value
- Experimental or prototype agents still in development
- Use cases explicitly requiring randomness or variety
`,
    },
    prompts: {
        agent_requirements: `CONSISTENCY DIMENSION:

Generate tests that verify the agent produces consistent outputs across multiple runs.

FOCUS AREAS:
- Response consistency with identical inputs
- Output format stability
- Deterministic behavior dimensions

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific aspect
- Use clear, measurable language
- Focus on the agent's actual domain and use cases

EXAMPLE GOOD CRITERIA:
✅ "Output maintains consistent JSON structure across all runs"
✅ "Key information (name, email, score) is preserved in all responses"
✅ "Response format follows the specified template"

EXAMPLE BAD CRITERIA:
❌ "Generate similarity thresholds"  (meta-instruction, not a criterion)
❌ "Output is good"  (vague, not measurable)
❌ "Test passes if all runs succeed"  (meta-instruction)

Generate realistic tests based on the agent's actual capabilities and domain.`,
        team_requirements: `CONSISTENCY DIMENSION FOR TEAMS:

Generate tests that verify teams/crews produce consistent outputs across multiple runs.

FOCUS AREAS:
- Workflow coordination consistency
- Consistent task delegation and execution
- Stable multi-agent collaboration dimensions
- Final output consistency despite internal variations

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific aspect
- Use clear, measurable language
- Focus on the team's actual domain and workflows

EXAMPLE GOOD CRITERIA:
✅ "Final report structure is consistent across all runs"
✅ "Task delegation follows the same dimension in all executions"
✅ "Key findings are present in all outputs"

EXAMPLE BAD CRITERIA:
❌ "Calculate similarity scores"  (meta-instruction)
❌ "Team works well"  (vague)
❌ "Include scoring methodology"  (meta-instruction)

Generate realistic tests based on the team's actual workflows and use cases.`,
        flow_requirements: `CONSISTENCY DIMENSION FOR FLOWS:

Generate tests that verify flows produce consistent FINAL OUTPUTS across multiple runs.

FOCUS AREAS:
- Final output consistency with identical inputs
- Consistent artifact generation (files, documents, reports)
- Stable end-to-end workflow results
- Synthetic inputs for human-in-the-loop points

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific aspect of FINAL OUTPUT
- Use clear, measurable language
- Focus on end-to-end results, not internal mechanics

EXAMPLE GOOD CRITERIA:
✅ "Final report contains all required sections across all runs"
✅ "Generated artifacts maintain consistent format"
✅ "Key recommendations are present in all outputs"

EXAMPLE BAD CRITERIA:
❌ "Generate similarity thresholds"  (meta-instruction)
❌ "Flow executes well"  (vague)
❌ "Test internal step consistency"  (wrong focus - should be final output only)

SYNTHETIC INPUTS:
- Generate realistic human approval/rejection scenarios
- Create user feedback for interactive points
- Store in eval-spec.json for user editing

Generate realistic tests based on the flow's actual domain and use cases.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating test results against specific criteria. For each criterion:

1. **Understand Context**:
   - Review the criterion's evaluation_strictness (0-100, higher = stricter)
   - Consider any special_instructions provided
   - Review all test run outputs to compare consistency

2. **Analyze Outputs**:
   - Examine outputs from all runs
   - Look for specific evidence of consistency or variation
   - Consider semantic meaning, not just exact matches

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating confidence
   - Document specific evidence from outputs

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence from outputs. Example: 'Run 1 returned X, Run 2 returned Y, Run 3 returned Z. Dimension shows...'",
  "reasoning": "Brief explanation of the pass/fail decision."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, overlook minor variations
- 41-60: Lenient, focus on major consistency
- 61-80: Moderate, balanced evaluation
- 81-90: Strict, minor inconsistencies matter
- 91-100: Very strict, near-perfection required

CONSISTENCY EVALUATION:
- Compare all runs for the same input
- Look for structural, semantic, and format consistency
- Provide concrete examples from actual outputs
- Focus on meaningful differences, not trivial formatting`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['consistency', 'reliability', 'multi-run', 'variance'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'core',
        displayName: 'Consistency',
    },
    // NO variables section - deprecated
    // NO settings section - comes from eval.config.yml
};
//# sourceMappingURL=consistency.js.map