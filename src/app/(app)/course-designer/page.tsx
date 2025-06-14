
"use client";

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, LayoutGrid, Loader2, AlertTriangle, Youtube, ListPlus, Trash2, Edit } from 'lucide-react';
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import type { VideoLink } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";


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
  const [aiTopic, setAiTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Beginners');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [desiredModules, setDesiredModules] = useState(5);

  const [syllabusResult, setSyllabusResult] = useState<string | null>(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [errorSyllabus, setErrorSyllabus] = useState<string | null>(null);

  const [videoSearchTopic, setVideoSearchTopic] = useState('');
  const [aiSuggestedVideosList, setAiSuggestedVideosList] = useState<VideoLink[]>([]);
  const [loadingAiVideos, setLoadingAiVideos] = useState(false);
  const [errorAiVideos, setErrorAiVideos] = useState<string | null>(null);

  const [manualVideoForm, setManualVideoForm] = useState<ManualVideoFormState>({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
  const [userPickedVideosList, setUserPickedVideosList] = useState<VideoLink[]>([]);
  const [courseVideoPool, setCourseVideoPool] = useState<VideoLink[]>([]);

  // Course Settings State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDescriptionText, setCourseDescriptionText] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [courseVisibility, setCourseVisibility] = useState<CourseVisibility>("private");
  const [courseStatus, setCourseStatus] = useState<string>("Draft");

  const handleGenerateSyllabus = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course topic for syllabus generation.",
        variant: "destructive",
      });
      return;
    }

    setLoadingSyllabus(true);
    setErrorSyllabus(null);
    setSyllabusResult(null);

    try {
      const input: AutoGenerateCourseSyllabusInput = {
        courseTopic: aiTopic,
        targetAudience,
        learningObjectives,
        desiredNumberOfModules: desiredModules,
      };
      const result = await autoGenerateCourseSyllabus(input);
      setSyllabusResult(result.courseSyllabus);
    } catch (err) {
      console.error("Error generating syllabus:", err);
      setErrorSyllabus(err instanceof Error ? err.message : "An unknown error occurred.");
      toast({
        title: "AI Syllabus Generation Failed",
        description: "Could not generate the syllabus. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const handleSuggestVideosAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoSearchTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic to search for videos.",
        variant: "destructive",
      });
      return;
    }
    setLoadingAiVideos(true);
    setErrorAiVideos(null);
    setAiSuggestedVideosList([]);
    try {
      const input: SuggestYoutubeVideosForTopicInput = { searchQuery: videoSearchTopic, numberOfSuggestions: 5 };
      const result = await suggestYoutubeVideosForTopic(input);
      setAiSuggestedVideosList(result.suggestedVideos);
      if (result.suggestedVideos.length === 0) {
        toast({ title: "AI Video Search", description: "No videos found for this topic." });
      }
    } catch (err) {
      console.error("Error suggesting videos:", err);
      const errorMessage = err instanceof Error ? err.message : "AI video suggestion failed.";
      setErrorAiVideos(errorMessage);
      toast({ title: "AI Video Suggestion Failed", description: errorMessage, variant: "destructive" });
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
            if (listId) {
                embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}`;
            } else {
                toast({ title: "Error", description: "Invalid YouTube playlist URL format.", variant: "destructive" });
                return;
            }
        } else if (embedUrl.includes("youtube.com/embed/videoseries?list=")) {
            // Already a valid embed playlist URL
        } else {
            toast({ title: "Warning", description: "URL marked as playlist, but format is not a standard YouTube playlist link. Please ensure it's correct.", variant: "default" });
            // Proceeding with user's intent, URL as is
        }
    } else { // It's an individual video
        if (embedUrl.includes("watch?v=")) {
            const videoId = embedUrl.split("watch?v=")[1]?.split("&")[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
            else { toast({ title: "Error", description: "Invalid YouTube video URL (watch?v=).", variant: "destructive" }); return; }
        } else if (embedUrl.includes("youtu.be/")) {
            const videoId = embedUrl.split("youtu.be/")[1]?.split("?")[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
            else { toast({ title: "Error", description: "Invalid YouTube video URL (youtu.be/).", variant: "destructive" }); return; }
        } else if (embedUrl.includes("youtube.com/embed/") && !embedUrl.includes("list=")) {
            // Already a valid individual embed URL
        } else {
            // Attempt to parse other formats if it's not explicitly an embed link
             try {
                const urlObject = new URL(embedUrl);
                let videoId = urlObject.searchParams.get('v'); 
                if (!videoId && urlObject.pathname.startsWith('/embed/')) { 
                     videoId = urlObject.pathname.split('/embed/')[1]?.split('/')[0];
                }
                if (!videoId) { 
                    const pathParts = urlObject.pathname.split('/');
                    const potentialId = pathParts.pop() || pathParts.pop(); 
                    if (potentialId && potentialId.length === 11 && !potentialId.includes('.')) { 
                        videoId = potentialId;
                    }
                }

                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (!embedUrl.includes("/embed/")) { 
                    toast({ title: "Error", description: "Could not determine YouTube video ID. Please use a standard YouTube video link.", variant: "destructive" });
                    return;
                }
            } catch (error) {
                 if (!embedUrl.includes("/embed/")) { 
                    toast({ title: "Error", description: "Invalid URL format. Please use a standard YouTube video link.", variant: "destructive" });
                    return;
                }
            }
        }
    }

    const newUserPick: VideoLink = {
      youtubeEmbedUrl: embedUrl,
      title: `${manualVideoForm.url.substring(0, 50)}... (User Submitted${isPlaylistFromForm ? ' Playlist' : ''})`,
      langCode: manualVideoForm.language.substring(0,2).toLowerCase(),
      langName: manualVideoForm.language,
      creator: manualVideoForm.creator,
      notes: manualVideoForm.notes,
      isPlaylist: isPlaylistFromForm,
    };
    setUserPickedVideosList([...userPickedVideosList, newUserPick]);
    setManualVideoForm({ url: '', language: 'English', creator: '', notes: '', isPlaylist: false });
    toast({ title: "Video Added", description: `Your ${isPlaylistFromForm ? 'playlist' : 'video'} has been added to User Picks.` });
  };

  const handleAddVideoToPool = (video: VideoLink) => {
    if (courseVideoPool.find(v => v.youtubeEmbedUrl === video.youtubeEmbedUrl)) {
      toast({ title: "Already in Pool", description: "This video is already in your course pool." });
      return;
    }
    setCourseVideoPool([...courseVideoPool, video]);
    toast({ title: "Video Added to Pool", description: `"${video.title}" added to course video pool.` });
  };

  const handleRemoveVideoFromPool = (videoUrl: string) => {
    setCourseVideoPool(courseVideoPool.filter(v => v.youtubeEmbedUrl !== videoUrl));
    toast({ title: "Video Removed", description: "Video removed from course video pool." });
  };

  const handleSaveCourseSettings = () => {
    console.log({ courseTitle, courseCategory, courseDescriptionText, coverImageUrl, courseVisibility, courseStatus });
    toast({ title: "Settings Saved", description: "Course settings have been saved (simulated)." });
    setCourseStatus("Draft - Saved");
  };


  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <LayoutGrid className="h-10 w-10 mr-3 text-primary" /> My Course Designer
        </h1>
        <p className="text-xl text-muted-foreground">
          Craft your unique learning experiences and share your knowledge.
        </p>
      </header>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="builder">Module Builder</TabsTrigger>
          <TabsTrigger value="settings">Course Settings</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools & Video</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Visual Module Builder</CardTitle>
              <CardDescription>
                Design your course structure. Drag lessons, quizzes, and assignments into modules. (Interactive builder coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[300px] border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30">
                <p className="text-muted-foreground mb-4 text-center">Drag & drop modules here, or click to add content blocks like lessons, videos from your pool, PDFs, quizzes, and assignments.</p>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Module Element
                </Button>
              </div>
              <div className="space-y-4">
                <Card className="bg-background">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Module 1: Introduction to [Your Topic]</p>
                      <p className="text-xs text-muted-foreground">Contains: 1 Video, 1 Article, 1 Quiz</p>
                    </div>
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                  </CardContent>
                </Card>
                 <Card className="bg-background">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Module 2: Core Concepts</p>
                      <p className="text-xs text-muted-foreground">Contains: 2 Videos, 1 PDF Guide, 1 Practice Task</p>
                    </div>
                     <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                  </CardContent>
                </Card>
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
                <Button variant="outline"><Eye className="h-4 w-4 mr-2" /> Preview Course</Button>
                <Button><Save className="h-4 w-4 mr-2" /> Save Draft</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Course Settings</CardTitle>
              <CardDescription>Define the details, visibility, and parameters for your course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title</Label>
                  <Input id="courseTitle" placeholder="e.g., Advanced JavaScript Techniques" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCategory">Category</Label>
                  <Input id="courseCategory" placeholder="e.g., Programming, Design, Business" value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseDescriptionText">Course Description</Label>
                <Textarea id="courseDescriptionText" placeholder="Provide a detailed overview of your course..." rows={4} value={courseDescriptionText} onChange={(e) => setCourseDescriptionText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input id="coverImage" type="url" placeholder="https://placehold.co/600x400.png" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
              </div>
              <Separator />
               <div className="space-y-3">
                <Label className="text-base font-medium">Visibility</Label>
                <RadioGroup value={courseVisibility} onValueChange={(value: CourseVisibility) => setCourseVisibility(value)} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="vis-private" />
                    <Label htmlFor="vis-private" className="font-normal">Private (Only you can access)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shared" id="vis-shared" />
                    <Label htmlFor="vis-shared" className="font-normal">Shared (Accessible via direct link)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="vis-public" />
                    <Label htmlFor="vis-public" className="font-normal">Public (Listed in catalog, requires admin review)</Label>
                  </div>
                </RadioGroup>
                {courseVisibility === 'public' && <p className="text-xs text-muted-foreground">Public courses will be submitted for admin review before appearing in the catalog.</p>}
              </div>
               <div className="space-y-2">
                <Label className="text-base font-medium">Course Status</Label>
                 <Badge variant={courseStatus.includes("Published") ? "default" : courseStatus.includes("Pending") ? "outline" : "secondary"} 
                       className={cn(
                        courseStatus.includes("Published") && "bg-green-600 text-white",
                        courseStatus.includes("Pending") && "border-orange-500 text-orange-500",
                        !courseStatus.includes("Published") && !courseStatus.includes("Pending") && "bg-muted text-muted-foreground"
                       )}
                >
                    {courseStatus}
                 </Badge>
              </div>
              <div className="flex justify-between items-center pt-4">
                <Button onClick={handleSaveCourseSettings}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
                 {courseVisibility === 'public' && courseStatus.includes("Draft") && (
                    <Button variant="outline">Submit for Review</Button>
                 )}
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
                  <Input id="aiTopic" placeholder="e.g., Introduction to Python Programming" value={aiTopic} onChange={(e: ChangeEvent<HTMLInputElement>) => setAiTopic(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input id="targetAudience" placeholder="e.g., Beginners, Intermediate, Advanced" value={targetAudience} onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)} />
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="learningObjectives">Learning Objectives (comma-separated)</Label>
                  <Textarea id="learningObjectives" placeholder="e.g., Understand core concepts, Build a simple app" value={learningObjectives} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLearningObjectives(e.target.value)} />
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
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-semibold">Error Generating Syllabus</p>
                  </div>
                  <p className="text-sm mt-1">{errorSyllabus}</p>
                </div>
              )}

              {syllabusResult && !loadingSyllabus && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Generated Syllabus Outline</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{syllabusResult}</ReactMarkdown>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><Youtube className="h-7 w-7 mr-2 text-red-600" /> Video Curation</CardTitle>
                <CardDescription>Find YouTube videos by topic or add your own picks to your course video pool.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSuggestVideosAI} className="space-y-3">
                    <Label htmlFor="videoSearchTopic">AI Video Search Topic</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="videoSearchTopic" 
                            placeholder="e.g., React Hooks tutorial, Advanced CSS Grid" 
                            value={videoSearchTopic} 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoSearchTopic(e.target.value)} 
                            required 
                        />
                        <Button type="submit" disabled={loadingAiVideos}>
                            {loadingAiVideos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
                {errorAiVideos && (
                    <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                        <AlertTriangle className="h-4 w-4 inline mr-1" /> {errorAiVideos}
                    </div>
                )}
                {aiSuggestedVideosList.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-md">AI-Suggested Videos ({aiSuggestedVideosList.length})</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border rounded-md p-2 bg-muted/20">
                            {aiSuggestedVideosList.map((video, idx) => (
                                <Card key={`ai-${idx}`} className="p-3 text-sm bg-background shadow-sm">
                                    <p className="font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                                    {video.creator && <p className="text-xs text-muted-foreground">Creator: {video.creator}</p>}
                                    <p className="text-xs text-muted-foreground">Language: {video.langName}</p>
                                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleAddVideoToPool(video)}>
                                        <ListPlus className="h-4 w-4 mr-2" /> Add to Course Pool
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                <Separator />
                <div className="space-y-3 p-1 border rounded-md bg-card shadow-sm">
                    <h4 className="font-semibold text-md px-3 pt-3">Manually Add Video/Playlist</h4>
                    <form onSubmit={handleAddUserPick} className="space-y-3 px-3 pb-3">
                        <div className="space-y-1">
                            <Label htmlFor="manualVideoUrl">YouTube URL (Video or Playlist)*</Label>
                            <Input id="manualVideoUrl" name="url" placeholder="https://www.youtube.com/watch?v=... or /playlist?list=..." value={manualVideoForm.url} onChange={handleManualVideoFormChange} required />
                        </div>
                        <div className="flex items-center space-x-2 mt-2 mb-1"> {/* Reduced vertical margin */}
                            <Checkbox
                                id="manualVideoIsPlaylist"
                                checked={manualVideoForm.isPlaylist}
                                onCheckedChange={handleManualVideoIsPlaylistChange}
                            />
                            <Label htmlFor="manualVideoIsPlaylist" className="text-sm font-normal">
                                This URL is for a playlist
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="manualVideoLang">Language*</Label>
                                <Input id="manualVideoLang" name="language" placeholder="e.g., English, Hindi" value={manualVideoForm.language} onChange={handleManualVideoFormChange} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="manualVideoCreator">Creator (Optional)</Label>
                                <Input id="manualVideoCreator" name="creator" placeholder="e.g., ChannelName" value={manualVideoForm.creator} onChange={handleManualVideoFormChange} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="manualVideoNotes">Notes (Optional)</Label>
                            <Textarea id="manualVideoNotes" name="notes" placeholder="Brief notes about the video/playlist..." value={manualVideoForm.notes} onChange={handleManualVideoFormChange} rows={2} />
                        </div>
                        <Button type="submit" className="w-full md:w-auto"><PlusCircle className="h-4 w-4 mr-2" /> Add User Pick</Button>
                    </form>
                </div>
                 {userPickedVideosList.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-md">User Picks ({userPickedVideosList.length})</h4>
                         <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border rounded-md p-2 bg-muted/20">
                            {userPickedVideosList.map((video, idx) => (
                                <Card key={`user-${idx}`} className="p-3 text-sm bg-background shadow-sm">
                                    <p className="font-medium truncate" title={video.title}>{video.title}{video.isPlaylist && " (Playlist)"}</p>
                                    {video.creator && <p className="text-xs text-muted-foreground">Creator: {video.creator}</p>}
                                    <p className="text-xs text-muted-foreground">Language: {video.langName}</p>
                                    {video.notes && <p className="text-xs text-muted-foreground italic truncate" title={video.notes}>Notes: {video.notes}</p>}
                                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleAddVideoToPool(video)}>
                                      <ListPlus className="h-4 w-4 mr-2" /> Add to Course Pool
                                    </Button>
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
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Import / Export Course Content</CardTitle>
              <CardDescription>Manage your course data. (Functionality coming soon)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg">Import Course</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input type="file" accept=".csv,.yaml,.json" disabled />
                    <Button className="w-full" variant="outline" disabled>
                      <Upload className="h-4 w-4 mr-2" /> Upload and Import
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg">Export Course</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Select a format to download your course data.</p>
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline" disabled>CSV</Button>
                      <Button className="flex-1" variant="outline" disabled>YAML</Button>
                      <Button className="flex-1" variant="outline" disabled>JSON</Button>
                    </div>
                    <Button className="w-full" disabled>
                      <Download className="h-4 w-4 mr-2" /> Download Course Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
