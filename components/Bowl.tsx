import React, { useState, useEffect, useRef } from 'react';

interface BowlProps {
  gameState: 'IDLE' | 'SHAKING' | 'READY_TO_OPEN' | 'REVEALED';
  onOpen: () => void;
}

const Bowl: React.FC<BowlProps> = ({ gameState, onOpen }) => {
  if (gameState === 'REVEALED') return null;

  const isShaking = gameState === 'SHAKING';
  const isReady = gameState === 'READY_TO_OPEN';

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleStart = (clientX: number, clientY: number) => {
    if (!isReady) return;
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;
    setOffset({ x: dx, y: dy });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
    if (distance < 5 || distance > 100) {
        onOpen();
    } else {
        setOffset({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none transition-all duration-500`}>
      <div 
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        className={`
          relative w-[280px] h-[280px] md:w-[370px] md:h-[370px] landscape:w-[220px] landscape:h-[220px] rounded-full 
          pointer-events-auto flex items-center justify-center select-none
          ${isShaking ? 'animate-shake-bowl' : ''}
          ${!isDragging && !isShaking ? 'transition-all duration-300 ease-out' : ''} 
        `}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          cursor: isDragging ? 'grabbing' : isReady ? 'grab' : 'default',
          touchAction: 'none',
          // Realistic Shadow for the bowl floating or sitting
          filter: isDragging ? 'drop-shadow(0px 30px 20px rgba(0,0,0,0.6))' : 'drop-shadow(0px 10px 10px rgba(0,0,0,0.8))'
        }}
      >
        {/* Main Bowl Body - Traditional Porcelain style */}
        <div className="w-full h-full rounded-full overflow-hidden relative border-[6px] border-[#e0e0e0] shadow-inner bg-[#f0f0f0]">
             {/* Gradient Shine */}
             <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f0f0f0] to-[#b0b0b0]"></div>
             
             {/* Pattern (Dragon/Floral SVG) */}
             <div className="absolute inset-4 opacity-80 mix-blend-multiply">
                 <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-[spin_60s_linear_infinite]">
                    <g stroke="#1e3a8a" strokeWidth="2" fill="none">
                        <circle cx="100" cy="100" r="80" strokeDasharray="10 5" />
                        <path d="M100 20 C 140 20, 180 60, 180 100 C 180 140, 140 180, 100 180 C 60 180, 20 140, 20 100 C 20 60, 60 20, 100 20 Z" />
                        <path d="M100 50 Q 150 50 150 100 Q 150 150 100 150 Q 50 150 50 100 Q 50 50 100 50" stroke="#1e3a8a" strokeWidth="1" />
                    </g>
                    <text x="100" y="105" fontSize="60" textAnchor="middle" fill="#1e3a8a" fontFamily="serif" fontWeight="bold">福</text>
                 </svg>
             </div>

             {/* Spherical Highlight */}
             <div className="absolute top-4 left-4 w-3/4 h-3/4 rounded-full bg-gradient-to-br from-white to-transparent opacity-60"></div>
        </div>

        {/* Handle / Knob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-b from-[#ffffff] to-[#9ca3af] shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#1e3a8a] border-4 border-white shadow-inner"></div>
        </div>

        {/* Interaction Hint */}
        {isReady && offset.x === 0 && offset.y === 0 && (
          <div className="absolute top-[110%] w-full flex justify-center pointer-events-none">
             <div className="bg-black/70 text-yellow-400 px-3 py-1 rounded text-xs uppercase tracking-wider border border-yellow-600/30 backdrop-blur-sm animate-pulse">
               {isDragging ? 'Throw to Open' : 'Tap or Drag'}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bowl;