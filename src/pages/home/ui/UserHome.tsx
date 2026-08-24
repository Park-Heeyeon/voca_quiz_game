import { useNavigate } from "react-router-dom";
import { useLogout } from "@/features/auth";
import { Button, Card, LevelBadge, ProgressBar } from "@/shared/ui";
import useUserInfo from "@/shared/lib/hooks/useUserInfo";

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const { data: userInfo } = useUserInfo();
  const { isPending, mutate } = useLogout();

  if (!userInfo) return null;

  const { nickname, level, levelRate } = userInfo;

  return (
    <div className='flex flex-col pt-14 pb-10 px-2'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-ink-soft text-sm'>반가워요</p>
          <h1 className='font-display font-bold text-2xl text-ink'>
            {nickname} 님 👋
          </h1>
        </div>
        <LevelBadge level={level} />
      </div>

      <Card className='mt-6'>
        <div className='flex items-baseline justify-between mb-2'>
          <span className='font-semibold text-ink'>레벨 진행률</span>
          <span className='font-display font-bold text-2xl text-brand'>
            {levelRate}
            <span className='text-base text-ink-soft'>%</span>
          </span>
        </div>
        <ProgressBar value={levelRate} />
        <p className='mt-3 text-sm text-ink-soft'>
          다음 레벨까지{" "}
          <span className='font-bold text-coral'>{100 - levelRate}%</span>{" "}
          남았어요.
        </p>
      </Card>

      <div className='mt-8 flex flex-col gap-3'>
        <Button size='lg' className='w-full' onClick={() => navigate("/quiz")}>
          퀴즈 시작하기
        </Button>
        <Button
          variant='ghost'
          className='w-full'
          disabled={isPending}
          onClick={() => mutate()}
        >
          오늘은 그만할래요
        </Button>
      </div>
    </div>
  );
};

export default UserHome;
