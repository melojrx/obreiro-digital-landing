/**
 * Página de Sucesso do Registro de Visitante
 * Exibida após o registro bem-sucedido via QR Code
 */

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Heart, Users, Calendar, Phone, Mail } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

const RegistroSucesso: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const visitorId = searchParams.get('visitor');
  const branchName = searchParams.get('branch');

  useEffect(() => {
    // Se não tiver os parâmetros necessários, redirecionar para home
    if (!visitorId || !branchName) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visitorId, branchName, navigate]);

  if (!visitorId || !branchName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h1 className="text-xl font-bold text-green-700">Registro Realizado!</h1>
              <p className="text-sm text-gray-600 text-center">
                Redirecionando...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Card principal de sucesso */}
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Registro Realizado com Sucesso!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Seja muito bem-vindo(a) à {decodeURIComponent(branchName)}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Seu registro foi confirmado!</strong> Nossa equipe pastoral 
                entrará em contato em breve para dar as boas-vindas e esclarecer 
                qualquer dúvida que você possa ter.
              </p>
            </div>
            
            <p className="text-sm text-gray-600">
              ID do Registro: <strong className="font-mono">#{visitorId}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Próximos passos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Próximos Passos</span>
            </CardTitle>
            <CardDescription>
              Veja o que acontece a seguir em sua jornada conosco
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Contato Inicial</h4>
                  <p className="text-sm text-gray-600">
                    Nossa equipe entrará em contato nas próximas 24-48 horas para 
                    dar as boas-vindas e conhecer melhor suas necessidades.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Acompanhamento Pastoral</h4>
                  <p className="text-sm text-gray-600">
                    Se você demonstrou interesse em oração ou grupos de crescimento, 
                    nossos pastores e líderes estarão prontos para ajudar.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Integração na Comunidade</h4>
                  <p className="text-sm text-gray-600">
                    Apresentaremos as atividades, ministérios e grupos que podem 
                    ser do seu interesse para uma integração completa.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Fique à Vontade para Entrar em Contato</span>
            </CardTitle>
            <CardDescription>
              Se tiver qualquer dúvida ou precisar de ajuda imediata
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">Telefone</p>
                  <p className="text-sm text-gray-600">
                    Entre em contato diretamente com nossa secretaria
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">E-mail</p>
                  <p className="text-sm text-gray-600">
                    Envie suas dúvidas por e-mail
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Estamos aqui por você</h4>
                  <p className="text-sm text-blue-700">
                    Nossa missão é cuidar de cada pessoa que Deus nos confia. 
                    Não hesite em nos procurar sempre que precisar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            onClick={() => window.location.href = '/'}
            className="flex-1"
            variant="outline"
          >
            <Users className="mr-2 h-4 w-4" />
            Conhecer Mais sobre a Igreja
          </Button>
          
          <Button
            onClick={() => {
              // Tenta fechar a janela se foi aberta por script, senão redireciona
              try {
                window.close();
                // Se chegou aqui, window.close() não funcionou
                setTimeout(() => {
                  window.location.href = '/';
                }, 100);
              } catch (error) {
                // Fallback: redirecionar para home
                window.location.href = '/';
              }
            }}
            className="flex-1"
          >
            Finalizar
          </Button>
        </div>

        {/* Rodapé com informações adicionais */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Este registro foi realizado via QR Code em {new Date().toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500">
                Seus dados são tratados com total confidencialidade conforme nossa política de privacidade
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistroSucesso;