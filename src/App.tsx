import { Route, Routes, Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { HomePage, QuizPage, SignUpPage } from "./pages";
import { isLoggedInState } from "./atom/isLoggedInState";
import { Logo } from "@/components";
import useSessionRestore from "@/utils/useSessionRestore";

const App: React.FC = () => {
  const isRestoring = useSessionRestore();
  const isLoggedIn = useRecoilValue(isLoggedInState);

  // 복원 결과가 나오기 전에 라우팅하면 로그인 화면이 잠깐 스쳐 지나간다.
  if (isRestoring) {
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
