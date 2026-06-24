import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "./userStore";
import type { SessionUser } from "@/shared/api/types";

const sample: SessionUser = {
  nickname: "히연",
  id: "heeyeon",
  level: 1,
  levelRate: 0,
  streak: { current: 0, lastActiveDate: null },
  daily: { date: "2026-06-23", correctCount: 0 },
};

const reset = () =>
  useUserStore.setState({
    userInfo: null,
    isLoggedIn: false,
    isBootstrapping: true,
  });

describe("userStore", () => {
  beforeEach(reset);

  it("setUser 시 userInfo와 isLoggedIn이 설정된다", () => {
    useUserStore.getState().setUser(sample);
    expect(useUserStore.getState().isLoggedIn).toBe(true);
    expect(useUserStore.getState().userInfo?.nickname).toBe("히연");
  });

  it("logout 시 초기화된다", () => {
    useUserStore.getState().setUser(sample);
    useUserStore.getState().logout();
    expect(useUserStore.getState().isLoggedIn).toBe(false);
    expect(useUserStore.getState().userInfo).toBeNull();
  });

  it("setBootstrapping은 부팅 상태를 토글한다", () => {
    useUserStore.getState().setBootstrapping(false);
    expect(useUserStore.getState().isBootstrapping).toBe(false);
  });
});
