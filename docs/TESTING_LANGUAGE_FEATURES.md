# Language Features Testing Guide

This document provides a comprehensive testing checklist for the Arabic language and RTL layout implementation.

## Prerequisites

1. **Wait for Cloudflare Deployment**
   - Check deployment status in Cloudflare dashboard
   - Verify the latest commit is deployed
   - Test on production/staging URL

## Test Checklist

### 1. Language Switcher Functionality

#### 1.1 Initial Load
- [ ] **Test**: Open the application
- [ ] **Expected**: Language switcher icon (Globe) is visible in the header
- [ ] **Expected**: Default language is English (or saved preference from localStorage)
- [ ] **Verify**: Check `localStorage.getItem('i18nextLng')` in browser console

#### 1.2 Switching to Arabic
- [ ] **Test**: Click language switcher → Select "العربية"
- [ ] **Expected**: UI text changes to Arabic immediately
- [ ] **Expected**: Document direction changes to RTL (`document.documentElement.dir === 'rtl'`)
- [ ] **Expected**: Language attribute set to `ar-SA` (`document.documentElement.lang === 'ar-SA'`)
- [ ] **Expected**: Language preference saved to localStorage (`i18nextLng` and `user_language`)

#### 1.3 Switching Back to English
- [ ] **Test**: Click language switcher → Select "English"
- [ ] **Expected**: UI text changes to English immediately
- [ ] **Expected**: Document direction changes to LTR (`document.documentElement.dir === 'ltr'`)
- [ ] **Expected**: Language attribute set to `en` (`document.documentElement.lang === 'en'`)

#### 1.4 Persistence
- [ ] **Test**: Switch to Arabic, refresh the page
- [ ] **Expected**: Language remains Arabic after refresh
- [ ] **Test**: Switch to English, refresh the page
- [ ] **Expected**: Language remains English after refresh

#### 1.5 Language Switcher UI
- [ ] **Test**: Check dropdown menu alignment
- [ ] **Expected**: Menu aligns correctly in both LTR and RTL modes
- [ ] **Expected**: Active language is highlighted with `bg-accent` class

---

### 2. RTL Layout Rendering

#### 2.1 Document Level
- [ ] **Test**: Switch to Arabic
- [ ] **Verify**: `document.documentElement.dir === 'rtl'` in console
- [ ] **Verify**: `document.documentElement.lang === 'ar-SA'` in console

#### 2.2 CSS RTL Rules
- [ ] **Test**: Inspect elements in RTL mode
- [ ] **Expected**: `[dir="rtl"]` selector applies correctly
- [ ] **Expected**: Text alignment is right-aligned
- [ ] **Expected**: `.text-left` becomes right-aligned in RTL
- [ ] **Expected**: `.text-right` becomes left-aligned in RTL
- [ ] **Expected**: `.ml-auto` uses `margin-right: auto` in RTL
- [ ] **Expected**: `.mr-auto` uses `margin-left: auto` in RTL

#### 2.3 Layout Components
- [ ] **Test**: Check sidebar in RTL mode
- [ ] **Expected**: Sidebar appears on the right side
- [ ] **Expected**: Content flows from right to left
- [ ] **Test**: Check header/navigation
- [ ] **Expected**: Navigation items align to the right
- [ ] **Expected**: Logo and icons positioned correctly

#### 2.4 Chat Interface
- [ ] **Test**: Open chat interface in Arabic
- [ ] **Expected**: Message bubbles align to the right
- [ ] **Expected**: Input field text aligns to the right
- [ ] **Expected**: Send button positioned correctly
- [ ] **Expected**: File explorer and code editor layout adapts

#### 2.5 Forms and Inputs
- [ ] **Test**: Check all form inputs in RTL
- [ ] **Expected**: Text inputs align to the right
- [ ] **Expected**: Placeholder text displays correctly
- [ ] **Expected**: Labels positioned correctly
- [ ] **Expected**: Buttons and icons positioned appropriately

#### 2.6 Modals and Dialogs
- [ ] **Test**: Open any modal/dialog in RTL mode
- [ ] **Expected**: Content flows right-to-left
- [ ] **Expected**: Close buttons positioned correctly
- [ ] **Expected**: Form elements inside modals align correctly

---

### 3. Arabic Text Input/Output

#### 3.1 Text Input
- [ ] **Test**: Type Arabic text in chat input
- [ ] **Expected**: Arabic characters display correctly
- [ ] **Expected**: Text direction is RTL
- [ ] **Expected**: Cursor position is correct
- [ ] **Expected**: Mixed Arabic/English text handles correctly

#### 3.2 Text Display
- [ ] **Test**: View Arabic text in messages
- [ ] **Expected**: Arabic text renders correctly
- [ ] **Expected**: Font supports Arabic characters
- [ ] **Expected**: No character encoding issues
- [ ] **Expected**: Line breaks and wrapping work correctly

#### 3.3 Translation Coverage
- [ ] **Test**: Navigate through all pages in Arabic
- [ ] **Verify**: All UI text is translated (check translation.json)
- [ ] **Expected**: No untranslated strings (no missing keys)
- [ ] **Expected**: Placeholder text is translated
- [ ] **Expected**: Button labels are translated
- [ ] **Expected**: Error messages are translated

#### 3.4 Special Characters
- [ ] **Test**: Input Arabic numbers (٠١٢٣٤٥٦٧٨٩)
- [ ] **Expected**: Arabic numerals display correctly
- [ ] **Test**: Input Arabic punctuation
- [ ] **Expected**: Punctuation marks positioned correctly

