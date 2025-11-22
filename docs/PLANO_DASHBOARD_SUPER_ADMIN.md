# 📊 Dashboard Super Admin - Plano de Implementação

## 🎯 Visão Geral

Dashboard executiva para **Super Admins (Nível 4)** - desenvolvedores e proprietários da plataforma SaaS. Fornece visão estratégica completa do negócio, métricas de crescimento, saúde financeira e uso da plataforma.

---

## 👤 Perfil do Usuário

### SUPER_ADMIN (Nível 4)
- **Quem são:** Desenvolvedores e proprietários da plataforma
- **Criação:** Exclusivamente via comando Django (`createsuperuser`)
- **Acesso:** Irrestrito a todos os dados da plataforma
- **Objetivo:** Monitorar saúde do negócio, crescimento, receitas e uso do sistema

---

## 📈 KPIs e Métricas Essenciais

### 1️⃣ **Visão Geral do Negócio** (Cards Principais)

#### Usuários e Crescimento
- **Total de Usuários Cadastrados**
  - Valor absoluto
  - Crescimento % vs mês anterior
  - Gráfico sparkline (últimos 7 dias)

- **Novos Usuários (Mês Atual)**
  - Quantidade de novos cadastros no mês
  - Comparativo com mês anterior
  - Meta mensal (configurável)

- **Usuários Ativos (30 dias)**
  - Usuários que fizeram login nos últimos 30 dias
  - Taxa de ativação (ativos/total)
  - Tendência de engajamento

- **Taxa de Retenção**
  - Usuários que retornam após primeiro login
  - Coorte mensal de retenção
  - Benchmark: >60% retenção em 30 dias

#### Igrejas e Organizações
- **Total de Igrejas Cadastradas**
  - Total de churches ativas
  - Crescimento % vs mês anterior
  - Distribuição por estado/região

- **Total de Denominações**
  - Denominações cadastradas
  - Igrejas por denominação (média)
  - Top 5 denominações por número de igrejas

- **Total de Congregações/Filiais**
  - Branches ativas
  - Média de filiais por igreja
  - Igrejas sem filiais (potencial de crescimento)

- **Novas Igrejas (Mês Atual)**
  - Novas churches este mês
  - Conversão trial → pago
  - Churn rate (cancelamentos)

#### Membros e Engajamento
- **Total de Membros Cadastrados**
  - Soma de todos os members no sistema
  - Média de membros por igreja
  - Distribuição por função ministerial

- **Total de Visitantes Registrados**
  - Visitantes via QR Code
  - Taxa de conversão visitante → membro
  - Igrejas com maior captação

- **Atividades Criadas (Mês)**
  - Total de atividades/eventos
  - Igrejas mais ativas
  - Tipos de atividades mais comuns

### 2️⃣ **Métricas Financeiras** (SaaS)

#### Receita e MRR
- **MRR (Monthly Recurring Revenue)**
  - Receita recorrente mensal
  - Crescimento % vs mês anterior
  - Projeção anual (ARR)

- **Receita por Plano**
  - Basic: R$ 0/mês × N igrejas
  - Professional: R$ 99/mês × N igrejas
  - Enterprise: R$ 299/mês × N igrejas
  - Denomination: Sob consulta

- **Lifetime Value (LTV)**
  - Valor médio por igreja ao longo do tempo
  - LTV por plano
  - Tempo médio de permanência

- **Churn Rate**
  - Taxa de cancelamento mensal
  - Motivos de cancelamento
  - Valor de receita perdida

#### Planos e Conversão
- **Distribuição por Plano**
  - Gráfico pizza: % de igrejas em cada plano
  - Receita por plano
  - Oportunidade de upsell

- **Igrejas em Trial**
  - Quantidade em período de teste
  - Dias restantes médio
  - Taxa de conversão trial → pago

- **Igrejas Vencidas**
  - Assinaturas expiradas
  - Valor em risco
  - Tempo médio até cancelamento

- **Taxa de Conversão Trial → Pago**
  - % de conversão histórica
  - Benchmark: >40% conversão
  - Fatores de sucesso na conversão

### 3️⃣ **Métricas de Uso e Saúde da Plataforma**

#### Adoção de Funcionalidades
- **Taxa de Adoção por Feature**
  - % de igrejas usando cada funcionalidade:
    - Gestão de Membros: X%
    - Registro de Visitantes: X%
    - QR Codes: X%
    - Atividades/Eventos: X%
    - Ministérios: X%
    - Sistema de Oração: X%

- **Igrejas Power Users**
  - Top 10 igrejas por uso (ações/mês)
  - Média de features utilizadas
  - Igrejas com baixo uso (risco churn)

#### Performance e Limites
- **Uso de Limites por Plano**
  - Igrejas próximas ao limite de membros
  - Igrejas próximas ao limite de filiais
  - Oportunidades de upgrade

- **Membros por Igreja**
  - Distribuição (histograma)
  - Média, mediana, percentis
  - Igrejas com >80% do limite

- **Filiais por Igreja**
  - Distribuição
  - Igrejas com potencial de expansão
  - Utilização média por plano

### 4️⃣ **Métricas Geográficas**

