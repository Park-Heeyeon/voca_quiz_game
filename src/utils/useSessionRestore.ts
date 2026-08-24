import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { getUserInfo } from "@/api";
import { isLoggedInState } from "@/atom/isLoggedInState";
import { userInfoState } from "@/atom/userInfoState";

// accessToken이 없어도 /me를 한 번 호출한다. 401이 나면 응답 인터셉터가
// 쿠키의 refreshToken으로 재발급 후 재시도하므로, 이 호출만으로 세션이 복원된다.
const useSessionRestore = () => {
  const setUserInfo = useSetRecoilState(userInfoState);
  const setIsLoggedIn = useSetRecoilState(isLoggedInState);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    getUserInfo()
      .then((response) => {
        setUserInfo(response.data);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
      })
      .finally(() => setIsRestoring(false));
  }, [setUserInfo, setIsLoggedIn]);

  return isRestoring;
};

export default useSessionRestore;
