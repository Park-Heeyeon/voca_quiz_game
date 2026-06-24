import * as z from "zod";

const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$&*?!%])[A-Za-z\d!@$%&*?]{8,15}$/;

export const SignUpSchema = z
  .object({
    nickname: z.string().min(1, {
      message: "닉네임을 입력해주세요",
    }),
    id: z.string().min(5, {
      message: "5자리 이상 입력해주세요",
    }),
    password: z
      .string()
      .min(7, {
        message: "7자리 이상 입력해주세요",
      })
      .regex(passwordRegex, {
        message: "영문, 숫자, 특수문자(~!@#$%^&*)를 모두 조합해 주세요.",
      }),
    confirmPassword: z.string().min(1, {
      message: "비밀번호를 입력해주세요.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "비밀번호가 일치하지 않습니다.",
  });
