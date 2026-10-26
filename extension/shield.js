// Arc AI — LMS & PMS Stealth Shield (MAIN World Execution)
// Runs directly in the webpage context at document_start without violating Content Security Policy (CSP).
// Completely unblocks copying, text selection, protects fullscreen, and disables anti-cheat blur/screenshot detection.

(function () {
  if (window.__ARC_SHIELD_INSTALLED__) return;
  window.__ARC_SHIELD_INSTALLED__ = true;
  window.__ARC_SHIELD_ACTIVE__ = true;

  // A. Force CSS text selection everywhere on the LMS / portal
  function applySelectionStyles() {
    try {
      let style = document.getElementById('arc-force-copy-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'arc-force-copy-style';
        style.textContent = `
          *, *::before, *::after, html, body, div, p, span, h1, h2, h3, h4, h5, h6, table, tr, td, th, pre, code, li, a, label, form, input, textarea {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            -webkit-touch-callout: default !important;
            pointer-events: auto !important;
          }
          ::selection {
            background: rgba(56, 189, 248, 0.45) !important;
            color: inherit !important;
          }
          ::-moz-selection {
            background: rgba(56, 189, 248, 0.45) !important;
            color: inherit !important;
          }
        `;
        (document.head || document.documentElement).appendChild(style);
      }
    } catch (_) {}
  }

  applySelectionStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySelectionStyles);
  }
  setInterval(applySelectionStyles, 2000);

  // B. Clear inline event handlers that block copying & right click
  function cleanInlineLocks() {
    try {
      const lockAttrs = ['oncopy', 'oncut', 'onselectstart', 'oncontextmenu', 'ondragstart', 'onmousedown', 'onmouseup'];
      lockAttrs.forEach(attr => {
        try { document[attr] = null; } catch(_) {}
        try { window[attr] = null; } catch(_) {}
        if (document.body) {
          try { document.body[attr] = null; } catch(_) {}
        }
      });
      const blockedEls = document.querySelectorAll('[oncopy], [oncut], [onselectstart], [oncontextmenu], [unselectable]');
      blockedEls.forEach(el => {
        lockAttrs.forEach(attr => el.removeAttribute(attr));
        el.removeAttribute('unselectable');
        if (el.style) {
          el.style.userSelect = 'text';
          el.style.webkitUserSelect = 'text';
        }
      });
    } catch (_) {}
  }

  cleanInlineLocks();
  setInterval(cleanInlineLocks, 1500);

  // C. Neutralize addEventListener blocks on copy, cut, contextmenu, selectstart
  const origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (!window.__ARC_SHIELD_ACTIVE__) {
      return origAddEventListener.call(this, type, listener, options);
    }

    // Suppress anti-cheat blur/visibilitychange/focusout listeners
    if (type === 'visibilitychange' || type === 'blur' || type === 'focusout') {
      const safeListener = function(event) {
        if (window.__ARC_SHIELD_ACTIVE__) {
          event.stopImmediatePropagation();
          return;
        }
        return listener.apply(this, arguments);
      };
      return origAddEventListener.call(this, type, safeListener, options);
    }

    // Allow copy, cut, contextmenu, selectstart to proceed without preventDefault
    if (type === 'copy' || type === 'cut' || type === 'contextmenu' || type === 'selectstart' || type === 'dragstart') {
      const copySafeListener = function(event) {
        if (window.__ARC_SHIELD_ACTIVE__) {
          const origPreventDefault = event.preventDefault;
          event.preventDefault = function() {
            // Neutralize LMS preventDefault on copy/select!
          };
          const res = listener.apply(this, arguments);
          event.preventDefault = origPreventDefault;
          return res;
        }
        return listener.apply(this, arguments);
      };
      return origAddEventListener.call(this, type, copySafeListener, options);
    }

    return origAddEventListener.call(this, type, listener, options);
  };

  // D. Intercept keydown in capturing phase: Allow Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+V
  window.addEventListener('keydown', function(e) {
    if (!window.__ARC_SHIELD_ACTIVE__) return;
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const key = (e.key || '').toLowerCase();
    if (isCtrlOrMeta && (key === 'c' || key === 'a' || key === 'x' || key === 'v')) {
      // Stop LMS keydown listener from blocking copy/select shortcuts
      const origPD = e.preventDefault;
      e.preventDefault = function() {};
      setTimeout(() => { e.preventDefault = origPD; }, 10);
    }
  }, true);

  // E. Intercept PrintScreen: blind the portal, DO NOT block the screenshot!
  const interceptPrtScn = function(e) {
    if (window.__ARC_SHIELD_ACTIVE__ && (e.key === 'PrintScreen' || e.keyCode === 44)) {
      e.stopImmediatePropagation();
      // Do NOT call e.preventDefault() so OS screenshot still works!
      try {
        window.postMessage({ type: 'ARC_TRIGGER_SILENT_SNAP' }, '*');
      } catch(_) {}
    }
  };
  window.addEventListener('keydown', interceptPrtScn, true);
  window.addEventListener('keyup', interceptPrtScn, true);

  // F. Neutralize document.exitFullscreen so PMS portal cannot drop you out of fullscreen
  const origExitFullscreen = Document.prototype.exitFullscreen || document.exitFullscreen;
  Document.prototype.exitFullscreen = function() {
    if (window.__ARC_SHIELD_ACTIVE__) {
      console.warn('[Arc AI Stealth Shield] Blocked PMS portal from exiting fullscreen!');
      return Promise.resolve();
    }
    return origExitFullscreen ? origExitFullscreen.apply(this, arguments) : Promise.resolve();
  };
  if (document.exitFullscreen) {
    document.exitFullscreen = Document.prototype.exitFullscreen;
  }

  ['webkitExitFullscreen', 'webkitCancelFullScreen', 'mozCancelFullScreen', 'msExitFullscreen'].forEach(fn => {
    if (Document.prototype[fn] || document[fn]) {
      Document.prototype[fn] = function() {
        if (window.__ARC_SHIELD_ACTIVE__) {
          console.warn('[Arc AI Stealth Shield] Blocked PMS portal ' + fn + ' call!');
          return Promise.resolve();
        }
      };
      try { document[fn] = Document.prototype[fn]; } catch(_) {}
    }
  });

  // G. Spoof document.hidden & document.visibilityState to always report active/visible
  try {
    Object.defineProperty(document, 'hidden', {
      get: function() { return window.__ARC_SHIELD_ACTIVE__ ? false : false; },
      configurable: true
    });
    Object.defineProperty(document, 'visibilityState', {
      get: function() { return window.__ARC_SHIELD_ACTIVE__ ? 'visible' : 'visible'; },
      configurable: true
    });
  } catch (_) {}

  // H. Prevent anti-cheat from clearing clipboard on blur/keyup
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function(text) {
        if (window.__ARC_SHIELD_ACTIVE__ && text === '') {
          console.warn('[Arc AI Stealth Shield] Blocked portal from wiping clipboard!');
          return Promise.resolve();
        }
        return origWriteText(text);
      };
    }
  } catch (_) {}

  // I. Listen for events from Arc AI content script
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'ARC_FORCE_UNLOCK_COPY') {
      applySelectionStyles();
      cleanInlineLocks();
    }
    if (e.data && e.data.type === 'ARC_SET_SHIELD') {
      window.__ARC_SHIELD_ACTIVE__ = !!e.data.active;
    }
  });

  console.log('[Arc AI] LMS & PMS Portal Stealth Shield Active (Main World): Copy unblocked, screenshot enabled, fullscreen locked.');
})();
