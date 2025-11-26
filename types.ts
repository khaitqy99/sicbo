export enum BetArea {
  SMALL = 'SMALL', // 4-10
  BIG = 'BIG', // 11-17
  ODD = 'ODD',
  EVEN = 'EVEN',
  TRIPLE_ANY = 'TRIPLE_ANY',
  TRIPLE_SPECIFIC_1 = 'TRIPLE_1',
  TRIPLE_SPECIFIC_2 = 'TRIPLE_2',
  TRIPLE_SPECIFIC_3 = 'TRIPLE_3',
  TRIPLE_SPECIFIC_4 = 'TRIPLE_4',
  TRIPLE_SPECIFIC_5 = 'TRIPLE_5',
  TRIPLE_SPECIFIC_6 = 'TRIPLE_6',
  DOUBLE_1 = 'DOUBLE_1',
  DOUBLE_2 = 'DOUBLE_2',
  DOUBLE_3 = 'DOUBLE_3',
  DOUBLE_4 = 'DOUBLE_4',
  DOUBLE_5 = 'DOUBLE_5',
  DOUBLE_6 = 'DOUBLE_6',
  SUM_4 = 'SUM_4',
  SUM_5 = 'SUM_5',
  SUM_6 = 'SUM_6',
  SUM_7 = 'SUM_7',
  SUM_8 = 'SUM_8',
  SUM_9 = 'SUM_9',
  SUM_10 = 'SUM_10',
  SUM_11 = 'SUM_11',
  SUM_12 = 'SUM_12',
  SUM_13 = 'SUM_13',
  SUM_14 = 'SUM_14',
  SUM_15 = 'SUM_15',
  SUM_16 = 'SUM_16',
  SUM_17 = 'SUM_17',
  SINGLE_1 = 'SINGLE_1',
  SINGLE_2 = 'SINGLE_2',
  SINGLE_3 = 'SINGLE_3',
  SINGLE_4 = 'SINGLE_4',
  SINGLE_5 = 'SINGLE_5',
  SINGLE_6 = 'SINGLE_6',
}

export interface PlacedBet {
  area: BetArea;
  amount: number;
}

export interface RollResult {
  dice: [number, number, number];
  sum: number;
  isTriple: boolean;
  timestamp: number;
}

export enum StrategyType {
  MANUAL = 'Manual',
  FIXED = 'Fixed Bet',
  MARTINGALE = 'Martingale (x2 on Loss)',
  ANTI_MARTINGALE = 'Anti-Martingale (x2 on Win)',
  DALEMBERT = "D'Alembert (+/- 1)",
}

export interface GameStats {
  totalRolls: number;
  bigCount: number;
  smallCount: number;
  tripleCount: number;
  wins: number;
  losses: number;
  currentStreak: number; // Positive for win streak, negative for loss streak
  longestWinStreak: number;
  longestLossStreak: number;
}