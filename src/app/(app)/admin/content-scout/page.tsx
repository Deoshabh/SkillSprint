
"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Loader2, AlertTriangle, Youtube, Copy, Link as LinkIcon, ListChecks, ShieldCheck, Users, BarChartBig, SendHorizonal } from 'lucide-react'; 
import { suggestYoutubeVideosForTopic, type SuggestYoutubeVideosForTopicInput, type SuggestYoutubeVideosForTopicOutput } from '@/ai/flows/suggest-youtube-videos-for-topic-flow';
import type { VideoLink } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link'; 

export default function AIContentScoutPage() {
  const { toast } = useToast();
  const [searchTopic, setSearchTopic] = useState('');
  const [preferredCreator, setPreferredCreator] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [numberOfSuggestions, setNumberOfSuggestions] = useState(5);

  const [suggestedVideos, setSuggestedVideos] = useState<VideoLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindSuggestions = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTopic.trim()) {
      toast({ title: "Error", description: "Please enter a search topic or keywords.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestedVideos([]);

    try {
      const input: SuggestYoutubeVideosForTopicInput = {
        searchQuery: searchTopic,
        numberOfSuggestions: numberOfSuggestions > 0 ? numberOfSuggestions : 5,
        preferredLanguage: preferredLanguage.trim() || undefined,
        knownCreator: preferredCreator.trim() || undefined,
      };
      const result = await suggestYoutubeVideosForTopic(input);
      setSuggestedVideos(result.suggestedVideos);
      if (result.suggestedVideos.length === 0) {
        toast({ title: "No Suggestions", description: "The AI could not find any video suggestions for your query." });
      }
    } catch (err) {
      console.error("Error fetching video suggestions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch suggestions.";
      setError(errorMessage);
      toast({ title: "AI Suggestion Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({ title: "Copied!", description: "Video URL copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
        toast({ title: "Copy Failed", description: "Could not copy URL.", variant: "destructive" });
      });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <Wand2 className="h-10 w-10 mr-3 text-primary" />
          AI Content Scout
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover relevant YouTube videos for your course topics using AI.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Find Video Content</CardTitle>
          <CardDescription>Enter details to get AI-powered video suggestions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFindSuggestions} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="searchTopic">Search Topic / Keywords*</Label>
                <Input
                  id="searchTopic"
                  value={searchTopic}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTopic(e.target.value)}
                  placeholder="e.g., Advanced React State Management, Python for Data Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfSuggestions">Number of Suggestions (1-10)</Label>
                <Input
                  id="numberOfSuggestions"
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfSuggestions}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNumberOfSuggestions(parseInt(e.target.value, 10))}
                  placeholder="e.g., 5"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="preferredCreator">Preferred Creator/Channel (Optional)</Label>
                <Input
                  id="preferredCreator"
                  value={preferredCreator}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredCreator(e.target.value)}
                  placeholder="e.g., freeCodeCamp, Traversy Media"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language (Optional)</Label>
                <Input
                  id="preferredLanguage"
                  value={preferredLanguage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredLanguage(e.target.value)}
                  placeholder="e.g., English, Hindi"
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Wand2 className="h-5 w-5 mr-2" />}
              Find Suggestions
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" /> Error Fetching Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {suggestedVideos.length > 0 && !isLoading && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecks className="h-6 w-6 mr-2 text-primary" /> Suggested Videos ({suggestedVideos.length})
            </CardTitle>
            <CardDescription>Review the AI-generated suggestions below. Use these to update your courses via the Course Designer.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-3">
              <div className="space-y-4">
                {suggestedVideos.map((video, index) => (
                  <Card key={index} className="p-4 bg-muted/30">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0">
                        {video.youtubeEmbedUrl && (
                          <iframe
                            src={video.youtubeEmbedUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/videoseries?list=','/embed/videoseries?list=')}
                            title={video.title}
                            width="200"
                            height="112"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-md shadow-md aspect-video"
                          ></iframe>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-lg font-semibold mb-1 line-clamp-2" title={video.title}>{video.title}</h4>
                        {video.creator && <p className="text-sm text-muted-foreground">Creator: {video.creator}</p>}
                        <p className="text-sm text-muted-foreground">Language: {video.langName}</p>
                        <p className="text-sm text-muted-foreground">Type: {video.isPlaylist ? 'Playlist' : 'Single Video'}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(video.youtubeEmbedUrl)}>
                            <Copy className="h-4 w-4 mr-2" /> Copy URL
                          </Button>
                           <Button variant="ghost" size="sm" asChild>
                            <a href={video.youtubeEmbedUrl.replace('/embed/','/watch?v=').replace('/embed/videoseries?list=','/playlist?list=')} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                <LinkIcon className="h-4 w-4 mr-2" /> Open on YouTube
                            </a>
                           </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
       {suggestedVideos.length === 0 && !isLoading && !error && searchTopic && (
         <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>No suggestions found for "{searchTopic}". Try broadening your search or checking your spelling.</p>
            </CardContent>
         </Card>
       )}

      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                Admin Capabilities Overview
            </CardTitle>
            <CardDescription>Current and planned features for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Review and approve/reject courses. (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Manage published/rejected courses (Unpublish, Move to Draft). (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Edit content for any course on the platform using the Course Designer. (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">AI-powered tools within the Course Designer (Syllabus Generation, Module Content Suggestions) for admins. (Implemented)</strong> <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Use in Designer)</Link></li>
                <li><strong className="text-foreground">Utilize AI tools to find and suggest updated content (AI Content Scout). (Implemented)</strong> <Link href="/admin/content-scout" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                <li><strong className="text-foreground">Set platform-wide limits (Initial: Limit visible, enforcement in place).</strong></li>
                <li><strong className="text-foreground">Manage user roles and permissions (Initial Simulation Implemented: Can change current admin's role).</strong> <Link href="/admin/user-management" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">View platform analytics and reports (Placeholder UI Implemented).</strong> <Link href="/admin/analytics" className="text-xs text-primary hover:underline ml-1">(View)</Link></li>
                <li><strong className="text-foreground">Broadcast messaging to user segments (Placeholder UI Implemented).</strong> <Link href="/admin/messaging" className="text-xs text-primary hover:underline ml-1">(Compose)</Link></li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
