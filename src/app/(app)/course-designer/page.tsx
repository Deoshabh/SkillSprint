
"use client";

import { useState, type ChangeEvent, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, LayoutGrid, Loader2, AlertTriangle, Youtube, ListPlus, Trash2, Edit, Send, CheckSquare, XCircle, Brain, VideoIcon, FileTextIcon, HelpCircleIcon, ChevronUp, ChevronDown, CalendarClock } from 'lucide-react';
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';
import { suggestModuleSubtopics, type SuggestModuleSubtopicsInput } from '@/ai/flows/suggest-module-subtopics-flow';
import { suggestModulePracticeTask, type SuggestModulePracticeTaskInput } from '@/ai/flows/suggest-module-practice-task-flow';
import { generateCourseSchedule, type GenerateCourseScheduleInput } from '@/ai/flows/generate-course-schedule-flow';

import type { VideoLink, Course as CourseType, Module as ModuleType, ModuleContentType } from '@/lib/types';
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


interface ManualVideoFormState {
  url: string;
  language: string;
  creator: string;
  notes: string;
  isPlaylist: boolean;
}

type CourseVisibility = "private" | "shared" | "public";

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


export default function MyCourseDesignerPage() {
  const { toast } = useToast();
  const { user, updateUserProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

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


  // AI Syllabus State
  const [aiTopic, setAiTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Beginners');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [desiredModules, setDesiredModules] = useState(5);
  const [syllabusResult, setSyllabusResult] = useState<string | null>(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [errorSyllabus, setErrorSyllabus] = useState<string | null>(null);

  // Video Curation State
  const [videoSearchTopic, setVideoSearchTopic] = useState('');
  const [aiSuggestedVideosList, setAiSuggestedVideosList] = useState<VideoLink[]>([]);
  const [loadingAiVideos, setLoadingAiVideos] = useState(false);
  const [errorAiVideos, setErrorAiVideos] = useState<string | null>(null);
  const [manualVideoForm, setManualVideoForm] = useState<ManualVideoFormState>({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
  const [userPickedVideosList, setUserPickedVideosList] = useState<VideoLink[]>([]);
  const [courseVideoPool, setCourseVideoPool] = useState<VideoLink[]>([]);

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
    setSyllabusResult(null);
    setErrorSyllabus(null);
    setAiSuggestedVideosList([]);
    setErrorAiVideos(null);
    setEditingModule(null);
    setCurrentModuleForm(initialModuleState);
    setIsModuleEditorOpen(false);
    setSuggestedSchedule('');
    setEstimatedDurationWeeks(12);
    setErrorCourseSchedule(null);
    router.replace('/course-designer', {scroll: false});
  }, [router]);

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
        setCourseCategory(courseToEdit.category);
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
            if(module.contentUrl && module.contentType === 'video'){
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
    if (user && user.customVideoLinks) {
      setUserPickedVideosList(user.customVideoLinks);
    }
  }, [user]);

  const parseSyllabusToModules = (syllabusText: string): ModuleType[] => {
    const generatedModules: ModuleType[] = [];
    // Regex to capture module title and then everything until the next "Module" or end of string
    const moduleRegex = /^(?:#+\s*)?Module\s*\d*[:\s-]*\s*(.*?)(?:\n|$)([\s\S]*?)(?=(?:#+\s*)?Module\s*\d*[:\s-]*|\Z)/gim;
    
    let match;
    while ((match = moduleRegex.exec(syllabusText)) !== null) {
        const title = match[1].trim().replace(/\*+/g, ''); // Remove markdown bolding from title
        let contentBlock = match[2] || '';

        // Attempt to extract description before "Topics:" or "Learning Activities:"
        let description = '';
        const descriptionMatch = contentBlock.match(/^([\s\S]*?)(?:(?:#+\s*)?Topics:|(?:#+\s*)?Learning Activities:|$)/i);
        if (descriptionMatch && descriptionMatch[1]) {
            description = descriptionMatch[1].trim();
            // Remove description from contentBlock to avoid re-parsing
            contentBlock = contentBlock.substring(description.length).trim();
        }
        
        // Extract topics
        let subtopics: string[] = [];
        const topicsMatch = contentBlock.match(/(?:#+\s*)?Topics:([\s\S]*?)(?:(?:#+\s*)?Learning Activities:|$)/i);
        if (topicsMatch && topicsMatch[1]) {
            subtopics = topicsMatch[1]
                .split('\n')
                .map(s => s.replace(/^-|^\*|^\d+\.\s*/, '').trim()) // Remove list markers
                .filter(s => s && s.length > 2); // Filter out empty or very short lines
        }

        // Extract practice task from learning activities
        let practiceTask = '';
        const activitiesMatch = contentBlock.match(/(?:#+\s*)?Learning Activities:([\s\S]*)/i);
        if (activitiesMatch && activitiesMatch[1]) {
            const activitiesText = activitiesMatch[1].trim();
            // Try to find a sentence that looks like a task, or take the first significant line
            const activityLines = activitiesText.split('\n').map(s => s.replace(/^-|^\*|^\d+\.\s*/, '').trim()).filter(s => s);
            if (activityLines.length > 0) {
                 // Look for lines starting with "Build", "Create", "Design", "Develop", "Write"
                const taskKeywords = ["build", "create", "design", "develop", "write", "implement", "complete", "solve"];
                let foundTask = activityLines.find(line => taskKeywords.some(keyword => line.toLowerCase().startsWith(keyword)));
                practiceTask = foundTask || activityLines[0]; // Fallback to the first activity
            }
        }
        if (!description && subtopics.length > 0) {
            description = `Focuses on: ${subtopics.join(', ').substring(0, 100)}...`;
        } else if (!description) {
            description = `Details for ${title}`;
        }


        generatedModules.push({
            id: uuidv4(),
            title: title || `Module ${generatedModules.length + 1}`,
            description: description.substring(0, 250), // Limit description length
            subtopics,
            practiceTask: practiceTask.substring(0, 250), // Limit task length
            contentType: 'video', // Default, admin can change
            estimatedTime: '1 week', // Default
            contentUrl: '',
            videoLinks: [],
        });
    }
    // If regex fails to find modules, try a simpler split if it's just a list of topics.
    if (generatedModules.length === 0 && syllabusText.includes('\n')) {
        const lines = syllabusText.split('\n').map(s => s.trim()).filter(s => s.length > 5); // Filter short lines
        if (lines.length > 1 && lines.length <= 15) { // Reasonable number of modules if it's just a list
             lines.forEach((line, index) => {
                generatedModules.push({
                    id: uuidv4(),
                    title: line.replace(/^-|^\*|^\d+\.\s*/, '').trim() || `Module ${index + 1}`,
                    description: `Details for ${line}`,
                    subtopics: [],
                    practiceTask: '',
                    contentType: 'video',
                    estimatedTime: '1 week',
                    contentUrl: '',
                    videoLinks: [],
                });
            });
        }
    }


    return generatedModules;
};


  const handleGenerateSyllabus = async (e: FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "AI Syllabus Generation is an admin feature.", variant: "destructive" });
      return;
    }
    if (!aiTopic.trim()) {
      toast({ title: "Error", description: "Please enter a course topic.", variant: "destructive" });
      return;
    }
    setLoadingSyllabus(true); setErrorSyllabus(null); setSyllabusResult(null);
    try {
      const input: AutoGenerateCourseSyllabusInput = { courseTopic: aiTopic, targetAudience, learningObjectives, desiredNumberOfModules: desiredModules };
      const result = await autoGenerateCourseSyllabus(input);
      setSyllabusResult(result.courseSyllabus);
        if (result.courseSyllabus) {
            const parsedModules = parseSyllabusToModules(result.courseSyllabus);
            if (parsedModules.length > 0) {
                setModules(parsedModules); // This will populate the Module Builder tab
                toast({ title: "AI Course Structure Generated", description: `${parsedModules.length} modules created. Please review and refine them in the Module Builder.`});
            } else {
                 toast({ title: "AI Syllabus Generated", description: "Syllabus text is available below. Could not auto-structure into modules. Please build modules manually or refine the AI prompt."});
            }
        } else {
             toast({ title: "AI Syllabus Failed", description: "The AI did not return a syllabus. Try adjusting your inputs.", variant: "destructive" });
        }

    } catch (err) {
      console.error("Error generating syllabus:", err);
      const errorMsg = err instanceof Error ? err.message : "Syllabus generation failed.";
      setErrorSyllabus(errorMsg);
      toast({ title: "AI Syllabus Failed", description: errorMsg, variant: "destructive" });
    } finally {
      setLoadingSyllabus(false);
    }
  };


  const handleSuggestVideosAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoSearchTopic.trim()) {
      toast({ title: "Error", description: "Please enter a topic for video search.", variant: "destructive" });
      return;
    }
    setLoadingAiVideos(true); setErrorAiVideos(null); setAiSuggestedVideosList([]);
    try {
      const input: SuggestYoutubeVideosForTopicInput = { searchQuery: videoSearchTopic, numberOfSuggestions: 5, preferredLanguage: user?.learningPreferences?.language };
      const result = await suggestYoutubeVideosForTopic(input);
      setAiSuggestedVideosList(result.suggestedVideos);
      if (result.suggestedVideos.length === 0) toast({ title: "AI Video Search", description: "No videos found." });
    } catch (err) {
      console.error("Error suggesting videos:", err);
      setErrorAiVideos(err instanceof Error ? err.message : "AI video suggestion failed.");
      toast({ title: "AI Video Suggestion Failed", description: errorAiVideos, variant: "destructive" });
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
           toast({ title: "Error", description: "Invalid YouTube video URL. Use embeddable or standard watch/playlist URL.", variant: "destructive" }); return;
        }
    }

    const newUserPick: VideoLink = {
      id: `userlib-${uuidv4()}`,
      youtubeEmbedUrl: embedUrl,
      title: manualVideoForm.url.substring(0,30) + `... (User Pick${isPlaylistFromForm ? ' Playlist' : ''})`,
      langCode: manualVideoForm.language.substring(0,2).toLowerCase(),
      langName: manualVideoForm.language,
      creator: manualVideoForm.creator,
      notes: manualVideoForm.notes,
      isPlaylist: isPlaylistFromForm,
    };
    const updatedPicks = [...userPickedVideosList, newUserPick];
    setUserPickedVideosList(updatedPicks);
    if (user) updateUserProfile({ customVideoLinks: updatedPicks });
    setManualVideoForm({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
    toast({ title: "Video Added", description: `Added to your personal library.` });
  };

  const handleAddVideoToPool = (video: VideoLink) => {
    if (courseVideoPool.find(v => v.youtubeEmbedUrl === video.youtubeEmbedUrl)) {
      toast({ title: "Already in Pool", description: "This video is already in this course's pool." }); return;
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
    if (user) updateUserProfile({ customVideoLinks: updatedPicks });
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
      toast({ title: "Permission Denied", description: "This is an admin feature.", variant: "destructive" }); return;
    }
    if (!currentModuleForm.title) {
      toast({ title: "Info", description: "Please provide a module title first.", variant: "default" });
      return;
    }
    setLoadingModuleSuggestions('subtopics');
    try {
      const input: SuggestModuleSubtopicsInput = {
        moduleTitle: currentModuleForm.title,
        moduleDescription: currentModuleForm.description,
        courseTopic: courseTitle,
      };
      const result = await suggestModuleSubtopics(input);
      setModuleSubtopicSuggestions(result.subtopics);
      toast({title: "AI Suggestions", description: "Subtopics suggested."})
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to get subtopic suggestions.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };

  const handleSuggestModulePracticeTask = async () => {
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "This is an admin feature.", variant: "destructive" }); return;
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
      toast({title: "AI Suggestion", description: "Practice task suggested."})
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to get practice task suggestion.", variant: "destructive" });
    } finally {
      setLoadingModuleSuggestions(null);
    }
  };
  
  const handleFindVideosForModule = async () => {
    if (user?.role !== 'admin') {
      toast({ title: "Permission Denied", description: "This is an admin feature.", variant: "destructive" }); return;
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
            preferredLanguage: user?.learningPreferences?.language,
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
        toast({description: "Suggested subtopics added to module."});
    }
  };
  const useSuggestedPracticeTask = () => {
    if (modulePracticeTaskSuggestion) {
        setCurrentModuleForm(prev => ({
            ...prev,
            practiceTask: modulePracticeTaskSuggestion
        }));
        setModulePracticeTaskSuggestion(''); 
        toast({description: "Suggested practice task used."});
    }
  };


  // --- Main Course Save & Submit ---
  const handleSaveCourse = () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save a course.", variant: "destructive"});
      return;
    }
    if (!courseTitle.trim() || !courseCategory.trim()) {
      toast({ title: "Error", description: "Course Title and Category are required.", variant: "destructive"});
      return;
    }
    const courseDataToSave: Partial<CourseType> & { authorId: string } = {
      id: currentCourseId || undefined, 
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

    const savedCourse = saveOrUpdateCourse(courseDataToSave);

    if (savedCourse) {
      setCurrentCourseId(savedCourse.id); 
      setCourseStatus(savedCourse.status || 'draft'); 
      setOriginalAuthorId(savedCourse.authorId || null); 
      toast({ title: "Course Saved", description: `"${savedCourse.title}" has been saved with all module changes.` });
    } else {
      toast({ title: "Save Failed", description: "Could not save the course. Please try again.", variant: "destructive"});
    }
  };
  
  const handleSubmitForReview = () => {
    if (!currentCourseId) {
        toast({ title: "Save Course First", description: "Please save the course before submitting for review.", variant: "destructive" });
        return;
    }
    if (courseVisibility !== 'public') {
        toast({ title: "Set Visibility to Public", description: "Only public courses can be submitted for review.", variant: "destructive" });
        return;
    }
     if (courseStatus !== 'draft') {
        toast({ title: "Already Submitted or Published", description: "This course is not in a 'draft' state for new submission.", variant: "default" });
        return;
    }

    const success = submitCourseForReview(currentCourseId);
    if (success) {
        setCourseStatus('pending_review');
        toast({ title: "Course Submitted", description: "Your course has been submitted for admin review." });
    } else {
        toast({ title: "Submission Failed", description: "Could not submit the course. Ensure it is saved and public.", variant: "destructive" });
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
        estimatedCourseDurationWeeks,
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
    switch(type) {
        case 'video': return <VideoIcon className="h-4 w-4 text-primary" />;
        case 'text':
        case 'markdown': return <FileTextIcon className="h-4 w-4 text-blue-500" />;
        case 'quiz': return <HelpCircleIcon className="h-4 w-4 text-orange-500" />;
        default: return <FileTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };


  return (
    <div className="space-y-8">
      <header className="space-y-2 flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
            <LayoutGrid className="h-10 w-10 mr-3 text-primary" /> 
            {currentCourseId ? "Edit Course" : "Create New Course"}
            </h1>
            <p className="text-xl text-muted-foreground">
            {currentCourseId ? `Modifying "${courseTitle || 'course'}"` : "Craft unique learning experiences."}
            {user?.role === 'admin' && <Badge variant="outline" className="ml-2 border-primary text-primary">Admin Mode</Badge>}
            </p>
        </div>
        <Button onClick={resetCourseForm} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Create New Course</Button>
      </header>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="settings">Course Settings</TabsTrigger>
          <TabsTrigger value="builder">Module Builder</TabsTrigger>
          <TabsTrigger value="schedule">Suggested Schedule (AI)</TabsTrigger>
          <TabsTrigger value="ai-tools">Video Pool & AI</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Course Settings</CardTitle>
              <CardDescription>Define the details, visibility, and parameters for your course.
                {currentCourseId && <span className="block text-xs mt-1">Editing Course ID: {currentCourseId} {originalAuthorId && `(Original Author: ${originalAuthorId})`}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title*</Label>
                  <Input id="courseTitle" placeholder="e.g., Advanced JavaScript" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCategory">Category*</Label>
                  <Input id="courseCategory" placeholder="e.g., Programming" value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseDescriptionText">Course Description</Label>
                <Textarea id="courseDescriptionText" placeholder="Overview of your course..." rows={4} value={courseDescriptionText} onChange={(e) => setCourseDescriptionText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input id="coverImage" type="url" placeholder="https://placehold.co/600x400.png" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
              </div>
              <Separator />
               <div className="space-y-3">
                <Label className="text-base font-medium">Visibility</Label>
                <RadioGroup value={courseVisibility} onValueChange={(value: CourseVisibility) => setCourseVisibility(value)} className="space-y-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="private" id="vis-private" /><Label htmlFor="vis-private" className="font-normal">Private</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="shared" id="vis-shared" /><Label htmlFor="vis-shared" className="font-normal">Shared (Link)</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="public" id="vis-public" /><Label htmlFor="vis-public" className="font-normal">Public</Label></div>
                </RadioGroup>
                {courseVisibility === 'public' && <p className="text-xs text-muted-foreground">Public courses require admin review.</p>}
              </div>
               <div className="space-y-2">
                <Label className="text-base font-medium">Course Status</Label>
                 <Badge variant={
                    courseStatus === "published" ? "default" : 
                    courseStatus === "pending_review" ? "outline" : 
                    courseStatus === "rejected" ? "destructive" :
                    "secondary"
                    } 
                       className={cn(
                        courseStatus === "published" && "bg-green-600 text-white",
                        courseStatus === "pending_review" && "border-orange-500 text-orange-500",
                        courseStatus === "rejected" && "bg-red-600 text-white",
                       )}
                >
                    {courseStatus?.replace("_", " ")}
                 </Badge>
              </div>
              <div className="flex justify-between items-center pt-4">
                <Button onClick={handleSaveCourse}><Save className="h-4 w-4 mr-2" /> Save Course & Modules</Button>
                 {courseVisibility === 'public' && courseStatus === "draft" && currentCourseId && (
                    <Button variant="outline" onClick={handleSubmitForReview}><Send className="h-4 w-4 mr-2" /> Submit for Review</Button>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="builder">
          <Card className="shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="text-2xl">Module Builder</CardTitle>
                    <CardDescription>
                        Design your course structure module by module. Admins can use AI for content ideas.
                    </CardDescription>
                </div>
                <Button onClick={() => handleOpenModuleEditor()}><PlusCircle className="mr-2 h-4 w-4"/> Add Module</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                 {modules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">No modules added yet. Click "Add Module" to start, or use the AI Syllabus Generator in the "AI Tools" tab.</p>
                 ) : (
                    <div className="space-y-3">
                        {modules.map((module, index) => (
                            <Card key={module.id} className="bg-muted/30">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {renderModuleContentTypeIcon(module.contentType)}
                                        <div>
                                            <p className="font-semibold">{index + 1}. {module.title}</p>
                                            <p className="text-xs text-muted-foreground">{module.description?.substring(0, 70) || 'No description'}...</p>
                                            <p className="text-xs text-muted-foreground">Type: {module.contentType} | Time: {module.estimatedTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => moveModule(index, 'up')} disabled={index === 0}><ChevronUp className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" onClick={() => moveModule(index, 'down')} disabled={index === modules.length - 1}><ChevronDown className="h-4 w-4"/></Button>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenModuleEditor(module)}><Edit className="mr-1 h-3 w-3"/>Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3"/>Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Module?</AlertDialogTitle><AlertDialogDescription>Are you sure to delete "{module.title}"?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteModule(module.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                 )}
                 <Dialog open={isModuleEditorOpen} onOpenChange={setIsModuleEditorOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                      <ScrollArea className="max-h-[80vh] p-1">
                        <DialogHeader className="px-5 pt-5">
                            <DialogTitle>{editingModule ? "Edit Module" : "Add New Module"}</DialogTitle>
                            <DialogDescription>Fill in the details for your module. Admins can use AI for content ideas.</DialogDescription>
                        </DialogHeader>
                        <div className="p-5 space-y-4">
                            <div><Label htmlFor="moduleTitle">Title*</Label><Input id="moduleTitle" name="title" value={currentModuleForm.title} onChange={handleModuleFormChange} /></div>
                            <div><Label htmlFor="moduleDescription">Description</Label><Textarea id="moduleDescription" name="description" value={currentModuleForm.description} onChange={handleModuleFormChange} rows={3}/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="moduleEstimatedTime">Est. Time</Label><Input id="moduleEstimatedTime" name="estimatedTime" value={currentModuleForm.estimatedTime} onChange={handleModuleFormChange} /></div>
                                <div>
                                    <Label htmlFor="moduleContentType">Content Type*</Label>
                                    <Select value={currentModuleForm.contentType} onValueChange={handleModuleContentTypeChange}>
                                        <SelectTrigger id="moduleContentType"><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="text">Text / Markdown</SelectItem>
                                            <SelectItem value="quiz">Quiz (Placeholder)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             {currentModuleForm.contentType === 'video' && (
                                <div>
                                    <Label htmlFor="moduleContentUrl">Primary Video</Label>
                                    <Select value={currentModuleForm.contentUrl} onValueChange={handleModuleContentUrlChange}>
                                        <SelectTrigger id="moduleContentUrl"><SelectValue placeholder="Select video from pool" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {courseVideoPool.map(video => (
                                                <SelectItem key={video.youtubeEmbedUrl} value={video.youtubeEmbedUrl}>{video.title} {video.isPlaylist ? "(Playlist)" : ""}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">Select a primary video from the Course Video Pool (manage in 'Video Pool & AI' tab).</p>
                                </div>
                            )}
                            {currentModuleForm.contentType === 'text' && (
                                <div><Label htmlFor="moduleContentData">Text/Markdown Content</Label><Textarea id="moduleContentData" name="contentData" value={currentModuleForm.contentData} onChange={handleModuleFormChange} rows={6} placeholder="Enter markdown content here..."/></div>
                            )}

                            <Separator className="my-4"/>
                            <Card className="bg-card p-0">
                                <CardHeader className="p-3 border-b"><CardTitle className="text-md flex items-center"><Brain className="h-5 w-5 mr-2 text-primary"/>AI Content Assistance (Admin Only)</CardTitle></CardHeader>
                                <CardContent className="p-3 space-y-3">
                                    {user?.role === 'admin' ? (
                                        <>
                                            <div className="space-y-2">
                                                <Button variant="outline" size="sm" onClick={handleSuggestModuleSubtopics} disabled={loadingModuleSuggestions === 'subtopics'} className="w-full justify-start">
                                                    {loadingModuleSuggestions === 'subtopics' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListPlus className="mr-2 h-4 w-4"/>} Suggest Subtopics
                                                </Button>
                                                {moduleSubtopicSuggestions.length > 0 && (
                                                    <div className="p-2 border rounded-md bg-muted/50 text-sm space-y-1">
                                                        <p className="font-medium text-xs">Suggested Subtopics:</p>
                                                        <ul className="list-disc list-inside pl-2 text-xs">
                                                            {moduleSubtopicSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                        <Button size="xs" variant="link" onClick={addSuggestedSubtopicsToModule}>Add to Module</Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Button variant="outline" size="sm" onClick={handleSuggestModulePracticeTask} disabled={loadingModuleSuggestions === 'task'} className="w-full justify-start">
                                                    {loadingModuleSuggestions === 'task' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckSquare className="mr-2 h-4 w-4"/>} Suggest Practice Task
                                                </Button>
                                                {modulePracticeTaskSuggestion && (
                                                    <div className="p-2 border rounded-md bg-muted/50 text-sm space-y-1">
                                                        <p className="font-medium text-xs">Suggested Practice Task:</p>
                                                        <p className="text-xs">{modulePracticeTaskSuggestion}</p>
                                                        <Button size="xs" variant="link" onClick={useSuggestedPracticeTask}>Use this Task</Button>
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={handleFindVideosForModule} disabled={loadingModuleSuggestions === 'videos'} className="w-full justify-start">
                                                {loadingModuleSuggestions === 'videos' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />} Find Videos for this Module
                                            </Button>
                                            {moduleVideoSuggestions.length > 0 && (
                                                <div className="p-2 border rounded-md bg-muted/50 text-sm space-y-1 max-h-40 overflow-y-auto">
                                                    <p className="font-medium text-xs">Suggested Videos (can be added to Course Video Pool):</p>
                                                    {moduleVideoSuggestions.map(v => (
                                                        <div key={v.youtubeEmbedUrl} className="text-xs border-b last:border-b-0 py-1">
                                                            <p className="truncate" title={v.title}>{v.title} ({v.langName})</p>
                                                            <Button size="xs" variant="link" onClick={() => handleAddVideoToPool(v)}>Add to Course Pool</Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">AI content assistance features are available for administrators.</p>
                                    )}
                                     <div><Label htmlFor="moduleSubtopics" className="text-xs">Current Subtopics (comma-separated)</Label><Input id="moduleSubtopics" name="subtopics" value={(currentModuleForm.subtopics || []).join(', ')} onChange={e => setCurrentModuleForm(prev => ({...prev, subtopics: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)}))} /></div>
                                     <div><Label htmlFor="modulePracticeTask" className="text-xs">Current Practice Task</Label><Textarea id="modulePracticeTask" name="practiceTask" value={currentModuleForm.practiceTask} onChange={handleModuleFormChange} rows={2}/></div>
                                </CardContent>
                            </Card>
                        </div>
                        <DialogFooter className="px-5 pb-5">
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSaveModule}><Save className="mr-2 h-4 w-4"/>Save Module</Button>
                        </DialogFooter>
                      </ScrollArea>
                    </DialogContent>
                 </Dialog>
              <Separator className="my-6"/>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" disabled><Eye className="h-4 w-4 mr-2" /> Preview Course</Button>
                <Button onClick={handleSaveCourse}><Save className="h-4 w-4 mr-2" /> Save Course & Modules</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><CalendarClock className="h-6 w-6 mr-2 text-primary"/>Suggested Course Schedule (AI)</CardTitle>
              <CardDescription>
                Generate a suggested weekly learning plan for this course. Admins can use AI to help populate this.
                This schedule is saved with the course and can be viewed by students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.role === 'admin' && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-4">
                  <h4 className="font-medium">AI Schedule Generator (Admin Tool)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedDurationWeeks">Estimated Course Duration (Weeks)</Label>
                    <Input 
                      id="estimatedDurationWeeks" 
                      type="number" 
                      value={estimatedDurationWeeks} 
                      onChange={(e) => setEstimatedDurationWeeks(parseInt(e.target.value, 10) || 1)} 
                      min="1" 
                      max="52"
                    />
                  </div>
                  <Button onClick={handleGenerateCourseSchedule} disabled={loadingCourseSchedule || modules.length === 0}>
                    {loadingCourseSchedule ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    Generate Schedule with AI
                  </Button>
                  {modules.length === 0 && <p className="text-xs text-destructive">Please add modules in the 'Module Builder' tab first.</p>}
                  {errorCourseSchedule && (
                     <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                        <AlertTriangle className="h-4 w-4 inline mr-1" /> {errorCourseSchedule}
                     </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="suggestedScheduleTextarea" className="text-lg font-medium">Course Schedule Text (Markdown supported)</Label>
                <Textarea
                  id="suggestedScheduleTextarea"
                  value={suggestedSchedule}
                  onChange={(e) => setSuggestedSchedule(e.target.value)}
                  rows={15}
                  placeholder="Manually enter or edit the AI-generated weekly schedule here..."
                  className="font-mono text-sm"
                />
              </div>
               <div className="pt-4">
                <h4 className="text-lg font-medium mb-2">Schedule Preview:</h4>
                {suggestedSchedule ? (
                     <ScrollArea className="h-[400px] border rounded-md p-4 bg-background">
                        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{suggestedSchedule}</ReactMarkdown>
                     </ScrollArea>
                ) : (
                    <p className="text-muted-foreground">No schedule defined yet. Generate one with AI or type directly above.</p>
                )}
              </div>
              <div className="flex justify-end pt-4">
                 <Button onClick={handleSaveCourse}><Save className="h-4 w-4 mr-2" /> Save Schedule with Course</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="ai-tools">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">AI-Powered Syllabus Generator</CardTitle>
              <CardDescription>Kickstart your course design by letting AI generate a syllabus. Generated modules will appear in the "Module Builder" tab. (Admin Only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleGenerateSyllabus} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiTopic">Course Topic*</Label>
                  <Input id="aiTopic" placeholder="e.g., Intro to Python" value={aiTopic} onChange={(e: ChangeEvent<HTMLInputElement>) => setAiTopic(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input id="targetAudience" placeholder="e.g., Beginners" value={targetAudience} onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)} />
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="learningObjectives">Learning Objectives (comma-separated)</Label>
                  <Textarea id="learningObjectives" placeholder="e.g., Understand core concepts" value={learningObjectives} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLearningObjectives(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desiredModules">Number of Modules*</Label>
                  <Input id="desiredModules" type="number" min="1" max="20" value={desiredModules} onChange={(e: ChangeEvent<HTMLInputElement>) => setDesiredModules(parseInt(e.target.value, 10) || 1)} required/>
                </div>
                <Button type="submit" disabled={loadingSyllabus || user?.role !== 'admin'} className="w-full md:w-auto">
                  {loadingSyllabus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Generate Full Course Structure
                </Button>
                {user?.role !== 'admin' && <p className="text-xs text-muted-foreground">AI Syllabus & Module Structure Generation is an admin feature.</p>}
              </form>
              {errorSyllabus && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md"><AlertTriangle className="h-5 w-5 inline mr-1" />{errorSyllabus}</div>
              )}
              {syllabusResult && !loadingSyllabus && (
                <Card className="mt-6"><CardHeader><CardTitle>Raw AI Syllabus Output (Preview)</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto"><ReactMarkdown>{syllabusResult}</ReactMarkdown></CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><Youtube className="h-7 w-7 mr-2 text-red-600" /> Course Video Pool</CardTitle>
                <CardDescription>Find YouTube videos or add your own picks to your course video pool. These can then be assigned to modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSuggestVideosAI} className="space-y-3">
                    <Label htmlFor="videoSearchTopic">AI Video Search Topic (for Pool)</Label>
                    <div className="flex gap-2">
                        <Input id="videoSearchTopic" placeholder="e.g., React Hooks tutorial" value={videoSearchTopic} onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoSearchTopic(e.target.value)} required />
                        <Button type="submit" disabled={loadingAiVideos}>
                            {loadingAiVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
                {errorAiVideos && ( <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm"><AlertTriangle className="h-4 w-4 inline mr-1" /> {errorAiVideos}</div> )}
                 {(aiSuggestedVideosList.length > 0 || courseVideoPool.length > 0) && (
                    <div>
                        <h4 className="font-semibold mb-2 text-md">Course Video Pool ({courseVideoPool.length})</h4>
                        <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/20 space-y-2">
                            {courseVideoPool.map((video, idx) => (
                                <Card key={`pool-${idx}`} className="p-3 text-sm bg-background shadow-sm flex justify-between items-center">
                                    <div className="flex-grow mr-2">
                                       <p className="font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                                       <p className="text-xs text-muted-foreground">Creator: {video.creator || 'N/A'} - Lang: {video.langName}</p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveVideoFromPool(video.youtubeEmbedUrl)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </Card>
                            ))}
                             {courseVideoPool.length === 0 && <p className="text-xs text-center py-4">Pool is empty. Add videos from AI suggestions or your library.</p>}
                        </ScrollArea>
                    </div>
                )}
                {aiSuggestedVideosList.length > 0 && (
                    <div className="mt-3">
                        <h4 className="font-semibold mb-2 text-md">AI-Suggested Videos ({aiSuggestedVideosList.length})</h4>
                        <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/20 space-y-2">
                            {aiSuggestedVideosList.map((video, idx) => (
                                <Card key={`ai-${idx}`} className="p-3 text-sm bg-background shadow-sm">
                                    <p className="font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                                    {video.creator && <p className="text-xs text-muted-foreground">Creator: {video.creator}</p>}
                                    <p className="text-xs text-muted-foreground">Language: {video.langName}</p>
                                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleAddVideoToPool(video)}><ListPlus className="h-4 w-4 mr-2" /> Add to Course Pool</Button>
                                </Card>
                            ))}
                        </ScrollArea>
                    </div>
                )}
                <Separator />
                <div className="space-y-3 p-1 border rounded-md bg-card shadow-sm">
                    <h4 className="font-semibold text-md px-3 pt-3">Manually Add Video/Playlist to My Library</h4>
                    <form onSubmit={handleAddUserPick} className="space-y-3 px-3 pb-3">
                        <div className="space-y-1"><Label htmlFor="manualVideoUrl">YouTube URL*</Label><Input id="manualVideoUrl" name="url" placeholder="Video or Playlist link" value={manualVideoForm.url} onChange={handleManualVideoFormChange} required /></div>
                        <div className="flex items-center space-x-2 mt-2 mb-1"><Checkbox id="manualVideoIsPlaylist" checked={manualVideoForm.isPlaylist} onCheckedChange={handleManualVideoIsPlaylistChange} /><Label htmlFor="manualVideoIsPlaylist" className="text-sm font-normal">This URL is for a playlist</Label></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="manualVideoLang">Language*</Label><Input id="manualVideoLang" name="language" placeholder="e.g., English" value={manualVideoForm.language} onChange={handleManualVideoFormChange} required /></div><div className="space-y-1"><Label htmlFor="manualVideoCreator">Creator</Label><Input id="manualVideoCreator" name="creator" placeholder="e.g., ChannelName" value={manualVideoForm.creator} onChange={handleManualVideoFormChange} /></div></div>
                        <div className="space-y-1"><Label htmlFor="manualVideoNotes">Notes</Label><Textarea id="manualVideoNotes" name="notes" placeholder="Brief notes..." value={manualVideoForm.notes} onChange={handleManualVideoFormChange} rows={2} /></div>
                        <Button type="submit" className="w-full md:w-auto"><PlusCircle className="h-4 w-4 mr-2" /> Add to My Library</Button>
                    </form>
                </div>
                 {userPickedVideosList.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-md">My Video Library ({userPickedVideosList.length})</h4>
                         <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/20 space-y-2">
                            {userPickedVideosList.map((video, idx) => (
                                <Card key={`user-${idx}`} className="p-3 text-sm bg-background shadow-sm flex justify-between items-start">
                                    <div className="flex-grow mr-2">
                                        <p className="font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                                        {video.creator && <p className="text-xs text-muted-foreground">Creator: {video.creator}</p>}
                                        <p className="text-xs text-muted-foreground">Language: {video.langName}</p>
                                        {video.notes && <p className="text-xs text-muted-foreground italic truncate" title={video.notes}>Notes: {video.notes}</p>}
                                        <Button variant="outline" size="xs" className="mt-2 w-full text-xs" onClick={() => handleAddVideoToPool(video)}><ListPlus className="h-3 w-3 mr-1" /> Add to Course Pool</Button>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveFromUserPicks(video.youtubeEmbedUrl)} className="flex-shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </Card>
                            ))}
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="import-export">
          <Card className="shadow-xl"><CardHeader><CardTitle className="text-2xl">Import / Export Course Content</CardTitle><CardDescription>Manage your course data. (Coming soon)</CardDescription></CardHeader>
            <CardContent className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-background"><CardHeader><CardTitle className="text-lg">Import Course</CardTitle></CardHeader><CardContent className="space-y-3"><Input type="file" disabled /><Button className="w-full" variant="outline" disabled><Upload className="h-4 w-4 mr-2" />Import</Button></CardContent></Card>
                <Card className="bg-background"><CardHeader><CardTitle className="text-lg">Export Course</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Select format.</p><div className="flex gap-2"><Button className="flex-1" variant="outline" disabled>CSV</Button><Button className="flex-1" variant="outline" disabled>YAML</Button><Button className="flex-1" variant="outline" disabled>JSON</Button></div><Button className="w-full" disabled><Download className="h-4 w-4 mr-2" />Download</Button></CardContent></Card>
            </div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
