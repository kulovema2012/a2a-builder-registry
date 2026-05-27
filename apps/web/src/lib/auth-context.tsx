"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, clearToken, type UserPublic } from "./api";

interface AuthCtx {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, org_name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearToken();
      } else {
        setUser({
          id: payload.sub ?? "",
          name: payload.name ?? "",
          email: payload.email ?? "",
          role: payload.role ?? "member",
          org_id: payload.org ?? "",
        });
      }
    } catch {
      clearToken();
    }
    setLoading(false);
  }, []);

  const loginFn = useCallback(async (email: string, password: string) => {
    await auth.login(email, password);
    const token = localStorage.getItem("access_token")!;
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser({
      id: payload.sub ?? "",
      name: payload.name ?? "",
      email,
      role: payload.role ?? "member",
      org_id: payload.org ?? "",
    });
  }, []);

  const registerFn = useCallback(
    async (name: string, email: string, password: string, org_name: string) => {
      const u = await auth.register({ name, email, password, org_name });
      await auth.login(email, password);
      setUser(u);
    },
    [],
  );

  const logoutFn = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login: loginFn, register: registerFn, logout: logoutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
