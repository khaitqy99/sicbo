import React, { useEffect, useState } from 'react';
import { Achievement } from '../utils/achievements';
import { Trophy, X } from 'lucide-react';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement || !isVisible) return null;

  const rarityColors = {
    common: 'border-gray-400 bg-gray-800/90',
    rare: 'border-blue-400 bg-blue-900/90',
    epic: 'border-purple-400 bg-purple-900/90',
    legendary: 'border-yellow-400 bg-yellow-900/90',
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top">
      <div className={`
        ${rarityColors[achievement.rarity]}
        border-2 rounded-xl p-4 shadow-2xl min-w-[300px] max-w-[400px]
        backdrop-blur-sm
      `}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{achievement.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-yellow-400" />
              <h3 className="font-bold text-white text-lg">Đã Mở Khóa Thành Tựu!</h3>
            </div>
            <p className="text-white/90 font-semibold text-sm mb-1">{achievement.name}</p>
            <p className="text-white/70 text-xs">{achievement.description}</p>
            <div className="mt-2 text-[10px] uppercase tracking-wider text-white/60">
              {achievement.rarity === 'common' ? 'Thường' : achievement.rarity === 'rare' ? 'Hiếm' : achievement.rarity === 'epic' ? 'Sử Thi' : 'Huyền Thoại'}
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 500);
            }}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;

