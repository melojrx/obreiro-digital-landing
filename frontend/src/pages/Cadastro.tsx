import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle, Calendar, Phone } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Cadastro = () => {
  console.log('🎯 Componente Cadastro renderizado');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { prefill, savedChurchData } = location.state || {}; // Receber dados para preenchimento

  const [formData, setFormData] = useState({
    full_name: prefill?.full_name || '',
    email: prefill?.email || '',
    birth_date: prefill?.birth_date || '',
    gender: prefill?.gender || '',
    phone: prefill?.phone || '',
    password: '',
    password_confirm: '',
    accept_terms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpar erro da API quando campos mudarem
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
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

    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Senhas não coincidem';
    }

    if (!formData.accept_terms) {
      newErrors.accept_terms = 'É obrigatório aceitar os Termos de Uso e Política de Privacidade';
    }

    console.log('🔍 Validação - newErrors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      phone: formatted
    }));
    
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔥 handleSubmit iniciado');
    console.log('🔥 formData:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validação falhou');
      return;
    }

    console.log('✅ Validação passou, iniciando registro...');

    try {
      console.log('📡 Chamando register com dados:', formData);
      
      // Garantir que todos os campos obrigatórios estão definidos
      const registrationData = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone || '(11) 99999-9999',
        birth_date: formData.birth_date || '1990-01-01',
        gender: formData.gender || 'N',
        password: formData.password,
        password_confirm: formData.password_confirm,
        accept_terms: formData.accept_terms
      };
      
      console.log('📡 Dados formatados para envio:', registrationData);
      
      await register(registrationData);
      console.log('✅ Register bem-sucedido, definindo success=true');
      setSuccess(true);
      
      console.log('⏰ Aguardando 2 segundos antes de navegar...');
      // Aguardar um pouco para mostrar mensagem de sucesso
      setTimeout(() => {
        console.log('🚀 Navegando para /cadastro/etapa-2');
        // Usar replace para evitar voltar ao cadastro pelo botão back
        navigate('/cadastro/etapa-2', { 
          replace: true,
          state: { 
            personalData: registrationData,
            ...(savedChurchData && { savedChurchData }) // Passar dados salvos se existirem
          }
        });
      }, 2000);
    } catch (err) {
      // Erro já foi tratado pelo hook useAuth
      console.error('❌ Erro no registro:', err);
    }
  };

  // Se cadastro foi bem-sucedido, mostrar mensagem
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Dados pessoais salvos!
            </h2>
            <p className="text-slate-600 mb-4">
              Agora vamos cadastrar sua igreja...
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
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to Home */}
        <Link 
          to="/" 
          className="inline-flex items-center text-slate-600 hover:text-blue-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar ao início
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-slate-800 mb-2">
            <span className="text-blue-800">Obreiro</span>
            <span className="text-fuchsia-600">Virtual</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Criar sua conta
          </h2>
          <p className="text-slate-600">
            Comece sua jornada de gestão eclesiástica moderna
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-fuchsia-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-slate-700">Seus dados pessoais</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm text-gray-500">Dados da Igreja</span>
            </div>
          </div>
        </div>

        {/* Cadastro Form */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Row 1: Nome completo e E-mail */}
            <div className="grid grid-cols-1 gap-6">
              {/* Nome Completo Field */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome completo*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.full_name ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Seu nome completo"
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  E-mail*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Row 2: Data de nascimento e Gênero */}
            <div className="grid grid-cols-2 gap-4">
              {/* Birth Date Field */}
              <div>
                <label htmlFor="birth_date" className="block text-sm font-semibold text-slate-700 mb-2">
                  Data de nascimento*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    required
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.birth_date ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.birth_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">Você deve ter pelo menos 18 anos</p>
              </div>

              {/* Gender Field */}
              <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-slate-700 mb-2">
                  Gênero*
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`block w-full px-3 py-3 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.gender ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                  <option value="N">Não informar</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Row 3: Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                Telefone*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.phone ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Row 4: Senha e Confirmar Senha */}
            <div className="grid grid-cols-1 gap-6">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Senha*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.password ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Password Confirm Field */}
              <div>
                <label htmlFor="password_confirm" className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirmar senha*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password_confirm"
                    name="password_confirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.password_confirm ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Confirme sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    disabled={isLoading}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                {errors.password_confirm && (
                  <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
                )}
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                id="accept_terms"
                name="accept_terms"
                type="checkbox"
                checked={formData.accept_terms}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                  errors.accept_terms ? 'border-red-300' : ''
                }`}
              />
              <label htmlFor="accept_terms" className="text-sm text-slate-600">
                Concordo com os{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Termos de Serviço
                </a>{' '}
                e{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Política de Privacidade
                </a>
              </label>
            </div>
            {errors.accept_terms && (
              <p className="text-sm text-red-600">{errors.accept_terms}</p>
            )}

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                disabled={isLoading}
                className="flex-1 py-3 px-4 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    Criando conta...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Já tem uma conta?{' '}
                <Link 
                  to="/login" 
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Fazer login
                </Link>
              </p>
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

export default Cadastro;
