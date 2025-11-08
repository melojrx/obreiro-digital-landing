import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, Heart, Briefcase, Shield, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Member, MINISTERIAL_FUNCTION_CHOICES, MEMBERSHIP_STATUS_CHOICES } from '@/services/membersService';
import { useAuth } from '@/hooks/useAuth';
import { MinisterialFunctionTimeline } from './MinisterialFunctionTimeline';
import { MembershipStatusLogTimeline } from './MembershipStatusLogTimeline';
import { ministerialFunctionHistoryService, membershipStatusLogService, type MinisterialFunctionHistoryItem, type MembershipStatusLogResponse } from '@/services/memberHistoryService';
import { useToast } from '@/hooks/use-toast';

interface MemberDetailsProps {
  member: Member;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const MemberDetails: React.FC<MemberDetailsProps> = ({
  member,
  onEdit,
  onDelete,
  onBack,
  canEdit = false,
  canDelete = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const getMinisterialFunctionDisplay = (func: string) => {
    return MINISTERIAL_FUNCTION_CHOICES[func as keyof typeof MINISTERIAL_FUNCTION_CHOICES] || func;
  };

  const getMembershipStatusDisplay = (status: string) => {
    return MEMBERSHIP_STATUS_CHOICES[status as keyof typeof MEMBERSHIP_STATUS_CHOICES] || status;
  };
  // Histórico antigo removido (aba "Ministerial")
  const [ministerialHistory, setMinisterialHistory] = useState<MinisterialFunctionHistoryItem[]>([]);
  const [isLoadingMinisterialHistory, setIsLoadingMinisterialHistory] = useState(false);
  const [statusLog, setStatusLog] = useState<MembershipStatusLogResponse | null>(null);
  const [isLoadingStatusLog, setIsLoadingStatusLog] = useState(false);

  // Formatar status para exibição
  const getStatusBadge = (status: string, display: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      transferred: 'outline',
      deceased: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-sm">
        {display}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const roleLabel = (role?: string | null) => {
    if (!role) return 'Não disponível';
    if (role === 'church_admin') return 'Administrador da Igreja (Nível 2)';
    if (role === 'secretary') return 'Secretário(a) (Nível 1)';
    if (role === 'denomination_admin') return 'Administrador da Denominação (Nível 3)';
    return role;
  };

  // Handlers antigos removidos

  // Submit antigo removido

  // Carregar históricos (função ministerial e status de membresia) ao montar
  useEffect(() => {
    if (!member.id) return;

    // Histórico de função ministerial
    const loadMinisterial = async () => {
      setIsLoadingMinisterialHistory(true);
      try {
        const items = await ministerialFunctionHistoryService.listByMember(member.id);
        setMinisterialHistory(items);
      } catch (error) {
        console.error('Erro ao carregar histórico de função ministerial:', error);
      } finally {
        setIsLoadingMinisterialHistory(false);
      }
    };

    // Histórico de status de membresia (auditoria)
    const loadStatusLog = async () => {
      setIsLoadingStatusLog(true);
      try {
        const data = await membershipStatusLogService.getMemberStatusLog(member.id);
        setStatusLog(data);
      } catch (error) {
        console.error('Erro ao carregar histórico de status de membresia:', error);
      } finally {
        setIsLoadingStatusLog(false);
      }
    };

    loadMinisterial();
    loadStatusLog();
  }, [member.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Membro</h1>
            <p className="text-gray-600 mt-1">
              Informações completas e histórico
            </p>
          </div>
        </div>
        
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Perfil Principal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={member.photo} alt={member.full_name} />
              <AvatarFallback className="text-lg">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{member.full_name}</h2>
                <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-sm">
                  {member.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{calculateAge(member.birth_date)} anos</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <span>Membro há {member.membership_years} anos</span>
                <span className="mx-2">•</span>
                <span>Na congregação desde {formatDate(member.membership_start_date || member.membership_date)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Informações */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Pessoais
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="church" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Eclesiásticos
          </TabsTrigger>
          {/* Aba Ministerial removida */}
          <TabsTrigger value="additional" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Adicionais
          </TabsTrigger>
        </TabsList>

        {/* Dados Pessoais */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                    <p className="text-gray-900">{member.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                    <p className="text-gray-900">{formatDate(member.birth_date)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gênero</label>
                    <p className="text-gray-900">
                      {member.gender === 'M' ? 'Masculino' : 'Feminino'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {member.cpf && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">CPF</label>
                      <p className="text-gray-900">{member.cpf}</p>
                    </div>
                  )}
                  
                  {member.rg && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">RG</label>
                      <p className="text-gray-900">{member.rg}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado Civil</label>
                    <p className="text-gray-900">
                      {member.marital_status === 'single' ? 'Solteiro(a)' :
                       member.marital_status === 'married' ? 'Casado(a)' :
                       member.marital_status === 'divorced' ? 'Divorciado(a)' :
                       member.marital_status === 'widowed' ? 'Viúvo(a)' : 'Outro'}
                    </p>
                  </div>
                  
                  {/* Informações do Cônjuge */}
                  {member.marital_status === 'married' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cônjuge</label>
                      <div className="text-gray-900 space-y-1">
                        <p>{member.spouse_name || 'Cônjuge não informado'}</p>
                        {member.spouse ? (
                          <Badge variant="secondary" className="text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            Membro da Igreja
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            Não é membro
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Informações Familiares */}
                  {(member.children_count !== null && member.children_count !== undefined) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quantidade de Filhos</label>
                      <p className="text-gray-900">
                        {member.children_count === 0 ? 'Nenhum filho' : 
                         member.children_count === 1 ? '1 filho' : 
                         `${member.children_count} filhos`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contato */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Contatos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {member.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">E-mail</label>
                        <p className="text-gray-900">{member.email}</p>
                      </div>
                    )}
                    
                    {member.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefone Principal</label>
                        <p className="text-gray-900">{member.phone}</p>
                      </div>
                    )}
                    
                    {member.phone_secondary && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefone Secundário</label>
                        <p className="text-gray-900">{member.phone_secondary}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Preferências de Contato</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {member.accept_email && <Badge variant="outline">E-mail</Badge>}
                        {member.accept_sms && <Badge variant="outline">SMS</Badge>}
                        {member.accept_whatsapp && <Badge variant="outline">WhatsApp</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Endereço */}
                {member.full_address && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {member.address && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Logradouro</label>
                            <p className="text-gray-900">{member.address}</p>
                          </div>
                        )}
                        
                        {member.number && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Número</label>
                            <p className="text-gray-900">{member.number}</p>
                          </div>
                        )}
                        
                        {member.complement && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Complemento</label>
                            <p className="text-gray-900">{member.complement}</p>
                          </div>
                        )}
                        
                        {member.neighborhood && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Bairro</label>
                            <p className="text-gray-900">{member.neighborhood}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {member.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Cidade</label>
                            <p className="text-gray-900">{member.city} - {member.state}</p>
                          </div>
                        )}
                        
                        {member.zipcode && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">CEP</label>
                            <p className="text-gray-900">{member.zipcode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados Eclesiásticos */}
        <TabsContent value="church" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Vida Espiritual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status de Membresia</label>
                    <div className="mt-1">
                      <Badge 
                        variant={
                          member.membership_status === 'active' ? 'default' : 
                          member.membership_status === 'inactive' ? 'secondary' : 
                          member.membership_status === 'deceased' ? 'destructive' : 
                          'outline'
                        } 
                        className="text-sm"
                      >
                        {getMembershipStatusDisplay(member.membership_status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Entrada na Congregação</label>
                    <p className="text-gray-900">
                      {formatDate(member.membership_start_date || member.membership_date)}
                    </p>
                    {member.first_membership_date && member.membership_start_date !== member.first_membership_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Primeira membresia: {formatDate(member.first_membership_date)}
                      </p>
                    )}
                  </div>
                  
                  
                  {/* Data do Batismo removida da exibição */}
                  
                  {/* Data de Conversão removida */}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Função Ministerial</label>
                    <p className="text-gray-900 capitalize">
                      {getMinisterialFunctionDisplay(member.ministerial_function)}
                    </p>
                  </div>
                  
                  {/* Data de Ordenação removida */}
                  
                  {member.previous_church && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Igreja Anterior</label>
                      <p className="text-gray-900">{member.previous_church}</p>
                    </div>
                  )}
                  
                  {member.transfer_letter && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Carta de Transferência</label>
                      <Badge variant="outline" className="mt-1">Possui carta</Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Função Ministerial */}
          <MinisterialFunctionTimeline
            items={ministerialHistory}
            memberName={member.full_name}
            isLoading={isLoadingMinisterialHistory}
          />

          {/* Histórico de Status de Membresia (auditoria) */}
          <MembershipStatusLogTimeline
            data={statusLog}
            isLoading={isLoadingStatusLog}
            memberName={member.full_name}
            membershipDate={member.membership_date}
          />
        </TabsContent>

        {/* Aba Ministerial removida: histórico agora em Eclesiásticos */}

        {/* Informações Adicionais */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informações Complementares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {member.profession && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Profissão</label>
                      <p className="text-gray-900">{member.profession}</p>
                    </div>
                  )}
                  
                  {member.education_level && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Escolaridade</label>
                      <p className="text-gray-900">
                        {member.education_level === 'elementary_incomplete' ? 'Fundamental Incompleto' :
                         member.education_level === 'elementary_complete' ? 'Fundamental Completo' :
                         member.education_level === 'high_school_incomplete' ? 'Médio Incompleto' :
                         member.education_level === 'high_school_complete' ? 'Médio Completo' :
                         member.education_level === 'higher_incomplete' ? 'Superior Incompleto' :
                         member.education_level === 'higher_complete' ? 'Superior Completo' :
                         member.education_level === 'postgraduate' ? 'Pós-graduação' :
                         member.education_level === 'masters' ? 'Mestrado' :
                         member.education_level === 'doctorate' ? 'Doutorado' : 'Não informado'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cadastrado em</label>
                    <p className="text-gray-900">{formatDate(member.created_at)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Última atualização</label>
                    <p className="text-gray-900">{formatDate(member.updated_at)}</p>
                  </div>
                </div>
              </div>
              
              {member.notes && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-500">Observações</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{member.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(member.has_system_access || member.user) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Acesso ao Sistema
                </CardTitle>
                <CardDescription>
                  Informações sobre o acesso deste membro à plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-gray-900">Ativo</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Papel no Sistema</label>
                      <p className="text-gray-900">{member.system_user_role_label || roleLabel(member.system_user_role)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">E-mail de Acesso</label>
                      <p className="text-gray-900">{member.system_user_email || 'Não disponível'}</p>
                    </div>
                    <div className="pt-1">
                      <Button variant="outline" onClick={onEdit}>
                        Gerenciar acesso (Editar)
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Modal para adicionar/editar status ministerial */}
      {/* Modal removido */}
    </div>
  );
}; 
