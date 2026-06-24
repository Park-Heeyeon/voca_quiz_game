import type { Word } from "@/shared/api/types";

export type Quiz = {
  word: string;
  answer: string;
  options: string[];
};

export type Rng = () => number;

const OPTION_DISTRACTOR_COUNT = 2;

const pickIndex = (length: number, rng: Rng): number =>
  Math.floor(rng() * length);

const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const generateQuiz = (
  words: Word[],
  rng: Rng = Math.random
): Quiz | null => {
  if (words.length === 0) return null;

  const target = words[pickIndex(words.length, rng)];
  const answer = target.meaning;

  const distractors = shuffle(
    Array.from(new Set(words.map((w) => w.meaning))).filter(
      (m) => m !== answer
    ),
    rng
  ).slice(0, OPTION_DISTRACTOR_COUNT);

  const options = shuffle([answer, ...distractors], rng);

  return { word: target.word, answer, options };
};
