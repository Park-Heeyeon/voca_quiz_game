import useModal from "@/shared/lib/useModal";
import { getRemainingRate } from "../lib/level";
import { Confetti } from "@/shared/ui";

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
    <div>
      {isAnswer && <Confetti fire />}
      <h2 className="text-xl font-semibold text-center mb-2">
        {isAnswer ? "정답이에요 🥳🎉" : "오답이에요 😢💧"}
      </h2>
      {isAnswer ? (
        <p className="text-gray-700 text-center mb-4">
          {isLevelUp ? (
            <>
              <span className="font-bold text-primary-dark">Level {level}</span>
              로 업그레이드 되었어요!
            </>
          ) : (
            <>
              다음 레벨까지{" "}
              <span className="font-bold text-primary-dark">
                {getRemainingRate(levelRate)}%
              </span>{" "}
              남았어요.
            </>
          )}
        </p>
      ) : (
        <p className="text-gray-700 text-center mb-4">
          정답을 다시 생각해보세요!
        </p>
      )}
      <button
        className="w-full py-2 px-4 bg-primary text-white font-bold rounded-lg transition duration-300"
        onClick={onClickBtn}
      >
        {isAnswer ? "다음 문제 풀기" : "다시 풀어보기"}
      </button>
    </div>
  );
};

export default AnswerModal;
