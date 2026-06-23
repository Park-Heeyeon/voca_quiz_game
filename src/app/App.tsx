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
