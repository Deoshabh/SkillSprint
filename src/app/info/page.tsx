"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function InfoPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">SkillSprint Platform</h1>
        <p className="text-muted-foreground text-lg">Professional learning management platform for skill development</p>
      </div>

      <div className="grid gap-6 md:gap-8">
        {/* Platform Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Platform Features
            </CardTitle>
            <CardDescription>
              Comprehensive learning management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold">AI-Powered Learning</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Intelligent course recommendations and personalized learning paths
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold">Collaborative Environment</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Interactive learning with community support and discussion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Ready to begin your learning journey?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to access our comprehensive course library and start building your skills today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/signup">
                  Create Account
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button variant="ghost" asChild className="text-muted-foreground">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
