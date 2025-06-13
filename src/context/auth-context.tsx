
"use client";

import type { UserProfile } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface AuthContextType {
  user: UserProfile | null;
  login: (userData: UserProfile) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
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
    // Redirection is handled in login/signup pages
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('skillSprintUser');
    router.push('/'); // Redirect to public homepage on logout
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
