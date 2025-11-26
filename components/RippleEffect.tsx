import React, { useEffect, useState } from 'react';

interface RippleEffectProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const RippleEffect: React.FC<RippleEffectProps> = ({ x, y, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-[95]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="absolute rounded-full border-2 border-yellow-400"
        style={{
          width: '20px',
          height: '20px',
          animation: 'ripple 0.6s ease-out forwards',
        }}
      />
      <style>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(10);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RippleEffect;

