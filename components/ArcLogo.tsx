import React from 'react';

interface ArcLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showBadge?: boolean;
}

export const ArcLogo: React.FC<ArcLogoProps> = ({ size = 'md', showText = true, showBadge = false }) => {
  const dimensions = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-3 select-none group">
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        {/* Soft glow halo behind the logo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] opacity-40 blur-md group-hover:opacity-70 group-hover:blur-lg transition-all duration-500" />
        <div className="relative w-full h-full animate-robot-float rounded-full overflow-hidden">
          <img
            src="/arc_ai_logo.png"
            alt="Arc AI Logo"
            className="w-full h-full object-cover drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${textSize} font-extrabold tracking-tight text-white font-display`}>
              Arc<span className="text-gradient-radiant"> AI</span>
            </span>
            {showBadge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-[#C0C0C0] text-[#050000] border border-[#C0C0C0]/40 rounded-full">
                OS v3.5
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-400 tracking-widest uppercase font-mono">
            Neural Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
