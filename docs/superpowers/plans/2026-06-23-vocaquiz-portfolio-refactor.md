# VocaQuizGame 포트폴리오 리팩토링 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단어 퀴즈 게임을 피처 기반 구조 + 도메인 로직 분리 + Zustand + 게임형 디자인 시스템 + 순수함수 단위 테스트로 전면 리팩토링한다.

**Architecture:** 타입 기반 폴더(`atom/`, `components/`, `pages/`, `types/`)를 `app/ · features/{auth,home,quiz} · shared/{ui,store,api,lib} · mocks/`로 재편한다. 레벨/진행률·퀴즈 생성 도메인 로직을 React 무관 순수함수로 추출해 Vitest로 검증하고, 인증 자격 검증을 컴포넌트에서 MSW 인메모리 mock 백엔드로 옮긴다. 상태관리는 Recoil → Zustand로 교체한다.

**Tech Stack:** React 18, TypeScript, Vite, React Router 6, TanStack Query, React Hook Form + Zod, MSW, Zustand, Tailwind + CVA, framer-motion, react-canvas-confetti, Vitest + Testing Library.

## Global Constraints

- 모든 신규/수정 코드 주석은 한국어, 코드 윗줄 작성, 인라인 주석 금지, 번호·이모지 금지.
- `pnpm build`(= `tsc -b && vite build`)와 `pnpm lint`(eslint)가 무오류로 통과해야 한다.
- tsconfig는 `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` — 미사용 import/변수 금지.
- 경로 별칭 `@/*` → `src/*`, `@public/*` → `public/*` 유지.
- 패키지 매니저는 pnpm(9.15.0). 모든 설치/실행은 `pnpm`.
- 매직넘버 금지: 레벨 관련 상수(레벨당 10%p, 최대 90%, 최대 레벨 3)는 `LEVEL_CONFIG` 단일 출처에서만 정의.
- 불필요한 `useMemo`/`useCallback`/`React.memo` 금지(실측 성능 이슈가 있을 때만).
- 커밋 메시지 형식 `타입: 설명`(feat/fix/refactor/chore/test/docs/style 등).
- 기능 동작 보존: 회원가입 → 로그인 → 레벨별 퀴즈 → 정답 시 10%p 상승 → 90%에서 정답 시 레벨업(rate 0) → 레벨3 90%에서 정답 시 "준비중" 안내 → 로그아웃.

---

## File Structure

신규/이동/삭제 파일 맵. (이동은 `git mv` 후 내용 수정)

```
src/
  app/
    App.tsx                         # 라우팅 (기존 src/App.tsx 이동·수정)
    providers.tsx                   # QueryClient/Router/Modal 프로바이더 묶음 (신규)
    router.tsx                      # 라우트 정의 분리 (신규, 선택)
  features/
    auth/
      api/auth.ts                   # requestSignUp/Login/Logout (기존 src/api 일부 이동)
      hooks/useAuth.ts              # 로그인/회원가입/로그아웃 mutation (신규)
      components/LoginModal.tsx     # 이동·수정 (userList 직접조회 제거)
      components/SignUpForm.tsx     # 이동·수정 (중복검사 서버로 이동)
      schemas/signUpSchema.ts       # 이동 (기존 src/schemas/SignUpSchema.ts)
      index.ts                      # 배럴
    home/
      components/VisitorHome.tsx    # 이동·재디자인
      components/UserHome.tsx       # 이동·재디자인
      index.ts
    quiz/
      api/quiz.ts                   # getWordLevel (이동)
      lib/level.ts                  # 레벨 도메인 순수함수 (신규, TDD)
      lib/level.test.ts             # (신규, TDD)
      lib/generateQuiz.ts           # 퀴즈 생성 순수함수 (신규, TDD)
      lib/generateQuiz.test.ts      # (신규, TDD)
      hooks/useQuiz.ts              # 퀴즈 상태/제출 훅 (신규)
      components/QuizPage.tsx       # 프레젠테이션으로 축소 (이동·수정)
      components/AnswerModal.tsx    # 이동·수정 (props 기반으로 판정 제거)
      index.ts
  shared/
    ui/
      Button.tsx                    # CVA 3D 버튼 (커스텀+shadcn 통합)
      Card.tsx                      # 게임형 카드
      ProgressBar.tsx               # 진행률 바 (신규)
      LevelBadge.tsx                # 레벨 뱃지 (신규)
      Confetti.tsx                  # react-canvas-confetti 래퍼 (신규)
      InputField.tsx                # 이동
      index.ts
      primitives/                   # shadcn 원시 컴포넌트 (button/card/form/input/label 이동)
    store/
      userStore.ts                  # zustand: userInfo/isLoggedIn (신규)
      modalStore.ts                 # zustand: 모달 큐 (신규)
    api/
      client.ts                     # axios 인스턴스 (기존 src/api/index.ts 분리)
      types.ts                      # ApiResponse<T>, Word, User 등 (신규)
    lib/
      utils.ts                      # cn (이동 src/lib/utils.ts)
      useModal.ts                   # modalStore 래퍼 (이동·수정)
  mocks/
    db.ts                           # 인메모리 users 저장소 (신규)
    handlers.ts                     # 인증 자격검증 포함하도록 확장
    browser.ts                      # 유지
    mockData.json                   # 유지
  types/                            # 제거 (shared/api/types.ts 및 각 피처로 흡수)
  index.css                         # 유지·디자인 토큰 변수 갱신
  main.tsx                          # providers 사용하도록 수정
  vite-env.d.ts                     # 유지
```

삭제: `src/atom/*`, `src/components/ProfileBox.tsx`, `src/types/UserInfoType.ts`(미사용), 빈 배럴 정리.
의존성 제거: `recoil`, `recharts`, `flowbite-react`, `shadcn-ui`(런타임 불필요). 유지: `react-canvas-confetti`, `framer-motion`(디자인에 사용).
의존성 추가(dev): `zustand`(런타임), `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitest/coverage-v8`.

---

## Task 1: 테스트 도구 + 의존성 정리

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `tsconfig.app.json` (vitest 타입 인식)

**Interfaces:**
- Produces: `pnpm test` 스크립트, jsdom 환경, `@testing-library/jest-dom` matcher 전역 로드.

- [ ] **Step 1: 의존성 정리 및 추가**

