import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Lock, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '@/config/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export const SecuritySettings = () => {
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: ''}));
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        if (passwordData.new_password !== passwordData.confirm_password) {
            setErrors({ confirm_password: 'As novas senhas não coincidem.'});
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/users/change-password/', passwordData);
            toast.success('Senha alterada com sucesso!');
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            const apiError = error as ApiError;
            const errorMsg = apiError.response?.data?.error || 'Erro ao alterar senha.';
            setErrors({ api: errorMsg });
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteAccount = async () => {
        try {
            await api.post('/users/delete-account/');
            toast.success('Sua conta foi desativada.');
            // Idealmente, o useAuth deveria lidar com o logout automático aqui
            window.location.href = '/login';
        } catch (error) {
            toast.error('Não foi possível desativar sua conta.');
        }
    };

    return (
        <Card className="shadow-lg border-slate-200/60">
            <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Segurança</CardTitle>
                <CardDescription>
                    Altere sua senha e gerencie a segurança da sua conta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Change Password Form */}
                <form onSubmit={handlePasswordChange} className="space-y-4 p-6 border rounded-lg bg-slate-50/50">
                    <h3 className="font-semibold text-lg flex items-center text-slate-700"><Lock className="h-5 w-5 mr-2" />Alterar Senha</h3>
                     {errors.api && <p className="text-sm text-red-600">{errors.api}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="old_password">Senha Antiga</Label>
                        <Input id="old_password" name="old_password" type="password" value={passwordData.old_password} onChange={handleInputChange} required className="py-6" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="new_password">Nova Senha</Label>
                            <Input id="new_password" name="new_password" type="password" value={passwordData.new_password} onChange={handleInputChange} required className="py-6"/>
                        </div>
                        <div>
                            <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                            <Input id="confirm_password" name="confirm_password" type="password" value={passwordData.confirm_password} onChange={handleInputChange} required className="py-6"/>
                             {errors.confirm_password && <p className="text-sm text-red-600">{errors.confirm_password}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading} className="py-6 px-8 bg-blue-600 hover:bg-blue-700">
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                    </div>
                </form>

                {/* Delete Account Section */}
                <div className="p-6 border border-red-200 bg-red-50 rounded-lg text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="mt-4 font-semibold text-xl text-red-800">Zona de Perigo</h3>
                    <p className="text-red-700 mt-2 text-sm max-w-md mx-auto">
                        A exclusão da sua conta é uma ação irreversível. Todos os dados da sua igreja serão desativados. Esta ação não pode ser desfeita.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="mt-6 font-bold py-3 px-6">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir minha conta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá desativar permanentemente sua conta
                            e remover seus dados de nossos servidores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                            Sim, excluir minha conta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}; 