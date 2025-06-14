
"use client";

import React, { useState, useEffect, type FormEvent, use } from 'react'; // Import use
import { getCourseById, getModuleById } from '@/lib/placeholder-data';
import type { Course, Module as ModuleType, VideoLink } from '@/lib/types';
import { MediaPlayer } from '@/components/media-player';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lightbulb, ListChecks, Loader2, AlertTriangle, BookOpen, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateQuiz, type GenerateQuizInput } from '@/ai/flows/ai-quiz-generator';
import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';

export default function ModulePage({ params: paramsPromise }: { params: Promise<{ courseId: string; moduleId: string }> }) {
  const params = use(paramsPromise); // Unwrap the params promise

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

  useEffect(() => {
    // params.courseId and params.moduleId are now from the resolved object
    setCourse(getCourseById(params.courseId));
    setModule(getModuleById(params.courseId, params.moduleId));
    setAiFetchedVideos([]); 
    setErrorAIVideos(null);
    setQuizQuestionsResult(null); 
    setErrorQuiz(null);
  }, [params.courseId, params.moduleId]); // Dependencies are properties of the resolved object

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
      const input: GenerateQuizInput = {
        courseModuleContent: contentForQuiz,
        numberOfQuestions: 5,
      };
      const result = await generateQuiz(input);
      setQuizQuestionsResult(result.quizQuestions);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setErrorQuiz(err instanceof Error ? err.message : "An unknown error occurred.");
       toast({
        title: "AI Quiz Generation Failed",
        description: "Could not generate the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSearchVideosWithAI = async () => {
    if (!module) return;
    setLoadingAIVideos(true);
    setErrorAIVideos(null);
    setAiFetchedVideos([]); 
    try {
      const input: FindYoutubeVideosInput = {
        moduleTitle: module.title,
        moduleDescription: module.description || module.subtopics?.join(', '),
        preferredLanguage: user?.learningPreferences?.language,
        existingVideos: module.videoLinks?.map(v => ({ creator: v.creator, topic: module.title })) || [],
      };
      const result = await findYoutubeVideosForModule(input);
      setAiFetchedVideos(result.videos);
      if (result.videos.length === 0) {
        toast({
            title: "AI Video Search",
            description: "No additional videos found by AI for this module topic.",
        });
      } else {
         toast({
            title: "AI Video Search Successful",
            description: `Found ${result.videos.length} new video(s). Check the player dropdown.`,
        });
      }
    } catch (err) {
      console.error("Error searching videos with AI:", err);
      setErrorAIVideos(err instanceof Error ? err.message : "An unknown AI error occurred.");
      toast({
        title: "AI Video Search Failed",
        description: "Could not search for videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAIVideos(false);
    }
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