```bash
pnpm remove recoil recharts flowbite-react shadcn-ui
pnpm add zustand
pnpm add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: vitest 설정 작성**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@public": path.resolve(__dirname, "./public"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: package.json 스크립트 추가**

`scripts`에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: tsconfig에 vitest 글로벌 타입 추가**

`tsconfig.app.json`의 `compilerOptions`에 `"types": ["vitest/globals", "@testing-library/jest-dom"]` 추가.

- [ ] **Step 5: 설치/타입 확인**

Run: `pnpm test --run` (테스트 0개라도 정상 종료) 및 `pnpm exec tsc -b`
Expected: 둘 다 에러 없이 종료.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Vitest 도입 및 미사용 의존성 정리"
```

---

## Task 2: 공유 타입 + API 클라이언트

**Files:**
- Create: `src/shared/api/types.ts`
- Create: `src/shared/api/client.ts`
- Create: `src/shared/lib/utils.ts` (기존 `src/lib/utils.ts` 이동)

**Interfaces:**
- Produces:
  - `type Word = { word: string; meaning: string }`
  - `type User = { nickname: string; id: string; password: string; level: number; levelRate: number }`
  - `type ApiResponse<T> = { code: string; status: number; data: T }`
  - `type LoginInput = { id: string; password: string }`
  - `type SignUpInput = { nickname: string; id: string; password: string }`
  - `const api`: axios 인스턴스
  - `cn(...inputs)` 유틸

- [ ] **Step 1: 공유 타입 정의**

`src/shared/api/types.ts`:

```ts
export type Word = {
  word: string;
  meaning: string;
};

export type User = {
  nickname: string;
  id: string;
  password: string;
  level: number;
  levelRate: number;
};

export type PublicUser = Omit<User, "password">;

export type ApiResponse<T> = {
  code: string;
  status: number;
  data: T;
};

export type LoginInput = {
  id: string;
  password: string;
};

export type SignUpInput = {
  nickname: string;
  id: string;
  password: string;
};
```

- [ ] **Step 2: axios 클라이언트 이동**

`src/shared/api/client.ts`:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_API_URL,
});
```

- [ ] **Step 3: cn 유틸 이동**

```bash
mkdir -p src/shared/lib
git mv src/lib/utils.ts src/shared/lib/utils.ts
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: 공유 API 타입·클라이언트·유틸을 shared 계층으로 분리"
```

---

## Task 3: 레벨 도메인 순수함수 (TDD)

**Files:**
- Create: `src/features/quiz/lib/level.ts`
- Test: `src/features/quiz/lib/level.test.ts`

**Interfaces:**
- Produces:
  - `const LEVEL_CONFIG = { maxLevel: 3, rateStep: 10, maxRate: 90 } as const`
  - `getNextProgress(level: number, levelRate: number): { level: number; levelRate: number }`
  - `isMaxLevel(level: number): boolean`
  - `isAtFinalProgress(level: number, levelRate: number): boolean` — 마지막 레벨의 마지막 진행률(레벨3 & 90%) 여부
  - `getRemainingRate(levelRate: number): number` — 다음 레벨까지 남은 %

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/quiz/lib/level.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  LEVEL_CONFIG,
  getNextProgress,
  isMaxLevel,
  isAtFinalProgress,
  getRemainingRate,
} from "./level";

describe("level 도메인", () => {
  describe("getNextProgress", () => {
    it("일반 진행 시 levelRate가 rateStep만큼 증가한다", () => {
      expect(getNextProgress(1, 0)).toEqual({ level: 1, levelRate: 10 });
      expect(getNextProgress(1, 50)).toEqual({ level: 1, levelRate: 60 });
    });

    it("maxRate(90)에서 정답 시 레벨업하고 levelRate가 0이 된다", () => {
      expect(getNextProgress(1, 90)).toEqual({ level: 2, levelRate: 0 });
      expect(getNextProgress(2, 90)).toEqual({ level: 3, levelRate: 0 });
    });

    it("최대 레벨의 최대 진행률에서는 더 이상 진행하지 않는다", () => {
      expect(getNextProgress(3, 90)).toEqual({ level: 3, levelRate: 90 });
    });
  });

  describe("isMaxLevel", () => {
    it("maxLevel이면 true", () => {
      expect(isMaxLevel(3)).toBe(true);
      expect(isMaxLevel(2)).toBe(false);
    });
  });

  describe("isAtFinalProgress", () => {
    it("레벨3 & 90%에서만 true", () => {
      expect(isAtFinalProgress(3, 90)).toBe(true);
      expect(isAtFinalProgress(3, 80)).toBe(false);
      expect(isAtFinalProgress(2, 90)).toBe(false);
    });
  });

  describe("getRemainingRate", () => {
    it("100에서 현재 진행률을 뺀다", () => {
      expect(getRemainingRate(0)).toBe(100);
      expect(getRemainingRate(90)).toBe(10);
    });
  });

  it("LEVEL_CONFIG 상수값", () => {
    expect(LEVEL_CONFIG).toEqual({ maxLevel: 3, rateStep: 10, maxRate: 90 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run src/features/quiz/lib/level.test.ts`
Expected: FAIL — `level.ts` 모듈 없음.

- [ ] **Step 3: 최소 구현**

`src/features/quiz/lib/level.ts`:

