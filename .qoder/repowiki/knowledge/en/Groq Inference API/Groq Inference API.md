---
kind: external_dependency
name: Groq Inference API
slug: groq
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
source_files:
    - server/index.js
---

### Groq
- Secondary inference provider at `https://api.groq.com/openai/v1/chat/completions`, authenticated with `GROQ_API_KEY` from `server/.env` via `Authorization: Bearer`.
- Used as Tier 2 fallback after AICC quota exhaustion, and as the fast-streaming path for `/api/chat` (`executeGroqStream` writes raw SSE chunks directly to the response). Default model is `qwen/qwen3.8-27b`, with `openai/gpt-oss-120b` as a secondary Groq candidate.
- Also wired in the frontend's `GROQ_MODEL_MAP` for client-side routing, though production chat goes through the backend proxy.
- Streaming path uses Server-Sent Events (`text/event-stream`) — the frontend expects `data: {choices:[{delta:{content}}]}` lines terminated by `data: [DONE]`.
- Verify exact OpenAI-compatible streaming protocol against the official Groq docs.