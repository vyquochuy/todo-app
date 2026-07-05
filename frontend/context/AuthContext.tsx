"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { RegisterSchema, LoginSchema } from "@todo-app/shared";
import { apiClient } from "@/lib/axios";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginSchema) => Promise<void>;
  register: (credentials: RegisterSchema) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on startup
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to load auth state:", e);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginSchema) => {
    const res = await apiClient.post("/auth/login", credentials);
    const { token: receivedToken, user: receivedUser } = res.data.data;
    
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem("auth_token", receivedToken);
    localStorage.setItem("auth_user", JSON.stringify(receivedUser));
  };

  const register = async (credentials: RegisterSchema) => {
    await apiClient.post("/auth/register", credentials);
    // Automatically log in after registration
    await login({ email: credentials.email, password: credentials.password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
