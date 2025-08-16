import { useState, useEffect } from 'react';

export interface DenominationExecutiveData {
  overview: {
    totalChurches: number;
    totalMembers: number;
    monthlyRevenue: number;
    overallHealth: number;
    growthRate: number;
    revenueGrowth: number;
    memberGrowth: number;
    churchesGrowth: number;
  };
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    church?: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
  }>;
  churchPerformance: Array<{
    id: number;
    name: string;
    city: string;
    state: string;
    region: string;
    members: number;
    monthlyRevenue: number;
    growthRate: number;
    healthScore: number;
    status: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    rank: number;
    revenuePerMember: number;
    visitorsThisMonth: number;
    activitiesCount: number;
  }>;
  geographicDistribution: Array<{
    region: string;
    churches: number;
    members: number;
    revenue: number;
    revenuePerMember: number;
    growthRate: number;
    penetration: number;
    color: string;
  }>;
  financialTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netResult: number;
  }>;
  insights: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'achievement' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
    icon: string;
  }>;
}

export const useDenominationMockData = () => {
  const [data, setData] = useState<DenominationExecutiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: DenominationExecutiveData = {
        overview: {
          totalChurches: 8,
          totalMembers: 2453,
          monthlyRevenue: 189750, // Baseado em R$ 150 por membro médio
          overallHealth: 87,
          growthRate: 12.4,
          revenueGrowth: 15.2,
          memberGrowth: 8.7,
          churchesGrowth: 0 // Sem novas igrejas este mês
        },
        alerts: [
          {
            id: 'alert-1',
            type: 'critical',
            title: 'Igreja Ribeirão em Declínio',
            description: 'Perda de 15% dos membros nos últimos 3 meses',
            church: 'Igreja Ribeirão Preto',
            priority: 'high',
            action: 'Intervenção Pastoral Necessária'
          },
          {
            id: 'alert-2',
            type: 'warning',
            title: 'Meta de Dízimos Não Atingida',
            description: '3 igrejas abaixo da meta mensal de arrecadação',
            priority: 'medium',
            action: 'Revisar Estratégia Financeira'
          },
          {
            id: 'alert-3',
            type: 'info',
            title: 'Oportunidade de Expansão',
            description: 'Região Norte com alta demanda e baixa concorrência',
            priority: 'medium',
            action: 'Avaliar Viabilidade'
          }
        ],
        churchPerformance: [
          {
            id: 1,
            name: 'Igreja Central São Paulo',
            city: 'São Paulo',
            state: 'SP',
            region: 'Sudeste',
            members: 782,
            monthlyRevenue: 58650,
            growthRate: 18.2,
            healthScore: 94,
            status: 'excellent',
            rank: 1,
            revenuePerMember: 75,
            visitorsThisMonth: 89,
            activitiesCount: 12
          },
          {
            id: 2,
            name: 'Igreja Campinas',
            city: 'Campinas',
            state: 'SP',
            region: 'Sudeste',
            members: 443,
            monthlyRevenue: 35425,
            growthRate: 12.8,
            healthScore: 89,
            status: 'excellent',
            rank: 2,
            revenuePerMember: 80,
            visitorsThisMonth: 67,
            activitiesCount: 8
          },
          {
            id: 3,
            name: 'Igreja Santos',
            city: 'Santos',
            state: 'SP',
            region: 'Sudeste',
            members: 507,
            monthlyRevenue: 38025,
            growthRate: 8.5,
            healthScore: 85,
            status: 'good',
            rank: 3,
            revenuePerMember: 75,
            visitorsThisMonth: 45,
            activitiesCount: 7
          },
          {
            id: 4,
            name: 'Igreja Porto Alegre',
            city: 'Porto Alegre',
            state: 'RS',
            region: 'Sul',
            members: 398,
            monthlyRevenue: 27860,
            growthRate: 6.2,
            healthScore: 82,
            status: 'good',
            rank: 4,
            revenuePerMember: 70,
            visitorsThisMonth: 38,
            activitiesCount: 6
          },
          {
            id: 5,
            name: 'Igreja Curitiba',
            city: 'Curitiba',
            state: 'PR',
            region: 'Sul',
            members: 289,
            monthlyRevenue: 20230,
            growthRate: 4.1,
            healthScore: 78,
            status: 'average',
            rank: 5,
            revenuePerMember: 70,
            visitorsThisMonth: 29,
            activitiesCount: 5
          },
          {
            id: 6,
            name: 'Igreja Salvador',
            city: 'Salvador',
            state: 'BA',
            region: 'Nordeste',
            members: 234,
            monthlyRevenue: 14040,
            growthRate: 2.8,
            healthScore: 75,
            status: 'average',
            rank: 6,
            revenuePerMember: 60,
            visitorsThisMonth: 22,
            activitiesCount: 4
          },
          {
            id: 7,
            name: 'Igreja Brasília',
            city: 'Brasília',
            state: 'DF',
            region: 'Centro-Oeste',
            members: 176,
            monthlyRevenue: 12320,
            growthRate: 1.2,
            healthScore: 72,
            status: 'poor',
            rank: 7,
            revenuePerMember: 70,
            visitorsThisMonth: 18,
            activitiesCount: 3
          },
          {
            id: 8,
            name: 'Igreja Ribeirão Preto',
            city: 'Ribeirão Preto',
            state: 'SP',
            region: 'Sudeste',
            members: 124,
            monthlyRevenue: 6820,
            growthRate: -8.5,
            healthScore: 58,
            status: 'critical',
            rank: 8,
            revenuePerMember: 55,
            visitorsThisMonth: 8,
            activitiesCount: 2
          }
        ],
        geographicDistribution: [
          {
            region: 'Sudeste',
            churches: 4,
            members: 1856,
            revenue: 138920,
            revenuePerMember: 75,
            growthRate: 10.2,
            penetration: 76,
            color: '#3B82F6'
          },
          {
            region: 'Sul',
            churches: 2,
            members: 687,
            revenue: 48090,
            revenuePerMember: 70,
            growthRate: 5.1,
            penetration: 28,
            color: '#10B981'
          },
          {
            region: 'Nordeste',
            churches: 1,
            members: 234,
            revenue: 14040,
            revenuePerMember: 60,
            growthRate: 2.8,
            penetration: 9,
            color: '#F59E0B'
          },
          {
            region: 'Centro-Oeste',
            churches: 1,
            members: 176,
            revenue: 12320,
            revenuePerMember: 70,
            growthRate: 1.2,
            penetration: 7,
            color: '#EF4444'
          }
        ],
        financialTrends: [
          { month: 'Mar', revenue: 165000, expenses: 128000, netResult: 37000 },
          { month: 'Abr', revenue: 172000, expenses: 131000, netResult: 41000 },
          { month: 'Mai', revenue: 178000, expenses: 134000, netResult: 44000 },
          { month: 'Jun', revenue: 183000, expenses: 137000, netResult: 46000 },
          { month: 'Jul', revenue: 186000, expenses: 139000, netResult: 47000 },
          { month: 'Ago', revenue: 189750, expenses: 142000, netResult: 47750 }
        ],
        insights: [
          {
            id: 'insight-1',
            type: 'opportunity',
            title: 'Potencial de Expansão no Norte',
            description: 'Região Norte apresenta alta demanda por igrejas evangélicas e baixa concorrência denominacional',
            confidence: 85,
            impact: 'high',
            icon: 'TrendingUp'
          },
          {
            id: 'insight-2',
            type: 'risk',
            title: 'Igrejas em Declínio Precisam Atenção',
            description: '2 igrejas apresentam tendência de declínio nos últimos 6 meses',
            confidence: 92,
            impact: 'high',
            icon: 'AlertTriangle'
          },
          {
            id: 'insight-3',
            type: 'achievement',
            title: 'Meta de Crescimento Superada',
            description: 'Crescimento de membros superou a meta anual em 24%',
            confidence: 100,
            impact: 'medium',
            icon: 'Target'
          },
          {
            id: 'insight-4',
            type: 'recommendation',
            title: 'Otimização de Recursos Financeiros',
            description: 'Redistribuição de recursos pode aumentar eficiência em 15%',
            confidence: 78,
            impact: 'medium',
            icon: 'DollarSign'
          }
        ]
      };

      setData(mockData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  return { data, isLoading };
};