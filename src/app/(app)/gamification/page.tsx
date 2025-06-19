"use client";


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Target, Gift, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GamificationPage() {
  return (
    <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className="h-16 w-16 text-primary animate-pulse" />
              <Star className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Achievements & Badges
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Something amazing is on the way!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Coming Soon</h3>
            <p className="text-muted-foreground leading-relaxed">
              We're working hard to bring you an exciting gamification experience with:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Achievement System</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Progress Badges</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Star className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Learning Streaks</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Gift className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Rewards System</span>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              In the meantime, keep learning and earning points!
            </p>
            <Button asChild className="w-full md:w-auto">
              <Link href="/dashboard" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
