import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
  ArrowLeft,
  Upload,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  History,
  Eye,
  Trash2
} from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

import { churchService } from '@/services/churchService';
import { userService, EligibleAdmin } from '@/services/userService';
import { usePermissions } from '@/hooks/usePermissions';
import { ChurchDetails } from '@/types/hierarchy';
import RoleExplanationCard from '@/components/ui/role-explanation-card';

// Schema de validação (mesmo do CreateChurchPage, mas alguns campos podem ser opcionais)
const churchEditFormSchema = z.object({
  // Dados básicos
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  short_name: z.string()
    .max(20, 'Nome fantasia deve ter no máximo 20 caracteres')
    .optional(),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  
  // Contato
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (11) 99999-9999'),
  website: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),

  // Endereço
  address: z.string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(255, 'Endereço deve ter no máximo 255 caracteres'),
  city: z.string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade deve ter no máximo 100 caracteres'),
  state: z.string()
    .length(2, 'Estado deve ter 2 caracteres'),
  zipcode: z.string()
    .regex(/^\d{5}-\d{3}$/, 'Formato: 12345-678'),

  // Documentação
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato: 12.345.678/0001-90')
    .optional()
    .or(z.literal('')),

  // Administrador principal (opcional na edição)
  main_pastor: z.number()
    .min(1, 'Selecione um administrador')
    .optional(),

  // Configurações
  subscription_plan: z.string().optional(),
  max_members: z.number()
    .min(1, 'Deve permitir pelo menos 1 membro')
    .max(10000, 'Máximo de 10.000 membros')
    .optional(),
  max_branches: z.number()
    .min(0, 'Número de filiais deve ser positivo')
    .max(100, 'Máximo de 100 filiais')
    .optional(),
});

type ChurchEditFormData = z.infer<typeof churchEditFormSchema>;

const EditChurchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [church, setChurch] = useState<ChurchDetails | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [availableStates, setAvailableStates] = useState<Array<{ code: string; name: string }>>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Array<{
    code: string;
    name: string;
    max_members: number;
    max_branches: number;
    features: string[];
  }>>([]);
  const [eligibleAdmins, setEligibleAdmins] = useState<EligibleAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const form = useForm<ChurchEditFormData>({
    resolver: zodResolver(churchEditFormSchema),
    defaultValues: {
      name: '',
      short_name: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      cnpj: '',
      main_pastor: 0,
      subscription_plan: '',
      max_members: 500,
      max_branches: 5,
    },
  });

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      navigate('/denominacao/churches');
      return;
    }

    loadChurchData();
    loadAuxiliaryData();
  }, [id, navigate]);

  useEffect(() => {
    // Detectar mudanças no formulário
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const loadChurchData = async () => {
    try {
      setIsLoading(true);
      const churchData = await churchService.getChurch(Number(id));
      setChurch(churchData);

      // Preencher formulário com dados existentes
      form.reset({
        name: churchData.name,
        short_name: churchData.short_name || '',
        description: churchData.description || '',
        email: churchData.email,
        phone: churchData.phone,
        website: churchData.website || '',
        address: churchData.address,
        city: churchData.city,
        state: churchData.state,
        zipcode: churchData.zipcode,
        cnpj: churchData.cnpj || '',
        main_pastor: churchData.main_pastor?.id || 0,
        subscription_plan: churchData.subscription_plan,
        max_members: churchData.max_members,
        max_branches: churchData.max_branches,
      });

      // Definir previews das imagens existentes
      if (churchData.logo) {
        setLogoPreview(churchData.logo);
      }
      if (churchData.cover_image) {
        setCoverPreview(churchData.cover_image);
      }

      setHasUnsavedChanges(false);
      
      // Carregar administradores elegíveis
      await loadEligibleAdmins();
    } catch (error: any) {
      console.error('Erro ao carregar igreja:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da igreja. Tente novamente.',
        variant: 'destructive',
      });
      navigate('/denominacao/churches');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuxiliaryData = async () => {
    try {
      const [states, plans] = await Promise.all([
        churchService.getAvailableStates(),
        churchService.getSubscriptionPlans(),
      ]);
      
      setAvailableStates(states);
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  };

  const loadEligibleAdmins = async () => {
    if (!church) return;
    
    try {
      setLoadingAdmins(true);
      const response = await userService.getEligibleAdminsForChurch(church.id);
      setEligibleAdmins(response.results);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de administradores.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O logo deve ter no máximo 2MB.',
          variant: 'destructive',
        });
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tipo inválido',
          description: 'Selecione apenas arquivos de imagem.',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setHasUnsavedChanges(true);
    }
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem de capa deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tipo inválido',
          description: 'Selecione apenas arquivos de imagem.',
          variant: 'destructive',
        });
        return;
      }

      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveLogo = async () => {
    if (!church) return;

    try {
      await churchService.removeLogo(church.id);
      setLogoFile(null);
      setLogoPreview('');
      setHasUnsavedChanges(true);
      
      toast({
        title: 'Logo removido',
        description: 'O logo da igreja foi removido com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover logo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCover = async () => {
    if (!church) return;

    try {
      await churchService.removeCoverImage(church.id);
      setCoverFile(null);
      setCoverPreview('');
      setHasUnsavedChanges(true);
      
      toast({
        title: 'Imagem removida',
        description: 'A imagem de capa foi removida com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover imagem. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatZipcode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleZipcodeChange = async (value: string) => {
    const formatted = formatZipcode(value);
    form.setValue('zipcode', formatted);
    
    // Se CEP está completo, buscar endereço
    if (formatted.length === 9) {
      try {
        const cep = formatted.replace('-', '');
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          form.setValue('address', data.logradouro || '');
          form.setValue('city', data.localidade || '');
          form.setValue('state', data.uf || '');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const validateEmailUnique = async (email: string) => {
    if (!email || !church || form.formState.errors.email) return;
    
    try {
      const validation = await churchService.validateEmail(email, church.denomination_id || 1, church.id);
      if (!validation.valid) {
        form.setError('email', {
          type: 'custom',
          message: validation.message || 'Email já está em uso',
        });
      }
    } catch (error) {
      console.error('Erro na validação do email:', error);
    }
  };

  const validateCNPJUnique = async (cnpj: string) => {
    if (!cnpj || !church || form.formState.errors.cnpj) return;
    
    try {
      const validation = await churchService.validateCNPJ(cnpj, church.id);
      if (!validation.valid) {
        form.setError('cnpj', {
          type: 'custom',
          message: validation.message || 'CNPJ já está em uso',
        });
      }
    } catch (error) {
      console.error('Erro na validação do CNPJ:', error);
    }
  };

  const onSubmit = async (data: ChurchEditFormData) => {
    if (!church) return;

    setIsSubmitting(true);
    
    try {
      // Atualizar dados da igreja
      const updatedChurch = await churchService.patchChurch(church.id, data);

      // Upload de novas imagens se fornecidas
      const uploadPromises = [];
      if (logoFile) {
        uploadPromises.push(churchService.uploadLogo(church.id, logoFile));
      }
      if (coverFile) {
        uploadPromises.push(churchService.uploadCoverImage(church.id, coverFile));
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      setChurch(updatedChurch);
      setHasUnsavedChanges(false);

      toast({
        title: 'Sucesso!',
        description: 'Igreja atualizada com sucesso.',
        variant: 'default',
      });

      navigate(`/denominacao/churches/${church.id}`);
    } catch (error: any) {
      console.error('Erro ao atualizar igreja:', error);
      
      let errorMessage = 'Erro interno. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors)[0] as string;
      }

      toast({
        title: 'Erro ao atualizar igreja',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = () => {
    if (church) {
      navigate(`/denominacao/churches/${church.id}`);
    }
  };

  const handleViewHistory = () => {
    if (church) {
      navigate(`/denominacao/churches/${church.id}/history`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!church) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Igreja não encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              A igreja solicitada não existe ou você não tem permissão para editá-la.
            </p>
            <Button onClick={() => navigate('/denominacao/churches')}>
              Voltar para Lista
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/denominacao/churches')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-7 w-7 text-blue-600" />
                Editar Igreja
              </h1>
              <p className="text-gray-600 mt-1">
                {church.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewHistory}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
          </div>
        </div>

        {/* Alert de mudanças não salvas */}
        {hasUnsavedChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem alterações não salvas. Lembre-se de salvar antes de sair da página.
            </AlertDescription>
          </Alert>
        )}

        {/* Status da Igreja */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status da Assinatura</p>
                  <Badge 
                    variant={church.subscription_status === 'active' ? 'default' : 'destructive'}
                  >
                    {church.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-sm text-gray-600">Plano Atual</p>
                  <Badge variant="outline">
                    {church.subscription_plan === 'basic' ? 'Básico' : 
                     church.subscription_plan === 'premium' ? 'Premium' : 'Trial'}
                  </Badge>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-sm text-gray-600">Membros</p>
                  <p className="font-semibold">
                    {church.total_members} / {church.max_members}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-sm text-gray-600">Filiais</p>
                  <p className="font-semibold">
                    {church.branches_count || 0} / {church.max_branches}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Dados Básicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Dados Básicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Igreja *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Igreja Batista da Paz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="short_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: IBP"
                            maxLength={20}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Nome curto para uso interno (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Breve descrição sobre a igreja..."
                          className="min-h-[100px]"
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Descrição opcional da igreja (máx. 500 caracteres)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="contato@igreja.com"
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              validateEmailUnique(e.target.value);
                            }}
                          />
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
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(11) 99999-9999"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.igreja.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Site oficial da igreja (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, número, bairro"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="São Paulo"
                            {...field}
                          />
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
                        <FormLabel>Estado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableStates.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name} ({state.code})
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
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345-678"
                            {...field}
                            onChange={(e) => {
                              handleZipcodeChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Documentação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Documentação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="12.345.678/0001-90"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCNPJ(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={(e) => {
                            field.onBlur();
                            if (e.target.value) {
                              validateCNPJUnique(e.target.value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        CNPJ da igreja (opcional, mas recomendado)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Administrador Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Administrador Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="main_pastor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Administrador</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        value={field.value > 0 ? field.value.toString() : ''}
                        disabled={loadingAdmins}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um administrador..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eligibleAdmins.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id.toString()}>
                              <div className="flex items-center gap-3">
                                {admin.avatar && (
                                  <img 
                                    src={admin.avatar} 
                                    alt={admin.full_name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                )}
                                <div className="flex flex-col">
                                  <span className="font-medium">{admin.full_name}</span>
                                  <span className="text-xs text-gray-500">{admin.email}</span>
                                  {/* Papéis de Sistema */}
                                  {admin.current_system_roles && admin.current_system_roles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <span className="text-xs text-blue-600 font-medium">Sistema:</span>
                                      {admin.current_system_roles.map((role, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          {role.role_display}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Função Ministerial */}
                                  {admin.ministerial_function_display && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-xs text-green-600 font-medium">Ministério:</span>
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        {admin.ministerial_function_display}
                                      </Badge>
                                    </div>
                                  )}
                                  {admin.is_current_pastor && (
                                    <Badge variant="default" className="text-xs mt-1 w-fit">
                                      Atual
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o usuário que será o administrador principal desta igreja.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {loadingAdmins && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando administradores...
                  </div>
                )}
                
                {!loadingAdmins && eligibleAdmins.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum usuário elegível encontrado. Certifique-se de que existem usuários com papéis de liderança na denominação.
                    </AlertDescription>
                  </Alert>
                )}
                
                <RoleExplanationCard />
              </CardContent>
            </Card>

            {/* Upload de Imagens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-600" />
                  Imagens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div>
                    <Label className="text-sm font-medium">Logo da Igreja</Label>
                    <div className="mt-2">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo da igreja"
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 rounded-full p-0"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview('');
                                setHasUnsavedChanges(true);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {church.logo && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-6 w-6 rounded-full p-0"
                                onClick={handleRemoveLogo}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Clique para selecionar o logo
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG até 2MB
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-block mt-2"
                      >
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            {logoPreview ? 'Alterar Logo' : 'Selecionar Logo'}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {/* Imagem de Capa */}
                  <div>
                    <Label className="text-sm font-medium">Imagem de Capa</Label>
                    <div className="mt-2">
                      {coverPreview ? (
                        <div className="relative">
                          <img
                            src={coverPreview}
                            alt="Capa da igreja"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 rounded-full p-0"
                              onClick={() => {
                                setCoverFile(null);
                                setCoverPreview('');
                                setHasUnsavedChanges(true);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {church.cover_image && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-6 w-6 rounded-full p-0"
                                onClick={handleRemoveCover}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Clique para selecionar a capa
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG até 5MB
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Label
                        htmlFor="cover-upload"
                        className="cursor-pointer inline-block mt-2"
                      >
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            {coverPreview ? 'Alterar Capa' : 'Selecionar Capa'}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/denominacao/churches/${church.id}`)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default EditChurchPage;