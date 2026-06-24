import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  ProgressResponse,
  Word,
  WrongAnswer,
} from "@/shared/api/types";

export const getWordLevel = async (level: number): Promise<Word[]> => {
  const { data } = await api.get<ApiResponse<Word[]>>("/word", {
    params: { level },
  });
  return data.data;
};

export const postProgress = async (
  level: number,
  levelRate: number
): Promise<ProgressResponse> => {
  const { data } = await api.post<ApiResponse<ProgressResponse>>("/progress", {
    level,
    levelRate,
  });
  return data.data;
};

export const postWrongAnswer = async (input: {
  word: string;
  meaning: string;
  level: number;
}): Promise<WrongAnswer[]> => {
  const { data } = await api.post<ApiResponse<WrongAnswer[]>>(
    "/wrong-answers",
    input
  );
  return data.data;
};