#### Mapa Interativo do Brasil
- **Visualização Principal:**
  - Mapa geográfico do Brasil com SVG responsivo
  - Marcadores customizados em formato de igrejinha (🏛️/⛪) para cada localização
  - Cores diferenciadas por densidade (escala de calor)
  - Hover mostrando detalhes: Estado, Quantidade de igrejas, Total de usuários
  - Click no estado para drill-down com lista de cidades

- **Legenda Interativa:**
  - **Por Estado:** Tabela lateral com:
    - Nome do estado (sigla + nome completo)
    - Quantidade de igrejas cadastradas
    - Total de usuários (membros + visitantes)
    - Total de membros ativos
    - Planos mais utilizados no estado
    - Taxa de crescimento nos últimos 3 meses
  
  - **Por Região:** Cards agrupados:
    - Norte, Nordeste, Centro-Oeste, Sudeste, Sul
    - Total de igrejas por região
    - % do total nacional
    - Média de membros por igreja
    - Potencial de expansão (score 0-100)

- **Distribuição por Estado (Top 10)**
  - Ranking dos estados com mais igrejas
  - Gráfico de barras horizontais
  - Indicador de saturação vs população do estado
  - Destaque para estados estratégicos

- **Oportunidades de Expansão**
  - Análise de estados com baixa penetração
  - Score de oportunidade baseado em:
    - População do estado
    - PIB per capita
    - Número de igrejas evangélicas (dados do IBGE)
    - Concorrência (outros sistemas)
    - Presença atual da plataforma
  - Sugestão de regiões prioritárias para marketing

- **Distribuição por Cidade (Top 20)**
  - Cidades com mais igrejas cadastradas
  - Destaque para capitais vs interior
  - Densidade por habitante
  - Potencial de marketing local
  - Clusters geográficos (áreas de concentração)

### 5️⃣ **Métricas de Qualidade e Suporte**

- **Dados de Completude**
  - % de perfis completos
  - % de igrejas com logo/capa
  - % de membros com foto

- **Qualidade dos Dados**
  - Membros sem data de nascimento
  - Igrejas sem CNPJ
  - Dados obrigatórios faltantes

---

## 📊 Gráficos e Visualizações

### Gráficos de Linha (Evolução Temporal)

1. **Evolução de Usuários**
   - Linha: Total acumulado de usuários
   - Barras: Novos usuários por mês
   - Período: Últimos 12 meses

2. **Evolução de Igrejas**
   - Linha: Total acumulado de igrejas
   - Barras: Novas igrejas por mês
   - Segmentado por plano (cores)

3. **Evolução de Receita (MRR)**
   - Linha: MRR ao longo do tempo
   - Área empilhada por plano
   - Linha de meta

4. **Taxa de Crescimento (%)**
   - MoM Growth Rate (usuários, igrejas, receita)
   - Linha de tendência
   - Alertas para crescimento <5%

### Gráficos de Barra

5. **Igrejas por Plano**
   - Barras horizontais
   - Quantidade e % do total
   - Cores por plano

6. **Usuários por Igreja (Top 20)**
   - Barras horizontais ordenadas
   - Nome da igreja + total de usuários
   - Destaque para limites de plano

7. **Receita por Plano**
   - Barras verticais
   - Valor em R$ por plano
   - % da receita total

8. **Novas Igrejas por Mês (Últimos 6 meses)**
   - Barras agrupadas por plano
   - Comparativo mensal

### Gráficos de Pizza/Donut

9. **Distribuição de Planos**
   - Pizza: % de igrejas por plano
   - Destaque para planos pagos vs gratuito

10. **Status de Assinaturas**
    - Donut: Ativa, Trial, Expirada, Suspensa
    - Valores absolutos e %

11. **Mapa Interativo do Brasil** ⭐ NOVA VISUALIZAÇÃO
    - **Componente:** `BrazilMapChart`
    - **Tecnologia:** SVG interativo com paths dos estados brasileiros
    - **Marcadores:** Ícones de igrejinha (⛪) customizados por localização
    - **Dados Exibidos:**
      - Hover: Estado, quantidade de igrejas, total de usuários
      - Click: Modal/sidebar com drill-down da cidade
    - **Escala de Cores:** Gradient baseado em densidade
      - Branco/Cinza claro: 0-5 igrejas
      - Azul claro: 6-20 igrejas  
      - Azul médio: 21-50 igrejas
      - Azul escuro: 51-100 igrejas
      - Azul intenso: 100+ igrejas
    - **Legenda Lateral:**
      - Tabela com: Estado (sigla), Igrejas, Usuários, Membros Ativos
      - Filtros: Por região, por plano, por status
      - Ordenação: Por quantidade ou crescimento %
    - **Interatividade:**
      - Zoom e pan no mapa
      - Tooltip com detalhes ao passar mouse
      - Click para filtrar outros gráficos por estado
      - Exportar dados geográficos em CSV/Excel

12. **Distribuição Geográfica por Região (Pizza)**
    - Pizza: % de igrejas por região (N, NE, CO, SE, S)
    - Complementa o mapa com visão macro

### Tabelas e Listas

12. **Top 10 Igrejas por Membros**
    - Ranking com nome, cidade, plano, total membros
    - Indicador de proximidade ao limite

13. **Igrejas Recentes (Últimas 10)**
    - Data de cadastro, nome, plano, status
    - Dias em trial

14. **Igrejas em Risco de Churn**
    - Último login, dias inativo, plano
    - Score de risco (0-100)

