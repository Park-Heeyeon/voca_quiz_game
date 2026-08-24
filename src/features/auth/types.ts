import { UserProfileType } from "@/shared/api/types";

export interface LoginFormType {
  id: string;
  password: string;
}

export interface SignUpFormType {
  nickname: string;
  id: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponseType {
  user: UserProfileType;
  accessToken: string;
}
