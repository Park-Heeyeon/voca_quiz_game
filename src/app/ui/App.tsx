import { Route, Routes, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { QuizPage } from "@/pages/quiz";
import { SignUpPage } from "@/pages/signup";
import { Logo } from "@/shared/ui";
import useUserInfo from "@/shared/lib/hooks/useUserInfo";
import { useAuthStore } from "@/shared/model/authStore";

const App: React.FC = () => {
  // 첫 조회가 끝나야 로그인 여부가 정해진다. 그 전에 라우팅하면 로그인 화면이 스쳐 지나간다.
  const { isLoading } = useUserInfo();
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  if (isLoading) {
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
    </Routes>
  );
};

export default App;
