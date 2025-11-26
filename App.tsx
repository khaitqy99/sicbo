import React, { useState, useEffect, useCallback, useRef } from 'react';
import Dice from './components/Dice';
import BettingTable from './components/BettingTable';
import History from './components/History';
import Bowl from './components/Bowl';
import Confetti from './components/Confetti';
import AchievementNotification from './components/AchievementNotification';
import StatisticsPanel from './components/StatisticsPanel';
import DailyChallenge from './components/DailyChallenge';
import SettingsPanel from './components/SettingsPanel';
import MoneyParticle from './components/MoneyParticle';
import RippleEffect from './components/RippleEffect';
import ChipParticle from './components/ChipParticle';

import BigWinCelebration from './components/BigWinCelebration';
import { BetArea, GameStats, RollResult, StrategyType } from './types';
import { CHIP_VALUES, INITIAL_BALANCE, PAYOUTS } from './constants';
import { playSound } from './utils/sound';
import { analyzeHistory } from './services/geminiService';
import { checkAchievements, AchievementType, ACHIEVEMENTS } from './utils/achievements';
import { saveGame, loadGame, clearSave } from './utils/storage';
import { Sparkles, Play, StopCircle, RefreshCw, BrainCircuit, Wallet, Trophy, History as HistoryIcon, X, Settings, BarChart3, Target } from 'lucide-react';

type GameState = 'IDLE' | 'ROLLING' | 'SHAKING' | 'READY_TO_OPEN' | 'REVEALED';

