import { StructuredLogger } from "../../logger";
import { GenerationContext } from "../domain/values/GenerationContext";
import { Message } from "../inferutils/common";
import { InferenceContext } from "../inferutils/config.types";
import { createUserMessage, createSystemMessage, createAssistantMessage } from "../inferutils/common";
import { generalSystemPromptBuilder, USER_PROMPT_FORMATTER } from "../prompts";
import { CodeSerializerType } from "../utils/codeSerializers";
import { CodingAgentInterface } from "../services/implementations/CodingAgent";

/**
 * Get language-specific instructions to append to system prompts
 * @param language - User's language preference ('en' or 'ar-SA')
 * @returns Language instructions string or empty string
 */
export function getLanguageInstructions(language?: string): string {
    if (language === 'ar-SA') {
        return `

## LANGUAGE INSTRUCTIONS (CRITICAL):
- The user's language preference is Arabic (Saudi dialect).
- ALL your responses, descriptions, phase names, and communications MUST be in Saudi Arabic dialect (اللهجة السعودية).
- Use Saudi dialect markers: "إيش" instead of "ماذا", "وين" instead of "أين", "كيفك" instead of "كيف حالك"
- Use informal Saudi expressions naturally: "يالله", "الله يعطيك العافية", "إن شاء الله"
- Maintain professional and helpful tone in Saudi Arabic
- Technical terms can be in English if commonly used in Saudi tech community
- Code (variables, functions, classes) MUST remain in English
- Code comments can be in English
- Only user-facing text (phase descriptions, file purposes, explanations) should be in Arabic`;
    }
    return ''; // No additional instructions for English
}

export function getSystemPromptWithProjectContext(
    systemPrompt: string,
    context: GenerationContext,
    serializerType: CodeSerializerType = CodeSerializerType.SIMPLE,
    language?: string
): Message[] {
    const { query, blueprint, templateDetails, dependencies, allFiles, commandsHistory } = context;

    // Append language instructions if Arabic
    const languageInstructions = getLanguageInstructions(language);
    const finalSystemPrompt = systemPrompt + languageInstructions;

    const messages = [
        createSystemMessage(generalSystemPromptBuilder(finalSystemPrompt, {
            query,
            blueprint,
            templateDetails,
            dependencies,
            platformServices: context.platformServices,
        })), 
        createUserMessage(
            USER_PROMPT_FORMATTER.PROJECT_CONTEXT(
                context.getCompletedPhases(),
                allFiles, 
                context.getFileTree(),
                commandsHistory,
                serializerType  
            )
        ),
        createAssistantMessage(`I have thoroughly gone through the whole codebase and understood the current implementation and project requirements. We can continue.`)
    ];
    return messages;
}

export interface OperationOptions {
    env: Env;
    agentId: string;
    context: GenerationContext;
    logger: StructuredLogger;
    inferenceContext: InferenceContext;
    agent: CodingAgentInterface;
}

export abstract class AgentOperation<InputType, OutputType> {
    abstract execute(
        inputs: InputType,
        options: OperationOptions
    ): Promise<OutputType>;
}