---

### 4. AI Responses in Saudi Dialect

#### 4.1 Language Detection
- [ ] **Test**: Send a message in Arabic
- [ ] **Verify**: Backend receives language preference
- [ ] **Verify**: `Accept-Language` header is set to `ar-SA` in API requests
- [ ] **Verify**: Language is passed in WebSocket messages

#### 4.2 Initial Query (Blueprint Generation)
- [ ] **Test**: Create new app with Arabic query: "اصنع تطبيق قائمة مهام"
- [ ] **Expected**: AI responds in Saudi Arabic dialect
- [ ] **Expected**: Uses Saudi dialect markers:
  - "إيش" instead of "ماذا"
  - "وين" instead of "أين"
  - "كيفك" instead of "كيف حالك"
- [ ] **Expected**: Uses informal expressions: "يالله", "الله يعطيك العافية", "إن شاء الله"
- [ ] **Expected**: Maintains conversational, first-person style

#### 4.3 Follow-up Messages
- [ ] **Test**: Send follow-up message in Arabic during generation
- [ ] **Expected**: AI continues responding in Saudi Arabic
- [ ] **Expected**: Dialect consistency maintained
- [ ] **Test**: Send follow-up message in English
- [ ] **Expected**: AI switches to English (or maintains context)

#### 4.4 Conversation Continuity
- [ ] **Test**: Continue conversation in Arabic
- [ ] **Expected**: AI maintains Saudi dialect throughout
- [ ] **Expected**: No language switching unless explicitly requested
- [ ] **Expected**: Technical terms explained in Saudi dialect

#### 4.5 Mixed Language Handling
- [ ] **Test**: Send message with mixed Arabic/English
- [ ] **Expected**: AI detects primary language
- [ ] **Expected**: Responds appropriately based on detection

#### 4.6 Language Preference Persistence
- [ ] **Test**: Set language to Arabic, create new app
- [ ] **Expected**: Language preference is sent in API request
- [ ] **Expected**: Backend uses language preference for AI responses
- [ ] **Verify**: Check `body.language` in API request payload

---

### 5. Integration Testing

#### 5.1 End-to-End Flow
- [ ] **Test**: Complete flow in Arabic
  1. Switch language to Arabic
  2. Create new app with Arabic query
  3. View blueprint in Arabic
  4. Send follow-up messages in Arabic
  5. View generated code
  6. Deploy app
- [ ] **Expected**: All steps work correctly in Arabic/RTL

#### 5.2 Language Switching During Session
- [ ] **Test**: Start session in English, switch to Arabic mid-session
- [ ] **Expected**: UI updates immediately
- [ ] **Expected**: RTL layout applies
- [ ] **Expected**: Future AI responses use Arabic (if user messages are in Arabic)

#### 5.3 Browser Compatibility
- [ ] **Test**: Chrome/Edge
- [ ] **Test**: Firefox
- [ ] **Test**: Safari
- [ ] **Expected**: RTL rendering works in all browsers

#### 5.4 Mobile Responsiveness
- [ ] **Test**: View on mobile device in RTL
- [ ] **Expected**: Layout adapts correctly
- [ ] **Expected**: Touch interactions work
- [ ] **Expected**: Text is readable

---

### 6. Edge Cases

#### 6.1 Empty/Cleared localStorage
- [ ] **Test**: Clear localStorage, refresh page
- [ ] **Expected**: Defaults to English
- [ ] **Expected**: Language detection from browser works

#### 6.2 Invalid Language Values
- [ ] **Test**: Set invalid language in localStorage
- [ ] **Expected**: Falls back to English
- [ ] **Expected**: No errors in console

#### 6.3 Rapid Language Switching
- [ ] **Test**: Rapidly switch between languages
- [ ] **Expected**: No UI glitches
- [ ] **Expected**: State updates correctly

#### 6.4 Long Arabic Text
- [ ] **Test**: Send very long Arabic message
- [ ] **Expected**: Text wraps correctly
- [ ] **Expected**: No layout breaking
- [ ] **Expected**: Scroll behavior works

---

## Testing Commands

### Browser Console Checks

```javascript
// Check current language
localStorage.getItem('i18nextLng')
localStorage.getItem('user_language')

// Check document direction
document.documentElement.dir
document.documentElement.lang

// Check i18n state (if React DevTools available)
// Or check network requests for Accept-Language header
```

### Network Inspection

1. Open DevTools → Network tab
2. Filter by "agent" or "websocket"
3. Check request headers for `Accept-Language: ar-SA`
4. Check request body for `language: "ar-SA"`

### WebSocket Messages

1. Open DevTools → Network tab
2. Find WebSocket connection
3. Check messages for `language` field
4. Verify language is passed correctly

---

## Known Issues to Watch For

1. **RTL Layout Issues**
   - Sidebar positioning
   - Icon alignment
   - Text overflow
   - Scrollbar position

2. **Arabic Text Rendering**
   - Font fallbacks
   - Character encoding
   - Line height issues
   - Ligature rendering

3. **AI Response Quality**
   - Dialect consistency
   - Technical term translation
   - Code comments in Arabic

4. **Performance**
   - Language switching speed
   - RTL layout recalculation
   - Translation loading

---

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Language setting
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots (especially for RTL layout issues)

---

## Success Criteria

✅ All checklist items pass
✅ No console errors
✅ No layout breaking in RTL
✅ AI consistently responds in Saudi dialect when Arabic is used
✅ Language preference persists across sessions
✅ Performance is acceptable (< 100ms for language switch)

