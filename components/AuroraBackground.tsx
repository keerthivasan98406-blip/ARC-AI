import React from 'react';

export const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep black base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #08080F 0%, #0E0E18 50%, #05050A 100%)',
        }}
      />

      {/* Soft purple ambient glow near top */}
      <div
        className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.35) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle blue ambient light — right side */}
      <div
        className="absolute top-[20%] right-[10%] w-[40vw] h-[40vh] rounded-full opacity-[0.08]"
        style={{
          background: 'radial-gradient(ellipse, rgba(77,163,255,0.3) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Subtle pink ambient light — left side */}
      <div
        className="absolute bottom-[10%] left-[5%] w-[35vw] h-[35vh] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(ellipse, rgba(236,72,153,0.25) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Vignette around edges for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  );
};