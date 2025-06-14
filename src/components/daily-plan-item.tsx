"use client";

import type { DailyTask } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowRight, Briefcase, Clock, Coffee, Target, HelpCircle, Users, BookOpen, Trash2, Edit, CalendarDays, type LucideIcon } from 'lucide-react';

interface DailyPlanItemProps {
  task: DailyTask;
  onToggleCompletion: (completed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const iconMap: { [key: string]: LucideIcon } = {
  Briefcase, 
  coursework: Briefcase,
  Clock,     
  review: Clock,
  Coffee,    
  break: Coffee,
  Target,    
  quiz: Target,
  HelpCircle, 
  personal: HelpCircle,
  Users, 
  meeting: Users,
  BookOpen, 
  CalendarDays, 
};

export function DailyPlanItem({ task, onToggleCompletion, onEdit, onDelete }: DailyPlanItemProps) {
  const [isChecked, setIsChecked] = useState(task.isCompleted);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsChecked(task.isCompleted); 
  }, [task.isCompleted]);

  const handleCheckedChange = (checked: boolean | string) => {
    if (isClient) {
      const newCheckedState = Boolean(checked);
      setIsChecked(newCheckedState);
      onToggleCompletion(newCheckedState);
    }
  };
  
  const TaskIconComponent = iconMap[task.icon || task.type] || CalendarDays;

  return (
    <Card className={cn(
        "transition-all duration-300 group relative rounded-lg border", 
        isChecked ? "bg-muted/60 opacity-60 hover:opacity-80" : "bg-card hover:shadow-lg hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary"
      )}
    >
      <CardContent className="p-4 flex items-start space-x-4">
        {isClient && (
          <Checkbox
            id={`task-${task.id}`}
            checked={isChecked}
            onCheckedChange={handleCheckedChange}
            className="mt-1 flex-shrink-0 border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600 data-[state=checked]:text-white"
            aria-labelledby={`task-label-${task.id}`}
            aria-label={`Mark task ${task.title} as ${isChecked ? 'incomplete' : 'complete'}`}
          />
        )}
        <div className="flex-grow space-y-1">
          <Label htmlFor={`task-${task.id}`} id={`task-label-${task.id}`} className={cn("text-base font-medium cursor-pointer", isChecked && "line-through text-muted-foreground")}>
            {task.title}
          </Label>
          <p className={cn("text-sm text-muted-foreground flex items-center", isChecked && "line-through")}>
            <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" aria-hidden="true" />
            {task.time} 
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <TaskIconComponent className="h-4 w-4 mr-1.5 flex-shrink-0" aria-hidden="true" />
            <span className="capitalize">{task.type}</span>
          </p>
          {task.description && <p className={cn("text-xs text-muted-foreground", isChecked && "line-through")}>{task.description}</p>}
          {task.courseTitle && (
            <p className={cn("text-xs text-muted-foreground mt-1", isChecked && "line-through")}>
              Related to: <span className="font-medium">{task.courseTitle}</span>
              {task.moduleTitle && ` - ${task.moduleTitle}`}
            </p>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
           <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit Task" aria-label={`Edit task ${task.title}`}>
             <Edit className="h-4 w-4" aria-hidden="true" />
           </Button>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" title="Delete Task" aria-label={`Delete task ${task.title}`}>
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the task "{task.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {task.courseId && task.moduleId && !isChecked && (
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0 self-center ml-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" aria-label={`Go to module ${task.moduleTitle || task.title}`}>
            <Link href={`/courses/${task.courseId}/module/${task.moduleId}`}>
              Go to Module <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
