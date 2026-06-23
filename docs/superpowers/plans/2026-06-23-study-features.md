# 학습 기능 확장 Implementation Plan (오답노트·복습·스트릭·영속화)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오답노트·복습 모드·스트릭/일일목표를 추가하고, 모든 학습 데이터를 MSW mock 백엔드를 통해 사용자별로 localStorage에 영속화한다(새로고침 시 자동 로그인 복원 포함).

**Architecture:** mock 백엔드(`mocks/db.ts`)가 단일 출처가 되어 localStorage에 영속화하고 토큰 기반 세션을 발급한다. 클라이언트는 axios 인터셉터로 토큰을 첨부하고, 진행/오답/복습/스트릭을 모두 API로 처리한다. 스트릭·일일목표 판정은 `shared/lib/study.ts` 순수함수로 분리해 단위 테스트한다.

**Tech Stack:** React 18, TypeScript, Vite, MSW, Zustand, TanStack Query, axios, Vitest.

## Global Constraints

- 주석은 한국어, 코드 윗줄, 인라인/번호/이모지 금지.
- `pnpm build`·`pnpm lint`·`pnpm test` 무오류 통과. tsconfig `strict`, `noUnusedLocals`, `noUnusedParameters`.
- 경로 별칭 `@/*`→`src/*`. 패키지 매니저 pnpm.
- 불필요한 useMemo/useCallback/React.memo 금지.
- 매직넘버 금지: 일일목표는 `DAILY_GOAL`(=10) 단일 출처. 레벨 상수는 기존 `LEVEL_CONFIG`.
- 복습은 레벨 진행(level/levelRate)에 영향 없음. 일일목표 카운트는 메인 퀴즈 정답만 증가. 복습 정답은 스트릭만 갱신.
- 커밋 메시지 `타입: 설명`.
- 기존 기능(회원가입/로그인/로그아웃/레벨별 퀴즈/레벨업/모달/디자인) 동작 유지.

## 확정 타입 (전 태스크 공유)

```ts
// shared/api/types.ts 에 추가
export type WrongAnswer = { word: string; meaning: string; level: number; missCount: number };
export type Streak = { current: number; lastActiveDate: string | null };
export type Daily = { date: string; correctCount: number };
export type SessionUser = {
  nickname: string; id: string; level: number; levelRate: number;
  streak: Streak; daily: Daily;
};
export type LoginResponse = { user: SessionUser; token: string };
export type ProgressResponse = { user: SessionUser; dailyGoalReached: boolean };
export type ReviewAnswerResponse = { user: SessionUser; wrongAnswers: WrongAnswer[] };
```

## File Structure

```
src/
  shared/lib/study.ts            # (신규) 스트릭/일일 순수함수 (+ study.test.ts)
  shared/api/types.ts            # (수정) 위 타입 추가
  shared/api/client.ts           # (수정) 토큰 인터셉터 + 토큰 저장 헬퍼
  shared/store/userStore.ts      # (수정) SessionUser·setUser·logout·isBootstrapping (+ test 수정)
  mocks/db.ts                    # (수정) ServerUser·localStorage 영속화·토큰·study CRUD
  mocks/handlers.ts              # (수정) /login·/me·/progress·/wrong-answers·/review/answer
  features/auth/api/auth.ts      # (수정) requestLogin(LoginResponse)·requestMe·signup·logout
  features/auth/hooks/useSessionBootstrap.ts  # (신규) 부팅 시 /me 복원
  features/auth/components/LoginModal.tsx      # (수정) 토큰 저장 + setUser
  features/quiz/api/quiz.ts      # (수정) postProgress·postWrongAnswer 추가
  features/quiz/hooks/useQuiz.tsx# (수정) /progress·/wrong-answers 연동, 일일목표 축하
  features/quiz/components/AnswerModal.tsx     # (수정) dailyGoalReached 배너
  features/review/api/review.ts        # (신규) getWrongAnswers·submitReviewAnswer
  features/review/hooks/useWrongAnswers.ts   # (신규) React Query
  features/review/hooks/useReview.tsx        # (신규) 복습 퀴즈 상태
  features/review/components/ReviewPage.tsx  # (신규)
  features/review/index.ts             # (신규) 배럴
  features/home/components/UserHome.tsx# (수정) 스트릭/일일/복습 버튼 + 로그아웃 토큰 정리
  app/App.tsx                    # (수정) /review 라우트 + 부팅 스플래시
```

---

## Task 1: study 도메인 순수함수 (TDD)

**Files:**
- Create: `src/shared/lib/study.ts`
- Test: `src/shared/lib/study.test.ts`

**Interfaces:**
- Consumes: `Streak`, `Daily` (Task 2에서 타입 추가 전이므로 여기서는 인라인 구조 사용 — 아래 구현은 타입 import 없이 동작).
- Produces: `DAILY_GOAL`, `toDateKey`, `isYesterday`, `resetDailyIfNeeded`, `registerDailyCorrect`, `applyStudyDay`, `isDailyGoalMet`.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/lib/study.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  DAILY_GOAL,
  toDateKey,
  isYesterday,
  resetDailyIfNeeded,
  registerDailyCorrect,
  applyStudyDay,
  isDailyGoalMet,
} from "./study";

