import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('🔐 Iniciando processo de logout...');
    console.log('🔐 Antes - localStorage token:', !!localStorage.getItem('auth_token'));
    console.log('🔐 Antes - localStorage user:', !!localStorage.getItem('user'));
    
    await logout();
    
    console.log('🔐 Depois - localStorage token:', !!localStorage.getItem('auth_token'));
    console.log('🔐 Depois - localStorage user:', !!localStorage.getItem('user'));
    console.log('🔄 Redirecionando para login...');
    
    // Forçar reload da página para garantir que o estado seja limpo
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard - Obreiro Virtual
            </h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Login realizado com sucesso!
            </h2>
            <p className="text-green-700">
              Bem-vindo ao Obreiro Virtual. O sistema de autenticação está funcionando perfeitamente.
            </p>
          </div>

          <div className="bg-gray-50 rounded p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Dados do usuário:</h3>
            <div className="text-sm text-gray-600">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Nome:</strong> {user?.full_name}</p>
              <p><strong>ID:</strong> {user?.id}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Status da Sessão:</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Token:</strong> {localStorage.getItem('auth_token') ? '✅ Presente' : '❌ Ausente'}</p>
              <p><strong>Última Atividade:</strong> {localStorage.getItem('last_activity') ? new Date(parseInt(localStorage.getItem('last_activity')!)).toLocaleString() : 'N/A'}</p>
              <p><strong>Logout automático:</strong> 30 minutos de inatividade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 