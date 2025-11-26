import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  duration: number;
  onComplete: () => void;
  active: boolean;
  timeLeft?: number; // Optional controlled timeLeft from parent
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ duration, onComplete, active, timeLeft: controlledTimeLeft }) => {
  const [internalTimeLeft, setInternalTimeLeft] = useState(duration);
  const timeLeft = controlledTimeLeft !== undefined ? controlledTimeLeft : internalTimeLeft;

  // Handle controlled timeLeft reaching 0
  useEffect(() => {
    if (active && controlledTimeLeft !== undefined && controlledTimeLeft <= 0) {
      onComplete();
    }
  }, [active, controlledTimeLeft, onComplete]);

  useEffect(() => {
    if (!active) {
      if (controlledTimeLeft === undefined) {
        setInternalTimeLeft(duration);
      }
      return;
    }

    // Only manage internal timer if not controlled
    if (controlledTimeLeft === undefined) {
      if (internalTimeLeft <= 0) {
        onComplete();
        return;
      }

      const timer = setInterval(() => {
        setInternalTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            onComplete();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [active, internalTimeLeft, onComplete, duration, controlledTimeLeft]);

  if (!active || timeLeft <= 0) return null;

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 1;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none">
      <div className={`text-center ${isUrgent ? 'animate-pulse' : ''}`}>
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          {/* Circular Progress */}
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={isUrgent ? "#ef4444" : "#fbbf24"}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          {/* Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl md:text-5xl font-bold ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
        </div>
        {isUrgent && (
          <div className="mt-2 text-red-400 text-sm font-bold animate-pulse">
            MỞ NGAY!
          </div>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;

