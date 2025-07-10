import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Building, Crown, Bell, Shield, Church } from 'lucide-react';
import { PersonalDataForm } from '@/components/profile/PersonalDataForm';
import { ChurchDataForm } from '@/components/profile/ChurchDataForm';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { toast } from 'sonner';

// Futuramente, podemos criar componentes para estas seções também
const SubscriptionSection = () => <Card><CardContent className="p-6">Gerenciamento de plano em breve.</CardContent></Card>;
const NotificationsSection = () => <Card><CardContent className="p-6">Configuração de notificações em breve.</CardContent></Card>;

const Perfil: React.FC = () => {
  const { user, userChurch, uploadAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações básicas no frontend
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success('🎉 Foto de perfil atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('❌ Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setIsUploadingAvatar(false);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User, component: PersonalDataForm },
    { id: 'church', label: 'Dados da Igreja', icon: Church, component: ChurchDataForm },
    { id: 'subscription', label: 'Planos', icon: Crown, component: SubscriptionSection },
    { id: 'notifications', label: 'Notificações', icon: Bell, component: NotificationsSection },
    { id: 'security', label: 'Segurança', icon: Shield, component: SecuritySettings }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PersonalDataForm;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais, dados da igreja e preferências.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Navegação */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <UserAvatar size="lg" className="mx-auto" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                    
                    {/* Input de arquivo oculto */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  {isUploadingAvatar && (
                    <p className="text-sm text-blue-600 mt-2">Enviando foto...</p>
                  )}
                  
                  <h3 className="font-semibold text-lg mt-3">{user?.full_name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  {userChurch && (
                    <Badge variant="secondary" className="mt-2">
                      {userChurch.user_role}
                    </Badge>
                  )}
                </div>

                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="lg:col-span-3">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Perfil; 