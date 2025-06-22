// Temporary helper hook to replace the old auth context
import { useUser } from '@clerk/nextjs';
import { useMemo } from 'react';
import type { UserProfile } from '@/lib/types';

export function useAuth() {
  const { user, isLoaded } = useUser();
  
  // Create a UserProfile-compatible object from Clerk user with memoization
  const userProfile: UserProfile | null = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.fullName || user.firstName || 'User',
      email: user.primaryEmailAddress?.emailAddress || '',
      avatarUrl: user.imageUrl,
      points: (user.unsafeMetadata?.points as number) || 150, // Default points
      earnedBadges: (user.unsafeMetadata?.earnedBadges as any[]) || [], // Default empty badges
      enrolledCourses: (user.unsafeMetadata?.enrolledCourses as string[]) || [], // Default empty courses
      role: (user.unsafeMetadata?.role as 'learner' | 'educator' | 'admin') || 'learner',
      learningPreferences: user.unsafeMetadata?.learningPreferences as any || { tracks: [], language: 'English' },
      profileSetupComplete: user.unsafeMetadata?.profileSetupComplete as boolean ?? false,
      customVideoLinks: (user.unsafeMetadata?.customVideoLinks as any[]) || [],
      userModuleVideos: (user.unsafeMetadata?.userModuleVideos as any) || {},
      textNotes: (user.unsafeMetadata?.textNotes as any[]) || [],
      sketches: (user.unsafeMetadata?.sketches as any[]) || [],
      dailyPlans: (user.unsafeMetadata?.dailyPlans as any) || {},
      submittedFeedback: (user.unsafeMetadata?.submittedFeedback as any[]) || [],
    };
  }, [
    user?.id,
    user?.fullName,
    user?.firstName,
    user?.primaryEmailAddress?.emailAddress,
    user?.imageUrl,
    user?.unsafeMetadata
  ]);

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          ...profileData,
        }
      });
    } catch (error) {
      console.error('Failed to update user profile:', error);
    }
  };

  return {
    user: userProfile,
    loading: !isLoaded,
    updateUserProfile,
    login: () => {}, // Not needed with Clerk
    logout: () => {}, // Not needed with Clerk
  };
}
