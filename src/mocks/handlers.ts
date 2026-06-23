import { http, HttpResponse } from "msw";
import mockData from "./mockData.json";
import {
  addUser,
  findUserByCredentials,
  isIdTaken,
  isNicknameTaken,
} from "./db";
import type {
  LoginInput,
  PublicUser,
  SignUpInput,
  Word,
} from "@/shared/api/types";

const ok = <T>(data: T) =>
  HttpResponse.json({ code: "OK", status: 200, data });

const signUpHandler = http.post("/api/signup", async ({ request }) => {
  const { nickname, id, password } = (await request.json()) as SignUpInput;

  if (isNicknameTaken(nickname)) {
    return HttpResponse.json(
      { code: "DUPLICATE_NICKNAME", message: "중복된 닉네임이에요." },
      { status: 409 }
    );
  }
  if (isIdTaken(id)) {
    return HttpResponse.json(
      { code: "DUPLICATE_ID", message: "중복된 아이디에요." },
      { status: 409 }
    );
  }

  const user = addUser({ nickname, id, password, level: 1, levelRate: 0 });
  const publicUser: PublicUser = {
    nickname: user.nickname,
    id: user.id,
    level: user.level,
    levelRate: user.levelRate,
  };
  return ok(publicUser);
});

const loginHandler = http.post("/api/login", async ({ request }) => {
  const { id, password } = (await request.json()) as LoginInput;
  const user = findUserByCredentials(id, password);

  if (!user) {
    return HttpResponse.json(
      {
        code: "INVALID_CREDENTIALS",
        message: "아이디 또는 비밀번호가 일치하지 않습니다.",
      },
      { status: 401 }
    );
  }
  return ok(user);
});

const logoutHandler = http.post("/api/logout", () => ok(null));

const WORDS_BY_LEVEL: Record<number, Word[]> = {
  1: mockData.oneLevelWords,
  2: mockData.twoLevelWords,
  3: mockData.threeLevelWords,
};

const wordHandler = http.get("/api/word", ({ request }) => {
  const level = Number(new URL(request.url).searchParams.get("level"));
  const words = WORDS_BY_LEVEL[level];

  if (!words) {
    return HttpResponse.json(
      { code: "INVALID_LEVEL", message: "Invalid level" },
      { status: 400 }
    );
  }
  return ok(words);
});

export const handlers = [
  signUpHandler,
  loginHandler,
  logoutHandler,
  wordHandler,
];
