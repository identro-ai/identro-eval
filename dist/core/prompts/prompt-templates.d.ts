/**
 * Shared prompt templates for LLM interactions
 * Centralizes common prompt sections to ensure consistency and reduce duplication
 */
/**
 * Prompt template interface
 */
export interface PromptTemplate {
    identroContext: string;
    developerContext: string;
    responseFormat: string;
    evaluationPhilosophy: string;
}
/**
 * Shared prompt sections used across all LLM interactions
 * These sections are injected into prompts to provide consistent context
 */
export declare const SHARED_PROMPTS: {
    /**
     * Core Identro introduction (used in ALL prompts)
     * Explains what Identro is and the LLM's role
     */
    identroContext: string;
    /**
     * Developer empathy context (used in evaluation prompts)
     * Reminds the LLM that developers will see the output
     */
    developerContext: string;
    /**
     * Evaluation philosophy (used in all evaluations)
     * Sets the tone for semantic vs exact matching
     */
    evaluationPhilosophy: string;
    /**
     * JSON response format (used in all evaluations)
     * Ensures consistent structured output
     */
    jsonResponseFormat: string;
    /**
     * Criteria generation guidelines (used in test generation)
     * Critical section that prevents empty criteria arrays
     */
    criteriaGenerationGuidelines: string;
    /**
     * Strictness interpretation (used in all evaluations)
     * Explains the 0-100 strictness scale
     */
    strictnessInterpretation: string;
    /**
     * Input format guidelines (used in test generation)
     * Ensures concrete, actionable test inputs
     */
    inputFormatGuidelines: string;
};
/**
 * Template builder utilities for constructing complete prompts
 */
export declare class PromptBuilder {
    /**
     * Build a complete prompt with shared sections
     *
     * @param options - Configuration options for prompt building
     * @returns Complete prompt string ready for LLM
     */
    static build(options: {
        /** Action description for identroContext (e.g., "generating tests", "evaluating outputs") */
        identroAction: string;
        /** Specific instructions for this prompt */
        specificInstructions: string;
        /** Include evaluation-related sections */
        includeEvaluation?: boolean;
        /** Include test generation-related sections */
        includeGeneration?: boolean;
    }): string;
    /**
     * Build evaluation-specific prompt sections
     * Used for single-run and multi-run evaluations
     */
    static buildEvaluationPrompt(options: {
        isMultiRun: boolean;
        dimension: string;
        additionalInstructions?: string;
    }): string;
    /**
     * Build test generation-specific prompt sections
     * Used for agent, team, and flow test generation
     */
    static buildTestGenerationPrompt(options: {
        entityType: 'agent' | 'team' | 'flow';
        dimension: string;
        count: number;
        dimensionRequirements: string;
        entityContext: string;
    }): string;
}
/**
 * Helper function to format criteria context with strictness
 * Used in evaluation user prompts
 */
export declare function formatCriteriaContext(criteria: Array<{
    criterion: string;
    evaluation_strictness?: number;
    special_instructions?: string;
}>, defaultStrictness?: number): string;
//# sourceMappingURL=prompt-templates.d.ts.map