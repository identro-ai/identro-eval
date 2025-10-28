"use strict";
/**
 * Instruction Following test dimension - tests adherence to specified instructions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTRUCTION_FOLLOWING_DIMENSION_DEFINITION = void 0;
/**
 * Instruction Following dimension definition
 *
 * Tests if the agent follows specified instructions and constraints.
 * Critical for catching instruction violations and constraint failures.
 */
exports.INSTRUCTION_FOLLOWING_DIMENSION_DEFINITION = {
    name: 'instruction-following',
    description: 'Tests adherence to specified instructions and constraints',
    short_description: 'Verify instruction adherence',
    priority: 8,
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When instruction-following fails, outputs become unpredictable and unreliable:
- **Requirement violations**: Outputs don't meet specified needs
- **Quality inconsistency**: Can't rely on agent to follow guidelines
- **Workflow disruption**: Outputs require manual correction to meet specs
- **User frustration**: Agent appears to "not listen" or understand
- **Rework costs**: Time spent correcting outputs that should have been right first time

REAL-WORLD CONSEQUENCES:
- Agent ignoring length constraints causing UI overflow or truncation issues
- Style guidelines violated resulting in inconsistent brand presentation
- Format requirements ignored breaking downstream processing
- Tone requirements missed creating inappropriate communications
- Constraints violated causing compliance or policy failures

RELIABILITY IMPACT:
Instruction-following is fundamental to agent reliability. If an agent can't consistently follow explicit instructions, users can't depend on it for any automated task.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Test Early):
- Agents with strict operational constraints (legal compliance, brand guidelines)
- Content generators with style and format requirements
- Agents producing regulated content (medical, financial disclosures)
- Customer-facing agents with tone and brand voice requirements
- Agents generating technical documentation with specific structures
- Any agent where requirements are non-negotiable

MEDIUM PRIORITY (Important - Test Before Production):
- Report generators with template requirements
- Code generators with style guide constraints
- Data processors with transformation rules
- Agents with quality or output standards

LOWER PRIORITY (Nice-to-have):
- Exploratory agents where flexibility is desired
- Creative assistants where interpretation is acceptable
- Prototype agents without strict requirements
- Conversational agents with fluid interaction dimensions
`,
    },
    prompts: {
        agent_requirements: `INSTRUCTION FOLLOWING DIMENSION:

Generate tests that verify the agent FOLLOWS INSTRUCTIONS and CONSTRAINTS.

FOCUS AREAS:
- Clear, specific instructions with measurable requirements
- Constraints that can be validated (length, style, format)
- Requirements with clear success criteria
- Prohibited actions or elements

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE instruction or constraint
- Use clear, measurable statements
- Focus on adherence to specifications

EXAMPLE GOOD CRITERIA:
✅ "Output is exactly 3 paragraphs (not 2 or 4)"
✅ "Uses simple language (no technical jargon)"
✅ "Includes exactly 2 examples (not 1 or 3)"
✅ "Written in formal tone (not casual or conversational)"
✅ "Does not include code snippets (text only)"

EXAMPLE BAD CRITERIA:
❌ "Follows instructions" (too vague)
❌ "Check requirements" (meta-instruction)
❌ "Does what was asked" (not specific)

Generate realistic tests with clear, measurable instructions.`,
        team_requirements: `INSTRUCTION FOLLOWING DIMENSION FOR TEAMS:

Generate tests that verify teams/crews FOLLOW INSTRUCTIONS.

FOCUS AREAS:
- Team-wide instruction adherence
- Coordination to meet requirements
- Final output follows all specifications
- No agent violates constraints

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check team-level instruction following
- Use clear, measurable statements
- Focus on coordinated adherence

EXAMPLE GOOD CRITERIA:
✅ "Final output meets all specified requirements"
✅ "Team maintains constraints throughout workflow"
✅ "No team member violates specified limitations"

Generate realistic tests for team instruction following.`,
        flow_requirements: `INSTRUCTION FOLLOWING DIMENSION FOR FLOWS:

Generate tests that verify flows FOLLOW INSTRUCTIONS to produce final output.

FOCUS AREAS:
- Final output meets all initial instructions
- Constraints maintained through flow execution
- All requirements satisfied in deliverables
- Specifications followed end-to-end

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check final output instruction adherence
- Use clear, measurable statements
- Focus on end-to-end specification compliance

EXAMPLE GOOD CRITERIA:
✅ "Final deliverable meets all input specifications"
✅ "All constraints from input are respected in output"
✅ "Generated artifacts follow specified requirements"

Generate realistic tests for flow instruction following.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating if the output FOLLOWS INSTRUCTIONS.

1. **Extract Instructions**:
   - List all instructions from the input
   - Identify constraints (length, style, format)
   - Note requirements and specifications
   - Identify prohibited elements
   - Consider evaluation_strictness (0-100)

2. **Check Adherence**:
   - Verify each instruction is followed
   - Check constraints are respected
   - Confirm requirements are met
   - Ensure prohibited elements are absent
   - Look for specification compliance

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating adherence level
   - Document which instructions were/weren't followed

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence. Example: 'Has 3 paragraphs as requested (✓). Uses simple language (✓). Includes 3 examples instead of 2 (✗). Formal tone maintained (✓). 3 of 4 instructions followed.'",
  "reasoning": "Brief explanation of instruction following assessment."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, accept partial instruction following
- 41-60: Lenient, require major instructions followed
- 61-80: Moderate, expect most instructions followed
- 81-90: Strict, require all key instructions followed
- 91-100: Very strict, require perfect instruction adherence

INSTRUCTION FOLLOWING EVALUATION:
- Be explicit about what was followed vs not followed
- Provide specific examples from the output
- Count/quantify adherence when possible
- Distinguish between major and minor violations`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['quality', 'instructions', 'constraints', 'requirements'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'quality',
        displayName: 'Instruction Following',
    },
};
//# sourceMappingURL=instruction-following.js.map