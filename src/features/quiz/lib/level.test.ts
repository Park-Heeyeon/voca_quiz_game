import { describe, it, expect } from "vitest";
import {
  LEVEL_CONFIG,
  getNextProgress,
  isMaxLevel,
  isAtFinalProgress,
  getRemainingRate,
} from "./level";

describe("level 도메인", () => {
  describe("getNextProgress", () => {
    it("일반 진행 시 levelRate가 rateStep만큼 증가한다", () => {
      expect(getNextProgress(1, 0)).toEqual({ level: 1, levelRate: 10 });
      expect(getNextProgress(1, 50)).toEqual({ level: 1, levelRate: 60 });
    });

    it("maxRate(90)에서 정답 시 레벨업하고 levelRate가 0이 된다", () => {
      expect(getNextProgress(1, 90)).toEqual({ level: 2, levelRate: 0 });
      expect(getNextProgress(2, 90)).toEqual({ level: 3, levelRate: 0 });
    });

    it("최대 레벨의 최대 진행률에서는 더 이상 진행하지 않는다", () => {
      expect(getNextProgress(3, 90)).toEqual({ level: 3, levelRate: 90 });
    });
  });

  describe("isMaxLevel", () => {
    it("maxLevel이면 true", () => {
      expect(isMaxLevel(3)).toBe(true);
      expect(isMaxLevel(2)).toBe(false);
    });
  });

  describe("isAtFinalProgress", () => {
    it("레벨3 & 90%에서만 true", () => {
      expect(isAtFinalProgress(3, 90)).toBe(true);
      expect(isAtFinalProgress(3, 80)).toBe(false);
      expect(isAtFinalProgress(2, 90)).toBe(false);
    });
  });

  describe("getRemainingRate", () => {
    it("100에서 현재 진행률을 뺀다", () => {
      expect(getRemainingRate(0)).toBe(100);
      expect(getRemainingRate(90)).toBe(10);
    });
  });

  it("LEVEL_CONFIG 상수값", () => {
    expect(LEVEL_CONFIG).toEqual({ maxLevel: 3, rateStep: 10, maxRate: 90 });
  });
});
