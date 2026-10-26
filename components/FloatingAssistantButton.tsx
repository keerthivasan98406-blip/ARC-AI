import React, {
  useState, useEffect, useRef, useCallback,
  KeyboardEvent, ClipboardEvent, DragEvent,
} from 'react';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { chatWithArcAi } from '../services/geminiService';
import { ModelEngine, ChatHistoryItem } from '../types';

// ── constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'arc_ai_floating_chat';
const POS_KEY     = 'arc_ai_floating_pos';
const TEXT_MODEL: ModelEngine   = 'claude-3-5';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const PANEL_W = 380;
const PANEL_H = 560;
const PANEL_H_MIN = 48;

// ── types ────────────────────────────────────────────────────────────────────
interface FloatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  imageBase64?: string;
  ts: number;
}

// Position stored as top-left pixel coords
interface Pos { x: number; y: number; }

// ── persistence helpers ──────────────────────────────────────────────────────
function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultPos(): Pos {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const w = Math.min(PANEL_W, window.innerWidth - 16);
  const h = Math.min(PANEL_H, window.innerHeight - 16);
  const x = Math.max(8, window.innerWidth - w - 16);
  const y = Math.max(8, window.innerHeight - h - 16);
  return { x, y };
}

function loadPos(): Pos {
  try {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return defaultPos();
    const saved = JSON.parse(raw) as Pos;
    const w = Math.min(PANEL_W, window.innerWidth - 16);
    // Clamp so it's never off-screen
    const x = Math.min(Math.max(8, saved.x), window.innerWidth - w - 8);
    const y = Math.min(Math.max(8, saved.y), window.innerHeight - PANEL_H_MIN - 8);
    return { x, y };
  } catch { return defaultPos(); }
}

function savePos(p: Pos) {
  try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (_) {}
}

function loadMessages(): FloatMsg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FloatMsg[]) : [];
  } catch { return []; }
}

function saveMessages(msgs: FloatMsg[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch (_) {}
}

// ── sub-components ───────────────────────────────────────────────────────────
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-white/10">
        <span className="text-[10px] font-mono text-slate-400">{language || 'code'}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <i className={`fas ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto bg-slate-950/70 text-xs text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderDeanCard = (content: string) => {
  const deanCardRegex = /\[DEAN_CARD\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([\s\S]+?)\]/g;
  const cards: React.ReactNode[] = [];
  let m: RegExpExecArray | null;

  while ((m = deanCardRegex.exec(content)) !== null) {
    const [, name, role, image, info] = m;
    const cleanInfo = info.replace(/\\n/g, '\n').trim();
    const lines = cleanInfo.split('\n').map((l) => l.trim()).filter(Boolean);

    cards.push(
      <div key={m.index} className="my-2 rounded-xl border border-cyan-500/25 bg-slate-900/95 shadow-md overflow-hidden w-full">
        {/* Header: Photo + Name & Role */}
        <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-transparent border-b border-cyan-500/20">
          <div className="shrink-0 relative">
            <img
              src={image}
              alt={name}
              className="w-12 h-14 object-cover rounded-lg border border-cyan-400/40 shadow-sm bg-slate-950"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-cyan-300 leading-snug">{name}</div>
            <div className="text-[10px] font-semibold text-purple-300 mt-0.5 leading-snug break-words">{role}</div>
            <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] text-cyan-400 font-mono">
              <i className="fas fa-university text-[8px]" />
              <span>Takshashila University</span>
            </div>
          </div>
        </div>

        {/* Info: Full-width Details / Bullet Points */}
        <div className="p-2.5 space-y-1.5 text-[10px] text-slate-300">
          {lines.map((line, idx) => {
            const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
            const text = isBullet ? line.replace(/^[•\-\*]\s*/, '') : line;
            return (
              <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                {isBullet && <span className="text-cyan-400 mt-0.5 text-[9px] shrink-0 select-none">✦</span>}
                <span className="flex-1 text-slate-200">{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (cards.length === 0) return null;
  return <>{cards}</>;
};

const MsgBubble: React.FC<{ msg: FloatMsg }> = ({ msg }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const deanCards = !isUser ? renderDeanCard(msg.text) : null;
  const remainingText = !isUser ? msg.text.replace(/\[DEAN_CARD\|[\s\S]+?\]/g, '').trim() : msg.text;

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold
        ${isUser
          ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
          : 'bg-slate-800 border border-cyan-500/30 text-cyan-300'}`}>
        <i className={`fas ${isUser ? 'fa-user' : 'fa-robot'} text-[10px]`} />
      </div>
      <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.imageBase64 && (
          <img src={msg.imageBase64} alt="attached"
            className="max-h-36 rounded-xl border border-cyan-500/30 object-contain" />
        )}
        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words
          ${isUser
            ? 'bg-gradient-to-br from-purple-600/50 to-cyan-600/30 border border-purple-500/30 text-white rounded-tr-none'
            : 'bg-slate-800/80 border border-white/10 text-slate-100 rounded-tl-none'}`}>
          {isUser
            ? <span className="whitespace-pre-wrap">{msg.text}</span>
            : (
              <>
                {deanCards}
                {remainingText && (
                  <ReactMarkdown components={{
                    code({ className, children }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeStr = String(children).replace(/\n$/, '');
                      if (codeStr.includes('\n') || match) {
                        return <CodeBlock code={codeStr} language={match?.[1]} />;
                      }
                      return <code className="px-1 py-0.5 rounded bg-slate-700 text-cyan-300 font-mono text-[11px]">{children}</code>;
                    },
                    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-1.5">{children}</ol>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300">{children}</a>
                    ),
                  }}>
                    {remainingText}
                  </ReactMarkdown>
                )}
              </>
            )}
        </div>
        {!isUser && (
          <button
            onClick={() => { navigator.clipboard.writeText(msg.text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors ml-1"
          >
            <i className={`fas ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
};

