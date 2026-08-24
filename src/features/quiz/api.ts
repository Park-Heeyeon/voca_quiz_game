import { get, post } from "@/shared/api/client";
import { UserProfileType } from "@/shared/api/types";
import { VocaListType } from "./types";

export const getWordLevel = (level: number) =>
  get<VocaListType[]>("/word", { params: { level } });

export const getProgress = (correct: boolean) =>
  post<UserProfileType>("/progress", { correct });
