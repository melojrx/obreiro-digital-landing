import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowRight,
  Users,
  AlertTriangle,
  Plus,
  Search
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreateMemberData, 
  Member, 
  MemberSummary,
  membersService,
  MINISTERIAL_FUNCTION_CHOICES,
  MEMBERSHIP_STATUS_CHOICES
} from '@/services/membersService';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentActiveChurch } from '@/hooks/useActiveChurch';
import { usePermissions } from '@/hooks/usePermissions';

const STATUS_IMPACT_MESSAGES: Record<string, string> = {
  active: '✅ Membro ativo participará de todas as atividades e terá acesso total aos recursos da igreja.',
  inactive: '⚠️ Membro inativo não aparecerá nos relatórios e listagens de membros ativos.',
  transferred: '📤 Membro transferido será considerado pertencente a outra congregação.',
  disciplined: '🚫 Membro disciplinado terá acesso limitado a atividades e ministérios.',
  deceased: '🕊️ Membro falecido será removido das listagens operacionais e relatórios ativos.',
  excluded: '❌ Membro excluído não terá mais acesso à igreja e será removido de todas as atividades.',
};

const FUNCTION_IMPACT_MESSAGES: Record<string, string> = {
  pastor: '🙏 Função de liderança espiritual e pastoral da congregação.',
  elder: '👨‍💼 Função de liderança e apoio à administração eclesiástica.',
  deacon: '🤝 Função de serviço e apoio às atividades da igreja.',
  deaconess: '🤝 Função de serviço e apoio às atividades da igreja.',
  evangelist: '📢 Função focada em evangelização e pregação do evangelho.',
  missionary: '🌍 Função dedicada ao trabalho missionário e evangelístico.',
  leader: '👥 Função de coordenação de grupos e ministérios específicos.',
  teacher: '📚 Função de ensino e educação cristã.',
  musician: '🎵 Função no ministério de música e louvor.',
  member: '👤 Membro comum da congregação.',
};

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
  remove_system_access: z.boolean().optional(),
  // NOTA: user_password removido - senha gerada automaticamente pelo backend
  
}).refine((data) => {
  // Validação condicional para criação de usuário do sistema
  if (data.create_system_user) {
    if (!data.system_role) {
      return false;
    }
    if (!data.user_email || data.user_email === '') {
      return false;
    }
    // NOTA: Validação de senha removida - senha gerada automaticamente
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.user_email)) {
      return false;
    }
  }
  return true;
}, {
  message: "Quando 'Criar usuário do sistema' estiver marcado, papel e e-mail são obrigatórios",
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
    { value: 'church_admin', label: 'Administrador da Igreja (Nível 2)', description: 'Administra a igreja (Matriz e Congregações)' },
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
  const mappedExistingRole = member?.system_user_role === 'denomination_admin'
    ? 'church_admin'
    : (member?.system_user_role || '');
  const defaultSystemEmail = (member?.system_user_email || member?.email || '').trim();
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
  const [selectedChildren, setSelectedChildren] = useState<MemberSummary[]>(member?.children || []);
  const [childSearch, setChildSearch] = useState('');
  const [childrenOptions, setChildrenOptions] = useState<MemberSummary[]>([]);
  const [childSelectId, setChildSelectId] = useState<string>('');
  const [childrenLoading, setChildrenLoading] = useState(false);
  
  // Estado para membros disponíveis para cônjuge
  const [availableSpouses, setAvailableSpouses] = useState<Array<{
    id: number;
    full_name: string;
    cpf?: string;
    birth_date?: string;
    age?: number;
    gender?: string;
    membership_date?: string;
  }>>([]);
  const [spousesLoading, setSpousesLoading] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    current: string;
    next: string;
  } | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const membershipStatusApplyRef = useRef<((value: string) => void) | null>(null);
  
  // Estados para modal de confirmação de função ministerial
  const [pendingFunctionChange, setPendingFunctionChange] = useState<{
    current: string;
    next: string;
  } | null>(null);
  const [functionConfirmOpen, setFunctionConfirmOpen] = useState(false);
  const ministerialFunctionApplyRef = useRef<((value: string) => void) | null>(null);

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
      system_role: mappedExistingRole,
      user_email: defaultSystemEmail,
      remove_system_access: false,
      // NOTA: user_password removido - não é mais necessário

      
      // Igreja
      church_id: member?.church_id || activeChurch?.id || 0,
      
    },
  });

  const getStatusLabel = useCallback((value: string) => {
    return MEMBERSHIP_STATUS_CHOICES[value as keyof typeof MEMBERSHIP_STATUS_CHOICES] || value;
  }, []);

  const isCriticalChange = useCallback((statusValue: string): boolean => {
    return ['deceased', 'excluded', 'transferred'].includes(statusValue);
  }, []);

  const getStatusImpactMessage = useCallback((value: string) => {
    return STATUS_IMPACT_MESSAGES[value] ?? '⚠️ Esta alteração pode impactar relatórios e permissões associadas ao membro.';
  }, []);

  // Funções auxiliares para função ministerial
  const getFunctionLabel = useCallback((value: string) => {
    return MINISTERIAL_FUNCTION_CHOICES[value as keyof typeof MINISTERIAL_FUNCTION_CHOICES] || value;
  }, []);

  const isSignificantFunctionChange = useCallback((functionValue: string): boolean => {
    return ['pastor', 'elder', 'deacon', 'deaconess'].includes(functionValue);
  }, []);

  const getFunctionImpactMessage = useCallback((value: string) => {
    return FUNCTION_IMPACT_MESSAGES[value] ?? '⚠️ Esta alteração pode impactar a função eclesiástica do membro.';
  }, []);

  const handleMembershipStatusSelection = useCallback((value: string, onChange: (val: string) => void) => {
    if (!member) {
      onChange(value);
      return;
    }

    const currentValue = form.getValues('membership_status') || '';
    if (currentValue === value) {
      onChange(value);
      return;
    }

    membershipStatusApplyRef.current = onChange;
    setPendingStatusChange({
      current: currentValue,
      next: value,
    });
    setStatusConfirmOpen(true);
  }, [form, member]);

  const confirmStatusChange = useCallback(() => {
    if (pendingStatusChange) {
      membershipStatusApplyRef.current?.(pendingStatusChange.next);
      form.setValue('membership_status', pendingStatusChange.next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setPendingStatusChange(null);
    membershipStatusApplyRef.current = null;
    setStatusConfirmOpen(false);
  }, [form, pendingStatusChange]);

  const cancelStatusChange = useCallback(() => {
    setPendingStatusChange(null);
    membershipStatusApplyRef.current = null;
    setStatusConfirmOpen(false);
  }, []);

  // Handlers para função ministerial
  const handleMinisterialFunctionSelection = useCallback((value: string, onChange: (val: string) => void) => {
    if (!member) {
      onChange(value);
      return;
    }

    const currentValue = form.getValues('ministerial_function') || '';
    if (currentValue === value) {
      onChange(value);
      return;
    }

    ministerialFunctionApplyRef.current = onChange;
    setPendingFunctionChange({
      current: currentValue,
      next: value,
    });
    setFunctionConfirmOpen(true);
  }, [form, member]);

  const confirmFunctionChange = useCallback(() => {
    if (pendingFunctionChange) {
      ministerialFunctionApplyRef.current?.(pendingFunctionChange.next);
      form.setValue('ministerial_function', pendingFunctionChange.next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setPendingFunctionChange(null);
    ministerialFunctionApplyRef.current = null;
    setFunctionConfirmOpen(false);
  }, [form, pendingFunctionChange]);

  const cancelFunctionChange = useCallback(() => {
    setPendingFunctionChange(null);
    ministerialFunctionApplyRef.current = null;
    setFunctionConfirmOpen(false);
  }, []);

  useEffect(() => {
    if (isEditingSelf || alreadyHasSystemAccess) {
      form.setValue('create_system_user', false, { shouldDirty: false, shouldValidate: false });
      form.setValue('system_role', '', { shouldDirty: false, shouldValidate: false });
      form.setValue('user_email', '', { shouldDirty: false, shouldValidate: false });
      // NOTA: user_password removido - não é mais necessário
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

  const loadAvailableSpouses = useCallback(async () => {
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
        });
      }

      setAvailableSpouses(results);
    } catch (error) {
      console.error('Erro ao carregar membros disponíveis:', error);
      setAvailableSpouses([]);
    } finally {
      setSpousesLoading(false);
    }
  }, [maritalStatus, member?.id, member?.spouse, member?.spouse_name]);

  useEffect(() => {
    if (maritalStatus === 'married') {
      if (!form.getValues('spouse')) {
        form.setValue('spouse', 'non-member', { shouldDirty: false, shouldValidate: true });
      }
      loadAvailableSpouses();
    } else {
      setAvailableSpouses([]);
      form.setValue('spouse', '', { shouldDirty: false, shouldValidate: true });
    }
  }, [form, loadAvailableSpouses, maritalStatus]);

  const handleSubmit = async (data: MemberFormData) => {
    try {
      console.log('🔍 MemberForm handleSubmit - activeChurch:', activeChurch);
      console.log('🔍 MemberForm handleSubmit - data recebida:', data);
      
      if (!activeChurch) {
        throw new Error('Igreja ativa não encontrada. Selecione uma igreja antes de cadastrar membros.');
      }
      
      // Determinar congregação para associar o novo membro
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
          console.warn('⚠️ Não foi possível carregar congregações para definir branch do membro. Prosseguindo sem branch.', e);
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
      const childrenIds = selectedChildren.map((child) => child.id);

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
        children_count: data.children_count || (childrenIds.length > 0 ? childrenIds.length : undefined),
        children: childrenIds,
        
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
        
        // Campos de acesso ao sistema - enviados APENAS quando create_system_user for true
        // Usa spread condicional para evitar enviar strings vazias que causam erro de validação
        ...(data.create_system_user && {
          create_system_user: true,
          system_role: mappedRole,
          user_email: data.user_email,
        }),
        // NOTA: user_password removido - senha gerada automaticamente pelo backend
        
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

  // Busca e seleção de filhos (membros)
  const loadChildrenOptions = useCallback(async (term?: string) => {
    try {
      setChildrenLoading(true);
      const response = await membersService.getMembers({
        search: term || undefined,
        page: 1,
      });
      setChildrenOptions(response.results || []);
    } catch (error) {
      console.error('Erro ao buscar membros para filhos', error);
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedChildren(member?.children || []);
  }, [member?.children]);

  useEffect(() => {
    loadChildrenOptions('');
  }, [loadChildrenOptions]);

  const handleAddChild = () => {
    if (!childSelectId) return;
    const childIdNum = Number(childSelectId);
    if (!Number.isFinite(childIdNum)) return;
    if (member?.id === childIdNum) return;
    if (selectedChildren.some((c) => c.id === childIdNum)) return;
    const found = childrenOptions.find((c) => c.id === childIdNum);
    if (found) {
      setSelectedChildren((prev) => [...prev, found]);
      setChildSelectId('');
    }
  };

  const handleRemoveChild = (id: number) => {
    setSelectedChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredChildrenOptions = childrenOptions.filter(
    (child) =>
      child.id !== member?.id &&
      !selectedChildren.some((c) => c.id === child.id)
  );

  useEffect(() => {
    if (member?.phone) {
      form.setValue('phone', formatPhone(member.phone), {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
    if (member?.phone_secondary) {
      form.setValue('phone_secondary', formatPhone(member.phone_secondary), {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [form, member?.phone, member?.phone_secondary]);

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {member ? 'Edite as informações do membro' : 'Preencha os dados do novo membro'}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="flex flex-wrap gap-2 w-full rounded-lg bg-muted/60 p-1 sm:grid sm:grid-cols-2 lg:grid-cols-5">
                <TabsTrigger value="personal" className="flex items-center gap-2 text-xs sm:text-sm w-full justify-start sm:justify-center">
                <User className="h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2 text-xs sm:text-sm w-full justify-start sm:justify-center">
                <Phone className="h-4 w-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="church" className="flex items-center gap-2 text-xs sm:text-sm w-full justify-start sm:justify-center">
                <Heart className="h-4 w-4" />
                Dados Eclesiásticos
              </TabsTrigger>
              <TabsTrigger value="ministerial" className="flex items-center gap-2 text-xs sm:text-sm w-full justify-start sm:justify-center">
                <Shield className="h-4 w-4" />
                Função Ministerial
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2 text-xs sm:text-sm w-full justify-start sm:justify-center">
                <Briefcase className="h-4 w-4" />
                Informações Adicionais
              </TabsTrigger>
              </TabsList>
            </div>

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
                              value={field.value}
                              onValueChange={(value) => field.onChange(value)}
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
                              Número de filhos (opcional). Se vincular filhos abaixo, este valor será ajustado automaticamente.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {(Number(form.watch('children_count') || 0) > 0 || selectedChildren.length > 0) && (
                      <div className="rounded-md border p-4 space-y-4 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <h5 className="font-medium text-gray-900">Filhos vinculados</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-8 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Buscar membro pelo nome ou CPF"
                                value={childSearch}
                                onChange={(e) => {
                                  setChildSearch(e.target.value);
                                  loadChildrenOptions(e.target.value);
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => loadChildrenOptions(childSearch)}
                                disabled={childrenLoading}
                              >
                                <Search className="h-4 w-4 mr-1" />
                                Buscar
                              </Button>
                            </div>
                            <select
                              className="w-full border rounded-md p-2 text-sm bg-white"
                              value={childSelectId}
                              onChange={(e) => setChildSelectId(e.target.value)}
                            >
                              <option value="">Selecione um filho (membro)</option>
                              {childrenLoading && <option>Carregando...</option>}
                              {!childrenLoading && filteredChildrenOptions.length === 0 && (
                                <option disabled>Nenhum membro encontrado</option>
                              )}
                              {filteredChildrenOptions.map((child) => (
                                <option key={child.id} value={child.id}>
                                  {child.full_name} {child.age ? `• ${child.age} anos` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-4 flex md:justify-end">
                            <Button
                              type="button"
                              variant="default"
                              onClick={handleAddChild}
                              disabled={!childSelectId}
                              className="w-full md:w-auto"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar filho
                            </Button>
                          </div>
                        </div>

                        {selectedChildren.length === 0 ? (
                          <div className="text-sm text-gray-600">
                            Nenhum filho vinculado. Selecione membros acima para mapear a família.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedChildren.map((child) => (
                              <Badge
                                key={child.id}
                                variant="secondary"
                                className="flex items-center gap-2 px-3 py-1"
                              >
                                {child.full_name}
                                {child.age ? ` • ${child.age} anos` : ''}
                                <button
                                  type="button"
                                  className="ml-1 text-red-600 hover:text-red-800"
                                  onClick={() => handleRemoveChild(child.id)}
                                  aria-label={`Remover ${child.full_name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="membership_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status de Membresia</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => handleMembershipStatusSelection(value, field.onChange)}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="membership-status-select">
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
                  </div>
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
                    Informações sobre a função ministerial do membro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ministerial_function"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função Ministerial</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => handleMinisterialFunctionSelection(value, field.onChange)}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="ministerial-function-select">
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
              
              {/* NOTA: Acesso ao Sistema foi movido para a aba 'Informações Adicionais' */}
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
                    {alreadyHasSystemAccess ? (
                      <>
                        <div className="p-3 rounded border bg-blue-50 text-sm text-blue-900">
                          <div className="font-medium">Acesso ativo</div>
                          <div className="text-blue-800 mt-1">
                            E-mail: {member?.system_user_email || member?.email || '—'}
                          </div>
                          <div className="text-blue-800">
                            Papel: {member?.system_user_role_label || '—'}
                          </div>
                        </div>

                        {!canAssignRoles && (
                          <div className="p-3 rounded border bg-gray-50 text-sm text-gray-600">
                            Você não tem permissão para ajustar ou remover o acesso deste membro.
                          </div>
                        )}

                        {canAssignRoles && (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="system_role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Novo papel no sistema</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={form.watch('remove_system_access')}
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
                                    Ajuste o nível de acesso do membro ao sistema.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="remove_system_access"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Remover acesso ao sistema</FormLabel>
                                    <FormDescription>
                                      Desative o login deste membro e remova o vínculo de acesso.
                                    </FormDescription>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {form.watch('remove_system_access') && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Confirmação necessária</AlertTitle>
                                <AlertDescription>
                                  Ao salvar, o vínculo com o usuário será removido e o login será desativado para este membro.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {!canAssignRoles && (
                          <div className="p-3 rounded border bg-gray-50 text-sm text-gray-600">
                            Você não tem permissão para atribuir papéis de acesso ao sistema.
                          </div>
                        )}

                        {canAssignRoles && (
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

                            {/* Aviso sobre geração automática de senha */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <svg 
                                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                  />
                                </svg>
                                <div className="flex-1">
                                  <h4 className="font-medium text-blue-900 text-sm mb-1">
                                    🔐 Senha Gerada Automaticamente
                                  </h4>
                                  <p className="text-sm text-blue-700 mb-2">
                                    Uma senha segura será gerada automaticamente e enviada para o e-mail cadastrado.
                                  </p>
                                  <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                                    <li>O membro receberá um e-mail com as credenciais de acesso</li>
                                    <li>A senha é única e segura (16 caracteres aleatórios)</li>
                                    <li>O usuário poderá alterá-la no primeiro acesso</li>
                                    <li>Por segurança, administradores não têm acesso à senha</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

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
                                        <li>Gerenciar congregações e atividades</li>
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

          <Dialog
            open={statusConfirmOpen}
            onOpenChange={(open) => {
              if (!open) {
                cancelStatusChange();
              } else {
                setStatusConfirmOpen(true);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {pendingStatusChange && isCriticalChange(pendingStatusChange.next) && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {pendingStatusChange && !isCriticalChange(pendingStatusChange.next) && (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  Confirmar alteração de status
                </DialogTitle>
                <DialogDescription>
                  Revise a mudança de status de membresia antes de salvá-la.
                </DialogDescription>
              </DialogHeader>

              {pendingStatusChange && (
                <div className="space-y-4">
                  {isCriticalChange(pendingStatusChange.next) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção: Alteração crítica!</AlertTitle>
                      <AlertDescription>
                        Esta mudança é irreversível e afetará significativamente o registro do membro.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 justify-center">
                    <Badge 
                      variant="secondary"
                      className="text-sm px-3 py-1"
                    >
                      {pendingStatusChange.current
                        ? getStatusLabel(pendingStatusChange.current)
                        : 'Sem status anterior'}
                    </Badge>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <Badge 
                      variant={isCriticalChange(pendingStatusChange.next) ? "destructive" : "default"}
                      className="text-sm px-3 py-1"
                    >
                      {getStatusLabel(pendingStatusChange.next)}
                    </Badge>
                  </div>

                  <div className={`text-sm p-3 rounded-md ${
                    isCriticalChange(pendingStatusChange.next) 
                      ? 'bg-red-50 text-red-800 border border-red-200' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {getStatusImpactMessage(pendingStatusChange.next)}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={cancelStatusChange}>
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmStatusChange}
                  variant={pendingStatusChange && isCriticalChange(pendingStatusChange.next) ? "destructive" : "default"}
                >
                  Confirmar alteração
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Confirmação de Função Ministerial */}
          <Dialog
            open={functionConfirmOpen}
            onOpenChange={(open) => {
              if (!open) {
                cancelFunctionChange();
              } else {
                setFunctionConfirmOpen(true);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {pendingFunctionChange && isSignificantFunctionChange(pendingFunctionChange.next) && (
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                  )}
                  {pendingFunctionChange && !isSignificantFunctionChange(pendingFunctionChange.next) && (
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                  )}
                  Confirmar alteração de função ministerial
                </DialogTitle>
                <DialogDescription>
                  Revise a mudança de função ministerial antes de salvá-la.
                </DialogDescription>
              </DialogHeader>

              {pendingFunctionChange && (
                <div className="space-y-4">
                  {isSignificantFunctionChange(pendingFunctionChange.next) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção: Mudança significativa!</AlertTitle>
                      <AlertDescription>
                        Esta mudança afetará a função eclesiástica e responsabilidades ministeriais do membro.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 justify-center">
                    <Badge 
                      variant="secondary"
                      className="text-sm px-3 py-1"
                    >
                      {pendingFunctionChange.current
                        ? getFunctionLabel(pendingFunctionChange.current)
                        : 'Sem função anterior'}
                    </Badge>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <Badge 
                      variant={isSignificantFunctionChange(pendingFunctionChange.next) ? "default" : "secondary"}
                      className="text-sm px-3 py-1"
                    >
                      {getFunctionLabel(pendingFunctionChange.next)}
                    </Badge>
                  </div>

                  <div className={`text-sm p-3 rounded-md ${
                    isSignificantFunctionChange(pendingFunctionChange.next) 
                      ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                      : 'bg-gray-50 text-gray-800 border border-gray-200'
                  }`}>
                    {getFunctionImpactMessage(pendingFunctionChange.next)}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={cancelFunctionChange}>
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmFunctionChange}
                  variant={pendingFunctionChange && isSignificantFunctionChange(pendingFunctionChange.next) ? "default" : "secondary"}
                >
                  Confirmar alteração
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </form>
    </Form>
  );
};
