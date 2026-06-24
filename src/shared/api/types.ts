export type Word = {
  word: string;
  meaning: string;
};

export type User = {
  nickname: string;
  id: string;
  password: string;
  level: number;
  levelRate: number;
};

export type PublicUser = Omit<User, "password">;

export type AuthSession = {
  token: string;
  user: PublicUser;
};

export type ApiResponse<T> = {
  code: string;
  status: number;
  data: T;
};

export type LoginInput = {
  id: string;
  password: string;
};

export type SignUpInput = {
  nickname: string;
  id: string;
  password: string;
};

export type WrongAnswer = {
  word: string;
  meaning: string;
  level: number;
  missCount: number;
};

export type Streak = { current: number; lastActiveDate: string | null };

export type Daily = { date: string; correctCount: number };

export type SessionUser = {
  nickname: string;
  id: string;
  level: number;
  levelRate: number;
  streak: Streak;
  daily: Daily;
};

export type LoginResponse = { user: SessionUser; token: string };

export type ProgressResponse = { user: SessionUser; dailyGoalReached: boolean };

export type ReviewAnswerResponse = {
  user: SessionUser;
  wrongAnswers: WrongAnswer[];
};
