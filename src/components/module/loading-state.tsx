'use client';

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function LoadingState({ loading, error, onRetry }: LoadingStateProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-[1600px]">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading Module</h3>
              <p className="text-muted-foreground">Please wait while we load your content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-[1600px]">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Module</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              {onRetry ? (
                <Button onClick={onRetry}>
                  Try Again
                </Button>
              ) : (
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
