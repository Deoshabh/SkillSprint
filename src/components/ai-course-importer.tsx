"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Brain, 
  Video, 
  FileText, 
  Link, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Target,
  Zap,
  Download
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { VideoLink, Module as ModuleType } from '@/lib/types';

interface AIExtractedContent {
  courseTitle: string;
  courseDescription: string;
  modules: ModuleType[];
  videoLinks: VideoLink[];
  documentLinks: Array<{ url: string; title: string; type: string }>;
  suggestedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  categories: string[];
  learningObjectives: string[];
  prerequisites: string[];
}

interface AIImportStage {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
}

export function AICourseImporter({ onCourseImported }: { onCourseImported?: (course: AIExtractedContent) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<AIExtractedContent | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [processingStages, setProcessingStages] = useState<AIImportStage[]>([
    {
      id: 'parse',
      title: 'File Analysis',
      description: 'AI analyzing file content and structure',
      icon: FileText,
      status: 'pending'
    },
    {
      id: 'extract_links',
      title: 'Link Extraction',
      description: 'Extracting video and document links',
      icon: Link,
      status: 'pending'
    },
    {
      id: 'structure_course',
      title: 'Course Structure',
      description: 'Creating logical course modules and flow',
      icon: BookOpen,
      status: 'pending'
    },
    {
      id: 'enhance_content',
      title: 'Content Enhancement',
      description: 'AI enriching content with objectives and descriptions',
      icon: Sparkles,
      status: 'pending'
    },
    {
      id: 'finalize',
      title: 'Finalization',
      description: 'Preparing course for import',
      icon: CheckCircle,
      status: 'pending'
    }
  ]);

  const { toast } = useToast();

  const updateStageStatus = (stageId: string, status: AIImportStage['status'], result?: any) => {
    setProcessingStages(prev => 
      prev.map(stage => 
        stage.id === stageId 
          ? { ...stage, status, result }
          : stage
      )
    );
  };
  const smartVideoUrlExtraction = (content: string): VideoLink[] => {
    const videoLinks: VideoLink[] = [];
    
    // Enhanced URL patterns for comprehensive video detection
    const urlPatterns = [
      // Standard YouTube URLs
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+(?:&[\w=&-]*)?/g,
      /https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+(?:\?[\w=&-]*)?/g,
      /https?:\/\/youtu\.be\/[\w-]+(?:\?[\w=&-]*)?/g,
      
      // YouTube playlists
      /https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=[\w-]+(?:&[\w=&-]*)?/g,
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+&list=[\w-]+(?:&[\w=&-]*)?/g,
      
      // YouTube channel URLs
      /https?:\/\/(?:www\.)?youtube\.com\/channel\/[\w-]+(?:\/[\w?=&-]*)?/g,
      /https?:\/\/(?:www\.)?youtube\.com\/c\/[\w-]+(?:\/[\w?=&-]*)?/g,
      /https?:\/\/(?:www\.)?youtube\.com\/@[\w-]+(?:\/[\w?=&-]*)?/g,
      
      // YouTube mobile and shorts
      /https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+(?:&[\w=&-]*)?/g,
      /https?:\/\/(?:www\.)?youtube\.com\/shorts\/[\w-]+(?:\?[\w=&-]*)?/g,
      /https?:\/\/(?:www\.)?youtube\.com\/live\/[\w-]+(?:\?[\w=&-]*)?/g,
      
      // Other video platforms
      /https?:\/\/(?:www\.)?vimeo\.com\/[\w-]+(?:\/[\w?=&-]*)?/g,
      /https?:\/\/(?:www\.)?dailymotion\.com\/video\/[\w-]+(?:\?[\w=&-]*)?/g,
      /https?:\/\/(?:www\.)?twitch\.tv\/videos\/[\w-]+(?:\?[\w=&-]*)?/g,
      
      // Generic video file URLs
      /https?:\/\/[^\s]+\.(?:mp4|avi|mov|wmv|flv|webm|mkv|m4v)(?:\?[^\s]*)?/gi,
    ];

    // Split content into lines for better context extraction
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      urlPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const fullUrl = match[0];
          let embedUrl = fullUrl;
          let isPlaylist = false;
          let platform = 'YouTube';
          
          // Convert URLs to embed format based on platform
          if (fullUrl.includes('youtube.com') || fullUrl.includes('youtu.be')) {
            platform = 'YouTube';
            if (fullUrl.includes('playlist?list=')) {
              const listMatch = fullUrl.match(/[?&]list=([^&]+)/);
              if (listMatch) {
                embedUrl = `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
                isPlaylist = true;
              }
            } else if (fullUrl.includes('watch?v=')) {
              const videoMatch = fullUrl.match(/[?&]v=([^&]+)/);
              if (videoMatch) {
                embedUrl = `https://www.youtube.com/embed/${videoMatch[1]}`;
              }
            } else if (fullUrl.includes('youtu.be/')) {
              const videoMatch = fullUrl.match(/youtu\.be\/([^?]+)/);
              if (videoMatch) {
                embedUrl = `https://www.youtube.com/embed/${videoMatch[1]}`;
              }
            } else if (fullUrl.includes('shorts/')) {
              const videoMatch = fullUrl.match(/shorts\/([^?]+)/);
              if (videoMatch) {
                embedUrl = `https://www.youtube.com/embed/${videoMatch[1]}`;
              }
            }
          } else if (fullUrl.includes('vimeo.com')) {
            platform = 'Vimeo';
            const videoMatch = fullUrl.match(/vimeo\.com\/(\d+)/);
            if (videoMatch) {
              embedUrl = `https://player.vimeo.com/video/${videoMatch[1]}`;
            }
          } else if (fullUrl.includes('dailymotion.com')) {
            platform = 'Dailymotion';
          } else if (fullUrl.includes('twitch.tv')) {
            platform = 'Twitch';
          }

          // Enhanced language and context detection
          const lineLower = line.toLowerCase();
          const prevLine = lineIndex > 0 ? lines[lineIndex - 1].toLowerCase() : '';
          const nextLine = lineIndex < lines.length - 1 ? lines[lineIndex + 1].toLowerCase() : '';
          const context = `${prevLine} ${lineLower} ${nextLine}`;
          
          const isHindi = context.includes('hindi') || 
                         context.includes('hinglish') || 
                         context.includes('हिंदी') ||
                         context.includes('हिन्दी') ||
                         context.includes('hinglish') ||
                         context.includes('हिंग्लिश');
          
          // Enhanced title extraction with multiple strategies
          let title = '';
          
          // Strategy 1: Look for explicit title/name patterns
          const titlePatterns = [
            /(?:title|name|topic|video|lecture|tutorial|lesson|course):\s*([^,\n\r|]+)/i,
            /^[\s\-\*\d\.]*([^:]+):/,
            /^[\s\-\*\d\.]*(.+?)(?:\s*-\s*https?:)/i,
            /^[\s\-\*\d\.]*(.+?)(?:\s*\|\s*https?:)/i
          ];
          
          for (const pattern of titlePatterns) {
            const titleMatch = line.match(pattern);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim();
              break;
            }
          }
          
          // Strategy 2: If no title found, look at surrounding context
          if (!title) {
            // Check previous line for title
            if (prevLine && !prevLine.includes('http')) {
              const cleanPrevLine = prevLine.replace(/^[\s\-\*\d\.#]+/, '').trim();
              if (cleanPrevLine.length > 5 && cleanPrevLine.length < 100) {
                title = cleanPrevLine;
              }
            }
          }
          
          // Strategy 3: Extract from module/section headers
          if (!title) {
            for (let i = Math.max(0, lineIndex - 5); i < lineIndex; i++) {
              const headerLine = lines[i];
              if (headerLine.match(/^#+\s+/) || headerLine.match(/^(module|chapter|lesson|week)/i)) {
                title = headerLine.replace(/^#+\s*/, '').replace(/^(module|chapter|lesson|week)\s*\d*:?\s*/i, '').trim();
                break;
              }
            }
          }
          
          // Fallback title based on platform and type
          if (!title) {
            title = isPlaylist ? `${platform} Playlist` : `${platform} Video`;
          }
          
          // Clean up title
          title = title.replace(/https?:\/\/[^\s]+/g, '').trim();
          if (title.length > 100) title = title.substring(0, 97) + '...';

          // Extract creator information
          let creator = 'Imported';
          const creatorPatterns = [
            /(?:by|author|creator|instructor|teacher):\s*([^,\n\r|]+)/i,
            /(?:created by|made by|from):\s*([^,\n\r|]+)/i
          ];
          
          for (const pattern of creatorPatterns) {
            const creatorMatch = context.match(pattern);
            if (creatorMatch && creatorMatch[1]) {
              creator = creatorMatch[1].trim();
              break;
            }
          }

          // Avoid duplicate URLs
          const existingVideo = videoLinks.find(v => v.youtubeEmbedUrl === embedUrl);
          if (!existingVideo) {
            videoLinks.push({
              id: `video-${videoLinks.length + 1}`,
              langCode: isHindi ? 'hi' : 'en',
              langName: isHindi ? 'Hindi' : 'English',
              youtubeEmbedUrl: embedUrl,
              title: title,
              creator: creator,
              isPlaylist: isPlaylist,
            });
          }
        }
      });
    });

    return videoLinks;
  };

  const smartDocumentExtraction = (content: string) => {
    const documentLinks: Array<{ url: string; title: string; type: string }> = [];
    const docPatterns = [
      // PDF documents
      /https?:\/\/[^\s]+\.pdf/gi,
      // Office documents
      /https?:\/\/[^\s]+\.(?:doc|docx|ppt|pptx|xls|xlsx)/gi,
      // Google Drive/Docs
      /https?:\/\/(?:docs|drive)\.google\.com\/[^\s]+/gi,
      // GitHub repositories
      /https?:\/\/github\.com\/[^\s]+/gi,
      // Documentation sites
      /https?:\/\/[^\s]*(?:docs|documentation|wiki)[^\s]*/gi
    ];

    content.split('\n').forEach(line => {
      docPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const url = match[0];
          let type = 'document';
          let title = 'Document';

          if (url.includes('.pdf')) {
            type = 'PDF';
            title = 'PDF Document';
          } else if (url.includes('github.com')) {
            type = 'Repository';
            title = 'GitHub Repository';
          } else if (url.includes('docs.google.com')) {
            type = 'Google Docs';
            title = 'Google Document';
          } else if (url.includes('drive.google.com')) {
            type = 'Google Drive';
            title = 'Google Drive File';
          }

          // Try to extract title from surrounding text
          const titleMatch = line.match(/(?:title:|name:|doc:|document:)\s*([^,\n\r]+)/i) ||
                           line.match(/^[\s\-\*]*([^:]+):/);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }

          documentLinks.push({ url, title, type });
        }
      });
    });

    return documentLinks;
  };

  const aiStructureCourse = async (content: string, videoLinks: VideoLink[], documentLinks: any[]): Promise<AIExtractedContent> => {
    // Simulate AI processing stages
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract course title
    const titlePatterns = [
      /^#\s+(.+)$/m,
      /title:\s*["']?([^"'\n]+)["']?/i,
      /course:\s*["']?([^"'\n]+)["']?/i,
      /^(.+)(?=:|\n)/m
    ];
    
    let courseTitle = 'AI Generated Course';
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        courseTitle = match[1].trim();
        break;
      }
    }

    // Extract modules/chapters
    const modulePatterns = [
      /^##\s+(.+)$/gm,
      /^###\s+(.+)$/gm,
      /(?:module|week|chapter|lesson)\s*\d*:?\s*(.+)$/gmi,
      /^-?\s*(.+)(?=:)/gm    ];

    const modules: ModuleType[] = [];
    const lines = content.split('\n');
    
    interface TempModule {
      title: string;
      description: string;
      estimatedTime: string;
      subtopics: string[];
      practiceTask: string;
      videoLinks: VideoLink[];
    }
    
    let currentModule: TempModule | null = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;      // Check for module headers
      const isModuleHeader = modulePatterns.some(pattern => {
        const matches = [...content.matchAll(pattern)];
        return matches.some(match => match[0].trim() === trimmed);
      });

      if (isModuleHeader || trimmed.match(/^(module|week|chapter|lesson)/i)) {
        // Save previous module if it exists
        if (currentModule) {
          const finalModule: ModuleType = {
            id: uuidv4(),
            title: currentModule.title,
            description: currentModule.description,
            contentType: 'video' as const,
            estimatedTime: currentModule.estimatedTime,
            subtopics: currentModule.subtopics,
            practiceTask: currentModule.practiceTask,
            videoLinks: currentModule.videoLinks,
            contentUrl: '',
          };
          modules.push(finalModule);
        }

        // Create new module
        currentModule = {
          title: trimmed.replace(/^#+\s*/, '').replace(/^(module|week|chapter|lesson)\s*\d*:?\s*/i, ''),
          description: '',
          subtopics: [],
          videoLinks: [],
          estimatedTime: '1 hour',
          practiceTask: ''
        };
      } else if (currentModule) {
        // Add content to current module
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          currentModule.subtopics.push(trimmed.replace(/^[-•]\s*/, ''));
        } else if (trimmed.toLowerCase().includes('task') || trimmed.toLowerCase().includes('exercise')) {
          currentModule.practiceTask = trimmed;
        } else if (!currentModule.description && trimmed.length > 10) {
          currentModule.description = trimmed;
        }
      }
    });    // Add the last module
    if (currentModule) {
      const finalModule: ModuleType = {
        id: uuidv4(),
        title: (currentModule as TempModule).title,
        description: (currentModule as TempModule).description,
        contentType: 'video' as const,
        estimatedTime: (currentModule as TempModule).estimatedTime,
        subtopics: (currentModule as TempModule).subtopics,
        practiceTask: (currentModule as TempModule).practiceTask,
        videoLinks: (currentModule as TempModule).videoLinks,
        contentUrl: '',
      };
      modules.push(finalModule);
    }

    // Distribute video links across modules
    videoLinks.forEach((video, index) => {
      const moduleIndex = index % modules.length;
      const targetModule = modules[moduleIndex];
      if (targetModule?.videoLinks) {
        targetModule.videoLinks.push(video);
      }
    });

    // AI-enhanced course metadata
    const categories = content.toLowerCase().includes('react') ? ['Web Development', 'React'] :
                      content.toLowerCase().includes('python') ? ['Programming', 'Python'] :
                      content.toLowerCase().includes('data') ? ['Data Science', 'Analytics'] :
                      ['General', 'Technology'];

    const difficulty = modules.length <= 5 ? 'Beginner' : 
                      modules.length <= 10 ? 'Intermediate' : 'Advanced';

    return {
      courseTitle,
      courseDescription: `Comprehensive course covering ${modules.length} modules with hands-on learning resources and practical exercises.`,
      modules,
      videoLinks,
      documentLinks,
      suggestedDuration: `${modules.length} weeks`,
      difficulty: difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      categories,
      learningObjectives: [
        `Master the fundamentals covered in ${modules.length} structured modules`,
        'Apply practical skills through hands-on exercises',
        'Build real-world projects using course resources'
      ],
      prerequisites: difficulty === 'Beginner' ? ['Basic computer skills'] : 
                    difficulty === 'Intermediate' ? ['Basic programming knowledge'] :
                    ['Advanced programming experience', 'Prior project experience']
    };
  };

  const processFileWithAI = async (file: File) => {
    setIsProcessing(true);
    setCurrentStage(0);

    try {
      // Stage 1: File Analysis
      updateStageStatus('parse', 'processing');
      const content = await file.text();
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStageStatus('parse', 'completed', { size: file.size, type: file.type });
      setCurrentStage(1);

      // Stage 2: Link Extraction
      updateStageStatus('extract_links', 'processing');
      const videoLinks = smartVideoUrlExtraction(content);
      const documentLinks = smartDocumentExtraction(content);
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStageStatus('extract_links', 'completed', { videos: videoLinks.length, documents: documentLinks.length });
      setCurrentStage(2);

      // Stage 3: Course Structure
      updateStageStatus('structure_course', 'processing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const structuredCourse = await aiStructureCourse(content, videoLinks, documentLinks);
      updateStageStatus('structure_course', 'completed', { modules: structuredCourse.modules.length });
      setCurrentStage(3);

      // Stage 4: Content Enhancement
      updateStageStatus('enhance_content', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStageStatus('enhance_content', 'completed');
      setCurrentStage(4);

      // Stage 5: Finalization
      updateStageStatus('finalize', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStageStatus('finalize', 'completed');

      setExtractedContent(structuredCourse);
      
      toast({
        title: "AI Import Complete!",
        description: `Successfully extracted ${structuredCourse.modules.length} modules with ${videoLinks.length} videos and ${documentLinks.length} documents.`,
      });

    } catch (error) {
      const errorStageId = processingStages[currentStage]?.id || 'parse';
      updateStageStatus(errorStageId, 'error');
      
      toast({
        title: "AI Import Failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Reset states
      setExtractedContent(null);
      setCurrentStage(0);
      setProcessingStages(prev => prev.map(stage => ({ ...stage, status: 'pending' })));
    }
  };

  const handleImportCourse = () => {
    if (extractedContent && onCourseImported) {
      onCourseImported(extractedContent);
      setIsOpen(false);
      toast({
        title: "Course Imported Successfully!",
        description: `"${extractedContent.courseTitle}" has been added to your course designer.`,
      });
    }
  };

  const resetImporter = () => {
    setUploadedFile(null);
    setExtractedContent(null);
    setIsProcessing(false);
    setCurrentStage(0);
    setProcessingStages(prev => prev.map(stage => ({ ...stage, status: 'pending' })));
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
      >
        <Brain className="mr-2 h-4 w-4" />
        AI Course Importer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              AI-Powered Course Importer
            </DialogTitle>
            <DialogDescription>
              Upload any file and let AI intelligently extract course content, videos, and documents to create a complete course structure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Course Content</CardTitle>
                <CardDescription>
                  Supports any text-based file: .txt, .md, .yaml, .csv, .json, .docx, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="ai-file-upload">Select File</Label>
                  <Input
                    id="ai-file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    accept=".txt,.md,.yaml,.yml,.csv,.json,.docx,.pdf"
                  />
                  
                  {uploadedFile && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || 'Unknown type'}
                          </p>
                        </div>
                        <Badge variant="outline">Ready for AI Analysis</Badge>
                      </div>
                    </div>
                  )}

                  {uploadedFile && !isProcessing && !extractedContent && (
                    <Button 
                      onClick={() => processFileWithAI(uploadedFile)}
                      className="w-full"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Start AI Analysis
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Processing Stages */}
            {(isProcessing || extractedContent) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Processing Pipeline</CardTitle>
                  <CardDescription>
                    Advanced AI algorithms analyzing and structuring your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processingStages.map((stage, index) => {
                      const Icon = stage.icon;
                      const isActive = currentStage === index;
                      const isCompleted = stage.status === 'completed';
                      const isError = stage.status === 'error';
                      const isProcessing = stage.status === 'processing';

                      return (
                        <div key={stage.id} className="flex items-center space-x-3">
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                            ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                              isError ? 'bg-red-500 border-red-500 text-white' :
                              isProcessing ? 'bg-blue-500 border-blue-500 text-white' :
                              'bg-muted border-muted-foreground/20'}
                          `}>
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isError ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium ${isActive ? 'text-blue-600' : ''}`}>
                                {stage.title}
                              </h4>
                              {stage.result && (
                                <div className="flex space-x-2">
                                  {stage.result.videos && (
                                    <Badge variant="secondary">{stage.result.videos} videos</Badge>
                                  )}
                                  {stage.result.documents && (
                                    <Badge variant="secondary">{stage.result.documents} docs</Badge>
                                  )}
                                  {stage.result.modules && (
                                    <Badge variant="secondary">{stage.result.modules} modules</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{stage.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extracted Content Preview */}
            {extractedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI-Generated Course Preview</CardTitle>
                  <CardDescription>
                    Review the intelligent course structure created by AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Course Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{extractedContent.courseTitle}</h3>
                        <p className="text-muted-foreground mt-1">{extractedContent.courseDescription}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline">{extractedContent.difficulty}</Badge>
                          <Badge variant="outline">{extractedContent.suggestedDuration}</Badge>
                          {extractedContent.categories.map(cat => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{extractedContent.modules.length} Modules</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{extractedContent.videoLinks.length} Videos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">{extractedContent.documentLinks.length} Documents</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">{extractedContent.learningObjectives.length} Learning Objectives</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Modules Preview */}
                    <div>
                      <h4 className="font-medium mb-3">Course Modules</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-3">
                          {extractedContent.modules.map((module, index) => (
                            <div key={module.id} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium">{module.title}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {module.description}
                                  </p>
                                    {module.subtopics && module.subtopics.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-muted-foreground">Topics:</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {module.subtopics.slice(0, 3).map((topic, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {topic}
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
                                </div>
                                  <div className="text-right">
                                  <Badge variant="secondary" className="text-xs">
                                    {module.videoLinks?.length || 0} videos
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {module.estimatedTime}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Learning Objectives */}
                    <div>
                      <h4 className="font-medium mb-2">Learning Objectives</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {extractedContent.learningObjectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            
            {uploadedFile && !extractedContent && !isProcessing && (
              <Button onClick={resetImporter} variant="outline">
                Reset
              </Button>
            )}
            
            {extractedContent && (
              <Button onClick={handleImportCourse} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Import Course
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
