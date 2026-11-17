---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Arc AI Neural OS
- Definition：The product name of this application, used in the PWA manifest (`name` field) and system prompts. It frames the app as an operating-system-like assistant rather than a simple chat page.
- Aliases：Arc AI、AKbot Production Glassmorphic AI OS

### Model Engine
- Definition：The user-facing model selector values (`gpt-5`, `claude-3-5`, `gemini-1-5`, `deepseek-r1`, `llama-3-3`) shown in the UI. These are NOT real vendor model names — they are aliases remapped by the backend's `MODEL_MAP` to actual providers (mostly `qwen-flash`, `MiniMax-M2.5`).
- Aliases：selectedModel、ModelEngine

### DEAN_CARD
- Definition：A structured output format the LLM must emit when asked about Takshashila University leadership. Syntax: `[DEAN_CARD|{Full Name with Title}|{Role}|{image_path}|{profile text with bullet points}]`. Image paths are fixed under `/deans/` and map to specific deans/chancellor. This is consumed by the frontend to render dean profile cards.
- Aliases：Dean Card、Dean card

### Takshashila University
- Definition：The institution whose knowledge base (chancellor, vice chancellor, deans, admissions contact, campus facts) is embedded into the system prompt for both frontend and backend LLM calls. Queries about the university, its leadership, or the student Keerthivasan A are answered from this baked-in context rather than live search.
- Aliases：Takshashila

### Infernix
- Definition：A startup company referenced in the system prompt; founder is Kishore G, website `https://infernix.netlify.app/#home`. The LLM is instructed to answer questions about Infernix using only this embedded knowledge.

### beforeinstallprompt
- Definition：The PWA install event handled in `App.tsx`. When fired, the app stores the event object and shows an install banner if the app is not yet running in standalone mode. Calling `installPrompt.prompt()` triggers the native install dialog; `userChoice.outcome === 'accepted'` confirms installation.
- Aliases：install prompt、PWA install
