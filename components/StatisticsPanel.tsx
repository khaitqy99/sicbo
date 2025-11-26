import React from 'react';
import { GameStats } from '../types';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';

interface StatisticsPanelProps {
  stats: GameStats;
  balance: number;
  isOpen: boolean;
  onClose: () => void;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats, balance, isOpen, onClose }) => {
  if (!isOpen) return null;

  const winRate = stats.totalRolls > 0 ? ((stats.wins / stats.totalRolls) * 100).toFixed(1) : '0';
  const bigSmallRatio = stats.smallCount > 0 
    ? (stats.bigCount / stats.smallCount).toFixed(2) 
    : stats.bigCount > 0 ? '∞' : '0';
  const tripleRate = stats.totalRolls > 0 
    ? ((stats.tripleCount / stats.totalRolls) * 100).toFixed(2) 
    : '0';

  return (
    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4">
      <div className="bg-[#1a0a0a] border-2 border-yellow-600 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <BarChart3 size={24} />
            Bảng Thống Kê
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Target size={20} />}
            label="Tổng Lần Lắc"
            value={stats.totalRolls}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Tỷ Lệ Thắng"
            value={`${winRate}%`}
            color="green"
          />
          <StatCard
            icon={<Zap size={20} />}
            label="Chuỗi Hiện Tại"
            value={stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak.toString()}
            color={stats.currentStreak > 0 ? "green" : "red"}
          />
          <StatCard
            icon={<BarChart3 size={20} />}
            label="Số Dư"
            value={balance.toLocaleString()}
            color="yellow"
          />
        </div>

        <div className="space-y-4">
          <Section title="Kỷ Lục Thắng/Thua">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="text-green-400 text-sm mb-1">Thắng</div>
                <div className="text-2xl font-bold text-green-300">{stats.wins}</div>
              </div>
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
                <div className="text-red-400 text-sm mb-1">Thua</div>
                <div className="text-2xl font-bold text-red-300">{stats.losses}</div>
              </div>
            </div>
          </Section>

          <Section title="Chuỗi">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
                <div className="text-blue-400 text-sm mb-1">Chuỗi Thắng Dài Nhất</div>
                <div className="text-2xl font-bold text-blue-300">{stats.longestWinStreak}</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4">
                <div className="text-orange-400 text-sm mb-1">Chuỗi Thua Dài Nhất</div>
                <div className="text-2xl font-bold text-orange-300">{Math.abs(stats.longestLossStreak)}</div>
              </div>
            </div>
          </Section>

          <Section title="Phân Bố Xúc Xắc">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-blue-900/20 rounded p-2">
                <span className="text-blue-300">Lớn (11-17)</span>
                <span className="text-white font-bold">{stats.bigCount}</span>
              </div>
              <div className="flex items-center justify-between bg-red-900/20 rounded p-2">
                <span className="text-red-300">Nhỏ (4-10)</span>
                <span className="text-white font-bold">{stats.smallCount}</span>
              </div>
              <div className="flex items-center justify-between bg-green-900/20 rounded p-2">
                <span className="text-green-300">Ba Giống</span>
                <span className="text-white font-bold">{stats.tripleCount}</span>
              </div>
              <div className="flex items-center justify-between bg-yellow-900/20 rounded p-2">
                <span className="text-yellow-300">Tỷ Lệ Lớn/Nhỏ</span>
                <span className="text-white font-bold">{bigSmallRatio}</span>
              </div>
              <div className="flex items-center justify-between bg-purple-900/20 rounded p-2">
                <span className="text-purple-300">Tỷ Lệ Ba Giống</span>
                <span className="text-white font-bold">{tripleRate}%</span>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-900/30 border-blue-600 text-blue-300',
    green: 'bg-green-900/30 border-green-600 text-green-300',
    red: 'bg-red-900/30 border-red-600 text-red-300',
    yellow: 'bg-yellow-900/30 border-yellow-600 text-yellow-300',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div className="text-xs opacity-80">{label}</div>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-yellow-400 mb-3">{title}</h3>
    {children}
  </div>
);

export default StatisticsPanel;

