
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
import { LogIn, Mail, KeyRound, Gem, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, login, loading: authLoading } = useAuth(); // Get user and authLoading
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is already logged in and profile is complete, redirect to dashboard
    if (!authLoading && user?.profileSetupComplete) {
      router.replace('/dashboard');
    }
    // If user is logged in but profile is NOT complete, redirect to profile setup
    else if (!authLoading && user && !user.profileSetupComplete) {
      router.replace('/profile-setup');
    }
     // If no user and not loading, stay on login page.
  }, [user, authLoading, router]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Logging in with:', email, password);

    if (email && password) {
      // Simulate fetching full user data, including profileSetupComplete status
      const potentialUser = { 
        ...placeholderUserProfile, // Base placeholder
        email: email, 
        name: email.split('@')[0] || "User", // Simulate name based on email
         // Crucially, use the profileSetupComplete from placeholder, which is false for first time
        profileSetupComplete: placeholderUserProfile.profileSetupComplete 
      };

      login(potentialUser); 
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${potentialUser.name}!`,
      });

      if (!potentialUser.profileSetupComplete) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } else {
       toast({
        title: "Login Failed",
        description: "Please enter email and password.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  // If still loading auth state, or if user is loaded and being redirected, show loader
  if (authLoading || (user && (user.profileSetupComplete || !user.profileSetupComplete)) ) {
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
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue your learning journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <LogIn className="mr-2 h-5 w-5" />}
               Sign In
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto font-semibold text-primary">
              <Link href="/signup">
                Sign up
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
