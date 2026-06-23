import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuiz } from "../hooks/useQuiz";
import { Button, Card } from "@/shared/ui";

const QuizPage = () => {
  const navigate = useNavigate();
  const { quiz, submit, level } = useQuiz();

  return (
    <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md">
      <AiOutlineLeft
        className="absolute top-4 left-4 cursor-pointer text-muted w-6 h-6"
        onClick={() => navigate("/")}
      />
      <div className="flex flex-col items-center justify-center h-screen p-4">
        {quiz && (
          <motion.div
            key={quiz.word}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <Card className="mb-4 w-full max-w-md text-center mx-auto">
              <span className="inline-flex mb-6 px-3 py-1 rounded-full bg-primary/10 text-primary-dark font-bold text-sm">
                Level {level}
              </span>
              <h1 className="text-3xl font-bold mb-10">{quiz.word}</h1>
              <div className="flex flex-col space-y-3 items-center">
                {quiz.options.map((option) => (
                  <Button
                    key={option}
                    variant="secondary"
                    className="w-[70%]"
                    onClick={() => submit(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
