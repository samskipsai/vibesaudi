# Language Support Plan - Agent System Prompts

## Current Status Analysis

### ✅ Operations with Language Support

1. **UserConversationProcessor** (`worker/agents/operations/UserConversationProcessor.ts`)
   - ✅ Language detection from user message
   - ✅ Language instructions added to system prompt
   - ✅ Responds in Saudi Arabic dialect when detected

2. **Blueprint Generation** (`worker/agents/planning/blueprint.ts`)
   - ✅ Language detection from query
   - ✅ Language instructions added to system prompt
   - ✅ Considers Arabic language support in design

### ❌ Operations Missing Language Support

3. **PhaseGeneration** (`worker/agents/operations/PhaseGeneration.ts`)
   - System prompt: Architect planning next phase
   - Needs: Language instructions for phase descriptions
   - Access: Has agent state via `options.agent.state.language`

4. **PhaseImplementation** (`worker/agents/operations/PhaseImplementation.ts`)
   - System prompt: Senior engineer implementing phase
   - Needs: Language instructions for code comments and file purposes
   - Access: Has agent state via `options.agent.state.language`

5. **CodeReview** (`worker/agents/operations/CodeReview.ts`)
   - System prompt: Code reviewer analyzing issues
   - Needs: Language instructions for issue descriptions
   - Access: Has agent state via `options.agent.state.language`

6. **FileRegeneration** (`worker/agents/operations/FileRegeneration.ts`)
   - System prompt: Engineer fixing specific file issues
   - Needs: Language instructions for fix descriptions
   - Access: Has agent state via `options.agent.state.language`

7. **FastCodeFixer** (`worker/agents/operations/FastCodeFixer.ts`)
   - System prompt: Rapid bug fixer
   - Needs: Language instructions for fix descriptions
   - Access: Has agent state via `options.agent.state.language`

8. **ScreenshotAnalysis** (`worker/agents/operations/ScreenshotAnalysis.ts`)
   - System prompt: UI/UX QA specialist
   - Needs: Language instructions for analysis feedback
   - Access: Has agent state via `options.agent.state.language`

## Implementation Strategy

### Approach 1: Centralized Language Helper (Recommended)

Create a helper function in `worker/agents/operations/common.ts`:

```typescript
export function getLanguageInstructions(language?: string): string {
    if (language === 'ar-SA') {
        return `

## LANGUAGE INSTRUCTIONS (CRITICAL):
- The user's language preference is Arabic (Saudi dialect).
- ALL your responses, descriptions, and communications MUST be in Saudi Arabic dialect (اللهجة السعودية).
- Use Saudi dialect markers: "إيش" instead of "ماذا", "وين" instead of "أين", "كيفك" instead of "كيف حالك"
- Use informal Saudi expressions naturally: "يالله", "الله يعطيك العافية", "إن شاء الله"
- Maintain professional and helpful tone in Saudi Arabic
- Technical terms can be in English if commonly used in Saudi tech community
- Code comments, variable names, and technical documentation remain in English`;
    }
    return ''; // No additional instructions for English
}
```

### Approach 2: Modify Each Operation

For each operation, add language check in `execute()` method:

```typescript
async execute(inputs: XInputs, options: OperationOptions): Promise<XOutputs> {
    const { agent } = options;
    const userLanguage = agent.state.language;
    
    let systemPrompt = SYSTEM_PROMPT;
    if (userLanguage === 'ar-SA') {
        systemPrompt += getLanguageInstructions(userLanguage);
    }
    
    // Rest of implementation...
}
```

## Detailed Implementation Plan

### Phase 1: Core Infrastructure
- [ ] Create `getLanguageInstructions()` helper in `worker/agents/operations/common.ts`
- [ ] Create standard language instruction template for all operations
- [ ] Test helper function

### Phase 2: Update Operations (Priority Order)

1. **PhaseGeneration** (High Priority)
   - Users interact with phase descriptions
   - Modify `execute()` to check `agent.state.language`
   - Append language instructions to system prompt
   
2. **PhaseImplementation** (High Priority)
   - Affects file purposes and implementation descriptions
   - Modify `execute()` to check `agent.state.language`
   - Append language instructions to system prompt

3. **CodeReview** (Medium Priority)
   - Issue descriptions shown to users
   - Modify `execute()` to check `agent.state.language`
   - Append language instructions to system prompt

4. **FileRegeneration** (Medium Priority)
   - Fix descriptions might be visible
   - Modify `execute()` to check `agent.state.language`
   - Append language instructions to system prompt

5. **FastCodeFixer** (Low Priority)
   - Internal operation, less user-facing
   - Modify `execute()` to check `agent.state.language`
   - Append language instructions to system prompt

6. **ScreenshotAnalysis** (Low Priority)
   - Analysis feedback might be shown
   - Modify `execute()` to check `agent.state.language`
   - Append language instructions to system prompt

### Phase 3: Testing
- [ ] Test blueprint generation in Arabic
- [ ] Test phase planning in Arabic
- [ ] Test phase implementation descriptions in Arabic
- [ ] Test code review feedback in Arabic
- [ ] Verify Orange (conversational AI) responses in Arabic
- [ ] End-to-end test with Arabic language selected

### Phase 4: Documentation
- [ ] Document language support in ARCHITECTURE.md
- [ ] Add language flow diagram
- [ ] Update testing guide with Arabic test cases

## Expected Behavior After Implementation

When user selects Arabic (`ar-SA`):

1. **Blueprint Generation**: Descriptions and planning in Saudi Arabic
2. **Phase Planning**: Phase names and descriptions in Saudi Arabic
3. **Phase Implementation**: File purposes in Saudi Arabic (code stays English)
4. **Code Review**: Issue descriptions in Saudi Arabic
5. **Conversational AI (Orange)**: Responses in Saudi Arabic
6. **File Regeneration**: Fix explanations in Saudi Arabic

When user selects English (`en`):
- All operations respond in English (current behavior)

## Code Quality Notes

- Code (variables, functions, comments) stays in English for both languages
- Only user-facing text (descriptions, feedback, explanations) changes
- Technical terms can be in English in both languages
- Maintain consistent dialect (Saudi Arabic, not MSA)

## Testing Checklist

- [ ] Create app with Arabic query
- [ ] Verify blueprint is in Arabic
- [ ] Verify phase descriptions are in Arabic
- [ ] Send Arabic follow-up messages
- [ ] Verify Orange responds in Arabic
- [ ] Check code review feedback language
- [ ] Verify UI text is in Arabic
- [ ] Test language switching mid-session

## Rollout Plan

1. Implement helper function
2. Update high-priority operations (PhaseGen, PhaseImpl)
3. Deploy and test
4. Update medium-priority operations (CodeReview, FileRegen)
5. Deploy and test
6. Update low-priority operations (FastFixer, Screenshot)
7. Final testing and documentation

