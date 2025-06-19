'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Plus, Loader2, AlertTriangle, Download, Clock, Globe, Trash2, Bot, User, BookOpen, Edit2, Check, X } from 'lucide-react';
import { CourseDocument } from '@/lib/types';
import { DocumentViewer } from '../document-viewer';
import { EnhancedDocumentViewer } from '../enhanced-document-viewer';
import { DocumentUpload } from '../document-upload';

// Add some extra styles for the collapsible panel
import './document-panel.css';

interface DocumentCollection {
  id: string;
  title: string;
  documents: CourseDocument[];
  type: 'module' | 'ai-search' | 'custom';
}

interface DocumentState {
  customDocuments: CourseDocument[];
  aiDocuments: CourseDocument[];
  aiSearchCount: number;
}

interface DocumentListPanelProps {
  documentCollections: DocumentCollection[];
  currentDocument: CourseDocument | null;
  documentState: DocumentState;
  aiSearchQuery: string;
  aiSearchLoading: boolean;
  customLinkUrl: string;
  customLinkLoading: boolean;
  loading: boolean;
  maxCustomDocuments: number;
  maxAiSearches: number;
  userId: string;
  courseId: string;
  moduleId: string;
  onDocumentSelect: (document: CourseDocument) => void;
  onRemoveDocument: (documentId: string) => void;
  onSetAiSearchQuery: (query: string) => void;
  onAiSearch: () => void;
  onSetCustomLinkUrl: (url: string) => void;
  onAddCustomLink: () => void;
}

export function DocumentListPanel({
  documentCollections,
  currentDocument,
  documentState,
  aiSearchQuery,
  aiSearchLoading,
  customLinkUrl,
  customLinkLoading,
  loading,
  maxCustomDocuments,
  maxAiSearches,
  userId,
  courseId,
  moduleId,
  onDocumentSelect,
  onRemoveDocument,
  onSetAiSearchQuery,
  onAiSearch,
  onSetCustomLinkUrl,
  onAddCustomLink
}: DocumentListPanelProps) {
  // State for collapsed/expanded panel with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("documentListPanelCollapsed");
      return savedState === "true";
    }
    return false;
  });
  
  // Toggle collapsed state with function for keyboard shortcuts
  const toggleCollapsed = React.useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("documentListPanelCollapsed", String(newState));
  }, [isCollapsed]);
  
  // Add keyboard shortcut (Alt+D) to toggle panel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        toggleCollapsed();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  // Get the remaining counts for constraints
  const remainingCustomDocs = maxCustomDocuments - documentState.customDocuments.length;
  const remainingAiSearches = maxAiSearches - documentState.aiSearchCount;
  
  const validateDocumentUrl = (url: string): boolean => {
    // Basic URL validation
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  return (
    <Card className={`document-list-panel transition-all ${isCollapsed ? 'collapsed' : ''}`}>
      <CardHeader className="py-3">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center gap-2">
            <FileText size={18} />
            <span>Documents</span>
            {loading && <Loader2 className="animate-spin ml-2 h-4 w-4" />}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="shrink-0">
            {isCollapsed ? <Plus size={16} /> : <X size={16} />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="px-3 py-2 flex flex-col gap-4">
          {/* AI Document Search Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Bot size={14} />
              <span>AI Document Search</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {remainingAiSearches} left
              </Badge>
            </h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Search for relevant documents..."
                value={aiSearchQuery}
                onChange={(e) => onSetAiSearchQuery(e.target.value)}
                disabled={aiSearchLoading || remainingAiSearches <= 0}
              />
              <Button 
                onClick={onAiSearch} 
                disabled={!aiSearchQuery || aiSearchLoading || remainingAiSearches <= 0}
                variant="secondary"
                size="icon"
              >
                {aiSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            {remainingAiSearches <= 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>You have reached the maximum number of AI searches</span>
              </p>
            )}
          </div>
          
          {/* Custom Document Upload */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <User size={14} />
              <span>Add Document</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {remainingCustomDocs} left
              </Badge>
            </h3>
            
            <div className="flex flex-col gap-2">
              {/* Document Upload Button */}
              {remainingCustomDocs > 0 && (
                <DocumentUpload 
                  userId={userId}
                  courseId={courseId}
                  onUploadComplete={(document) => {
                    // Handle the uploaded document
                  }}
                  trigger={
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" />
                      Upload Document
                    </Button>
                  }
                />
              )}
              
              {/* External Document Link */}
              <div className="flex gap-2">
                <Input
                  placeholder="Link to external document..."
                  value={customLinkUrl}
                  onChange={(e) => onSetCustomLinkUrl(e.target.value)}
                  disabled={customLinkLoading || remainingCustomDocs <= 0}
                />
                <Button 
                  onClick={onAddCustomLink} 
                  disabled={!validateDocumentUrl(customLinkUrl) || customLinkLoading || remainingCustomDocs <= 0}
                  variant="secondary"
                  size="icon"
                >
                  {customLinkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              
              {remainingCustomDocs <= 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>You have reached the maximum number of custom documents</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Document Collections */}
          <div className="space-y-3">
            {documentCollections.map((collection) => (
              <div key={collection.id} className="space-y-1">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  {collection.type === 'module' && <BookOpen size={14} />}
                  {collection.type === 'ai-search' && <Bot size={14} />}
                  {collection.type === 'custom' && <User size={14} />}
                  <span>{collection.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {collection.documents.length}
                  </Badge>
                </h3>
                
                <div className="space-y-1">
                  {collection.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-2 text-sm rounded-md cursor-pointer ${
                        currentDocument?.id === doc.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => onDocumentSelect(doc)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className={`h-4 w-4 shrink-0 ${doc.type === 'pdf' ? 'text-red-500' : 'text-blue-500'}`} />
                        <span className="truncate">{doc.name}</span>
                        {doc.status === 'pending' && (
                          <Badge variant="outline" className="ml-1 text-xs">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">                        <EnhancedDocumentViewer 
                          document={doc}
                          userId={userId}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        {collection.type !== 'module' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveDocument(doc.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {collection.documents.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 italic">No documents available</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
