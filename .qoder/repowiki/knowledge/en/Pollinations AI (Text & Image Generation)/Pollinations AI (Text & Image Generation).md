---
kind: external_dependency
name: Pollinations AI (Text & Image Generation)
slug: pollinations-ai
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - server/index.js
    - services/geminiService.ts
---

### Pollinations AI
- Text fallback at `https://text.pollinations.ai/openai/chat/completions` with no auth header; used as Tier 3 when both AICC and Groq fail.
- Image generation endpoint `https://image.pollinations.ai/prompt/{prompt}?width=...&height=...&seed=...&model=flux&nologo=true` is called directly from the frontend (`generateImageWithArcAi`) and also from the backend's image-request detection branch.
- The backend labels it "Unlimited Free" and treats it as the emergency rescue path when all other providers fail.
- No SDK dependency — plain `https.request` / `fetch` calls.
- Verify current endpoint contract against the Pollinations documentation.