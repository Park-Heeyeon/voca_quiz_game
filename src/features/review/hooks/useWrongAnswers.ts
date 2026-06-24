import { useQuery } from "@tanstack/react-query";
import { getWrongAnswers } from "../api/review";
import { useUserStore } from "@/shared/store/userStore";

export const useWrongAnswers = () => {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  return useQuery({
    queryKey: ["wrongAnswers"],
    queryFn: getWrongAnswers,
    enabled: isLoggedIn,
  });
};
