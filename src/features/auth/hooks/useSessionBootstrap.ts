import { useEffect } from "react";
import { getStoredToken, clearStoredToken } from "@/shared/api/client";
import { useUserStore } from "@/shared/store/userStore";
import { requestMe } from "../api/auth";

export const useSessionBootstrap = (): void => {
  const setUser = useUserStore((s) => s.setUser);
  const setBootstrapping = useUserStore((s) => s.setBootstrapping);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }
    requestMe()
      .then((user) => setUser(user))
      .catch(() => clearStoredToken())
      .finally(() => setBootstrapping(false));
  }, [setUser, setBootstrapping]);
};
