// Arc AI Extension — Side Panel Logic
// Talks to the Render backend (primary) with localhost fallback for local dev

let BACKEND = 'https://arc-ai-l0x5.onrender.com';
const BACKEND_CANDIDATES = ['https://arc-ai-l0x5.onrender.com', 'http://localhost:5000', 'http://127.0.0.1:5000'];
const STORAGE_KEY = 'arc_ai_ext_messages';

// ── State ─────────────────────────────────────────────────────────────────────
let messages   = [];       // { role:'user'|'ai', text, imageBase64? }
let isLoading  = false;
let stopFlag   = false;
let attachedB64 = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $msgs       = document.getElementById('messages');
const $empty      = document.getElementById('empty-state');
const $input      = document.getElementById('msg-input');
const $sendBtn    = document.getElementById('btn-send');
const $clearBtn   = document.getElementById('btn-clear');
const $newBtn     = document.getElementById('btn-new');
const $attachBtn  = document.getElementById('btn-attach');
const $fileInput  = document.getElementById('file-input');
const $imgBar     = document.getElementById('image-preview-bar');
const $imgThumb   = document.getElementById('img-thumb');
const $imgRemove  = document.getElementById('img-remove');
const $errBanner  = document.getElementById('error-banner');
const $statusDot  = document.getElementById('status-dot');
const $statusText = document.getElementById('status-text');
const $model      = document.getElementById('model-select');

// ── Init ──────────────────────────────────────────────────────────────────────
loadHistory();
checkBackend();
setInterval(checkBackend, 10000);

// ── Backend health check ──────────────────────────────────────────────────────
async function checkBackend() {
  for (const candidate of BACKEND_CANDIDATES) {
    try {
      const r = await fetch(`${candidate}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        BACKEND = candidate;
        setStatus('online', 'Arc AI Backend online');
        const display = document.getElementById('backend-url-display');
        if (display) display.textContent = candidate.replace('http://', '');
        return;
      }
    } catch (_) {}
  }
  setStatus('error', 'Backend offline — check Render dashboard');
}

function setStatus(state, text) {
  $statusDot.className = state;
  $statusText.textContent = text;
}

// ── History persistence (chrome.storage.local) ────────────────────────────────
function loadHistory() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const saved = result[STORAGE_KEY];
    if (Array.isArray(saved) && saved.length > 0) {
      messages = saved;
      renderAll();
    }
  });
}

function saveHistory() {
  // Keep last 100 messages
  const toSave = messages.slice(-100);
  chrome.storage.local.set({ [STORAGE_KEY]: toSave });
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderAll() {
  // Clear existing bubbles (not the empty state)
  Array.from($msgs.querySelectorAll('.msg-row')).forEach(el => el.remove());
  const typingEl = $msgs.querySelector('.typing-row');
  if (typingEl) typingEl.remove();

  $empty.style.display = messages.length === 0 ? 'flex' : 'none';
  messages.forEach(m => appendBubble(m.role, m.text, m.imageBase64));
  scrollToBottom();
}

function appendBubble(role, text, imageBase64) {
  $empty.style.display = 'none';

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role}`;
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;

  // Show attached image above text
  if (imageBase64) {
    const img = document.createElement('img');
    img.src = imageBase64;
    img.className = 'attached';
    bubble.appendChild(img);
  }

  // Render text — AI gets markdown, user gets plain
  if (role === 'ai') {
    bubble.innerHTML += renderMarkdown(text);
  } else {
    const span = document.createElement('span');
    span.style.whiteSpace = 'pre-wrap';
    span.textContent = text;
    bubble.appendChild(span);
  }

  wrap.appendChild(bubble);

  // Copy button for AI
  if (role === 'ai') {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text);
      copyBtn.textContent = '✓ Copied';
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
    });
    wrap.appendChild(copyBtn);
  }

  row.appendChild(avatar);
  row.appendChild(wrap);
  $msgs.appendChild(row);
  scrollToBottom();
  return row;
}

function showTyping() {
  removeTyping();
  const row = document.createElement('div');
  row.className = 'msg-row ai typing-row';
  const avatar = document.createElement('div');
  avatar.className = 'avatar ai';
  avatar.textContent = '🤖';
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  row.appendChild(avatar);
  row.appendChild(dots);
  $msgs.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const t = $msgs.querySelector('.typing-row');
  if (t) t.remove();
}