15. **Alertas e Notificações**
    - Igrejas com assinatura vencendo (7 dias)
    - Igrejas próximas ao limite de membros
    - Anomalias de uso (queda abrupta)

### Métricas de Coorte

16. **Análise de Coorte de Retenção**
    - Tabela de coorte mensal
    - % de igrejas ativas por mês após cadastro
    - Heatmap de retenção

---

## 🏗️ Arquitetura Técnica

### Backend (Django)

#### 1. Novo App: `platform_analytics`
```
backend/apps/platform_analytics/
├── __init__.py
├── models.py              # Modelos de cache/snapshot
├── views.py               # ViewSets e API endpoints
├── serializers.py         # Serializers para dados agregados
├── services.py            # Lógica de negócio e cálculos
├── tasks.py               # Celery tasks para processamento assíncrono
├── permissions.py         # IsSuperAdmin permission class
└── urls.py                # Rotas da API
```

#### 2. Novos Endpoints

```python
# KPIs Principais
GET /api/v1/platform/overview/
{
  "users": {
    "total": 1250,
    "new_this_month": 87,
    "active_30d": 980,
    "growth_percent": 7.5
  },
  "churches": {
    "total": 345,
    "new_this_month": 12,
    "by_plan": {...},
    "growth_percent": 3.6
  },
  "revenue": {
    "mrr": 28500.00,
    "arr": 342000.00,
    "growth_percent": 12.3
  }
}

# Gráficos de Evolução
GET /api/v1/platform/charts/users-evolution/
GET /api/v1/platform/charts/churches-evolution/
GET /api/v1/platform/charts/revenue-evolution/

# Distribuições
GET /api/v1/platform/distributions/plans/
GET /api/v1/platform/distributions/subscription-status/
GET /api/v1/platform/distributions/geography/

# ⭐ NOVO: Dados Geográficos Detalhados
GET /api/v1/platform/geography/map-data/
{
  "states": [
    {
      "code": "SP",
      "name": "São Paulo",
      "region": "Sudeste",
      "churches_count": 156,
      "total_users": 4320,
      "active_members": 3890,
      "coordinates": {
        "lat": -23.5505,
        "lng": -46.6333
      },
      "growth_rate_3m": 8.5,
      "top_plans": ["Professional", "Enterprise"],
      "cities": [
        {
          "name": "São Paulo",
          "churches_count": 87,
          "users": 2450
        },
        {
          "name": "Campinas",
          "churches_count": 23,
          "users": 680
        }
      ]
    }
  ],
  "regions": {
    "Sudeste": {
      "states_count": 4,
      "churches_count": 289,
      "users_count": 8934,
      "percentage": 45.2
    },
    "Sul": {...},
    "Nordeste": {...},
    "Norte": {...},
    "Centro-Oeste": {...}
  },
  "opportunities": [
    {
      "state": "BA",
      "score": 85,
      "reason": "Alta população, baixa penetração",
      "population": 14016906,
      "current_churches": 12,
      "potential_churches": 150
    }
  ]
}

GET /api/v1/platform/geography/states/<state_code>/
# Detalhes de um estado específico com lista completa de cidades

GET /api/v1/platform/geography/expansion-opportunities/
# Lista de estados/regiões prioritários para expansão

# Rankings e Listas
GET /api/v1/platform/rankings/top-churches/
GET /api/v1/platform/rankings/recent-churches/
GET /api/v1/platform/alerts/churn-risk/

# Análises Avançadas
GET /api/v1/platform/analytics/cohort-retention/
GET /api/v1/platform/analytics/feature-adoption/
GET /api/v1/platform/analytics/conversion-funnel/
```

#### 3. Service Layer (`services.py`)

