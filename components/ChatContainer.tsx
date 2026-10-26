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
    try { localStorage.setItem('arc_ai_notes', noteText); } catch {}
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
          </head><body>${noteText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>
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
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer border ${
                saveFormat === fmt
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
          className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            savedFlash
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
  const [headerVisible, setHeaderVisible] = useState(false);
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
      <div className={`hidden lg:block h-full transition-all duration-300 ease-in-out shrink-0 ${
        isSidebarOpen ? 'w-0 opacity-0 overflow-hidden' : 'w-60 opacity-100'
      }`}>
        {!isSidebarOpen && <NotesPanel />}
      </div>

      {/* ── Main Chat Column ── */}
      <div className="flex-1 h-full flex flex-col justify-between relative overflow-hidden min-w-0 bg-[#060913]/95">

        {/* Hover zone — invisible strip at top that reveals the header */}
        <div
          className="absolute top-0 left-0 right-0 z-30"
          style={{ height: '4px' }}
          onMouseEnter={() => setHeaderVisible(true)}
        />

        {/* Header — hidden by default, slides down on hover */}
        <header
          className="nav-running-border px-3 sm:px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-slate-950/90 backdrop-blur-xl z-20 shrink-0 absolute top-0 left-0 right-0"
          style={{
            height: 64,
            transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: headerVisible ? 'all' : 'none',
          }}
          onMouseLeave={() => setHeaderVisible(false)}
          onMouseEnter={() => setHeaderVisible(true)}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onToggleSidebar}
              className={`p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/10 text-slate-300 hover:text-white transition-all duration-300 cursor-pointer shrink-0 ${
                isSidebarOpen ? 'lg:hidden' : 'flex'
              }`}
              aria-label="Toggle sidebar navigation"
              title="Toggle sidebar navigation"
            >
              <i className="fas fa-bars text-sm" />
            </button>
            <MultiModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 glass-card px-3 py-1.5 rounded-full border border-white/10 text-xs">
              <i className="fas fa-volume-up text-purple-400 text-xs" />
              <span className="text-[10px] text-slate-400 font-mono tracking-wide">Voice Speed:</span>
              <select
                value={ttsSpeed}
                onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                className="bg-transparent text-purple-300 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="0.75" className="bg-slate-900">0.75x</option>
                <option value="1.0" className="bg-slate-900">1.0x</option>
                <option value="1.25" className="bg-slate-900">1.25x</option>
                <option value="1.5" className="bg-slate-900">1.5x</option>
                <option value="2.0" className="bg-slate-900">2.0x</option>
              </select>
            </div>

            <button
              onClick={() => onToggleWebSearch(!isWebSearchEnabled)}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all duration-300 cursor-pointer ${
                isWebSearchEnabled
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'glass-button text-slate-400 hover:text-white'
              }`}
              title="Toggle Web Search"
            >
              <i className="fas fa-globe text-xs" />
              <span className="hidden md:inline">Web Search</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isWebSearchEnabled ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-600'}`} />
            </button>

          </div>
        </header>

        {/* Main chat area — full height since header floats above */}
        <main className="relative flex-1 overflow-hidden p-3 sm:p-4 md:p-6 h-full">
          <video
            className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none opacity-25"
            autoPlay muted loop playsInline preload="auto"
          >
            <source src="/assets/infinity.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at center, rgba(8, 12, 24, 0.5) 0%, rgba(4, 6, 12, 0.75) 100%)' }}
          />
          <div className="relative z-10 h-full overflow-y-auto custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6 animate-fade-in-up">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white font-display tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] leading-tight">
                    What would you like to build today?
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-slate-300 font-light tracking-wide max-w-xl mx-auto leading-relaxed">
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
        <footer className="p-2 sm:p-4 md:p-6 shrink-0 relative z-20">
          {attachedImage && (
            <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 glass-pill px-3 py-1.5 rounded-xl border border-cyan-400/40 animate-fade-in-up shadow-lg bg-slate-900/90">
              <img src={attachedImage} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-lg border border-cyan-400/50" />
              <span className="text-xs text-cyan-300 font-semibold">Image Attached</span>
              <button onClick={() => setAttachedImage(null)} className="text-slate-400 hover:text-white text-xs ml-1 transition-colors duration-300 cursor-pointer">
                <i className="fas fa-times" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <div className="relative rounded-2xl bg-gradient-to-r from-purple-500/40 via-cyan-500/40 to-blue-500/40 p-[1.5px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus-within:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300">
              <div className="bg-[#0B101E]/95 backdrop-blur-2xl rounded-[15px] px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-button text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors duration-300 shrink-0 cursor-pointer"
                  title="Attach Image"
                >
                  <i className="fas fa-paperclip text-sm" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.txt,.md,.csv" onChange={handleImageUpload} className="hidden" />

                <button
                  type="button"
                  onClick={handleToggleVoiceSTT}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_24px_rgba(239,68,68,0.6)]' : 'glass-button text-slate-400 hover:text-purple-300'
                  }`}
                  title="Speech-to-Text"
                >
                  <i className={`fas fa-microphone text-sm ${isListening ? 'animate-bounce' : ''}`} />
                </button>

                <textarea
                  rows={1}
                  placeholder="Ask Arc AI anything... (Shift+Enter for newline)"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
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
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none px-2 font-sans resize-none overflow-y-auto leading-relaxed"
                  style={{ maxHeight: '160px' }}
                />

                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !attachedImage)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl btn-radiant text-white flex items-center justify-center transition-all duration-300 shrink-0 disabled:opacity-40 shadow-lg cursor-pointer hover:scale-105"
                  aria-label="Send message"
                >
                  <i className="fas fa-arrow-up text-sm font-bold" />
                </button>
              </div>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
};
