import React from 'react';
import { LucideIcon, Search, Database, AlertCircle, FileX } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /**
   * Ícone a ser exibido
   */
  icon?: LucideIcon;
  
  /**
   * Título do estado vazio
   */
  title: string;
  
  /**
   * Descrição do estado vazio
   */
  description?: string;
  
  /**
   * Ação principal (botão)
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  
  /**
   * Ação secundária (link/botão)
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  /**
   * Tipo de estado vazio (afeta o ícone padrão)
   */
  type?: 'default' | 'search' | 'error' | 'no-data';
  
  /**
   * Tamanho do componente
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Se deve ser exibido como card
   */
  asCard?: boolean;
  
  /**
   * Classe CSS adicional
   */
  className?: string;
  
  /**
   * Conteúdo personalizado adicional
   */
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  type = 'default',
  size = 'md',
  asCard = false,
  className,
  children,
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return Search;
      case 'error':
        return AlertCircle;
      case 'no-data':
        return Database;
      default:
        return FileX;
    }
  };

  const IconComponent = icon || getDefaultIcon();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-8',
          icon: 'h-12 w-12 mb-3',
          title: 'text-lg',
          description: 'text-sm',
          spacing: 'space-y-2',
        };
      case 'lg':
        return {
          container: 'py-16',
          icon: 'h-20 w-20 mb-6',
          title: 'text-2xl',
          description: 'text-base',
          spacing: 'space-y-4',
        };
      default:
        return {
          container: 'py-12',
          icon: 'h-16 w-16 mb-4',
          title: 'text-xl',
          description: 'text-base',
          spacing: 'space-y-3',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const content = (
    <div className={cn(
      'text-center',
      sizeClasses.container,
      sizeClasses.spacing,
      className
    )}>
      <IconComponent className={cn(
        'mx-auto text-gray-400',
        sizeClasses.icon
      )} />
      
      <div className="max-w-md mx-auto">
        <h3 className={cn(
          'font-semibold text-gray-900 mb-2',
          sizeClasses.title
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            'text-gray-600 mb-4',
            sizeClasses.description
          )}>
            {description}
          </p>
        )}
        
        {children}
        
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
              >
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="ghost"
                size="sm"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (asCard) {
    return (
      <Card>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

/**
 * Estados vazios pré-configurados para casos comuns
 */
export const EmptyStatePresets = {
  /**
   * Nenhum resultado de busca
   */
  NoSearchResults: (props: Partial<EmptyStateProps> & { searchTerm?: string }) => (
    <EmptyState
      type="search"
      title="Nenhum resultado encontrado"
      description={
        props.searchTerm 
          ? `Nenhum resultado para "${props.searchTerm}". Tente ajustar sua busca.`
          : 'Tente ajustar os filtros ou termos de busca.'
      }
      {...props}
    />
  ),

  /**
   * Lista vazia (primeira vez)
   */
  EmptyList: (props: Partial<EmptyStateProps> & { entityName: string }) => (
    <EmptyState
      type="no-data"
      title={`Nenhum${props.entityName.endsWith('a') ? 'a' : ''} ${props.entityName} encontrado${props.entityName.endsWith('a') ? 'a' : ''}`}
      description={`Você ainda não tem nenhum${props.entityName.endsWith('a') ? 'a' : ''} ${props.entityName} cadastrado${props.entityName.endsWith('a') ? 'a' : ''}.`}
      {...props}
    />
  ),

  /**
   * Erro genérico
   */
  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      type="error"
      title="Algo deu errado"
      description="Ocorreu um erro inesperado. Tente novamente em alguns instantes."
      {...props}
    />
  ),

  /**
   * Sem permissão
   */
  NoPermission: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      type="error"
      title="Acesso restrito"
      description="Você não tem permissão para visualizar este conteúdo."
      {...props}
    />
  ),

  /**
   * Em construção
   */
  UnderConstruction: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="Em breve"
      description="Esta funcionalidade está sendo desenvolvida e estará disponível em breve."
      {...props}
    />
  ),
};

export default EmptyState;