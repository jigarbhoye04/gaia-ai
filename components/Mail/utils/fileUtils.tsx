import { FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { Pdf02Icon } from "../../Misc/icons";
import { ReactNode } from "react";

export const getFileIcon = (fileName: string): ReactNode => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return <FileImage className="text-blue-400" />;
  }

  // PDF files
  if (extension === 'pdf') {
    return <Pdf02Icon className="text-red-400" />;
  }

  // Document files
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
    return <FileText className="text-green-400" />;
  }

  // Spreadsheet files
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return <FileSpreadsheet className="text-emerald-400" />;
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return <FileArchive className="text-yellow-400" />;
  }

  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
    return <FileAudio className="text-purple-400" />;
  }

  // Default for other file types
  return <FileType className="text-gray-400" />;
};