```python
class PlatformAnalyticsService:
    """Serviço centralizado para cálculos de métricas"""
    
    @staticmethod
    def get_overview_metrics():
        """KPIs principais do dashboard"""
        pass
    
    @staticmethod
    def calculate_mrr():
        """Calcula MRR baseado nos planos ativos"""
        pass
    
    @staticmethod
    def get_user_growth_data(months=12):
        """Dados de crescimento de usuários"""
        pass
    
    @staticmethod
    def get_church_growth_data(months=12):
        """Dados de crescimento de igrejas"""
        pass
    
    @staticmethod
    def calculate_churn_rate(period='monthly'):
        """Taxa de churn de igrejas"""
        pass
    
    @staticmethod
    def get_cohort_retention(start_date=None):
        """Análise de coorte de retenção"""
        pass
    
    @staticmethod
    def get_geography_map_data():
        """⭐ Dados geográficos para mapa do Brasil"""
        from django.db.models import Count, Q
        from apps.churches.models import Church
        from apps.accounts.models import CustomUser
        from apps.members.models import Member
        
        # Agregar dados por estado
        states_data = Church.objects.values('state').annotate(
            churches_count=Count('id'),
            total_users=Count('users', distinct=True),
            active_members=Count(
                'members',
                filter=Q(members__is_active=True),
                distinct=True
            )
        ).order_by('-churches_count')
        
        # Calcular crescimento dos últimos 3 meses
        from django.utils import timezone
        from datetime import timedelta
        
        three_months_ago = timezone.now() - timedelta(days=90)
        
        result = []
        for state in states_data:
            state_code = state['state']
            
            # Calcular crescimento
            old_count = Church.objects.filter(
                state=state_code,
                created_at__lt=three_months_ago
            ).count()
            
            current_count = state['churches_count']
            growth_rate = 0
            if old_count > 0:
                growth_rate = ((current_count - old_count) / old_count) * 100
            
            # Obter cidades principais
            cities = Church.objects.filter(state=state_code).values('city').annotate(
                churches_count=Count('id'),
                users=Count('users', distinct=True)
            ).order_by('-churches_count')[:5]
            
            result.append({
                'code': state_code,
                'name': get_state_full_name(state_code),
                'region': get_state_region(state_code),
                'churches_count': state['churches_count'],
                'total_users': state['total_users'],
                'active_members': state['active_members'],
                'coordinates': get_state_coordinates(state_code),
                'growth_rate_3m': round(growth_rate, 2),
                'cities': list(cities)
            })
        
        # Agregar por região
        regions = {}
        for state in result:
            region = state['region']
            if region not in regions:
                regions[region] = {
                    'states_count': 0,
                    'churches_count': 0,
                    'users_count': 0
                }
            regions[region]['states_count'] += 1
            regions[region]['churches_count'] += state['churches_count']
            regions[region]['users_count'] += state['total_users']
        
        # Calcular percentuais
        total_churches = sum(s['churches_count'] for s in result)
        for region_data in regions.values():
            region_data['percentage'] = round(
                (region_data['churches_count'] / total_churches) * 100, 1
            )
        
        return {
            'states': result,
            'regions': regions,
            'opportunities': calculate_expansion_opportunities(result)
        }
    
    @staticmethod
    def calculate_expansion_opportunities(states_data):
        """⭐ Identifica oportunidades de expansão"""
        # Dados de população por estado (IBGE 2022)
        POPULATION_DATA = {
            'SP': 46649132, 'MG': 21292666, 'RJ': 17463349,
            'BA': 14930634, 'PR': 11597484, 'RS': 11466630,
            # ... outros estados
        }
        
        opportunities = []
        for state in states_data:
            state_code = state['code']
            population = POPULATION_DATA.get(state_code, 0)
            
            if population == 0:
                continue
            
            # Calcular penetração (igrejas por 100k habitantes)
            penetration = (state['churches_count'] / population) * 100000
            
            # Score de oportunidade (0-100)
            # Maior score = maior oportunidade
            score = 0
            
            # Fatores que aumentam score:
            # 1. Alta população + baixa penetração
            if population > 5000000 and penetration < 5:
                score += 40
            
            # 2. Baixo número absoluto de igrejas
            if state['churches_count'] < 20:
                score += 30
            
            # 3. Alto crescimento recente (indica demanda)
            if state['growth_rate_3m'] > 10:
                score += 20
            else:
                score += 10
            
            opportunities.append({
                'state': state_code,
                'score': score,
                'reason': get_opportunity_reason(score, population, penetration),
                'population': population,
                'current_churches': state['churches_count'],
                'potential_churches': calculate_potential(population, penetration)
            })
        
        # Ordenar por score (maiores oportunidades primeiro)
        return sorted(opportunities, key=lambda x: x['score'], reverse=True)[:10]


# Funções auxiliares
def get_state_full_name(code):
    """Retorna nome completo do estado"""
    STATES = {
        'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
        'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
        'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
        'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
        'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
        'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
        'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
    }
    return STATES.get(code, code)


def get_state_region(code):
    """Retorna região do estado"""
    REGIONS = {
        'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
        'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
        'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
        'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
        'Sul': ['PR', 'RS', 'SC']
    }
    for region, states in REGIONS.items():
        if code in states:
            return region
    return 'Desconhecido'


def get_state_coordinates(code):
    """Coordenadas do centróide do estado (para marcadores no mapa)"""
    COORDS = {
        'SP': {'lat': -23.5505, 'lng': -46.6333},
        'RJ': {'lat': -22.9068, 'lng': -43.1729},
        'MG': {'lat': -19.9167, 'lng': -43.9345},
        'BA': {'lat': -12.9714, 'lng': -38.5014},
        # ... adicionar todos os 27 estados
    }
    return COORDS.get(code, {'lat': 0, 'lng': 0})
```

#### 4. Permissions

```python
# permissions.py
class IsSuperAdmin(BasePermission):
    """
    Apenas Super Admins (is_superuser=True) podem acessar.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_superuser
        )
```

#### 5. Caching Strategy

```python
# Usar Redis para cache de métricas pesadas
from django.core.cache import cache

def get_cached_overview():
    key = 'platform:overview'
    data = cache.get(key)
    
    if data is None:
        data = PlatformAnalyticsService.get_overview_metrics()
        cache.set(key, data, timeout=300)  # 5 minutos
    
    return data
```

#### 6. Celery Tasks (Opcional - Performance)

```python
# tasks.py
from celery import shared_task

@shared_task
def update_platform_metrics_snapshot():
    """
    Atualiza snapshot diário de métricas para queries rápidas.
    Roda todo dia às 00h.
    """
    snapshot = PlatformMetricsSnapshot.objects.create(
        date=timezone.now().date(),
        total_users=User.objects.count(),
        total_churches=Church.objects.count(),
        mrr=calculate_current_mrr(),
        # ... outras métricas
    )
    return snapshot.id
```

