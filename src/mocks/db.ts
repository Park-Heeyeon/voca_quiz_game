import type { SessionUser, WrongAnswer } from "@/shared/api/types";
import { toDateKey } from "@/shared/lib/study";

export type ServerUser = {
  nickname: string;
  id: string;
  password: string;
  token: string | null;
  level: number;
  levelRate: number;
  wrongAnswers: WrongAnswer[];
  streak: { current: number; lastActiveDate: string | null };
  daily: { date: string; correctCount: number };
};

const STORAGE_KEY = "vocaquiz_db";

const createSeed = (): ServerUser[] => [
  {
    nickname: "테스터",
    id: "test1234",
    password: "Test1234!",
    token: null,
    level: 1,
    levelRate: 0,
    wrongAnswers: [],
    streak: { current: 0, lastActiveDate: null },
    daily: { date: toDateKey(new Date()), correctCount: 0 },
  },
];

const load = (): ServerUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ServerUser[];
  } catch (error) {
    console.warn("vocaquiz db 로드 실패, 시드로 폴백", error);
  }
  return createSeed();
};

const users: ServerUser[] = load();

export const persist = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.warn("vocaquiz db 저장 실패", error);
  }
};

export const findUserByCredentials = (
  id: string,
  password: string
): ServerUser | undefined =>
  users.find((u) => u.id === id && u.password === password);

export const isNicknameTaken = (nickname: string): boolean =>
  users.some((u) => u.nickname === nickname);

export const isIdTaken = (id: string): boolean =>
  users.some((u) => u.id === id);

export const findUserByToken = (token: string): ServerUser | undefined =>
  users.find((u) => u.token === token);

export const addUser = (input: {
  nickname: string;
  id: string;
  password: string;
}): ServerUser => {
  const user: ServerUser = {
    nickname: input.nickname,
    id: input.id,
    password: input.password,
    token: null,
    level: 1,
    levelRate: 0,
    wrongAnswers: [],
    streak: { current: 0, lastActiveDate: null },
    daily: { date: toDateKey(new Date()), correctCount: 0 },
  };
  users.push(user);
  persist();
  return user;
};

export const toSessionUser = (u: ServerUser): SessionUser => ({
  nickname: u.nickname,
  id: u.id,
  level: u.level,
  levelRate: u.levelRate,
  streak: u.streak,
  daily: u.daily,
});
