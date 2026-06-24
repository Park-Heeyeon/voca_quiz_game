import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { AuthSession, PublicUser } from "@/shared/api/types";

type UserState = {
  userInfo: PublicUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  updateProgress: (level: number, levelRate: number) => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      isLoggedIn: false,
      login: ({ token, user }) =>
        set({ token, userInfo: user, isLoggedIn: true }),
      logout: () => set({ token: null, userInfo: null, isLoggedIn: false }),
      updateProgress: (level, levelRate) =>
        set((state) =>
          state.userInfo
            ? { userInfo: { ...state.userInfo, level, levelRate } }
            : state
        ),
    }),
    {
      name: "voca-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
      partialize: (state) => ({
        userInfo: state.userInfo,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
