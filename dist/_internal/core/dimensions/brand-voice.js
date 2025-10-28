"use strict";
/**
 * Brand Voice test dimension - tests brand voice, tone, and communication style
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAND_VOICE_DIMENSION_DEFINITION = void 0;
/**
 * Brand Voice dimension definition
 *
 * Tests if the agent maintains brand voice, tone, and communication style.
 * Critical for brand consistency and customer experience.
 */
exports.BRAND_VOICE_DIMENSION_DEFINITION = {
    name: 'brand-voice',
    description: 'Tests brand voice, tone, and communication style consistency',
    short_description: 'Verify brand voice consistency',
    priority: 7,
    /**
     * Context for LLM prompt enrichment
     */
    context: {
        why_it_matters: `
BUSINESS & USER IMPACT:

When brand voice is inconsistent, customer experience suffers:
- **Brand dilution**: Inconsistent voice weakens brand identity and recognition
- **Customer confusion**: Mixed messages create uncertainty about company values
- **Professionalism concerns**: Voice inconsistency appears unprofessional or unreliable
- **Trust erosion**: Users question if they're interacting with "real" brand
- **Competitive disadvantage**: Strong brand voice is a market differentiator
- **Marketing waste**: Inconsistent voice undermines brand investment

REAL-WORLD BRAND INCONSISTENCIES:
- Luxury brand agent using casual slang (off-brand, damages premium positioning)
- Professional services firm sounding overly casual (erodes credibility)
- Friendly brand suddenly being corporate and stiff (confusing users)
- Technical product using non-technical language (misses target audience)
- Customer service agent tone varying wildly between interactions

BRAND EQUITY IMPACT:
Brand voice is a core component of brand equity. Consistent voice builds recognition, trust, and differentiation. Inconsistent voice dilutes brand value built over years.
`,
        when_to_prioritize: `
HIGH PRIORITY (Critical - Brand Protection):
- Customer-facing agents representing the brand directly
- Content generation for public-facing materials
- Customer service and support agents
- Marketing and sales communication agents
- Social media and community management agents
- Brand ambassadors or spokesagents
- Any agent where voice consistency affects brand perception

MEDIUM PRIORITY (Important - Quality Control):
- Internal communication agents with brand standards
- Documentation generators with style guides
- Content tools for brand team members
- Agents creating materials for review before publication

LOWER PRIORITY (Monitor):
- Internal tools with no external brand exposure
- Technical agents where function matters more than voice
- Personal assistants for individual use
- Prototype agents in development

NOTE: For consumer brands and customer-facing applications, brand voice is part of the product experience.
`,
    },
    prompts: {
        agent_requirements: `BRAND VOICE DIMENSION:

Generate tests that verify the agent maintains BRAND VOICE and TONE.

FOCUS AREAS:
- Brand voice characteristics (professional, casual, friendly, authoritative)
- Tone consistency (empathetic, solution-focused, energetic)
- Language style (simple, sophisticated, technical)
- Brand personality traits
- Prohibited terms and phrases

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check ONE brand voice aspect
- Use clear, subjective but measurable language
- Focus on voice, tone, and style consistency

EXAMPLE GOOD CRITERIA:
✅ "Tone is professional yet friendly (not overly casual or stiff)"
✅ "Uses active voice and clear language (matches brand style)"
✅ "Reflects customer-first values (empathetic, solution-oriented)"
✅ "Avoids jargon and overly technical terms"
✅ "Maintains optimistic, helpful personality"

EXAMPLE BAD CRITERIA:
❌ "Sounds like our brand" (too vague)
❌ "Check tone" (meta-instruction)
❌ "Brand voice is correct" (not specific)

Generate realistic tests based on the agent's brand guidelines.`,
        team_requirements: `BRAND VOICE DIMENSION FOR TEAMS:

Generate tests that verify teams/crews maintain BRAND VOICE.

FOCUS AREAS:
- Consistent voice across all team members
- Coordinated tone in final output
- Unified brand personality
- No voice inconsistencies

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check team-wide voice consistency
- Use clear, measurable language
- Focus on unified brand representation

EXAMPLE GOOD CRITERIA:
✅ "Final output maintains consistent brand voice throughout"
✅ "No conflicting tones from different team members"
✅ "Team presents unified brand personality"

Generate realistic tests for team brand voice.`,
        flow_requirements: `BRAND VOICE DIMENSION FOR FLOWS:

Generate tests that verify flows maintain BRAND VOICE in final output.

FOCUS AREAS:
- Final output brand voice consistency
- Voice maintained through all stages
- Generated artifacts match brand
- No voice degradation or drift

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should check final output brand voice
- Use clear, measurable language
- Focus on end-to-end voice consistency

EXAMPLE GOOD CRITERIA:
✅ "Final deliverable maintains brand voice throughout"
✅ "All generated artifacts match brand style"
✅ "No voice inconsistencies introduced"

Generate realistic tests for flow brand voice.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating BRAND VOICE and TONE consistency.

1. **Understand Brand**:
   - Review brand voice characteristics from context
   - Note tone preferences (formal, casual, etc.)
   - Identify brand personality traits
   - List prohibited terms/phrases
   - Consider evaluation_strictness (0-100)

2. **Analyze Voice**:
   - Check if tone matches brand guidelines
   - Verify language style is consistent
   - Confirm personality traits are reflected
   - Look for prohibited terms
   - Assess overall brand alignment

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating voice match
   - Document specific voice issues

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence. Example: 'Professional tone maintained (✓). Uses clear, simple language (✓). Shows empathy and solution focus (✓). Avoids jargon (✓). Strongly matches brand voice.'",
  "reasoning": "Brief explanation of brand voice assessment."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, allow voice variations
- 41-60: Lenient, require general brand alignment
- 61-80: Moderate, expect good brand match
- 81-90: Strict, require strong brand consistency
- 91-100: Very strict, require perfect brand voice

BRAND VOICE EVALUATION:
- Be specific about voice characteristics
- Provide examples from the output
- Note any off-brand elements
- Consider context appropriateness`,
    },
    metadata: {
        version: '1.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['enterprise', 'brand', 'voice', 'tone', 'style'],
        complexity: 'moderate',
        author: 'Identro Core',
        category: 'enterprise',
        displayName: 'Brand Voice',
    },
};
//# sourceMappingURL=brand-voice.js.map