"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AuthState, User, LoginCredentials } from "@/types/airflow";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    baseUrl: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("airflow_token");
    const userStr = localStorage.getItem("airflow_user");
    const baseUrl = localStorage.getItem("airflow_baseurl");
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setAuthState({
          isAuthenticated: true,
          user,
          token,
          baseUrl,
        });
      } catch {
        localStorage.removeItem("airflow_token");
        localStorage.removeItem("airflow_user");
        localStorage.removeItem("airflow_baseurl");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    try {
      // In a real app, this would call the Airflow API
      // For demo purposes, we simulate a successful login
      const mockUser: User = {
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        first_name: credentials.username,
        last_name: "User",
        roles: [{ name: "Admin" }],
      };
      const mockToken = btoa(`${credentials.username}:${credentials.password}`);
      
      localStorage.setItem("airflow_token", mockToken);
      localStorage.setItem("airflow_user", JSON.stringify(mockUser));
      localStorage.setItem("airflow_baseurl", credentials.baseUrl);
      
      setAuthState({
        isAuthenticated: true,
        user: mockUser,
        token: mockToken,
        baseUrl: credentials.baseUrl,
      });
      
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("airflow_token");
    localStorage.removeItem("airflow_user");
    localStorage.removeItem("airflow_baseurl");
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      baseUrl: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
