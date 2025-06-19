'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Package, Brain, Edit, Trash2, Plus, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { importCourseFile, getImportValidationSummary, importFromTextContent, extractAllLinksFromText, extractTopicsFromText, type CourseImportPreview, type ImportValidationResult } from '@/lib/import-utils'
import { DocumentUpload } from './document-upload'

// Helper function to convert YouTube URLs to proper embed format
const convertToEmbedUrl = (url: string): string => {
  if (!url) return url;
  
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  
  // Convert playlist URL: youtube.com/playlist?list=XXX -> youtube.com/embed/videoseries?list=XXX
  if (url.includes('playlist?list=') || url.includes('/playlist?list=')) {
    const listMatch = url.match(/[?&]list=([^&]+)/);
    if (listMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
    }
  }
  
  // Convert watch URL: youtube.com/watch?v=XXX -> youtube.com/embed/XXX
  if (url.includes('watch?v=')) {
    const videoMatch = url.match(/[?&]v=([^&]+)/);
    if (videoMatch) {
      return `https://www.youtube.com/embed/${videoMatch[1]}`;
    }
  }
  
  // Convert youtu.be URL: youtu.be/XXX -> youtube.com/embed/XXX  
  if (url.includes('youtu.be/')) {
    const videoMatch = url.match(/youtu\.be\/([^?]+)/);
    if (videoMatch) {
      return `https://www.youtube.com/embed/${videoMatch[1]}`;
    }
  }
  
  // Handle direct embed links without full domain
  if (url.includes('youtube.com/') && !url.includes('embed/')) {
    const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoMatch) {
      return `https://www.youtube.com/embed/${videoMatch[1]}`;
    }
  }
  
  return url;
};

interface ImportDialogProps {
  trigger?: React.ReactNode
  onImportComplete?: () => void
}

interface ImportState {
  file: File | null
  textContent: string
  previews: CourseImportPreview[]
  validationResult: ImportValidationResult | null
  isProcessing: boolean
  isImporting: boolean
  step: 'upload' | 'preview' | 'edit' | 'importing' | 'complete'
  aiEnhancing: boolean
  importMode: 'file' | 'text' | 'hybrid'
  bulkDocuments: File[]
  customFields: string[]
  autoDetectFields: boolean
  // New fields for proper course structure
  courseTitle: string
  courseDescription: string
  courseCategory: string
  courseVisibility: 'private' | 'shared' | 'public'
  importAsSingleCourse: boolean
}

interface ImportOptions {
  mode: 'create' | 'update' | 'createOrUpdate'
  preserveIds: boolean
  updateExisting: boolean
  skipDuplicates: boolean
  aiEnhance: boolean
}

