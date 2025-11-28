import React from 'react';
import { BetArea, PlacedBet } from '../types';
import { PAYOUTS } from '../constants';
import { Coins } from 'lucide-react';

interface BettingTableProps {
  bets: Record<string, number>;
  onBet: (area: BetArea) => void;
  disabled: boolean;
  lastWinAreas: BetArea[];
  onRipple?: (x: number, y: number) => void;
}

const BettingTable: React.FC<BettingTableProps> = ({ bets, onBet, disabled, lastWinAreas, onRipple }) => {
  
  // Helper function to get chip color based on amount
  const getChipColor = (amount: number): string => {
    if (amount >= 1000000) return '#eab308'; // Gold
    if (amount >= 100000) return '#f59e0b'; // Orange
    if (amount >= 10000) return '#dc2626'; // Red
    return '#2563eb'; // Blue
  };

  // Helper function to format amount
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    }
    if (amount >= 1000) {
      const thousands = amount / 1000;
      return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
    }
    return amount.toString();
  };
  
  const Cell = ({ area, label, subLabel, odds, colSpan = 1, rowSpan = 1, bgClass="bg-[#4a0404]", textClass="text-yellow-100" }: any) => {
    const amount = bets[area] || 0;
    const isWinner = lastWinAreas.includes(area);
    const chipColor = amount > 0 ? getChipColor(amount) : '#2563eb';
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && onBet) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (onRipple) onRipple(x, y);
        onBet(area);
      }
    };
    
    return (
      <button
        onClick={handleClick}
        className={`
            relative flex flex-col items-center justify-center
            border border-[#7f5518] 
            transition-all duration-100 select-none
            ${bgClass}
            ${colSpan > 1 ? `col-span-${colSpan}` : ''}
            ${rowSpan > 1 ? `row-span-${rowSpan}` : ''}
            ${disabled ? 'cursor-not-allowed' : 'active:brightness-125 cursor-pointer'}
            ${isWinner ? 'glow-pulse bg-[#7f1d1d] shadow-[inset_0_0_20px_#fbbf24]' : 'hover:bg-white/5'}
            w-full h-full min-h-[40px] md:min-h-[50px]
        `}
        style={{ 
            gridColumn: `span ${colSpan}`, 
            gridRow: `span ${rowSpan}`,
            boxShadow: isWinner 
              ? 'inset 0 0 30px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.5)' 
              : 'inset 0 0 10px rgba(0,0,0,0.5)' 
        }}
      >
        {/* Glow effect for winner */}
        {isWinner && (
          <>
            <div className="absolute inset-0 border-2 border-yellow-400 z-10 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent z-5"></div>
          </>
        )}

        <div className={`font-serif font-bold ${isWinner ? 'text-yellow-300' : textClass} ${subLabel ? 'text-sm md:text-xl' : 'text-xs md:text-lg'} uppercase z-0`}>{label}</div>
        {subLabel && <div className="text-[10px] md:text-sm text-yellow-500/80 font-mono">{subLabel}</div>}
        <div className="text-[8px] md:text-[10px] text-[#d4af37] mt-0.5 opacity-80">1:{odds}</div>
        
        {amount > 0 && (
          <div className="absolute top-0 right-0 z-20 p-1">
            <div 
              className="relative w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-[8px] md:text-[10px] font-bold animate-float backdrop-blur-sm"
              style={{
                backgroundColor: chipColor,
                boxShadow: `0 0 15px ${chipColor}80, 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)`,
              }}
            >
              {/* Outer border */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-white/60"
                style={{
                  borderStyle: 'dashed',
                }}
              />
              
              {/* Inner circle for depth */}
              <div 
                className="absolute inset-[3px] rounded-full border border-white/40"
                style={{
                  backgroundColor: `${chipColor}dd`,
                }}
              />
              
              {/* Text content */}
              <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {formatAmount(amount)}
              </span>
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-1">
      {/* Table Frame */}
      <div className="bg-[#2a0a0a] p-2 rounded-xl border-4 border-[#5c3a12] shadow-2xl relative overflow-hidden">
        {/* Corner Decors */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4af37]"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4af37]"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4af37]"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4af37]"></div>

        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-7 md:grid-cols-14 gap-[2px] bg-[#7f5518] border-2 border-[#7f5518]">
            
            {/* Top Section - Responsive */}
            <div className="col-span-7 md:col-span-14 grid grid-cols-7 md:grid-cols-12 gap-[2px]">
                {/* SMALL */}
                <div className="col-span-2 md:col-span-3 row-span-2 flex">
                     <Cell area={BetArea.SMALL} label="NHỎ" subLabel="4-10" odds={1} bgClass="bg-[#1e3a8a]/20" textClass="text-blue-200" rowSpan={2} />
                </div>
                
                {/* Specific Triples / Doubles */}
                 <div className="col-span-3 md:col-span-6 grid grid-cols-3 md:grid-cols-6 gap-[2px]">
                     {[1,2,3,4,5,6].map(i => <Cell key={`d${i}`} area={`DOUBLE_${i}`} label={`${i}-${i}`} odds={10} />)}
                     {[1,2,3,4,5,6].map(i => <Cell key={`t${i}`} area={`TRIPLE_${i}`} label={`${i}-${i}-${i}`} odds={180} />)}
                 </div>

                 {/* BIG */}
                 <div className="col-span-2 md:col-span-3 row-span-2 flex">
                     <Cell area={BetArea.BIG} label="LỚN" subLabel="11-17" odds={1} bgClass="bg-[#7f1d1d]/20" textClass="text-red-200" rowSpan={2} />
                 </div>
            </div>

            {/* Sums Row - Responsive */}
            <div className="col-span-7 md:col-span-14 grid grid-cols-7 gap-[2px]">
                {[4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(i => 
                    <Cell key={`s${i}`} area={`SUM_${i}`} label={i} odds={PAYOUTS[`SUM_${i}`]} />
                )}
            </div>

            {/* Bottom Row (Dice Faces) - Responsive */}
            <div className="col-span-7 md:col-span-14 grid grid-cols-7 gap-[2px]">
                <Cell area={BetArea.SINGLE_1} label="⚀" odds={1} />
                <Cell area={BetArea.SINGLE_2} label="⚁" odds={1} />
                <Cell area={BetArea.SINGLE_3} label="⚂" odds={1} />
                <Cell area={BetArea.TRIPLE_ANY} label="ANY TRIPLE" odds={30} bgClass="bg-[#422006]" textClass="text-yellow-400" />
                <Cell area={BetArea.SINGLE_4} label="⚃" odds={1} />
                <Cell area={BetArea.SINGLE_5} label="⚄" odds={1} />
                <Cell area={BetArea.SINGLE_6} label="⚅" odds={1} />
            </div>

        </div>
      </div>
    </div>
  );
};

export default BettingTable;