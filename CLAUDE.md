# CLAUDE.md

## 프로젝트

React 영어 단어 퀴즈 게임. 레벨별로 단어를 출제하고 정답률에 따라 레벨이 오른다.

React 18 · TypeScript · Vite · Zustand 5 · TanStack Query 5 · MSW 2 · React Router 6 · RHF + Zod · Tailwind + shadcn/ui · Node 22 · pnpm

## 현재 상태

- FSD 4레이어 구조다. 아래 폴더 구조 항목을 따른다.
- Recoil은 제거됐다. 클라이언트 상태는 Zustand, 서버 상태는 TanStack Query.
- 자격 검증·중복 검사·레벨 계산은 모두 서버가 한다. 클라이언트 검증은 남아 있지 않다.
- 세션 복원은 `shared/lib/hooks/useUserInfo.ts`의 `useQuery(["me"])`가 겸한다. accessToken이 없어 401이 나면 인터셉터가 쿠키로 재발급하므로 별도 refresh 호출이 필요 없다.
- `src/mocks/`는 레이어가 아니다. MSW 가짜 백엔드이고 앱은 `main.tsx`의 worker 기동 외에는 참조하지 않는다. 실제 백엔드로 바꾸면 폴더째 지운다.

남은 과제.

- 테스트가 없다. `features/quiz/model.ts`의 `pickQuiz`, `mocks/db.ts`의 `advance`, 재발급 인터셉터가 우선순위가 높다.
- MSW가 환경 구분 없이 항상 켜진다. 프로덕션 번들에도 포함된다.

## 폴더 구조

레이어는 `app → pages → features → shared` 4개. `widgets`, `entities`는 쓰지 않는다.

세그먼트 이름은 FSD 표준을 따른다. `ui` `api` `model` `lib` `config`

```
app/       ui/  providers/  styles/  index.ts
pages/     home/ui/  quiz/ui/  signup/ui/   (슬라이스마다 index.ts)
features/  auth/ui/ + api.ts  model.ts  types.ts  index.ts
shared/    api/  ui/  lib/  model/
```

- 슬라이스 안에서 상태·타입·요청은 폴더가 아니라 `model.ts` `types.ts` `api.ts` 파일로 둔다.
- 여러 feature가 함께 쓰는 것은 feature 하위에 두지 않고 `shared`로 내린다.

#### 임포트 규칙

- 임포트는 상위에서 하위로만 흐른다.
- 같은 레이어의 슬라이스끼리 임포트하지 않는다. 공유가 필요하면 `shared`로 내린다.
- 슬라이스는 `index.ts`로만 노출한다.
- **레이어 배럴은 만들지 않는다.** `@/pages`가 아니라 `@/pages/home`처럼 슬라이스에서 직접 가져온다.

```ts
import { HomePage } from "@/pages/home";   // O
import { HomePage } from "@/pages";        // X
```

## 상태 배치

| 대상               | 위치                                              |
| ------------------ | ------------------------------------------------- |
| accessToken        | `shared/model/authStore.ts` — 메모리만, persist 금지 |
| refreshToken       | HttpOnly 쿠키 — 코드가 직접 만지지 않는다          |
| user 프로필        | `useQuery(["me"])` — `shared/lib/hooks/useUserInfo.ts` |
| 모달               | `shared/model/modalStore.ts`                       |
| 회원 목록·비밀번호 | 클라이언트에 두지 않는다 (`src/mocks/db.ts`)       |

- 서버에서 온 데이터는 Query 캐시가 단일 출처다. Zustand로 복사하지 않는다.
- `isLoggedIn`은 별도 상태로 두지 않고 토큰 유무에서 파생한다.

## 코드 규칙

- 조회는 `useQuery`, 변경은 `useMutation`. 요청 함수를 `.then()`으로 직접 호출하지 않는다.
- 이름은 짧고 직관적으로 짓는다.
- 불필요한 추상화·헬퍼를 만들지 않는다. 미사용 변수·함수·파일을 남기지 않는다. 외부에서 안 쓰면 `export` 하지 않는다.
- 두 곳 이상 쓰는 컴포넌트는 `shared/ui/`로 분리한다. 도메인 지식이 박혀 있으면 feature에 둔다.
- 페이지는 `lazy()`로 나누고 라우터에서 `<Suspense fallback={<PageLoader />}>`로 감싼다. 부팅 스플래시(`Splash`)와 라우트 로딩(`PageLoader`)은 지속 시간이 달라 구분해서 쓴다. 둘 다 라우팅 맥락이라 `app/ui`에 둔다. 페이지 슬라이스의 `index.ts`는 `export { default }` 형태로 둬야 `lazy(() => import("@/pages/home"))`가 바로 된다.
- 무겁고 항상 쓰이지는 않는 컴포넌트도 `lazy()` 대상이다. confetti는 정답 순간에만 받아온다.
- 주석은 코드로 알 수 없는 의도만 짧게 남긴다.

## MSW

- 인증은 핸들러가 처리한다. 저장소는 `db.ts`, 핸들러는 `handlers.ts`.
- 응답은 성공 `{ code, status, data }`, 실패 `{ code, message }` + HTTP 상태코드.
- 레벨 계산은 서버가 한다. 클라이언트가 다음 레벨값을 만들어 보내지 않는다.
- 시드 계정 `test1234` / `Test1234!`. 저장소 초기화는 `voca-mock-db` 키 삭제.
- accessToken TTL은 데모용 30초다.
- MSW 쿠키는 `localStorage`에 저장된다. HttpOnly 흉내일 뿐 실제 보안이 아니다.

### 토큰 재발급

401이면 응답 인터셉터가 `/refresh` 후 원요청을 재시도한다. 화면 코드는 401을 다루지 않는다.

- 재발급은 동시에 한 번만 (`refreshing` 프로미스 공유).
- 재시도는 한 번만 (`config.retried`).
- `/login` `/refresh`는 재발급 대상에서 제외한다(`NO_RETRY_PATHS`).
- refresh는 인터셉터가 걸리지 않은 순수 `axios`로 호출한다.

## 확인

```bash
pnpm build
pnpm lint
```
