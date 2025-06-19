
import type { Badge as BadgeType } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ShieldQuestion, Zap, Award, Star, CheckCircle, Target, Users, type LucideIcon } from 'lucide-react';

interface BadgeIconProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: { [key: string]: LucideIcon } = {
  ShieldQuestion,
  Zap,
  Award,
  Star,
  CheckCircle,
  Target,
  Users,
};

export function BadgeIcon({ badge, size = 'md' }: BadgeIconProps) {
  const IconComponent = badge.icon && iconMap[badge.icon] ? iconMap[badge.icon] : iconMap['ShieldQuestion'];
  
  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5', // Icon size: h-4 w-4
    md: 'h-12 w-12 p-2', // Icon size: h-6 w-6
    lg: 'h-16 w-16 p-3', // Icon size: h-8 w-8
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "rounded-full flex items-center justify-center bg-muted hover:bg-accent/20 transition-colors cursor-pointer",
              sizeClasses[size]
            )}
            style={{ 
              borderColor: badge.color || 'hsl(var(--primary))',
              borderWidth: '2px',
              borderStyle: 'solid'
            }}
          >
            <IconComponent className={cn(iconSizeClasses[size], badge.color || 'text-primary')} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-popover text-popover-foreground rounded-md shadow-lg p-2">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
