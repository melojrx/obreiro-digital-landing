import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Monitorar mudança no estado de autenticação para redirecionamento
  useEffect(() => {
    console.log('🔍 Login useEffect - isAuthenticated:', isAuthenticated, 'loginSuccess:', loginSuccess);
    
    if (isAuthenticated && loginSuccess) {
      console.log('🎯 Estado de autenticação atualizado, redirecionando para dashboard...');
      
      // Tentar navigate primeiro
      navigate('/dashboard', { replace: true });
      
      // Fallback: se navigate não funcionar, usar window.location após delay
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          console.log('🔄 Navigate não funcionou, usando window.location.href...');
          window.location.href = '/dashboard';
        }
      }, 1000);
      
      setLoginSuccess(false); // Reset para próximas tentativas
    }
  }, [isAuthenticated, loginSuccess, navigate]);

  // Limpar erro quando campos mudarem
  useEffect(() => {
    if (error) {
      clearError();
    }
    // Limpar flag de login quando usuário edita campos
    setLoginSuccess(false);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 Form submitted!', { email, password: '***' });
    
    try {
      await login({ email, password });
      console.log('🎉 Login completed successfully');
      console.log('🔄 Marcando loginSuccess para ativar redirecionamento...');
      setLoginSuccess(true); // Ativar flag para redirecionamento
    } catch (err) {
      // Erro já foi tratado pelo hook useAuth
      console.error('Erro no login:', err);
      setLoginSuccess(false); // Garantir que flag está limpa em caso de erro
    }
  };

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
            Entre na sua conta
          </h2>
          <p className="text-slate-600">
            Acesse sua plataforma de gestão eclesiástica
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                  Lembrar de mim
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                onClick={(e) => {
                  console.log('🖱️ Botão clicado!', { 
                    isLoading, 
                    email: !!email, 
                    password: !!password,
                    disabled: isLoading || !email || !password 
                  });
                }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar na Plataforma'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">ou</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-slate-600">
                Ainda não tem conta?{' '}
                <Link 
                  to="/cadastro" 
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Criar conta grátis
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Protegido por criptografia de ponta.{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

