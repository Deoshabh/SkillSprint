'use client';

import React from 'react';

interface ModulePageProps {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
}

export default function ModulePage({ params }: ModulePageProps) {
  const { courseId, moduleId } = React.use(params);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Module Page</h1>
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Course ID: {courseId}</h2>
          <h3 className="text-lg mb-4">Module ID: {moduleId}</h3>
          <p className="text-muted-foreground">
            This is a clean slate for your new module page design.
          </p>
        </div>
      </div>
    </div>
  );
}
