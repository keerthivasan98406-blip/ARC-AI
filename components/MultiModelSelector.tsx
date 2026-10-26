import React, { useState, useRef, useEffect } from 'react';
import { ModelEngine, ModelEngineInfo } from '../types';

export const MODEL_ENGINES: ModelEngineInfo[] = [
  {
    id: 'claude-3-5',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'HYPER',
    color: 'from-purple-500 to-violet-600',
    icon: 'fa-brain',
    description: 'Industry-leading coding, natural nuance, deep document analysis & analytical synthesis.',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek V4 Pro',
    provider: 'DeepSeek',
    badge: 'REASON',
    color: 'from-emerald-400 to-teal-600',
    icon: 'fa-cube',
    description: 'Open-weights reasoning engine with step-by-step chain of thought math & code verification.',
  },
  {
    id: 'llama-3-3',
    name: 'Qwen 3.7 Max',
    provider: 'Alibaba',
    badge: 'MAX',
    color: 'from-orange-500 to-amber-600',
    icon: 'fa-cubes',
    description: 'State-of-the-art open model optimized for speed, precision, and low latency tasks.',
  },
];

interface MultiModelSelectorProps {
  selectedModel: ModelEngine;
  onSelectModel: (model: ModelEngine) => void;
}

export const MultiModelSelector: React.FC<MultiModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModelInfo = MODEL_ENGINES.find((m) => m.id === selectedModel) || MODEL_ENGINES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-pill px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2.5 hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(6,182,212,0.3)] transition-all duration-300 group cursor-pointer max-w-[150px] sm:max-w-none"
      >
        <span className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gradient-to-r ${activeModelInfo.color} animate-pulse shrink-0`} />
        <span className="text-[11px] sm:text-xs font-semibold text-white group-hover:text-cyan-300 font-display tracking-tight truncate">
          {activeModelInfo.name}
        </span>
        <span className="hidden xs:inline-block sm:inline-block text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-cyan-500/30 shrink-0">
          {activeModelInfo.badge}
        </span>
        <i className={`fas fa-chevron-down text-[9px] sm:text-[10px] text-slate-400 group-hover:text-cyan-300 transition-all duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-72 md:w-80 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in-scale border border-white/15"
          style={{ background: 'rgba(8, 10, 20, 0.97)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}
        >
          <div className="px-3 py-2 border-b border-white/12 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
              Select AI Intelligence Engine
            </span>
            <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              5 Engines Active
            </span>
          </div>

          <div className="mt-1.5 space-y-1">
            {MODEL_ENGINES.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-300 flex items-start gap-3 group ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-white shadow-lg'
                      : 'hover:bg-white/5 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <i className={`fas ${model.icon} text-sm`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 font-display tracking-tight">
                        {model.name}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 tracking-wide">
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
