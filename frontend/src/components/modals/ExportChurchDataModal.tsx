import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileBarChart,
  Calendar,
  Users,
  MapPin,
  Activity,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ChurchDetails } from '@/types/hierarchy';
import { churchService } from '@/services/churchService';

interface ExportChurchDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  church: ChurchDetails;
}

interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  dateRange: 'all' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  includeData: {
    basic_info: boolean;
    members: boolean;
    visitors: boolean;
    activities: boolean;
    finances: boolean;
    statistics: boolean;
    branches: boolean;
  };
}

const ExportChurchDataModal: React.FC<ExportChurchDataModalProps> = ({
  isOpen,
  onClose,
  church
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'xlsx',
    dateRange: 'last_3_months',
    includeData: {
      basic_info: true,
      members: true,
      visitors: true,
      activities: true,
      finances: false,
      statistics: true,
      branches: true,
    }
  });

  const formatOptions = [
    {
      value: 'xlsx',
      label: 'Excel (XLSX)',
      description: 'Planilha completa com múltiplas abas',
      icon: FileSpreadsheet,
      recommended: true
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Arquivo de texto separado por vírgulas',
      icon: FileText,
      recommended: false
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Relatório formatado para impressão',
      icon: FileBarChart,
      recommended: false
    }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Todos os dados' },
    { value: 'last_month', label: 'Último mês' },
    { value: 'last_3_months', label: 'Últimos 3 meses' },
    { value: 'last_6_months', label: 'Últimos 6 meses' },
    { value: 'last_year', label: 'Último ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const dataTypes = [
    {
      key: 'basic_info',
      label: 'Informações Básicas',
      description: 'Nome, endereço, contato, plano de assinatura',
      icon: FileText,
      size: '~5 KB'
    },
    {
      key: 'members',
      label: 'Membros',
      description: 'Lista de membros, dados de contato, funções',
      icon: Users,
      size: '~50 KB'
    },
    {
      key: 'visitors',
      label: 'Visitantes',
      description: 'Registros de visitantes, datas de visita, contatos',
      icon: MapPin,
      size: '~20 KB'
    },
    {
      key: 'activities',
      label: 'Atividades',
      description: 'Eventos, cultos, estudos bíblicos, participantes',
      icon: Activity,
      size: '~30 KB'
    },
    {
      key: 'finances',
      label: 'Dados Financeiros',
      description: 'Dízimos, ofertas, despesas (requer permissão)',
      icon: DollarSign,
      size: '~15 KB',
      requiresPermission: true
    },
    {
      key: 'statistics',
      label: 'Estatísticas',
      description: 'Métricas de crescimento, relatórios analíticos',
      icon: FileBarChart,
      size: '~10 KB'
    },
    {
      key: 'branches',
      label: 'Congregações',
      description: 'Informações das congregações e suas estatísticas',
      icon: MapPin,
      size: '~25 KB'
    }
  ];

  const handleDataTypeChange = (key: keyof ExportOptions['includeData'], checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      includeData: {
        ...prev.includeData,
        [key]: checked
      }
    }));
  };

  const getEstimatedSize = () => {
    let totalSize = 0;
    Object.entries(options.includeData).forEach(([key, included]) => {
      if (included) {
        const dataType = dataTypes.find(dt => dt.key === key);
        if (dataType) {
          const sizeInKB = parseInt(dataType.size.match(/\d+/)?.[0] || '0');
          totalSize += sizeInKB;
        }
      }
    });
    
    if (totalSize < 1024) {
      return `~${totalSize} KB`;
    }
    return `~${(totalSize / 1024).toFixed(1)} MB`;
  };

  const getSelectedDataCount = () => {
    return Object.values(options.includeData).filter(Boolean).length;
  };

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleExport = async () => {
    if (getSelectedDataCount() === 0) {
      toast({
        title: 'Nenhum dado selecionado',
        description: 'Selecione pelo menos um tipo de dado para exportar.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(5);

    const progressInterval = simulateProgress();

    try {
      // Preparar filtros baseados no período
      let filters: any = {};
      
      if (options.dateRange !== 'all') {
        let now = new Date();
        let startDate = new Date();
        
        switch (options.dateRange) {
          case 'last_month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'last_3_months':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'last_6_months':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case 'last_year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case 'custom':
            if (options.customStartDate) startDate = new Date(options.customStartDate);
            if (options.customEndDate) now = new Date(options.customEndDate);
            break;
        }
        
        filters.start_date = startDate.toISOString();
        filters.end_date = now.toISOString();
      }

      // Adicionar configurações de dados a incluir
      filters.include_data = options.includeData;

      const blob = await churchService.exportChurches(options.format, filters);
      
      setExportProgress(100);
      
      // Download do arquivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${church.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.${options.format}`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída!',
        description: `Os dados da ${church.name} foram exportados com sucesso.`,
      });

      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (error: any) {
      clearInterval(progressInterval);
      setIsExporting(false);
      setExportProgress(0);
      
      toast({
        title: 'Erro na exportação',
        description: error.response?.data?.message || 'Erro ao exportar dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isExporting) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600 animate-bounce" />
              Exportando Dados
            </DialogTitle>
            <DialogDescription>
              Aguarde enquanto preparamos seus dados...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>

            <div className="text-center text-sm text-gray-600">
              {exportProgress < 30 && 'Coletando dados...'}
              {exportProgress >= 30 && exportProgress < 60 && 'Processando informações...'}
              {exportProgress >= 60 && exportProgress < 90 && 'Formatando arquivo...'}
              {exportProgress >= 90 && exportProgress < 100 && 'Finalizando...'}
              {exportProgress === 100 && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Concluído!
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Exportar Dados - {church.name}
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para baixar os dados da igreja
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato do Arquivo */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Formato do Arquivo
            </h3>
            
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as any }))}
            >
              <div className="grid gap-3">
                {formatOptions.map((format) => (
                  <div key={format.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={format.value} id={format.value} />
                    <Label htmlFor={format.value} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <format.icon className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {format.label}
                              {format.recommended && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{format.description}</div>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Período dos Dados */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período dos Dados
            </h3>
            
            <Select
              value={options.dateRange}
              onValueChange={(value) => setOptions(prev => ({ ...prev, dateRange: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {options.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <input
                    id="start-date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={options.customStartDate || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, customStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Data Final</Label>
                  <input
                    id="end-date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={options.customEndDate || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, customEndDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Tipos de Dados */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Dados a Incluir
            </h3>
            
            <div className="space-y-3">
              {dataTypes.map((dataType) => (
                <div key={dataType.key} className="flex items-start space-x-3">
                  <Checkbox
                    id={dataType.key}
                    checked={options.includeData[dataType.key as keyof ExportOptions['includeData']]}
                    onCheckedChange={(checked) => 
                      handleDataTypeChange(dataType.key as keyof ExportOptions['includeData'], checked as boolean)
                    }
                    disabled={dataType.requiresPermission}
                  />
                  <Label htmlFor={dataType.key} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <dataType.icon className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {dataType.label}
                            {dataType.requiresPermission && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Requer Permissão
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{dataType.description}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">{dataType.size}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Resumo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resumo da Exportação
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Formato:</span>
                <span className="font-medium">{formatOptions.find(f => f.value === options.format)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Período:</span>
                <span className="font-medium">{dateRangeOptions.find(d => d.value === options.dateRange)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipos de dados:</span>
                <span className="font-medium">{getSelectedDataCount()} selecionado(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Tamanho estimado:</span>
                <span className="font-medium">{getEstimatedSize()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={getSelectedDataCount() === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportChurchDataModal;