import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/model/authStore";
import { login, logout, signup } from "./api";

// 토큰과 프로필 캐시만 세운다. 모달과 화면 전환은 호출한 쪽에서 한다.
export const useLogin = () => {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: login,
    onSuccess: ({ user, accessToken }) => {
      setAccessToken(accessToken);
      queryClient.setQueryData(["me"], user);
    }
  });
};

export const useSignUp = () => useMutation({ mutationFn: signup });

// 서버 요청이 실패해도 클라이언트는 로그아웃 상태가 되어야 하므로 onSettled를 쓴다.
export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAccessToken();
      queryClient.removeQueries({ queryKey: ["me"] });
    }
  });
};

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
