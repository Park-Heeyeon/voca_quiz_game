import { v4 as uuidv4 } from "uuid";

interface Session {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  refreshExpiresAt: number;
}

interface ServerUser {
  nickname: string;
  id: string;
  password: string;
  level: number;
  levelRate: number;
  session: Session | null;
}

interface UserProfile {
  nickname: string;
  id: string;
  level: number;
  levelRate: number;
}

const MAX_LEVEL = 3;
const MAX_LEVEL_RATE = 90;
const LEVEL_RATE_STEP = 10;

// 재발급 흐름을 눈으로 확인하려고 짧게 잡았다. 실서비스라면 분 단위다.
const ACCESS_TOKEN_TTL = 30 * 1000;
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = "voca-mock-db";

const createSeed = (): ServerUser[] => [
  {
    nickname: "테스터",
    id: "test1234",
    password: "Test1234!",
    level: 1,
    levelRate: 0,
    session: null,
  },
];

// 새로고침해도 서버가 살아있는 것처럼 보이게 목 데이터를 유지한다.
const load = (): ServerUser[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeed();

  try {
    return JSON.parse(raw) as ServerUser[];
  } catch {
    return createSeed();
  }
};

const users = load();

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const findById = (id: string) => users.find((user) => user.id === id);

export const findByNickname = (nickname: string) =>
  users.find((user) => user.nickname === nickname);

export const findByAccessToken = (token: string) =>
  users.find(
    (user) =>
      user.session?.accessToken === token &&
      user.session.accessExpiresAt > Date.now()
  );

export const findByRefreshToken = (token: string) =>
  users.find(
    (user) =>
      user.session?.refreshToken === token &&
      user.session.refreshExpiresAt > Date.now()
  );

export const addUser = (nickname: string, id: string, password: string) => {
  const user: ServerUser = {
    nickname,
    id,
    password,
    level: 1,
    levelRate: 0,
    session: null,
  };
  users.push(user);
  save();
  return user;
};

export const issueSession = (user: ServerUser) => {
  user.session = {
    accessToken: uuidv4(),
    accessExpiresAt: Date.now() + ACCESS_TOKEN_TTL,
    refreshToken: uuidv4(),
    refreshExpiresAt: Date.now() + REFRESH_TOKEN_TTL,
  };
  save();
  return user.session;
};

// refreshToken은 그대로 두고 accessToken만 새로 발급한다.
export const rotateAccessToken = (user: ServerUser) => {
  if (!user.session) return null;

  user.session.accessToken = uuidv4();
  user.session.accessExpiresAt = Date.now() + ACCESS_TOKEN_TTL;
  save();
  return user.session.accessToken;
};

export const clearSession = (user: ServerUser) => {
  user.session = null;
  save();
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
  } else {
    user.levelRate += LEVEL_RATE_STEP;
  }

  save();
};