describe("study 도메인", () => {
  it("toDateKey는 로컬 YYYY-MM-DD를 반환한다", () => {
    expect(toDateKey(new Date(2026, 5, 23))).toBe("2026-06-23");
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("isYesterday는 하루 전이면 true", () => {
    expect(isYesterday("2026-06-22", "2026-06-23")).toBe(true);
    expect(isYesterday("2026-06-21", "2026-06-23")).toBe(false);
    expect(isYesterday("2026-03-01", "2026-03-02")).toBe(true);
  });

  describe("resetDailyIfNeeded", () => {
    it("같은 날이면 그대로 둔다", () => {
      const d = { date: "2026-06-23", correctCount: 4 };
      expect(resetDailyIfNeeded(d, "2026-06-23")).toEqual(d);
    });
    it("날짜가 바뀌면 0으로 리셋한다", () => {
      expect(
        resetDailyIfNeeded({ date: "2026-06-22", correctCount: 9 }, "2026-06-23")
      ).toEqual({ date: "2026-06-23", correctCount: 0 });
    });
  });

  describe("registerDailyCorrect", () => {
    it("같은 날이면 +1", () => {
      expect(
        registerDailyCorrect({ date: "2026-06-23", correctCount: 4 }, "2026-06-23")
      ).toEqual({ date: "2026-06-23", correctCount: 5 });
    });
    it("새 날이면 리셋 후 1", () => {
      expect(
        registerDailyCorrect({ date: "2026-06-22", correctCount: 9 }, "2026-06-23")
      ).toEqual({ date: "2026-06-23", correctCount: 1 });
    });
  });

  describe("applyStudyDay", () => {
    it("오늘 이미 활동했으면 변화 없음", () => {
      const s = { current: 3, lastActiveDate: "2026-06-23" };
      expect(applyStudyDay(s, "2026-06-23")).toEqual(s);
    });
    it("어제 활동했으면 +1", () => {
      expect(
        applyStudyDay({ current: 3, lastActiveDate: "2026-06-22" }, "2026-06-23")
      ).toEqual({ current: 4, lastActiveDate: "2026-06-23" });
    });
    it("공백이 있으면 1로 리셋", () => {
      expect(
        applyStudyDay({ current: 5, lastActiveDate: "2026-06-20" }, "2026-06-23")
      ).toEqual({ current: 1, lastActiveDate: "2026-06-23" });
    });
    it("최초 활동이면 1", () => {
      expect(
        applyStudyDay({ current: 0, lastActiveDate: null }, "2026-06-23")
      ).toEqual({ current: 1, lastActiveDate: "2026-06-23" });
    });
  });

  describe("isDailyGoalMet", () => {
    it("경계값", () => {
      expect(isDailyGoalMet({ date: "x", correctCount: DAILY_GOAL - 1 })).toBe(false);
      expect(isDailyGoalMet({ date: "x", correctCount: DAILY_GOAL })).toBe(true);
      expect(isDailyGoalMet({ date: "x", correctCount: DAILY_GOAL + 1 })).toBe(true);
    });
  });

  it("DAILY_GOAL 값", () => {
    expect(DAILY_GOAL).toBe(10);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run src/shared/lib/study.test.ts`
Expected: FAIL — `study.ts` 없음.

- [ ] **Step 3: 구현**

`src/shared/lib/study.ts`:

```ts
export const DAILY_GOAL = 10;

type Daily = { date: string; correctCount: number };
type Streak = { current: number; lastActiveDate: string | null };

export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const fromDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isYesterday = (prevKey: string, todayKey: string): boolean => {
  const prevDay = fromDateKey(todayKey);
  prevDay.setDate(prevDay.getDate() - 1);
  return toDateKey(prevDay) === prevKey;
};

export const resetDailyIfNeeded = (daily: Daily, todayKey: string): Daily =>
  daily.date === todayKey ? daily : { date: todayKey, correctCount: 0 };

export const registerDailyCorrect = (daily: Daily, todayKey: string): Daily => {
  const base = resetDailyIfNeeded(daily, todayKey);
  return { date: todayKey, correctCount: base.correctCount + 1 };
};

export const applyStudyDay = (streak: Streak, todayKey: string): Streak => {
  if (streak.lastActiveDate === todayKey) return streak;
  if (streak.lastActiveDate && isYesterday(streak.lastActiveDate, todayKey)) {
    return { current: streak.current + 1, lastActiveDate: todayKey };
  }
  return { current: 1, lastActiveDate: todayKey };
};

export const isDailyGoalMet = (daily: Daily): boolean =>
  daily.correctCount >= DAILY_GOAL;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run src/shared/lib/study.test.ts`
Expected: PASS (전체 케이스).

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/study.ts src/shared/lib/study.test.ts
git commit -m "feat: 스트릭·일일목표 도메인 순수함수 추가 (TDD)"
```

---

## Task 2: 공유 타입 + 토큰 인터셉터

**Files:**
- Modify: `src/shared/api/types.ts`
- Modify: `src/shared/api/client.ts`

**Interfaces:**
- Produces: `WrongAnswer`, `Streak`, `Daily`, `SessionUser`, `LoginResponse`, `ProgressResponse`, `ReviewAnswerResponse` (types). `api`, `getStoredToken`, `setStoredToken`, `clearStoredToken`.

- [ ] **Step 1: 타입 추가**

`src/shared/api/types.ts` 끝에 추가:

```ts
export type WrongAnswer = {
  word: string;
  meaning: string;
  level: number;
  missCount: number;
};

export type Streak = { current: number; lastActiveDate: string | null };

export type Daily = { date: string; correctCount: number };

export type SessionUser = {
  nickname: string;
  id: string;
  level: number;
  levelRate: number;
  streak: Streak;
  daily: Daily;
};

export type LoginResponse = { user: SessionUser; token: string };

export type ProgressResponse = { user: SessionUser; dailyGoalReached: boolean };

export type ReviewAnswerResponse = {
  user: SessionUser;
  wrongAnswers: WrongAnswer[];
};
```

- [ ] **Step 2: 토큰 인터셉터 + 저장 헬퍼**

`src/shared/api/client.ts` 전체 교체:

```ts
import axios from "axios";

const TOKEN_KEY = "vocaquiz_token";

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearStoredToken = (): void =>
  localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] **Step 3: 타입체크**

Run: `pnpm exec tsc -b`
Expected: 에러 없음(기존 코드 영향 없음).

- [ ] **Step 4: Commit**

```bash
git add src/shared/api/types.ts src/shared/api/client.ts
git commit -m "feat: 학습 데이터 타입 및 토큰 인터셉터 추가"
```

---

## Task 3: mock 백엔드 영속화 + 세션 + study CRUD

**Files:**
- Modify: `src/mocks/db.ts`

**Interfaces:**
- Consumes: `WrongAnswer`, `SessionUser` (types).
- Produces:
  - `type ServerUser` (export)
  - `findUserByCredentials(id, password): ServerUser | undefined`
  - `isNicknameTaken(nickname): boolean`, `isIdTaken(id): boolean`
  - `addUser(input: { nickname; id; password }): ServerUser`
  - `findUserByToken(token): ServerUser | undefined`
  - `persist(): void`
  - `toSessionUser(u: ServerUser): SessionUser`

- [ ] **Step 1: db.ts 전체 교체**

`src/mocks/db.ts`:

```ts
import type { SessionUser, WrongAnswer } from "@/shared/api/types";
import { toDateKey } from "@/shared/lib/study";

export type ServerUser = {
  nickname: string;
  id: string;
  password: string;
  token: string | null;
  level: number;
  levelRate: number;
  wrongAnswers: WrongAnswer[];
  streak: { current: number; lastActiveDate: string | null };
  daily: { date: string; correctCount: number };
};

const STORAGE_KEY = "vocaquiz_db";

const createSeed = (): ServerUser[] => [
  {
    nickname: "테스터",
    id: "test1234",
    password: "Test1234!",
    token: null,
    level: 1,
    levelRate: 0,
    wrongAnswers: [],
    streak: { current: 0, lastActiveDate: null },
    daily: { date: toDateKey(new Date()), correctCount: 0 },
  },
];

const load = (): ServerUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ServerUser[];
  } catch (error) {
    console.warn("vocaquiz db 로드 실패, 시드로 폴백", error);
  }
  return createSeed();
};

let users: ServerUser[] = load();

export const persist = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.warn("vocaquiz db 저장 실패", error);
  }
};

export const findUserByCredentials = (
  id: string,
  password: string
): ServerUser | undefined =>
  users.find((u) => u.id === id && u.password === password);

export const isNicknameTaken = (nickname: string): boolean =>
  users.some((u) => u.nickname === nickname);

export const isIdTaken = (id: string): boolean =>
  users.some((u) => u.id === id);

export const findUserByToken = (token: string): ServerUser | undefined =>
  users.find((u) => u.token === token);

export const addUser = (input: {
  nickname: string;
  id: string;
  password: string;
}): ServerUser => {
  const user: ServerUser = {
    nickname: input.nickname,
    id: input.id,
    password: input.password,
    token: null,
    level: 1,
    levelRate: 0,
    wrongAnswers: [],
    streak: { current: 0, lastActiveDate: null },
    daily: { date: toDateKey(new Date()), correctCount: 0 },
  };
  users.push(user);
  persist();
  return user;
};

export const toSessionUser = (u: ServerUser): SessionUser => ({
  nickname: u.nickname,
  id: u.id,
  level: u.level,
  levelRate: u.levelRate,
  streak: u.streak,
  daily: u.daily,
});
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc -b`
Expected: `handlers.ts`에서 기존 `addUser`/`User` 사용 관련 에러 발생(Task 4에서 해소). db.ts 자체 에러는 없어야 함.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/db.ts
git commit -m "feat: mock 백엔드 localStorage 영속화·세션·학습 데이터 추가"
```

---

## Task 4: mock 핸들러 엔드포인트

**Files:**
- Modify: `src/mocks/handlers.ts`

**Interfaces:**
- Consumes: db.ts exports, `study.ts` 함수들, types.
- Produces: 엔드포인트 `/signup`, `/login`, `/logout`, `/me`, `/word`, `/progress`, `/wrong-answers`(GET/POST), `/review/answer`.

- [ ] **Step 1: handlers.ts 전체 교체**

`src/mocks/handlers.ts`:

```ts
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
```

- [ ] **Step 2: 타입체크/린트**

Run: `pnpm exec tsc -b && pnpm exec eslint src/mocks/handlers.ts`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "feat: 진행·오답·복습·세션 mock 엔드포인트 추가"
```

---

## Task 5: userStore를 SessionUser 기반으로 전환

**Files:**
- Modify: `src/shared/store/userStore.ts`
- Modify: `src/shared/store/userStore.test.ts`

**Interfaces:**
- Consumes: `SessionUser` (types).
- Produces: `useUserStore` with `{ userInfo: SessionUser | null; isLoggedIn: boolean; isBootstrapping: boolean; setUser(u: SessionUser): void; logout(): void; setBootstrapping(v: boolean): void }`.

- [ ] **Step 1: 테스트 수정(실패 상태)**

`src/shared/store/userStore.test.ts` 전체 교체:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "./userStore";
import type { SessionUser } from "@/shared/api/types";

const sample: SessionUser = {
  nickname: "히연",
  id: "heeyeon",
  level: 1,
  levelRate: 0,
  streak: { current: 0, lastActiveDate: null },
  daily: { date: "2026-06-23", correctCount: 0 },
};

const reset = () =>
  useUserStore.setState({
    userInfo: null,
    isLoggedIn: false,
    isBootstrapping: true,
  });

describe("userStore", () => {
  beforeEach(reset);

  it("setUser 시 userInfo와 isLoggedIn이 설정된다", () => {
    useUserStore.getState().setUser(sample);
    expect(useUserStore.getState().isLoggedIn).toBe(true);
    expect(useUserStore.getState().userInfo?.nickname).toBe("히연");
  });

  it("logout 시 초기화된다", () => {
    useUserStore.getState().setUser(sample);
    useUserStore.getState().logout();
    expect(useUserStore.getState().isLoggedIn).toBe(false);
    expect(useUserStore.getState().userInfo).toBeNull();
  });

  it("setBootstrapping은 부팅 상태를 토글한다", () => {
    useUserStore.getState().setBootstrapping(false);
    expect(useUserStore.getState().isBootstrapping).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run src/shared/store/userStore.test.ts`
Expected: FAIL — `setUser`/`setBootstrapping` 없음.

- [ ] **Step 3: userStore 구현**

`src/shared/store/userStore.ts` 전체 교체:

```ts
import { create } from "zustand";
import type { SessionUser } from "@/shared/api/types";

type UserState = {
  userInfo: SessionUser | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  setUser: (user: SessionUser) => void;
  logout: () => void;
  setBootstrapping: (value: boolean) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  isBootstrapping: true,
  setUser: (user) => set({ userInfo: user, isLoggedIn: true }),
  logout: () => set({ userInfo: null, isLoggedIn: false }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run src/shared/store/userStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/store/userStore.ts src/shared/store/userStore.test.ts
git commit -m "refactor: userStore를 SessionUser·부팅 상태 기반으로 전환"
```

---

## Task 6: auth API + 세션 복원 + 로그인 토큰 저장

**Files:**
- Modify: `src/features/auth/api/auth.ts`
- Create: `src/features/auth/hooks/useSessionBootstrap.ts`
- Modify: `src/features/auth/components/LoginModal.tsx`
- Modify: `src/features/auth/index.ts`

**Interfaces:**
- Consumes: `api`, `setStoredToken`, `clearStoredToken`, `getStoredToken`, types, `useUserStore`.
- Produces:
  - `requestSignUp(input): Promise<SessionUser>`
  - `requestLogin(input): Promise<LoginResponse>`
  - `requestLogout(): Promise<void>`
  - `requestMe(): Promise<SessionUser>`
  - `useSessionBootstrap(): void`

- [ ] **Step 1: auth API 교체**

`src/features/auth/api/auth.ts` 전체 교체:

```ts
import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  LoginInput,
  LoginResponse,
  SessionUser,
  SignUpInput,
} from "@/shared/api/types";

export const requestSignUp = async (
  input: SignUpInput
): Promise<SessionUser> => {
  const { data } = await api.post<ApiResponse<SessionUser>>("/signup", input);
  return data.data;
};

export const requestLogin = async (
  input: LoginInput
): Promise<LoginResponse> => {
  const { data } = await api.post<ApiResponse<LoginResponse>>("/login", input);
  return data.data;
};

export const requestLogout = async (): Promise<void> => {
  await api.post("/logout");
};

export const requestMe = async (): Promise<SessionUser> => {
  const { data } = await api.get<ApiResponse<SessionUser>>("/me");
  return data.data;
};
```

- [ ] **Step 2: 세션 복원 훅**

`src/features/auth/hooks/useSessionBootstrap.ts`:

```ts
import { useEffect } from "react";
import { getStoredToken, clearStoredToken } from "@/shared/api/client";
import { useUserStore } from "@/shared/store/userStore";
import { requestMe } from "../api/auth";

export const useSessionBootstrap = (): void => {
  const setUser = useUserStore((s) => s.setUser);
  const setBootstrapping = useUserStore((s) => s.setBootstrapping);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }
    requestMe()
      .then((user) => setUser(user))
      .catch(() => clearStoredToken())
      .finally(() => setBootstrapping(false));
  }, [setUser, setBootstrapping]);
};
```

- [ ] **Step 3: LoginModal 토큰 저장 + setUser**

`src/features/auth/components/LoginModal.tsx`의 import에서 `useUserStore`의 `login` 사용을 `setUser`로 바꾸고 토큰 저장을 추가한다.

import 블록의 store 사용 라인을 다음으로 교체:

```tsx
import { setStoredToken } from "@/shared/api/client";
import { useUserStore } from "@/shared/store/userStore";
```

컴포넌트 내부 `const login = useUserStore((s) => s.login);` 를 다음으로 교체:

```tsx
const setUser = useUserStore((s) => s.setUser);
```

`onSuccess` 콜백을 다음으로 교체:

```tsx
        onSuccess: (res) => {
          setStoredToken(res.token);
          setUser(res.user);
          closeAllModal();
          navigate("/");
        },
```

- [ ] **Step 4: auth 배럴에 추가**

`src/features/auth/index.ts` 전체 교체:

```ts
export { default as LoginModal } from "./components/LoginModal";
export { default as SignUpForm } from "./components/SignUpForm";
export { useAuth } from "./hooks/useAuth";
export { useSessionBootstrap } from "./hooks/useSessionBootstrap";
```

- [ ] **Step 5: 타입체크**

Run: `pnpm exec tsc -b`
Expected: `useQuiz`/`UserHome`에서 기존 `login`/`updateProgress` 사용 에러(Task 7·9에서 해소). auth 파일 자체 에러 없음.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth
git commit -m "feat: 세션 복원 훅 및 로그인 토큰 저장 추가"
```

---

## Task 7: 퀴즈 제출을 서버 연동으로 전환

**Files:**
- Modify: `src/features/quiz/api/quiz.ts`
- Modify: `src/features/quiz/hooks/useQuiz.tsx`
- Modify: `src/features/quiz/components/AnswerModal.tsx`

**Interfaces:**
- Consumes: `api`, types, `getNextProgress`, `isAtFinalProgress`, `generateQuiz`, `useUserStore.setUser`, `useQueryClient`.
- Produces:
  - `postProgress(level, levelRate): Promise<ProgressResponse>`
  - `postWrongAnswer(input: { word; meaning; level }): Promise<WrongAnswer[]>`
  - `AnswerModal` prop `dailyGoalReached?: boolean`.

- [ ] **Step 1: quiz API 추가**

`src/features/quiz/api/quiz.ts` 전체 교체:

```ts
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
```

- [ ] **Step 2: useQuiz 교체**

`src/features/quiz/hooks/useQuiz.tsx` 전체 교체:

```tsx
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getWordLevel, postProgress, postWrongAnswer } from "../api/quiz";
import { generateQuiz, type Quiz } from "../lib/generateQuiz";
import { getNextProgress, isAtFinalProgress } from "../lib/level";
import { useUserStore } from "@/shared/store/userStore";
import useModal from "@/shared/lib/useModal";
import AnswerModal from "../components/AnswerModal";

export const useQuiz = () => {
  const userInfo = useUserStore((s) => s.userInfo);
  const setUser = useUserStore((s) => s.setUser);
  const level = userInfo?.level ?? 1;
  const levelRate = userInfo?.levelRate ?? 0;

  const { openModal } = useModal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const {
    data: words,
    isFetched,
    isLoading,
  } = useQuery({
    queryKey: ["wordLevel", level],
    queryFn: () => getWordLevel(level),
    enabled: !!userInfo,
  });

  const next = () => {
    if (words) setQuiz(generateQuiz(words));
  };

  useEffect(() => {
    if (isFetched && words) setQuiz(generateQuiz(words));
  }, [isFetched, words]);

  const submit = (option: string) => {
    if (!quiz) return;

    if (option !== quiz.answer) {
      postWrongAnswer({ word: quiz.word, meaning: quiz.answer, level })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["wrongAnswers"] })
        )
        .catch((error) => console.warn("오답 기록 실패", error));
      openModal({ type: "custom", content: <AnswerModal isAnswer={false} /> });
      return;
    }

    if (isAtFinalProgress(level, levelRate)) {
      openModal({
        content: "정답이지만, 레벨3 이후의 서비스는 준비중이에요😢💧",
        clickEvent: () => navigate("/"),
      });
      return;
    }

    const nextProgress = getNextProgress(level, levelRate);
    postProgress(nextProgress.level, nextProgress.levelRate)
      .then((res) => {
        setUser(res.user);
        const leveledUp = res.user.level > level;
        openModal({
          type: "custom",
          content: (
            <AnswerModal
              isAnswer
              isLevelUp={leveledUp}
              level={res.user.level}
              levelRate={res.user.levelRate}
              dailyGoalReached={res.dailyGoalReached}
            />
          ),
          clickEvent: next,
        });
      })
      .catch((error) => console.warn("진행 저장 실패", error));
  };

  return { quiz, isLoading, submit, level, levelRate };
};
```

- [ ] **Step 3: AnswerModal에 일일목표 배너 추가**

`src/features/quiz/components/AnswerModal.tsx`에서 props 인터페이스와 정답 영역을 수정한다.

props 인터페이스를 다음으로 교체:

```tsx
interface AnswerModalProps {
  isAnswer: boolean;
  isLevelUp?: boolean;
  level?: number;
  levelRate?: number;
  dailyGoalReached?: boolean;
  clickEvent?: () => void;
}
```

구조 분해에 `dailyGoalReached = false` 추가:

```tsx
const AnswerModal: React.FC<AnswerModalProps> = ({
  isAnswer,
  isLevelUp = false,
  level = 1,
  levelRate = 0,
  dailyGoalReached = false,
  clickEvent,
}) => {
```

정답 메시지 `<p>` 블록 바로 아래(닫는 `)}` 다음, 버튼 위)에 배너를 추가:

```tsx
      {isAnswer && dailyGoalReached && (
        <div className="mt-3 rounded-2xl bg-amber/20 text-ink font-semibold py-2 px-3 text-sm">
          🔥 오늘의 목표를 달성했어요!
        </div>
      )}
