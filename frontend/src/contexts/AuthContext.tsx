import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem("lifebook_token");
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem("lifebook_token");
        }
      }

      // Auto-connect to Joe (Jothiram) personalized account
      try {
        const res = await api.login("joe@lifebook.ai", "JoeLifeBook2026!");
        setUser(res.user);
      } catch {
        // Fallback to demo account if joe profile not yet loaded
        try {
          const res = await api.login("jothiram@lifebook.ai", "LifeBook2026!");
          setUser(res.user);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await api.register(email, pass, name);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("lifebook_token");
    localStorage.removeItem("lifebook_user");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
