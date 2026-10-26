import React from 'react';
import { Citation } from '../types';

interface WebIntelligenceProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  citations?: Citation[];
}

export const WebIntelligence: React.FC<WebIntelligenceProps> = ({
  isEnabled,
  onToggle,
  citations = [],
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Search Toggle Control Pill */}
      <div className="flex items-center justify-between glass-card px-3.5 py-2 rounded-xl border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${isEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'}`}>
            <i className="fas fa-globe" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white font-display">Live Web Intelligence</span>
            <span className="text-[10px] text-slate-400">Real-time internet search & citations</span>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'bg-slate-700'}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Verified Citation Cards Display */}
      {citations.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-1 font-mono">
            <i className="fas fa-link text-[9px]" />
            Verified Source Citations ({citations.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {citations.map((cite) => (
              <a
                key={cite.id}
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-2.5 rounded-xl border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all group flex items-start gap-2.5 relative"
              >
                <div className="w-6 h-6 rounded bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-cyan-400 shrink-0 mt-0.5">
                  {cite.favicon ? (
                    <img src={cite.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
                  ) : (
                    <i className="fas fa-globe" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 font-display">
                      {cite.title}
                    </span>
                    <i className="fas fa-external-link-alt text-[9px] text-slate-500 group-hover:text-cyan-300 ml-1 shrink-0" />
                  </div>
                  <span className="inline-block text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20 font-mono mt-0.5">
                    {cite.domain}
                  </span>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {cite.snippet}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
