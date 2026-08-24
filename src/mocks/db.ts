import { v4 as uuidv4 } from "uuid";

export interface ServerUser {
  nickname: string;
  id: string;
  password: string;
  level: number;
  levelRate: number;
  token: string | null;
}

export interface UserProfile {
  nickname: string;
  id: string;
  level: number;
  levelRate: number;
}

export const MAX_LEVEL = 3;
export const MAX_LEVEL_RATE = 90;
export const LEVEL_RATE_STEP = 10;

// 새로고침하면 초기화된다. 체험용 시드 계정만 유지한다.
const users: ServerUser[] = [
  {
    nickname: "테스터",
    id: "test1234",
    password: "Test1234!",
    level: 1,
    levelRate: 0,
    token: null,
  },
];

export const findById = (id: string) => users.find((user) => user.id === id);

export const findByNickname = (nickname: string) =>
  users.find((user) => user.nickname === nickname);

export const findByToken = (token: string) =>
  users.find((user) => user.token === token);

export const addUser = (nickname: string, id: string, password: string) => {
  const user: ServerUser = {
    nickname,
    id,
    password,
    level: 1,
    levelRate: 0,
    token: null,
  };
  users.push(user);
  return user;
};

export const issueToken = (user: ServerUser) => {
  user.token = uuidv4();
  return user.token;
};

export const clearToken = (user: ServerUser) => {
  user.token = null;
};

export const toProfile = ({
  nickname,
  id,
  level,
  levelRate,
}: ServerUser): UserProfile => ({ nickname, id, level, levelRate });

// 최대 레벨의 최대 진행률에 도달하면 더 올리지 않는다.
export const advance = (user: ServerUser) => {
  const isMaxed = user.level >= MAX_LEVEL && user.levelRate >= MAX_LEVEL_RATE;
  if (isMaxed) return;

  if (user.levelRate >= MAX_LEVEL_RATE) {
    user.level += 1;
    user.levelRate = 0;
    return;
  }

  user.levelRate += LEVEL_RATE_STEP;
};
