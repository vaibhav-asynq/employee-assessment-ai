import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Create form data for the API request
          const formData = new URLSearchParams();
          formData.append("username", username);
          formData.append("password", password);

          // Make the API request
          const response = await fetch("http://34.202.149.23:8000/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Login failed");
          }

          const data = await response.json();
          
          // Set the authenticated user if login was successful
          if (data.success) {
            set({
              user: {
                username,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error("Login failed");
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage", // name of the item in localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
