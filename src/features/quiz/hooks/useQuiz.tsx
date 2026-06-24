import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getWordLevel, postProgress, postWrongAnswer } from "../api/quiz";
import { generateQuiz, type Quiz } from "../lib/generateQuiz";
import { getNextProgress, isAtFinalProgress } from "../lib/level";
import { useUserStore } from "@/shared/store/userStore";
import useModal from "@/shared/lib/useModal";
import AnswerModal from "../components/AnswerModal";

export const useQuiz = () => {
  const userInfo = useUserStore((s) => s.userInfo);
  const setUser = useUserStore((s) => s.setUser);
  const level = userInfo?.level ?? 1;
  const levelRate = userInfo?.levelRate ?? 0;

  const { openModal } = useModal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      postWrongAnswer({ word: quiz.word, meaning: quiz.answer, level })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["wrongAnswers"] })
        )
        .catch((error) => console.warn("오답 기록 실패", error));
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
    postProgress(nextProgress.level, nextProgress.levelRate)
      .then((res) => {
        setUser(res.user);
        const leveledUp = res.user.level > level;
        openModal({
          type: "custom",
          content: (
            <AnswerModal
              isAnswer
              isLevelUp={leveledUp}
              level={res.user.level}
              levelRate={res.user.levelRate}
              dailyGoalReached={res.dailyGoalReached}
            />
          ),
          clickEvent: next,
        });
      })
      .catch((error) => console.warn("진행 저장 실패", error));
  };

  return { quiz, isLoading, submit, level, levelRate };
};
