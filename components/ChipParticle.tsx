import React, { useEffect, useState } from 'react';

interface ChipParticleProps {
  x: number;
  y: number;
  color: string;
  onComplete: () => void;
}

const ChipParticle: React.FC<ChipParticleProps> = ({ x, y, color, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const angle = Math.random() * Math.PI * 2;
  const distance = 50 + Math.random() * 50;
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-[85]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        animation: `chip-burst 0.8s ease-out forwards`,
        '--end-x': `${endX}px`,
        '--end-y': `${endY}px`,
      } as React.CSSProperties}
    >
      <div
        className="w-4 h-4 rounded-full border-2 border-dashed border-white/50"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <style>{`
        @keyframes chip-burst {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.3) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChipParticle;

