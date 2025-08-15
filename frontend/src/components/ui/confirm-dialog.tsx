import React, { useState } from 'react';
import { AlertTriangle, Trash2, AlertCircle, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  /**
   * Elemento que dispara o dialog (botão, link, etc.)
   */
  trigger: React.ReactNode;
  
  /**
   * Título do dialog
   */
  title: string;
  
  /**
   * Descrição/conteúdo do dialog
   */
  description: string;
  
  /**
   * Texto do botão de confirmação
   */
  confirmText?: string;
  
  /**
   * Texto do botão de cancelamento
   */
  cancelText?: string;
  
  /**
   * Callback executado quando confirmado
   */
  onConfirm: () => void | Promise<void>;
  
  /**
   * Callback executado quando cancelado
   */
  onCancel?: () => void;
  
  /**
   * Variante do dialog (afeta cores e ícones)
   */
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  
  /**
   * Se o botão de confirmação deve estar em estado de loading
   */
  isLoading?: boolean;
  
  /**
   * Se o dialog deve fechar automaticamente após confirmação
   */
  autoClose?: boolean;
  
  /**
   * Conteúdo adicional a ser exibido no dialog
   */
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  trigger,
  title,
  description,
  confirmText,
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
  autoClose = true,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      if (autoClose) {
        setOpen(false);
      }
    } catch (error) {
      // Erro será tratado pelo componente pai
    }
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <Trash2 className="h-6 w-6 text-red-600" />,
          confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
          defaultConfirmText: 'Remover',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600',
          defaultConfirmText: 'Continuar',
        };
      case 'info':
        return {
          icon: <Info className="h-6 w-6 text-blue-600" />,
          confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600',
          defaultConfirmText: 'Confirmar',
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6 text-gray-600" />,
          confirmButtonClass: 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-900',
          defaultConfirmText: 'Confirmar',
        };
    }
  };

  const config = getVariantConfig();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              config.confirmButtonClass,
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              confirmText || config.defaultConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Hook para usar o ConfirmDialog de forma programática
 */
export const useConfirmDialog = () => {
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
    variant?: ConfirmDialogProps['variant'];
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showConfirm = (config: Omit<typeof dialogConfig, 'isOpen'>) => {
    setDialogConfig({
      ...config,
      isOpen: true,
    });
  };

  const hideConfirm = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmDialogComponent = () => (
    <AlertDialog open={dialogConfig.isOpen} onOpenChange={hideConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogConfig.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={hideConfirm}>
            {dialogConfig.cancelText || 'Cancelar'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await dialogConfig.onConfirm();
              hideConfirm();
            }}
            className={
              dialogConfig.variant === 'destructive' 
                ? 'bg-red-600 hover:bg-red-700'
                : undefined
            }
          >
            {dialogConfig.confirmText || 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    showConfirm,
    hideConfirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
};

export default ConfirmDialog;