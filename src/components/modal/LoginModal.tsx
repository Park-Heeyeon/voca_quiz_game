import { useNavigate } from "react-router-dom";
import useModal from "@/utils/useModal";
import { useForm } from "react-hook-form";
import InputField from "../common/InputField";
import { LoginFormType } from "@/types";
import { Form } from "../ui/form";
import Button from "../common/Button";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userInfoState } from "@/atom/userInfoState";
import { useMutation } from "@tanstack/react-query";
import { requestLogin } from "@/api";
import { isLoggedInState } from "@/atom/isLoggedInState";
import { useCallback } from "react";

const LoginModal: React.FC = () => {
  const { openModal, closeAllModal } = useModal();
  const navigate = useNavigate();
  const userInfo = useRecoilValue(userInfoState);
  const setIsLoggedIn = useSetRecoilState(isLoggedInState);

  const { mutate } = useMutation({
    mutationFn: requestLogin,
  });

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
    if (id !== userInfo.id || password !== userInfo.password) {
      openModal({
        content: "아이디 또는 비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    // 위 조건을 모두 통과한 경우 로그인 API 요청
    mutate(
      { id, password },
      {
        onSuccess: () => {
          // 로그인 성공 시 Recoil 상태 업데이트
          setIsLoggedIn(true);

          openModal({
            content: "로그인에 성공했습니다.",
            clickEvent: () => {
              closeAllModal();
              navigate("/"); // 로그인 후 이동할 페이지
            },
          });
        },
        onError: (error) => {
          openModal({
            title: "에러",
            content: `로그인 중 문제가 발생했습니다: ${error.message}`,
          });
        },
      }
    );
  };

  const onClickSignUp = useCallback(() => {
    closeAllModal();
    navigate("/signup");
  }, [navigate, closeAllModal]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleOnSubmit)}
        className="relative p-1 pb-0 space-y-3 overflow-x-hidden"
      >
        {/** 아이디 */}
        <InputField<LoginFormType>
          control={form.control}
          name="id"
          placeholder="ID"
        />
        {/** 비밀번호 */}
        <InputField<LoginFormType>
          control={form.control}
          type="password"
          name="password"
          placeholder="PASSWORD"
        />
        <div className="btn-box space-y-2 h-full">
          <Button
            type="submit"
            text="Submit"
            style="bg-customDepBlueColor hover:bg-customBlueColor w-full h-auto py-2"
          />
          <Button
            text="Sign Up"
            style="bg-customGrayColor w-full h-auto py-2"
            clickEvent={onClickSignUp}
          />
        </div>
      </form>
    </Form>
  );
};

export default LoginModal;
