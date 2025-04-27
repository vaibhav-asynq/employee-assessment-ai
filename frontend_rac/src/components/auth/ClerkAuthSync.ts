import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/zustand/store/authStore";
import { useSnapshotSaver } from "@/hooks/useSnapshotSaver";

export function ClerkAuthSync() {
  const { getToken, isSignedIn, userId } = useAuth();
  const { setToken, setRefreshToken, setUser } = useAuthStore();
  const { saveSnapshotToDb } = useSnapshotSaver();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshTimerRef = useRef<null | any>(null);
  const lastTokenRef = useRef<string | null>(null);

  // Create a function to refresh the token
  const syncToken = useCallback(async () => {
    if (isSignedIn) {
      try {
        console.log("Refreshing auth token...");
        const token = await getToken({ skipCache: true });

        // Only update if token has changed
        if (token !== lastTokenRef.current) {
          console.log("Token updated");
          lastTokenRef.current = token;
          setToken(token);

          // Also set the user information
          if (userId) {
            setUser({
              id: userId,
              username: userId,
            });
          }
        }

        return token;
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
      }
    } else {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      // Clear token if not signed in
      lastTokenRef.current = null;
      setToken(null);
      setUser(null);
      throw new Error("User is not signed in");
    }
  }, [isSignedIn, getToken, setToken, setUser, userId]);

  // Register the refresh function in the auth store
  useEffect(() => {
    setRefreshToken(syncToken);

    return () => {
      setRefreshToken(null);
    };
  }, [syncToken, setRefreshToken]);

  // TODO: remove this after implementing debounce save
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Saving snapshot via 15-second interval...");
      saveSnapshotToDb("auto", true);
    }, 15000); // 15 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [saveSnapshotToDb]);

  useEffect(() => {
    // Initial token sync
    syncToken().catch((err) => {
      console.error("Initial token sync failed:", err);
    });

    // Set up periodic token refresh (every 1 minute instead of 5)
    refreshTimerRef.current = setInterval(() => {
      syncToken().catch((err) => {
        console.error("Periodic token refresh failed:", err);
      });
    }, 1000 * 60);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [syncToken]);

  return null;
}
