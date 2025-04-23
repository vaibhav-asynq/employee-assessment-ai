import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/zustand/store/authStore";

export function ClerkAuthSync() {
  const { getToken, isSignedIn } = useAuth();
  const { setToken } = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshTimerRef = useRef<null | any>(null);

  useEffect(() => {
    const syncToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          setToken(token);
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      } else {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      }
    };

    syncToken();

    refreshTimerRef.current = setInterval(syncToken, 1000 * 60 * 1);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isSignedIn, getToken, setToken]);

  return null;
}