const TypingDots: React.FC = () => (
  <div className="flex gap-1.5 px-3 py-2.5 rounded-2xl rounded-tl-none bg-slate-800/80 border border-white/10 w-fit">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
        style={{ animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
    ))}
  </div>
);

// ── main component ───────────────────────────────────────────────────────────
export const FloatingAssistantButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [panelOpen, setPanelOpen]   = useState(false);
  const [minimized, setMinimized]   = useState(false);
  const [messages, setMessages]     = useState<FloatMsg[]>(() => loadMessages());
  const [input, setInput]           = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pos, setPos]               = useState<Pos>(defaultPos);
  const [portalTarget, setPortalTarget] = useState<Element | null>(() => typeof document !== 'undefined' ? document.body : null);

  const abortRef      = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const dragRef       = useRef({ active: false, startMouseX: 0, startMouseY: 0, startPanelX: 0, startPanelY: 0 });

  // Update portal target whenever entering/exiting fullscreen
  useEffect(() => {
    const updateTarget = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setPortalTarget(fsEl || document.body);
    };
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
      document.addEventListener(evt, updateTarget);
    });
    return () => {
      ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
        document.removeEventListener(evt, updateTarget);
      });
    };
  }, []);

  // persist messages
  useEffect(() => { saveMessages(messages); }, [messages]);

  // persist position
  useEffect(() => { savePos(pos); }, [pos]);

  // Load correct position on mount (after window dimensions are known)
  useEffect(() => { setPos(loadPos()); }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isLoading]);

  // Clamp panel to viewport on window resize
  useEffect(() => {
    const onResize = () => {
      setPos(p => ({
        x: Math.min(p.x, window.innerWidth  - PANEL_W),
        y: Math.min(p.y, window.innerHeight - PANEL_H_MIN),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Alt + A global shortcut to toggle floating assistant
  useEffect(() => {
    const handleGlobalKey = (e: globalThis.KeyboardEvent) => {
      const isAltA = (e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'));
      if (isAltA) {
        e.preventDefault();
        setPanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Global drag listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startMouseX;
      const dy = e.clientY - dragRef.current.startMouseY;
      const newX = Math.min(Math.max(0, dragRef.current.startPanelX + dx), window.innerWidth  - PANEL_W);
      const newY = Math.min(Math.max(0, dragRef.current.startPanelY + dy), window.innerHeight - PANEL_H_MIN);
      setPos({ x: newX, y: newY });
    };
    const onUp = () => { dragRef.current.active = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const onTitleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = { active: true, startMouseX: e.clientX, startMouseY: e.clientY, startPanelX: pos.x, startPanelY: pos.y };
    e.preventDefault();
  };

  // Image helpers
  const processImageFile = useCallback((file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) { setImageError('Only PNG, JPG, WEBP images are supported.'); return; }
    if (file.size > MAX_IMAGE_BYTES)      { setImageError('Image must be under 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => setAttachedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) { processImageFile(f); break; }
      }
    }
  }, [processImageFile]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processImageFile(f);
  }, [processImageFile]);

  // Send message
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !attachedImage) return;
    if (isLoading) return;

    const userMsg: FloatMsg = { id: makeId(), role: 'user', text: text || '(image)', imageBase64: attachedImage ?? undefined, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setImageError(null);
    setIsLoading(true);
    setStreamingText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const history: ChatHistoryItem[] = messages
      .filter(m => m.text && !m.text.startsWith('⚠️') && !m.text.includes('Backend Error'))
      .slice(-12)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    abortRef.current = new AbortController();
    let finalText = '';

    try {
      const result = await chatWithArcAi(
        text || 'Analyze this image.',
        history,
        (chunk: string) => { finalText = chunk; setStreamingText(chunk); },
        attachedImage ?? undefined,
        TEXT_MODEL,
        false
      );
      finalText = result.text;
    } catch (err: unknown) {
      finalText = (err as Error)?.name === 'AbortError'
        ? (finalText || '*(stopped)*')
        : `⚠️ **Error**: ${(err as Error)?.message ?? 'Unknown error'}`;
    }

    setMessages(prev => [...prev, { id: makeId(), role: 'ai', text: finalText, ts: Date.now() }]);
    setIsLoading(false);
    setStreamingText('');
    abortRef.current = null;
  }, [input, attachedImage, isLoading, messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Enter' && !e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]); setStreamingText(''); setIsLoading(false); abortRef.current?.abort();
  };

  // Panel open: reset to default position so it always starts visible
  const handleOpenPanel = () => {
    if (!panelOpen) {
      const fresh = defaultPos();
      setPos(fresh);
      setMinimized(false);
    }
    setPanelOpen(v => !v);
  };

  const panelJSX = panelOpen ? (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: typeof window !== 'undefined' ? `${Math.min(PANEL_W, window.innerWidth - 16)}px` : `${PANEL_W}px`,
        maxWidth: 'calc(100vw - 16px)',
        height: minimized ? `${PANEL_H_MIN}px` : `${PANEL_H}px`,
        zIndex: 2147483647,
        background: 'rgba(11,16,30,0.97)',
        border: isDragOver ? '1.5px solid rgba(34,211,238,0.7)' : '1.5px solid rgba(139,92,246,0.45)',
        borderRadius: '16px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 40px rgba(124,58,237,0.18)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px)',
        transition: 'height 0.22s ease, border-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Title bar */}
      <div
        onMouseDown={onTitleMouseDown}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', flexShrink: 0,
          background: 'rgba(15,20,40,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          cursor: 'grab',
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10,
        }}>
          <i className="fas fa-robot" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Arc AI Assistant</p>
        </div>

        {/* Web mode badge */}
        <span style={{
          padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700,
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d',
          whiteSpace: 'nowrap',
        }}>
          <i className="fas fa-globe" style={{ marginRight: 3, fontSize: 8 }} />
          Web Mode
        </span>

        {/* Clear */}
        <button title="Clear chat" onClick={handleClearChat} style={iconBtnStyle}>
          <i className="fas fa-trash-alt" style={{ fontSize: 9, color: '#94a3b8' }} />
        </button>

        {/* Minimize */}
        <button title={minimized ? 'Restore' : 'Minimize'} onClick={() => setMinimized(v => !v)} style={iconBtnStyle}>
          <i className={`fas ${minimized ? 'fa-window-maximize' : 'fa-window-minimize'}`} style={{ fontSize: 9, color: '#94a3b8' }} />
        </button>

        {/* Close */}
        <button title="Close" onClick={() => setPanelOpen(false)} style={iconBtnStyle}>
          <i className="fas fa-times" style={{ fontSize: 9, color: '#94a3b8' }} />
        </button>
      </div>

      {!minimized && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, userSelect: 'text' }}>
          {/* Notice */}
          <div style={{
            padding: '5px 12px', fontSize: 10, color: 'rgba(253,230,138,0.8)',
            background: 'rgba(245,158,11,0.07)', borderBottom: '1px solid rgba(245,158,11,0.12)',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            <i className="fas fa-info-circle" style={{ color: '#f59e0b', fontSize: 10, flexShrink: 0 }} />
            <span>
              <b>Web Mode</b> — stays on this tab only.&nbsp;
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                Install the <b>Arc AI Chrome Extension</b> (in the <code>extension/</code> folder) for cross-tab access.
              </span>
            </span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.length === 0 && !isLoading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 0', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-robot" style={{ color: '#a78bfa', fontSize: 18 }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#fff' }}>Arc AI Floating Assistant</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Ask anything or attach an image.</p>
                </div>
              </div>
            )}

            {messages.map(msg => <MsgBubble key={msg.id} msg={msg} />)}

            {isLoading && streamingText && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#67e8f9' }}>
                  <i className="fas fa-robot" />
                </div>
                <div style={{ maxWidth: '82%', padding: '8px 12px', borderRadius: '16px 16px 16px 0', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#e2e8f0', lineHeight: 1.6 }}>
                  {renderDeanCard(streamingText) || <ReactMarkdown>{streamingText}</ReactMarkdown>}
                </div>
              </div>
            )}

            {isLoading && !streamingText && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#67e8f9' }}>
                  <i className="fas fa-robot" />
                </div>
                <TypingDots />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image preview */}
          {attachedImage && (
            <div style={{ padding: '0 12px 6px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <img src={attachedImage} alt="preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(6,182,212,0.35)' }} />
                <button
                  onClick={() => { setAttachedImage(null); setImageError(null); }}
                  style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <span style={{ fontSize: 10, color: '#67e8f9' }}>Image attached — Gemini vision</span>
            </div>
          )}

          {imageError && (
            <div style={{ margin: '0 12px 6px', padding: '6px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, color: '#fca5a5', flexShrink: 0 }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: 5 }} />{imageError}
            </div>
          )}

          {isDragOver && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,182,212,0.08)', border: '2px dashed rgba(6,182,212,0.5)', borderRadius: 14, pointerEvents: 'none' }}>
              <p style={{ fontSize: 12, color: '#67e8f9', fontWeight: 700 }}>Drop image here</p>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '8px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: 'rgba(11,16,30,0.98)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '6px 8px', borderRadius: 12, border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(15,20,40,0.9)' }}>
              {/* Paperclip */}
              <button type="button" onClick={() => fileInputRef.current?.click()} title="Attach image"
                style={{ ...iconBtnStyle, alignSelf: 'flex-end', marginBottom: 2, color: '#94a3b8' }}>
                <i className="fas fa-paperclip" style={{ fontSize: 12 }} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) processImageFile(f); e.target.value = ''; }} />

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isLoading}
                placeholder="Ask anything… (Enter to send)"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#f8fafc', resize: 'none', overflowY: 'auto', lineHeight: 1.5, maxHeight: 96, padding: '4px 0' }}
              />

              {isLoading
                ? (
                  <button type="button" onClick={() => abortRef.current?.abort()} title="Stop"
                    style={{ ...iconBtnStyle, alignSelf: 'flex-end', marginBottom: 2, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
                    <i className="fas fa-stop" style={{ fontSize: 10 }} />
                  </button>
                )
                : (
                  <button type="button" onClick={handleSend} disabled={!input.trim() && !attachedImage} title="Send"
                    style={{ ...iconBtnStyle, alignSelf: 'flex-end', marginBottom: 2, background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: '#fff', opacity: (!input.trim() && !attachedImage) ? 0.4 : 1 }}>
                    <i className="fas fa-arrow-up" style={{ fontSize: 11 }} />
                  </button>
                )
              }
            </div>
            <p style={{ textAlign: 'center', fontSize: 9, color: '#334155', margin: '5px 0 0' }}>
              Shift+Enter for new line · Paste or drop images
            </p>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {/* Floating Trigger Circle Button — bottom-right via Portal */}
      {!panelOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          id="arc-trigger-btn"
          role="button"
          tabIndex={0}
          onClick={handleOpenPanel}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenPanel(); }}
          title="Arc AI Assistant (Alt+A)"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(124, 58, 237, 0.5)',
            color: '#ffffff',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            zIndex: 2147483646,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.7), 0 0 32px rgba(6,182,212,0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(124,58,237,0.5)';
          }}
        >
          🤖
          <div
            id="arc-online-dot"
            style={{
              position: 'absolute',
              top: 3,
              right: 3,
              width: 12,
              height: 12,
              background: '#10b981',
              border: '2px solid #0f172a',
              borderRadius: '50%',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>,
        portalTarget || document.body
      )}

      {/* Portal — renders into document.fullscreenElement when in fullscreen, or document.body */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(panelJSX, portalTarget || document.body)}
    </>
  );
};

// ── shared inline button style ────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'background 0.15s',
  color: '#94a3b8',
};
