import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';

interface BigWinCelebrationProps {
  amount: number;
  multiplier: number;
  onComplete: () => void;
}

const BigWinCelebration: React.FC<BigWinCelebrationProps> = ({ amount, multiplier, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    // Scale in animation
    setTimeout(() => setScale(1), 100);
    
    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      setScale(0);
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none">
      <div 
        className="relative"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 blur-3xl animate-pulse"></div>
        
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 p-8 md:p-12 rounded-3xl border-4 border-yellow-400 shadow-2xl">
          {/* Sparkles */}
          <Sparkles className="absolute top-4 right-4 text-yellow-300 animate-spin" size={30} />
          <Sparkles className="absolute bottom-4 left-4 text-yellow-300 animate-spin" size={30} style={{ animationDirection: 'reverse' }} />
          
          {/* Trophy Icon */}
          <div className="flex justify-center mb-4">
            <Trophy className="text-yellow-300" size={60} />
          </div>
          
          {/* Title */}
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-2 drop-shadow-lg">
            BIG WIN!
          </h2>
          
          {/* Amount */}
          <div className="text-4xl md:text-6xl font-bold text-center text-yellow-300 mb-2 drop-shadow-lg">
            +{amount.toLocaleString()}
          </div>
          
          {/* Multiplier */}
          {multiplier > 1 && (
            <div className="text-xl md:text-2xl text-center text-white/90">
              {multiplier.toFixed(1)}x Multiplier!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BigWinCelebration;

