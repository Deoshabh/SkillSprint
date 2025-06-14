
"use client";

import React, { useState, useEffect, type FormEvent, use, type ChangeEvent } from 'react';
import { getCourseById, getModuleById } from '@/lib/placeholder-data';
import type { Course, Module as ModuleType, VideoLink } from '@/lib/types';
import { MediaPlayer } from '@/components/media-player';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lightbulb, ListChecks, Loader2, AlertTriangle, BookOpen, CheckSquare, PlusCircle, Youtube, Trash2 } from 'lucide-react';
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

interface ModuleVideoFormState {
  url: string;
  language: string;
  creator: string;
  title: string;
  isPlaylist: boolean;
}

const USER_MODULE_VIDEO_LIMIT = 3; // Default limit, ideally admin-configurable

export default function ModulePage({ params: paramsPromise }: { params: Promise<{ courseId: string; moduleId: string }> }) {
  const params = use(paramsPromise); 

  const { toast } = useToast();
  const { user, updateUserProfile } = useAuth(); 
  const [course, setCourse] = useState<Course | null | undefined>(null);
  const [module, setModule] = useState<ModuleType | null | undefined>(null);
  
  const [quizQuestionsResult, setQuizQuestionsResult] = useState<string[] | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null);

  const [aiFetchedVideos, setAiFetchedVideos] = useState<VideoLink[]>([]);
  const [loadingAIVideos, setLoadingAIVideos] = useState(false);
  const [errorAIVideos, setErrorAIVideos] = useState<string | null>(null);

  const [userAddedModuleVideos, setUserAddedModuleVideos] = useState<VideoLink[]>([]);
  const [moduleVideoForm, setModuleVideoForm] = useState<ModuleVideoFormState>({ url: '', language: 'English', creator: '', title: '', isPlaylist: false });
  const [showAddModuleVideoForm, setShowAddModuleVideoForm] = useState(false);

  const moduleKey = params.courseId && params.moduleId ? `${params.courseId}-${params.moduleId}` : '';

  useEffect(() => {
    setCourse(getCourseById(params.courseId));
    setModule(getModuleById(params.courseId, params.moduleId));
    setAiFetchedVideos([]); 
    setErrorAIVideos(null);
    setQuizQuestionsResult(null); 
    setErrorQuiz(null);
    setShowAddModuleVideoForm(false);
    setModuleVideoForm({ url: '', language: 'English', creator: '', title: '', isPlaylist: false });

    if (user && moduleKey && user.userModuleVideos && user.userModuleVideos[moduleKey]) {
      setUserAddedModuleVideos(user.userModuleVideos[moduleKey]);
    } else {
      setUserAddedModuleVideos([]);
    }

  }, [params.courseId, params.moduleId, user, moduleKey]); 

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
    try {
      const input: FindYoutubeVideosInput = {
        moduleTitle: module.title,
        moduleDescription: module.description || module.subtopics?.join(', '),
        preferredLanguage: user?.learningPreferences?.language,
        existingVideos: module.videoLinks?.map(v => ({ creator: v.creator, topic: module.title })) || [],
      };
      const result = await findYoutubeVideosForModule(input);
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

  const handleModuleVideoFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setModuleVideoForm({ ...moduleVideoForm, [e.target.name]: e.target.value });
  };
  
  const handleModuleVideoIsPlaylistChange = (checked: boolean | string) => {
    setModuleVideoForm(prev => ({ ...prev, isPlaylist: !!checked }));
  };

  const handleAddUserModuleVideo = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !moduleKey) {
        toast({ title: "Error", description: "User not logged in or module key missing.", variant: "destructive" });
        return;
    }
    if (userAddedModuleVideos.length >= USER_MODULE_VIDEO_LIMIT) {
        toast({ title: "Limit Reached", description: `You can add up to ${USER_MODULE_VIDEO_LIMIT} videos/playlists to this module.`, variant: "destructive" });
        return;
    }
    if (!moduleVideoForm.url.trim() || !moduleVideoForm.language.trim() || !moduleVideoForm.title.trim()) {
      toast({ title: "Error", description: "Video URL, Title, and Language are required.", variant: "destructive" });
      return;
    }

    let embedUrl = moduleVideoForm.url;
    const isPlaylistFromForm = moduleVideoForm.isPlaylist;

    if (isPlaylistFromForm) {
        if (embedUrl.includes("youtube.com/playlist?list=")) {
            const listId = embedUrl.split("playlist?list=")[1]?.split("&")[0];
            if (listId) embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}`;
            else { toast({ title: "Error", description: "Invalid YouTube playlist URL.", variant: "destructive" }); return; }
        } else if (!embedUrl.includes("youtube.com/embed/videoseries?list=")) {
            toast({ title: "Warning", description: "URL marked as playlist, but not standard embed format. Using as is.", variant: "default" });
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
    
    const newModuleVideo: VideoLink = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, // Unique ID for removal
      youtubeEmbedUrl: embedUrl,
      title: moduleVideoForm.title || `${isPlaylistFromForm ? 'Playlist' : 'Video'} (User Added)`,
      langCode: moduleVideoForm.language.substring(0,2).toLowerCase(),
      langName: moduleVideoForm.language,
      creator: moduleVideoForm.creator,
      isPlaylist: isPlaylistFromForm,
      notes: 'User added to this module',
    };

    const updatedVideosForModule = [...userAddedModuleVideos, newModuleVideo];
    setUserAddedModuleVideos(updatedVideosForModule);
    
    const currentUserModuleVideos = user.userModuleVideos || {};
    updateUserProfile({
        userModuleVideos: {
            ...currentUserModuleVideos,
            [moduleKey]: updatedVideosForModule,
        }
    });

    setModuleVideoForm({ url: '', language: 'English', creator: '', title: '', isPlaylist: false }); // Reset form
    setShowAddModuleVideoForm(false);
    toast({ title: "Video Added", description: `"${newModuleVideo.title}" added to this module's videos.` });
  };

  const handleRemoveUserModuleVideo = (videoIdToRemove: string) => {
    if (!user || !moduleKey) return;

    const updatedVideosForModule = userAddedModuleVideos.filter(video => video.id !== videoIdToRemove);
    setUserAddedModuleVideos(updatedVideosForModule);

    const currentUserModuleVideos = user.userModuleVideos || {};
    updateUserProfile({
      userModuleVideos: {
        ...currentUserModuleVideos,
        [moduleKey]: updatedVideosForModule,
      }
    });
    toast({ title: "Video Removed", description: "Your video has been removed from this module." });
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
          userAddedModuleVideos={userAddedModuleVideos}
          onSearchWithAI={module.contentType === 'video' ? handleSearchVideosWithAI : undefined}
          isAISearching={loadingAIVideos}
          userPreferredLanguage={user?.learningPreferences?.language}
          onRemoveUserVideo={handleRemoveUserModuleVideo}
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
                onClick={() => setShowAddModuleVideoForm(!showAddModuleVideoForm)}
                className="w-full"
                disabled={userAddedModuleVideos.length >= USER_MODULE_VIDEO_LIMIT}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> 
                {showAddModuleVideoForm ? 'Cancel Adding Video' : `Add Video/Playlist to Module (${userAddedModuleVideos.length}/${USER_MODULE_VIDEO_LIMIT})`}
              </Button>
              {userAddedModuleVideos.length >= USER_MODULE_VIDEO_LIMIT && !showAddModuleVideoForm && (
                <p className="text-xs text-center text-muted-foreground">You've reached the limit of {USER_MODULE_VIDEO_LIMIT} custom videos for this module.</p>
              )}

              {showAddModuleVideoForm && (
                <form onSubmit={handleAddUserModuleVideo} className="space-y-3 p-4 border rounded-md bg-muted/30">
                  <h4 className="text-sm font-medium text-center">Add Custom Video/Playlist to this Module</h4>
                  <div className="space-y-1">
                    <Label htmlFor="moduleVideoTitle">Title*</Label>
                    <Input id="moduleVideoTitle" name="title" placeholder="Descriptive title for the video/playlist" value={moduleVideoForm.title} onChange={handleModuleVideoFormChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="moduleVideoUrl">YouTube URL (Video or Playlist)*</Label>
                    <Input id="moduleVideoUrl" name="url" placeholder="https://www.youtube.com/watch?v=..." value={moduleVideoForm.url} onChange={handleModuleVideoFormChange} required />
                  </div>
                  <div className="flex items-center space-x-2 mt-2 mb-1">
                      <Checkbox id="moduleVideoIsPlaylist" checked={moduleVideoForm.isPlaylist} onCheckedChange={handleModuleVideoIsPlaylistChange} />
                      <Label htmlFor="moduleVideoIsPlaylist" className="text-sm font-normal">This URL is for a playlist</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="moduleVideoLang">Language*</Label>
                      <Input id="moduleVideoLang" name="language" placeholder="e.g., English" value={moduleVideoForm.language} onChange={handleModuleVideoFormChange} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="moduleVideoCreator">Creator (Optional)</Label>
                      <Input id="moduleVideoCreator" name="creator" placeholder="e.g., ChannelName" value={moduleVideoForm.creator} onChange={handleModuleVideoFormChange} />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Add to Module Videos</Button>
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
