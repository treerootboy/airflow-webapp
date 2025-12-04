"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AuthState, User, LoginCredentials } from "@/types/airflow";
import { validateCredentials, AirflowApiError } from "@/lib/airflowApi";

// HTTP Status codes for better readability
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
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

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      // Call Airflow API to validate credentials
      const user = await validateCredentials(
        credentials.baseUrl,
        credentials.username,
        credentials.password
      );
      
      const token = btoa(`${credentials.username}:${credentials.password}`);
      
      localStorage.setItem("airflow_token", token);
      localStorage.setItem("airflow_user", JSON.stringify(user));
      localStorage.setItem("airflow_baseurl", credentials.baseUrl);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        baseUrl: credentials.baseUrl,
      });
      
      return { success: true };
    } catch (error) {
      if (error instanceof AirflowApiError) {
        if (error.status === HTTP_UNAUTHORIZED || error.status === HTTP_FORBIDDEN) {
          return { success: false, error: "Invalid username or password" };
        }
        return { success: false, error: `Connection failed: ${error.message}` };
      }
      return { success: false, error: "Unable to connect to Airflow server" };
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
