"use client";

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserCircle2, Edit3, Mail, Briefcase, BookOpen, Languages, ShieldCheck, LayoutGrid, PlusCircle, Camera, LogOut } from 'lucide-react';
import Link from 'next/link';
import { placeholderCourses } from '@/lib/placeholder-data';
import type { Course } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageUpload } from '@/components/image-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogoutDialog } from '@/components/logout-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function UserProfilePage() {
  const { user, loading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Check if avatar URL is valid
  const getValidAvatarUrl = (avatarUrl: string | undefined) => {
    return avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : undefined;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to view your profile.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const myCreatedCourses = placeholderCourses.filter(course => course.authorId === user.id);

  const handleAvatarUpdate = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      const updatedUser = await response.json();
      updateUserProfile(updatedUser);
      setIsAvatarDialogOpen(false);
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <UserCircle2 className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          My Profile
        </h1>
        <p className="text-xl text-muted-foreground">
          View and manage your account details and preferences.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={getValidAvatarUrl(user.avatarUrl)} alt={`${user.name}'s avatar`} data-ai-hint={user.dataAiHint || "profile person"} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    aria-label="Change avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                  </DialogHeader>
                  <ImageUpload
                    uploadType="avatar"
                    onImageSelected={handleAvatarUpdate}
                    currentImageUrl={user.avatarUrl}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div>
              <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" /> {user.email}
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Button is disabled as full profile editing is not yet implemented beyond initial setup */}
                <span tabIndex={0}> {/* Allow focus on disabled button for tooltip */}
                  <Button variant="outline" aria-label="Edit profile (Feature coming soon)" disabled>
                    <Edit3 className="h-4 w-4 mr-2" aria-hidden="true" /> Edit Profile
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Full profile editing (name, password, etc.) is planned for a future update.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="capitalize text-lg">{user.role || 'Not set'}</p>
                {user.role === 'educator' && (
                  <Badge variant="secondary" className="mt-2">Educator Tools Enabled</Badge>
                )}
                 {user.role === 'admin' && (
                  <Badge variant="default" className="mt-2">Administrator Access</Badge>
                )}
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> Learning Tracks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.learningPreferences?.tracks && user.learningPreferences.tracks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.learningPreferences.tracks.map(track => (
                      <Badge key={track} variant="outline">{track}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No tracks selected.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> Preferred Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{user.learningPreferences?.language || 'Not set'}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  {user.profileSetupComplete ? 
                    <span className="text-green-600 font-medium">Profile Setup Complete</span> : 
                    <span className="text-orange-500 font-medium">Profile Setup Incomplete</span>
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <LayoutGrid className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> My Created Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myCreatedCourses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myCreatedCourses.map((course: Course) => (
                    <Badge key={course.id} variant="secondary" className="cursor-pointer hover:bg-primary/20">
                       <Link href={`/course-designer?courseId=${course.id}`}>{course.title}</Link>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="mb-3">You haven&apos;t created any courses yet.</p>
                  <Button variant="outline" asChild size="sm">
                    <Link href="/course-designer">
                      <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" /> Create Your First Course
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Management Section */}
          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> Account Management
              </CardTitle>
              <CardDescription>
                Manage your account settings and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                  <Link href="/account/security">
                    <ShieldCheck className="h-4 w-4 mr-2" aria-hidden="true" /> Security Settings
                  </Link>
                </Button>
                <LogoutDialog showDeviceOptions={true}>
                  <Button variant="destructive">
                    <LogOut className="h-4 w-4 mr-2" aria-hidden="true" /> Sign Out
                  </Button>
                </LogoutDialog>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}