```

- [ ] **Step 4: 타입체크/린트**

Run: `pnpm exec tsc -b && pnpm exec eslint src/features/quiz`
Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add src/features/quiz
git commit -m "feat: 퀴즈 제출을 서버 진행·오답 API로 연동"
```

---

## Task 8: 복습 피처

**Files:**
- Create: `src/features/review/api/review.ts`
- Create: `src/features/review/hooks/useWrongAnswers.ts`
- Create: `src/features/review/hooks/useReview.tsx`
- Create: `src/features/review/components/ReviewPage.tsx`
- Create: `src/features/review/index.ts`

**Interfaces:**
- Consumes: `api`, types, `generateQuiz`, `useUserStore`, `useModal`, `Button`/`Card`/`WordCard`/`ProgressBar` (ui), `AnswerModal`(quiz).
- Produces:
  - `getWrongAnswers(): Promise<WrongAnswer[]>`
  - `submitReviewAnswer(word, correct): Promise<ReviewAnswerResponse>`
  - `useWrongAnswers()` (React Query)
  - `useReview()` 복습 퀴즈 상태
  - `ReviewPage`

- [ ] **Step 1: review API**

`src/features/review/api/review.ts`:

```ts
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
```

- [ ] **Step 2: useWrongAnswers (React Query)**

