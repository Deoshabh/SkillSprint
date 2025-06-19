"use client"; 


import { useState, useEffect, useCallback } from 'react';
import { DailyPlanItem } from '@/components/daily-plan-item';
import { CourseCard } from '@/components/course-card';
import { PointsDisplay } from '@/components/points-display';
import { BadgeIcon } from '@/components/badge-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/breadcrumb';
import { DashboardStatsSkeleton, CourseListSkeleton, DailyPlanSkeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowRight, BookMarked, CalendarCheck, CheckCircle, Gem, Loader2, RefreshCw, AlertTriangle, TrendingUp, Clock, Award } from 'lucide-react';
import { useAuth } from '@/context/auth-context'; 
import { useToast } from '@/hooks/use-toast';
import type { UserProfile as UserProfileType, DailyPlans, Course, UserProgress, DailyTask } from '@/lib/types';

export default function DashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth(); 
  const { toast } = useToast();
  
  // State for real-time dashboard data
  const [todayPlan, setTodayPlan] = useState<DailyTask[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  // Dashboard stats calculation
  const dashboardStats = {
    totalCourses: availableCourses.length,
    completedCourses: availableCourses.filter(course => userProgress?.enrolledCourses?.includes(course.id)).length,
    totalPoints: userProgress?.points || 0,
    todayTasks: todayPlan.length,
    completedTasks: todayPlan.filter(task => task.isCompleted).length,
    streakDays: 7, // This could come from backend
  };

  // Fetch user's daily plan for today
  const fetchTodaysPlan = useCallback(async () => {
    if (!authUser) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/user/daily-plans?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        const dailyPlans = data.dailyPlans || {};
        setTodayPlan(dailyPlans[today] || []);
      } else {
        console.error('Failed to fetch daily plan:', response.status);
        setTodayPlan([]);
      }
    } catch (error) {
      console.error('Failed to fetch daily plan:', error);
      setTodayPlan([]);
    }
  }, [authUser]);

  // Fetch available courses
  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setAvailableCourses(data.courses || []);
      } else {
        console.error('Failed to fetch courses:', response.status);
        setAvailableCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setAvailableCourses([]);
    }
  }, []);
  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    if (!authUser) return;
    
    try {
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const responseData = await response.json();
        
        // The API returns data in responseData.data, not responseData.progress
        if (responseData.success && responseData.data) {
          setUserProgress(responseData.data);
        }
      } else {
        console.error('Failed to fetch user progress:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  }, [authUser]);

  // Comprehensive data fetch
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!authUser) return;
    
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTodaysPlan(),
        fetchCourses(),
        fetchUserProgress(),
      ]);
      setLastUpdated(new Date());
      setRetryCount(0);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [authUser, fetchTodaysPlan, fetchCourses, fetchUserProgress]);

  // Initial data load
  useEffect(() => {
    if (authUser && !authLoading) {
      fetchDashboardData();
    }
  }, [authUser, authLoading, fetchDashboardData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!authUser) return;
    
    const interval = setInterval(() => {
      fetchDashboardData(false); // Silent refresh
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [authUser, fetchDashboardData]);

  const handleRetry = () => {
    fetchDashboardData();
  };
  const handleTaskComplete = async (taskId: string) => {
    try {
      const updatedPlan = todayPlan.map(task => 
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      );
      setTodayPlan(updatedPlan);
      
      // Sync with backend
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/user/daily-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: today, 
          tasks: updatedPlan 
        }),
      });
      
      toast({
        title: "Task updated",
        description: "Your progress has been saved.",
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Update failed",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome back! Here's your learning overview." />
        <DashboardStatsSkeleton />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CourseListSkeleton count={4} />
          </div>
          <div className="space-y-6">
            <DailyPlanSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && retryCount > 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome back! Here's your learning overview." />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Welcome back, ${authUser?.name || 'Learner'}!`}
        description="Here's your learning overview and today's plan."
        actions={
          <Button variant="outline" size="sm" onClick={() => fetchDashboardData(false)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.completedCourses} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              +50 this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.completedTasks}/{dashboardStats.todayTasks}
            </div>
            <Progress 
              value={(dashboardStats.completedTasks / Math.max(dashboardStats.todayTasks, 1)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.streakDays}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>
                  Pick up where you left off
                </CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href="/courses">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {availableCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {availableCourses.slice(0, 4).map((course) => (
                    <CourseCard 
                      key={course.id} 
                      course={course}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookMarked className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No courses yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start learning by exploring our course catalog.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Today's Plan
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/planner">
                  <CalendarCheck className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">              {todayPlan.length > 0 ? (
                todayPlan.map((task) => (
                  <DailyPlanItem
                    key={task.id}
                    task={task}
                    onToggleCompletion={() => handleTaskComplete(task.id)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))
              ) : (
                <div className="text-center py-4">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No tasks planned for today
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/planner">Plan Your Day</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points & Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PointsDisplay points={dashboardStats.totalPoints} />
                {userProgress?.earnedBadges && userProgress.earnedBadges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProgress.earnedBadges.slice(0, 3).map((badge: any, index: number) => (
                      <BadgeIcon key={`badge-${badge.id || index}`} badge={badge} />
                    ))}
                  </div>
                </div>
              )}
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/progress">
                  View Detailed Progress
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Last updated indicator */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
