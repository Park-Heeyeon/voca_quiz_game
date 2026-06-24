import { create } from "zustand";
import type { SessionUser } from "@/shared/api/types";

type UserState = {
  userInfo: SessionUser | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  setUser: (user: SessionUser) => void;
  logout: () => void;
  setBootstrapping: (value: boolean) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  isBootstrapping: true,
  setUser: (user) => set({ userInfo: user, isLoggedIn: true }),
  logout: () => set({ userInfo: null, isLoggedIn: false }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
