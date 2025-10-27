import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar,
  User,
  MoreHorizontal,
  UserX
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { churchService } from '@/services/churchService';
import { Member as SimpleMember } from '@/types/member';
import { membersService, type Member as FullMember } from '@/services/membersService';
import TransferMemberModal from '@/components/members/TransferMemberModal';
import { usePermissions } from '@/hooks/usePermissions';

interface ChurchMembersCardProps {
  churchId: number;
}

const ChurchMembersCard: React.FC<ChurchMembersCardProps> = ({ churchId }) => {
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<SimpleMember[]>([]);
  const [transferMember, setTransferMember] = useState<FullMember | null>(null);
  const permissions = usePermissions();

  useEffect(() => {
    loadMembers();
  }, [churchId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm))
      );
      setFilteredMembers(filtered);
    }
  }, [members, searchTerm]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const response = await churchService.getChurchMembers(churchId);
      setMembers(response.results || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTransfer = async (memberId: number) => {
    try {
      const full = await membersService.getMember(memberId);
      setTransferMember(full);
    } catch (err) {
      console.error('Erro ao carregar dados do membro para transferência:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMinisterialFunctionBadge = (func: string) => {
    const labels: Record<string, string> = {
      'member': 'Membro',
      'leader': 'Líder',
      'pastor': 'Pastor',
      'elder': 'Presbítero',
      'deacon': 'Diácono',
      'deaconess': 'Diaconisa'
    };

    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'pastor': 'default',
      'elder': 'default',
      'leader': 'secondary',
      'deacon': 'secondary',
      'deaconess': 'secondary',
      'member': 'outline'
    };

    return (
      <Badge variant={variants[func] || 'outline'}>
        {labels[func] || func}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum membro encontrado
        </h3>
        <p className="text-gray-600 mb-4">
          Esta igreja ainda não possui membros cadastrados.
        </p>
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          Adicionar Primeiro Membro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar membros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          Ver Todos
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMembers.slice(0, 10).map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Avatar>
              <AvatarImage src={member.photo} />
              <AvatarFallback>
                {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {member.full_name}
                </h4>
                {member.ministerial_function && (
                  getMinisterialFunctionBadge(member.ministerial_function)
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {member.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              {member.membership_date && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Membro desde {formatDate(member.membership_date)}</span>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(permissions.canManageMembers || permissions.canManageChurch) && (
                  <DropdownMenuItem onClick={() => handleOpenTransfer(member.id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Transferir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-sm text-gray-600">
          {filteredMembers.length === members.length 
            ? `${members.length} membros total`
            : `${filteredMembers.length} de ${members.length} membros`
          }
        </span>
        
        {members.length > 10 && (
          <Button variant="outline" size="sm">
            Ver Todos os Membros
          </Button>
        )}
      </div>
      {/* Modal de Transferência */}
      <TransferMemberModal
        isOpen={!!transferMember}
        member={transferMember}
        onClose={() => setTransferMember(null)}
        onTransferred={async () => {
          await loadMembers();
        }}
      />
    </div>
  );
};

export default ChurchMembersCard;
