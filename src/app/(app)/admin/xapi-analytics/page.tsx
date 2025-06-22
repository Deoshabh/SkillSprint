// src/app/(app)/admin/xapi-analytics/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, BookOpen, Play, Trophy, TrendingUp, Calendar, Clock, Award } from 'lucide-react';
import { xapiAnalytics, type UserProgressSummary, type CourseAnalytics } from '@/lib/analytics/xapi-analytics';
import { useCourseStore } from '@/lib/course-store';

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalModules: number;
  totalQuizzes: number;
  totalVideos: number;
  avgCompletionRate: number;
  avgQuizScore: number;
  totalLearningTime: number;
}

export default function XAPIAnalyticsPage() {
  const { courses } = useCourseStore();
  const [userEmail, setUserEmail] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [userProgress, setUserProgress] = useState<UserProgressSummary | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load platform stats on component mount
  useEffect(() => {
    loadPlatformStats();
  }, []);

  const loadPlatformStats = async () => {
    setLoadingPlatform(true);
    setError(null);
    try {
      const stats = await xapiAnalytics.getPlatformAnalytics();
      setPlatformStats(stats);
    } catch (err) {
      setError('Failed to load platform statistics');
      console.error('Platform stats error:', err);
    } finally {
      setLoadingPlatform(false);
    }
  };

  const handleGetUserProgress = async () => {
    if (!userEmail.trim()) {
      setError('Please enter a user email');
      return;
    }

    setLoadingUser(true);
    setError(null);
    try {
      const progress = await xapiAnalytics.getUserProgressSummary(userEmail.trim());
      setUserProgress(progress);
      if (!progress) {
        setError('No progress data found for this user');
      }
    } catch (err) {
      setError('Failed to load user progress');
      console.error('User progress error:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleGetCourseAnalytics = async () => {
    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }

    setLoadingCourse(true);
    setError(null);
    try {
      const analytics = await xapiAnalytics.getCourseAnalytics(selectedCourseId);
      setCourseAnalytics(analytics);
      if (!analytics) {
        setError('No analytics data found for this course');
      }
    } catch (err) {
      setError('Failed to load course analytics');
      console.error('Course analytics error:', err);
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleGetLeaderboard = async () => {
    if (!selectedCourseId) {
      setError('Please select a course for leaderboard');
      return;
    }

    setLoadingLeaderboard(true);
    setError(null);
    try {
      const leaderboardData = await xapiAnalytics.getCourseLeaderboard(selectedCourseId, 10);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">xAPI Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor learning progress and platform performance</p>
        </div>
        <Button onClick={loadPlatformStats} disabled={loadingPlatform}>
          {loadingPlatform ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
          Refresh Stats
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats?.totalCourses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformStats ? `${(platformStats.avgCompletionRate * 100).toFixed(1)}%` : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Learning Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformStats ? formatDuration(platformStats.totalLearningTime) : '0h'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Progress Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>User Progress Lookup</CardTitle>
            <CardDescription>Get detailed progress for a specific user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">User Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleGetUserProgress} disabled={loadingUser} className="w-full">
              {loadingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
              Get User Progress
            </Button>

            {userProgress && (
              <div className="mt-4 p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold">{userProgress.userName}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Courses Started: {userProgress.coursesStarted}</div>
                  <div>Courses Completed: {userProgress.coursesCompleted}</div>
                  <div>Modules Completed: {userProgress.modulesCompleted}</div>
                  <div>Quizzes Attempted: {userProgress.quizzesAttempted}</div>
                  <div>Quizzes Passed: {userProgress.quizzesPassed}</div>
                  <div>Videos Watched: {userProgress.videosWatched}</div>
                  <div className="col-span-2">
                    Learning Time: {formatDuration(userProgress.totalLearningTime)}
                  </div>
                  <div className="col-span-2">
                    Last Activity: {formatDate(userProgress.lastActivity)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Course Analytics</CardTitle>
            <CardDescription>Analyze performance for a specific course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-select">Select Course</Label>
              <select
                id="course-select"
                className="w-full p-2 border rounded-md"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleGetCourseAnalytics} disabled={loadingCourse} className="flex-1">
                {loadingCourse ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                Get Analytics
              </Button>
              <Button onClick={handleGetLeaderboard} disabled={loadingLeaderboard} variant="outline">
                {loadingLeaderboard ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2" />}
                Leaderboard
              </Button>
            </div>

            {courseAnalytics && (
              <div className="mt-4 p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold">{courseAnalytics.courseName}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Total Enrollments: {courseAnalytics.totalEnrollments}</div>
                  <div>Total Completions: {courseAnalytics.totalCompletions}</div>
                  <div>Completion Rate: {(courseAnalytics.completionRate * 100).toFixed(1)}%</div>
                  <div>Average Score: {(courseAnalytics.averageScore * 100).toFixed(1)}%</div>
                </div>
              </div>
            )}

            {leaderboard.length > 0 && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Course Leaderboard</h4>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((user, index) => (
                    <div key={user.userEmail} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{index + 1}</span>
                        <span>{user.userName}</span>
                      </div>
                      <div className="text-right">
                        <div>{user.completionPercentage}% complete</div>
                        <div className="text-xs text-muted-foreground">
                          {user.completedModules} modules
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