`src/features/review/hooks/useWrongAnswers.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { getWrongAnswers } from "../api/review";
import { useUserStore } from "@/shared/store/userStore";

export const useWrongAnswers = () => {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  return useQuery({
    queryKey: ["wrongAnswers"],
    queryFn: getWrongAnswers,
    enabled: isLoggedIn,
  });
};
```

- [ ] **Step 3: useReview (복습 퀴즈 상태)**

`src/features/review/hooks/useReview.tsx`:

```tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWrongAnswers } from "./useWrongAnswers";
import { submitReviewAnswer } from "../api/review";
import { generateQuiz, type Quiz } from "@/features/quiz/lib/generateQuiz";
import { useUserStore } from "@/shared/store/userStore";
import useModal from "@/shared/lib/useModal";
import AnswerModal from "@/features/quiz/components/AnswerModal";
import type { Word } from "@/shared/api/types";

export const useReview = () => {
  const { data: wrongAnswers = [], isLoading } = useWrongAnswers();
  const setUser = useUserStore((s) => s.setUser);
  const { openModal } = useModal();
  const queryClient = useQueryClient();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [started, setStarted] = useState(false);

  const toWords = (): Word[] =>
    wrongAnswers.map((w) => ({ word: w.word, meaning: w.meaning }));

  const loadNext = (pool: Word[]) => {
    setQuiz(generateQuiz(pool));
  };

  const start = () => {
    setStarted(true);
    loadNext(toWords());
  };

  const submit = (option: string) => {
    if (!quiz) return;
    const correct = option === quiz.answer;

    submitReviewAnswer(quiz.word, correct)
      .then((res) => {
        setUser(res.user);
        queryClient.setQueryData(["wrongAnswers"], res.wrongAnswers);
        if (correct) {
          const remaining: Word[] = res.wrongAnswers.map((w) => ({
            word: w.word,
            meaning: w.meaning,
          }));
          openModal({
            type: "custom",
            content: <AnswerModal isAnswer />,
            clickEvent: () => loadNext(remaining),
          });
        } else {
          openModal({ type: "custom", content: <AnswerModal isAnswer={false} /> });
        }
      })
      .catch((error) => console.warn("복습 결과 저장 실패", error));
  };

  return {
    wrongAnswers,
    isLoading,
    started,
    quiz,
    start,
    submit,
    remainingCount: wrongAnswers.length,
  };
};
```