### Frontend (React + TypeScript)

#### 1. Nova Página: `SuperAdminDashboard`

```typescript
// src/pages/SuperAdminDashboard.tsx
interface SuperAdminDashboardProps {}

export function SuperAdminDashboard() {
  // Hooks para dados
  const { data: overview } = usePlatformOverview();
  const { data: userGrowth } = useUserGrowthChart();
  const { data: revenue } = useRevenueChart();
  
  // Renderizar KPIs + Gráficos
}
```

#### 2. Novos Componentes

```
frontend/src/components/platform-admin/
├── KPICard.tsx                    # Card de métrica individual
├── UserGrowthChart.tsx            # Gráfico de crescimento de usuários
├── ChurchGrowthChart.tsx          # Gráfico de crescimento de igrejas
├── RevenueChart.tsx               # Gráfico de receita (MRR)
├── PlanDistributionChart.tsx      # Pizza de distribuição de planos
├── BrazilMapChart.tsx             # ⭐ NOVO: Mapa interativo do Brasil
├── GeographyLegend.tsx            # ⭐ NOVO: Legenda lateral do mapa
├── StateDetailModal.tsx           # ⭐ NOVO: Modal com detalhes do estado
├── ExpansionOpportunities.tsx     # ⭐ NOVO: Card de oportunidades
├── TopChurchesTable.tsx           # Tabela de ranking
├── ChurnRiskTable.tsx             # Tabela de igrejas em risco
├── CohortRetentionHeatmap.tsx    # Heatmap de retenção
└── PlatformAlerts.tsx             # Alertas e notificações
```

##### 🗺️ Componente BrazilMapChart (Implementação Detalhada)

```typescript
// src/components/platform-admin/BrazilMapChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { brazilStatesGeoJSON } from '@/lib/geo-data';

interface StateData {
  code: string;
  name: string;
  region: string;
  churches_count: number;
  total_users: number;
  active_members: number;
  growth_rate_3m: number;
  coordinates: { lat: number; lng: number };
}

interface BrazilMapChartProps {
  data: StateData[];
  onStateClick?: (stateCode: string) => void;
}

export function BrazilMapChart({ data, onStateClick }: BrazilMapChartProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  // Calcula cor baseada na densidade de igrejas
  const getStateColor = (churchesCount: number) => {
    if (churchesCount === 0) return '#f3f4f6'; // Cinza claro
    if (churchesCount <= 5) return '#dbeafe';   // Azul muito claro
    if (churchesCount <= 20) return '#93c5fd';  // Azul claro
    if (churchesCount <= 50) return '#3b82f6';  // Azul médio
    if (churchesCount <= 100) return '#1d4ed8'; // Azul escuro
    return '#1e3a8a';                            // Azul intenso
  };
  
  // Renderiza marcador de igrejinha para estados com igrejas
  const renderChurchMarker = (state: StateData) => {
    if (state.churches_count === 0) return null;
    
    return (
      <g key={`marker-${state.code}`}>
        <circle
          cx={state.coordinates.lng}
          cy={state.coordinates.lat}
          r="8"
          fill="white"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <text
          x={state.coordinates.lng}
          y={state.coordinates.lat}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#3b82f6"
        >
          ⛪
        </text>
      </g>
    );
  };
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Distribuição Geográfica
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {data.reduce((sum, s) => sum + s.churches_count, 0)} igrejas cadastradas
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa SVG */}
          <div className="lg:col-span-2">
            <svg
              viewBox="0 0 1000 800"
              className="w-full h-auto"
              style={{ maxHeight: '600px' }}
            >
              {/* Renderizar paths dos estados */}
              {brazilStatesGeoJSON.map((state) => {
                const stateData = data.find(d => d.code === state.code);
                const churchesCount = stateData?.churches_count || 0;
                
                return (
                  <path
                    key={state.code}
                    d={state.path}
                    fill={getStateColor(churchesCount)}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all hover:opacity-80"
                    onMouseEnter={() => setHoveredState(state.code)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => onStateClick?.(state.code)}
                  />
                );
              })}
              
              {/* Marcadores de igrejas */}
              {data.map(renderChurchMarker)}
            </svg>
            
            {/* Tooltip de hover */}
            {hoveredState && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                {(() => {
                  const state = data.find(s => s.code === hoveredState);
                  return state ? (
                    <div className="text-sm">
                      <p className="font-semibold">{state.name}</p>
                      <p>Igrejas: {state.churches_count}</p>
                      <p>Usuários: {state.total_users}</p>
                      <p>Membros Ativos: {state.active_members}</p>
                      <p className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {state.growth_rate_3m}% (3 meses)
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          
          {/* Legenda Lateral */}
          <GeographyLegend data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
```

