'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { UserProfile } from '@/lib/types';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  // Extended properties to match UserProfile
  avatarUrl?: string;
  dataAiHint?: string;
  points?: number;
  earnedBadges?: any[];
  enrolledCourses?: string[];
  learningPreferences?: {
    tracks: string[];
    language: string;
  };
  customVideoLinks?: any[];
  userModuleVideos?: any;
  userAIVideos?: any; // AI-found videos per module
  userAISearchUsage?: any; // AI search count per module
  textNotes?: any[];
  sketches?: any[];
  uploadedImages?: any[];
  dailyPlans?: any;
  profileSetupComplete?: boolean;
  submittedFeedback?: any[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loading: boolean; // Add for compatibility
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>;
  updateUserProfile: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  console.log('useAuth called, context:', context); // Debug log
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const isLoading = status === 'loading';
  useEffect(() => {
    if (session?.user) {
      // Load user data from backend to get complete profile
      
      const loadUserProfile = async () => {
        try {
          console.log('[AuthContext] Loading user profile, session:', {
            sessionExists: !!session,
            sessionUser: session?.user,
            email: session?.user?.email
          });
          
          const cacheBreaker = `${Date.now()}-${Math.random()}`;
          const response = await fetch(`/api/user/progress?t=${cacheBreaker}`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }          });
          console.log('[AuthContext] User progress API response:', {
            status: response.status,
            ok: response.ok
          });
            if (response.ok) {
            const responseData = await response.json();
            
            console.log('[AuthContext] Raw API response:', {
              responseData,
              hasData: 'data' in responseData,
              dataValue: responseData?.data,
              keys: responseData ? Object.keys(responseData) : 'no response'
            });
            
            // More robust data extraction with logging
            let progressData;
            if (responseData && responseData.data !== undefined) {
              progressData = responseData.data;
              console.log('[AuthContext] Using responseData.data:', progressData);
            } else if (responseData && typeof responseData === 'object') {
              progressData = responseData;
              console.log('[AuthContext] Using responseData directly:', progressData);
            } else {
              progressData = {};
              console.log('[AuthContext] Fallback to empty object');
            }
            
            console.log('[AuthContext] Final progress data:', {
              progressData: progressData ? Object.keys(progressData) : 'null/undefined',
              userModuleVideos: progressData?.userModuleVideos,
              userAIVideos: progressData?.userAIVideos,
              userAISearchUsage: progressData?.userAISearchUsage
            });
            
            // Safely extract and convert Map objects to plain objects
            const safeUserModuleVideos = progressData?.userModuleVideos 
              ? (progressData.userModuleVideos instanceof Map 
                ? Object.fromEntries(progressData.userModuleVideos) 
                : progressData.userModuleVideos)
              : {};
            
            const safeUserAIVideos = progressData?.userAIVideos 
              ? (progressData.userAIVideos instanceof Map 
                ? Object.fromEntries(progressData.userAIVideos) 
                : progressData.userAIVideos)
              : {};
            
            const safeUserAISearchUsage = progressData?.userAISearchUsage 
              ? (progressData.userAISearchUsage instanceof Map 
                ? Object.fromEntries(progressData.userAISearchUsage) 
                : progressData.userAISearchUsage)              : {};
              
            setUser({
              id: session.user.id || '',
              email: session.user.email || '',
              name: session.user.name || '',
              role: session.user.role || 'user',
              image: session.user.image || undefined,
              avatarUrl: session.user.image || undefined,
              points: progressData?.points || 0,
              earnedBadges: progressData?.earnedBadges || [],
              enrolledCourses: progressData?.enrolledCourses || [],
              userModuleVideos: safeUserModuleVideos,
              userAIVideos: safeUserAIVideos,
              userAISearchUsage: safeUserAISearchUsage,
              learningPreferences: {
                tracks: [],
                language: 'english'
              },
              profileSetupComplete: false
            });          } else {
            console.warn('[AuthContext] Failed to load user progress:', {
              status: response.status,
              statusText: response.statusText
            });
            
            // Try to read error response
            try {
              const errorData = await response.json();
              console.warn('[AuthContext] Error response:', errorData);
            } catch (e) {
              console.warn('[AuthContext] Could not parse error response');
            }
            
            // Fallback to basic user data if API fails
            setUser({
              id: session.user.id || '',
              email: session.user.email || '',
              name: session.user.name || '',
              role: session.user.role || 'user',
              image: session.user.image || undefined,
              avatarUrl: session.user.image || undefined,
              points: 0,
              earnedBadges: [],
              enrolledCourses: [],
              userModuleVideos: {},
              userAIVideos: {},
              userAISearchUsage: {},
              learningPreferences: {
                tracks: [],
                language: 'english'
              },
              profileSetupComplete: false
            });
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Fallback to basic user data
          setUser({
            id: session.user.id || '',
            email: session.user.email || '',
            name: session.user.name || '',
            role: session.user.role || 'user',
            image: session.user.image || undefined,
            avatarUrl: session.user.image || undefined,
            points: 0,
            earnedBadges: [],
            enrolledCourses: [],
            userModuleVideos: {},
            userAIVideos: {},
            userAISearchUsage: {},
            learningPreferences: {
              tracks: [],
              language: 'english'
            },
            profileSetupComplete: false
          });
        }
      };
      
      loadUserProfile();
    } else {
      setUser(null);
    }
  }, [session]);

  // Add periodic session check to prevent session expiry issues
  useEffect(() => {
    const checkSession = async () => {
      if (session?.user && !isLoading) {
        try {
          const sessionResponse = await fetch('/api/auth/session');
          if (!sessionResponse.ok) {
            console.warn('[AuthContext] Session check failed, clearing user data');
            setUser(null);
          }
        } catch (error) {
          console.error('[AuthContext] Session check error:', error);
        }
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session, isLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        return false;
      }

      return !result?.error;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };  const logout = async (): Promise<void> => {
    try {
      // Clear client-side data first
      setUser(null);
      
      // Call logout API to clear server-side session
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (apiError) {
        console.warn('API logout failed, continuing with client logout:', apiError);
      }
      
      // Sign out with NextAuth
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login page
      window.location.href = '/login';
    }
  };
  const register = async (userData: { 
    name: string; 
    email: string; 
    password: string; 
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        // Auto-login after successful registration
        return await login(userData.email, userData.password);
      }

      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };  const updateUserProfile = async (updatedProfile: Partial<UserProfile>): Promise<void> => {
    console.log('[AuthContext] updateUserProfile called with:', JSON.stringify(updatedProfile, null, 2));
    
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('[AuthContext] updateUserProfile response:', responseData);
          // Update local user state
        if (user) {
          const newUser = { 
            ...user, 
            ...updatedProfile,
            // Ensure video properties always exist
            userModuleVideos: {
              ...(user.userModuleVideos || {}),
              ...(updatedProfile.userModuleVideos || {})
            },
            userAIVideos: {
              ...(user.userAIVideos || {}),
              ...(updatedProfile.userAIVideos || {})
            },
            userAISearchUsage: {
              ...(user.userAISearchUsage || {}),
              ...(updatedProfile.userAISearchUsage || {})
            }
          };
          console.log('[AuthContext] Setting new user state:', {
            userModuleVideos: newUser.userModuleVideos,
            userAIVideos: newUser.userAIVideos,
            userAISearchUsage: newUser.userAISearchUsage
          });
          setUser(newUser);
        }
      } else {
        const errorData = await response.json();
        console.error('[AuthContext] updateUserProfile failed:', errorData);
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };
  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    loading: isLoading, // Add for compatibility
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    logout,
    register,
    updateUserProfile,
  };
  console.log('AuthContext value created:', { 
    user: !!user, 
    updateUserProfile: typeof updateUserProfile,
    isLoading,
    hasLogin: typeof login === 'function',
    hasUpdateProfile: typeof updateUserProfile === 'function'
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </SessionProvider>
  );
}