- [ ] **Step 4: ReviewPage**

`src/features/review/components/ReviewPage.tsx`:

```tsx
import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useReview } from "../hooks/useReview";
import { Button, Card, WordCard } from "@/shared/ui";

const OPTION_LABELS = ["A", "B", "C"];

const ReviewPage = () => {
  const navigate = useNavigate();
  const { isLoading, started, quiz, start, submit, wrongAnswers } = useReview();

  return (
    <div className="min-h-screen flex flex-col mx-auto w-full max-w-md px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          aria-label="홈으로"
          onClick={() => navigate("/")}
          className="grid place-items-center w-10 h-10 rounded-full bg-white border border-line text-ink-soft hover:text-ink transition"
        >
          <AiOutlineLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink">오답 복습</h1>
      </div>

      {isLoading ? null : !started ? (
        wrongAnswers.length === 0 ? (
          <Card className="text-center mt-10">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-ink">복습할 오답이 없어요!</p>
            <p className="text-sm text-ink-soft mt-1">
              퀴즈를 풀며 단어를 모아보세요.
            </p>
            <Button className="w-full mt-6" onClick={() => navigate("/quiz")}>
              퀴즈 풀러 가기
            </Button>
          </Card>
        ) : (
          <Card>
            <p className="font-semibold text-ink mb-4">
              틀린 단어 {wrongAnswers.length}개
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {wrongAnswers.map((w) => (
                <li
                  key={w.word}
                  className="flex items-center justify-between rounded-2xl bg-cloud px-4 py-3"
                >
                  <span className="font-display font-semibold text-ink">
                    {w.word}
                  </span>
                  <span className="text-sm text-ink-soft">{w.meaning}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={start}>
              복습 시작하기
            </Button>
          </Card>
        )
      ) : quiz ? (
        <motion.div
          key={quiz.word}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-7"
        >
          <WordCard word={quiz.word} tag="복습 — 이 단어의 뜻은?" />
          <div className="flex flex-col gap-3">
            {quiz.options.map((option, index) => (
              <Button
                key={option}
                variant="secondary"
                size="lg"
                className="w-full justify-start gap-3 font-semibold"
                onClick={() => submit(option)}
              >
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-soft text-brand text-sm font-bold">
                  {OPTION_LABELS[index]}
                </span>
                {option}
              </Button>
            ))}
          </div>
        </motion.div>
      ) : (
        <Card className="text-center mt-10">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold text-ink">복습 완료!</p>
          <p className="text-sm text-ink-soft mt-1">오답을 모두 맞혔어요.</p>
          <Button className="w-full mt-6" onClick={() => navigate("/")}>
            홈으로
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ReviewPage;
```

