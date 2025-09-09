import React, { useState } from 'react';
import { Plus, Calendar, User, FileText, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { MembershipStatus } from '@/services/membersService';
import { usePermissions } from '@/hooks/usePermissions';

interface MembershipStatusHistoryProps {
  memberStatuses: MembershipStatus[];
  memberId: number;
  memberName: string;
  canEdit?: boolean;
  onAddStatus?: () => void;
  onEditStatus?: (status: MembershipStatus) => void;
  onDeleteStatus?: (status: MembershipStatus) => void;
  isLoading?: boolean;
}

export const MembershipStatusHistory: React.FC<MembershipStatusHistoryProps> = ({
  memberStatuses,
  memberId,
  memberName,
  canEdit = false,
  onAddStatus,
  onEditStatus,
  onDeleteStatus,
  isLoading = false,
}) => {
  const permissions = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string, isCurrent: boolean) => {
    if (isCurrent) return 'default';
    
    const variants: Record<string, 'secondary' | 'outline'> = {
      'member': 'secondary',
      'deacon': 'outline',
      'deaconess': 'outline',
      'elder': 'outline',
      'evangelist': 'outline',
      'pastor': 'outline',
      'leader': 'secondary',
    };
    
    return variants[status] || 'secondary';
  };

  const getStatusIcon = (status: string) => {
    // Retorna ícone baseado no status
    switch (status) {
      case 'pastor':
      case 'female_pastor':
        return '🙏';
      case 'elder':
        return '👨‍💼';
      case 'deacon':
      case 'deaconess':
        return '🤝';
      case 'evangelist':
        return '📢';
      case 'missionary':
      case 'female_missionary':
        return '🌍';
      case 'leader':
        return '👥';
      default:
        return '👤';
    }
  };

  const toggleExpanded = (statusId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(statusId)) {
      newExpanded.delete(statusId);
    } else {
      newExpanded.add(statusId);
    }
    setExpandedItems(newExpanded);
  };

  const calculateDuration = (effectiveDate?: string, endDate?: string) => {
    if (!effectiveDate) return 'N/A';
    
    const start = new Date(effectiveDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} dia(s)`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mês(es)`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return years > 0 ? `${years} ano(s)${remainingMonths > 0 ? ` e ${remainingMonths} mês(es)` : ''}` : `${remainingMonths} mês(es)`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico Ministerial
              </CardTitle>
              <CardDescription>Carregando histórico...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico Ministerial
            </CardTitle>
            <CardDescription>
              Registro completo de mudanças na função ministerial de {memberName}
            </CardDescription>
          </div>
          {canEdit && onAddStatus && (
            <Button onClick={onAddStatus} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Status
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {memberStatuses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Clock className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico encontrado</h3>
            <p className="text-gray-500 mb-4">Este membro ainda não possui histórico de status ministerial.</p>
            {canEdit && onAddStatus && (
              <Button onClick={onAddStatus} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro status
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative">
              {memberStatuses.map((status, index) => (
                <div key={status.id} className="relative">
                  {/* Linha da timeline (não mostrar na última) */}
                  {index < memberStatuses.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
                  )}
                  
                  {/* Item da timeline */}
                  <div className="relative flex items-start space-x-4 pb-6">
                    {/* Indicador circular */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full text-lg
                      ${status.is_current 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {getStatusIcon(status.status)}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {status.status_display}
                          </h4>
                          {status.is_current && (
                            <Badge variant="default" className="text-xs">
                              Atual
                            </Badge>
                          )}
                        </div>
                        
                        {/* Ações */}
                        {canEdit && (onEditStatus || onDeleteStatus) && (
                          <div className="flex gap-1">
                            {onEditStatus && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEditStatus(status)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar status</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {onDeleteStatus && !status.is_current && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDeleteStatus(status)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remover status</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Informações do período */}
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(status.effective_date)}
                            {status.end_date && ` - ${formatDate(status.end_date)}`}
                            {status.is_current && ' - Atual'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {calculateDuration(status.effective_date, status.end_date)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Informações adicionais */}
                      {(status.reason || status.changed_by_name) && (
                        <div className="mt-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(status.id)}
                            className="h-auto p-1 text-blue-600 hover:text-blue-800"
                          >
                            {expandedItems.has(status.id) ? 'Ocultar detalhes' : 'Ver detalhes'}
                          </Button>
                          
                          {expandedItems.has(status.id) && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                              {status.reason && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Observações
                                  </label>
                                  <p className="text-gray-700 whitespace-pre-wrap">{status.reason}</p>
                                </div>
                              )}
                              
                              {status.changed_by_name && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Alterado por
                                  </label>
                                  <p className="text-gray-700">{status.changed_by_name}</p>
                                </div>
                              )}
                              
                              <div>
                                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Data de registro
                                </label>
                                <p className="text-gray-700">{formatDateTime(status.created_at)}</p>
                              </div>
                              
                              {status.migrated_from_member && (
                                <div className="pt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Migrado do sistema antigo
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};