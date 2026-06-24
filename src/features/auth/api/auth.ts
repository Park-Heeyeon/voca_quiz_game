import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  LoginInput,
  LoginResponse,
  SessionUser,
  SignUpInput,
} from "@/shared/api/types";

export const requestSignUp = async (
  input: SignUpInput
): Promise<SessionUser> => {
  const { data } = await api.post<ApiResponse<SessionUser>>("/signup", input);
  return data.data;
};

export const requestLogin = async (
  input: LoginInput
): Promise<LoginResponse> => {
  const { data } = await api.post<ApiResponse<LoginResponse>>("/login", input);
  return data.data;
};

export const requestLogout = async (): Promise<void> => {
  await api.post("/logout");
};

export const requestMe = async (): Promise<SessionUser> => {
  const { data } = await api.get<ApiResponse<SessionUser>>("/me");
  return data.data;
};
