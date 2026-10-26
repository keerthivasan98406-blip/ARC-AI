import React from 'react';

interface AIThinkingOrbProps {
  statusText?: string;
  modelName?: string;
}

export const AIThinkingOrb: React.FC<AIThinkingOrbProps> = ({
  statusText = 'Analyzing query & searching neural space...',
  modelName = 'Arc AI',
}) => {
  return (
    <div className="flex items-center gap-3 glass-pill px-4 py-2 rounded-full border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)] animate-fade-in-up duration-300 max-w-fit select-none">
      <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/70 animate-rotate-orb" />

        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FFFFFF] via-[#C0C0C0] to-[#FFFFFF] animate-pulse-glow flex items-center justify-center shadow-[0_0_14px_rgba(255,255,255,0.5)]">
          <i className="fas fa-brain text-[10px] text-white animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <i className="fas fa-sparkles text-xs text-cyan-300 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white tracking-wide font-display">
            {statusText}
          </span>
          <span className="text-[9px] font-medium text-cyan-400/80 font-mono uppercase tracking-widest">
            {modelName}
          </span>
        </div>
      </div>
    </div>
  );
};
