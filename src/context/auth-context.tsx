
"use client";

import type { UserProfile } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface AuthContextType {
  user: UserProfile | null;
  login: (userData: UserProfile) => void;
  logout: () => void;
  updateUserProfile: (profileData: Partial<UserProfile>) => void; // New function
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 

  useEffect(() => {
    const storedUser = localStorage.getItem('skillSprintUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
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
    // Redirection logic is now handled in login/signup pages based on profileSetupComplete
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('skillSprintUser');
    router.push('/'); 
  };

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        ...profileData, 
        profileSetupComplete: true // Always mark as complete when this function is called
      };
      setUser(updatedUser);
      localStorage.setItem('skillSprintUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile, loading }}>
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
