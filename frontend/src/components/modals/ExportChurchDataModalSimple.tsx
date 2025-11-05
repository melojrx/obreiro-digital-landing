/**
 * Modal Simplificado de Exportação de Igrejas
 * 
 * Seguindo o padrão que funciona na exportação de membros:
 * - Apenas CSV
 * - Sem filtros complexos
 * - Chamada direta à API
 */

import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ChurchDetails } from '@/types/hierarchy';
import { churchService } from '@/services/churchService';

interface ExportChurchDataModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  church: ChurchDetails;
}

const ExportChurchDataModalSimple: React.FC<ExportChurchDataModalSimpleProps> = ({
  isOpen,
  onClose,
  church
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);

    try {
      // Chamada direta sem filtros complexos
      const blob = await churchService.exportChurchesCSV();
      
      // Criar download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo com timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `igrejas_${timestamp}.csv`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Feedback de sucesso
      toast({
        title: 'Exportação concluída!',
        description: `Arquivo ${fileName} baixado com sucesso.`,
      });

      // Fechar modal após 500ms
      setTimeout(() => {
        onClose();
        setIsExporting(false);
      }, 500);

    } catch (error) {
      console.error('Erro ao exportar igrejas:', error);
      
      setIsExporting(false);
      
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Erro ao exportar dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Exportar Dados de Igrejas
          </DialogTitle>
          <DialogDescription>
            Exportar lista de igrejas em formato CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informação sobre o formato */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Formato CSV (Recomendado)
                </p>
                <p className="text-xs text-blue-700">
                  Arquivo compatível com Excel, Google Sheets e outros aplicativos.
                  Inclui: Nome, Endereço, Contato, Plano, Membros, Congregações.
                </p>
              </div>
            </div>
          </div>

          {/* Informação sobre os dados */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Dados incluídos:</strong>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Informações básicas (nome, CNPJ, contato)</li>
              <li>• Localização (endereço, cidade, estado)</li>
              <li>• Plano de assinatura e status</li>
              <li>• Total de membros e congregações</li>
              <li>• Data de criação</li>
            </ul>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportChurchDataModalSimple;
