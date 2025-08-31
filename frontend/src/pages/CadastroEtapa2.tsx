import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Building, Mail, Phone, MapPin, User, FileText, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Denomination } from '../services/auth';
import { getAddressByCEP, CEPAddress, APIError } from '@/services/utils';

const CadastroEtapa2 = () => {
  const [formData, setFormData] = useState({
    denomination_id: '',
    church_name: '',
    church_cnpj: '',
    church_email: '',
    church_phone: '',
    branch_name: '',
    church_address: '',
    pastor_name: '',
    church_zipcode: '',
    church_city: '',
    church_state: '',
    church_neighborhood: '',
    church_number: '',
    church_complement: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [isDenominationsLoading, setIsDenominationsLoading] = useState(true);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const { savePartialProfile, getAvailableDenominations, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { personalData, savedChurchData } = location.state || {};

  // Verificar se há dados da etapa 1 (navigation state ou localStorage)
  useEffect(() => {
    let step1Data = personalData;
    
    if (!step1Data) {
      // Tentar carregar do localStorage como fallback
      try {
        const raw = localStorage.getItem('registration_step1_data');
        if (raw) step1Data = JSON.parse(raw);
      } catch {}
    }
    
    // Se ainda não há dados da etapa 1, redirecionar
    if (!step1Data || !step1Data.email || !step1Data.full_name) {
      console.log('❌ CadastroEtapa2: Dados da etapa 1 não encontrados, redirecionando...');
      navigate('/cadastro');
      return;
    }
  }, [personalData, navigate]);

  // Carregar dados salvos (navigation state ou localStorage)
  useEffect(() => {
    let restored: any = null;
    try {
      const raw = localStorage.getItem('registration_step2_data');
      if (raw) restored = JSON.parse(raw);
    } catch {}

    const source = savedChurchData || restored;
    if (source) {
      setFormData(prev => ({
        ...prev,
        denomination_id: source.denomination_id?.toString() || source.denomination_id || '',
        church_name: source.church_name || '',
        church_cnpj: source.church_cnpj || '',
        church_email: source.church_email || '',
        church_phone: source.church_phone || '',
        branch_name: source.branch_name || '',
        church_address: source.church_address || '',
        pastor_name: source.pastor_name || '',
        church_zipcode: source.church_zipcode || '',
        church_city: source.church_city || '',
        church_state: source.church_state || '',
        church_neighborhood: source.church_neighborhood || '',
        church_number: source.church_number || '',
        church_complement: source.church_complement || ''
      }));
    }
  }, [savedChurchData]);

  // Carregar denominações
  useEffect(() => {
    const loadDenominations = async () => {
      try {
        setIsDenominationsLoading(true);
        const data = await getAvailableDenominations();
        setDenominations(data);
      } catch (err) {
        console.error('Erro ao carregar denominações:', err);
      } finally {
        setIsDenominationsLoading(false);
      }
    };

    loadDenominations();
  }, [getAvailableDenominations]);

  // Limpar erro da API quando campos mudarem
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Persistir snapshot local da etapa 2
    try {
      const snapshot = { ...formData, [name]: value };
      localStorage.setItem('registration_step2_data', JSON.stringify(snapshot));
    } catch {}
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.denomination_id) {
      newErrors.denomination_id = 'Denominação é obrigatória';
    }

    if (!formData.church_name) {
      newErrors.church_name = 'Nome da igreja é obrigatório';
    } else if (formData.church_name.length < 3) {
      newErrors.church_name = 'Nome da igreja deve ter pelo menos 3 caracteres';
    }

    if (formData.church_cnpj && formData.church_cnpj.trim() !== '') {
      // Só valida se o CNPJ foi preenchido
      if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.church_cnpj)) {
        newErrors.church_cnpj = 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX';
      }
    }

    if (!formData.church_email) {
      newErrors.church_email = 'E-mail da igreja é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.church_email)) {
      newErrors.church_email = 'E-mail inválido';
    }

    if (!formData.church_phone) {
      newErrors.church_phone = 'Telefone da igreja é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.church_phone)) {
      newErrors.church_phone = 'Telefone deve estar no formato (XX) XXXXX-XXXX';
    }

    if (!formData.church_address) {
      newErrors.church_address = 'Endereço é obrigatório';
    } else if (formData.church_address.length < 10) {
      newErrors.church_address = 'Endereço deve ser mais detalhado';
    }

    if (!formData.pastor_name) {
      newErrors.pastor_name = 'Nome do pastor responsável é obrigatório';
    } else if (formData.pastor_name.length < 3) {
      newErrors.pastor_name = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCNPJ = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação CNPJ
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({
      ...prev,
      church_cnpj: formatted
    }));
    try { localStorage.setItem('registration_step2_data', JSON.stringify({ ...formData, church_cnpj: formatted })); } catch {}
    
    if (errors.church_cnpj) {
      setErrors(prev => ({
        ...prev,
        church_cnpj: ''
      }));
    }
  };

  const formatPhone = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({
      ...prev,
      church_phone: formatted
    }));
    try { localStorage.setItem('registration_step2_data', JSON.stringify({ ...formData, church_phone: formatted })); } catch {}
    
    if (errors.church_phone) {
      setErrors(prev => ({
        ...prev,
        church_phone: ''
      }));
    }
  };

  const handleCepSearch = useCallback(async (cep: string) => {
    const onlyDigits = cep.replace(/\D/g, '');
    if (onlyDigits.length !== 8) {
      return;
    }

    setIsCepLoading(true);
    setCepError(null);
    try {
      const address = await getAddressByCEP(onlyDigits);
      setFormData(prev => {
        const updated = {
          ...prev,
          church_address: address.logradouro,
          church_city: address.localidade,
          church_state: address.uf,
          church_neighborhood: address.bairro,
        };
        try { localStorage.setItem('registration_step2_data', JSON.stringify(updated)); } catch {}
        return updated;
      });
      // Focar no campo de número após a busca
      document.getElementById('church_number')?.focus();
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

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Formatação do CEP
    const formattedCep = value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);

    setFormData(prev => {
      const updated = { ...prev, church_zipcode: formattedCep };
      try { localStorage.setItem('registration_step2_data', JSON.stringify(updated)); } catch {}
      return updated;
    });
    
    if (formattedCep.replace(/\D/g, '').length === 8) {
      handleCepSearch(formattedCep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔥 handleSubmit Etapa 2 iniciado');
    
    if (!validateForm()) {
      console.log('❌ Validação falhou');
      return;
    }

    const profileData = {
      denomination_id: formData.denomination_id ? parseInt(formData.denomination_id) : undefined,
      church_name: formData.church_name,
      church_cnpj: formData.church_cnpj || undefined,
      church_email: formData.church_email,
      church_phone: formData.church_phone,
      branch_name: formData.branch_name || undefined,
      church_address: formData.church_address,
      church_city: formData.church_city || undefined,
      church_state: formData.church_state || undefined,
      church_zipcode: formData.church_zipcode || undefined,
      pastor_name: formData.pastor_name,
      role: 'pastor'
    };

    try {
      console.log('💾 Validando e persistindo dados da etapa 2...');
      
      // Persistir dados da etapa 2 para usar na finalização
      try { 
        localStorage.setItem('registration_step2_data', JSON.stringify(formData)); 
      } catch {}
      
      console.log('✅ Dados da etapa 2 validados e persistidos, navegando para Etapa 3');
      
      // Navegar para etapa 3 com todos os dados
      navigate('/cadastro/etapa-3', { 
        state: { 
          personalData: personalData, // Dados da Etapa 1
          churchData: profileData,    // Dados da Etapa 2
          rawFormData: formData,
          validated: true // Flag indicando que foi validado
        } 
      });
      
    } catch (err) {
      console.error('❌ Erro ao validar dados:', err);
    }
  };


  const handleBack = async () => {
    // Salvar progresso atual antes de voltar
    if (Object.values(formData).some(value => value.trim() !== '')) {
      const profileData = {
        denomination_id: formData.denomination_id ? parseInt(formData.denomination_id) : undefined,
        church_name: formData.church_name || undefined,
        church_cnpj: formData.church_cnpj || undefined,
        church_email: formData.church_email || undefined,
        church_phone: formData.church_phone || undefined,
        branch_name: formData.branch_name || undefined,
        church_address: formData.church_address || undefined,
        church_city: formData.church_city || undefined,
        church_state: formData.church_state || undefined,
        church_zipcode: formData.church_zipcode || undefined,
        pastor_name: formData.pastor_name || undefined,
      };
      
      try {
        await savePartialProfile(profileData);
        try { localStorage.setItem('registration_step2_data', JSON.stringify(formData)); } catch {}
        console.log('💾 Progresso salvo antes de voltar');
      } catch (err) {
        console.warn('⚠️ Não foi possível salvar o progresso:', err);
      }
    }
    
    navigate('/cadastro', {
      state: { 
        prefill: personalData,
        savedChurchData: formData // Passar dados atuais
      }
    });
  };

  // Se cadastro foi bem-sucedido, mostrar mensagem
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Cadastro concluído com sucesso!
            </h2>
            <p className="text-slate-600 mb-4">
              Sua igreja foi criada. Redirecionando para o dashboard...
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
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Back to Previous Step */}
        <button 
          onClick={handleBack}
          className="inline-flex items-center text-slate-600 hover:text-blue-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar ao início
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-slate-800 mb-2">
            <span className="text-blue-800">Obreiro</span>
            <span className="text-fuchsia-600">Virtual</span>
          </div>
          <div className="bg-blue-600 text-white py-6 px-8 rounded-t-2xl">
            <h1 className="text-2xl font-bold mb-2">Cadastro - Etapa 2 de 3</h1>
            <p className="text-blue-100">Informações de Igreja</p>
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
            <div className="w-12 h-px bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Dados da Igreja</span>
            </div>
            <div className="w-12 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Confirmação</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-8 shadow-xl rounded-2xl border border-white/20">
          {/* Header da Seção */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              Dados da sua igreja
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Denominação */}
            <div>
              <label htmlFor="denomination_id" className="block text-sm font-semibold text-slate-700 mb-2">
                Denominação*
              </label>
              <select
                id="denomination_id"
                name="denomination_id"
                required
                value={formData.denomination_id}
                onChange={handleInputChange}
                disabled={isLoading || isDenominationsLoading}
                className={`block w-full px-3 py-3 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.denomination_id ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">{isDenominationsLoading ? 'Carregando...' : 'Selecione a denominação'}</option>
                {denominations.map((denomination) => (
                  <option key={denomination.id} value={denomination.id}>
                    {denomination.display_name || denomination.name}
                  </option>
                ))}
              </select>
              {errors.denomination_id && (
                <p className="mt-1 text-sm text-red-600">{errors.denomination_id}</p>
              )}
            </div>

            {/* Nome da Igreja */}
            <div>
              <label htmlFor="church_name" className="block text-sm font-semibold text-slate-700 mb-2">
                Nome da Igreja*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="church_name"
                  name="church_name"
                  type="text"
                  required
                  value={formData.church_name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.church_name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Nome completo da igreja"
                />
              </div>
              {errors.church_name && (
                <p className="mt-1 text-sm text-red-600">{errors.church_name}</p>
              )}
            </div>

            {/* CNPJ da Igreja */}
            <div>
              <label htmlFor="church_cnpj" className="block text-sm font-semibold text-slate-700 mb-2">
                CNPJ da Igreja
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="church_cnpj"
                  name="church_cnpj"
                  type="text"
                  value={formData.church_cnpj}
                  onChange={handleCNPJChange}
                  disabled={isLoading}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.church_cnpj ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="00.000.000/0000-00 (opcional)"
                  maxLength={18}
                />
              </div>
              {errors.church_cnpj && (
                <p className="mt-1 text-sm text-red-600">{errors.church_cnpj}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">Campo opcional</p>
            </div>

            {/* E-mail e Telefone da Igreja */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* E-mail da Igreja */}
              <div>
                <label htmlFor="church_email" className="block text-sm font-semibold text-slate-700 mb-2">
                  E-mail da Igreja*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="church_email"
                    name="church_email"
                    type="email"
                    required
                    value={formData.church_email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.church_email ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="igreja@email.com"
                  />
                </div>
                {errors.church_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.church_email}</p>
                )}
              </div>

              {/* Telefone da Igreja */}
              <div>
                <label htmlFor="church_phone" className="block text-sm font-semibold text-slate-700 mb-2">
                  Telefone da Igreja*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="church_phone"
                    name="church_phone"
                    type="tel"
                    required
                    value={formData.church_phone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.church_phone ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="(00) 0000-0000"
                    maxLength={15}
                  />
                </div>
                {errors.church_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.church_phone}</p>
                )}
              </div>
            </div>

            {/* Nome da Filial/Campus */}
            <div>
              <label htmlFor="branch_name" className="block text-sm font-semibold text-slate-700 mb-2">
                Nome da Filial/Campus
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="branch_name"
                  name="branch_name"
                  type="text"
                  value={formData.branch_name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.branch_name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Sede ou nome da filial"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Deixe em branco se for a sede principal</p>
              {errors.branch_name && (
                <p className="mt-1 text-sm text-red-600">{errors.branch_name}</p>
              )}
            </div>

            {/* Endereço com busca por CEP */}
            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800">Endereço da Igreja</h3>
              
              {/* CEP */}
              <div>
                <label htmlFor="church_zipcode" className="block text-sm font-semibold text-slate-700 mb-2">
                  CEP*
                </label>
                <div className="relative">
                  <input
                    id="church_zipcode"
                    name="church_zipcode"
                    type="text"
                    required
                    value={formData.church_zipcode}
                    onChange={handleCEPChange}
                    disabled={isLoading || isCepLoading}
                    className={`block w-full pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Digite o CEP"
                    maxLength={9}
                  />
                  {isCepLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                    </div>
                  )}
                </div>
                {cepError && <p className="mt-1 text-sm text-red-600">{cepError}</p>}
              </div>

              {/* Logradouro e Número */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="church_address" className="block text-sm font-semibold text-slate-700 mb-2">
                    Logradouro (Rua, Av.)*
                  </label>
                  <input
                    id="church_address"
                    name="church_address"
                    type="text"
                    required
                    value={formData.church_address}
                    onChange={handleInputChange}
                    disabled={isLoading || isCepLoading}
                    className="block w-full py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70"
                    placeholder="Preenchido automaticamente"
                  />
                </div>
                <div>
                  <label htmlFor="church_number" className="block text-sm font-semibold text-slate-700 mb-2">
                    Número*
                  </label>
                  <input
                    id="church_number"
                    name="church_number"
                    type="text"
                    required
                    value={formData.church_number}
                    onChange={handleInputChange}
                    disabled={isLoading || isCepLoading}
                    className="block w-full py-3 border rounded-xl"
                  />
                </div>
              </div>
              
              {/* Bairro e Complemento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label htmlFor="church_neighborhood" className="block text-sm font-semibold text-slate-700 mb-2">
                    Bairro*
                  </label>
                  <input
                    id="church_neighborhood"
                    name="church_neighborhood"
                    type="text"
                    required
                    value={formData.church_neighborhood}
                    onChange={handleInputChange}
                    disabled={isLoading || isCepLoading}
                    className="block w-full py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70"
                    placeholder="Preenchido automaticamente"
                  />
                </div>
                <div>
                   <label htmlFor="church_complement" className="block text-sm font-semibold text-slate-700 mb-2">
                    Complemento
                  </label>
                  <input
                    id="church_complement"
                    name="church_complement"
                    type="text"
                    value={formData.church_complement}
                    onChange={handleInputChange}
                    disabled={isLoading || isCepLoading}
                    className="block w-full py-3 border rounded-xl"
                  />
                </div>
              </div>

              {/* Cidade e UF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="church_city" className="block text-sm font-semibold text-slate-700 mb-2">
                    Cidade*
                  </label>
                  <input
                    id="church_city"
                    name="church_city"
                    type="text"
                    required
                    value={formData.church_city}
                    onChange={handleInputChange}
                    disabled={isLoading || isCepLoading}
                    className="block w-full py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70"
                    placeholder="Preenchido automaticamente"
                  />
                </div>
                <div>
                  <label htmlFor="church_state" className="block text-sm font-semibold text-slate-700 mb-2">
                    UF*
                  </label>
                  <input
                    id="church_state"
                    name="church_state"
                    type="text"
                    required
                    value={formData.church_state}
                    onChange={handleInputChange}
                    disabled={isLoading || isCepLoading}
                    className="block w-full py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

            </div>

            {/* Pastor Responsável */}
            <div>
              <label htmlFor="pastor_name" className="block text-sm font-semibold text-slate-700 mb-2">
                Pastor Responsável*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="pastor_name"
                  name="pastor_name"
                  type="text"
                  required
                  value={formData.pastor_name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.pastor_name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Nome do pastor responsável"
                />
              </div>
              {errors.pastor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.pastor_name}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1 py-3 px-4 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2 inline-block"></div>
                    Salvando...
                  </>
                ) : (
                  'Voltar'
                )}
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    Salvando e continuando...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          </form>
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

export default CadastroEtapa2; 