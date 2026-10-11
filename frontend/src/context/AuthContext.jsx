import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import { mockCurrentUser } from '../mock/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token/user exists in localStorage
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setUser({
        ...savedUser,
        name: savedUser.name || savedUser.username || savedUser.email?.split('@')[0] || 'Member',
      });
    } else if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      // Default to visual mock user for previewing dashboard layout
      setUser(mockCurrentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const normalized = {
      ...data.user,
      name: data.user?.name || data.user?.username || email.split('@')[0],
    };
    setUser(normalized);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    const normalized = {
      ...data.user,
      name: data.user?.name || data.user?.username || name,
    };
    setUser(normalized);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
