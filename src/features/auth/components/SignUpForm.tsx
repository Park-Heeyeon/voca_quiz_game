import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Form } from "@/shared/ui/primitives/form";
import { Button, InputField } from "@/shared/ui";
import useModal from "@/shared/lib/useModal";
import { SignUpSchema } from "../schemas/signUpSchema";
import { useAuth } from "../hooks/useAuth";

type SignUpFormValues = z.infer<typeof SignUpSchema>;

const SignUpForm: React.FC = () => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      nickname: "",
      id: "",
      password: "",
      confirmPassword: "",
    },
  });

  const navigate = useNavigate();
  const { openModal } = useModal();
  const { handleSubmit, control } = form;
  const { signUpMutation } = useAuth();

  const handleOnSubmit = ({ nickname, id, password }: SignUpFormValues) => {
    signUpMutation.mutate(
      { nickname, id, password },
      {
        onSuccess: () => {
          openModal({
            content: "회원가입이 정상적으로 처리되었습니다.",
            clickEvent: () => navigate("/"),
          });
        },
        onError: (error) => {
          const message =
            isAxiosError(error) && error.response?.data?.message
              ? error.response.data.message
              : "회원가입 요청 중 문제가 발생했습니다.";
          openModal({ title: "에러", content: message });
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleOnSubmit)}
        className="relative space-y-4 overflow-x-hidden"
      >
        <InputField<SignUpFormValues>
          control={control}
          name="nickname"
          label="닉네임"
        />
        <InputField<SignUpFormValues>
          control={control}
          name="id"
          label="아이디"
          placeholder="영문 숫자 조합 5글자 이상"
        />
        <InputField<SignUpFormValues>
          control={control}
          name="password"
          type="password"
          label="비밀번호"
          placeholder="영문, 숫자, 특수문자 조합 8글자 이상"
        />
        <InputField<SignUpFormValues>
          control={control}
          name="confirmPassword"
          type="password"
          label="비밀번호 확인"
          placeholder="비밀번호를 한 번 더 입력해주세요"
        />
        <Button type="submit" size="lg" className="w-full !mt-7">
          가입하기
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
