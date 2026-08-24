import { post } from "@/shared/api/client";
import { UserProfileType } from "@/shared/api/types";
import { LoginFormType, LoginResponseType, SignUpFormType } from "./types";

export const signup = ({ nickname, id, password }: SignUpFormType) =>
  post<UserProfileType>("/signup", { nickname, id, password });

export const login = (loginForm: LoginFormType) =>
  post<LoginResponseType>("/login", loginForm);

export const logout = () => post<void>("/logout");