```typescript
// src/components/platform-admin/GeographyLegend.tsx
export function GeographyLegend({ data }: { data: StateData[] }) {
  const sortedStates = [...data]
    .sort((a, b) => b.churches_count - a.churches_count)
    .slice(0, 10);
  
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Top 10 Estados</h4>
        <div className="space-y-2">
          {sortedStates.map((state, idx) => (
            <div key={state.code} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">#{idx + 1}</span>
                <span className="font-medium">{state.code}</span>
              </span>
              <div className="flex items-center gap-3">
                <span>{state.churches_count} igrejas</span>
                <span className="text-muted-foreground">
                  {state.total_users} usuários
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Escala de Densidade</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6' }} />
            <span>0 igrejas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dbeafe' }} />
            <span>1-5 igrejas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#93c5fd' }} />
            <span>6-20 igrejas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
            <span>21-50 igrejas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1d4ed8' }} />
            <span>51-100 igrejas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1e3a8a' }} />
            <span>100+ igrejas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

##### 📦 Biblioteca Auxiliar: Dados Geográficos

```typescript
// src/lib/geo-data.ts
// Dados dos paths SVG dos estados brasileiros
// Fonte: IBGE ou bibliotecas como d3-geo

export interface BrazilStateGeo {
  code: string;
  name: string;
  region: string;
  path: string; // SVG path data
  centroid: { lat: number; lng: number };
}

export const brazilStatesGeoJSON: BrazilStateGeo[] = [
  {
    code: 'SP',
    name: 'São Paulo',
    region: 'Sudeste',
    path: 'M 650 580 L 680 590 L 700 610 L 690 630 L 660 625 L 640 605 Z',
    centroid: { lat: -23.5505, lng: -46.6333 }
  },
  // ... outros 26 estados
];

// Nota: Os paths SVG devem ser obtidos de uma fonte confiável
// Recomendações:
// - https://github.com/codeforamerica/click_that_hood/tree/master/public/data
// - https://github.com/tbrugz/geodata-br
// - D3.js geoJSON para gerar paths
```

#### 3. Hooks Customizados

```typescript
// src/hooks/usePlatformAnalytics.ts

