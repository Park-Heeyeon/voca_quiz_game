import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  LoginInput,
  PublicUser,
  SignUpInput,
  User,
} from "@/shared/api/types";

export const requestSignUp = async (
  input: SignUpInput
): Promise<PublicUser> => {
  const { data } = await api.post<ApiResponse<PublicUser>>("/signup", input);
  return data.data;
};

export const requestLogin = async (input: LoginInput): Promise<User> => {
  const { data } = await api.post<ApiResponse<User>>("/login", input);
  return data.data;
};

export const requestLogout = async (): Promise<void> => {
  await api.post("/logout");
};
