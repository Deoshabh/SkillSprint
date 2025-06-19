import Link from 'next/link';
import Image from 'next/image';
import type { Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Star, ArrowRight, Code, Sigma, Zap, Mic, Palette, Brain, CheckCircle, Edit, Trash2, MoreVertical, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CourseCardProps {
  course: Course;
  userProgress?: {
    completedModules: string[];
    totalModules: number;
  };
  onCourseUpdate?: () => void;
}

const iconMap: { [key: string]: LucideIcon } = {
  Code,
  Sigma,
  Zap,
  Mic,
  Palette,
  Brain,
};

export function CourseCard({ course, userProgress, onCourseUpdate }: CourseCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const IconComponent = course.icon && iconMap[course.icon] ? iconMap[course.icon] : null;
    const progressPercentage = userProgress 
    ? userProgress.totalModules > 0 
      ? ((userProgress.completedModules?.length || 0) / userProgress.totalModules) * 100 
      : 0
    : 0;

  const isCompleted = progressPercentage === 100;
  const isOwnCourse = user && course.authorId === user.id;

  const handleDeleteCourse = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Course Deleted",
          description: "Your course has been successfully deleted.",
        });
        onCourseUpdate?.();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete course",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className={cn(
      "card-enhanced h-full overflow-hidden group cursor-pointer",
      "hover:shadow-glow dark:hover:shadow-primary/20",
      isCompleted && "ring-2 ring-success/20 bg-success/5"
    )}>
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          {course.imageUrl && course.imageUrl.trim() !== '' ? (
            <Image
              src={course.imageUrl}
              alt={`${course.title} course thumbnail`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/20 to-muted flex items-center justify-center">
              {IconComponent ? (
                <IconComponent className="w-16 h-16 text-primary opacity-60" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {course.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
            {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">            <Badge 
              variant={course.difficulty === 'beginner' ? 'secondary' : 
                      course.difficulty === 'intermediate' ? 'default' : 
                      'destructive'} 
              className="text-xs font-medium backdrop-blur-sm bg-background/80"
            >
              {course.difficulty}
            </Badge>
            {course.category && (
              <Badge variant="outline" className="text-xs backdrop-blur-sm bg-background/80">
                {course.category}
              </Badge>
            )}
            {/* Show visibility status for user's own courses */}
            {isOwnCourse && (
              <Badge 
                variant={
                  course.visibility === 'private' ? 'secondary' :
                  course.visibility === 'shared' ? 'default' :
                  course.status === 'published' ? 'destructive' :
                  'outline'
                }
                className="text-xs backdrop-blur-sm bg-background/80"
              >
                {course.visibility === 'private' ? 'Personal' :
                 course.visibility === 'shared' ? 'Shared' :
                 course.status === 'published' ? 'Published' :
                 course.status === 'pending' ? 'Under Review' :
                 course.status === 'rejected' ? 'Rejected' :
                 'Draft'}
              </Badge>
            )}
          </div>          {isCompleted && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success text-success-foreground">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Course Actions Menu for Owner */}
          {isOwnCourse && (
            <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/course-designer?courseId=${course.id}`} className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </Link>
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Course
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your course "{course.title}" and all its content.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCourse} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-6 space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {IconComponent && <IconComponent className="h-5 w-5 text-primary" aria-hidden="true" />}
          <span className="font-medium">{course.category}</span>
        </div>

        <div>
          <CardTitle className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-3">
            {course.description}
          </CardDescription>
        </div>        {userProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{userProgress.completedModules?.length || 0}/{userProgress.totalModules} modules</span>
              <span className="text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{'estimatedDuration' in course ? String(course.estimatedDuration) : '4-6 weeks'}</span>
            </div>
            {course.enrollmentCount && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>{course.enrollmentCount.toLocaleString()} learners</span>
              </div>
            )}
          </div>
          {course.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
              <span className="font-medium">{course.rating}</span>
            </div>
          )}
        </div>
      </CardContent>      <CardFooter className="p-6 pt-0">
        <Link href={`/courses/${course.id}`} className="w-full">
          <Button 
            className="w-full group/btn hover-lift" 
            variant={userProgress ? "outline" : "default"}
          >
            {userProgress 
              ? isCompleted 
                ? "Review Course" 
                : "Continue Learning"
              : "Start Course"
            }
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
