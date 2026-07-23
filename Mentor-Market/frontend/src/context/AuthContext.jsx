import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("mentor_market_user")) || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("mentor_market_token")));

  const saveSession = useCallback(({ token, user: nextUser }) => {
    localStorage.setItem("mentor_market_token", token);
    localStorage.setItem("mentor_market_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mentor_market_token");
    localStorage.removeItem("mentor_market_user");
    setUser(null);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await api.get("/auth/me");
        localStorage.setItem("mentor_market_user", JSON.stringify(response.data.data));
        setUser(response.data.data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    if (localStorage.getItem("mentor_market_token")) verifySession();
    else setLoading(false);
  }, [logout]);

  useEffect(() => {
    window.addEventListener("mentor-market:logout", logout);
    return () => window.removeEventListener("mentor-market:logout", logout);
  }, [logout]);

  const value = useMemo(() => ({
    user,
    loading,
    login: async (credentials) => {
      const response = await api.post("/auth/login", credentials);
      saveSession(response.data.data);
      return response.data.data.user;
    },
    register: async (form) => {
      const response = await api.post("/auth/register", form);
      saveSession(response.data.data);
      return response.data.data.user;
    },
    logout,
    refreshUser: async () => {
      const response = await api.get("/auth/me");
      localStorage.setItem("mentor_market_user", JSON.stringify(response.data.data));
      setUser(response.data.data);
    },
  }), [loading, logout, saveSession, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

