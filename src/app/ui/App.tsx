import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import useUserInfo from "@/shared/lib/hooks/useUserInfo";
import { useAuthStore } from "@/shared/model/authStore";
import PageLoader from "./PageLoader";
import Splash from "./Splash";

const HomePage = lazy(() => import("@/pages/home"));
const QuizPage = lazy(() => import("@/pages/quiz"));
const SignUpPage = lazy(() => import("@/pages/signup"));

const App: React.FC = () => {
  // 첫 조회가 끝나야 로그인 여부가 정해진다. 그 전에 라우팅하면 로그인 화면이 스쳐 지나간다.
  const { isLoading } = useUserInfo();
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  if (isLoading) return <Splash />;

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
};

export default App;
