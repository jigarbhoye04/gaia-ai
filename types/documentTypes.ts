// Types for document-related components and functionality
import { ReactNode } from "react";

// FileUpload component types
export interface FileUploadProps {
  isImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

// File related types
export interface FileData {
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
}

// Document viewer props
export interface DocumentViewerProps {
  file: File | null;
  fileName?: string;
  fileUrl?: string;
}

// Document processing status
export interface DocumentProcessingStatus {
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress?: number;
  error?: string;
}