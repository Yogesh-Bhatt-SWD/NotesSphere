import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import userService from '../api/userService';
import { mockCurrentUser } from '../mock/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token/user exists in localStorage
    const token = localStorage.getItem('notesphere_access_token');
    const refreshToken = localStorage.getItem('notesphere_refresh_token');
    const savedUser = authService.getCurrentUser();

    if (savedUser && (token || refreshToken)) {
      const initial = {
        ...savedUser,
        name: savedUser.name || savedUser.fullName || savedUser.username || savedUser.email?.split('@')[0] || 'Member',
        avatar: savedUser.avatarUrl || savedUser.avatar || null,
        avatarUrl: savedUser.avatarUrl || savedUser.avatar || null,
      };
      setUser(initial);
    } else {
      // Clear stale user if no tokens exist
      localStorage.removeItem('notesphere_user');
      setUser(null);
    }
    setLoading(false);

    // Fetch fresh profile from backend to ensure avatar, name, and settings stay in sync across refreshes
    if (token || refreshToken) {
      userService.getMe()
        .then((freshUser) => {
          if (freshUser) {
            const normalized = {
              ...freshUser,
              name: freshUser.name || freshUser.fullName || freshUser.username || freshUser.email?.split('@')[0] || 'Member',
              avatar: freshUser.avatarUrl || freshUser.avatar || null,
              avatarUrl: freshUser.avatarUrl || freshUser.avatar || null,
            };
            setUser(normalized);
            localStorage.setItem('notesphere_user', JSON.stringify(normalized));
          }
        })
        .catch(() => {
          // Keep cached state if offline or during silent revalidation
        });
    }

    // Listen for session expired events from apiClient
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('notesphere_session_expired', handleSessionExpired);
    return () => window.removeEventListener('notesphere_session_expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const normalized = {
      ...data.user,
      name: data.user?.name || data.user?.fullName || data.user?.username || email.split('@')[0],
      avatar: data.user?.avatarUrl || data.user?.avatar || null,
      avatarUrl: data.user?.avatarUrl || data.user?.avatar || null,
    };
    setUser(normalized);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    const normalized = {
      ...data.user,
      name: data.user?.name || data.user?.fullName || data.user?.username || name,
      avatar: data.user?.avatarUrl || data.user?.avatar || null,
      avatarUrl: data.user?.avatarUrl || data.user?.avatar || null,
    };
    setUser(normalized);
    return data;
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      if (!merged.name) merged.name = merged.fullName || merged.username || 'Member';
      if (updatedFields.avatarUrl !== undefined) {
        merged.avatar = updatedFields.avatarUrl;
        merged.avatarUrl = updatedFields.avatarUrl;
      }
      localStorage.setItem('notesphere_user', JSON.stringify(merged));
      return merged;
    });
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasToken = !!localStorage.getItem('notesphere_access_token') || !!localStorage.getItem('notesphere_refresh_token');

  const value = {
    user,
    setUser,
    updateUserData,
    loading,
    isAuthenticated: hasToken && !!user,
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
