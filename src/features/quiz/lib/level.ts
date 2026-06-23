export const LEVEL_CONFIG = {
  maxLevel: 3,
  rateStep: 10,
  maxRate: 90,
} as const;

export const isMaxLevel = (level: number): boolean =>
  level >= LEVEL_CONFIG.maxLevel;

export const isAtFinalProgress = (level: number, levelRate: number): boolean =>
  isMaxLevel(level) && levelRate >= LEVEL_CONFIG.maxRate;

export const getRemainingRate = (levelRate: number): number => 100 - levelRate;

export const getNextProgress = (
  level: number,
  levelRate: number
): { level: number; levelRate: number } => {
  if (isAtFinalProgress(level, levelRate)) {
    return { level, levelRate };
  }

  if (levelRate >= LEVEL_CONFIG.maxRate) {
    return { level: level + 1, levelRate: 0 };
  }

  return { level, levelRate: levelRate + LEVEL_CONFIG.rateStep };
};
