"use client";

import type { UserProfile } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: UserProfile | null;
  login: (userData: UserProfile) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // To handle initial auth check

  useEffect(() => {
    // Placeholder for checking persistent login (e.g., from localStorage or a cookie)
    // For now, we'll assume no user is logged in on initial load.
    const storedUser = localStorage.getItem('skillSprintUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        localStorage.removeItem('skillSprintUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('skillSprintUser', JSON.stringify(userData));
    // In a real app, you'd redirect or perform other actions
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('skillSprintUser');
    // In a real app, you'd redirect to login page
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
