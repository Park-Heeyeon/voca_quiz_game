import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "./userStore";
import type { AuthSession } from "@/shared/api/types";

const reset = () =>
  useUserStore.setState({ userInfo: null, token: null, isLoggedIn: false });

const session = (overrides?: Partial<AuthSession["user"]>): AuthSession => ({
  token: "mock-token",
  user: {
    nickname: "히연",
    id: "heeyeon",
    level: 1,
    levelRate: 0,
    ...overrides,
  },
});

describe("userStore", () => {
  beforeEach(reset);

  it("login 시 token·userInfo·isLoggedIn이 설정된다", () => {
    useUserStore.getState().login(session());
    expect(useUserStore.getState().isLoggedIn).toBe(true);
    expect(useUserStore.getState().token).toBe("mock-token");
    expect(useUserStore.getState().userInfo?.nickname).toBe("히연");
  });

  it("userInfo에는 password가 담기지 않는다", () => {
    useUserStore.getState().login(session());
    expect(useUserStore.getState().userInfo).not.toHaveProperty("password");
  });

  it("logout 시 token까지 초기화된다", () => {
    useUserStore.getState().login(session({ level: 2, levelRate: 10 }));
    useUserStore.getState().logout();
    expect(useUserStore.getState().isLoggedIn).toBe(false);
    expect(useUserStore.getState().userInfo).toBeNull();
    expect(useUserStore.getState().token).toBeNull();
  });

  it("updateProgress 시 level/levelRate만 갱신된다", () => {
    useUserStore.getState().login(session({ levelRate: 80 }));
    useUserStore.getState().updateProgress(1, 90);
    expect(useUserStore.getState().userInfo?.levelRate).toBe(90);
    expect(useUserStore.getState().userInfo?.id).toBe("heeyeon");
  });
});
