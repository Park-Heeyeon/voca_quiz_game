export interface ApiResponseType<T> {
  code: string;
  status: number;
  data: T;
}

export interface UserProfileType {
  nickname: string;
  id: string;
  level: number;
  levelRate: number;
}

export interface LoginResponseType {
  user: UserProfileType;
  accessToken: string;
}

export interface RefreshResponseType {
  accessToken: string;
}
