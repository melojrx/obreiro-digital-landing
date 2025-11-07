import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { passwordResetService } from '@/services/passwordResetService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

const RedefinirSenha: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar token ao carregar a página
  useEffect(() => {
    if (!token) {
      setError('Token não fornecido. Verifique o link recebido por e-mail.');
      setValidatingToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        await passwordResetService.validateToken({ token });
        setTokenValid(true);
      } catch (err) {
        console.error('Token inválido:', err);
        setError('Token inválido ou expirado. Solicite um novo link de redefinição.');
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }
    
    // Verificar se tem pelo menos uma letra
    if (!/[a-zA-Z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra.';
    }
    
    // Verificar se tem pelo menos um número
    if (!/\d/.test(password)) {
      return 'A senha deve conter pelo menos um número.';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);

    // Validações
    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    if (!token) {
      setError('Token não encontrado.');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetService.confirmReset({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setResetSuccess(true);
      
      toast.success('Senha redefinida!', {
        description: response.message || 'Você já pode fazer login com sua nova senha.',
      });

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      console.error('Erro ao redefinir senha:', err);
      
      const errorData = (err as any)?.response?.data;
      const errorMessage = errorData?.new_password?.[0]
        || errorData?.confirm_password?.[0]
        || errorData?.token?.[0]
        || errorData?.message
        || 'Erro ao redefinir senha. Tente novamente.';
      
      setError(errorMessage);
      
      toast.error('Erro ao redefinir senha', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregando validação do token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validando link de redefinição...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Link Inválido</CardTitle>
            <CardDescription>
              Não foi possível validar o link de redefinição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Token Expirado ou Inválido</AlertTitle>
              <AlertDescription>
                {error || 'O link de redefinição pode ter expirado ou já foi utilizado.'}
              </AlertDescription>
            </Alert>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>O que fazer:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifique se copiou o link completo do e-mail</li>
                <li>Links expiram em 1 hora após serem gerados</li>
                <li>Cada link pode ser usado apenas uma vez</li>
                <li>Solicite um novo link se necessário</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => navigate('/esqueci-senha')}
              >
                Solicitar Novo Link
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sucesso
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                ✅ Senha atualizada com sucesso!
                <br />
                Você já pode fazer login com sua nova senha.
              </AlertDescription>
            </Alert>

            <div className="text-center text-sm text-gray-600">
              <p>Redirecionando para o login em 3 segundos...</p>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de redefinição
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Criar Nova Senha</CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Digite novamente sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-900">
                <strong>📋 Requisitos da senha:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mínimo de 8 caracteres</li>
                  <li>Pelo menos uma letra</li>
                  <li>Pelo menos um número</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Redefinindo...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Redefinir Senha
                </>
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Voltar ao Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedefinirSenha;
