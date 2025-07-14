import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Pagamento = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, churchData } = location.state || {};
  const { isAuthenticated } = useAuth();

  const handleGoBack = () => {
    if (isAuthenticated) {
      // Se o usuário está logado, volta para o dashboard
      navigate('/dashboard');
    } else {
      // Se não está logado, vai para a landing page
      navigate('/');
    }
  };

  const handleGoBackHistory = () => {
    // Tenta voltar na história do navegador
    window.history.length > 1 ? navigate(-1) : handleGoBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Button */}
        <button 
          onClick={handleGoBackHistory}
          className="inline-flex items-center text-slate-600 hover:text-blue-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20 text-center">
          <CreditCard className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Página de Pagamento
          </h2>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Em Desenvolvimento</span>
            </div>
            <p className="text-sm text-blue-600">
              A interface de pagamento será implementada em breve.
            </p>
          </div>

          {plan && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg text-left">
              <h3 className="font-semibold text-slate-800 mb-2">Plano Selecionado:</h3>
              <p className="text-slate-600">
                <strong>{plan.name}</strong> - R$ {plan.price}/{plan.period}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Ir para Dashboard (Temporário)
            </button>
            
            <button
              onClick={() => navigate('/cadastro/etapa-3')}
              className="w-full py-3 px-4 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              Escolher Outro Plano
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoBack = () => {
    if (isAuthenticated) {
      // Se o usuário está logado, volta para o dashboard
      navigate('/dashboard');
    } else {
      // Se não está logado, vai para a landing page
      navigate('/');
    }
  };

  const handleGoBackHistory = () => {
    // Tenta voltar na história do navegador
    window.history.length > 1 ? navigate(-1) : handleGoBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-white/20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Página não encontrada
          </h2>
          <p className="text-slate-600 mb-6">
            A página que você está procurando não existe ou ainda não foi implementada.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleGoBackHistory}
              className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Voltar
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Ir para Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Pagamento };
export default NotFound;
