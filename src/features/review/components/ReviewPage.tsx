import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useReview } from "../hooks/useReview";
import { Button, Card, WordCard } from "@/shared/ui";

const OPTION_LABELS = ["A", "B", "C"];

const ReviewPage = () => {
  const navigate = useNavigate();
  const { isLoading, started, quiz, start, submit, wrongAnswers } = useReview();

  return (
    <div className="min-h-screen flex flex-col mx-auto w-full max-w-md px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          aria-label="홈으로"
          onClick={() => navigate("/")}
          className="grid place-items-center w-10 h-10 rounded-full bg-white border border-line text-ink-soft hover:text-ink transition"
        >
          <AiOutlineLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ink">오답 복습</h1>
      </div>

      {isLoading ? null : !started ? (
        wrongAnswers.length === 0 ? (
          <Card className="text-center mt-10">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-ink">복습할 오답이 없어요!</p>
            <p className="text-sm text-ink-soft mt-1">
              퀴즈를 풀며 단어를 모아보세요.
            </p>
            <Button className="w-full mt-6" onClick={() => navigate("/quiz")}>
              퀴즈 풀러 가기
            </Button>
          </Card>
        ) : (
          <Card>
            <p className="font-semibold text-ink mb-4">
              틀린 단어 {wrongAnswers.length}개
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {wrongAnswers.map((w) => (
                <li
                  key={w.word}
                  className="flex items-center justify-between rounded-2xl bg-cloud px-4 py-3"
                >
                  <span className="font-display font-semibold text-ink">
                    {w.word}
                  </span>
                  <span className="text-sm text-ink-soft">{w.meaning}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={start}>
              복습 시작하기
            </Button>
          </Card>
        )
      ) : quiz ? (
        <motion.div
          key={quiz.word}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-7"
        >
          <WordCard word={quiz.word} tag="복습 — 이 단어의 뜻은?" />
          <div className="flex flex-col gap-3">
            {quiz.options.map((option, index) => (
              <Button
                key={option}
                variant="secondary"
                size="lg"
                className="w-full justify-start gap-3 font-semibold"
                onClick={() => submit(option)}
              >
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-soft text-brand text-sm font-bold">
                  {OPTION_LABELS[index]}
                </span>
                {option}
              </Button>
            ))}
          </div>
        </motion.div>
      ) : (
        <Card className="text-center mt-10">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold text-ink">복습 완료!</p>
          <p className="text-sm text-ink-soft mt-1">오답을 모두 맞혔어요.</p>
          <Button className="w-full mt-6" onClick={() => navigate("/")}>
            홈으로
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ReviewPage;
