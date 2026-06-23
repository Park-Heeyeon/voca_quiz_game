import { useNavigate } from "react-router-dom";
import { Button, Card, LevelBadge, ProgressBar } from "@/shared/ui";
import { useUserStore } from "@/shared/store/userStore";
import { useAuth } from "@/features/auth";
import { getRemainingRate } from "@/features/quiz/lib/level";

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = useUserStore((s) => s.userInfo);
  const storeLogout = useUserStore((s) => s.logout);
  const { logoutMutation } = useAuth();

  if (!userInfo) return null;
  const { nickname, level, levelRate } = userInfo;
  const remaining = getRemainingRate(levelRate);

  const onLogout = () =>
    logoutMutation.mutate(undefined, { onSuccess: storeLogout });

  return (
    <div className="flex flex-col pt-14 pb-10 px-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ink-soft text-sm">반가워요</p>
          <h1 className="font-display font-bold text-2xl text-ink">
            {nickname} 님 👋
          </h1>
        </div>
        <LevelBadge level={level} />
      </div>

      <Card className="mt-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-semibold text-ink">레벨 진행률</span>
          <span className="font-display font-bold text-2xl text-brand">
            {levelRate}
            <span className="text-base text-ink-soft">%</span>
          </span>
        </div>
        <ProgressBar value={levelRate} />
        <p className="mt-3 text-sm text-ink-soft">
          다음 레벨까지{" "}
          <span className="font-bold text-coral">{remaining}%</span> 남았어요.
        </p>
      </Card>

      <div className="mt-6 flex items-center gap-3 rounded-card bg-brand-soft px-5 py-4">
        <span className="text-2xl">🃏</span>
        <p className="text-sm text-ink leading-relaxed">
          단어 카드를 맞힐 때마다{" "}
          <span className="font-bold text-brand">10%</span>씩 채워져요.
        </p>
      </div>

      <div className="mt-9 flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate("/quiz")}>
          퀴즈 시작하기
        </Button>
        <Button variant="ghost" className="w-full" onClick={onLogout}>
          오늘은 그만할래요
        </Button>
      </div>
    </div>
  );
};

export default UserHome;
