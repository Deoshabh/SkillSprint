
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { placeholderUserProfile } from '@/lib/placeholder-data'; 
import { useRouter } from 'next/navigation'; 
import { LogIn, Mail, KeyRound } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', email, password);
    if (email && password) { 
      login({ ...placeholderUserProfile, email: email }); 
      toast({
        title: "Login Successful",
        description: `Welcome back, ${placeholderUserProfile.name}!`,
      });
      router.push('/dashboard'); 
    } else {
       toast({
        title: "Login Failed",
        description: "Please enter email and password.",
        variant: "destructive",
      });
    }
  };

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
                />
              </div>
            </div>
            <Button type="submit" className="w-full text-lg py-6">
              <LogIn className="mr-2 h-5 w-5" /> Sign In
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

