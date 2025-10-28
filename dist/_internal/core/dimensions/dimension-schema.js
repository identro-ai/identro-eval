"use strict";
/**
 * Schema validation test dimension - validates output structure against expected schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_DIMENSION_DEFINITION = void 0;
exports.testSchema = testSchema;
exports.analyzeSchemaResults = analyzeSchemaResults;
exports.generateSchemaReport = generateSchemaReport;
exports.generateSchemaExample = generateSchemaExample;
/**
 * Validate a value against a schema field
 */
function validateField(value, field, fieldName, errors) {
    // Check required fields
    if (field.required && (value === undefined || value === null)) {
        errors.push(`Required field '${fieldName}' is missing`);
        return false;
    }
    // Allow optional fields to be undefined
    if (!field.required && value === undefined) {
        return true;
    }
    // Type validation
    switch (field.type) {
        case 'string':
            if (typeof value !== 'string') {
                errors.push(`Field '${fieldName}' should be string, got ${typeof value}`);
                return false;
            }
            if (field.minLength !== undefined && value.length < field.minLength) {
                errors.push(`Field '${fieldName}' length ${value.length} is less than minimum ${field.minLength}`);
                return false;
            }
            if (field.maxLength !== undefined && value.length > field.maxLength) {
                errors.push(`Field '${fieldName}' length ${value.length} exceeds maximum ${field.maxLength}`);
                return false;
            }
            break;
        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                errors.push(`Field '${fieldName}' should be number, got ${typeof value}`);
                return false;
            }
            if (field.min !== undefined && value < field.min) {
                errors.push(`Field '${fieldName}' value ${value} is less than minimum ${field.min}`);
                return false;
            }
            if (field.max !== undefined && value > field.max) {
                errors.push(`Field '${fieldName}' value ${value} exceeds maximum ${field.max}`);
                return false;
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                errors.push(`Field '${fieldName}' should be boolean, got ${typeof value}`);
                return false;
            }
            break;
        case 'array':
            if (!Array.isArray(value)) {
                errors.push(`Field '${fieldName}' should be array, got ${typeof value}`);
                return false;
            }
            // Validate array items if schema provided
            if (field.items) {
                for (let i = 0; i < value.length; i++) {
                    validateField(value[i], field.items, `${fieldName}[${i}]`, errors);
                }
            }
            break;
        case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                errors.push(`Field '${fieldName}' should be object, got ${typeof value}`);
                return false;
            }
            // Validate nested properties if schema provided
            if (field.properties) {
                for (const [propName, propSchema] of Object.entries(field.properties)) {
                    validateField(value[propName], propSchema, `${fieldName}.${propName}`, errors);
                }
            }
            break;
        case 'enum':
            if (!field.values || !field.values.includes(value)) {
                errors.push(`Field '${fieldName}' value '${value}' is not in allowed values: ${field.values?.join(', ')}`);
                return false;
            }
            break;
        default:
            errors.push(`Unknown field type '${field.type}' for field '${fieldName}'`);
            return false;
    }
    return true;
}
/**
 * Validate output against schema
 */
