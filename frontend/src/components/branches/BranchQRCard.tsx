import React from 'react';
import { Download, MapPin, Users, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BranchQRCardProps {
  branch: {
    id: number;
    name: string;
    church_name: string;
    city: string;
    state: string;
    qr_code_uuid: string;
    qr_code_image: string;
    qr_code_active: boolean;
    total_visitors_registered: number;
    allows_visitor_registration: boolean;
  };
  onDownload?: (branchId: number) => void;
  onToggleQR?: (branchId: number) => void;
  canManage?: boolean;
}

export const BranchQRCard: React.FC<BranchQRCardProps> = ({
  branch,
  onDownload,
  onToggleQR,
  canManage = false,
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload(branch.id);
    } else if (branch.qr_code_image) {
      // Download direto
      const link = document.createElement('a');
      link.href = branch.qr_code_image;
      link.download = `qrcode-${branch.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{branch.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{branch.city}, {branch.state}</span>
            </CardDescription>
            {branch.church_name && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {branch.church_name}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-1 ml-2">
            <Badge variant={branch.qr_code_active ? "default" : "secondary"} className="text-xs">
              {branch.qr_code_active ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativo
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Inativo
                </>
              )}
            </Badge>
            
            {branch.allows_visitor_registration && (
              <Badge variant="outline" className="text-xs">
                <QrCode className="h-3 w-3 mr-1" />
                Registro
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* QR Code Image */}
          <div className="flex-shrink-0">
            {branch.qr_code_image ? (
              <div className="relative">
                <img
                  src={branch.qr_code_image}
                  alt={`QR Code ${branch.name}`}
                  className="w-48 h-48 border-2 border-gray-200 rounded-lg object-contain bg-white"
                />
                {!branch.qr_code_active && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center">
                    <Badge variant="destructive">Desativado</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                  <QrCode className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">QR Code não gerado</p>
                </div>
              </div>
            )}
          </div>

          {/* Info e Actions */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  <strong className="text-foreground">{branch.total_visitors_registered || 0}</strong> visitante{branch.total_visitors_registered !== 1 ? 's' : ''} registrado{branch.total_visitors_registered !== 1 ? 's' : ''}
                </span>
              </div>

              {/* QR Code URL */}
              {branch.qr_code_uuid && (
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="text-xs text-muted-foreground mb-1">Link do QR Code:</p>
                  <code className="text-xs break-all text-blue-600">
                    {`${window.location.origin}/visit/${branch.qr_code_uuid}`}
                  </code>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {branch.qr_code_image && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
              )}
              
              {canManage && onToggleQR && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleQR(branch.id)}
                  className="flex-1 sm:flex-initial"
                >
                  {branch.qr_code_active ? 'Desativar' : 'Ativar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
