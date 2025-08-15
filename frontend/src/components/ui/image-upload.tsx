import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  /**
   * Callback chamado quando uma imagem é selecionada
   */
  onImageSelect?: (file: File) => void;
  
  /**
   * Callback chamado quando a imagem é removida
   */
  onImageRemove?: () => void;
  
  /**
   * URL da imagem atual (preview)
   */
  currentImageUrl?: string;
  
  /**
   * Tamanho máximo do arquivo em MB
   */
  maxSizeMB?: number;
  
  /**
   * Tipos de arquivo aceitos
   */
  acceptedTypes?: string[];
  
  /**
   * Dimensões recomendadas para exibição
   */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /**
   * Texto de ajuda
   */
  helpText?: string;
  
  /**
   * Se deve mostrar botão de remoção
   */
  showRemoveButton?: boolean;
  
  /**
   * Estado de loading durante upload
   */
  isUploading?: boolean;
  
  /**
   * Classe CSS adicional
   */
  className?: string;
  
  /**
   * Se é obrigatório
   */
  required?: boolean;
  
  /**
   * Label do campo
   */
  label?: string;
  
  /**
   * Texto personalizado para área de upload
   */
  uploadText?: string;
  
  /**
   * Variant do componente
   */
  variant?: 'default' | 'compact' | 'avatar';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  currentImageUrl,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  dimensions,
  helpText,
  showRemoveButton = true,
  isUploading = false,
  className,
  required = false,
  label,
  uploadText,
  variant = 'default',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError('');

    // Validar tipo de arquivo
    if (!acceptedTypes.includes(file.type)) {
      setError(`Tipo de arquivo não suportado. Use: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`);
      return;
    }

    // Validar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    onImageSelect?.(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => acceptedTypes.includes(file.type));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleRemove = () => {
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const renderUploadArea = () => {
    if (variant === 'avatar') {
      return (
        <div 
          className={cn(
            'relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer overflow-hidden',
            isDragOver && 'border-blue-500 bg-blue-50',
            isUploading && 'opacity-50 cursor-not-allowed',
            className
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {currentImageUrl ? (
            <>
              <img
                src={currentImageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              {showRemoveButton && !isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs text-center">Avatar</span>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div className={cn('flex items-center gap-4', className)}>
          {currentImageUrl ? (
            <div className="relative">
              <img
                src={currentImageUrl}
                alt="Preview"
                className={cn(
                  'object-cover rounded-lg border',
                  dimensions 
                    ? `w-[${dimensions.width}px] h-[${dimensions.height}px]` 
                    : 'w-16 h-16'
                )}
              />
              {showRemoveButton && !isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={handleRemove}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ) : (
            <div 
              className={cn(
                'w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400',
                dimensions && `w-[${dimensions.width}px] h-[${dimensions.height}px]`,
                isDragOver && 'border-blue-500 bg-blue-50',
                isUploading && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <Upload className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}
          
          <div className="flex-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {currentImageUrl ? 'Alterar' : 'Selecionar'}
                </>
              )}
            </Button>
            {helpText && (
              <p className="text-sm text-gray-500 mt-1">{helpText}</p>
            )}
          </div>
        </div>
      );
    }

    // Variant default
    return (
      <div className={cn('space-y-4', className)}>
        {currentImageUrl ? (
          <div className="relative inline-block">
            <img
              src={currentImageUrl}
              alt="Preview"
              className={cn(
                'object-cover rounded-lg border',
                dimensions 
                  ? `max-w-[${dimensions.width}px] max-h-[${dimensions.height}px]` 
                  : 'max-w-xs max-h-64'
              )}
            />
            {showRemoveButton && !isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors',
              dimensions && `w-[${dimensions.width}px] h-[${dimensions.height}px]`,
              isDragOver && 'border-blue-500 bg-blue-50',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-sm text-gray-600">Enviando imagem...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {uploadText || 'Clique para selecionar ou arraste uma imagem'}
                </p>
                <p className="text-xs text-gray-500">
                  {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} até {maxSizeMB}MB
                </p>
                {dimensions && (
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: {dimensions.width}x{dimensions.height}px
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!currentImageUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagem
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
          {label}
        </Label>
      )}
      
      {renderUploadArea()}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helpText && variant === 'default' && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default ImageUpload;