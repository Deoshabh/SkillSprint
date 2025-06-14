
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { placeholderCourses } from '@/lib/placeholder-data';
import { useToast } from "@/hooks/use-toast";
import { UserCog, Save, Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const availableTracks = Array.from(new Set(placeholderCourses.map(course => course.category)));
const availableLanguages = ['English', 'Hindi', 'Spanish', 'French', 'German'];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState<'learner' | 'educator' | undefined>(user?.role || 'learner');
  const [selectedTracks, setSelectedTracks] = useState<string[]>(user?.learningPreferences?.tracks || []);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(user?.learningPreferences?.language || 'English');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.profileSetupComplete) {
      // If profile is already complete, redirect to dashboard.
      // This prevents accessing this page directly if setup is done.
      router.replace('/dashboard');
    }
     // Pre-fill form if user data exists but setup isn't complete
    if (user) {
        setRole(user.role || 'learner');
        setSelectedTracks(user.learningPreferences?.tracks || []);
        setPreferredLanguage(user.learningPreferences?.language || 'English');
    }
  }, [user, authLoading, router]);


  const handleTrackChange = (track: string) => {
    setSelectedTracks(prev =>
      prev.includes(track) ? prev.filter(t => t !== track) : [...prev, track]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast({ title: "Validation Error", description: "Please select a role.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const profileData: Partial<UserProfile> = {
        role,
        learningPreferences: {
          tracks: selectedTracks,
          language: preferredLanguage,
        },
        profileSetupComplete: true,
      };
      await updateUserProfile(profileData); // updateUserProfile is not async, but we can await if it were
      
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
  
  if (authLoading || (!authLoading && user?.profileSetupComplete && user)) { // Added user check here
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && !authLoading) {
     router.push('/login'); // Should not happen if routes are protected, but as a safeguard
     return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <p>Redirecting to login...</p>
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
              <Label className="text-lg font-semibold">What is your primary role?</Label>
              <RadioGroup
                value={role}
                onValueChange={(value: 'learner' | 'educator') => setRole(value)}
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
              <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
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
