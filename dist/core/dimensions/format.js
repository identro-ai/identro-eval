/**
 * Format test dimension - tests if output is in correct format and properly structured
 */
/**
 * Format dimension definition
 *
 * Tests if the agent produces properly formatted and structured outputs.
 * Critical for catching invalid formats, schema violations, and structure errors.
 */
export const FORMAT_DIMENSION_DEFINITION = {
    name: 'format',
    description: 'Tests if output is in correct format and properly structured',
    short_description: 'Verify output format',
    priority: 7,
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When format fails, systems break and users get frustrated:
- **Integration failures**: Malformed outputs break API integrations and data pipelines
- **Parsing errors**: Invalid formats cause downstream processing failures
- **Data loss**: Schema violations can result in missing or corrupted data
- **Manual intervention**: Users forced to manually reformat outputs
- **Automation breakdown**: Format errors prevent automated workflows from functioning

REAL-WORLD CONSEQUENCES:
- JSON output with syntax errors breaking API consumers
- CSV files with inconsistent delimiters causing import failures
- XML outputs missing closing tags breaking parsers
- Markdown with broken heading hierarchy making documents unusable
- Database inserts failing due to invalid data types

TECHNICAL IMPACT:
Format is the contract between agent and consumer. Invalid formats mean outputs cannot be consumed programmatically, defeating the purpose of automation.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Must Test):
- Agents producing structured data (JSON, XML, CSV, YAML)
- API response generators where format is contractual
- Database integrations requiring specific schemas
- File generators consumed by other systems
- Any agent whose output feeds into automated pipelines
- Agents generating code or configuration files

MEDIUM PRIORITY (Important - Test Before Production):
- Content generators with format guidelines (Markdown, HTML)
- Report generators with template requirements
- Data transformation agents
- Agents producing semi-structured output

LOWER PRIORITY (Nice-to-have):
- Free-form text generators without format constraints
- Creative content where structure is flexible
- Conversational agents with natural language output
- Prototype agents in early development
`,
    },
    prompts: {
        agent_requirements: `FORMAT & STRUCTURE DIMENSION:

Generate tests that verify the agent produces PROPERLY FORMATTED outputs.

FOCUS AREAS:
- Specific format requirements (JSON, XML, Markdown, CSV, etc.)
- Schema compliance
- Structural requirements
- Data type correctness
- Syntax validity

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE format aspect
- Use clear, technical language
- Focus on format validity, not content quality

EXAMPLE GOOD CRITERIA:
✅ "Output is valid JSON (parseable without errors)"
✅ "Contains required fields: name, email, id"
✅ "Date fields use ISO 8601 format (YYYY-MM-DD)"
✅ "Markdown uses proper header hierarchy (# then ## then ###)"

EXAMPLE BAD CRITERIA:
❌ "Output is formatted" (too vague)
❌ "Check structure" (meta-instruction)
❌ "Valid format" (not specific about what format)

Generate realistic tests with clear format specifications.`,
        team_requirements: `FORMAT & STRUCTURE DIMENSION FOR TEAMS:

Generate tests that verify teams/crews produce PROPERLY FORMATTED outputs.

FOCUS AREAS:
- Final output format compliance
- Consistent formatting across team contributions
- Integrated output maintains structure
- All artifacts follow specified formats

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check final output format
- Use clear, technical language
- Focus on integrated format validity

EXAMPLE GOOD CRITERIA:
✅ "Final report follows specified template structure"
✅ "All team outputs are properly integrated into valid format"
✅ "Generated artifacts maintain consistent formatting"

Generate realistic tests for team output formats.`,
        flow_requirements: `FORMAT & STRUCTURE DIMENSION FOR FLOWS:

Generate tests that verify flows produce PROPERLY FORMATTED final outputs.

FOCUS AREAS:
- Final output format validity
- Generated artifacts follow specifications
- Format preserved through flow stages
- All deliverables are properly structured

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check final output format
- Use clear, technical language
- Focus on end-to-end format compliance

EXAMPLE GOOD CRITERIA:
✅ "Final deliverable is valid [FORMAT]"
✅ "All generated files follow specified structure"
✅ "Output maintains format requirements from input"

Generate realistic tests for flow output formats.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating if the output follows the CORRECT FORMAT.

1. **Identify Format Requirements**:
   - Determine expected format from input/criteria
   - List structural requirements
   - Note schema or template specifications
   - Consider evaluation_strictness (0-100)

2. **Validate Format**:
   - Check if output is parseable in expected format
   - Verify required fields/sections present
   - Check data types are correct
   - Validate syntax (no errors)
   - Verify consistent formatting

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating format validity
   - Document specific format issues

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence. Example: 'Output is valid JSON (parseable). Contains all required fields: name, email, id. Date format is inconsistent (some ISO, some US format). Overall structure valid.'",
  "reasoning": "Brief explanation of format assessment."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, accept minor format issues
- 41-60: Lenient, require basic format validity
- 61-80: Moderate, expect proper formatting
- 81-90: Strict, require strict schema compliance
- 91-100: Very strict, require perfect formatting

FORMAT EVALUATION:
- Test parseability (can it be parsed?)
- Check required elements presence
- Verify data type correctness
- Note any format inconsistencies
- Be specific about format violations`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['quality', 'format', 'structure', 'schema'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'quality',
        displayName: 'Format',
    },
};
//# sourceMappingURL=format.js.map