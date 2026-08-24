import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { useLogin } from "../model";
import { LoginFormType } from "../types";
import useModal from "@/shared/lib/hooks/useModal";
import { Button, InputField } from "@/shared/ui";
import { Form } from "@/shared/ui/primitives/form";

const LoginModal: React.FC = () => {
  const { openModal, closeAllModal } = useModal();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const form = useForm<LoginFormType>({
    defaultValues: {
      id: "",
      password: ""
    }
  });

  const handleOnSubmit = ({ id, password }: LoginFormType) => {
    if (!id || !password) {
      openModal({ content: "아이디, 비밀번호를 입력해주세요" });
      return;
    }

    // 자격 검증은 서버가 한다. 실패하면 서버가 내려준 메시지를 그대로 보여준다.
    loginMutation.mutate(
      { id, password },
      {
        onSuccess: () => {
          closeAllModal();
          navigate("/");
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? error.response?.data?.message
            : null;
          openModal({
            content: message ?? "로그인 요청 중 문제가 발생했습니다."
          });
        }
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
        className='relative space-y-4 overflow-x-hidden'
      >
        <InputField<LoginFormType>
          control={form.control}
          name='id'
          label='아이디'
          placeholder='아이디를 입력해주세요'
        />
        <InputField<LoginFormType>
          control={form.control}
          type='password'
          name='password'
          label='비밀번호'
          placeholder='비밀번호를 입력해주세요'
        />
        <Button
          type='submit'
          size='lg'
          className='w-full !mt-6'
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </Button>
        <p className='text-center text-sm text-ink-soft'>
          아직 계정이 없나요?{" "}
          <button
            type='button'
            onClick={onClickSignUp}
            className='font-semibold text-brand hover:underline'
          >
            회원가입
          </button>
        </p>
      </form>
    </Form>
  );
};

export default LoginModal;
