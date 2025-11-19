import { createSystemMessage, createUserMessage } from '../inferutils/common';
import { executeInference } from '../inferutils/infer';
import { PROMPT_UTILS } from '../prompts';
import { AgentOperation, OperationOptions, getLanguageInstructions } from '../operations/common';
import { FileOutputType, PhaseConceptType } from '../schemas';
import { SCOFFormat } from '../output-formats/streaming-formats/scof';
import { CodeIssue } from '../../services/sandbox/sandboxTypes';
import { CodeSerializerType } from '../utils/codeSerializers';

export interface FastCodeFixerInputs {
    query: string;
    issues: CodeIssue[];
    allFiles: FileOutputType[];
    allPhases?: PhaseConceptType[];
}

const SYSTEM_PROMPT = `You are a Senior Software Engineer at Cloudflare's Incident Response Team specializing in rapid bug fixes. Your task is to analyze identified code issues and generate complete fixed files using the SCOF format.

<TASK_COMPLETION_PRINCIPLE>
KNOW WHEN TO STOP: Once all identified issues are fixed, stop.
- Do not fix issues that weren't identified in the issue list.
- After fixing all reported issues, complete the task.
- Prefer fixing only what's broken, not improving working code.
</TASK_COMPLETION_PRINCIPLE>

<PRESERVATION_PRINCIPLE>
PRESERVE EXISTING FUNCTIONALITY: Fix only the identified issues. Maintain all other working code.
- Do not refactor or improve code that wasn't part of the identified issues.
- Preserve interfaces, patterns, and working functionality.
</PRESERVATION_PRINCIPLE>

<ERROR_FIXING_PRINCIPLES>
- When fixing errors, gather sufficient context to understand each identified issue.
- When stuck on an issue, gather more context or try a different approach.
- Do not over-engineer. Fix the identified issues efficiently.
- Prioritize critical runtime errors over linting issues.
</ERROR_FIXING_PRINCIPLES>

<REASONING_PRINCIPLES>
- Analyze issues efficiently: Fix critical issues first.
- Use the minimum necessary changes to fix each issue.
- Stop when all identified issues are resolved.
</REASONING_PRINCIPLES>`
const USER_PROMPT = `
================================
Here is the codebase of the project:
<codebase>
{{codebase}}
</codebase>

This was the original project request from our client:
<client_request>
{{query}}
</client_request>

Identified issues:
<issues>
{{issues}}
</issues>
================================

## EXAMPLES OF COMMON FIXES:

**Example 1 - Runtime Error Fix:**
Issue: "Cannot read property 'length' of undefined in GameBoard.tsx"
Problem: Missing null check for gameState
Solution: Add conditional rendering and null checks

**Example 2 - State Loop Fix:**
Issue: "Maximum update depth exceeded in ScoreDisplay.tsx"
Problem: useEffect without dependencies causing infinite updates
Solution: Add proper dependency array and conditional logic

**Example 3 - Import Error Fix:**
Issue: "Module not found: Can't resolve './utils/helpers'"
Problem: Incorrect import path
Solution: Fix import path to match actual file structure

## TASK:
Analyze each reported issue and generate complete file contents with fixes applied. Use SCOF format for output.

## FIX GUIDELINES:
- Address ONLY the specific issues reported
- Preserve all existing functionality and exports
- Use existing dependencies only
- No TODO comments or placeholders
- Focus on runtime errors, infinite loops, and import issues
- Maintain original file structure and interfaces
`

const userPromptFormatter = (query: string, issues: CodeIssue[], allFiles: FileOutputType[], _allPhases?: PhaseConceptType[]) => {
    const prompt = PROMPT_UTILS.replaceTemplateVariables(USER_PROMPT, {
        query,
        issues: issues.length > 0 ? JSON.stringify(issues, null, 2) : 'No specific issues reported - perform general code review',
        codebase: PROMPT_UTILS.serializeFiles(allFiles, CodeSerializerType.SIMPLE)
    });
    return PROMPT_UTILS.verifyPrompt(prompt);
}

export class FastCodeFixerOperation extends AgentOperation<FastCodeFixerInputs, FileOutputType[]> {
    async execute(
        inputs: FastCodeFixerInputs,
        options: OperationOptions
    ): Promise<FileOutputType[]> {
        const { query, issues, allFiles, allPhases } = inputs;
        const { env, logger, context } = options;
        const userLanguage = context.language;
        
        logger.info(`Fixing issues for ${allFiles.length} files`);

        const userPrompt = userPromptFormatter(query, issues, allFiles, allPhases);
        const languageInstructions = getLanguageInstructions(userLanguage);
        const systemPrompt = SYSTEM_PROMPT + languageInstructions;
        const codeGenerationFormat = new SCOFFormat();

        const messages = [
            createSystemMessage(systemPrompt),
            createUserMessage(userPrompt + codeGenerationFormat.formatInstructions())
        ];

        const result = await executeInference({
            env: env,
            messages,
            agentActionName: "fastCodeFixer",
            context: options.inferenceContext,
        });

        const files = codeGenerationFormat.deserialize(result.string);
        return files;
    }
}
