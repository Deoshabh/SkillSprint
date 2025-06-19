"use client";


import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCoursesForReview, getPublishedCourses, getRejectedCourses, updateCourseStatus } from '@/lib/placeholder-data';
import type { Course } from '@/lib/types';
import { USER_MODULE_VIDEO_LIMIT } from '@/lib/platform-config'; 
import { CheckCircle, XCircle, Eye, ShieldCheck, Clock, Loader2, RefreshCw, ArchiveRestore, SendToBack, Edit, Settings, Users, Wand2, MessageSquareQuote, BarChartBig, SendHorizonal, Sparkles, Archive, Download, Upload, FileDown, FileUp } from 'lucide-react'; 
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ExportDialog } from '@/components/export-dialog';
import { ImportDialog } from '@/components/enhanced-import-dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

type CourseStatusType = Course['status'];

export default function AdminCourseManagementPage() {
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [rejectedCourses, setRejectedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchAllCoursesByStatus = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    setPendingCourses(getCoursesForReview());
    setPublishedCourses(getPublishedCourses());
    setRejectedCourses(getRejectedCourses());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllCoursesByStatus();
  }, [fetchAllCoursesByStatus]);

  // Selection handlers
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const selectAllCourses = (courses: Course[]) => {
    setSelectedCourses(new Set(courses.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedCourses(new Set());
  };

  const getCurrentTabCourses = () => {
    switch (activeTab) {
      case 'pending': return pendingCourses;
      case 'published': return publishedCourses;
      case 'rejected': return rejectedCourses;
      default: return [];
    }
  };

  const handleImportComplete = () => {
    fetchAllCoursesByStatus();
    toast({
      title: "Import Complete",
      description: "Courses have been imported successfully. Refreshing the list.",
    });
  };

  const handleUpdateStatus = (courseId: string, newStatus: CourseStatusType, currentList: CourseStatusType | 'all' = 'all') => {
    const success = updateCourseStatus(courseId, newStatus);
    if (success) {
      toast({
        title: "Status Updated",
        description: `Course ${courseId} status changed to ${newStatus?.replace("_", " ")}.`,
      });
      fetchAllCoursesByStatus(); 
    } else {
      toast({
        title: "Update Failed",
        description: `Could not update status for course ${courseId}.`,
        variant: "destructive",
      });
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderCourseTable = (courses: Course[], statusType: 'pending' | 'published' | 'rejected') => {
    if (isLoading && courses.length === 0) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading courses" />
          <p className="ml-3 text-muted-foreground">Loading courses...</p>
        </div>
      );
    }
    if (courses.length === 0) {
      return <p className="text-center text-muted-foreground py-10">No courses in this category.</p>;
    }

    return (
      <div className="space-y-4">
        {courses.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`select-all-${statusType}`}
                checked={courses.every(course => selectedCourses.has(course.id))}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllCourses(courses);
                  } else {
                    clearSelection();
                  }
                }}
              />
              <Label htmlFor={`select-all-${statusType}`} className="text-sm">
                Select all ({courses.length})
              </Label>
            </div>
            {selectedCourses.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedCourses.size} selected
              </p>
            )}
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>{statusType === 'pending' ? 'Submitted' : 'Last Modified'}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedCourses.has(course.id)}
                    onCheckedChange={() => toggleCourseSelection(course.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/courses/${course.id}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                    {course.title}
                  </Link>
                </TableCell>
                <TableCell>{course.authorId || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{course.category}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {getRelativeTime(statusType === 'pending' ? course.submittedDate : course.lastModified)}
                  </div>
                </TableCell>
              <TableCell className="text-right space-x-1 sm:space-x-2">
                <Button variant="ghost" size="sm" asChild title="View Course Details" aria-label={`View details for ${course.title}`}>
                  <Link href={`/courses/${course.id}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                {statusType === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(course.id, 'published', 'pending')}
                      className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      title="Approve Course"
                      aria-label={`Approve course ${course.title}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(course.id, 'rejected', 'pending')}
                      className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Reject Course"
                      aria-label={`Reject course ${course.title}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" aria-hidden="true" /> Reject
                    </Button>
                  </>
                )}
                {statusType === 'published' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(course.id, 'draft', 'published')}
                      className="text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      title="Unpublish Course (Move to Drafts)"
                      aria-label={`Unpublish course ${course.title}`}
                    >
                      <SendToBack className="h-4 w-4 mr-1" aria-hidden="true" /> Unpublish
                    </Button>
                     <Button variant="outline" size="sm" asChild title="Edit Course" aria-label={`Edit course ${course.title}`}>
                        <Link href={`/course-designer?courseId=${course.id}`}>
                            <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Edit
                        </Link>
                    </Button>
                  </>
                )}
                {statusType === 'rejected' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(course.id, 'draft', 'rejected')}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      title="Move to Drafts (for re-evaluation/editing)"
                      aria-label={`Move course ${course.title} to drafts`}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-1" aria-hidden="true" /> Move to Drafts
                    </Button>
                    <Button variant="outline" size="sm" asChild title="Edit Course" aria-label={`Edit course ${course.title}`}>
                        <Link href={`/course-designer?courseId=${course.id}`}>
                            <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Edit
                        </Link>
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    );
  };

  const handleExport = () => {
    // This is now handled by the ExportDialog component
  };

  const handleImport = () => {
    // This is now handled by the ImportDialog component
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <ShieldCheck className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          Admin Dashboard: Course Moderation
        </h1>
        <p className="text-xl text-muted-foreground">
          Review, approve, and manage courses submitted by users for public publishing.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Course Moderation Queue</CardTitle>
          <Button variant="outline" onClick={fetchAllCoursesByStatus} disabled={isLoading} aria-label="Refresh course lists">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />}
            Refresh Lists
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending">Pending Review ({pendingCourses.length})</TabsTrigger>
              <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedCourses.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <CardDescription className="mb-4">Courses awaiting your approval or rejection.</CardDescription>
              {renderCourseTable(pendingCourses, 'pending')}
            </TabsContent>
            <TabsContent value="published">
              <CardDescription className="mb-4">Courses currently live on the platform.</CardDescription>
              {renderCourseTable(publishedCourses, 'published')}
            </TabsContent>
            <TabsContent value="rejected">
              <CardDescription className="mb-4">Courses that have been rejected.</CardDescription>
              {renderCourseTable(rejectedCourses, 'rejected')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
       <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" aria-hidden="true" />
                Platform Configuration (View Only)
            </CardTitle>
            <CardDescription>Current platform-wide settings. Admin modification UI is planned.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                <div className="border p-4 rounded-md bg-muted/30">
                    <Label className="text-sm font-medium text-muted-foreground">Max Custom Videos per Module (for Users)</Label>
                    <p className="text-2xl font-semibold text-foreground">{USER_MODULE_VIDEO_LIMIT}</p>
                </div>
            </div>
        </CardContent>
      </Card>

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

      <Card className="mt-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" aria-hidden="true" />
            Bulk Course Actions
          </CardTitle>
          <CardDescription>Import and export course data in bulk.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <ExportDialog 
              courseIds={Array.from(selectedCourses)}
              trigger={
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export {selectedCourses.size > 0 ? `Selected (${selectedCourses.size})` : 'All Courses'}
                </Button>
              }
            />
            <ImportDialog 
              onImportComplete={handleImportComplete}
              trigger={
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                  Import Courses
                </Button>
              }
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select courses to export specific ones, or export all courses as JSON.
              </p>
              {selectedCourses.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-xs"
                >
                  Clear Selection ({selectedCourses.size})
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Import JSON files to add or update courses in bulk. The system will validate the format before importing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
