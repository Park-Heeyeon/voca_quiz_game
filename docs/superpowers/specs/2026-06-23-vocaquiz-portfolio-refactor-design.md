# VocaQuizGame 포트폴리오 리팩토링 설계

작성일: 2026-06-23

## 목표

단어 퀴즈 게임 포트폴리오에서 프론트엔드 개발자의 강점이 드러나도록 리팩토링한다.
부각할 강점 세 가지:

1. 클린 아키텍처 / 관심사 분리
2. 모던 스택 / UX 폴리시
3. 상용 앱 수준의 디자인 전면 개편 (플레이풀 게임형, 듀올링고 톤)

부가로 도메인 순수 함수에 대한 단위 테스트로 테스트 용이성도 보인다.

## 현재 상태 진단

### 강점

- React Hook Form + Zod 폼 검증
- MSW 모킹, React Query, shadcn/ui 도입
- 모달을 전역 상태로 추상화한 `useModal` 패턴

### 문제점

- `QuizPage`에 퀴즈 생성·레벨업·랜덤 선택 로직이 모두 섞여 있음
- 레벨업 판정이 `QuizPage`(`levelRate === 90`)와 `AnswerModal`(`levelRate === 0`)에 분산, 매직넘버(10·90·레벨3 제한) 산재
- 인증 자격 검증을 `LoginModal`/`SignUpForm`이 직접 `userList`를 뒤져 수행 (컴포넌트가 DB 역할)
- 커스텀 `common/Button`과 shadcn `ui/button` 중복 공존
- 타입 안전성 구멍 (`data?.data`가 any, `as string[]` 캐스팅)
- 미사용 의존성 다수 (`react-canvas-confetti`, `framer-motion`, `recharts`, `flowbite-react`)
- Recoil은 2026 기준 사실상 유지보수 종료
- 빈 `ProfileBox.tsx` 스텁, `main.tsx`의 주석 처리된 mocking 가드

## 접근 방식

검토한 세 가지 안 중 **A안(피처 기반 전면 개편)** 채택.

| 접근 | 내용 | 신호 | 변경량 |
|---|---|---|---|
| A (채택) | 피처 기반 구조 + 디자인 시스템 + 도메인 로직 분리 | 매우 강함 | 큼 |
| B | 폴더 유지 + 훅/순수함수 추출 + 디자인 개편 | 강함 | 중간 |
| C | 디자인만 개편 | 약함 | 작음 |

## 설계

### 1. 폴더 구조: 타입 기반 → 피처 기반

```
src/
  app/                 # App, 라우팅, 프로바이더
  features/
    auth/              # 로그인·회원가입·로그아웃 (UI/hook/api)
    home/              # 방문자/사용자 홈
    quiz/              # 퀴즈 (useQuiz, generateQuiz, 레벨 도메인)
  shared/
    ui/                # 디자인 시스템 (Button, Card, ProgressBar, Badge...)
    store/             # zustand 스토어
    api/               # axios 클라이언트 + 타입
    lib/               # 유틸
  mocks/               # MSW (인메모리 mock 백엔드)
```

각 피처는 자체 `components/`, `hooks/`, `api/`, `lib/`, 배럴 `index.ts`로 구성한다.
`@/` 별칭은 유지하고, 필요 시 `@/features`, `@/shared` 등 하위 경로로 import한다.

### 2. 도메인 로직 중앙화

#### `features/quiz/lib/level.ts`

레벨/진행률 도메인의 단일 출처.

- `LEVEL_CONFIG`: `{ maxLevel, rateStep, maxRate }` 등 상수. 현재 매직넘버(10·90·레벨3) 제거.
- `getNextProgress(level, rate)`: 정답 시 다음 `{ level, levelRate }` 계산 (레벨업 포함).
- `isMaxLevel(level)`: 마지막 레벨 도달 여부.
- `isLevelUp(prevRate)` 등 판정 함수.

`QuizPage`와 `AnswerModal`의 분산 판정을 이 모듈로 통합.

#### `features/quiz/lib/generateQuiz.ts`

- `generateQuiz(words: Word[]): Quiz` 순수 함수.
- 랜덤 단어 1개 선택 → 정답 뜻 + 오답 뜻 2개 → 보기 3개 셔플.
- React 무관, 입력 동일 시 동작 검증 가능(셔플은 주입 가능한 rng로 테스트 용이하게).

#### `features/quiz/hooks/useQuiz.ts`

