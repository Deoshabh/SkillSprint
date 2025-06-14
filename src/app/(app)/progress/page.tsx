
import { placeholderUserProgress, placeholderCourses, placeholderUserProfile } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';

export default function ProgressPage() {
  const user = placeholderUserProfile;
  const overallProgressStats = {
    coursesCompleted: user.earnedBadges.filter(b => b.name.includes("Completer")).length,
    modulesCompleted: placeholderUserProgress.reduce((sum, p) => sum + p.completedModules.length, 0),
    hoursLearned: placeholderUserProgress.reduce((sum, p) => {
      const course = placeholderCourses.find(c => c.id === p.courseId);
      if (!course) return sum;
      return sum + p.completedModules.reduce((moduleSum, modId) => {
        const module = course.modules.find(m => m.id === modId);
        // Assuming estimatedTime like "2 hours" or "30 minutes"
        // This is a rough estimation
        const time = parseFloat(module?.estimatedTime || "0");
        if (module?.estimatedTime.includes("minute")) return moduleSum + time / 60;
        return moduleSum + time;
      }, 0);
    }, 0).toFixed(1),
  };


  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <BarChart3 className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          My Progress
        </h1>
        <p className="text-xl text-muted-foreground">
          Track your learning journey and celebrate your achievements.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallProgressStats.coursesCompleted}</div>
            <p className="text-xs text-muted-foreground">Keep up the great work!</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
            <Zap className="h-5 w-5 text-yellow-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallProgressStats.modulesCompleted}</div>
            <p className="text-xs text-muted-foreground">Each module is a step forward.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Learned</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallProgressStats.hoursLearned} <span className="text-xl">hrs</span></div>
            <p className="text-xs text-muted-foreground">Time well spent investing in yourself.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Enrolled Courses</CardTitle>
          <CardDescription>Detailed progress for each course you are enrolled in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {placeholderUserProgress.length > 0 ? (
            placeholderUserProgress.map(progress => {
              const course = placeholderCourses.find(c => c.id === progress.courseId);
              if (!course) return null;
              const percentage = (progress.completedModules.length / progress.totalModules) * 100;
              return (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {course.imageUrl && (
                      <div className="sm:w-1/3 relative h-40 sm:h-auto">
                        <Image
                          src={course.imageUrl}
                          alt={course.title || 'Course image'}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="sm:rounded-l-lg sm:rounded-tr-none rounded-t-lg"
                          data-ai-hint={course.dataAiHint || "education technology"}
                        />
                      </div>
                    )}
                    <div className="flex-grow p-6">
                      <h3 className="text-xl font-semibold font-headline">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{course.category}</p>
                      <div className="my-3">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress: {progress.completedModules.length} / {progress.totalModules} modules</span>
                          <span className="font-semibold text-primary">{percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={percentage} className="h-3 w-full" aria-label={`Progress for ${course.title}: ${percentage.toFixed(0)}%`} />
                      </div>
                       <p className="text-xs text-muted-foreground mb-3">
                        Next module: {course.modules.find(m => m.id === progress.currentModuleId)?.title || "Start course!"}
                      </p>
                      <Button asChild variant="default" size="sm">
                        <Link href={`/courses/${course.id}`} aria-label={`Go to course: ${course.title}`}>
                          {percentage > 0 ? 'Continue Course' : 'Start Course'} <TrendingUp className="ml-2 h-4 w-4" aria-hidden="true"/>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-4">You are not enrolled in any courses yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Placeholder for learning streaks or activity graph */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activity graph coming soon.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
