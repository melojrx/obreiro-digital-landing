import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Building, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getAddressByCEP, CEPAddress, APIError } from '@/services/utils';

export const ChurchDataForm = () => {
    const { userChurch, updateChurchData, getUserChurch } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipcode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);

    useEffect(() => {
        // Carrega os dados da igreja do hook useAuth
        if (userChurch) {
            setFormData({
                name: userChurch.name || '',
                email: userChurch.email || '',
                phone: userChurch.phone || '',
                address: userChurch.address || '',
                city: userChurch.city || '',
                state: userChurch.state || '',
                zipcode: userChurch.zipcode || ''
            });
        } else {
            // Se userChurch for null, busca os dados
            getUserChurch();
        }
    }, [userChurch, getUserChurch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            
            toast.success('Endereço encontrado e preenchido automaticamente!');
        } catch (err) {
            if (err instanceof APIError) {
                setCepError(err.message);
            } else {
                setCepError('Erro desconhecido ao buscar CEP.');
            }
        } finally {
            setIsCepLoading(false);
        }
    }, []);

    // Função para tratar mudanças no campo CEP
    const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Formatação do CEP
        const formattedCep = value
            .replace(/\D/g, '') // Remove tudo que não é dígito
            .replace(/(\d{5})(\d)/, '$1-$2') // Adiciona hífen
            .substr(0, 9); // Limita a 9 caracteres
        
        setFormData(prev => ({ ...prev, zipcode: formattedCep }));
        
        if (formattedCep.replace(/\D/g, '').length === 8) {
            handleCepSearch(formattedCep);
        } else {
            setCepError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <Card className="shadow-lg border-slate-200/60">
            <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Dados da Igreja</CardTitle>
                <CardDescription>
                    Gerencie as informações de contato e endereço da sua igreja.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <Label htmlFor="name" className="font-semibold text-slate-600">Nome da Igreja</Label>
                             <div className="relative mt-2">
                                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="pl-12 py-6 text-base" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email" className="font-semibold text-slate-600">E-mail da Igreja</Label>
                             <div className="relative mt-2">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-12 py-6 text-base" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="phone" className="font-semibold text-slate-600">Telefone</Label>
                             <div className="relative mt-2">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="pl-12 py-6 text-base" />
                            </div>
                        </div>
                    </div>
                    {/* Endereço com busca por CEP */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {/* CEP */}
                        <div>
                            <Label htmlFor="zipcode" className="font-semibold text-slate-600">
                                CEP*
                            </Label>
                            <div className="relative mt-2">
                                <Input
                                    id="zipcode"
                                    name="zipcode"
                                    value={formData.zipcode}
                                    onChange={handleCEPChange}
                                    disabled={isLoading || isCepLoading}
                                    className="py-6 text-base"
                                    placeholder="Digite o CEP"
                                />
                                {isCepLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>
                            {cepError && <p className="mt-1 text-sm text-red-600">{cepError}</p>}
                        </div>

                        {/* Cidade */}
                        <div>
                            <Label htmlFor="city" className="font-semibold text-slate-600">Cidade</Label>
                            <Input 
                                id="city" 
                                name="city" 
                                value={formData.city} 
                                onChange={handleInputChange} 
                                disabled={isLoading || isCepLoading}
                                className="mt-2 py-6" 
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <Label htmlFor="state" className="font-semibold text-slate-600">Estado (UF)</Label>
                            <Input 
                                id="state" 
                                name="state" 
                                value={formData.state} 
                                onChange={handleInputChange} 
                                maxLength={2} 
                                disabled={isLoading || isCepLoading}
                                className="mt-2 py-6" 
                            />
                        </div>
                    </div>

                    {/* Endereço completo */}
                    <div>
                        <Label htmlFor="address" className="font-semibold text-slate-600">Endereço Completo</Label>
                        <div className="relative mt-2">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input 
                                id="address" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleInputChange} 
                                disabled={isLoading || isCepLoading}
                                className="pl-12 py-6 text-base" 
                                placeholder="Será preenchido automaticamente pelo CEP"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading} className="py-6 px-8 bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-bold text-lg hover:from-blue-700 hover:to-fuchsia-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg">
                            <Save className="h-5 w-5 mr-3" />
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}; 