
import Link from 'next/link';
import Image from 'next/image';
import type { Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Star, ArrowRight, Code, Sigma, Zap, Mic, Palette, Brain, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

const iconMap: { [key: string]: LucideIcon } = {
  Code,
  Sigma,
  Zap,
  Mic,
  Palette,
  Brain,
};

export function CourseCard({ course }: CourseCardProps) {
  const IconComponent = course.icon && iconMap[course.icon] ? iconMap[course.icon] : null;
  
  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out",
      "hover:shadow-xl hover:scale-[1.02] dark:hover:shadow-primary/20"
    )}>
      <CardHeader className="p-0">
        {course.imageUrl && (
          <div className="relative h-48 w-full">
            <Image
              src={course.imageUrl}
              alt={course.title || "Course image"}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false} 
              data-ai-hint={course.dataAiHint || "education learning"}
            />
             <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {course.category}
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-6 space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {IconComponent && <IconComponent className="h-5 w-5 text-primary" aria-hidden="true" />}
          <span className="font-semibold">{course.instructor}</span>
        </div>
        <CardTitle className="text-xl font-headline line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm">{course.description}</CardDescription>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-2">
          {course.duration && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
              <span>{course.duration}</span>
            </div>
          )}
          {course.enrollmentCount && (
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" aria-hidden="true" />
              <span>{course.enrollmentCount.toLocaleString()} learners</span>
            </div>
          )}
          {course.rating && (
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1 text-yellow-400 fill-yellow-400" aria-hidden="true" />
              <span>{course.rating}/5</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t dark:border-border/50">
        <Button asChild className="w-full" variant="default" aria-label={`View course: ${course.title}`}>
          <Link href={`/courses/${course.id}`}>
            View Course <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
