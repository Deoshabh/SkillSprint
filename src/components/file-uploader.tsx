"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Trash2, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string;
  maxSize?: number; // in MB
  onFileChange: (file: File | null) => void;
  value?: File | null;
  showPreview?: boolean;
  label?: string;
  description?: string;
  uploading?: boolean;
  error?: string;
  success?: string;
}

export function FileUploader({
  accept = ".pdf,.doc,.docx,.txt",
  maxSize = 10, // Default 10MB
  onFileChange,
  value,
  showPreview = true,
  label = "Upload a file",
  description = "Drag and drop a file here, or click to browse",
  uploading = false,
  error,
  success,
  className,
  ...props
}: FileUploaderProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [onFileChange]
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [onFileChange]
  );

  const processFile = (file: File) => {
    setFileError(null);
    
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (fileType && !acceptedTypes.includes(fileType)) {
      setFileError(`Invalid file type. Accepted types: ${accept}`);
      return;
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setFileError(`File too large. Maximum size: ${maxSize}MB`);
      return;
    }
    
    onFileChange(file);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setFileError(null);
    
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const fileSize = value?.size ? (value.size / (1024 * 1024)).toFixed(2) + "MB" : "";

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && <Label htmlFor="file-uploader">{label}</Label>}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-muted",
          (value || fileError) && "border-solid",
          fileError && "border-destructive bg-destructive/5",
          success && "border-success bg-success/5",
          className
        )}
      >
        <Input
          ref={inputRef}
          id="file-uploader"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <FileText className="h-8 w-8 text-primary" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">{fileSize}</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={removeFile}
              className="mt-2"
            >
              <X className="h-4 w-4 mr-2" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">{description}</p>
              <p className="text-xs text-muted-foreground">
                {accept.split(',').join(', ')} • Max size: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {(fileError || error) && (
        <div className="flex items-center text-destructive text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{fileError || error}</span>
        </div>
      )}

      {!fileError && success && (
        <div className="flex items-center text-success text-sm mt-1">
          <Check className="h-4 w-4 mr-1" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
