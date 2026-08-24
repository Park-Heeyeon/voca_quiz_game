import { get } from "./client";
import { UserProfileType } from "./types";

export const getUserInfo = () => get<UserProfileType>("/me");
