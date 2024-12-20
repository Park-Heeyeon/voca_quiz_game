import { UserInfoStateType } from "@/types";
import { atom } from "recoil";

export const userInfoState = atom<UserInfoStateType>({
  key: "userInfoState",
  default: { nickname: "", id: "", password: "", level: 1, levelRate: 0 },
});
