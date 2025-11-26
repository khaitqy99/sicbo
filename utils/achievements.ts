export enum AchievementType {
  FIRST_WIN = 'FIRST_WIN',
  BIG_WIN = 'BIG_WIN',
  TRIPLE_MASTER = 'TRIPLE_MASTER',
  STREAK_5 = 'STREAK_5',
  STREAK_10 = 'STREAK_10',
  MILLIONAIRE = 'MILLIONAIRE',
  HIGH_ROLLER = 'HIGH_ROLLER',
  LUCKY_SEVEN = 'LUCKY_SEVEN',
  PERFECT_TRIPLE = 'PERFECT_TRIPLE',
  CONSERVATIVE = 'CONSERVATIVE',
}

export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Record<AchievementType, Achievement> = {
  [AchievementType.FIRST_WIN]: {
    id: AchievementType.FIRST_WIN,
    name: 'Chiến Thắng Đầu Tiên',
    description: 'Thắng cược đầu tiên của bạn',
    icon: '🎉',
    rarity: 'common',
  },
  [AchievementType.BIG_WIN]: {
    id: AchievementType.BIG_WIN,
    name: 'Người Thắng Lớn',
    description: 'Thắng hơn 10,000 trong một vòng',
    icon: '💰',
    rarity: 'rare',
  },
  [AchievementType.TRIPLE_MASTER]: {
    id: AchievementType.TRIPLE_MASTER,
    name: 'Bậc Thầy Ba Giống',
    description: 'Đạt 5 lần ba giống',
    icon: '🎲',
    rarity: 'epic',
  },
  [AchievementType.STREAK_5]: {
    id: AchievementType.STREAK_5,
    name: 'Chuỗi Nóng',
    description: 'Thắng 5 vòng liên tiếp',
    icon: '🔥',
    rarity: 'rare',
  },
  [AchievementType.STREAK_10]: {
    id: AchievementType.STREAK_10,
    name: 'Không Thể Ngăn Cản',
    description: 'Thắng 10 vòng liên tiếp',
    icon: '⚡',
    rarity: 'epic',
  },
  [AchievementType.MILLIONAIRE]: {
    id: AchievementType.MILLIONAIRE,
    name: 'Triệu Phú',
    description: 'Đạt số dư 1,000,000',
    icon: '💎',
    rarity: 'legendary',
  },
  [AchievementType.HIGH_ROLLER]: {
    id: AchievementType.HIGH_ROLLER,
    name: 'Cao Thủ',
    description: 'Đặt cược 5,000 trở lên',
    icon: '👑',
    rarity: 'rare',
  },
  [AchievementType.LUCKY_SEVEN]: {
    id: AchievementType.LUCKY_SEVEN,
    name: 'Số Bảy May Mắn',
    description: 'Lắc tổng bằng 7 ba lần',
    icon: '🍀',
    rarity: 'rare',
  },
  [AchievementType.PERFECT_TRIPLE]: {
    id: AchievementType.PERFECT_TRIPLE,
    name: 'Ba Giống Hoàn Hảo',
    description: 'Đạt ba giống 6 (6-6-6)',
    icon: '🌟',
    rarity: 'legendary',
  },
  [AchievementType.CONSERVATIVE]: {
    id: AchievementType.CONSERVATIVE,
    name: 'Người Chơi Thận Trọng',
    description: 'Chơi 100 vòng',
    icon: '📊',
    rarity: 'common',
  },
};

export const checkAchievements = (
  stats: any,
  balance: number,
  lastWin: number,
  lastDice: [number, number, number],
  lastSum: number,
  unlocked: Set<AchievementType>
): AchievementType[] => {
  const newAchievements: AchievementType[] = [];

  // First Win
  if (stats.wins > 0 && !unlocked.has(AchievementType.FIRST_WIN)) {
    newAchievements.push(AchievementType.FIRST_WIN);
  }

  // Big Win
  if (lastWin > 10000 && !unlocked.has(AchievementType.BIG_WIN)) {
    newAchievements.push(AchievementType.BIG_WIN);
  }

  // Triple Master
  if (stats.tripleCount >= 5 && !unlocked.has(AchievementType.TRIPLE_MASTER)) {
    newAchievements.push(AchievementType.TRIPLE_MASTER);
  }

  // Streaks
  if (stats.currentStreak >= 5 && !unlocked.has(AchievementType.STREAK_5)) {
    newAchievements.push(AchievementType.STREAK_5);
  }
  if (stats.currentStreak >= 10 && !unlocked.has(AchievementType.STREAK_10)) {
    newAchievements.push(AchievementType.STREAK_10);
  }

  // Millionaire
  if (balance >= 1000000 && !unlocked.has(AchievementType.MILLIONAIRE)) {
    newAchievements.push(AchievementType.MILLIONAIRE);
  }

  // High Roller (check in bets)
  // This will be checked separately when placing bets

  // Lucky Seven
  if (lastSum === 7 && !unlocked.has(AchievementType.LUCKY_SEVEN)) {
    // Check if this is the third time
    // This would need history tracking, simplified here
  }

  // Perfect Triple
  if (lastDice[0] === 6 && lastDice[1] === 6 && lastDice[2] === 6 && !unlocked.has(AchievementType.PERFECT_TRIPLE)) {
    newAchievements.push(AchievementType.PERFECT_TRIPLE);
  }

  // Conservative
  if (stats.totalRolls >= 100 && !unlocked.has(AchievementType.CONSERVATIVE)) {
    newAchievements.push(AchievementType.CONSERVATIVE);
  }

  return newAchievements;
};

