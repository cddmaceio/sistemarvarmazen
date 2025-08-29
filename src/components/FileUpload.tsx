import React, { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { cn } from '@/lib-react/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  uploadedFileName?: string;
  onRemoveFile?: () => void;
}

export function FileUpload({ 
  onFileSelect, 
  accept = '.csv,.xlsx,.xls',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  uploadedFileName,
  onRemoveFile 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo
      if (file.size > maxSize) {
        alert(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (uploadedFileName) {
    return (
      <div className={cn("flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg", className)}>
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800 font-medium">{uploadedFileName}</span>
        </div>
        {onRemoveFile && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <div
        onClick={handleClick}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium text-blue-600">Clique para fazer upload</span>
          <br />
          ou arraste o arquivo aqui
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formatos aceitos: CSV, Excel
        </p>
      </div>
    </div>
  );
}
