'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ContentNotFoundProps {
  course: any;
  currentModule: any;
}

export function ContentNotFound({ course, currentModule }: ContentNotFoundProps) {
  if (!course || !currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-[1600px]">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content Not Found</h3>
              <p className="text-muted-foreground">The requested course or module could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
