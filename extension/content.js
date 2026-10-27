// Arc AI — Fullscreen LMS & PMS Portal Floating Assistant & Anti-Exit Stealth Engine
// Protects against PMS portal fullscreen drops, blur detection, screenshot detection, and Mixed Content.

(function () {
  if (window.__ARC_AI_LOADED__) return;
  // Do not run extension content script inside the local Arc AI web app
  if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
  window.__ARC_AI_LOADED__ = true;

  // ── 1. Main World Stealth Shield ───────────────────────────────────────────
  // Note: shield.js runs natively via manifest.json with "world": "MAIN" at document_start.
  // This executes natively in the page context with ZERO inline script injection and 100% CSP compliance.

  // ── 2. State & Variables ───────────────────────────────────────────────────
  let messages = [];
  let isPanelOpen = false;
  let isMinimized = false;
  let isLoading = false;
  let currentModel = 'claude-3-5';
  let activePort = null;
  let backendOnline = false;
  let shieldActive = true;
  let attachedImageB64 = null;

  // ── 3. Host Element & Shadow DOM (Isolation from PMS styles) ─────────────────
  const host = document.createElement('div');
  host.id = 'arc-ai-fullscreen-root';
  host.style.cssText = 'all: initial !important; position: static !important;';

  const shadow = host.attachShadow({ mode: 'open' });

  // Attach to fullscreen container so Arc AI is never hidden in fullscreen mode
  function attachToTopLayer() {
    try {
      const fsEl =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      const target = fsEl || document.body || document.documentElement;
      if (target && host.parentElement !== target) {
        target.appendChild(host);
      }
    } catch (_) {}
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, attachToTopLayer, true);
    window.addEventListener(evt, attachToTopLayer, true);
  });

  if (document.body) attachToTopLayer();
  else document.addEventListener('DOMContentLoaded', attachToTopLayer);
  setInterval(attachToTopLayer, 1500);

  // ── 4. Shadow DOM Styles & Structure ─────────────────────────────────────────
  shadow.innerHTML = `
    <style>
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      :host {
        all: initial !important;
        position: fixed !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      }

      .pointer-active {
        pointer-events: auto !important;
      }

      /* Floating Trigger Circle */
      #arc-trigger-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #06b6d4);
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.4);
        color: #ffffff;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
        z-index: 2147483647;
      }

      #arc-trigger-btn:hover {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 12px 36px rgba(124, 58, 237, 0.6), 0 0 28px rgba(6, 182, 212, 0.7);
      }

      #arc-trigger-btn .dot-online {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 11px;
        height: 11px;
        background: #10b981;
        border: 2px solid #0f172a;
        border-radius: 50%;
        box-shadow: 0 0 8px #10b981;
      }

      /* Main Chat Panel */
      #arc-panel {
        position: fixed;
        bottom: 84px;
        right: 24px;
        width: 390px;
        height: 550px;
        background: rgba(11, 16, 30, 0.96);
        border: 1.5px solid rgba(139, 92, 246, 0.45);
        border-radius: 18px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(124, 58, 237, 0.25);
        backdrop-filter: blur(28px) saturate(180%);
        -webkit-backdrop-filter: blur(28px);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483647;
        color: #f1f5f9;
        font-size: 13px;
        transition: height 0.2s ease, opacity 0.15s ease, transform 0.2s ease;
        transform-origin: bottom right;
      }

      #arc-panel.open {
        display: flex;
        animation: arcPop 0.22s ease-out forwards;
      }

      #arc-panel.minimized {
        height: 52px !important;
      }

      @keyframes arcPop {
        from { opacity: 0; transform: scale(0.92) translateY(16px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      /* Title Bar */
      #arc-title-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(15, 20, 40, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        cursor: grab;
        user-select: none;
        flex-shrink: 0;
      }

      #arc-title-bar:active {
        cursor: grabbing;
      }

      .arc-avatar {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: linear-gradient(135deg, #7c3aed, #06b6d4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: #fff;
        flex-shrink: 0;
      }

      .arc-title-info {
        flex: 1;
        min-width: 0;
      }

      .arc-title-info h3 {
        font-size: 12px;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.2;
      }

      .arc-title-info span {
        font-size: 9px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .arc-badge-shield {
        padding: 2px 7px;
        border-radius: 99px;
        background: rgba(16, 185, 129, 0.18);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
        font-size: 9px;
        font-weight: 700;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
        transition: background 0.15s;
      }

      .arc-badge-shield.shield-off {
        background: rgba(239, 68, 68, 0.18);
        border-color: rgba(239, 68, 68, 0.4);
        color: #f87171;
      }

      .arc-btn-icon {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        transition: all 0.15s;
        flex-shrink: 0;
      }

      .arc-btn-icon:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      /* Quick Action Bar for PMS/LMS */
      #arc-lms-bar {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        background: rgba(15, 23, 42, 0.88);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        overflow-x: auto;
      }

      .arc-quick-btn {
        padding: 4px 7px;
        border-radius: 6px;
        background: rgba(124, 58, 237, 0.16);
        border: 1px solid rgba(124, 58, 237, 0.35);
        color: #c084fc;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 3px;
        transition: background 0.15s, color 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .arc-quick-btn:hover {
        background: rgba(124, 58, 237, 0.35);
        color: #ffffff;
      }

      .arc-quick-btn.speed-active {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.5);
        color: #34d399;
      }

      .arc-quick-btn.snap-btn {
        background: rgba(6, 182, 212, 0.16);
        border-color: rgba(6, 182, 212, 0.4);
        color: #67e8f9;
      }
      .arc-quick-btn.snap-btn:hover {
        background: rgba(6, 182, 212, 0.35);
        color: #ffffff;
      }

      .arc-quick-btn.crop-btn {
        background: rgba(245, 158, 11, 0.18);
        border-color: rgba(245, 158, 11, 0.45);
        color: #fcd34d;
      }
      .arc-quick-btn.crop-btn:hover {
        background: rgba(245, 158, 11, 0.38);
        color: #ffffff;
      }

      .arc-quick-btn.unlock-btn {
        background: rgba(16, 185, 129, 0.18);
        border-color: rgba(16, 185, 129, 0.45);
        color: #6ee7b7;
      }
      .arc-quick-btn.unlock-btn:hover {
        background: rgba(16, 185, 129, 0.38);
        color: #ffffff;
      }

      .arc-quick-btn.pick-btn {
        background: rgba(99, 102, 241, 0.18);
        border-color: rgba(99, 102, 241, 0.45);
        color: #a5b4fc;
      }
      .arc-quick-btn.pick-btn:hover {
        background: rgba(99, 102, 241, 0.38);
        color: #ffffff;
      }

      #arc-model-select {
        flex: 1;
        min-width: 90px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        border-radius: 6px;
        padding: 3px 6px;
        font-size: 10px;
        outline: none;
        cursor: pointer;
      }

      /* Messages View */
      #arc-messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      #arc-messages::-webkit-scrollbar { width: 5px; }
      #arc-messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); border-radius: 99px; }

      .msg-row {
        display: flex;
        gap: 8px;
      }
      .msg-row.user { flex-direction: row-reverse; }

      .msg-bubble {
        padding: 8px 12px;
        border-radius: 14px;
        font-size: 12px;
        line-height: 1.55;
        max-width: 86%;
        word-break: break-word;
      }

      .msg-row.user .msg-bubble {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(6, 182, 212, 0.3));
        border: 1px solid rgba(124, 58, 237, 0.35);
        color: #ffffff;
        border-top-right-radius: 4px;
      }

      .msg-row.ai .msg-bubble {
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        border-top-left-radius: 4px;
      }

      /* Attached Snap Thumbnail */
      #arc-attach-bar {
        display: none;
        padding: 6px 10px;
        background: rgba(15, 23, 42, 0.95);
        border-top: 1px solid rgba(6, 182, 212, 0.25);
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      #arc-thumb {
        width: 44px;
        height: 38px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #06b6d4;
      }

      /* Dean Card format */
      .dean-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 6px 0;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid rgba(6, 182, 212, 0.3);
        background: rgba(15, 23, 42, 0.8);
      }
      .dean-card-header {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .dean-card-img {
        width: 60px;
        height: 72px;
        object-fit: cover;
        border-radius: 8px;
        border: 1.5px solid rgba(6, 182, 212, 0.5);
      }
      .dean-card-name { font-size: 12px; font-weight: 700; color: #67e8f9; }
      .dean-card-role { font-size: 10px; font-weight: 600; color: #c084fc; margin-top: 2px; }
      .dean-card-info { font-size: 11px; color: #cbd5e1; line-height: 1.45; white-space: pre-wrap; }

      /* Markdown & Code inside bubbles */
      .msg-bubble code {
        background: rgba(0, 0, 0, 0.4);
        color: #67e8f9;
        padding: 1px 4px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 11px;
      }
      .msg-bubble pre {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 8px;
        overflow-x: auto;
        margin: 6px 0;
      }
      .msg-bubble pre code { background: none; padding: 0; color: #e2e8f0; }
      .msg-bubble strong { color: #ffffff; }
      .msg-bubble ul, .msg-bubble ol { padding-left: 18px; margin: 4px 0; }
      .msg-bubble li { margin: 2px 0; }
      .msg-bubble img.md-img {
        max-width: 100%;
        border-radius: 8px;
        margin: 6px 0;
        border: 1px solid rgba(6, 182, 212, 0.3);
      }

      /* Copy Button */
      .btn-copy {
        font-size: 9px;
        color: #64748b;
        background: none;
        border: none;
        cursor: pointer;
        margin-top: 4px;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        transition: color 0.15s;
      }
      .btn-copy:hover { color: #cbd5e1; }

      /* Input Area */
      #arc-input-area {
        padding: 8px 10px;
        background: rgba(11, 16, 30, 0.98);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
      }

      #arc-input-box {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 12px;
        border: 1px solid rgba(139, 92, 246, 0.35);
        background: rgba(15, 20, 40, 0.9);
      }

      #arc-textarea {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 12px;
        color: #f8fafc;
        resize: none;
        max-height: 84px;
        line-height: 1.45;
        padding: 2px 0;
      }

      #arc-send-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: linear-gradient(135deg, #7c3aed, #06b6d4);
        border: none;
        color: #ffffff;
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.1s, opacity 0.15s;
      }
      #arc-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      #arc-send-btn:not(:disabled):hover { transform: scale(1.06); }

      #arc-stop-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #f87171;
        font-size: 10px;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      /* Toast Notification */
      #arc-toast {
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        background: rgba(16, 185, 129, 0.95);
        color: #ffffff;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s ease;
        z-index: 2147483647;
      }
      #arc-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* Bottom Hint */
      .arc-hint {
        text-align: center;
        font-size: 9px;
        color: #475569;
        margin-top: 4px;
      }
    </style>

    <!-- Floating Trigger Circle -->
    <div id="arc-trigger-btn" class="pointer-active" title="Arc AI Assistant (Alt+A)">
      🤖
      <div class="dot-online" id="arc-online-dot"></div>
    </div>

    <!-- Floating Chat Window -->
    <div id="arc-panel" class="pointer-active">
      <!-- Title Bar -->
      <div id="arc-title-bar">
        <div class="arc-avatar">🤖</div>
        <div class="arc-title-info">
          <h3>Arc AI Assistant</h3>
          <span id="arc-status-sub">⚡ Fullscreen LMS Overlay</span>
        </div>
        <div class="arc-badge-shield" id="arc-shield-badge" title="Click to toggle Anti-Exit & Screenshot Shield">🛡️ Shield ON</div>
        <button class="arc-btn-icon" id="arc-btn-clear" title="Clear chat">🗑</button>
        <button class="arc-btn-icon" id="arc-btn-min" title="Minimize">–</button>
        <button class="arc-btn-icon" id="arc-btn-close" title="Close (Alt+A)">✕</button>
      </div>

      <!-- Quick Action Tools for LMS/PMS -->
      <div id="arc-lms-bar">
        <button class="arc-quick-btn snap-btn" id="arc-btn-snap" title="Take silent screenshot of full screen without blur or exiting fullscreen (Alt+S)">
          📸 Snap (Alt+S)
        </button>
        <button class="arc-quick-btn crop-btn" id="arc-btn-crop" title="Drag and crop an exact question or formula box (Alt+X)">
          ✂️ Area Snip (Alt+X)
        </button>
        <button class="arc-quick-btn unlock-btn" id="arc-btn-unlock" title="Unblock LMS text selection and copy protections (Alt+U)">
          🔓 Unlock Copy (Alt+U)
        </button>
        <button class="arc-quick-btn pick-btn" id="arc-btn-pick" title="Click any question on LMS page to extract its text and solve (Alt+T)">
          📋 Pick Text (Alt+T)
        </button>
        <button class="arc-quick-btn" id="arc-btn-capture" title="Ask Arc AI about selected text (Alt+C)">
          📝 Ask Selected
        </button>
        <button class="arc-quick-btn" id="arc-btn-speed" title="Speed up LMS/PMS video (2x)">
          ⚡ 2x Speed
        </button>
        <select id="arc-model-select">
          <option value="claude-3-5" selected>Claude 3.5 (Recommended)</option>
          <option value="gpt-5">GPT-5 (Qwen 3.7 Plus)</option>
          <option value="gemini-1-5">Gemini 1.5 Pro (Vision)</option>
          <option value="deepseek-r1">DeepSeek R1</option>
          <option value="llama-3-3">Llama 3.3</option>
        </select>
      </div>

      <!-- Attached Image Bar -->
      <div id="arc-attach-bar">
        <img id="arc-thumb" src="" alt="preview" />
        <span style="font-size:10px; color:#67e8f9; flex:1;">📸 Snap Attached (Vision Ready)</span>
        <button id="arc-remove-thumb" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:12px; font-weight:bold;">✕</button>
      </div>

      <!-- Messages -->
      <div id="arc-messages">
        <div class="msg-row ai">
          <div class="msg-bubble">
            ✨ <b>Arc AI Fullscreen & LMS Copilot Active</b><br/>
            I stay right on top of your <b>LMS / PMS portal</b> even during full-screen exams or videos.<br/><br/>
            • <b>📸 Snap (<kbd>Alt+S</kbd>)</b>: Silent full screen capture without focus loss.<br/>
            • <b>✂️ Area Snip (<kbd>Alt+X</kbd>)</b>: Drag a box over any test question to crop & solve.<br/>
            • <b>🔓 Unlock Copy (<kbd>Alt+U</kbd>)</b>: Unblocks right-click, selection, and <kbd>Ctrl+C</kbd> on LMS.<br/>
            • <b>📋 Pick Text (<kbd>Alt+T</kbd>)</b>: Click any question to copy & ask AI directly.<br/>
            • <b>🛡️ Shield ON</b>: Blocks anti-cheat detection & forced fullscreen exit.
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div id="arc-input-area">
        <div id="arc-input-box">
          <textarea id="arc-textarea" rows="1" placeholder="Ask anything or hit Alt+S/Alt+X to snap questions…"></textarea>
          <button id="arc-paste-btn" title="Paste from clipboard (works even on LMS portals)" style="width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.1s,opacity 0.15s;">📋</button>
          <button id="arc-stop-btn" title="Stop generating">⏹</button>
          <button id="arc-send-btn" title="Send message (Enter)">↑</button>
        </div>
        <div class="arc-hint">Alt+S: Snap · Alt+X: Area Crop · Alt+U: Unlock Copy · Alt+A: Toggle</div>
      </div>

      <!-- Toast message -->
      <div id="arc-toast"></div>
    </div>
  `;

  // ── 5. DOM References inside Shadow DOM ─────────────────────────────────────
  const $triggerBtn   = shadow.getElementById('arc-trigger-btn');
  const $panel        = shadow.getElementById('arc-panel');
  const $titleBar     = shadow.getElementById('arc-title-bar');
  const $shieldBadge  = shadow.getElementById('arc-shield-badge');
  const $minBtn       = shadow.getElementById('arc-btn-min');
  const $closeBtn     = shadow.getElementById('arc-btn-close');
  const $clearBtn     = shadow.getElementById('arc-btn-clear');
  const $snapBtn      = shadow.getElementById('arc-btn-snap');
  const $cropBtn      = shadow.getElementById('arc-btn-crop');
  const $unlockBtn    = shadow.getElementById('arc-btn-unlock');
  const $pickBtn      = shadow.getElementById('arc-btn-pick');
  const $speedBtn     = shadow.getElementById('arc-btn-speed');
  const $captureBtn   = shadow.getElementById('arc-btn-capture');
  const $modelSelect  = shadow.getElementById('arc-model-select');
  const $messages     = shadow.getElementById('arc-messages');
  const $textarea     = shadow.getElementById('arc-textarea');
  const $sendBtn      = shadow.getElementById('arc-send-btn');
  const $stopBtn      = shadow.getElementById('arc-stop-btn');
  const $pasteBtn     = shadow.getElementById('arc-paste-btn');
  const $toast        = shadow.getElementById('arc-toast');
  const $onlineDot    = shadow.getElementById('arc-online-dot');
  const $attachBar    = shadow.getElementById('arc-attach-bar');
  const $thumb        = shadow.getElementById('arc-thumb');
  const $removeThumb  = shadow.getElementById('arc-remove-thumb');

  // ── 6. Toast Helper ────────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(text, duration = 2400) {
    if (!$toast) return;
    $toast.textContent = text;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), duration);
  }

  // ── 7. Toggle Shield (Blocks PMS Fullscreen Exit & Detection) ───────────────
  $shieldBadge.addEventListener('click', () => {
    shieldActive = !shieldActive;
    try {
      window.postMessage({ type: 'ARC_SET_SHIELD', active: shieldActive }, '*');
    } catch (_) {}
    if (shieldActive) {
      $shieldBadge.textContent = '🛡️ Shield ON';
      $shieldBadge.classList.remove('shield-off');
      showToast('🛡️ LMS Anti-Exit & Screenshot Shield: ENABLED');
    } else {
      $shieldBadge.textContent = '🛡️ Shield OFF';
      $shieldBadge.classList.add('shield-off');
      showToast('⚠️ Shield Disabled');
    }
  });

  // ── 8. Silent Screenshot Engine (Full Screen) ──────────────────────────────
  async function takeSilentSnap() {
    try {
      showToast('📸 Capturing screen silently…', 1200);

      // Temporarily hide Arc AI panel so it is NOT in the captured picture
      $panel.style.visibility = 'hidden';
      $triggerBtn.style.visibility = 'hidden';

      // Wait a micro-tick for repaint
      await new Promise(r => setTimeout(r, 65));

      // Request background service worker to capture tab internally via Chrome API
      chrome.runtime.sendMessage({ action: 'captureScreen' }, (res) => {
        const lastErr = chrome.runtime.lastError;
        // Restore visibility immediately
        $panel.style.visibility = 'visible';
        $triggerBtn.style.visibility = 'visible';

        if (lastErr || !res || !res.success || !res.dataUrl) {
          showToast('⚠️ Capture failed: ' + (lastErr?.message || res?.error || 'Make sure extension is loaded and active.'));
          return;
        }

        // Attach image data
        attachedImageB64 = res.dataUrl;
        $thumb.src = res.dataUrl;
        $attachBar.style.display = 'flex';

        // Pre-fill prompt
        if (!$textarea.value.trim()) {
          $textarea.value = 'Please solve the question shown on the screen, give the correct option/answer, and explain clearly.';
          $textarea.style.height = 'auto';
          $textarea.style.height = Math.min($textarea.scrollHeight, 84) + 'px';
        }
        updateSendBtnState();

        // Auto-switch to Vision model for instant accuracy
        $modelSelect.value = 'gemini-1-5';

        if (!isPanelOpen) togglePanel(true);
        $textarea.focus();

        showToast('✅ Screen Snap Captured! Vision Ready');
      });
    } catch (e) {
      $panel.style.visibility = 'visible';
      $triggerBtn.style.visibility = 'visible';
      showToast('Error: ' + e.message);
    }
  }

  $snapBtn.addEventListener('click', takeSilentSnap);

  // ── 9. Interactive Area Snip Tool (Crop Question Box) ──────────────────────
  let areaSnipActive = false;
  async function startAreaSnip() {
    if (areaSnipActive) return;
    areaSnipActive = true;
    showToast('✂️ Drag across the question box to crop · ESC to cancel', 3500);

    // Hide Arc AI panel
    $panel.style.visibility = 'hidden';
    $triggerBtn.style.visibility = 'hidden';

    await new Promise(r => setTimeout(r, 65));

    chrome.runtime.sendMessage({ action: 'captureScreen' }, (res) => {
      const lastErr = chrome.runtime.lastError;
      if (lastErr || !res || !res.success || !res.dataUrl) {
        $panel.style.visibility = 'visible';
        $triggerBtn.style.visibility = 'visible';
        areaSnipActive = false;
        showToast('⚠️ Capture failed: ' + (res?.error || 'Make sure extension permissions are active.'));
        return;
      }

      // Create selection overlay
      const overlay = document.createElement('div');
      overlay.id = 'arc-snip-overlay';
      overlay.style.cssText = `
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        cursor: crosshair !important;
        background: rgba(0, 0, 0, 0.28) !important;
        user-select: none !important;
      `;

      const guide = document.createElement('div');
      guide.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(6, 182, 212, 0.6);
        color: #ffffff;
        padding: 6px 18px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        pointer-events: none;
        letter-spacing: 0.3px;
      `;
      guide.innerHTML = '✂️ <b>Drag a box</b> over the question or formula · Press <kbd style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:4px;">ESC</kbd> to cancel';
      overlay.appendChild(guide);

      const box = document.createElement('div');
      box.style.cssText = `
        position: absolute;
        border: 2px dashed #06b6d4;
        background: rgba(6, 182, 212, 0.16);
        box-shadow: 0 0 16px rgba(6, 182, 212, 0.4);
        display: none;
        pointer-events: none;
      `;
      overlay.appendChild(box);

      let isDown = false;
      let startX = 0, startY = 0;

      function onMouseDown(e) {
        if (e.button !== 0) return;
        isDown = true;
        startX = e.clientX;
        startY = e.clientY;
        box.style.left = startX + 'px';
        box.style.top = startY + 'px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
        e.preventDefault();
      }

      function onMouseMove(e) {
        if (!isDown) return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = width + 'px';
        box.style.height = height + 'px';
      }

      function cleanUp() {
        areaSnipActive = false;
        overlay.remove();
        window.removeEventListener('keydown', onKeyDown);
        $panel.style.visibility = 'visible';
        $triggerBtn.style.visibility = 'visible';
      }

      function onKeyDown(e) {
        if (e.key === 'Escape') {
          cleanUp();
          showToast('Snip cancelled');
        }
      }
      window.addEventListener('keydown', onKeyDown);

      function onMouseUp(e) {
        if (!isDown) return;
        isDown = false;
        const endX = e.clientX;
        const endY = e.clientY;
        const cropX = Math.min(startX, endX);
        const cropY = Math.min(startY, endY);
        const cropW = Math.abs(endX - startX);
        const cropH = Math.abs(endY - startY);

        cleanUp();

        if (cropW < 20 || cropH < 20) {
          showToast('⚠️ Box was too small. Drag a larger area.');
          return;
        }

        // Crop the captured tab image using an offscreen canvas
        const img = new Image();
        img.onload = () => {
          try {
            const scale = img.naturalWidth / window.innerWidth;
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(cropW * scale);
            canvas.height = Math.round(cropH * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
              img,
              cropX * scale, cropY * scale, cropW * scale, cropH * scale,
              0, 0, canvas.width, canvas.height
            );

            const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);

            // Attach cropped image
            attachedImageB64 = croppedUrl;
            $thumb.src = croppedUrl;
            $attachBar.style.display = 'flex';

            if (!$textarea.value.trim()) {
              $textarea.value = 'Please solve the question shown in this cropped image, identify the correct answer, and explain step-by-step.';
              $textarea.style.height = 'auto';
              $textarea.style.height = Math.min($textarea.scrollHeight, 84) + 'px';
            }
            updateSendBtnState();

            $modelSelect.value = 'gemini-1-5';
            if (!isPanelOpen) togglePanel(true);
            $textarea.focus();

            showToast('✂️ Area Snip Attached! Ready to solve.');
          } catch (err) {
            showToast('Crop error: ' + err.message);
          }
        };
        img.src = res.dataUrl;
      }

      overlay.addEventListener('mousedown', onMouseDown);
      overlay.addEventListener('mousemove', onMouseMove);
      overlay.addEventListener('mouseup', onMouseUp);

      (document.fullscreenElement || document.body || document.documentElement).appendChild(overlay);
    });
  }

  $cropBtn.addEventListener('click', startAreaSnip);

  // ── 10. Force Unlock Copy & Selection on LMS ────────────────────────────────
  function forceUnlockCopy() {
    try {
      // Notify main world shield
      window.postMessage({ type: 'ARC_FORCE_UNLOCK_COPY' }, '*');

      // Inject aggressive stylesheet in content script realm
      let style = document.getElementById('arc-force-unlock-sheet');
      if (!style) {
        style = document.createElement('style');
        style.id = 'arc-force-unlock-sheet';
        style.textContent = `
          *, *::before, *::after, html, body, div, p, span, h1, h2, h3, h4, h5, h6, table, tr, td, th, pre, code, li, a, label {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            pointer-events: auto !important;
          }
          ::selection { background: #38bdf8 !important; color: #0f172a !important; }
        `;
        (document.head || document.documentElement).appendChild(style);
      }

      // Clear inline locks
      const attrs = ['oncopy', 'oncut', 'onselectstart', 'oncontextmenu', 'ondragstart', 'unselectable'];
      attrs.forEach(attr => {
        try { document[attr] = null; } catch(_) {}
        try { window[attr] = null; } catch(_) {}
        if (document.body) {
          try { document.body[attr] = null; } catch(_) {}
        }
      });

      document.querySelectorAll('[oncopy], [oncut], [onselectstart], [oncontextmenu], [unselectable]').forEach(el => {
        attrs.forEach(a => el.removeAttribute(a));
        if (el.style) {
          el.style.userSelect = 'text';
          el.style.webkitUserSelect = 'text';
        }
      });

      showToast('🔓 LMS Copy & Selection 100% Unlocked! (Ctrl+C now works)', 3000);
    } catch (e) {
      showToast('Unlock error: ' + e.message);
    }
  }

  $unlockBtn.addEventListener('click', forceUnlockCopy);

  // ── 11. Click-to-Pick Element Text (Alt+T) ──────────────────────────────────
  let textPickerActive = false;
  function startTextPicker() {
    if (textPickerActive) return;
    textPickerActive = true;
    showToast('📋 Hover & click any question on page to copy it · ESC to cancel', 3500);

    let lastTarget = null;
    let prevOutline = '';

    function onMouseMove(e) {
      const target = e.target;
      if (target === host || host.contains(target)) return;
      if (lastTarget && lastTarget !== target) {
        lastTarget.style.outline = prevOutline;
      }
      lastTarget = target;
      prevOutline = target.style.outline;
      target.style.outline = '2px solid #06b6d4';
    }

    function onClick(e) {
      if (e.target === host || host.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      stopPicker();

      const text = (e.target.innerText || e.target.textContent || '').trim();
      if (!text) {
        showToast('⚠️ No text found in clicked element.');
        return;
      }

      // Copy text to clipboard
      try { navigator.clipboard.writeText(text); } catch(_) {}

      $textarea.value = `Please solve this LMS question:\n\n"${text}"`;
      $textarea.style.height = 'auto';
      $textarea.style.height = Math.min($textarea.scrollHeight, 84) + 'px';
      updateSendBtnState();

      if (!isPanelOpen) togglePanel(true);
      $textarea.focus();
      showToast('📋 Question copied & loaded into Arc AI!');
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        stopPicker();
        showToast('Text picker cancelled');
      }
    }

    function stopPicker() {
      textPickerActive = false;
      if (lastTarget) lastTarget.style.outline = prevOutline;
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKeyDown, true);
    }

    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKeyDown, true);
  }

  $pickBtn.addEventListener('click', startTextPicker);

  // ── 12. Capture Selected Text ───────────────────────────────────────────────
  function askSelected() {
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      try { navigator.clipboard.writeText(sel); } catch(_) {}
      $textarea.value = `Explain and solve this LMS question:\n\n"${sel}"`;
      $textarea.style.height = 'auto';
      $textarea.style.height = Math.min($textarea.scrollHeight, 84) + 'px';
      updateSendBtnState();
      if (!isPanelOpen) togglePanel(true);
      $textarea.focus();
      showToast('📋 Captured selection & loaded into Arc AI!');
    } else {
      showToast('💡 Select some text on the LMS page first, or use 📋 Pick Text.');
    }
  }

  $captureBtn.addEventListener('click', askSelected);

  // Remove thumbnail
  $removeThumb.addEventListener('click', () => {
    attachedImageB64 = null;
    $attachBar.style.display = 'none';
    $thumb.src = '';
    updateSendBtnState();
  });

  // ── 13. Dragging logic for Panel ────────────────────────────────────────────
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  $titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('select') || e.target.closest('.arc-badge-shield')) return;
    isDragging = true;
    const rect = $panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
    $panel.style.left = `${newX}px`;
    $panel.style.top = `${newY}px`;
    $panel.style.right = 'auto';
    $panel.style.bottom = 'auto';
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // ── 14. Video Speed Hack for LMS / PMS Portals ─────────────────────────────
  let currentSpeed = 1;
  $speedBtn.addEventListener('click', () => {
    try {
      const videos = Array.from(document.querySelectorAll('video'));
      const iframes = Array.from(document.querySelectorAll('iframe'));
      iframes.forEach(f => {
        try {
          const doc = f.contentDocument || f.contentWindow?.document;
          if (doc) videos.push(...Array.from(doc.querySelectorAll('video')));
        } catch (_) {}
      });

      if (videos.length === 0) {
        showToast('⚠️ No video element found on this page.');
        return;
      }

      if (currentSpeed === 1) currentSpeed = 2;
      else if (currentSpeed === 2) currentSpeed = 2.5;
      else if (currentSpeed === 2.5) currentSpeed = 1.5;
      else currentSpeed = 1;

      videos.forEach(v => {
        v.playbackRate = currentSpeed;
        v.play().catch(() => {});
      });

      $speedBtn.textContent = `⚡ ${currentSpeed}x Speed`;
      $speedBtn.classList.toggle('speed-active', currentSpeed > 1);
      showToast(`🎬 Video Speed: ${currentSpeed}x (${videos.length} video${videos.length > 1 ? 's' : ''})`);
    } catch (e) {
      showToast(`Error: ${e.message}`);
    }
  });

  // ── 15. Toggle Panel & Global Keyboard Shortcuts ───────────────────────────
  function togglePanel(forceOpen) {
    attachToTopLayer();
    isPanelOpen = typeof forceOpen === 'boolean' ? forceOpen : !isPanelOpen;
    if (isPanelOpen) {
      $panel.classList.add('open');
      $textarea.focus();
    } else {
      $panel.classList.remove('open');
    }
  }

  $triggerBtn.addEventListener('click', () => togglePanel());
  $closeBtn.addEventListener('click', () => togglePanel(false));

  $minBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    $panel.classList.toggle('minimized', isMinimized);
    $minBtn.textContent = isMinimized ? '□' : '–';
  });

  $clearBtn.addEventListener('click', () => {
    $messages.innerHTML = `
      <div class="msg-row ai">
        <div class="msg-bubble">Conversation cleared. Ask any question, hit <b>Alt+S</b> for snap, or <b>Alt+X</b> for area crop!</div>
      </div>
    `;
    messages = [];
  });

  // Keyboard Shortcuts: Alt+A, Alt+S, Alt+X, Alt+U, Alt+T, Alt+C
  window.addEventListener('keydown', (e) => {
    const isAltA = (e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'));
    const isAltS = (e.altKey && (e.key === 's' || e.key === 'S')) || (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S'));
    const isAltX = (e.altKey && (e.key === 'x' || e.key === 'X')) || (e.ctrlKey && e.shiftKey && (e.key === 'x' || e.key === 'X'));
    const isAltU = (e.altKey && (e.key === 'u' || e.key === 'U')) || (e.ctrlKey && e.shiftKey && (e.key === 'u' || e.key === 'U'));
    const isAltT = (e.altKey && (e.key === 't' || e.key === 'T')) || (e.ctrlKey && e.shiftKey && (e.key === 't' || e.key === 'T'));
    const isAltC = (e.altKey && (e.key === 'c' || e.key === 'C')) && !e.ctrlKey;

    if (isAltA) {
      e.preventDefault();
      togglePanel();
    } else if (isAltS) {
      e.preventDefault();
      takeSilentSnap();
    } else if (isAltX) {
      e.preventDefault();
      startAreaSnip();
    } else if (isAltU) {
      e.preventDefault();
      forceUnlockCopy();
    } else if (isAltT) {
      e.preventDefault();
      startTextPicker();
    } else if (isAltC) {
      e.preventDefault();
      askSelected();
    }
  });

  // ── 16. Textarea & Sending Event Isolation (LMS anti-cheat cannot block) ───
  // Stop keydown, keyup, paste from bubbling to LMS page listeners — capture phase!
  $panel.addEventListener('keydown',  (e) => { e.stopPropagation(); }, true);
  $panel.addEventListener('keyup',    (e) => { e.stopPropagation(); }, true);
  $panel.addEventListener('keypress', (e) => { e.stopPropagation(); }, true);
  $panel.addEventListener('paste',    (e) => { e.stopPropagation(); }, true);

  // ── CLIPBOARD PASTE FIX for LMS portals that block Ctrl+V ─────────────────
  // When user presses Ctrl+V inside the textarea, read clipboard directly via
  // navigator.clipboard API (extension has clipboardRead permission) and insert
  // the text manually — this bypasses ALL LMS paste event blockers.
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const start = $textarea.selectionStart;
      const end   = $textarea.selectionEnd;
      const before = $textarea.value.substring(0, start);
      const after  = $textarea.value.substring(end);
      $textarea.value = before + text + after;
      $textarea.selectionStart = $textarea.selectionEnd = start + text.length;
      $textarea.style.height = 'auto';
      $textarea.style.height = Math.min($textarea.scrollHeight, 84) + 'px';
      updateSendBtnState();
      showToast('📋 Pasted!', 1000);
    } catch (err) {
      // Clipboard API failed — show a helpful fallback toast
      showToast('⚠️ Paste blocked by browser. Use the 📋 Paste button.', 3000);
    }
  }

  // Intercept Ctrl+V / Cmd+V on the textarea before LMS can block it
  $textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      e.stopPropagation();
      pasteFromClipboard();
    }
  }, true);

  // Also handle the native paste event — stopPropagation so LMS can't cancel it
  $textarea.addEventListener('paste', (e) => {
    e.stopPropagation();
    setTimeout(updateSendBtnState, 30);
  }, true);

  function updateSendBtnState() {
    const hasContent = !!$textarea.value.trim() || !!attachedImageB64;
    $sendBtn.disabled = isLoading || !hasContent;
    $sendBtn.style.opacity = (isLoading || !hasContent) ? '0.35' : '1';
    $sendBtn.style.cursor = (isLoading || !hasContent) ? 'not-allowed' : 'pointer';
  }

  $textarea.addEventListener('input', () => {
    $textarea.style.height = 'auto';
    $textarea.style.height = Math.min($textarea.scrollHeight, 84) + 'px';
    updateSendBtnState();
  });
  $textarea.addEventListener('keyup', updateSendBtnState);
  $textarea.addEventListener('paste', () => setTimeout(updateSendBtnState, 30));
  $textarea.addEventListener('change', updateSendBtnState);

  $textarea.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if ((e.key === 'Enter' && !e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
      e.preventDefault();
      sendMessage();
    }
  });

  $sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  });

  // Paste button — clipboard read that bypasses LMS paste blockers
  if ($pasteBtn) {
    $pasteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pasteFromClipboard();
      $textarea.focus();
    });
  }

  // ── 17. Markdown & Custom Card Renderer ────────────────────────────────────
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderContentMarkdown(rawText) {
    const deanRegex = /\[DEAN_CARD\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([\s\S]+?)\]/g;
    let processed = rawText.replace(deanRegex, (_, name, role, img, info) => {
      const fullImg = img.startsWith('http') ? img : `https://arc-ai-l0x5.onrender.com${img}`;
      const cleanInfo = info.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>').trim();
      return `###DEAN_START###${escapeHtml(name)}|${escapeHtml(role)}|${fullImg}|${cleanInfo}###DEAN_END###`;
    });

    let html = escapeHtml(processed);

    html = html.replace(/###DEAN_START###([^\|]+)\|([^\|]+)\|([^\|]+)\|([\s\S]+?)###DEAN_END###/g,
      (_, name, role, img, info) => `
        <div class="dean-card">
          <div class="dean-card-header">
            <img src="${img}" alt="${name}" class="dean-card-img" onerror="this.style.display='none'" />
            <div>
              <div class="dean-card-name">${name}</div>
              <div class="dean-card-role">${role}</div>
            </div>
          </div>
          <div class="dean-card-info">${info}</div>
        </div>
      `
    );

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
      const fullUrl = url.startsWith('/') ? `https://arc-ai-l0x5.onrender.com${url}` : url;
      return `<a href="${fullUrl}" target="_blank"><img src="${fullUrl}" alt="${alt}" class="md-img" /></a>`;
    });

    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, code) =>
      `<pre><code>${code.trim()}</code></pre>`
    );
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^[*\-] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/\n/g, '<br/>');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  function appendMsgRow(role, text, imageB64) {
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (imageB64) {
      const imgEl = document.createElement('img');
      imgEl.src = imageB64;
      imgEl.className = 'md-img';
      imgEl.style.maxHeight = '140px';
      bubble.appendChild(imgEl);
    }

    if (role === 'ai') {
      bubble.innerHTML += renderContentMarkdown(text);
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-copy';
      copyBtn.innerHTML = '📋 Copy';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
      };
      bubble.appendChild(copyBtn);
    } else {
      const txtSpan = document.createElement('div');
      txtSpan.textContent = text;
      bubble.appendChild(txtSpan);
    }

    row.appendChild(bubble);
    $messages.appendChild(row);
    $messages.scrollTop = $messages.scrollHeight;
    return { row, bubble };
  }

  // ── 18. Resilient Message Sending (Port with Direct Fetch Fallback) ─────────
  let streamWatchdog = null;

  async function sendDirectToBackend(payload, aiBubble) {
    const candidates = ['https://arc-ai-l0x5.onrender.com'];
    let fullText = '';

    for (const base of candidates) {
      try {
        const resp = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000)
        });

        if (!resp.ok) continue;

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.trim());

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') {
              finishDirect(fullText, aiBubble);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                aiBubble.innerHTML = renderContentMarkdown(fullText);
                $messages.scrollTop = $messages.scrollHeight;
              }
            } catch (_) {}
          }
        }

        finishDirect(fullText, aiBubble);
        return;
      } catch (_) {}
    }

    aiBubble.innerHTML = `<span style="color:#f87171;">⚠️ Arc AI backend is temporarily unreachable. The Render server may be waking up — please wait 20–30 seconds and try again.</span>`;
    cleanupStream();
  }

  function finishDirect(full, aiBubble) {
    const cleanFull = full || '(no response)';
    aiBubble.innerHTML = renderContentMarkdown(cleanFull);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(cleanFull);
      copyBtn.textContent = '✓ Copied';
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
    };
    aiBubble.appendChild(copyBtn);

    messages.push({ role: 'assistant', content: cleanFull });
    cleanupStream();
  }

  function sendMessage() {
    const text = $textarea.value.trim();
    const currentImg = attachedImageB64;
    if ((!text && !currentImg) || isLoading) return;

    $textarea.value = '';
    $textarea.style.height = 'auto';
    isLoading = true;
    updateSendBtnState();

    $sendBtn.style.display = 'none';
    $stopBtn.style.display = 'flex';

    // Reset attachment bar
    attachedImageB64 = null;
    $attachBar.style.display = 'none';
    $thumb.src = '';

    // Add user message to UI & history
    const userPrompt = text || 'Analyze this question, give the correct option/answer, and explain clearly.';
    const userPayload = currentImg
      ? { role: 'user', content: [{ type: 'text', text: userPrompt }, { type: 'image_url', image_url: { url: currentImg } }] }
      : { role: 'user', content: userPrompt };

    messages.push(userPayload);
    appendMsgRow('user', userPrompt, currentImg);

    // Add streaming AI message bubble
    const { row: aiRow, bubble: aiBubble } = appendMsgRow('ai', '…');

    const chatPayload = {
      action: 'chat',
      model: currentImg ? 'gemini-1-5' : ($modelSelect.value || currentModel),
      hasImage: !!currentImg,
      messages: messages.slice(-12),
      stream: true,
    };

    let receivedAnyData = false;

    // Safety watchdog: Prevent indefinite stuck in loading state
    if (streamWatchdog) clearTimeout(streamWatchdog);
    streamWatchdog = setTimeout(() => {
      if (isLoading && !receivedAnyData) {
        console.warn('[Arc AI] Stream request watchdog fired. Recovering UI...');
        aiBubble.innerHTML = `<span style="color:#f87171;">⚠️ Response taking longer than expected. Please retry.</span>`;
        cleanupStream();
      }
    }, 15000);

    try {
      // Check extension context is still valid before connecting
      if (!chrome.runtime?.id) {
        console.warn('[Arc AI] Extension context invalidated. Falling back to direct fetch.');
        sendDirectToBackend(chatPayload, aiBubble);
        return;
      }
      activePort = chrome.runtime.connect({ name: 'arc_ai_stream' });

      activePort.onMessage.addListener((msg) => {
        if (msg.type === 'heartbeat') return;

        if (streamWatchdog) {
          clearTimeout(streamWatchdog);
          streamWatchdog = null;
        }

        if (msg.type === 'chunk') {
          receivedAnyData = true;
          aiBubble.innerHTML = renderContentMarkdown(msg.fullText);
          $messages.scrollTop = $messages.scrollHeight;
        } else if (msg.type === 'done') {
          receivedAnyData = true;
          const full = msg.fullText || '(no response)';
          aiBubble.innerHTML = renderContentMarkdown(full);

          const copyBtn = document.createElement('button');
          copyBtn.className = 'btn-copy';
          copyBtn.innerHTML = '📋 Copy';
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(full);
            copyBtn.textContent = '✓ Copied';
            setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
          };
          aiBubble.appendChild(copyBtn);

          messages.push({ role: 'assistant', content: full });
          cleanupStream();
        } else if (msg.type === 'error') {
          receivedAnyData = true;
          aiBubble.innerHTML = `<span style="color:#f87171;">⚠️ ${escapeHtml(msg.error)}</span>`;
          cleanupStream();
        } else if (msg.type === 'stopped') {
          aiBubble.innerHTML += ` <em>(stopped)</em>`;
          cleanupStream();
        }
      });

      activePort.onDisconnect.addListener(() => {
        const _lastErr = chrome.runtime.lastError; // Consume lastError to prevent Chrome console warning
        if (streamWatchdog) {
          clearTimeout(streamWatchdog);
          streamWatchdog = null;
        }
        if (!receivedAnyData) {
          // Extension port failed or background service worker slept -> fallback to direct fetch!
          console.log('[Arc AI] Port disconnected. Falling back to direct Render backend fetch...');
          sendDirectToBackend(chatPayload, aiBubble);
        } else {
          cleanupStream();
        }
      });

      $stopBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (activePort) {
          try { activePort.postMessage({ action: 'stop' }); } catch(_) {}
        }
        if (aiBubble) {
          if (aiBubble.innerHTML.includes('…')) {
            aiBubble.innerHTML = `<em>(Stopped by user)</em>`;
          } else {
            aiBubble.innerHTML += ` <em>(stopped)</em>`;
          }
        }
        cleanupStream();
      };

      activePort.postMessage(chatPayload);
    } catch (connectErr) {
      if (!connectErr.message?.includes('Extension context invalidated')) {
        console.warn('[Arc AI] Port connect error, falling back to direct fetch:', connectErr);
      }
      sendDirectToBackend(chatPayload, aiBubble);
    }
  }

  function cleanupStream() {
    if (streamWatchdog) {
      clearTimeout(streamWatchdog);
      streamWatchdog = null;
    }
    isLoading = false;
    $sendBtn.style.display = 'flex';
    $stopBtn.style.display = 'none';
    updateSendBtnState();
    if (activePort) {
      try { activePort.disconnect(); } catch (_) {}
      activePort = null;
    }
  }

  // ── 19. Health Check & Listeners ────────────────────────────────────────────
  async function checkHealth() {
    // Only check Render backend — no localhost spam
    try {
      const res = await fetch('https://arc-ai-l0x5.onrender.com/api/health', { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        setHealthStatus(true);
        return;
      }
    } catch (_) {}

    // Safe fallback via extension runtime (only if runtime context is active)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({ action: 'checkHealth' }, (res) => {
          const _err = chrome.runtime.lastError;
          setHealthStatus(!!res?.online);
        });
      } catch (_) {
        setHealthStatus(false);
      }
    } else {
      setHealthStatus(false);
    }
  }

  function setHealthStatus(isOnline) {
    backendOnline = isOnline;
    if ($onlineDot) {
      $onlineDot.style.background = backendOnline ? '#10b981' : '#ef4444';
      $onlineDot.style.boxShadow = backendOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444';
    }
  }

  checkHealth();
  setInterval(checkHealth, 10000);

  // Listen for trigger from PrintScreen in stealth shield
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'ARC_TRIGGER_SILENT_SNAP') {
      takeSilentSnap();
    }
  });

  // Initial attachment
  attachToTopLayer();
})();
