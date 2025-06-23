"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DrawingCanvas, type DrawingCanvasRef } from '@/components/drawing-canvas';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SquarePen, FileText, Image as ImageIcon, PlusCircle, Save, Trash2, Edit2, Loader2, List, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { TextNote, Sketch } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Force dynamic rendering for this page since it requires authentication
export const dynamic = 'force-dynamic';

export default function NotesAndDrawPage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [currentNote, setCurrentNote] = useState<TextNote | null>(null);
  const [noteTitleInput, setNoteTitleInput] = useState('');
  const [noteBodyInput, setNoteBodyInput] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [currentSketch, setCurrentSketch] = useState<Sketch | null>(null);
  const [sketchTitleInput, setSketchTitleInput] = useState('');
  const [isEditingSketch, setIsEditingSketch] = useState(false);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);

  // Memoize textNotes and sketches from user to prevent unnecessary re-renders
  const userTextNotes = useMemo(() => user?.textNotes || [], [user?.textNotes]);
  const userSketches = useMemo(() => user?.sketches || [], [user?.sketches]);

  useEffect(() => {
    setTextNotes(userTextNotes);
  }, [userTextNotes]);

  useEffect(() => {
    setSketches(userSketches);
  }, [userSketches]);
  const handleNewNote = useCallback(() => {
    setCurrentNote(null);
    setNoteTitleInput('');
    setNoteBodyInput('');
    setIsEditingNote(true); 
  }, []);

  const handleSelectNote = useCallback((note: TextNote) => {
    setCurrentNote(note);
    setNoteTitleInput(note.title);
    setNoteBodyInput(note.body);
    setIsEditingNote(true);
  }, []);
  const handleSaveNote = useCallback(() => {
    if (!noteTitleInput.trim()) {
      toast({ title: "Error", description: "Note title cannot be empty.", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    let updatedNotes;
    if (currentNote) { 
      updatedNotes = textNotes.map(n =>
        n.id === currentNote.id ? { ...n, title: noteTitleInput, body: noteBodyInput, updatedAt: now } : n
      );
    } else { 
      const newNote: TextNote = {
        id: uuidv4(),
        title: noteTitleInput,
        body: noteBodyInput,
        createdAt: now,
        updatedAt: now,
      };
      updatedNotes = [...textNotes, newNote];
    }
    setTextNotes(updatedNotes);
    updateUserProfile({ textNotes: updatedNotes });
    toast({ title: "Note Saved", description: `"${noteTitleInput}" has been saved.` });
    if (!currentNote) { 
        const savedNewNote = updatedNotes.find(n => n.updatedAt === now); 
        if (savedNewNote) handleSelectNote(savedNewNote);
    } else {
        const refreshedNote = updatedNotes.find(n => n.id === currentNote.id);
        if (refreshedNote) setCurrentNote(refreshedNote);
    }
  }, [noteTitleInput, noteBodyInput, currentNote, textNotes, updateUserProfile, toast]);
  const handleDeleteNote = useCallback((noteId: string) => {
    const updatedNotes = textNotes.filter(n => n.id !== noteId);
    setTextNotes(updatedNotes);
    updateUserProfile({ textNotes: updatedNotes });
    toast({ title: "Note Deleted", description: "The note has been deleted." });
    if (currentNote && currentNote.id === noteId) {
      handleNewNote(); 
      setIsEditingNote(false);
    }
  }, [textNotes, updateUserProfile, toast, currentNote, handleNewNote]);
  const handleNewSketch = useCallback(() => {
    setCurrentSketch(null);
    setSketchTitleInput('');
    setIsEditingSketch(true);
    setIsCanvasVisible(true);
    drawingCanvasRef.current?.clearAndLoadDataUrl(null); 
  }, []);

  const handleSelectSketch = useCallback((sketch: Sketch) => {
    setCurrentSketch(sketch);
    setSketchTitleInput(sketch.title);
    setIsEditingSketch(true);
    setIsCanvasVisible(true);
    drawingCanvasRef.current?.clearAndLoadDataUrl(sketch.dataUrl);
  }, []);

  const handleSaveSketch = useCallback(() => {
    if (!sketchTitleInput.trim()) {
      toast({ title: "Error", description: "Sketch title cannot be empty.", variant: "destructive" });
      return;
    }
    const canvasDataUrl = drawingCanvasRef.current?.toDataURL();
    if (!canvasDataUrl) {
      toast({ title: "Error", description: "Could not get sketch data.", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    let updatedSketches;
    if (currentSketch) { 
      updatedSketches = sketches.map(s =>
        s.id === currentSketch.id ? { ...s, title: sketchTitleInput, dataUrl: canvasDataUrl, updatedAt: now } : s
      );
    } else { 
      const newSketch: Sketch = {
        id: uuidv4(),
        title: sketchTitleInput,
        dataUrl: canvasDataUrl,
        createdAt: now,
        updatedAt: now,
      };
      updatedSketches = [...sketches, newSketch];
    }
    setSketches(updatedSketches);
    updateUserProfile({ sketches: updatedSketches });
    toast({ title: "Sketch Saved", description: `"${sketchTitleInput}" has been saved.` });
     if (!currentSketch) {
        const savedNewSketch = updatedSketches.find(s => s.updatedAt === now);
        if (savedNewSketch) handleSelectSketch(savedNewSketch);
    } else {
        const refreshedSketch = updatedSketches.find(s => s.id === currentSketch.id);
        if (refreshedSketch) setCurrentSketch(refreshedSketch);
    }
  }, [sketchTitleInput, currentSketch, sketches, updateUserProfile, toast, handleSelectSketch]);
  const handleDeleteSketch = useCallback((sketchId: string) => {
    const updatedSketches = sketches.filter(s => s.id !== sketchId);
    setSketches(updatedSketches);
    updateUserProfile({ sketches: updatedSketches });
    toast({ title: "Sketch Deleted", description: "The sketch has been deleted." });
    if (currentSketch && currentSketch.id === sketchId) {
      handleNewSketch();
      setIsEditingSketch(false);
    }
  }, [sketches, updateUserProfile, toast, currentSketch, handleNewSketch]);
  
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p>Please log in to use the Notes &amp; Sketchpad feature.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <SquarePen className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          My Notes &amp; Sketches
        </h1>
        <p className="text-xl text-muted-foreground">
          Your personal space for ideas, drafts, and visual thoughts. Saved to your profile.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl flex items-center">
                <FileText className="h-6 w-6 mr-2 text-primary" aria-hidden="true" /> Text Notes
              </CardTitle>
              <Button onClick={handleNewNote} size="sm" aria-label="Create new note">
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> New Note
              </Button>
            </div>
            <CardDescription>Create, view, edit, and delete your text notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingNote || currentNote ? (
              <div className="p-1 border rounded-lg bg-muted/30 shadow-inner">
                <div className="space-y-3 p-3">
                  <Label htmlFor="noteTitleInput" className="font-semibold">Title</Label>
                  <Input id="noteTitleInput" value={noteTitleInput} onChange={(e) => setNoteTitleInput(e.target.value)} placeholder="Note title..." />
                  <Label htmlFor="noteBodyInput" className="font-semibold">Body</Label>
                  <Textarea id="noteBodyInput" value={noteBodyInput} onChange={(e) => setNoteBodyInput(e.target.value)} placeholder="Type your note..." rows={8} />
                  <div className="flex justify-between items-center">
                     <Button onClick={handleSaveNote} size="sm" aria-label="Save current note"><Save className="mr-2 h-4 w-4" aria-hidden="true" /> Save Note</Button>
                     {currentNote && (
                        <p className="text-xs text-muted-foreground">
                            Last updated: {getRelativeTime(currentNote.updatedAt)}
                        </p>
                     )}
                     <Button variant="outline" size="sm" onClick={() => setIsEditingNote(false)} aria-label="Close note editor">Close Editor</Button>
                  </div>
                </div>
              </div>
            ) : (
                 <p className="text-sm text-muted-foreground p-4 text-center">Select a note to view/edit or create a new one.</p>
            )}
            
            {textNotes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-md flex items-center"><List className="mr-2 h-5 w-5" aria-hidden="true" /> My Notes ({textNotes.length})</h4>
                <ScrollArea className="h-60 border rounded-md p-2 bg-background">
                  {textNotes.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(note => (
                    <div key={note.id} className={cn(
                        "mb-2 p-3 rounded-md hover:bg-muted/50 transition-colors border bg-card shadow-sm",
                        currentNote?.id === note.id && "ring-2 ring-primary bg-primary/10"
                        )}>
                      <div className="flex justify-between items-start">
                        <button className="flex-grow cursor-pointer text-left" onClick={() => handleSelectNote(note)} aria-label={`Select note ${note.title}`}>
                          <p className="font-medium text-sm truncate" title={note.title}>{note.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{note.body || "No content"}</p>
                          <p className="text-xs text-muted-foreground mt-1">Updated: {getRelativeTime(note.updatedAt)}</p>
                        </button>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                           <Button variant="ghost" size="sm" onClick={() => handleSelectNote(note)} title="Edit Note" aria-label={`Edit note ${note.title}`}><Edit2 className="h-4 w-4" aria-hidden="true" /></Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Note" aria-label={`Delete note ${note.title}`}><Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete Note?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the note titled "{note.title}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteNote(note.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle className="text-2xl flex items-center">
                    <ImageIcon className="h-6 w-6 mr-2 text-primary" aria-hidden="true" /> Sketches
                </CardTitle>
                 <Button onClick={handleNewSketch} size="sm" aria-label="Create new sketch">
                    <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> New Sketch
                </Button>
            </div>
            <CardDescription>Create, view, edit, and delete your sketches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingSketch || currentSketch ? (
             <div className="p-1 border rounded-lg bg-muted/30 shadow-inner">
                <div className="space-y-3 p-3">
                    <Label htmlFor="sketchTitleInput" className="font-semibold">Sketch Title</Label>
                    <Input id="sketchTitleInput" value={sketchTitleInput} onChange={(e) => setSketchTitleInput(e.target.value)} placeholder="Sketch title..." />
                    
                    <Button variant="outline" onClick={() => setIsCanvasVisible(!isCanvasVisible)} className="w-full" aria-label={isCanvasVisible ? "Hide drawing canvas" : "Show drawing canvas"}>
                        {isCanvasVisible ? <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" /> : <Eye className="mr-2 h-4 w-4" aria-hidden="true" />}
                        {isCanvasVisible ? 'Hide Canvas' : 'Show Canvas'}
                    </Button>
                    
                    {isCanvasVisible && (
                        <div className="mt-2 p-1 border rounded-lg bg-card shadow-inner overflow-x-auto" aria-label="Drawing canvas region">
                            <DrawingCanvas 
                                ref={drawingCanvasRef} 
                                initialDataUrl={currentSketch?.dataUrl}
                                width={550} height={380} 
                            />
                        </div>
                    )}
                     <div className="flex justify-between items-center mt-2">
                        <Button onClick={handleSaveSketch} size="sm" aria-label="Save current sketch"><Save className="mr-2 h-4 w-4" aria-hidden="true" /> Save Sketch</Button>
                        {currentSketch && (
                            <p className="text-xs text-muted-foreground">
                                Last updated: {getRelativeTime(currentSketch.updatedAt)}
                            </p>
                        )}
                        <Button variant="outline" size="sm" onClick={() => { setIsEditingSketch(false); setIsCanvasVisible(false); setCurrentSketch(null);}} aria-label="Close sketch editor">Close Editor</Button>
                    </div>
                </div>
              </div>
            ) : (
                <p className="text-sm text-muted-foreground p-4 text-center">Select a sketch to view/edit or create a new one.</p>
            )}

            {sketches.length > 0 && (
                 <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-md flex items-center"><List className="mr-2 h-5 w-5" aria-hidden="true" /> My Sketches ({sketches.length})</h4>
                    <ScrollArea className="h-60 border rounded-md p-2 bg-background">
                    {sketches.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(sketch => (
                        <div key={sketch.id} className={cn(
                            "mb-2 p-3 rounded-md hover:bg-muted/50 transition-colors border bg-card shadow-sm",
                            currentSketch?.id === sketch.id && "ring-2 ring-primary bg-primary/10"
                            )}>
                        <div className="flex justify-between items-start">
                            <button className="flex items-center gap-3 flex-grow cursor-pointer text-left" onClick={() => handleSelectSketch(sketch)} aria-label={`Select sketch ${sketch.title}`}>
                                <img src={sketch.dataUrl} alt={sketch.title || "Sketch preview"} className="w-16 h-12 object-contain border rounded bg-white" data-ai-hint="user sketch drawing"/>
                                <div>
                                    <p className="font-medium text-sm truncate" title={sketch.title}>{sketch.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Updated: {getRelativeTime(sketch.updatedAt)}</p>
                                </div>
                            </button>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                <Button variant="ghost" size="sm" onClick={() => handleSelectSketch(sketch)} title="Edit Sketch" aria-label={`Edit sketch ${sketch.title}`}><Edit2 className="h-4 w-4" aria-hidden="true" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" title="Delete Sketch" aria-label={`Delete sketch ${sketch.title}`}><Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Sketch?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the sketch titled "{sketch.title}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSketch(sketch.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        </div>
                    ))}
                    </ScrollArea>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