function validateOutput(output, schema, strict = false) {
    const errors = [];
    // Check if output is an object
    if (typeof output !== 'object' || output === null || Array.isArray(output)) {
        errors.push(`Output should be an object, got ${typeof output}`);
        return { valid: false, errors };
    }
    // Validate each field in schema
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        validateField(output[fieldName], fieldSchema, fieldName, errors);
    }
    // In strict mode, check for extra fields
    if (strict) {
        const schemaFields = new Set(Object.keys(schema));
        const outputFields = Object.keys(output);
        for (const field of outputFields) {
            if (!schemaFields.has(field)) {
                errors.push(`Unexpected field '${field}' in output (strict mode)`);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Test schema compliance of agent outputs
 */
async function testSchema(runner, inputs, options) {
    const { schema, strict = false } = options;
    let totalTests = 0;
    let compliantTests = 0;
    const allErrors = [];
    const errorCounts = new Map();
    for (const input of inputs) {
        const result = await runner(input);
        totalTests++;
        if (result.success && result.output !== undefined) {
            const validation = validateOutput(result.output, schema, strict);
            if (validation.valid) {
                compliantTests++;
            }
            else {
                // Track error types
                validation.errors.forEach(error => {
                    allErrors.push(error);
                    // Extract error type for counting
                    const errorType = error.split(' ')[0] + ' ' + error.split(' ')[1];
                    errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
                });
            }
        }
        else if (result.error) {
            allErrors.push(`Test failed: ${result.error}`);
        }
    }
    const complianceRate = totalTests > 0 ? compliantTests / totalTests : 0;
    const schemaCompliant = complianceRate === 1.0;
    // Calculate schema score (0-1)
    let schemaScore = complianceRate;
    // Penalize for high error variety
    const errorVariety = errorCounts.size;
    if (errorVariety > 5) {
        schemaScore *= 0.8; // Many different types of errors
    }
    else if (errorVariety > 2) {
        schemaScore *= 0.9; // Some error variety
    }
    // Get unique errors for reporting
    const uniqueErrors = Array.from(new Set(allErrors)).slice(0, 10); // Limit to 10 unique errors
    return {
        schemaCompliant,
        validationErrors: uniqueErrors,
        complianceRate,
        schemaScore: Math.max(0, Math.min(1, schemaScore))
    };
}
/**
 * Analyze schema test results
 */
function analyzeSchemaResults(results, _schema) {
    const recommendations = [];
    let schemaGrade;
    let interpretation = '';
    if (results.complianceRate === 1.0) {
        schemaGrade = 'A';
        interpretation = 'Perfect schema compliance: All outputs match the expected structure';
    }
    else if (results.complianceRate >= 0.9) {
        schemaGrade = 'B';
        interpretation = 'Good schema compliance: Most outputs match with minor issues';
    }
    else if (results.complianceRate >= 0.7) {
        schemaGrade = 'C';
        interpretation = 'Moderate schema compliance: Significant validation issues present';
    }
    else if (results.complianceRate >= 0.5) {
        schemaGrade = 'D';
        interpretation = 'Poor schema compliance: Many outputs fail validation';
    }
    else {
        schemaGrade = 'F';
        interpretation = 'Critical schema issues: Most outputs do not match expected structure';
    }
    // Analyze validation errors for recommendations
    const errorDimensions = new Map();
    results.validationErrors.forEach(error => {
        if (error.includes('Required field')) {
            errorDimensions.set('missing_required', (errorDimensions.get('missing_required') || 0) + 1);
        }
        else if (error.includes('should be')) {
            errorDimensions.set('type_mismatch', (errorDimensions.get('type_mismatch') || 0) + 1);
        }
        else if (error.includes('not in allowed values')) {
            errorDimensions.set('enum_violation', (errorDimensions.get('enum_violation') || 0) + 1);
        }
        else if (error.includes('exceeds maximum') || error.includes('less than minimum')) {
            errorDimensions.set('range_violation', (errorDimensions.get('range_violation') || 0) + 1);
        }
    });
    // Generate recommendations based on error dimensions
    if (errorDimensions.get('missing_required')) {
        recommendations.push('Ensure all required fields are always included in output');
        recommendations.push('Review agent prompts to emphasize required fields');
    }
    if (errorDimensions.get('type_mismatch')) {
        recommendations.push('Implement type coercion or validation in agent output processing');
        recommendations.push('Use structured output formats (JSON mode) if available');
    }
    if (errorDimensions.get('enum_violation')) {
        recommendations.push('Constrain agent outputs to allowed enum values');
        recommendations.push('Consider using classification-specific prompting');
    }
    if (errorDimensions.get('range_violation')) {
        recommendations.push('Add output normalization to enforce value ranges');
        recommendations.push('Include range constraints in agent instructions');
    }
    if (results.complianceRate < 0.9) {
        recommendations.push('Consider using output parsers or validators');
        recommendations.push('Implement retry logic for schema validation failures');
    }
    return {
        interpretation,
        recommendations,
        schemaGrade
    };
}
/**
 * Generate schema validation report
 */
function generateSchemaReport(results, schema) {
    const analysis = analyzeSchemaResults(results, schema);
    let report = `# Schema Validation Report\n\n`;
    report += `**Schema Grade**: ${analysis.schemaGrade}\n`;
    report += `**Compliance Rate**: ${(results.complianceRate * 100).toFixed(1)}%\n`;
    report += `**Schema Score**: ${(results.schemaScore * 100).toFixed(1)}%\n\n`;
    report += `## Results\n`;
    report += `- Schema Compliant: ${results.schemaCompliant ? '✅ Yes' : '❌ No'}\n`;
    report += `- Validation Errors: ${results.validationErrors.length}\n\n`;
    report += `## Analysis\n`;
    report += `${analysis.interpretation}\n\n`;
    if (results.validationErrors.length > 0) {
        report += `## Validation Errors (Sample)\n`;
        results.validationErrors.slice(0, 5).forEach(error => {
            report += `- ${error}\n`;
        });
        if (results.validationErrors.length > 5) {
            report += `- ... and ${results.validationErrors.length - 5} more\n`;
        }
        report += '\n';
    }
    if (analysis.recommendations.length > 0) {
        report += `## Recommendations\n`;
        analysis.recommendations.forEach(rec => {
            report += `- ${rec}\n`;
        });
    }
    return report;
}
/**
 * Generate example output that matches schema
 */
function generateSchemaExample(schema) {
    const example = {};
    for (const [fieldName, field] of Object.entries(schema)) {
        switch (field.type) {
            case 'string':
                example[fieldName] = field.description || 'example string';
                break;
            case 'number':
                example[fieldName] = field.min !== undefined ? field.min : 0;
                break;
            case 'boolean':
                example[fieldName] = true;
                break;
            case 'array':
                example[fieldName] = [];
                break;
            case 'object':
                example[fieldName] = {};
                break;
            case 'enum':
                example[fieldName] = field.values?.[0] || null;
                break;
        }
    }
    return example;
}
exports.SCHEMA_DIMENSION_DEFINITION = {
    name: 'schema',
    description: 'Tests output structure compliance against expected schema definitions',
    short_description: 'Validate output structure',
    priority: 4,
    // NO configuration here - all settings come from eval.config.yml
    prompts: {
        agent_requirements: `SCHEMA DIMENSION:

Generate tests that verify the agent produces outputs matching expected structure.

FOCUS AREAS:
- Output structure and format consistency
- Required field presence
- Type correctness
- Schema compliance

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific schema aspect
- Use clear, measurable language
- Focus on structural requirements for the agent's outputs

EXAMPLE GOOD CRITERIA:
✅ "Output contains all required fields (name, email, score)"
✅ "Field types match schema (name: string, score: number)"
✅ "Output structure is valid JSON matching the expected format"

EXAMPLE BAD CRITERIA:
❌ "Generate schema validation rules"  (meta-instruction, not a criterion)
❌ "Output is well-structured"  (vague, not measurable)
❌ "Include type checking"  (meta-instruction)

Generate realistic tests based on the agent's expected output structure.`,
        team_requirements: `SCHEMA DIMENSION FOR TEAMS:

Generate tests that verify teams/crews produce outputs matching expected structure.

FOCUS AREAS:
- Final output structure and format
- Required field presence in team outputs
- Type correctness across all team members
- Consistent schema compliance

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific schema aspect
- Use clear, measurable language
- Focus on structural requirements for team outputs

EXAMPLE GOOD CRITERIA:
✅ "Team output contains all required sections (summary, details, recommendations)"
✅ "Each section follows the expected structure"
✅ "Output format is consistent across all team operations"

EXAMPLE BAD CRITERIA:
❌ "Create validation rules"  (meta-instruction)
❌ "Team output is structured"  (vague)
❌ "Test schema dimensions"  (meta-instruction)

Generate realistic tests based on the team's expected output structure.`,
        flow_requirements: `SCHEMA DIMENSION FOR FLOWS:

Generate tests that verify flows produce FINAL OUTPUTS matching expected structure.

FOCUS AREAS:
- Final output structure and format
- Generated artifact schema compliance
- Type correctness in end-to-end results
- Synthetic inputs for human-in-the-loop points

CRITERIA GENERATION:
- Generate 1-3 focused, specific criteria per test
- Each criterion should test ONE specific schema aspect of FINAL OUTPUT
- Use clear, measurable language
- Focus on end-to-end output structure, not internal mechanics

EXAMPLE GOOD CRITERIA:
✅ "Final output contains all required sections in correct format"
✅ "Generated artifacts follow the expected schema structure"
✅ "Output fields have correct types throughout the document"

EXAMPLE BAD CRITERIA:
❌ "Generate schema rules"  (meta-instruction)
❌ "Flow outputs are structured"  (vague)
❌ "Test internal data structures"  (wrong focus - should be final output only)

SYNTHETIC INPUTS:
- Generate structured user inputs matching expected format
- Create valid approval/feedback in correct schema
- Store in eval-spec.json for user editing

Generate realistic tests based on the flow's expected output structure.`,
        evaluation_instructions: `EVALUATION PROCESS:

You are evaluating test results against specific schema criteria. For each criterion:

1. **Understand Context**:
   - Review the criterion's evaluation_strictness (0-100, higher = stricter)
   - Consider any special_instructions provided
   - Review expected schema/structure requirements

2. **Analyze Structure**:
   - Examine actual output structure
   - Look for specific evidence of schema compliance or violations
   - Consider whether structure meets requirements

3. **Make Decision**:
   - Determine if criterion is met: true/false
   - Provide score (0-1) indicating confidence
   - Document specific structural issues or confirmations

4. **Respond in JSON**:
{
  "met": true/false,
  "score": 0.0-1.0,
  "evidence": "Specific structural evidence. Example: 'Output contains required fields: name (string), email (string), score (number). All types correct.'",
  "reasoning": "Brief explanation of the pass/fail decision."
}

STRICTNESS INTERPRETATION:
- 0-40: Very lenient, allow structural variations
- 41-60: Lenient, focus on major structural issues
- 61-80: Moderate, expect proper structure
- 81-90: Strict, minor structural issues matter
- 91-100: Very strict, perfect structure required

SCHEMA EVALUATION:
- Check presence of required fields
- Verify field types match expectations
- Validate overall structure compliance
- Provide concrete examples from actual output
- Focus on structural correctness, not content quality`,
    },
    metadata: {
        version: '2.0.0',
        created_at: '2025-01-10T00:00:00.000Z',
        tags: ['schema', 'structure', 'validation'],
        complexity: 'simple',
        author: 'Identro Core',
        category: 'quality',
        displayName: 'Schema',
    },
    // NO variables section - deprecated
    // NO settings section - comes from eval.config.yml
};
//# sourceMappingURL=dimension-schema.js.map