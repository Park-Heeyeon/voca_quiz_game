# VocaQuizGame 학습 기능 확장 설계 (오답노트·복습·스트릭·영속화)

작성일: 2026-06-23

## 목표

단어 퀴즈 게임에 **학습 완성도**(오답노트·복습)와 **게임성·리텐션**(스트릭·일일목표) 기능을 추가한다. 모든 학습 데이터는 MSW 인메모리 mock 백엔드를 통해 사용자별로 `localStorage`에 영속화하여, 새로고침 후에도 진행 상황과 로그인이 유지된다.

부가로 스트릭/일일목표 판정을 React 무관 순수함수로 분리해 단위 테스트로 검증한다.

## 범위 (MVP)

- **F0. 영속화 + 세션 복원**: mock 백엔드를 단일 출처로 localStorage에 영속화, 새로고침 시 자동 로그인 복원.
- **F1. 오답노트**: 오답 단어 자동 기록(사용자별).
- **F2. 복습 모드**: 오답 단어 풀로 퀴즈, 정답 시 오답노트에서 제거. 레벨 진행과 분리.
- **F4. 스트릭 / 일일목표**: 연속 학습일과 하루 정답 목표(기본 10), 홈 표시 + 목표 달성 축하.

## 비범위 (다음 단계)

- F3 단어장, F5 타이머 챌린지 모드.
- 본격 간격 반복(SRS) 스케줄링.
- 실제 백엔드 연동, 다중 기기 동기화, 랭킹/리더보드.

## 현재 상태 (기준점)

- 상태관리 Zustand(`userStore`, `modalStore`), 인메모리(새로고침 시 초기화).
- MSW가 인증/단어를 처리(`src/mocks/handlers.ts`, `db.ts`). `db.ts`의 `users`는 모듈 메모리에만 존재.
- 퀴즈 제출은 `useQuiz`에서 클라이언트가 진행률 계산 후 `userStore.updateProgress` 호출(서버 미반영).
- 도메인 순수함수 `features/quiz/lib/level.ts`, `generateQuiz.ts` + 단위 테스트 17개.

## 아키텍처

### 데이터 계층 — mock 백엔드가 단일 출처

`src/mocks/db.ts`가 사용자/학습 데이터의 단일 출처가 되고, 변경 시마다 `localStorage` 키 `vocaquiz_db`에 직렬화한다. 모듈 로드 시 localStorage에서 하이드레이트하며, 저장된 데이터가 없을 때만 시드 테스트 계정을 생성한다.

서버 측 사용자 레코드(`ServerUser`):

```
ServerUser {
  nickname: string;
  id: string;
  password: string;
  token: string | null;          // 로그인 시 발급, 로그아웃 시 null
  level: number;
  levelRate: number;
  wrongAnswers: WrongAnswer[];
  streak: { current: number; lastActiveDate: string | null };  // YYYY-MM-DD
  daily: { date: string; correctCount: number };               // YYYY-MM-DD
}
WrongAnswer { word: string; meaning: string; level: number; missCount: number }
```

클라이언트로 내보내는 형태(`SessionUser`)는 `password`/`token`을 제외한다:

```
SessionUser {
  nickname, id, level, levelRate,
  streak: { current, lastActiveDate },
  daily: { date, correctCount }
}
```

`wrongAnswers`는 별도 엔드포인트로 조회(React Query)하므로 `SessionUser`에 포함하지 않는다.

### 세션 / 인증

- 실제 토큰이 없으므로 mock이 로그인 시 opaque 토큰(uuid)을 발급해 `ServerUser.token`에 저장(localStorage 영속). 응답으로 `{ user: SessionUser, token }` 반환.
- 클라이언트는 토큰을 `localStorage` 키 `vocaquiz_token`에 저장.
- `src/shared/api/client.ts`에 요청 인터셉터를 추가해 토큰 존재 시 `Authorization: Bearer <token>` 헤더를 자동 첨부.
- mock 핸들러는 헤더의 토큰으로 `ServerUser`를 조회(`findUserByToken`). 토큰이 db에 영속되므로 새로고침 후에도 유효.
- 로그아웃: `POST /logout`이 `token`을 null로 무효화, 클라이언트는 토큰 제거.

