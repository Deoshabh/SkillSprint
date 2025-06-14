
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
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.profileSetupComplete) {
      router.replace('/dashboard');
    }
    else if (!authLoading && user && !user.profileSetupComplete) {
      router.replace('/profile-setup');
    }
  }, [user, authLoading, router]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
       toast({
        title: "Login Failed",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Simulate login logic
    console.log('Logging in with:', email, password);

    // In a real app, you'd validate credentials against a backend.
    // For this prototype, we'll assume the entered email/password are "correct"
    // if they are not empty, and proceed with the placeholder user.
    // To simulate an "incorrect credential" scenario, we can add a dummy check.
    if (email === placeholderUserProfile.email && password === "password123") { // Simulated "correct" credentials
      const potentialUser = { 
        ...placeholderUserProfile,
        email: email, 
        name: email.split('@')[0] || "User",
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
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
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
                  aria-describedby="email-error"
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
                  aria-describedby="password-error"
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
