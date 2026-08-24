# CLAUDE.md

## 프로젝트

React 기반 영어 단어 퀴즈 게임. 레벨별로 단어를 출제하고 정답률에 따라 레벨이 오른다.

## 스택

|           |                                      |
| --------- | ------------------------------------ |
| 코어      | React 18, TypeScript 5.5, Vite 5     |
| 전역 상태 | Recoil 0.7 → **Zustand로 전환 예정** |
| 서버 상태 | TanStack Query 5                     |
| 목 백엔드 | MSW 2.4                              |
| 라우팅    | React Router 6                       |
| 폼        | React Hook Form + Zod                |
| 스타일    | Tailwind CSS 3.4, shadcn/ui          |
| 런타임    | Node 22, pnpm                        |

## 현재 상태

- 폴더 구조는 타입 기반(`api/` `atom/` `components/` `pages/` `schemas/` `types/` `utils/`)이다. **아직 FSD가 아니다.**
- 전역 상태는 Recoil이다. `zustand`는 아직 설치되어 있지 않다.
- 디자인 시스템(단어 카드 컨셉)은 적용 완료 상태다.

## 전환 목표

### Recoil → Zustand

- `src/atom/*`의 atom을 Zustand store로 교체한다.
- 전환을 시작할 때 `zustand`를 먼저 설치한다.
- **스토리지 접근은 `persist` 미들웨어로 한다.** `localStorage`를 직접 호출하지 않는다.

### 폴더 구조 → FSD

레이어는 4개만 둔다. `widgets`, `entities`는 쓰지 않는다.

```
src/
  app/       프로바이더, 라우팅, 전역 스타일
  pages/     화면 조립 (home, signup, quiz)
  features/  사용자 액션 (auth, quiz-play)
  shared/    도메인에 묶이지 않는 재사용 코드
```

슬라이스 내부는 이렇게 구성한다.

```
features/
  auth/
    ui/         컴포넌트
    model.ts    Zustand store, 훅
    types.ts    타입
    api.ts      서버 요청
    index.ts    public API
```

- 상태와 타입은 폴더가 아니라 `model.ts`, `types.ts` 파일로 둔다.
- 여러 feature가 함께 쓰는 상태·타입은 feature 하위에 두지 않는다. 같은 레이어끼리는 임포트할 수 없으므로 `shared`로 내린다. (예: user 상태는 auth와 quiz-play가 같이 쓴다)

#### 임포트 규칙

- 상위에서 하위로만 흐른다. `app → pages → features → shared`
- 하위가 상위를 참조하지 않는다.
- **같은 레이어의 슬라이스끼리 서로 임포트하지 않는다.** `features/auth`가 `features/quiz-play`를 직접 가져다 쓰면 안 된다. 공유가 필요하면 `shared`로 내린다.
- **슬라이스는 `index.ts`로만 노출한다.** 외부에서 내부 경로를 직접 임포트하지 않는다.

```ts
import { LoginModal } from "@/features/auth";           // O
import LoginModal from "@/features/auth/ui/LoginModal";  // X
```

`entities`를 두지 않으므로 user 상태와 word 모델이 `shared`로 간다. `shared`가 잡동사니가 되지 않게 주의하고, 도메인 지식이 쌓이기 시작하면 그때 `entities` 도입을 다시 검토한다.

## 코드 규칙

### 상태 관리

- **클라이언트 상태는 Zustand.** 모달, 로그인 여부, UI 상태.
- **서버 상태는 TanStack Query.** 서버에서 온 데이터는 Query 캐시가 단일 출처다. Zustand로 복사해두지 않는다.
- TanStack Query 메서드는 역할에 맞게 고른다.
  - 조회는 `useQuery`, 변경은 `useMutation`
  - 변경 후 다시 받아야 하면 `invalidateQueries`, 응답으로 캐시를 바로 덮을 수 있으면 `setQueryData`
  - 요청 함수를 `.then()`으로 직접 호출하지 않는다. `useMutation`을 거쳐 `isPending`, `onError`를 쓴다.

### 네이밍

- 컴포넌트, 변수, 메소드 이름은 **짧고 직관적으로** 짓는다. 설명을 이름에 다 담으려고 길게 늘이지 않는다.
- 무엇인지 바로 읽히는 것이 우선이다.

### 비즈니스 로직

- **불필요한 로직을 넣지 않는다.** 요구에 없는 추상화, 헬퍼, 설정 객체, 주입 지점을 만들지 않는다.
- 한 줄이면 되는 것을 함수로 빼지 않는다.

### 공통 컴포넌트

- 두 곳 이상에서 쓰는 컴포넌트는 `shared/ui/`로 분리한다.
- 단, 특정 도메인 지식이 박혀 있으면 옮기지 않고 해당 feature에 둔다. 재사용 횟수보다 의존이 없는지가 기준이다.

### 코드 스플리팅

- 페이지는 `lazy()`로 나누고 라우터에서 `<Suspense>`로 감싼다.
- 무겁고 항상 쓰이지는 않는 컴포넌트도 `lazy()` 대상이다. (예: 정답 모달에서만 쓰는 confetti)
- 현재 번들은 단일 청크 569KB(gzip 183KB)라 빌드 경고가 난다. 분할한 뒤 수치가 줄었는지 확인한다.

### 주석

- 코드를 읽으면 알 수 있는 내용은 쓰지 않는다.
- 의도가 코드에 드러나지 않는 부분만 짧게 남긴다.

### MSW

- 토큰 인증은 MSW `http` 핸들러에서 처리한다. 핸들러가 `Authorization` 헤더를 읽고 검증하는 방식을 허용한다.
- 목 데이터는 `src/mocks/` 아래에 둔다.

## 확인

코드를 수정한 뒤 타입 체크와 lint를 돌린다.

```bash
pnpm build   # tsc -b + vite build
pnpm lint
```
