
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCoursesForReview, updateCourseStatus, type Course } from '@/lib/placeholder-data';
import { CheckCircle, XCircle, Eye, ShieldCheck, Clock, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

export default function AdminCourseModerationPage() {
  const [coursesForReview, setCoursesForReview] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = useCallback(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCoursesForReview(getCoursesForReview());
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleUpdateStatus = (courseId: string, newStatus: Course['status']) => {
    const success = updateCourseStatus(courseId, newStatus);
    if (success) {
      toast({
        title: "Status Updated",
        description: `Course ${courseId} status changed to ${newStatus?.replace("_", " ")}.`,
      });
      fetchCourses(); // Re-fetch to update the list
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <ShieldCheck className="h-10 w-10 mr-3 text-primary" />
          Course Moderation Dashboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Review and manage courses submitted for public listing.
        </p>
      </header>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Pending Review ({coursesForReview.length})</CardTitle>
            <CardDescription>Courses awaiting your approval or rejection.</CardDescription>
          </div>
          <Button variant="outline" onClick={fetchCourses} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh List
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && coursesForReview.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading courses...</p>
            </div>
          ) : coursesForReview.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No courses are currently pending review.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesForReview.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                        <Link href={`/courses/${course.id}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                            {course.title}
                        </Link>
                    </TableCell>
                    <TableCell>{course.authorId || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(course.submittedDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" asChild title="View Course Details">
                        <Link href={`/courses/${course.id}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(course.id, 'published')}
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        title="Approve Course"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(course.id, 'rejected')}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Reject Course"
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl">Admin Capabilities Overview</CardTitle>
            <CardDescription>Current and planned features for administrators.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Review and approve/reject courses submitted for public listing. (Implemented)</strong></li>
                <li>Edit content (video links, documents, module details) for any course on the platform. (Planned)</li>
                <li>Utilize AI tools to find and suggest updated content (e.g., latest playlists from specific creators) for existing courses. (Planned)</li>
                <li>Manage user roles and permissions. (Planned)</li>
                <li>View platform analytics and reports. (Planned)</li>
                <li>Set platform-wide limits (e.g., max custom videos per module for users). (Planned)</li>
                <li>Broadcast messaging to user segments. (Planned)</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
