import { http, HttpResponse } from "msw";
import { v4 as uuidv4 } from "uuid";
import mockData from "./mockData.json";
import {
  addUser,
  findUserByCredentials,
  findUserByToken,
  isIdTaken,
  isNicknameTaken,
  persist,
  toSessionUser,
  type ServerUser,
} from "./db";
import {
  applyStudyDay,
  isDailyGoalMet,
  registerDailyCorrect,
  resetDailyIfNeeded,
  toDateKey,
} from "@/shared/lib/study";
import type { LoginInput, SignUpInput, Word } from "@/shared/api/types";

const ok = <T>(data: T) =>
  HttpResponse.json({ code: "OK", status: 200, data });

const unauthorized = () =>
  HttpResponse.json(
    { code: "UNAUTHORIZED", message: "인증이 필요합니다." },
    { status: 401 }
  );

const getToken = (request: Request): string | null => {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
};

const authUser = (request: Request): ServerUser | undefined => {
  const token = getToken(request);
  return token ? findUserByToken(token) : undefined;
};

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
  const user = addUser({ nickname, id, password });
  return ok(toSessionUser(user));
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
  user.token = uuidv4();
  persist();
  return ok({ user: toSessionUser(user), token: user.token });
});

const logoutHandler = http.post("/api/logout", ({ request }) => {
  const user = authUser(request);
  if (user) {
    user.token = null;
    persist();
  }
  return ok(null);
});

const meHandler = http.get("/api/me", ({ request }) => {
  const user = authUser(request);
  if (!user) return unauthorized();
  const today = toDateKey(new Date());
  user.daily = resetDailyIfNeeded(user.daily, today);
  persist();
  return ok(toSessionUser(user));
});

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

const progressHandler = http.post("/api/progress", async ({ request }) => {
  const user = authUser(request);
  if (!user) return unauthorized();
  const { level, levelRate } = (await request.json()) as {
    level: number;
    levelRate: number;
  };
  const today = toDateKey(new Date());

  user.level = level;
  user.levelRate = levelRate;
  user.streak = applyStudyDay(user.streak, today);

  const before = isDailyGoalMet(resetDailyIfNeeded(user.daily, today));
  user.daily = registerDailyCorrect(user.daily, today);
  const dailyGoalReached = !before && isDailyGoalMet(user.daily);

  persist();
  return ok({ user: toSessionUser(user), dailyGoalReached });
});

const getWrongAnswersHandler = http.get("/api/wrong-answers", ({ request }) => {
  const user = authUser(request);
  if (!user) return unauthorized();
  return ok(user.wrongAnswers);
});

const addWrongAnswerHandler = http.post(
  "/api/wrong-answers",
  async ({ request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();
    const { word, meaning, level } = (await request.json()) as {
      word: string;
      meaning: string;
      level: number;
    };
    const existing = user.wrongAnswers.find((w) => w.word === word);
    if (existing) {
      existing.missCount += 1;
    } else {
      user.wrongAnswers.push({ word, meaning, level, missCount: 1 });
    }
    persist();
    return ok(user.wrongAnswers);
  }
);

const reviewAnswerHandler = http.post(
  "/api/review/answer",
  async ({ request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();
    const { word, correct } = (await request.json()) as {
      word: string;
      correct: boolean;
    };
    if (correct) {
      user.wrongAnswers = user.wrongAnswers.filter((w) => w.word !== word);
      user.streak = applyStudyDay(user.streak, toDateKey(new Date()));
    } else {
      const existing = user.wrongAnswers.find((w) => w.word === word);
      if (existing) existing.missCount += 1;
    }
    persist();
    return ok({ user: toSessionUser(user), wrongAnswers: user.wrongAnswers });
  }
);

export const handlers = [
  signUpHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  wordHandler,
  progressHandler,
  getWrongAnswersHandler,
  addWrongAnswerHandler,
  reviewAnswerHandler,
];
