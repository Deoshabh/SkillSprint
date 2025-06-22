"use client";

import { useState, type ChangeEvent, type FormEvent, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, Loader2, AlertTriangle, Youtube, ListPlus, Trash2, Edit, Send, CheckSquare, XCircle, Brain, VideoIcon, FileTextIcon, HelpCircleIcon, ChevronUp, ChevronDown, CalendarClock, Sparkles, FileUp, Link as LinkIcon, Zap, BookOpen, Target, Users, Clock, Globe, FileText, ExternalLink, Play, FilePlus, BookOpenCheck, Lightbulb } from 'lucide-react';
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
import { cn } from '@/lib/utils';

// AI Flow Imports
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';
import { suggestModuleSubtopics, type SuggestModuleSubtopicsInput } from '@/ai/flows/suggest-module-subtopics-flow';
import { suggestModulePracticeTask, type SuggestModulePracticeTaskInput } from '@/ai/flows/suggest-module-practice-task-flow';
import { generateCourseSchedule, type GenerateCourseScheduleInput } from '@/ai/flows/generate-course-schedule-flow';
import { extractAndAnalyzeContent, type ExtractContentInput } from '@/ai/flows/extract-and-analyze-content-flow';
import { generateCourseStructure, type GenerateCourseStructureInput } from '@/ai/flows/generate-course-structure-flow';

import type { VideoLink, Course as CourseType, Module as ModuleType, ModuleContentType } from '@/lib/types';
import { saveOrUpdateCourse } from '@/lib/placeholder-data';
import { useAuth } from '@/hooks/use-auth';

