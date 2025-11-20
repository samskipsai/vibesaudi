import { toast } from 'sonner';
import { generateId } from '@/utils/id-generator';
import type { RateLimitError, ConversationMessage } from '@/api-types';
import i18n from '@/lib/i18n';

export type ToolEvent = {
    name: string;
    status: 'start' | 'success' | 'error';
    timestamp: number;
};

export type ChatMessage = Omit<ConversationMessage, 'content'> & {
    content: string;
    ui?: {
        isThinking?: boolean;
        toolEvents?: ToolEvent[];
    };
};

/**
 * Check if a message ID should appear in conversational chat
 */
export function isConversationalMessage(messageId: string): boolean {
    const conversationalIds = [
        'main',
        'creating-blueprint',
        'conversation_response',
        'fetching-chat',
        'chat-not-found',
        'resuming-chat',
        'chat-welcome',
        'deployment-status',
        'code_reviewed',
    ];
    
    return conversationalIds.includes(messageId) || messageId.startsWith('conv-');
}

/**
 * Create an assistant message
 */
export function createAIMessage(
    conversationId: string,
    content: string,
    isThinking?: boolean
): ChatMessage {
    return {
        role: 'assistant',
        conversationId,
        content,
        ui: { isThinking },
    };
}

/**
 * Create a user message
 */
export function createUserMessage(message: string): ChatMessage {
    return {
        role: 'user',
        conversationId: generateId(),
        content: message,
    };
}

/**
 * Handle rate limit errors consistently
 */
export function handleRateLimitError(
    rateLimitError: RateLimitError,
    onDebugMessage?: (
        type: 'error' | 'warning' | 'info' | 'websocket',
        message: string,
        details?: string,
        source?: string,
        messageType?: string,
        rawMessage?: unknown
    ) => void
): ChatMessage {
    // Check if this is an AI inference rate limit with structured data
    const isAIInference = rateLimitError.limitType === 'llm_calls' && rateLimitError.limit && rateLimitError.period;
    
    let displayMessage = rateLimitError.message;
    
    // Try to use translated message if available
    if (isAIInference) {
        const hours = Math.floor((rateLimitError.period || 3600) / 3600);
        const dailyLimit = rateLimitError.limit ? rateLimitError.limit * (24 / hours) : 400;
        
        // Use translation with parameters
        displayMessage = i18n.t('errors.rateLimit.aiInference', {
            limit: rateLimitError.limit || 100,
            hours: hours,
            dailyLimit: dailyLimit,
            proCost: 4,
            flashCost: 1,
            liteCost: 0
        });
    }
    
    // Add suggestions if available
    if (rateLimitError.suggestions && rateLimitError.suggestions.length > 0) {
        const suggestionText = i18n.t('errors.rateLimit.suggestion', {
            proCost: 4,
            flashCost: 1,
            liteCost: 0
        });
        displayMessage += `\n\n${suggestionText}`;
    }
    
    toast.error(displayMessage);
    
    onDebugMessage?.(
        'error',
        `Rate Limit: ${rateLimitError.limitType.replace('_', ' ')} limit exceeded`,
        `Limit: ${rateLimitError.limit} per ${Math.floor((rateLimitError.period || 0) / 3600)}h\nRetry after: ${(rateLimitError.period || 0) / 3600}h\n\nSuggestions:\n${rateLimitError.suggestions?.join('\n') || 'None'}`,
        'Rate Limiting',
        rateLimitError.limitType,
        rateLimitError
    );
    
    return createAIMessage(
        `rate_limit_${Date.now()}`,
        i18n.t('errors.rateLimit.title') + ' ' + displayMessage
    );
}

/**
 * Add or update a message in the messages array
 */
export function addOrUpdateMessage(
    messages: ChatMessage[],
    newMessage: ChatMessage,
): ChatMessage[] {
    // Special handling for 'main' assistant message - update if thinking, otherwise append
    if (newMessage.conversationId === 'main') {
        const mainMessageIndex = messages.findIndex(m => m.conversationId === 'main' && m.ui?.isThinking);
        if (mainMessageIndex !== -1) {
            return messages.map((msg, index) =>
                index === mainMessageIndex 
                    ? { ...msg, ...newMessage }
                    : msg
            );
        }
    }
    // For all other messages, append
    return [...messages, newMessage];
}

/**
 * Handle streaming conversation messages
 */
export function handleStreamingMessage(
    messages: ChatMessage[],
    conversationId: string,
    chunk: string,
    isNewMessage: boolean
): ChatMessage[] {
    const existingMessageIndex = messages.findIndex(m => m.conversationId === conversationId && m.role === 'assistant');
    if (existingMessageIndex !== -1 && !isNewMessage) {
        // Append chunk to existing assistant message
        return messages.map((msg, index) =>
            index === existingMessageIndex
                ? { ...msg, content: msg.content + chunk }
                : msg
        );
    } else {
        // Create new streaming assistant message
        return [...messages, createAIMessage(conversationId, chunk, false)];
    }
}

/**
 * Append or update a tool event inline within an AI message bubble
 * - If a message with messageId doesn't exist yet, create a placeholder AI message with empty content
 * - If a matching 'start' exists and a 'success' comes in for the same tool, update that entry in place
 */
export function appendToolEvent(
    messages: ChatMessage[],
    conversationId: string,
    tool: { name: string; status: 'start' | 'success' | 'error' }
): ChatMessage[] {
    const idx = messages.findIndex(m => m.conversationId === conversationId && m.role === 'assistant');
    const timestamp = Date.now();

    // If message is not present, create a new placeholder assistant message with tool event
    if (idx === -1) {
        const newMsg: ChatMessage = {
            role: 'assistant',
            conversationId,
            content: '',
            ui: { toolEvents: [{ name: tool.name, status: tool.status, timestamp }] },
        };
        return [...messages, newMsg];
    }

    return messages.map((m, i) => {
        if (i !== idx) return m;
        const current = m.ui?.toolEvents ?? [];
        if (tool.status === 'success') {
            // Find last 'start' for this tool and flip it to success
            for (let j = current.length - 1; j >= 0; j--) {
                if (current[j].name === tool.name) {
                    return {
                        ...m,
                        ui: {
                            ...m.ui,
                            toolEvents: current.map((ev, k) =>
                                k === j ? { ...ev, status: 'success', timestamp } : ev
                            ),
                        }
                    };
                }
            }
            // If no prior start, just append success as a separate line
            return { ...m, ui: { ...m.ui, toolEvents: [...current, { name: tool.name, status: 'success', timestamp }] } };
        }
        // Default: append event
        return { ...m, ui: { ...m.ui, toolEvents: [...current, { name: tool.name, status: tool.status, timestamp }] } };
    });
}
