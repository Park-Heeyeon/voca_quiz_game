import { useNavigate } from "react-router-dom";
import { Button, Card, LevelBadge, ProgressBar } from "@/shared/ui";
import { useUserStore } from "@/shared/store/userStore";
import { useAuth } from "@/features/auth";
import { useWrongAnswers } from "@/features/review";
import { clearStoredToken } from "@/shared/api/client";
import { getRemainingRate } from "@/features/quiz/lib/level";
import { DAILY_GOAL } from "@/shared/lib/study";

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = useUserStore((s) => s.userInfo);
  const storeLogout = useUserStore((s) => s.logout);
  const { logoutMutation } = useAuth();
  const { data: wrongAnswers = [] } = useWrongAnswers();

  if (!userInfo) return null;
  const { nickname, level, levelRate, streak, daily } = userInfo;
  const remaining = getRemainingRate(levelRate);
  const dailyPct = Math.min((daily.correctCount / DAILY_GOAL) * 100, 100);

  const onLogout = () =>
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearStoredToken();
        storeLogout();
      },
    });

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

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card className="p-5">
          <p className="text-sm text-ink-soft">연속 학습</p>
          <p className="font-display font-bold text-3xl text-ink mt-1">
            🔥 {streak.current}
            <span className="text-base text-ink-soft">일</span>
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-soft">오늘 목표</p>
          <p className="font-display font-bold text-3xl text-mint mt-1">
            {daily.correctCount}
            <span className="text-base text-ink-soft">/{DAILY_GOAL}</span>
          </p>
        </Card>
      </div>

      <Card className="mt-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-semibold text-ink">레벨 진행률</span>
          <span className="font-display font-bold text-2xl text-brand">
            {levelRate}
            <span className="text-base text-ink-soft">%</span>
          </span>
        </div>
        <ProgressBar value={levelRate} />
        <p className="mt-3 text-sm text-ink-soft">
          다음 레벨까지 <span className="font-bold text-coral">{remaining}%</span>{" "}
          남았어요.
        </p>
        <p className="mt-1 text-xs text-ink-soft">오늘 목표 {dailyPct}% 달성</p>
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate("/quiz")}>
          퀴즈 시작하기
        </Button>
        {wrongAnswers.length > 0 && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate("/review")}
          >
            복습하기 ({wrongAnswers.length})
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={onLogout}>
          오늘은 그만할래요
        </Button>
      </div>
    </div>
  );
};

export default UserHome;
