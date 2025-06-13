
"use client";

import type { DailyTask } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight, Briefcase, Clock, Coffee, Target, HelpCircle, type LucideIcon } from 'lucide-react';

interface DailyPlanItemProps {
  task: DailyTask;
}

const iconMap: { [key: string]: LucideIcon } = {
  Briefcase,
  Clock,
  Coffee,
  Target,
  HelpCircle,
};

export function DailyPlanItem({ task }: DailyPlanItemProps) {
  const [isChecked, setIsChecked] = useState(task.isCompleted);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleCheckedChange = (checked: boolean) => {
    if (isClient) {
      setIsChecked(checked);
      // Here you would typically update the task's completion status in your backend
      console.log(`Task ${task.id} completion status changed to: ${checked}`);
    }
  };
  
  const TaskIconComponent = task.icon ? iconMap[task.icon] : null;

  return (
    <Card className={cn("transition-all duration-300", isChecked ? "bg-muted/50 opacity-70" : "bg-card hover:shadow-md")}>
      <CardContent className="p-4 flex items-start space-x-4">
        {isClient && (
          <Checkbox
            id={`task-${task.id}`}
            checked={isChecked}
            onCheckedChange={handleCheckedChange}
            className="mt-1 flex-shrink-0"
            aria-labelledby={`task-label-${task.id}`}
          />
        )}
        <div className="flex-grow">
          <Label htmlFor={`task-${task.id}`} id={`task-label-${task.id}`} className={cn("text-base font-medium", isChecked && "line-through text-muted-foreground")}>
            {task.title}
          </Label>
          <p className={cn("text-sm text-muted-foreground", isChecked && "line-through")}>{task.time}</p>
          {task.courseTitle && task.moduleTitle && (
            <p className={cn("text-xs text-muted-foreground mt-1", isChecked && "line-through")}>
              {TaskIconComponent && <TaskIconComponent className="inline-block h-3 w-3 mr-1" />}
              {task.courseTitle} - {task.moduleTitle}
            </p>
          )}
          {task.description && <p className={cn("text-xs text-muted-foreground mt-1", isChecked && "line-through")}>{task.description}</p>}
        </div>
        {task.courseId && task.moduleId && !isChecked && (
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
            <Link href={`/courses/${task.courseId}/module/${task.moduleId}`}>
              Go to Module <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
