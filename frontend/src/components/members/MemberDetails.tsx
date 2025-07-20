import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, Heart, Briefcase, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Member } from '@/services/membersService';
import { useAuth } from '@/hooks/useAuth';

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
                {getStatusBadge(member.membership_status, member.membership_status_display)}
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
                <span>Desde {formatDate(member.membership_date)}</span>
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
                      {getStatusBadge(member.membership_status, member.membership_status_display)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Membresia</label>
                    <p className="text-gray-900">{formatDate(member.membership_date)}</p>
                  </div>
                  
                  {member.conversion_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Conversão</label>
                      <p className="text-gray-900">{formatDate(member.conversion_date)}</p>
                    </div>
                  )}
                  
                  {member.baptism_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data do Batismo</label>
                      <p className="text-gray-900">{formatDate(member.baptism_date)}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Função Ministerial</label>
                    <p className="text-gray-900 capitalize">{member.ministerial_function}</p>
                  </div>
                  
                  {member.ordination_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Ordenação</label>
                      <p className="text-gray-900">{formatDate(member.ordination_date)}</p>
                    </div>
                  )}
                  
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
        </TabsContent>

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
        </TabsContent>
      </Tabs>
    </div>
  );
}; 