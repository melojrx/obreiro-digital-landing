import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Church } from 'lucide-react';

interface RoleExplanationCardProps {
  className?: string;
}

export const RoleExplanationCard: React.FC<RoleExplanationCardProps> = ({ className }) => {
  return (
    <Card className={`bg-blue-50 border-blue-200 ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-3">
            <h4 className="font-medium text-blue-800">
              💡 Diferença entre Papéis de Sistema e Funções Ministeriais
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Papéis de Sistema */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Papéis de Sistema</span>
                </div>
                <p className="text-blue-700">
                  Controlam <strong>permissões de acesso</strong> no sistema
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    Admin da Igreja
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    Pastor
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    Secretário
                  </Badge>
                </div>
              </div>

              {/* Funções Ministeriais */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Church className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Funções Ministeriais</span>
                </div>
                <p className="text-green-700">
                  Descrevem o <strong>cargo na igreja</strong> (função eclesiástica)
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Pastor
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Diácono
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Líder
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-100 p-3 rounded-md border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Exemplo:</strong> Um usuário pode ser <Badge variant="outline" className="mx-1 text-xs">Membro</Badge> 
                no sistema (permissões limitadas) mas ter função ministerial de 
                <Badge variant="outline" className="mx-1 text-xs">Pastor</Badge> na igreja.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleExplanationCard;