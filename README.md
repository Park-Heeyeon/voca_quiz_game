# Hello, Voca Quiz Game: 언어 학습 앱

이 프로젝트는 **React.js**와 **TypeScript**를 사용하여 개발된 언어 학습 애플리케이션입니다. 사용자에게 단어 학습과 레벨별 퀴즈 기능을 제공하여 효과적으로 학습 진도를 관리하고 맞춤형 퀴즈를 제공합니다.

## 이 프로젝트에서 보여주려는 것

프론트엔드 개발자로서 다음 세 가지에 집중했습니다.

1. **클린 아키텍처 / 관심사 분리**: 피처 기반 폴더 구조와 React 무관 도메인 로직 분리
2. **모던 스택 / UX 폴리시**: React Query, Zustand, framer-motion 기반의 매끄러운 상호작용
3. **테스트 용이성**: 도메인 순수함수에 대한 단위 테스트(Vitest)

## 주요 기술 스택

- **React 18** + **TypeScript** + **Vite**
- **상태 관리**: Zustand (전역 사용자/모달 상태), TanStack Query (서버 상태)
- **폼/검증**: React Hook Form + Zod
- **스타일링**: Tailwind CSS + class-variance-authority (디자인 시스템)
- **모킹 백엔드**: MSW (인메모리 사용자 저장소로 인증 자격검증까지 처리)
- **애니메이션**: framer-motion, react-canvas-confetti
- **테스트**: Vitest
- **패키지 매니저**: pnpm

## 아키텍처

타입 기반 폴더 구조를 **피처 기반(feature-based)** 으로 재편하고, 도메인 로직을 UI에서 분리했습니다.

```
src/
  app/                  # App, 라우팅, 프로바이더
  features/
    auth/               # 로그인·회원가입·로그아웃 (api/hooks/components/schemas)
    home/               # 방문자/사용자 홈
    quiz/               # 퀴즈 (useQuiz 훅, generateQuiz·level 도메인)
  shared/
    ui/                 # 디자인 시스템 (Button, Card, ProgressBar, LevelBadge, Confetti...)
    store/              # Zustand 스토어 (userStore, modalStore)
    api/                # axios 클라이언트 + 공유 타입
    lib/                # 유틸 (cn, useModal)
  mocks/                # MSW 인메모리 mock 백엔드
  pages/                # 페이지 조합
```

### 핵심 설계 포인트

- **도메인 로직 중앙화**: 레벨/진행률 판정(`features/quiz/lib/level.ts`)과 퀴즈 생성(`features/quiz/lib/generateQuiz.ts`)을 React 무관 순수함수로 분리. 매직넘버는 `LEVEL_CONFIG` 단일 출처로 통합.
- **인증 로직의 책임 이동**: 자격 검증을 컴포넌트에서 MSW 인메모리 백엔드로 옮겨, 클라이언트는 React Query mutation만 호출.
- **주입 가능한 rng**: `generateQuiz`는 난수 생성기를 주입받아 셔플 동작을 결정적으로 테스트.

## 실행 및 테스트

```bash
pnpm install
pnpm dev        # 개발 서버 (MSW mock 백엔드 자동 활성)
pnpm test       # 단위 테스트 (Vitest)
pnpm build      # 타입체크 + 프로덕션 빌드
pnpm lint       # ESLint
```

단위 테스트는 도메인 순수함수와 스토어를 대상으로 합니다.

- `level.test.ts`: 진행률 증가, 레벨업 경계(90% → 레벨업), 최대 레벨 처리
- `generateQuiz.test.ts`: 보기 3개·정답 포함·중복 제거·결정성·엣지 케이스
- `userStore.test.ts`: 로그인/로그아웃/진행률 갱신

## 주요 페이지
### 진입화면 
<img width="331" alt="스크린샷 2024-10-27 오전 12 05 32" src="https://github.com/user-attachments/assets/157aa1bc-57e4-4841-be82-023c45244ff1">

### 회원가입
<img width="329" alt="스크린샷 2024-10-27 오전 12 05 39" src="https://github.com/user-attachments/assets/035514c3-88fa-4a4b-948d-da6542673da0">
<img width="335" alt="스크린샷 2024-10-27 오전 12 05 47" src="https://github.com/user-attachments/assets/9f60172e-90b4-41c1-8075-8d853a9765fa">
<img width="336" alt="스크린샷 2024-10-27 오전 12 06 01" src="https://github.com/user-attachments/assets/08f721d3-e2d3-4bfe-815b-44403549e290">

### 로그인
<img width="330" alt="스크린샷 2024-10-27 오전 12 17 31" src="https://github.com/user-attachments/assets/dd8de289-3607-4794-8f05-ae0e69547933">
<img width="328" alt="스크린샷 2024-10-27 오전 12 17 42" src="https://github.com/user-attachments/assets/a6fb99bd-2913-4eee-8741-b538c37c0c6b"><img width="330" alt="스크린샷 2024-10-27 오전 12 17 52" src="https://github.com/user-attachments/assets/32158938-dfa9-4e2e-9364-638db723fdf9">

### 메인화면 
'오늘은 그만'을 클릭하면 로그아웃 후 진입화면으로 이동되도록 로직 설계 
로그인한 사용자의 현재 레벨, 레벨 진행률 표시
<img width="330" alt="스크린샷 2024-10-27 오전 12 18 00" src="https://github.com/user-attachments/assets/782a1e0c-6505-4b09-92dc-587123f1e8e7">

### 퀴즈화면
사용자의 레벨에 따른 영어 단어 퀴즈 출제 

<img width="331" alt="스크린샷 2024-10-27 오전 12 21 18" src="https://github.com/user-attachments/assets/121efc2c-e26a-4ac5-b0c2-2d346a4d576b">

### 정답 여부에 따른 모달 표시 
사용자가 정답을 맞춘 후 다음 문제 풀기 버튼을 클릭하면 랜덤 퀴즈 재갱신
레벨업이 된 경우 레벨업 알림 모달 표출 후 다음 레벨의 랜덤 퀴즈 출제 

<img width="329" alt="스크린샷 2024-10-27 오전 12 24 59" src="https://github.com/user-attachments/assets/9efc80d0-85ed-44be-afb2-1047a25af469">
<img width="326" alt="스크린샷 2024-10-27 오전 12 22 24" src="https://github.com/user-attachments/assets/20b75a92-f373-4738-887e-f974b5f56e87">
<img width="327" alt="스크린샷 2024-10-27 오전 12 25 50" src="https://github.com/user-attachments/assets/02f4fec9-23a3-4713-ac75-9a23755cb133">



