import React from 'react';
import { Eye, Edit, Trash2, Phone, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Member } from '@/services/membersService';
import { usePermissions } from '@/hooks/usePermissions';

interface MembersTableProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const permissions = usePermissions();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      transferred: 'outline',
      deceased: 'destructive',
    };

    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      transferred: 'Transferido',
      deceased: 'Falecido',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {labels[status] || status}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleView = (member: Member) => {
    navigate(`/membros/${member.id}`);
  };

  const handleEdit = (member: Member) => {
    navigate(`/membros/${member.id}/editar`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro encontrado</h3>
        <p className="text-gray-500">Não há membros cadastrados ou que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Membro desde</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className="hover:bg-gray-50">
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.photo} alt={member.full_name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{member.full_name}</div>
                  {member.birth_date && (
                    <div className="text-sm text-gray-500">
                      {new Date().getFullYear() - new Date(member.birth_date).getFullYear()} anos
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {member.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-3 w-3 mr-1" />
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-1" />
                      {member.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 capitalize">
                    {member.current_ministerial_function?.status_display || member.ministerial_function || 'Membro'}
                  </span>
                  {member.membership_statuses && member.membership_statuses.length > 1 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <Info className="h-3 w-3 text-gray-400" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Histórico de Status Ministerial</h4>
                          <div className="space-y-2">
                            {member.membership_statuses.slice(0, 3).map((status, index) => (
                              <div key={status.id} className="flex justify-between items-center text-xs">
                                <span className={index === 0 ? 'font-medium' : 'text-gray-600'}>
                                  {status.status_display}
                                  {index === 0 && ' (Atual)'}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(status.effective_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            ))}
                            {member.membership_statuses.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{member.membership_statuses.length - 3} mais...
                              </div>
                            )}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(member.membership_status)}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {formatDate(member.membership_date)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleView(member)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    {permissions.canEditMembers && (
                      <DropdownMenuItem onClick={() => handleEdit(member)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {permissions.canDeleteMembers && onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(member)}
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
  );
}; 