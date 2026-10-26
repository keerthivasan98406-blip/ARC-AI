import React, { useEffect, useRef } from 'react';

interface ArcAIOrbProps {
  size?: number;
  className?: string;
  interactive?: boolean;
}

export const ArcAIOrb: React.FC<ArcAIOrbProps> = ({
  size = 200,
  className = '',
  interactive = true,
}) => {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive || !orbRef.current) return;

    const orb = orbRef.current;
    let animationId: number;
    let rotation = 0;
    let floatOffset = 0;
    let mouseX = 0;
    let mouseY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = orb.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX = (e.clientX - centerX) / (rect.width / 2);
      mouseY = (e.clientY - centerY) / (rect.height / 2);
    };

    const animate = () => {
      floatOffset += 0.004;
      rotation += 0.15;

      // Smooth follow for rotation
      currentRotationX += (mouseY * 8 - currentRotationX) * 0.05;
      currentRotationY += (mouseX * 8 - currentRotationY) * 0.05;

      if (orb) {
        orb.style.transform = `translateY(${Math.sin(floatOffset) * 6}px) rotateY(${currentRotationY}deg) rotateX(${-currentRotationX}deg)`;
      }

      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [interactive]);

  return (
    <div
      ref={orbRef}
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-[-8px] rounded-full opacity-60"
        style={{
          background: 'conic-gradient(from 0deg, rgba(139,92,246,0.6), rgba(236,72,153,0.4), rgba(77,163,255,0.6), rgba(139,92,246,0.6))',
          filter: 'blur(12px)',
          animation: 'orbRotate 8s linear infinite',
        }}
      />

      {/* Main sphere */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #C4B5FD 0%, #8B5CF6 25%, #D946EF 55%, #EC4899 75%, #7C3AED 100%)',
          boxShadow: '0 0 60px rgba(139,92,246,0.5), 0 0 120px rgba(236,72,153,0.3), inset -20px -20px 60px rgba(0,0,0,0.4), inset 15px 15px 40px rgba(255,255,255,0.2)',
        }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-[8%] left-[20%] rounded-full"
          style={{
            width: '35%',
            height: '25%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent)',
            filter: 'blur(4px)',
          }}
        />

        {/* Inner core glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '30%',
            height: '30%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(236,72,153,0.6) 40%, transparent)',
            filter: 'blur(2px)',
            animation: 'orbPulseCore 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Soft ambient glow behind orb */}
      <div
        className="absolute inset-[-30%] rounded-full opacity-40 -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.4), rgba(236,72,153,0.2), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};

export default ArcAIOrb;