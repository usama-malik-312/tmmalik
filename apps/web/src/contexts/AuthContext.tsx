import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setUser(JSON.parse(raw) as User);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isOwner: user?.userType === -1,
      login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        const loggedIn = response.data?.data as User;
        setUser(loggedIn);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
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

