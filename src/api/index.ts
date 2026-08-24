import { LoginFormType, SignUpFormType } from "@/types";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_API_URL,
});

export const requestSignUp = async ({
  nickname,
  id,
  password,
}: SignUpFormType) => {
  const response = await api.post("/signup", { nickname, id, password });
  return response.data;
};

export const requestLogin = async (loginForm: LoginFormType) => {
  const response = await api.post("/login", loginForm);
  return response.data;
};

export const requestLogout = async () => {
  const response = await api.post("/logout");
  return response.data;
};

export const getWordLevel = async (level: number) => {
  const response = await api.get("/word", { params: { level } });
  return response.data;
};
