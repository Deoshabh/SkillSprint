'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, ExternalLink, Eye, X } from 'lucide-react'

interface DocumentViewerProps {
  document: {
    id: string
    name: string
    originalName: string
    type: 'pdf' | 'doc' | 'docx' | 'txt'
    url: string
    size: number
    description?: string
    uploadedAt: string
  }
  trigger?: React.ReactNode
}

export function DocumentViewer({ document, trigger }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const canPreview = document.type === 'pdf' || document.type === 'txt'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(document.type)}
            {document.name}
          </DialogTitle>
          <DialogDescription>
            Document viewer - {document.originalName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Document Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{document.type.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">{formatFileSize(document.size)}</span>
              </div>
              {document.description && (
                <p className="text-sm text-muted-foreground">{document.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(document.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = window.document.createElement('a')
                  link.href = document.url
                  link.download = document.originalName
                  window.document.body.appendChild(link)
                  link.click()
                  window.document.body.removeChild(link)
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {/* Document Preview */}
          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '60vh' }}>
            {canPreview ? (
              <>
                {document.type === 'pdf' && (
                  <iframe
                    src={`${document.url}#view=FitH`}
                    className="w-full h-full border-0"
                    title={document.name}
                  />
                )}
                {document.type === 'txt' && (
                  <div className="p-4 h-full overflow-auto">
                    <iframe
                      src={document.url}
                      className="w-full h-full border-0"
                      title={document.name}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                {getFileIcon(document.type)}
                <h3 className="mt-4 text-lg font-semibold">Preview not available</h3>
                <p className="text-muted-foreground mt-2">
                  This file type cannot be previewed in the browser.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the "Open" or "Download" buttons above to view the document.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => window.open(document.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = window.document.createElement('a')
                      link.href = document.url
                      link.download = document.originalName
                      window.document.body.appendChild(link)
                      link.click()
                      window.document.body.removeChild(link)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
