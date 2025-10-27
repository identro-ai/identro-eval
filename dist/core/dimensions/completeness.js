/**
 * Completeness test dimension - tests if output contains all required elements
 */
/**
 * Completeness dimension definition
 *
 * Tests if the agent produces complete outputs containing all required elements.
 * Critical for catching incomplete outputs, missing sections, or partial results.
 */
export const COMPLETENESS_DIMENSION_DEFINITION = {
    name: 'completeness',
    description: 'Tests if the output contains all required elements for the given input',
    short_description: 'Verify output completeness',
    priority: 8,
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When completeness fails, users get frustrated and operations fail:
- **User frustration**: Incomplete answers force users to re-prompt multiple times
- **Workflow interruption**: Missing components break downstream processes
- **Decision paralysis**: Partial information prevents informed decision-making
- **Quality perception**: Incomplete outputs suggest low-quality or rushed work
- **Resource waste**: Teams spend time filling gaps that should have been automated

REAL-WORLD CONSEQUENCES:
- Report generator missing critical sections (financial analysis without recommendations)
- API documentation omitting error codes and edge cases
- Data analysis providing charts without interpretations
- Customer service responses addressing only part of the question
- Code generation providing implementation without tests or documentation

OPERATIONAL IMPACT:
Users expect complete outputs in one interaction. Incomplete responses require follow-ups, breaking user flow and reducing trust in the agent's capabilities.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Test Early):
- Report generators expected to produce comprehensive deliverables
- Documentation generators where missing sections create confusion
- Data analysis agents that must provide complete insights
- Code generators that should include tests, docs, and implementation
- Customer service agents addressing multi-part queries
- Agents producing outputs for immediate use (presentations, reports, contracts)

MEDIUM PRIORITY (Important - Test Before Production):
- Content creation agents with structured output requirements
- Research assistants aggregating from multiple sources
- Summarization agents expected to cover all key points
- Translation agents that must preserve all content

LOWER PRIORITY (Nice-to-have):
- Simple Q&A agents with single-topic responses
- Agents explicitly designed for partial/iterative responses
- Brainstorming tools where completeness isn't expected
- Prototype agents still being developed
`,
    },
    prompts: {
        agent_requirements: `COMPLETENESS DIMENSION:

Generate tests that verify the agent produces COMPLETE outputs containing all required elements.

FOCUS AREAS:
- Multi-part outputs with clear requirements
- Tasks with specific deliverables
- Structured outputs with defined sections
- Complex tasks requiring multiple components

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check for ONE required element
- Use clear, measurable language (e.g., "Output includes X section")
- Focus on what MUST be present in the output

EXAMPLE GOOD CRITERIA:
✅ "Output contains an introduction section"
✅ "All data sources are cited at the end"
✅ "Code includes both implementation and test cases"
✅ "Report has executive summary, analysis, and recommendations"

EXAMPLE BAD CRITERIA:
❌ "Output is complete" (too vague)
❌ "Generate completeness score" (meta-instruction)
❌ "Check all sections" (not specific)

Generate realistic tests based on the agent's actual domain and expected outputs.`,
        team_requirements: `COMPLETENESS DIMENSION FOR TEAMS:

Generate tests that verify teams/crews produce COMPLETE final outputs.

FOCUS AREAS:
- Multi-agent workflow outputs with all required deliverables
- Coordination ensuring all tasks are completed
- Final output contains contributions from all relevant agents
- No missing handoffs or incomplete coordination

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check for ONE required deliverable
- Use clear, measurable language
- Focus on end-to-end completeness

EXAMPLE GOOD CRITERIA:
✅ "Final report includes research findings from all agents"
✅ "All assigned tasks are completed and integrated"
✅ "Output contains all required sections from the workflow"

Generate realistic tests based on the team's actual workflow and deliverables.`,
        flow_requirements: `COMPLETENESS DIMENSION FOR FLOWS:

Generate tests that verify flows produce COMPLETE final outputs.

FOCUS AREAS:
- Final output completeness despite multi-step execution
- All flow stages contribute to final deliverable
- Generated artifacts include all specified components
- No missing steps or incomplete execution paths

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check for ONE required component of final output
- Use clear, measurable language
- Focus on end-to-end output completeness

EXAMPLE GOOD CRITERIA:
✅ "Final deliverable includes outputs from all flow stages"
✅ "All specified artifacts are generated and present"
✅ "Output meets all requirements from the initial input"

SYNTHETIC INPUTS:
- Generate complete task specifications
- Include clear deliverable requirements
- Store in eval-spec.json for user editing

Generate realistic tests based on the flow's actual output requirements.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating if the output is COMPLETE - contains all required elements.

1. **Understand Requirements**:
   - Review the input to identify what was requested
   - List all required elements/sections/components
   - Consider any special_instructions provided
   - Review evaluation_strictness (0-100)

2. **Analyze Output**:
   - Check each required element is present
   - Look for gaps, missing sections, or incomplete parts
   - Verify completeness from start to finish
   - Don't focus on quality, just presence

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating completeness level
   - Document what's present and what's missing

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence. Example: 'Output contains: introduction, methodology, results. Missing: conclusion, references.'",
  "reasoning": "Brief explanation of completeness assessment."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, allow minor omissions
- 41-60: Lenient, require main elements only
- 61-80: Moderate, expect most elements present
- 81-90: Strict, require all specified elements
- 91-100: Very strict, require perfect completeness

COMPLETENESS EVALUATION:
- List what's present in the output
- List what's missing from requirements
- Score based on presence, not quality
- Provide concrete examples of presence/absence`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['quality', 'completeness', 'requirements'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'quality',
        displayName: 'Completeness',
    },
};
//# sourceMappingURL=completeness.js.map