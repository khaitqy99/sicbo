import React from 'react';
import { RollResult } from '../types';

interface HistoryProps {
  history: RollResult[];
}

const History: React.FC<HistoryProps> = ({ history }) => {
  // We only show the last ~60 results in a grid
  const displayHistory = history.slice(0, 60);

  const getResultColor = (roll: RollResult) => {
    if (roll.isTriple) return 'bg-green-600 text-green-100 border-green-400';
    if (roll.sum >= 11) return 'bg-red-600 text-red-100 border-red-400'; // Big
    return 'bg-blue-600 text-blue-100 border-blue-400'; // Small
  };

  const getResultLabel = (roll: RollResult) => {
    if (roll.isTriple) return 'T';
    if (roll.sum >= 11) return 'B';
    return 'S';
  };

  return (
    <div className="w-full overflow-x-auto bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-inner">
      <div className="text-xs text-zinc-400 mb-2 font-mono uppercase tracking-wider">History (Last 60)</div>
      <div className="grid grid-rows-6 grid-flow-col gap-1 w-max">
        {displayHistory.map((roll, idx) => (
          <div
            key={`${roll.timestamp}-${idx}`}
            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border ${getResultColor(roll)} relative group cursor-pointer`}
          >
            {roll.sum}
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded whitespace-nowrap z-50 pointer-events-none">
                Dice: {roll.dice.join('-')} | {getResultLabel(roll) === 'B' ? 'Big' : getResultLabel(roll) === 'S' ? 'Small' : 'Triple'}
            </div>
          </div>
        ))}
        {/* Fill empty spots for grid layout consistency if needed, but flex wrap handles it */}
        {Array.from({ length: Math.max(0, 60 - displayHistory.length) }).map((_, i) => (
             <div key={`empty-${i}`} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-800 border border-zinc-700 opacity-30"></div>
        ))}
      </div>
    </div>
  );
};

export default History;