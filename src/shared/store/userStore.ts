import { create } from "zustand";
import type { User } from "@/shared/api/types";

type UserState = {
  userInfo: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProgress: (level: number, levelRate: number) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  login: (user) => set({ userInfo: user, isLoggedIn: true }),
  logout: () => set({ userInfo: null, isLoggedIn: false }),
  updateProgress: (level, levelRate) =>
    set((state) =>
      state.userInfo
        ? { userInfo: { ...state.userInfo, level, levelRate } }
        : state
    ),
}));
