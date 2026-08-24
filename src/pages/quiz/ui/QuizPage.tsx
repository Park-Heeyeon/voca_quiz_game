import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnswerModal, useQuiz } from "@/features/quiz";
import { Button, ProgressBar, WordCard } from "@/shared/ui";
import useModal from "@/shared/lib/hooks/useModal";

const OPTION_LABELS = ["A", "B", "C"];

const QuizPage = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { quiz, level, levelRate, nextQuiz, submitAnswer, isSubmitting } =
    useQuiz();

  const onClickOption = (option: string) => {
    submitAnswer(option)
      .then(({ correct, isMaxed }) => {
        if (!correct) {
          openModal({ type: "custom", content: <AnswerModal isAnswer={false} /> });
          return;
        }

        if (isMaxed) {
          openModal({
            content: "정답이지만, 레벨3 이후의 서비스는 준비중이에요😢💧",
            clickEvent: () => navigate("/"),
          });
          return;
        }

        openModal({
          type: "custom",
          content: <AnswerModal isAnswer />,
          clickEvent: nextQuiz,
        });
      })
      .catch(() => openModal({ content: "진행 상황을 저장하지 못했어요." }));
  };

  return (
    <div className="min-h-screen flex flex-col mx-auto w-full max-w-md px-4 pt-6 pb-10">
      <div className="flex items-center gap-3">
        <button
          aria-label="홈으로"
          onClick={() => navigate("/")}
          className="grid place-items-center w-10 h-10 rounded-full bg-white border border-line text-ink-soft hover:text-ink transition"
        >
          <AiOutlineLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <ProgressBar value={levelRate} />
        </div>
        <span className="font-display font-semibold text-sm text-brand whitespace-nowrap">
          Lv.{level}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-7">
        {quiz && (
          <motion.div
            key={quiz.word}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-7"
          >
            <WordCard word={quiz.word} tag="이 단어의 뜻은?" />
            <div className="flex flex-col gap-3">
              {quiz.options.map((option, index) => (
                <Button
                  key={option}
                  variant="secondary"
                  size="lg"
                  className="w-full justify-start gap-3 font-semibold"
                  disabled={isSubmitting}
                  onClick={() => onClickOption(option)}
                >
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-soft text-brand text-sm font-bold">
                    {OPTION_LABELS[index]}
                  </span>
                  {option}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
