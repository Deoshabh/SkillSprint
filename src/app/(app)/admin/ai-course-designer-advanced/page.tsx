"use client";

import { useState, type ChangeEvent, type FormEvent, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, Loader2, AlertTriangle, Youtube, ListPlus, Trash2, Edit, Send, CheckSquare, XCircle, Brain, VideoIcon, FileTextIcon, HelpCircleIcon, ChevronUp, ChevronDown, CalendarClock, Sparkles, FileUp, Link as LinkIcon, Zap, BookOpen, Target, Users, Clock, Globe, FileText, ExternalLink, Play, FilePlus, BookOpenCheck, Lightbulb, Lock, Unlock, GraduationCap, Trophy, Settings, Shield } from 'lucide-react';
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import { generateQuiz, type GenerateQuizInput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';

// Course Store and Auth
import { useCourseStore } from '@/lib/course-store';
import { useAuth } from '@/context/auth-context';
import type { VideoLink, Course as CourseType, Module as ModuleType, ModuleContentType, Quiz } from '@/lib/types';

// Enhanced types for the advanced designer
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
  aiAnalysis?: any; // Store AI analysis results
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
  
  // Quiz Generation Settings (from v2)
  quizGeneration: 'ai' | 'manual' | 'both';
  quizDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  questionsPerQuiz: number;
  quizTypes: ('multiple-choice' | 'true-false' | 'short-answer' | 'coding')[];
  passingScore: number;
  
  // Module Locking Settings (from v2)
  enableModuleLocking: boolean;
  lockingCriteria: 'quiz-pass' | 'quiz-score' | 'completion';
  minimumScoreToUnlock: number;
  
  // Advanced Features
  autoGenerateSchedule: boolean;
  includePrerequisites: boolean;
  adaptiveDifficulty: boolean;
  multiLanguageSupport: boolean;
}

interface GenerationStage {
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: any;
}

interface GenerationProgress {
  currentStage: number;
  stages: GenerationStage[];
  overallProgress: number;
  isComplete: boolean;
  error?: string;
}

interface ModuleWithQuiz extends ModuleType {
  quiz?: Quiz;
  isLocked?: boolean;
  unlockRequirements?: {
    previousModuleId?: string;
    minimumQuizScore?: number;
  };
}

export default function AdvancedAICourseDesignerPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const courseStore = useCourseStore();
  const { addCourse } = courseStore;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textContentRef = useRef<HTMLTextAreaElement>(null);

  // Main course data
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('Programming');
  const [courseObjectives, setCourseObjectives] = useState('');
  const [courseInstructor, setCourseInstructor] = useState('');
  
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
    focusAreas: [],
    
    // Quiz settings
    quizGeneration: 'ai',
    quizDifficulty: 'medium',
    questionsPerQuiz: 5,
    quizTypes: ['multiple-choice', 'true-false'],
    passingScore: 70,
    
    // Module locking settings
    enableModuleLocking: false,
    lockingCriteria: 'quiz-pass',
    minimumScoreToUnlock: 70,
    
    // Advanced features
    autoGenerateSchedule: true,
    includePrerequisites: true,
    adaptiveDifficulty: false,
    multiLanguageSupport: false
  });
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    currentStage: 0,
    stages: [
      { name: 'Content Analysis', description: 'Analyzing source materials', progress: 0, status: 'pending', icon: Brain },
      { name: 'Course Structure', description: 'Creating course outline', progress: 0, status: 'pending', icon: BookOpen },
      { name: 'Module Creation', description: 'Generating detailed modules', progress: 0, status: 'pending', icon: Target },
      { name: 'Quiz Generation', description: 'Creating assessments', progress: 0, status: 'pending', icon: Trophy },
      { name: 'Content Enhancement', description: 'Finding supplementary content', progress: 0, status: 'pending', icon: Sparkles },
      { name: 'Schedule Generation', description: 'Creating learning schedule', progress: 0, status: 'pending', icon: CalendarClock },
      { name: 'Finalization', description: 'Finalizing course structure', progress: 0, status: 'pending', icon: CheckSquare }
    ],
    overallProgress: 0,
    isComplete: false
  });
  
  // Generated course data
  const [generatedModules, setGeneratedModules] = useState<ModuleWithQuiz[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState('');
  const [generationComplete, setGenerationComplete] = useState(false);
  const [coursePreview, setCoursePreview] = useState<CourseType | null>(null);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState('sources');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

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
        aiAnalysis: analysisResult,
        processingStatus: 'completed'
      };

      // Update the source content with extracted and analyzed data
      setSourceContents(prev => prev.map(content => 
        content.id === sourceContent.id 
          ? { ...content, ...enhancedContent }
          : content
      ));

      toast({
        title: "Content Processed",
        description: `Successfully analyzed: ${enhancedContent.title || url}`,
      });

      return { ...sourceContent, ...enhancedContent };
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

  // Content extraction methods
  const extractYouTubeContent = async (url: string): Promise<Partial<SourceContent>> => {
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

  // Helper functions
  const getDurationModules = (duration: string): number => {
    switch (duration) {
      case '2-weeks': return 4;
      case '4-weeks': return 6;
      case '6-weeks': return 8;
      case '8-weeks': return 10;
      case '12-weeks': return 12;
      default: return generationSettings.moduleCount || 6;
    }
  };

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
            contentType: 'video',
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
    if (currentModule && currentModule.title) {      modules.push({
        id: uuidv4(),
        title: currentModule.title,
        description: currentModule.description || '',
        contentType: 'video',
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

  const generateCourse = async () => {
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

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create courses.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(prev => ({
      ...prev,
      currentStage: 0,
      stages: prev.stages.map((stage, index) => ({
        ...stage,
        status: index === 0 ? 'active' : 'pending',
        progress: index === 0 ? 10 : 0
      })),
      overallProgress: 5
    }));

    try {
      // Stage 1: Content Analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 1,
        stages: prev.stages.map((stage, index) => ({
          ...stage,
          status: index === 0 ? 'completed' : index === 1 ? 'active' : 'pending',
          progress: index === 0 ? 100 : index === 1 ? 20 : 0
        })),
        overallProgress: 15
      }));

      // Stage 2: Generate course structure
      const combinedContent = sourceContents.map(content => 
        `${content.title}: ${content.extractedContent}`
      ).join('\n\n');

      const syllabusInput: AutoGenerateCourseSyllabusInput = {
        courseTopic: courseTitle,
        targetAudience: `${generationSettings.targetAudience} learners`,
        learningObjectives: courseObjectives || `Master ${courseTitle} through comprehensive learning`,
        desiredNumberOfModules: getDurationModules(generationSettings.courseDuration)
      };

      const syllabusResult = await autoGenerateCourseSyllabus(syllabusInput);
      const parsedModules = parseSyllabusToModules(syllabusResult.courseSyllabus);
      
      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 2,
        stages: prev.stages.map((stage, index) => ({
          ...stage,
          status: index <= 1 ? 'completed' : index === 2 ? 'active' : 'pending',
          progress: index <= 1 ? 100 : index === 2 ? 30 : 0
        })),
        overallProgress: 30
      }));

      // Stage 3: Enhance modules with subtopics, practice tasks, and optionally quizzes
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
        });        let enhancedModule: ModuleWithQuiz = {
          id: moduleId,
          title: module.title,
          description: module.description,
          contentType: 'video',
          estimatedTime: module.estimatedTime,
          subtopics: subtopicsResult.subtopics,
          practiceTask: practiceTaskResult.practiceTask,
          videoLinks: [],
          contentUrl: '',
          contentData: module.description
        };

        // Apply module locking if enabled
        if (generationSettings.enableModuleLocking && index > 0) {
          enhancedModule.isLocked = true;
          enhancedModule.unlockRequirements = {
            previousModuleId: enhancedModules[index - 1]?.id,
            minimumQuizScore: generationSettings.minimumScoreToUnlock
          };
        }

        enhancedModules.push(enhancedModule);

        setGenerationProgress(prev => ({
          ...prev,
          stages: prev.stages.map((stage, index) => ({
            ...stage,
            progress: index === 2 ? 30 + (enhancedModules.length / parsedModules.length) * 40 : stage.progress
          }))
        }));
      }

      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 3,
        stages: prev.stages.map((stage, index) => ({
          ...stage,
          status: index <= 2 ? 'completed' : index === 3 ? 'active' : 'pending',
          progress: index <= 2 ? 100 : index === 3 ? 10 : 0
        })),
        overallProgress: 55
      }));

      // Stage 4: Generate quizzes if enabled
      if (generationSettings.includeQuizzes && 
          (generationSettings.quizGeneration === 'ai' || generationSettings.quizGeneration === 'both')) {
        
        for (const [index, module] of enhancedModules.entries()) {
          try {
            const quizResult = await generateQuiz({
              moduleTitle: module.title,
              moduleContent: `${module.description}\n\nSubtopics: ${module.subtopics?.join(', ') || 'None'}\n\nPractice Task: ${module.practiceTask}`,
              difficultyLevel: generationSettings.quizDifficulty === 'adaptive' ? 'medium' : generationSettings.quizDifficulty as 'easy' | 'medium' | 'hard',
              questionCount: generationSettings.questionsPerQuiz,
              questionTypes: generationSettings.quizTypes,
              passingScore: generationSettings.passingScore
            });            module.quiz = {
              id: uuidv4(),
              title: quizResult.quizTitle,
              description: `Assessment for ${module.title}`,
              questions: quizResult.questions,
              totalPoints: quizResult.questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0),
              passingScore: quizResult.passingScore,
              moduleId: module.id,
              createdBy: 'ai',
              estimatedTime: '15 minutes',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          } catch (error) {
            console.warn(`Could not generate quiz for module: ${module.title}`, error);
          }

          setGenerationProgress(prev => ({
            ...prev,
            stages: prev.stages.map((stage, index) => ({
              ...stage,
              progress: index === 3 ? 10 + ((index + 1) / enhancedModules.length) * 70 : stage.progress
            }))
          }));
        }
      }

      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 4,
        stages: prev.stages.map((stage, index) => ({
          ...stage,
          status: index <= 3 ? 'completed' : index === 4 ? 'active' : 'pending',
          progress: index <= 3 ? 100 : index === 4 ? 20 : 0
        })),
        overallProgress: 75
      }));

      // Stage 5: Find videos for modules (sample implementation)
      for (const [index, module] of enhancedModules.slice(0, 3).entries()) {        try {
          const videosResult = await findYoutubeVideosForModule({
            moduleTitle: module.title,
            moduleDescription: module.description,
            preferredLanguage: generationSettings.language
          });

          module.videoLinks = videosResult.videos.map(video => ({
            id: uuidv4(),
            title: video.title,
            youtubeEmbedUrl: video.youtubeEmbedUrl,
            langCode: video.langCode,
            langName: video.langName,
            creator: video.creator,
            isPlaylist: video.isPlaylist
          }));
        } catch (error) {
          console.warn(`Could not find videos for module: ${module.title}`, error);
        }
      }

      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 5,
        stages: prev.stages.map((stage, index) => ({
          ...stage,
          status: index <= 4 ? 'completed' : index === 5 ? 'active' : 'pending',
          progress: index <= 4 ? 100 : index === 5 ? 50 : 0
        })),
        overallProgress: 85
      }));

      // Stage 6: Generate schedule if enabled
      let schedule = '';
      if (generationSettings.autoGenerateSchedule) {        try {
          const scheduleResult = await generateCourseSchedule({
            courseTitle: courseTitle,
            moduleTitles: enhancedModules.map(m => m.title),
            estimatedCourseDurationWeeks: getDurationModules(generationSettings.courseDuration) / 2,
            studyHoursPerWeek: 10
          });

          schedule = scheduleResult.scheduleText;
          setGeneratedSchedule(schedule);
        } catch (error) {
          console.warn('Could not generate schedule:', error);
        }
      }

      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 6,
        stages: prev.stages.map((stage, index) => ({
          ...stage,
          status: index <= 5 ? 'completed' : index === 6 ? 'active' : 'pending',
          progress: index <= 5 ? 100 : index === 6 ? 80 : 0
        })),
        overallProgress: 95
      }));

      // Stage 7: Finalization
      setGeneratedModules(enhancedModules);
      
      const coursePreviewData: CourseType = {
        id: uuidv4(),
        title: courseTitle,
        description: courseDescription,
        instructor: courseInstructor || user.name || 'AI Generated',
        category: courseCategory,
        icon: '🤖',
        modules: enhancedModules,
        visibility: 'private',
        status: 'draft',
        suggestedSchedule: schedule,
        lastModified: new Date().toISOString(),
        authorId: user.id
      };

      setCoursePreview(coursePreviewData);
      setGenerationComplete(true);
      
      setGenerationProgress(prev => ({
        ...prev,
        currentStage: 6,
        stages: prev.stages.map(stage => ({
          ...stage,
          status: 'completed',
          progress: 100
        })),
        overallProgress: 100,
        isComplete: true
      }));

      setActiveTab('preview');
      
      toast({
        title: "Course Generated Successfully!",
        description: `Created a ${enhancedModules.length}-module course with advanced AI features.`,
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

  // Save generated course to database
  const handleSaveCourse = async () => {
    if (!coursePreview || !user) {
      toast({
        title: "Cannot Save",
        description: "No course to save or user not authenticated.",
        variant: "destructive"
      });
      return;
    }    try {
      const courseToSave = {
        ...coursePreview,
        authorId: user.id // Ensure authorId is set
      };
      const savedCourse = await addCourse(courseToSave);
      
      if (savedCourse) {
        setSavedCourseId(savedCourse.id);
        
        toast({
          title: "Course Saved",
          description: `"${savedCourse.title}" has been saved successfully.`,
        });
        
        // Reset form
        setCourseTitle('');
        setCourseDescription('');
        setCourseObjectives('');
        setCourseInstructor('');
        setSourceContents([]);
        setGeneratedModules([]);
        setGenerationComplete(false);
        setCoursePreview(null);
        setActiveTab('sources');
      } else {
        throw new Error('Failed to save course');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the course. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Submit course for review
  const handleSubmitForReview = async () => {
    if (!savedCourseId) {
      toast({
        title: "Save First",
        description: "Please save the course before submitting for review.",
        variant: "destructive"
      });
      return;
    }

    try {
      await (courseStore as any).submitForReview(savedCourseId);
      
      toast({
        title: "Submitted for Review",
        description: "Your course has been submitted for review by administrators.",
      });
      
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission Failed",
        description: "Could not submit the course for review.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          Advanced AI Course Designer
        </h1>
        <p className="text-muted-foreground mt-2">
          Create comprehensive courses with AI-powered content generation, quiz creation, and advanced learning features
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Content Sources
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Course Settings
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Generate Course
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview & Edit
          </TabsTrigger>
          <TabsTrigger value="save" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save & Submit
          </TabsTrigger>
        </TabsList>

        {/* Content Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Add Source Content
              </CardTitle>
              <CardDescription>
                Add various content sources for AI analysis. The more content you provide, the better the generated course will be.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Add from URL
                </Label>
                <form onSubmit={handleAddContentFromUrl} className="flex gap-2">
                  <Input
                    placeholder="Enter YouTube video/playlist, website, or document URL..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!contentUrl.trim()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                </form>
                <div className="text-sm text-muted-foreground">
                  Supports: YouTube videos/playlists, web pages, PDF documents, and more
                </div>
              </div>

              <Separator />

              {/* Text Input */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Add Text Content
                </Label>
                <Input
                  placeholder="Content title..."
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                />
                <Textarea
                  ref={textContentRef}
                  placeholder="Paste your text content here (articles, notes, course materials, etc.)..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={handleAddTextContent} 
                  disabled={!textContent.trim() || !contentTitle.trim()}
                  className="w-full"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  Add Text Content
                </Button>
              </div>

              <Separator />

              {/* File Upload */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <FileUp className="h-4 w-4" />
                  Upload Files
                </Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload files (PDFs, documents, presentations)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Content List */}
          {sourceContents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Source Content ({sourceContents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {sourceContents.map((content) => (
                      <div key={content.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {content.type === 'youtube_video' && <VideoIcon className="h-5 w-5 text-red-500" />}
                          {content.type === 'youtube_playlist' && <Play className="h-5 w-5 text-red-500" />}
                          {content.type === 'document' && <FileTextIcon className="h-5 w-5 text-blue-500" />}
                          {content.type === 'website' && <Globe className="h-5 w-5 text-green-500" />}
                          {content.type === 'file' && <FileUp className="h-5 w-5 text-purple-500" />}
                          {content.type === 'text_input' && <FileText className="h-5 w-5 text-orange-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{content.title}</h4>
                          {content.description && (
                            <p className="text-sm text-muted-foreground truncate">{content.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {content.processingStatus === 'processing' && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Processing
                              </Badge>
                            )}
                            {content.processingStatus === 'completed' && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckSquare className="h-3 w-3" />
                                Ready
                              </Badge>
                            )}
                            {content.processingStatus === 'error' && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Error
                              </Badge>
                            )}
                            {content.metadata?.tags && (
                              <div className="flex gap-1">
                                {content.metadata.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
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
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Course Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Course Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenCheck className="h-5 w-5" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g., Complete Python Programming Bootcamp"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseDescription">Course Description</Label>
                  <Textarea
                    id="courseDescription"
                    placeholder="Describe what students will learn in this course..."
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseObjectives">Learning Objectives</Label>
                  <Textarea
                    id="courseObjectives"
                    placeholder="List the main learning objectives and outcomes..."
                    value={courseObjectives}
                    onChange={(e) => setCourseObjectives(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCategory">Category</Label>
                    <Select value={courseCategory} onValueChange={setCourseCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Programming">Programming</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                        <SelectItem value="AI/ML">AI/ML</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseInstructor">Instructor Name</Label>
                    <Input
                      id="courseInstructor"
                      placeholder="Course instructor"
                      value={courseInstructor}
                      onChange={(e) => setCourseInstructor(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select 
                      value={generationSettings.targetAudience} 
                      onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, targetAudience: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginners">Beginners</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="mixed">Mixed Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Course Duration</Label>
                    <Select 
                      value={generationSettings.courseDuration} 
                      onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, courseDuration: value}))}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Learning Style</Label>
                    <Select 
                      value={generationSettings.learningStyle} 
                      onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, learningStyle: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video-focused">Video-Focused</SelectItem>
                        <SelectItem value="text-focused">Text-Focused</SelectItem>
                        <SelectItem value="mixed">Mixed Media</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                        <SelectItem value="project-based">Project-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Progression Style</Label>
                    <Select 
                      value={generationSettings.difficultyProgression} 
                      onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, difficultyProgression: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="spiral">Spiral</SelectItem>
                        <SelectItem value="modular">Modular</SelectItem>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Module Count</Label>
                  <div className="px-3">
                    <Slider
                      value={[generationSettings.moduleCount || 6]}
                      onValueChange={([value]) => setGenerationSettings(prev => ({...prev, moduleCount: value}))}
                      max={20}
                      min={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>3</span>
                      <span>{generationSettings.moduleCount || 6} modules</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Content Features</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeQuizzes" 
                        checked={generationSettings.includeQuizzes}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, includeQuizzes: !!checked}))}
                      />
                      <Label htmlFor="includeQuizzes" className="text-sm">Include Quizzes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeAssessments" 
                        checked={generationSettings.includeAssessments}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, includeAssessments: !!checked}))}
                      />
                      <Label htmlFor="includeAssessments" className="text-sm">Include Assessments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includePracticalProjects" 
                        checked={generationSettings.includePracticalProjects}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, includePracticalProjects: !!checked}))}
                      />
                      <Label htmlFor="includePracticalProjects" className="text-sm">Include Practical Projects</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="autoGenerateSchedule" 
                        checked={generationSettings.autoGenerateSchedule}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, autoGenerateSchedule: !!checked}))}
                      />
                      <Label htmlFor="autoGenerateSchedule" className="text-sm">Auto-Generate Schedule</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvancedSettings && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quiz Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Quiz Generation Settings
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Quiz Generation Method</Label>
                        <RadioGroup 
                          value={generationSettings.quizGeneration} 
                          onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, quizGeneration: value}))}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ai" id="quiz-ai" />
                            <Label htmlFor="quiz-ai" className="text-sm">AI Generated</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="quiz-manual" />
                            <Label htmlFor="quiz-manual" className="text-sm">Manual Creation</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="quiz-both" />
                            <Label htmlFor="quiz-both" className="text-sm">Both (AI + Manual)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Quiz Difficulty</Label>
                        <Select 
                          value={generationSettings.quizDifficulty} 
                          onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, quizDifficulty: value}))}
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
                        <Label>Questions per Quiz</Label>
                        <Select 
                          value={generationSettings.questionsPerQuiz.toString()} 
                          onValueChange={(value) => setGenerationSettings(prev => ({...prev, questionsPerQuiz: parseInt(value)}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 Questions</SelectItem>
                            <SelectItem value="5">5 Questions</SelectItem>
                            <SelectItem value="7">7 Questions</SelectItem>
                            <SelectItem value="10">10 Questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Passing Score (%)</Label>
                        <div className="px-3">
                          <Slider
                            value={[generationSettings.passingScore]}
                            onValueChange={([value]) => setGenerationSettings(prev => ({...prev, passingScore: value}))}
                            max={100}
                            min={50}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>50%</span>
                            <span>{generationSettings.passingScore}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module Locking Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Module Locking Settings
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableModuleLocking" className="text-sm">Enable Module Locking</Label>
                        <Switch
                          id="enableModuleLocking"
                          checked={generationSettings.enableModuleLocking}
                          onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, enableModuleLocking: checked}))}
                        />
                      </div>

                      {generationSettings.enableModuleLocking && (
                        <>
                          <div className="space-y-2">
                            <Label>Unlocking Criteria</Label>
                            <Select 
                              value={generationSettings.lockingCriteria} 
                              onValueChange={(value: any) => setGenerationSettings(prev => ({...prev, lockingCriteria: value}))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="quiz-pass">Pass Quiz</SelectItem>
                                <SelectItem value="quiz-score">Minimum Quiz Score</SelectItem>
                                <SelectItem value="completion">Module Completion</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {generationSettings.lockingCriteria === 'quiz-score' && (
                            <div className="space-y-2">
                              <Label>Minimum Score to Unlock (%)</Label>
                              <div className="px-3">
                                <Slider
                                  value={[generationSettings.minimumScoreToUnlock]}
                                  onValueChange={([value]) => setGenerationSettings(prev => ({...prev, minimumScoreToUnlock: value}))}
                                  max={100}
                                  min={60}
                                  step={5}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                  <span>60%</span>
                                  <span>{generationSettings.minimumScoreToUnlock}%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Advanced Features</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includePrerequisites" 
                        checked={generationSettings.includePrerequisites}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, includePrerequisites: !!checked}))}
                      />
                      <Label htmlFor="includePrerequisites" className="text-sm">Include Prerequisites</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="adaptiveDifficulty" 
                        checked={generationSettings.adaptiveDifficulty}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, adaptiveDifficulty: !!checked}))}
                      />
                      <Label htmlFor="adaptiveDifficulty" className="text-sm">Adaptive Difficulty</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="multiLanguageSupport" 
                        checked={generationSettings.multiLanguageSupport}
                        onCheckedChange={(checked) => setGenerationSettings(prev => ({...prev, multiLanguageSupport: !!checked}))}
                      />
                      <Label htmlFor="multiLanguageSupport" className="text-sm">Multi-language Support</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Generate Course Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Course Generation
              </CardTitle>
              <CardDescription>
                Generate a comprehensive course structure using advanced AI analysis of your source content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isGenerating && !generationComplete && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Generate Your Course</h3>
                    <p className="text-muted-foreground">
                      {sourceContents.length} source content(s) • {generationSettings.moduleCount} modules planned
                    </p>
                  </div>
                  <Button 
                    onClick={generateCourse}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={sourceContents.length === 0 || !courseTitle.trim()}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Advanced Course
                  </Button>
                  {(sourceContents.length === 0 || !courseTitle.trim()) && (
                    <p className="text-sm text-muted-foreground">
                      {!courseTitle.trim() ? 'Please provide a course title' : 'Please add at least one source content'}
                    </p>
                  )}
                </div>
              )}

              {isGenerating && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold">Generating Your Course</h3>
                    <p className="text-muted-foreground">AI is analyzing content and creating modules...</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{generationProgress.overallProgress}%</span>
                    </div>
                    <Progress value={generationProgress.overallProgress} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    {generationProgress.stages.map((stage, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          stage.status === 'completed' && "bg-green-100 text-green-600",
                          stage.status === 'active' && "bg-blue-100 text-blue-600",
                          stage.status === 'pending' && "bg-gray-100 text-gray-400",
                          stage.status === 'error' && "bg-red-100 text-red-600"
                        )}>
                          {stage.status === 'completed' && <CheckSquare className="h-4 w-4" />}
                          {stage.status === 'active' && <Loader2 className="h-4 w-4 animate-spin" />}
                          {stage.status === 'pending' && <stage.icon className="h-4 w-4" />}
                          {stage.status === 'error' && <XCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className={cn(
                              "font-medium",
                              stage.status === 'active' && "text-blue-600",
                              stage.status === 'completed' && "text-green-600"
                            )}>
                              {stage.name}
                            </span>
                            <span className="text-sm text-muted-foreground">{stage.progress}%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                          {stage.progress > 0 && stage.progress < 100 && (
                            <Progress value={stage.progress} className="h-1 mt-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {generationProgress.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Generation Error</AlertTitle>
                      <AlertDescription>{generationProgress.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {generationComplete && generatedModules.length > 0 && (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckSquare className="h-4 w-4" />
                    <AlertTitle>Course Generated Successfully!</AlertTitle>
                    <AlertDescription>
                      Your course has been generated with {generatedModules.length} modules. Review and edit in the Preview tab.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setActiveTab('preview')}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Course
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setGenerationComplete(false);
                        setGeneratedModules([]);
                        setCoursePreview(null);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Generate Again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Edit Tab */}
        <TabsContent value="preview" className="space-y-6">
          {coursePreview ? (
            <div className="space-y-6">
              {/* Course Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5" />
                    Course Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{coursePreview.title}</h3>
                      <p className="text-muted-foreground">{coursePreview.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Category:</span>
                        <Badge variant="secondary">{coursePreview.category}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Modules:</span>
                        <span className="text-sm font-medium">{coursePreview.modules.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Instructor:</span>
                        <span className="text-sm font-medium">{coursePreview.instructor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant="outline">{coursePreview.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Modules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Course Modules ({generatedModules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {generatedModules.map((module, index) => (
                        <div key={module.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                  {index + 1}
                                </span>
                                <h4 className="font-medium">{module.title}</h4>
                                {module.isLocked && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{module.estimatedTime}</Badge>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {module.subtopics && module.subtopics.length > 0 && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">SUBTOPICS</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {module.subtopics.slice(0, 5).map((subtopic, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {subtopic}
                                  </Badge>
                                ))}
                                {module.subtopics.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{module.subtopics.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {module.practiceTask && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">PRACTICE TASK</Label>
                              <p className="text-sm mt-1">{module.practiceTask}</p>
                            </div>
                          )}

                          {module.quiz && (
                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                  <span className="font-medium text-sm">{module.quiz.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{module.quiz.questions.length} questions</Badge>
                                  <Badge variant="outline">{module.quiz.passingScore}% passing</Badge>
                                </div>
                              </div>
                            </div>
                          )}

                          {module.videoLinks && module.videoLinks.length > 0 && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">RECOMMENDED VIDEOS</Label>
                              <div className="space-y-1 mt-1">
                                {module.videoLinks.slice(0, 2).map((video, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <VideoIcon className="h-3 w-3 text-red-500" />
                                    <span className="truncate">{video.title}</span>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                ))}
                                {module.videoLinks.length > 2 && (
                                  <p className="text-xs text-muted-foreground">+{module.videoLinks.length - 2} more videos</p>
                                )}
                              </div>
                            </div>
                          )}

                          {module.isLocked && module.unlockRequirements && (
                            <div className="border-t pt-3">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium">Unlock Requirements</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {module.unlockRequirements.minimumQuizScore ? 
                                  `Score at least ${module.unlockRequirements.minimumQuizScore}% on the previous module quiz` :
                                  'Complete the previous module'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Generated Schedule */}
              {generatedSchedule && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      Suggested Learning Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">{generatedSchedule}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Course Generated Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a course first to see the preview and make edits.
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  <Brain className="h-4 w-4 mr-2" />
                  Go to Generate
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Save & Submit Tab */}
        <TabsContent value="save" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Save & Submit Course
              </CardTitle>
              <CardDescription>
                Save your generated course and optionally submit it for review by administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {coursePreview ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Course Ready for Saving</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Title:</span>
                        <p className="font-medium">{coursePreview.title}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modules:</span>
                        <p className="font-medium">{coursePreview.modules.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{coursePreview.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium">{coursePreview.status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSaveCourse}
                      className="flex-1"
                      disabled={!!savedCourseId}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savedCourseId ? 'Course Saved' : 'Save Course'}
                    </Button>
                    <Button 
                      onClick={handleSubmitForReview}
                      variant="outline"
                      className="flex-1"
                      disabled={!savedCourseId}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                    </Button>
                  </div>

                  {savedCourseId && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckSquare className="h-4 w-4" />
                      <AlertTitle>Course Saved Successfully!</AlertTitle>
                      <AlertDescription>
                        Your course has been saved to the database with ID: {savedCourseId}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Course to Save</h3>
                  <p className="text-muted-foreground mb-4">
                    Please generate a course first before saving.
                  </p>
                  <Button onClick={() => setActiveTab('generate')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help & Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircleIcon className="h-5 w-5" />
                Help & Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Saving Your Course</h4>
                  <p className="text-sm text-muted-foreground">
                    Saved courses are stored in your database and can be accessed from the course management section.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Review Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Submitted courses will be reviewed by administrators before being published for students.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Course Features</h4>
                  <p className="text-sm text-muted-foreground">
                    Your course includes AI-generated modules, quizzes, practice tasks, and optional video recommendations.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Editing Later</h4>
                  <p className="text-sm text-muted-foreground">
                    You can edit and update your saved courses at any time through the course management interface.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