const App: React.FC = () => {
  // State
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [currentBets, setCurrentBets] = useState<Record<string, number>>({});
  const [selectedChip, setSelectedChip] = useState(CHIP_VALUES[0]);
  const [dice, setDice] = useState<[number, number, number]>([1, 1, 1]);
  const [rollId, setRollId] = useState(0); 
  const [gameState, setGameState] = useState<GameState>('IDLE');
  
  const [history, setHistory] = useState<RollResult[]>([]);
  const [lastWinAreas, setLastWinAreas] = useState<BetArea[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [pendingResult, setPendingResult] = useState<{dice: [number, number, number], resultEntry: RollResult} | null>(null);

  // Auto & Strategy
  const [strategy, setStrategy] = useState<StrategyType>(StrategyType.MANUAL);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(0);
  const [lastRoundResult, setLastRoundResult] = useState<'win' | 'loss' | null>(null);
  const [baseBets, setBaseBets] = useState<Record<string, number>>({}); 

  // AI & Stats
  const [aiComment, setAiComment] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    totalRolls: 0, bigCount: 0, smallCount: 0, tripleCount: 0,
    wins: 0, losses: 0, currentStreak: 0, longestWinStreak: 0, longestLossStreak: 0,
  });

  // New Features
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementType>>(new Set());
  const [newAchievement, setNewAchievement] = useState<AchievementType | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [confettiType, setConfettiType] = useState<'win' | 'bigWin' | 'triple'>('win');
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [dailyChallengeReward, setDailyChallengeReward] = useState(0);
  const [betsLocked, setBetsLocked] = useState(false); // Lock bets once roll starts
  const [lastRollTime, setLastRollTime] = useState(0); // Rate limiting
  const MIN_BET_AMOUNT = 10; // Minimum bet requirement
  const ROLL_COOLDOWN = 500; // Minimum time between rolls (ms)

  // Visual Effects States
  const [screenShake, setScreenShake] = useState(false);
  const [moneyParticles, setMoneyParticles] = useState<Array<{id: number, amount: number, x: number, y: number}>>([]);
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [chipParticles, setChipParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [diceGlow, setDiceGlow] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const particleIdRef = useRef(0);

  // Excitement Features
  const [showBigWinCelebration, setShowBigWinCelebration] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState(0);
  const [bigWinMultiplier, setBigWinMultiplier] = useState(1);
  const [streakBonus, setStreakBonus] = useState(0);
  const [jackpotProgress, setJackpotProgress] = useState(0);
  const [showQuickBet, setShowQuickBet] = useState(false);

  // Betting Session Timer
  const [bettingSessionDuration, setBettingSessionDuration] = useState<number>(0); // seconds, 0 = disabled
  const [bettingTimeLeft, setBettingTimeLeft] = useState<number>(0);
  const bettingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Logic Same as Before ---
  const handleBet = (area: BetArea, multiplier: number = 1) => {
    // Prevent betting during roll states or when bets are locked
    if (gameState !== 'IDLE' && gameState !== 'REVEALED') return;
    if (isAutoPlaying) return;
    if (betsLocked) return;
    
    const betAmount = Math.floor(selectedChip * multiplier);
    if (betAmount <= 0) return;
    
    // Validate balance
    if (balance < betAmount) { 
      if (soundEnabled) playSound('loss'); 
      return; 
    }
    
    // Validate chip value is in allowed list
    if (!CHIP_VALUES.includes(selectedChip)) {
      return;
    }
    
    // Calculate new total bet to ensure it doesn't exceed balance
    const currentBetOnArea = currentBets[area] || 0;
    const newBetOnArea = currentBetOnArea + betAmount;
    const totalCurrentBets = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
    const newTotalBets = totalCurrentBets - currentBetOnArea + newBetOnArea;
    
    if (newTotalBets > balance) {
      if (soundEnabled) playSound('loss');
      return;
    }
    
    if (soundEnabled) playSound('chip');
    
    // Add chip particle effect
    const chipColor = betAmount >= 1000 ? '#eab308' : betAmount >= 100 ? '#dc2626' : '#2563eb';
    const newChipParticle = {
      id: particleIdRef.current++,
      x: window.innerWidth / 2,
      y: 100,
      color: chipColor,
    };
    setChipParticles(prev => [...prev, newChipParticle]);
    
    setBalance(prev => {
      const newBalance = prev - betAmount;
      // Ensure balance never goes negative
      return Math.max(0, newBalance);
    });
    setCurrentBets(prev => {
      const newBets = { ...prev, [area]: (prev[area] || 0) + betAmount };
      // Check High Roller achievement
      const totalBet = (Object.values(newBets) as number[]).reduce((a, b) => a + b, 0);
      if (totalBet >= 5000 && !unlockedAchievements.has(AchievementType.HIGH_ROLLER)) {
        setNewAchievement(AchievementType.HIGH_ROLLER);
        setUnlockedAchievements(prev => new Set([...prev, AchievementType.HIGH_ROLLER]));
      }
      return newBets;
    });
  };

  const clearBets = () => {
    // Prevent clearing bets during roll states or when bets are locked
    if (gameState !== 'IDLE' && gameState !== 'REVEALED') return;
    if (isAutoPlaying) return;
    if (betsLocked) return; // Prevent clearing locked bets
    
    const totalBet = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet > 0) {
      setBalance(prev => prev + totalBet);
      setCurrentBets({});
    }
  };

  const calculateWins = (d: [number, number, number], bets: Record<string, number>) => {
    const sum = d[0] + d[1] + d[2];
    const isTriple = d[0] === d[1] && d[1] === d[2];
    const winningAreas: BetArea[] = [];
    let totalWin = 0;
    const getBet = (area: string) => bets[area] || 0;

    if (isTriple) {
       winningAreas.push(BetArea.TRIPLE_ANY);
       if (bets[BetArea.TRIPLE_ANY]) totalWin += bets[BetArea.TRIPLE_ANY] * PAYOUTS[BetArea.TRIPLE_ANY] + bets[BetArea.TRIPLE_ANY];
       const specific = `TRIPLE_${d[0]}` as BetArea;
       winningAreas.push(specific);
       if (bets[specific]) totalWin += bets[specific] * PAYOUTS[specific] + bets[specific];
    }
    if (!isTriple) {
      if (sum >= 11 && sum <= 17) {
        winningAreas.push(BetArea.BIG);
        if (bets[BetArea.BIG]) totalWin += bets[BetArea.BIG] * PAYOUTS[BetArea.BIG] + bets[BetArea.BIG];
      }
      if (sum >= 4 && sum <= 10) {
        winningAreas.push(BetArea.SMALL);
        if (bets[BetArea.SMALL]) totalWin += bets[BetArea.SMALL] * PAYOUTS[BetArea.SMALL] + bets[BetArea.SMALL];
      }
    }
    const sumKey = `SUM_${sum}` as BetArea;
    if (PAYOUTS[sumKey]) {
        winningAreas.push(sumKey);
        if (bets[sumKey]) totalWin += bets[sumKey] * PAYOUTS[sumKey] + bets[sumKey];
    }
    const counts: Record<number, number> = {};
    d.forEach(val => counts[val] = (counts[val] || 0) + 1);
    for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 2) {
            const doubleKey = `DOUBLE_${i}` as BetArea;
            winningAreas.push(doubleKey);
            if (bets[doubleKey]) totalWin += bets[doubleKey] * PAYOUTS[doubleKey] + bets[doubleKey];
        }
        if (counts[i] >= 1) {
            const singleKey = `SINGLE_${i}` as BetArea;
            winningAreas.push(singleKey);
            if (bets[singleKey]) totalWin += bets[singleKey] + (bets[singleKey] * counts[i]);
        }
    }
    return { winningAreas, totalWin };
  };

  const updateStats = (result: RollResult, totalWin: number, totalBet: number) => {
    setStats(prev => {
      const isWin = totalWin > 0;
      const profitable = totalWin > totalBet;
      const loss = totalWin < totalBet;
      let newCurrentStreak = prev.currentStreak;
      if (profitable) newCurrentStreak = newCurrentStreak > 0 ? newCurrentStreak + 1 : 1;
      else if (loss) newCurrentStreak = newCurrentStreak < 0 ? newCurrentStreak - 1 : -1;

      return {
        totalRolls: prev.totalRolls + 1,
        bigCount: (result.sum >= 11 && result.sum <= 17 && !result.isTriple) ? prev.bigCount + 1 : prev.bigCount,
        smallCount: (result.sum >= 4 && result.sum <= 10 && !result.isTriple) ? prev.smallCount + 1 : prev.smallCount,
        tripleCount: result.isTriple ? prev.tripleCount + 1 : prev.tripleCount,
        wins: profitable ? prev.wins + 1 : prev.wins,
        losses: loss ? prev.losses + 1 : prev.losses,
        currentStreak: newCurrentStreak,
        longestWinStreak: Math.max(prev.longestWinStreak, newCurrentStreak),
        longestLossStreak: Math.min(prev.longestLossStreak, newCurrentStreak),
      };
    });
  };

  const applyStrategy = (lastResult: 'win' | 'loss') => {
    if (strategy === StrategyType.MANUAL || strategy === StrategyType.FIXED) {
        const totalBet = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
        // Validate minimum bet and balance
        if (totalBet < MIN_BET_AMOUNT || balance < totalBet) {
          setIsAutoPlaying(false); 
          return false;
        }
        setBalance(b => Math.max(0, b - totalBet));
        return true;
    }
    let newBets = { ...currentBets };
    if (strategy === StrategyType.MARTINGALE) {
        if (lastResult === 'loss') for (const k in newBets) newBets[k] *= 2;
        else newBets = { ...baseBets };
    } else if (strategy === StrategyType.ANTI_MARTINGALE) {
        if (lastResult === 'win') for (const k in newBets) newBets[k] *= 2;
        else newBets = { ...baseBets };
    }
    const totalBet = (Object.values(newBets) as number[]).reduce((a, b) => a + b, 0);
    // Validate minimum bet and balance
    if (totalBet >= MIN_BET_AMOUNT && balance >= totalBet) { 
      setBalance(b => Math.max(0, b - totalBet)); 
      setCurrentBets(newBets); 
      return true; 
    }
    else { 
      setIsAutoPlaying(false); 
      return false; 
    }
  };

  const startRoll = useCallback(() => {
    // Rate limiting - prevent rapid clicking
    const now = Date.now();
    if (now - lastRollTime < ROLL_COOLDOWN) {
      return;
    }
    
    const totalBetAmount = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
    
    // Allow rolling without bets as per game design
    if (totalBetAmount > 0 && totalBetAmount < MIN_BET_AMOUNT && !isAutoPlaying) {
      alert(`Cược tối thiểu là ${MIN_BET_AMOUNT}!`);
      return;
    }
    
    // Validate balance is sufficient
    if (totalBetAmount > balance) {
      alert("Số dư không đủ!");
      return;
    }
    
    // Lock bets once roll starts
    setBetsLocked(true);
    setLastRollTime(now);
    
    setGameState('ROLLING');
    setLastWinAreas([]);
    if (soundEnabled) playSound('roll');
    
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const newDice: [number, number, number] = [d1, d2, d3];
    const sum = d1 + d2 + d3;
    const isTriple = d1 === d2 && d2 === d3;

    setDice(newDice);
    setRollId(prev => prev + 1);
    const resultEntry = { dice: newDice, sum, isTriple, timestamp: Date.now() };
    setPendingResult({ dice: newDice, resultEntry });

    setTimeout(() => {
        setGameState('SHAKING');
        if (soundEnabled) playSound('shake');
        setTimeout(() => {
            setGameState('READY_TO_OPEN');
            if (soundEnabled) playSound('reveal');
            if (isAutoPlaying) setTimeout(revealResult, 300); // Faster reveal for auto-play
        }, 1000 / animationSpeed);
    }, 2000 / animationSpeed);
  }, [currentBets, isAutoPlaying, soundEnabled, animationSpeed, lastRollTime, balance]);

  const revealResult = () => {
    if (!pendingResult) return;
    const { dice: finalDice, resultEntry } = pendingResult;
    const totalBetAmount = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);

    setGameState('REVEALED');
    let { winningAreas, totalWin } = calculateWins(finalDice, currentBets);
    
    // Apply combo multiplier
    if (totalWin > 0 && comboCount > 0) {
      totalWin = Math.floor(totalWin * comboMultiplier);
    }
    
    // Apply 2% house fee on wins (reduced house edge for better player experience)
    if (totalWin > 0) {
      const houseFee = Math.floor(totalWin * 0.02); // 2% fee (reduced from 5%)
      totalWin = totalWin - houseFee;
    }
    
    setLastWinAreas(winningAreas);
    setLastWinAmount(totalWin);
    
    // Add visual effects based on win amount
    if (totalWin > 0) {
      // Money particles
      const particleCount = totalWin > totalBetAmount * 2 ? 5 : totalWin > totalBetAmount ? 3 : 1;
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: particleIdRef.current++,
        amount: Math.floor(totalWin / particleCount),
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
      }));
      setMoneyParticles(prev => [...prev, ...newParticles]);
      
      // Screen shake for big wins
      if (totalWin > totalBetAmount * 3) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);
      }
      
      // Dice glow effect
      setDiceGlow(true);
      setTimeout(() => setDiceGlow(false), 2000);
      
      // Sparkles for big wins
      if (totalWin > totalBetAmount * 2) {
        const newSparkles = Array.from({ length: 20 }, (_, i) => ({
          id: particleIdRef.current++,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        }));
        setSparkles(prev => [...prev, ...newSparkles]);
      }
    }
    
    // Play appropriate sound based on result
    if (soundEnabled) {
      if (resultEntry.isTriple) {
        playSound('triple');
        setConfettiType('triple');
        setConfettiTrigger(prev => prev + 1);
      } else if (totalWin > totalBetAmount * 2) {
        // Big win (more than 2x the bet)
        playSound('bigWin');
        setConfettiType('bigWin');
        setConfettiTrigger(prev => prev + 1);
      } else if (totalWin > 0) {
        playSound('win');
        setConfettiType('win');
        setConfettiTrigger(prev => prev + 1);
      } else {
        playSound('loss');
        setComboCount(0);
        setComboMultiplier(1);
      }
    }
    
    setBalance(prev => prev + totalWin); 
    if (totalWin > 0 && soundEnabled) {
      // Play chip sound for winnings
      setTimeout(() => playSound('chip'), 200);
    }
    setHistory(prev => [resultEntry, ...prev]);
    const isWin = totalWin > totalBetAmount;
    
    // Update stats first
    setStats(prevStats => {
      const updatedStats = { ...prevStats };
      const profitable = totalWin > totalBetAmount;
      const loss = totalWin < totalBetAmount;
      let newCurrentStreak = prevStats.currentStreak;
      if (profitable) newCurrentStreak = newCurrentStreak > 0 ? newCurrentStreak + 1 : 1;
      else if (loss) newCurrentStreak = newCurrentStreak < 0 ? newCurrentStreak - 1 : -1;

      updatedStats.totalRolls = prevStats.totalRolls + 1;
      updatedStats.bigCount = (resultEntry.sum >= 11 && resultEntry.sum <= 17 && !resultEntry.isTriple) ? prevStats.bigCount + 1 : prevStats.bigCount;
      updatedStats.smallCount = (resultEntry.sum >= 4 && resultEntry.sum <= 10 && !resultEntry.isTriple) ? prevStats.smallCount + 1 : prevStats.smallCount;
      updatedStats.tripleCount = resultEntry.isTriple ? prevStats.tripleCount + 1 : prevStats.tripleCount;
      updatedStats.wins = profitable ? prevStats.wins + 1 : prevStats.wins;
      updatedStats.losses = loss ? prevStats.losses + 1 : prevStats.losses;
      updatedStats.currentStreak = newCurrentStreak;
      updatedStats.longestWinStreak = Math.max(prevStats.longestWinStreak, newCurrentStreak);
      updatedStats.longestLossStreak = Math.min(prevStats.longestLossStreak, newCurrentStreak);

      // Check achievements with updated stats
      const newAchievements = checkAchievements(
        updatedStats,
        balance + totalWin,
        totalWin,
        finalDice,
        resultEntry.sum,
        unlockedAchievements
      );
      if (newAchievements.length > 0) {
        setNewAchievement(newAchievements[0]);
        setUnlockedAchievements(prev => new Set([...prev, ...newAchievements]));
      }

      return updatedStats;
    });
    
    setLastRoundResult(isWin ? 'win' : 'loss');
    
    // Update combo and streak bonus
    if (isWin) {
      setComboCount(prev => prev + 1);
      setComboMultiplier(prev => Math.min(prev + 0.1, 2.0)); // Max 2x multiplier
      
      // Streak bonus - bonus for consecutive wins
      const currentStreak = stats.currentStreak > 0 ? stats.currentStreak + 1 : 1;
      if (currentStreak >= 3) {
        const bonus = Math.floor(totalWin * 0.1 * Math.min(currentStreak / 10, 1)); // Up to 10% bonus
        setStreakBonus(bonus);
        if (bonus > 0) {
          setBalance(prev => prev + bonus);
          setTimeout(() => setStreakBonus(0), 3000);
        }
      }
      
      // Big win celebration for wins > 5x bet
      if (totalWin > totalBetAmount * 5) {
        setBigWinAmount(totalWin);
        setBigWinMultiplier((totalWin / totalBetAmount).toFixed(1) as any);
        setShowBigWinCelebration(true);
      }
      
      // Jackpot progress
      setJackpotProgress(prev => Math.min(prev + 0.5, 100));
    } else {
      setComboCount(0);
      setComboMultiplier(1);
      setJackpotProgress(prev => Math.max(prev - 1, 0));
    }
    
    // Show win result longer - 4 seconds for manual play, 1.5 seconds for auto play (faster)
    const displayDuration = isAutoPlaying ? 1500 : 4000;
    setTimeout(() => { 
      setGameState('IDLE');
      // Unlock bets when game returns to IDLE
      setBetsLocked(false);
      // Keep win amount visible a bit longer after state changes
      if (totalWin > 0) {
        setTimeout(() => setLastWinAmount(0), 500);
      }
    }, displayDuration);
  };

  // Betting Session Timer - Auto roll when time runs out
  useEffect(() => {
    // Clear existing timer
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    // Only run timer if:
    // - Betting session duration is enabled (> 0)
    // - Game is in IDLE or REVEALED state (can place bets)
    // - Not in auto-play mode
    // - Bets are not locked
    if (
      bettingSessionDuration > 0 &&
      (gameState === 'IDLE' || gameState === 'REVEALED') &&
      !isAutoPlaying &&
      !betsLocked
    ) {
      // Reset timer when entering betting state
      setBettingTimeLeft(bettingSessionDuration);

      // Start countdown
      bettingTimerRef.current = setInterval(() => {
        setBettingTimeLeft(prev => {
          if (prev <= 0.1) {
            // Time's up - auto roll
            const totalBetAmount = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
            if (totalBetAmount >= MIN_BET_AMOUNT || totalBetAmount === 0) {
              // Only auto roll if minimum bet is met or no bets placed
              startRoll();
            }
            return 0;
          }
          return prev - 0.1;
        });
      }, 100); // Update every 100ms
    } else {
      // Reset timer when not in betting state
      setBettingTimeLeft(0);
    }

    return () => {
      if (bettingTimerRef.current) {
        clearInterval(bettingTimerRef.current);
        bettingTimerRef.current = null;
      }
    };
  }, [gameState, bettingSessionDuration, isAutoPlaying, betsLocked, currentBets, startRoll]);

  useEffect(() => {
    if (isAutoPlaying && gameState === 'IDLE') {
        if (autoPlayCount > 0) {
            autoPlayRef.current = setTimeout(() => {
                const canProceed = applyStrategy(lastRoundResult || 'loss');
                if (canProceed) { 
                  startRoll(); 
                  setAutoPlayCount(c => c - 1); 
                } else {
                  // If can't proceed (insufficient balance), stop auto-play
                  setIsAutoPlaying(false);
                }
            }, 800 / animationSpeed); // Reduced delay for faster auto-play
        } else { 
          setIsAutoPlaying(false); 
        }
    }
    return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current); };
  }, [isAutoPlaying, gameState, autoPlayCount, lastRoundResult, startRoll, animationSpeed]);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) { 
      setIsAutoPlaying(false); 
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return; 
    }
    
    // Validate minimum bet only if there are bets
    const totalBet = (Object.values(currentBets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet > 0 && totalBet < MIN_BET_AMOUNT) {
      alert(`Cược tối thiểu là ${MIN_BET_AMOUNT}!`);
      return;
    }
    
    // Validate balance
    if (totalBet > balance) {
      alert("Số dư không đủ!");
      return;
    }
    
    setBaseBets({...currentBets}); 
    setAutoPlayCount(50); // Auto-play for 50 rounds
    setIsAutoPlaying(true); 
    // Start rolling immediately - no need to click roll button
    if (gameState === 'IDLE' || gameState === 'REVEALED') {
      startRoll();
    }
  };

  const handleAiAdvice = async () => {
      setIsLoadingAi(true);
      const advice = await analyzeHistory(history);
      setAiComment(advice);
      setIsLoadingAi(false);
  };

  // Save/Load functions
  const handleSaveGame = () => {
    saveGame(balance, history, stats, Array.from(unlockedAchievements));
    alert('Đã lưu game!');
  };

  const handleLoadGame = () => {
    const saved = loadGame();
    if (saved) {
      setBalance(saved.balance);
      setHistory(saved.history);
      setStats(saved.stats);
      setUnlockedAchievements(new Set(saved.unlockedAchievements));
      alert('Đã tải game!');
    } else {
      alert('Không tìm thấy file lưu!');
    }
  };

  const handleResetGame = () => {
    setBalance(INITIAL_BALANCE);
    setHistory([]);
    setStats({
      totalRolls: 0, bigCount: 0, smallCount: 0, tripleCount: 0,
      wins: 0, losses: 0, currentStreak: 0, longestWinStreak: 0, longestLossStreak: 0,
    });
    setUnlockedAchievements(new Set());
    setCurrentBets({});
    clearSave();
    alert('Đã reset game!');
  };

  const handleDailyChallengeComplete = (reward: number) => {
    setBalance(prev => prev + reward);
    setDailyChallengeReward(reward);
    setTimeout(() => setDailyChallengeReward(0), 3000);
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(balance, history, stats, Array.from(unlockedAchievements));
    }, 30000);
    return () => clearInterval(interval);
  }, [balance, history, stats, unlockedAchievements]);

  return (
    <div className="h-full flex flex-col bg-felt">
      {/* --- Main Content Area --- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center landscape:overflow-y-auto">
        
        {/* Logo & Title - Top Left */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-full border-2 border-yellow-500 flex items-center justify-center shadow-lg">
            <span className="font-serif text-base md:text-lg font-bold text-yellow-400">S</span>
          </div>
          <div>
            <h1 className="text-gold font-serif text-sm md:text-base leading-none">SIC BO</h1>
            <span className="text-[8px] md:text-[10px] text-yellow-500/80 tracking-widest">MASTER</span>
          </div>
        </div>

        {/* Balance Display - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-black/60 border border-yellow-600/50 rounded-full px-3 py-1 flex items-center gap-2 min-w-[120px] shadow-inner">
            <Wallet size={14} className="text-yellow-500" />
            <span className="text-yellow-400 font-mono font-bold text-base md:text-lg">{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Info Bar */}
        <div className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm w-full max-w-2xl rounded-lg py-0.5 md:py-1 px-2 md:px-4 flex justify-between items-center text-[10px] md:text-xs border-y border-white/5 shrink-0 landscape:top-2 landscape:py-0.5 z-40">
             <div className="flex items-center gap-2 text-zinc-400">
                <HistoryIcon size={12} /> Gần đây:
             </div>
             <div className="flex gap-1 overflow-hidden">
                {history.slice(0, 15).map((h, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${h.isTriple ? 'bg-green-600' : h.sum >= 11 ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {h.sum >= 11 && !h.isTriple ? 'L' : h.sum <= 10 && !h.isTriple ? 'N' : 'B'}
                    </div>
                ))}
             </div>
             <div className="flex items-center gap-2">
               {comboCount > 0 && (
                 <div className="text-orange-400 font-bold animate-pulse flex items-center gap-1">
                   🔥 <span>{comboCount}x</span>
                 </div>
               )}
               {bettingTimeLeft > 0 && (gameState === 'IDLE' || gameState === 'REVEALED') && !isAutoPlaying && (
                 <div className={`font-bold flex items-center gap-1 ${
                   bettingTimeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
                 }`}>
                   ⏱️ {Math.ceil(bettingTimeLeft)}s
                 </div>
               )}
               <div className="text-yellow-200 font-bold">
                 {gameState === 'IDLE' ? 'MỞ CỬA CƯỢC' : gameState === 'ROLLING' ? 'ĐANG LẮC' : gameState === 'SHAKING' ? 'ĐANG LẮC' : gameState === 'READY_TO_OPEN' ? 'SẴN SÀNG MỞ' : 'ĐÃ MỞ'}
               </div>
             </div>
        </div>
        
        {/* Main Game Area - Responsive Grid Layout */}
        <div className="w-full max-w-6xl px-2 md:px-4 mt-16 md:mt-20 mb-2 md:mb-4 shrink-0 relative">
          {/* Responsive grid for game elements */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-start">
            {/* Left: Chip Selection */}
            <div className="flex md:flex-col gap-2 md:gap-3 justify-center md:justify-start mt-2">
              <div className="rounded-lg p-1 md:p-2">
                <div className="flex md:flex-col gap-2 md:gap-3">
                  {CHIP_VALUES.map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedChip(val)}
                      disabled={gameState !== 'IDLE' && gameState !== 'REVEALED'}
                      className={`
                        relative w-10 h-10 md:w-12 md:h-12 rounded-full shrink-0 transition-all active:scale-95
                        ${selectedChip === val ? '-translate-y-1 ring-2 ring-yellow-400 z-10' : 'hover:-translate-y-0.5 opacity-90'}
                      `}
                    >
                      {/* Chip Visual */}
                      <div 
                        className={`w-full h-full rounded-full border-[3px] border-dashed border-white/30 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-md`}
                        style={{ background: val >= 1000 ? '#eab308' : val >= 100 ? '#dc2626' : '#2563eb' }}
                      >
                        <div className="bg-black/20 w-[80%] h-[80%] rounded-full flex items-center justify-center border border-white/10">
                          {val >= 1000 ? val/1000 + 'k' : val}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Game Stage (Dice & Bowl) - Maintains aspect ratio */}
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-square game-stage-container flex items-center justify-center">
                {/* The "Plate" (Đĩa) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-4 border-zinc-100 flex items-center justify-center">
                  <div className="w-[95%] h-[95%] rounded-full border border-zinc-300/50 bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(220,220,220,1)_100%)]"></div>
                </div>

                {/* Dice */}
                <div className="perspective-1000 relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] md:w-[320px] md:h-[320px] flex items-center justify-center z-10">
                  <div className={`absolute top-4 left-1/2 -translate-x-1/2 scale-[0.7] sm:scale-[0.8] md:scale-[0.9] ${diceGlow ? 'dice-win-glow' : ''}`}><Dice value={dice[0]} rollId={rollId} /></div>
                  <div className={`absolute bottom-4 left-4 scale-[0.7] sm:scale-[0.8] md:scale-[0.9] ${diceGlow ? 'dice-win-glow' : ''}`}><Dice value={dice[1]} rollId={rollId} /></div>
                  <div className={`absolute bottom-4 right-4 scale-[0.7] sm:scale-[0.8] md:scale-[0.9] ${diceGlow ? 'dice-win-glow' : ''}`}><Dice value={dice[2]} rollId={rollId} /></div>
                </div>

                {/* Bowl (Z-Index handled inside) */}
                {(gameState === 'SHAKING' || gameState === 'READY_TO_OPEN') && (
                  <>
                    <Bowl 
                      gameState={gameState} 
                      onOpen={() => {
                        playSound('button');
                        revealResult();
                      }} 
                    />
                  </>
                )}

                {/* Notifications */}
                {lastWinAmount > 0 && (gameState === 'REVEALED' || gameState === 'IDLE') && (
                  <div className="absolute top-10 animate-bounce text-yellow-300 text-2xl sm:text-3xl md:text-4xl font-serif font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-50 text-stroke-gold">
                    +{lastWinAmount.toLocaleString()}
                    {comboCount > 0 && (
                      <div className="text-sm sm:text-base md:text-lg text-orange-400 mt-1">
                        COMBO x{comboCount} ({comboMultiplier.toFixed(1)}x)
                      </div>
                    )}
                  </div>
                )}
                {dailyChallengeReward > 0 && (
                  <div className="absolute bottom-10 animate-bounce text-green-300 text-lg sm:text-xl md:text-2xl font-serif font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-50">
                    Thử thách hàng ngày: +{dailyChallengeReward.toLocaleString()}
                  </div>
                )}
                {streakBonus > 0 && (
                  <div className="absolute top-20 animate-bounce text-orange-300 text-base sm:text-lg md:text-xl font-serif font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-50">
                    🔥 Thưởng Chuỗi: +{streakBonus.toLocaleString()}!
                  </div>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex md:flex-col gap-2 md:gap-3 justify-center md:justify-start">
              {/* Quick Bet Buttons */}
              {(gameState === 'IDLE' || gameState === 'REVEALED') && (Object.keys(currentBets).length > 0) && (
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
              
              {/* ROLL Button */}
              <button
                onClick={() => { if (soundEnabled) playSound('button'); startRoll(); }}
                disabled={gameState !== 'IDLE' && gameState !== 'REVEALED'}
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full 
                  bg-gradient-to-b from-yellow-400 to-yellow-700
                  border-2 md:border-4 border-[#451a03]
                  shadow-[0_4px_0_#270e01,0_0_15px_rgba(234,179,8,0.3)]
                  flex items-center justify-center
                  active:shadow-none active:translate-y-1 transition-all button-glow
                  ${gameState !== 'IDLE' && gameState !== 'REVEALED' ? 'opacity-80 grayscale-[0.5]' : 'hover:brightness-110 hover:scale-105'}
                `}
              >
                <span className="font-bold text-[#451a03] text-xs sm:text-sm md:text-lg font-serif tracking-wide">
                  {gameState === 'READY_TO_OPEN' ? 'MỞ' : 'LẮC'}
                </span>
              </button>

              {/* Utils */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                <button 
                  onClick={() => { if (soundEnabled) playSound('button'); clearBets(); }} 
                  className="flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-800 rounded-lg border border-zinc-600 active:bg-zinc-700"
                >
                  <X size={12} className="text-red-500 mb-0.5" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-400 font-bold">XÓA</span>
                </button>

                <button 
                  onClick={() => { if (soundEnabled) playSound('button'); toggleAutoPlay(); }} 
                  className={`flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg border active:brightness-90 ${isAutoPlaying ? 'bg-green-900 border-green-500' : 'bg-[#14532d] border-[#166534]'}`}
                >
                  {isAutoPlaying ? <StopCircle size={12} className="text-white mb-0.5" /> : <Play size={12} className="text-white mb-0.5" />}
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-green-100 font-bold">TỰ ĐỘNG</span>
                </button>

                <button 
                  onClick={() => { if (soundEnabled) playSound('button'); handleAiAdvice(); }}
                  className="flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-900/80 rounded-lg border border-purple-600 active:bg-purple-800"
                >
                  <BrainCircuit size={12} className={`text-purple-300 mb-0.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-purple-200 font-bold">AI</span>
                </button>

                <button 
                  onClick={() => { if (soundEnabled) playSound('button'); setShowStats(true); }}
                  className="flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-900/80 rounded-lg border border-blue-600 active:bg-blue-800"
                >
                  <BarChart3 size={12} className="text-blue-300 mb-0.5" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-200 font-bold">THỐNG KÊ</span>
                </button>

                <button 
                  onClick={() => { if (soundEnabled) playSound('button'); setShowSettings(true); }}
                  className="flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-800 rounded-lg border border-zinc-600 active:bg-zinc-700"
                >
                  <Settings size={12} className="text-zinc-300 mb-0.5" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-zinc-200 font-bold">CÀI ĐẶT</span>
                </button>

                <button 
                  onClick={() => { if (soundEnabled) playSound('button'); setShowDailyChallenge(!showDailyChallenge); }}
                  className={`flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg border active:brightness-90 ${
                    showDailyChallenge 
                      ? 'bg-yellow-900 border-yellow-500' 
                      : 'bg-yellow-900/50 border-yellow-600/50'
                  }`}
                >
                  <Target size={12} className="text-yellow-300 mb-0.5" />
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-yellow-200 font-bold">HÀNG NGÀY</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Betting Board */}
        <div className="mt-auto w-full pb-2">
          <BettingTable 
              bets={currentBets} 
              onBet={handleBet} 
              disabled={gameState !== 'IDLE' && gameState !== 'REVEALED'} 
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

      {/* Big Win Celebration */}
      {showBigWinCelebration && (
        <BigWinCelebration
          amount={bigWinAmount}
          multiplier={bigWinMultiplier}
          onComplete={() => setShowBigWinCelebration(false)}
        />
      )}

      {/* Jackpot Progress Bar */}
      {jackpotProgress > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[50] bg-black/80 rounded-lg p-2 border border-yellow-600/50 min-w-[200px]">
          <div className="text-xs text-yellow-400 mb-1 text-center font-bold">JACKPOT PROGRESS</div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${jackpotProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-white/60 text-center mt-1">
            {jackpotProgress.toFixed(1)}% - {jackpotProgress >= 100 ? 'JACKPOT READY!' : 'Keep winning!'}
          </div>
        </div>
      )}

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={newAchievement ? ACHIEVEMENTS[newAchievement] : null}
        onClose={() => setNewAchievement(null)}
      />

      {/* Statistics Panel */}
      <StatisticsPanel
        stats={stats}
        balance={balance}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        soundEnabled={soundEnabled}
        onSoundToggle={setSoundEnabled}
        animationSpeed={animationSpeed}
        onAnimationSpeedChange={setAnimationSpeed}
        bettingSessionDuration={bettingSessionDuration}
        onBettingSessionDurationChange={setBettingSessionDuration}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        onResetGame={handleResetGame}
      />

      {/* Daily Challenges */}
      <DailyChallenge
        stats={stats}
        balance={balance}
        onComplete={handleDailyChallengeComplete}
        isOpen={showDailyChallenge}
        onClose={() => setShowDailyChallenge(false)}
      />

      {/* AI Modal Overlay */}
      {aiComment && (
        <div className="fixed bottom-24 right-4 max-w-[280px] bg-black/90 border border-purple-500 p-3 rounded-xl shadow-2xl z-[60] animate-in slide-in-from-bottom">
             <div className="flex justify-between items-start mb-2">
                 <h4 className="text-purple-400 font-bold flex items-center gap-2 text-sm"><Sparkles size={14} /> Gợi ý AI:</h4>
                 <button onClick={() => setAiComment("")} className="text-zinc-500 hover:text-white p-1"><X size={14} /></button>
             </div>
             <p className="text-xs text-gray-200 italic leading-relaxed">"{aiComment}"</p>
        </div>
      )}
    </div>
  );
};

export default App;