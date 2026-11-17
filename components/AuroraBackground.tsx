import React from 'react';

export const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep black / midnight navy base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(170deg, #03020A 0%, #07051A 30%, #0A0618 60%, #04030E 100%)',
        }}
      />

      {/* Large central purple bloom — the main ambient light */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[90vw] h-[65vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(100,40,200,0.28) 0%, rgba(80,20,160,0.15) 40%, transparent 72%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Electric blue highlight — top right */}
      <div
        className="absolute top-0 right-[5%] w-[50vw] h-[45vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(56,100,255,0.18) 0%, rgba(30,80,220,0.08) 50%, transparent 75%)',
          filter: 'blur(75px)',
        }}
      />

      {/* Violet accent — bottom left */}
      <div
        className="absolute bottom-[5%] left-0 w-[55vw] h-[40vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(120,40,220,0.20) 0%, rgba(80,20,180,0.08) 55%, transparent 80%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle blue floor glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80vw] h-[30vh] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(40,80,255,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Fine noise grain overlay for premium depth */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Edge vignette for cinematic depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.65) 100%)',
        }}
      />
    </div>
  );
};