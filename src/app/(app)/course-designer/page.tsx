
"use client";

import { useState, type ChangeEvent, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, LayoutGrid, Loader2, AlertTriangle, Youtube, ListPlus, Trash2, Edit, Send, CheckSquare, XCircle } from 'lucide-react';
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import type { VideoLink, Course as CourseType } from '@/lib/types';
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


interface ManualVideoFormState {
  url: string;
  language: string;
  creator: string;
  notes: string;
  isPlaylist: boolean;
}

type CourseVisibility = "private" | "shared" | "public";

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
  const [modules, setModules] = useState<CourseType['modules']>([]); 
  const [originalAuthorId, setOriginalAuthorId] = useState<string | null>(null);


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
     // Do not reset userPickedVideosList as it's the user's library
    // Clear query params if any
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
        // Authorization: Admin can edit any course. Non-admin can only edit their own.
        if (user.role !== 'admin' && courseToEdit.authorId !== user.id) {
            toast({ title: "Unauthorized", description: "You are not authorized to edit this course.", variant: "destructive" });
            setIsLoadingCourse(false);
            router.push('/course-designer'); // Redirect to create new or their own
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
        // Assuming videoLinks for the course are directly under course or modules.
        // For simplicity, we are not deeply populating courseVideoPool from loaded modules here.
        // That would require a more complex mapping from module.videoLinks to courseVideoPool
        // and deciding which ones belong to the pool vs. are directly assigned.
        // For now, an admin/author would re-curate the pool or assign videos to modules.
        setCourseVideoPool([]); // Reset pool when loading a course, to be repopulated if needed.

        toast({ title: "Course Loaded", description: `Editing "${courseToEdit.title}".` });
    } else {
        toast({ title: "Error", description: `Course with ID ${courseId} not found.`, variant: "destructive" });
        resetCourseForm(); // Reset to new course state
    }
    setIsLoadingCourse(false);
  }, [user, toast, router, resetCourseForm]);


  useEffect(() => {
    const courseIdFromQuery = searchParams.get('courseId');
    if (courseIdFromQuery && !isLoadingCourse) {
        // Only load if not already loading and if courseId is different from current one, or if no currentCourseId
        if (courseIdFromQuery !== currentCourseId || !currentCourseId) {
            loadCourseForEditing(courseIdFromQuery);
        }
    } else if (!courseIdFromQuery && !currentCourseId && !isLoadingCourse) { // Ensure reset is called only if no query and no current course
        // If no query param, reset to a new course form unless a course is already loaded
        // resetCourseForm(); // This might be too aggressive if user is just navigating tabs
    }
  }, [searchParams, loadCourseForEditing, currentCourseId, isLoadingCourse]);


  useEffect(() => {
    if (user && user.customVideoLinks) {
      setUserPickedVideosList(user.customVideoLinks);
    }
  }, [user]);


  const handleGenerateSyllabus = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      toast({ title: "Error", description: "Please enter a course topic.", variant: "destructive" });
      return;
    }
    setLoadingSyllabus(true); setErrorSyllabus(null); setSyllabusResult(null);
    try {
      const input: AutoGenerateCourseSyllabusInput = { courseTopic: aiTopic, targetAudience, learningObjectives, desiredNumberOfModules: desiredModules };
      const result = await autoGenerateCourseSyllabus(input);
      setSyllabusResult(result.courseSyllabus);
    } catch (err) {
      console.error("Error generating syllabus:", err);
      setErrorSyllabus(err instanceof Error ? err.message : "Syllabus generation failed.");
      toast({ title: "AI Syllabus Failed", description: "Could not generate. Try again.", variant: "destructive" });
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

  const handleSaveCourse = () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save a course.", variant: "destructive"});
      return;
    }
    if (!courseTitle.trim() || !courseCategory.trim()) {
      toast({ title: "Error", description: "Course Title and Category are required.", variant: "destructive"});
      return;
    }

    // If an admin is editing, the authorId submitted with the save data is the admin's ID.
    // The saveOrUpdateCourse function, as currently written, will update the course's authorId
    // to the ID of the user performing the save. This is a simplification.
    // A more robust system might distinguish original author from last editor.
    const courseDataToSave: Partial<CourseType> & { authorId: string } = {
      id: currentCourseId || undefined, 
      title: courseTitle,
      category: courseCategory,
      description: courseDescriptionText,
      imageUrl: coverImageUrl,
      visibility: courseVisibility,
      status: courseStatus, 
      modules: modules, // For now, modules are not deeply editable here
      authorId: user.id, // The user performing the save
      // If editing an existing course, its originalAuthorId is not directly part of the save payload here,
      // but saveOrUpdateCourse in placeholder-data will set the authorId to user.id if it's an update.
    };

    const savedCourse = saveOrUpdateCourse(courseDataToSave);

    if (savedCourse) {
      setCurrentCourseId(savedCourse.id); 
      setCourseStatus(savedCourse.status || 'draft'); 
      setOriginalAuthorId(savedCourse.authorId || null); // Reflect the author from the saved data
      toast({ title: "Course Saved", description: `"${savedCourse.title}" has been saved.` });
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


  if (isLoadingCourse) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-muted-foreground">Loading course data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2 flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
            <LayoutGrid className="h-10 w-10 mr-3 text-primary" /> 
            {currentCourseId ? "Edit Course" : "Create New Course"}
            </h1>
            <p className="text-xl text-muted-foreground">
            {currentCourseId ? `Modifying "${courseTitle || 'course'}"` : "Craft your unique learning experiences."}
            </p>
        </div>
        <Button onClick={resetCourseForm} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Create New Course</Button>
      </header>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="settings">Course Settings</TabsTrigger>
          <TabsTrigger value="builder">Module Builder (Basic)</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools & Video</TabsTrigger>
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
                <Button onClick={handleSaveCourse}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
                 {courseVisibility === 'public' && courseStatus === "draft" && currentCourseId && (
                    <Button variant="outline" onClick={handleSubmitForReview}><Send className="h-4 w-4 mr-2" /> Submit for Review</Button>
                 )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="builder">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Module Builder (Basic)</CardTitle>
              <CardDescription>
                Attach videos from your pool to basic modules. Full drag & drop and content type editing coming soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[200px] border-2 border-dashed border-border rounded-lg p-6 bg-muted/30">
                <p className="text-muted-foreground text-center">Current Modules: {modules.length}</p>
                 <p className="text-xs text-muted-foreground text-center"> (Full module creation/editing UI is planned)</p>
                {/* Basic module display */}
                 {modules.map(m => <div key={m.id} className="p-2 border-b">{m.title}</div>)}
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Video Pool ({courseVideoPool.length} videos)</h3>
                {courseVideoPool.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No videos added to this course yet. Use the "AI Tools & Video" tab to curate videos.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/20">
                    {courseVideoPool.map((video, idx) => (
                      <Card key={idx} className="p-3 flex justify-between items-center bg-background shadow-sm">
                        <div className="flex-grow">
                           <p className="text-sm font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                           <p className="text-xs text-muted-foreground">Creator: {video.creator || 'N/A'} - Lang: {video.langName}</p>
                           {video.notes && <p className="text-xs text-muted-foreground italic truncate" title={video.notes}>Notes: {video.notes}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveVideoFromPool(video.youtubeEmbedUrl)} className="ml-2 flex-shrink-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" disabled><Eye className="h-4 w-4 mr-2" /> Preview Course</Button>
                <Button onClick={handleSaveCourse}><Save className="h-4 w-4 mr-2" /> Save Draft</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="ai-tools">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">AI-Powered Syllabus Generator</CardTitle>
              <CardDescription>Kickstart your course design by letting AI generate a syllabus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleGenerateSyllabus} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiTopic">Course Topic</Label>
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
                  <Label htmlFor="desiredModules">Number of Modules</Label>
                  <Input id="desiredModules" type="number" min="1" max="20" value={desiredModules} onChange={(e: ChangeEvent<HTMLInputElement>) => setDesiredModules(parseInt(e.target.value, 10) || 1)} />
                </div>
                <Button type="submit" disabled={loadingSyllabus} className="w-full md:w-auto">
                {loadingSyllabus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Generate Syllabus
              </Button>
              </form>
              {errorSyllabus && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md"><AlertTriangle className="h-5 w-5 inline mr-1" />{errorSyllabus}</div>
              )}
              {syllabusResult && !loadingSyllabus && (
                <Card className="mt-6"><CardHeader><CardTitle>Generated Syllabus</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{syllabusResult}</ReactMarkdown></CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><Youtube className="h-7 w-7 mr-2 text-red-600" /> Video Curation</CardTitle>
                <CardDescription>Find YouTube videos or add your own picks to your course video pool.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSuggestVideosAI} className="space-y-3">
                    <Label htmlFor="videoSearchTopic">AI Video Search Topic</Label>
                    <div className="flex gap-2">
                        <Input id="videoSearchTopic" placeholder="e.g., React Hooks tutorial" value={videoSearchTopic} onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoSearchTopic(e.target.value)} required />
                        <Button type="submit" disabled={loadingAiVideos}>
                            {loadingAiVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
                {errorAiVideos && ( <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm"><AlertTriangle className="h-4 w-4 inline mr-1" /> {errorAiVideos}</div> )}
                {aiSuggestedVideosList.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-md">AI-Suggested Videos ({aiSuggestedVideosList.length})</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border rounded-md p-2 bg-muted/20">
                            {aiSuggestedVideosList.map((video, idx) => (
                                <Card key={`ai-${idx}`} className="p-3 text-sm bg-background shadow-sm">
                                    <p className="font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                                    {video.creator && <p className="text-xs text-muted-foreground">Creator: {video.creator}</p>}
                                    <p className="text-xs text-muted-foreground">Language: {video.langName}</p>
                                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleAddVideoToPool(video)}><ListPlus className="h-4 w-4 mr-2" /> Add to Course Pool</Button>
                                </Card>
                            ))}
                        </div>
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
                         <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border rounded-md p-2 bg-muted/20">
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
                        </div>
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