// Enhanced types for the optimized designer
interface SourceContent {
  id: string;
  type: 'youtube_video' | 'youtube_playlist' | 'document' | 'website' | 'file' | 'text_input';
  url?: string;
  title: string;
  description?: string;
  extractedContent?: string;
  rawContent?: string;
  metadata?: {
    duration?: string;
    author?: string;
    language?: string;
    fileType?: string;
    pageCount?: number;
    videoCount?: number;
    tags?: string[];
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

interface CourseGenerationSettings {
  targetAudience: 'beginners' | 'intermediate' | 'advanced' | 'mixed';
  courseDuration: '2-weeks' | '4-weeks' | '6-weeks' | '8-weeks' | '12-weeks' | 'custom';
  learningStyle: 'video-focused' | 'text-focused' | 'mixed' | 'interactive' | 'project-based';
  difficultyProgression: 'linear' | 'spiral' | 'modular' | 'adaptive';
  includeAssessments: boolean;
  includePracticalProjects: boolean;
  includeQuizzes: boolean;
  language: string;
  customDuration?: string;
  moduleCount?: number;
  focusAreas?: string[];
}

interface GenerationStage {
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface GenerationProgress {
  currentStage: number;
  stages: GenerationStage[];
  overallProgress: number;
  isComplete: boolean;
  error?: string;
}

export default function AICourseDesignerV3Page() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textContentRef = useRef<HTMLTextAreaElement>(null);

  // Main course data
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('Programming');
  const [courseObjectives, setCourseObjectives] = useState('');
  
  // Source content management
  const [sourceContents, setSourceContents] = useState<SourceContent[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  
  // Generation settings
  const [generationSettings, setGenerationSettings] = useState<CourseGenerationSettings>({
    targetAudience: 'beginners',
    courseDuration: '4-weeks',
    learningStyle: 'mixed',
    difficultyProgression: 'linear',
    includeAssessments: true,
    includePracticalProjects: true,
    includeQuizzes: true,
    language: 'English',
    moduleCount: 6,
    focusAreas: []
  });
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    currentStage: 0,
    stages: [
      { name: 'Content Analysis', description: 'Analyzing source materials', progress: 0, status: 'pending' },
      { name: 'Course Structure', description: 'Creating course outline', progress: 0, status: 'pending' },
      { name: 'Module Creation', description: 'Generating detailed modules', progress: 0, status: 'pending' },
      { name: 'Content Enhancement', description: 'Finding supplementary content', progress: 0, status: 'pending' },
      { name: 'Schedule Generation', description: 'Creating learning schedule', progress: 0, status: 'pending' },
      { name: 'Finalization', description: 'Finalizing course structure', progress: 0, status: 'pending' }
    ],
    overallProgress: 0,
    isComplete: false
  });
  
  // Generated course data
  const [generatedModules, setGeneratedModules] = useState<ModuleType[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState('');
  const [generationComplete, setGenerationComplete] = useState(false);
  const [coursePreview, setCoursePreview] = useState<CourseType | null>(null);

  // Active tab management
  const [activeTab, setActiveTab] = useState('sources');

  // Helper function to get content type from URL
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
  // Enhanced content extraction with AI analysis
  const extractContentFromUrl = async (url: string): Promise<SourceContent | null> => {
    const sourceContent: SourceContent = {
      id: uuidv4(),
      type: getContentType(url),
      url,
      title: 'Processing...',
      description: '',
      extractedContent: '',
      processingStatus: 'processing'
    };

    setSourceContents(prev => [...prev, sourceContent]);

    try {
      // Step 1: Extract raw content based on URL type
      let rawContent = '';
      let basicMetadata: Partial<SourceContent> = {};

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const youtubeData = await extractYouTubeContent(url);
        rawContent = youtubeData.extractedContent || '';
        basicMetadata = youtubeData;
      } else if (url.includes('.pdf')) {
        const documentData = await extractDocumentContent(url);
        rawContent = documentData.extractedContent || '';
        basicMetadata = documentData;
      } else {
        const webData = await extractWebContent(url);
        rawContent = webData.extractedContent || '';
        basicMetadata = webData;
      }

      // Step 2: Use AI to analyze and structure the content
      const analysisInput: ExtractContentInput = {
        sourceType: sourceContent.type,
        contentUrl: url,
        rawContent,
        contentTitle: basicMetadata.title,
        extractionGoals: ['learning objectives', 'key topics', 'prerequisites', 'practical elements']
      };

      const analysisResult = await extractAndAnalyzeContent(analysisInput);
      
      // Step 3: Enhance the source content with AI analysis
      const enhancedContent: Partial<SourceContent> = {
        ...basicMetadata,
        extractedContent: rawContent,
        description: `Topics: ${analysisResult.structuredContent.mainTopics.slice(0, 3).join(', ')} | Level: ${analysisResult.structuredContent.difficultyLevel}`,
        metadata: {
          ...basicMetadata.metadata,
          tags: analysisResult.structuredContent.mainTopics,
        },
        // Store analysis results in a custom property for later use
        // @ts-ignore - Adding custom property for analysis results
        aiAnalysis: analysisResult
      };

      // Update the source content with extracted and analyzed data
      setSourceContents(prev => prev.map(content => 
        content.id === sourceContent.id 
          ? { ...content, ...enhancedContent, processingStatus: 'completed' }
          : content
      ));

      toast({
        title: "Content Processed",
        description: `Successfully analyzed: ${enhancedContent.title || url}`,
      });

      return { ...sourceContent, ...enhancedContent, processingStatus: 'completed' };
    } catch (error) {
      console.error('Content extraction error:', error);
      
      setSourceContents(prev => prev.map(content => 
        content.id === sourceContent.id 
          ? { 
              ...content, 
              processingStatus: 'error', 
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          : content
      ));

      toast({
        title: "Processing Failed",
        description: "Could not analyze content from the provided URL.",
        variant: "destructive"
      });
      return null;
    }
  };

  // YouTube content extraction
  const extractYouTubeContent = async (url: string): Promise<Partial<SourceContent>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isPlaylist = url.includes('playlist') || url.includes('list=');
    
    if (isPlaylist) {
      return {
        title: `YouTube Playlist: Programming Fundamentals`,
        description: 'A comprehensive playlist covering programming basics',
        extractedContent: 'Video topics include: Variables, Functions, Loops, Data Structures, Algorithms, Object-Oriented Programming, Web Development Basics',
        metadata: {
          duration: '12 hours',
          author: 'Programming Academy',
          language: 'English',
          videoCount: 24
        }
      };
    } else {
      return {
        title: `YouTube Video: Introduction to Programming`,
        description: 'Learn the fundamentals of programming',
        extractedContent: 'This video covers basic programming concepts including variables, data types, conditional statements, and loops. Perfect for beginners.',
        metadata: {
          duration: '45 minutes',
          author: 'Code Master',
          language: 'English'
        }
      };
    }
  };

  // Document content extraction
  const extractDocumentContent = async (url: string): Promise<Partial<SourceContent>> => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      title: 'Programming Concepts Documentation',
      description: 'Comprehensive guide to programming fundamentals',
      extractedContent: 'Chapter 1: Introduction to Programming\nChapter 2: Variables and Data Types\nChapter 3: Control Structures\nChapter 4: Functions and Methods\nChapter 5: Object-Oriented Programming\nChapter 6: Data Structures\nChapter 7: Algorithms and Problem Solving',
      metadata: {
        fileType: 'PDF',
        pageCount: 150,
        language: 'English'
      }
    };
  };

  // Web content extraction
  const extractWebContent = async (url: string): Promise<Partial<SourceContent>> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      title: 'Web Development Tutorial',
      description: 'Complete guide to modern web development',
      extractedContent: 'Topics covered: HTML5, CSS3, JavaScript ES6+, React.js, Node.js, Database integration, API development, Deployment strategies',
      metadata: {
        author: 'Web Dev Academy',
        language: 'English',
        tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js']
      }
    };
  };

  // Handle adding content from URL
  const handleAddContentFromUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!contentUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL.",
        variant: "destructive"
      });
      return;
    }

    await extractContentFromUrl(contentUrl);
    setContentUrl('');
  };

  // Handle adding text content
  const handleAddTextContent = () => {
    if (!textContent.trim() || !contentTitle.trim()) {
      toast({
        title: "Content Required",
        description: "Please provide both title and content.",
        variant: "destructive"
      });
      return;
    }

    const textSourceContent: SourceContent = {
      id: uuidv4(),
      type: 'text_input',
      title: contentTitle,
      description: 'User-provided text content',
      extractedContent: textContent,
      rawContent: textContent,
      processingStatus: 'completed'
    };

    setSourceContents(prev => [...prev, textSourceContent]);
    setTextContent('');
    setContentTitle('');
    
    toast({
      title: "Content Added",
      description: "Text content has been added successfully.",
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileContent: SourceContent = {
        id: uuidv4(),
        type: 'file',
        title: file.name,
        description: `Uploaded file: ${file.name}`,
        processingStatus: 'processing',
        metadata: {
          fileType: file.type,
          language: 'English'
        }
      };

      setSourceContents(prev => [...prev, fileContent]);

      // Simulate file processing
      setTimeout(() => {
        setSourceContents(prev => prev.map(content => 
          content.id === fileContent.id 
            ? { 
                ...content, 
                extractedContent: `Content extracted from ${file.name}. This includes structured information about the subject matter.`,
                processingStatus: 'completed'
              }
            : content
        ));
      }, 2000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove source content
  const removeSourceContent = (id: string) => {
    setSourceContents(prev => prev.filter(content => content.id !== id));
    toast({
      title: "Content Removed",
      description: "Source content has been removed.",
    });
  };

  // Update generation progress
  const updateProgress = (stageIndex: number, progress: number, status: GenerationStage['status'] = 'active') => {
    setGenerationProgress(prev => {
      const newStages = [...prev.stages];
      newStages[stageIndex] = { ...newStages[stageIndex], progress, status };
      
      // Mark previous stages as completed
      for (let i = 0; i < stageIndex; i++) {
        if (newStages[i].status !== 'completed') {
          newStages[i] = { ...newStages[i], status: 'completed', progress: 100 };
        }
      }

      const overallProgress = newStages.reduce((sum, stage) => sum + stage.progress, 0) / newStages.length;
      
      return {
        ...prev,
        currentStage: stageIndex,
        stages: newStages,
        overallProgress,
        isComplete: stageIndex === newStages.length - 1 && progress === 100
      };
    });
  };

  // Generate course with AI
  const handleGenerateCourse = async () => {
    if (sourceContents.length === 0) {
      toast({
        title: "No Source Content",
        description: "Please add at least one source of content before generating the course.",
        variant: "destructive"
      });
      return;
    }

    if (!courseTitle.trim()) {
      toast({
        title: "Course Title Required",
        description: "Please provide a course title.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationComplete(false);
    setActiveTab('generation');

    try {
      // Stage 1: Content Analysis
      updateProgress(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProgress(0, 50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress(0, 100, 'completed');

      // Stage 2: Course Structure Generation
      updateProgress(1, 0);
      const structureInput: AutoGenerateCourseSyllabusInput = {
        courseTopic: courseTitle,
        targetAudience: generationSettings.targetAudience,
        learningObjectives: courseObjectives || sourceContents.map(c => c.extractedContent).join('\n').substring(0, 500),
        desiredNumberOfModules: generationSettings.moduleCount || 6
      };
      
      updateProgress(1, 30);
      const syllabusResult = await autoGenerateCourseSyllabus(structureInput);
      updateProgress(1, 70);
      
      // Parse syllabus into modules
      const parsedModules = parseSyllabusToModules(syllabusResult.courseSyllabus);
      updateProgress(1, 100, 'completed');

      // Stage 3: Module Enhancement
      updateProgress(2, 0);
      const enhancedModules: ModuleType[] = [];
      
      for (let i = 0; i < parsedModules.length; i++) {
        const module = parsedModules[i];
        updateProgress(2, (i / parsedModules.length) * 80);
        
        // Enhance module with AI suggestions
        if (user?.role === 'admin') {
          try {
            // Get subtopics
            const subtopicsInput: SuggestModuleSubtopicsInput = {
              moduleTitle: module.title,
              moduleDescription: module.description,
              courseTopic: courseTitle,
              numberOfSuggestions: 5
            };
            const subtopicsResult = await suggestModuleSubtopics(subtopicsInput);
            
            // Get practice task
            const taskInput: SuggestModulePracticeTaskInput = {
              moduleTitle: module.title,
              moduleDescription: module.description,
              subtopics: subtopicsResult.subtopics,
              courseTopic: courseTitle
            };
            const taskResult = await suggestModulePracticeTask(taskInput);
            
            enhancedModules.push({
              ...module,
              subtopics: subtopicsResult.subtopics,
              practiceTask: taskResult.practiceTask
            });
          } catch (error) {
            console.error('Error enhancing module:', error);
            enhancedModules.push(module);
          }
        } else {
          enhancedModules.push(module);
        }
      }
      
      setGeneratedModules(enhancedModules);
      updateProgress(2, 100, 'completed');

      // Stage 4: Content Enhancement (Video suggestions)
      updateProgress(3, 0);
      
      if (generationSettings.learningStyle === 'video-focused' || generationSettings.learningStyle === 'mixed') {
        for (let i = 0; i < enhancedModules.length; i++) {
          const module = enhancedModules[i];
          updateProgress(3, (i / enhancedModules.length) * 100);
          
          try {
            const videoInput: FindYoutubeVideosInput = {
              moduleTitle: module.title,
              moduleDescription: module.description,
              preferredLanguage: generationSettings.language
            };
            const videoResult = await findYoutubeVideosForModule(videoInput);
            
            if (videoResult.videos.length > 0) {
              module.videoLinks = videoResult.videos;
              module.contentType = 'video';
              module.contentUrl = videoResult.videos[0].youtubeEmbedUrl;
            }
          } catch (error) {
            console.error('Error finding videos for module:', error);
          }
        }
      }
      
      updateProgress(3, 100, 'completed');

      // Stage 5: Schedule Generation
      updateProgress(4, 0);
      if (generationSettings.courseDuration !== 'custom') {
        const durationWeeks = parseInt(generationSettings.courseDuration.split('-')[0]);
        const scheduleInput: GenerateCourseScheduleInput = {
          courseTitle,
          moduleTitles: enhancedModules.map(m => m.title),
          estimatedCourseDurationWeeks: durationWeeks,
          studyHoursPerWeek: 10
        };
        
        updateProgress(4, 50);
        const scheduleResult = await generateCourseSchedule(scheduleInput);
        setGeneratedSchedule(scheduleResult.scheduleText);
      }
      updateProgress(4, 100, 'completed');

      // Stage 6: Finalization
      updateProgress(5, 0);
      
      const finalCourse: CourseType = {
        id: uuidv4(),
        title: courseTitle,
        description: courseDescription,
        instructor: user?.name || 'AI Generated',
        category: courseCategory,
        icon: 'Brain',
        modules: enhancedModules,
        authorId: user?.id || 'system',
        status: 'draft',
        visibility: 'private',
        imageUrl: 'https://placehold.co/600x400.png',
        dataAiHint: 'AI generated course with enhanced content',
        lastModified: new Date().toISOString(),
        suggestedSchedule: generatedSchedule,
        duration: generationSettings.courseDuration
      };
      
      setCoursePreview(finalCourse);
      updateProgress(5, 100, 'completed');
      
      setGenerationComplete(true);
      setActiveTab('preview');
      
      toast({
        title: "Course Generated Successfully!",
        description: `Created a ${enhancedModules.length}-module course with AI-enhanced content.`,
      });

    } catch (error) {
      console.error('Course generation error:', error);
      
      setGenerationProgress(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      
      toast({
        title: "Generation Failed",
        description: "An error occurred while generating the course.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse syllabus text into modules (simplified version)
  const parseSyllabusToModules = (syllabusText: string): ModuleType[] => {
    const modules: ModuleType[] = [];
    const lines = syllabusText.split('\n');
    let currentModule: Partial<ModuleType> | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for module headers (various patterns)
      if (trimmedLine.match(/^(Module|Week|Chapter|Unit)\s*\d+/i) || 
          trimmedLine.match(/^#+\s*(Module|Week|Chapter|Unit)/i)) {
        
        if (currentModule && currentModule.title) {
          modules.push({
            id: uuidv4(),
            title: currentModule.title,
            description: currentModule.description || '',
            contentType: 'text',
            estimatedTime: '2 hours',
            subtopics: [],
            practiceTask: '',
            videoLinks: [],
            contentUrl: '',
            contentData: currentModule.description || ''
          });
        }
        
        currentModule = {
          title: trimmedLine.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, ''),
          description: ''
        };
      } else if (currentModule && trimmedLine) {
        currentModule.description = (currentModule.description || '') + '\n' + trimmedLine;
      }
    }
    
    // Add the last module
    if (currentModule && currentModule.title) {
      modules.push({
        id: uuidv4(),
        title: currentModule.title,
        description: currentModule.description || '',
        contentType: 'text',
        estimatedTime: '2 hours',
        subtopics: [],
        practiceTask: '',
        videoLinks: [],
        contentUrl: '',
        contentData: currentModule.description || ''
      });
    }
    
    return modules;
  };
  // Save generated course
  const handleSaveCourse = async () => {
    if (!coursePreview || !coursePreview.authorId) return;
    
    try {
      const courseDataToSave: Partial<CourseType> & { authorId: string } = {
        ...coursePreview,
        authorId: coursePreview.authorId
      };
      const savedCourse = saveOrUpdateCourse(courseDataToSave);
      
      if (savedCourse) {
        toast({
          title: "Course Saved",
          description: `"${savedCourse.title}" has been saved successfully.`,
        });
        
        // Reset form
        setCourseTitle('');
        setCourseDescription('');
        setCourseObjectives('');
        setSourceContents([]);
        setGeneratedModules([]);
        setGeneratedSchedule('');
        setGenerationComplete(false);
        setCoursePreview(null);
        setActiveTab('sources');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save the course. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Render source content item
  const renderSourceContent = (content: SourceContent) => (
    <Card key={content.id} className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {content.type === 'youtube_video' && <Youtube className="h-4 w-4 text-red-500" />}
            {content.type === 'youtube_playlist' && <Youtube className="h-4 w-4 text-red-500" />}
            {content.type === 'document' && <FileText className="h-4 w-4 text-blue-500" />}
            {content.type === 'website' && <Globe className="h-4 w-4 text-green-500" />}
            {content.type === 'file' && <FilePlus className="h-4 w-4 text-purple-500" />}
            {content.type === 'text_input' && <BookOpen className="h-4 w-4 text-orange-500" />}
            
            <div className="flex-1">
              <h4 className="font-medium text-sm">{content.title}</h4>
              {content.url && (
                <p className="text-xs text-muted-foreground truncate">{content.url}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                content.processingStatus === 'completed' ? 'default' :
                content.processingStatus === 'processing' ? 'secondary' :
                content.processingStatus === 'error' ? 'destructive' : 'outline'
              }
              className="text-xs"
            >
              {content.processingStatus === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {content.processingStatus}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSourceContent(content.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {content.processingStatus === 'completed' && content.extractedContent && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {content.extractedContent}
          </p>
          
          {content.metadata && (
            <div className="flex flex-wrap gap-2 mt-2">
              {content.metadata.duration && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {content.metadata.duration}
                </Badge>
              )}
              {content.metadata.author && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {content.metadata.author}
                </Badge>
              )}
              {content.metadata.videoCount && (
                <Badge variant="outline" className="text-xs">
                  <Play className="h-3 w-3 mr-1" />
                  {content.metadata.videoCount} videos
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
      
      {content.processingStatus === 'error' && (
        <CardContent className="pt-0">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {content.errorMessage || 'Failed to process content'}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <Sparkles className="h-10 w-10 mr-3 text-primary" />
          AI Course Designer V3
        </h1>
        <p className="text-xl text-muted-foreground">
          Create comprehensive courses with AI assistance, file extraction, and seamless content integration.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Generation
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Content Sources
              </CardTitle>
              <CardDescription>
                Add various types of content sources for your course. The AI will analyze and extract relevant information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <form onSubmit={handleAddContentFromUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-url" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Add from URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="content-url"
                      placeholder="YouTube video/playlist, PDF, documentation, etc."
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!contentUrl.trim()}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports: YouTube videos/playlists, PDFs, documentation sites, articles
                  </p>
                </div>
              </form>

              <Separator />

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports: PDF, Word documents, text files, Markdown
                </p>
              </div>

              <Separator />

              {/* Text Input */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Add Text Content
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Content title"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                  <Textarea
                    ref={textContentRef}
                    placeholder="Paste your content here (syllabus, notes, requirements, etc.)"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={6}
                  />
                  <Button onClick={handleAddTextContent} disabled={!textContent.trim() || !contentTitle.trim()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Text Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Contents List */}
          {sourceContents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Added Sources ({sourceContents.length})</span>
                  <Badge variant="outline">
                    {sourceContents.filter(c => c.processingStatus === 'completed').length} processed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {sourceContents.map(renderSourceContent)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title *</Label>
                  <Input
                    id="course-title"
                    placeholder="e.g., Complete Web Development Bootcamp"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-category">Category</Label>
                  <Select value={courseCategory} onValueChange={setCourseCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-description">Course Description</Label>
                <Textarea
                  id="course-description"
                  placeholder="Describe what students will learn..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-objectives">Learning Objectives</Label>
                <Textarea
                  id="course-objectives"
                  placeholder="List the key learning outcomes..."
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <RadioGroup
                      value={generationSettings.targetAudience}
                      onValueChange={(value: any) => setGenerationSettings(prev => ({ ...prev, targetAudience: value }))}
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
                      onValueChange={(value: any) => setGenerationSettings(prev => ({ ...prev, courseDuration: value }))}
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

                  <div className="space-y-2">
                    <Label>Learning Style</Label>
                    <Select
                      value={generationSettings.learningStyle}
                      onValueChange={(value: any) => setGenerationSettings(prev => ({ ...prev, learningStyle: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video-focused">Video-Focused</SelectItem>
                        <SelectItem value="text-focused">Text-Focused</SelectItem>
                        <SelectItem value="mixed">Mixed Content</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                        <SelectItem value="project-based">Project-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Number of Modules</Label>
                    <Input
                      type="number"
                      min="3"
                      max="20"
                      value={generationSettings.moduleCount}
                      onChange={(e) => setGenerationSettings(prev => ({ ...prev, moduleCount: parseInt(e.target.value) || 6 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={generationSettings.language}
                      onValueChange={(value) => setGenerationSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Include Features</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="assessments"
                          checked={generationSettings.includeAssessments}
                          onCheckedChange={(checked) => 
                            setGenerationSettings(prev => ({ ...prev, includeAssessments: !!checked }))
                          }
                        />
                        <Label htmlFor="assessments">Assessments & Quizzes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="projects"
                          checked={generationSettings.includePracticalProjects}
                          onCheckedChange={(checked) => 
                            setGenerationSettings(prev => ({ ...prev, includePracticalProjects: !!checked }))
                          }
                        />
                        <Label htmlFor="projects">Practical Projects</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="quizzes"
                          checked={generationSettings.includeQuizzes}
                          onCheckedChange={(checked) => 
                            setGenerationSettings(prev => ({ ...prev, includeQuizzes: !!checked }))
                          }
                        />
                        <Label htmlFor="quizzes">Module Quizzes</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Course Generation
              </CardTitle>
              <CardDescription>
                Generate your course using AI with the content sources and settings you've provided.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isGenerating && !generationComplete && (
                <div className="space-y-4">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Ready to Generate</AlertTitle>
                    <AlertDescription>
                      {sourceContents.length} source(s) added • {generationSettings.moduleCount} modules planned • {generationSettings.courseDuration} duration
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={handleGenerateCourse}
                    disabled={sourceContents.length === 0 || !courseTitle.trim()}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Course with AI
                  </Button>
                </div>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Generating Your Course...</h3>
                    <Progress value={generationProgress.overallProgress} className="w-full mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {Math.round(generationProgress.overallProgress)}% complete
                    </p>
                  </div>

                  <div className="space-y-3">
                    {generationProgress.stages.map((stage, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          stage.status === 'completed' ? "bg-green-500 text-white" :
                          stage.status === 'active' ? "bg-blue-500 text-white" :
                          stage.status === 'error' ? "bg-red-500 text-white" :
                          "bg-gray-200 text-gray-600"
                        )}>
                          {stage.status === 'completed' ? <CheckSquare className="h-4 w-4" /> :
                           stage.status === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                           stage.status === 'error' ? <XCircle className="h-4 w-4" /> :
                           index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{stage.name}</p>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                          {stage.status === 'active' && (
                            <Progress value={stage.progress} className="w-full mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generationComplete && (
                <Alert>
                  <CheckSquare className="h-4 w-4" />
                  <AlertTitle>Generation Complete!</AlertTitle>
                  <AlertDescription>
                    Your course has been successfully generated with {generatedModules.length} modules. 
                    Review it in the Preview tab and save when ready.
                  </AlertDescription>
                </Alert>
              )}

              {generationProgress.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Generation Error</AlertTitle>
                  <AlertDescription>{generationProgress.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {coursePreview ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{coursePreview.title}</span>
                    <Badge variant="outline">{generatedModules.length} modules</Badge>
                  </CardTitle>
                  <CardDescription>{coursePreview.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="font-medium">Target Audience</p>
                      <p className="text-sm text-muted-foreground capitalize">{generationSettings.targetAudience}</p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">{generationSettings.courseDuration}</p>
                    </div>
                    <div className="text-center">
                      <BookOpenCheck className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <p className="font-medium">Learning Style</p>
                      <p className="text-sm text-muted-foreground capitalize">{generationSettings.learningStyle.replace('-', ' ')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {generatedModules.map((module, index) => (
                        <Card key={module.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                {index + 1}
                              </span>
                              {module.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                            
                            {module.subtopics && module.subtopics.length > 0 && (
                              <div className="mb-3">
                                <p className="font-medium text-sm mb-1">Subtopics:</p>
                                <div className="flex flex-wrap gap-1">
                                  {module.subtopics.slice(0, 3).map((subtopic, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {subtopic}
                                    </Badge>
                                  ))}
                                  {module.subtopics.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{module.subtopics.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {module.practiceTask && (
                              <div className="mb-3">
                                <p className="font-medium text-sm mb-1">Practice Task:</p>
                                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                  {module.practiceTask}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {module.estimatedTime}
                              </span>
                              <span className="flex items-center gap-1">
                                {module.contentType === 'video' ? <VideoIcon className="h-3 w-3" /> : <FileTextIcon className="h-3 w-3" />}
                                {module.contentType}
                              </span>
                              {module.videoLinks && module.videoLinks.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Youtube className="h-3 w-3" />
                                  {module.videoLinks.length} video(s)
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveTab('settings')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Settings
                </Button>
                <Button onClick={handleSaveCourse}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Course
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Eye className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Course Generated Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Add your content sources, configure generation settings, and generate your course to see the preview here.
                </p>
                <Button onClick={() => setActiveTab('sources')} className="mt-4">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Export your generated course in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" disabled={!generationComplete}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
                <Button variant="outline" disabled={!generationComplete}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" disabled={!generationComplete}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" disabled={!generationComplete}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as YAML
                </Button>
              </div>
              
              {!generationComplete && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Generate a course first to enable export options.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
