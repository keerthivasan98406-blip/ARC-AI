---
kind: error_handling
name: Error Handling in Arc AI OS Frontend Shell
category: error_handling
scope:
    - '**'
source_files:
    - services/geminiService.ts
    - services/databaseService.ts
    - App.tsx
    - components/ImageStudioModal.tsx
    - components/CodeVisualizerModal.tsx
    - components/StudyHubModal.tsx
    - components/ChatContainer.tsx
    - components/FloatingAssistantButton.tsx
---

## Overview

Arc AI OS is a Vite + React frontend shell. It has no dedicated error-handling framework, no custom error class hierarchy, and no middleware layer. Errors are handled ad hoc with plain `try/catch`, `console.error`/`console.warn`, and user-facing string messages rendered into chat or modal state.

## Patterns Observed

### 1. Silent swallowing of storage errors
Every `localStorage` read/write is wrapped in a bare `try/catch` whose body is empty. Examples:
- `App.tsx`: `loadSavedSessions`, `loadSavedMemories`, the two `useEffect` setters for sessions/memories, `handleClearAllMemories`, `handleLogout` — all use `catch (e) {}`.
- `components/ChatContainer.tsx`: `localStorage.getItem` / `setItem` around notes.
- `components/FloatingAssistantButton.tsx`: position persistence via `localStorage` is similarly swallowed.

This makes local storage failures non-fatal to the UI; the app falls back to in-memory defaults.

### 2. Network-layer fallback loop with last-error accumulation
`services/geminiService.ts::chatWithArcAi` builds an ordered list of candidate backend URLs (`${API_URL}/chat`, Render URL, `localhost:5000`, `127.0.0.1:5000`) and iterates them in a `for` loop. Each attempt is inside its own `try/catch`; on failure it stores the exception in `lastError: Error | null` and continues to the next URL. Only after exhausting all candidates does it surface an error.

The final error message is context-aware:
- If `lastError instanceof TypeError` and the message includes `'fetch'`, it renders a "Backend Server Not Running" message with instructions to run `npm run dev:all`.
- Otherwise it renders a generic "Connection Error" with `lastError?.message ?? 'Unknown error'`.

Network parsing errors inside the SSE stream (`JSON.parse(data)` on partial chunks) are silently ignored per-chunk.

### 3. User-visible error strings instead of thrown types
Errors are represented as plain strings embedded in the chat response:
- `geminiService.ts` returns `{ text: errorText, citations }` where `errorText` starts with `⚠️ **Backend Server Not Running**` or `⚠️ **Connection Error**`.
- `ImageStudioModal.tsx` sets `errorMsg('Failed to synthesize AI artwork. Please try again.')` on failure.
- `App.tsx::handleSendMessage` catches any thrown error from `chatWithArcAi` and replaces the streaming assistant message with `An error occurred while communicating with Arc AI Neural Gateway. Please check your connectivity and try again.`

There is no shared error type or enum.

### 4. Mixed rethrow vs swallow in `databaseService.ts`
The file shows inconsistent behavior across functions:
- `loginUser`, `createChatSession`, `saveMessage`, `getSessionMessages`, `saveSiteToDisk`: catch and `throw error` (rethrow).
- `getUserByEmail`, `getUserSessions`, `getSessionMessages`, `deleteSession`, `checkBackendHealth`: catch and return a default value (`null`, `[]`, `false`).

This means callers must handle both thrown errors and falsy/default return values depending on which function they call.

### 5. Logging
The only logging used is `console.error` and one `console.warn`:
- `geminiService.ts`: `console.error('[geminiService] All backend candidates failed:', lastError)` and `console.error('Image generation error:', e)`.
- `components/ImageStudioModal.tsx`: `console.error(err)`.
- `components/CodeVisualizerModal.tsx`: `console.warn('AI analysis fallback:', e)`.
- `components/StudyHubModal.tsx`: `console.error(e)`.

No structured logger, log levels, or centralized logging utility exists.

### 6. No panics, no `react-error-boundary`
There is no `ErrorBoundary` component wrapping the app tree, no `window.onerror` handler, and no `process.env.NODE_ENV` branching for development vs production error reporting. Unhandled promise rejections from components bubble up uncaught.

### 7. Component-level error state
Some modals maintain their own `errorMsg` / `setErrorMsg` state (e.g. `ImageStudioModal.tsx`) rather than surfacing errors through props or a global store.

## Key Files

- `services/geminiService.ts` — primary network error handling, multi-backend fallback, SSE chunk parsing.
- `services/databaseService.ts` — fetch wrappers with mixed throw-vs-return-default semantics.
- `App.tsx` — top-level chat error display, silent localStorage error swallowing.
- `components/ImageStudioModal.tsx` — modal-local error state and user-facing error message.
- `components/CodeVisualizerModal.tsx` — fallback warning via `console.warn`.
- `components/StudyHubModal.tsx` — console-only error logging.
- `components/ChatContainer.tsx` — silent localStorage access.
- `components/FloatingAssistantButton.tsx` — silent localStorage persistence.

## Conventions and Constraints

- **Local storage operations are expected to fail gracefully**: every `localStorage` access is wrapped in `try/catch` with an empty body, so storage corruption or quota limits do not crash the app.
- **Network calls that can fail are either retried against multiple endpoints (in `geminiService.ts`) or converted to user-readable strings** rather than propagated as typed exceptions.
- **There is no repository-wide error type definition**: errors are `Error` instances, plain strings, or boolean/null sentinel return values.
- **`databaseService.ts` does not enforce a single convention**: some functions rethrow, others swallow and return defaults — callers must inspect both possibilities.
- **No global error boundary or error-reporting service** is present; errors are surfaced locally within the component or chat message that triggered them.
- **Logging is ad hoc `console.error`/`console.warn`** with no configuration, transport, or level management.