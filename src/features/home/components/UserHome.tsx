import MainImg from "@public/images/main_img.png";
import { useNavigate } from "react-router-dom";
import { Button, ProgressBar, LevelBadge } from "@/shared/ui";
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

  const onLogout = () =>
    logoutMutation.mutate(undefined, { onSuccess: storeLogout });

  return (
    <>
      <div className="img-container flex justify-center mt-40 md:mt-32">
        <img
          src={MainImg}
          alt="Profile Logo"
          className="w-full h-auto max-h-80"
        />
      </div>
      <div className="text-center mt-8 px-4">
        <div className="flex justify-center mb-3">
          <LevelBadge level={level} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          {nickname} 님, 다음 레벨까지 {getRemainingRate(levelRate)}% 남았어요!
        </h3>
        <ProgressBar value={levelRate} />
        <p className="text-base text-gray-500 mt-3">
          다음 레벨을 향해 퀴즈를 풀러 가볼까요?
        </p>
        <div className="flex mt-6 justify-center gap-2">
          <Button onClick={() => navigate("/quiz")}>퀴즈 풀기</Button>
          <Button variant="secondary" onClick={onLogout}>
            오늘은 그만
          </Button>
        </div>
      </div>
    </>
  );
};

export default UserHome;
