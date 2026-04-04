import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; orgName: string; role: "admin" | "staff" }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isOwner: user?.userType === -1 || user?.role === "admin",
      isAdmin: user?.role === "admin",
      login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        const loggedIn = response.data?.data?.user as User;
        const token = String(response.data?.data?.token ?? "");
        setUser(loggedIn);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
        if (token) localStorage.setItem(TOKEN_KEY, token);
      },
      register: async (payload) => {
        const response = await api.post("/auth/register", payload);
        const loggedIn = response.data?.data?.user as User;
        const token = String(response.data?.data?.token ?? "");
        setUser(loggedIn);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
        if (token) localStorage.setItem(TOKEN_KEY, token);
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

