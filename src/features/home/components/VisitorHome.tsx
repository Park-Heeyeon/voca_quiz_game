import { useNavigate } from "react-router-dom";
import { Button, Logo } from "@/shared/ui";
import useModal from "@/shared/lib/useModal";
import { LoginModal } from "@/features/auth";

const VisitorHome: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  const openLogin = () =>
    openModal({ type: "login", title: "로그인", content: <LoginModal /> });

  return (
    <div className="flex flex-col items-center pt-14 pb-10 px-2">
      <Logo />

      <div className="relative mt-14 mb-12 h-52 w-full max-w-[260px] mx-auto">
        <div className="absolute inset-0 rounded-card bg-white border border-line shadow-card-sm rotate-[-9deg]" />
        <div className="absolute inset-0 rounded-card bg-brand-soft border border-line shadow-card-sm rotate-[7deg]" />
        <div className="absolute inset-0 rounded-card bg-white border border-line shadow-card flex flex-col items-center justify-center animate-float-card">
          <span className="absolute inset-x-0 top-0 h-2 rounded-t-card bg-gradient-to-r from-brand via-coral to-amber" />
          <span className="text-xs font-semibold tracking-wide uppercase text-ink-soft">
            오늘의 단어
          </span>
          <p className="font-display font-bold text-4xl text-ink mt-1">
            serendipity
          </p>
          <span className="mt-2 text-sm text-brand font-semibold">
            뜻밖의 행운 ✨
          </span>
        </div>
      </div>

      <h1 className="text-center font-display font-bold text-[2rem] leading-tight text-ink">
        단어를 카드로,
        <br />
        공부를 <span className="text-brand">게임처럼</span>
      </h1>
      <p className="mt-3 text-center text-ink-soft leading-relaxed">
        레벨을 올리며 영어 단어를 모아보세요.
        <br />
        하루 몇 분이면 충분해요.
      </p>

      <div className="mt-10 w-full max-w-xs flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate("/signup")}>
          무료로 시작하기
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={openLogin}
        >
          이미 계정이 있어요
        </Button>
      </div>
    </div>
  );
};

export default VisitorHome;
