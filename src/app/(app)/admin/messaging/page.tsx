"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllUsers, type UserSearchFilters } from '@/lib/advanced-data-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  SendHorizonal, 
  UsersRound, 
  Mail, 
  MessageSquareQuote, 
  Loader2, 
  Users, 
  Filter,
  Target,
  Eye,
  Calendar,
  Trophy,
  BookOpen
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'course' | 'achievement' | 'announcement' | 'reminder';
}

const messageTemplates: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    subject: 'Welcome to SkillSprint!',
    body: 'Hello {{name}},\n\nWelcome to SkillSprint! We\'re excited to have you join our learning community. Get started by exploring our course catalog and setting up your learning preferences.\n\nHappy learning!\nThe SkillSprint Team',
    category: 'welcome'
  },
  {
    id: 'course-completion',
    name: 'Course Completion Congratulations',
    subject: 'Congratulations on completing {{courseName}}!',
    body: 'Hi {{name}},\n\nCongratulations on completing {{courseName}}! Your dedication to learning is inspiring. You\'ve earned {{points}} points for this achievement.\n\nKeep up the great work!\nThe SkillSprint Team',
    category: 'achievement'
  },
  {
    id: 'reminder',
    name: 'Learning Progress Reminder',
    subject: 'Continue your learning journey',
    body: 'Hello {{name}},\n\nWe noticed you haven\'t logged in for a while. Your learning progress is important to us - come back and continue where you left off!\n\nYour current courses are waiting for you.\n\nBest regards,\nThe SkillSprint Team',
    category: 'reminder'
  }
];

