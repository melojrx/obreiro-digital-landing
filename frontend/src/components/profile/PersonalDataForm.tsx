import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User as UserIcon, Mail, Phone, Calendar as CalendarIcon, Info, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

// Schema de validação Zod
const personalDataSchema = z.object({
  full_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  phone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F', 'O', 'N', '']).optional(),
  bio: z.string().max(500, 'Biografia deve ter no máximo 500 caracteres').optional(),
});

type PersonalDataFormData = z.infer<typeof personalDataSchema>;

// Funções de formatação
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const formatDate = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

const convertDateToISO = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 10) return '';
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const convertDateFromISO = (isoStr: string): string => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-');
  return `${day}/${month}/${year}`;
};

export const PersonalDataForm = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<PersonalDataFormData>({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        bio: ''
    });
    const [displayData, setDisplayData] = useState({
        phone: '',
        birth_date: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            const userData = {
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                birth_date: user.profile?.birth_date || '',
                gender: (user.profile?.gender || '') as '' | 'M' | 'F' | 'O' | 'N',
                bio: user.profile?.bio || ''
            };
            
            setFormData(userData);
            setDisplayData({
                phone: userData.phone,
                birth_date: userData.birth_date ? convertDateFromISO(userData.birth_date) : ''
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            const formatted = formatPhone(value);
            setDisplayData(prev => ({ ...prev, phone: formatted }));
            setFormData(prev => ({ ...prev, phone: formatted }));
        } else if (name === 'birth_date') {
            const formatted = formatDate(value);
            setDisplayData(prev => ({ ...prev, birth_date: formatted }));
            setFormData(prev => ({ ...prev, birth_date: convertDateToISO(formatted) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Limpar erro do campo quando o usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Limpar erro do campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        try {
            personalDataSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path.length > 0) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Por favor, corrija os erros no formulário');
            return;
        }
        
        setIsLoading(true);
        try {
            await updateUser(formData); 
            toast.success('Dados pessoais atualizados com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar dados pessoais.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldError = (fieldName: string) => {
        return errors[fieldName] ? (
            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                {errors[fieldName]}
            </div>
        ) : null;
    };

    return (
        <Card className="shadow-lg border-slate-200/60">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200/60">
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    Dados Pessoais
                </CardTitle>
                <CardDescription className="text-slate-600">
                    Atualize suas informações pessoais e de contato.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="font-semibold text-slate-700 flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-slate-500" />
                                Nome Completo *
                            </Label>
                            <Input 
                                id="full_name" 
                                name="full_name" 
                                value={formData.full_name} 
                                onChange={handleInputChange} 
                                className={`py-3 text-base transition-all duration-200 ${errors.full_name ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                                placeholder="Digite seu nome completo"
                            />
                            {getFieldError('full_name')}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                E-mail *
                            </Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                value={formData.email} 
                                onChange={handleInputChange} 
                                className={`py-3 text-base transition-all duration-200 ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                                placeholder="Digite seu e-mail"
                            />
                            {getFieldError('email')}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-500" />
                                Telefone
                            </Label>
                            <Input 
                                id="phone" 
                                name="phone" 
                                value={displayData.phone} 
                                onChange={handleInputChange} 
                                className={`py-3 text-base transition-all duration-200 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                                placeholder="(XX) XXXXX-XXXX"
                                maxLength={15}
                            />
                            {getFieldError('phone')}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="birth_date" className="font-semibold text-slate-700 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-slate-500" />
                                Data de Nascimento
                            </Label>
                            <Input 
                                id="birth_date" 
                                name="birth_date" 
                                value={displayData.birth_date} 
                                onChange={handleInputChange} 
                                className="py-3 text-base focus:border-blue-500 transition-all duration-200"
                                placeholder="DD/MM/AAAA"
                                maxLength={10}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="gender" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                Gênero
                            </Label>
                            <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                                <SelectTrigger className="py-3 text-base focus:border-blue-500 transition-all duration-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">Masculino</SelectItem>
                                    <SelectItem value="F">Feminino</SelectItem>
                                    <SelectItem value="O">Outro</SelectItem>
                                    <SelectItem value="N">Não informar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="bio" className="font-semibold text-slate-700 flex items-center gap-2">
                            <Info className="h-4 w-4 text-slate-500" />
                            Biografia
                            <span className="text-sm font-normal text-slate-500">
                                ({formData.bio?.length || 0}/500)
                            </span>
                        </Label>
                        <Textarea 
                            id="bio" 
                            name="bio" 
                            placeholder="Conte um pouco sobre você..." 
                            value={formData.bio} 
                            onChange={handleInputChange} 
                            rows={4} 
                            className={`text-base focus:border-blue-500 transition-all duration-200 ${errors.bio ? 'border-red-500 focus:border-red-500' : ''}`}
                            maxLength={500}
                        />
                        {getFieldError('bio')}
                    </div>
                    
                    {Object.keys(errors).length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                Por favor, corrija os erros destacados no formulário.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <Button 
                            type="submit" 
                            disabled={isLoading} 
                            className="py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Save className="h-5 w-5 mr-2" />
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}; 