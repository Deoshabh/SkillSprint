'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, Package, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportDialogProps {
  courseId?: string
  courseIds?: string[]
  courseName?: string
  trigger?: React.ReactNode
}

export function ExportDialog({ courseId, courseIds, courseName, trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [includeUserData, setIncludeUserData] = useState(false)
  const [exportFormat, setExportFormat] = useState('json')
  const { toast } = useToast()

  const isBulkExport = courseIds && courseIds.length > 0
  const isAllCoursesExport = !courseId && (!courseIds || courseIds.length === 0)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      let response: Response
        if (isBulkExport) {
        // Bulk export
        response = await fetch('/api/courses/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseIds,
            includeUserData,
            format: exportFormat
          })
        })
      } else if (isAllCoursesExport) {
        // Export all courses
        response = await fetch('/api/courses/export/all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            includeUserData,
            format: exportFormat
          })
        })
      } else {
        // Single course export
        const params = new URLSearchParams({
          includeUserData: includeUserData.toString(),
          format: exportFormat
        })
        
        response = await fetch(`/api/courses/export/${courseId}?${params}`)
      }
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      // Get the filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'course_export.json'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }      } else if (isBulkExport) {
        filename = `skillsprint_courses_export_${Date.now()}.json`
      } else if (isAllCoursesExport) {
        filename = `skillsprint_all_courses_export_${Date.now()}.json`
      } else if (courseName) {
        filename = `${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`
      }
      
      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Export Successful',
        description: `Course${isBulkExport ? 's' : ''} exported successfully`,
      })
      
      setIsOpen(false)
      
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export course data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Course{isBulkExport || isAllCoursesExport ? 's' : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {isBulkExport 
                ? `Export ${courseIds?.length} selected courses` 
                : isAllCoursesExport
                ? 'Export all courses from the platform'
                : `Export "${courseName}" course`
              }
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeUserData"
                  checked={includeUserData}
                  onCheckedChange={(checked) => setIncludeUserData(!!checked)}
                />
                <Label htmlFor="includeUserData" className="text-sm">
                  Include user data (enrollments, ratings, progress)
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="format" className="text-sm font-medium">
                  Export Format
                </Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JSON Format
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
