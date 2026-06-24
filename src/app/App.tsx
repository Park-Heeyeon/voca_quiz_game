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
