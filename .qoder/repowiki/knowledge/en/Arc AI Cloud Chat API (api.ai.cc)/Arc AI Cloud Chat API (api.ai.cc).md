---
kind: external_dependency
name: Arc AI Cloud Chat API (api.ai.cc)
slug: api-ai-cc
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
source_files:
    - server/index.js
    - server/.env
---

### Arc AI Cloud Chat API
- The backend proxies chat requests to `https://api.ai.cc/v1/chat/completions` using an `Authorization: Bearer <AICC_API_KEY>` header loaded from `server/.env`. It is the primary LLM provider; Groq and Pollinations are fallbacks.
- Model IDs are translated via `MODEL_MAP` in `server/index.js` (e.g. UI model `claude-3-5` → `qwen-flash`, `gemini-1-5`/`deepseek-r1` → `MiniMax-M2.5`).
- Vision-capable models (`qwen3-vl-plus`, `glm-5.2`) are tried first for image requests; on 403/quota errors the server sets a process-level flag that permanently routes subsequent calls to Groq.
- Quota exhaustion is detected by matching error strings including `403`, `quota`, and the Chinese text `预扣费额度失败`; when triggered, AICC is skipped for the remainder of the process.
- The frontend also has a direct client-side fallback chain (`VITE_API_URL` → Render URL → localhost) but the production path goes through the local Express `/api/chat` endpoint which streams SSE back to the browser.
- Verify exact upstream payload/response shape against the api.ai.cc docs before changing MODEL_MAP or streaming logic.