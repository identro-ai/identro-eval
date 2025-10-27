/**
 * Prompt extractor interface for framework implementations
 *
 * Each framework adapter must implement this interface to
 * extract prompts, templates, and examples from agent code.
 */
/**
 * Base implementation of prompt extractor
 */
export class BasePromptExtractor {
    /**
     * Check if a file should be processed
     */
    shouldProcess(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        return this.supportedExtensions.includes(`.${ext}` || '');
    }
    /**
     * Helper to extract variables from a template string
     */
    extractVariables(template) {
        const variables = [];
        // Match {variable} style
        const curlyMatches = template.matchAll(/\{(\w+)\}/g);
        for (const match of curlyMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        // Match ${variable} style
        const dollarMatches = template.matchAll(/\$\{(\w+)\}/g);
        for (const match of dollarMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        // Match {{variable}} style (Handlebars/Mustache)
        const doubleMatches = template.matchAll(/\{\{(\w+)\}\}/g);
        for (const match of doubleMatches) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }
    /**
     * Helper to clean and normalize prompt text
     */
    cleanPromptText(text) {
        return text
            .replace(/^\s*['"`]|['"`]\s*$/g, '') // Remove quotes
            .replace(/\\n/g, '\n') // Convert escaped newlines
            .replace(/\\t/g, '\t') // Convert escaped tabs
            .replace(/\\\\/g, '\\') // Convert escaped backslashes
            .trim();
    }
}
//# sourceMappingURL=prompt-extractor.js.map