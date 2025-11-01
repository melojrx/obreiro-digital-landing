import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';
import { 
  User, 
  Phone, 
  Heart, 
  Briefcase, 
  Save, 
  X, 
  MapPin,
  Shield,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  CreateMemberData, 
  Member, 
  membersService,
  MINISTERIAL_FUNCTION_CHOICES,
  MEMBERSHIP_STATUS_CHOICES
} from '@/services/membersService';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';
import { usePermissions } from '@/hooks/usePermissions';

// Schema de validação
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

const memberSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['M', 'F'], { required_error: 'Selecione o gênero' }),
  marital_status: z.string().optional(),
  
    // Campo de igreja
    church_id: z.number().min(1, 'Selecione uma igreja'),
  
  // Campos do cônjuge
  spouse: z.string().optional(),
  
  // Dados familiares
  children_count: z.number().min(0, 'Quantidade de filhos deve ser 0 ou maior').optional(),
  
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().min(1, 'Telefone é obrigatório').refine(
    (val) => phoneRegex.test(val),
    { message: 'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }
  ),
  phone_secondary: z.string().optional().refine(
    (val) => !val || val === '' || phoneRegex.test(val),
    { message: 'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }
  ),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional().refine(
    (val) => !val || val === '' || /^\d{5}-?\d{3}$/.test(val),
    { message: 'CEP deve estar no formato XXXXX-XXX' }
  ),
  // baptism_date removido do cadastro
  previous_church: z.string().optional(),
  transfer_letter: z.boolean().optional(),
  
  // Campos ministeriais
  membership_status: z.string().optional(),
  ministerial_function: z.string().optional(),
  
  profession: z.string().optional(),
  education_level: z.string().optional(),
  notes: z.string().optional(),
  accept_sms: z.boolean().optional(),
  accept_email: z.boolean().optional(),
  accept_whatsapp: z.boolean().optional(),
  // Campos de papel do sistema
  create_system_user: z.boolean().optional(),
  system_role: z.string().optional(),
  user_email: z.string().optional(),
  user_password: z.string().optional(),
  
}).refine((data) => {
  // Validação condicional para criação de usuário do sistema
  if (data.create_system_user) {
    if (!data.system_role) {
      return false;
    }
    if (!data.user_email || data.user_email === '') {
      return false;
    }
    if (!data.user_password || data.user_password === '' || data.user_password.length < 8) {
      return false;
    }
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.user_email)) {
      return false;
    }
  }
  return true;
}, {
  message: "Quando 'Criar usuário do sistema' estiver marcado, todos os campos de acesso são obrigatórios",
  path: ['create_system_user']
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: Member; // Para edição
  onSubmit: (data: CreateMemberData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
  title = 'Novo Membro',
}) => {
  const { user } = useAuth();
  const activeChurch = useCurrentActiveChurch();
  
  // Papéis do sistema (catálogo)
  // Papéis de acesso ao sistema (conforme documento de permissões)
  const roleCatalog = [
    { value: 'denomination_admin', label: 'Administrador da Denominação (Nível 3)', description: 'Administra múltiplas igrejas da denominação' },
    { value: 'church_admin', label: 'Administrador da Igreja (Nível 2)', description: 'Administra a igreja (Matriz e Filiais)' },
    { value: 'secretary', label: 'Secretário(a) (Nível 1)', description: 'Gestão de cadastros de Membros e Visitantes' },
  ] as const;

  // Regras de distribuição de papéis por quem está atribuindo
  const permissions = usePermissions();
  const allowedRoleCodes: string[] = React.useMemo(() => {
    // Denomination admin (gestão de denominações inteira)
    if (permissions.canManageDenominations) {
      return ['denomination_admin', 'church_admin', 'secretary'];
    }
    // Church admin/gestores de igreja
    if (permissions.isChurchAdmin || permissions.canManageChurches || permissions.canManageChurch) {
      return ['church_admin', 'secretary'];
    }
    // Secretaria
    if (permissions.isSecretary || (permissions.canManageMembers && !permissions.canManageChurch && !permissions.isChurchAdmin)) {
      return ['secretary'];
    }
    // Sem permissão
    return [];
  }, [permissions]);

  const availableRoles = React.useMemo(() => {
    return roleCatalog.filter(r => allowedRoleCodes.includes(r.value));
  }, [allowedRoleCodes]);

  const canAssignRoles = availableRoles.length > 0;
  const rolesLoading = false;
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const normalizedUserEmail = React.useMemo(() => (user?.email || '').trim().toLowerCase(), [user?.email]);
  const isEditingSelf = React.useMemo(() => {
    if (!user) return false;
    if (member?.user && member.user === user.id) {
      return true;
    }
    const systemEmail = (member?.system_user_email || '').trim().toLowerCase();
    if (systemEmail && normalizedUserEmail && systemEmail === normalizedUserEmail) {
      return true;
    }
    const memberEmail = (member?.email || '').trim().toLowerCase();
    if (memberEmail && normalizedUserEmail && memberEmail === normalizedUserEmail) {
      return true;
    }
    return false;
  }, [member?.email, member?.system_user_email, member?.user, normalizedUserEmail, user?.id]);
  const alreadyHasSystemAccess = React.useMemo(() => {
    if (member?.user) return true;
    if (member?.has_system_access) return true;
    const systemEmail = (member?.system_user_email || '').trim();
    return systemEmail.length > 0;
  }, [member?.has_system_access, member?.system_user_email, member?.user]);

  // Estado para igrejas disponíveis
  const [availableChurches, setAvailableChurches] = useState<Array<{
    id: number;
    name: string;
    city: string;
    state: string;
  }>>([]);
  const [churchesLoading, setChurchesLoading] = useState(false);
  
  // Estado para membros disponíveis para cônjuge
  const [availableSpouses, setAvailableSpouses] = useState<Array<{
    id: number;
    full_name: string;
    cpf?: string;
    birth_date: string;
    age: number;
    gender: string;
    membership_date: string;
  }>>([]);
  const [spousesLoading, setSpousesLoading] = useState(false);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: member?.full_name || '',
      cpf: member?.cpf || '',
      rg: member?.rg || '',
      birth_date: member?.birth_date || '',
      gender: (member?.gender === 'M' || member?.gender === 'F' ? member?.gender : 'M') as 'M' | 'F',
      marital_status: member?.marital_status || 'single',
      
      // Campos do cônjuge
      spouse:
        member?.marital_status === 'married'
          ? (member?.spouse ? String(member.spouse) : 'non-member')
          : '',
      
      // Dados familiares
      children_count: member?.children_count || undefined,
      
      email: member?.email || '',
      phone: member?.phone || '',
      phone_secondary: member?.phone_secondary || '',
      address: member?.address || '',
      number: member?.number || '',
      complement: member?.complement || '',
      neighborhood: member?.neighborhood || '',
      city: member?.city || '',
      state: member?.state || '',
      zipcode: member?.zipcode || '',
      // baptism_date removido do cadastro
      previous_church: member?.previous_church || '',
      transfer_letter: member?.transfer_letter || false,
      
      // Campos ministeriais
      membership_status: member?.membership_status || 'active',
      ministerial_function: member?.ministerial_function || 'member',
      
      profession: member?.profession || '',
      education_level: member?.education_level || '',
      notes: member?.notes || '',
      accept_sms: member?.accept_sms ?? true,
      accept_email: member?.accept_email ?? true,
      accept_whatsapp: member?.accept_whatsapp ?? true,
      // Campos de papel do sistema
      create_system_user: false,
      system_role: '',
      user_email: '',
      user_password: '',

      
      // Igreja
      church_id: member?.church_id || activeChurch?.id || 0,
      
    },
  });

  useEffect(() => {
    if (isEditingSelf || alreadyHasSystemAccess) {
      form.setValue('create_system_user', false, { shouldDirty: false, shouldValidate: false });
      form.setValue('system_role', '', { shouldDirty: false, shouldValidate: false });
      form.setValue('user_email', '', { shouldDirty: false, shouldValidate: false });
      form.setValue('user_password', '', { shouldDirty: false, shouldValidate: false });
    }
  }, [alreadyHasSystemAccess, form, isEditingSelf]);



  // Carregar igrejas disponíveis
  useEffect(() => {
    loadAvailableChurches();
  }, []);

  const loadAvailableChurches = async () => {
    try {
      setChurchesLoading(true);
      const { churchService } = await import('@/services/churchService');
      const response = await churchService.getManagedChurches();
      setAvailableChurches(response.results);
    } catch (error) {
      console.error('Erro ao carregar igrejas:', error);
      setAvailableChurches([]);
    } finally {
      setChurchesLoading(false);
    }
  };

  // Função para carregar membros disponíveis para cônjuge
  const maritalStatus = form.watch('marital_status');

  const loadAvailableSpouses = async () => {
    if (maritalStatus !== 'married') {
      setAvailableSpouses([]);
      return;
    }

    try {
      setSpousesLoading(true);
      const response = await membersService.getAvailableForSpouse({
        exclude_member_id: member?.id,
      });

      const results = [...response.results];

      if (
        member?.spouse &&
        !results.some((spouse) => spouse.id === member.spouse)
      ) {
        results.unshift({
          id: member.spouse,
          full_name: member.spouse_name || 'Membro vinculado',
          cpf: '',
          birth_date: '',
          age: 0,
          gender: '',
          membership_date: '',
        });
      }

      setAvailableSpouses(results);
    } catch (error) {
      console.error('Erro ao carregar membros disponíveis:', error);
      setAvailableSpouses([]);
    } finally {
      setSpousesLoading(false);
    }
  };

  useEffect(() => {
    if (maritalStatus === 'married') {
      loadAvailableSpouses();
    } else {
      setAvailableSpouses([]);
      form.setValue('spouse', '', { shouldDirty: false, shouldValidate: true });
    }
  }, [maritalStatus]);

  const handleSubmit = async (data: MemberFormData) => {
    try {
      console.log('🔍 MemberForm handleSubmit - activeChurch:', activeChurch);
      console.log('🔍 MemberForm handleSubmit - data recebida:', data);
      
      if (!activeChurch) {
        throw new Error('Igreja ativa não encontrada. Selecione uma igreja antes de cadastrar membros.');
      }
      
      // Determinar filial para associar o novo membro
      let branchId: number | undefined = activeChurch.active_branch?.id;
      if (!branchId && data.church_id) {
        try {
          const { branchService } = await import('@/services/branchService');
          const paginated = await branchService.getBranchesByChurch(data.church_id, 1, 50);
          const branches = paginated.results || [];
          const hq = branches.find((b: any) => b.is_headquarters);
          branchId = (hq?.id || branches[0]?.id) as number | undefined;
          console.log('🏷️ Branch selecionada para novo membro:', branchId);
        } catch (e) {
          console.warn('⚠️ Não foi possível carregar filiais para definir branch do membro. Prosseguindo sem branch.', e);
        }
      }

      // Normalizações para atender validadores do backend
      const normalizeZip = (value?: string) => {
        if (!value) return undefined;
        const digits = value.replace(/\D/g, '').slice(0, 8);
        if (digits.length !== 8) return value;
        return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
      };

      const normalizedPhone = formatPhone(data.phone || '');
      const normalizedPhoneSecondary = data.phone_secondary ? formatPhone(data.phone_secondary) : undefined;
      const normalizedZip = normalizeZip(data.zipcode || undefined);
      const normalizedState = (data.state || '').toUpperCase() || undefined;
      const spouseValue = data.spouse?.trim();
      const spouseId =
        spouseValue && spouseValue !== 'non-member'
          ? Number(spouseValue)
          : undefined;

      const mappedRole = data.system_role === 'denomination_admin' ? 'church_admin' : data.system_role;
      const formData: CreateMemberData = {
        church: data.church_id, // Usar igreja selecionada no formulário
        branch: branchId,
        full_name: data.full_name,
        birth_date: data.birth_date,
        gender: data.gender,
        cpf: data.cpf || undefined,
        rg: data.rg || undefined,
        marital_status: data.marital_status || undefined,
        
        // Campos do cônjuge
        spouse: Number.isFinite(spouseId) ? spouseId : undefined,
        
        // Dados familiares
        children_count: data.children_count || undefined,
        
        email: data.email || undefined,
        phone: normalizedPhone,
        phone_secondary: normalizedPhoneSecondary,
        address: data.address || undefined,
        number: data.number || undefined,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood || undefined,
        city: data.city || undefined,
        state: normalizedState,
        zipcode: normalizedZip,
        // baptism_date removido do payload
        previous_church: data.previous_church || undefined,
        transfer_letter: data.transfer_letter || undefined,
        profession: data.profession || undefined,
        education_level: data.education_level || undefined,
        notes: data.notes || undefined,
        // Campos ministeriais
        membership_status: data.membership_status || undefined,
        ministerial_function: data.ministerial_function || undefined,
        accept_sms: data.accept_sms,
        accept_email: data.accept_email,
        accept_whatsapp: data.accept_whatsapp,
        // Campos de papel do sistema (mapear denomination_admin -> church_admin para compat)
        create_system_user: data.create_system_user,
        system_role: mappedRole,
        user_email: data.user_email,
        user_password: data.user_password,
        
        
        // Foto
        photo: selectedPhoto || undefined,
      };
      
      console.log('📤 MemberForm - Dados finais enviados:', formData);
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file); // Armazenar o arquivo
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para formatar telefone
  const formatPhone = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara baseada no tamanho
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return limitedNumbers.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    } else if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  // Handler para campos de telefone
  const handlePhoneChange = (field: 'phone' | 'phone_secondary') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const formattedValue = formatPhone(value);
    form.setValue(field, formattedValue);
  };

  // Função para formatar CPF
  const formatCPF = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return limitedNumbers.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else if (limitedNumbers.length <= 9) {
      return limitedNumbers.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else {
      return limitedNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }
  };

  // Handler para CPF
  const handleCPFChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const formattedValue = formatCPF(value);
    form.setValue('cpf', formattedValue);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">
            {member ? 'Edite as informações do membro' : 'Preencha os dados do novo membro'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="church" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Dados Eclesiásticos
              </TabsTrigger>
              <TabsTrigger value="ministerial" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Função Ministerial
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Informações Adicionais
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
                  <CardDescription>
                    Dados básicos de identificação do membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Foto */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo">Foto do Membro</Label>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do membro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} onChange={handleCPFChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000-0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marital_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Civil</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado civil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Solteiro(a)</SelectItem>
                              <SelectItem value="married">Casado(a)</SelectItem>
                              <SelectItem value="divorced">Divorciado(a)</SelectItem>
                              <SelectItem value="widowed">Viúvo(a)</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campos do cônjuge - só aparece se estado civil for casado */}
                  {form.watch('marital_status') === 'married' && (
                    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Informações do Cônjuge
                      </h4>

                      <FormField
                        control={form.control}
                        name="spouse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vincular Cônjuge</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cônjuge ou indique que não é membro" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="non-member">
                                  Cônjuge não é membro da igreja
                                </SelectItem>
                                {spousesLoading ? (
                                  <SelectItem value="loading" disabled>
                                    Carregando membros...
                                  </SelectItem>
                                ) : availableSpouses.length > 0 ? (
                                  availableSpouses.map((spouse) => (
                                    <SelectItem key={spouse.id} value={spouse.id.toString()}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{spouse.full_name}</span>
                                        <span className="text-sm text-gray-500">
                                          {spouse.age} anos • {spouse.gender}
                                          {spouse.cpf && ` • CPF: ${spouse.cpf}`}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="empty" disabled>
                                    Nenhum membro disponível para vínculo
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Quando o cônjuge não for membro cadastrado, mantenha a opção "Cônjuge não é membro".
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Campo Quantidade de Filhos */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Informações Familiares
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="children_count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade de Filhos</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Número de filhos (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                  <CardDescription>
                    Dados para comunicação com o membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Principal *</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} onChange={handlePhoneChange('phone')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Secundário</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} onChange={handlePhoneChange('phone_secondary')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Endereço */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="zipcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <InputMask
                                mask="99999-999"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={async (e) => {
                                  field.onBlur();
                                  const cep = e.target.value.replace(/\D/g, '');
                                  if (cep.length === 8) {
                                    try {
                                      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                                      const data = await response.json();
                                      if (!data.erro) {
                                        form.setValue('address', data.logradouro || '');
                                        form.setValue('neighborhood', data.bairro || '');
                                        form.setValue('city', data.localidade || '');
                                        form.setValue('state', data.uf || '');
                                      }
                                    } catch (error) {
                                      console.error('Erro ao buscar CEP:', error);
                                    }
                                  }
                                }}
                              >
                                {(inputProps: any) => (
                                  <Input placeholder="00000-000" {...inputProps} />
                                )}
                              </InputMask>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apto 101, Bloco A..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="SP" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Preferências de Contato */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Preferências de Contato</h4>
                    <div className="flex flex-wrap gap-4">
                      <FormField
                        control={form.control}
                        name="accept_email"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Aceita E-mail</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accept_sms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Aceita SMS</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accept_whatsapp"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Aceita WhatsApp</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
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
                    Dados Eclesiásticos
                  </CardTitle>
                  <CardDescription>
                    Informações sobre a vida espiritual do membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">



                    <FormField
                      control={form.control}
                      name="church_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Igreja Atual *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(Number(value))} 
                            defaultValue={field.value?.toString()}
                            disabled={churchesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={churchesLoading ? "Carregando..." : "Selecione a igreja"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableChurches.map((church) => (
                                <SelectItem key={church.id} value={church.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{church.name}</span>
                                    <span className="text-sm text-gray-500">{church.city}, {church.state}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecione a igreja à qual este membro pertence
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campo de Data do Batismo removido do cadastro */}


                    <FormField
                      control={form.control}
                      name="previous_church"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Igreja Anterior</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da igreja anterior" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="transfer_letter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Possui Carta de Transferência</FormLabel>
                          <FormDescription>
                            Marque se o membro veio com carta de transferência
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>


            </TabsContent>
            
            {/* Função Ministerial */}
            <TabsContent value="ministerial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Função Ministerial
                  </CardTitle>
                  <CardDescription>
                    Informações sobre o status e função ministerial do membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="membership_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status de Membresia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(MEMBERSHIP_STATUS_CHOICES).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ministerial_function"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função Ministerial</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a função" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(MINISTERIAL_FUNCTION_CHOICES).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Campo de Data de Conversão removido */}
                    {/* Campo de Data de Ordenação removido */}
                  </div>
                </CardContent>
              </Card>
              
              {/* Acesso ao Sistema - será movido para 'Informações Adicionais' */}
              {/* REMOVIDO desta aba */}
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Acesso ao Sistema
                  </CardTitle>
                  <CardDescription>
                    Configure se este membro terá acesso ao sistema de gestão
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {member && member.user ? (
                    <div className="p-3 rounded border bg-gray-50 text-sm text-gray-700">
                      Este membro já possui acesso ao sistema vinculado.
                    </div>
                  ) : canAssignRoles ? (
                  <FormField
                    control={form.control}
                    name="create_system_user"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                // Auto-selecionar papel quando só houver uma opção
                                const currentRole = form.getValues('system_role');
                                if (!currentRole && availableRoles.length === 1) {
                                  form.setValue('system_role', availableRoles[0].value, { shouldValidate: true });
                                }
                                // Pré-preencher e-mail com o do membro (se houver)
                                const currentEmail = form.getValues('user_email');
                                if (!currentEmail && (member?.email || '').trim()) {
                                  form.setValue('user_email', member!.email!, { shouldValidate: true });
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Usuário terá acesso ao sistema?</FormLabel>
                          <FormDescription>
                            Marque para criar um usuário que poderá fazer login no sistema
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  ) : (
                    <div className="p-3 rounded border bg-gray-50 text-sm text-gray-600">
                      Você não tem permissão para atribuir papéis de acesso ao sistema.
                    </div>
                  )}

                  {canAssignRoles && form.watch('create_system_user') && (
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Configurações de Acesso ao Sistema
                      </h4>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Importante:</strong> Ao marcar esta opção, será criado um usuário que poderá fazer login no sistema.
                          Escolha o papel adequado baseado nas responsabilidades da pessoa na igreja.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="system_role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Papel no Sistema *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o papel" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableRoles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{role.label}</span>
                                        <span className="text-xs text-gray-500">{role.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define as permissões do usuário no sistema
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="user_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail para Login *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="email@exemplo.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                E-mail que será usado para fazer login no sistema
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="user_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Inicial *</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Digite uma senha inicial (mínimo 8 caracteres)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Senha inicial para acesso. O usuário poderá alterá-la posteriormente.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('system_role') && (
                        <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">
                            Papel Selecionado: {availableRoles.find(r => r.value === form.watch('system_role'))?.label}
                          </h5>
                          <p className="text-sm text-blue-700">
                            {availableRoles.find(r => r.value === form.watch('system_role'))?.description}
                          </p>
                          
                          <div className="mt-2 text-xs text-blue-600">
                            <strong>O que este papel pode fazer:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {form.watch('system_role') === 'denomination_admin' && (
                                <>
                                  <li>Administrar todas as igrejas da denominação</li>
                                  <li>Gerenciar administradores de igreja</li>
                                  <li>Visualizar relatórios consolidados da denominação</li>
                                </>
                              )}
                              {form.watch('system_role') === 'church_admin' && (
                                <>
                                  <li>Gerenciar todos os membros e visitantes</li>
                                  <li>Criar e gerenciar atividades e ministérios</li>
                                  <li>Acessar relatórios e dashboards</li>
                                  <li>Gerenciar filiais da igreja</li>
                                </>
                              )}
                              {form.watch('system_role') === 'secretary' && (
                                <>
                                  <li>Gerenciar cadastros de membros</li>
                                  <li>Gerenciar visitantes</li>
                                  <li>Visualizar relatórios básicos</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </TabsContent>

            {/* Informações Adicionais */}
            <TabsContent value="additional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Informações Adicionais
                  </CardTitle>
                  <CardDescription>
                    Dados complementares sobre o membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profissão</FormLabel>
                          <FormControl>
                            <Input placeholder="Profissão do membro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="education_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escolaridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Nível de escolaridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="elementary_incomplete">Fundamental Incompleto</SelectItem>
                              <SelectItem value="elementary_complete">Fundamental Completo</SelectItem>
                              <SelectItem value="high_school_incomplete">Médio Incompleto</SelectItem>
                              <SelectItem value="high_school_complete">Médio Completo</SelectItem>
                              <SelectItem value="higher_incomplete">Superior Incompleto</SelectItem>
                              <SelectItem value="higher_complete">Superior Completo</SelectItem>
                              <SelectItem value="postgraduate">Pós-graduação</SelectItem>
                              <SelectItem value="masters">Mestrado</SelectItem>
                              <SelectItem value="doctorate">Doutorado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações gerais sobre o membro..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais relevantes sobre o membro
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Acesso ao Sistema (movido para Informações Adicionais) */}
              {!isEditingSelf ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Acesso ao Sistema
                    </CardTitle>
                    <CardDescription>
                      Configure se este membro terá acesso ao sistema de gestão
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {alreadyHasSystemAccess && (
                      <div className="p-3 rounded border bg-gray-50 text-sm text-gray-700">
                        Este membro já possui acesso ao sistema vinculado.
                      </div>
                    )}

                    {!alreadyHasSystemAccess && !canAssignRoles && (
                      <div className="p-3 rounded border bg-gray-50 text-sm text-gray-600">
                        Você não tem permissão para atribuir papéis de acesso ao sistema.
                      </div>
                    )}

                    {!alreadyHasSystemAccess && canAssignRoles && (
                      <>
                        <FormField
                      control={form.control}
                      name="create_system_user"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  // Pré-selecionar papel quando houver apenas uma opção disponível
                                  const currentRole = form.getValues('system_role');
                                  if (!currentRole && availableRoles.length === 1) {
                                    form.setValue('system_role', availableRoles[0].value);
                                  }
                                  // Pré-preencher e-mail com o do membro (se existir)
                                  const currentEmail = form.getValues('user_email');
                                  if (!currentEmail && (member?.email || '').trim()) {
                                    form.setValue('user_email', member!.email!, { shouldValidate: true });
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Usuário terá acesso ao sistema?</FormLabel>
                            <FormDescription>
                              Marque para criar um usuário que poderá fazer login no sistema. Após marcar, selecione o papel e informe e-mail e senha de acesso.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('create_system_user') && (
                      <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                        <h4 className="font-medium text-blue-900 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Configurações de Acesso ao Sistema
                        </h4>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> Ao marcar esta opção, será criado um usuário que poderá fazer login no sistema.
                            Escolha o papel adequado baseado nas responsabilidades da pessoa na igreja.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="system_role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Papel no Sistema *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o papel" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableRoles.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{role.label}</span>
                                          <span className="text-xs text-gray-500">{role.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Define as permissões do usuário no sistema
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="user_email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-mail para Login *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="email@exemplo.com" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  E-mail que será usado para fazer login no sistema
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="user_password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha Inicial *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Digite uma senha inicial (mínimo 8 caracteres)" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Senha inicial para acesso. O usuário poderá alterá-la posteriormente.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch('system_role') && (
                          <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-2">
                              Papel Selecionado: {availableRoles.find(r => r.value === form.watch('system_role'))?.label}
                            </h5>
                            <p className="text-sm text-blue-700">
                              {availableRoles.find(r => r.value === form.watch('system_role'))?.description}
                            </p>
                            
                            <div className="mt-2 text-xs text-blue-600">
                              <strong>O que este papel pode fazer:</strong>
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Permissões variam por papel e igreja</li>
                                {form.watch('system_role') === 'denomination_admin' && (
                                  <>
                                    <li>Administrar denominação e igrejas vinculadas</li>
                                    <li>Relatórios consolidados da denominação</li>
                                  </>
                                )}
                                {form.watch('system_role') === 'church_admin' && (
                                  <>
                                    <li>Gerenciar dados da igreja e membros</li>
                                    <li>Gerenciar filiais e atividades</li>
                                    <li>Acessar relatórios consolidados</li>
                                  </>
                                )}
                                {form.watch('system_role') === 'secretary' && (
                                  <>
                                    <li>Gestão de cadastros</li>
                                    <li>Relatórios básicos</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Acesso ao Sistema
                    </CardTitle>
                    <CardDescription>
                      Alterações de permissão não estão disponíveis ao editar o próprio usuário
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Para atualizar seu papel no sistema, solicite a um administrador da igreja; para alterar sua senha, acesse Perfil → Segurança.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}; 