export default function AdminMessagingPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Advanced targeting
  const [useAdvancedTargeting, setUseAdvancedTargeting] = useState(false);
  const [targetingFilters, setTargetingFilters] = useState<UserSearchFilters>({});
  const [targetUserCount, setTargetUserCount] = useState(0);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Load target user count when filters change
  useEffect(() => {
    if (useAdvancedTargeting) {
      loadTargetCount();
    }
  }, [targetingFilters, useAdvancedTargeting]);

  const loadTargetCount = async () => {
    setIsLoadingTargets(true);
    try {
      const result = await getAllUsers(targetingFilters, { page: 1, limit: 1 });
      setTargetUserCount(result.total);
    } catch (error) {
      console.error('Error loading target count:', error);
      setTargetUserCount(0);
    } finally {
      setIsLoadingTargets(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject || !body) {
      toast({ title: "Missing Fields", description: "Please fill in subject and body.", variant: "destructive" });
      return;
    }
    
    if (!useAdvancedTargeting && !segment) {
      toast({ title: "No Segment Selected", description: "Please select a user segment.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    
    try {
      // Simulate message sending with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const recipientCount = useAdvancedTargeting ? targetUserCount : getSegmentUserCount(segment);
      
      toast({
        title: "Message Sent Successfully!",
        description: `Message "${subject}" sent to ${recipientCount} users.`,
      });
      
      // Reset form
      setSubject('');
      setBody('');
      setSegment('');
      setSelectedTemplate('');
      setUseAdvancedTargeting(false);
      setTargetingFilters({});
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const getSegmentUserCount = (segmentType: string): number => {
    // Mock user counts for different segments
    const segmentCounts: Record<string, number> = {
      'all-users': 1250,
      'new-users': 85,
      'active-learners': 892,
      'inactive-users': 358,
      'course-completers': 445,
      'admins': 12,
      'educators': 28,
      'learners': 1210
    };
    return segmentCounts[segmentType] || 0;
  };

  const handleFilterChange = (key: keyof UserSearchFilters, value: any) => {
    setTargetingFilters(prev => ({ ...prev, [key]: value }));
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading page" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <SendHorizonal className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          Broadcast Messaging
        </h1>
        <p className="text-xl text-muted-foreground">
          Send targeted messages to user segments with advanced filtering and personalization.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Message Composition */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5" />
                Compose Message
              </CardTitle>
              <CardDescription>
                Create and send messages to your selected user segments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-6">
                {/* Message Templates */}
                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template or start from scratch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Templates</SelectLabel>
                        {messageTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter message subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <Label htmlFor="body">Message Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Enter your message content... You can use placeholders like {{name}}, {{points}}, {{courseName}} for personalization."
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                  <div className="text-xs text-muted-foreground">
                    Available placeholders: {{name}}, {{email}}, {{points}}, {{courseName}}
                  </div>
                </div>

                {/* Targeting Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="advanced-targeting"
                      checked={useAdvancedTargeting}
                      onCheckedChange={setUseAdvancedTargeting}
                    />
                    <Label htmlFor="advanced-targeting">Use advanced targeting</Label>
                  </div>

                  {useAdvancedTargeting ? (
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <Label className="text-sm font-medium">Advanced Targeting Filters</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Role</Label>
                            <Select 
                              value={targetingFilters.role || ''} 
                              onValueChange={(value) => handleFilterChange('role', value || undefined)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All roles" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All roles</SelectItem>
                                <SelectItem value="learner">Learners</SelectItem>
                                <SelectItem value="educator">Educators</SelectItem>
                                <SelectItem value="admin">Admins</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Min Points</Label>
                            <Input
                              type="number"
                              placeholder="Minimum points"
                              value={targetingFilters.minPoints || ''}
                              onChange={(e) => handleFilterChange('minPoints', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Search Users</Label>
                            <Input
                              placeholder="Filter by name or email..."
                              value={targetingFilters.search || ''}
                              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          <span>
                            Target Recipients: 
                            {isLoadingTargets ? (
                              <Loader2 className="inline h-4 w-4 animate-spin ml-1" />
                            ) : (
                              <Badge variant="secondary" className="ml-1">
                                {targetUserCount} users
                              </Badge>
                            )}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="segment">User Segment</Label>
                      <Select value={segment} onValueChange={setSegment} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target segment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>General Segments</SelectLabel>
                            <SelectItem value="all-users">All Users (1,250)</SelectItem>
                            <SelectItem value="new-users">New Users (85)</SelectItem>
                            <SelectItem value="active-learners">Active Learners (892)</SelectItem>
                            <SelectItem value="inactive-users">Inactive Users (358)</SelectItem>
                            <SelectItem value="course-completers">Course Completers (445)</SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>By Role</SelectLabel>
                            <SelectItem value="admins">Administrators (12)</SelectItem>
                            <SelectItem value="educators">Educators (28)</SelectItem>
                            <SelectItem value="learners">Learners (1,210)</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Message Preview</DialogTitle>
                        <DialogDescription>
                          This is how your message will appear to recipients.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Subject:</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            {subject.replace(/\{\{name\}\}/g, 'John Doe').replace(/\{\{courseName\}\}/g, 'React Fundamentals')}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Body:</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                            {body
                              .replace(/\{\{name\}\}/g, 'John Doe')
                              .replace(/\{\{email\}\}/g, 'john.doe@example.com')
                              .replace(/\{\{points\}\}/g, '350')
                              .replace(/\{\{courseName\}\}/g, 'React Fundamentals')
                            }
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => setShowPreview(false)}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button type="submit" disabled={isSending} className="flex items-center gap-2">
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Stats and Recent Messages */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messaging Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <Badge variant="secondary">1,250</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active This Week</span>
                  <Badge variant="secondary">892</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users (30d)</span>
                  <Badge variant="secondary">320</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Messages Sent (30d)</span>
                  <Badge variant="secondary">45</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Templates Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {messageTemplates.slice(0, 3).map(template => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.subject.substring(0, 40)}...
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Use personalization placeholders to increase engagement</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Keep subject lines under 50 characters for better mobile display</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Target specific segments for more relevant messaging</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Preview messages before sending to large groups</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
