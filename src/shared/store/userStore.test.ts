import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "./userStore";

const reset = () =>
  useUserStore.setState({ userInfo: null, isLoggedIn: false });

describe("userStore", () => {
  beforeEach(reset);

  it("login 시 userInfo와 isLoggedIn이 설정된다", () => {
    useUserStore.getState().login({
      nickname: "히연",
      id: "heeyeon",
      password: "pw",
      level: 1,
      levelRate: 0,
    });
    expect(useUserStore.getState().isLoggedIn).toBe(true);
    expect(useUserStore.getState().userInfo?.nickname).toBe("히연");
  });

  it("logout 시 초기화된다", () => {
    useUserStore.getState().login({
      nickname: "히연",
      id: "heeyeon",
      password: "pw",
      level: 2,
      levelRate: 10,
    });
    useUserStore.getState().logout();
    expect(useUserStore.getState().isLoggedIn).toBe(false);
    expect(useUserStore.getState().userInfo).toBeNull();
  });

  it("updateProgress 시 level/levelRate만 갱신된다", () => {
    useUserStore.getState().login({
      nickname: "히연",
      id: "heeyeon",
      password: "pw",
      level: 1,
      levelRate: 80,
    });
    useUserStore.getState().updateProgress(1, 90);
    expect(useUserStore.getState().userInfo?.levelRate).toBe(90);
    expect(useUserStore.getState().userInfo?.id).toBe("heeyeon");
  });
});
