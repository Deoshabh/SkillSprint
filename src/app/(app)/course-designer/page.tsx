"use client";


import { useState, type ChangeEvent, type FormEvent, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Upload, Download, Wand2, PlusCircle, Save, Eye, LayoutGrid, Loader2, AlertTriangle, Video, ListPlus, Trash2, Edit, Send, CheckSquare, Brain, VideoIcon, FileTextIcon, HelpCircleIcon, ChevronUp, ChevronDown, CalendarClock, ImageIcon, Sparkles, ChevronLeft, ChevronRight, Target, BookOpen, Users, Clock, FileIcon, LinkIcon, MoveIcon, FolderOpen } from 'lucide-react';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';
import { suggestModuleSubtopics, type SuggestModuleSubtopicsInput } from '@/ai/flows/suggest-module-subtopics-flow';
import { suggestModulePracticeTask, type SuggestModulePracticeTaskInput } from '@/ai/flows/suggest-module-practice-task-flow';
import { generateCourseSchedule, type GenerateCourseScheduleInput } from '@/ai/flows/generate-course-schedule-flow';
import { autoGenerateAssessments } from '@/ai/flows/auto-generate-quiz-mock-tests';
import type { VideoLink, DocumentLink, Course as CourseType, Module as ModuleType, ModuleContentType } from '@/lib/types';
import { saveOrUpdateCourse, submitCourseForReview, getCourseById } from '@/lib/placeholder-data';
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/context/auth-context';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger as AlertDialogTriggerPrimitive } from "@/components/ui/alert-dialog";
import { ImageUpload } from '@/components/image-upload';
import { ExportDialog } from '@/components/export-dialog';
import { ImportDialog } from '@/components/enhanced-import-dialog';
import { QuizEditor } from '@/components/quiz-editor';
import { importCourseFile, type CourseImportPreview } from '@/lib/import-utils';

interface ManualVideoFormState {
  url: string;
  language: string;
  creator: string;
  notes: string;
  isPlaylist: boolean;
}

type CourseVisibility = "private" | "shared" | "public";

// Wizard Steps Configuration
const WIZARD_STEPS = [
  {
    id: 'setup',
    title: 'Course Setup',
    description: 'Basic information and templates',
    icon: BookOpen,
    color: 'bg-blue-500'
  },
  {
    id: 'planning',
    title: 'Content Planning', 
    description: 'AI-assisted course structure',
    icon: Brain,
    color: 'bg-purple-500'
  },
  {
    id: 'resources',
    title: 'Resource Gathering',
    description: 'Videos and materials',
    icon: Video,
    color: 'bg-green-500'
  },
  {
    id: 'modules',
    title: 'Module Creation',
    description: 'Build course content',
    icon: Edit,
    color: 'bg-orange-500'
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Final review and launch',
    icon: CheckSquare,
    color: 'bg-red-500'
  }
];

// Course Templates
const COURSE_TEMPLATES = [
  {
    id: 'beginner-friendly',
    name: 'Beginner-Friendly Course',
    description: 'Perfect for teaching fundamentals with step-by-step progression',
    icon: Users,
    modules: 6,
    duration: '4-6 weeks',
    features: ['Interactive exercises', 'Progress tracking', 'Simple quizzes']
  },
  {
    id: 'intensive-bootcamp',
    name: 'Intensive Bootcamp',
    description: 'Fast-paced comprehensive training for motivated learners',
    icon: Target,
    modules: 12,
    duration: '8-12 weeks', 
    features: ['Hands-on projects', 'Advanced quizzes', 'Certification']
  },
  {
    id: 'micro-learning',
    name: 'Micro-Learning Series',
    description: 'Short, focused lessons that can be completed quickly',
    icon: Clock,
    modules: 10,
    duration: '2-3 weeks',
    features: ['Bite-sized content', 'Daily challenges', 'Quick assessments']
  },
  {
    id: 'custom',
    name: 'Custom Course',
    description: 'Start from scratch and build exactly what you need',
    icon: Wand2,
    modules: 0,
    duration: 'Flexible',
    features: ['Complete customization', 'AI assistance', 'Flexible structure']
  }
];

const initialModuleState: ModuleType = {
  id: '',
  title: '',
  description: '',
  contentType: 'video',
  estimatedTime: '1 hour',
  subtopics: [],
  practiceTask: '',
  videoLinks: [],
  contentUrl: '',
};

// Wizard Step Components
interface CourseSetupStepProps {
  courseTitle: string;
  setCourseTitle: (value: string) => void;
  courseCategory: string;
  setCourseCategory: (value: string) => void;
  courseDescriptionText: string;
  setCourseDescriptionText: (value: string) => void;
  coverImageUrl: string;
  setCoverImageUrl: (value: string) => void;
  courseVisibility: CourseVisibility;
  setCourseVisibility: (value: CourseVisibility) => void;
  selectedTemplate: string | null;
  setSelectedTemplate: (value: string | null) => void;
  estimatedDurationWeeks: number;
  setEstimatedDurationWeeks: (value: number) => void;
}

