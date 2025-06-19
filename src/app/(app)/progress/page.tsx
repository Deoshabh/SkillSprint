"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, BookOpen, Target, Calendar, Award, TrendingUp, Loader2, Zap, Clock, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ProgressTracker, type EnrichedProgressData, type CourseProgressDetail } from '@/lib/progress-tracker';
import type { Course, UserProgress } from '@/lib/types';

interface ProgressData {
  enrolledCourses: string[];
  completedModules: { [courseId: string]: string[] };
  userModuleVideos?: { [key: string]: any[] };
  userAIVideos?: { [key: string]: any[] };
  userAISearchUsage?: { [key: string]: number };
  points: number;
  earnedBadges: any[];
  dailyPlans: { [date: string]: any[] };
  stats?: {
    totalModulesCompleted: number;
    totalCoursesEnrolled: number;
    totalPointsEarned: number;
    totalBadgesEarned: number;
    totalVideosAdded: number;
    totalAIVideosFound: number;
    lastActivity: Date;
    joinedDate: Date;
  };
}

interface EnrichedCourseProgress {
  course: Course;
  completedModules: string[];
  progress: number;
  totalModules: number;
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [courseProgress, setCourseProgress] = useState<CourseProgressDetail[]>([]);
  const [learningStreak, setLearningStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActivityDate: null as Date | null
  });
  useEffect(() => {
    if (user) {
      fetchProgressData();
      fetchCourses();
      
      // Set up auto-refresh every 30 seconds for real-time updates
      const interval = autoRefresh ? setInterval(() => {
        fetchProgressData();
      }, 30000) : null;

      // Listen for real-time progress updates
      const handleProgressUpdate = (event: CustomEvent) => {
        console.log('Progress update received:', event.detail);
        fetchProgressData(); // Refresh data when progress updates
      };

      window.addEventListener('progressUpdate', handleProgressUpdate as EventListener);
      
      return () => {
        if (interval) clearInterval(interval);
        window.removeEventListener('progressUpdate', handleProgressUpdate as EventListener);
      };
    }
  }, [user, autoRefresh]);
  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const data = await response.json();
        setProgressData(data.progress);
        setLastUpdated(new Date());
          // Calculate detailed course progress and learning streak
        if (data.progress && courses.length > 0) {
          const enrichedData: EnrichedProgressData = {
            ...data.progress,
            userModuleVideos: data.progress.userModuleVideos || {},
            userAIVideos: data.progress.userAIVideos || {},
            userAISearchUsage: data.progress.userAISearchUsage || {},
            stats: data.progress.stats || {
              totalModulesCompleted: 0,
              totalCoursesEnrolled: 0,
              totalPointsEarned: 0,
              totalBadgesEarned: 0,
              totalVideosAdded: 0,
              totalAIVideosFound: 0,
              lastActivity: new Date(),
              joinedDate: new Date()
            }
          };
          
          const detailedProgress = ProgressTracker.calculateCourseProgress(enrichedData, courses);
          setCourseProgress(detailedProgress);
          
          const streakData = ProgressTracker.calculateLearningStreak(data.progress.dailyPlans || {});
          setLearningStreak(streakData);
        }
      } else {
        throw new Error('Failed to fetch progress data');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast({
        title: "Error",
        description: "Failed to load your progress data.",
        variant: "destructive"
      });
    }
  };
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
          // Recalculate progress if we already have progress data
        if (progressData) {
          const enrichedData: EnrichedProgressData = {
            ...progressData,
            userModuleVideos: progressData.userModuleVideos || {},
            userAIVideos: progressData.userAIVideos || {},
            userAISearchUsage: progressData.userAISearchUsage || {},
            stats: progressData.stats || {
              totalModulesCompleted: 0,
              totalCoursesEnrolled: 0,
              totalPointsEarned: 0,
              totalBadgesEarned: 0,
              totalVideosAdded: 0,
              totalAIVideosFound: 0,
              lastActivity: new Date(),
              joinedDate: new Date()
            }
          };
          
          const detailedProgress = ProgressTracker.calculateCourseProgress(enrichedData, data.courses || []);
          setCourseProgress(detailedProgress);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEnrichedCourseProgress = (): EnrichedCourseProgress[] => {
    if (!progressData || !courses || !progressData.enrolledCourses || !Array.isArray(progressData.enrolledCourses)) return [];

    return progressData.enrolledCourses.map(courseId => {
      const course = courses.find(c => (c as any)._id === courseId || c.id === courseId);
      if (!course) return null;

      const completedModules = progressData.completedModules?.[courseId] || [];
      const totalModules = course.modules?.length || 0;
      const progress = totalModules > 0 ? (completedModules.length / totalModules) * 100 : 0;

      return {
        course,
        completedModules,
        progress,
        totalModules
      };
    }).filter(Boolean) as EnrichedCourseProgress[];
  };

  const getOverallProgress = () => {
    const enrichedProgress = getEnrichedCourseProgress();
    if (enrichedProgress.length === 0) return 0;

    const totalProgress = enrichedProgress.reduce((sum, cp) => sum + cp.progress, 0);
    return totalProgress / enrichedProgress.length;
  };

  const getActivityStats = () => {
    if (!progressData || !progressData.dailyPlans) return { plannedDays: 0, completedTasks: 0 };

    const plannedDays = Object.keys(progressData.dailyPlans).length;
    const completedTasks = Object.values(progressData.dailyPlans)
      .flat()
      .filter((task: any) => task?.isCompleted).length;

    return { plannedDays, completedTasks };
  };

  const getDetailedProgress = () => {
    const enrichedProgress = getEnrichedCourseProgress();
    
    const stats = {
      totalCourses: enrichedProgress.length,
      totalModules: enrichedProgress.reduce((sum, cp) => sum + cp.totalModules, 0),
      completedModules: enrichedProgress.reduce((sum, cp) => sum + (cp.completedModules?.length || 0), 0),
      averageProgress: getOverallProgress(),
      coursesCompleted: enrichedProgress.filter(cp => cp.progress === 100).length,
      coursesInProgress: enrichedProgress.filter(cp => cp.progress > 0 && cp.progress < 100).length,
      coursesNotStarted: enrichedProgress.filter(cp => cp.progress === 0).length
    };

    return stats;
  };

  const getCourseStatus = (progress: number) => {
    if (progress === 0) return { status: 'Not Started', color: 'bg-gray-200', textColor: 'text-gray-600' };
    if (progress < 100) return { status: 'In Progress', color: 'bg-blue-200', textColor: 'text-blue-700' };
    return { status: 'Completed', color: 'bg-green-200', textColor: 'text-green-700' };
  };

  const refreshProgress = async () => {
    setLoading(true);
    await fetchProgressData();
    setLoading(false);
    toast({
      title: "Progress Updated",
      description: "Your progress data has been refreshed.",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p>Please log in to view your progress.</p>
        <Button asChild className="mt-4">
          <a href="/login">Login</a>
        </Button>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-10">
        <p>Failed to load your progress data.</p>
        <Button onClick={fetchProgressData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const enrichedProgress = getEnrichedCourseProgress();
  const overallProgress = getOverallProgress();
  const activityStats = getActivityStats();
  const detailedStats = getDetailedProgress();

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Your Learning Progress</h1>
          <p className="text-muted-foreground mt-2">
            Track your achievements and see how far you've come
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshProgress}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
      </header>      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.points}</div>
            <p className="text-xs text-muted-foreground">
              Earned from completed modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStreak.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              {learningStreak.totalActiveDays} total active days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {detailedStats.completedModules} of {detailedStats.totalModules} modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.earnedBadges.length}</div>
            <p className="text-xs text-muted-foreground">
              Badges earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Analytics
          </CardTitle>
          <CardDescription>
            Detailed insights into your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Activity Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Current streak: <span className="font-semibold">{learningStreak.currentStreak} days</span></p>
                <p>Longest streak: <span className="font-semibold">{learningStreak.longestStreak} days</span></p>
                <p>Total active days: <span className="font-semibold">{learningStreak.totalActiveDays}</span></p>
                {learningStreak.lastActivityDate && (
                  <p className="text-muted-foreground">
                    Last activity: {learningStreak.lastActivityDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Course Statistics</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Enrolled courses: <span className="font-semibold">{detailedStats.totalCourses}</span></p>
                <p>Completed: <span className="font-semibold text-green-600">{detailedStats.coursesCompleted}</span></p>
                <p>In progress: <span className="font-semibold text-blue-600">{detailedStats.coursesInProgress}</span></p>
                <p>Not started: <span className="font-semibold text-gray-600">{detailedStats.coursesNotStarted}</span></p>
              </div>
            </div>
            
            {progressData.stats && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Resources</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Videos added: <span className="font-semibold">{progressData.stats.totalVideosAdded}</span></p>
                  <p>AI videos found: <span className="font-semibold">{progressData.stats.totalAIVideosFound}</span></p>
                  <p>Member since: <span className="font-semibold">
                    {new Date(progressData.stats.joinedDate).toLocaleDateString()}
                  </span></p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>      {/* Real-time Course Progress Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Progress Dashboard
            {autoRefresh && <Badge variant="secondary" className="ml-2">Live</Badge>}
          </CardTitle>
          <CardDescription>
            Real-time tracking of your enrolled courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseProgress.length > 0 ? (
              courseProgress.map((course, index) => {
                const statusInfo = getCourseStatus(course.progressPercentage);
                return (
                  <div key={course.courseId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{course.courseTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {course.completedModules?.length || 0} of {course.totalModules} modules completed
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={`${statusInfo.color} ${statusInfo.textColor}`}>
                          {statusInfo.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {course.pointsEarned} pts
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {Math.round(course.progressPercentage)}%</span>
                        <span>{course.completedModules?.length || 0} / {course.totalModules} modules</span>
                      </div>
                      <Progress value={course.progressPercentage} className="h-2" />
                      
                      {(course.completedModules?.length || 0) > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Completed Modules:</p>
                          <div className="flex flex-wrap gap-1">
                            {course.completedModules.slice(0, 5).map((moduleId, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                Module {moduleId}
                              </Badge>
                            ))}
                            {course.completedModules.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{course.completedModules.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {course.status === 'in-progress' && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          Keep going! You're making great progress on this course.
                        </div>
                      )}
                      
                      {course.status === 'completed' && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                          🎉 Congratulations! You've completed this course.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No enrolled courses yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your learning journey by enrolling in a course
                </p>
                <Button asChild className="mt-4">
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Earned Badges */}
      {progressData.earnedBadges && progressData.earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Badges
            </CardTitle>
            <CardDescription>
              Achievements you've unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {progressData.earnedBadges.map((badge: any, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {typeof badge === 'object' && badge !== null ? (
                    <>
                      {badge.icon && <span>{badge.icon}</span>}
                      {badge.name || badge.id || 'Badge'}
                    </>
                  ) : (
                    badge
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
