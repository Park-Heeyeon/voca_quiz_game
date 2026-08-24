import { UserProfileType } from "@/types";
import { atom } from "recoil";

export const userInfoState = atom<UserProfileType>({
  key: "userInfoState",
  default: { nickname: "", id: "", level: 1, levelRate: 0 },
});
