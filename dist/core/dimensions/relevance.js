/**
 * Relevance test dimension - tests if output addresses the input request
 */
/**
 * Relevance dimension definition
 *
 * Tests if the agent produces relevant outputs that address the input.
 * Critical for catching off-topic responses and scope drift.
 */
export const RELEVANCE_DIMENSION_DEFINITION = {
    name: 'relevance',
    description: 'Tests if output addresses the input request',
    short_description: 'Verify output relevance',
    priority: 7,
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When relevance fails, users waste time and lose trust:
- **Time waste**: Users forced to filter through irrelevant information
- **Cognitive burden**: Mental effort required to extract useful content from noise
- **Trust erosion**: Off-topic responses suggest agent doesn't understand requests
- **Reduced adoption**: Users abandon agents that consistently drift off-topic
- **Inefficiency**: Teams spend time reprompting or manually refining outputs

REAL-WORLD CONSEQUENCES:
- Q&A agent answering different question than what was asked
- Research assistant going on tangents unrelated to research topic
- Customer service agent discussing company history instead of solving the issue
- Code generator including unnecessary libraries and dependencies
- Summarization agent adding commentary instead of just summarizing

PRODUCTIVITY IMPACT:
Users expect focused, on-point responses. Irrelevant content dilutes value and forces users to spend time extracting what they actually need. In high-volume scenarios, this becomes a significant productivity drain.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Test Early):
- Q&A agents where precision is important (customer service, support)
- Search and retrieval systems that must return targeted results
- Summarization agents that should maintain focus
- Task-specific agents with clear scope boundaries
- Production agents where time efficiency matters
- Agents integrated into workflows where off-topic outputs cause downstream issues

MEDIUM PRIORITY (Important - Test Before Production):
- Research assistants that can benefit from some context
- Content creation agents where some exploration is acceptable
- Analysis agents that may need related context
- General-purpose chatbots with conversational flexibility

LOWER PRIORITY (Nice-to-have):
- Brainstorming assistants where divergence is valuable
- Creative writing agents where exploration is encouraged
- Exploratory agents designed to surface unexpected connections
- Conversational agents where tangents are part of the experience
`,
    },
    prompts: {
        agent_requirements: `RELEVANCE DIMENSION:

Generate tests that verify the agent produces RELEVANT outputs that address the input.

FOCUS AREAS:
- Clear, specific input requests
- Tasks with defined scope
- Questions with clear intent
- Scenarios where drift is possible

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE relevance aspect
- Use clear statements about what should be addressed
- Focus on scope and topic adherence

EXAMPLE GOOD CRITERIA:
✅ "Output focuses on Q3 results (not other quarters)"
✅ "Discusses sales performance (not marketing or operations)"
✅ "Covers Northeast region specifically (not other regions)"
✅ "No irrelevant tangents about company history"

EXAMPLE BAD CRITERIA:
❌ "Output is relevant" (too vague)
❌ "Stays on topic" (not specific)
❌ "Addresses the question" (meta-instruction)

Generate realistic tests with clear scope boundaries.`,
        team_requirements: `RELEVANCE DIMENSION FOR TEAMS:

Generate tests that verify teams/crews produce RELEVANT outputs.

FOCUS AREAS:
- Team output addresses original request
- No scope creep from agent collaboration
- Final deliverable stays focused
- All team contributions are relevant

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check relevance of final output
- Use clear scope statements
- Focus on team staying focused together

EXAMPLE GOOD CRITERIA:
✅ "Final output addresses the specific request made"
✅ "No off-topic information from any team member"
✅ "Team maintains focus on assigned scope"

Generate realistic tests for team workflows.`,
        flow_requirements: `RELEVANCE DIMENSION FOR FLOWS:

Generate tests that verify flows produce RELEVANT final outputs.

FOCUS AREAS:
- Final output relevance to initial input
- No scope drift through flow stages
- All generated artifacts are relevant
- Focus maintained end-to-end

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check final output relevance
- Use clear scope statements
- Focus on end-to-end relevance

EXAMPLE GOOD CRITERIA:
✅ "Final deliverable addresses the original request"
✅ "No off-topic content in any generated artifact"
✅ "Flow maintains focus throughout execution"

Generate realistic tests for flow outputs.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating if the output is RELEVANT to the input.

1. **Understand Request**:
   - Identify what was asked in the input
   - Note the specific scope requested
   - Identify topic boundaries
   - Consider evaluation_strictness (0-100)

2. **Analyze Relevance**:
   - Check if output addresses the request
   - Verify scope is appropriate (not too broad/narrow)
   - Look for off-topic tangents
   - Check for unnecessary information
   - Verify focus is maintained throughout

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating relevance level
   - Document what's relevant and what's not

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence. Example: 'Output focuses on Q3 sales (relevant). Includes Q2 comparison (acceptable context). Discusses marketing strategy (off-topic). 80% of content is directly relevant.'",
  "reasoning": "Brief explanation of relevance assessment."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, allow tangents and broad scope
- 41-60: Lenient, allow some context and background
- 61-80: Moderate, expect mostly relevant content
- 81-90: Strict, require tight focus
- 91-100: Very strict, zero tolerance for off-topic

RELEVANCE EVALUATION:
- Distinguish between context (helpful) and tangent (irrelevant)
- Provide percentage of relevant vs irrelevant content
- Be specific about what's off-topic
- Consider if breadth is appropriate for request`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['quality', 'relevance', 'scope', 'focus'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'quality',
        displayName: 'Relevance',
    },
};
//# sourceMappingURL=relevance.js.map