```ts
export const LEVEL_CONFIG = {
  maxLevel: 3,
  rateStep: 10,
  maxRate: 90,
} as const;

export const isMaxLevel = (level: number): boolean =>
  level >= LEVEL_CONFIG.maxLevel;

export const isAtFinalProgress = (level: number, levelRate: number): boolean =>
  isMaxLevel(level) && levelRate >= LEVEL_CONFIG.maxRate;

export const getRemainingRate = (levelRate: number): number =>
  100 - levelRate;

export const getNextProgress = (
  level: number,
  levelRate: number
): { level: number; levelRate: number } => {
  if (isAtFinalProgress(level, levelRate)) {
    return { level, levelRate };
  }

  if (levelRate >= LEVEL_CONFIG.maxRate) {
    return { level: level + 1, levelRate: 0 };
  }

  return { level, levelRate: levelRate + LEVEL_CONFIG.rateStep };
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run src/features/quiz/lib/level.test.ts`
Expected: PASS (모든 케이스).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 레벨 진행률 도메인 순수함수 추가 (TDD)"
```

---

## Task 4: 퀴즈 생성 순수함수 (TDD)

**Files:**
- Create: `src/features/quiz/lib/generateQuiz.ts`
- Test: `src/features/quiz/lib/generateQuiz.test.ts`

**Interfaces:**
- Consumes: `Word` (from `src/shared/api/types.ts`)
- Produces:
  - `type Quiz = { word: string; answer: string; options: string[] }`
  - `type Rng = () => number`
  - `generateQuiz(words: Word[], rng?: Rng): Quiz | null` — 단어 1개 랜덤 선택, 정답 뜻 + 서로 다른 오답 뜻 최대 2개 → 보기 셔플. 단어가 없으면 `null`. `rng`는 0~1 난수(기본 `Math.random`), 테스트에서 주입.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/quiz/lib/generateQuiz.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateQuiz } from "./generateQuiz";
import type { Word } from "@/shared/api/types";

const words: Word[] = [
  { word: "apple", meaning: "사과" },
  { word: "ball", meaning: "공" },
  { word: "cat", meaning: "고양이" },
  { word: "dog", meaning: "개" },
];

describe("generateQuiz", () => {
  it("단어 목록이 비면 null을 반환한다", () => {
    expect(generateQuiz([])).toBeNull();
  });

  it("보기는 정확히 3개이고 중복이 없다", () => {
    const quiz = generateQuiz(words, () => 0);
    expect(quiz).not.toBeNull();
    expect(quiz!.options).toHaveLength(3);
    expect(new Set(quiz!.options).size).toBe(3);
  });

  it("보기에 정답이 반드시 포함된다", () => {
    const quiz = generateQuiz(words, () => 0);
    expect(quiz!.options).toContain(quiz!.answer);
  });

  it("rng=0이면 첫 단어가 선택된다", () => {
    const quiz = generateQuiz(words, () => 0);
    expect(quiz!.word).toBe("apple");
    expect(quiz!.answer).toBe("사과");
  });

  it("rng 주입 시 동일 입력에 동일 출력 (결정성)", () => {
    const rngA = makeSeq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    const rngB = makeSeq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(generateQuiz(words, rngA)).toEqual(generateQuiz(words, rngB));
  });

  it("단어가 1개뿐이면 보기도 정답 1개만 된다", () => {
    const quiz = generateQuiz([{ word: "apple", meaning: "사과" }], () => 0);
    expect(quiz!.options).toEqual(["사과"]);
  });

  it("뜻이 중복된 단어는 오답 보기에서 중복 제거된다", () => {
    const dup: Word[] = [
      { word: "apple", meaning: "사과" },
      { word: "apple2", meaning: "사과" },
      { word: "ball", meaning: "공" },
    ];
    const quiz = generateQuiz(dup, () => 0);
    expect(new Set(quiz!.options).size).toBe(quiz!.options.length);
  });
});

function makeSeq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run src/features/quiz/lib/generateQuiz.test.ts`
Expected: FAIL — `generateQuiz.ts` 없음.

- [ ] **Step 3: 최소 구현**

`src/features/quiz/lib/generateQuiz.ts`:

```ts
import type { Word } from "@/shared/api/types";

export type Quiz = {
  word: string;
  answer: string;
  options: string[];
};

export type Rng = () => number;

const OPTION_DISTRACTOR_COUNT = 2;

const pickIndex = (length: number, rng: Rng): number =>
  Math.floor(rng() * length);

const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const generateQuiz = (
  words: Word[],
  rng: Rng = Math.random
): Quiz | null => {
  if (words.length === 0) return null;

  const target = words[pickIndex(words.length, rng)];
  const answer = target.meaning;

  const distractors = shuffle(
    Array.from(new Set(words.map((w) => w.meaning))).filter(
      (m) => m !== answer
    ),
    rng
  ).slice(0, OPTION_DISTRACTOR_COUNT);

  const options = shuffle([answer, ...distractors], rng);

  return { word: target.word, answer, options };
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run src/features/quiz/lib/generateQuiz.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 퀴즈 생성 순수함수 추가 (TDD, 주입 가능한 rng)"
```

---

## Task 5: Zustand 스토어 + useModal 래퍼

**Files:**
- Create: `src/shared/store/userStore.ts`
- Create: `src/shared/store/modalStore.ts`
- Create: `src/shared/lib/useModal.ts`
- Create: `src/shared/store/userStore.test.ts`

**Interfaces:**
- Consumes: `User` (types), `Quiz`/모달 타입
- Produces:
  - `useUserStore`: `{ userInfo: User | null; isLoggedIn: boolean; login(user: User): void; logout(): void; updateProgress(level: number, levelRate: number): void }`
  - `type ModalItem = { id: string; type?: "custom" | "confirm" | "login"; title?: string; content: string | ReactElement<{ clickEvent?: () => void }>; clickEvent?: () => void }`
  - `useModalStore`: `{ modals: ModalItem[]; open(modal): void; close(id?): void; closeAll(): void }`
  - `useModal()`: `{ openModal, closeModal, closeAllModal }` (modalStore 위 얇은 래퍼, 기존 인터페이스 보존)

- [ ] **Step 1: 실패하는 테스트 작성 (userStore)**

`src/shared/store/userStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "./userStore";

const reset = () =>
  useUserStore.setState({ userInfo: null, isLoggedIn: false });

describe("userStore", () => {
  beforeEach(reset);

  it("login 시 userInfo와 isLoggedIn이 설정된다", () => {
    useUserStore.getState().login({
      nickname: "히연",
      id: "heeyeon",
      password: "pw",
      level: 1,
      levelRate: 0,
    });
    expect(useUserStore.getState().isLoggedIn).toBe(true);
    expect(useUserStore.getState().userInfo?.nickname).toBe("히연");
  });

  it("logout 시 초기화된다", () => {
    useUserStore.getState().login({
      nickname: "히연",
      id: "heeyeon",
      password: "pw",
      level: 2,
      levelRate: 10,
    });
    useUserStore.getState().logout();
    expect(useUserStore.getState().isLoggedIn).toBe(false);
    expect(useUserStore.getState().userInfo).toBeNull();
  });

  it("updateProgress 시 level/levelRate만 갱신된다", () => {
    useUserStore.getState().login({
      nickname: "히연",
      id: "heeyeon",
      password: "pw",
      level: 1,
      levelRate: 80,
    });
    useUserStore.getState().updateProgress(1, 90);
    expect(useUserStore.getState().userInfo?.levelRate).toBe(90);
    expect(useUserStore.getState().userInfo?.id).toBe("heeyeon");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test --run src/shared/store/userStore.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: userStore 구현**

`src/shared/store/userStore.ts`:

```ts
import { create } from "zustand";
import type { User } from "@/shared/api/types";

