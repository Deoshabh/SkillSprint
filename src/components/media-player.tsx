import type { Module } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Video } from 'lucide-react';

interface MediaPlayerProps {
  module: Module;
}

export function MediaPlayer({ module }: MediaPlayerProps) {
  const renderContent = () => {
    switch (module.contentType) {
      case 'video':
        return module.contentUrl ? (
          <div className="aspect-video w-full">
            <iframe
              src={module.contentUrl}
              title={module.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            ></iframe>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <Video className="h-16 w-16 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Video content unavailable.</p>
          </div>
        );
      case 'markdown':
        return (
          <Card className="prose dark:prose-invert max-w-none p-6 bg-background shadow-inner">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {module.contentData || 'No markdown content available.'}
            </pre>
          </Card>
        );
      case 'pdf':
        return (
           <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg p-4">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">PDF Viewer Placeholder</p>
            <p className="text-sm text-muted-foreground text-center">
              This is where the PDF content for "{module.title}" would be displayed.
            </p>
            {module.contentUrl && (
              <a 
                href={module.contentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 text-primary hover:underline"
              >
                Open PDF in new tab
              </a>
            )}
          </div>
        );
      case 'quiz':
         return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Quiz content placeholder.</p>
            <p className="text-sm text-muted-foreground">Quiz: {module.title}</p>
          </div>
        );
      case 'assignment':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Assignment placeholder.</p>
            <p className="text-sm text-muted-foreground">Assignment: {module.title}</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <AlertTriangle className="h-16 w-16 text-destructive mb-2" />
            <p className="text-destructive-foreground">Unsupported content type.</p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{module.title}</CardTitle>
        {module.description && <CardDescription>{module.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
