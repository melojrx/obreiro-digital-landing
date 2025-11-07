import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { passwordResetService } from '@/services/passwordResetService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const EsqueciSenha: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await passwordResetService.requestReset({ email });
      
      setEmailSent(true);
      
      toast.success('Email enviado!', {
        description: response.message || 'Verifique sua caixa de entrada.',
      });
    } catch (err: any) {
      console.error('Erro ao solicitar redefinição:', err);
      
      const errorMessage = err?.response?.data?.email?.[0] 
        || err?.response?.data?.message 
        || 'Erro ao enviar email. Tente novamente.';
      
      setError(errorMessage);
      
      toast.error('Erro ao enviar email', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Enviado!</CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá
                instruções para redefinir sua senha.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-gray-600">
              <p>📧 <strong>Verifique sua caixa de entrada</strong></p>
              <p>O email pode levar alguns minutos para chegar.</p>
              
              <p className="mt-4">📂 <strong>Não recebeu?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifique a pasta de SPAM</li>
                <li>Aguarde alguns minutos</li>
                <li>Tente solicitar novamente</li>
              </ul>

              <p className="mt-4">⏰ <strong>Link expira em 1 hora</strong></p>
              <p>Por segurança, o link de redefinição é válido por apenas 1 hora.</p>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Solicitar Novamente
              </Button>

              <Button
                type="button"
                variant="ghost"
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Esqueceu sua senha?</CardTitle>
          <CardDescription className="text-center">
            Informe seu e-mail para receber instruções de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Digite o e-mail cadastrado em sua conta
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-900">
                💡 <strong>Como funciona:</strong>
                <br />
                Você receberá um e-mail com um link seguro para criar uma nova senha.
                O link expira em 1 hora.
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
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Link de Redefinição
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

export default EsqueciSenha;
