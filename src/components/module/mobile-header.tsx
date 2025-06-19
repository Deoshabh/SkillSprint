'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, BookOpen } from 'lucide-react';

interface MobileHeaderProps {
  currentModuleTitle: string;
  totalVideoCount: number;
  onOpenVideoSidebar: () => void;
  onOpenCourseSidebar: () => void;
}

export function MobileHeader({ 
  currentModuleTitle, 
  totalVideoCount, 
  onOpenVideoSidebar, 
  onOpenCourseSidebar 
}: MobileHeaderProps) {
  return (
    <div className="lg:hidden flex items-center justify-between mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenVideoSidebar}
      >
        <Menu className="h-4 w-4 mr-2" />
        Videos ({totalVideoCount})
      </Button>
      <h1 className="text-lg font-semibold truncate mx-4">
        {currentModuleTitle || 'Loading...'}
      </h1>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCourseSidebar}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Course
      </Button>
    </div>
  );
}