export function ImportDialog({ trigger, onImportComplete }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ImportState>({
    file: null,
    textContent: '',
    previews: [],
    validationResult: null,
    isProcessing: false,
    isImporting: false,
    step: 'upload',
    aiEnhancing: false,
    importMode: 'file',
    bulkDocuments: [],
    customFields: [],
    autoDetectFields: true,
    // New fields for proper course structure
    courseTitle: '',
    courseDescription: '',
    courseCategory: 'General',
    courseVisibility: 'private',
    importAsSingleCourse: true
  })
  const [options, setOptions] = useState<ImportOptions>({
    mode: 'createOrUpdate',
    preserveIds: false,
    updateExisting: true,
    skipDuplicates: false,
    aiEnhance: true
  })
  const [importResults, setImportResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['application/json', 'text/csv', 'application/x-yaml', 'text/yaml', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
      const allowedExtensions = ['.json', '.csv', '.yaml', '.yml', '.txt', '.xlsx', '.xls']
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setState(prev => ({ ...prev, file, step: 'preview', isProcessing: true }))
        await processFile(file)
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please select a valid JSON, CSV, YAML, TXT, or Excel file.',
          variant: 'destructive'
        })
      }
    }
  }, [toast])

  const processFile = async (file: File) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }))
      
      const previews = await importCourseFile(file)
      const validationResult = getImportValidationSummary(previews)
      
      setState(prev => ({
        ...prev,
        previews,
        validationResult,
        isProcessing: false,
        step: previews.length > 0 ? 'preview' : 'upload'
      }))

      if (validationResult.summary.invalidCount > 0) {
        toast({
          title: 'Validation Issues Found',
          description: `${validationResult.summary.validCount} valid, ${validationResult.summary.invalidCount} invalid entries. Review and fix issues.`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Import Preview Ready',
          description: `Successfully parsed ${validationResult.summary.validCount} course entries.`,
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('File processing error:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
      toast({
        title: 'Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process the file.',
        variant: 'destructive'
      })
    }
  }
  const enhanceWithAI = async (preview: CourseImportPreview, index: number) => {
    setState(prev => ({ ...prev, aiEnhancing: true }))
    
    try {
      // Call AI enhancement API
      const response = await fetch('/api/ai/enhance-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseData: preview 
        })
      })
      
      if (!response.ok) {
        throw new Error('AI enhancement failed')
      }
        const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'AI enhancement failed')
      }
      
      const aiEnhanced = result.data
      
      const enhanced = {
        ...preview,
        description: aiEnhanced.description || preview.description,
        subtopics: aiEnhanced.subtopics || preview.subtopics,
        tasks: aiEnhanced.tasks || preview.tasks,
        duration: aiEnhanced.duration || preview.duration,
        difficulty: aiEnhanced.difficulty || preview.difficulty
      }

      setState(prev => {
        const newPreviews = [...prev.previews]
        newPreviews[index] = enhanced
        return {
          ...prev,
          previews: newPreviews,
          validationResult: getImportValidationSummary(newPreviews),
          aiEnhancing: false
        }
      })

      toast({
        title: 'AI Enhancement Complete',
        description: 'Course details have been enhanced with AI suggestions.',
        variant: 'default'
      })
    } catch (error) {
      setState(prev => ({ ...prev, aiEnhancing: false }))
      toast({
        title: 'AI Enhancement Failed',
        description: 'Unable to enhance with AI. You can still edit manually.',
        variant: 'destructive'
      })
    }
  }

  const updatePreview = (index: number, field: keyof CourseImportPreview, value: any) => {
    setState(prev => {
      const newPreviews = [...prev.previews]
      newPreviews[index] = { ...newPreviews[index], [field]: value }
      
      // Re-validate
      const validationResult = getImportValidationSummary(newPreviews)
      
      return {
        ...prev,
        previews: newPreviews,
        validationResult
      }
    })
  }

  const updateYouTubeLink = (previewIndex: number, linkIndex: number, value: string) => {
    setState(prev => {
      const newPreviews = [...prev.previews]
      const newLinks = [...newPreviews[previewIndex].youtubeLinks]
      newLinks[linkIndex] = value
      newPreviews[previewIndex] = { ...newPreviews[previewIndex], youtubeLinks: newLinks }
      
      return {
        ...prev,
        previews: newPreviews,
        validationResult: getImportValidationSummary(newPreviews)
      }
    })
  }

  const addYouTubeLink = (previewIndex: number) => {
    setState(prev => {
      const newPreviews = [...prev.previews]
      newPreviews[previewIndex] = {
        ...newPreviews[previewIndex],
        youtubeLinks: [...newPreviews[previewIndex].youtubeLinks, '']
      }
      
      return {
        ...prev,
        previews: newPreviews,
        validationResult: getImportValidationSummary(newPreviews)
      }
    })
  }

  const removeYouTubeLink = (previewIndex: number, linkIndex: number) => {
    setState(prev => {
      const newPreviews = [...prev.previews]
      const newLinks = newPreviews[previewIndex].youtubeLinks.filter((_, i) => i !== linkIndex)
      newPreviews[previewIndex] = { ...newPreviews[previewIndex], youtubeLinks: newLinks }
      
      return {
        ...prev,
        previews: newPreviews,
        validationResult: getImportValidationSummary(newPreviews)
      }
    })
  }

  const removePreview = (index: number) => {
    setState(prev => {
      const newPreviews = prev.previews.filter((_, i) => i !== index)
      return {
        ...prev,
        previews: newPreviews,
        validationResult: getImportValidationSummary(newPreviews)
      }
    })
  }

  const addNewPreview = () => {
    const newPreview: CourseImportPreview = {
      topic: '',
      youtubeLinks: [''],
      pdfLinks: [],
      docLinks: [],
      uploadedDocuments: [],
      metadata: {},
      error: 'Topic/course name is required; At least one YouTube URL is required'
    }
    
    setState(prev => ({
      ...prev,
      previews: [...prev.previews, newPreview],
      validationResult: getImportValidationSummary([...prev.previews, newPreview])
    }))
  }
  const handleImport = async () => {
    if (!state.validationResult || state.validationResult.summary.validCount === 0) {
      toast({
        title: 'No Valid Entries',
        description: 'Please fix validation errors before importing.',
        variant: 'destructive'
      })
      return
    }

    if (state.importAsSingleCourse && !state.courseTitle.trim()) {
      toast({
        title: 'Course Title Required',
        description: 'Please provide a course title when importing as a single course.',
        variant: 'destructive'
      })
      return
    }

    setState(prev => ({ ...prev, isImporting: true, step: 'importing' }))
    
    try {
      const validPreviews = state.validationResult.valid
      
      let importData;      if (state.importAsSingleCourse) {
        // Create a single course with topics as modules
        const modules = validPreviews.map((preview, index) => ({
          id: `module-${index + 1}`,
          title: preview.topic,
          description: preview.description || `Module about ${preview.topic}`,
          contentType: 'video' as const,
          estimatedTime: preview.duration || '1 hour',
          subtopics: preview.subtopics || [],
          practiceTask: preview.tasks?.join('\n') || '',
          videoLinks: preview.youtubeLinks
            .filter(url => url && url.trim()) // Filter out empty URLs
            .map((url, urlIndex) => ({
              id: `video-${index}-${urlIndex}`,
              youtubeEmbedUrl: convertToEmbedUrl(url),
              title: `${preview.topic} - Video ${urlIndex + 1}`,
              langCode: 'en',
              langName: 'English'
            })),
          contentUrl: preview.youtubeLinks[0] ? convertToEmbedUrl(preview.youtubeLinks[0]) : '',
        }));

        importData = {
          courses: [{
            title: state.courseTitle,
            description: state.courseDescription || `Course covering: ${validPreviews.map(p => p.topic).join(', ')}`,
            category: state.courseCategory,
            visibility: state.courseVisibility,
            modules: modules,
            tags: validPreviews.flatMap(p => p.metadata?.tags || []),
            originalTopics: validPreviews.map(p => p.topic) // Keep track for reference
          }]
        };
      } else {
        // Import as separate courses (old behavior)
        importData = { courses: validPreviews };
      }
        
      const response = await fetch('/api/courses/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          importData,
          options: {
            ...options,
            importAsSingleCourse: state.importAsSingleCourse
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({ ...prev, step: 'complete', isImporting: false }))
        setImportResults(result)
        const successMessage = state.importAsSingleCourse 
          ? `Successfully created course "${state.courseTitle}" with ${validPreviews.length} modules.`
          : `Successfully imported ${result.results.imported} courses.`;
        
        toast({
          title: 'Import Successful',
          description: successMessage,
          variant: 'default'
        })
        
        if (onImportComplete) {
          onImportComplete()
        }
      } else {
        throw new Error(result.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      setState(prev => ({ ...prev, isImporting: false }))
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import courses.',
        variant: 'destructive'
      })
    }
  }
  const resetImport = () => {
    setState({
      file: null,
      textContent: '',
      previews: [],
      validationResult: null,
      isProcessing: false,
      isImporting: false,
      step: 'upload',
      aiEnhancing: false,
      importMode: 'file',
      bulkDocuments: [],
      customFields: [],
      autoDetectFields: true,
      // Reset new fields
      courseTitle: '',
      courseDescription: '',
      courseCategory: 'General',
      courseVisibility: 'private',
      importAsSingleCourse: true
    })
    setImportResults(null)
  }

  // Process text content
  const processTextContent = async (content: string) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }))
      
      const previews = await importFromTextContent(content, {
        autoDetectFields: state.autoDetectFields,
        customFields: state.customFields,
        bulkDocuments: state.bulkDocuments.length > 0 ? [{
          files: state.bulkDocuments,
          metadata: { category: 'reference' as const }
        }] : undefined
      })
      
      const validationResult = getImportValidationSummary(previews)
      
      setState(prev => ({
        ...prev,
        previews,
        validationResult,
        isProcessing: false,
        step: previews.length > 0 ? 'preview' : 'upload'
      }))

      if (validationResult.summary.invalidCount > 0) {
        toast({
          title: 'Validation Issues Found',
          description: `${validationResult.summary.validCount} valid, ${validationResult.summary.invalidCount} invalid entries. Review and fix issues.`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Text Import Successful',
          description: `Successfully parsed ${validationResult.summary.validCount} course entries from text.`,
        })
      }
    } catch (error) {
      console.error('Text processing error:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
      toast({
        title: 'Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process the text content.',
        variant: 'destructive'
      })
    }
  }

  // Handle text content change
  const handleTextContentChange = (content: string) => {
    setState(prev => ({ ...prev, textContent: content }))
  }

  // Process text content when user clicks process
  const handleProcessText = () => {
    if (state.textContent.trim()) {
      processTextContent(state.textContent)
    }
  }

  // Add bulk documents
  const handleBulkDocuments = (files: File[]) => {
    setState(prev => ({ 
      ...prev, 
      bulkDocuments: [...prev.bulkDocuments, ...files] 
    }))
  }

  // Remove bulk document
  const removeBulkDocument = (index: number) => {
    setState(prev => ({
      ...prev,
      bulkDocuments: prev.bulkDocuments.filter((_, i) => i !== index)
    }))
  }

  // Add custom field
  const addCustomField = (fieldName: string) => {
    if (fieldName && !state.customFields.includes(fieldName)) {
      setState(prev => ({
        ...prev,
        customFields: [...prev.customFields, fieldName]
      }))
    }
  }

  // Remove custom field
  const removeCustomField = (fieldName: string) => {
    setState(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f !== fieldName)
    }))
  }

  // Auto-extract links from text
  const autoExtractLinks = () => {
    if (state.textContent.trim()) {
      const extractedLinks = extractAllLinksFromText(state.textContent)
      const extractedTopics = extractTopicsFromText(state.textContent)
      
      toast({
        title: 'Auto-extraction Results',
        description: `Found ${extractedTopics.length} topics, ${extractedLinks.youtubeLinks.length} YouTube links, ${extractedLinks.pdfLinks.length} PDF links, ${extractedLinks.docLinks.length} DOC links`
      })
      
      // Show preview of extracted content
      console.log('Extracted content:', { extractedTopics, extractedLinks })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Courses
          </Button>
        )}
      </DialogTrigger>      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Enhanced Course Import
          </DialogTitle>
          <DialogDescription>
            Import and validate course data from various file formats including YAML, Excel, TXT, and CSV files.
            You can also upload PDFs and documents to include in your courses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">          {/* Upload Step */}
          {state.step === 'upload' && (
            <div className="space-y-6">
              {/* Import Mode Selection */}
              <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant={state.importMode === 'file' ? 'default' : 'outline'}
                  onClick={() => setState(prev => ({ ...prev, importMode: 'file' }))}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  File Upload
                </Button>
                <Button
                  variant={state.importMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setState(prev => ({ ...prev, importMode: 'text' }))}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Paste Content
                </Button>
                <Button
                  variant={state.importMode === 'hybrid' ? 'default' : 'outline'}
                  onClick={() => setState(prev => ({ ...prev, importMode: 'hybrid' }))}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Hybrid Import
                </Button>
              </div>

              {/* File Upload Mode */}
              {state.importMode === 'file' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select Course Import File</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a JSON, CSV, YAML, TXT, or Excel file to import courses
                  </p>
                  <div className="mb-4 text-sm text-muted-foreground">
                    <strong>Supported formats:</strong>
                    <br />• JSON: Course data export
                    <br />• CSV/Excel: Topic, YouTube URLs, descriptions
                    <br />• YAML: Structured course definitions (like your syllabus file)
                    <br />• TXT: Simple format (Topic:, YouTube:, Description:)
                  </div>
                  <input
                    type="file"
                    accept=".json,.csv,.yaml,.yml,.txt,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="course-import-file"
                  />
                  <Button asChild>
                    <label htmlFor="course-import-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </label>
                  </Button>
                </div>
              )}

              {/* Text Content Mode */}
              {state.importMode === 'text' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="text-content" className="text-sm font-medium">
                      Paste Your Course Content
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Paste YAML, JSON, or structured text. The system will auto-detect topics and links.
                    </p>
                    <Textarea
                      id="text-content"
                      placeholder={`Example formats:

YAML:
Topic: JavaScript Fundamentals
YouTube: https://youtube.com/watch?v=example
Subtopics: Variables, Functions, Objects

OR Simple Text:
Topic: React Development
https://youtube.com/watch?v=react-tutorial
Practice: Build a to-do app

OR Multiple entries:
1. HTML & CSS Basics
   Video: https://youtube.com/playlist?list=html-css
   Tasks: Create responsive layout

2. JavaScript ES6
   Video: https://youtube.com/watch?v=es6-tutorial
   Topics: Arrow functions, Destructuring`}
                      value={state.textContent}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>

                  {/* Auto-detection Options */}
                  <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                    <Checkbox
                      id="auto-detect"
                      checked={state.autoDetectFields}
                      onCheckedChange={(checked) => 
                        setState(prev => ({ ...prev, autoDetectFields: !!checked }))
                      }
                    />
                    <Label htmlFor="auto-detect" className="text-sm">
                      Auto-detect topics, links, and fields from content
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={autoExtractLinks}
                      disabled={!state.textContent.trim()}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Preview Extract
                    </Button>
                  </div>

                  {/* Process Button */}
                  <Button
                    onClick={handleProcessText}
                    disabled={!state.textContent.trim() || state.isProcessing}
                    className="w-full"
                  >
                    {state.isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Content...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Process Content
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Hybrid Mode */}
              {state.importMode === 'hybrid' && (
                <div className="space-y-6">
                  {/* Text Content Section */}
                  <div>
                    <Label className="text-sm font-medium">Course Content (Text/YAML)</Label>
                    <Textarea
                      placeholder="Paste your course structure, topics, and links here..."
                      value={state.textContent}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      className="min-h-[120px] mt-2"
                    />
                  </div>

                  {/* Bulk Document Upload */}
                  <div>
                    <Label className="text-sm font-medium">Bulk Document Upload</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload PDF, DOC, or DOCX files that will be associated with your courses
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        handleBulkDocuments(files)
                      }}
                      className="hidden"
                      id="bulk-documents"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Button asChild variant="outline">
                        <label htmlFor="bulk-documents" className="cursor-pointer">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Documents
                        </label>
                      </Button>
                    </div>
                  </div>

                  {/* Show uploaded documents */}
                  {state.bulkDocuments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Uploaded Documents</Label>
                      <div className="space-y-2 mt-2">
                        {state.bulkDocuments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeBulkDocument(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Fields */}
                  <div>
                    <Label className="text-sm font-medium">Custom Fields (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Add custom fields that will be available for each course entry
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="e.g., prerequisites, certification"
                        id="custom-field-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement
                            addCustomField(input.value)
                            input.value = ''
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById('custom-field-input') as HTMLInputElement
                          addCustomField(input.value)
                          input.value = ''
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    {state.customFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {state.customFields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                            <button
                              onClick={() => removeCustomField(field)}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Process Button */}
                  <Button
                    onClick={handleProcessText}
                    disabled={!state.textContent.trim() || state.isProcessing}
                    className="w-full"
                  >
                    {state.isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Hybrid Import...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Process Hybrid Import
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Processing Step */}
          {state.isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing import file...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {/* Preview Step */}
          {state.step === 'preview' && state.validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Import Preview</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {state.validationResult.summary.validCount} Valid
                  </Badge>
                  {state.validationResult.summary.invalidCount > 0 && (
                    <Badge variant="destructive">
                      {state.validationResult.summary.invalidCount} Invalid
                    </Badge>
                  )}
                </div>
              </div>              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Import Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Total entries:</strong> {state.validationResult.summary.total}
                    </div>
                    <div>
                      <strong>Valid:</strong> {state.validationResult.summary.validCount}
                    </div>
                    <div>
                      <strong>Invalid:</strong> {state.validationResult.summary.invalidCount}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Course Structure Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="import-as-single-course"
                      checked={state.importAsSingleCourse}
                      onCheckedChange={(checked) => 
                        setState(prev => ({ ...prev, importAsSingleCourse: !!checked }))
                      }
                    />
                    <Label htmlFor="import-as-single-course" className="text-sm font-medium">
                      Import as Single Course (Recommended)
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {state.importAsSingleCourse ? 'SINGLE' : 'MULTIPLE'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {state.importAsSingleCourse 
                      ? `Create one course with ${state.validationResult.summary.validCount} topics as modules`
                      : `Create ${state.validationResult.summary.validCount} separate courses (one per topic)`
                    }
                  </p>                  {state.importAsSingleCourse && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="md:col-span-2">
                        <p className="text-xs text-blue-600 mb-2">
                          ✨ Single Course Import Mode - Configure your course details below:
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="course-title" className="text-sm font-medium">Course Title*</Label>
                        <Input
                          id="course-title"
                          value={state.courseTitle}
                          onChange={(e) => setState(prev => ({ ...prev, courseTitle: e.target.value }))}
                          placeholder="e.g., Complete Web Development Course"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="course-category" className="text-sm font-medium">Category</Label>
                        <Select 
                          value={state.courseCategory} 
                          onValueChange={(value) => setState(prev => ({ ...prev, courseCategory: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Programming">Programming</SelectItem>
                            <SelectItem value="Web Development">Web Development</SelectItem>
                            <SelectItem value="Data Science">Data Science</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="course-description" className="text-sm font-medium">Course Description</Label>
                        <Textarea
                          id="course-description"
                          value={state.courseDescription}
                          onChange={(e) => setState(prev => ({ ...prev, courseDescription: e.target.value }))}
                          placeholder="Describe what students will learn in this course..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="course-visibility" className="text-sm font-medium">Visibility</Label>
                        <Select 
                          value={state.courseVisibility} 
                          onValueChange={(value: 'private' | 'shared' | 'public') => 
                            setState(prev => ({ ...prev, courseVisibility: value }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private (Only you)</SelectItem>
                            <SelectItem value="shared">Shared (Anyone with link)</SelectItem>
                            <SelectItem value="public">Public (Submit for review)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview Entries */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {state.previews.map((preview, index) => (
                  <Card key={index} className={`${preview.error ? 'border-red-200' : 'border-green-200'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {preview.error ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium">Entry {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => enhanceWithAI(preview, index)}
                            disabled={state.aiEnhancing}
                          >
                            {state.aiEnhancing ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            AI Enhance
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePreview(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>                      {preview.error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-red-800 mb-1">Validation Errors</h4>
                              <div className="text-sm text-red-700">
                                {preview.error.split(' | ').map((error, errorIndex) => (
                                  <div key={errorIndex} className="mb-1 last:mb-0">
                                    • {error}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show validation info for reference */}
                      {preview.metadata?.validationInfo && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-800 mb-1">Import Requirements</h4>
                              <div className="text-sm text-blue-700 space-y-1">
                                <div>
                                  <strong>Required:</strong> {preview.metadata.validationInfo.required.join(', ')}
                                </div>
                                <div>
                                  <strong>Optional:</strong> {preview.metadata.validationInfo.optional.join(', ')}
                                </div>
                                {preview.metadata.validationInfo.note && (
                                  <div className="text-xs italic">
                                    📝 {preview.metadata.validationInfo.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show notifications (helpful tips) */}
                      {preview.metadata?.notifications && preview.metadata.notifications.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-yellow-800 mb-1">Suggestions</h4>
                              <div className="text-sm text-yellow-700">
                                {preview.metadata.notifications.map((notification: string, notifIndex: number) => (
                                  <div key={notifIndex} className="mb-1 last:mb-0">
                                    {notification}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Topic */}
                      <div>
                        <Label htmlFor={`topic-${index}`} className="text-xs">Topic/Course Name</Label>
                        <Input
                          id={`topic-${index}`}
                          value={preview.topic}
                          onChange={(e) => updatePreview(index, 'topic', e.target.value)}
                          placeholder="Enter course topic..."
                        />
                      </div>

                      {/* YouTube Links */}
                      <div>
                        <Label className="text-xs">YouTube URLs</Label>
                        {preview.youtubeLinks.map((link, linkIndex) => (
                          <div key={linkIndex} className="flex items-center gap-2 mt-1">
                            <Input
                              value={link}
                              onChange={(e) => updateYouTubeLink(index, linkIndex, e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeYouTubeLink(index, linkIndex)}
                              disabled={preview.youtubeLinks.length <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addYouTubeLink(index)}
                          className="mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add URL
                        </Button>
                      </div>

                      {/* Optional Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`description-${index}`} className="text-xs">Description</Label>
                          <Textarea
                            id={`description-${index}`}
                            value={preview.description || ''}
                            onChange={(e) => updatePreview(index, 'description', e.target.value)}
                            placeholder="Course description..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`duration-${index}`} className="text-xs">Duration</Label>
                          <Input
                            id={`duration-${index}`}
                            value={preview.duration || ''}
                            onChange={(e) => updatePreview(index, 'duration', e.target.value)}
                            placeholder="e.g., 4-6 weeks"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Entry */}
              <Button
                variant="outline"
                onClick={addNewPreview}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Course Entry
              </Button>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Import Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="ai-enhance"
                      checked={options.aiEnhance}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, aiEnhance: !!checked }))}
                    />
                    <Label htmlFor="ai-enhance" className="text-sm">
                      Enable AI enhancement for missing fields
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="update-existing"
                      checked={options.updateExisting}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, updateExisting: !!checked }))}
                    />
                    <Label htmlFor="update-existing" className="text-sm">
                      Update existing courses if found
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="skip-duplicates"
                      checked={options.skipDuplicates}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, skipDuplicates: !!checked }))}
                    />
                    <Label htmlFor="skip-duplicates" className="text-sm">
                      Skip duplicate courses
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetImport}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!state.validationResult || state.validationResult.summary.validCount === 0}
                >
                  Import {state.validationResult.summary.validCount} Courses
                </Button>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {state.step === 'importing' && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Importing courses...</span>
              </div>
              <Progress value={75} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Please wait while we import your courses into the system.
              </p>
            </div>
          )}

          {/* Complete Step */}
          {state.step === 'complete' && importResults && (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <div className="space-y-2">
                <p><strong>Successfully imported:</strong> {importResults.imported} courses</p>
                {importResults.failed > 0 && (
                  <p><strong>Failed:</strong> {importResults.failed} courses</p>
                )}
              </div>
              <Button onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
