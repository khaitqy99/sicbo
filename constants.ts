import { BetArea } from "./types";

export const CHIP_VALUES = [10000, 50000, 100000, 500000, 1000000, 5000000]; // Mệnh giá theo VNĐ

export const PAYOUTS: Record<BetArea, number> = {
  [BetArea.SMALL]: 1, // 1:1 (even money)
  [BetArea.BIG]: 1, // 1:1 (even money)
  [BetArea.ODD]: 1,
  [BetArea.EVEN]: 1,
  [BetArea.TRIPLE_ANY]: 30, // 30:1 (any triple)
  [BetArea.TRIPLE_SPECIFIC_1]: 180, // 180:1 (specific triple)
  [BetArea.TRIPLE_SPECIFIC_2]: 180,
  [BetArea.TRIPLE_SPECIFIC_3]: 180,
  [BetArea.TRIPLE_SPECIFIC_4]: 180,
  [BetArea.TRIPLE_SPECIFIC_5]: 180,
  [BetArea.TRIPLE_SPECIFIC_6]: 180,
  [BetArea.DOUBLE_1]: 11, // 11:1 (improved from 10:1)
  [BetArea.DOUBLE_2]: 11,
  [BetArea.DOUBLE_3]: 11,
  [BetArea.DOUBLE_4]: 11,
  [BetArea.DOUBLE_5]: 11,
  [BetArea.DOUBLE_6]: 11,
  [BetArea.SUM_4]: 60, // 60:1 (rare - only 3 combinations: 1-1-2, 1-2-1, 2-1-1)
  [BetArea.SUM_5]: 20, // 20:1
  [BetArea.SUM_6]: 18, // 18:1
  [BetArea.SUM_7]: 12, // 12:1
  [BetArea.SUM_8]: 8, // 8:1
  [BetArea.SUM_9]: 6, // 6:1
  [BetArea.SUM_10]: 6, // 6:1
  [BetArea.SUM_11]: 6, // 6:1
  [BetArea.SUM_12]: 6, // 6:1
  [BetArea.SUM_13]: 8, // 8:1
  [BetArea.SUM_14]: 12, // 12:1
  [BetArea.SUM_15]: 18, // 18:1
  [BetArea.SUM_16]: 20, // 20:1
  [BetArea.SUM_17]: 60, // 60:1 (rare - only 3 combinations: 6-6-5, 6-5-6, 5-6-6)
  [BetArea.SINGLE_1]: 1, // Base payout - logic handles: 1 appearance = 1:1, 2 appearances = 2:1, 3 appearances = 3:1
  [BetArea.SINGLE_2]: 1,
  [BetArea.SINGLE_3]: 1,
  [BetArea.SINGLE_4]: 1,
  [BetArea.SINGLE_5]: 1,
  [BetArea.SINGLE_6]: 1,
};

export const INITIAL_BALANCE = 100000000; // 100 triệu VNĐ
