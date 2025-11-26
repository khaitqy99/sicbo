import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Zap, Save } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onResetGame: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onSoundToggle,
  animationSpeed,
  onAnimationSpeedChange,
  onSaveGame,
  onLoadGame,
  onResetGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4">
      <div className="bg-[#1a0a0a] border-2 border-yellow-600 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <Settings size={24} />
            Cài Đặt
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <SettingSection title="Âm Thanh">
            <button
              onClick={() => onSoundToggle(!soundEnabled)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-green-900/30 border-green-600 text-green-300'
                  : 'bg-zinc-900/50 border-zinc-700 text-zinc-400'
              }`}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span className="font-semibold">
                {soundEnabled ? 'Bật Âm Thanh' : 'Tắt Âm Thanh'}
              </span>
            </button>
          </SettingSection>

          <SettingSection title="Tốc Độ Hoạt Hình">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-yellow-400" />
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => onAnimationSpeedChange(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white font-mono w-12 text-right">
                  {animationSpeed.toFixed(1)}x
                </span>
              </div>
              <div className="text-xs text-white/60 text-center">
                {animationSpeed < 1 ? 'Chậm Hơn' : animationSpeed > 1 ? 'Nhanh Hơn' : 'Bình Thường'}
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Dữ Liệu Game">
            <div className="space-y-2">
              <button
                onClick={onSaveGame}
                className="w-full flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-600 rounded-lg text-blue-300 hover:bg-blue-900/50 transition-colors"
              >
                <Save size={16} />
                <span>Lưu Tiến Độ</span>
              </button>
              <button
                onClick={onLoadGame}
                className="w-full flex items-center gap-2 p-3 bg-green-900/30 border border-green-600 rounded-lg text-green-300 hover:bg-green-900/50 transition-colors"
              >
                <Save size={16} />
                <span>Tải Tiến Độ</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn reset? Hành động này không thể hoàn tác!')) {
                    onResetGame();
                  }
                }}
                className="w-full flex items-center gap-2 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 hover:bg-red-900/50 transition-colors"
              >
                <span>Reset Game</span>
              </button>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
};

const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-semibold text-yellow-400 mb-3 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

export default SettingsPanel;