function scrollToBottom() {
  $msgs.scrollTop = $msgs.scrollHeight;
}

// ── Markdown & Custom Card Renderer ───────────────────────────
function renderMarkdown(text) {
  // First preserve DEAN_CARD format
  const deanRegex = /\[DEAN_CARD\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([\s\S]+?)\]/g;
  let processed = text.replace(deanRegex, (_, name, role, img, info) => {
    const fullImg = img.startsWith('http') ? img : `${BACKEND}${img}`;
    const cleanInfo = info.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>').trim();
    return `###DEAN_CARD_START###${escapeHtml(name)}|${escapeHtml(role)}|${fullImg}|${cleanInfo}###DEAN_CARD_END###`;
  });

  let html = escapeHtml(processed);

  // Restore DEAN_CARD
  const deanPlaceholderRegex = /###DEAN_CARD_START###([^\|]+)\|([^\|]+)\|([^\|]+)\|([\s\S]+?)###DEAN_CARD_END###/g;
  html = html.replace(deanPlaceholderRegex, (_, name, role, img, cleanInfo) => `
    <div class="dean-card">
      <div class="dean-card-header">
        <img src="${img}" alt="${name}" class="dean-card-img" onerror="this.style.display='none'" />
        <div>
          <div class="dean-card-title">${name}</div>
          <div class="dean-card-role">${role}</div>
        </div>
      </div>
      <div class="dean-card-info">${cleanInfo}</div>
    </div>
  `);

  // Markdown images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const fullUrl = url.startsWith('/') ? `${BACKEND}${url}` : url;
    return `<a href="${fullUrl}" target="_blank"><img src="${fullUrl}" alt="${alt}" class="md-img" /></a>`;
  });

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

  // Unordered list
  html = html.replace(/^[*\-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Single newlines inside paragraphs
  html = html.replace(/\n/g, '<br/>');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = $input.value.trim();
  if (!text && !attachedB64) return;
  if (isLoading) return;

  showError(null);

  const userMsg = { role: 'user', text: text || '(image)', imageBase64: attachedB64 };
  messages.push(userMsg);
  appendBubble('user', userMsg.text, userMsg.imageBase64);
  saveHistory();

  $input.value = '';
  $input.style.height = 'auto';
  const imgB64 = attachedB64;
  clearAttachment();
  updateSendBtn();

  isLoading = true;
  stopFlag  = false;
  showTyping();
  setSendState(true);

  // Automatic Image Generation & Regeneration intent detection (same as Main Arc AI)
  const lowerPrompt = text.toLowerCase();
  const isImageRequest =
    !imgB64 && text && (
      /\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b.*\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/i.test(text) ||
      /\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b.*\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/i.test(text) ||
      lowerPrompt.includes('image genrate') || lowerPrompt.includes('photo generate') || lowerPrompt.includes('image panna')
    );

  if (isImageRequest) {
    const cleanSubject = text
      .replace(/\b(generate|create|draw|make|show|render|genrate|panna|kudu)\b/gi, '')
      .replace(/\b(image|photo|picture|artwork|drawing|painting|canvas|illustration)\b/gi, '')
      .replace(/\b(of|a|an|the|me|for|in|with|please)\b/gi, '')
      .trim() || text;

    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanSubject + ', 8k resolution, cinematic lighting, masterpiece')}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
    const resultText = `🎨 **Arc AI Image Generation**\n\n![Generated AI Artwork](${imageUrl})\n\n✨ **Concept**: "${text.trim()}"\n\n*Click image to view in high resolution.*`;

    removeTyping();
    messages.push({ role: 'ai', text: resultText });
    appendBubble('ai', resultText);
    saveHistory();
    isLoading = false;
    stopFlag  = false;
    setSendState(false);
    scrollToBottom();
    return;
  }

  // Build history for API (last 12 turns, text only)
  const history = messages.slice(-13, -1)
    .filter(m => m.text && !m.text.startsWith('⚠️'))
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

  const model = $model.value || 'claude-3-5';

  try {
    const response = await fetch(`${BACKEND}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          ...history,
          imgB64
            ? { role: 'user', content: [{ type: 'text', text: text || 'Analyze this image.' }, { type: 'image_url', image_url: { url: imgB64 } }] }
            : { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    removeTyping();

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';

    // Create AI bubble for streaming
    const aiMsgObj = { role: 'ai', text: '' };
    messages.push(aiMsgObj);
    const aiRow    = appendBubble('ai', '…');
    const aiBubble = aiRow.querySelector('.bubble.ai');

    while (true) {
      if (stopFlag) break;
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const parsed  = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            aiBubble.innerHTML = renderMarkdown(fullText);
            scrollToBottom();
          }
        } catch (_) { /* partial JSON */ }
      }
    }

    aiMsgObj.text = fullText || '*(no response)*';
    aiBubble.innerHTML = renderMarkdown(aiMsgObj.text);

    // Refresh copy button text ref
    const copyBtn = aiRow.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(aiMsgObj.text);
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
      };
    }

    saveHistory();

  } catch (err) {
    removeTyping();
    const isNetworkErr = err.message.includes('Failed to fetch') || err.message.includes('NetworkError');
    const errText = isNetworkErr
      ? '⚠️ Cannot reach Arc AI backend.\n\nThe Render backend may be starting up (free tier spins down after inactivity). Please wait ~30 seconds and try again.'
      : `⚠️ ${err.message}`;

    messages.push({ role: 'ai', text: errText });
    appendBubble('ai', errText);
    saveHistory();
    if (isNetworkErr) {
      showError('Render backend unreachable — it may be waking up. Wait 20s and retry.');
      checkBackend();
    }
  }

  isLoading = false;
  stopFlag  = false;
  setSendState(false);
  scrollToBottom();
}

function setSendState(loading) {
  if (loading) {
    $sendBtn.style.display = 'none';
    let stopBtn = document.getElementById('stop-btn');
    if (!stopBtn) {
      stopBtn = document.createElement('button');
      stopBtn.id = 'stop-btn';
      stopBtn.className = 'stop-btn';
      stopBtn.textContent = '⏹';
      stopBtn.title = 'Stop generation';
      stopBtn.addEventListener('click', () => { stopFlag = true; });
      document.getElementById('input-wrap').appendChild(stopBtn);
    }
    stopBtn.style.display = 'flex';
  } else {
    $sendBtn.style.display = 'flex';
    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) stopBtn.style.display = 'none';
  }
}

function showError(msg) {
  if (msg) {
    $errBanner.textContent = msg;
    $errBanner.classList.add('visible');
  } else {
    $errBanner.classList.remove('visible');
  }
}

// ── Image attachment ──────────────────────────────────────────────────────────
function setAttachment(b64, mimeType) {
  attachedB64 = b64;
  $imgThumb.src = b64;
  $imgBar.classList.add('visible');
  // Auto-switch to vision model
  if ($model.value !== 'gemini-1-5') {
    $model.value = 'gemini-1-5';
  }
  updateSendBtn();
}

function clearAttachment() {
  attachedB64 = null;
  $imgThumb.src = '';
  $imgBar.classList.remove('visible');
}

function processFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { showError('Only image files are supported.'); return; }
  if (file.size > 10 * 1024 * 1024)    { showError('Image must be under 10 MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => setAttachment(e.target.result);
  reader.readAsDataURL(file);
}

// ── Input events ──────────────────────────────────────────────────────────────
$input.addEventListener('input', () => {
  $input.style.height = 'auto';
  $input.style.height = Math.min($input.scrollHeight, 90) + 'px';
  updateSendBtn();
});

$input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Paste image from clipboard
$input.addEventListener('paste', e => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const f = items[i].getAsFile();
      if (f) { processFile(f); break; }
    }
  }
});

$sendBtn.addEventListener('click', sendMessage);

$attachBtn.addEventListener('click', () => $fileInput.click());
$fileInput.addEventListener('change', e => { processFile(e.target.files?.[0]); e.target.value = ''; });

$imgRemove.addEventListener('click', clearAttachment);

$clearBtn.addEventListener('click', () => {
  messages = [];
  chrome.storage.local.remove(STORAGE_KEY);
  renderAll();
});

$newBtn.addEventListener('click', () => {
  messages = [];
  chrome.storage.local.remove(STORAGE_KEY);
  renderAll();
  $input.focus();
});

function updateSendBtn() {
  $sendBtn.disabled = isLoading || (!$input.value.trim() && !attachedB64);
}

// Drag and drop images onto the panel
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer.files?.[0];
  if (f) processFile(f);
});
