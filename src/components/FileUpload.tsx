import React, { useRef, useState, useEffect } from 'react';
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
  capture?: boolean;
}

export function FileUpload({ 
  onFileSelect, 
  accept = '.csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  uploadedFileName,
  onRemoveFile,
  capture = false
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é dispositivo móvel
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };
    setIsMobile(checkMobile());
  }, []);

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
    if (isMobile) {
      // Para mobile, tentar usar File System Access API se disponível
      if ('showOpenFilePicker' in window) {
        handleModernFilePicker();
      } else {
        fileInputRef.current?.click();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      
      // Verificar tipo de arquivo
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const isValidType = allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv');
      
      if (!isValidType) {
        alert('Tipo de arquivo não suportado. Use apenas arquivos CSV.');
        return;
      }
      
      if (file.size > maxSize) {
        alert(`Arquivo muito grande. Tamanho máximo: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }
      
      onFileSelect(file);
    }
  };

  const handleModernFilePicker = async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Arquivos CSV',
            accept: {
              'text/csv': ['.csv'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
            }
          }
        ],
        multiple: false
      });
      
      const file = await fileHandle.getFile();
      
      if (file.size > maxSize) {
        alert(`Arquivo muito grande. Tamanho máximo: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }
      
      onFileSelect(file);
    } catch (error) {
      // Usuário cancelou ou erro - fallback para input tradicional
      fileInputRef.current?.click();
    }
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
        multiple={false}
        capture={capture ? 'environment' : undefined}
        className="hidden"
        style={{ display: 'none' }}
        aria-label="Selecionar arquivo"
        tabIndex={-1}
      />
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-100' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${isMobile ? 'py-8' : ''}`}
      >
        <Upload className={`h-8 w-8 mb-2 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium text-blue-600">
            {isMobile ? 'Toque para selecionar um arquivo' : 'Clique para fazer upload'}
          </span>
          <br />
          {!isMobile && 'ou arraste o arquivo aqui'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formatos aceitos: CSV, Excel • Máximo {(maxSize / (1024 * 1024)).toFixed(1)}MB
        </p>
        {isMobile && (
          <p className="text-xs text-blue-600 mt-2">
            📱 Otimizado para dispositivos móveis
          </p>
        )}
      </div>
    </div>
  );
}
