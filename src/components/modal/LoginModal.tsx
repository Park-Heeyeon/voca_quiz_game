import { useNavigate } from "react-router-dom";
import useModal from "@/utils/useModal";
import { useForm } from "react-hook-form";
import InputField from "../common/InputField";
import { LoginFormType } from "@/types";
import { Form } from "../ui/form";
import Button from "../common/Button";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { requestLogin } from "@/api";
import { isLoggedInState } from "@/atom/isLoggedInState";
import { useCallback } from "react";
import { userListState } from "@/atom/userListState";
import { userInfoState } from "@/atom/userInfoState";

const LoginModal: React.FC = () => {
  const { openModal, closeAllModal } = useModal();
  const navigate = useNavigate();
  const userList = useRecoilValue(userListState);
  const setUserInfo = useSetRecoilState(userInfoState);
  const setIsLoggedIn = useSetRecoilState(isLoggedInState);

  const form = useForm({
    defaultValues: {
      id: "",
      password: "",
    },
  });

  const handleOnSubmit = (data: LoginFormType) => {
    const { id, password } = data;

    // 아이디, 비밀번호 미입력 검사
    if (id === "" || password === "") {
      openModal({
        content: "아이디, 비밀번호를 입력해주세요",
      });
      return;
    }

    // 전역 상태에 저장된 아이디/비밀번호와 입력한 아이디/비밀번호 일치 검사
    const matchedUser = userList.find(
      (user) => id === user.id && password === user.password
    );

    if (!matchedUser) {
      openModal({
        content: "아이디 또는 비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    // 위 조건을 모두 통과한 경우 로그인 API 요청
    requestLogin({ id, password })
      .then(() => {
        openModal({
          content: "로그인에 성공했습니다.",
          clickEvent: () => {
            closeAllModal();
            setIsLoggedIn(true); // 로그인 성공 시 Recoil 상태 업데이트
            setUserInfo(matchedUser);
            navigate("/"); // 로그인 후 이동할 페이지
          },
        });
      })
      .catch(() => {
        openModal({
          title: "에러",
          content: `로그인 요청 중 문제가 발생했습니다.`,
        });
      });
  };

  const onClickSignUp = useCallback(() => {
    closeAllModal();
    navigate("/signup");
  }, [navigate, closeAllModal]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleOnSubmit)}
        className="relative space-y-4 overflow-x-hidden"
      >
        {/** 아이디 */}
        <InputField<LoginFormType>
          control={form.control}
          name="id"
          label="아이디"
          placeholder="아이디를 입력해주세요"
        />
        {/** 비밀번호 */}
        <InputField<LoginFormType>
          control={form.control}
          type="password"
          name="password"
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
        />
        <Button type="submit" size="lg" className="w-full !mt-6">
          로그인
        </Button>
        <p className="text-center text-sm text-ink-soft">
          아직 계정이 없나요?{" "}
          <button
            type="button"
            onClick={onClickSignUp}
            className="font-semibold text-brand hover:underline"
          >
            회원가입
          </button>
        </p>
      </form>
    </Form>
  );
};

export default LoginModal;
