
"use client";

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SendHorizonal, UsersRound, Mail, MessageSquareQuote, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function AdminMessagingPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!subject || !body || !segment) {
      toast({ title: "Missing Fields", description: "Please fill in subject, body, and select a segment.", variant: "destructive" });
      return;
    }
    setIsSending(true);
    // Simulate sending message
    setTimeout(() => {
      toast({
        title: "Broadcast Sent (Simulated)",
        description: `Message "${subject}" sent to segment: ${segment}.`,
      });
      setSubject('');
      setBody('');
      setSegment('');
      setIsSending(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <SendHorizonal className="h-10 w-10 mr-3 text-primary" />
          Broadcast Messaging
        </h1>
        <p className="text-xl text-muted-foreground">
          Send messages to user segments. (Simulated Feature)
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><Mail className="mr-2 h-6 w-6"/>Compose Broadcast</CardTitle>
          <CardDescription>Craft your message and choose the target audience.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMessage} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Important Announcement"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear users..."
                rows={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment"><UsersRound className="inline-block mr-1 h-4 w-4"/>Target Segment</Label>
              <Select value={segment} onValueChange={setSegment} required>
                <SelectTrigger id="segment">
                  <SelectValue placeholder="Select user segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Common Segments</SelectLabel>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="active_learners">Active Learners (last 30 days)</SelectItem>
                    <SelectItem value="educators">All Educators</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Course Specific (Example)</SelectLabel>
                    <SelectItem value="course_fsdd_enrolled">Enrolled in Full-Stack Program</SelectItem>
                    <SelectItem value="course_ec_completed">Completed English Communication</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Engagement (Example)</SelectLabel>
                    <SelectItem value="inactive_90_days">Inactive for 90+ days</SelectItem>
                     <SelectItem value="new_users_7_days">New Users (last 7 days)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSending} className="w-full md:w-auto">
              {isSending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <SendHorizonal className="h-5 w-5 mr-2" />}
              Send Broadcast (Simulated)
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                Feature Status
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                This broadcast messaging page provides a UI for composing messages. Actual message delivery and segment processing are planned for future development with a backend system.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