- [ ] **Step 5: 배럴**

`src/features/review/index.ts`:

```ts
export { default as ReviewPage } from "./components/ReviewPage";
export { useWrongAnswers } from "./hooks/useWrongAnswers";
```

- [ ] **Step 6: 타입체크/린트**

Run: `pnpm exec tsc -b && pnpm exec eslint src/features/review`
Expected: 에러 없음.

- [ ] **Step 7: Commit**

```bash
git add src/features/review
git commit -m "feat: 오답노트 기반 복습 피처 추가"
```

---

## Task 9: 홈 대시보드에 스트릭·일일목표·복습 진입점

**Files:**
- Modify: `src/features/home/components/UserHome.tsx`

**Interfaces:**
- Consumes: `useUserStore`, `useAuth`, `clearStoredToken`, `useWrongAnswers`(review), `DAILY_GOAL`(study), ui 컴포넌트.

- [ ] **Step 1: UserHome 교체**

`src/features/home/components/UserHome.tsx` 전체 교체:

```tsx
import { useNavigate } from "react-router-dom";
import { Button, Card, LevelBadge, ProgressBar } from "@/shared/ui";
import { useUserStore } from "@/shared/store/userStore";
import { useAuth } from "@/features/auth";
import { useWrongAnswers } from "@/features/review";
import { clearStoredToken } from "@/shared/api/client";
import { getRemainingRate } from "@/features/quiz/lib/level";
import { DAILY_GOAL } from "@/shared/lib/study";

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = useUserStore((s) => s.userInfo);
  const storeLogout = useUserStore((s) => s.logout);
  const { logoutMutation } = useAuth();
  const { data: wrongAnswers = [] } = useWrongAnswers();

  if (!userInfo) return null;
  const { nickname, level, levelRate, streak, daily } = userInfo;
  const remaining = getRemainingRate(levelRate);
  const dailyPct = Math.min((daily.correctCount / DAILY_GOAL) * 100, 100);

  const onLogout = () =>
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearStoredToken();
        storeLogout();
      },
    });

  return (
    <div className="flex flex-col pt-14 pb-10 px-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ink-soft text-sm">반가워요</p>
          <h1 className="font-display font-bold text-2xl text-ink">
            {nickname} 님 👋
          </h1>
        </div>
        <LevelBadge level={level} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card className="p-5">
          <p className="text-sm text-ink-soft">연속 학습</p>
          <p className="font-display font-bold text-3xl text-ink mt-1">
            🔥 {streak.current}
            <span className="text-base text-ink-soft">일</span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">오늘 목표</p>
          <p className="font-display font-bold text-3xl text-mint mt-1">
            {daily.correctCount}
            <span className="text-base text-ink-soft">/{DAILY_GOAL}</span>
          </p>
        </Card>
      </div>

      <Card className="mt-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-semibold text-ink">레벨 진행률</span>
          <span className="font-display font-bold text-2xl text-brand">
            {levelRate}
            <span className="text-base text-ink-soft">%</span>
          </span>
        </div>
        <ProgressBar value={levelRate} />
        <p className="mt-3 text-sm text-ink-soft">
          다음 레벨까지 <span className="font-bold text-coral">{remaining}%</span>{" "}
          남았어요.
        </p>
        <p className="mt-1 text-xs text-ink-soft">오늘 목표 {dailyPct}% 달성</p>
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate("/quiz")}>
          퀴즈 시작하기
        </Button>
        {wrongAnswers.length > 0 && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate("/review")}
          >
            복습하기 ({wrongAnswers.length})
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={onLogout}>
          오늘은 그만할래요
        </Button>
      </div>
    </div>
  );
};

export default UserHome;
```

