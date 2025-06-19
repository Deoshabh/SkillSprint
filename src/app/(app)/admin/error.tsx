
"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Section Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-10 text-center flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
      <ShieldAlert className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-3xl font-bold mb-4">Admin Area Error</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        An error occurred in this admin section. Please try again or navigate to a different admin page.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          variant="outline"
        >
          Try again
        </Button>
        <Button asChild>
          <Link href="/admin/course-designer">Back to Admin Dashboard</Link>
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
