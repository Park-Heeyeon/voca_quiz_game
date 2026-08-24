import { useEffect, useState } from "react";
import { AiOutlineLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getWordLevel, requestProgress } from "@/api";
import { userInfoState } from "@/atom/userInfoState";
import { Button, ProgressBar, WordCard } from "@/components";
import AnswerModal from "@/components/modal/AnswerModal";
import { VocaListType } from "@/types";
import useModal from "@/utils/useModal";

const OPTION_LABELS = ["A", "B", "C"];

const QuizPage = () => {
  const [randomWord, setRandomWord] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useRecoilState(userInfoState);
  const level = userInfo.level || 1;
  const levelRate = userInfo.levelRate ?? 0;

  const { openModal } = useModal();
  const navigate = useNavigate();

  const { data, isFetched } = useQuery({
    queryKey: ["wordLevel", level],
    queryFn: () => getWordLevel(level),
    enabled: !!level,
  });

  const getRandomQuiz = () => {
    const vocaList = data?.data; // 단어 목록 배열
    if (!vocaList || vocaList.length === 0) return; // vocaList가 없거나 비어있으면 종료

    const randomIndex = Math.floor(Math.random() * vocaList.length);
    const { word, meaning: correctMeaning } = vocaList[randomIndex]; // 랜덤 단어와 정답 뜻 추출
    setRandomWord(word);
    setAnswer(correctMeaning);

    // 모든 뜻을 배열로 변환하고, 정답의 뜻을 포함하여 랜덤으로 3개 선택
    const meaningsList = Array.from(
      new Set(vocaList.map((item: VocaListType) => item.meaning))
    ); // 중복 제거
    const randomMeanings = meaningsList
      .filter((meaning) => meaning !== correctMeaning) // 정답 제외
      .sort(() => Math.random() - 0.5) // 랜덤 섞기
      .slice(0, 2); // 2개 선택

    randomMeanings.push(correctMeaning); // 정답 추가
    const randomOptions = randomMeanings.sort(() => Math.random() - 0.5); // 옵션 랜덤으로 섞기
    setOptions(randomOptions as string[]); // 상태 업데이트
  };

  const onClickOption = (selectOption: string) => {
    if (answer === selectOption) {
      if (userInfo.level === 3 && userInfo.levelRate === 90) {
        // 정답 알림 팝업 표출
        openModal({
          content: "정답이지만, 레벨3 이후의 서비스는 준비중이에요😢💧",
          clickEvent: () => {
            navigate("/");
          },
        });
      } else {
        requestProgress(true)
          .then((response) => {
            setUserInfo(response.data);
            openModal({
              type: "custom",
              content: <AnswerModal isAnswer={true} />,
              clickEvent: () => {
                getRandomQuiz();
              },
            });
          })
          .catch(() => {
            openModal({ content: "진행 상황을 저장하지 못했어요." });
          });
      }
    } else {
      openModal({
        type: "custom",
        content: <AnswerModal isAnswer={false} />,
      });
    }
  };

  useEffect(() => {
    if (isFetched && data) {
      getRandomQuiz();
    }
  }, [isFetched, data]); // data와 isFetched가 변경될 때마다 퀴즈 갱신

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
        {randomWord && (
          <motion.div
            key={randomWord}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-7"
          >
            <WordCard word={randomWord} tag="이 단어의 뜻은?" />
            <div className="flex flex-col gap-3">
              {options.map((option, index) => (
                <Button
                  key={option}
                  variant="secondary"
                  size="lg"
                  className="w-full justify-start gap-3 font-semibold"
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
