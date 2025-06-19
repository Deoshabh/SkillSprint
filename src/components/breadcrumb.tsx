"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

export function Breadcrumb({ className, customItems }: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if no custom items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Dashboard', href: '/dashboard', icon: Home }
    ];

    // Skip dashboard if we're already on it
    if (pathname === '/dashboard') {
      return [{ title: 'Dashboard', icon: Home }];
    }

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the dashboard segment since we already added it
      if (segment === 'dashboard') return;
      
      // Format segment title
      const title = formatSegmentTitle(segment, pathSegments, index);
      
      // Don't add href for the last item (current page)
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const formatSegmentTitle = (segment: string, allSegments: string[], index: number): string => {    // Handle specific routes
    const routeMap: Record<string, string> = {
      'course-designer': 'Course Designer',
      'notes-and-draw': 'Notes & Draw',
      'profile-setup': 'Profile Setup',
      'account': 'Account',
      'security': 'Security',
      'password-reset': 'Password Reset',
      'email-verify': 'Email Verification',
      'admin': 'Admin',
      'ai-course-generator': 'AI Course Generator',
      'content-scout': 'Content Scout',
      'user-management': 'User Management',
      'feedback-management': 'Feedback Management',
      'course-moderation': 'Course Moderation',
    };

    if (routeMap[segment]) {
      return routeMap[segment];
    }

    // Handle dynamic routes (IDs)
    if (segment.match(/^[a-f0-9]{24}$/) || segment.match(/^\d+$/)) {
      const prevSegment = allSegments[index - 1];
      if (prevSegment === 'courses') return 'Course Details';
      if (prevSegment === 'module') return 'Module';
      if (prevSegment === 'users') return 'User Details';
      return `#${segment.slice(0, 8)}`;
    }

    // Capitalize and replace hyphens
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center text-sm font-medium transition-colors hover:text-primary",
                    index === 0 ? "text-muted-foreground" : "text-muted-foreground"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  {item.title}
                </Link>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center text-sm font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  {item.title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Utility component for page headers with breadcrumbs
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs, 
  actions, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Breadcrumb customItems={breadcrumbs} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
