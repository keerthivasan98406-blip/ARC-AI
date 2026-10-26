import React from "react";

interface HoloThinkingProps {
  visible?: boolean;
  statusText?: string;
}

export const HoloThinking: React.FC<HoloThinkingProps> = ({
  visible = true,
  statusText = "Neural Processing",
}) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center py-6 select-none">
      <div className="relative w-[200px] h-[200px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[140px] h-[140px] rounded-full bg-cyan-500/10 blur-[40px] animate-pulse" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full animate-float-gentle" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38DDF8" />
                <stop offset="100%" stopColor="#2196F3" />
              </linearGradient>
              <filter id="wireGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx="100" cy="100" r="58" fill="none" stroke="url(#wireGrad)" strokeWidth="1.5" opacity="0.6" filter="url(#wireGlow)" />
            <circle cx="100" cy="100" r="46" fill="none" stroke="url(#wireGrad)" strokeWidth="1" opacity="0.4" strokeDasharray="3 4" />
            <circle cx="100" cy="100" r="34" fill="none" stroke="url(#wireGrad)" strokeWidth="1" opacity="0.3" />

            <line x1="100" y1="42" x2="100" y2="28" stroke="#38DDF8" strokeWidth="1.5" opacity="0.8" />
            <circle cx="100" cy="26" r="3" fill="#7DF9FF" filter="url(#wireGlow)" opacity="0.9">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>

            <ellipse cx="68" cy="78" rx="8" ry="14" fill="none" stroke="url(#wireGrad)" strokeWidth="1.2" opacity="0.6" />
            <ellipse cx="132" cy="78" rx="8" ry="14" fill="none" stroke="url(#wireGrad)" strokeWidth="1.2" opacity="0.6" />

            <ellipse cx="100" cy="100" rx="22" ry="16" fill="none" stroke="url(#wireGrad)" strokeWidth="1.5" opacity="0.7" />
            <line x1="82" y1="100" x2="118" y2="100" stroke="#38DDF8" strokeWidth="1" opacity="0.5" />

            <circle cx="90" cy="96" r="4" fill="#7DF9FF" filter="url(#wireGlow)">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="110" cy="96" r="4" fill="#7DF9FF" filter="url(#wireGlow)">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
            </circle>

            <line x1="100" y1="116" x2="100" y2="130" stroke="#38DDF8" strokeWidth="1.2" opacity="0.6" />
            <line x1="86" y1="122" x2="114" y2="122" stroke="#38DDF8" strokeWidth="1" opacity="0.5" />

            <circle cx="100" cy="142" r="14" fill="none" stroke="url(#wireGrad)" strokeWidth="1.2" opacity="0.6" />
            <circle cx="100" cy="142" r="6" fill="#38DDF8" opacity="0.4" filter="url(#wireGlow)">
              <animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] rounded-full bg-cyan-500/20 blur-[20px]" />
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "300ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "600ms" }} />
        </div>
        <span className="text-xs text-cyan-300/70 font-mono tracking-[0.2em] uppercase">
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default HoloThinking;
