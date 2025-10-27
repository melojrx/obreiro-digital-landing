import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  UserPlus, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  User,
  Heart,
  BookOpen,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatFollowUpStatus, formatMaritalStatus, type Visitor } from '@/services/visitorsService';

interface VisitorDetailsProps {
  visitor: Visitor;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onConvertToMember: (payload?: { conversion_notes?: string; birth_date?: string; phone?: string }) => void;
  onUpdateFollowUp: (status: string, notes?: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  canConvert: boolean;
}

export const VisitorDetails: React.FC<VisitorDetailsProps> = ({
  visitor,
  onEdit,
  onDelete,
  onBack,
  onConvertToMember,
  onUpdateFollowUp,
  canEdit,
  canDelete,
  canConvert,
}) => {
  const [conversionNotes, setConversionNotes] = useState('');
  const [convertPhone, setConvertPhone] = useState('');
  const [convertBirthDate, setConvertBirthDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [isUpdatingFollowUp, setIsUpdatingFollowUp] = useState(false);

  // Helpers de formatação/validação de telefone (Brasil)
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return numbers.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  const phoneRequired = !visitor.phone;
  const phoneValid = !phoneRequired || (convertPhone && phoneRegex.test(convertPhone));
  const birthRequired = !visitor.birth_date;
  const birthValid = !birthRequired || !!convertBirthDate;

  const handleConvert = () => {
    const payload: { conversion_notes?: string; birth_date?: string; phone?: string } = {
      conversion_notes: conversionNotes || ''
    };
    if (!visitor.phone && convertPhone) payload.phone = convertPhone;
    if (!visitor.birth_date && convertBirthDate) payload.birth_date = convertBirthDate;
    onConvertToMember(payload);
    setShowConvertDialog(false);
    setConversionNotes('');
    setConvertPhone('');
    setConvertBirthDate('');
  };

  const handleFollowUp = async () => {
    if (!selectedStatus || isUpdatingFollowUp) return;
    
    try {
      setIsUpdatingFollowUp(true);
      await onUpdateFollowUp(selectedStatus, followUpNotes);
      setShowFollowUpDialog(false);
      setFollowUpNotes('');
      setSelectedStatus('');
    } catch (error) {
      console.error('Erro no follow-up:', error);
    } finally {
      setIsUpdatingFollowUp(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{visitor.full_name}</h1>
            <p className="text-gray-600">
              {visitor.branch_name} • {visitor.church_name}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {!visitor.converted_to_member && canConvert && (
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Converter em Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Converter Visitante em Membro</DialogTitle>
                  <DialogDescription>
                    Converter {visitor.full_name} em membro da igreja.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!visitor.phone && (
                    <div>
                      <Label htmlFor="convert-phone">Telefone do membro (obrigatório)</Label>
                      <input
                        id="convert-phone"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="(00) 00000-0000"
                        value={convertPhone}
                        onChange={(e) => setConvertPhone(formatPhone(e.target.value))}
                      />
                      {!phoneValid && (
                        <p className="mt-1 text-xs text-red-600">Formato inválido. Ex: (85) 98765-4321</p>
                      )}
                    </div>
                  )}
                  {!visitor.birth_date && (
                    <div>
                      <Label htmlFor="convert-birth">Data de Nascimento (obrigatória)</Label>
                      <input
                        id="convert-birth"
                        type="date"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        max={new Date().toISOString().split('T')[0]}
                        value={convertBirthDate}
                        onChange={(e) => setConvertBirthDate(e.target.value)}
                      />
                      {!birthValid && (
                        <p className="mt-1 text-xs text-red-600">Informe a data de nascimento.</p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="conversion-notes">Notas da conversão (opcional)</Label>
                    <Textarea
                      id="conversion-notes"
                      placeholder="Adicione observações sobre a conversão..."
                      value={conversionNotes}
                      onChange={(e) => setConversionNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConvert();
                    }} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={(!phoneValid) || (!birthValid)}
                  >
                    Converter em Membro
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Atualizar Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Follow-up</DialogTitle>
                <DialogDescription>
                  Atualize o status de follow-up de {visitor.full_name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Novo Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="contacted">Contatado</SelectItem>
                      <SelectItem value="interested">Interessado</SelectItem>
                      <SelectItem value="not_interested">Não Interessado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="followup-notes">Notas do contato (opcional)</Label>
                  <Textarea
                    id="followup-notes"
                    placeholder="Adicione observações sobre o follow-up..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFollowUp();
                  }} 
                  disabled={!selectedStatus || isUpdatingFollowUp}
                >
                  {isUpdatingFollowUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Follow-up'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}

          {canDelete && (
            <Button variant="outline" onClick={onDelete} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">E-mail</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{visitor.email}</span>
                  </div>
                </div>

                {visitor.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{visitor.phone}</span>
                    </div>
                  </div>
                )}

                {visitor.birth_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(visitor.birth_date)} ({visitor.age} anos)</span>
                    </div>
                  </div>
                )}

                {visitor.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gênero</label>
                    <p className="mt-1">{visitor.gender === 'M' ? 'Masculino' : 'Feminino'}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Estado Civil</label>
                  <p className="mt-1">{formatMaritalStatus(visitor.marital_status)}</p>
                </div>

                {visitor.cpf && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">CPF</label>
                    <p className="mt-1">{visitor.cpf}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Endereço</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visitor.address && <p>{visitor.address}</p>}
                {visitor.neighborhood && <p>Bairro: {visitor.neighborhood}</p>}
                <p>{visitor.city}/{visitor.state}</p>
                {visitor.zipcode && <p>CEP: {visitor.zipcode}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Informações eclesiásticas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Eclesiásticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {visitor.first_visit && (
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    Primeira visita
                  </Badge>
                )}
                {visitor.wants_prayer && (
                  <Badge variant="secondary">
                    <Heart className="h-3 w-3 mr-1" />
                    Quer oração
                  </Badge>
                )}
                {visitor.wants_growth_group && (
                  <Badge variant="secondary">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Interesse em grupo de crescimento
                  </Badge>
                )}
              </div>

              {visitor.ministry_interest && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Interesse em Ministérios</label>
                  <p className="mt-1 text-gray-700">{visitor.ministry_interest}</p>
                </div>
              )}

              {visitor.observations && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Observações</label>
                  <p className="mt-1 text-gray-700">{visitor.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status de conversão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Conversão</label>
                <div className="flex items-center space-x-2 mt-1">
                  {visitor.converted_to_member ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Convertido em membro</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Ainda não convertido</span>
                    </>
                  )}
                </div>
                {visitor.conversion_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    Convertido em: {formatDateTime(visitor.conversion_date)}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-gray-500">Follow-up</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(visitor.follow_up_status)}>
                    {formatFollowUpStatus(visitor.follow_up_status)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>Tentativas de contato: {visitor.contact_attempts}</p>
                  {visitor.last_contact_date && (
                    <p>Último contato: {formatDateTime(visitor.last_contact_date)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de registro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fonte do cadastro</label>
                <p className="mt-1 capitalize">
                  {((visitor.registration_source || 'indefinido') + '').replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Data de registro</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatDateTime(visitor.created_at)}</span>
                </div>
              </div>

              {visitor.qr_code_used && (
                <div>
                  <label className="text-sm font-medium text-gray-500">QR Code utilizado</label>
                  <p className="mt-1 text-xs font-mono bg-gray-100 p-2 rounded">
                    {visitor.qr_code_used}
                  </p>
                </div>
              )}

              {visitor.ip_address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">IP de registro</label>
                  <p className="mt-1 text-sm">{visitor.ip_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas de conversão/follow-up */}
          {(visitor.conversion_notes || visitor.follow_up_status !== 'pending') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                {visitor.conversion_notes && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-500">Notas de conversão</label>
                    <p className="mt-1 text-gray-700">{visitor.conversion_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