type UserState = {
  userInfo: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProgress: (level: number, levelRate: number) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  login: (user) => set({ userInfo: user, isLoggedIn: true }),
  logout: () => set({ userInfo: null, isLoggedIn: false }),
  updateProgress: (level, levelRate) =>
    set((state) =>
      state.userInfo
        ? { userInfo: { ...state.userInfo, level, levelRate } }
        : state
    ),
}));
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test --run src/shared/store/userStore.test.ts`
Expected: PASS.

- [ ] **Step 5: modalStore + useModal 구현**

`src/shared/store/modalStore.ts`:

```ts
import { create } from "zustand";
import type { ReactElement } from "react";
import { v4 as uuidv4 } from "uuid";

export type ModalItem = {
  id: string;
  type?: "custom" | "confirm" | "login";
  title?: string;
  content: string | ReactElement<{ clickEvent?: () => void }>;
  clickEvent?: () => void;
};

type ModalState = {
  modals: ModalItem[];
  open: (modal: Omit<ModalItem, "id">) => void;
  close: (id?: string) => void;
  closeAll: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  modals: [],
  open: (modal) =>
    set((state) => {
      document.body.style.overflow = "hidden";
      return { modals: [...state.modals, { ...modal, id: uuidv4() }] };
    }),
  close: (id) =>
    set((state) => {
      if (!id) return state;
      const modals = state.modals.filter((m) => m.id !== id);
      if (modals.length === 0) document.body.style.overflow = "unset";
      return { modals };
    }),
  closeAll: () => {
    document.body.style.overflow = "unset";
    return set({ modals: [] });
  },
}));
```

`src/shared/lib/useModal.ts`:

```ts
import { useModalStore, type ModalItem } from "@/shared/store/modalStore";

const useModal = () => {
  const open = useModalStore((s) => s.open);
  const close = useModalStore((s) => s.close);
  const closeAll = useModalStore((s) => s.closeAll);

  const openModal = (modal: Omit<ModalItem, "id">) => open(modal);
  const closeModal = (id?: string) => close(id);
  const closeAllModal = () => closeAll();

  return { openModal, closeModal, closeAllModal };
};

export default useModal;
```

- [ ] **Step 6: 전체 테스트 통과 확인**

Run: `pnpm test --run`
Expected: PASS (level/generateQuiz/userStore).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Zustand userStore·modalStore 및 useModal 래퍼 추가"
```

---

## Task 6: MSW 인메모리 mock 백엔드 (인증 자격검증 이동)

**Files:**
- Create: `src/mocks/db.ts`
- Modify: `src/mocks/handlers.ts`

**Interfaces:**
- Consumes: `User`, `SignUpInput`, `LoginInput`, `Word` (types), `mockData.json`
- Produces: 엔드포인트
  - `POST /api/signup` body `{ nickname, id, password }` → 성공 200 `{ data: PublicUser }`, 닉네임/아이디 중복 시 409 `{ code, message }`.
  - `POST /api/login` body `{ id, password }` → 성공 200 `{ data: User }`, 실패 401.
  - `POST /api/logout` → 200.
  - `GET /api/word?level=N` → 200 `{ data: Word[] }`, 잘못된 레벨 400.

- [ ] **Step 1: 인메모리 db 작성**

`src/mocks/db.ts`:

```ts
import type { User } from "@/shared/api/types";

const users: User[] = [];

export const findUserByCredentials = (
  id: string,
  password: string
): User | undefined =>
  users.find((u) => u.id === id && u.password === password);

export const isNicknameTaken = (nickname: string): boolean =>
  users.some((u) => u.nickname === nickname);

export const isIdTaken = (id: string): boolean =>
  users.some((u) => u.id === id);

export const addUser = (user: User): User => {
  users.push(user);
  return user;
};
```

- [ ] **Step 2: handlers 확장**

`src/mocks/handlers.ts` 전체 교체:

```ts
import { http, HttpResponse } from "msw";
import mockData from "./mockData.json";
import {
  addUser,
  findUserByCredentials,
  isIdTaken,
  isNicknameTaken,
} from "./db";
import type { LoginInput, SignUpInput, Word } from "@/shared/api/types";

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
  const { password: _pw, ...publicUser } = user;
  return ok(publicUser);
});

const loginHandler = http.post("/api/login", async ({ request }) => {
  const { id, password } = (await request.json()) as LoginInput;
  const user = findUserByCredentials(id, password);

  if (!user) {
    return HttpResponse.json(
      { code: "INVALID_CREDENTIALS", message: "아이디 또는 비밀번호가 일치하지 않습니다." },
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
```

참고: `api/index.ts`의 기존 `requestSignUp`/`requestLogin`은 `{ params: { userInfo } }`로 보내고 있었으나, mock이 body를 직접 파싱하도록 변경하므로 Task 7에서 호출부를 평평한 body로 수정한다.

- [ ] **Step 3: 빌드/타입 확인**

Run: `pnpm exec tsc -b`
Expected: 에러 없음(이 시점엔 mockData import 타입만 검증; 미사용 에러 없도록 `_pw` 사용 회피는 destructure-omit 패턴 허용 — eslint에서 막히면 Step 4 참조).

- [ ] **Step 4: eslint no-unused-vars 대응**

`_pw` 미사용 경고 시 `.eslintrc`/`eslint.config` 규칙 대신 해당 줄을 다음으로 대체:

```ts
const publicUser: Omit<typeof user, "password"> = {
  nickname: user.nickname,
  id: user.id,
  level: user.level,
  levelRate: user.levelRate,
};
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: MSW 인메모리 mock 백엔드로 인증 자격검증 이동"
```

---

## Task 7: auth 피처 (API 훅 + 컴포넌트 이동·수정)

**Files:**
- Create: `src/features/auth/api/auth.ts`
- Create: `src/features/auth/hooks/useAuth.ts`
- Move/Modify: `src/features/auth/components/LoginModal.tsx`
- Move/Modify: `src/features/auth/components/SignUpForm.tsx`
- Move: `src/features/auth/schemas/signUpSchema.ts`
- Create: `src/features/auth/index.ts`

**Interfaces:**
- Consumes: `api` (client), `User`, `PublicUser`, `LoginInput`, `SignUpInput`, `ApiResponse`, `useUserStore`, `useModal`.
- Produces:
  - `requestSignUp(input: SignUpInput): Promise<PublicUser>`
  - `requestLogin(input: LoginInput): Promise<User>`
  - `requestLogout(): Promise<void>`
  - `useAuth()`: `{ login, signUp, logout }` mutation 객체들 (또는 핸들러 함수). 컴포넌트는 `userList`를 직접 조회하지 않는다.

