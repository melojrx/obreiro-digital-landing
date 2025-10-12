import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { translateRole } from '@/utils/roleTranslations';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Church, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Users, 
  BarChart3,
  Calendar,
  MessageSquare,
  Shield,
  Building2
} from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'create-church'>('welcome');
  const [isCreatingChurch, setIsCreatingChurch] = useState(false);

  // Redirecionar se não precisar de setup (mas não durante a criação da igreja)
  useEffect(() => {
    if (user && !user.needs_church_setup && !isCreatingChurch) {
      navigate('/dashboard');
    }
  }, [user, navigate, isCreatingChurch]);

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      {currentStep === 'welcome' && (
        <WelcomeStep 
          user={user} 
          onNext={() => setCurrentStep('create-church')} 
        />
      )}
      
      {currentStep === 'create-church' && (
        <CreateChurchStep 
          user={user}
          onBack={() => setCurrentStep('welcome')}
          toast={toast}
          setIsCreatingChurch={setIsCreatingChurch}
        />
      )}
    </AppLayout>
  );
};

// =============================================
// STEP 1: WELCOME
// =============================================

interface WelcomeStepProps {
  user: any;
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ user, onNext }) => {
  const features = [
    {
      icon: Users,
      title: 'Gestão de Membros',
      description: 'Cadastre e gerencie todos os membros da sua igreja'
    },
    {
      icon: Calendar,
      title: 'Atividades e Cultos',
      description: 'Organize eventos, cultos e atividades ministeriais'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Inteligentes',
      description: 'Acompanhe estatísticas e crescimento da igreja'
    },
    {
      icon: MessageSquare,
      title: 'Comunicação',
      description: 'Envie mensagens e comunicados para os membros'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-fuchsia-600 rounded-2xl mb-6 shadow-xl">
          <Church className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Bem-vindo, {user.full_name?.split(' ')[0]}! 🎉
        </h1>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-semibold text-blue-600">
            {translateRole(user.intended_role)}
          </span>
        </div>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Você foi cadastrado como <strong>{translateRole(user.intended_role)}</strong>. 
          Isso significa que você terá acesso completo para gerenciar sua igreja no sistema.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-fuchsia-100 rounded-xl flex items-center justify-center">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-2xl p-8 shadow-xl text-white text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">
          Vamos começar sua jornada!
        </h2>
        <p className="text-blue-100 mb-6 max-w-xl mx-auto">
          Para começar a usar o sistema, precisamos que você cadastre sua igreja. 
          É rápido e fácil - leva apenas 2 minutos!
        </p>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          Criar Minha Igreja
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// =============================================
// STEP 2: CREATE CHURCH
// =============================================

interface CreateChurchStepProps {
  user: any;
  onBack: () => void;
  toast: any;
  setIsCreatingChurch: (value: boolean) => void;
}

const CreateChurchStep: React.FC<CreateChurchStepProps> = ({ user, onBack, toast, setIsCreatingChurch }) => {
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Estado para denominações
  const [denominations, setDenominations] = useState<Array<{id: number, name: string}>>([]);
  const [selectedDenominationId, setSelectedDenominationId] = useState<number | null>(null);
  const [loadingDenominations, setLoadingDenominations] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    cnpj: '',
    email: '',
    phone: '',
    zipcode: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const [searchingCep, setSearchingCep] = useState(false);

  // Buscar denominações se usuário não tiver intended_denomination
  useEffect(() => {
    if (!user.intended_denomination) {
      fetchDenominations();
    }
  }, [user]);

  const fetchDenominations = async () => {
    setLoadingDenominations(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/denominations/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDenominations(data.results || data);
      }
    } catch (err) {
      console.error('Erro ao buscar denominações:', err);
    } finally {
      setLoadingDenominations(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.phone || !formData.zipcode || !formData.city || !formData.state) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar denominação se usuário não tiver intended_denomination
    if (!user.intended_denomination && !selectedDenominationId) {
      setError('Por favor, selecione uma denominação');
      return;
    }

    setIsLoading(true);
    setIsCreatingChurch(true);  // Marcar que está criando igreja
    setError('');

    try {
      // Preparar dados para envio
      const payload = {
        ...formData,
        // Incluir denomination_id se usuário não tiver intended_denomination
        ...((!user.intended_denomination && selectedDenominationId) && {
          denomination_id: selectedDenominationId
        })
      };

      const response = await fetch('http://localhost:8000/api/v1/churches/create-first-church/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        toast({
          title: "Igreja criada com sucesso! 🎉",
          description: "Bem-vindo ao Obreiro Virtual.",
          duration: 3000,
        });
        
        // Recarregar todos os dados do usuário (incluindo igreja e needs_church_setup)
        try {
          await refreshUserData();
          console.log('✅ Dados do usuário e igreja recarregados após criação');
        } catch (error) {
          console.error('⚠️ Erro ao recarregar dados, mas continuando navegação:', error);
        }
        
        // Aguardar um momento para garantir que os dados foram atualizados
        // e então redirecionar para o dashboard
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              message: 'Igreja criada com sucesso! Bem-vindo ao Obreiro Virtual.'
            },
            replace: true  // Adicionar replace para não voltar para onboarding
          });
        }, 1500);
      } else {
        setError(data.error || 'Erro ao criar igreja. Tente novamente.');
        setIsCreatingChurch(false);  // Desmarcar em caso de erro
      }
    } catch (err) {
      console.error('Erro ao criar igreja:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
      setIsCreatingChurch(false);  // Desmarcar em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Igreja Criada com Sucesso! 🎉
          </h2>
          <p className="text-gray-600 mb-4">
            Redirecionando para o dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          ← Voltar
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-fuchsia-600 rounded-2xl shadow-lg">
            <Church className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Cadastre sua Igreja
            </h1>
            <p className="text-gray-600 mt-1">
              Preencha os dados abaixo para começar
            </p>
          </div>
        </div>
        
        {user.intended_denomination && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              Denominação: <strong>{user.intended_denomination.name}</strong>
            </span>
          </div>
        )}
        
        {!user.intended_denomination && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 mb-3 font-medium">
              Selecione sua denominação
            </p>
            {loadingDenominations ? (
              <div className="text-sm text-gray-600">Carregando denominações...</div>
            ) : (
              <select
                value={selectedDenominationId || ''}
                onChange={(e) => {
                  setSelectedDenominationId(Number(e.target.value));
                  setError('');
                }}
                className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
                aria-label="Selecione uma denominação"
                required
              >
                <option value="">Selecione uma denominação</option>
                {denominations.map(denom => (
                  <option key={denom.id} value={denom.id}>
                    {denom.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Nome da Igreja */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome da Igreja *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Igreja Batista Central"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Nome Abreviado e CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Abreviado
              </label>
              <input
                type="text"
                name="short_name"
                value={formData.short_name}
                onChange={handleChange}
                placeholder="Ex: IBC"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CNPJ (opcional)
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email da Igreja *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contato@igreja.com.br"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Endereço - CEP */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CEP *
            </label>
            <input
              type="text"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleChange}
              onBlur={(e) => searchCep(e.target.value)}
              placeholder="00000-000"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            {searchingCep && (
              <p className="text-sm text-blue-600 mt-1">Buscando endereço...</p>
            )}
          </div>

          {/* Endereço e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Endereço *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Rua, Avenida..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número
              </label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Complemento e Bairro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                name="complement"
                value={formData.complement}
                onChange={handleChange}
                placeholder="Apt, Sala..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bairro *
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="Centro"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="São Paulo"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="SP"
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Criando igreja...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Criar Igreja e Começar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;
