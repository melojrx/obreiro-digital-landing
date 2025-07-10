import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Save, 
    Shield, 
    Lock, 
    Eye, 
    EyeOff, 
    AlertCircle,
    CheckCircle,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

// Schema de validação Zod para senha
const passwordSchema = z.object({
    current_password: z.string().min(1, 'Senha atual é obrigatória'),
    new_password: z.string()
        .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
        .regex(/(?=.*[a-z])/, 'Deve conter pelo menos uma letra minúscula')
        .regex(/(?=.*[A-Z])/, 'Deve conter pelo menos uma letra maiúscula')
        .regex(/(?=.*\d)/, 'Deve conter pelo menos um número'),
    confirm_password: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Senhas não coincidem",
    path: ["confirm_password"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const SecuritySettings = () => {
    const { user, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [passwordData, setPasswordData] = useState<PasswordFormData>({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        
        // Limpar erro do campo quando o usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validatePasswordForm = (): boolean => {
        try {
            passwordSchema.parse(passwordData);
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

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validatePasswordForm()) {
            toast.error('Por favor, corrija os erros no formulário');
            return;
        }
        
        setIsLoading(true);
        try {
            // TODO: Implementar endpoint de mudança de senha
            // await authService.changePassword(passwordData);
            toast.success('Senha alterada com sucesso!');
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            toast.error('Erro ao alterar senha.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            toast.error('Digite sua senha para confirmar a exclusão');
            return;
        }

        setIsDeletingAccount(true);
        try {
            await deleteAccount(deletePassword);
            toast.success('Conta deletada com sucesso');
            navigate('/');
        } catch (error) {
            toast.error('Erro ao deletar conta. Verifique sua senha.');
            console.error(error);
        } finally {
            setIsDeletingAccount(false);
            setShowDeleteDialog(false);
            setDeletePassword('');
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

    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/(?=.*[a-z])/.test(password)) strength++;
        if (/(?=.*[A-Z])/.test(password)) strength++;
        if (/(?=.*\d)/.test(password)) strength++;
        if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
        const labels = ['Muito fraca', 'Fraca', 'Regular', 'Forte', 'Muito forte'];
        
        return {
            strength,
            color: colors[strength - 1] || 'bg-gray-300',
            label: labels[strength - 1] || 'Muito fraca'
        };
    };

    const passwordStrength = getPasswordStrength(passwordData.new_password);

    return (
        <div className="space-y-6">
            {/* Alterar Senha */}
            <Card className="shadow-lg border-slate-200/60">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-200/60">
                    <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        Segurança
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                        Altere sua senha para manter sua conta segura.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="current_password" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-slate-500" />
                                Senha Atual *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    name="current_password"
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    className={`py-3 text-base pr-12 transition-all duration-200 ${errors.current_password ? 'border-red-500 focus:border-red-500' : 'focus:border-red-500'}`}
                                    placeholder="Digite sua senha atual"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {getFieldError('current_password')}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new_password" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-slate-500" />
                                Nova Senha *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    name="new_password"
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    className={`py-3 text-base pr-12 transition-all duration-200 ${errors.new_password ? 'border-red-500 focus:border-red-500' : 'focus:border-red-500'}`}
                                    placeholder="Digite sua nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {getFieldError('new_password')}
                            
                            {/* Indicador de força da senha */}
                            {passwordData.new_password && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-slate-600">
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 space-y-1">
                                        <div className="flex items-center gap-2">
                                            {passwordData.new_password.length >= 8 ? 
                                                <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                <AlertCircle className="h-3 w-3 text-red-500" />
                                            }
                                            Pelo menos 8 caracteres
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/(?=.*[a-z])/.test(passwordData.new_password) ? 
                                                <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                <AlertCircle className="h-3 w-3 text-red-500" />
                                            }
                                            Pelo menos uma letra minúscula
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/(?=.*[A-Z])/.test(passwordData.new_password) ? 
                                                <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                <AlertCircle className="h-3 w-3 text-red-500" />
                                            }
                                            Pelo menos uma letra maiúscula
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/(?=.*\d)/.test(passwordData.new_password) ? 
                                                <CheckCircle className="h-3 w-3 text-green-500" /> : 
                                                <AlertCircle className="h-3 w-3 text-red-500" />
                                            }
                                            Pelo menos um número
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password" className="font-semibold text-slate-700 flex items-center gap-2">
                                <Lock className="h-4 w-4 text-slate-500" />
                                Confirmar Nova Senha *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordData.confirm_password}
                                    onChange={handlePasswordChange}
                                    className={`py-3 text-base pr-12 transition-all duration-200 ${errors.confirm_password ? 'border-red-500 focus:border-red-500' : 'focus:border-red-500'}`}
                                    placeholder="Confirme sua nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {getFieldError('confirm_password')}
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
                                className="py-3 px-8 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold text-base hover:from-red-700 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <Save className="h-5 w-5 mr-2" />
                                {isLoading ? 'Salvando...' : 'Alterar Senha'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="shadow-lg border-red-200 bg-red-50/30">
                <CardHeader className="bg-gradient-to-r from-red-100 to-red-200 border-b border-red-200">
                    <CardTitle className="text-2xl text-red-800 flex items-center gap-3">
                        <div className="p-2 bg-red-200 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-700" />
                        </div>
                        Zona de Perigo
                    </CardTitle>
                    <CardDescription className="text-red-700">
                        Ações irreversíveis que afetam permanentemente sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                <Trash2 className="h-5 w-5" />
                                Deletar Conta
                            </h3>
                            <p className="text-red-700 text-sm mb-4">
                                Esta ação é <strong>irreversível</strong>. Todos os seus dados serão permanentemente removidos, incluindo:
                            </p>
                            <ul className="text-red-700 text-sm space-y-1 mb-4 ml-4">
                                <li>• Dados pessoais e perfil</li>
                                <li>• Histórico de atividades</li>
                                <li>• Configurações personalizadas</li>
                                <li>• Todas as informações associadas à sua conta</li>
                            </ul>
                            <Alert className="border-red-300 bg-red-50 mb-4">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    <strong>Atenção:</strong> Esta ação não pode ser desfeita. Certifique-se de que realmente deseja deletar sua conta.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <div className="flex justify-end">
                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="destructive" 
                                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <Trash2 className="h-5 w-5 mr-2" />
                                        Deletar Minha Conta
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-md">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-red-800 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5" />
                                            Confirmar Exclusão
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-600">
                                            Tem certeza de que deseja deletar sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente removidos.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    
                                    <div className="space-y-4">
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-800 text-sm font-medium">
                                                Digite sua senha para confirmar:
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="delete_password" className="font-semibold text-slate-700">
                                                Senha *
                                            </Label>
                                            <Input
                                                id="delete_password"
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                placeholder="Digite sua senha"
                                                className="focus:border-red-500"
                                            />
                                        </div>
                                    </div>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel 
                                            onClick={() => {
                                                setShowDeleteDialog(false);
                                                setDeletePassword('');
                                            }}
                                        >
                                            Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            disabled={isDeletingAccount || !deletePassword.trim()}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            {isDeletingAccount ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Deletando...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Deletar Conta
                                                </>
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}; 