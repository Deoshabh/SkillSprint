
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DrawingCanvas } from '@/components/drawing-canvas';
import { SquarePen, FileText, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const LOCAL_STORAGE_NOTE_TITLE_KEY = 'skillSprintNoteTitle';
const LOCAL_STORAGE_NOTE_BODY_KEY = 'skillSprintNoteBody';

export default function NotesAndDrawPage() {
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);

  // Load notes from localStorage on initial render
  useEffect(() => {
    const savedTitle = localStorage.getItem(LOCAL_STORAGE_NOTE_TITLE_KEY);
    const savedBody = localStorage.getItem(LOCAL_STORAGE_NOTE_BODY_KEY);
    if (savedTitle) setNoteTitle(savedTitle);
    if (savedBody) setNoteBody(savedBody);
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_NOTE_TITLE_KEY, noteTitle);
  }, [noteTitle]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_NOTE_BODY_KEY, noteBody);
  }, [noteBody]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <SquarePen className="h-10 w-10 mr-3 text-primary" />
          Notes & Sketchpad
        </h1>
        <p className="text-xl text-muted-foreground">
          Jot down ideas, draft content, and sketch your thoughts.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
                <FileText className="h-6 w-6 mr-2 text-primary"/> Text Notes
            </CardTitle>
            <CardDescription>
              Write down your thoughts. Notes are auto-saved to your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="noteTitle" className="text-lg font-medium">Note Title</Label>
              <Input
                id="noteTitle"
                placeholder="Enter your note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="noteBody" className="text-lg font-medium">Note Content</Label>
              <Textarea
                id="noteBody"
                placeholder="Start typing your notes here..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={12}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
                <ImageIcon className="h-6 w-6 mr-2 text-primary"/> Sketchpad
            </CardTitle>
            <CardDescription>
              Unleash your creativity. Drawings are for the current session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setIsCanvasVisible(!isCanvasVisible)}
              className="w-full"
            >
              {isCanvasVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {isCanvasVisible ? 'Hide Sketchpad' : 'Show Sketchpad'}
            </Button>
            {isCanvasVisible && (
              <div className="mt-4 p-1 border rounded-lg bg-card shadow-inner overflow-x-auto">
                 <DrawingCanvas width={550} height={380} />
              </div>
            )}
            {!isCanvasVisible && (
                <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-muted/50 p-6">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">Sketchpad is hidden. Click above to show it.</p>
                </div>
            )}
             <p className="text-xs text-muted-foreground pt-2">
                Note: Drawings are not saved offline automatically in this version. Use browser print/screenshot to save your work.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
