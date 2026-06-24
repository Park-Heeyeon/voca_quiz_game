import { useMutation } from "@tanstack/react-query";
import { requestLogin, requestLogout, requestSignUp } from "../api/auth";

export const useAuth = () => {
  const loginMutation = useMutation({ mutationFn: requestLogin });
  const signUpMutation = useMutation({ mutationFn: requestSignUp });
  const logoutMutation = useMutation({ mutationFn: requestLogout });

  return { loginMutation, signUpMutation, logoutMutation };
};
