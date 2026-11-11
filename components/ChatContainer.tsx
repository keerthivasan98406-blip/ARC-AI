import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, MessageRole, ModelEngine } from '../types';
import { MultiModelSelector } from './MultiModelSelector';
import { MessageItem } from './MessageItem';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, imageBase64?: string) => void;
  selectedModel: ModelEngine;
  onSelectModel: (model: ModelEngine) => void;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onDeleteMessage?: (id: string) => void;
  onRegenerateLastResponse?: () => void;
  onEditMessage?: (id: string, newText: string) => void;
  onOpenCodeVisualizer?: (code?: string) => void;
}

const VISION_MODELS = new Set<ModelEngine>(['claude-3-5', 'deepseek-r1', 'llama-3-3']);

// ── Notes Panel ─────────────────────────────────────────────
const NotesPanel: React.FC = () => {
  const [noteText, setNoteText] = useState<string>(() => {
    try { return localStorage.getItem('arc_ai_notes') || ''; } catch { return ''; }
  });
  const [saveFormat, setSaveFormat] = useState<'txt' | 'md' | 'pdf'>('txt');
  const [savedFlash, setSavedFlash] = useState(false);

  // Auto-save to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('arc_ai_notes', noteText); } catch { }
  }, [noteText]);

  const handleSave = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `arc-notes-${timestamp}.${saveFormat}`;

    let content = noteText;
    let mimeType = 'text/plain';

    if (saveFormat === 'md') {
      mimeType = 'text/markdown';
    } else if (saveFormat === 'pdf') {
      // Simple HTML→PDF via print dialog
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html><head><title>Arc AI Notes</title>
          <style>body{font-family:sans-serif;padding:32px;white-space:pre-wrap;line-height:1.7;}</style>
          </head><body>${noteText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>
        `);
        win.document.close();
        win.print();
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleClear = () => {
    if (noteText && window.confirm('Clear all notes?')) setNoteText('');
  };

  const wordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;
  const charCount = noteText.length;

  return (
    <div className="flex flex-col h-full bg-[#07090f]/95 border-r border-white/10 relative overflow-hidden"
      style={{ minWidth: 0 }}>
      {/* Running border on right edge */}
      <div className="absolute right-0 top-0 w-[2px] h-full pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(139,92,246,0) 15%, rgba(139,92,246,0.9) 45%, rgba(236,72,153,1) 50%, rgba(56,189,248,0.9) 55%, rgba(56,189,248,0) 85%, transparent 100%)',
          backgroundSize: '100% 200%',
          animation: 'sidebarBorderRun 2.8s linear infinite',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
            <i className="fas fa-sticky-note text-white text-[10px]" />
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide">Quick Notes</span>
        </div>
        <button
          onClick={handleClear}
          className="text-slate-500 hover:text-red-400 text-[10px] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-500/10"
          title="Clear notes"
        >
          <i className="fas fa-trash-alt" />
        </button>
      </div>

      {/* Textarea */}
      <div className="flex-1 overflow-hidden p-3">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Jot down your thoughts, ideas, or key points here..."
          className="w-full h-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed font-sans custom-scrollbar"
          style={{ minHeight: 0 }}
          spellCheck
        />
      </div>

      {/* Stats */}
      <div className="px-4 py-1.5 border-t border-white/5 flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-slate-600 font-mono">{wordCount} words</span>
        <span className="text-[10px] text-slate-700">·</span>
        <span className="text-[10px] text-slate-600 font-mono">{charCount} chars</span>
      </div>

      {/* Save bar */}
      <div className="px-3 py-3 border-t border-white/8 shrink-0 space-y-2">
        {/* Format selector */}
        <div className="flex items-center gap-1.5">
          {(['txt', 'md', 'pdf'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSaveFormat(fmt)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer border ${saveFormat === fmt
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                }`}
            >
              .{fmt}
            </button>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!noteText.trim()}
          className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${savedFlash
              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
              : 'btn-radiant text-white'
            }`}
        >
          <i className={`fas ${savedFlash ? 'fa-check' : 'fa-download'} text-xs`} />
          <span>{savedFlash ? 'Saved!' : `Save as .${saveFormat}`}</span>
        </button>
      </div>
    </div>
  );
};

// ── Main ChatContainer ───────────────────────────────────────
export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onSendMessage,
  selectedModel,
  onSelectModel,
  isWebSearchEnabled,
  onToggleWebSearch,
  isSidebarOpen,
  onToggleSidebar,
  onDeleteMessage,
  onRegenerateLastResponse,
  onEditMessage,
  onOpenCodeVisualizer,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedImage) return;
    onSendMessage(input.trim(), attachedImage || undefined);
    setInput('');
    setAttachedImage(null);
    const textarea = document.querySelector('textarea.flex-1') as HTMLTextAreaElement;
    if (textarea) textarea.style.height = 'auto';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image to max 800px and 0.7 quality before encoding
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      setAttachedImage(compressed);
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      // Fallback: read as-is for non-image files
      const reader = new FileReader();
      reader.onload = (evt) => setAttachedImage(evt.target?.result as string);
      reader.readAsDataURL(file);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleToggleVoiceSTT = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsSpeed;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex-1 h-full flex flex-row relative overflow-hidden min-w-0">

      {/* ── Notes Panel: visible only on desktop when sidebar is hidden ── */}
      <div className={`hidden lg:block h-full transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-0 opacity-0 overflow-hidden' : 'w-60 opacity-100'
        }`}>
        {!isSidebarOpen && <NotesPanel />}
      </div>

      {/* ── Main Chat Column ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 bg-[#060913]/95" style={{ height: '100%', maxHeight: '100%' }}>

        {/* ── Redesigned Mobile Header: Premium Glassmorphic Command Bar ── */}
        <header className="mobile-header shrink-0 px-3 py-2.5 z-20 relative">
          {/* Animated gradient border bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] nav-running-border" style={{ opacity: 0.8 }} />

          <div className="flex items-center gap-2.5 max-w-full">
            {/* Rounded hamburger button */}
            <button
              onClick={onToggleSidebar}
              className="mobile-header-hamburger shrink-0"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
                <rect y="6" width="14" height="2" rx="1" fill="currentColor" />
                <rect y="12" width="10" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>

            {/* Glowing Logo + Model Selector capsule */}
            <div className="flex-1 flex items-center rounded-2xl min-w-0 overflow-hidden mobile-header-capsule">
              {/* Glowing Leonux logo */}
              <div className="flex items-center gap-2 px-3 h-10 border-r border-white/[0.08] shrink-0">
                <div className="mobile-logo-orb">
                  <img src="/arc_ai_logo.png" alt="Leonux AI" className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-extrabold text-white font-display tracking-tight hidden sm:block">
                  Leonux <span className="mobile-logo-ai-text">AI</span>
                </span>
              </div>

              {/* Model selector — fills remaining space */}
              <div className="flex-1 min-w-0 px-1">
                <MultiModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
              </div>

              {/* Globe / Language selector */}
              <button
                onClick={() => onToggleWebSearch(!isWebSearchEnabled)}
                className="mobile-header-globe shrink-0"
                title="Toggle Web Search / Language"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isWebSearchEnabled ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-600'}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Main chat area — fills all space between header and footer */}
        <main className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Background overlay */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 45%, rgba(80,30,180,0.12) 0%, rgba(4, 6, 12, 0.6) 70%)' }}
          />

          <div className="relative z-10 h-full overflow-y-auto custom-scrollbar flex flex-col" style={{ padding: '0.75rem 0.75rem 0.5rem' }}>
            {messages.length === 0 ? (
              /* ── Welcome Screen ── */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in-up" style={{ minHeight: 0 }}>
                {/* ── Infinity SVG Animation ── */}
                <div className="infinity-container" aria-hidden="true">
                  <svg
                    className="infinity-svg"
                    viewBox="0 0 500 220"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      {/* Purple-to-blue gradient for static glow */}
                      <linearGradient id="infinityGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
                        <stop offset="40%" stopColor="#A855F7" stopOpacity="1" />
                        <stop offset="70%" stopColor="#6366F1" stopOpacity="1" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
                      </linearGradient>

                      {/* Travelling light gradient */}
                      <linearGradient id="travelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                        <stop offset="40%" stopColor="#A78BFA" stopOpacity="0" />
                        <stop offset="60%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="80%" stopColor="#38BDF8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                      </linearGradient>

                      {/* Outer glow blur filter */}
                      <filter id="infinityGlow" x="-20%" y="-60%" width="140%" height="220%">
                        <feGaussianBlur stdDeviation="6" result="blur1" />
                        <feGaussianBlur stdDeviation="14" result="blur2" />
                        <feMerge>
                          <feMergeNode in="blur2" />
                          <feMergeNode in="blur1" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="travelGlow" x="-20%" y="-60%" width="140%" height="220%">
                        <feGaussianBlur stdDeviation="4" result="glow" />
                        <feMerge>
                          <feMergeNode in="glow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>

                      {/* Path for travel animation */}
                      <path
                        id="infinityPath"
                        d="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      />
                    </defs>

                    {/* Outer ambient glow layer */}
                    <path
                      d="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      stroke="rgba(120,50,220,0.35)"
                      strokeWidth="22"
                      fill="none"
                      filter="url(#infinityGlow)"
                    />

                    {/* Core infinity path — purple-to-blue gradient */}
                    <path
                      d="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      stroke="url(#infinityGrad1)"
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                      filter="url(#infinityGlow)"
                    />

                    {/* Inner sharper core */}
                    <path
                      d="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      stroke="rgba(200,160,255,0.6)"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* ── Travelling light particle 1 ── */}
                    <circle r="5" fill="#FFFFFF" filter="url(#travelGlow)" opacity="0.95">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        path="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      />
                    </circle>

                    {/* Comet tail 1 */}
                    <circle r="3.5" fill="#A78BFA" filter="url(#travelGlow)" opacity="0.8">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                        begin="-0.08s"
                        path="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      />
                    </circle>

                    <circle r="2" fill="#38BDF8" opacity="0.6">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                        begin="-0.16s"
                        path="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      />
                    </circle>

                    {/* ── Travelling light particle 2 (offset by half) ── */}
                    <circle r="4.5" fill="#38BDF8" filter="url(#travelGlow)" opacity="0.9">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                        begin="-1.75s"
                        path="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      />
                    </circle>

                    <circle r="3" fill="#C4B5FD" filter="url(#travelGlow)" opacity="0.7">
                      <animateMotion
                        dur="3.5s"
                        repeatCount="indefinite"
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                        begin="-1.83s"
                        path="M250,110 C250,60 310,30 360,55 C410,80 430,110 410,140 C390,170 350,170 310,150 C280,133 250,110 220,90 C190,70 150,50 110,65 C70,80 60,110 70,140 C80,170 120,180 160,165 C200,150 230,130 250,110 Z"
                      />
                    </circle>

                    {/* Subtle glowing particles — decorative dots */}
                    <circle cx="250" cy="110" r="2.5" fill="#A78BFA" opacity="0.5">
                      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="360" cy="55" r="2" fill="#38BDF8" opacity="0.6">
                      <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.5s" repeatCount="indefinite" begin="-0.8s" />
                    </circle>
                    <circle cx="110" cy="65" r="1.8" fill="#8B5CF6" opacity="0.5">
                      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" begin="-1.2s" />
                    </circle>
                  </svg>
                </div>

                {/* ── Welcome Text (overlaid in front of infinity) ── */}
                <div className="welcome-text-block">
                  <h1 className="welcome-heading">
                    What would you like to{' '}
                    <span className="welcome-build-word">build</span>
                    {' '}today?
                  </h1>
                  <p className="welcome-subtitle">
                    Select a flagship model above or launch one of our high-speed neural prompts below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onSpeak={handleSpeakText}
                    onDelete={onDeleteMessage}
                    onRegenerate={onRegenerateLastResponse}
                    onEdit={onEditMessage}
                    onVisualizeCode={(code) => onOpenCodeVisualizer && onOpenCodeVisualizer(code)}
                  />
                ))}
                {isLoading && (
                  <div className="my-4 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                      <span className="text-[11px] text-slate-400 font-mono tracking-widest ml-1">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Footer input */}
        <footer className="shrink-0 relative z-20 px-3 pt-2 pb-2 lg:px-6 lg:pt-4 lg:pb-4"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
        >
          {attachedImage && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-400/40 animate-fade-in-up bg-slate-900/90 backdrop-blur-sm">
              <img src={attachedImage} alt="" className="w-7 h-7 object-cover rounded-lg border border-cyan-400/50" />
              <span className="text-xs text-cyan-300 font-semibold">Image Attached</span>
              <button onClick={() => setAttachedImage(null)} className="text-slate-400 hover:text-white text-xs ml-1 transition-colors cursor-pointer">
                <i className="fas fa-times" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            {/* Neon pill input border */}
            <div className="chat-input-pill">
              <div className="chat-input-pill-inner">
                {/* Attachment icon */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="chat-input-icon-btn"
                  title="Attach file"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.txt,.md,.csv" onChange={handleImageUpload} className="hidden" />

                {/* Image icon */}
                <button
                  type="button"
                  onClick={handleToggleVoiceSTT}
                  className={`chat-input-icon-btn ${isListening ? 'chat-input-icon-btn--listening' : ''}`}
                  title="Voice input"
                >
                  {isListening ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                      <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  )}
                </button>

                {/* Message input */}
                <textarea
                  rows={1}
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading && (input.trim() || attachedImage)) {
                        onSendMessage(input.trim(), attachedImage || undefined);
                        setInput('');
                        setAttachedImage(null);
                        (e.target as HTMLTextAreaElement).style.height = 'auto';
                      }
                    }
                  }}
                  className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-slate-500 focus:outline-none px-2 font-sans resize-none overflow-y-auto leading-relaxed"
                  style={{ maxHeight: '140px', fontSize: '14px' }}
                />

                {/* Glowing send button */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !attachedImage)}
                  className="chat-send-btn"
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
};
