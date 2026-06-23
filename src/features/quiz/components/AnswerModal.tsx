import useModal from "@/shared/lib/useModal";
import { getRemainingRate } from "../lib/level";
import { Button, Confetti } from "@/shared/ui";

interface AnswerModalProps {
  isAnswer: boolean;
  isLevelUp?: boolean;
  level?: number;
  levelRate?: number;
  clickEvent?: () => void;
}

const AnswerModal: React.FC<AnswerModalProps> = ({
  isAnswer,
  isLevelUp = false,
  level = 1,
  levelRate = 0,
  clickEvent,
}) => {
  const { closeAllModal } = useModal();

  const onClickBtn = () => {
    if (clickEvent && !isLevelUp) clickEvent();
    closeAllModal();
  };

  return (
    <div className="text-center">
      {isAnswer && <Confetti fire />}
      <div
        className={`mx-auto grid place-items-center w-16 h-16 rounded-full text-3xl ${
          isAnswer ? "bg-mint/15" : "bg-danger/15"
        }`}
      >
        {isAnswer ? "🎉" : "💧"}
      </div>
      <h2
        className={`mt-4 font-display font-bold text-2xl ${
          isAnswer ? "text-mint" : "text-danger"
        }`}
      >
        {isAnswer ? "정답이에요!" : "아쉬워요"}
      </h2>

      {isAnswer ? (
        <p className="mt-2 text-ink-soft">
          {isLevelUp ? (
            <>
              <span className="font-bold text-brand">Level {level}</span> 로
              올라갔어요!
            </>
          ) : (
            <>
              다음 레벨까지{" "}
              <span className="font-bold text-coral">
                {getRemainingRate(levelRate)}%
              </span>{" "}
              남았어요.
            </>
          )}
        </p>
      ) : (
        <p className="mt-2 text-ink-soft">정답을 다시 생각해볼까요?</p>
      )}

      <Button
        variant={isAnswer ? "mint" : "coral"}
        size="lg"
        className="w-full mt-6"
        onClick={onClickBtn}
      >
        {isAnswer ? "다음 문제 풀기" : "다시 풀어보기"}
      </Button>
    </div>
  );
};

export default AnswerModal;
