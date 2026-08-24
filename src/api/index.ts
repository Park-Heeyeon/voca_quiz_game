import {
  ApiResponseType,
  LoginFormType,
  LoginResponseType,
  RefreshResponseType,
  SignUpFormType,
  UserProfileType,
} from "@/types";
import { useAuthStore } from "@/shared/store/authStore";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_REACT_API_URL;

// withCredentials를 켜야 refreshToken 쿠키가 함께 전송된다.
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

// 재발급이 필요 없거나, 재발급을 시도하면 안 되는 경로
const PUBLIC_PATHS = ["/login", "/signup", "/refresh"];

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// 인터셉터가 걸리지 않은 인스턴스로 호출해야 재귀에 빠지지 않는다.
const requestNewAccessToken = async () => {
  try {
    const { data } = await axios.post<ApiResponseType<RefreshResponseType>>(
      `${BASE_URL}/refresh`,
      null,
      { withCredentials: true }
    );
    useAuthStore.getState().setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  } catch {
    useAuthStore.getState().clearAccessToken();
    return null;
  }
};

// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 하고 결과를 나눠 쓴다.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & { retried?: boolean })
      | undefined;

    const isRetryable =
      error.response?.status === 401 &&
      config &&
      !config.retried &&
      !PUBLIC_PATHS.some((path) => config.url?.includes(path));

    if (!isRetryable) return Promise.reject(error);

    config.retried = true;

    refreshing ??= requestNewAccessToken().finally(() => {
      refreshing = null;
    });
    const accessToken = await refreshing;

    if (!accessToken) return Promise.reject(error);

    config.headers.Authorization = `Bearer ${accessToken}`;
    return api(config);
  }
);

export const requestSignUp = async ({
  nickname,
  id,
  password,
}: SignUpFormType) => {
  const response = await api.post<ApiResponseType<UserProfileType>>("/signup", {
    nickname,
    id,
    password,
  });
  return response.data;
};

export const requestLogin = async (loginForm: LoginFormType) => {
  const response = await api.post<ApiResponseType<LoginResponseType>>(
    "/login",
    loginForm
  );
  return response.data;
};

export const requestLogout = async () => {
  const response = await api.post("/logout");
  return response.data;
};

export const getUserInfo = async () => {
  const response = await api.get<ApiResponseType<UserProfileType>>("/me");
  return response.data;
};

export const requestProgress = async (correct: boolean) => {
  const response = await api.post<ApiResponseType<UserProfileType>>(
    "/progress",
    { correct }
  );
  return response.data;
};

export const getWordLevel = async (level: number) => {
  const response = await api.get("/word", { params: { level } });
  return response.data;
};

// --- 임시 검증용 (제거 예정) ---
declare global {
  interface Window {
    __api?: typeof api;
  }
}
if (import.meta.env.DEV) window.__api = api;
