import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, XCircle, X } from 'lucide-react';

interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
}

interface DailyChallengeProps {
  stats: any;
  balance: number;
  onComplete: (reward: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ stats, balance, onComplete, isOpen, onClose }) => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [lastDate, setLastDate] = useState<string>('');

  useEffect(() => {
    const today = new Date().toDateString();
    
    // Generate new challenges if it's a new day
    if (lastDate !== today) {
      const newChallenges: DailyChallenge[] = [
        {
          id: 'rolls',
          name: 'Người Lắc Hàng Ngày',
          description: 'Lắc xúc xắc 20 lần',
          target: 20,
          current: stats.totalRolls % 100, // Simplified tracking
          reward: 500,
          completed: false,
        },
        {
          id: 'wins',
          name: 'Người Chiến Thắng',
          description: 'Thắng 5 vòng',
          target: 5,
          current: stats.wins % 50, // Simplified tracking
          reward: 1000,
          completed: false,
        },
        {
          id: 'triple',
          name: 'Thợ Săn Ba Giống',
          description: 'Đạt ba giống',
          target: 1,
          current: stats.tripleCount % 10,
          reward: 2000,
          completed: false,
        },
      ];
      setChallenges(newChallenges);
      setLastDate(today);
    }

    // Check completion
    setChallenges(prev => prev.map(challenge => {
      const isCompleted = challenge.current >= challenge.target && !challenge.completed;
      if (isCompleted) {
        setTimeout(() => onComplete(challenge.reward), 100);
      }
      return { ...challenge, completed: isCompleted || challenge.completed };
    }));
  }, [stats, lastDate, onComplete]);

  const completedCount = challenges.filter(c => c.completed).length;

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[280px] bg-black/80 border border-yellow-600/50 rounded-lg p-3 backdrop-blur-sm animate-in slide-in-from-bottom">
      <div className="flex items-center gap-2 mb-2">
        <Target size={16} className="text-yellow-400" />
        <h3 className="text-sm font-bold text-yellow-400">Thử Thách Hàng Ngày</h3>
        <span className="text-xs text-white/60 ml-auto">
          {completedCount}/{challenges.length}
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors ml-1"
        >
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {challenges.map(challenge => (
          <div
            key={challenge.id}
            className={`text-xs p-2 rounded border ${
              challenge.completed
                ? 'bg-green-900/30 border-green-600'
                : 'bg-zinc-900/50 border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-semibold ${challenge.completed ? 'text-green-300' : 'text-white'}`}>
                {challenge.name}
              </span>
              {challenge.completed ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : (
                <XCircle size={14} className="text-zinc-500" />
              )}
            </div>
            <div className="text-white/70 mb-1">{challenge.description}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    challenge.completed ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (challenge.current / challenge.target) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-white/60">
                {Math.min(challenge.current, challenge.target)}/{challenge.target}
              </span>
            </div>
            <div className="text-[10px] text-yellow-400 mt-1">
              Phần thưởng: +{challenge.reward.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyChallenge;

