import React from "react";
import { apiFetch } from "./api";

export type User = {
  id: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "MANAGER" | "PROCUREMENT" | "FINANCE";
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; name: string; password: string; role: User["role"] }) => Promise<void>;
  logout: () => void;
};

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch<User>("/api/me");
        setUser(me);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const r = await apiFetch<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", r.token);
    setUser(r.user);
  }, []);

  const register = React.useCallback(async (payload: { email: string; name: string; password: string; role: User["role"] }) => {
    const r = await apiFetch<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    localStorage.setItem("token", r.token);
    setUser(r.user);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{props.children}</Ctx.Provider>;
}

export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}

