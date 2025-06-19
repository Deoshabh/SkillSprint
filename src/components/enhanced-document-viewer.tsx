'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, ExternalLink, Eye, X, Highlighter, StickyNote, Save } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Note {
  id: string;
  position: { x: number; y: number };
  content: string;
  color: string;
}

interface Highlight {
  id: string;
  position: { x: number; y: number; width: number; height: number };
  color: string;
}

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
  userId?: string
}

export function EnhancedDocumentViewer({ document, trigger, userId }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('document')
  const [notes, setNotes] = useState<Note[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [noteColor, setNoteColor] = useState('#FFF59D')
  const [highlightColor, setHighlightColor] = useState('#FFFF00')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  
  const viewerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const noteColors = ['#FFF59D', '#81D4FA', '#A5D6A7', '#FFAB91', '#D1C4E9']
  const highlightColors = ['#FFFF00', '#00FFFF', '#FF00FF', '#00FF00', '#FFA500']

  // Load saved notes and highlights when the component mounts
  useEffect(() => {
    if (document.id && userId) {
      // Here you would typically fetch from API
      const savedNotes = localStorage.getItem(`notes-${document.id}-${userId}`)
      const savedHighlights = localStorage.getItem(`highlights-${document.id}-${userId}`)
      
      if (savedNotes) {
        try {
          setNotes(JSON.parse(savedNotes))
        } catch (e) {
          console.error('Failed to parse saved notes', e)
        }
      }
      
      if (savedHighlights) {
        try {
          setHighlights(JSON.parse(savedHighlights))
        } catch (e) {
          console.error('Failed to parse saved highlights', e)
        }
      }
    }
  }, [document.id, userId])

  // Save notes and highlights when they change
  useEffect(() => {
    if (document.id && userId && notes.length > 0) {
      localStorage.setItem(`notes-${document.id}-${userId}`, JSON.stringify(notes))
    }
  }, [notes, document.id, userId])

  useEffect(() => {
    if (document.id && userId && highlights.length > 0) {
      localStorage.setItem(`highlights-${document.id}-${userId}`, JSON.stringify(highlights))
    }
  }, [highlights, document.id, userId])

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

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerRef.current) return
    
    const rect = viewerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (isAddingNote) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        position: { x, y },
        content: currentNote || 'New note',
        color: noteColor
      }
      
      setNotes([...notes, newNote])
      setCurrentNote('')
      setIsAddingNote(false)
      toast({
        title: "Note added",
        description: "Your note has been added to the document.",
      })
    }
    
    if (isHighlighting) {
      // For simplicity, we're creating a highlight box of fixed size
      // In a real implementation, you'd want to capture user's selection
      const newHighlight: Highlight = {
        id: `highlight-${Date.now()}`,
        position: { x, y, width: 100, height: 20 },
        color: highlightColor
      }
      
      setHighlights([...highlights, newHighlight])
      setIsHighlighting(false)
      toast({
        title: "Highlight added",
        description: "The selected text has been highlighted.",
      })
    }
  }

  const handleSaveNotes = () => {
    // Here you would typically save to your backend API
    // For now, we're just using localStorage in the useEffect
    toast({
      title: "Changes saved",
      description: "Your notes and highlights have been saved.",
    })
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
    setSelectedNote(null)
  }

  const deleteHighlight = (id: string) => {
    setHighlights(highlights.filter(highlight => highlight.id !== id))
    setSelectedHighlight(null)
  }

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
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(document.type)}
            {document.name}
          </DialogTitle>
          <DialogDescription>
            Interactive document viewer - {document.originalName}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="highlights">Highlights ({highlights.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="document" className="space-y-4">
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
                  variant={isAddingNote ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(!isAddingNote)
                    setIsHighlighting(false)
                  }}
                >
                  <StickyNote className="h-4 w-4 mr-1" />
                  {isAddingNote ? "Cancel" : "Add Note"}
                </Button>
                
                <Button
                  variant={isHighlighting ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsHighlighting(!isHighlighting)
                    setIsAddingNote(false)
                  }}
                >
                  <Highlighter className="h-4 w-4 mr-1" />
                  {isHighlighting ? "Cancel" : "Highlight"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(document.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
                
                <Button
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

            {/* Document Preview with Annotations */}
            <div 
              ref={viewerRef}
              className="border rounded-lg overflow-hidden bg-white relative" 
              style={{ height: '60vh' }}
              onClick={handleDocumentClick}
            >
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
                  
                  {/* Render highlights */}
                  {highlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${highlight.position.x}px`,
                        top: `${highlight.position.y}px`,
                        width: `${highlight.position.width}px`,
                        height: `${highlight.position.height}px`,
                        backgroundColor: highlight.color,
                        opacity: 0.5,
                        zIndex: 10
                      }}
                    />
                  ))}
                  
                  {/* Render notes */}
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="absolute flex items-center justify-center rounded-full cursor-pointer"
                      style={{
                        left: `${note.position.x}px`,
                        top: `${note.position.y}px`,
                        backgroundColor: note.color,
                        width: '24px',
                        height: '24px',
                        zIndex: 20
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedNote(note.id === selectedNote ? null : note.id)
                      }}
                    >
                      <StickyNote className="h-3 w-3 text-gray-700" />
                      
                      {selectedNote === note.id && (
                        <div 
                          className="absolute top-full left-0 mt-2 p-2 rounded bg-white shadow-lg border z-30"
                          style={{ width: '200px', maxWidth: '300px' }}
                        >
                          <p className="text-sm mb-1">{note.content}</p>
                          <div className="flex justify-end mt-2 gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedNote(null)}>
                              Close
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteNote(note.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                    </Button>
                    <Button
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
            
            {/* Note UI when adding a note */}
            {isAddingNote && (
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium mb-2">Adding a new note</h4>
                <Textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Type your note here..."
                  className="mb-2"
                />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Note color:</span>
                  <div className="flex gap-1">
                    {noteColors.map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                        onClick={() => setNoteColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Click anywhere on the document to place the note
                </div>
              </div>
            )}
            
            {/* Highlight UI when highlighting */}
            {isHighlighting && (
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium mb-2">Adding a highlight</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Highlight color:</span>
                  <div className="flex gap-1">
                    {highlightColors.map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                        onClick={() => setHighlightColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Click anywhere on the document to add a highlight
                </div>
              </div>
            )}
            
            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes}>
                <Save className="h-4 w-4 mr-2" />
                Save changes
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Notes</h3>
              
              {notes.length === 0 ? (
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-muted-foreground">No notes yet. Add notes while viewing the document.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-3 rounded-lg flex border"
                      style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex-1">
                        <p className="text-sm">{note.content}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => deleteNote(note.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="highlights">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Highlights</h3>
              
              {highlights.length === 0 ? (
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-muted-foreground">No highlights yet. Highlight text while viewing the document.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <div 
                      key={highlight.id} 
                      className="p-3 rounded-lg flex border"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <div 
                          className="w-4 h-4" 
                          style={{ backgroundColor: highlight.color }}
                        />
                        <p className="text-sm">Highlight #{index + 1}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => deleteHighlight(highlight.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