export function usePlatformOverview() {
  return useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: () => api.get('/platform/overview/'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUserGrowthChart(months = 12) {
  return useQuery({
    queryKey: ['platform', 'charts', 'users', months],
    queryFn: () => api.get(`/platform/charts/users-evolution/?months=${months}`),
  });
}

// ... outros hooks
```

#### 4. Service Layer

```typescript
// src/services/platformAnalyticsService.ts

export const platformAnalyticsService = {
  async getOverview(): Promise<PlatformOverview> {
    const response = await api.get('/platform/overview/');
    return response.data;
  },
  
  async getUserGrowth(months: number): Promise<UserGrowthData[]> {
    const response = await api.get(`/platform/charts/users-evolution/?months=${months}`);
    return response.data;
  },
  
  // ... outros métodos
};
```

#### 5. Tipos TypeScript

```typescript
// src/types/platform.ts

export interface PlatformOverview {
  users: {
    total: number;
    new_this_month: number;
    active_30d: number;
    growth_percent: number;
  };
  churches: {
    total: number;
    new_this_month: number;
    by_plan: Record<string, number>;
    growth_percent: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    growth_percent: number;
  };
  members: {
    total: number;
    average_per_church: number;
  };
  visitors: {
    total: number;
    conversion_rate: number;
  };
}

export interface UserGrowthDataPoint {
  month: string;
  full_date: string;
  new_users: number;
  total_users: number;
}

// ... outros tipos
```

---

## 🎨 Design e Layout

### Estrutura da Página

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 ObreiroVirtual - Dashboard do Sistema                   │
│                                          [Admin] [Sair]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Visão Geral da Plataforma                               │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Usuários │  │ Igrejas  │  │   MRR    │  │  Membros │   │
│  │  1.250   │  │   345    │  │ R$ 28,5K │  │  15.780  │   │
│  │  ↑ 7.5%  │  │  ↑ 3.6%  │  │ ↑ 12.3%  │  │  ↑ 5.2%  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌───────────────────────┐    │
│  │  Evolução de Usuários   │  │ Evolução de Igrejas   │    │
│  │  [Gráfico Linha+Barra]  │  │ [Gráfico Linha+Barra] │    │
│  └─────────────────────────┘  └───────────────────────┘    │
│                                                              │
│  ┌─────────────────────────┐  ┌───────────────────────┐    │
│  │   Receita MRR (Mensal)  │  │  Distribuição Planos  │    │
│  │  [Gráfico Área Stack]   │  │  [Gráfico Pizza]      │    │
│  └─────────────────────────┘  └───────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Top 10 Igrejas por Número de Membros               │  │
│  │  [Tabela com ranking]                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🚨 Alertas e Ações Necessárias                      │  │
│  │  - 12 igrejas com assinatura vencendo em 7 dias     │  │
│  │  - 5 igrejas próximas ao limite de membros          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Paleta de Cores (Consistente com Dashboard Atual)

- **MRR/Receita**: Verde (#10b981, #34d399)
- **Usuários**: Azul (#3b82f6, #60a5fa)
- **Igrejas**: Roxo (#8b5cf6, #a78bfa)
- **Mapa Geográfico**: Gradiente de azul (#f3f4f6 → #1e3a8a)
- **Alertas**: Vermelho/Amarelo (#ef4444, #f59e0b)
- **Background**: Cinza claro (#f9fafb, #f3f4f6)

---

## 📚 Bibliotecas e Recursos Recomendados

### Para Implementação do Mapa do Brasil

#### Opção 1: SVG Puro (Recomendado para este projeto)
- **Vantagens:**
  - Zero dependências externas
  - Total controle sobre estilização
  - Performance excelente
  - Responsivo por natureza
  - Integração perfeita com React

- **Recursos para SVG:**
  - **TopoJSON Brasil**: https://github.com/tbrugz/geodata-br
  - **GeoJSON Brasil**: https://github.com/fititnt/gis-dataset-brasil
  - **IBGE Malhas**: https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/

- **Conversão GeoJSON → SVG:**
  ```bash
  npm install -D topojson geojson2svg
  ```
  
  ```typescript
  // Script para gerar paths SVG dos estados
  import geojson2svg from 'geojson2svg';
  import statesGeoJSON from './brazil-states.json';
  
  const converter = geojson2svg({
    viewportSize: { width: 1000, height: 800 },
    mapExtent: {
      left: -73.98,
      bottom: -33.75,
      right: -34.79,
      top: 5.27
    }
  });
  
  const svgPaths = statesGeoJSON.features.map(feature => ({
    code: feature.properties.sigla,
    name: feature.properties.nome,
    path: converter.convert(feature)
  }));
  ```

#### Opção 2: React Simple Maps (Alternativa com biblioteca)
- **Biblioteca:** `react-simple-maps`
- **Instalação:** `npm install react-simple-maps`
- **Vantagens:**
  - Componentes React prontos
  - Suporte a zoom/pan
  - Tooltips integrados
  - Projeções cartográficas

```typescript
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

<ComposableMap projection="geoMercator">
  <Geographies geography={brazilTopoJSON}>
    {({ geographies }) =>
      geographies.map(geo => (
        <Geography
          key={geo.rsmKey}
          geography={geo}
          fill={getStateColor(geo.properties.UF)}
        />
      ))
    }
  </Geographies>
</ComposableMap>
```

#### Opção 3: Leaflet + React Leaflet (Para mapas mais complexos)
- **Quando usar:** Se precisar de funcionalidades avançadas como:
  - Camadas de mapa interativas (OpenStreetMap, Google Maps)
  - Marcadores com imagens customizadas
  - Popup com informações ricas
  - Agrupamento de marcadores (clusters)

- **Instalação:**
  ```bash
  npm install leaflet react-leaflet
  npm install -D @types/leaflet
  ```

#### Opção 4: Recharts + Customização (Aproveitar biblioteca existente)
- Como o projeto já usa **Recharts**, pode-se criar um "treemap" estilizado
- Não é um mapa geográfico real, mas pode representar proporções

### 🎯 Recomendação Final para o Projeto

**Usar SVG Puro (Opção 1)** pelos seguintes motivos:
1. ✅ Projeto já tem estilo consistente sem bibliotecas de mapa
2. ✅ Não adiciona peso ao bundle (outras libs são 100-300KB)
3. ✅ Controle total sobre UX/UI
4. ✅ Fácil de tematizar com Tailwind
5. ✅ Performance superior

**Implementação em etapas:**
1. Obter GeoJSON do Brasil (IBGE ou geodata-br)
2. Converter para SVG paths com script Node.js
3. Salvar em `src/lib/geo-data.ts` como constante
4. Criar componente `BrazilMapChart` conforme exemplo acima
5. Adicionar interatividade (hover, click, zoom opcional)

---

## 🔐 Segurança e Acesso

### Autenticação
- **Middleware**: Verificar `is_superuser=True`
- **Decorator**: `@permission_classes([IsSuperAdmin])`
- **Frontend**: Rota protegida com `ProtectedRoute` + verificação de role

### Roteamento Automático
```python
# backend/apps/accounts/views.py
class LoginView(APIView):
    def post(self, request):
        # ... autenticação ...
        
        # Redirecionar Super Admin para dashboard específico
        if user.is_superuser:
            return Response({
                'token': token.key,
                'user': serializer.data,
                'redirect_to': '/platform-admin/dashboard'
            })
```

```typescript
// frontend/src/hooks/useAuth.tsx
if (userData.user.is_superuser) {
  navigate('/platform-admin/dashboard');
} else {
  navigate('/dashboard');
}
```

---

## 📅 Cronograma de Implementação

### Fase 1: Backend Core (Semana 1-2)
- [ ] Criar app `platform_analytics`
- [ ] Implementar models e migrations
- [ ] Criar `PlatformAnalyticsService` com cálculos básicos
- [ ] Implementar permissions `IsSuperAdmin`
- [ ] Criar endpoints de KPIs principais
- [ ] Testes unitários dos serviços

### Fase 2: Endpoints e APIs (Semana 2-3)
- [ ] Endpoint `/platform/overview/`
- [ ] Endpoints de gráficos (users, churches, revenue)
- [ ] Endpoints de distribuições (plans, status, geo)
- [ ] ⭐ **Endpoint `/platform/geography/map-data/`** (dados do mapa)
- [ ] ⭐ **Endpoint `/platform/geography/states/<code>/`** (detalhes por estado)
- [ ] ⭐ **Endpoint `/platform/geography/expansion-opportunities/`** (análise de expansão)
- [ ] Endpoints de rankings (top churches, recent)
- [ ] Implementar caching (Redis)
- [ ] Documentação Swagger/OpenAPI

### Fase 3: Frontend Base (Semana 3-4)
- [ ] Criar página `SuperAdminDashboard.tsx`
- [ ] Implementar `KPICard` component
- [ ] Criar hooks `usePlatformAnalytics`
- [ ] Implementar service layer frontend
- [ ] Definir tipos TypeScript
- [ ] Roteamento e proteção de rotas

### Fase 4: Visualizações (Semana 4-5)
- [ ] Gráfico de crescimento de usuários
- [ ] Gráfico de crescimento de igrejas
- [ ] Gráfico de receita (MRR)
- [ ] Gráfico de distribuição de planos (pizza)
- [ ] ⭐ **Obter GeoJSON dos estados brasileiros (IBGE/geodata-br)**
- [ ] ⭐ **Converter GeoJSON para SVG paths (`src/lib/geo-data.ts`)**
- [ ] ⭐ **Implementar `BrazilMapChart.tsx`** (mapa interativo)
- [ ] ⭐ **Implementar `GeographyLegend.tsx`** (legenda lateral)
- [ ] ⭐ **Implementar `StateDetailModal.tsx`** (drill-down por estado)
- [ ] ⭐ **Implementar `ExpansionOpportunities.tsx`** (card de oportunidades)
- [ ] Tabela de top igrejas
- [ ] Componente de alertas

### Fase 5: Analytics Avançados (Semana 6)
- [ ] Análise de coorte de retenção
- [ ] Análise de adoção de features
- [ ] Funil de conversão (trial → pago)
- [ ] Heatmap geográfico (opcional)
- [ ] Exportação de relatórios (CSV/PDF)

### Fase 6: Testes e Refinamento (Semana 7)
- [ ] Testes end-to-end
- [ ] Testes de performance (grandes volumes)
- [ ] Ajustes de UX/UI
- [ ] Otimização de queries
- [ ] Cache tuning
- [ ] Documentação final

---

## 🧪 Testes

### Backend
```python
# tests/test_platform_analytics.py

class PlatformAnalyticsTestCase(TestCase):
    def test_superadmin_can_access_overview(self):
        """Apenas super admin pode acessar"""
        pass
    
    def test_mrr_calculation_accuracy(self):
        """MRR calculado corretamente"""
        pass
    
    def test_user_growth_data_format(self):
        """Formato dos dados de crescimento"""
        pass
    
    def test_caching_works(self):
        """Cache funciona e expira corretamente"""
        pass
```

### Frontend
```typescript
// tests/SuperAdminDashboard.test.tsx

describe('SuperAdminDashboard', () => {
  it('redirects non-superusers', () => {});
  it('loads KPIs correctly', () => {});
  it('displays charts', () => {});
  it('handles loading states', () => {});
});
```

---

## 📊 Métricas de Sucesso

### Critérios de Aceitação
- ✅ Super Admin acessa dashboard ao fazer login
- ✅ KPIs carregam em < 3 segundos
- ✅ Gráficos renderizam corretamente em todos navegadores
- ✅ Dados são precisos (validados manualmente)
- ✅ Cache funciona e reduz carga no DB
- ✅ Responsivo em diferentes resoluções
- ✅ Testes cobrindo >80% do código

### Benchmarks de Performance
- **Tempo de carregamento inicial**: < 2s
- **Tempo de resposta da API**: < 500ms (com cache)
- **Queries no DB por request**: < 10
- **Cache hit rate**: > 90%

---

## 🚀 Melhorias Futuras (Pós-MVP)

### V2
- [ ] **Alertas por Email**: Notificar super admin de métricas críticas
- [ ] **Comparação de Períodos**: Comparar mês atual vs anterior
- [ ] **Previsões ML**: Usar ML para prever churn e crescimento
- [ ] **Segmentação Avançada**: Filtrar por região, plano, etc.
- [ ] **Exportação de Dados**: Gerar relatórios PDF/Excel
- [ ] **Dashboard Customizável**: Admin escolhe quais KPIs ver
- [ ] **Logs de Auditoria**: Rastrear ações de super admins
- [ ] **Integrações**: Zapier, Slack, Telegram para alertas

### V3
- [ ] **Business Intelligence**: Integração com Metabase/Tableau
- [ ] **Análise de Sentimento**: Analisar feedback de usuários
- [ ] **Forecasting**: Previsão de receita e crescimento
- [ ] **A/B Testing**: Testar diferentes estratégias de pricing
- [ ] **Customer Health Score**: Score de saúde por igreja

---

## 📚 Referências e Inspirações

### SaaS Dashboards
- **ChartMogul**: Métricas SaaS (MRR, Churn, LTV)
- **Baremetrics**: Analytics para assinaturas
- **ProfitWell**: Métricas de retenção e crescimento
- **Stripe Dashboard**: Visão financeira clara

### Design Systems
- **Tailwind UI**: Componentes de dashboards
- **shadcn/ui**: Componentes React (já usado no projeto)
- **Recharts**: Biblioteca de gráficos (já usado no projeto)

---

## 🎯 Conclusão

Este plano fornece uma roadmap completa para implementar uma **Dashboard Super Admin** robusta e escalável. A implementação segue as melhores práticas de SaaS, oferecendo visibilidade total sobre o negócio, saúde da plataforma e oportunidades de crescimento.

**Próximos Passos:**
1. Revisar e aprovar este plano
2. Priorizar features (MVP vs V2)
3. Estimar tempo e recursos
4. Iniciar implementação pela Fase 1

---

**Documento criado em:** 18 de Novembro de 2025  
**Autor:** Junior Melo  
**Versão:** 1.0  
**Status:** 📝 Proposta para Revisão