- [ ] **Step 1: auth API 작성**

`src/features/auth/api/auth.ts`:

```ts
import { api } from "@/shared/api/client";
import type {
  ApiResponse,
  LoginInput,
  PublicUser,
  SignUpInput,
  User,
} from "@/shared/api/types";

export const requestSignUp = async (
  input: SignUpInput
): Promise<PublicUser> => {
  const { data } = await api.post<ApiResponse<PublicUser>>("/signup", input);
  return data.data;
};

export const requestLogin = async (input: LoginInput): Promise<User> => {
  const { data } = await api.post<ApiResponse<User>>("/login", input);
  return data.data;
};

export const requestLogout = async (): Promise<void> => {
  await api.post("/logout");
};
```

- [ ] **Step 2: useAuth 훅 작성**

`src/features/auth/hooks/useAuth.ts`:

```ts
import { useMutation } from "@tanstack/react-query";
import { requestLogin, requestLogout, requestSignUp } from "../api/auth";

export const useAuth = () => {
  const loginMutation = useMutation({ mutationFn: requestLogin });
  const signUpMutation = useMutation({ mutationFn: requestSignUp });
  const logoutMutation = useMutation({ mutationFn: requestLogout });

  return { loginMutation, signUpMutation, logoutMutation };
};
```

- [ ] **Step 3: 스키마 이동**

```bash
mkdir -p src/features/auth/schemas
git mv src/schemas/SignUpSchema.ts src/features/auth/schemas/signUpSchema.ts
```

- [ ] **Step 4: LoginModal 이동·수정 (userList 직접조회 제거)**

```bash
mkdir -p src/features/auth/components
git mv src/components/modal/LoginModal.tsx src/features/auth/components/LoginModal.tsx
```

수정: `userListState` 조회를 제거하고 `loginMutation` 성공 시 반환된 user로 `useUserStore.login` 호출. 에러(401) 시 모달 안내. import는 `@/shared/...`, `../hooks/useAuth`, `@/shared/lib/useModal`, `@/shared/ui`로 갱신. (구체 코드는 디자인 Task 10에서 Button 교체와 함께 최종 확정; 이 단계에선 동작 우선으로 로직만 교체.)

핵심 변경 (handleOnSubmit):

```tsx
const handleOnSubmit = ({ id, password }: LoginInput) => {
  if (!id || !password) {
    openModal({ content: "아이디, 비밀번호를 입력해주세요" });
    return;
  }
  loginMutation.mutate(
    { id, password },
    {
      onSuccess: (user) => {
        login(user);
        closeAllModal();
        navigate("/");
      },
      onError: () => {
        openModal({
          content: "아이디 또는 비밀번호가 일치하지 않습니다.",
        });
      },
    }
  );
};
```

- [ ] **Step 5: SignUpForm 이동·수정 (중복검사 서버로)**

```bash
git mv src/components/SignUpForm.tsx src/features/auth/components/SignUpForm.tsx
```

수정: `userListState` 제거, `signUpMutation.mutate(data)` 호출. 성공 시 안내 후 `/`로, 에러는 status 409면 서버 message(중복 닉네임/아이디) 표시, 그 외 일반 에러. import 갱신.

핵심 변경:

```tsx
const handleOnSubmit = (data: SignUpFormType) => {
  const { nickname, id, password } = data;
  signUpMutation.mutate(
    { nickname, id, password },
    {
      onSuccess: () => {
        openModal({
          content: "회원가입이 정상적으로 처리되었습니다.",
          clickEvent: () => navigate("/"),
        });
      },
      onError: (error) => {
        const message =
          isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : "회원가입 요청 중 문제가 발생했습니다.";
        openModal({ title: "에러", content: message });
      },
    }
  );
};
```

(`import { isAxiosError } from "axios";` 추가. `SignUpFormType`은 `z.infer<typeof signUpSchema>`로 로컬 정의하거나 피처 내 타입으로 유지.)

- [ ] **Step 6: auth 배럴**

`src/features/auth/index.ts`:

```ts
export { default as LoginModal } from "./components/LoginModal";
export { default as SignUpForm } from "./components/SignUpForm";
export { useAuth } from "./hooks/useAuth";
```

- [ ] **Step 7: Commit** (빌드는 Task 11 일괄 정리 후 통과 보장; 이 시점 부분 빌드 깨질 수 있음)

```bash
git add -A
git commit -m "refactor: auth 피처 분리 및 자격검증을 서버 mutation으로 이동"
```

---

## Task 8: quiz 피처 (useQuiz 훅 + QuizPage/AnswerModal)

**Files:**
- Create: `src/features/quiz/api/quiz.ts`
- Create: `src/features/quiz/hooks/useQuiz.ts`
- Move/Modify: `src/features/quiz/components/QuizPage.tsx`
- Move/Modify: `src/features/quiz/components/AnswerModal.tsx`
- Create: `src/features/quiz/index.ts`

**Interfaces:**
- Consumes: `getWordLevel`, `generateQuiz`/`Quiz`, `getNextProgress`/`isAtFinalProgress`/`getRemainingRate`, `useUserStore`, `useModal`.
- Produces:
  - `getWordLevel(level: number): Promise<Word[]>`
  - `useQuiz()`: `{ quiz: Quiz | null; isLoading: boolean; submit(option: string): void; level: number; levelRate: number }` — 제출 시 정답이면 `getNextProgress`로 진행률 갱신 후 다음 문제, `isAtFinalProgress`면 "준비중" 안내, 오답이면 오답 모달.

- [ ] **Step 1: quiz API 이동**

`src/features/quiz/api/quiz.ts`:

```ts
import { api } from "@/shared/api/client";
import type { ApiResponse, Word } from "@/shared/api/types";

export const getWordLevel = async (level: number): Promise<Word[]> => {
  const { data } = await api.get<ApiResponse<Word[]>>("/word", {
    params: { level },
  });
  return data.data;
};
```

- [ ] **Step 2: useQuiz 훅 작성**

`src/features/quiz/hooks/useQuiz.ts`:

