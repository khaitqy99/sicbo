import { GameStats, RollResult } from '../types';
import { AchievementType } from './achievements';

export interface SavedGame {
  balance: number;
  history: RollResult[];
  stats: GameStats;
  unlockedAchievements: AchievementType[];
  lastSaveTime: number;
}

const STORAGE_KEY = 'sic-bo-save';

export const saveGame = (
  balance: number,
  history: RollResult[],
  stats: GameStats,
  unlockedAchievements: AchievementType[]
): void => {
  try {
    const saveData: SavedGame = {
      balance,
      history: history.slice(0, 100), // Save last 100 rolls
      stats,
      unlockedAchievements: Array.from(unlockedAchievements),
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
};

export const loadGame = (): SavedGame | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as SavedGame;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

export const clearSave = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear save:', error);
  }
};

