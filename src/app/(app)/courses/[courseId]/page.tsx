"use client";

import { useState, useEffect, useCallback, use } from 'react';
import Image from 'next/image';
import type { Course } from '@/lib/types';
import { ModuleItem } from '@/components/module-item';
import { PageHeader } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle, Clock, Users, Star, Award, Edit, Trash2, Play, Plus, User, Code, Sigma, Zap, Mic, Palette, Brain, RefreshCw, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { CourseDetailSkeleton } from '@/components/ui/skeleton';

const iconMap: { [key: string]: LucideIcon } = {
  Code: Code,
  Sigma: Sigma,
  Zap: Zap,
  Mic: Mic,
  Palette: Palette,
  Brain: Brain,
};

export default function CourseDetailPage({ params: paramsPromise }: { params: Promise<{ courseId: string }> }) {
  const params = use(paramsPromise);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userProgress, setUserProgress] = useState<{
    completedModules: string[];
    totalModules: number;
  } | null>(null);

  const fetchCourse = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/courses/${params.courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else if (response.status === 404) {
        setError('Course not found');
      } else {
        throw new Error('Failed to fetch course');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params.courseId]);

  const fetchUserProgress = useCallback(async () => {
    if (!user || !course) return;
    
    try {
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const responseData = await response.json();
        
        // The API returns data in responseData.data, not responseData.progress
        if (responseData.success && responseData.data) {
          const progressData = responseData.data;
          
          const courseId = params.courseId;
          const completedModules = progressData.completedModules?.[courseId] || [];
          const totalModules = course?.modules?.length || 0;
          
          setUserProgress({
            completedModules,
            totalModules
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  }, [user, course, params.courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (course && user) {
      fetchUserProgress();
    }
  }, [course, user, fetchUserProgress]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    fetchCourse();
  };

  const handleDeleteCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${params.courseId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: 'Course deleted',
          description: 'The course has been successfully deleted.',
          variant: 'default',
        });
        router.push('/courses');
      } else {
        toast({
          title: 'Error deleting course',
          description: 'An error occurred while deleting the course. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast({
        title: 'Error deleting course',
        description: 'An error occurred while deleting the course. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleEnrollCourse = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to enroll in courses.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/courses/${params.courseId}/enroll`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Enrollment successful',
          description: 'You have been enrolled in this course.',
        });
        fetchUserProgress();
      } else {
        throw new Error('Failed to enroll');
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
      toast({
        title: 'Enrollment failed',
        description: 'Failed to enroll in course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Loading Course..."
          breadcrumbs={[
            { title: 'Courses', href: '/courses' },
            { title: 'Loading...', href: '' }
          ]}
        />
        <CourseDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Error"
          breadcrumbs={[
            { title: 'Courses', href: '/courses' },
            { title: 'Error', href: '' }
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Failed to Load Course</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleRetry} variant="default" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/courses">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Courses
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Course Not Found"
          breadcrumbs={[
            { title: 'Courses', href: '/courses' },
            { title: 'Not Found', href: '' }
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Course Not Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The course you are looking for does not exist or has been moved.
                  </p>
                </div>
                <Button asChild variant="default" size="sm">
                  <Link href="/courses">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = userProgress ? ((userProgress.completedModules?.length || 0) / userProgress.totalModules) * 100 : 0;
  const IconComponent = course.icon ? iconMap[course.icon] : null;
  const isEnrolled = userProgress !== null;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={course.title}
        breadcrumbs={[
          { title: 'Courses', href: '/courses' },
          { title: course.title, href: '' }
        ]}
      />

      <div className="space-y-8">
        <div className="relative">
          {course.imageUrl && course.imageUrl.trim() !== '' && (
            <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden shadow-lg">
              <Image
                src={course.imageUrl}
                alt={course.title || "Course cover image"}
                fill
                style={{ objectFit: 'cover' }}
                priority
                data-ai-hint={course.dataAiHint || "learning online course"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
          )}
          <div className={course.imageUrl && course.imageUrl.trim() !== '' ? "absolute bottom-0 left-0 p-6 md:p-10 text-white" : "p-6 md:p-10 bg-card rounded-xl shadow-lg"}>
            <div className="flex items-center space-x-3 mb-2">
              {IconComponent && <IconComponent className={cn("h-8 w-8", course.imageUrl && course.imageUrl.trim() !== '' ? "text-white" : "text-primary")} aria-hidden="true" />}
              <span className={cn("text-sm font-medium", course.imageUrl && course.imageUrl.trim() !== '' ? "bg-black/50 px-2 py-1 rounded" : "")}>{course.category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">{course.title}</h1>
            <p className={cn("mt-2 text-lg md:text-xl max-w-3xl", course.imageUrl && course.imageUrl.trim() !== '' ? "text-gray-200" : "text-muted-foreground")}>{course.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-headline">Course Modules</CardTitle>
                  {user && (user.id === course.authorId || user.role === 'admin') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/course-designer?edit=${params.courseId}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Course
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this course? This action cannot be undone and will remove all course content and student progress.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive hover:bg-destructive/90">
                                Delete Course
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {userProgress && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Your Progress</span>
                      <span>{userProgress.completedModules?.length || 0} / {userProgress.totalModules} modules</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" aria-label={`Course progress: ${progressPercentage.toFixed(0)}%`} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {progressPercentage === 100 ? 'Course completed!' : `${progressPercentage.toFixed(0)}% complete`}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {course.modules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No modules available yet.</p>
                    {user && (user.id === course.authorId || user.role === 'admin') && (
                      <Button asChild className="mt-4" variant="outline">
                        <Link href={`/course-designer?edit=${params.courseId}`}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Modules
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  course.modules.map((module, index) => (
                    <ModuleItem 
                      key={module.id} 
                      module={module} 
                      courseId={params.courseId} 
                      isCompleted={userProgress?.completedModules?.includes(module.id) || false}
                      isCurrent={false}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-headline">What you'll learn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" /> Master key concepts of {course.title.toLowerCase()}.</p>
                <p className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" /> Apply your knowledge to practical projects.</p>
                <p className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" /> Prepare for relevant industry certifications or roles.</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {!isEnrolled ? (
                    <Button onClick={handleEnrollCourse} className="w-full" size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Enroll in Course
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild className="w-full" size="lg">
                        <Link href={`/courses/${params.courseId}/module/${course.modules[0]?.id || ''}`}>
                          <Play className="h-4 w-4 mr-2" />
                          {progressPercentage === 0 ? 'Start Course' : 'Continue Learning'}
                        </Link>
                      </Button>
                      {progressPercentage === 100 && (
                        <div className="flex items-center justify-center text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Course Completed!
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Modules</span>
                      <span className="font-medium">{course.modules.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{course.category}</span>
                    </div>
                    {(course as any).estimatedDuration && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Duration
                        </span>
                        <span className="font-medium">{(course as any).estimatedDuration}</span>
                      </div>
                    )}
                    {(course as any).difficulty && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Level</span>
                        <span className="font-medium capitalize">{(course as any).difficulty}</span>
                      </div>
                    )}
                    {(course as any).rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Rating
                        </span>
                        <span className="font-medium">{(course as any).rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {(course as any).author && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Course Author</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{(course as any).author.name}</p>
                      <p className="text-sm text-muted-foreground">{(course as any).author.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(user?.role === 'admin' || (user && course.authorId === user.id)) && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Course Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/course-designer?edit=${params.courseId}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Course
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Course</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this course? This action cannot be undone and will remove all course content and student progress.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive hover:bg-destructive/90">
                            Delete Course
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}