### 세션 복원 (부팅)

- 앱 마운트 시 `localStorage`에 토큰이 있으면 `GET /me` 호출로 `userStore` 복원.
- 복원 중에는 `isBootstrapping` 상태로 라우트 평가를 보류하고 스플래시를 렌더(보호 라우트의 깜빡임 방지). 토큰이 없거나 `GET /me` 실패 시 즉시 비로그인 상태로 진입.

### 답안 제출 흐름 (도메인 로직은 서버가 보유)

- **정답**: `POST /progress { level, levelRate }`
  - 서버가 진행률을 저장하고, 학습 활동으로 간주해 `study.ts`로 **스트릭 갱신 + 일일 정답 카운트 +1**.
  - 갱신된 `SessionUser` 반환 → 클라이언트 `userStore` 동기화.
  - 일일목표를 이번 정답으로 처음 달성하면 응답에 `dailyGoalReached: true` 플래그 포함 → 클라이언트가 축하 모달 표시.
- **오답**: `POST /wrong-answers { word, meaning, level }` → 오답노트에 추가하거나 `missCount` 증가. (study 갱신 없음)

### 복습 흐름

- 전용 엔드포인트 `POST /review/answer { word, correct }`:
  - `correct: true` → 오답노트에서 단어 제거 + **스트릭만 갱신**(학습 활동으로 인정). **일일 정답 카운트는 올리지 않음**.
  - `correct: false` → `missCount` 증가, study 갱신 없음.
- 복습은 레벨 진행(level/levelRate)에 영향을 주지 않는다(관심사 분리).
- 일일목표(`dailyGoalReached` 축하)는 **메인 퀴즈 정답에서만** 트리거된다. 복습은 스트릭 유지 용도이므로 일일목표 카운트와 무관하다.

## 도메인 로직 (순수함수, 단위 테스트 대상)

`src/shared/lib/study.ts`:

- `DAILY_GOAL = 10` 상수.
- `toDateKey(date: Date): string` — `YYYY-MM-DD`.
- `resetDailyIfNeeded(daily, todayKey): { date, correctCount }` — 날짜가 바뀌었으면 `correctCount`를 0으로 리셋(읽기 경로 정규화용).
- `registerDailyCorrect(daily, todayKey): { date, correctCount }` — 날짜 변경 시 리셋 후 `correctCount + 1`(메인 퀴즈 정답 시).
- `applyStudyDay(streak, todayKey): { current, lastActiveDate }` — 학습 활동 시 스트릭 갱신. `lastActiveDate`가 오늘이면 변화 없음, 어제면 `current+1`, 그 외(공백/최초)면 `current=1`. `lastActiveDate=todayKey`.
- `isYesterday(prevKey, todayKey): boolean` — 보조.
- `isDailyGoalMet(daily): boolean` — `correctCount >= DAILY_GOAL`.

mock 핸들러 사용: 메인 퀴즈 정답은 `applyStudyDay` + `registerDailyCorrect`, 복습 정답은 `applyStudyDay`만. 읽기(`GET /me`) 시 `resetDailyIfNeeded`로 정규화. 클라이언트는 `DAILY_GOAL`을 표시용으로 import한다.

## API 엔드포인트 요약

| 메서드 | 경로 | 인증 | 요청/응답 |
|---|---|---|---|
| POST | `/signup` | - | 기존과 동일, db 영속화 |
| POST | `/login` | - | `{ id, password }` → `{ user: SessionUser, token }` (실패 401) |
| POST | `/logout` | 토큰 | 토큰 무효화 → 200 |
| GET | `/me` | 토큰 | → `SessionUser` (토큰 무효 시 401) |
| GET | `/word?level=N` | - | 기존과 동일 |
| POST | `/progress` | 토큰 | `{ level, levelRate }` → `{ user: SessionUser, dailyGoalReached }` |
| GET | `/wrong-answers` | 토큰 | → `WrongAnswer[]` |
| POST | `/wrong-answers` | 토큰 | `{ word, meaning, level }` → `WrongAnswer[]` |
| POST | `/review/answer` | 토큰 | `{ word, correct }` → `{ user: SessionUser, wrongAnswers: WrongAnswer[] }` |

