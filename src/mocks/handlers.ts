import { http, HttpResponse } from "msw";
import mockData from "./mockData.json";
import {
  addUser,
  advance,
  clearToken,
  findById,
  findByNickname,
  findByToken,
  issueToken,
  toProfile,
} from "./db";

const ok = <T>(data?: T) =>
  HttpResponse.json({ code: "OK", status: 200, data });

const fail = (code: string, message: string, status: number) =>
  HttpResponse.json({ code, message }, { status });

const unauthorized = () => fail("UNAUTHORIZED", "인증이 필요합니다.", 401);

const authUser = (request: Request) => {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return undefined;
  return findByToken(auth.slice(7));
};

const signUpHandler = http.post("/api/signup", async ({ request }) => {
  const { nickname, id, password } = (await request.json()) as {
    nickname: string;
    id: string;
    password: string;
  };

  if (!nickname || !id || !password) {
    return fail("INVALID_BODY", "필수값이 누락되었어요.", 400);
  }
  if (findByNickname(nickname)) {
    return fail("DUPLICATE_NICKNAME", "중복된 닉네임이에요.", 409);
  }
  if (findById(id)) {
    return fail("DUPLICATE_ID", "중복된 아이디에요.", 409);
  }

  return ok(toProfile(addUser(nickname, id, password)));
});

const loginHandler = http.post("/api/login", async ({ request }) => {
  const { id, password } = (await request.json()) as {
    id: string;
    password: string;
  };

  if (!id || !password) {
    return fail("INVALID_BODY", "필수값이 누락되었어요.", 400);
  }

  const user = findById(id);
  if (!user || user.password !== password) {
    return fail(
      "INVALID_CREDENTIALS",
      "아이디 또는 비밀번호가 일치하지 않습니다.",
      401
    );
  }

  return ok({ user: toProfile(user), token: issueToken(user) });
});

const logoutHandler = http.post("/api/logout", ({ request }) => {
  const user = authUser(request);
  if (user) clearToken(user);

  return ok();
});

const meHandler = http.get("/api/me", ({ request }) => {
  const user = authUser(request);
  if (!user) return unauthorized();

  return ok(toProfile(user));
});

// 정답 여부만 받고 레벨 계산은 서버가 한다.
const progressHandler = http.post("/api/progress", async ({ request }) => {
  const user = authUser(request);
  if (!user) return unauthorized();

  const { correct } = (await request.json()) as { correct: boolean };
  if (correct) advance(user);

  return ok(toProfile(user));
});

const WORDS_BY_LEVEL = {
  1: mockData.oneLevelWords,
  2: mockData.twoLevelWords,
  3: mockData.threeLevelWords,
} as const;

const wordHandler = http.get("/api/word", ({ request }) => {
  const level = Number(new URL(request.url).searchParams.get("level"));
  const words = WORDS_BY_LEVEL[level as keyof typeof WORDS_BY_LEVEL];

  if (!words) return fail("INVALID_LEVEL", "Invalid level", 400);

  return ok(words);
});

export const handlers = [
  signUpHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  progressHandler,
  wordHandler,
];
