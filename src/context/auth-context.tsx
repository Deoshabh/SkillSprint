
"use client";

import type { UserProfile, VideoLink } from '@/lib/types'; // Added VideoLink
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  login: (userData: UserProfile) => void;
  logout: () => void;
  updateUserProfile: (profileData: Partial<UserProfile>) => void;
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
        const parsedUser: UserProfile = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        localStorage.removeItem('skillSprintUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: UserProfile) => {
    const userToStore = {
      ...userData,
      customVideoLinks: userData.customVideoLinks || [] // Ensure it's initialized
    };
    setUser(userToStore);
    localStorage.setItem('skillSprintUser', JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('skillSprintUser');
    router.push('/'); 
  };

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    if (user) {
      const updatedUser: UserProfile = { 
        ...user, 
        ...profileData,
        // If profileData includes customVideoLinks, it will override.
        // Otherwise, user.customVideoLinks (which could be undefined if not set before) is kept.
        // Ensure customVideoLinks is an array if it's being set or updated.
        customVideoLinks: profileData.customVideoLinks !== undefined ? profileData.customVideoLinks : user.customVideoLinks || [],
        profileSetupComplete: profileData.profileSetupComplete !== undefined ? profileData.profileSetupComplete : user.profileSetupComplete,
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
