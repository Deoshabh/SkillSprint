"use client";

import { useState, type ChangeEvent, type FormEvent, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, Loader2, AlertTriangle, Youtube, ListPlus, Trash2, Edit, Send, CheckSquare, XCircle, Brain, VideoIcon, FileTextIcon, HelpCircleIcon, ChevronUp, ChevronDown, CalendarClock, Sparkles, FileUp, Link as LinkIcon, Zap, BookOpen, Target, Users, Clock, Globe } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { v4 as uuidv4 } from 'uuid';

// AI Flow Imports
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';
import { suggestModuleSubtopics, type SuggestModuleSubtopicsInput } from '@/ai/flows/suggest-module-subtopics-flow';
import { suggestModulePracticeTask, type SuggestModulePracticeTaskInput } from '@/ai/flows/suggest-module-practice-task-flow';
import { generateCourseSchedule, type GenerateCourseScheduleInput } from '@/ai/flows/generate-course-schedule-flow';
import { extractAndAnalyzeContent, type ExtractContentInput } from '@/ai/flows/extract-and-analyze-content-flow';
import { generateCourseStructure, type GenerateCourseStructureInput } from '@/ai/flows/generate-course-structure-flow';
import { generateQuiz, type GenerateQuizInput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';

import type { VideoLink, Course as CourseType, Module as ModuleType, ModuleContentType, Quiz, ModuleWithQuiz } from '@/lib/types';
import { saveOrUpdateCourse, submitCourseForReview } from '@/lib/placeholder-data';

// Enhanced types for the new designer
interface SourceContent {
  id: string;
  type: 'youtube_video' | 'youtube_playlist' | 'document' | 'website' | 'file';
  url: string;
  title: string;
  description?: string;
  extractedContent?: string;
  metadata?: {
    duration?: string;
    author?: string;
    language?: string;
    fileType?: string;
    pageCount?: number;
  };
}

interface CourseGenerationSettings {
  targetAudience: 'beginners' | 'intermediate' | 'advanced' | 'mixed';
  courseDuration: '2-weeks' | '4-weeks' | '6-weeks' | '8-weeks' | '12-weeks' | 'custom';
  learningStyle: 'video-focused' | 'text-focused' | 'mixed' | 'interactive';
  difficultyProgression: 'linear' | 'spiral' | 'modular';
  includeAssessments: boolean;
  includePracticalProjects: boolean;
  language: string;
  customDuration?: string;
  // Quiz Generation Settings
  quizGeneration: 'ai' | 'manual' | 'both';
  quizDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  questionsPerQuiz: number;
  quizTypes: ('multiple-choice' | 'true-false' | 'short-answer' | 'coding')[];
  passingScore: number;
  enableModuleLocking: boolean;
  lockingCriteria: 'quiz-pass' | 'quiz-score' | 'completion';
  minimumScoreToUnlock: number;
}

interface GenerationProgress {
  stage: 'analyzing' | 'structuring' | 'content' | 'videos' | 'finalizing' | 'complete';
  progress: number;
  currentTask: string;
}

export default function AICourseDesignerV2Page() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main course data
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseObjectives, setCourseObjectives] = useState('');
  
  // Source content management
  const [sourceContents, setSourceContents] = useState<SourceContent[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [isExtractingContent, setIsExtractingContent] = useState(false);
    // Generation settings
  const [generationSettings, setGenerationSettings] = useState<CourseGenerationSettings>({
    targetAudience: 'beginners',
    courseDuration: '4-weeks',
    learningStyle: 'mixed',
    difficultyProgression: 'linear',
    includeAssessments: true,
    includePracticalProjects: true,
    language: 'English',
    // Quiz Generation Settings
    quizGeneration: 'ai',
    quizDifficulty: 'medium',
    questionsPerQuiz: 5,
    quizTypes: ['multiple-choice', 'true-false'],
    passingScore: 70,
    enableModuleLocking: true,
    lockingCriteria: 'quiz-pass',
    minimumScoreToUnlock: 70
  });
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    stage: 'analyzing',
    progress: 0,
    currentTask: ''
  });
    // Generated course data
  const [generatedModules, setGeneratedModules] = useState<ModuleWithQuiz[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState('');
  const [generationComplete, setGenerationComplete] = useState(false);

  // Active tab management
  const [activeTab, setActiveTab] = useState('sources');
  // Handle content extraction from various sources
  const extractContentFromUrl = async (url: string): Promise<SourceContent | null> => {
    try {
      setIsExtractingContent(true);
      
      const sourceContent: SourceContent = {
        id: uuidv4(),
        type: getContentType(url),
        url,
        title: 'Extracting...',
        description: '',
        extractedContent: ''
      };      // Use AI to extract and analyze content
      try {        const extractionResult = await extractAndAnalyzeContent({
          sourceType: sourceContent.type,
          contentUrl: url,
          rawContent: url, // Temporary - in a real implementation, you'd fetch the actual content
          contentTitle: url
        });

        const mainTopicsText = extractionResult.structuredContent.mainTopics.join(', ');
        const keyPointsText = extractionResult.structuredContent.keyPoints.join('. ');

        return {
          ...sourceContent,
          title: sourceContent.type === 'youtube_video' ? 'YouTube Video Content' : 
                 sourceContent.type === 'youtube_playlist' ? 'YouTube Playlist Content' :
                 sourceContent.type === 'document' ? 'Document Content' :
                 'Web Content',
          description: `Topics: ${mainTopicsText}`,
          extractedContent: keyPointsText,
          metadata: {
            duration: extractionResult.structuredContent.estimatedDuration,
            language: 'English'
          }
        };
      } catch (aiError) {
        // Fallback to manual extraction if AI fails
        console.warn('AI extraction failed, using fallback:', aiError);
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          return await extractYouTubeContent(url, sourceContent);
        } else if (url.includes('.pdf')) {
          return await extractPDFContent(url, sourceContent);
        } else {
          return await extractWebContent(url, sourceContent);
        }
      }
    } catch (error) {
      console.error('Content extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: "Could not extract content from the provided URL.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsExtractingContent(false);
    }
  };

  const getContentType = (url: string): SourceContent['type'] => {
    if (url.includes('youtube.com/playlist') || url.includes('youtube.com/watch?list=')) {
      return 'youtube_playlist';
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube_video';
    } else if (url.includes('.pdf')) {
      return 'document';
    } else {
      return 'website';
    }
  };

  const extractYouTubeContent = async (url: string, sourceContent: SourceContent): Promise<SourceContent> => {
    // Simulate YouTube content extraction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isPlaylist = url.includes('playlist') || url.includes('list=');
    const videoId = isPlaylist ? null : extractVideoId(url);
    
    return {
      ...sourceContent,
      type: isPlaylist ? 'youtube_playlist' : 'youtube_video',
      title: isPlaylist ? 'YouTube Playlist - Programming Basics' : 'YouTube Video - Introduction to Programming',
      description: isPlaylist ? 'A comprehensive playlist covering programming fundamentals' : 'An introductory video about programming concepts',
      extractedContent: `Content extracted from ${isPlaylist ? 'playlist' : 'video'}: Programming concepts, variables, functions, loops, and best practices.`,
      metadata: {
        duration: isPlaylist ? '5 hours total' : '15 minutes',
        author: 'Tech Education Channel',
        language: 'English'
      }
    };
  };

  const extractPDFContent = async (url: string, sourceContent: SourceContent): Promise<SourceContent> => {
    // Simulate PDF content extraction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      ...sourceContent,
      title: 'Programming Guide.pdf',
      description: 'Comprehensive programming guide document',
      extractedContent: 'Document content: Introduction to programming, data structures, algorithms, object-oriented programming, and software engineering principles.',
      metadata: {
        fileType: 'PDF',
        pageCount: 150,
        language: 'English'
      }
    };
  };

  const extractWebContent = async (url: string, sourceContent: SourceContent): Promise<SourceContent> => {
    // Simulate web content extraction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      ...sourceContent,
      title: 'Web Development Tutorial',
      description: 'Comprehensive web development guide',
      extractedContent: 'Web content: HTML, CSS, JavaScript fundamentals, responsive design, and modern web development frameworks.',
      metadata: {
        language: 'English'
      }
    };
  };

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddContent = async () => {
    if (!contentUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL.",
        variant: "destructive"
      });
      return;
    }

    const extractedContent = await extractContentFromUrl(contentUrl);
    if (extractedContent) {
      setSourceContents(prev => [...prev, extractedContent]);
      setContentUrl('');
      toast({
        title: "Content Added",
        description: `Successfully extracted content from ${extractedContent.type.replace('_', ' ')}.`,
      });
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      setIsExtractingContent(true);
      try {
        // Simulate file processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const sourceContent: SourceContent = {
          id: uuidv4(),
          type: 'file',
          url: URL.createObjectURL(file),
          title: file.name,
          description: `Uploaded file: ${file.name}`,
          extractedContent: `File content extracted from ${file.name}. Contains educational material about programming concepts and methodologies.`,
          metadata: {
            fileType: file.type,
            language: 'English'
          }
        };

        setSourceContents(prev => [...prev, sourceContent]);
        toast({
          title: "File Processed",
          description: `Successfully processed ${file.name}.`,
        });
      } catch (error) {
        toast({
          title: "File Processing Failed",
          description: `Could not process ${file.name}.`,
          variant: "destructive"
        });
      } finally {
        setIsExtractingContent(false);
      }
    }
  };

  const removeSourceContent = (id: string) => {
    setSourceContents(prev => prev.filter(content => content.id !== id));
    toast({
      title: "Content Removed",
      description: "Source content has been removed.",
    });
  };

  const generateCourseWithAI = async () => {
    if (sourceContents.length === 0) {
      toast({
        title: "No Content",
        description: "Please add at least one source content before generating the course.",
        variant: "destructive"
      });
      return;
    }

    if (!courseTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a course title.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ stage: 'analyzing', progress: 10, currentTask: 'Analyzing source content...' });

    try {
      // Stage 1: Analyze content
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationProgress({ stage: 'structuring', progress: 30, currentTask: 'Structuring course modules...' });

      // Stage 2: Generate course structure
      const combinedContent = sourceContents.map(content => 
        `${content.title}: ${content.extractedContent}`
      ).join('\n\n');      const syllabusInput: AutoGenerateCourseSyllabusInput = {
        courseTopic: courseTitle,
        targetAudience: `${generationSettings.targetAudience} learners`,
        learningObjectives: courseObjectives || `Master ${courseTitle} through comprehensive learning`,
        desiredNumberOfModules: getDurationModules(generationSettings.courseDuration)
      };      const syllabusResult = await autoGenerateCourseSyllabus(syllabusInput);
      const parsedModules = parseSyllabusToModules(syllabusResult.courseSyllabus);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress({ stage: 'content', progress: 60, currentTask: 'Enhancing modules with AI...' });      // Stage 3: Enhance modules with subtopics, practice tasks, and quizzes
      const enhancedModules: ModuleWithQuiz[] = [];
      
      for (const [index, module] of parsedModules.entries()) {
        const moduleId = uuidv4();
        
        // Generate subtopics
        const subtopicsResult = await suggestModuleSubtopics({
          moduleTitle: module.title,
          moduleDescription: module.description,
          courseTopic: courseTitle,
          numberOfSuggestions: 5
        });

        // Generate practice task
        const practiceTaskResult = await suggestModulePracticeTask({
          moduleTitle: module.title,
          moduleDescription: module.description,
          subtopics: subtopicsResult.subtopics
        });

        // Generate quiz if AI generation is enabled
        let quiz: Quiz | undefined;
        if (generationSettings.quizGeneration === 'ai' || generationSettings.quizGeneration === 'both') {
          try {
            const quizResult = await generateQuiz({
              moduleTitle: module.title,
              moduleContent: `${module.description}\n\nSubtopics: ${subtopicsResult.subtopics.join(', ')}\n\nPractice Task: ${practiceTaskResult.practiceTask}`,
              difficultyLevel: generationSettings.quizDifficulty === 'adaptive' ? 'medium' : generationSettings.quizDifficulty as 'easy' | 'medium' | 'hard',
              questionCount: generationSettings.questionsPerQuiz,
              questionTypes: generationSettings.quizTypes,
              passingScore: generationSettings.passingScore
            });

            quiz = {
              id: uuidv4(),
              moduleId: moduleId,
              title: quizResult.quizTitle,
              questions: quizResult.questions,
              totalPoints: quizResult.totalPoints,
              passingScore: quizResult.passingScore,
              createdBy: 'ai',
              estimatedTime: quizResult.estimatedTime,
              maxAttempts: 3,
              isRandomized: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          } catch (error) {
            console.warn(`Could not generate quiz for module: ${module.title}`, error);
          }
        }

        enhancedModules.push({
          id: moduleId,
          title: module.title,
          description: module.description,
          contentType: 'video' as ModuleContentType,
          estimatedTime: module.estimatedTime,
          subtopics: subtopicsResult.subtopics,
          practiceTask: practiceTaskResult.practiceTask,
          videoLinks: [],
          quiz,
          isLocked: generationSettings.enableModuleLocking && index > 0,
          unlockRequirements: generationSettings.enableModuleLocking && index > 0 ? {
            previousModuleId: index > 0 ? enhancedModules[index - 1]?.id : undefined,
            minimumQuizScore: generationSettings.minimumScoreToUnlock
          } : undefined
        });

        setGenerationProgress({ 
          stage: 'content', 
          progress: 60 + (index + 1) / parsedModules.length * 20, 
          currentTask: `Enhanced module ${index + 1} of ${parsedModules.length}...` 
        });
      }

      setGenerationProgress({ stage: 'videos', progress: 85, currentTask: 'Finding relevant videos...' });

      // Stage 4: Find videos for modules (for a few modules to demonstrate)
      for (const [index, module] of enhancedModules.slice(0, 3).entries()) {
        try {
          const videosResult = await findYoutubeVideosForModule({
            moduleTitle: module.title,
            moduleDescription: module.description,
            preferredLanguage: generationSettings.language
          });

          enhancedModules[index].videoLinks = videosResult.videos;
        } catch (error) {
          console.warn(`Could not find videos for module: ${module.title}`);
        }
      }

      setGenerationProgress({ stage: 'finalizing', progress: 95, currentTask: 'Generating course schedule...' });      // Stage 5: Generate schedule
      const scheduleResult = await generateCourseSchedule({
        courseTitle,
        moduleTitles: enhancedModules.map(m => m.title),
        estimatedCourseDurationWeeks: getDurationModules(generationSettings.courseDuration) / 2,
        studyHoursPerWeek: 10
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress({ stage: 'complete', progress: 100, currentTask: 'Course generation complete!' });

      // Set results
      setGeneratedModules(enhancedModules);
      setGeneratedSchedule(scheduleResult.scheduleText);
      setGenerationComplete(true);
      setActiveTab('preview');

      toast({
        title: "Course Generated Successfully!",
        description: `Generated ${enhancedModules.length} modules with AI-enhanced content.`,
      });

    } catch (error) {
      console.error('Course generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const parseSyllabusToModules = (syllabusText: string): { title: string; description: string; estimatedTime: string }[] => {
    const modules: { title: string; description: string; estimatedTime: string }[] = [];
    const moduleRegex = /^(?:#+\s*)?Module\s*\d*[:\s-]*\s*(.*?)(?:\n|$)([\s\S]*?)(?=(?:#+\s*)?Module\s*\d*[:\s-]*|\Z)/gim;
    
    let match;
    while ((match = moduleRegex.exec(syllabusText)) !== null) {
      const title = match[1].trim().replace(/\*+/g, '');
      let contentBlock = match[2] || '';
      let description = '';
      
      const descriptionMatch = contentBlock.match(/^([\s\S]*?)(?:(?:#+\s*)?Topics:|(?:#+\s*)?Learning Activities:|$)/i);
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim().replace(/^\*+\s*/, '').replace(/\*+$/, '');
      }
      
      if (!description && contentBlock) {
        const lines = contentBlock.split('\n').filter(line => line.trim());
        description = lines.slice(0, 2).join(' ').trim().replace(/^\*+\s*/, '').replace(/\*+$/, '');
      }
      
      modules.push({
        title: title || `Module ${modules.length + 1}`,
        description: description.substring(0, 250) || `Content for ${title}`,
        estimatedTime: '1 week'
      });
    }
    
    if (modules.length === 0 && syllabusText.includes('\n')) {
      const lines = syllabusText.split('\n').filter(line => line.trim());
      const estimatedModules = Math.max(4, Math.min(12, Math.floor(lines.length / 3)));
      
      for (let i = 0; i < estimatedModules; i++) {
        modules.push({
          title: `Module ${i + 1}`,
          description: lines.slice(i * 3, (i + 1) * 3).join(' ').trim().substring(0, 250) || `Generated module content`,
          estimatedTime: '1 week'
        });
      }
    }
    
    return modules;
  };

  const getDurationModules = (duration: string): number => {
    switch (duration) {
      case '2-weeks': return 4;
      case '4-weeks': return 6;
      case '6-weeks': return 8;
      case '8-weeks': return 10;
      case '12-weeks': return 12;
      default: return 6;
    }
  };

  const saveCourse = async () => {
    if (!generationComplete || generatedModules.length === 0) {
      toast({
        title: "Nothing to Save",
        description: "Please generate a course first.",
        variant: "destructive"
      });
      return;
    }    try {      const courseDataToSave: Partial<CourseType> & { authorId: string } = {
        id: uuidv4(),
        title: courseTitle,
        description: courseDescription,
        instructor: 'AI Generated',
        category: courseCategory || 'Programming',
        icon: '🤖',
        modules: generatedModules,
        visibility: 'private' as const,
        status: 'draft' as const,
        suggestedSchedule: generatedSchedule,
        lastModified: new Date().toISOString(),
        authorId: 'ai-generated'
      };      const savedCourse = saveOrUpdateCourse(courseDataToSave);
      
      if (savedCourse) {
        toast({
          title: "Course Saved",
          description: "Your AI-generated course has been saved successfully.",
        });
      } else {
        throw new Error("Failed to save course");
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save the course. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Course Designer v2
            </h1>
            <p className="text-muted-foreground">
              Create comprehensive courses from any source content with advanced AI integration
            </p>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Source Content
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Generation Settings
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Generation
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview & Save
          </TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Add Source Content
              </CardTitle>
              <CardDescription>
                Add YouTube videos, playlists, documents, or websites as source material for your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter YouTube URL, document link, or website URL..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    disabled={isExtractingContent}
                  />
                </div>
                <Button 
                  onClick={handleAddContent} 
                  disabled={isExtractingContent || !contentUrl.trim()}
                >
                  {isExtractingContent ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  )}
                  Add URL
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              <div className="text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtractingContent}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported: PDF, DOC, DOCX, TXT, MD
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Source Content List */}
          {sourceContents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Source Contents ({sourceContents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourceContents.map((content) => (
                    <div key={content.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-1 bg-muted rounded">
                        {content.type === 'youtube_video' && <Youtube className="h-4 w-4" />}
                        {content.type === 'youtube_playlist' && <ListPlus className="h-4 w-4" />}
                        {content.type === 'document' && <FileTextIcon className="h-4 w-4" />}
                        {content.type === 'website' && <Globe className="h-4 w-4" />}
                        {content.type === 'file' && <FileTextIcon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{content.title}</h4>
                        {content.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {content.description}
                          </p>
                        )}
                        {content.metadata && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {content.metadata.duration && (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                {content.metadata.duration}
                              </Badge>
                            )}
                            {content.metadata.author && (
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {content.metadata.author}
                              </Badge>
                            )}
                            {content.metadata.pageCount && (
                              <Badge variant="secondary">
                                {content.metadata.pageCount} pages
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSourceContent(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g., Complete JavaScript Fundamentals"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseDescription">Course Description</Label>
                  <Textarea
                    id="courseDescription"
                    placeholder="Brief description of what students will learn..."
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCategory">Category</Label>
                  <Select value={courseCategory} onValueChange={setCourseCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Web Development">Web Development</SelectItem>
                      <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseObjectives">Learning Objectives</Label>
                  <Textarea
                    id="courseObjectives"
                    placeholder="What will students achieve after completing this course?"
                    value={courseObjectives}
                    onChange={(e) => setCourseObjectives(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <RadioGroup
                    value={generationSettings.targetAudience}
                    onValueChange={(value: 'beginners' | 'intermediate' | 'advanced' | 'mixed') =>
                      setGenerationSettings(prev => ({ ...prev, targetAudience: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="beginners" id="beginners" />
                      <Label htmlFor="beginners">Beginners</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intermediate" id="intermediate" />
                      <Label htmlFor="intermediate">Intermediate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced">Advanced</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed">Mixed Levels</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Course Duration</Label>
                  <Select
                    value={generationSettings.courseDuration}
                    onValueChange={(value: CourseGenerationSettings['courseDuration']) =>
                      setGenerationSettings(prev => ({ ...prev, courseDuration: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      <SelectItem value="4-weeks">4 Weeks</SelectItem>
                      <SelectItem value="6-weeks">6 Weeks</SelectItem>
                      <SelectItem value="8-weeks">8 Weeks</SelectItem>
                      <SelectItem value="12-weeks">12 Weeks</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {generationSettings.courseDuration === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customDuration">Custom Duration</Label>
                    <Input
                      id="customDuration"
                      placeholder="e.g., 6 weeks"
                      value={generationSettings.customDuration || ''}
                      onChange={(e) =>
                        setGenerationSettings(prev => ({ ...prev, customDuration: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Learning Style</Label>
                  <Select
                    value={generationSettings.learningStyle}
                    onValueChange={(value: CourseGenerationSettings['learningStyle']) =>
                      setGenerationSettings(prev => ({ ...prev, learningStyle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video-focused">Video Focused</SelectItem>
                      <SelectItem value="text-focused">Text Focused</SelectItem>
                      <SelectItem value="mixed">Mixed Content</SelectItem>
                      <SelectItem value="interactive">Interactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAssessments"
                      checked={generationSettings.includeAssessments}
                      onCheckedChange={(checked) =>
                        setGenerationSettings(prev => ({ ...prev, includeAssessments: !!checked }))
                      }
                    />
                    <Label htmlFor="includeAssessments">Include Assessments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePracticalProjects"
                      checked={generationSettings.includePracticalProjects}
                      onCheckedChange={(checked) =>
                        setGenerationSettings(prev => ({ ...prev, includePracticalProjects: !!checked }))
                      }
                    />
                    <Label htmlFor="includePracticalProjects">Include Practical Projects</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Quiz Generation & Module Locking
              </CardTitle>
              <CardDescription>
                Configure how quizzes are generated and module progression rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quiz Generation Method</Label>
                    <RadioGroup
                      value={generationSettings.quizGeneration}
                      onValueChange={(value: 'ai' | 'manual' | 'both') =>
                        setGenerationSettings(prev => ({ ...prev, quizGeneration: value }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ai" id="quiz-ai" />
                        <Label htmlFor="quiz-ai">AI Generated</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="quiz-manual" />
                        <Label htmlFor="quiz-manual">Manual Creation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="quiz-both" />
                        <Label htmlFor="quiz-both">Both Options</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {(generationSettings.quizGeneration === 'ai' || generationSettings.quizGeneration === 'both') && (
                    <>
                      <div className="space-y-2">
                        <Label>Quiz Difficulty</Label>
                        <Select
                          value={generationSettings.quizDifficulty}
                          onValueChange={(value: 'easy' | 'medium' | 'hard' | 'adaptive') =>
                            setGenerationSettings(prev => ({ ...prev, quizDifficulty: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            <SelectItem value="adaptive">Adaptive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="questionsPerQuiz">Questions per Quiz</Label>
                        <Input
                          id="questionsPerQuiz"
                          type="number"
                          min="3"
                          max="20"
                          value={generationSettings.questionsPerQuiz}
                          onChange={(e) =>
                            setGenerationSettings(prev => ({ ...prev, questionsPerQuiz: parseInt(e.target.value) || 5 }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Question Types</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {['multiple-choice', 'true-false', 'short-answer', 'coding'].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`quiz-type-${type}`}
                                checked={generationSettings.quizTypes.includes(type as any)}
                                onCheckedChange={(checked) => {
                                  setGenerationSettings(prev => ({
                                    ...prev,
                                    quizTypes: checked
                                      ? [...prev.quizTypes, type as any]
                                      : prev.quizTypes.filter(t => t !== type)
                                  }));
                                }}
                              />
                              <Label htmlFor={`quiz-type-${type}`} className="text-sm">
                                {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="50"
                      max="100"
                      value={generationSettings.passingScore}
                      onChange={(e) =>
                        setGenerationSettings(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableModuleLocking"
                        checked={generationSettings.enableModuleLocking}
                        onCheckedChange={(checked) =>
                          setGenerationSettings(prev => ({ ...prev, enableModuleLocking: !!checked }))
                        }
                      />
                      <Label htmlFor="enableModuleLocking">Enable Module Locking</Label>
                    </div>

                    {generationSettings.enableModuleLocking && (
                      <>
                        <div className="space-y-2">
                          <Label>Locking Criteria</Label>
                          <RadioGroup
                            value={generationSettings.lockingCriteria}
                            onValueChange={(value: 'quiz-pass' | 'quiz-score' | 'completion') =>
                              setGenerationSettings(prev => ({ ...prev, lockingCriteria: value }))
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="quiz-pass" id="criteria-pass" />
                              <Label htmlFor="criteria-pass">Pass Quiz</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="quiz-score" id="criteria-score" />
                              <Label htmlFor="criteria-score">Minimum Score</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="completion" id="criteria-completion" />
                              <Label htmlFor="criteria-completion">Module Completion</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {generationSettings.lockingCriteria === 'quiz-score' && (
                          <div className="space-y-2">
                            <Label htmlFor="minimumScoreToUnlock">Minimum Score to Unlock (%)</Label>
                            <Input
                              id="minimumScoreToUnlock"
                              type="number"
                              min="50"
                              max="100"
                              value={generationSettings.minimumScoreToUnlock}
                              onChange={(e) =>
                                setGenerationSettings(prev => ({ ...prev, minimumScoreToUnlock: parseInt(e.target.value) || 70 }))
                              }
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Alert>
                <HelpCircleIcon className="h-4 w-4" />
                <AlertTitle>Module Locking Info</AlertTitle>
                <AlertDescription>
                  When enabled, students must complete the requirements of each module before accessing the next one. 
                  AI-generated quizzes will be automatically created for each module with the specified settings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Course Generation
              </CardTitle>
              <CardDescription>
                Generate a comprehensive course structure from your source content using advanced AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isGenerating && !generationComplete && (
                <div className="text-center space-y-4">
                  <div className="p-8 border-2 border-dashed border-muted rounded-lg">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                    <p className="text-muted-foreground mb-4">
                      AI will analyze your {sourceContents.length} source content(s) and create a structured course
                    </p>
                    <Button 
                      onClick={generateCourseWithAI}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Course with AI
                    </Button>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium">Generating Your Course...</h3>
                    <p className="text-muted-foreground">{generationProgress.currentTask}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={generationProgress.progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{generationProgress.stage.charAt(0).toUpperCase() + generationProgress.stage.slice(1)}</span>
                      <span>{generationProgress.progress}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {(['analyzing', 'structuring', 'content', 'videos', 'finalizing'] as const).map((stage, index) => (
                      <div key={stage} className="text-center">                        <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
                          generationProgress.stage === stage ? 'bg-blue-500 text-white' :
                          index < (['analyzing', 'structuring', 'content', 'videos', 'finalizing'] as const).indexOf(generationProgress.stage === 'complete' ? 'finalizing' : generationProgress.stage) ? 'bg-green-500 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{stage}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generationComplete && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Generation Complete!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Successfully generated {generatedModules.length} modules. Switch to the Preview tab to review and save your course.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {generationComplete ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{courseTitle}</CardTitle>
                    <CardDescription>
                      {generatedModules.length} modules • {courseCategory}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('generate')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button onClick={saveCourse}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Course
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{courseDescription}</p>
                  {courseObjectives && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Learning Objectives:</h4>
                      <p className="text-sm text-muted-foreground">{courseObjectives}</p>
                    </div>
                  )}
                </CardContent>
              </Card>              <Card>
                <CardHeader>
                  <CardTitle>Course Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedModules.map((module, index) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              Module {index + 1}: {module.title}
                            </h3>
                            {module.isLocked && (
                              <Badge variant="secondary" className="text-xs">
                                🔒 Locked
                              </Badge>
                            )}
                            {module.quiz && (
                              <Badge variant="outline" className="text-xs">
                                📝 Quiz Included
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary">{module.estimatedTime}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {module.description}
                        </p>
                        
                        {module.subtopics && module.subtopics.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-1">Subtopics:</h4>
                            <div className="flex flex-wrap gap-1">
                              {module.subtopics.map((subtopic, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {subtopic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {module.quiz && (
                          <div className="mb-3 p-3 bg-muted rounded-lg">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Brain className="h-4 w-4" />
                              Quiz Details:
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>Questions: {module.quiz.questions.length}</div>
                              <div>Passing Score: {module.quiz.passingScore}%</div>
                              <div>Total Points: {module.quiz.totalPoints}</div>
                              <div>Est. Time: {module.quiz.estimatedTime}</div>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">
                                Question Types: {module.quiz.questions.map((q: QuizQuestion) => q.type).filter((type: string, idx: number, arr: string[]) => arr.indexOf(type) === idx).join(', ')}
                              </span>
                            </div>
                            {module.unlockRequirements && (
                              <div className="mt-2 text-xs text-orange-600">
                                🔒 Unlocks after: Score ≥{module.unlockRequirements.minimumQuizScore}% on previous module
                              </div>
                            )}
                          </div>
                        )}

                        {module.practiceTask && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-1">Practice Task:</h4>
                            <p className="text-xs text-muted-foreground">
                              {module.practiceTask}
                            </p>
                          </div>
                        )}

                        {module.videoLinks && module.videoLinks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">
                              Videos ({module.videoLinks.length}):
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {module.videoLinks.map((video, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Youtube className="h-3 w-3 mr-1" />
                                  {video.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {generatedSchedule && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm">
                      {generatedSchedule}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Course Generated Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add source content and generate a course to see the preview here
                </p>
                <Button variant="outline" onClick={() => setActiveTab('sources')}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
