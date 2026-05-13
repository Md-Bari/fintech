import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem("auth-token", token);
        // Set cookies for middleware
        document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `user-role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
        set({
          user,
          token,
          role: user.role,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (error) {
          console.error("Failed to logout from server:", error);
        }
        localStorage.removeItem("auth-token");
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
