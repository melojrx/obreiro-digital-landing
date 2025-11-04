import React from 'react';
import { Eye, Edit, Trash2, Phone, Mail, Info, MoveRight as MoveRightIcon, Shield } from 'lucide-react';
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
import { Member, MINISTERIAL_FUNCTION_CHOICES } from '@/services/membersService';
import { usePermissions } from '@/hooks/usePermissions';
import TransferMemberModal from '@/components/members/TransferMemberModal';

interface MembersTableProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  onTransferSuccess?: (member: Member) => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  onEdit,
  onDelete,
  onTransferSuccess,
}) => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [transferMember, setTransferMember] = React.useState<Member | null>(null);

  const getMinisterialFunctionDisplay = (ministerialFunction: string) => {
    return MINISTERIAL_FUNCTION_CHOICES[ministerialFunction as keyof typeof MINISTERIAL_FUNCTION_CHOICES] || 'Membro';
  };

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

  const canTransfer = permissions.canManageMembers || permissions.canManageChurch;

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
    <div className="space-y-4">
      {/* Layout Desktop (md+) */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Congregação</TableHead>
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
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {member.full_name}
                    {(member.has_system_access || member.user) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1" title="Usuário com acesso ao sistema">
                        <Shield className="h-3 w-3 text-green-600" />
                        Acesso
                      </Badge>
                    )}
                  </div>
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
                <span className="text-sm text-gray-900">{member.branch_name || '—'}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 capitalize">
                    {getMinisterialFunctionDisplay(member.ministerial_function)}
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
                <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-xs">
                  {member.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
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
                    {canTransfer && (
                      <DropdownMenuItem onClick={() => setTransferMember(member)}>
                        <MoveRightIcon className="mr-2 h-4 w-4" />
                        Transferir
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
      </div>

      {/* Layout Mobile (< md) */}
      <div className="md:hidden space-y-3">
        {members.map((member) => (
          <div key={member.id} className="bg-white border rounded-lg p-4 space-y-3">
            {/* Header do Card */}
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.photo} alt={member.full_name} />
                    <AvatarFallback className="text-sm">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    {member.full_name}
                    {(member.has_system_access || member.user) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1" title="Usuário com acesso ao sistema">
                        <Shield className="h-3 w-3 text-green-600" />
                        Acesso
                      </Badge>
                    )}
                  </h4>
                  {member.birth_date && (
                    <p className="text-sm text-gray-500">
                      {new Date().getFullYear() - new Date(member.birth_date).getFullYear()} anos
                    </p>
                  )}
                </div>
              </div>
              
              {/* Actions Menu Mobile */}
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
                  {canTransfer && (
                    <DropdownMenuItem onClick={() => setTransferMember(member)}>
                      <MoveRightIcon className="mr-2 h-4 w-4" />
                      Transferir
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
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Contato:</span>
                <div className="space-y-1 mt-1">
                  {member.email && (
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center text-gray-900">
                      <Phone className="h-3 w-3 mr-1" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500 block">Congregação:</span>
                <div className="mt-1 text-gray-900">
                  {member.branch_name || '—'}
                </div>
              </div>

              <div>
                <span className="text-gray-500 block">Função:</span>
                <div className="mt-1">
                  <span className="text-gray-900 capitalize text-sm">
                    {getMinisterialFunctionDisplay(member.ministerial_function)}
                  </span>
                  {member.membership_statuses && member.membership_statuses.length > 1 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1">
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
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-xs">
                  {member.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <span className="text-xs text-gray-500">
                  desde {formatDate(member.membership_date)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal de Transferência */}
      <TransferMemberModal
        isOpen={!!transferMember}
        member={transferMember}
        onClose={() => setTransferMember(null)}
        onTransferred={(m) => {
          onTransferSuccess?.(m);
        }}
      />
    </div>
  );
};
