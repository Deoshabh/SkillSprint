import { placeholderUserProfile, placeholderDailyPlan, placeholderCourses, placeholderUserProgress } from '@/lib/placeholder-data';
import { DailyPlanItem } from '@/components/daily-plan-item';
import { CourseCard } from '@/components/course-card';
import { PointsDisplay } from '@/components/points-display';
import { BadgeIcon } from '@/components/badge-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookMarked, CalendarCheck, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const user = placeholderUserProfile;
  const todayPlan = placeholderDailyPlan.slice(0, 3); // Show first 3 tasks
  const currentCourseProgress = placeholderUserProgress.find(p => p.courseId === user.enrolledCourses[0]);
  const currentCourse = placeholderCourses.find(c => c.id === user.enrolledCourses[0]);

  const calculateOverallProgress = () => {
    if (!currentCourseProgress || !currentCourse) return 0;
    return (currentCourseProgress.completedModules.length / currentCourseProgress.totalModules) * 100;
  };
  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-8">
      <section aria-labelledby="welcome-heading">
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl">
          <CardHeader>
            <CardTitle id="welcome-heading" className="text-3xl font-headline">Welcome back, {user.name}!</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg">
              Ready to accelerate your learning journey today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentCourse && (
               <div className="mt-2">
                 <p className="text-sm font-medium">Continue Learning:</p>
                 <Link href={`/courses/${currentCourse.id}/module/${currentCourseProgress?.currentModuleId || currentCourse.modules[0].id}`}>
                  <h3 className="text-xl font-semibold hover:underline">{currentCourse.title}</h3>
                 </Link>
                 <div className="mt-2 flex items-center space-x-2">
                   <Progress value={overallProgress} className="w-full h-3 bg-primary-foreground/30" indicatorClassName="bg-primary-foreground" />
                   <span className="text-sm font-medium">{overallProgress.toFixed(0)}%</span>
                 </div>
               </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-labelledby="daily-plan-heading" className="lg:col-span-2">
          <Card className="h-full shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle id="daily-plan-heading" className="text-2xl font-headline flex items-center">
                  <CalendarCheck className="h-6 w-6 mr-2 text-primary" /> Today&apos;s Sprint
                </CardTitle>
                <CardDescription>Your personalized plan for today.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/planner">View Full Plan <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle id="gamification-heading" className="text-xl font-headline flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" /> My Badges
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
               <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/gamification">View all badges <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="recommended-courses-heading">
        <Card className="shadow-lg">
          <CardHeader>
             <CardTitle id="recommended-courses-heading" className="text-2xl font-headline flex items-center">
                <BookMarked className="h-6 w-6 mr-2 text-primary" /> Explore Courses
              </CardTitle>
            <CardDescription>Discover new skills and knowledge.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {placeholderCourses.slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CardContent>
           <CardContent className="text-center">
             <Button variant="default" size="lg" asChild>
                <Link href="/courses">
                  Browse All Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
           </CardContent>
        </Card>
      </section>
    </div>
  );
}
