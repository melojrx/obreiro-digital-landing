import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  QrCode,
  Download,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { ChurchDetails } from '@/types/hierarchy';

interface ShareChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  church: ChurchDetails;
}

const ShareChurchModal: React.FC<ShareChurchModalProps> = ({
  isOpen,
  onClose,
  church
}) => {
  const [copied, setCopied] = useState<string>('');

  // URLs para compartilhamento
  const baseUrl = window.location.origin;
  const churchUrl = `${baseUrl}/church/${church.uuid}`;
  const qrCodeUrl = `${baseUrl}/api/churches/${church.id}/qr-code`;

  // Textos para compartilhamento
  const shareText = `Conheça a ${church.name}! Uma comunidade acolhedora em ${church.city}, ${church.state}. Participe dos nossos encontros e atividades.`;
  const emailSubject = `Convite para conhecer a ${church.name}`;
  const emailBody = `Olá!

Gostaria de convidá-lo(a) para conhecer a ${church.name}, uma comunidade cristã localizada em ${church.city}, ${church.state}.

${church.short_name || church.name} é uma igreja que busca viver e compartilhar o amor de Cristo através de:
- Cultos e estudos bíblicos
- Atividades comunitárias
- Apoio pastoral e espiritual

Informações de contato:
📍 ${church.address ? `${church.address}, ` : ''}${church.city}, ${church.state}
📞 ${church.phone || 'Telefone disponível no site'}
📧 ${church.email}

Visite nosso perfil online: ${churchUrl}

Esperamos vê-lo(a) em breve!

Com carinho,
Equipe ${church.name}`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: 'Copiado!',
        description: 'Conteúdo copiado para a área de transferência.',
      });
      
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o conteúdo.',
        variant: 'destructive',
      });
    }
  };

  const shareViaEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl);
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${churchUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(churchUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(churchUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareViaLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(churchUrl)}`;
    window.open(linkedinUrl, '_blank');
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${church.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'QR Code baixado',
        description: 'O QR Code foi salvo no seu dispositivo.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao baixar QR Code',
        description: 'Não foi possível baixar o QR Code.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Compartilhar {church.name}
          </DialogTitle>
          <DialogDescription>
            Convide pessoas para conhecer sua igreja através de diferentes canais
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick">Rápido</TabsTrigger>
            <TabsTrigger value="social">Redes Sociais</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          {/* Compartilhamento Rápido */}
          <TabsContent value="quick" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Link da Igreja</label>
                <div className="flex gap-2 mt-1">
                  <Input value={churchUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(churchUrl, 'url')}
                  >
                    {copied === 'url' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Texto para Compartilhamento</label>
                <div className="mt-1">
                  <Textarea 
                    value={shareText} 
                    readOnly 
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => copyToClipboard(shareText, 'text')}
                  >
                    {copied === 'text' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Texto
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={shareViaWhatsApp}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  WhatsApp
                </Button>
                
                <Button
                  variant="outline"
                  onClick={shareViaEmail}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Redes Sociais */}
          <TabsContent value="social" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Compartilhe nas suas redes sociais para alcançar mais pessoas
              </p>

              <div className="grid gap-3">
                <Button
                  variant="outline"
                  onClick={shareViaFacebook}
                  className="flex items-center justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Facebook</div>
                      <div className="text-sm text-gray-500">Compartilhar no Facebook</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={shareViaTwitter}
                  className="flex items-center justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-sky-500" />
                    <div className="text-left">
                      <div className="font-medium">Twitter</div>
                      <div className="text-sm text-gray-500">Postar no Twitter</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={shareViaLinkedIn}
                  className="flex items-center justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <div className="text-left">
                      <div className="font-medium">LinkedIn</div>
                      <div className="text-sm text-gray-500">Compartilhar no LinkedIn</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">WhatsApp</div>
                      <div className="text-sm text-gray-500">Enviar via WhatsApp</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Email */}
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Assunto do Email</label>
                <div className="flex gap-2 mt-1">
                  <Input value={emailSubject} readOnly />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(emailSubject, 'subject')}
                  >
                    {copied === 'subject' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Corpo do Email</label>
                <div className="mt-1">
                  <Textarea 
                    value={emailBody} 
                    readOnly 
                    className="min-h-[200px] resize-none font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 mr-2"
                    onClick={() => copyToClipboard(emailBody, 'body')}
                  >
                    {copied === 'body' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={shareViaEmail}
                    className="mt-2"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Abrir Cliente de Email
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* QR Code */}
          <TabsContent value="qr" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  QR Code para acesso rápido às informações da igreja
                </p>
                
                <div className="flex justify-center mb-4">
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR Code da ${church.name}`}
                      className="w-32 h-32"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="w-32 h-32 hidden items-center justify-center text-gray-400">
                      <QrCode className="h-16 w-16" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge variant="outline">
                    Acesso público às informações da igreja
                  </Badge>
                  
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(churchUrl, 'qr-url')}
                    >
                      {copied === 'qr-url' ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copiar Link
                    </Button>
                    
                    <Button onClick={downloadQRCode}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar QR Code
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Como usar:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Imprima o QR Code em cartões, folders ou banners</li>
                  <li>• Coloque em locais estratégicos da igreja</li>
                  <li>• Visitantes podem escanear para acessar informações</li>
                  <li>• Funciona como cartão de visita digital</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareChurchModal;