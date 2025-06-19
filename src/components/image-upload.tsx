"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Trash2, Eye, Download, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { UploadedImage } from '@/lib/types';

interface ImageUploadProps {
  uploadType: 'avatar' | 'course' | 'content' | 'general';
  entityId?: string;
  currentImageUrl?: string;
  onImageUploaded?: (imageUrl: string) => void;
  onImageSelected?: (imageUrl: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  showGallery?: boolean;
  allowMultiple?: boolean;
}

export function ImageUpload({
  uploadType,
  entityId,
  currentImageUrl,
  onImageUploaded,
  onImageSelected,
  maxWidth = 800,
  maxHeight = 600,
  showGallery = true,
  allowMultiple = false
}: ImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const fetchUploadedImages = useCallback(async () => {
    if (!user || !showGallery) return;
    
    setLoadingGallery(true);
    try {
      const response = await fetch(`/api/upload/image?type=${uploadType}`);
      if (response.ok) {
        const data = await response.json();
        setUploadedImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch uploaded images:', error);
    } finally {
      setLoadingGallery(false);
    }
  }, [user, uploadType, showGallery]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload file
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload images.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();      formData.append('file', file);
      formData.append('type', uploadType);
      formData.append('entityId', entityId || user.id);
      formData.append('storageMethod', 'database'); // Always use database storage

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewUrl(data.imageUrl);
        onImageUploaded?.(data.imageUrl);
          toast({
          title: "Upload Successful",
          description: "Image uploaded successfully.",
        });

        // Refresh gallery if open
        if (galleryOpen) {
          fetchUploadedImages();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setPreviewUrl(imageUrl);
    onImageSelected?.(imageUrl);
    setGalleryOpen(false);
  };

  const openGallery = () => {
    setGalleryOpen(true);
    fetchUploadedImages();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Image Upload
          </CardTitle>
          <CardDescription>
            Upload and manage images for {uploadType}
          </CardDescription>
        </CardHeader>        <CardContent className="space-y-4">
          {/* Current Image Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="relative inline-block">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-xs max-h-48 rounded-lg border object-cover"
                  style={{ maxWidth: maxWidth, maxHeight: maxHeight }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setPreviewUrl(null)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="flex-1"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload New Image'}
              </Button>
              
              {showGallery && (
                <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={openGallery}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Gallery
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Your Uploaded Images</DialogTitle>
                    </DialogHeader>
                    
                    {loadingGallery ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : uploadedImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {uploadedImages.map((image) => (
                          <div key={image.id} className="space-y-2">
                            <div 
                              className="relative cursor-pointer group rounded-lg overflow-hidden border hover:border-primary"
                              onClick={() => handleImageSelect(image.dataUrl)}
                            >
                              <img 
                                src={image.dataUrl} 
                                alt={image.fileName}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate">{image.fileName}</p>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatFileSize(image.fileSize)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {image.uploadType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No images uploaded yet</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              multiple={allowMultiple}
            />

            {/* Upload Info */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP, GIF
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
