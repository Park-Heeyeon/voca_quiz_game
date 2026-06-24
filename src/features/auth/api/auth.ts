import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  AuthSession,
  LoginInput,
  PublicUser,
  SignUpInput,
} from "@/shared/api/types";

export const requestSignUp = async (
  input: SignUpInput
): Promise<PublicUser> => {
  const { data } = await api.post<ApiResponse<PublicUser>>("/signup", input);
  return data.data;
};

export const requestLogin = async (
  input: LoginInput
): Promise<AuthSession> => {
  const { data } = await api.post<ApiResponse<AuthSession>>("/login", input);
  return data.data;
};

export const requestLogout = async (): Promise<void> => {
  await api.post("/logout");
};