```ts
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getWordLevel } from "../api/quiz";
import { generateQuiz, type Quiz } from "../lib/generateQuiz";
import {
  getNextProgress,
  isAtFinalProgress,
} from "../lib/level";
import { useUserStore } from "@/shared/store/userStore";
import useModal from "@/shared/lib/useModal";
import AnswerModal from "../components/AnswerModal";

export const useQuiz = () => {
  const userInfo = useUserStore((s) => s.userInfo);
  const updateProgress = useUserStore((s) => s.updateProgress);
  const level = userInfo?.level ?? 1;
  const levelRate = userInfo?.levelRate ?? 0;

  const { openModal } = useModal();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const { data: words, isFetched, isLoading } = useQuery({
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
    const leveledUp = nextProgress.level > level;
    updateProgress(nextProgress.level, nextProgress.levelRate);

    openModal({
      type: "custom",
      content: (
        <AnswerModal
          isAnswer
          isLevelUp={leveledUp}
          level={nextProgress.level}
          levelRate={nextProgress.levelRate}
        />
      ),
      clickEvent: next,
    });
  };

  return { quiz, isLoading, submit, level, levelRate };
};
```

- [ ] **Step 3: AnswerModal 이동·수정 (props 기반)**

```bash
mkdir -p src/features/quiz/components
git mv src/components/modal/AnswerModal.tsx src/features/quiz/components/AnswerModal.tsx
```

`src/features/quiz/components/AnswerModal.tsx` 전체 교체:

```tsx
import useModal from "@/shared/lib/useModal";
import { getRemainingRate } from "../lib/level";

interface AnswerModalProps {
  isAnswer: boolean;
  isLevelUp?: boolean;
  level?: number;
  levelRate?: number;
  clickEvent?: () => void;
}

const AnswerModal: React.FC<AnswerModalProps> = ({
  isAnswer,
  isLevelUp = false,
  level = 1,
  levelRate = 0,
  clickEvent,
}) => {
  const { closeAllModal } = useModal();

  const onClickBtn = () => {
    if (clickEvent && !isLevelUp) clickEvent();
    closeAllModal();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-2">
        {isAnswer ? "정답이에요 🥳🎉" : "오답이에요 😢💧"}
      </h2>
      {isAnswer ? (
        <p className="text-gray-700 text-center mb-4">
          {isLevelUp ? (
            <>
              <span className="font-bold text-primary">Level {level}</span>로
              업그레이드 되었어요!
            </>
          ) : (
            <>
              다음 레벨까지{" "}
              <span className="font-bold text-primary">
                {getRemainingRate(levelRate)}%
              </span>{" "}
              남았어요.
            </>
          )}
        </p>
      ) : (
        <p className="text-gray-700 text-center mb-4">정답을 다시 생각해보세요!</p>
      )}
      <button
        className="w-full py-2 px-4 bg-primary text-white rounded-lg transition duration-300"
        onClick={onClickBtn}
      >
        {isAnswer ? "다음 문제 풀기" : "다시 풀어보기"}
      </button>
    </div>
  );
};

export default AnswerModal;
```

참고: `isLevelUp` 판정이 모달 내부 `levelRate===0` 추론에서 명시적 prop으로 바뀌어 레벨업이 아닌 첫 문제(rate 0→10) 등 경계 버그가 사라진다.

- [ ] **Step 4: QuizPage 프레젠테이션으로 축소**

```bash
git mv src/pages/QuizPage.tsx src/features/quiz/components/QuizPage.tsx
```

전체 교체:

```tsx
import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../hooks/useQuiz";
import { Button } from "@/shared/ui";

const QuizPage = () => {
  const navigate = useNavigate();
  const { quiz, submit } = useQuiz();

  return (
    <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md">
      <AiOutlineLeft
        className="absolute top-2 cursor-pointer text-muted left-2 w-6 h-6"
        onClick={() => navigate("/")}
      />
      <div className="flex flex-col items-center justify-center h-screen p-4">
        {quiz && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-4 w-full max-w-md text-center">
            <h1 className="text-3xl font-bold mb-10">{quiz.word}</h1>
            <div className="flex flex-col space-y-3 items-center">
              {quiz.options.map((option) => (
                <Button
                  key={option}
                  variant="secondary"
                  className="w-[60%]"
                  onClick={() => submit(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
```

(디자인 토큰 `text-muted`/`bg-primary`는 Task 10에서 tailwind config로 정의. `Button` API는 Task 10 정의를 따른다.)

- [ ] **Step 5: quiz 배럴**

`src/features/quiz/index.ts`:

```ts
export { default as QuizPage } from "./components/QuizPage";
export { useQuiz } from "./hooks/useQuiz";
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: quiz 피처에 useQuiz 훅 도입 및 도메인 로직 통합"
```

---

## Task 9: home 피처 이동

**Files:**
- Move/Modify: `src/features/home/components/VisitorHome.tsx`
- Move/Modify: `src/features/home/components/UserHome.tsx`
- Create: `src/features/home/index.ts`

**Interfaces:**
- Consumes: `useUserStore`, `useAuth`(logout), `useModal`, `LoginModal`(auth), `Button`/`ProgressBar`(ui), `getRemainingRate`(quiz/level — 또는 ui로 노출).
- Produces: `VisitorHome`, `UserHome` 컴포넌트.

- [ ] **Step 1: 이동**

```bash
mkdir -p src/features/home/components
git mv src/components/VisitorHome.tsx src/features/home/components/VisitorHome.tsx
git mv src/components/UserHome.tsx src/features/home/components/UserHome.tsx
```

- [ ] **Step 2: VisitorHome 수정**

import를 `@/shared/ui`(Button), `@/shared/lib/useModal`, `@/features/auth`(LoginModal)로 갱신. Button을 새 API(`variant`, children)로 교체.

```tsx
import { useNavigate } from "react-router-dom";
import LogoImg from "@public/images/logo_img.png";
import { Button } from "@/shared/ui";
import useModal from "@/shared/lib/useModal";
import { LoginModal } from "@/features/auth";

const VisitorHome: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  return (
    <>
      <div className="img-container flex justify-center mt-40 md:mt-32">
        <img src={LogoImg} alt="Main Logo" className="w-full h-auto max-h-80" />
      </div>
      <div className="btn-container mt-10 flex flex-col items-center gap-2">
        <Button
          className="w-[70%]"
          onClick={() =>
            openModal({ type: "login", title: "Login", content: <LoginModal /> })
          }
        >
          로그인
        </Button>
        <Button
          variant="secondary"
          className="w-[70%]"
          onClick={() => navigate("/signup")}
        >
          회원가입
        </Button>
      </div>
    </>
  );
};
export default VisitorHome;
```

- [ ] **Step 3: UserHome 수정 (Zustand + useAuth logout + ProgressBar)**