- [ ] **Step 2: 타입체크/린트**

Run: `pnpm exec tsc -b && pnpm exec eslint src/features/home`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/features/home
git commit -m "feat: 홈에 스트릭·일일목표·복습 진입점 추가"
```

---

## Task 10: app 와이어링 (라우트 + 부팅 스플래시) + 전체 검증

**Files:**
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `useUserStore`, `useSessionBootstrap`(auth), `ReviewPage`(review), `Logo`(ui).

- [ ] **Step 1: App.tsx 교체**

`src/app/App.tsx` 전체 교체:

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useUserStore } from "@/shared/store/userStore";
import { useSessionBootstrap } from "@/features/auth";
import HomePage from "@/pages/HomePage";
import SignUpPage from "@/pages/SignUpPage";
import { QuizPage } from "@/features/quiz";
import { ReviewPage } from "@/features/review";
import { Logo } from "@/shared/ui";

const App: React.FC = () => {
  useSessionBootstrap();
  const isBootstrapping = useUserStore((s) => s.isBootstrapping);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse">
          <Logo />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/signup"
        element={isLoggedIn ? <Navigate to="/" /> : <SignUpPage />}
      />
      <Route
        path="/quiz"
        element={isLoggedIn ? <QuizPage /> : <Navigate to="/" />}
      />
      <Route
        path="/review"
        element={isLoggedIn ? <ReviewPage /> : <Navigate to="/" />}
      />
    </Routes>
  );
};

export default App;
```

