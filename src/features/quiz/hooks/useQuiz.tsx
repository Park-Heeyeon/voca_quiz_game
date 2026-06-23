import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getWordLevel } from "../api/quiz";
import { generateQuiz, type Quiz } from "../lib/generateQuiz";
import { getNextProgress, isAtFinalProgress } from "../lib/level";
import { useUserStore } from "@/shared/store/userStore";
import useModal from "@/shared/lib/useModal";
import AnswerModal from "../components/AnswerModal";

export const useQuiz = () => {
  const userInfo = useUserStore((s) => s.userInfo);
  const updateProgress = useUserStore((s) => s.updateProgress);
  const level = userInfo?.level ?? 1;
  const levelRate = userInfo?.levelRate ?? 0;

  const { openModal } = useModal();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const {
    data: words,
    isFetched,
    isLoading,
  } = useQuery({
    queryKey: ["wordLevel", level],
    queryFn: () => getWordLevel(level),
    enabled: !!userInfo,
  });

  const next = () => {
    if (words) setQuiz(generateQuiz(words));
  };

  useEffect(() => {
    if (isFetched && words) setQuiz(generateQuiz(words));
  }, [isFetched, words]);

  const submit = (option: string) => {
    if (!quiz) return;

    if (option !== quiz.answer) {
      openModal({ type: "custom", content: <AnswerModal isAnswer={false} /> });
      return;
    }

    if (isAtFinalProgress(level, levelRate)) {
      openModal({
        content: "정답이지만, 레벨3 이후의 서비스는 준비중이에요😢💧",
        clickEvent: () => navigate("/"),
      });
      return;
    }

    const nextProgress = getNextProgress(level, levelRate);
    const leveledUp = nextProgress.level > level;
    updateProgress(nextProgress.level, nextProgress.levelRate);

    openModal({
      type: "custom",
      content: (
        <AnswerModal
          isAnswer
          isLevelUp={leveledUp}
          level={nextProgress.level}
          levelRate={nextProgress.levelRate}
        />
      ),
      clickEvent: next,
    });
  };

  return { quiz, isLoading, submit, level, levelRate };
};