## 컴포넌트 / 모듈 구조

### shared
- `shared/lib/study.ts` (+ `study.test.ts`): 스트릭/일일 순수함수.
- `shared/api/types.ts`: `SessionUser`, `WrongAnswer`, `LoginResponse`, `ProgressResponse` 등 추가.
- `shared/api/client.ts`: 토큰 인터셉터.
- `shared/store/userStore.ts`: `SessionUser` 보유(`streak`, `daily` 포함), `setUser`/`clear`/`isBootstrapping` 추가.

### mocks
- `mocks/db.ts`: localStorage 영속화, 세션/토큰, study 데이터 CRUD, `study.ts` 사용.
- `mocks/handlers.ts`: 위 엔드포인트.

### features/auth
- 로그인 성공 시 토큰 저장 + `userStore.setUser`.
- `hooks/useSessionBootstrap.ts`: 부팅 시 `GET /me` 복원, `isBootstrapping` 관리.

### features/quiz
- `useQuiz`: 정답 시 `POST /progress`(응답으로 store 동기화, `dailyGoalReached`면 축하 모달), 오답 시 `POST /wrong-answers`.

### features/review (신규)
- `api/review.ts`: `getWrongAnswers`, `submitReviewAnswer`.
- `hooks/useWrongAnswers.ts`(React Query), `hooks/useReview.ts`(복습 퀴즈 상태, `generateQuiz` 재사용).
- `components/ReviewPage.tsx`: 오답 리스트 + "복습 시작" + 복습 퀴즈 + 완료 축하.
- `index.ts` 배럴.

### features/home
- `UserHome`: 🔥 스트릭, 오늘 목표(correctCount/DAILY_GOAL) 진행, 오답 있으면 "복습하기 (N)" 버튼.

### app
- `App.tsx`: `/review` 라우트 추가(보호 라우트), `isBootstrapping` 시 스플래시.
- `providers.tsx` 또는 App에서 `useSessionBootstrap` 호출.

## 에러 처리

- 토큰 무효/만료(401): 클라이언트가 토큰 제거 후 비로그인 상태로 전환.
- `POST /progress`·`/wrong-answers`·`/review/answer` 실패: 조용히 재시도하지 않고, 진행은 로컬 상태 유지하되 콘솔 경고 로깅(복잡한 분기·외부 연동 로깅 원칙). 사용자 흐름은 막지 않음.
- localStorage 직렬화 실패(용량 등): mock에서 try/catch로 보호하고 인메모리로 폴백.

## 테스트

- `shared/lib/study.test.ts`: `resetDailyIfNeeded`(날짜 동일/변경), `registerDailyCorrect`(같은 날 +1 / 새 날 리셋 후 1), `applyStudyDay`(오늘/어제/공백/최초), `isDailyGoalMet`(경계 9/10/11), `toDateKey`.
- 기존 단위 테스트 17개 유지.
- 비범위: 컴포넌트 통합 테스트(순수함수 단위 테스트 위주 유지).

## 성공 기준

- `pnpm build`·`pnpm lint`·`pnpm test` 무오류 통과.
- 새로고침 후 로그인/진행/오답노트/스트릭 유지.
- 오답 발생 → 오답노트 기록 → 복습에서 정답 시 제거.
- 정답 누적으로 일일목표 달성 시 축하 모달, 연속일에 스트릭 증가.
- 복습이 레벨 진행에 영향을 주지 않음.
- 기존 기능(회원가입/로그인/로그아웃/레벨별 퀴즈/레벨업) 동작 유지.
