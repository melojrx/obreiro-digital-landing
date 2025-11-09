import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Eye, UserCheck, Heart, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatMaritalStatus, formatFollowUpStatus, type Visitor } from '@/services/visitorsService';

interface VisitorsTableProps {
  visitors: Visitor[];
  onDelete?: (visitor: Visitor) => void;
}

export const VisitorsTable: React.FC<VisitorsTableProps> = ({ visitors, onDelete }) => {
  const navigate = useNavigate();

  const handleView = (visitor: Visitor) => {
    navigate(`/visitantes/${visitor.id}`);
  };

  const handleConvert = (visitor: Visitor) => {
    // Navega para a página de detalhes onde o modal de conversão está disponível
    navigate(`/visitantes/${visitor.id}`, { state: { openConvertModal: true } });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string, converted: boolean): string => {
    if (converted) return 'default';
    
    switch (status) {
      case 'pending': return 'secondary';
      case 'contacted': return 'outline';
      case 'interested': return 'default';
      case 'not_interested': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string, converted: boolean) => {
    if (converted) return <UserCheck className="h-3 w-3" />;
    if (status === 'pending') return <Heart className="h-3 w-3" />;
    return null;
  };

  if (visitors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum visitante encontrado</p>
      </div>
    );
  }

  return (
    <>
      {/* Layout Desktop / Tablet (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="min-w-[170px]">Contato</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="whitespace-nowrap">Data Registro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interesses</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.map((visitor) => (
              <TableRow key={visitor.id} className="hover:bg-gray-50">
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(visitor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium truncate max-w-[180px]" title={visitor.full_name}>{visitor.full_name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                      {visitor.age && <span>{visitor.age} anos</span>}
                      {visitor.gender && (
                        <>
                          <span>•</span>
                          <span>{visitor.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                        </>
                      )}
                      {visitor.marital_status && (
                        <>
                          <span>•</span>
                          <span>{formatMaritalStatus(visitor.marital_status)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {visitor.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[150px]" title={visitor.email}>{visitor.email}</span>
                      </div>
                    )}
                    {visitor.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{visitor.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>{visitor.city}/{visitor.state}</span>
                  </div>
                  {visitor.branch_name && (
                    <p className="text-xs text-gray-500 mt-1">{visitor.branch_name}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{formatDate(visitor.created_at)}</p>
                    {visitor.first_visit && (
                      <Badge variant="outline" className="text-xs mt-1">
                        1ª visita
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusColor(visitor.follow_up_status, visitor.converted_to_member)}
                    className="gap-1"
                  >
                    {getStatusIcon(visitor.follow_up_status, visitor.converted_to_member)}
                    {visitor.converted_to_member 
                      ? 'Membro' 
                      : formatFollowUpStatus(visitor.follow_up_status)
                    }
                  </Badge>
                  {visitor.contact_attempts > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {visitor.contact_attempts} contato{visitor.contact_attempts > 1 ? 's' : ''}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {visitor.wants_prayer && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Heart className="h-3 w-3 mr-1" />
                        Oração
                      </Badge>
                    )}
                    {visitor.wants_growth_group && (
                      <Badge variant="secondary" className="text-[10px]">
                        Grupo
                      </Badge>
                    )}
                    {visitor.ministry_interest && (
                      <Badge variant="outline" className="text-[10px]">
                        Ministério
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(visitor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      {!visitor.converted_to_member && (
                        <DropdownMenuItem onClick={() => handleConvert(visitor)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Converter em Membro
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(visitor)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Layout Mobile (< md) */}
      <div className="md:hidden space-y-3">
        {visitors.map(visitor => (
            <div
              key={visitor.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    {getInitials(visitor.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate" title={visitor.full_name}>{visitor.full_name}</p>
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500">
                        {visitor.age && <span>{visitor.age}a</span>}
                        {visitor.gender && <span>{visitor.gender === 'M' ? 'Masculino' : 'Feminino'}</span>}
                        {visitor.marital_status && <span>{formatMaritalStatus(visitor.marital_status)}</span>}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(visitor.follow_up_status, visitor.converted_to_member)} className="shrink-0 text-[10px] px-2 py-0.5">
                      {visitor.converted_to_member ? 'Membro' : formatFollowUpStatus(visitor.follow_up_status)}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{visitor.city}/{visitor.state}</span>
                    </div>
                    {visitor.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate" title={visitor.email}>{visitor.email}</span>
                      </div>
                    )}
                    {visitor.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{visitor.phone}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {visitor.first_visit && (
                        <Badge variant="outline" className="text-[10px]">1ª visita</Badge>
                      )}
                      {visitor.wants_prayer && (
                        <Badge variant="secondary" className="text-[10px] flex items-center gap-1"><Heart className="h-3 w-3" /> Oração</Badge>
                      )}
                      {visitor.wants_growth_group && (
                        <Badge variant="secondary" className="text-[10px]">Grupo</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(visitor.created_at)}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => handleView(visitor)}>Ver</Button>
                    {!visitor.converted_to_member && (
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => handleConvert(visitor)}>Converter</Button>
                    )}
                    {onDelete && (
                      <Button size="sm" variant="destructive" className="h-7 px-2 text-[11px]" onClick={() => onDelete(visitor)}>Excluir</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>
    </>
  );
};