import {
  ApiResponseType,
  LoginFormType,
  LoginResponseType,
  RefreshResponseType,
  SignUpFormType,
  UserProfileType,
  VocaListType
} from "@/types";
import { useAuthStore } from "@/shared/store/authStore";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig
} from "axios";

const BASE_URL = import.meta.env.VITE_REACT_API_URL;

// withCredentials를 켜야 refreshToken 쿠키가 함께 전송된다.
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

// 이 경로의 401은 재발급으로 풀 수 없다
const NO_RETRY_PATHS = ["/login", "/refresh"];

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
      !NO_RETRY_PATHS.some((path) => config.url?.includes(path));

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

const get = async <T>(url: string, config?: AxiosRequestConfig) => {
  const { data } = await api.get<ApiResponseType<T>>(url, config);
  return data.data;
};

const post = async <T>(url: string, body?: unknown) => {
  const { data } = await api.post<ApiResponseType<T>>(url, body);
  return data.data;
};

export const requestSignUp = ({ nickname, id, password }: SignUpFormType) =>
  post<UserProfileType>("/signup", { nickname, id, password });

export const requestLogin = (loginForm: LoginFormType) =>
  post<LoginResponseType>("/login", loginForm);

export const requestLogout = () => post<void>("/logout");

export const getUserInfo = () => get<UserProfileType>("/me");

export const requestProgress = (correct: boolean) =>
  post<UserProfileType>("/progress", { correct });

export const getWordLevel = (level: number) =>
  get<VocaListType[]>("/word", { params: { level } });
