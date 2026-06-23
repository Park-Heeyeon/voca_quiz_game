import { api } from "@/shared/api/client";
import type { ApiResponse, Word } from "@/shared/api/types";

export const getWordLevel = async (level: number): Promise<Word[]> => {
  const { data } = await api.get<ApiResponse<Word[]>>("/word", {
    params: { level },
  });
  return data.data;
};
