import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Building, Mail, Phone, MapPin, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getAddressByCEP, CEPAddress, APIError } from '@/services/utils';
import { z } from 'zod';

// Schema de validação Zod
const churchDataSchema = z.object({
  name: z.string().min(2, 'Nome da igreja deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  phone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
  zipcode: z.string()
    .regex(/^\d{5}-\d{3}$/, 'Formato: XXXXX-XXX')
    .min(1, 'CEP é obrigatório'),
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato: XX.XXX.XXX/XXXX-XX')
    .optional()
    .or(z.literal('')),
});

type ChurchDataFormData = z.infer<typeof churchDataSchema>;

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

const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

export const ChurchDataForm = () => {
    const { userChurch, updateChurchData, getUserChurch } = useAuth();
    const [formData, setFormData] = useState<ChurchDataFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        cnpj: ''
    });
    const [displayData, setDisplayData] = useState({
        phone: '',
        cnpj: '',
        zipcode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Carrega os dados da igreja do hook useAuth
        if (userChurch) {
            const churchData = {
                name: userChurch.name || '',
                email: userChurch.email || '',
                phone: userChurch.phone || '',
                address: userChurch.address || '',
                city: userChurch.city || '',
                state: userChurch.state || '',
                zipcode: userChurch.zipcode || '',
                cnpj: userChurch.cnpj || ''
            };
            
            setFormData(churchData);
            setDisplayData({
                phone: churchData.phone,
                cnpj: churchData.cnpj,
                zipcode: churchData.zipcode
            });
        } else {
            // Se userChurch for null, busca os dados
            getUserChurch();
        }
    }, [userChurch, getUserChurch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            const formatted = formatPhone(value);
            setDisplayData(prev => ({ ...prev, phone: formatted }));
            setFormData(prev => ({ ...prev, phone: formatted }));
        } else if (name === 'cnpj') {
            const formatted = formatCNPJ(value);
            setDisplayData(prev => ({ ...prev, cnpj: formatted }));
            setFormData(prev => ({ ...prev, cnpj: formatted }));
        } else if (name === 'zipcode') {
            const formatted = formatCEP(value);
            setDisplayData(prev => ({ ...prev, zipcode: formatted }));
            setFormData(prev => ({ ...prev, zipcode: formatted }));
            
            // Buscar CEP automaticamente
            if (formatted.replace(/\D/g, '').length === 8) {
                handleCepSearch(formatted);
            } else {
                setCepError(null);
            }
        } else if (name === 'state') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Limpar erro do campo quando o usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Função para buscar endereço por CEP
    const handleCepSearch = useCallback(async (cep: string) => {
        const onlyDigits = cep.replace(/\D/g, '');
        
        if (onlyDigits.length !== 8) {
            return;
        }

        setIsCepLoading(true);
        setCepError(null);
        try {
            const address: CEPAddress = await getAddressByCEP(onlyDigits);
            
            // Preencher os campos automaticamente
            setFormData(prev => ({
                ...prev,
                address: address.logradouro + (address.complemento ? `, ${address.complemento}` : '') + (address.bairro ? `, ${address.bairro}` : ''),
                city: address.localidade,
                state: address.uf,
                zipcode: address.cep
            }));
            
            setDisplayData(prev => ({
                ...prev,
                zipcode: address.cep
            }));
            
            toast.success('Endereço encontrado e preenchido automaticamente!');
        } catch (err) {
            if (err instanceof APIError) {
                setCepError(err.message);
                toast.error(err.message);
            } else {
                setCepError('Erro desconhecido ao buscar CEP.');
                toast.error('Erro desconhecido ao buscar CEP.');
            }
        } finally {
            setIsCepLoading(false);
        }
    }, []);

    const validateForm = (): boolean => {
        try {
            churchDataSchema.parse(formData);
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
            await updateChurchData(formData);
            toast.success('Dados da igreja atualizados com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar dados da igreja.');
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
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200/60">
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Building className="h-6 w-6 text-green-600" />
                    </div>
                    Dados da Igreja
                </CardTitle>
                <CardDescription className="text-slate-600">
                    Gerencie as informações de contato e endereço da sua igreja.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Building className="h-4 w-4 text-slate-500" />
                                Nome da Igreja *
                            </Label>
                            <Input 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                                className={`py-3 text-base transition-all duration-200 ${errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                placeholder="Digite o nome da igreja"
                            />
                            {getFieldError('name')}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                E-mail da Igreja *
                            </Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                value={formData.email} 
                                onChange={handleInputChange} 
                                className={`py-3 text-base transition-all duration-200 ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                placeholder="Digite o e-mail da igreja"
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
                                className={`py-3 text-base transition-all duration-200 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                placeholder="(XX) XXXXX-XXXX"
                                maxLength={15}
                            />
                            {getFieldError('phone')}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="cnpj" className="font-semibold text-slate-700 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-slate-500" />
                                CNPJ
                            </Label>
                            <Input 
                                id="cnpj" 
                                name="cnpj" 
                                value={displayData.cnpj} 
                                onChange={handleInputChange} 
                                className={`py-3 text-base transition-all duration-200 ${errors.cnpj ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                placeholder="XX.XXX.XXX/XXXX-XX"
                                maxLength={18}
                            />
                            {getFieldError('cnpj')}
                        </div>
                    </div>
                    
                    {/* Endereço com busca por CEP */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                        {/* CEP */}
                        <div className="space-y-2">
                            <Label htmlFor="zipcode" className="font-semibold text-slate-700 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                CEP *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="zipcode"
                                    name="zipcode"
                                    value={displayData.zipcode}
                                    onChange={handleInputChange}
                                    disabled={isLoading || isCepLoading}
                                    className={`py-3 text-base transition-all duration-200 ${errors.zipcode ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                    placeholder="XXXXX-XXX"
                                    maxLength={9}
                                />
                                {isCepLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                    </div>
                                )}
                            </div>
                            {cepError && (
                                <div className="flex items-center gap-1 text-red-500 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {cepError}
                                </div>
                            )}
                            {getFieldError('zipcode')}
                        </div>

                        {/* Cidade */}
                        <div className="space-y-2">
                            <Label htmlFor="city" className="font-semibold text-slate-700">Cidade *</Label>
                            <Input 
                                id="city" 
                                name="city" 
                                value={formData.city} 
                                onChange={handleInputChange} 
                                disabled={isLoading || isCepLoading}
                                className={`py-3 text-base transition-all duration-200 ${errors.city ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                placeholder="Cidade"
                            />
                            {getFieldError('city')}
                        </div>

                        {/* Estado */}
                        <div className="space-y-2">
                            <Label htmlFor="state" className="font-semibold text-slate-700">Estado (UF) *</Label>
                            <Input 
                                id="state" 
                                name="state" 
                                value={formData.state} 
                                onChange={handleInputChange} 
                                maxLength={2} 
                                disabled={isLoading || isCepLoading}
                                className={`py-3 text-base transition-all duration-200 ${errors.state ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                                placeholder="UF"
                            />
                            {getFieldError('state')}
                        </div>
                    </div>

                    {/* Endereço completo */}
                    <div className="space-y-2">
                        <Label htmlFor="address" className="font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            Endereço Completo *
                        </Label>
                        <Input 
                            id="address" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleInputChange} 
                            disabled={isLoading || isCepLoading}
                            className={`py-3 text-base transition-all duration-200 ${errors.address ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                            placeholder="Será preenchido automaticamente pelo CEP"
                        />
                        {getFieldError('address')}
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
                            disabled={isLoading || isCepLoading} 
                            className="py-3 px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-base hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
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