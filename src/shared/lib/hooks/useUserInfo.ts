import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "@/shared/api/user";

// accessToken이 없어도 호출한다. 401이 나면 응답 인터셉터가 쿠키의
// refreshToken으로 재발급 후 재시도하므로, 이 쿼리 하나로 세션이 복원된다.
const useUserInfo = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: getUserInfo,
    retry: false,
    staleTime: Infinity,
  });

export default useUserInfo;
