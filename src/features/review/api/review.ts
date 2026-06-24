import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  ReviewAnswerResponse,
  WrongAnswer,
} from "@/shared/api/types";

export const getWrongAnswers = async (): Promise<WrongAnswer[]> => {
  const { data } = await api.get<ApiResponse<WrongAnswer[]>>("/wrong-answers");
  return data.data;
};

export const submitReviewAnswer = async (
  word: string,
  correct: boolean
): Promise<ReviewAnswerResponse> => {
  const { data } = await api.post<ApiResponse<ReviewAnswerResponse>>(
    "/review/answer",
    { word, correct }
  );
  return data.data;
};
