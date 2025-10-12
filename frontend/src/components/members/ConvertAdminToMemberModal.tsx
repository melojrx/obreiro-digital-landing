import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { membersService } from '@/services/membersService';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, UserCheck, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  ministerial_function: z.string().min(1, 'Função ministerial é obrigatória'),
  marital_status: z.string().min(1, 'Estado civil é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface ConvertAdminToMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConvertAdminToMemberModal({
  isOpen,
  onClose,
}: ConvertAdminToMemberModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ministerial_function: 'member',
      marital_status: 'single',
    },
  });

  const convertMutation = useMutation({
    mutationFn: (data: FormData) => membersService.convertAdminToMember(data),
    onSuccess: (response) => {
      toast({
        title: 'Sucesso!',
        description: response.message || 'Você agora é um membro da igreja.',
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      reset();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Erro ao converter em membro';
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
    convertMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              value={watch('ministerial_function')}
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
              value={watch('marital_status')}
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

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Informação:</strong> Os dados do seu perfil (nome, email, telefone, etc.) 
              serão utilizados automaticamente. Você pode editá-los em{' '}
              <span className="font-semibold">Configurações → Perfil</span>.
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