- [ ] **Step 2: 전체 검증**

Run:
```bash
pnpm exec tsc -b && pnpm lint && pnpm test && pnpm build
```
Expected: 모두 무오류. 단위 테스트 통과(study 추가분 포함). 미사용 import/변수 0.

남은 타입/미사용 오류가 있으면 이 단계에서 해소.

- [ ] **Step 3: Commit**

```bash
git add src/app
git commit -m "feat: /review 라우트 및 세션 부팅 스플래시 와이어링"
```

---

## Task 11: README 갱신 + 최종 검증

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README에 기능 추가 반영**

`README.md`의 핵심 기능/아키텍처 섹션에 다음을 추가:
- 학습 데이터 영속화(MSW + localStorage), 새로고침 자동 로그인 복원
- 오답노트 + 복습 모드(`/review`)
- 스트릭/일일목표(`shared/lib/study.ts` 순수함수 + 단위 테스트)

테스트 계정 안내는 유지. 테스트 목록에 `study.test.ts` 추가 기술.

- [ ] **Step 2: 수동 동작 확인 (dev)**

Run: `pnpm dev`
확인: `test1234 / Test1234!` 로그인 → 새로고침해도 로그인/진행 유지 → 일부러 오답 → 홈 "복습하기 (N)" 노출 → `/review`에서 정답 시 목록에서 제거 → 정답 누적 시 일일목표 배너/스트릭 증가.

- [ ] **Step 3: 최종 검증 재실행**

Run: `pnpm exec tsc -b && pnpm lint && pnpm test && pnpm build`
Expected: 모두 PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: 학습 기능 확장 반영해 README 갱신"
```

---

## Self-Review

**Spec coverage:**
- F0 영속화(localStorage) + 세션 복원: Task 3(db)·4(/me·로그인 토큰)·2(인터셉터)·6(부트스트랩)·10(스플래시) ✓
- F1 오답노트: Task 4(/wrong-answers)·7(오답 기록) ✓
- F2 복습 모드(레벨 분리): Task 4(/review/answer)·8(review 피처) ✓
- F4 스트릭/일일목표: Task 1(study 순수함수)·4(progress 갱신)·7(축하 배너)·9(홈 표시) ✓
- 도메인 순수함수 단위 테스트: Task 1 ✓
- 답안 흐름(서버 도메인 로직, 복습은 스트릭만): Task 4·7·8 ✓
- 에러 처리(401 토큰 정리/조용한 로깅/localStorage 폴백): Task 3(폴백)·6(401 토큰 제거)·7·8(console.warn) ✓
- 성공 기준(build/lint/test): Task 10·11 ✓

**Placeholder scan:** 모든 코드 단계에 실제 코드 포함. TBD/TODO 없음.

**Type consistency:** `SessionUser`/`WrongAnswer`/`LoginResponse`/`ProgressResponse`/`ReviewAnswerResponse`/`ServerUser`/`setUser`/`isBootstrapping`/`DAILY_GOAL`/`applyStudyDay`/`registerDailyCorrect`/`resetDailyIfNeeded`/`isDailyGoalMet`/`postProgress`/`postWrongAnswer`/`submitReviewAnswer`/`getWrongAnswers`/`requestMe`/`useWrongAnswers` 명칭 전 태스크 일관 ✓

**비범위 준수:** F3 단어장·F5 타이머·SRS·실제 백엔드 제외 ✓
