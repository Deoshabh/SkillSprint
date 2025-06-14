
"use client";

import React, { useState, useEffect, type FormEvent, use, type ChangeEvent } from 'react';
import { getCourseById, getModuleById } from '@/lib/placeholder-data';
import type { Course, Module as ModuleType, VideoLink } from '@/lib/types';
import { MediaPlayer } from '@/components/media-player';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lightbulb, ListChecks, Loader2, AlertTriangle, BookOpen, CheckSquare, PlusCircle, Youtube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { generateQuiz, type GenerateQuizInput } from '@/ai/flows/ai-quiz-generator';
import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator';

interface SessionVideoFormState {
  url: string;
  language: string;
  creator: string;
  title: string;
  isPlaylist: boolean;
}

export default function ModulePage({ params: paramsPromise }: { params: Promise<{ courseId: string; moduleId: string }> }) {
  const params = use(paramsPromise); 

  const { toast } = useToast();
  const { user } = useAuth(); 
  const [course, setCourse] = useState<Course | null | undefined>(null);
  const [module, setModule] = useState<ModuleType | null | undefined>(null);
  
  const [quizQuestionsResult, setQuizQuestionsResult] = useState<string[] | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null);

  const [aiFetchedVideos, setAiFetchedVideos] = useState<VideoLink[]>([]);
  const [loadingAIVideos, setLoadingAIVideos] = useState(false);
  const [errorAIVideos, setErrorAIVideos] = useState<string | null>(null);

  const [userSessionVideos, setUserSessionVideos] = useState<VideoLink[]>([]);
  const [sessionVideoForm, setSessionVideoForm] = useState<SessionVideoFormState>({ url: '', language: 'English', creator: '', title: '', isPlaylist: false });
  const [showAddSessionVideoForm, setShowAddSessionVideoForm] = useState(false);


  useEffect(() => {
    setCourse(getCourseById(params.courseId));
    setModule(getModuleById(params.courseId, params.moduleId));
    setAiFetchedVideos([]); 
    setErrorAIVideos(null);
    setQuizQuestionsResult(null); 
    setErrorQuiz(null);
    setUserSessionVideos([]); // Reset session videos when module changes
    setShowAddSessionVideoForm(false); // Hide form on module change
    setSessionVideoForm({ url: '', language: 'English', creator: '', title: '', isPlaylist: false });
  }, [params.courseId, params.moduleId]); 

  if (course === undefined || module === undefined) { 
    return (
      <div className="container mx-auto py-10 text-center flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || !module) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Module or course not found.</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const handleGenerateQuiz = async (e: FormEvent) => {
    e.preventDefault();
    const contentForQuiz = module.contentData || module.description || module.title + (module.subtopics?.join(", ") || "");
    if (!contentForQuiz) {
      toast({
        title: "Error",
        description: "Not enough content in this module to generate a quiz.",
        variant: "destructive",
      });
      return;
    }
    setLoadingQuiz(true);
    setErrorQuiz(null);
    setQuizQuestionsResult(null);
    try {
      const input: GenerateQuizInput = { courseModuleContent: contentForQuiz, numberOfQuestions: 5 };
      const result = await generateQuiz(input);
      setQuizQuestionsResult(result.quizQuestions);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setErrorQuiz(err instanceof Error ? err.message : "An unknown error occurred.");
       toast({ title: "AI Quiz Generation Failed", description: "Could not generate the quiz. Please try again.", variant: "destructive" });
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSearchVideosWithAI = async () => {
    if (!module) return;
    setLoadingAIVideos(true);
    setErrorAIVideos(null);
    // Keep existing AI videos if user searches multiple times? Or clear them? For now, clearing.
    // setAiFetchedVideos([]); 
    try {
      const input: FindYoutubeVideosInput = {
        moduleTitle: module.title,
        moduleDescription: module.description || module.subtopics?.join(', '),
        preferredLanguage: user?.learningPreferences?.language,
        existingVideos: module.videoLinks?.map(v => ({ creator: v.creator, topic: module.title })) || [],
      };
      const result = await findYoutubeVideosForModule(input);
      // Append new results to existing AI videos to allow multiple searches
      setAiFetchedVideos(prev => [...prev.filter(pv => !result.videos.find(nv => nv.youtubeEmbedUrl === pv.youtubeEmbedUrl)), ...result.videos]);
      if (result.videos.length === 0) {
        toast({ title: "AI Video Search", description: "No additional videos found by AI for this module topic." });
      } else {
         toast({ title: "AI Video Search Successful", description: `Found ${result.videos.length} new video(s). Check the player dropdown.` });
      }
    } catch (err) {
      console.error("Error searching videos with AI:", err);
      setErrorAIVideos(err instanceof Error ? err.message : "An unknown AI error occurred.");
      toast({ title: "AI Video Search Failed", description: "Could not search for videos. Please try again.", variant: "destructive" });
    } finally {
      setLoadingAIVideos(false);
    }
  };

  const handleSessionVideoFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSessionVideoForm({ ...sessionVideoForm, [e.target.name]: e.target.value });
  };
  
  const handleSessionVideoIsPlaylistChange = (checked: boolean | string) => {
    setSessionVideoForm(prev => ({ ...prev, isPlaylist: !!checked }));
  };

  const handleAddUserSessionVideo = (e: FormEvent) => {
    e.preventDefault();
    if (!sessionVideoForm.url.trim() || !sessionVideoForm.language.trim() || !sessionVideoForm.title.trim()) {
      toast({ title: "Error", description: "Video URL, Title, and Language are required.", variant: "destructive" });
      return;
    }

    let embedUrl = sessionVideoForm.url;
    const isPlaylistFromForm = sessionVideoForm.isPlaylist;

    // URL processing logic (simplified version, can be expanded)
    if (isPlaylistFromForm) {
        if (embedUrl.includes("youtube.com/playlist?list=")) {
            const listId = embedUrl.split("playlist?list=")[1]?.split("&")[0];
            if (listId) embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}`;
            else { toast({ title: "Error", description: "Invalid YouTube playlist URL.", variant: "destructive" }); return; }
        } else if (!embedUrl.includes("youtube.com/embed/videoseries?list=")) {
            toast({ title: "Warning", description: "URL marked as playlist, but not standard format. Using as is.", variant: "default" });
        }
    } else {
        if (embedUrl.includes("watch?v=")) {
            const videoId = embedUrl.split("watch?v=")[1]?.split("&")[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
            else { toast({ title: "Error", description: "Invalid YouTube video URL.", variant: "destructive" }); return; }
        } else if (embedUrl.includes("youtu.be/")) {
            const videoId = embedUrl.split("youtu.be/")[1]?.split("?")[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
            else { toast({ title: "Error", description: "Invalid YouTube video URL.", variant: "destructive" }); return; }
        } else if (!embedUrl.includes("youtube.com/embed/")) {
           toast({ title: "Error", description: "Invalid YouTube video URL. Please use embeddable link or standard watch/playlist URL.", variant: "destructive" }); return;
        }
    }
    
    const newSessionVideo: VideoLink = {
      youtubeEmbedUrl: embedUrl,
      title: sessionVideoForm.title || `${isPlaylistFromForm ? 'Playlist' : 'Video'} (User Added)`,
      langCode: sessionVideoForm.language.substring(0,2).toLowerCase(),
      langName: sessionVideoForm.language,
      creator: sessionVideoForm.creator,
      isPlaylist: isPlaylistFromForm,
      notes: 'User added for this session',
    };
    setUserSessionVideos([...userSessionVideos, newSessionVideo]);
    setSessionVideoForm({ url: '', language: 'English', creator: '', title: '', isPlaylist: false }); // Reset form
    setShowAddSessionVideoForm(false);
    toast({ title: "Video Added", description: `"${newSessionVideo.title}" added to this session's videos.` });
  };


  const currentModuleIndex = course.modules.findIndex(m => m.id === module.id);
  const prevModule = currentModuleIndex > 0 ? course.modules[currentModuleIndex - 1] : null;
  const nextModule = currentModuleIndex < course.modules.length - 1 ? course.modules[currentModuleIndex + 1] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow lg:w-3/4 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${course.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {course.title}
            </Link>
          </Button>
           <div className="text-sm text-muted-foreground">
            Module {currentModuleIndex + 1} of {course.modules.length}
          </div>
        </div>

        <MediaPlayer 
          module={module} 
          aiFetchedVideos={aiFetchedVideos}
          userSessionVideos={userSessionVideos}
          onSearchWithAI={module.contentType === 'video' ? handleSearchVideosWithAI : undefined}
          isAISearching={loadingAIVideos}
          userPreferredLanguage={user?.learningPreferences?.language}
        />
        {errorAIVideos && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>AI Video Search Error</AlertTitle>
                <AlertDescription>{errorAIVideos}</AlertDescription>
            </Alert>
        )}
        
        {module.contentType === 'video' && (
          <Card className="mt-2">
            <CardContent className="p-4 space-y-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddSessionVideoForm(!showAddSessionVideoForm)}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> {showAddSessionVideoForm ? 'Cancel Adding Video' : 'Add Your Own Video/Playlist for this Session'}
              </Button>

              {showAddSessionVideoForm && (
                <form onSubmit={handleAddUserSessionVideo} className="space-y-3 p-4 border rounded-md bg-muted/30">
                  <h4 className="text-sm font-medium text-center">Add Custom Video/Playlist (Current Session)</h4>
                  <div className="space-y-1">
                    <Label htmlFor="sessionVideoTitle">Title*</Label>
                    <Input id="sessionVideoTitle" name="title" placeholder="Descriptive title for the video/playlist" value={sessionVideoForm.title} onChange={handleSessionVideoFormChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sessionVideoUrl">YouTube URL (Video or Playlist)*</Label>
                    <Input id="sessionVideoUrl" name="url" placeholder="https://www.youtube.com/watch?v=..." value={sessionVideoForm.url} onChange={handleSessionVideoFormChange} required />
                  </div>
                  <div className="flex items-center space-x-2 mt-2 mb-1">
                      <Checkbox id="sessionVideoIsPlaylist" checked={sessionVideoForm.isPlaylist} onCheckedChange={handleSessionVideoIsPlaylistChange} />
                      <Label htmlFor="sessionVideoIsPlaylist" className="text-sm font-normal">This URL is for a playlist</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sessionVideoLang">Language*</Label>
                      <Input id="sessionVideoLang" name="language" placeholder="e.g., English" value={sessionVideoForm.language} onChange={handleSessionVideoFormChange} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sessionVideoCreator">Creator (Optional)</Label>
                      <Input id="sessionVideoCreator" name="creator" placeholder="e.g., ChannelName" value={sessionVideoForm.creator} onChange={handleSessionVideoFormChange} />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add to Session Videos</Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}


        {module.subtopics && module.subtopics.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center">
                <ListChecks className="h-5 w-5 mr-2 text-primary" />
                Key Subtopics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                {module.subtopics.map((subtopic, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{subtopic}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {module.practiceTask && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-accent" />
                Practice Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{module.practiceTask}</p>
            </CardContent>
          </Card>
        )}


        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Lightbulb className="h-5 w-5 mr-2 text-yellow-400" /> AI Quiz Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Test your understanding of this module by generating a practice quiz.
              The AI will create questions based on the content you've just learned.
            </p>
            <Button onClick={handleGenerateQuiz} disabled={loadingQuiz} className="w-full md:w-auto">
              {loadingQuiz ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2"/>}
              Generate Practice Quiz
            </Button>
            {errorQuiz && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="font-semibold">Error Generating Quiz</p>
                </div>
                <p className="mt-1">{errorQuiz}</p>
              </div>
            )}
            {quizQuestionsResult && !loadingQuiz && (
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold">Generated Quiz Questions:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {quizQuestionsResult.map((q, index) => (
                    <li key={index}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        

        <div className="flex justify-between mt-8">
          {prevModule ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/module/${prevModule.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous: {prevModule.title}
              </Link>
            </Button>
          ) : <div />}
          {nextModule ? (
            <Button variant="default" asChild>
              <Link href={`/courses/${course.id}/module/${nextModule.id}`}>
                Next: {nextModule.title}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button variant="default" asChild>
              <Link href={`/courses/${course.id}`}>
                Finish Course <ListChecks className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:w-1/4 space-y-6 lg:sticky lg:top-20 self-start">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Course Outline</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue={`item-${currentModuleIndex}`}>
              {course.modules.map((m, index) => (
                <AccordionItem value={`item-${index}`} key={m.id}>
                  <AccordionTrigger 
                    className={`text-sm py-2 text-left ${m.id === module.id ? 'font-bold text-primary' : 'hover:text-primary/80'}`}
                  >
                   <span className="truncate w-full pr-1"> {index + 1}. {m.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 text-xs">
                    <p className="text-muted-foreground mb-1 line-clamp-2">{m.description || m.subtopics?.join(', ') || 'No description available.'}</p>
                     <p className="text-muted-foreground mb-2 text-xs">Est. Time: {m.estimatedTime}</p>
                    <Link href={`/courses/${course.id}/module/${m.id}`} className="text-primary hover:underline font-medium text-xs">
                      Go to module
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
