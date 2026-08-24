import { create } from "zustand";

// accessToken은 저장소에 남기지 않는다. 새로고침 시에는 HttpOnly 쿠키의
// refreshToken으로 다시 받아온다.
interface AuthStore {
  accessToken: string | null;
  setAccessToken: (accessToken: string) => void;
  clearAccessToken: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAccessToken: () => set({ accessToken: null }),
}));