```tsx
import MainImg from "@public/images/main_img.png";
import { useNavigate } from "react-router-dom";
import { Button, ProgressBar, LevelBadge } from "@/shared/ui";
import { useUserStore } from "@/shared/store/userStore";
import { useAuth } from "@/features/auth";
import { getRemainingRate } from "@/features/quiz/lib/level";

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = useUserStore((s) => s.userInfo);
  const storeLogout = useUserStore((s) => s.logout);
  const { logoutMutation } = useAuth();

  if (!userInfo) return null;
  const { nickname, level, levelRate } = userInfo;

  const onLogout = () =>
    logoutMutation.mutate(undefined, { onSuccess: storeLogout });

  return (
    <>
      <div className="img-container flex justify-center mt-40 md:mt-32">
        <img src={MainImg} alt="Profile Logo" className="w-full h-auto max-h-80" />
      </div>
      <div className="text-center mt-8 px-4">
        <div className="flex justify-center mb-3">
          <LevelBadge level={level} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          {nickname} 님, 다음 레벨까지 {getRemainingRate(levelRate)}% 남았어요!
        </h3>
        <ProgressBar value={levelRate} />
        <div className="flex mt-6 justify-center gap-2">
          <Button onClick={() => navigate("/quiz")}>퀴즈 풀기</Button>
          <Button variant="secondary" onClick={onLogout}>
            오늘은 그만
          </Button>
        </div>
      </div>
    </>
  );
};
export default UserHome;
```

- [ ] **Step 4: home 배럴**

`src/features/home/index.ts`:

```ts
export { default as VisitorHome } from "./components/VisitorHome";
export { default as UserHome } from "./components/UserHome";
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: home 피처 분리 및 Zustand·디자인 시스템 적용"
```

---

## Task 10: 디자인 시스템 + 비주얼 개편

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Create: `src/shared/ui/Button.tsx`
- Create: `src/shared/ui/Card.tsx`
- Create: `src/shared/ui/ProgressBar.tsx`
- Create: `src/shared/ui/LevelBadge.tsx`
- Create: `src/shared/ui/Confetti.tsx`
- Move: `src/shared/ui/InputField.tsx` (기존 common/InputField)
- Move: shadcn 원시 → `src/shared/ui/primitives/{button,card,form,input,label}.tsx`
- Create: `src/shared/ui/index.ts`
- Move/Modify: 모달 레이아웃/프로바이더 → `src/shared/ui/modal/{ModalLayout,ModalProvider}.tsx`

**Interfaces:**
- Produces:
  - `Button`: props `{ variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg"; type?; className?; onClick?; children }` — CVA, 듀올링고식 하단 그림자 3D.
  - `ProgressBar`: `{ value: number }` (0~100)
  - `LevelBadge`: `{ level: number }`
  - `Card`: `{ className?; children }`
  - `Confetti`: `{ fire: boolean }` 또는 imperative ref — 정답/레벨업 시 발사.

- [ ] **Step 1: tailwind 토큰 재정의**

`tailwind.config.js`의 `theme.extend.colors`를 게임형 팔레트로 교체(`primary`, `primary-dark`, `secondary`, `success`, `danger`, `muted` 등). 기존 `customBlueColor` 계열은 남기되 `primary`로 별칭 통일. CSS 변수 기반.

```js
colors: {
  primary: { DEFAULT: "#58cc02", dark: "#46a302" },
  secondary: { DEFAULT: "#1cb0f6", dark: "#1899d6" },
  success: "#58cc02",
  danger: "#ff4b4b",
  muted: "#afafaf",
  customBlueColor: "#61acc5",
  customDepBlueColor: "#2794B9",
  customGrayColor: "#babbbb",
  customDepGrayColor: "#818789",
},
boxShadow: {
  "btn-3d": "0 4px 0 0 rgba(0,0,0,0.15)",
},
```

- [ ] **Step 2: Button (CVA 3D)**

`src/shared/ui/Button.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-bold text-white transition active:translate-y-1 active:shadow-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary shadow-btn-3d hover:bg-primary-dark",
        secondary: "bg-secondary shadow-btn-3d hover:bg-secondary-dark",
        ghost: "bg-transparent text-primary shadow-none",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  className,
  ...props
}) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
```

- [ ] **Step 3: ProgressBar / LevelBadge / Card / Confetti**

`src/shared/ui/ProgressBar.tsx`:

```tsx
import { motion } from "framer-motion";

export const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
    <motion.div
      className="h-full bg-primary rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      transition={{ duration: 0.4 }}
    />
  </div>
);
```

`src/shared/ui/LevelBadge.tsx`:

```tsx
export const LevelBadge: React.FC<{ level: number }> = ({ level }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary-dark font-bold text-sm">
    Level {level}
  </span>
);
```

`src/shared/ui/Card.tsx`:

```tsx
import { cn } from "@/shared/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("bg-white rounded-2xl shadow-lg p-6", className)}
    {...props}
  />
);
```

`src/shared/ui/Confetti.tsx`: `react-canvas-confetti`의 `Realistic`/`fireworks` 프리셋 래퍼. (라이브러리 API에 맞춰 `import Fireworks from "react-canvas-confetti/dist/presets/fireworks"` 사용, `autorun={{ speed: 1, duration: 1 }}` 일회성 발사 prop 노출.)

- [ ] **Step 4: shadcn 원시·InputField·모달 이동**

```bash
mkdir -p src/shared/ui/primitives src/shared/ui/modal
git mv src/components/ui/button.tsx src/shared/ui/primitives/button.tsx
git mv src/components/ui/card.tsx src/shared/ui/primitives/card.tsx
git mv src/components/ui/form.tsx src/shared/ui/primitives/form.tsx
git mv src/components/ui/input.tsx src/shared/ui/primitives/input.tsx
git mv src/components/ui/label.tsx src/shared/ui/primitives/label.tsx
git mv src/components/common/InputField.tsx src/shared/ui/InputField.tsx
git mv src/components/modal/ModalLayout.tsx src/shared/ui/modal/ModalLayout.tsx
git mv src/components/modal/ModalProvider.tsx src/shared/ui/modal/ModalProvider.tsx
```

이동한 파일들의 내부 import 경로(`../ui/form` → `./primitives/form`, `@/lib/utils` → `@/shared/lib/utils`, `@/components` Button → `@/shared/ui`, `@/atom/modalState`·`@/utils/useModal` → `@/shared/store/modalStore`·`@/shared/lib/useModal`)를 모두 갱신. `ModalProvider`는 `useModalStore((s)=>s.modals)` 사용. `ModalLayout`의 `Button`은 새 `Button`으로 교체(`type="confirm"`의 확인 버튼).

- [ ] **Step 5: ui 배럴**

