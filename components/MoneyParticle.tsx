import React, { useEffect, useState } from 'react';

interface MoneyParticleProps {
  amount: number;
  x: number;
  y: number;
  onComplete: () => void;
}

const MoneyParticle: React.FC<MoneyParticleProps> = ({ amount, x, y, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-[90]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        animation: 'money-rise 2s ease-out forwards',
      }}
    >
      <div className="text-yellow-400 text-2xl font-bold drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">
        +{amount.toLocaleString()}
      </div>
      <style>{`
        @keyframes money-rise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 1;
          }
          50% {
            transform: translateY(-50px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MoneyParticle;

