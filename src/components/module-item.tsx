import Link from 'next/link';
import type { Module } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, PlayCircle, FileText, HelpCircle, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleItemProps {
  module: Module;
  courseId: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
}

const getModuleIcon = (contentType: Module['contentType']) => {
  switch (contentType) {
    case 'video': return PlayCircle;
    case 'markdown': return FileText;
    case 'pdf': return FileText;
    case 'quiz': return HelpCircle;
    case 'assignment': return BookOpen;
    default: return BookOpen;
  }
};

export function ModuleItem({ module, courseId, isCompleted, isCurrent }: ModuleItemProps) {
  const ModuleIcon = getModuleIcon(module.contentType);

  return (
    <Link href={`/courses/${courseId}/module/${module.id}`} legacyBehavior passHref>
      <a
        className={cn(
          "block p-1 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isCurrent ? "ring-2 ring-primary" : "hover:bg-accent/50"
        )}
      >
        <Card className={cn("transition-colors", isCompleted ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700" : "bg-card", isCurrent && "border-primary shadow-md")}>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className={cn(
                "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                isCompleted ? "bg-green-100 dark:bg-green-800" : "bg-primary/10 dark:bg-primary/20"
              )}>
              <ModuleIcon className={cn("h-5 w-5", isCompleted ? "text-green-600 dark:text-green-400" : "text-primary")} />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-md leading-tight">{module.title}</h3>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" /> {module.estimatedTime}
                {module.description && ` - ${module.description.substring(0,50)}...`}
              </p>
            </div>
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            ) : (
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            )}
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
