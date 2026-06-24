import { describe, it, expect } from "vitest";
import { generateQuiz } from "./generateQuiz";
import type { Word } from "@/shared/api/types";

const words: Word[] = [
  { word: "apple", meaning: "사과" },
  { word: "ball", meaning: "공" },
  { word: "cat", meaning: "고양이" },
  { word: "dog", meaning: "개" },
];

describe("generateQuiz", () => {
  it("단어 목록이 비면 null을 반환한다", () => {
    expect(generateQuiz([])).toBeNull();
  });

  it("보기는 정확히 3개이고 중복이 없다", () => {
    const quiz = generateQuiz(words, () => 0);
    expect(quiz).not.toBeNull();
    expect(quiz!.options).toHaveLength(3);
    expect(new Set(quiz!.options).size).toBe(3);
  });

  it("보기에 정답이 반드시 포함된다", () => {
    const quiz = generateQuiz(words, () => 0);
    expect(quiz!.options).toContain(quiz!.answer);
  });

  it("rng=0이면 첫 단어가 선택된다", () => {
    const quiz = generateQuiz(words, () => 0);
    expect(quiz!.word).toBe("apple");
    expect(quiz!.answer).toBe("사과");
  });

  it("rng 주입 시 동일 입력에 동일 출력 (결정성)", () => {
    const rngA = makeSeq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    const rngB = makeSeq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(generateQuiz(words, rngA)).toEqual(generateQuiz(words, rngB));
  });

  it("단어가 1개뿐이면 보기도 정답 1개만 된다", () => {
    const quiz = generateQuiz([{ word: "apple", meaning: "사과" }], () => 0);
    expect(quiz!.options).toEqual(["사과"]);
  });

  it("뜻이 중복된 단어는 오답 보기에서 중복 제거된다", () => {
    const dup: Word[] = [
      { word: "apple", meaning: "사과" },
      { word: "apple2", meaning: "사과" },
      { word: "ball", meaning: "공" },
    ];
    const quiz = generateQuiz(dup, () => 0);
    expect(new Set(quiz!.options).size).toBe(quiz!.options.length);
  });
});

function makeSeq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}
