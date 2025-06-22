
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Send, Loader2 } from 'lucide-react';
import type { FeedbackItem } from '@/lib/types';

type FeedbackType = FeedbackItem['type'];

export default function FeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [courseIdentifier, setCourseIdentifier] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !authLoading) {
    router.push('/login'); // Redirect if not logged in
    return null;
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to submit feedback.", variant: "destructive" });
        return;
    }
    if (!subject.trim() || !message.trim()) {
        toast({ title: "Error", description: "Subject and message are required.", variant: "destructive" });
        return;
    }
    if (feedbackType === 'course' && !courseIdentifier.trim()) {
        toast({ title: "Error", description: "Please specify the course name or ID.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    const feedbackPayload: Omit<FeedbackItem, 'id' | 'submittedAt' | 'status'> = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: feedbackType,
        subject: subject,
        message: message,
    };

    if (feedbackType === 'course') {
        feedbackPayload.courseTitle = courseIdentifier; // Assuming identifier is title for simplicity
    }    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedbackPayload)
        });

        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }

        toast({
            title: "Feedback Submitted!",
            description: "Thank you for your valuable input. We'll review it shortly.",
        });
        
        // Reset form
        setFeedbackType('general');
        setCourseIdentifier('');
        setSubject('');
        setMessage('');
    } catch (error) {
        console.error("Error submitting feedback:", error);
        toast({
            title: "Submission Error",
            description: "Could not submit your feedback. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto py-8">
      <header className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <MessageSquarePlus className="h-10 w-10 mr-3 text-primary" />
          Submit Feedback
        </h1>
        <p className="text-xl text-muted-foreground">
          We value your input! Help us improve SkillSprint.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>Share Your Thoughts</CardTitle>
          <CardDescription>Let us know what's on your mind. All feedback is appreciated.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="feedbackType">Feedback Type</Label>
              <Select value={feedbackType} onValueChange={(value: FeedbackType) => setFeedbackType(value)}>
                <SelectTrigger id="feedbackType">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="course">Course Specific</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {feedbackType === 'course' && (
              <div className="space-y-2">
                <Label htmlFor="courseIdentifier">Course Name or ID</Label>
                <Input 
                  id="courseIdentifier" 
                  value={courseIdentifier} 
                  onChange={(e) => setCourseIdentifier(e.target.value)} 
                  placeholder="Enter the name or ID of the course" 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Briefly, what is your feedback about?" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Please provide as much detail as possible..." 
                rows={6} 
                required 
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
