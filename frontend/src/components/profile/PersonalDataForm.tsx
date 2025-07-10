import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, User as UserIcon, Mail, Phone, Calendar as CalendarIcon, Info, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const PersonalDataForm = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        bio: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                birth_date: user.profile?.birth_date || '',
                gender: user.profile?.gender || '',
                bio: user.profile?.bio || ''
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <Card className="shadow-lg border-slate-200/60">
            <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Dados Pessoais</CardTitle>
                <CardDescription>
                    Atualize suas informações pessoais e de contato.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <Label htmlFor="full_name" className="font-semibold text-slate-600">Nome Completo</Label>
                            <div className="relative mt-2">
                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} className="pl-12 py-6 text-base" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email" className="font-semibold text-slate-600">E-mail</Label>
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
                        <div>
                            <Label htmlFor="birth_date" className="font-semibold text-slate-600">Data de Nascimento</Label>
                             <div className="relative mt-2">
                                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange} className="pl-12 py-6 text-base" />
                            </div>
                        </div>
                         <div>
                            <Label htmlFor="gender" className="font-semibold text-slate-600">Gênero</Label>
                             <div className="relative mt-2">
                                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                                    <SelectTrigger className="w-full pl-12 py-6 text-base">
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
                    </div>
                    <div>
                        <Label htmlFor="bio" className="font-semibold text-slate-600">Biografia</Label>
                        <div className="relative mt-2">
                           <Info className="absolute left-3.5 top-5 h-5 w-5 text-slate-400" />
                           <Textarea id="bio" name="bio" placeholder="Conte um pouco sobre você..." value={formData.bio} onChange={handleInputChange} rows={4} className="pl-12 pt-3 text-base"/>
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