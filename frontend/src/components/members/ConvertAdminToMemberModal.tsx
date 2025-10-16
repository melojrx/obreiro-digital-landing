import { useEffect, useMemo, useState } from 'react';
import type { InputHTMLAttributes, Ref } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { membersService } from '@/services/membersService';
import { useToast } from '@/hooks/use-toast';
import InputMask from 'react-input-mask';
import type { AxiosError } from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, UserCheck, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const baseSchema = z.object({
  ministerial_function: z.string().min(1, 'Função ministerial é obrigatória'),
  marital_status: z.string().min(1, 'Estado civil é obrigatório'),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
});

type FormData = z.infer<typeof baseSchema>;
type MaskedInputRenderProps = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
};
type ConvertAdminSuccess = Awaited<ReturnType<typeof membersService.convertAdminToMember>>;
type ConvertAdminErrorResponse = {
  error?: string;
  missing_fields?: string[];
};

interface ConvertAdminToMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConvertAdminToMemberModal({
  isOpen,
  onClose,
}: ConvertAdminToMemberModalProps) {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const needsPhone = !user?.phone;
  const needsBirthDate = !user?.profile?.birth_date;
  const needsGender = !user?.profile?.gender;

  const formattedCpf = useMemo(() => {
    const rawCpf = user?.profile?.cpf ?? '';
    const digits = rawCpf.replace(/\D/g, '');
    if (digits.length !== 11) {
      return rawCpf;
    }
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }, [user?.profile?.cpf]);

  const validationSchema = useMemo(
    () =>
      baseSchema.superRefine((data, ctx) => {
        if (needsPhone && !data.phone) {
          ctx.addIssue({
            path: ['phone'],
            code: z.ZodIssueCode.custom,
            message: 'Telefone é obrigatório',
          });
        }

        if (needsBirthDate && !data.birth_date) {
          ctx.addIssue({
            path: ['birth_date'],
            code: z.ZodIssueCode.custom,
            message: 'Data de nascimento é obrigatória',
          });
        }

        if (needsGender && !data.gender) {
          ctx.addIssue({
            path: ['gender'],
            code: z.ZodIssueCode.custom,
            message: 'Gênero é obrigatório',
          });
        }

        if (data.phone) {
          const phoneDigits = data.phone.replace(/\D/g, '');
          if (!phoneDigits || ![10, 11].includes(phoneDigits.length)) {
            ctx.addIssue({
              path: ['phone'],
              code: z.ZodIssueCode.custom,
              message: 'Telefone inválido. Informe DDD e número.',
            });
          }
        }

        if (data.birth_date) {
          const parsed = new Date(data.birth_date);
          if (Number.isNaN(parsed.getTime())) {
            ctx.addIssue({
              path: ['birth_date'],
              code: z.ZodIssueCode.custom,
              message: 'Data de nascimento inválida.',
            });
          } else {
            const today = new Date();
            let age = today.getFullYear() - parsed.getFullYear();
            const monthDiff = today.getMonth() - parsed.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
              age -= 1;
            }
            if (age < 18) {
              ctx.addIssue({
                path: ['birth_date'],
                code: z.ZodIssueCode.custom,
                message: 'É necessário ter pelo menos 18 anos.',
              });
            }
          }
        }

        if (data.gender && !['M', 'F'].includes(data.gender.toUpperCase())) {
          ctx.addIssue({
            path: ['gender'],
            code: z.ZodIssueCode.custom,
            message: 'Selecione um gênero válido.',
          });
        }
      }),
    [needsPhone, needsBirthDate, needsGender]
  );

  const defaultValues = useMemo<FormData>(
    () => ({
      ministerial_function: 'member',
      marital_status: 'single',
      phone: user?.phone || '',
      birth_date: (() => {
        const birthDate = user?.profile?.birth_date;
        if (!birthDate) {
          return '';
        }
        return birthDate.split('T')[0];
      })(),
      gender: user?.profile?.gender || '',
    }),
    [user]
  );

  const profileFieldsToHighlight = useMemo(() => {
    const fields: string[] = [];
    if (needsPhone) fields.push('Telefone');
    if (needsBirthDate) fields.push('Data de nascimento');
    if (needsGender) fields.push('Gênero');
    return fields;
  }, [needsPhone, needsBirthDate, needsGender]);
  const isCpfMissing = !formattedCpf;
  const hasMissingProfileFields = profileFieldsToHighlight.length > 0 || isCpfMissing;
  const profileFieldsText = [...profileFieldsToHighlight, ...(isCpfMissing ? ['CPF'] : [])].join(', ');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setError(null);
    }
  }, [isOpen, defaultValues, reset]);

  const convertMutation = useMutation<ConvertAdminSuccess, AxiosError<ConvertAdminErrorResponse>, FormData>({
    mutationFn: (data) => membersService.convertAdminToMember(data),
    onSuccess: async (response) => {
      toast({
        title: 'Sucesso!',
        description: response.message || 'Você agora é um membro da igreja.',
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      try {
        await refreshUserData();
      } catch (refreshError) {
        console.error('Erro ao atualizar dados do usuário após conversão:', refreshError);
      }
      
      reset(defaultValues);
      onClose();
    },
    onError: (error) => {
      const responseData = error.response?.data;
      const missingFields = responseData?.missing_fields ?? [];
      const baseMessage =
        responseData?.error ||
        error.message ||
        'Erro ao converter em membro';
      const errorMessage = missingFields.length
        ? `${baseMessage} (Campos pendentes: ${missingFields.join(', ')})`
        : baseMessage;
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    const payloadEntries = Object.entries(data) as Array<[keyof FormData, FormData[keyof FormData]]>;
    const payload: Partial<FormData> = {};

    payloadEntries.forEach(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          payload[key] = trimmed as FormData[keyof FormData];
        }
      } else if (value) {
        payload[key] = value;
      }
    });

    if (payload.gender) {
      payload.gender = payload.gender.toUpperCase() as FormData['gender'];
    }

    convertMutation.mutate(payload as FormData);
  };

  const handleClose = () => {
    reset(defaultValues);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Tornar-se Membro da Igreja
          </DialogTitle>
          <DialogDescription>
            Você está prestes a criar seu registro como membro da igreja. 
            Seus dados pessoais do perfil serão utilizados automaticamente.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Função Ministerial */}
          <div className="space-y-2">
            <Label htmlFor="ministerial_function">
              Função Ministerial <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('ministerial_function') || ''}
              onValueChange={(value) => setValue('ministerial_function', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua função..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="deacon">Diácono</SelectItem>
                <SelectItem value="deaconess">Diaconisa</SelectItem>
                <SelectItem value="elder">Presbítero</SelectItem>
                <SelectItem value="evangelist">Evangelista</SelectItem>
                <SelectItem value="pastor">Pastor</SelectItem>
                <SelectItem value="missionary">Missionário</SelectItem>
                <SelectItem value="leader">Líder</SelectItem>
                <SelectItem value="cooperator">Cooperador</SelectItem>
                <SelectItem value="auxiliary">Auxiliar</SelectItem>
              </SelectContent>
            </Select>
            {errors.ministerial_function && (
              <p className="text-sm text-red-500">{errors.ministerial_function.message}</p>
            )}
          </div>

          {/* Estado Civil */}
          <div className="space-y-2">
            <Label htmlFor="marital_status">
              Estado Civil <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('marital_status') || ''}
              onValueChange={(value) => setValue('marital_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Solteiro(a)</SelectItem>
                <SelectItem value="married">Casado(a)</SelectItem>
                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                <SelectItem value="widowed">Viúvo(a)</SelectItem>
              </SelectContent>
            </Select>
            {errors.marital_status && (
              <p className="text-sm text-red-500">{errors.marital_status.message}</p>
            )}
          </div>

          {/* Complemento de Perfil */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Informações complementares do perfil</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone {needsPhone && <span className="text-red-500">*</span>}
                </Label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <InputMask
                      mask="(99) 99999-9999"
                      value={field.value || ''}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                    >
                      {(inputProps: MaskedInputRenderProps) => (
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          {...inputProps}
                          name={field.name}
                        />
                      )}
                    </InputMask>
                  )}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {formattedCpf && (
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {formattedCpf}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este CPF foi informado no seu cadastro inicial e será usado automaticamente na criação do membro.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="birth_date">
                  Data de Nascimento {needsBirthDate && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('birth_date')}
                />
                {errors.birth_date && (
                  <p className="text-sm text-red-500">{errors.birth_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gênero {needsGender && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={watch('gender') || ''}
                  onValueChange={(value) => setValue('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender.message}</p>
                )}
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Informação:</strong> Os dados do seu perfil (nome, email, telefone, etc.) 
              serão utilizados automaticamente.{' '}
              {hasMissingProfileFields ? (
                <>
                  Complete os campos <span className="font-semibold">{profileFieldsText}</span>{' '}
                  para finalizar a conversão.
                </>
              ) : (
                <>
                  Você pode editá-los em <span className="font-semibold">Configurações → Perfil</span>.
                </>
              )}
              {!formattedCpf && (
                <span className="block mt-1 text-xs text-red-600">
                  Adicione seu CPF em <span className="font-semibold">Configurações → Perfil</span> para prosseguir.
                </span>
              )}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={convertMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Criando...' : 'Tornar-me Membro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
