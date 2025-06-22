
"use client";

import { useState, type FormEvent, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { UserCog, Save, Loader2 } from 'lucide-react';

// Available tracks for users to choose from
const availableTracks = [
  'Web Development',
  'Mobile Development', 
  'Data Science',
  'Machine Learning',
  'AI & Robotics',
  'Cybersecurity',
  'Cloud Computing',
  'DevOps',
  'UI/UX Design',
  'Digital Marketing',
  'Business',
  'Language Learning',
  'Photography',
  'Music Production',
  'Creative Writing',
  'Finance',
  'Health & Fitness',
  'Cooking',
  'Art & Craft',
  'Personal Development'
];
const availableLanguages = ['English', 'Hindi', 'Spanish', 'French', 'German'];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [role, setRole] = useState<'learner' | 'educator'>('learner');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track if we've already initialized the form to prevent infinite loops
  const hasInitialized = useRef(false);
  
  // Memoized callback to prevent infinite re-renders
  const handleRoleChange = useCallback((value: 'learner' | 'educator') => {
    setRole(value);
  }, []);
  
  const handleLanguageChange = useCallback((value: string) => {
    setPreferredLanguage(value);
  }, []);
  useEffect(() => {
    if (!isLoaded) return; // Wait for user data to load
    
    if (!user) {
      // No user found, redirect to home
      router.push('/');
      return;
    }
    
    // Check if profile setup is already complete
    const isComplete = user.unsafeMetadata?.profileSetupComplete as boolean;
    if (isComplete) {
      router.replace('/dashboard');
      return;
    }
      // Only initialize form data once to prevent infinite loops
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      // Pre-fill form if user data exists but setup isn't complete
      const existingRole = user.unsafeMetadata?.role as 'learner' | 'educator';
      const existingPrefs = user.unsafeMetadata?.learningPreferences as any;
      
      if (existingRole) {
        setRole(existingRole);
      }
      if (existingPrefs?.tracks) {
        setSelectedTracks(existingPrefs.tracks);
      }
      if (existingPrefs?.language) {
        setPreferredLanguage(existingPrefs.language);
      }
    }
  }, [isLoaded, user?.id, user?.unsafeMetadata?.profileSetupComplete, router]);


  const handleTrackChange = (track: string) => {
    setSelectedTracks(prev =>
      prev.includes(track) ? prev.filter(t => t !== track) : [...prev, track]
    );
  };  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Update user's public metadata in Clerk
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role,
          learningPreferences: {
            tracks: selectedTracks,
            language: preferredLanguage,
          },
          profileSetupComplete: true,
        }
      });
      
      toast({
        title: "Profile Setup Complete!",
        description: "Welcome! Your preferences have been saved.",
      });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
    if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Redirecting...</p>
        <Loader2 className="h-12 w-12 animate-spin text-primary ml-2" />
      </div>
    );
  }


  return (
    <div className="flex justify-center items-start py-8 min-h-screen bg-muted/30">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <UserCog className="h-12 w-12 mx-auto text-primary mb-3" aria-hidden="true" />
          <CardTitle className="text-3xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription>Help us personalize your SkillSprint experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">What is your primary role?</Label>              <RadioGroup
                value={role}
                onValueChange={handleRoleChange}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-md flex-1 hover:bg-accent/50 cursor-pointer data-[state=checked]:bg-accent data-[state=checked]:border-primary">
                  <RadioGroupItem value="learner" id="role-learner" />
                  <Label htmlFor="role-learner" className="text-base cursor-pointer">Learner (I want to take courses)</Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-md flex-1 hover:bg-accent/50 cursor-pointer data-[state=checked]:bg-accent data-[state=checked]:border-primary">
                  <RadioGroupItem value="educator" id="role-educator" />
                  <Label htmlFor="role-educator" className="text-base cursor-pointer">Educator (I want to create courses)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-semibold">Which tracks are you interested in?</Label>
              <p className="text-sm text-muted-foreground">Select all that apply.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {availableTracks.map(track => (
                  <div key={track} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50">
                    <Checkbox
                      id={`track-${track}`}
                      checked={selectedTracks.includes(track)}
                      onCheckedChange={() => handleTrackChange(track)}
                    />
                    <Label htmlFor={`track-${track}`} className="text-sm font-normal cursor-pointer">{track}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-lg font-semibold">Preferred Language for Content</Label>
              <Select value={preferredLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting} aria-label="Save preferences and continue to dashboard">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-5 w-5" aria-hidden="true" />}
              Save Preferences & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
