import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "./types";
import {
  authLogin,
  authLogout,
  authRegister,
  authRestoreSession,
  AuthResult,
} from "./authService";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthResult>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: "user" | "health_unit") => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  register: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    authRestoreSession().then((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string, rememberMe: boolean): Promise<AuthResult> {
    const result = await authLogin(email, password, rememberMe);
    if (result.success && result.user) setCurrentUser(result.user);
    return result;
  }

  function logout() {
    authLogout();
    setCurrentUser(null);
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: "user" | "health_unit"
  ): Promise<AuthResult> {
    const result = await authRegister(name, email, password, role);
    if (result.success && result.user) setCurrentUser(result.user);
    return result;
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
