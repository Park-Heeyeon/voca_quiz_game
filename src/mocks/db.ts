import type { PublicUser, User } from "@/shared/api/types";

const users: User[] = [
  {
    nickname: "테스터",
    id: "test1234",
    password: "Test1234!",
    level: 1,
    levelRate: 0,
  },
];

export const findUserByCredentials = (
  id: string,
  password: string
): User | undefined =>
  users.find((u) => u.id === id && u.password === password);

export const isNicknameTaken = (nickname: string): boolean =>
  users.some((u) => u.nickname === nickname);

export const isIdTaken = (id: string): boolean =>
  users.some((u) => u.id === id);

export const addUser = (user: User): User => {
  users.push(user);
  return user;
};

export const toPublicUser = (user: User): PublicUser => ({
  nickname: user.nickname,
  id: user.id,
  level: user.level,
  levelRate: user.levelRate,
});

export const issueToken = (user: User): string =>
  `mock.${btoa(encodeURIComponent(user.id))}.${Date.now()}`;