- React Query로 레벨별 단어 조회.
- 현재 문제/보기/정답 상태 관리.
- 정답 제출 처리: 정답이면 `getNextProgress`로 진행률 갱신 후 다음 문제, 최대 레벨 도달 시 안내.
- `QuizPage`는 이 훅만 소비하는 프레젠테이션 컴포넌트로 축소.

### 3. 인증 로직을 API 계층으로 이동

- MSW를 인메모리 mock 백엔드로 확장: `users` 배열을 mock 내부에서 유지.
  - `POST /signup`: 닉네임·아이디 중복 검사 후 사용자 추가, 실패 시 4xx.
  - `POST /login`: 자격 검증 후 `{ token, user }` 반환(토큰 + 유저 객체), 실패 시 401.
  - `POST /logout`: 세션 종료 응답.
- 토큰 처리: 로그인 응답의 `token`을 `userStore`에 보관하고 `localStorage`에 영속화(새로고침 유지). axios 요청 인터셉터로 `Authorization` 헤더 부착. 로그아웃 시 토큰 제거.
- 클라이언트는 React Query mutation만 호출. 컴포넌트에서 `userList` 직접 조회 제거.
- 전역 `userListState`는 제거(또는 mock 내부로 흡수).

### 4. 상태 관리: Recoil → Zustand

- `shared/store/userStore.ts`: `userInfo`, `isLoggedIn`, 로그인/로그아웃 액션.
- `shared/store/modalStore.ts`: 모달 큐 + `openModal`/`closeModal`/`closeAllModal` 액션.
- `useModal` 훅은 `modalStore` 위 얇은 래퍼로 유지(호출부 인터페이스 보존).
- Recoil 의존성 및 `atom/` 디렉터리 제거.

### 5. 타입 안전성

- `shared/api/types.ts`: `ApiResponse<T>`, `Word` 타입 정의.
- `getWordLevel` 반환 타입 명시, `data?.data`의 any 제거.
- `generateQuiz`에서 `as string[]` 캐스팅 제거.

### 6. 디자인 시스템 + 비주얼 전면 개편 (플레이풀 게임형)

- `tailwind.config.ts` 토큰 재정의: 산발적 `customBlueColor` 계열 → 일관된 게임형 팔레트. 메인 컬러는 듀올링고식 그린 계열을 기본값으로 잡고(주색/보조/성공/위험/중립 스케일), 추후 교체 가능하게 토큰화.
- `shared/ui/Button.tsx`: 커스텀+shadcn 중복 제거, CVA 변형. 듀올링고식 하단 그림자 3D 버튼(primary/secondary/ghost, size).
- 추가 컴포넌트: `ProgressBar`, `LevelBadge`, `StreakCounter`(또는 XP 비주얼), `Card`.
- 미사용 의존성 활용:
  - `react-canvas-confetti`: 정답/레벨업 시 컨페티.
  - `framer-motion`: 단어 카드 전환, 모달 등장 애니메이션.
- 미사용 의존성 제거: `recharts`, `flowbite-react`.
- 화면별 재디자인: 방문자 홈, 사용자 홈, 퀴즈, 회원가입, 모달.

### 7. 정리 작업

- 빈 `ProfileBox.tsx` 제거.
- `main.tsx`의 mocking 가드 정리(개발/배포 분기 명확화).
- 단어 데이터 확충: `mockData.json`의 레벨 1~3 단어를 더 풍부하게 늘림(레벨당 충분한 보기 풀과 학습 분량 확보). 보기 3개를 안정적으로 뽑을 수 있도록 레벨당 최소 단어 수 보장.
- README를 새 구조/스크린샷 기준으로 갱신.

### 8. 단위 테스트

- Vitest + (필요 시) Testing Library 도입.
- `level.ts`: `getNextProgress`, `isMaxLevel`, 레벨업 경계(rate 80→90→레벨업) 검증.
- `generateQuiz.ts`: 보기 개수 3개, 정답 포함, 중복 없음, 단어 부족 시 처리.
- 주입 가능한 rng로 셔플 결정성 확보.

## 비범위 (YAGNI)

- 컴포넌트 전반의 통합 테스트 스위트(순수 함수 단위 테스트만).
- 실제 백엔드 연동(MSW mock 유지).
- 무관한 리팩토링.

## 성공 기준

- `pnpm build`(tsc + vite) 무오류 통과.
- `pnpm lint` 통과.
- 추가한 단위 테스트 통과.
- 기존 기능(회원가입/로그인/로그아웃/레벨별 퀴즈/레벨업/모달) 동작 유지.
- 디자인이 플레이풀 게임형으로 일관되게 적용.
