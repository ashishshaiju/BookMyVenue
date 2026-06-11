import React, { createContext, useState, useEffect, type ReactNode } from "react";
import { axiosInstance } from "../config/axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../constants";
import { showSuccess, showError } from "../utils/toast";

export interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifySession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const verifySession = async () => {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    if (isLoggedIn === "true") {
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.PROFILE);
        const userData = response.data?.data || response.data;
        if (userData) {
          setUser({
            id: userData._id || userData.id,
            username: userData.username,
            email: userData.email,
          });
          localStorage.setItem(STORAGE_KEYS.USER_ID, userData._id || userData.id);
          localStorage.setItem(STORAGE_KEYS.USER_NAME, userData.username);
        } else {
          throw new Error("No user data returned");
        }
      } catch (error) {
        console.error("Failed to verify session", error);
        clearAuthData();
        throw error;
      }
    } else {
      clearAuthData();
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await verifySession();
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to global auth:logout events from axios interceptor
    const handleLogoutEvent = () => {
      clearAuthData();
    };

    window.addEventListener("auth:logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, []);

  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, { email, password });
      const data = response.data?.data || response.data;
      if (data) {
        setUser({
          id: data.userId || data.id,
          username: data.username,
          email: data.email,
        });
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
        localStorage.setItem(STORAGE_KEYS.USER_ID, data.userId || data.id);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, data.username);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.REGISTER, { username, email, password });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post(API_ENDPOINTS.LOGOUT);
      showSuccess("Logged out successfully.");
    } catch (error) {
      showError("Failed to log out. Please try again.");
    } finally {
      clearAuthData();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, verifySession }}>
      {children}
    </AuthContext.Provider>
  );
};
