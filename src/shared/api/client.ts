import axios from "axios";
import { useUserStore } from "@/shared/store/userStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_API_URL,
});

api.interceptors.request.use((config) => {
  const { token } = useUserStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
