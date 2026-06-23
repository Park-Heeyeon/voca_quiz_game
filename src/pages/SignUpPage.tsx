import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { SignUpForm } from "@/features/auth";
import { Card, Logo } from "@/shared/ui";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-6" />
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-5">
          <button
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="grid place-items-center w-9 h-9 rounded-full bg-cloud text-ink-soft hover:text-ink transition"
          >
            <AiOutlineLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-ink">회원가입</h1>
            <p className="text-sm text-ink-soft">단어 모으기를 시작해볼까요?</p>
          </div>
        </div>
        <SignUpForm />
      </Card>
    </div>
  );
};

export default SignUpPage;
