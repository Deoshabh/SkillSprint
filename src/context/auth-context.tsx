"use client";

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserFromDB = async () => {
    if (!clerkUser) {
      setDbUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        
        // Convert database user to UserProfile format
        const userProfile: UserProfile = {
          id: userData.clerkId,
          name: userData.name || clerkUser.fullName || clerkUser.firstName || 'User',
          email: userData.email || clerkUser.primaryEmailAddress?.emailAddress || '',
          avatarUrl: userData.avatarUrl || clerkUser.imageUrl,
          points: userData.points || 0,
          earnedBadges: userData.earnedBadges || [],
          enrolledCourses: userData.enrollments?.map((e: any) => e.courseId) || [],
          role: userData.role?.toLowerCase() || 'learner',
          learningPreferences: {
            tracks: userData.learningTracks || [],
            language: userData.language || 'English'
          },
          customVideoLinks: [],
          userModuleVideos: {},
          textNotes: [],
          sketches: [],
          dailyPlans: {},
          profileSetupComplete: userData.profileSetupComplete || false,
          submittedFeedback: [],
        };
        
        setDbUser(userProfile);
      } else {
        console.error('Failed to fetch user from database');
        setDbUser(null);
      }
    } catch (error) {
      console.error('Error fetching user from database:', error);
      setDbUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchUserFromDB();
    }
  }, [clerkUser, isLoaded]);

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!clerkUser || !dbUser) return;

    try {
      setLoading(true);
      
      // Convert UserProfile updates to database format
      const dbUpdateData: any = {};
      
      if (profileData.role) {
        dbUpdateData.role = profileData.role.toUpperCase();
      }
      
      if (profileData.learningPreferences) {
        if (profileData.learningPreferences.tracks) {
          dbUpdateData.learningTracks = profileData.learningPreferences.tracks;
        }
        if (profileData.learningPreferences.language) {
          dbUpdateData.language = profileData.learningPreferences.language;
        }
      }
      
      if (profileData.profileSetupComplete !== undefined) {
        dbUpdateData.profileSetupComplete = profileData.profileSetupComplete;
      }

      if (profileData.points !== undefined) {
        dbUpdateData.points = profileData.points;
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbUpdateData),
      });

      if (response.ok) {
        await fetchUserFromDB(); // Refresh user data
      } else {
        throw new Error('Failed to update user profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUserFromDB();
  };

  return {
    user: dbUser,
    loading: loading || !isLoaded,
    updateUserProfile,
    refreshUser,
  };
}
