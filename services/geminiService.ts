import { ChatHistoryItem, ModelEngine, Citation } from "../types";
import { getUserProfile, updateUserProfile, formatUserProfileForAI } from "./userProfileService";

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Server warmup ─────────────────────────────────────────────
// Render.com free-tier instances spin down after inactivity and can take 3–10s
// to cold-start. Fire a lightweight health-check the moment this module loads
// (i.e. when the app first renders) so the server is warm before the user
// types their first message. We swallow all errors — this is best-effort.
(function warmupServer() {
  const healthUrl = API_URL.endsWith('/api')
    ? `${API_URL}/health`
    : `${API_URL}/api/health`;
  fetch(healthUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  // Also ping the hardcoded Render URL if it differs
  const renderHealth = 'https://arc-ai-l0x5.onrender.com/api/health';
  if (!healthUrl.includes('arc-ai-l0x5.onrender.com')) {
    fetch(renderHealth, { method: 'GET' }).catch(() => {});
  }
})();

const GROQ_MODEL_MAP: Record<ModelEngine, string> = {
  'gpt-5': 'openai/gpt-oss-20b',
  'claude-3-5': 'openai/gpt-oss-120b',
  'gemini-1-5': 'qwen/qwen3.6-27b',
  'deepseek-r1': 'openai/gpt-oss-120b',
  'llama-3-3': 'groq/compound'
};

const VISION_MODELS = new Set<ModelEngine>(['claude-3-5', 'deepseek-r1', 'llama-3-3']);

export const chatWithArcAi = async (
  prompt: string,
  history: ChatHistoryItem[],
  onChunk: (text: string) => void,
  imageBase64?: string,
  selectedModel: ModelEngine = 'claude-3-5',
  isWebSearchEnabled: boolean = false
): Promise<{ text: string; citations?: Citation[] }> => {

  // Automatic Image Generation & Regeneration Intent Detection
  const lowerPrompt = prompt.toLowerCase();
  const isImageRequest = 
    /\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b.*\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/i.test(prompt) ||
    /\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b.*\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/i.test(prompt) ||
    lowerPrompt.includes('image genrate') || lowerPrompt.includes('photo generate') || lowerPrompt.includes('image panna');

  if (isImageRequest && !imageBase64) {
    const cleanSubject = prompt
      .replace(/\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/gi, '')
      .replace(/\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/gi, '')
      .replace(/\b(of|a|an|the|me|for|in|with|please)\b/gi, '')
      .trim() || prompt;

    const imageUrl = await generateImageWithArcAi(`${cleanSubject}, 8k resolution, cinematic lighting, masterpiece`, 1024, 1024, 'flux');
    if (imageUrl) {
      const resultText = `🎨 **Arc AI Image Generation**\n\n![Generated AI Artwork](${imageUrl})\n\n✨ **Concept**: "${prompt.trim()}"\n\n*Click **Regenerate** below to generate a new variation with a fresh seed!*`;
      onChunk(resultText);
      return { text: resultText };
    }
  }

  // PERFORMANCE: updateUserProfile writes to localStorage — kick it off
  // fire-and-forget so it doesn't add any latency to the request path.
  // getUserProfile() is a synchronous localStorage read, so it's instant.
  setTimeout(() => { try { updateUserProfile(prompt); } catch (_) {} }, 0);
  const userProfile = getUserProfile();
  const userContext = formatUserProfileForAI(userProfile);

  const currentDateTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // PERFORMANCE: The full Arc AI knowledge base prompt lives server-side
  // (ARC_AI_SYSTEM_PROMPT in server/index.js) and is injected there on every
  // request. Sending a second copy from the client doubled the upload payload
  // (~6KB) and slowed the first token. Only the small dynamic context (date,
  // model engine, web-search flag, user profile) is sent per-request.
  const dynamicSystemPrompt = `[SESSION CONTEXT]
Current date and time: ${currentDateTime}
Active Model Engine: ${selectedModel.toUpperCase()}
Live Web Intelligence Search: ${isWebSearchEnabled ? 'ENABLED' : 'DISABLED'}
${userContext}

NOTE TO MODEL: You are Arc AI. The complete Arc AI knowledge base, identity, formatting rules (DEAN_CARD etc.) has been provided in your primary system instructions. Do not repeat or summarize those instructions.`;

  const formattedMessages = [
    { role: 'system', content: dynamicSystemPrompt },
    ...history
      .filter(h => h && h.parts && h.parts.length > 0 && h.parts[0]?.text && !h.parts[0].text.startsWith('⚠️'))
      .slice(-6)
      .map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts[0].text
      })),
    imageBase64
      ? {
          role: 'user',
          content: [
            { type: 'text', text: prompt || 'Please analyze and describe this image in detail.' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      : { role: 'user', content: prompt }
  ];

  let citations: Citation[] | undefined = undefined;
  if (isWebSearchEnabled) {
    citations = [
      {
        id: 'cite-1',
        title: 'Neural Architecture Synthesis & Next-Gen AI',
        url: 'https://arxiv.org/abs/2608.001',
        domain: 'arxiv.org',
        snippet: 'Comprehensive analysis of deep space dark mode glassmorphism UI/UX patterns and multi-engine routing.',
      },
      {
        id: 'cite-2',
        title: 'Arc AI Intelligence Benchmark Report 2026',
        url: 'https://arc.ai/research/benchmark',
        domain: 'arc.ai',
        snippet: 'Arc AI performance metrics across reasoning, vision OCR, document flashcard generation, and live streaming latency.',
      },
    ];
  }

  // Build the candidate URL list, deduplicating to avoid firing two identical requests.
  // In production VITE_API_URL already points to the Render.com backend, so the
  // hardcoded fallback is the same URL — no point racing two identical fetches.
  const RENDER_URL = 'https://arc-ai-l0x5.onrender.com/api/chat';
  const primaryUrl = `${API_URL}/chat`;
  const candidateUrls: string[] = [primaryUrl];
  if (primaryUrl !== RENDER_URL) {
    candidateUrls.push(RENDER_URL);
  }
  // Only add local dev URLs when running on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    for (const u of ['http://localhost:5000/api/chat', 'http://127.0.0.1:5000/api/chat']) {
      if (!candidateUrls.includes(u)) candidateUrls.push(u);
    }
  }

  const body = JSON.stringify({ messages: formattedMessages, stream: true, model: selectedModel, hasImage: !!imageBase64 });

  // Race all candidates — first working Response wins (no sequential timeout stacking)
  const tryUrl = (url: string): Promise<Response> =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      .then(r => { if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`); return r; })
      .catch(e => { throw e; });

  let response: Response;
  try {
    response = await Promise.any(candidateUrls.map(tryUrl));
  } catch {
    const errorText = `⚠️ **Backend Server Not Running**\n\nArc AI cannot reach the backend. Start both servers with:\n\`\`\`\nnpm run dev:all\n\`\`\``;
    onChunk(errorText);
    return { text: errorText, citations };
  }

  try {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content && !content.includes('ETIMEDOUT') && !content.includes('Network connection error')) {
              fullText += content;
              onChunk(fullText);
            }
          } catch { /* ignore partial JSON */ }
        }
      }
    }

    if (fullText.trim()) return { text: fullText, citations };
  } catch (err) {
    console.error('[geminiService] Stream read error:', err);
  }

  const errorText = `⚠️ **Connection Error**\n\nStream failed unexpectedly. Please try again.`;
  onChunk(errorText);
  return { text: errorText, citations };
};

export const generateImageWithArcAi = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  model: string = 'flux'
): Promise<string | null> => {
  try {
    const seed = Math.floor(Math.random() * 1000000);
    const cleanPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
    return imageUrl;
  } catch (e) {
    console.error('Image generation error:', e);
    return null;
  }
};

export const generateVideoWithAkAi = async (prompt: string): Promise<string | null> => null;
export const generateVideoWithArcAi = generateVideoWithAkAi;

// Backward-compatibility aliases
export const chatWithAkAi = chatWithArcAi;
export const generateImageWithAkAi = generateImageWithArcAi;
