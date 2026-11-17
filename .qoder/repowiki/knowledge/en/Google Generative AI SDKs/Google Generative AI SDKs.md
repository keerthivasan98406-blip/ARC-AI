---
kind: external_dependency
name: Google Generative AI SDKs
slug: google-generative-ai
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - package.json
---

### Google Generative AI SDKs
- They remain installed and may be used by other parts of the codebase (e.g. vision/image analysis paths); verify whether either SDK is imported elsewhere before removing.
- If adopted, follow the Gemini SDK's multimodal message format (`parts` array with `type: 'image_url'` + `image_url.url`) as already used in `services/geminiService.ts`.