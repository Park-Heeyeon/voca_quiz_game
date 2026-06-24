import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Form } from "@/shared/ui/primitives/form";
import { Button, InputField } from "@/shared/ui";
import useModal from "@/shared/lib/useModal";
import { setStoredToken } from "@/shared/api/client";
import { useUserStore } from "@/shared/store/userStore";
import type { LoginInput } from "@/shared/api/types";
import { useAuth } from "../hooks/useAuth";

const LoginModal: React.FC = () => {
  const { openModal, closeAllModal } = useModal();
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const { loginMutation } = useAuth();

  const form = useForm<LoginInput>({
    defaultValues: { id: "", password: "" },
  });

  const handleOnSubmit = ({ id, password }: LoginInput) => {
    if (!id || !password) {
      openModal({ content: "아이디, 비밀번호를 입력해주세요" });
      return;
    }

    loginMutation.mutate(
      { id, password },
      {
        onSuccess: (res) => {
          setStoredToken(res.token);
          setUser(res.user);
          closeAllModal();
          navigate("/");
        },
        onError: () => {
          openModal({
            content: "아이디 또는 비밀번호가 일치하지 않습니다.",
          });
        },
      }
    );
  };

  const onClickSignUp = () => {
    closeAllModal();
    navigate("/signup");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleOnSubmit)}
        className="relative space-y-4 overflow-x-hidden"
      >
        <InputField<LoginInput>
          control={form.control}
          name="id"
          label="아이디"
          placeholder="아이디를 입력해주세요"
        />
        <InputField<LoginInput>
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
