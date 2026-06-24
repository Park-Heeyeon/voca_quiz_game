import { describe, it, expect } from "vitest";
import {
  DAILY_GOAL,
  toDateKey,
  isYesterday,
  resetDailyIfNeeded,
  registerDailyCorrect,
  applyStudyDay,
  isDailyGoalMet,
} from "./study";

describe("study 도메인", () => {
  it("toDateKey는 로컬 YYYY-MM-DD를 반환한다", () => {
    expect(toDateKey(new Date(2026, 5, 23))).toBe("2026-06-23");
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("isYesterday는 하루 전이면 true", () => {
    expect(isYesterday("2026-06-22", "2026-06-23")).toBe(true);
    expect(isYesterday("2026-06-21", "2026-06-23")).toBe(false);
    expect(isYesterday("2026-03-01", "2026-03-02")).toBe(true);
  });

  describe("resetDailyIfNeeded", () => {
    it("같은 날이면 그대로 둔다", () => {
      const d = { date: "2026-06-23", correctCount: 4 };
      expect(resetDailyIfNeeded(d, "2026-06-23")).toEqual(d);
    });
    it("날짜가 바뀌면 0으로 리셋한다", () => {
      expect(
        resetDailyIfNeeded({ date: "2026-06-22", correctCount: 9 }, "2026-06-23")
      ).toEqual({ date: "2026-06-23", correctCount: 0 });
    });
  });

  describe("registerDailyCorrect", () => {
    it("같은 날이면 +1", () => {
      expect(
        registerDailyCorrect(
          { date: "2026-06-23", correctCount: 4 },
          "2026-06-23"
        )
      ).toEqual({ date: "2026-06-23", correctCount: 5 });
    });
    it("새 날이면 리셋 후 1", () => {
      expect(
        registerDailyCorrect(
          { date: "2026-06-22", correctCount: 9 },
          "2026-06-23"
        )
      ).toEqual({ date: "2026-06-23", correctCount: 1 });
    });
  });

  describe("applyStudyDay", () => {
    it("오늘 이미 활동했으면 변화 없음", () => {
      const s = { current: 3, lastActiveDate: "2026-06-23" };
      expect(applyStudyDay(s, "2026-06-23")).toEqual(s);
    });
    it("어제 활동했으면 +1", () => {
      expect(
        applyStudyDay({ current: 3, lastActiveDate: "2026-06-22" }, "2026-06-23")
      ).toEqual({ current: 4, lastActiveDate: "2026-06-23" });
    });
    it("공백이 있으면 1로 리셋", () => {
      expect(
        applyStudyDay({ current: 5, lastActiveDate: "2026-06-20" }, "2026-06-23")
      ).toEqual({ current: 1, lastActiveDate: "2026-06-23" });
    });
    it("최초 활동이면 1", () => {
      expect(
        applyStudyDay({ current: 0, lastActiveDate: null }, "2026-06-23")
      ).toEqual({ current: 1, lastActiveDate: "2026-06-23" });
    });
  });

  describe("isDailyGoalMet", () => {
    it("경계값", () => {
      expect(isDailyGoalMet({ date: "x", correctCount: DAILY_GOAL - 1 })).toBe(
        false
      );
      expect(isDailyGoalMet({ date: "x", correctCount: DAILY_GOAL })).toBe(true);
      expect(isDailyGoalMet({ date: "x", correctCount: DAILY_GOAL + 1 })).toBe(
        true
      );
    });
  });

  it("DAILY_GOAL 값", () => {
    expect(DAILY_GOAL).toBe(10);
  });
});
