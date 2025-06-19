"use client";

import { AICourseImporter } from '@/components/ai-course-importer';

export default function AIImportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            AI-Powered Course Import
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Upload any file and let AI intelligently extract video links, document resources, 
            and automatically structure a complete course for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📄 Multiple Formats</h3>
              <p className="text-muted-foreground">
                Supports .txt, .md, .yaml, .csv, .json, .docx, .pdf and more
              </p>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🤖 AI-Powered</h3>
              <p className="text-muted-foreground">
                Automatically extracts video links, documents, and course structure
              </p>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">⚡ Instant Preview</h3>
              <p className="text-muted-foreground">
                Review and customize the generated course before importing
              </p>
            </div>
          </div>
        </div>
        
        <AICourseImporter />
      </div>
    </div>
  );
}
