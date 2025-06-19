
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { FeedbackItem } from '@/lib/types';
import { Archive as ArchiveIcon, MessageSquareText, User, Settings, ShieldCheck, Users, Wand2, BarChartBig, SendHorizonal, Sparkles, MailQuestion, Edit, Loader2, Eye, Filter } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';

type FeedbackStatusType = FeedbackItem['status'];

export default function AdminFeedbackManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedbackStatusType | "all">("all");
  const { toast } = useToast();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedFeedbackItem, setSelectedFeedbackItem] = useState<FeedbackItem | null>(null);
  const [editStatus, setEditStatus] = useState<FeedbackStatusType>('new');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);


  const fetchAllFeedbackItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/feedback');
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      
      const result = await response.json();
      if (result.success) {
        setAllFeedback(result.feedback);
      } else {
        throw new Error(result.error || 'Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllFeedbackItems();
  }, [fetchAllFeedbackItems]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllFeedbackItems();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAllFeedbackItems]);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredFeedback(allFeedback);
    } else {
      setFilteredFeedback(allFeedback.filter(item => item.status === activeTab));
    }
  }, [activeTab, allFeedback]);

  const handleViewDetails = (item: FeedbackItem) => {
    setSelectedFeedbackItem(item);
    setEditStatus(item.status);
    setEditAdminNotes(item.adminNotes || '');
    setIsDetailsModalOpen(true);
  };

  const handleSaveChangesToFeedback = async () => {
    if (!selectedFeedbackItem) return;
    
    try {
      setIsSavingStatus(true);
      const response = await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: selectedFeedbackItem.id,
          status: editStatus,
          adminNotes: editAdminNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Feedback Updated",
          description: `Status for feedback changed to ${editStatus}.`,
        });
        fetchAllFeedbackItems(); // Re-fetch to update list
        setIsDetailsModalOpen(false);
      } else {
        throw new Error(result.error || 'Failed to update feedback');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast({
        title: "Update Failed",
        description: "Could not update feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStatus(false);
    }
  };
  
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'PPpp'); 
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusBadgeVariant = (status: FeedbackStatusType): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'new': return 'default'; 
      case 'in_progress': return 'secondary';
      case 'resolved': return 'outline'; 
      case 'archived': return 'destructive'; 
      default: return 'default';
    }
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading page"/></div>;
  }
  if (!user || user.role !== 'admin') {
     return (
      <Card className="m-8">
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent><p>You do not have permission to view this page.</p><Button asChild className="mt-4"><Link href="/dashboard">Go to Dashboard</Link></Button></CardContent>
      </Card>
    );
  }


  const renderFeedbackTable = (feedbackItems: FeedbackItem[]) => {
    if (isLoading && feedbackItems.length === 0) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading feedback" />
          <p className="ml-3 text-muted-foreground">Loading feedback...</p>
        </div>
      );
    }
    if (feedbackItems.length === 0) {
      return <p className="text-center text-muted-foreground py-10">No feedback in this category.</p>;
    }

    return (
      <ScrollArea className="h-[calc(100vh-350px)]"> 
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbackItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs">{getRelativeTime(item.submittedAt)}</TableCell>
                <TableCell className="text-sm">
                  {item.userName || 'N/A'} <br/>
                  <span className="text-xs text-muted-foreground">{item.userEmail || item.userId}</span>
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{item.type.replace('_', ' ')}</Badge></TableCell>
                <TableCell className="font-medium max-w-xs truncate" title={item.subject}>{item.subject}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize">{item.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)} aria-label={`View details for feedback: ${item.subject}`}>
                    <Eye className="h-4 w-4 mr-1" aria-hidden="true" /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };
  
  const feedbackStatusOptions: FeedbackStatusType[] = ['new', 'in_progress', 'resolved', 'archived'];


  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <ArchiveIcon className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          Feedback Management
        </h1>
        <p className="text-xl text-muted-foreground">
          Review and manage user-submitted feedback in real-time.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Feedback Inbox</CardTitle>
          <Button variant="outline" onClick={fetchAllFeedbackItems} disabled={isLoading} aria-label="Refresh feedback list">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Filter className="h-4 w-4 mr-2" aria-hidden="true" />}
            Refresh / Filter
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FeedbackStatusType | "all")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
              <TabsTrigger value="all">All ({allFeedback.length})</TabsTrigger>
              {feedbackStatusOptions.map(status => (
                <TabsTrigger key={status} value={status} className="capitalize">
                  {status.replace('_', ' ')} ({allFeedback.filter(fb => fb.status === status).length})
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all">{renderFeedbackTable(filteredFeedback)}</TabsContent>
            {feedbackStatusOptions.map(status => (
                <TabsContent key={`content-${status}`} value={status}>{renderFeedbackTable(filteredFeedback)}</TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {selectedFeedbackItem && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center"><MessageSquareText className="mr-2 h-5 w-5 text-primary" aria-hidden="true"/>Feedback Details</DialogTitle>
              <DialogDescription>Review and update the status of this feedback item.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-2 items-start">
                <Label className="text-right font-semibold text-muted-foreground pt-1">User:</Label>
                <div className="col-span-2">
                    <p>{selectedFeedbackItem.userName || 'N/A'} ({selectedFeedbackItem.userEmail || selectedFeedbackItem.userId})</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-start">
                <Label className="text-right font-semibold text-muted-foreground pt-1">Submitted:</Label>
                <p className="col-span-2">{getRelativeTime(selectedFeedbackItem.submittedAt)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 items-start">
                <Label className="text-right font-semibold text-muted-foreground pt-1">Type:</Label>
                <p className="col-span-2 capitalize">{selectedFeedbackItem.type.replace('_', ' ')}</p>
              </div>
              {selectedFeedbackItem.courseTitle && (
                <div className="grid grid-cols-3 gap-2 items-start">
                    <Label className="text-right font-semibold text-muted-foreground pt-1">Course:</Label>
                    <p className="col-span-2">{selectedFeedbackItem.courseTitle} {selectedFeedbackItem.courseId && `(${selectedFeedbackItem.courseId})`}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 items-start">
                <Label className="text-right font-semibold text-muted-foreground pt-1">Subject:</Label>
                <p className="col-span-2 font-medium">{selectedFeedbackItem.subject}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 items-start">
                <Label className="text-right font-semibold text-muted-foreground pt-1">Message:</Label>
                <div className="col-span-2 p-3 border rounded-md bg-muted/50 whitespace-pre-wrap">
                    {selectedFeedbackItem.message}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <Label htmlFor="feedbackStatus" className="text-right font-semibold text-muted-foreground">Status:</Label>
                <Select value={editStatus} onValueChange={(value: FeedbackStatusType) => setEditStatus(value)}>
                  <SelectTrigger id="feedbackStatus" className="col-span-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackStatusOptions.map(opt => (
                        <SelectItem key={opt} value={opt} className="capitalize">{opt.replace('_',' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2 items-start">
                <Label htmlFor="adminNotes" className="text-right font-semibold text-muted-foreground pt-1">Admin Notes:</Label>
                <Textarea 
                    id="adminNotes" 
                    value={editAdminNotes} 
                    onChange={(e) => setEditAdminNotes(e.target.value)} 
                    className="col-span-2 min-h-[100px]" 
                    placeholder="Internal notes for admin team..."
                />
              </div>
            </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" aria-label="Cancel editing feedback">Cancel</Button></DialogClose>
              <Button onClick={handleSaveChangesToFeedback} disabled={isSavingStatus} aria-label="Save changes to feedback">
                 {isSavingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" aria-hidden="true" />
                Admin Capabilities Overview
            </CardTitle>
            <CardDescription>Current and planned features for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Review and approve/reject courses. (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Manage published/rejected courses (Unpublish, Move to Draft). (Implemented)</strong> <Link href="/admin/course-designer" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">Edit content for any course on the platform using the Course Designer. (Implemented)</strong> <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Open Designer)</Link></li>
                 <li><strong className="text-foreground">Advanced AI-powered tools: (Implemented)</strong>
                    <ul className="list-disc pl-5">
                        <li>Syllabus & Full Module Structure Generation. <Link href="/admin/ai-course-generator" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                        <li>Module-level content suggestions (subtopics, tasks, videos) within Course Designer. <Link href="/course-designer" className="text-xs text-primary hover:underline ml-1">(Use in Designer)</Link></li>
                    </ul>
                </li>
                <li><strong className="text-foreground">Utilize AI tools to find and suggest updated content (AI Content Scout). (Implemented)</strong> <Link href="/admin/content-scout" className="text-xs text-primary hover:underline ml-1">(Use Tool)</Link></li>
                <li><strong className="text-foreground">Set platform-wide limits (Initial: Limit visible, enforcement in place).</strong></li>
                <li><strong className="text-foreground">Manage user roles and permissions (Initial Simulation Implemented: Can change current admin's role).</strong> <Link href="/admin/user-management" className="text-xs text-primary hover:underline ml-1">(Manage)</Link></li>
                <li><strong className="text-foreground">View platform analytics and reports (Placeholder UI Implemented).</strong> <Link href="/admin/analytics" className="text-xs text-primary hover:underline ml-1">(View)</Link></li>
                <li><strong className="text-foreground">Broadcast messaging to user segments (Placeholder UI Implemented).</strong> <Link href="/admin/messaging" className="text-xs text-primary hover:underline ml-1">(Compose)</Link></li>
                <li><strong className="text-foreground">Manage User Feedback. (Implemented)</strong> <Link href="/admin/feedback-management" className="text-xs text-primary hover:underline ml-1">(Review Feedback)</Link></li>

            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
