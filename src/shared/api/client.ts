import axios from "axios";

const TOKEN_KEY = "vocaquiz_token";

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearStoredToken = (): void =>
  localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
