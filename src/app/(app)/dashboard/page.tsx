
"use client"; 

import { placeholderUserProfile, placeholderDailyPlan, placeholderCourses, placeholderUserProgress } from '@/lib/placeholder-data';
import { DailyPlanItem } from '@/components/daily-plan-item';
import { CourseCard } from '@/components/course-card';
import { PointsDisplay } from '@/components/points-display';
import { BadgeIcon } from '@/components/badge-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookMarked, CalendarCheck, CheckCircle, Gem, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context'; 
import type { UserProfile as UserProfileType } from '@/lib/types';

export default function DashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth(); 
  
  const user: UserProfileType = authUser || placeholderUserProfile;
  
  const todayPlan = placeholderDailyPlan.slice(0, 3); 
  const currentCourseId = user.enrolledCourses.length > 0 ? user.enrolledCourses[0] : placeholderCourses[0]?.id; 
  const currentCourseProgress = placeholderUserProgress.find(p => p.courseId === currentCourseId);
  const currentCourse = placeholderCourses.find(c => c.id === currentCourseId);

  const calculateOverallProgress = () => {
    if (!currentCourseProgress || !currentCourse) return 0;
    return (currentCourseProgress.completedModules.length / currentCourseProgress.totalModules) * 100;
  };
  const overallProgress = calculateOverallProgress();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }
  
  if (!authUser) {
     return (
       <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center">
         <h1 className="text-2xl font-semibold mb-4">Welcome to SkillSprint!</h1>
         <p className="text-muted-foreground mb-6">Please log in to access your dashboard and courses.</p>
         <Button asChild>
           <Link href="/login">Go to Login</Link>
         </Button>
       </div>
     );
  }


  return (
    <div className="space-y-8 animate-fade-in">
      <section aria-labelledby="welcome-heading">
        <Card className="bg-gradient-to-br from-primary via-accent to-primary/70 text-primary-foreground shadow-xl overflow-hidden">
          <CardHeader className="relative z-10">
            <div className="flex items-center space-x-3">
              <Gem className="h-8 w-8" aria-hidden="true" />
              <CardTitle id="welcome-heading" className="text-3xl md:text-4xl font-headline">Welcome back, {user.name}!</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/90 text-lg mt-1">
              Ready to accelerate your learning journey today?
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {currentCourse && (
               <div className="mt-2 p-4 bg-black/20 rounded-lg backdrop-blur-sm">
                 <p className="text-sm font-medium text-primary-foreground/80">Continue Learning:</p>
                 <Link href={`/courses/${currentCourse.id}/module/${currentCourseProgress?.currentModuleId || currentCourse.modules[0].id}`} aria-label={`Continue learning ${currentCourse.title}`}>
                  <h3 className="text-xl font-semibold hover:underline text-white">{currentCourse.title}</h3>
                 </Link>
                 <div className="mt-3 flex items-center space-x-3">
                   <Progress value={overallProgress} className="w-full h-3 bg-primary-foreground/30" indicatorClassName="bg-primary-foreground rounded-full" aria-label={`Progress for ${currentCourse.title}: ${overallProgress.toFixed(0)}%`} />
                   <span className="text-sm font-semibold text-white">{overallProgress.toFixed(0)}%</span>
                 </div>
               </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-labelledby="daily-plan-heading" className="lg:col-span-2">
          <Card className="h-full shadow-lg transition-shadow hover:shadow-xl dark:hover:shadow-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle id="daily-plan-heading" className="text-2xl font-headline flex items-center">
                  <CalendarCheck className="h-6 w-6 mr-2 text-primary" aria-hidden="true" /> Today&apos;s Sprint
                </CardTitle>
                <CardDescription>Your personalized plan for today.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/planner" aria-label="View full daily plan">View Full Plan <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayPlan.length > 0 ? (
                todayPlan.map(task => <DailyPlanItem key={task.id} task={task} />)
              ) : (
                <p className="text-muted-foreground">No tasks scheduled for today. Enjoy your break or explore new courses!</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="gamification-heading" className="space-y-6">
           <PointsDisplay points={user.points} />
           <Card className="shadow-lg transition-shadow hover:shadow-xl dark:hover:shadow-primary/20">
            <CardHeader>
              <CardTitle id="gamification-heading" className="text-xl font-headline flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" aria-hidden="true" /> My Badges
              </CardTitle>
              <CardDescription>Your earned achievements.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {user.earnedBadges.length > 0 ? (
                user.earnedBadges.map(badge => <BadgeIcon key={badge.id} badge={badge} size="md" />)
              ) : (
                <p className="text-sm text-muted-foreground">No badges earned yet. Keep learning!</p>
              )}
            </CardContent>
            <CardContent className="pt-0">
               <Button variant="link" asChild className="p-0 h-auto text-sm">
                <Link href="/gamification" aria-label="View all badges">View all badges <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" /></Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="recommended-courses-heading">
        <Card className="shadow-lg transition-shadow hover:shadow-xl dark:hover:shadow-primary/20">
          <CardHeader>
             <CardTitle id="recommended-courses-heading" className="text-2xl font-headline flex items-center">
                <BookMarked className="h-6 w-6 mr-2 text-primary" aria-hidden="true" /> Explore Courses
              </CardTitle>
            <CardDescription>Discover new skills and knowledge.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {placeholderCourses.slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CardContent>
           <CardContent className="text-center pt-4 pb-6">
             <Button variant="default" size="lg" asChild className="transform hover:scale-105 transition-transform duration-200">
                <Link href="/courses" aria-label="Browse all courses">
                  Browse All Courses <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
           </CardContent>
        </Card>
      </section>
    </div>
  );
}
