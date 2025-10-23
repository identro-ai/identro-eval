"use strict";
/**
 * Accuracy test dimension - tests factual correctness and detects hallucinations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCURACY_DIMENSION_DEFINITION = void 0;
/**
 * Accuracy dimension definition
 *
 * Tests if the agent produces factually correct outputs.
 * Critical for catching hallucinations, false claims, and incorrect data.
 */
exports.ACCURACY_DIMENSION_DEFINITION = {
    name: 'accuracy',
    description: 'Tests factual correctness and detects hallucinations',
    short_description: 'Verify factual correctness',
    priority: 9,
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When accuracy fails, the consequences are severe:
- **Misinformation spread**: Users make decisions based on false information
- **Legal liability**: Incorrect medical, financial, or legal advice can result in lawsuits
- **Reputation damage**: One hallucinated fact destroys credibility and trust
- **Operational failures**: Business decisions based on wrong data lead to costly mistakes
- **Safety risks**: Incorrect technical specifications can cause physical harm

REAL-WORLD CONSEQUENCES:
- Medical chatbot suggesting wrong medication dosages
- Financial advisor providing incorrect investment data leading to losses
- Customer service bot stating false company policies causing conflicts
- Technical documentation with incorrect API specifications breaking integrations
- Research assistant citing non-existent papers or fabricating statistics

CRITICAL DOMAINS:
In healthcare, finance, legal, and technical domains, even small inaccuracies can have catastrophic consequences. Users rely on agents to provide trustworthy information.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Must Test):
- Medical, healthcare, and wellness agents providing health information
- Financial advisors handling money, investments, or regulatory compliance
- Legal assistants providing legal guidance or document analysis
- Technical documentation generators for APIs, systems, or safety-critical software
- Educational content creators where factual accuracy is essential
- Customer service agents stating company policies or procedures
- Any agent providing information that users will act upon

MEDIUM PRIORITY (Important - Test Before Production):
- Research assistants aggregating information from sources
- Data analysis agents reporting statistics and metrics
- Content creators requiring factual grounding
- Agents summarizing news or current events
- Product recommendation systems with feature comparisons

LOWER PRIORITY (Nice-to-have):
- Creative writing assistants (fiction, storytelling)
- Brainstorming tools where imagination trumps facts
- Entertainment chatbots without informational purpose
- Prototype agents in early development stages
`,
    },
    prompts: {
        agent_requirements: `ACCURACY DIMENSION:

Generate tests that verify the agent produces FACTUALLY CORRECT outputs.

FOCUS AREAS:
- Factual information that can be verified
- Numerical data, dates, statistics
- Claims that require evidence
- Domain-specific knowledge accuracy
- Source attribution and citations

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE factual aspect
- Use clear, verifiable statements
- Focus on facts that can be validated

EXAMPLE GOOD CRITERIA:
✅ "Numerical data matches known statistics"
✅ "Dates and timelines are historically accurate"
✅ "Technical specifications are correct for the product"
✅ "No contradictory statements within the output"
✅ "Sources cited are real and relevant"

EXAMPLE BAD CRITERIA:
❌ "Output is accurate" (too vague)
❌ "Check for hallucinations" (meta-instruction)
❌ "Verify all facts" (not specific)

Generate realistic tests based on the agent's knowledge domain.`,
        team_requirements: `ACCURACY DIMENSION FOR TEAMS:

Generate tests that verify teams/crews produce FACTUALLY CORRECT outputs.

FOCUS AREAS:
- Cross-agent consistency in facts
- Aggregated data accuracy
- No conflicting information between agents
- Final output factual correctness

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE factual aspect across the team
- Use clear, verifiable statements
- Focus on consistency and accuracy

EXAMPLE GOOD CRITERIA:
✅ "Data from different agents is consistent"
✅ "No factual contradictions in the final output"
✅ "Aggregated statistics are mathematically correct"

Generate realistic tests based on the team's knowledge domain.`,
        flow_requirements: `ACCURACY DIMENSION FOR FLOWS:

Generate tests that verify flows produce FACTUALLY CORRECT final outputs.

FOCUS AREAS:
- Final output factual accuracy
- Data accuracy preserved through flow stages
- No information degradation or corruption
- Generated artifacts contain correct information

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE factual aspect of final output
- Use clear, verifiable statements
- Focus on end-to-end accuracy

EXAMPLE GOOD CRITERIA:
✅ "Final output contains accurate data from all stages"
✅ "No factual errors introduced during processing"
✅ "Generated artifacts have correct information"

Generate realistic tests based on the flow's domain and data handling.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating FACTUAL ACCURACY of the output.

1. **Identify Facts**:
   - List all factual claims in the output
   - Identify numerical data, dates, names, events
   - Note any sources or citations provided
   - Consider evaluation_strictness (0-100)

2. **Verify Accuracy**:
   - Check each fact against known information
   - Verify numerical data is correct
   - Confirm dates and timelines are accurate
   - Check for contradictions within output
   - Validate source citations if provided

3. **Detect Hallucinations**:
   - Identify claims that seem invented
   - Check for suspiciously specific but unverifiable details
   - Look for contradictions with known facts
   - Note any impossibilities or anachronisms

4. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating accuracy level
   - Document specific inaccuracies found

5. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence. Example: 'Claims Python 3.12 released in 2020 (incorrect, it was 2023). States feature X exists (correct). Population figure 50M matches census data (correct).'",
  "reasoning": "Brief explanation of accuracy assessment."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, allow minor factual errors
- 41-60: Lenient, focus on major facts only
- 61-80: Moderate, expect good accuracy
- 81-90: Strict, require high accuracy
- 91-100: Very strict, require perfect accuracy

ACCURACY EVALUATION:
- Be specific about what's correct and incorrect
- Cite evidence when possible
- Note if claims are unverifiable vs wrong
- Consider domain-specific knowledge requirements`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['quality', 'accuracy', 'hallucination', 'facts'],
        complexity: 'advanced',
        author: 'Identro Core',
        category: 'quality',
        displayName: 'Accuracy',
    },
};
//# sourceMappingURL=accuracy.js.map