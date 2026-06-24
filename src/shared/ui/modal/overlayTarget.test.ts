import { describe, it, expect } from "vitest";
import { isOverlayTarget } from "./overlayTarget";

describe("isOverlayTarget", () => {
  it("모달이 하나면 그 모달이 오버레이 대상이다", () => {
    expect(isOverlayTarget(0, 1)).toBe(true);
  });

  it("여러 개면 맨 위(마지막) 모달만 오버레이 대상이다", () => {
    expect(isOverlayTarget(0, 2)).toBe(false);
    expect(isOverlayTarget(1, 2)).toBe(true);
  });

  it("아래에 깔린 모달은 오버레이 대상이 아니다", () => {
    expect(isOverlayTarget(0, 3)).toBe(false);
    expect(isOverlayTarget(1, 3)).toBe(false);
    expect(isOverlayTarget(2, 3)).toBe(true);
  });
});
