import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest, UserSession } from '../types/auth.types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest, rememberMe?: boolean) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  updateSessionUser: (partial: Partial<UserSession>) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isAuditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = () => {
      const token =
        localStorage.getItem('enterprise_token') ||
        sessionStorage.getItem('enterprise_token');
      const savedUser =
        localStorage.getItem('enterprise_user') ||
        sessionStorage.getItem('enterprise_user');

      if (token && savedUser) {
        try {
          const parsedUser: UserSession = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch {
          localStorage.removeItem('enterprise_token');
          localStorage.removeItem('enterprise_user');
          sessionStorage.removeItem('enterprise_token');
          sessionStorage.removeItem('enterprise_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest, rememberMe = true) => {
    const result = await authService.login(credentials);
    if (!result.succeeded || !result.token) {
      throw new Error(result.errors?.[0] || 'Authentication failed');
    }

    const session: UserSession = {
      userId: result.userId,
      email: result.email,
      fullName: result.fullName,
      roles: result.roles || [],
      token: result.token,
    };

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem('enterprise_token');
    otherStorage.removeItem('enterprise_user');
    targetStorage.setItem('enterprise_token', result.token);
    targetStorage.setItem('enterprise_user', JSON.stringify(session));

    if (rememberMe) {
      localStorage.setItem('enterprise_remembered_email', credentials.email);
    } else {
      localStorage.removeItem('enterprise_remembered_email');
    }

    setUser(session);
  };

  const register = async (payload: RegisterRequest) => {
    const result = await authService.register(payload);
    if (!result.succeeded || !result.token) {
      throw new Error(result.errors?.[0] || 'Registration failed');
    }

    const session: UserSession = {
      userId: result.userId,
      email: result.email,
      fullName: result.fullName,
      roles: result.roles || [],
      token: result.token,
    };

    localStorage.setItem('enterprise_token', result.token);
    localStorage.setItem('enterprise_user', JSON.stringify(session));
    setUser(session);
  };

  const updateSessionUser = (partial: Partial<UserSession>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (localStorage.getItem('enterprise_user')) {
        localStorage.setItem('enterprise_user', JSON.stringify(updated));
      }
      if (sessionStorage.getItem('enterprise_user')) {
        sessionStorage.setItem('enterprise_user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('enterprise_token');
    localStorage.removeItem('enterprise_user');
    sessionStorage.removeItem('enterprise_token');
    sessionStorage.removeItem('enterprise_user');
    setUser(null);
  };

  const hasRole = (role: string) => {
    return user?.roles.includes(role) ?? false;
  };

  const isAdmin = hasRole('Administrator');
  const isAuditor = hasRole('Auditor');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateSessionUser,
        logout,
        hasRole,
        isAdmin,
        isAuditor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
