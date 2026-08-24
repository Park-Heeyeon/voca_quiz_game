import { useForm } from "react-hook-form";
import { Form } from "@/shared/ui/primitives/form";
import { InputField, Button } from "@/shared/ui";
import { SignUpSchema, useSignUp } from "../model";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpFormType } from "../types";

import useModal from "@/shared/lib/hooks/useModal";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";

const SignUpForm: React.FC = () => {
  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      nickname: "",
      id: "",
      password: "",
      confirmPassword: ""
    }
  });

  const navigate = useNavigate();
  const { openModal } = useModal();
  const { handleSubmit, control } = form;

  const signUpMutation = useSignUp();

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit((data) =>
          // 중복 검사는 서버가 한다. 실패하면 서버가 내려준 메시지를 그대로 보여준다.
          signUpMutation.mutate(data, {
            onSuccess: () =>
              openModal({
                content: "회원가입이 정상적으로 처리되었습니다.",
                clickEvent: () => navigate("/")
              }),
            onError: (error) => {
              const message = isAxiosError(error)
                ? error.response?.data?.message
                : null;
              openModal({
                title: "에러",
                content: message ?? "회원가입 요청 중 문제가 발생했습니다."
              });
            }
          })
        )}
        className='relative space-y-4 overflow-x-hidden'
      >
        {/** 닉네임  */}
        <InputField<SignUpFormType>
          control={control}
          name='nickname'
          label='닉네임'
        />
        {/** 아이디  */}
        <InputField<SignUpFormType>
          control={control}
          name='id'
          label='아이디'
          placeholder='영문 숫자 조합 5글자 이상'
        />
        {/** 비밀번호  */}
        <InputField<SignUpFormType>
          control={control}
          name='password'
          type='password'
          label='비밀번호'
          placeholder='영문, 숫자, 특수문자 조합 8글자 이상'
        />
        {/** 비밀번호 확인 */}
        <InputField<SignUpFormType>
          control={control}
          name='confirmPassword'
          type='password'
          label='비밀번호 확인'
          placeholder='비밀번호를 한 번 더 입력해주세요'
        />
        <Button
          type='submit'
          size='lg'
          className='w-full !mt-7'
          disabled={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? "가입 중..." : "가입하기"}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
