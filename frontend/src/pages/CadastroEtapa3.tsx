import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Edit2, CheckCircle, AlertCircle, User, Check, Crown, Star, Zap } from 'lucide-react';
import { getSubscriptionPlans, SubscriptionPlan } from '@/services/utils';

// Tipos para os dados, podemos mover para um arquivo de tipos depois
interface ChurchData {
  denomination_id?: number;
  user_zipcode?: string;
  user_address?: string;
  user_city?: string;
  user_state?: string;
  user_neighborhood?: string;
  user_number?: string;
  user_complement?: string;
  subscription_plan?: string;
}

const CadastroEtapa3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { finalizeRegistration, isLoading, error } = useAuth();

  // Dados da igreja e pessoais vindos das etapas anteriores
  const { churchData, personalData, rawFormData } = location.state || {};

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para formatar gênero
  const formatGender = (gender?: string): string => {
    if (!gender) return '-';
    const genderMap: { [key: string]: string } = {
      'M': 'Masculino',
      'F': 'Feminino',
      'O': 'Outro'
    };
    return genderMap[gender] || gender;
  };

  // Redirecionar se não houver dados das etapas anteriores
  useEffect(() => {
    let step1Data = personalData;
    let step2Data = churchData;
    
    // Tentar carregar do localStorage como fallback
    if (!step1Data) {
      try {
        const raw = localStorage.getItem('registration_step1_data');
        if (raw) step1Data = JSON.parse(raw);
      } catch {}
    }
    
    if (!step2Data) {
      try {
        const raw = localStorage.getItem('registration_step2_data');
        if (raw) step2Data = JSON.parse(raw);
      } catch {}
    }
    
    // Validar se temos dados essenciais das duas etapas
    if (!step1Data || !step1Data.email || !step1Data.full_name) {
      console.log('❌ CadastroEtapa3: Dados da etapa 1 não encontrados, redirecionando...');
      navigate('/cadastro');
      return;
    }
    
    if (!step2Data || !step2Data.denomination_id) {
      console.log('❌ CadastroEtapa3: Dados da etapa 2 não encontrados, redirecionando...');
      console.log('📦 step2Data recebido:', step2Data);
      navigate('/cadastro/etapa-2', { 
        state: { personalData: step1Data }
      });
      return;
    }
    
    console.log('✅ CadastroEtapa3: Dados validados!');
    console.log('📦 step1Data:', step1Data);
    console.log('📦 step2Data:', step2Data);
  }, [personalData, churchData, navigate]);

  // Buscar planos da API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const allPlans = await getSubscriptionPlans();
        setPlans(allPlans);
        // Selecionar plano básico por padrão
        const basicPlan = allPlans.find(p => p.id === 'basic');
        if (basicPlan) {
          setSelectedPlan(basicPlan);
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleFinalize = async () => {
    // Obter dados de todas as etapas (props ou localStorage)
    let step1Data = personalData;
    let step2Data = churchData;
    
    if (!step1Data) {
      try {
        const raw = localStorage.getItem('registration_step1_data');
        if (raw) step1Data = JSON.parse(raw);
      } catch {}
    }
    
    if (!step2Data) {
      try {
        const raw = localStorage.getItem('registration_step2_data');
        if (raw) step2Data = JSON.parse(raw);
      } catch {}
    }
    
    if (!step2Data || !selectedPlan || !step1Data) {
      console.error('❌ Dados incompletos para finalização:', { step1Data, step2Data, selectedPlan });
      return;
    }
    
    try {
      // Combinar TODOS os dados (pessoais + endereço + plano) para o novo endpoint
      const finalRegistrationData = {
        // Dados pessoais (etapa 1)
        email: step1Data.email,
        full_name: step1Data.full_name,
        phone: step1Data.phone,
        password: step1Data.password,
        birth_date: step1Data.birth_date,
        gender: step1Data.gender,
        cpf: step1Data.cpf,
        
        // Dados de endereço do usuário (etapa 2)
        denomination_id: step2Data.denomination_id,
        user_zipcode: step2Data.user_zipcode,
        user_address: step2Data.user_address,
        user_city: step2Data.user_city,
        user_state: step2Data.user_state,
        user_neighborhood: step2Data.user_neighborhood,
        user_number: step2Data.user_number,
        user_complement: step2Data.user_complement,
        
        // Plano (etapa 3)
        subscription_plan: selectedPlan.id,
        role: 'CHURCH_ADMIN'
      };
      
      console.log('📦 Dados finais para registro:', finalRegistrationData);
      
      await finalizeRegistration(finalRegistrationData);
      
      // Limpar dados persistidos das etapas anteriores
      try {
        localStorage.removeItem('registration_step1_data');
        localStorage.removeItem('registration_step2_data');
      } catch {}
      
      setSuccess(true);
      
      // Redirecionar para onboarding para configurar a igreja
      // Independente do plano, usuário precisa criar a igreja primeiro
      setTimeout(() => {
        navigate('/onboarding', { 
          state: { 
            successMessage: 'Cadastro finalizado com sucesso! Agora vamos configurar sua igreja.',
            plan: selectedPlan.id
          },
          replace: true
        });
      }, 2000);
    } catch (error) {
      console.error("Erro ao finalizar cadastro", error);
    }
  };

  const handleBack = () => {
    navigate('/cadastro/etapa-2', { 
      state: { 
        personalData: personalData,
        savedChurchData: churchData
      } 
    });
  };

  const DataItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value || '-'}</p>
    </div>
  );

  const PlanCard = ({ plan, isSelected, onSelect }: { 
    plan: SubscriptionPlan, 
    isSelected: boolean, 
    onSelect: () => void 
  }) => {
    const isBasic = plan.id === 'basic';
    const isProfessional = plan.id === 'professional';
    const isEnterprise = plan.id === 'enterprise';
    const isDenomination = plan.id === 'denomination';

    const getIcon = () => {
      if (isBasic) return <Check className="h-6 w-6" />;
      if (isProfessional) return <Star className="h-6 w-6" />;
      if (isEnterprise) return <Crown className="h-6 w-6" />;
      if (isDenomination) return <Zap className="h-6 w-6" />;
      return <Check className="h-6 w-6" />;
    };

    const getPrice = () => {
      if (isBasic) return 'R$ 0';
      if (isProfessional) return 'R$ 99';
      if (isEnterprise) return 'R$ 299';
      if (isDenomination) return 'Consultar';
      return plan.price;
    };

    const getPeriod = () => {
      if (isBasic) return 'gratuito';
      if (isProfessional || isEnterprise) return '/mês';
      return '';
    };

    const getBadge = () => {
      if (isProfessional) return 'Mais Popular';
      if (isEnterprise) return 'Melhor Valor';
      return null;
    };

    return (
      <div
        onClick={onSelect}
        className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-blue-300'
        } ${isProfessional ? 'ring-2 ring-blue-200' : ''}`}
      >
        {getBadge() && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {getBadge()}
            </span>
          </div>
        )}
        
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {getIcon()}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          
          <div className="mb-4">
            <span className="text-3xl font-bold text-gray-900">{getPrice()}</span>
            <span className="text-gray-500 ml-1">{getPeriod()}</span>
          </div>
          
          <ul className="space-y-2 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          
          <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
            isSelected 
              ? 'bg-blue-600 border-blue-600' 
              : 'border-gray-300'
          }`}>
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      </div>
    );
  };

  // Se finalização foi bem-sucedida, mostrar mensagem
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Cadastro finalizado com sucesso!
            </h2>
            <p className="text-slate-600 mb-4">
              {selectedPlan?.id === 'basic' 
                ? 'Redirecionando para dashboard...'
                : 'Redirecionando para pagamento...'
              }
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-6xl">
        {/* Back to Previous Step */}
        <button 
          onClick={handleBack}
          className="inline-flex items-center text-slate-600 hover:text-blue-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para etapa anterior
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-slate-800 mb-2">
            <span className="text-blue-800">Obreiro</span>
            <span className="text-fuchsia-600">Virtual</span>
          </div>
          <div className="bg-blue-600 text-white py-6 px-8 rounded-t-2xl">
            <h1 className="text-2xl font-bold mb-2">Cadastro - Etapa 3 de 3</h1>
            <p className="text-blue-100">Confirmação e finalização</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600 font-medium">Dados Pessoais</span>
            </div>
            <div className="w-12 h-px bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600 font-medium">Denominação</span>
            </div>
            <div className="w-12 h-px bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Plano</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-8 shadow-xl rounded-2xl border border-white/20">
          {/* Header da Seção */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              Escolha seu plano
            </h2>
            <p className="text-slate-600">
              Selecione o plano ideal para sua igreja e confirme seus dados
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* Planos de Assinatura */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-blue-800 text-center">
                Planos de Assinatura
              </h3>
              
              {isLoadingPlans ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isSelected={selectedPlan?.id === plan.id}
                      onSelect={() => setSelectedPlan(plan)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Resumo dos Dados - Colapsível */}
            <div className="border-t border-slate-200 pt-8">
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-800">
                      Resumo dos seus dados
                    </h3>
                    <span className="text-sm text-blue-600 group-open:hidden">
                      Clique para revisar
                    </span>
                    <span className="text-sm text-blue-600 hidden group-open:inline">
                      Ocultar detalhes
                    </span>
                  </div>
                </summary>
                
                <div className="mt-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-800 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Dados Pessoais
                      </h4>
                      <button 
                        onClick={() => navigate('/cadastro', { state: { 
                          prefill: personalData,
                          savedChurchData: churchData 
                        } })}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                      <DataItem label="Nome Completo" value={personalData?.full_name} />
                      <DataItem label="E-mail" value={personalData?.email} />
                      <DataItem label="Telefone" value={personalData?.phone} />
                      <DataItem label="Data de Nascimento" value={formatDate(personalData?.birth_date)} />
                      <DataItem label="Gênero" value={formatGender(personalData?.gender)} />
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1 py-3 px-4 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Voltar
              </button>
              {/* Botão finalizar */}
              <button
                onClick={handleFinalize}
                disabled={isLoading || !selectedPlan}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    Finalizando...
                  </>
                ) : (
                  selectedPlan?.id === 'basic' ? 'Começar gratuitamente' : 'Continuar para pagamento'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              SSL Seguro
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              LGPD Compliance
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Suporte 24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadastroEtapa3; 