# Plano de Implementação: Painel de Administração da Plataforma

## 1. Visão Geral e Objetivos

Este documento descreve o plano para a criação de um **Painel de Administração da Plataforma**, uma interface centralizada e segura para a gestão do SaaS Obreiro Digital. Este painel será acessível exclusivamente por **Superusuários (Django Admin)** e usuários com o cargo de **Platform Admin**.

O objetivo é fornecer uma visão macro da saúde do negócio, monitorar KPIs críticos, gerenciar clientes (igrejas) e garantir a estabilidade e o crescimento da plataforma.

**Engenheiro Responsável:** [Seu Nome/Time]
**Data:** 08/09/2025
**Versão:** 1.0

## 2. Pesquisa de Mercado e Melhores Práticas

Uma pesquisa foi conduzida para analisar painéis de administração de plataformas SaaS multi-tenant. As principais conclusões são:

### KPIs Fundamentais para SaaS:

-   **Receita Recorrente Mensal (MRR):** O indicador mais importante da saúde financeira e crescimento.
-   **Taxa de Churn:** Percentual de clientes que cancelam a assinatura. Essencial para medir a retenção.
-   **Custo de Aquisição de Cliente (CAC):** Quanto custa para adquirir um novo cliente (igreja).
-   **Lifetime Value (LTV):** O valor total que um cliente gera durante seu ciclo de vida. A relação LTV/CAC é um indicador vital da sustentabilidade do negócio.
-   **Usuários Ativos (DAU/WAU/MAU):** Mede o engajamento dos usuários com a plataforma.
-   **Número de Clientes (Tenants):** Total de igrejas ativas, em trial e canceladas.

### Componentes Essenciais de um Painel Admin:

1.  **Dashboard Principal:** Visão geral com os KPIs mais importantes em destaque (Stat Cards).
2.  **Gestão de Tenants (Igrejas):** Uma tabela para listar, pesquisar e filtrar todas as igrejas. Deve permitir ações como:
    -   Ver detalhes da igreja.
    -   **Personificação ("Impersonate"):** Logar como um usuário daquela igreja para fins de suporte.
    -   Gerenciar assinatura (upgrade, downgrade, etc.).
    -   Suspender ou reativar uma igreja.
3.  **Gestão de Usuários Global:** Listar todos os usuários da plataforma, com filtros por igreja e cargo.
4.  **Analytics e Relatórios:** Gráficos de tendências (MRR ao longo do tempo, Churn, etc.).
5.  **Logs de Auditoria:** Registro de ações importantes realizadas no painel.

## 3. Plano de Implementação Detalhado

### Fase 1: Backend (API)

A API será o coração do painel, fornecendo os dados agregados de forma segura e eficiente.

#### 3.1. Novo App: `platform_admin`

Para manter o código organizado e seguro, um novo app Django será criado.

-   **Comando:** `python manage.py startapp platform_admin`
-   Adicionar `'apps.platform_admin'` a `INSTALLED_APPS`.

#### 3.2. Endpoints da API (`platform_admin/views.py` e `urls.py`)

Todos os endpoints dentro deste app devem ser protegidos com a permissão `IsPlatformAdmin`.

1.  **`PlatformDashboardStatsAPIView`**:
    -   **URL:** `/api/platform-admin/stats/`
    -   **Método:** `GET`
    -   **Resposta:** Retornará os KPIs principais em formato de "Stat Cards".
        ```json
        {
          "mrr": {"value": 12500.50, "trend": 0.05},
          "active_churches": {"value": 150, "trend": 0.10},
          "trial_churches": {"value": 25, "trend": -0.02},
          "total_users": {"value": 7500, "trend": 0.08},
          "churn_rate": {"value": 0.02, "trend": -0.01}
        }
        ```

2.  **`MRRChartAPIView`**:
    -   **URL:** `/api/platform-admin/charts/mrr/`
    -   **Método:** `GET`
    -   **Resposta:** Retornará dados para um gráfico de linhas mostrando a evolução do MRR nos últimos 12 meses.

3.  **`ChurchListAPIView` (Gestão de Tenants)**:
    -   **URL:** `/api/platform-admin/churches/`
    -   **Método:** `GET`
    -   **Funcionalidade:** ViewSet para listar, pesquisar e filtrar todas as igrejas no banco de dados. Incluirá dados como plano de assinatura, status, data de cadastro e número de membros.

4.  **`ImpersonateUserAPIView`**:
    -   **URL:** `/api/platform-admin/impersonate/`
    -   **Método:** `POST`
    -   **Payload:** `{ "user_id": <ID do usuário a ser personificado> }`
    -   **Resposta:** Retornará um token de autenticação temporário com os dados do usuário personificado, permitindo que o admin acesse a plataforma como aquele usuário em uma nova aba.