`src/shared/ui/index.ts`:

```ts
export { Button } from "./Button";
export { Card } from "./Card";
export { ProgressBar } from "./ProgressBar";
export { LevelBadge } from "./LevelBadge";
export { default as InputField } from "./InputField";
```

- [ ] **Step 6: 정답/레벨업 시 컨페티 연결**

`AnswerModal`(정답·레벨업) 또는 QuizPage에서 `Confetti`를 조건부 렌더해 정답 시 발사. (간단히 AnswerModal `isAnswer` 시 마운트.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 게임형 디자인 시스템 및 비주얼 전면 개편"
```

---

## Task 11: app 와이어링 + 잔여 정리 + 빌드 통과

**Files:**
- Move/Modify: `src/app/App.tsx`
- Create: `src/app/providers.tsx`
- Modify: `src/main.tsx`
- Modify: `src/pages/HomePage.tsx` → `src/features/home` 사용 (또는 `src/app`로 흡수)
- Modify: `src/pages/SignUpPage.tsx`
- Delete: `src/atom/*`, `src/components/ProfileBox.tsx`, `src/components/common/Button.tsx`, `src/components/index.ts`, `src/utils/useModal.ts`, `src/api/index.ts`, `src/types/*`(흡수 후), 빈 디렉터리.
- Delete: `src/components/modal/` 잔여, `src/schemas/` 잔여.

**Interfaces:**
- Consumes: 모든 피처 배럴, stores, providers.

- [ ] **Step 1: App 라우팅 이동 (Recoil → Zustand)**

```bash
mkdir -p src/app
git mv src/App.tsx src/app/App.tsx
```

`src/app/App.tsx`:

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useUserStore } from "@/shared/store/userStore";
import HomePage from "@/pages/HomePage";
import SignUpPage from "@/pages/SignUpPage";
import { QuizPage } from "@/features/quiz";

const App: React.FC = () => {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
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
    </Routes>
  );
};

export default App;
```

- [ ] **Step 2: HomePage/SignUpPage import 갱신**

`HomePage.tsx`: `useUserStore((s)=>s.isLoggedIn)`, `@/features/home`에서 `UserHome`/`VisitorHome`.
`SignUpPage.tsx`: `@/features/auth`에서 `SignUpForm`.

- [ ] **Step 3: providers + main 정리 (RecoilRoot 제거, mocking 가드 명확화)**

`src/app/providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ModalProvider from "@/shared/ui/modal/ModalProvider";
import App from "./App";

const queryClient = new QueryClient();

const Providers: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      <ModalProvider />
    </BrowserRouter>
  </QueryClientProvider>
);

export default Providers;
```

`src/main.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import Providers from "./app/providers";
import "./index.css";

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

enableMocking().then(() => {
  createRoot(rootElement).render(<Providers />);
});
```

(배포에서도 mock 백엔드를 쓰는 포트폴리오 특성상 mocking 항상 활성. 주석으로 명시.)

- [ ] **Step 4: 잔여 파일/디렉터리 삭제**

```bash
git rm -r src/atom src/components src/utils src/api src/schemas src/lib src/types src/pages/QuizPage.tsx 2>/dev/null || true
```

(주의: `src/pages/HomePage.tsx`·`SignUpPage.tsx`·`index.ts`는 유지하거나 `src/app`로 이동. 위 명령은 실제 잔여만 선별 삭제하도록 개별 점검 후 실행. 이미 `git mv`된 파일은 대상 아님.)

`src/pages/index.ts`에서 `QuizPage` export 제거(quiz 피처로 이동했으므로). `src/types/index.ts` 등 흡수 완료된 것만 삭제.

- [ ] **Step 5: 빌드 + 린트 + 테스트 통과 확인**

Run:
```bash
pnpm exec tsc -b && pnpm lint && pnpm test --run && pnpm build
```
Expected: 모두 무오류. 미사용 import/변수 0, 테스트 전부 PASS.

남은 타입 오류/미사용 import는 이 단계에서 전부 해소(특히 이동한 파일들의 잔존 Recoil/구 경로 import).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: 피처 기반 구조로 app 와이어링 완료 및 Recoil 제거"
```

---

## Task 12: README 갱신 + 최종 검증

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README 갱신**

새 폴더 구조(features/shared/app), 기술 스택, 실행/테스트 방법(`pnpm dev`, `pnpm test`), 강조 포인트(클린 아키텍처/도메인 로직 분리/단위 테스트/게임형 디자인) 기술.

- [ ] **Step 2: 전체 검증 재실행**

Run:
```bash
pnpm exec tsc -b && pnpm lint && pnpm test --run && pnpm build
```
Expected: 모두 PASS.

- [ ] **Step 3: 수동 동작 확인 (dev)**

Run: `pnpm dev` 후 회원가입 → 로그인 → 퀴즈 정답 진행률 상승 → 90%에서 레벨업 → 레벨3 90% "준비중" → 로그아웃 흐름 확인.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: 리팩토링 반영해 README 갱신"
```

---

## Self-Review

**Spec coverage:**
- 폴더 구조(피처 기반): Task 2/7/8/9/10/11 ✓
- 도메인 로직 중앙화(level.ts/generateQuiz.ts/useQuiz): Task 3/4/8 ✓
- 인증 로직 API 계층 이동(MSW 인메모리): Task 6/7 ✓
- 상태관리 Recoil→Zustand: Task 5/9/11 ✓
- 타입 안전성(ApiResponse/Word, any·캐스팅 제거): Task 2/6/7/8 ✓
- 디자인 시스템 + 비주얼 개편(토큰/Button/ProgressBar/LevelBadge/confetti/motion): Task 10 ✓
- 미사용 의존성 제거(recharts/flowbite-react), 활용(confetti/framer-motion): Task 1/10 ✓
- 정리(ProfileBox/mocking 가드/README): Task 11/12 ✓
- 단위 테스트(level/generateQuiz/store): Task 3/4/5 ✓
- 성공 기준(build/lint/test 통과, 기능 보존): Task 11/12 ✓

**Type consistency:** `Word`/`User`/`ApiResponse<T>`/`Quiz`/`Rng`/`LEVEL_CONFIG`/`getNextProgress`/`isAtFinalProgress`/`getRemainingRate`/`useUserStore`/`useModalStore`/`Button(variant,size)` 명칭 전 태스크 일관 확인 ✓

**비범위(YAGNI):** 컴포넌트 통합 테스트 스위트, 실제 백엔드 연동은 제외(순수함수+store 단위 테스트만).
