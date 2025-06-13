
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { placeholderUserProfile } from '@/lib/placeholder-data'; 
import { useRouter } from 'next/navigation';
import { UserPlus, User, Mail, KeyRound, Gem, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user: authUser, login, loading: authLoading } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is already logged in (e.g. navigated back after signup/login), redirect appropriately
    if (!authLoading && authUser?.profileSetupComplete) {
      router.replace('/dashboard');
    } else if (!authLoading && authUser && !authUser.profileSetupComplete) {
      router.replace('/profile-setup');
    }
  }, [authUser, authLoading, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Signing up with:', name, email, password);
    if (name && email && password) { 
      // For signup, profileSetupComplete will always be false initially.
      // The actual placeholderUserProfile.profileSetupComplete (which we set to false) will be used.
      const newUserProfile = { 
        ...placeholderUserProfile, // Includes points, badges, enrolledCourses defaults
        name, 
        email,
        profileSetupComplete: false // New users always need to setup profile
      };
      login(newUserProfile); 
      
      toast({
        title: "Signup Successful",
        description: `Welcome, ${name}! Let's set up your profile.`,
      });
      router.push('/profile-setup'); // Always redirect to profile setup after signup
    } else {
      toast({
        title: "Signup Failed",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (authLoading || (authUser && (authUser.profileSetupComplete || !authUser.profileSetupComplete))) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <Gem className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl font-headline">SkillSprint</span>
          </Link>
          <CardTitle className="text-3xl font-headline">Create Your Account</CardTitle>
          <CardDescription>Join SkillSprint and accelerate your learning.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <UserPlus className="mr-2 h-5 w-5" />}
               Sign Up
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto font-semibold text-primary">
              <Link href="/login">
                Sign in
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
