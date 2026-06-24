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