function CourseSetupStep({
  courseTitle,
  setCourseTitle,
  courseCategory,
  setCourseCategory,
  courseDescriptionText,
  setCourseDescriptionText,
  coverImageUrl,
  setCoverImageUrl,
  courseVisibility,
  setCourseVisibility,
  selectedTemplate,
  setSelectedTemplate,
  estimatedDurationWeeks,
  setEstimatedDurationWeeks,
}: CourseSetupStepProps) {
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose a Course Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COURSE_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedTemplate === template.id ? "ring-2 ring-primary border-primary" : ""
                )}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{template.modules} modules</span>
                        <span>{template.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Basic Course Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="courseTitle">Course Title *</Label>
          <Input
            id="courseTitle"
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="e.g., Introduction to Web Development"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseCategory">Category *</Label>
          <Input
            id="courseCategory"
            type="text"
            value={courseCategory}
            onChange={(e) => setCourseCategory(e.target.value)}
            placeholder="e.g., Programming, Design, Business"
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="courseDescription">Course Description</Label>
        <Textarea
          id="courseDescription"
          value={courseDescriptionText}
          onChange={(e) => setCourseDescriptionText(e.target.value)}
          placeholder="What will students learn in this course?"
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Course Visibility</Label>
          <RadioGroup value={courseVisibility} onValueChange={(value: CourseVisibility) => setCourseVisibility(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private (only you can see)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shared" id="shared" />
              <Label htmlFor="shared">Shared (via link)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public (discoverable)</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Estimated Duration (weeks)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="52"
            value={estimatedDurationWeeks}
            onChange={(e) => setEstimatedDurationWeeks(parseInt(e.target.value) || 1)}
            className="w-full"
          />
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex items-center space-x-4">
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Course cover"
              className="w-24 h-24 object-cover rounded-lg border"
            />
          )}
          <div className="flex-1">
            <Input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter an image URL for your course cover
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentPlanningStep({
  modules,
  setModules,
  courseTitle,
  courseCategory,
  estimatedDurationWeeks,
  selectedTemplate,
  wizardData,
  setWizardData,
}: {
  modules: ModuleType[];
  setModules: (modules: ModuleType[]) => void;
  courseTitle: string;
  courseCategory: string;
  estimatedDurationWeeks: number;
  selectedTemplate: string | null;
  wizardData: any;
  setWizardData: (data: any) => void;
}) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCourseStructure = async () => {
    if (!courseTitle.trim()) {
      toast({ title: "Missing Information", description: "Please enter a course title first.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate basic module structure based on template
      const template = COURSE_TEMPLATES.find(t => t.id === selectedTemplate);
      const moduleCount = template?.modules || 6;
      
      const newModules: ModuleType[] = [];
      for (let i = 1; i <= moduleCount; i++) {
        newModules.push({
          ...initialModuleState,
          id: uuidv4(),
          title: `Module ${i}: ${courseCategory} Fundamentals ${i}`,
          description: `Learn essential concepts for ${courseCategory.toLowerCase()}`,
          estimatedTime: '2 hours',
        });
      }
      
      setModules(newModules);
      toast({ title: "Success", description: `Generated ${moduleCount} modules based on your template.` });
    } catch (error) {
      console.error('Failed to generate course structure:', error);
      toast({ title: "Generation Failed", description: "Could not generate course structure.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const addModule = () => {
    const newModule: ModuleType = {
      ...initialModuleState,
      id: uuidv4(),
      title: `Module ${modules.length + 1}`,
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, field: string, value: any) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Course Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Define Your Course Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="courseGoals">Learning Objectives</Label>
            <Textarea
              id="courseGoals"
              value={wizardData.courseGoals}
              onChange={(e) => setWizardData({...wizardData, courseGoals: e.target.value})}
              placeholder="What will students be able to do after completing this course?"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Textarea
              id="targetAudience"
              value={wizardData.targetAudience}
              onChange={(e) => setWizardData({...wizardData, targetAudience: e.target.value})}
              placeholder="Who is this course designed for?"
              className="min-h-[80px]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prerequisites">Prerequisites</Label>
          <Textarea
            id="prerequisites"
            value={wizardData.prerequisites}
            onChange={(e) => setWizardData({...wizardData, prerequisites: e.target.value})}
            placeholder="What should students know before starting this course?"
            className="min-h-[60px]"
          />
        </div>
      </div>

      <Separator />

      {/* Module Planning */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Course Structure</h3>
          <div className="space-x-2">
            <Button onClick={generateCourseStructure} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Structure
            </Button>
            <Button onClick={addModule} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        </div>

        {modules.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h4 className="text-lg font-medium">No modules yet</h4>
                <p className="text-muted-foreground">
                  Start by generating a course structure or adding modules manually
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card key={module.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Module {index + 1}</Badge>
                      <Input
                        value={module.title}
                        onChange={(e) => updateModule(index, 'title', e.target.value)}
                        placeholder="Module title"
                        className="font-medium"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModule(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={module.description}
                    onChange={(e) => updateModule(index, 'description', e.target.value)}
                    placeholder="What will students learn in this module?"
                    className="min-h-[60px]"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <Select
                        value={module.contentType}
                        onValueChange={(value) => updateModule(index, 'contentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Time</Label>
                      <Input
                        value={module.estimatedTime}
                        onChange={(e) => updateModule(index, 'estimatedTime', e.target.value)}
                        placeholder="e.g., 1 hour"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceGatheringStep({ 
  videoSearchTopic, 
  setVideoSearchTopic, 
  aiSuggestedVideosList, 
  setAiSuggestedVideosList,
  loadingAiVideos,
  setLoadingAiVideos,
  errorAiVideos,
  setErrorAiVideos,
  manualVideoForm,
  setManualVideoForm,
  userPickedVideosList,
  setUserPickedVideosList,
  courseVideoPool,
  setCourseVideoPool,
  handleAiVideoSearch,
  handleAddManualVideo,
  user,
  toast,
  modules,
  selectedModuleForResource,
  setSelectedModuleForResource,
  moduleResources,
  assignVideoToModule,
  removeVideoFromModule,
  handleFileImport,
  uploadedDocuments,
  setUploadedDocuments
}: any) {
  const [activeTab, setActiveTab] = useState<'videos' | 'documents' | 'import'>('videos');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gather Learning Resources</h3>
        <p className="text-muted-foreground">
          Search for relevant videos and materials, then assign them to specific modules.
        </p>
      </div>

      {/* Resource Type Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'videos' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('videos')}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Videos
        </Button>
        <Button
          variant={activeTab === 'documents' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('documents')}
          className="flex items-center gap-2"
        >
          <FileIcon className="h-4 w-4" />
          Documents
        </Button>
        <Button
          variant={activeTab === 'import' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('import')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import Course
        </Button>
      </div>

      {/* Module Selector */}
      {modules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assign Resources to Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <Button
                variant={selectedModuleForResource === null ? 'default' : 'outline'}
                onClick={() => setSelectedModuleForResource(null)}
                size="sm"
              >
                General Pool
              </Button>
              {modules.map((module: ModuleType, index: number) => (
                <Button
                  key={module.id}
                  variant={selectedModuleForResource === module.id ? 'default' : 'outline'}
                  onClick={() => setSelectedModuleForResource(module.id)}
                  size="sm"
                  className="justify-start"
                >
                  Module {index + 1}
                </Button>
              ))}
            </div>
            {selectedModuleForResource && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Selected: {modules.find((m: ModuleType) => m.id === selectedModuleForResource)?.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Resources added will be assigned to this module
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {/* AI Video Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Video Search
              </CardTitle>
              <CardDescription>
                Let AI find relevant educational videos for your course topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={videoSearchTopic}
                  onChange={(e) => setVideoSearchTopic(e.target.value)}
                  placeholder="e.g., JavaScript basics, React components"
                  className="flex-1"
                />
                <Button onClick={handleAiVideoSearch} disabled={loadingAiVideos}>
                  {loadingAiVideos ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>

              {errorAiVideos && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{errorAiVideos}</p>
                </div>
              )}

              {aiSuggestedVideosList.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">AI Suggested Videos</h4>
                  <div className="space-y-2">
                    {aiSuggestedVideosList.map((video: VideoLink, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            <h5 className="font-medium text-sm">{video.title}</h5>
                            <p className="text-xs text-muted-foreground">{video.creator}</p>
                            <a 
                              href={video.youtubeEmbedUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {video.youtubeEmbedUrl}
                            </a>
                          </div>
                          <div className="flex gap-2">
                            {selectedModuleForResource ? (
                              <Button
                                size="sm"
                                onClick={() => assignVideoToModule(video, selectedModuleForResource)}
                              >
                                Assign to Module
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!userPickedVideosList.find((v: VideoLink) => v.youtubeEmbedUrl === video.youtubeEmbedUrl)) {
                                    setUserPickedVideosList([...userPickedVideosList, video]);
                                    toast({ title: "Video Added", description: "Video added to your course pool." });
                                  }
                                }}
                              >
                                Add to Pool
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Video Addition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Video Manually
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video URL *</Label>
                  <Input
                    value={manualVideoForm.url}
                    onChange={(e) => setManualVideoForm({...manualVideoForm, url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Creator/Channel</Label>
                  <Input
                    value={manualVideoForm.creator}
                    onChange={(e) => setManualVideoForm({...manualVideoForm, creator: e.target.value})}
                    placeholder="Channel name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={manualVideoForm.notes}
                  onChange={(e) => setManualVideoForm({...manualVideoForm, notes: e.target.value})}
                  placeholder="Why is this video relevant to your course?"
                  className="min-h-[60px]"
                />
              </div>
              <Button onClick={handleAddManualVideo}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {selectedModuleForResource ? 'Add to Module' : 'Add to Pool'}
              </Button>
            </CardContent>
          </Card>

          {/* Video Pool & Module Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Video Pool */}
            {userPickedVideosList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>General Video Pool ({userPickedVideosList.length})</CardTitle>
                  <CardDescription>
                    Videos available for assignment to modules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userPickedVideosList.map((video: VideoLink, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{video.title || 'Untitled Video'}</p>
                          <p className="text-xs text-muted-foreground">{video.creator}</p>
                        </div>
                        <div className="flex gap-2">
                          {modules.length > 0 && (
                            <div className="flex gap-1">
                              {modules.slice(0, 3).map((module: ModuleType, mIndex: number) => (
                                <Button
                                  key={module.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => assignVideoToModule(video, module.id)}
                                  className="text-xs"
                                >
                                  M{mIndex + 1}
                                </Button>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserPickedVideosList(userPickedVideosList.filter((_: VideoLink, i: number) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Module Assignments */}
            {Object.keys(moduleResources).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Module Assignments</CardTitle>
                  <CardDescription>
                    Videos assigned to specific modules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(moduleResources).map(([moduleId, resources]: [string, any]) => {
                      const module = modules.find((m: ModuleType) => m.id === moduleId);
                      if (!module || resources.videos.length === 0) return null;
                      
                      return (
                        <div key={moduleId} className="border rounded-lg p-3">
                          <h4 className="font-medium text-sm mb-2">{module.title}</h4>
                          <div className="space-y-1">
                            {resources.videos.map((video: VideoLink, vIndex: number) => (
                              <div key={vIndex} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span className="text-sm">{video.title}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeVideoFromModule(video.youtubeEmbedUrl, moduleId)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              Document Management
            </CardTitle>
            <CardDescription>
              Upload and manage documents for your course modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop documents here, or click to browse
              </p>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, DOC, DOCX, TXT files
              </p>
            </div>
            
            {uploadedDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Documents</h4>
                {uploadedDocuments.map((doc: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <div className="flex gap-2">
                      {selectedModuleForResource && (
                        <Button size="sm" variant="outline">
                          Assign to Module
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Course Structure
            </CardTitle>
            <CardDescription>
              Import course modules from .txt, .yaml, .md, .csv, or .json files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drop your course file here, or click to browse
              </p>
              <input
                type="file"
                accept=".txt,.yaml,.yml,.md,.csv,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileImport(file);
                }}
                className="hidden"
                id="course-import"
              />
              <label htmlFor="course-import">
                <Button variant="outline" asChild>
                  <span>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports .txt, .yaml, .md, .csv formats
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Supported Formats:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>.yaml/.yml</strong> - Structured course data</li>
                  <li>• <strong>.md</strong> - Markdown with ## headers for modules</li>
                  <li>• <strong>.csv</strong> - Comma-separated values</li>
                  <li>• <strong>.txt</strong> - Simple text, one module per line</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Example YAML:</h4>
                <pre className="text-xs bg-muted p-2 rounded">
{`- title: Module 1
  description: Introduction
  estimatedTime: 2 hours
- title: Module 2
  description: Advanced concepts`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ModuleCreationStep({ modules, setModules, courseVideoPool, ...props }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Build Your Course Modules</h3>
        <p className="text-muted-foreground">
          Create detailed content for each module, add resources, and generate quizzes.
        </p>
      </div>

      {modules.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Edit className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h4 className="text-lg font-medium">No modules to edit</h4>
              <p className="text-muted-foreground">
                Go back to Content Planning to create your course structure first
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module: ModuleType, index: number) => (
            <Card key={module.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">Module {index + 1}</Badge>
                    <h4 className="text-lg font-medium">{module.title || 'Untitled Module'}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    {props.renderModuleContentTypeIcon?.(module.contentType)}
                    <span className="text-sm text-muted-foreground">{module.estimatedTime}</span>
                  </div>
                </div>

                {module.description && (
                  <p className="text-muted-foreground">{module.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Content & Resources</h5>
                    {(module.videoLinks?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        {module.videoLinks?.map((video: VideoLink, vIndex: number) => (
                          <div key={vIndex} className="p-2 border rounded text-sm">
                            <p className="font-medium">{video.title}</p>
                            <p className="text-xs text-muted-foreground">{video.creator}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No videos assigned yet</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">Learning Objectives</h5>
                    {(module.subtopics?.length || 0) > 0 ? (
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {module.subtopics?.map((subtopic: string, sIndex: number) => (
                          <li key={sIndex}>{subtopic}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No subtopics defined</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Brain className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewPublishStep({ 
  courseTitle, 
  courseCategory, 
  courseDescriptionText,
  setCourseDescriptionText,
  modules, 
  courseVisibility,
  setCourseVisibility,
  courseStatus,
  setCourseStatus,
  handleSaveCourse,
  currentCourseId,
  user,
  toast,
  ...props 
}: any) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await handleSaveCourse();
      setCourseStatus('submitted');
      toast({ title: "Success", description: "Course submitted for review!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to publish course.", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Review & Publish</h3>
        <p className="text-muted-foreground">
          Review your course details and publish when you're ready to share it with learners.
        </p>
      </div>

      {/* Course Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Course Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-sm mb-2">Course Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Title:</strong> {courseTitle || 'Untitled Course'}</div>
                <div><strong>Category:</strong> {courseCategory || 'Uncategorized'}</div>
                <div><strong>Modules:</strong> {modules.length}</div>
                <div><strong>Visibility:</strong> {courseVisibility}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Course Description</h4>
              <Textarea
                value={courseDescriptionText}
                onChange={(e) => setCourseDescriptionText(e.target.value)}
                placeholder="Add a compelling description for your course..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Modules Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <p className="text-muted-foreground">No modules created yet.</p>
          ) : (
            <div className="space-y-3">
              {modules.map((module: ModuleType, index: number) => (
                <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Module {index + 1}</Badge>
                      <span className="font-medium">{module.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {module.estimatedTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Course Visibility</Label>
            <RadioGroup value={courseVisibility} onValueChange={(value: CourseVisibility) => setCourseVisibility(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private-review" />
                <Label htmlFor="private-review">Private (only you can see)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shared" id="shared-review" />
                <Label htmlFor="shared-review">Shared (via link)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public-review" />
                <Label htmlFor="public-review">Public (discoverable)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button onClick={handleSaveCourse} variant="outline" className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={isPublishing || !courseTitle.trim() || modules.length === 0}
              className="flex-1"
            >
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publish Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CourseDesignerContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState({
    courseGoals: '',
    targetAudience: '',
    prerequisites: '',
    learningOutcomes: []
  });

  // Course Data State
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDescriptionText, setCourseDescriptionText] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [courseVisibility, setCourseVisibility] = useState<CourseVisibility>("private");
  const [courseStatus, setCourseStatus] = useState<CourseType['status']>("draft");
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [originalAuthorId, setOriginalAuthorId] = useState<string | null>(null);
  const [suggestedSchedule, setSuggestedSchedule] = useState<string>('');
  const [estimatedDurationWeeks, setEstimatedDurationWeeks] = useState<number>(12);

  // Video Curation State
  const [videoSearchTopic, setVideoSearchTopic] = useState('');
  const [aiSuggestedVideosList, setAiSuggestedVideosList] = useState<VideoLink[]>([]);
  const [loadingAiVideos, setLoadingAiVideos] = useState(false);
  const [errorAiVideos, setErrorAiVideos] = useState<string | null>(null);
  const [manualVideoForm, setManualVideoForm] = useState<ManualVideoFormState>({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
  const [userPickedVideosList, setUserPickedVideosList] = useState<VideoLink[]>([]);
  const [courseVideoPool, setCourseVideoPool] = useState<VideoLink[]>([]);

  // Enhanced Resource Management State
  const [selectedModuleForResource, setSelectedModuleForResource] = useState<string | null>(null);
  const [moduleResources, setModuleResources] = useState<Record<string, { videos: VideoLink[], documents: any[] }>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  
  // Enhanced Resource Management State
  const [selectedModuleForAssignment, setSelectedModuleForAssignment] = useState<string | null>(null);
  const [isAssignResourcesDialogOpen, setIsAssignResourcesDialogOpen] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [documentPool, setDocumentPool] = useState<Array<{
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'txt' | 'md';
    url: string;
    uploadedAt: string;
  }>>([]);
  
  // File Import State
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Module Editor State
  const [isModuleEditorOpen, setIsModuleEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleType | null>(null);
  const [currentModuleForm, setCurrentModuleForm] = useState<ModuleType>(initialModuleState);
  const [loadingModuleSuggestions, setLoadingModuleSuggestions] = useState<'subtopics' | 'task' | 'videos' | null>(null);
  const [moduleSubtopicSuggestions, setModuleSubtopicSuggestions] = useState<string[]>([]);
  const [modulePracticeTaskSuggestion, setModulePracticeTaskSuggestion] = useState<string>('');
  const [moduleVideoSuggestions, setModuleVideoSuggestions] = useState<VideoLink[]>([]);

  const [loadingCourseSchedule, setLoadingCourseSchedule] = useState(false);
  const [errorCourseSchedule, setErrorCourseSchedule] = useState<string | null>(null);
  const [isCoverImageDialogOpen, setIsCoverImageDialogOpen] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  const resetCourseForm = useCallback(() => {
    setCurrentCourseId(null);
    setCourseTitle('');
    setCourseCategory('');
    setCourseDescriptionText('');
    setCoverImageUrl('');
    setCourseVisibility('private');
    setCourseStatus('draft');
    setModules([]);
    setCourseVideoPool([]);
    setOriginalAuthorId(null);
    setAiSuggestedVideosList([]);
    setErrorAiVideos(null);
    setEditingModule(null);
    setCurrentModuleForm(initialModuleState);
    setIsModuleEditorOpen(false);
    setSuggestedSchedule('');
    setEstimatedDurationWeeks(12);
    setErrorCourseSchedule(null);
    router.replace('/course-designer', { scroll: false });
  }, [router]);

  // Additional wizard handlers
  const handleAiVideoSearch = async () => {
    if (!videoSearchTopic.trim()) {
      toast({ title: "Missing Topic", description: "Please enter a search topic.", variant: "destructive" });
      return;
    }

    setLoadingAiVideos(true);
    setErrorAiVideos(null);
    
    try {
      const input: SuggestYoutubeVideosForTopicInput = {
        searchQuery: videoSearchTopic,
        numberOfSuggestions: 5,
      };
      
      const result = await suggestYoutubeVideosForTopic(input);
      setAiSuggestedVideosList(result.suggestedVideos || []);
      
      if (result.suggestedVideos?.length === 0) {
        toast({ title: "No Results", description: "No videos found for this topic." });
      }
    } catch (error) {
      console.error('AI video search failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to search for videos';
      setErrorAiVideos(errorMsg);
      toast({ title: "Search Failed", description: errorMsg, variant: "destructive" });
    } finally {
      setLoadingAiVideos(false);
    }
  };

  const handleAddManualVideo = () => {
    if (!manualVideoForm.url.trim()) {
      toast({ title: "Missing URL", description: "Please enter a video URL.", variant: "destructive" });
      return;
    }

    const newVideo: VideoLink = {
      langCode: 'en',
      langName: 'English',
      youtubeEmbedUrl: manualVideoForm.url,
      title: manualVideoForm.url, // Will be updated with actual title if available
      creator: manualVideoForm.creator || 'Unknown',
      notes: manualVideoForm.notes,
    };

    setUserPickedVideosList([...userPickedVideosList, newVideo]);
    setManualVideoForm({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
    toast({ title: "Video Added", description: "Video added to your course pool." });
  };

  const handleAddModule = () => {
    const newModule: ModuleType = {
      ...initialModuleState,
      id: uuidv4(),
      title: `Module ${modules.length + 1}`,
    };
    setModules([...modules, newModule]);
  };

  const handleEditModule = (module: ModuleType) => {
    setEditingModule(module);
    setCurrentModuleForm(module);
    setIsModuleEditorOpen(true);
  };

  const handleModuleFieldChange = (field: string, value: any) => {
    setCurrentModuleForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCancelModuleEdit = () => {
    setIsModuleEditorOpen(false);
    setEditingModule(null);
    setCurrentModuleForm(initialModuleState);
  };

  const handleGenerateModuleSubtopics = async () => {
    if (!currentModuleForm.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a module title first.", variant: "destructive" });
      return;
    }

    setLoadingModuleSuggestions('subtopics');
    try {
      const input: SuggestModuleSubtopicsInput = {
        moduleTitle: currentModuleForm.title,
        moduleDescription: currentModuleForm.description,
        courseTopic: courseTitle,
        numberOfSuggestions: 5,
      };
      
      const result = await suggestModuleSubtopics(input);
      setModuleSubtopicSuggestions(result.subtopics || []);
    } catch (error) {
      console.error('Failed to generate subtopics:', error);
      toast({ title: "Generation Failed", description: "Could not generate subtopics.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  const handleGenerateModulePracticeTask = async () => {
    if (!currentModuleForm.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a module title first.", variant: "destructive" });
      return;
    }

    setLoadingModuleSuggestions('task');
    try {
      const input: SuggestModulePracticeTaskInput = {
        moduleTitle: currentModuleForm.title,
        moduleDescription: currentModuleForm.description,
        subtopics: currentModuleForm.subtopics || [],
        courseTopic: courseTitle,
      };
      
      const result = await suggestModulePracticeTask(input);
      setModulePracticeTaskSuggestion(result.practiceTask || '');
    } catch (error) {
      console.error('Failed to generate practice task:', error);
      toast({ title: "Generation Failed", description: "Could not generate practice task.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  const handleFindModuleVideos = async () => {
    if (!currentModuleForm.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a module title first.", variant: "destructive" });
      return;
    }

    setLoadingModuleSuggestions('videos');
    try {
      const input: FindYoutubeVideosInput = {
        moduleTitle: currentModuleForm.title,
        moduleDescription: currentModuleForm.description,
        preferredLanguage: 'English',
      };
      
      const result = await findYoutubeVideosForModule(input);
      setModuleVideoSuggestions(result.videos || []);
    } catch (error) {
      console.error('Failed to find videos:', error);
      toast({ title: "Search Failed", description: "Could not find videos for this module.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  // Enhanced resource management functions
  const assignVideoToModule = (video: VideoLink, moduleId: string) => {
    setModuleResources(prev => {
      const moduleRes = prev[moduleId] || { videos: [], documents: [] };
      const isAlreadyAssigned = moduleRes.videos.some(v => v.youtubeEmbedUrl === video.youtubeEmbedUrl);
      
      if (isAlreadyAssigned) {
        toast({ title: "Already Assigned", description: "This video is already assigned to this module." });
        return prev;
      }
      
      return {
        ...prev,
        [moduleId]: {
          ...moduleRes,
          videos: [...moduleRes.videos, video]
        }
      };
    });
    
    toast({ title: "Video Assigned", description: "Video successfully assigned to module." });
  };

  const removeVideoFromModule = (videoUrl: string, moduleId: string) => {
    setModuleResources(prev => {
      const moduleRes = prev[moduleId] || { videos: [], documents: [] };
      return {
        ...prev,
        [moduleId]: {
          ...moduleRes,
          videos: moduleRes.videos.filter(v => v.youtubeEmbedUrl !== videoUrl)
        }
      };
    });
  };

  const handleFileImport = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const supportedFormats = ['txt', 'yaml', 'yml', 'md', 'csv', 'json'];
    
    if (!supportedFormats.includes(fileExtension || '')) {
      toast({ title: "Unsupported Format", description: "Please upload a .txt, .yaml, .md, .csv, or .json file.", variant: "destructive" });
      return;
    }

    try {
      const content = await file.text();
      setImportPreview(content);
      
      // Use the enhanced import system
      const parseResult = await importCourseFile(file);
      
      if (parseResult && parseResult.length > 0) {
        // Convert CourseImportPreview[] to ModuleType[]
        const newModules: ModuleType[] = parseResult.map((preview, index) => ({
          id: uuidv4(),
          title: preview.topic || `Module ${index + 1}`,
          description: preview.description || `Content extracted from ${file.name}`,
          contentType: 'video' as const,
          estimatedTime: preview.duration || '1 hour',
          subtopics: preview.subtopics || [],
          practiceTask: preview.tasks?.join('\n') || '',
          videoLinks: preview.youtubeLinks.map((link, linkIndex) => ({
            id: `video-${index}-${linkIndex}`,
            title: `Video for ${preview.topic}`,
            youtubeEmbedUrl: link,
            langCode: 'en',
            langName: 'English',
            creator: 'Imported'
          })),
          contentUrl: '',
        }));
        
        setModules([...modules, ...newModules]);
        
        // Calculate link statistics
        const totalVideoLinks = parseResult.reduce((sum, preview) => sum + preview.youtubeLinks.length, 0);
        const totalDocLinks = parseResult.reduce((sum, preview) => sum + preview.pdfLinks.length + preview.docLinks.length, 0);
        
        toast({ 
          title: "Enhanced Import Successful", 
          description: `Imported ${newModules.length} modules with ${totalVideoLinks} video links and ${totalDocLinks} document links from ${file.name}. The AI-powered extraction found comprehensive content across all sections.` 
        });
        
        // Try to set course title from first topic if available
        if (parseResult[0]?.topic && !courseTitle) {
          setCourseTitle(`Course: ${parseResult[0].topic}`);
        }
      } else {
        toast({ 
          title: "No Content Found", 
          description: "No modules or content could be extracted from the file." 
        });
      }
    } catch (error) {
      console.error('Failed to import file:', error);
      toast({ title: "Import Failed", description: "Could not parse the file content.", variant: "destructive" });
    }
  };

  const loadCourseForEditing = useCallback((courseId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "You need to be logged in.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsLoadingCourse(true);
    const courseToEdit = getCourseById(courseId);

    if (courseToEdit) {
      if (user.role !== 'admin' && courseToEdit.authorId !== user.id) {
        toast({ title: "Unauthorized", description: "You are not authorized to edit this course.", variant: "destructive" });
        setIsLoadingCourse(false);
        router.push('/course-designer');
        return;
      }

      setCurrentCourseId(courseToEdit.id);
      setCourseTitle(courseToEdit.title);
      setCourseCategory(courseToEdit.category || '');
      setCourseDescriptionText(courseToEdit.description || '');
      setCoverImageUrl(courseToEdit.imageUrl || '');
      setCourseVisibility(courseToEdit.visibility || 'private');
      setCourseStatus(courseToEdit.status || 'draft');
      setModules(courseToEdit.modules || []);
      setOriginalAuthorId(courseToEdit.authorId || null);
      setSuggestedSchedule(courseToEdit.suggestedSchedule || '');
      setEstimatedDurationWeeks(courseToEdit.duration ? parseInt(courseToEdit.duration.split(" ")[0]) : (courseToEdit.modules?.length || 12));

      const existingCourseVideos = new Map<string, VideoLink>();
      (courseToEdit.modules || []).forEach(module => {
        if (module.contentUrl && module.contentType === 'video') {
          const mainVideoFromModule: VideoLink = {
            id: `module-main-${module.id}`,
            youtubeEmbedUrl: module.contentUrl,
            title: `${module.title} (Main Video)`,
            langCode: 'unk',
            langName: 'Unknown',
            isPlaylist: module.contentUrl.includes('videoseries?list=')
          };
          if (!existingCourseVideos.has(mainVideoFromModule.youtubeEmbedUrl)) {
            existingCourseVideos.set(mainVideoFromModule.youtubeEmbedUrl, mainVideoFromModule);
          }
        }
        (module.videoLinks || []).forEach(video => {
          if (!existingCourseVideos.has(video.youtubeEmbedUrl)) {
            existingCourseVideos.set(video.youtubeEmbedUrl, video);
          }
        });
      });
      setCourseVideoPool(Array.from(existingCourseVideos.values()));

      toast({ title: "Course Loaded", description: `Editing "${courseToEdit.title}".` });
    } else {
      toast({ title: "Error", description: `Course with ID ${courseId} not found.`, variant: "destructive" });
      resetCourseForm();
    }
    setIsLoadingCourse(false);
  }, [user, toast, router, resetCourseForm]);

  useEffect(() => {
    const courseIdFromQuery = searchParams.get('courseId');
    if (courseIdFromQuery && !isLoadingCourse) {
      if (courseIdFromQuery !== currentCourseId || !currentCourseId) {
        loadCourseForEditing(courseIdFromQuery);
      }
    }
  }, [searchParams, loadCourseForEditing, currentCourseId, isLoadingCourse]);

  useEffect(() => {
    if (user && (user as any).customVideoLinks) {
      setUserPickedVideosList((user as any).customVideoLinks);
    }
  }, [user]);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [isMultiCourseImport, setIsMultiCourseImport] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Import file parsers
  const parseTextFile = (content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    const result: any = { title: '', description: '', modules: [], videos: [], documents: [] };
    
    let currentSection = '';
    let currentModule: any = null;
    
    for (let line of lines) {
      if (line.startsWith('# ') || line.startsWith('Title:')) {
        result.title = line.replace(/^(# |Title:\s*)/i, '');
      } else if (line.startsWith('## ') || line.startsWith('Description:')) {
        result.description = line.replace(/^(## |Description:\s*)/i, '');
      } else if (line.startsWith('### ') || line.toLowerCase().includes('module')) {
        if (currentModule) result.modules.push(currentModule);
        currentModule = {
          id: uuidv4(),
          title: line.replace(/^### /i, '').replace(/module\s*\d*:?\s*/i, ''),
          description: '',
          contentType: 'video' as const,
          estimatedTime: '1 hour',
          subtopics: [],
          practiceTask: '',
          videoLinks: [],
          contentUrl: '',
        };
      } else if (line.startsWith('http') && (line.includes('youtube') || line.includes('youtu.be'))) {
        const video = {
          langCode: 'en',
          langName: 'English',
          youtubeEmbedUrl: line.includes('embed') ? line : line.replace('watch?v=', 'embed/'),
          title: 'Video',
          creator: 'Unknown',
        };
        if (currentModule) {
          currentModule.videoLinks.push(video);
        } else {
          result.videos.push(video);
        }
      } else if (line.startsWith('http') && (line.includes('.pdf') || line.includes('.doc'))) {
        result.documents.push({ url: line, title: 'Document' });
      } else if (currentModule && line.startsWith('- ')) {
        currentModule.subtopics.push(line.replace('- ', ''));
      }
    }
    
    if (currentModule) result.modules.push(currentModule);
    return result;
  };

  const parseYamlFile = (content: string) => {
    try {
      // Enhanced YAML parser for both single and multi-course structure
      const lines = content.split('\n');
      
      // First, detect if this is a multi-course YAML file
      const isMultiCourse = content.includes('Overview:') || 
                           content.match(/^[A-Za-z0-9\s&]+:$/m) ||
                           content.includes('Course:');
      
      if (isMultiCourse) {
        return parseMultiCourseYaml(content);
      } else {
        return parseSingleCourseYaml(content);
      }
    } catch (error) {
      throw new Error(`Invalid YAML format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const parseMultiCourseYaml = (content: string) => {
    const lines = content.split('\n');
    const courses: any[] = [];
    let currentCourse: any = null;
    let currentModule: any = null;
    let currentSection = '';
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Detect course sections (e.g., "Full-Stack & DSA:", "English Communication:")
      if (trimmed.match(/^[A-Za-z0-9\s&]+:$/) && !trimmed.includes('Week:') && !trimmed.includes('Tech Topic:')) {
        if (currentCourse && currentCourse.modules.length > 0) {
          courses.push(currentCourse);
        }
        
        currentSection = trimmed.replace(':', '');
        currentCourse = {
          title: currentSection,
          description: `Course covering ${currentSection}`,
          modules: [],
          videos: [],
          documents: []
        };
        currentModule = null;
      }
      
      // Parse weekly modules for curriculum structure
      else if (trimmed.startsWith('- Week:') && currentCourse) {
        if (currentModule) currentCourse.modules.push(currentModule);
        
        const weekNumber = trimmed.replace('- Week:', '').trim();
        currentModule = {
          id: uuidv4(),
          title: `Week ${weekNumber}`,
          description: '',
          contentType: 'video' as const,
          estimatedTime: '1 week',
          subtopics: [],
          practiceTask: '',
          videoLinks: [],
          contentUrl: '',
        };
      }
      
      // Parse module details
      else if (currentModule) {
        if (trimmed.startsWith('Tech Topic:')) {
          const topic = trimmed.replace('Tech Topic:', '').trim().replace(/['"]/g, '');
          currentModule.title = `${currentModule.title}: ${topic}`;
          currentModule.description = topic;
        }
        else if (trimmed.startsWith('Subtopics:')) {
          const subtopics = trimmed.replace('Subtopics:', '').trim().split(',');
          currentModule.subtopics = subtopics.map((s: string) => s.trim());
        }
        else if (trimmed.startsWith('Practice Task:')) {
          currentModule.practiceTask = trimmed.replace('Practice Task:', '').trim();
        }
        else if (trimmed.includes('Resource Link:') && trimmed.includes('http')) {
          const url = trimmed.match(/https?:\/\/[^\s]+/)?.[0];
          const isHinglish = trimmed.includes('Hinglish');
          
          if (url) {
            let embedUrl = url;
            
            // Convert YouTube URLs to embed format
            if (url.includes('youtube.com/playlist')) {
              const listMatch = url.match(/[?&]list=([^&]+)/);
              if (listMatch) {
                embedUrl = `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
              }
            } else if (url.includes('watch?v=')) {
              const videoMatch = url.match(/[?&]v=([^&]+)/);
              if (videoMatch) {
                embedUrl = `https://www.youtube.com/embed/${videoMatch[1]}`;
              }
            } else if (url.includes('youtu.be/')) {
              const videoMatch = url.match(/youtu\.be\/([^?]+)/);
              if (videoMatch) {
                embedUrl = `https://www.youtube.com/embed/${videoMatch[1]}`;
              }
            }
            
            currentModule.videoLinks.push({
              langCode: isHinglish ? 'hi' : 'en',
              langName: isHinglish ? 'Hindi' : 'English',
              youtubeEmbedUrl: embedUrl,
              title: `${isHinglish ? 'Hindi' : 'English'} Tutorial`,
              creator: 'YouTube',
            });
          }
        }
      }
    }
    
    // Add the last course and module
    if (currentModule && currentCourse) currentCourse.modules.push(currentModule);
    if (currentCourse && currentCourse.modules.length > 0) courses.push(currentCourse);
    
    // Return multi-course structure for selection
    return {
      isMultiCourse: true,
      courses: courses,
      totalCourses: courses.length
    };
  };

  const parseSingleCourseYaml = (content: string) => {
    const lines = content.split('\n');
    const result: any = { title: '', description: '', modules: [], videos: [], documents: [] };
    
    let currentModule: any = null;
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.startsWith('title:')) {
        result.title = trimmed.replace('title:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('description:')) {
        result.description = trimmed.replace('description:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('modules:')) {
        // Start modules section
      } else if (trimmed.startsWith('- title:') || trimmed.startsWith('- name:')) {
        if (currentModule) result.modules.push(currentModule);
        currentModule = {
          id: uuidv4(),
          title: trimmed.replace(/^- (title|name):\s*/, '').replace(/['"]/g, ''),
          description: '',
          contentType: 'video' as const,
          estimatedTime: '1 hour',
          subtopics: [],
          practiceTask: '',
          videoLinks: [],
          contentUrl: '',
        };
      } else if (trimmed.startsWith('description:') && currentModule) {
        currentModule.description = trimmed.replace('description:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('videos:') && currentModule) {
        // Videos section for current module
      } else if (trimmed.startsWith('- ') && trimmed.includes('http') && currentModule) {
        const url = trimmed.replace('- ', '').replace(/['"]/g, '');
        if (url.includes('youtube') || url.includes('youtu.be')) {
          let embedUrl = url;
          if (url.includes('playlist')) {
            const listMatch = url.match(/[?&]list=([^&]+)/);
            if (listMatch) {
              embedUrl = `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
            }
          } else if (url.includes('watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/');
          }
          
          currentModule.videoLinks.push({
            langCode: 'en',
            langName: 'English',
            youtubeEmbedUrl: embedUrl,
            title: 'Video Tutorial',
            creator: 'YouTube',
          });
        }
      }
    }
    
    if (currentModule) result.modules.push(currentModule);
    return result;
  };

  const parseMarkdownFile = (content: string) => {
    const lines = content.split('\n');
    const result: any = { title: '', description: '', modules: [], videos: [], documents: [] };
    
    let currentModule: any = null;
    let inCodeBlock = false;
    
    for (let line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) continue;
      
      if (trimmed.startsWith('# ')) {
        result.title = trimmed.replace('# ', '');
      } else if (trimmed.startsWith('## ')) {
        result.description = trimmed.replace('## ', '');
      } else if (trimmed.startsWith('### ')) {
        if (currentModule) result.modules.push(currentModule);
        currentModule = {
          id: uuidv4(),
          title: trimmed.replace('### ', ''),
          description: '',
          contentType: 'video' as const,
          estimatedTime: '1 hour',
          subtopics: [],
          practiceTask: '',
          videoLinks: [],
          contentUrl: '',
        };
      } else if (trimmed.includes('[') && trimmed.includes('](http') && currentModule) {
        // Markdown links
        const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [, title, url] = linkMatch;
          if (url.includes('youtube') || url.includes('youtu.be')) {
            currentModule.videoLinks.push({
              langCode: 'en',
              langName: 'English',
              youtubeEmbedUrl: url.includes('embed') ? url : url.replace('watch?v=', 'embed/'),
              title: title,
              creator: 'Unknown',
            });
          } else if (url.includes('.pdf') || url.includes('.doc')) {
            result.documents.push({ url, title });
          }
        }
      } else if (trimmed.startsWith('- ') && currentModule) {
        currentModule.subtopics.push(trimmed.replace('- ', ''));
      }
    }
    
    if (currentModule) result.modules.push(currentModule);
    return result;
  };

  const parseCsvFile = (content: string) => {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
      const result: any = { title: '', description: '', modules: [], videos: [], documents: [] };
      
      if (lines.length === 0) throw new Error('CSV file is empty');
      if (lines.length < 2) throw new Error('CSV file must have headers and at least one data row');
      
      // Parse CSV headers
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/['"]/g, ''));
      const dataLines = lines.slice(1);
      
      // Validate essential columns
      const hasModuleColumn = headers.some(h => 
        h.includes('module') || h.includes('title') || h.includes('week') || 
        h.includes('lesson') || h.includes('chapter')
      );
      
      if (!hasModuleColumn) {
        throw new Error('CSV must contain a module/title column. Expected headers like: module_title, title, week, lesson, etc.');
      }
      
      // Detect course structure based on headers
      const isWeeklyStructure = headers.some(h => h.includes('week'));
      const isModularStructure = headers.some(h => h.includes('module'));
      const hasTasksColumn = headers.some(h => h.includes('task') || h.includes('assignment') || h.includes('project'));
      const hasTopicsColumn = headers.some(h => h.includes('topic') || h.includes('subject') || h.includes('content'));
      
      // Set course title
      const titleFields = ['course_title', 'title', 'course_name', 'name'];
      let foundTitle = false;
      
      for (const field of titleFields) {
        const titleIndex = headers.findIndex(h => h === field);
        if (titleIndex >= 0 && dataLines[0]) {
          const firstRow = dataLines[0].split(',').map(cell => cell.trim().replace(/['"]/g, ''));
          if (firstRow[titleIndex]) {
            result.title = firstRow[titleIndex];
            foundTitle = true;
            break;
          }
        }
      }
      
      if (!foundTitle) {
        result.title = isWeeklyStructure ? "Multi-Week Course Plan" : 
                      isModularStructure ? "Modular Course" : "Imported Course";
      }
      
      result.description = `Course imported from CSV with ${dataLines.length} ${isWeeklyStructure ? 'weeks' : 'modules'}`;
      
      // Enhanced parsing for different CSV structures
      for (let i = 0; i < dataLines.length; i++) {
        const cells = dataLines[i].split(',').map(cell => cell.trim().replace(/['"]/g, ''));
        
        if (cells.length < headers.length) {
          console.warn(`Row ${i + 2} has fewer columns than headers, skipping`);
          continue;
        }
        
        let moduleTitle = '';
        let moduleDescription = '';
        let tasks = '';
        let topics: string[] = [];
        let videos: VideoLink[] = [];
        let duration = '1 week';
        
        // Parse based on header structure
        headers.forEach((header, index) => {
          const value = cells[index] || '';
          if (!value) return;
          
          switch (true) {
            // Module/Week title
            case header.includes('week'):
              moduleTitle = value.includes('Week') ? value : `Week ${value}`;
              break;
            case header.includes('module'):
            case header.includes('lesson'):
            case header.includes('chapter'):
            case header.includes('title'):
              if (!moduleTitle) moduleTitle = value;
              break;
              
            // Description
            case header.includes('description'):
            case header.includes('overview'):
            case header.includes('summary'):
              moduleDescription = value;
              break;
              
            // Topics and subtopics
            case header.includes('topic'):
            case header.includes('subject'):
            case header.includes('content'):
            case header.includes('subtopic'):
            case header.includes('curriculum'):
              topics.push(...value.split(/[,;]/).map(t => t.trim()).filter(Boolean));
              break;
              
            // Specialized topics
            case header.includes('tech_topic'):
            case header.includes('frontend'):
            case header.includes('backend'):
            case header.includes('dsa'):
            case header.includes('devops'):
            case header.includes('algorithm'):
              topics.push(value);
              break;
              
            // Tasks and assignments
            case header.includes('task'):
            case header.includes('assignment'):
            case header.includes('project'):
            case header.includes('practice'):
            case header.includes('exercise'):
              tasks = value;
              break;
              
            // Video resources
            case header.includes('video'):
            case header.includes('youtube'):
            case header.includes('resource'):
            case header.includes('link'):
              if (value.includes('youtube') || value.includes('youtu.be')) {
                let embedUrl = value;
                
                // Convert to embed format
                if (value.includes('playlist')) {
                  const listMatch = value.match(/[?&]list=([^&]+)/);
                  if (listMatch) {
                    embedUrl = `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
                  }
                } else if (value.includes('watch?v=')) {
                  const videoMatch = value.match(/[?&]v=([^&]+)/);
                  if (videoMatch) {
                    embedUrl = `https://www.youtube.com/embed/${videoMatch[1]}`;
                  }
                }
                
                const isHindi = header.includes('hindi') || header.includes('hinglish');
                videos.push({
                  langCode: isHindi ? 'hi' : 'en',
                  langName: isHindi ? 'Hindi' : 'English',
                  youtubeEmbedUrl: embedUrl,
                  title: `${isHindi ? 'Hindi' : 'English'} Tutorial`,
                  creator: 'YouTube',
                });
              }
              break;
              
            // Duration
            case header.includes('duration'):
            case header.includes('time'):
            case header.includes('hours'):
            case header.includes('weeks'):
              duration = value;
              break;
          }
        });
        
        // Create module if we have a title
        if (moduleTitle) {
          const module = {
            id: uuidv4(),
            title: moduleTitle,
            description: moduleDescription || topics.slice(0, 3).join(', '),
            contentType: 'video' as const,
            estimatedTime: duration,
            subtopics: topics,
            practiceTask: tasks,
            videoLinks: videos,
            contentUrl: '',
          };
          
          result.modules.push(module);
        }
      }
      
      if (result.modules.length === 0) {
        throw new Error('No valid modules found in CSV. Please check your data format.');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Invalid CSV format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    setImportPreview(null);
    setIsMultiCourseImport(false);
    setAvailableCourses([]);
    setSelectedCourseIndex(null);
    
    try {
      const content = await file.text();
      let parsed: any = {};
      
      // Validate file content
      if (!content.trim()) {
        throw new Error('File is empty');
      }
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Validate file extension
      if (!['txt', 'yaml', 'yml', 'md', 'csv'].includes(fileExtension || '')) {
        throw new Error('Unsupported file format. Please use .txt, .yaml, .md, or .csv files.');
      }
      
      switch (fileExtension) {
        case 'txt':
          parsed = parseTextFile(content);
          break;
        case 'yaml':
        case 'yml':
          parsed = parseYamlFile(content);
          break;
        case 'md':
          parsed = parseMarkdownFile(content);
          break;
        case 'csv':
          parsed = parseCsvFile(content);
          break;
        default:
          throw new Error('Unsupported file format');
      }
      
      // Handle multi-course structure
      if (parsed.isMultiCourse) {
        setIsMultiCourseImport(true);
        setAvailableCourses(parsed.courses);
        setImportPreview({
          isMultiCourse: true,
          totalCourses: parsed.totalCourses,
          courses: parsed.courses
        });
        toast({ 
          title: "Multi-Course File Detected", 
          description: `Found ${parsed.totalCourses} courses. Please select one to import.`,
        });
      } else {
        // Validate single course structure
        if (!parsed.modules || parsed.modules.length === 0) {
          throw new Error('No modules found in the file. Please check the file format.');
        }
        
        setImportPreview(parsed);
        toast({ 
          title: "File Parsed Successfully", 
          description: `Found ${parsed.modules?.length || 0} modules`,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      let errorMessage = 'Failed to parse file';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('Invalid YAML')) {
        errorMessage = 'Invalid YAML format. Please check the file structure and syntax.';
      } else if (errorMessage.includes('Invalid CSV')) {
        errorMessage = 'Invalid CSV format. Please ensure proper column headers and data.';
      } else if (errorMessage.includes('Unsupported file format')) {
        errorMessage = 'Unsupported file format. Please use .txt, .yaml, .md, or .csv files.';
      } else if (errorMessage.includes('empty')) {
        errorMessage = 'The file appears to be empty. Please check the file content.';
      } else if (errorMessage.includes('No modules found')) {
        errorMessage = 'No valid course modules were found in the file. Please check the format and content.';
      }
      
      toast({ 
        title: "Import Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectCourseFromMulti = (courseIndex: number) => {
    if (!availableCourses[courseIndex]) return;
    
    const selectedCourse = availableCourses[courseIndex];
    setSelectedCourseIndex(courseIndex);
    setImportPreview(selectedCourse);
    
    toast({
      title: "Course Selected",
      description: `Selected "${selectedCourse.title}" with ${selectedCourse.modules.length} modules`,
    });
  };

  const applyImportedData = () => {
    if (!importPreview) return;
    
    // Handle multi-course selection
    if (isMultiCourseImport && selectedCourseIndex === null) {
      toast({
        title: "Course Selection Required",
        description: "Please select a course from the list to import",
        variant: "destructive"
      });
      return;
    }
    
    let courseData = importPreview;
    
    // If multi-course, use the selected course
    if (isMultiCourseImport && selectedCourseIndex !== null) {
      courseData = availableCourses[selectedCourseIndex];
    }
    
    // Validate imported data
    if (!courseData.modules || courseData.modules.length === 0) {
      toast({
        title: "Import Error",
        description: "No valid modules found in the selected course",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Apply the imported data to the wizard
      if (courseData.title) setCourseTitle(courseData.title);
      if (courseData.description) setCourseDescriptionText(courseData.description);
      
      // Validate and clean module data
      const validModules = courseData.modules.filter((module: any) => 
        module.title && module.title.trim().length > 0
      );
      
      if (validModules.length === 0) {
        throw new Error("No valid modules found in the imported course");
      }
      
      setModules(validModules);
      
      // Import videos if available
      if (courseData.videos && courseData.videos.length > 0) {
        setUserPickedVideosList(courseData.videos);
      }
      
      // Close import dialog and reset state
      setImportDialogOpen(false);
      setIsMultiCourseImport(false);
      setAvailableCourses([]);
      setSelectedCourseIndex(null);
      setImportPreview(null);
      
      // Go to content planning step
      setCurrentStep(1);
      
      toast({ 
        title: "Import Successful", 
        description: `Imported "${courseData.title}" with ${validModules.length} modules` 
      });
    } catch (error) {
      console.error('Apply import error:', error);
      toast({
        title: "Import Application Failed",
        description: error instanceof Error ? error.message : "Failed to apply imported data",
        variant: "destructive"
      });
    }
  };

  const handleSuggestVideosAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoSearchTopic.trim()) {
      toast({ title: "Error", description: "Please enter a topic for video search.", variant: "destructive" });
      return;
    }
    setLoadingAiVideos(true);
    setErrorAiVideos(null);
    setAiSuggestedVideosList([]);
    try {
      const input: SuggestYoutubeVideosForTopicInput = { searchQuery: videoSearchTopic, numberOfSuggestions: 5, preferredLanguage: 'English' };
      const result = await suggestYoutubeVideosForTopic(input);
      setAiSuggestedVideosList(result.suggestedVideos);
      if (result.suggestedVideos.length === 0) toast({ title: "AI Video Search", description: "No videos found." });
    } catch (err) {
      console.error("Error suggesting videos:", err);
      setErrorAiVideos(err instanceof Error ? err.message : "AI video suggestion failed.");
      toast({ title: "AI Video Suggestion Failed", description: errorAiVideos || "An error occurred.", variant: "destructive" });
    } finally {
      setLoadingAiVideos(false);
    }
  };

  const handleManualVideoFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManualVideoForm({ ...manualVideoForm, [e.target.name]: e.target.value });
  };

  const handleManualVideoIsPlaylistChange = (checked: boolean | string) => {
    setManualVideoForm(prev => ({ ...prev, isPlaylist: !!checked }));
  };

  const handleAddUserPick = (e: FormEvent) => {
    e.preventDefault();
    if (!manualVideoForm.url.trim() || !manualVideoForm.language.trim()) {
      toast({ title: "Error", description: "Video URL and Language are required.", variant: "destructive" });
      return;
    }
    let embedUrl = manualVideoForm.url;
    const isPlaylistFromForm = manualVideoForm.isPlaylist;
    
    // Improved YouTube URL conversion with better validation
    const convertYouTubeUrl = (url: string, isPlaylist: boolean): string => {
      if (!url) return '';
      
      // Already an embed URL
      if (url.includes('youtube.com/embed/')) return url;
      
      // Handle playlist URLs
      if (isPlaylist || url.includes('playlist?list=') || url.includes('/playlist?list=')) {
        const listMatch = url.match(/[?&]list=([^&]+)/);
        if (listMatch) {
          return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
        }
      }
      
      // Handle watch URLs
      if (url.includes('watch?v=')) {
        const videoMatch = url.match(/[?&]v=([^&]+)/);
        if (videoMatch) {
          return `https://www.youtube.com/embed/${videoMatch[1]}`;
        }
      }
      
      // Handle youtu.be URLs
      if (url.includes('youtu.be/')) {
        const videoMatch = url.match(/youtu\.be\/([^?]+)/);
        if (videoMatch) {
          return `https://www.youtube.com/embed/${videoMatch[1]}`;
        }
      }
      
      // Handle direct YouTube links
      if (url.includes('youtube.com/') && !url.includes('embed/')) {
        // Try to extract video ID from various formats
        const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (videoMatch) {
          return `https://www.youtube.com/embed/${videoMatch[1]}`;
        }
      }
      
      return url; // Return as-is if no pattern matches
    };

    try {
      embedUrl = convertYouTubeUrl(embedUrl, isPlaylistFromForm);
      
      // Validate the final URL
      if (!embedUrl.includes('youtube.com/embed/')) {
        toast({ 
          title: "Invalid URL", 
          description: "Please provide a valid YouTube URL (watch, youtu.be, playlist, or embed format).", 
          variant: "destructive" 
        });
        return;
      }
      
      // Auto-detect if it's actually a playlist
      const isActuallyPlaylist = embedUrl.includes('videoseries?list=');
      if (isActuallyPlaylist && !isPlaylistFromForm) {
        toast({ 
          title: "Playlist Detected", 
          description: "This appears to be a playlist URL. It has been converted to playlist format.", 
          variant: "default" 
        });
      }
      
    } catch (error) {
      toast({ 
        title: "URL Conversion Error", 
        description: "Failed to process the YouTube URL. Please check the format.", 
        variant: "destructive" 
      });
      return;
    }

    const newUserPick: VideoLink = {
      id: `userlib-${uuidv4()}`,
      youtubeEmbedUrl: embedUrl,
      title: manualVideoForm.url.substring(0, 30) + `... (User Pick${isPlaylistFromForm ? ' Playlist' : ''})`,
      langCode: manualVideoForm.language.substring(0, 2).toLowerCase(),
      langName: manualVideoForm.language,
      creator: manualVideoForm.creator,
      notes: manualVideoForm.notes,
      isPlaylist: isPlaylistFromForm,
    };
    const updatedPicks = [...userPickedVideosList, newUserPick];
    setUserPickedVideosList(updatedPicks);
    if (user) updateUserProfile({ customVideoLinks: updatedPicks }, user, toast);
    setManualVideoForm({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
    toast({ title: "Video Added", description: `Added to your personal library.` });
  };

  const handleAddVideoToPool = (video: VideoLink) => {
    if (courseVideoPool.find(v => v.youtubeEmbedUrl === video.youtubeEmbedUrl)) {
      toast({ title: "Already in Pool", description: "This video is already in this course's pool." });
      return;
    }
    setCourseVideoPool([...courseVideoPool, video]);
    toast({ title: "Video Added to Pool", description: `"${video.title}" added to course video pool.` });
  };

  const handleRemoveVideoFromPool = (videoUrl: string) => {
    setCourseVideoPool(courseVideoPool.filter(v => v.youtubeEmbedUrl !== videoUrl));
    toast({ title: "Video Removed", description: "Video removed from course video pool." });
  };

  const handleRemoveFromUserPicks = (videoUrl: string) => {
    const updatedPicks = userPickedVideosList.filter(v => v.youtubeEmbedUrl !== videoUrl);
    setUserPickedVideosList(updatedPicks);
    if (user) updateUserProfile({ customVideoLinks: updatedPicks }, user, toast);
    toast({ title: "Video Removed", description: "Video removed from your personal library." });
  };

  // --- Module Handlers ---
  const handleOpenModuleEditor = (module?: ModuleType) => {
    if (module) {
      setEditingModule(module);
      setCurrentModuleForm(module);
    } else {
      setEditingModule(null);
      setCurrentModuleForm({ ...initialModuleState, id: uuidv4() });
    }
    setModuleSubtopicSuggestions([]);
    setModulePracticeTaskSuggestion('');
    setModuleVideoSuggestions([]);
    setIsModuleEditorOpen(true);
  };

  const handleModuleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentModuleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleContentTypeChange = (value: ModuleContentType) => {
    setCurrentModuleForm(prev => ({ ...prev, contentType: value, contentUrl: '' }));
  };

  const handleModuleContentUrlChange = (value: string) => {
    setCurrentModuleForm(prev => ({ ...prev, contentUrl: value }));
  };

  const handleSaveModule = () => {
    if (!currentModuleForm.title.trim()) {
      toast({ title: "Error", description: "Module title is required.", variant: "destructive" });
      return;
    }
    let updatedModules;
    if (editingModule) {
      updatedModules = modules.map(m => m.id === editingModule.id ? currentModuleForm : m);
    } else {
      updatedModules = [...modules, currentModuleForm];
    }
    setModules(updatedModules);
    setIsModuleEditorOpen(false);
    setEditingModule(null);
    toast({ title: "Module Saved", description: `Module "${currentModuleForm.title}" has been saved locally.` });
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
    toast({ title: "Module Deleted", description: "Module removed locally." });
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const newModules = [...modules];
    const item = newModules.splice(index, 1)[0];
    if (direction === 'up') {
      newModules.splice(index - 1, 0, item);
    } else {
      newModules.splice(index + 1, 0, item);
    }
    setModules(newModules);
  };

  // --- Module-Level AI Suggestion Handlers ---
  const handleSuggestModuleSubtopics = async () => {
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "This is an admin feature.", variant: "destructive" });
      return;
    }
    if (!currentModuleForm.title) {
      toast({ title: "Info", description: "Please provide a module title first.", variant: "default" });
      return;
    }
    setLoadingModuleSuggestions('subtopics');
    try {
      const input: SuggestModuleSubtopicsInput = {
        moduleTitle: currentModuleForm.title,
        numberOfSuggestions: 5,
        moduleDescription: currentModuleForm.description,
        courseTopic: courseTitle,
      };
      const result = await suggestModuleSubtopics(input);
      setModuleSubtopicSuggestions(result.subtopics);
      toast({ title: "AI Suggestions", description: "Subtopics suggested." });
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to get subtopic suggestions.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  const handleSuggestModulePracticeTask = async () => {
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "This is an admin feature.", variant: "destructive" });
      return;
    }
    if (!currentModuleForm.title) {
      toast({ title: "Info", description: "Please provide a module title first.", variant: "default" });
      return;
    }
    setLoadingModuleSuggestions('task');
    try {
      const input: SuggestModulePracticeTaskInput = {
        moduleTitle: currentModuleForm.title,
        moduleDescription: currentModuleForm.description,
        subtopics: currentModuleForm.subtopics,
        courseTopic: courseTitle,
      };
      const result = await suggestModulePracticeTask(input);
      setModulePracticeTaskSuggestion(result.practiceTask);
      toast({ title: "AI Suggestion", description: "Practice task suggested." });
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to get practice task suggestion.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  const handleFindVideosForModule = async () => {
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "This is an admin feature.", variant: "destructive" });
      return;
    }
    if (!currentModuleForm.title) {
      toast({ title: "Info", description: "Please provide a module title first.", variant: "default" });
      return;
    }
    setLoadingModuleSuggestions('videos');
    try {
      const input: FindYoutubeVideosInput = {
        moduleTitle: currentModuleForm.title,
        moduleDescription: currentModuleForm.description,
        preferredLanguage: 'English',
      };
      const result = await findYoutubeVideosForModule(input);
      setModuleVideoSuggestions(result.videos);
      if (result.videos.length === 0) {
        toast({ title: "AI Video Search", description: "No videos found for this module topic." });
      } else {
        toast({ title: "AI Video Search", description: `${result.videos.length} videos found.` });
      }
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to find videos for module.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  const addSuggestedSubtopicsToModule = () => {
    if (moduleSubtopicSuggestions.length > 0) {
      setCurrentModuleForm(prev => ({
        ...prev,
        subtopics: Array.from(new Set([...(prev.subtopics || []), ...moduleSubtopicSuggestions]))
      }));
      setModuleSubtopicSuggestions([]);
      toast({ description: "Suggested subtopics added to module." });
    }
  };

  const useSuggestedPracticeTask = () => {
    if (modulePracticeTaskSuggestion) {
      setCurrentModuleForm(prev => ({
        ...prev,
        practiceTask: modulePracticeTaskSuggestion
      }));
      setModulePracticeTaskSuggestion('');
      toast({ description: "Suggested practice task used." });
    }
  };

  // --- Main Course Save & Submit ---
  const handleSaveCourse = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save a course.", variant: "destructive" });
      return;
    }
    if (!courseTitle.trim() || !courseCategory.trim()) {
      toast({ title: "Error", description: "Course Title and Category are required.", variant: "destructive" });
      return;
    }

    const courseDataToSave = {
      title: courseTitle,
      category: courseCategory,
      description: courseDescriptionText,
      imageUrl: coverImageUrl,
      visibility: courseVisibility,
      status: courseStatus,
      modules: modules,
      authorId: user.id,
      suggestedSchedule: suggestedSchedule,
      duration: `${estimatedDurationWeeks} Weeks`,
    };

    try {
      let response;
      
      if (currentCourseId) {
        // Update existing course
        response = await fetch('/api/courses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId: currentCourseId,
            ...courseDataToSave,
          }),
        });
      } else {
        // Create new course
        response = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(courseDataToSave),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const savedCourse = result.course;
        
        setCurrentCourseId(savedCourse.id || savedCourse._id);
        setCourseStatus(savedCourse.status || 'draft');
        setOriginalAuthorId(savedCourse.authorId || null);
        
        toast({ 
          title: "Course Saved", 
          description: `"${savedCourse.title}" has been saved with all module changes.` 
        });

        // Trigger courses page refresh with multiple methods
        localStorage.setItem('courseImported', 'true');
        localStorage.setItem('courseSaved', 'true');
        
        // Dispatch storage events for immediate refresh
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'courseImported',
          newValue: 'true'
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'courseSaved', 
          newValue: 'true'
        }));

        // Dispatch custom event for immediate updates
        window.dispatchEvent(new CustomEvent('courseUpdated'));
      } else {
        const errorData = await response.json();
        toast({ 
          title: "Save Failed", 
          description: errorData.error || "Could not save the course. Please try again.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ 
        title: "Save Failed", 
        description: "Could not save the course. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleSubmitForReview = () => {
    if (!currentCourseId) {
      toast({ 
        title: "Save Course First", 
        description: "Please save the course before submitting for public review.", 
        variant: "destructive" 
      });
      return;
    }
    if (courseVisibility !== 'public') {
      toast({ 
        title: "Set Visibility to Public", 
        description: "Only courses set to 'Publish Publicly' can be submitted for review.", 
        variant: "destructive" 
      });
      return;
    }
    if (courseStatus !== 'draft') {
      toast({ 
        title: "Already Submitted or Published", 
        description: "This course is not in a 'draft' state for new submission.", 
        variant: "default" 
      });
      return;
    }

    const success = submitCourseForReview(currentCourseId);
    if (success) {
      setCourseStatus('pending');
      toast({ 
        title: "Course Submitted for Review", 
        description: "Your course has been submitted to admin for public publishing approval. You'll be notified when it's reviewed.",
        duration: 5000
      });
    } else {
      toast({ 
        title: "Submission Failed", 
        description: "Could not submit the course. Ensure it is saved and set to public visibility.", 
        variant: "destructive" 
      });
    }
  };

  const handleGenerateCourseSchedule = async () => {
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "AI Schedule Generation is an admin feature.", variant: "destructive" });
      return;
    }
    if (!courseTitle.trim() || modules.length === 0) {
      toast({ title: "Error", description: "Course Title and at least one Module are required to generate a schedule.", variant: "destructive" });
      return;
    }
    setLoadingCourseSchedule(true);
    setErrorCourseSchedule(null);
    try {
      const moduleTitles = modules.map(m => m.title);
      const input: GenerateCourseScheduleInput = {
        courseTitle,
        moduleTitles,
        estimatedCourseDurationWeeks: estimatedDurationWeeks,
        studyHoursPerWeek: 10,
      };
      const result = await generateCourseSchedule(input);
      setSuggestedSchedule(result.scheduleText);
      toast({ title: "AI Schedule Generated", description: "Review and save the suggested schedule." });
    } catch (err) {
      console.error("Error generating course schedule:", err);
      const errorMsg = err instanceof Error ? err.message : "Schedule generation failed.";
      setErrorCourseSchedule(errorMsg);
      toast({ title: "AI Schedule Failed", description: errorMsg, variant: "destructive" });
    } finally {
      setLoadingCourseSchedule(false);
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Loading course data...</span>
      </div>
    );
  }

  const renderModuleContentTypeIcon = (type: ModuleContentType) => {
    switch (type) {
      case 'video': return <VideoIcon className="h-4 w-4 text-primary" />;
      case 'text':
      case 'markdown': return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileTextIcon className="h-4 w-4 text-red-500" />;
      case 'pdf': return <FileTextIcon className="h-4 w-4 text-red-500" />;
      case 'quiz': return <HelpCircleIcon className="h-4 w-4 text-orange-500" />;
      default: return <FileTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Wizard Navigation Functions
  const goToNextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      autoSaveCourse();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Auto-save functionality
  const autoSaveCourse = async () => {
    if (courseTitle.trim() && user?.id) {
      try {
        const courseData = {
          id: currentCourseId || uuidv4(),
          title: courseTitle,
          description: courseDescriptionText,
          category: courseCategory,
          modules: modules,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorId: user.id,
          status: courseStatus,
          visibility: courseVisibility,
        };

        const savedCourse = saveOrUpdateCourse(courseData);
        if (savedCourse && !currentCourseId) {
          setCurrentCourseId(savedCourse.id);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  // Step validation
  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Course Setup
        return courseTitle.trim() !== '' && courseCategory.trim() !== '';
      case 1: // Content Planning
        return modules.length > 0;
      case 2: // Resource Gathering
        return true; // Optional step
      case 3: // Module Creation
        return modules.every(m => m.title.trim() !== '');
      case 4: // Review & Publish
        return courseDescriptionText.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <div className="space-y-8">
      {/* Wizard Header */}
      <header className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <LayoutGrid className="h-10 w-10 mr-3 text-primary" />
              <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                  {currentCourseId ? "Edit Course" : "Course Designer"}
                </h1>
                {user?.role === 'admin' && (
                  <Badge variant="outline" className="mt-1 border-primary text-primary">
                    Admin Mode
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xl text-muted-foreground mt-2">
              {currentCourseId ? `Editing "${courseTitle || 'course'}"` : "Create engaging courses with our step-by-step wizard"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import Course
            </Button>
            <Button onClick={resetCourseForm} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Start Over
            </Button>
          </div>
        </div>

        {/* Progress Stepper */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isValid = isStepValid(index);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <Button
                      variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                      size="lg"
                      className={cn(
                        "w-16 h-16 rounded-full p-0 mb-2 transition-all",
                        isActive && "ring-2 ring-primary ring-offset-2",
                        isCompleted && "bg-green-500 hover:bg-green-600 text-white",
                        !isValid && index <= currentStep && "border-orange-300"
                      )}
                      onClick={() => goToStep(index)}
                      disabled={index > currentStep + 1}
                    >
                      <Icon className="h-6 w-6" />
                    </Button>
                    <div className="text-center">
                      <p className={cn(
                        "font-medium text-sm",
                        isActive && "text-primary",
                        isCompleted && "text-green-600"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </header>

      {/* Wizard Content */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const Icon = WIZARD_STEPS[currentStep].icon;
              return <Icon className="h-6 w-6" />;
            })()}
            {WIZARD_STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>
            {WIZARD_STEPS[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Content */}
          {currentStep === 0 && (
            <CourseSetupStep
              courseTitle={courseTitle}
              setCourseTitle={setCourseTitle}
              courseCategory={courseCategory}
              setCourseCategory={setCourseCategory}
              courseDescriptionText={courseDescriptionText}
              setCourseDescriptionText={setCourseDescriptionText}
              coverImageUrl={coverImageUrl}
              setCoverImageUrl={setCoverImageUrl}
              courseVisibility={courseVisibility}
              setCourseVisibility={setCourseVisibility}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              estimatedDurationWeeks={estimatedDurationWeeks}
              setEstimatedDurationWeeks={setEstimatedDurationWeeks}
            />
          )}

          {currentStep === 1 && (
            <ContentPlanningStep
              modules={modules}
              setModules={setModules}
              courseTitle={courseTitle}
              courseCategory={courseCategory}
              estimatedDurationWeeks={estimatedDurationWeeks}
              selectedTemplate={selectedTemplate}
              wizardData={wizardData}
              setWizardData={setWizardData}
            />
          )}

          {currentStep === 2 && (
            <ResourceGatheringStep
              videoSearchTopic={videoSearchTopic}
              setVideoSearchTopic={setVideoSearchTopic}
              aiSuggestedVideosList={aiSuggestedVideosList}
              setAiSuggestedVideosList={setAiSuggestedVideosList}
              loadingAiVideos={loadingAiVideos}
              setLoadingAiVideos={setLoadingAiVideos}
              errorAiVideos={errorAiVideos}
              setErrorAiVideos={setErrorAiVideos}
              manualVideoForm={manualVideoForm}
              setManualVideoForm={setManualVideoForm}
              userPickedVideosList={userPickedVideosList}
              setUserPickedVideosList={setUserPickedVideosList}
              courseVideoPool={courseVideoPool}
              setCourseVideoPool={setCourseVideoPool}
              handleAiVideoSearch={handleAiVideoSearch}
              handleAddManualVideo={handleAddManualVideo}
              user={user}
              toast={toast}
              modules={modules}
              selectedModuleForResource={selectedModuleForResource}
              setSelectedModuleForResource={setSelectedModuleForResource}
              moduleResources={moduleResources}
              assignVideoToModule={assignVideoToModule}
              removeVideoFromModule={removeVideoFromModule}
              handleFileImport={handleFileImport}
              uploadedDocuments={uploadedDocuments}
              setUploadedDocuments={setUploadedDocuments}
            />
          )}

          {currentStep === 3 && (
            <ModuleCreationStep
              modules={modules}
              setModules={setModules}
              courseVideoPool={courseVideoPool}
              isModuleEditorOpen={isModuleEditorOpen}
              setIsModuleEditorOpen={setIsModuleEditorOpen}
              editingModule={editingModule}
              setEditingModule={setEditingModule}
              currentModuleForm={currentModuleForm}
              setCurrentModuleForm={setCurrentModuleForm}
              loadingModuleSuggestions={loadingModuleSuggestions}
              setLoadingModuleSuggestions={setLoadingModuleSuggestions}
              moduleSubtopicSuggestions={moduleSubtopicSuggestions}
              setModuleSubtopicSuggestions={setModuleSubtopicSuggestions}
              modulePracticeTaskSuggestion={modulePracticeTaskSuggestion}
              setModulePracticeTaskSuggestion={setModulePracticeTaskSuggestion}
              moduleVideoSuggestions={moduleVideoSuggestions}
              setModuleVideoSuggestions={setModuleVideoSuggestions}
              handleAddModule={handleAddModule}
              handleEditModule={handleEditModule}
              handleDeleteModule={handleDeleteModule}
              handleModuleFieldChange={handleModuleFieldChange}
              handleSaveModule={handleSaveModule}
              handleCancelModuleEdit={handleCancelModuleEdit}
              handleGenerateModuleSubtopics={handleGenerateModuleSubtopics}
              handleGenerateModulePracticeTask={handleGenerateModulePracticeTask}
              handleFindModuleVideos={handleFindModuleVideos}
              renderModuleContentTypeIcon={renderModuleContentTypeIcon}
              initialModuleState={initialModuleState}
            />
          )}

          {currentStep === 4 && (
            <ReviewPublishStep
              courseTitle={courseTitle}
              courseCategory={courseCategory}
              courseDescriptionText={courseDescriptionText}
              setCourseDescriptionText={setCourseDescriptionText}
              coverImageUrl={coverImageUrl}
              courseVisibility={courseVisibility}
              setCourseVisibility={setCourseVisibility}
              courseStatus={courseStatus}
              setCourseStatus={setCourseStatus}
              modules={modules}
              suggestedSchedule={suggestedSchedule}
              setSuggestedSchedule={setSuggestedSchedule}
              loadingCourseSchedule={loadingCourseSchedule}
              setLoadingCourseSchedule={setLoadingCourseSchedule}
              errorCourseSchedule={errorCourseSchedule}
              setErrorCourseSchedule={setErrorCourseSchedule}
              estimatedDurationWeeks={estimatedDurationWeeks}
              currentCourseId={currentCourseId}
              setCurrentCourseId={setCurrentCourseId}
              originalAuthorId={originalAuthorId}
              handleSaveCourse={handleSaveCourse}
              handleGenerateCourseSchedule={handleGenerateCourseSchedule}
              user={user}
              toast={toast}
            />
          )}

          {/* Navigation Footer */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </span>
              {!isStepValid(currentStep) && (
                <Badge variant="destructive" className="text-xs">
                  Incomplete
                </Badge>
              )}
            </div>

            <Button
              onClick={goToNextStep}
              disabled={currentStep === WIZARD_STEPS.length - 1 || !isStepValid(currentStep)}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Course Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Course</DialogTitle>
            <DialogDescription>
              Import course structure from a file. Supports .txt, .yaml, .md, .csv, and .json formats.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".txt,.yaml,.yml,.md,.csv,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                    handleImportFile(file);
                  }
                }}
                disabled={isImporting}
              />
              <div className="text-sm text-muted-foreground">
                <p><strong>Supported formats:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>.txt</strong> - Plain text with module names and video URLs</li>
                  <li><strong>.yaml/.yml</strong> - Structured YAML format (supports multi-course files)</li>
                  <li><strong>.md</strong> - Markdown with headers and links</li>
                  <li><strong>.csv</strong> - Comma-separated values with module data</li>
                </ul>
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                  <strong>Pro tip:</strong> For multi-course curriculum files (like combined_full_syllabus.yaml), 
                  you'll be able to select which specific course to import after upload.
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isImporting && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Parsing file...</span>
              </div>
            )}

            {/* Import Preview */}
            {importPreview && !isImporting && (
              <div className="space-y-4">
                {/* Multi-Course Selection */}
                {isMultiCourseImport && availableCourses.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-orange-600" />
                        Multi-Course File Detected
                      </CardTitle>
                      <CardDescription>
                        This file contains {availableCourses.length} courses. Please select one to import:
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        {availableCourses.map((course, index) => (
                          <Card
                            key={index}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              selectedCourseIndex === index 
                                ? "ring-2 ring-primary border-primary bg-primary/5" 
                                : "hover:border-gray-300"
                            )}
                            onClick={() => selectCourseFromMulti(index)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-medium text-sm">{course.title}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {course.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      {course.modules?.length || 0} modules
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      {course.modules?.reduce((acc: number, mod: any) => 
                                        acc + (mod.videoLinks?.length || 0), 0) || 0} videos
                                    </span>
                                  </div>
                                </div>
                                {selectedCourseIndex === index && (
                                  <div className="p-1 bg-primary rounded-full">
                                    <CheckSquare className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Single Course or Selected Course Preview */}
                {(!isMultiCourseImport || selectedCourseIndex !== null) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Import Preview
                      </CardTitle>
                      <CardDescription>
                        Review what will be imported before applying changes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Course Information</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Title:</strong> {importPreview.title || 'Not specified'}</p>
                            <p><strong>Description:</strong> {importPreview.description || 'Not specified'}</p>
                            <p><strong>Modules:</strong> {importPreview.modules?.length || 0}</p>
                            <p><strong>Total Videos:</strong> {
                              importPreview.modules?.reduce((acc: number, mod: any) => 
                                acc + (mod.videoLinks?.length || 0), 0) || 0
                            }</p>
                            <p><strong>Documents:</strong> {importPreview.documents?.length || 0}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Modules Preview</h4>
                          <ScrollArea className="h-40">
                            <div className="space-y-2 text-sm">
                              {importPreview.modules?.map((module: any, index: number) => (
                                <div key={index} className="p-3 border rounded-lg">
                                  <p className="font-medium text-sm">{module.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {module.description && `${module.description.slice(0, 60)}${module.description.length > 60 ? '...' : ''}`}
                                  </p>
                                  <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                                    <span>{module.videoLinks?.length || 0} videos</span>
                                    <span>{module.subtopics?.length || 0} subtopics</span>
                                    {module.practiceTask && <span>Has practice task</span>}
                                  </div>
                                </div>
                              )) || <p className="text-muted-foreground">No modules found</p>}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                      
                      {/* Data Quality Indicators */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 text-sm">Data Quality Check</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            {importPreview.title ? (
                              <CheckSquare className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                            <span>Course Title</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {importPreview.modules?.length > 0 ? (
                              <CheckSquare className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Modules Found</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {importPreview.modules?.some((m: any) => m.videoLinks?.length > 0) ? (
                              <CheckSquare className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                            <span>Video Resources</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {importPreview.modules?.some((m: any) => m.practiceTask) ? (
                              <CheckSquare className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                            <span>Practice Tasks</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Format Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Format Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Text Format (.txt)</h5>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{`# Course Title
## Course Description

### Module 1: Introduction
- Basic concepts
- Getting started
https://youtube.com/watch?v=example1

### Module 2: Advanced Topics
- Advanced concepts
- Best practices
https://youtube.com/watch?v=example2`}</pre>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">CSV Format (.csv)</h5>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{`module_title,description,video_url,duration
"Week 1: HTML Basics","Introduction to HTML","https://youtube.com/watch?v=example1","1 week"
"Week 2: CSS Styling","Advanced CSS concepts","https://youtube.com/watch?v=example2","1 week"`}</pre>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">YAML Format (.yaml) - Single Course</h5>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{`title: "React Fundamentals"
description: "Learn React from basics to advanced"
modules:
  - title: "Getting Started"
    description: "React basics"
    videos:
      - "https://youtube.com/watch?v=example1"`}</pre>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">YAML Format (.yaml) - Multi-Course</h5>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{`Full-Stack Development:
- Week: 1
  Tech Topic: HTML5 & CSS3
  Subtopics: HTML structure, CSS selectors
  Hinglish Resource Link: https://youtube.com/playlist?list=example1
  English Resource Link: https://youtube.com/watch?v=example2
  Practice Task: Build a portfolio homepage

DevOps & Cloud:
- Week: 1
  Tech Topic: Docker Basics
  Subtopics: Containers, Images, Deployment`}</pre>
                  </div>
                </div>
                
                {/* Additional format support info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Supported Features</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
                    <ul className="space-y-1">
                      <li>• Multi-course YAML detection</li>
                      <li>• YouTube playlist & video URLs</li>
                      <li>• Subtopics and practice tasks</li>
                      <li>• Multiple video languages</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• Module descriptions and durations</li>
                      <li>• CSV with flexible headers</li>
                      <li>• Markdown with headers and links</li>
                      <li>• Automatic course structure detection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={applyImportedData} 
              disabled={!importPreview || isImporting || (isMultiCourseImport && selectedCourseIndex === null)}
              className={cn(
                isMultiCourseImport && selectedCourseIndex === null && "cursor-not-allowed opacity-50"
              )}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : isMultiCourseImport && selectedCourseIndex === null ? (
                "Select a Course to Import"
              ) : (
                "Import Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function MyCourseDesignerPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Loading course designer...</span>
      </div>
    }>
      <CourseDesignerContent />
    </Suspense>
  );
}
function updateUserProfile(updates: { customVideoLinks: VideoLink[] }, user: any, toast: any) {
  // Since this is client-side code and we have a user context,
  // we should update the user's profile through the auth context or an API call
  
  // For now, we'll implement a basic version that could integrate with your auth system
  try {
    // If you have an API endpoint for updating user profiles:
    // fetch('/api/user/profile', {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updates)
    // });
    
    // For local storage fallback (temporary solution):
    const userId = user?.id;
    if (userId) {
      const userDataKey = `user_${userId}_customVideoLinks`;
      localStorage.setItem(userDataKey, JSON.stringify(updates.customVideoLinks));
    }
    
    // Note: In a production app, you'd want to update the user context
    // and sync with your backend database
    console.log('User profile updated with custom video links:', updates);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    toast({ 
      title: "Update Failed", 
      description: "Could not save video to your library.", 
      variant: "destructive" 
    });
  }
}
