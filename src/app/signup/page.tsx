
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
import { UserPlus, User, Mail, KeyRound, Gem } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Signing up with:', name, email, password);
    if (name && email && password) { 
      login({ ...placeholderUserProfile, name, email }); 
      toast({
        title: "Signup Successful",
        description: `Welcome, ${name}! Start your learning journey.`,
      });
      router.push('/dashboard'); 
    } else {
      toast({
        title: "Signup Failed",
        description: "Please fill in all fields.",
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
                />
              </div>
            </div>
            <Button type="submit" className="w-full text-lg py-6">
              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
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
