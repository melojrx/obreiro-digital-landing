import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CsvUploaderProps {
  onFileSelect: (file: File) => void;
  maxSizeMB?: number;
  acceptExtensions?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPT = ['.csv', '.txt'];

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onFileSelect,
  maxSizeMB = 5,
  acceptExtensions = DEFAULT_ACCEPT,
  disabled = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!acceptExtensions.includes(ext)) {
        return `Formato inválido (${ext}). Use ${acceptExtensions.join(', ')}.`;
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        return `Arquivo maior que ${maxSizeMB}MB.`;
      }
      return null;
    },
    [acceptExtensions, maxSizeMB]
  );

  const handleFile = (file?: File) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFileName(file.name);
    onFileSelect(file);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    handleFile(event.target.files[0]);
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-blue-500" />
        <p className="mt-3 font-semibold text-slate-800">
          Arraste e solte o arquivo CSV aqui
        </p>
        <p className="text-sm text-slate-500">
          ou{' '}
          <span className="text-blue-600 underline font-medium">
            clique para selecionar
          </span>
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Suporta {acceptExtensions.join(', ')} • Máximo {maxSizeMB}MB
        </p>
        {fileName && (
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            <FileText className="w-4 h-4" />
            {fileName}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptExtensions.join(',')}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
        aria-label="Selecionar arquivo CSV"
        data-testid="csv-input"
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => {
              setError(null);
              setFileName(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          >
            limpar
          </Button>
        </div>
      )}
    </div>
  );
};

export default CsvUploader;
