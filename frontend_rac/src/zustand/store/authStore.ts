import { create } from "zustand";

interface User {
  username: string;
  id: string;
  // Add other user properties as needed
}

interface AuthState {
  token: string | null;
  user: User | null;
  refreshToken: (() => Promise<string | null>) | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setRefreshToken: (refreshFn: (() => Promise<string | null>) | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  refreshToken: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setRefreshToken: (refreshFn) => set({ refreshToken: refreshFn }),
  logout: () => set({ token: null, user: null }),
}));
