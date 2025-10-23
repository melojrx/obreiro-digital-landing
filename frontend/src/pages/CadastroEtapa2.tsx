import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Building, Mail, Phone, MapPin, User, FileText, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Denomination } from '../services/auth';
import { getAddressByCEP, CEPAddress, APIError } from '@/services/utils';

const CadastroEtapa2 = () => {
  const [formData, setFormData] = useState({
    denomination_id: '',
    denomination_other_name: '',
    user_zipcode: '',
    user_address: '',
    user_city: '',
    user_state: '',
    user_neighborhood: '',
    user_number: '',
    user_complement: ''
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
        denomination_other_name: source.denomination_other_name || '',
        user_zipcode: source.user_zipcode || source.church_zipcode || '',
        user_address: source.user_address || source.church_address || '',
        user_city: source.user_city || source.church_city || '',
        user_state: source.user_state || source.church_state || '',
        user_neighborhood: source.user_neighborhood || source.church_neighborhood || '',
        user_number: source.user_number || source.church_number || '',
        user_complement: source.user_complement || source.church_complement || ''
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
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (name === 'denomination_id' && value !== 'outros' && prev.denomination_other_name) {
        updated.denomination_other_name = '';
      }

      return updated;
    });

    // Persistir snapshot local da etapa 2
    try {
      const snapshot = { ...formData, [name]: value };
      if (name === 'denomination_id' && value !== 'outros') {
        snapshot.denomination_other_name = '';
      }
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
    } else if (formData.denomination_id === 'outros' && !formData.denomination_other_name.trim()) {
      newErrors.denomination_other_name = 'Informe o nome da denominação';
    }

    if (!formData.user_zipcode) {
      newErrors.user_zipcode = 'CEP é obrigatório';
    } else if (formData.user_zipcode.replace(/\D/g, '').length !== 8) {
      newErrors.user_zipcode = 'CEP inválido';
    }

    if (!formData.user_address) {
      newErrors.user_address = 'Endereço é obrigatório';
    } else if (formData.user_address.length < 3) {
      newErrors.user_address = 'Endereço deve ter pelo menos 3 caracteres';
    }

    if (!formData.user_number) {
      newErrors.user_number = 'Número é obrigatório';
    }

    if (!formData.user_neighborhood) {
      newErrors.user_neighborhood = 'Bairro é obrigatório';
    }

    if (!formData.user_city) {
      newErrors.user_city = 'Cidade é obrigatória';
    }

    if (!formData.user_state) {
      newErrors.user_state = 'Estado é obrigatório';
    } else if (formData.user_state.length !== 2) {
      newErrors.user_state = 'Estado inválido (use sigla UF)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      
      // Atualiza campos de endereço do usuário
      setFormData(prev => {
        const updated = {
          ...prev,
          user_address: address.logradouro || prev.user_address,
          user_city: address.localidade || prev.user_city,
          user_state: address.uf || prev.user_state,
          user_neighborhood: address.bairro || prev.user_neighborhood
        };
        try { localStorage.setItem('registration_step2_data', JSON.stringify(updated)); } catch {}
        return updated;
      });

      // Remove erros dos campos preenchidos
      setErrors(prev => {
        const newErrors = { ...prev };
        if (address.logradouro) delete newErrors.user_address;
        if (address.localidade) delete newErrors.user_city;
        if (address.uf) delete newErrors.user_state;
        if (address.bairro) delete newErrors.user_neighborhood;
        return newErrors;
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError('CEP não encontrado ou inválido');
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
      const updated = { ...prev, user_zipcode: formattedCep };
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
    console.log('📋 Dados do formulário:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validação falhou. Erros:', errors);
      return;
    }

    console.log('✅ Validação passou!');

    const denominationIdValue = formData.denomination_id;
    // Preservar 'outros' como string para a etapa 3 validar corretamente
    const normalizedDenominationId =
      denominationIdValue && /^\d+$/.test(denominationIdValue)
        ? parseInt(denominationIdValue, 10)
        : denominationIdValue || undefined;

    const profileData = {
      denomination_id: normalizedDenominationId as any,
      denomination_other_name: formData.denomination_other_name || undefined,
      user_zipcode: formData.user_zipcode || undefined,
      user_address: formData.user_address,
      user_city: formData.user_city || undefined,
      user_state: formData.user_state || undefined,
      user_neighborhood: formData.user_neighborhood || undefined,
      user_number: formData.user_number,
      user_complement: formData.user_complement || undefined
    };

    console.log('📦 Profile data preparado:', profileData);

    try {
      console.log('💾 Persistindo dados da etapa 2 no localStorage...');
      
      // Persistir dados da etapa 2 para usar na finalização
      try { 
        localStorage.setItem('registration_step2_data', JSON.stringify(formData)); 
        console.log('✅ Dados salvos no localStorage');
      } catch (storageErr) {
        console.error('⚠️ Erro ao salvar no localStorage:', storageErr);
      }
      
      console.log('🚀 Navegando para Etapa 3...');
      console.log('📍 Rota: /cadastro/etapa-3');
      console.log('📦 State:', { 
        personalData: personalData,
        churchData: profileData,
        rawFormData: formData,
        validated: true
      });
      
      // Navegar para etapa 3 com todos os dados
      navigate('/cadastro/etapa-3', { 
        state: { 
          personalData: personalData, // Dados da Etapa 1
          churchData: profileData,    // Dados da Etapa 2
          rawFormData: formData,
          validated: true // Flag indicando que foi validado
        } 
      });
      
      console.log('✅ Navigate executado!');
      
    } catch (err) {
      console.error('❌ Erro ao processar dados:', err);
      alert('Erro ao processar dados. Verifique o console para detalhes.');
    }
  };


  const handleBack = async () => {
    // Salvar progresso atual antes de voltar
    if (Object.values(formData).some(value => typeof value === 'string' && value.trim() !== '')) {
      const profileData = {
        denomination_id: formData.denomination_id ? parseInt(formData.denomination_id) : undefined,
        user_zipcode: formData.user_zipcode || undefined,
        user_address: formData.user_address || undefined,
        user_city: formData.user_city || undefined,
        user_state: formData.user_state || undefined,
        user_neighborhood: formData.user_neighborhood || undefined,
        user_number: formData.user_number || undefined,
        user_complement: formData.user_complement || undefined
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
            <p className="text-blue-100">Denominação e Endereço</p>
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

            {formData.denomination_id === 'outros' && (
              <div>
                <label htmlFor="denomination_other_name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome da denominação*
                </label>
                <input
                  id="denomination_other_name"
                  name="denomination_other_name"
                  type="text"
                  value={formData.denomination_other_name}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-3 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 ${
                    errors.denomination_other_name ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Informe o nome completo da denominação"
                />
                {errors.denomination_other_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.denomination_other_name}</p>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-200 my-6">
              <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-4">Seu Endereço</h3>
            </div>

            {/* CEP com busca automática */}
            <div>
              <label htmlFor="user_zipcode" className="block text-sm font-semibold text-slate-700 mb-2">
                CEP*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="user_zipcode"
                  name="user_zipcode"
                  type="text"
                  required
                  value={formData.user_zipcode}
                  onChange={handleCEPChange}
                  disabled={isLoading || isCepLoading}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.user_zipcode ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {isCepLoading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
              {errors.user_zipcode && (
                <p className="mt-1 text-sm text-red-600">{errors.user_zipcode}</p>
              )}
              {cepError && <p className="mt-1 text-sm text-red-600">{cepError}</p>}
            </div>

            {/* Endereço e Número */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="user_address" className="block text-sm font-semibold text-slate-700 mb-2">
                  Logradouro (Rua, Av.)*
                </label>
                <input
                  id="user_address"
                  name="user_address"
                  type="text"
                  required
                  value={formData.user_address}
                  onChange={handleInputChange}
                  disabled={isLoading || isCepLoading}
                  className={`block w-full py-3 px-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70 ${
                    errors.user_address ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Preenchido automaticamente pelo CEP"
                />
                {errors.user_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_address}</p>
                )}
              </div>
              <div>
                <label htmlFor="user_number" className="block text-sm font-semibold text-slate-700 mb-2">
                  Número*
                </label>
                <input
                  id="user_number"
                  name="user_number"
                  type="text"
                  required
                  value={formData.user_number}
                  onChange={handleInputChange}
                  disabled={isLoading || isCepLoading}
                  className={`block w-full py-3 px-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 ${
                    errors.user_number ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Nº"
                />
                {errors.user_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_number}</p>
                )}
              </div>
            </div>

            {/* Bairro e Complemento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user_neighborhood" className="block text-sm font-semibold text-slate-700 mb-2">
                  Bairro*
                </label>
                <input
                  id="user_neighborhood"
                  name="user_neighborhood"
                  type="text"
                  required
                  value={formData.user_neighborhood}
                  onChange={handleInputChange}
                  disabled={isLoading || isCepLoading}
                  className={`block w-full py-3 px-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70 ${
                    errors.user_neighborhood ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Preenchido automaticamente pelo CEP"
                />
                {errors.user_neighborhood && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_neighborhood}</p>
                )}
              </div>
              <div>
                <label htmlFor="user_complement" className="block text-sm font-semibold text-slate-700 mb-2">
                  Complemento
                </label>
                <input
                  id="user_complement"
                  name="user_complement"
                  type="text"
                  value={formData.user_complement}
                  onChange={handleInputChange}
                  disabled={isLoading || isCepLoading}
                  className="block w-full py-3 px-3 border border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70"
                  placeholder="Apto, Bloco, etc. (opcional)"
                />
                <p className="mt-1 text-xs text-slate-500">Campo opcional</p>
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user_city" className="block text-sm font-semibold text-slate-700 mb-2">
                  Cidade*
                </label>
                <input
                  id="user_city"
                  name="user_city"
                  type="text"
                  required
                  value={formData.user_city}
                  onChange={handleInputChange}
                  disabled={isLoading || isCepLoading}
                  className={`block w-full py-3 px-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70 ${
                    errors.user_city ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Preenchido automaticamente pelo CEP"
                />
                {errors.user_city && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_city}</p>
                )}
              </div>
              <div>
                <label htmlFor="user_state" className="block text-sm font-semibold text-slate-700 mb-2">
                  Estado (UF)*
                </label>
                <input
                  id="user_state"
                  name="user_state"
                  type="text"
                  required
                  value={formData.user_state}
                  onChange={handleInputChange}
                  disabled={isLoading || isCepLoading}
                  maxLength={2}
                  className={`block w-full py-3 px-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:bg-slate-50 disabled:opacity-70 ${
                    errors.user_state ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="UF"
                />
                {errors.user_state && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_state}</p>
                )}
              </div>
            </div>


            {/* Botões de ação */}
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
