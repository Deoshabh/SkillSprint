
"use client";

import Image from 'next/image';
import { use, useEffect, useState } from 'react';
import { useCourseStore } from '@/lib/course-store';
import { useAuth } from '@/context/auth-context';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { ModuleItem } from '@/components/module-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Clock, Users, Star, ArrowLeft, Share2, Bookmark, Award, Code, Sigma, Zap, Mic, Palette, Brain, type LucideIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserProgress } from '@/lib/types';

const iconMap: { [key: string]: LucideIcon } = {
  Code,
  Sigma,
  Zap,
  Mic,
  Palette,
  Brain,
};

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { getCourseById } = useCourseStore();
  const { markCourseStarted } = useProgressTracker();
  const course = getCourseById(courseId);
  const userProgress = getProgressForCourse(courseId);

  const handleStartCourse = async () => {
    if (course) {
      await markCourseStarted(course.id, course.title);
    }
  };

  if (!course) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold">Course not found</h1>
        <p className="text-muted-foreground">The course you are looking for does not exist or has been moved.</p>
        <Button asChild className="mt-4">
          <Link href="/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const progressPercentage = userProgress ? (userProgress.completedModules.length / userProgress.totalModules) * 100 : 0;
  const IconComponent = course.icon ? iconMap[course.icon] : null;

  return (
    <div className="space-y-8">
      <div className="relative">
        {course.imageUrl && (
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
        <div className={course.imageUrl ? "absolute bottom-0 left-0 p-6 md:p-10 text-white" : "p-6 md:p-10 bg-card rounded-xl shadow-lg"}>
          <div className="flex items-center space-x-3 mb-2">
            {IconComponent && <IconComponent className={cn("h-8 w-8", course.imageUrl ? "text-white" : "text-primary")} aria-hidden="true" />}
            <span className={cn("text-sm font-medium", course.imageUrl ? "bg-black/50 px-2 py-1 rounded" : "")}>{course.category}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">{course.title}</h1>
          <p className={cn("mt-2 text-lg md:text-xl max-w-3xl", course.imageUrl ? "text-gray-200" : "text-muted-foreground")}>{course.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Course Modules</CardTitle>
              {userProgress && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{userProgress.completedModules.length} / {userProgress.totalModules} modules</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" aria-label={`Course progress: ${progressPercentage.toFixed(0)}%`} />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {course.modules.map((module, index) => (
                <ModuleItem 
                  key={module.id} 
                  module={module} 
                  courseId={course.id} 
                  isCompleted={userProgress?.completedModules.includes(module.id)}
                  isCurrent={userProgress?.currentModuleId === module.id}
                />
              ))}
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

        <div className="space-y-6">          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-4">
               <Button 
                 size="lg" 
                 className="w-full text-lg" 
                 onClick={handleStartCourse}
                 asChild
                 aria-label={userProgress && userProgress.completedModules.length > 0 ? `Continue learning ${course.title}` : `Start course ${course.title}`}
               >
                <Link href={`/courses/${course.id}/module/${course.modules[0]?.id || ''}`}>
                  {userProgress && userProgress.completedModules.length > 0 ? 'Continue Learning' : 'Start Course'}
                </Link>
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" aria-label={`Share course: ${course.title}`}>
                  <Share2 className="h-4 w-4 mr-2" aria-hidden="true" /> Share
                </Button>
                <Button variant="outline" className="flex-1" aria-label={`Add ${course.title} to wishlist`}>
                  <Bookmark className="h-4 w-4 mr-2" aria-hidden="true" /> Wishlist
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-muted-foreground" aria-hidden="true" />
                <span>Instructor: <strong>{course.instructor}</strong></span>
              </div>
              {course.duration && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-muted-foreground" aria-hidden="true" />
                  <span>Duration: {course.duration}</span>
                </div>
              )}
              {course.rating && (
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-3 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  <span>Rating: {course.rating}/5 ({course.enrollmentCount?.toLocaleString()} ratings)</span>
                </div>
              )}
               <div className="flex items-center">
                  <Award className="h-5 w-5 mr-3 text-muted-foreground" aria-hidden="true" />
                  <span>Certificate of Completion</span>
                </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to All Courses
          </Link>
        </Button>
      </div>
    </div>
  );
}

