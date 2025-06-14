
"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto py-10 text-center flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-3xl font-bold mb-4">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We encountered an unexpected issue. You can try to refresh the page or go back to the dashboard.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="outline"
        >
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
       {process.env.NODE_ENV === 'development' && error?.message && (
        <pre className="mt-8 p-4 bg-muted text-destructive-foreground rounded-md text-left text-xs max-w-xl overflow-auto">
          Error: {error.message}
          {error.stack && `\nStack: ${error.stack}`}
        </pre>
      )}
    </div>
  );
}
