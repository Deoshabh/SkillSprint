'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { BookOpen, Check, X, Eye, Trash2, FileText, Play, Clock, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Course, CourseDocument } from '@/lib/types'
import { DocumentViewer } from './document-viewer'

interface CourseApprovalManagerProps {
  adminId: string
}

interface CourseWithDetails extends Course {
  authorName: string
  submittedDate: string
  documentsCount: number
  modulesCount: number
}

export function CourseApprovalManager({ adminId }: CourseApprovalManagerProps) {
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; action: 'approve' | 'reject'; courseId: string }>({
    open: false,
    action: 'approve',
    courseId: ''
  })
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
  }, [statusFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/courses?status=${statusFilter}`)
      const result = await response.json()
      
      if (result.success) {
        setCourses(result.courses)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCourseAction = async (courseId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminId,
          reason
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: `Course ${action}d successfully`,
      })

      fetchCourses()
      setApprovalDialog({ open: false, action: 'approve', courseId: '' })
      setReason('')

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Action failed',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      })

      fetchCourses()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Delete failed',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const pendingCount = courses.filter(course => course.status === 'pending').length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Approval Management
            </span>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">
                {pendingCount} pending approval
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses Table */}
          {loading ? (
            <div className="text-center py-8">Loading courses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                        {course.duration && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{course.duration}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course.authorName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3 text-blue-500" />
                          <span className="text-xs">{course.modulesCount} modules</span>
                        </div>
                        {course.documentsCount > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-green-500" />
                            <span className="text-xs">{course.documentsCount} docs</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(course.status || 'draft')}</TableCell>
                    <TableCell>
                      {course.submittedDate ? new Date(course.submittedDate).toLocaleDateString() : 'Not submitted'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(course)
                            setPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {course.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setApprovalDialog({ open: true, action: 'approve', courseId: course.id })}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setApprovalDialog({ open: true, action: 'reject', courseId: course.id })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{course.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourse(course.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredCourses.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No courses found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.title}</DialogTitle>
            <DialogDescription>Course preview and details</DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              {/* Course Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Course Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Author:</strong> {selectedCourse.authorName}</p>
                    <p><strong>Category:</strong> {selectedCourse.category}</p>
                    <p><strong>Duration:</strong> {selectedCourse.duration || 'Not specified'}</p>
                    <p><strong>Difficulty:</strong> {selectedCourse.difficulty || 'Not specified'}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedCourse.status || 'draft')}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Content Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Modules:</strong> {selectedCourse.modules?.length || 0}</p>
                    <p><strong>Documents:</strong> {selectedCourse.documentsCount || 0}</p>
                    <p><strong>Estimated Hours:</strong> {selectedCourse.estimatedHours || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
              </div>

              {/* Modules */}
              {selectedCourse.modules && selectedCourse.modules.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Modules ({selectedCourse.modules.length})</h4>
                  <div className="space-y-2">
                    {selectedCourse.modules.map((module, index) => (
                      <div key={module.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{index + 1}. {module.title}</p>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {module.estimatedTime}
                          </div>
                        </div>
                        {module.videoLinks && module.videoLinks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              {module.videoLinks.length} video(s)
                            </p>
                          </div>
                        )}
                        {module.documents && module.documents.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              {module.documents.length} document(s)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Documents */}
              {selectedCourse.documents && selectedCourse.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Course Documents ({selectedCourse.documents.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCourse.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <DocumentViewer
                          document={{
                            id: doc.id,
                            name: doc.name,
                            originalName: doc.originalName,
                            type: doc.type,
                            url: doc.url,
                            size: doc.size,
                            description: doc.description,
                            uploadedAt: doc.uploadedAt
                          }}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'} Course
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.action === 'approve' 
                ? 'Approve this course to publish it to all users.'
                : 'Reject this course. Please provide a reason for rejection.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {approvalDialog.action === 'approve' ? 'Approval notes (optional)' : 'Rejection reason'}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={approvalDialog.action === 'approve' 
                  ? 'Add any notes about this approval...'
                  : 'Please explain why this course is being rejected...'
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialog({ open: false, action: 'approve', courseId: '' })
                setReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCourseAction(approvalDialog.courseId, approvalDialog.action, reason)}
              className={approvalDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