#### 3.3. Lógica de Negócio e Agregação de Dados (`platform_admin/services.py`)

-   Para evitar sobrecarga no banco de dados, os KPIs mais complexos (como MRR e Churn) não devem ser calculados em tempo real a cada request.
-   **Estratégia:** Criar comandos de gerenciamento do Django (`management/commands`) que rodem periodicamente (ex: diariamente via cron job) para calcular e armazenar os KPIs em um modelo de cache ou em uma tabela de métricas.
-   **Exemplo:** Um comando `calculate_daily_stats` poderia calcular o MRR, o número de igrejas ativas, etc., e salvar em um modelo `PlatformDailyStats`. A API então leria diretamente desta tabela, tornando a resposta instantânea.

### Fase 2: Frontend (React)

#### 3.4. Roteamento e Permissões

1.  **Adicionar Rota Protegida:**
    -   Em `App.tsx`, adicionar uma nova rota:
        ```tsx
        <Route 
          path="/platform-admin/dashboard" 
          element={
            <ProtectedRoute level="platform_admin">
              <PlatformAdminDashboard />
            </ProtectedRoute>
          } 
        />
        ```
2.  **Atualizar `ProtectedRoute.tsx`:**
    -   Adicionar a lógica para o `level="platform_admin"`. Isso envolverá verificar se o `user` no `useAuth` hook tem o cargo de `SUPER_ADMIN` ou `PLATFORM_ADMIN` (esta informação precisa ser retornada pela API de `users/me/`).

#### 3.5. Páginas e Componentes

1.  **Nova Página: `pages/PlatformAdmin/Dashboard.tsx`**
    -   Esta será a página principal do painel.
    -   Usará um layout próprio ou uma variação do `AppLayout`.
    -   Consumirá os hooks para buscar e exibir os dados.

2.  **Novos Componentes (`components/platform_admin/`)**
    -   `StatCard.tsx`: Componente para exibir um KPI principal com valor e tendência.
    -   `MRRChart.tsx`: Gráfico de linhas usando uma biblioteca como `recharts` ou `chart.js`.
    -   `ChurchesTable.tsx`: Tabela de dados (`DataTable` de `shadcn/ui`) para listar as igrejas, com filtros, paginação e um menu de ações para cada igreja (ver detalhes, personificar, etc.).

#### 3.6. Services e Hooks

1.  **`services/platformAdminService.ts`:**
    -   Criar um novo serviço para encapsular as chamadas à API do `platform-admin`.
    -   Funções: `getDashboardStats()`, `getMRRChartData()`, `getChurches()`, `impersonateUser(userId)`.

2.  **`hooks/usePlatformStats.ts`:**
    -   Hook que utiliza o React Query para buscar e gerenciar o estado dos dados do painel.
    -   `usePlatformStats()`: Busca os dados dos cards.
    -   `useMRRChart()`: Busca os dados do gráfico de MRR.
    -   `usePlatformChurches()`: Busca a lista de igrejas para a tabela.

## 4. Guia de Implementação Passo a Passo

-   [ ] **Backend:** Criar o app `platform_admin`.
-   [ ] **Backend:** Definir os modelos para cache de estatísticas (ex: `PlatformDailyStats`).
-   [ ] **Backend:** Implementar os comandos de gerenciamento para calcular os KPIs (`calculate_daily_stats`).
-   [ ] **Backend:** Criar os `Serializers` para os dados do painel.
-   [ ] **Backend:** Implementar os `ViewSets` e `APIViews` com a permissão `IsPlatformAdmin`.
-   [ ] **Backend:** Configurar as URLs em `platform_admin/urls.py` e incluí-las no `config/api_urls.py`.
-   [ ] **Frontend:** Atualizar o `ProtectedRoute` para lidar com o `level="platform_admin"`.
-   [ ] **Frontend:** Adicionar a informação de cargo de admin da plataforma ao `useAuth` hook.
-   [ ] **Frontend:** Criar o `services/platformAdminService.ts`.
-   [ ] **Frontend:** Criar os hooks em `hooks/usePlatformStats.ts`.
-   [ ] **Frontend:** Desenvolver a página `pages/PlatformAdmin/Dashboard.tsx`.
-   [ ] **Frontend:** Criar os componentes do painel (`StatCard`, `MRRChart`, `ChurchesTable`).
-   [ ] **Frontend:** Implementar a funcionalidade de personificação, que deve abrir uma nova aba com a sessão do usuário alvo.
-   [ ] **Infra:** Configurar um cron job no ambiente de produção para executar o comando de cálculo de estatísticas diariamente.
-   [ ] **Testes:** Testar rigorosamente o acesso, garantindo que apenas admins da plataforma possam ver o painel. Validar a precisão dos dados.
