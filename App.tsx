import React, { useState, useEffect, useCallback, useRef } from 'react';
import Dice from './components/Dice';
import BettingTable from './components/BettingTable';
import Bowl from './components/Bowl';
import Confetti from './components/Confetti';
import StatisticsPanel from './components/StatisticsPanel';
import MoneyParticle from './components/MoneyParticle';
import RippleEffect from './components/RippleEffect';
import ChipParticle from './components/ChipParticle';
import BigWinCelebration from './components/BigWinCelebration';
import ToastContainer from './components/ToastContainer';
import { Toast, ToastType } from './components/Toast';
import { BetArea, GameStats, RollResult, Transaction, TransactionType } from './types';
import { CHIP_VALUES, INITIAL_BALANCE, PAYOUTS } from './constants';
import { Wallet, History as HistoryIcon, X, BarChart3, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import DepositWithdraw from './components/DepositWithdraw';
import { saveGame, loadGame } from './utils/storage';

type GameState = 'SHAKING' | 'BETTING' | 'NO_MORE_BETS' | 'READY_TO_OPEN' | 'REVEALED';

const App: React.FC = () => {
  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  
  // Game State
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [currentBets, setCurrentBets] = useState<Record<string, number>>({});
  const [selectedChip, setSelectedChip] = useState(CHIP_VALUES[0]);
  const [dice, setDice] = useState<[number, number, number]>([1, 1, 1]);
  const [rollId, setRollId] = useState(0); 
  const [gameState, setGameState] = useState<GameState>('SHAKING');
  const [bettingTimeLeft, setBettingTimeLeft] = useState(20); // 20 seconds betting time
  
  const [history, setHistory] = useState<RollResult[]>([]);
  const [lastWinAreas, setLastWinAreas] = useState<BetArea[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [sessionCount, setSessionCount] = useState(1); // Track session number
  
  // Auto-open bowl timer
  const autoOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI State for panels
  const [stats, setStats] = useState<GameStats>({
    totalRolls: 0, bigCount: 0, smallCount: 0, tripleCount: 0,
    wins: 0, losses: 0, currentStreak: 0, longestWinStreak: 0, longestLossStreak: 0,
  });

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [confettiType, setConfettiType] = useState<'win' | 'bigWin' | 'triple'>('win');
  const [showStats, setShowStats] = useState(false);
  const [betsLocked, setBetsLocked] = useState(false);

  // Visual Effects States
  const [screenShake, setScreenShake] = useState(false);
  const [moneyParticles, setMoneyParticles] = useState<Array<{id: number, amount: number, x: number, y: number}>>([]);
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [chipParticles, setChipParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [diceGlow, setDiceGlow] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const particleIdRef = React.useRef(0);

  // Excitement Features
  const [showBigWinCelebration, setShowBigWinCelebration] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState(0);
  const [bigWinMultiplier, setBigWinMultiplier] = useState(1);

  // Toast Messages
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Deposit/Withdraw State
  const [showDepositWithdraw, setShowDepositWithdraw] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Helper function to show toast
  const showToast = (message: string, type: ToastType = 'info', duration?: number, icon?: React.ReactNode) => {
    const id = `toast-${toastIdRef.current++}`;
    const newToast: Toast = { id, message, type, duration, icon };
    setToasts(prev => [...prev, newToast]);
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ======================
  // DEPOSIT/WITHDRAW FUNCTIONS
  // ======================

  const handleDeposit = (amount: number, method: string) => {
    const newTransaction: Transaction = {
      id: `deposit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: TransactionType.DEPOSIT,
      amount,
      timestamp: Date.now(),
      status: 'COMPLETED', // In real app, this would be 'PENDING' initially
      method,
    };

    setTransactions(prev => [newTransaction, ...prev].slice(0, 200));
    setBalance(prev => prev + amount);
    showToast(`Đã nạp ${amount.toLocaleString()} VNĐ thành công!`, 'success', 3000);
    setShowDepositWithdraw(false);
  };

  const handleWithdraw = (amount: number, method: string) => {
    if (amount > balance) {
      showToast('Số dư không đủ để rút tiền!', 'error', 3000);
      return;
    }

    const newTransaction: Transaction = {
      id: `withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: TransactionType.WITHDRAW,
      amount,
      timestamp: Date.now(),
      status: 'PENDING', // Withdrawals typically need processing time
      method,
    };

    setTransactions(prev => [newTransaction, ...prev].slice(0, 200));
    setBalance(prev => prev - amount);
    showToast(`Đã gửi yêu cầu rút ${amount.toLocaleString()} VNĐ. Đang xử lý...`, 'info', 3000);
    
    // Simulate processing - in real app, this would be handled by backend
    setTimeout(() => {
      setTransactions(prev => 
        prev.map(t => 
          t.id === newTransaction.id ? { ...t, status: 'COMPLETED' as const } : t
        )
      );
      showToast(`Rút ${amount.toLocaleString()} VNĐ đã hoàn tất!`, 'success', 3000);
    }, 3000);
    
    setShowDepositWithdraw(false);
  };

  // ======================
  // GAME LOGIC FUNCTIONS
  // ======================

  // Handle placing a bet
  const handleBet = (area: BetArea, multiplier: number = 1) => {
    if (gameState !== 'BETTING' && gameState !== 'REVEALED') return;
    
    const betAmount = selectedChip * multiplier;
    
    // Check if player has enough balance
    if (balance < betAmount) {
      showToast('Không đủ số dư để đặt cược!', 'error', 3000);
      return;
    }
    
    // Deduct from balance and add to bets
    setBalance(prev => prev - betAmount);
    setCurrentBets(prev => ({
      ...prev,
      [area]: (prev[area] || 0) + betAmount
    }));
  };

  // Clear all bets
  const clearBets = () => {
    if (gameState !== 'BETTING' && gameState !== 'REVEALED') return;
    
    // Return all bet money to balance
    const totalBets = Object.values(currentBets).reduce((sum, amt) => sum + amt, 0);
    if (totalBets > 0) {
      setBalance(prev => prev + totalBets);
      setCurrentBets({});
      showToast(`Đã hủy tất cả cược. Hoàn lại ${totalBets.toLocaleString()}`, 'info', 2500);
    }
  };

  // Roll the dice (generate random result)
  const rollDice = (): [number, number, number] => {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
  };

  // Check if dice result is a triple
  const isTriple = (diceResult: [number, number, number]): boolean => {
    return diceResult[0] === diceResult[1] && diceResult[1] === diceResult[2];
  };

  // Check if a bet area wins
  const checkWin = (area: BetArea, diceResult: [number, number, number]): boolean => {
    const sum = diceResult[0] + diceResult[1] + diceResult[2];
    const triple = isTriple(diceResult);
    
    // Triple loses all Big/Small/Odd/Even bets
    if (triple && (area === BetArea.BIG || area === BetArea.SMALL || area === BetArea.ODD || area === BetArea.EVEN)) {
      return false;
    }
    
    switch (area) {
      case BetArea.SMALL:
        return sum >= 4 && sum <= 10 && !triple;
      case BetArea.BIG:
        return sum >= 11 && sum <= 17 && !triple;
      case BetArea.ODD:
        return sum % 2 === 1 && !triple;
      case BetArea.EVEN:
        return sum % 2 === 0 && !triple;
      case BetArea.TRIPLE_ANY:
        return triple;
      case BetArea.TRIPLE_SPECIFIC_1:
      case BetArea.TRIPLE_SPECIFIC_2:
      case BetArea.TRIPLE_SPECIFIC_3:
      case BetArea.TRIPLE_SPECIFIC_4:
      case BetArea.TRIPLE_SPECIFIC_5:
      case BetArea.TRIPLE_SPECIFIC_6:
        const num = parseInt(area.split('_')[1]);
        return triple && diceResult[0] === num;
      case BetArea.DOUBLE_1:
      case BetArea.DOUBLE_2:
      case BetArea.DOUBLE_3:
      case BetArea.DOUBLE_4:
      case BetArea.DOUBLE_5:
      case BetArea.DOUBLE_6:
        const doubleNum = parseInt(area.split('_')[1]);
        const count = diceResult.filter(d => d === doubleNum).length;
        return count >= 2;
      case BetArea.SUM_4:
      case BetArea.SUM_5:
      case BetArea.SUM_6:
      case BetArea.SUM_7:
      case BetArea.SUM_8:
      case BetArea.SUM_9:
      case BetArea.SUM_10:
      case BetArea.SUM_11:
      case BetArea.SUM_12:
      case BetArea.SUM_13:
      case BetArea.SUM_14:
      case BetArea.SUM_15:
      case BetArea.SUM_16:
      case BetArea.SUM_17:
        const targetSum = parseInt(area.split('_')[1]);
        return sum === targetSum;
      case BetArea.SINGLE_1:
      case BetArea.SINGLE_2:
      case BetArea.SINGLE_3:
      case BetArea.SINGLE_4:
      case BetArea.SINGLE_5:
      case BetArea.SINGLE_6:
        const singleNum = parseInt(area.split('_')[1]);
        return diceResult.includes(singleNum);
      default:
        return false;
    }
  };

  // Calculate payout for a winning bet (considering Single bet special rule)
  const calculatePayout = (area: BetArea, betAmount: number, diceResult: [number, number, number]): number => {
    const basePayout = PAYOUTS[area];
    
    // Special rule for SINGLE bets: payout multiplies by appearance count
    if (area.startsWith('SINGLE_')) {
      const singleNum = parseInt(area.split('_')[1]);
      const appearances = diceResult.filter(d => d === singleNum).length;
      return betAmount * appearances; // 1:1, 2:1, or 3:1
    }
    
    // Normal payout calculation
    return betAmount * basePayout;
  };

  // Reveal the result and calculate wins
  const revealResult = () => {
    // Clear auto-open timer if exists
    if (autoOpenTimerRef.current) {
      clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }
    
    setGameState('REVEALED');
    setDiceGlow(true);
    
    const sum = dice[0] + dice[1] + dice[2];
    const triple = isTriple(dice);
    
    // Find all winning areas
    const winningAreas: BetArea[] = [];
    let totalWin = 0;
    
    Object.entries(currentBets).forEach(([area, betAmount]) => {
      if (checkWin(area as BetArea, dice)) {
        winningAreas.push(area as BetArea);
        const payout = calculatePayout(area as BetArea, betAmount, dice);
        totalWin += payout + betAmount; // Return bet + winnings
      }
    });
    
    setLastWinAreas(winningAreas);
    setLastWinAmount(totalWin);
    
    // Update balance
    if (totalWin > 0) {
      setBalance(prev => prev + totalWin);
      
      // Trigger visual effects
      setConfettiTrigger(prev => prev + 1);
      if (totalWin > 10000) {
        setConfettiType('bigWin');
        // Big Win Celebration dialog disabled
        // setShowBigWinCelebration(true);
        // setBigWinAmount(totalWin);
        // setBigWinMultiplier(Math.floor(totalWin / Object.values(currentBets).reduce((s, a) => s + a, 0)));
      } else if (triple) {
        setConfettiType('triple');
      } else {
        setConfettiType('win');
      }
    }
    
    // Update statistics
    const didWin = totalWin > 0;
    setStats(prev => ({
      totalRolls: prev.totalRolls + 1,
      bigCount: prev.bigCount + (sum >= 11 && sum <= 17 && !triple ? 1 : 0),
      smallCount: prev.smallCount + (sum >= 4 && sum <= 10 && !triple ? 1 : 0),
      tripleCount: prev.tripleCount + (triple ? 1 : 0),
      wins: prev.wins + (didWin ? 1 : 0),
      losses: prev.losses + (didWin ? 0 : 1),
      currentStreak: didWin ? (prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1) : (prev.currentStreak <= 0 ? prev.currentStreak - 1 : -1),
      longestWinStreak: didWin ? Math.max(prev.longestWinStreak, prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1) : prev.longestWinStreak,
      longestLossStreak: !didWin ? Math.max(prev.longestLossStreak, prev.currentStreak <= 0 ? Math.abs(prev.currentStreak) + 1 : 1) : prev.longestLossStreak,
    }));
    
    // Update history
    setHistory(prev => [{
      dice: dice,
      sum: sum,
      isTriple: triple,
      timestamp: Date.now()
    }, ...prev].slice(0, 50)); // Keep last 50 rolls
    
    setTimeout(() => {
      setDiceGlow(false);
    }, 2000);
    
    // Auto start new round after 5 seconds
    setTimeout(() => {
      startNewRound();
    }, 5000);
  };

  // Start a new round - begins with shaking dice
  const startNewRound = useCallback(() => {
    // Clear previous round data
    setCurrentBets({});
    setLastWinAreas([]);
    setLastWinAmount(0);
    setSessionCount(prev => prev + 1);
    
    // Start shaking phase
    setGameState('SHAKING');
    setScreenShake(true);
    
    // Generate dice result (hidden under bowl)
    setTimeout(() => {
      const result = rollDice();
      setDice(result);
      setRollId(prev => prev + 1);
      
      // After shaking, open betting phase
      setTimeout(() => {
        setScreenShake(false);
        setGameState('BETTING');
        setBettingTimeLeft(20); // Start 20 second countdown
        setBetsLocked(false);
      }, 2000); // 2 second shake
    }, 100);
  }, []);

  // End betting phase and prepare to reveal
  const endBetting = () => {
    setGameState('NO_MORE_BETS');
    setBetsLocked(true);
    
    setTimeout(() => {
      setGameState('READY_TO_OPEN');
      
      // Auto-open bowl after 7 seconds if not manually opened
      // Total time from SHAKING start to reveal: 2s (SHAKING) + 1s (NO_MORE_BETS) + 7s (READY_TO_OPEN) = 10s
      autoOpenTimerRef.current = setTimeout(() => {
        revealResult();
      }, 7000);
    }, 1000);
  };

  // ======================
  // TIMER & AUTO-FLOW LOGIC
  // ======================
  
  // Countdown timer for betting phase
  useEffect(() => {
    if (gameState !== 'BETTING') return;
    
    const timer = setInterval(() => {
      setBettingTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endBetting(); // End betting when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoOpenTimerRef.current) {
        clearTimeout(autoOpenTimerRef.current);
      }
    };
  }, []);
  
  // Load saved game data on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setBalance(saved.balance);
      setHistory(saved.history);
      setStats(saved.stats);
      if (saved.transactions) {
        setTransactions(saved.transactions);
      }
    }
  }, []);

  // Save game data when balance, history, stats, or transactions change
  useEffect(() => {
    const unlockedAchievements: any[] = []; // You can integrate achievements later
    saveGame(balance, history, stats, unlockedAchievements, transactions);
  }, [balance, history, stats, transactions]);

  // Start first round on mount
  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  // Fullscreen functions
  const enterFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  // Check if already in fullscreen
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    checkFullscreen();

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('msfullscreenchange', checkFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('msfullscreenchange', checkFullscreen);
    };
  }, []);

  // Automatically enter fullscreen on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      const timer = setTimeout(() => {
        enterFullscreen();
        localStorage.setItem('hasVisited', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enterFullscreen]);

  return (
    <div className="h-full flex flex-col bg-felt">
      {/* --- Main Content Area --- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center">
        
        {/* Logo & Title - Top Left */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-full border-2 border-yellow-500 flex items-center justify-center shadow-lg">
            <span className="font-serif text-base md:text-lg font-bold text-yellow-400">S</span>
          </div>
          <div>
            <h1 className="text-gold font-serif text-sm md:text-base leading-none">SIC BO</h1>
            <div className="flex items-center gap-2">
              <span className="text-[8px] md:text-[10px] text-yellow-500/80 tracking-widest">MASTER</span>
              <span className="text-[8px] md:text-[9px] text-gray-400 font-mono bg-black/40 px-1.5 py-0.5 rounded">#{sessionCount}</span>
            </div>
          </div>
        </div>

        {/* Utilities Menu - Top Right */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {/* Utilities Button */}
          <div className="relative">
            <button 
              onClick={() => setIsUtilitiesOpen(!isUtilitiesOpen)}
              className="bg-black/60 border border-yellow-600/50 rounded-full p-2 flex items-center justify-center hover:bg-black/80 transition-colors"
              title="Utilities"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
            
            {/* Utilities Menu */}
            {isUtilitiesOpen && (
              <div className="absolute top-full right-0 mt-2 bg-black/90 border border-yellow-600/50 rounded-lg shadow-xl z-50 min-w-[160px]">
                <div className="p-2">
                  {/* Fullscreen Toggle */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      isFullscreen ? exitFullscreen() : enterFullscreen();
                      setIsUtilitiesOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/10 transition-colors"
                  >
                    {isFullscreen ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16v5h5M21 16v5h-5"/>
                        </svg>
                        <span className="text-yellow-200 text-sm">Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/>
                        </svg>
                        <span className="text-yellow-200 text-sm">Enter Fullscreen</span>
                      </>
                    )}
                  </button>
                  
                  {/* History */}
                  <div className="p-2 border-t border-white/5">
                    <div className="text-yellow-200 text-sm font-bold mb-2 flex items-center gap-1">
                      <HistoryIcon size={14} />
                      <span>Lịch sử:</span>
                    </div>
                    <div className="bg-black/40 p-1 rounded border border-white/10 flex gap-[1px]">
                      {Array.from({length: 10}).map((_, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-[1px]">
                          {Array.from({length: 3}).map((_, rowIndex) => {
                            const historyIndex = (9 - colIndex) * 3 + (2 - rowIndex);
                            const record = history[historyIndex];
                            
                            if (!record) return <div key={rowIndex} className="w-3 h-3 bg-[#1a1a1a] rounded-[1px]"></div>;
                            
                            return (
                              <div 
                                key={rowIndex}
                                title={`${record.sum} (${record.dice.join('-')})`}
                                className={`
                                  w-3 h-3 rounded-[1px] flex items-center justify-center text-[6px] font-bold text-white
                                  ${record.isTriple ? 'bg-green-600 shadow-[0_0_3px_green]' : 
                                    record.sum >= 11 ? 'bg-red-600 shadow-[0_0_2px_red]' : 
                                    'bg-blue-600 shadow-[0_0_2px_blue]'}
                                  ${colIndex === 9 && rowIndex === 2 ? 'animate-pulse ring-1 ring-yellow-400' : ''}
                                `}
                              >
                                {record.isTriple ? '🎰' : record.sum >= 11 ? 'T' : 'X'}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Clear Bets */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      clearBets();
                      setIsUtilitiesOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                    disabled={gameState !== 'BETTING' && gameState !== 'REVEALED'}
                  >
                    <X size={16} className="text-red-500" />
                    <span className="text-yellow-200 text-sm">Clear Bets</span>
                  </button>
                  
                  {/* Statistics */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStats(true);
                      setIsUtilitiesOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-blue-900/50 transition-colors"
                  >
                    <BarChart3 size={16} className="text-blue-400" />
                    <span className="text-yellow-200 text-sm">Statistics</span>
                  </button>
                  
                  {/* Deposit/Withdraw */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDepositWithdraw(true);
                      setIsUtilitiesOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-green-900/50 transition-colors"
                  >
                    <Wallet size={16} className="text-green-400" />
                    <span className="text-yellow-200 text-sm">Nạp/Rút Tiền</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Balance Display with Quick Deposit/Withdraw */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDepositWithdraw(true)}
              className="bg-black/60 border border-yellow-600/50 rounded-full px-3 py-1 flex items-center gap-2 min-w-[120px] shadow-inner hover:bg-black/80 transition-colors group"
              title="Nạp/Rút Tiền"
            >
              <Wallet size={14} className="text-yellow-500 group-hover:scale-110 transition-transform" />
              <span className="text-yellow-400 font-mono font-bold text-base md:text-lg">{balance.toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Close utilities menu when clicking outside */}
        {isUtilitiesOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsUtilitiesOpen(false)}
          />
        )}

        {/* Main Game Area - Responsive Grid Layout */}
        <div className="w-full max-w-6xl px-2 md:px-4 mt-16 md:mt-20 mb-2 md:mb-4 shrink-0 relative pb-2 md:pb-4">
          
          {/* Responsive grid for game elements */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-start">
            {/* Center: Game Stage (Dice & Bowl) - Maintains aspect ratio */}
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-square game-stage-container flex items-center justify-center">
                {/* The "Plate" (Đĩa) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-4 border-zinc-100 flex items-center justify-center">
                  <div className="w-[95%] h-[95%] rounded-full border border-zinc-300/50 bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(220,220,220,1)_100%)]"></div>
                </div>

                {/* Dice */}
                <div className="perspective-1000 relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[280px] md:h-[280px] flex items-center justify-center z-10">
                  <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.6] sm:scale-[0.7] md:scale-[0.8] ${diceGlow ? 'dice-win-glow' : ''}`}>
                    <Dice value={dice[0]} rollId={rollId} continuousRoll={gameState === 'REVEALED'} />
                  </div>
                  <div className={`absolute bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2 scale-[0.6] sm:scale-[0.7] md:scale-[0.8] ${diceGlow ? 'dice-win-glow' : ''}`}>
                    <Dice value={dice[1]} rollId={rollId} continuousRoll={gameState === 'REVEALED'} />
                  </div>
                  <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 scale-[0.6] sm:scale-[0.7] md:scale-[0.8] ${diceGlow ? 'dice-win-glow' : ''}`}>
                    <Dice value={dice[2]} rollId={rollId} continuousRoll={gameState === 'REVEALED'} />
                  </div>
                </div>

                {/* Bowl - visible during all states except REVEALED */}
                {gameState !== 'REVEALED' && (
                  <Bowl 
                    gameState={gameState} 
                    bettingTimeLeft={bettingTimeLeft}
                    onOpen={() => {
                      revealResult();
                    }} 
                  />
                )}

                {/* Win Notification */}
                {lastWinAmount > 0 && gameState === 'REVEALED' && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
                    <div className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/95 to-orange-500/95 border-2 border-yellow-300 shadow-2xl backdrop-blur-md">
                      <div className="text-yellow-100 text-2xl sm:text-3xl md:text-4xl font-serif font-bold drop-shadow-lg flex items-center gap-2">
                        <span className="text-green-300">+</span>
                        <span>{lastWinAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex md:flex-col gap-2 md:gap-3 justify-center md:justify-start">
              {/* Quick Bet Buttons */}
              {gameState === 'BETTING' && (Object.keys(currentBets).length > 0) && (
                <div className="flex gap-1 mb-1">
                  <button
                    onClick={() => {
                      Object.keys(currentBets).forEach(area => {
                        handleBet(area as BetArea, 2);
                      });
                    }}
                    className="px-2 py-1 text-[8px] sm:text-[9px] bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition-colors active:scale-95"
                    title="Nhân đôi tất cả cược"
                  >
                    2x
                  </button>
                  <button
                    onClick={() => {
                      Object.keys(currentBets).forEach(area => {
                        const currentAmount = currentBets[area] || 0;
                        if (currentAmount > 0) {
                          setCurrentBets(prev => {
                            const newBets = { ...prev };
                            const newAmount = Math.floor(currentAmount / 2);
                            if (newAmount > 0) {
                              newBets[area] = newAmount;
                              setBalance(prev => prev + (currentAmount - newAmount));
                            } else {
                              delete newBets[area];
                              setBalance(prev => prev + currentAmount);
                            }
                            return newBets;
                          });
                        }
                      });
                    }}
                    className="px-2 py-1 text-[8px] sm:text-[9px] bg-orange-600 hover:bg-orange-700 rounded text-white font-bold transition-colors active:scale-95"
                    title="Giảm một nửa tất cả cược"
                  >
                    1/2
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Betting Board */}
        <div className="mt-0 md:mt-2 w-full pb-2 md:pb-4">
          {/* Chip Selection - Above BettingTable */}
          <div className="flex gap-2 md:gap-3 justify-center mb-3 md:mb-4">
            <div className="rounded-lg p-1 md:p-2">
              <div className="flex gap-2 md:gap-3">
                {CHIP_VALUES.map(val => (
                  <button
                    key={val}
                    onClick={() => setSelectedChip(val)}
                    disabled={gameState !== 'BETTING'}
                    className={`
                      relative w-10 h-10 md:w-12 md:h-12 rounded-full shrink-0 transition-all active:scale-95
                      ${selectedChip === val ? '-translate-y-1 ring-2 ring-yellow-400 z-10' : 'hover:-translate-y-0.5 opacity-90'}
                      ${gameState !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {/* Chip Visual */}
                    <div 
                      className={`w-full h-full rounded-full border-[3px] border-dashed border-white/30 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-md`}
                      style={{ 
                        background: val >= 1000000 ? '#eab308' : val >= 100000 ? '#f59e0b' : val >= 10000 ? '#dc2626' : '#2563eb' 
                      }}
                    >
                      <div className="bg-black/20 w-[80%] h-[80%] rounded-full flex items-center justify-center border border-white/10">
                        {val >= 1000000 ? (val/1000000) + 'M' : val >= 1000 ? (val/1000) + 'k' : val}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <BettingTable 
              bets={currentBets} 
              onBet={handleBet} 
              disabled={gameState !== 'BETTING'} 
              lastWinAreas={gameState === 'REVEALED' ? lastWinAreas : []}
              onRipple={(x, y) => {
                const newRipple = {
                  id: particleIdRef.current++,
                  x,
                  y,
                };
                setRipples(prev => [...prev, newRipple]);
              }}
          />
          
        </div>
      </div>

      {/* Confetti */}
      <Confetti trigger={confettiTrigger > 0} type={confettiType} />

      {/* Money Particles */}
      {moneyParticles.map(particle => (
        <MoneyParticle
          key={particle.id}
          amount={particle.amount}
          x={particle.x}
          y={particle.y}
          onComplete={() => setMoneyParticles(prev => prev.filter(p => p.id !== particle.id))}
        />
      ))}

      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          onComplete={() => setRipples(prev => prev.filter(r => r.id !== ripple.id))}
        />
      ))}

      {/* Chip Particles */}
      {chipParticles.map(particle => (
        <ChipParticle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          color={particle.color}
          onComplete={() => setChipParticles(prev => prev.filter(p => p.id !== particle.id))}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none z-[88] sparkle"
          style={{
            left: `${sparkle.x}px`,
            top: `${sparkle.y}px`,
            width: '10px',
            height: '10px',
            background: 'radial-gradient(circle, #FFD700, transparent)',
            borderRadius: '50%',
          }}
          onAnimationEnd={() => setSparkles(prev => prev.filter(s => s.id !== sparkle.id))}
        />
      ))}

      {/* Big Win Celebration - Disabled */}
      {/* {showBigWinCelebration && (
        <BigWinCelebration
          amount={bigWinAmount}
          multiplier={bigWinMultiplier}
          onComplete={() => setShowBigWinCelebration(false)}
        />
      )} */}

      {/* Statistics Panel */}
      <StatisticsPanel
        stats={stats}
        balance={balance}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-center" />

      {/* Deposit/Withdraw Modal */}
      <DepositWithdraw
        isOpen={showDepositWithdraw}
        onClose={() => setShowDepositWithdraw(false)}
        balance={balance}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        transactions={transactions}
      />

    </div>
  );
};

export default App;

