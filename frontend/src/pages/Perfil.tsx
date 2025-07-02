import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Camera, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  CreditCard, 
  Settings,
  Shield,
  Bell,
  Save,
  Edit3,
  Crown,
  Church
} from 'lucide-react';
import { toast } from 'sonner';

const Perfil: React.FC = () => {
  const { user, userChurch, updatePersonalData, updateChurchData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Estados para os dados dos formulários
  const [personalData, setPersonalData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: ''
  });

  const [churchData, setChurchData] = useState({
    name: userChurch?.name || '',
    cnpj: userChurch?.cnpj || '',
    email: userChurch?.email || '',
    phone: userChurch?.phone || '',
    address: userChurch?.address || '',
    city: userChurch?.city || '',
    state: userChurch?.state || '',
    zipcode: userChurch?.zipcode || ''
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false
  });

  // Atualizar dados quando user/userChurch mudam
  React.useEffect(() => {
    if (user) {
      setPersonalData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: ''
      });
    }
  }, [user]);

  React.useEffect(() => {
    if (userChurch) {
      setChurchData({
        name: userChurch.name || '',
        cnpj: userChurch.cnpj || '',
        email: userChurch.email || '',
        phone: userChurch.phone || '',
        address: userChurch.address || '',
        city: userChurch.city || '',
        state: userChurch.state || '',
        zipcode: userChurch.zipcode || ''
      });
    }
  }, [userChurch]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSavePersonalData = async () => {
    setIsLoading(true);
    try {
      await updatePersonalData({
        full_name: personalData.full_name,
        email: personalData.email,
        phone: personalData.phone,
        bio: personalData.bio,
        email_notifications: notifications.email_notifications,
        sms_notifications: notifications.sms_notifications
      });
      toast.success('Dados pessoais atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados pessoais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChurchData = async () => {
    setIsLoading(true);
    try {
      await updateChurchData(churchData);
      toast.success('Dados da igreja atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados da igreja');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'church', label: 'Igreja', icon: Church },
    { id: 'subscription', label: 'Planos', icon: Crown },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield }
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais, dados da igreja e preferências
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Avatar */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white text-xl">
                        {user?.full_name ? getInitials(user.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-lg mt-3">{user?.full_name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  {userChurch && (
                    <Badge variant="secondary" className="mt-2">
                      {userChurch.user_role}
                    </Badge>
                  )}
                </div>

                {/* Menu */}
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo */}
          <div className="lg:col-span-3">
            {/* Dados Pessoais */}
            {activeTab === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo</Label>
                      <Input 
                        value={personalData.full_name}
                        onChange={(e) => setPersonalData({...personalData, full_name: e.target.value})}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input 
                        type="email"
                        value={personalData.email}
                        onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input 
                        value={personalData.phone}
                        onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                        placeholder="(XX) XXXXX-XXXX"
                      />
                    </div>
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Biografia</Label>
                    <Textarea 
                      value={personalData.bio}
                      onChange={(e) => setPersonalData({...personalData, bio: e.target.value})}
                      placeholder="Conte um pouco sobre você..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleSavePersonalData} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Igreja */}
            {activeTab === 'church' && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Igreja</CardTitle>
                  <CardDescription>
                    Informações da sua igreja
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Igreja</Label>
                      <Input 
                        value={churchData.name}
                        onChange={(e) => setChurchData({...churchData, name: e.target.value})}
                        placeholder="Nome da igreja"
                      />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input 
                        value={churchData.cnpj}
                        onChange={(e) => setChurchData({...churchData, cnpj: e.target.value})}
                        placeholder="XX.XXX.XXX/XXXX-XX"
                      />
                    </div>
                    <div>
                      <Label>E-mail da Igreja</Label>
                      <Input 
                        type="email"
                        value={churchData.email}
                        onChange={(e) => setChurchData({...churchData, email: e.target.value})}
                        placeholder="contato@igreja.com"
                      />
                    </div>
                    <div>
                      <Label>Telefone da Igreja</Label>
                      <Input 
                        value={churchData.phone}
                        onChange={(e) => setChurchData({...churchData, phone: e.target.value})}
                        placeholder="(XX) XXXX-XXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Endereço</Label>
                    <Input 
                      value={churchData.address}
                      onChange={(e) => setChurchData({...churchData, address: e.target.value})}
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input 
                        value={churchData.city}
                        onChange={(e) => setChurchData({...churchData, city: e.target.value})}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Input 
                        value={churchData.state}
                        onChange={(e) => setChurchData({...churchData, state: e.target.value})}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <Input 
                        value={churchData.zipcode}
                        onChange={(e) => setChurchData({...churchData, zipcode: e.target.value})}
                        placeholder="XXXXX-XXX"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveChurchData} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Planos */}
            {activeTab === 'subscription' && (
              <Card>
                <CardHeader>
                  <CardTitle>Planos de Assinatura</CardTitle>
                  <CardDescription>
                    Gerencie seu plano atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold">Plano Atual: Básico</h3>
                    <p className="text-sm text-gray-600">Gratuito</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">Profissional</h4>
                      <p className="text-2xl font-bold text-blue-600">R$ 99/mês</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>✓ Até 500 membros</li>
                        <li>✓ Relatórios avançados</li>
                        <li>✓ Suporte prioritário</li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Fazer Upgrade
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">Enterprise</h4>
                      <p className="text-2xl font-bold text-purple-600">R$ 299/mês</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>✓ Membros ilimitados</li>
                        <li>✓ API personalizada</li>
                        <li>✓ Suporte 24/7</li>
                      </ul>
                      <Button className="w-full mt-4" variant="outline">
                        Fazer Upgrade
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notificações */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>
                    Configure suas preferências
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">E-mail</h4>
                      <p className="text-sm text-gray-600">Notificações por e-mail</p>
                    </div>
                    <Switch 
                      checked={notifications.email_notifications}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, email_notifications: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">SMS</h4>
                      <p className="text-sm text-gray-600">Alertas via SMS</p>
                    </div>
                    <Switch 
                      checked={notifications.sms_notifications}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, sms_notifications: checked})
                      }
                    />
                  </div>

                  <Button onClick={handleSavePersonalData} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Segurança */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Alterar Senha</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Recomendamos trocar sua senha regularmente
                    </p>
                    <Button variant="outline">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>

                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium mb-2 text-red-800">Zona de Perigo</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Ações irreversíveis
                    </p>
                    <Button variant="destructive">
                      Excluir Conta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Perfil; 