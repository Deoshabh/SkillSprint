'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { Course, Module } from '@/lib/module-api';

interface CourseNavigationProps {
  course: Course | null;
  currentModuleId: string;
  courseId: string;
}

export function CourseNavigation({ course, currentModuleId, courseId }: CourseNavigationProps) {
  if (!course) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Course Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading course information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Course Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{course.title}</h3>
            {course.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {course.description}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            {course.modules.map((module, index) => (
              <Link
                key={module.id}
                href={`/courses/${courseId}/module/${module.id}`}                className={`
                  block p-4 rounded-lg border transition-colors group
                  ${module.id === currentModuleId
                    ? 'bg-primary/10 border-primary/30'
                    : 'hover:bg-muted/50 border-muted'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
                    ${module.isCompleted 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                      : module.id === currentModuleId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                    }
                  `}>
                    {module.isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1 leading-tight break-words">
                      {module.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {module.estimatedTime && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.estimatedTime}
                        </Badge>
                      )}
                      {module.isCompleted && (
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                      )}
                      {module.id === currentModuleId && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
