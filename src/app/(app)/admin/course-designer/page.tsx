
"use client";

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, PlusCircle, Save, Eye, Settings2, Loader2, AlertTriangle, Youtube, ListPlus, Trash2 } from 'lucide-react';
import { autoGenerateCourseSyllabus, type AutoGenerateCourseSyllabusInput } from '@/ai/flows/auto-generate-course-syllabus';
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import type { VideoLink } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

interface ManualVideoFormState {
  url: string;
  language: string;
  creator: string;
  notes: string;
}

export default function CustomCourseDesignerPage() {
  const { toast } = useToast();
  const [aiTopic, setAiTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Beginners');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [desiredModules, setDesiredModules] = useState(5);

  const [syllabusResult, setSyllabusResult] = useState<string | null>(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [errorSyllabus, setErrorSyllabus] = useState<string | null>(null);

  // State for AI Video Finder
  const [videoSearchTopic, setVideoSearchTopic] = useState('');
  const [aiSuggestedVideosList, setAiSuggestedVideosList] = useState<VideoLink[]>([]);
  const [loadingAiVideos, setLoadingAiVideos] = useState(false);
  const [errorAiVideos, setErrorAiVideos] = useState<string | null>(null);

  // State for Manual Video Curation
  const [manualVideoForm, setManualVideoForm] = useState<ManualVideoFormState>({ url: '', language: 'English', creator: '', notes: '' });
  const [userPickedVideosList, setUserPickedVideosList] = useState<VideoLink[]>([]);

  // State for Course Video Pool
  const [courseVideoPool, setCourseVideoPool] = useState<VideoLink[]>([]);


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
      setErrorAiVideos(err instanceof Error ? err.message : "AI video suggestion failed.");
      toast({ title: "AI Video Suggestion Failed", description: errorAiVideos, variant: "destructive" });
    } finally {
      setLoadingAiVideos(false);
    }
  };

  const handleManualVideoFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManualVideoForm({ ...manualVideoForm, [e.target.name]: e.target.value });
  };

  const handleAddUserPick = (e: FormEvent) => {
    e.preventDefault();
    if (!manualVideoForm.url.trim() || !manualVideoForm.language.trim()) {
      toast({ title: "Error", description: "Video URL and Language are required.", variant: "destructive" });
      return;
    }
    // Basic URL validation (more robust validation might be needed)
    if (!manualVideoForm.url.includes('youtube.com/') && !manualVideoForm.url.includes('youtu.be/')) {
        toast({ title: "Error", description: "Please enter a valid YouTube video URL.", variant: "destructive" });
        return;
    }

    let embedUrl = manualVideoForm.url;
    if (embedUrl.includes("watch?v=")) {
        const videoId = embedUrl.split("watch?v=")[1]?.split("&")[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (embedUrl.includes("youtu.be/")) {
        const videoId = embedUrl.split("youtu.be/")[1]?.split("?")[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (!embedUrl.includes("/embed/")) {
        // If it's not a watch, youtu.be, or embed link, it might be invalid or a direct embed link already
        // For simplicity, we'll assume it might be an embed link if it doesn't match others
        // More robust parsing could be added
    }


    const newUserPick: VideoLink = {
      youtubeEmbedUrl: embedUrl,
      title: manualVideoForm.url.substring(0,50)+'... (User Submitted)', // Simple title
      langCode: manualVideoForm.language.substring(0,2).toLowerCase(),
      langName: manualVideoForm.language,
      creator: manualVideoForm.creator,
      notes: manualVideoForm.notes,
    };
    setUserPickedVideosList([...userPickedVideosList, newUserPick]);
    setManualVideoForm({ url: '', language: 'English', creator: '', notes: '' }); // Reset form
    toast({ title: "Video Added", description: "Your video has been added to User Picks." });
  };

  const handleAddVideoToPool = (video: VideoLink) => {
    if (courseVideoPool.find(v => v.youtubeEmbedUrl === video.youtubeEmbedUrl)) {
      toast({ title: "Already in Pool", description: "This video is already in your course pool.", variant: "default" });
      return;
    }
    setCourseVideoPool([...courseVideoPool, video]);
    toast({ title: "Video Added to Pool", description: `"${video.title}" added to course video pool.` });
  };

  const handleRemoveVideoFromPool = (videoUrl: string) => {
    setCourseVideoPool(courseVideoPool.filter(v => v.youtubeEmbedUrl !== videoUrl));
    toast({ title: "Video Removed", description: "Video removed from course video pool." });
  };


  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <Settings2 className="h-10 w-10 mr-3 text-primary" /> Custom Course Designer
        </h1>
        <p className="text-xl text-muted-foreground">
          Build, customize, and manage your own learning paths.
        </p>
      </header>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="builder">Module Builder</TabsTrigger>
          <TabsTrigger value="settings">Course Settings</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Drag-and-Drop Module Builder</CardTitle>
              <CardDescription>
                Arrange modules and content for your custom course. (Interactive builder coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[300px] border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30">
                <p className="text-muted-foreground mb-4">Drag modules here or</p>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Module
                </Button>
              </div>
              <div className="space-y-4">
                <Card className="bg-background">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Module 1: Introduction</p>
                      <p className="text-xs text-muted-foreground">3 Lessons, 1 Quiz</p>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </CardContent>
                </Card>
                 <Card className="bg-background">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Module 2: Core Concepts</p>
                      <p className="text-xs text-muted-foreground">5 Lessons, 2 Assignments</p>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </CardContent>
                </Card>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Video Pool (Selected Videos)</h3>
                {courseVideoPool.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No videos added to the pool yet. Use AI Tools to find and add videos.</p>
                ) : (
                  <div className="space-y-2">
                    {courseVideoPool.map((video, idx) => (
                      <Card key={idx} className="p-3 flex justify-between items-center bg-muted/50">
                        <div>
                           <p className="text-sm font-medium">{video.title}</p>
                           <p className="text-xs text-muted-foreground">{video.creator || 'N/A'} - {video.langName}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveVideoFromPool(video.youtubeEmbedUrl)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline"><Eye className="h-4 w-4 mr-2" /> Preview Course</Button>
                <Button><Save className="h-4 w-4 mr-2" /> Save Course</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Course Settings</CardTitle>
              <CardDescription>Define the details and parameters for your custom course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title</Label>
                  <Input id="courseTitle" placeholder="e.g., Advanced JavaScript Techniques" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseCategory">Category</Label>
                  <Input id="courseCategory" placeholder="e.g., Programming, Design" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseDescription">Course Description</Label>
                <Textarea id="courseDescription" placeholder="Provide a brief overview of your course..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input id="coverImage" type="url" placeholder="https://example.com/image.png" />
              </div>
              <p className="text-sm text-muted-foreground pt-4">Version control, sharing, and publishing options will appear here.</p>
              <Button><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-export">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Import / Export Course</CardTitle>
              <CardDescription>Manage your course data using CSV, YAML, or JSON formats.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg">Import Course</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input type="file" accept=".csv,.yaml,.json" />
                    <Button className="w-full" variant="outline">
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
                      <Button className="flex-1" variant="outline">CSV</Button>
                      <Button className="flex-1" variant="outline">YAML</Button>
                      <Button className="flex-1" variant="outline">JSON</Button>
                    </div>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" /> Download Course Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools">
        <div className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">AI-Powered Syllabus Generator</CardTitle>
              <CardDescription>Leverage AI to help design your course content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Provide a topic and details, and let AI generate a full syllabus with module breakdowns.
              </p>
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
                    <CardTitle>Generated Syllabus</CardTitle>
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
                <CardTitle className="text-2xl flex items-center"><Youtube className="h-7 w-7 mr-2 text-red-600" /> AI Video Finder & Curation</CardTitle>
                <CardDescription>Find YouTube videos by topic or add your own picks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSuggestVideosAI} className="space-y-3">
                    <Label htmlFor="videoSearchTopic">Video Topic/Subtopic</Label>
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
                        <h4 className="font-semibold mb-2">AI-Suggested Videos ({aiSuggestedVideosList.length})</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {aiSuggestedVideosList.map((video, idx) => (
                                <Card key={`ai-${idx}`} className="p-3 text-sm">
                                    <p className="font-medium truncate" title={video.title}>{video.title}</p>
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
                <div>
                    <h4 className="font-semibold mb-3">Manually Add Video</h4>
                    <form onSubmit={handleAddUserPick} className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="manualVideoUrl">YouTube Video URL</Label>
                            <Input id="manualVideoUrl" name="url" placeholder="https://www.youtube.com/watch?v=..." value={manualVideoForm.url} onChange={handleManualVideoFormChange} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="manualVideoLang">Language</Label>
                                <Input id="manualVideoLang" name="language" placeholder="e.g., English, Hindi" value={manualVideoForm.language} onChange={handleManualVideoFormChange} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="manualVideoCreator">Creator (Optional)</Label>
                                <Input id="manualVideoCreator" name="creator" placeholder="e.g., ChannelName" value={manualVideoForm.creator} onChange={handleManualVideoFormChange} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="manualVideoNotes">Notes (Optional)</Label>
                            <Textarea id="manualVideoNotes" name="notes" placeholder="Brief notes about the video..." value={manualVideoForm.notes} onChange={handleManualVideoFormChange} rows={2} />
                        </div>
                        <Button type="submit" className="w-full md:w-auto"><PlusCircle className="h-4 w-4 mr-2" /> Add User Pick</Button>
                    </form>
                </div>
                 {userPickedVideosList.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">User Picks ({userPickedVideosList.length})</h4>
                         <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {userPickedVideosList.map((video, idx) => (
                                <Card key={`user-${idx}`} className="p-3 text-sm">
                                    <p className="font-medium truncate" title={video.title}>{video.title}</p>
                                    {video.creator && <p className="text-xs text-muted-foreground">Creator: {video.creator}</p>}
                                    <p className="text-xs text-muted-foreground">Language: {video.langName}</p>
                                    {video.notes && <p className="text-xs text-muted-foreground italic">Notes: {video.notes}</p>}
                                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleAddVideoToPool(video)}>
                                      <ListPlus className="h-4 w-4 mr-2" /> Add to Course Pool
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                <Separator />
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Course Video Pool ({courseVideoPool.length})</h3>
                    {courseVideoPool.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add videos from AI suggestions or user picks to populate this pool.</p>
                    ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
                        {courseVideoPool.map((video, idx) => (
                        <Card key={`pool-${idx}`} className="p-3 flex justify-between items-center">
                            <div>
                                <p className="font-medium truncate" title={video.title}>{video.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {video.creator || 'N/A'} - {video.langName}
                                    {video.notes && <span className="italic"> - Note: {video.notes.substring(0,30)}{video.notes.length > 30 && '...'}</span>}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveVideoFromPool(video.youtubeEmbedUrl)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                            </Button>
                        </Card>
                        ))}
                    </div>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>
        </TabsContent>
      </Tabs>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Admin Custom Course Controls</CardTitle>
          <CardDescription>Global settings for custom courses. (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Options for setting limits on custom courses per user, module counts, size limits, and manual approval workflows for public courses will be managed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
