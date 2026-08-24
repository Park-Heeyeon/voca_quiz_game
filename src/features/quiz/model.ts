import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useUserInfo from "@/shared/lib/hooks/useUserInfo";
import { getWordLevel, getProgress } from "./api";
import { QuizType, VocaListType } from "./types";

const OPTION_COUNT = 3;
const MAX_LEVEL = 3;
const MAX_LEVEL_RATE = 90;

// 정답 하나에 서로 다른 오답 두 개를 섞어 보기를 만든다.
const pickQuiz = (vocaList: VocaListType[]): QuizType => {
  const { word, meaning: answer } =
    vocaList[Math.floor(Math.random() * vocaList.length)];

  const wrongMeanings = Array.from(
    new Set(vocaList.map((voca) => voca.meaning))
  )
    .filter((meaning) => meaning !== answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, OPTION_COUNT - 1);

  return {
    word,
    answer,
    options: [answer, ...wrongMeanings].sort(() => Math.random() - 0.5)
  };
};

export const useQuiz = () => {
  const { data: userInfo } = useUserInfo();
  const level = userInfo?.level ?? 1;
  const levelRate = userInfo?.levelRate ?? 0;

  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const queryClient = useQueryClient();

  const { data: vocaList } = useQuery({
    queryKey: ["wordLevel", level],
    queryFn: () => getWordLevel(level)
  });

  const nextQuiz = () => {
    if (vocaList?.length) setQuiz(pickQuiz(vocaList));
  };

  useEffect(() => {
    if (vocaList?.length) setQuiz(pickQuiz(vocaList));
  }, [vocaList]);

  // 최대 레벨의 최대 진행률에서는 더 올릴 것이 없다.
  const isMaxed = level >= MAX_LEVEL && levelRate >= MAX_LEVEL_RATE;

  const progressMutation = useMutation({
    mutationFn: getProgress,
    onSuccess: (profile) => queryClient.setQueryData(["me"], profile)
  });

  const submitAnswer = async (option: string) => {
    if (option !== quiz?.answer) return { correct: false, isMaxed: false };
    if (isMaxed) return { correct: true, isMaxed: true };

    await progressMutation.mutateAsync(true);
    return { correct: true, isMaxed: false };
  };

  return {
    quiz,
    level,
    levelRate,
    nextQuiz,
    submitAnswer,
    isSubmitting: progressMutation.isPending
  };
};
