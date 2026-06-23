import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Form } from "@/shared/ui/primitives/form";
import { Button, InputField } from "@/shared/ui";
import useModal from "@/shared/lib/useModal";
import { useUserStore } from "@/shared/store/userStore";
import type { LoginInput } from "@/shared/api/types";
import { useAuth } from "../hooks/useAuth";

const LoginModal: React.FC = () => {
  const { openModal, closeAllModal } = useModal();
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
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
        onSuccess: (user) => {
          login(user);
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
        className="relative p-1 pb-0 space-y-3 overflow-x-hidden"
      >
        <InputField<LoginInput>
          control={form.control}
          name="id"
          placeholder="ID"
        />
        <InputField<LoginInput>
          control={form.control}
          type="password"
          name="password"
          placeholder="PASSWORD"
        />
        <div className="btn-box space-y-2 h-full">
          <Button type="submit" className="w-full">
            Submit
          </Button>
          <Button variant="secondary" className="w-full" onClick={onClickSignUp}>
            Sign Up
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginModal;
