import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/zustand/store/authStore";

export function ClerkAuthSync() {
  const { getToken, isSignedIn } = useAuth();
  const { setToken, setRefreshToken } = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshTimerRef = useRef<null | any>(null);

  // Create a function to refresh the token
  const syncToken = useCallback(async () => {
    if (isSignedIn) {
      try {
        const token = await getToken({ skipCache: true });
        setToken(token);
        return token;
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
      }
    } else {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      throw new Error("User is not signed in");
    }
  }, [isSignedIn, getToken, setToken]);

  // Register the refresh function in the auth store
  useEffect(() => {
    setRefreshToken(syncToken);

    return () => {
      setRefreshToken(null);
    };
  }, [syncToken, setRefreshToken]);

  useEffect(() => {
    // Initial token sync
    syncToken();

    // Set up periodic token refresh (every minute)
    refreshTimerRef.current = setInterval(syncToken, 1000 * 60 * 5);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [syncToken]);

  return null;
}
