export const DAILY_GOAL = 10;

type Daily = { date: string; correctCount: number };
type Streak = { current: number; lastActiveDate: string | null };

export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const fromDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isYesterday = (prevKey: string, todayKey: string): boolean => {
  const prevDay = fromDateKey(todayKey);
  prevDay.setDate(prevDay.getDate() - 1);
  return toDateKey(prevDay) === prevKey;
};

export const resetDailyIfNeeded = (daily: Daily, todayKey: string): Daily =>
  daily.date === todayKey ? daily : { date: todayKey, correctCount: 0 };

export const registerDailyCorrect = (daily: Daily, todayKey: string): Daily => {
  const base = resetDailyIfNeeded(daily, todayKey);
  return { date: todayKey, correctCount: base.correctCount + 1 };
};

export const applyStudyDay = (streak: Streak, todayKey: string): Streak => {
  if (streak.lastActiveDate === todayKey) return streak;
  if (streak.lastActiveDate && isYesterday(streak.lastActiveDate, todayKey)) {
    return { current: streak.current + 1, lastActiveDate: todayKey };
  }
  return { current: 1, lastActiveDate: todayKey };
};

export const isDailyGoalMet = (daily: Daily): boolean =>
  daily.correctCount >= DAILY_GOAL;
