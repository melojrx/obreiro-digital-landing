import React, { useEffect } from 'react';
import { Shield, Lock, Users, FileText, Mail, AlertCircle, CheckCircle, Database, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PoliticaPrivacidade: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Política de Privacidade
            </h1>
            <p className="text-xl opacity-90">
              Obreiro Virtual - Sistema de Gestão Eclesiástica
            </p>
            <p className="text-sm mt-4 opacity-75">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <nav className="flex flex-wrap gap-4 py-4 text-sm">
            <a href="#introducao" className="text-blue-600 hover:text-blue-800">Introdução</a>
            <a href="#dados-coletados" className="text-blue-600 hover:text-blue-800">Dados Coletados</a>
            <a href="#uso-dados" className="text-blue-600 hover:text-blue-800">Uso dos Dados</a>
            <a href="#compartilhamento" className="text-blue-600 hover:text-blue-800">Compartilhamento</a>
            <a href="#seguranca" className="text-blue-600 hover:text-blue-800">Segurança</a>
            <a href="#direitos" className="text-blue-600 hover:text-blue-800">Seus Direitos</a>
            <a href="#cookies" className="text-blue-600 hover:text-blue-800">Cookies</a>
            <a href="#contato" className="text-blue-600 hover:text-blue-800">Contato</a>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Print Button */}
          <div className="flex justify-end mb-8">
            <Button onClick={handlePrint} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Imprimir Política
            </Button>
          </div>

          {/* Introduction */}
          <section id="introducao" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Lock className="h-6 w-6 text-blue-600" />
                  1. Introdução e Compromisso com a Privacidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  A presente Política de Privacidade detalha as práticas de tratamento de dados pessoais realizadas por 
                  <strong> 300 Soluções Tecnologia e Serviços</strong>, doravante referida como "Controlador", no âmbito 
                  da oferta de seu software de gestão para igrejas - Obreiro Virtual.
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este software tem como objetivo principal otimizar a administração e a comunicação de comunidades 
                    religiosas, facilitando o dia a dia de seus líderes e membros.
                  </AlertDescription>
                </Alert>
                <p className="text-gray-700">
                  O Controlador assume um compromisso inabalável com a privacidade e a proteção dos dados pessoais 
                  de seus usuários e dos membros das igrejas que utilizam a plataforma. Esta política foi elaborada 
                  em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong> 
                  e demais legislações aplicáveis.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. Definições Importantes da LGPD</CardTitle>
                <CardDescription>
                  Para facilitar a compreensão desta Política, apresentamos as definições dos termos-chave:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">Dados Pessoais</h4>
                    <p className="text-gray-600">
                      Qualquer informação relacionada a uma pessoa natural identificada ou identificável.
                    </p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold">Dados Pessoais Sensíveis</h4>
                    <p className="text-gray-600">
                      Categoria especial que inclui informações sobre <strong>convicção religiosa</strong>, 
                      origem racial ou étnica, opinião política, dados de saúde, entre outros.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold">Titular</h4>
                    <p className="text-gray-600">
                      A pessoa natural a quem se referem os dados pessoais que são objeto de tratamento.
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold">Consentimento</h4>
                    <p className="text-gray-600">
                      Manifestação livre, informada e inequívoca pela qual o titular concorda com o 
                      tratamento de seus dados pessoais para uma finalidade determinada.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Collection */}
          <section id="dados-coletados" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Database className="h-6 w-6 text-blue-600" />
                  3. Dados Pessoais Coletados, Finalidades e Bases Legais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Dados de Cadastro e Conta</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Dado</TableHead>
                          <TableHead>Finalidade</TableHead>
                          <TableHead>Base Legal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Nome, e-mail, telefone</TableCell>
                          <TableCell>Criação e gestão de conta</TableCell>
                          <TableCell>Execução de Contrato</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Nome da igreja, CNPJ</TableCell>
                          <TableCell>Identificação da organização</TableCell>
                          <TableCell>Execução de Contrato</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Endereço da igreja</TableCell>
                          <TableCell>Localização e comunicação</TableCell>
                          <TableCell>Execução de Contrato</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <strong>Atenção:</strong> A coleta de dados sobre <strong>convicção religiosa</strong> é 
                      considerada dado sensível e requer <strong>consentimento explícito</strong> do titular.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Gestão de Membros</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Dado</TableHead>
                          <TableHead>Finalidade</TableHead>
                          <TableHead>Base Legal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Dados pessoais básicos</TableCell>
                          <TableCell>Gestão de membros</TableCell>
                          <TableCell>Execução de Contrato</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-red-600 font-semibold">Convicção religiosa</TableCell>
                          <TableCell>Acompanhamento pastoral</TableCell>
                          <TableCell className="text-red-600 font-semibold">Consentimento Explícito</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Participação em atividades</TableCell>
                          <TableCell>Organização de eventos</TableCell>
                          <TableCell>Legítimo Interesse</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Dados de Crianças e Adolescentes
                    </h4>
                    <p className="text-gray-700">
                      O tratamento de dados de menores será realizado em seu <strong>melhor interesse</strong>, 
                      sempre com <strong>consentimento dos pais ou responsáveis legais</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Usage */}
          <section id="uso-dados" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Como Utilizamos Seus Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Prestação de Serviços
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Operacionalizar funcionalidades do software</li>
                      <li>Personalizar experiência do usuário</li>
                      <li>Melhorar recursos existentes</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Comunicação e Suporte
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Enviar notificações importantes</li>
                      <li>Fornecer suporte técnico</li>
                      <li>Comunicar com membros da igreja</li>
                    </ul>
                  </div>
                </div>
                <Alert className="mt-6">
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Plano Gratuito:</strong> Dados de navegação podem ser utilizados para exibir 
                    publicidade relevante, sempre com seu <strong>consentimento explícito</strong>.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </section>

          {/* Data Sharing */}
          <section id="compartilhamento" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. Compartilhamento de Dados com Terceiros</CardTitle>
                <CardDescription>
                  Seus dados são compartilhados apenas quando estritamente necessário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Exemplos</TableHead>
                      <TableHead>Finalidade</TableHead>
                      <TableHead>Base Legal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Hospedagem</TableCell>
                      <TableCell>AWS, Google Cloud</TableCell>
                      <TableCell>Armazenamento de dados</TableCell>
                      <TableCell>Execução de Contrato</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pagamentos</TableCell>
                      <TableCell>Stripe, PagSeguro</TableCell>
                      <TableCell>Processar transações</TableCell>
                      <TableCell>Execução de Contrato</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Publicidade</TableCell>
                      <TableCell>Google Ads, Meta</TableCell>
                      <TableCell>Anúncios (plano gratuito)</TableCell>
                      <TableCell className="font-semibold">Consentimento</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Autoridades</TableCell>
                      <TableCell>ANPD, Judiciário</TableCell>
                      <TableCell>Obrigações legais</TableCell>
                      <TableCell>Cumprimento Legal</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* Security */}
          <section id="seguranca" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-green-600" />
                  6. Segurança e Proteção dos Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Medidas Técnicas</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>Criptografia em trânsito e repouso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>Controle de acesso rigoroso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>Firewalls e monitoramento</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Medidas Administrativas</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>Testes de vulnerabilidade regulares</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>Privacy by Design</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>Auditorias de conformidade</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Rights */}
          <section id="direitos" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. Seus Direitos como Titular de Dados</CardTitle>
                <CardDescription>
                  A LGPD garante diversos direitos que você pode exercer a qualquer momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Confirmação da existência de tratamento',
                    'Acesso aos dados',
                    'Correção de dados incorretos',
                    'Anonimização ou bloqueio',
                    'Portabilidade dos dados',
                    'Eliminação dos dados',
                    'Informações sobre compartilhamento',
                    'Revogação do consentimento'
                  ].map((direito, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{direito}</span>
                    </div>
                  ))}
                </div>
                <Alert className="mt-6">
                  <AlertDescription>
                    Para exercer qualquer direito, entre em contato com nosso Encarregado de Dados (DPO) 
                    através do e-mail indicado ao final desta política.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </section>

          {/* Cookies */}
          <section id="cookies" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">9. Cookies e Tecnologias de Rastreamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Cookies Essenciais</h4>
                      <p className="text-sm text-gray-600">
                        Necessários para o funcionamento básico do site
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Cookies Funcionais</h4>
                      <p className="text-sm text-gray-600">
                        Permitem personalização e melhor experiência
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Cookies de Análise</h4>
                      <p className="text-sm text-gray-600">
                        Ajudam a entender como o site é utilizado
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 border-red-200 bg-red-50">
                      <h4 className="font-semibold mb-2">Cookies de Publicidade</h4>
                      <p className="text-sm text-gray-600">
                        Usados no plano gratuito (requer consentimento)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Mobile App */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  10. Aplicativo Móvel (Desenvolvimento Futuro)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Quando lançarmos nosso aplicativo móvel, ele poderá solicitar permissões adicionais:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>Acesso à internet e armazenamento local</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>Notificações push (com seu consentimento)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <span>Geolocalização (apenas com consentimento explícito)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section id="contato" className="mb-12">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-2xl">12. Contato do Encarregado de Dados (DPO)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Para todas as questões relacionadas à privacidade e proteção de dados pessoais, 
                    entre em contato com nosso Encarregado de Dados:
                  </p>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="font-semibold">Encarregado de Dados (DPO)</p>
                    <p className="text-gray-700">300 Soluções Tecnologia e Serviços</p>
                    <p className="text-blue-600">E-mail: privacidade@obreirovirtual.com.br</p>
                  </div>
                  <Alert>
                    <AlertDescription>
                      Responderemos suas solicitações de forma gratuita e no menor prazo possível, 
                      respeitando os prazos legais estabelecidos pela LGPD.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t">
            <p className="text-gray-600">
              © {new Date().getFullYear()} 300 Soluções Tecnologia e Serviços - Todos os direitos reservados
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;