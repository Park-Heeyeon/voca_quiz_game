import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWrongAnswers } from "./useWrongAnswers";
import { submitReviewAnswer } from "../api/review";
import { generateQuiz, type Quiz } from "@/features/quiz/lib/generateQuiz";
import { useUserStore } from "@/shared/store/userStore";
import useModal from "@/shared/lib/useModal";
import AnswerModal from "@/features/quiz/components/AnswerModal";
import type { Word } from "@/shared/api/types";

export const useReview = () => {
  const { data: wrongAnswers = [], isLoading } = useWrongAnswers();
  const setUser = useUserStore((s) => s.setUser);
  const { openModal } = useModal();
  const queryClient = useQueryClient();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [started, setStarted] = useState(false);

  const toWords = (): Word[] =>
    wrongAnswers.map((w) => ({ word: w.word, meaning: w.meaning }));

  const loadNext = (pool: Word[]) => {
    setQuiz(generateQuiz(pool));
  };

  const start = () => {
    setStarted(true);
    loadNext(toWords());
  };

  const submit = (option: string) => {
    if (!quiz) return;
    const correct = option === quiz.answer;

    submitReviewAnswer(quiz.word, correct)
      .then((res) => {
        setUser(res.user);
        queryClient.setQueryData(["wrongAnswers"], res.wrongAnswers);
        if (correct) {
          const remaining: Word[] = res.wrongAnswers.map((w) => ({
            word: w.word,
            meaning: w.meaning,
          }));
          openModal({
            type: "custom",
            content: <AnswerModal isAnswer />,
            clickEvent: () => loadNext(remaining),
          });
        } else {
          openModal({
            type: "custom",
            content: <AnswerModal isAnswer={false} />,
          });
        }
      })
      .catch((error) => console.warn("복습 결과 저장 실패", error));
  };

  return {
    wrongAnswers,
    isLoading,
    started,
    quiz,
    start,
    submit,
    remainingCount: wrongAnswers.length,
  };
};
