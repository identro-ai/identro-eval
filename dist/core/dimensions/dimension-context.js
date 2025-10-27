/**
 * Shared dimension context and utilities
 * Centralizes common dimension documentation sections and validation
 */
/**
 * Shared dimension context utilities
 */
export const DIMENSION_CONTEXT = {
    /**
     * Generate evaluation process template for a dimension
     * This template is used in dimension YAML files under prompts.evaluation_instructions
     */
    evaluationProcessTemplate: (dimensionName, specificGuidance) => `
EVALUATION PROCESS:

You are evaluating ${dimensionName.toUpperCase()} of the output.

1. **Understand Context**:
   - Review the criterion's evaluation_strictness (0-100, higher = stricter)
   - Consider any special_instructions provided
   - Review all relevant outputs for comparison

2. **Analyze ${dimensionName}**:
${specificGuidance}

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating confidence
   - Document specific evidence from outputs

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific evidence with examples. Be concrete and detailed.",
  "reasoning": "Brief explanation of the decision."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, overlook minor issues
- 41-60: Lenient, focus on major aspects
- 61-80: Moderate, balanced evaluation
- 81-90: Strict, minor issues matter
- 91-100: Very strict, near-perfection required
`,
    /**
     * Generate metadata template for a dimension
     */
    metadataTemplate: (_dimensionName, category, complexity, tags) => ({
        version: '2.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['core', ...tags],
        complexity: complexity,
        author: 'Identro Core',
        category: category,
    }),
    /**
     * Context template structure (to be filled per dimension)
     */
    contextTemplate: () => ({
        what_it_is: '',
        why_it_matters: '',
        when_to_prioritize: '',
        common_failures: '',
        relationship_to_other_dimensions: '',
        real_world_examples: '',
    }),
    /**
     * Developer guidance template structure (to be filled per dimension)
     */
    developerGuidanceTemplate: () => ({
        when_to_use: '',
        when_to_skip: '',
        how_to_improve: '',
        testing_strategy: '',
    }),
};
/**
 * Dimension validation utilities
 */
export class DimensionValidator {
    /**
     * Validate that a dimension definition has all required sections
     *
     * @param dimensionDef - dimension definition object to validate
     * @returns Validation result with list of missing fields
     */
    static validate(dimensionDef) {
        const required = [
            'name',
            'description',
            'short_description',
            'priority',
            'prompts.agent_requirements',
            'prompts.team_requirements',
            'prompts.flow_requirements',
            'prompts.evaluation_instructions',
            'metadata',
        ];
        const missing = [];
        for (const field of required) {
            const parts = field.split('.');
            let obj = dimensionDef;
            for (const part of parts) {
                if (!obj[part]) {
                    missing.push(field);
                    break;
                }
                obj = obj[part];
            }
        }
        return { valid: missing.length === 0, missing };
    }
    /**
     * Validate that dimension has enhanced v2.0 sections
     * These are the new context and developer_guidance sections
     *
     * @param dimensionDef - dimension definition object to validate
     * @returns Validation result with list of missing enhanced sections
     */
    static validateEnhanced(dimensionDef) {
        const enhancedSections = [
            'context',
            'context.what_it_is',
            'context.why_it_matters',
            'context.when_to_prioritize',
            'context.common_failures',
            'context.relationship_to_other_dimensions',
            'context.real_world_examples',
            'developer_guidance',
            'developer_guidance.when_to_use',
            'developer_guidance.when_to_skip',
            'developer_guidance.how_to_improve',
            'developer_guidance.testing_strategy',
        ];
        const missing = [];
        for (const field of enhancedSections) {
            const parts = field.split('.');
            let obj = dimensionDef;
            for (const part of parts) {
                if (!obj[part]) {
                    missing.push(field);
                    break;
                }
                obj = obj[part];
            }
        }
        return { valid: missing.length === 0, missing };
    }
    /**
     * Get dimension version from metadata
     *
     * @param dimensionDef - dimension definition object
     * @returns Version string or 'unknown'
     */
    static getVersion(dimensionDef) {
        return dimensionDef?.metadata?.version || 'unknown';
    }
    /**
     * Check if dimension is enhanced (v2.0)
     *
     * @param dimensionDef - dimension definition object
     * @returns True if dimension has v2.0 enhancements
     */
    static isEnhanced(dimensionDef) {
        const version = this.getVersion(dimensionDef);
        return version.startsWith('2.') && dimensionDef.context && dimensionDef.developer_guidance;
    }
}
/**
 * Dimension documentation generator utilities
 */
export class DimensionDocGenerator {
    /**
     * Generate markdown documentation for a dimension
     *
     * @param dimensionDef - dimension definition object
     * @returns Markdown documentation string
     */
    static generateMarkdown(dimensionDef) {
        const { name, description, short_description, priority, context, developer_guidance, metadata } = dimensionDef;
        let markdown = `# ${name.charAt(0).toUpperCase() + name.slice(1)} Dimension\n\n`;
        markdown += `**Short Description:** ${short_description}\n\n`;
        markdown += `**Priority:** ${priority}/10\n\n`;
        markdown += `**Category:** ${metadata?.category || 'unknown'}\n\n`;
        markdown += `**Complexity:** ${metadata?.complexity || 'unknown'}\n\n`;
        markdown += `**Version:** ${metadata?.version || 'unknown'}\n\n`;
        markdown += `## Description\n\n${description}\n\n`;
        if (context) {
            markdown += `## What It Is\n\n${context.what_it_is}\n\n`;
            markdown += `## Why It Matters\n\n${context.why_it_matters}\n\n`;
            markdown += `## When to Prioritize\n\n${context.when_to_prioritize}\n\n`;
            markdown += `## Common Failures\n\n${context.common_failures}\n\n`;
            markdown += `## Relationship to Other Dimensions\n\n${context.relationship_to_other_dimensions}\n\n`;
            markdown += `## Real World Examples\n\n${context.real_world_examples}\n\n`;
        }
        if (developer_guidance) {
            markdown += `## Developer Guidance\n\n`;
            markdown += `### When to Use\n\n${developer_guidance.when_to_use}\n\n`;
            markdown += `### When to Skip\n\n${developer_guidance.when_to_skip}\n\n`;
            markdown += `### How to Improve\n\n${developer_guidance.how_to_improve}\n\n`;
            markdown += `### Testing Strategy\n\n${developer_guidance.testing_strategy}\n\n`;
        }
        return markdown;
    }
    /**
     * Generate summary table for all dimensions
     *
     * @param dimensions - Array of dimension definitions
     * @returns Markdown table string
     */
    static generateSummaryTable(dimensions) {
        let table = '| Dimension | Priority | Category | Complexity | Enhanced |\n';
        table += '|---------|----------|----------|------------|----------|\n';
        for (const dimension of dimensions) {
            const name = dimension.name || 'unknown';
            const priority = dimension.priority || '?';
            const category = dimension.metadata?.category || '?';
            const complexity = dimension.metadata?.complexity || '?';
            const enhanced = DimensionValidator.isEnhanced(dimension) ? '✓' : '✗';
            table += `| ${name} | ${priority} | ${category} | ${complexity} | ${enhanced} |\n`;
        }
        return table;
    }
}
//# sourceMappingURL=dimension-context.js.map