'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle, X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploadProps {
  courseId?: string
  userId: string
  onUploadComplete?: (document: any) => void
  trigger?: React.ReactNode
}

interface UploadState {
  file: File | null
  uploading: boolean
  progress: number
  description: string
  isPublic: boolean
  error: string | null
  success: boolean
}

export function DocumentUpload({ courseId, userId, onUploadComplete, trigger }: DocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    description: '',
    isPublic: false,
    error: null,
    success: false
  })
  const { toast } = useToast()

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
      const maxSize = 50 * 1024 * 1024 // 50MB

      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      
      if (file.size > maxSize) {
        setState(prev => ({ ...prev, error: 'File size exceeds 50MB limit', file: null }))
        return
      }

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setState(prev => ({ ...prev, error: 'File type not supported. Allowed: PDF, DOC, DOCX, TXT', file: null }))
        return
      }

      setState(prev => ({ ...prev, file, error: null }))
    }
  }, [])

  const handleUpload = async () => {
    if (!state.file) return

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }))

    try {
      const formData = new FormData()
      formData.append('file', state.file)
      formData.append('userId', userId)
      if (courseId) formData.append('courseId', courseId)
      if (state.description) formData.append('description', state.description)
      formData.append('isPublic', state.isPublic.toString())

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setState(prev => ({ ...prev, uploading: false, progress: 100, success: true }))
      
      toast({
        title: 'Upload Successful',
        description: 'Document uploaded and pending admin approval.',
      })

      if (onUploadComplete) {
        onUploadComplete(result.document)
      }

      // Reset form after success
      setTimeout(() => {
        setState({
          file: null,
          uploading: false,
          progress: 0,
          description: '',
          isPublic: false,
          error: null,
          success: false
        })
        setIsOpen(false)
      }, 2000)

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }))
      
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload PDF, DOC, DOCX, or TXT files to add to your course materials.
            Maximum file size: 50MB.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload Area */}
          {!state.file && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Click to select a document file
              </p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, DOC, DOCX, TXT (Max: 50MB)
              </p>
            </div>
          )}

          {/* Selected File Display */}
          {state.file && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(state.file.name)}
                    <div>
                      <p className="font-medium text-sm">{state.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(state.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, file: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Details Form */}
          {state.file && !state.uploading && !state.success && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this document contains..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={state.isPublic}
                  onCheckedChange={(checked) => setState(prev => ({ ...prev, isPublic: !!checked }))}
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make this document publicly visible (after admin approval)
                </Label>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {state.uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Uploading...</span>
                <span className="text-sm">{state.progress}%</span>
              </div>
              <Progress value={state.progress} className="w-full" />
            </div>
          )}

          {/* Success Message */}
          {state.success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800">Upload Successful!</p>
                <p className="text-xs text-green-600">Document is pending admin approval.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {state.error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Upload Failed</p>
                <p className="text-xs text-red-600">{state.error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {state.file && !state.uploading && !state.success && (
              <Button onClick={handleUpload} className="flex-1">
                Upload Document
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={state.uploading}
            >
              {state.success ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
