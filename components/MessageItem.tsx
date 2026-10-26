import React, { useState } from 'react';
import { Message, MessageRole } from '../types';
import { ArcLogo } from './ArcLogo';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: Message;
  onCopy?: (text: string) => void;
  onSpeak?: (text: string) => void;
  onRegenerate?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onVisualizeCode?: (code: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onCopy,
  onSpeak,
  onRegenerate,
  onDelete,
  onEdit,
  onVisualizeCode,
}) => {
  const isUser = message.role === MessageRole.USER;
  const isStreaming = message.isStreaming;
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  // Mutable counter for assigning stable indexes to code blocks during render
  const codeIndexRef = React.useRef(0);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    if (onCopy) onCopy(message.content);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleSaveEdit = () => {
    if (onEdit && editText.trim()) {
      onEdit(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  const formatInfoText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderSingleDeanCard = (
    key: string | number,
    name: string,
    role: string,
    image: string,
    info: string
  ) => {
    const cleanInfo = info.replace(/\\n/g, '\n').trim();
    const lines = cleanInfo.split('\n').map((l) => l.trim()).filter(Boolean);

    return (
      <div
        key={key}
        className="my-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-[#070b14]/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden w-full"
      >
        {/* Header: Photo + Name + Role */}
        <div className="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-transparent border-b border-cyan-500/20">
          <div className="shrink-0 relative">
            <img
              src={image}
              alt={name}
              className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 object-cover rounded-xl border-2 border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.35)] bg-slate-950"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-sm"
              title="Takshashila University Faculty"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm sm:text-base md:text-lg font-extrabold text-cyan-300 font-display tracking-tight leading-snug">
              {name}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-purple-300 mt-1 leading-snug break-words">
              {role}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-mono">
              <i className="fas fa-university text-[9px]" />
              <span>Takshashila University</span>
            </div>
          </div>
        </div>

        {/* Body: Full-width Details / Bullet Points */}
        <div className="p-3.5 sm:p-4 space-y-2 text-xs sm:text-sm text-slate-200">
          {lines.map((line, idx) => {
            const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
            const text = isBullet ? line.replace(/^[•\-\*]\s*/, '') : line;
            return (
              <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                {isBullet ? (
                  <span className="text-cyan-400 mt-0.5 text-[11px] shrink-0 select-none">✦</span>
                ) : null}
                <span className="flex-1 text-slate-200">{formatInfoText(text)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMarkdownContent = (markdownText: string) => {
    // Reset code block index counter each render
    codeIndexRef.current = 0;

    return (
      <ReactMarkdown
        components={{
          // Code blocks with copy button and Visualize Flow
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');
            const isBlock = code.includes('\n') || !!match;

            if (!isBlock) {
              return (
                <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            }

            const currentIndex = codeIndexRef.current++;
            return (
              <div className="my-3 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-xl font-mono">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/[0.08] text-xs">
                  <span className="text-cyan-400 font-bold uppercase tracking-widest text-[11px]">
                    <i className="fas fa-code mr-1.5" />
                    {language || 'code'}
                  </span>
                  <div className="flex items-center gap-2">
                    {onVisualizeCode && (
                      <button
                        onClick={() => onVisualizeCode(code)}
                        className="px-2 py-1 rounded glass-button text-purple-300 border border-purple-500/30 transition-colors duration-300 text-[11px] flex items-center gap-1.5 font-sans"
                      >
                        <i className="fas fa-project-diagram text-cyan-300" />
                        <span>Visualize Flow</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyCode(code, currentIndex)}
                      className="px-2.5 py-1 rounded glass-button text-slate-300 hover:text-cyan-300 transition-colors duration-300 text-[11px] flex items-center gap-1.5"
                    >
                      <i className={`fas ${copiedCodeIndex === currentIndex ? 'fa-check text-emerald-400' : 'fa-copy'}`} />
                      {copiedCodeIndex === currentIndex ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
                <pre className="p-4 text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  <code>{code}</code>
                </pre>
              </div>
            );
          },
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2 font-display">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-1.5 font-display">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-purple-300 mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm leading-relaxed mb-2 text-slate-100">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-slate-200 pl-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-slate-200 pl-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 transition-colors">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/60 pl-4 my-2 text-slate-400 italic text-sm">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-800 text-slate-300">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-bold text-cyan-300">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-300">{children}</td>,
          hr: () => <hr className="border-white/10 my-3" />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="rounded-2xl border border-white/20 shadow-lg my-2 max-h-72 object-cover" />
          ),
        }}
      >
        {markdownText}
      </ReactMarkdown>
    );
  };

  const renderFormattedContent = (content: string) => {
    const deanCardRegex = /\[DEAN_CARD\|([^\|]+)\|([^\|]+)\|([^\|]+)\|([\s\S]+?)\]/g;

    if (!deanCardRegex.test(content)) {
      return (
        <div className={isStreaming ? 'animate-stream-reveal' : ''}>
          {renderMarkdownContent(content)}
        </div>
      );
    }

    deanCardRegex.lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = deanCardRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index).trim();
        if (textBefore) {
          elements.push(
            <div key={`text-${lastIndex}`} className="mb-2">
              {renderMarkdownContent(textBefore)}
            </div>
          );
        }
      }

      const [, name, role, image, info] = match;
      elements.push(renderSingleDeanCard(match.index, name, role, image, info));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex).trim();
      if (textAfter) {
        elements.push(
          <div key={`text-${lastIndex}`} className="mt-2">
            {renderMarkdownContent(textAfter)}
          </div>
        );
      }
    }

    return <div className={isStreaming ? 'animate-stream-reveal' : ''}>{elements}</div>;
  };

  return (
    <div
      className={`flex gap-3.5 my-4 group ${isUser ? 'justify-end' : 'justify-start'} ${isStreaming ? '' : 'animate-msg-enter'}`}
    >
      {!isUser && (
        <div className="shrink-0 mt-0.5">
          <ArcLogo size="sm" showText={false} />
        </div>
      )}

      <div className={`${isUser ? 'max-w-[85%] md:max-w-[70%]' : 'w-full max-w-[94%] sm:max-w-[85%] md:max-w-[75%]'} flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-mono">
          <span className="font-bold text-white font-display tracking-tight">
            {isUser ? 'You' : 'Arc AI'}
          </span>
          {message.modelUsed && !isUser && (
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px] uppercase tracking-wider">
              {message.modelUsed}
            </span>
          )}
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div
          className={`rounded-2xl relative shadow-lg transition-all duration-300 ${
            isUser
              ? 'btn-radiant text-white rounded-tr-none px-4 py-2.5 w-fit max-w-full'
              : 'glass-card border border-white/12 text-slate-100 rounded-tl-none p-3.5 sm:p-4 w-full'
          }`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-300 transition-colors duration-300"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded glass-button text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:bg-cyan-400 transition-colors duration-300"
                >
                  Save & Regenerate
                </button>
              </div>
            </div>
          ) : isStreaming && !message.content ? (
            /* Streaming typing indicator (three pulsing dots) */
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-stream-dot" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#C0C0C0] animate-stream-dot" style={{ animationDelay: '220ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-stream-dot" style={{ animationDelay: '440ms' }} />
            </div>
          ) : (
            <>
              {message.parts?.map((part, pIdx) => (
                <div key={pIdx} className="mb-3">
                  {part.image && (
                    <img
                      src={part.image}
                      alt="Attachment"
                      className="max-w-sm rounded-xl border border-white/20 shadow-md my-1"
                    />
                  )}
                </div>
              ))}

              {isUser ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
              ) : (
                renderFormattedContent(message.content)
              )}
            </>
          )}

          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/12 space-y-1.5">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono block">
                Citations & Web Sources:
              </span>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-500/20 border border-white/10 text-[11px] text-cyan-300 flex items-center gap-1.5 transition-colors duration-300"
                  >
                    <i className="fas fa-link text-[9px]" />
                    <span>{c.domain}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleCopyMessage}
            className="text-slate-400 hover:text-white text-xs p-1 transition-colors duration-300"
            title="Copy Message"
          >
            <i className={`fas ${copiedMessage ? 'fa-check text-emerald-400' : 'fa-copy'}`} />
          </button>

          {onSpeak && (
            <button
              onClick={() => onSpeak(message.content)}
              className="text-slate-400 hover:text-cyan-300 text-xs p-1 transition-colors duration-300"
              title="Speak Answer (Text-to-Speech)"
            >
              <i className="fas fa-volume-up" />
            </button>
          )}

          {!isUser && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-slate-400 hover:text-cyan-300 text-xs p-1 transition-colors duration-300"
              title="Regenerate Response"
            >
              <i className="fas fa-sync-alt" />
            </button>
          )}

          {isUser && onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:text-cyan-300 text-xs p-1 transition-colors duration-300"
              title="Edit Prompt"
            >
              <i className="fas fa-edit" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="text-slate-400 hover:text-red-400 text-xs p-1 transition-colors duration-300"
              title="Delete Message"
            >
              <i className="fas fa-trash-alt" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
