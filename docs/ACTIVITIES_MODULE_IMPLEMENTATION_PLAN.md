# Plano de Implementação do Módulo de Atividades

## 1. Visão Geral e Objetivos

Este documento detalha o plano de implementação para o **Módulo de Atividades**, uma funcionalidade essencial do sistema Obreiro Digital. O objetivo é permitir que as igrejas gerenciem seus eventos, cultos e atividades de ministérios, além de fornecer um calendário público para membros e visitantes.

**Engenheiro Responsável:** [melojrx]
**Data:** 08/09/2025
**Versão:** 1.0

### Objetivos Principais:

1.  **Gestão de Ministérios:** Permitir que administradores da igreja criem, editem e gerenciem os ministérios (ex: Louvor, Jovens, Infantil).
2.  **Criação de Atividades:** Possibilitar a criação de atividades e eventos, associando-os a um ou mais ministérios e filiais.
3.  **Calendário de Atividades:** Exibir todas as atividades em um calendário interativo, com filtros por ministério, tipo de evento e filial.
4.  **Visão Pública:** Oferecer uma versão pública do calendário, acessível a visitantes e membros sem necessidade de login, para promover as atividades da igreja.
5.  **Integração:** Integrar o módulo de forma coesa com as estruturas existentes de backend (Django) e frontend (React/TypeScript).

## 2. Análise da Estrutura Existente

### Backend (Django)

-   **App `activities`:** Já existe e possui modelos bem estruturados (`Ministry`, `Activity`, `ActivityParticipant`, `ActivityResource`). Os modelos são robustos e cobrem a maioria dos casos de uso, incluindo recorrência, localização e inscrições.
-   **Serializers:** Existem serializers (`MinistrySerializer`, `ActivitySerializer`, etc.) que atendem às necessidades básicas de CRUD.
-   **Views:** `MinistryViewSet` e `ActivityViewSet` estão implementados, mas precisam de ajustes para expor endpoints públicos e refinar as permissões.
-   **URLs:** O arquivo `activities/urls.py` está vazio e precisa ser populado com o router. O `config/api_urls.py` já registra o `ActivityViewSet`.
-   **Permissões:** O sistema de permissões (`IsChurchAdmin`, `IsMemberUser`) é granular e pode ser aproveitado para controlar o acesso às funcionalidades de gestão.

### Frontend (React)

-   **Tecnologias:** O projeto utiliza React, TypeScript, Vite, React Router, TanStack Query (React Query) para state management e Tailwind CSS com shadcn/ui para a interface.
-   **Estrutura de Pastas:** A organização em `pages`, `components`, `services`, `hooks` e `types` é clara e deve ser seguida.
-   **Autenticação:** O `useAuth` hook e o `authService` centralizam a lógica de autenticação. Um `activityService` será criado seguindo este padrão.
-   **Componentes:** A biblioteca `shadcn/ui` oferece componentes de alta qualidade que serão usados para construir a interface, como `Calendar`, `Dialog`, `Form` e `Table`.

## 3. Plano de Implementação Detalhado

### Fase 1: Backend (API)

#### 3.1. Ajustes nos Modelos

Os modelos atuais são adequados. Nenhuma alteração crítica é necessária para a fase inicial.

#### 3.2. URLs e Views

1.  **Configurar `activities/urls.py`:**
    -   Registrar `MinistryViewSet` e `ActivityViewSet` em um `DefaultRouter`.

2.  **Ajustar `ActivityViewSet`:**
    -   Criar um endpoint público `@action(detail=False, methods=['get'], permission_classes=[AllowAny])` chamado `public_calendar`.
    -   Este endpoint retornará uma lista simplificada de atividades (`ActivitySummarySerializer`) que tenham o campo `is_public=True`.
    -   Implementar filtros por data (mês/ano), ministério e filial.

3.  **Ajustar `MinistryViewSet`:**
    -   Garantir que a listagem de ministérios seja pública para que o frontend possa exibir os filtros no calendário. Pode-se usar um `PublicMinistrySerializer` para expor apenas os campos necessários (`id`, `name`, `color`).

#### 3.3. Permissões

1.  **Gestão de Atividades:**
    -   A criação, edição e exclusão de ministérios e atividades (`POST`, `PUT`, `PATCH`, `DELETE`) devem ser restritas a `IsChurchAdmin` ou a um novo nível de permissão (ex: `CanManageActivities`).
2.  **Visualização Interna:**
    -   A visualização de todas as atividades (não públicas) no dashboard (`GET`) deve ser permitida para `IsMemberUser`.
3.  **Visualização Pública:**
    -   O endpoint `public_calendar` deve ter a permissão `AllowAny`.

### Fase 2: Frontend (React)

#### 3.4. API Service

1.  **Criar `frontend/src/services/activityService.ts`:**
    -   Implementar funções para interagir com a API de atividades:
        -   `getPublicActivities(filters)`: Busca atividades para o calendário público.
        -   `getActivities(filters)`: Busca atividades para o calendário interno (dashboard).
        -   `createActivity(data)`
        -   `updateActivity(id, data)`
        -   `deleteActivity(id)`
        -   `getMinistries()`
        -   `createMinistry(data)`, `updateMinistry(id, data)`, etc.

#### 3.5. Hooks (React Query)

1.  **Criar `frontend/src/hooks/useActivities.ts`:**
    -   Criar hooks para gerenciar o estado das atividades, aproveitando o cache do React Query.
        -   `usePublicActivities(filters)`: Para o calendário público.
        -   `useActivities(filters)`: Para o calendário do dashboard.
        -   `useAddActivity()`: Para a mutação de criação.
        -   `useUpdateActivity()`: Para a mutação de atualização.
        -   `useDeleteActivity()`: Para a mutação de exclusão.
2.  **Criar `frontend/src/hooks/useMinistries.ts`:**
    -   Hooks para buscar e gerenciar ministérios.

#### 3.6. Componentes da UI

1.  **`components/activities/ActivityCalendar.tsx`:**
    -   Componente principal que usará o `Calendar` da `shadcn/ui`.
    -   Receberá a lista de atividades e as renderizará no calendário.
    -   Ao clicar em um dia ou evento, abrirá um `Dialog` com os detalhes.
2.  **`components/activities/ActivityForm.tsx`:**
    -   Formulário para criar e editar atividades, utilizando `Form`, `Input`, `Select`, `Checkbox` e `DatePicker` de `shadcn/ui`.
    -   Validação de formulário com `zod` e `react-hook-form`.
3.  **`components/activities/MinistryManager.tsx`:**
    -   Componente para listar, criar e editar ministérios em uma `Table`.
4.  **`components/activities/ActivityFilter.tsx`:**
    -   Componente com `Selects` para filtrar o calendário por ministério, tipo, etc.

#### 3.7. Páginas

1.  **`pages/Public/CalendarPage.tsx`:**
    -   Nova página pública (fora da área de login).
    -   Exibirá o `ActivityCalendar` com as atividades públicas.
    -   Terá um layout mais simples, focado na informação para o visitante.
2.  **`pages/Dashboard/ActivitiesPage.tsx`:**
    -   Nova página dentro do dashboard.
    -   Exibirá o `ActivityCalendar` com todas as atividades (públicas e internas).
    -   Incluirá botões de ação ("Nova Atividade", "Gerenciar Ministérios").
3.  **`pages/Dashboard/MinistryManagementPage.tsx`:**
    -   Página para gerenciar os ministérios, utilizando o componente `MinistryManager`.

#### 3.8. Roteamento (`App.tsx`)

1.  **Adicionar as novas rotas:**
    -   `/calendario`: Rota pública para `CalendarPage`.
    -   `/dashboard/atividades`: Rota protegida para `ActivitiesPage`.
    -   `/dashboard/ministerios`: Rota protegida para `MinistryManagementPage`.
2.  **Adicionar link no menu lateral (`Sidebar.tsx`):**
    -   Adicionar um novo item de menu "Atividades" ou "Agenda" que aponte para `/dashboard/atividades`.

## 4. Guia de Implementação Passo a Passo

-   [ ] **Backend:** Configurar `activities/urls.py` para registrar os `ViewSets`.
-   [ ] **Backend:** Implementar o endpoint `@action` `public_calendar` no `ActivityViewSet` com permissão `AllowAny`.
-   [ ] **Backend:** Ajustar as permissões dos `ViewSets` para gestão (`IsChurchAdmin`) e visualização (`IsMemberUser`).
-   [ ] **Frontend:** Criar o arquivo `services/activityService.ts` com as funções de API.
-   [ ] **Frontend:** Criar os hooks `useActivities.ts` e `useMinistries.ts`.
-   [ ] **Frontend:** Desenvolver o componente `components/activities/ActivityCalendar.tsx`.
-   [ ] **Frontend:** Criar a página `pages/Dashboard/ActivitiesPage.tsx` e integrá-la ao `ActivityCalendar`.
-   [ ] **Frontend:** Adicionar a rota `/dashboard/atividades` em `App.tsx` e o link no menu.
-   [ ] **Frontend:** Desenvolver o formulário `components/activities/ActivityForm.tsx` dentro de um `Dialog` para criar/editar atividades.
-   [ ] **Frontend:** Integrar o formulário com os hooks de mutação (`useAddActivity`, `useUpdateActivity`).
-   [ ] **Frontend:** Criar a página pública `pages/Public/CalendarPage.tsx` e a rota `/calendario`.
-   [ ] **Frontend:** Implementar os filtros de calendário no `ActivityFilter.tsx`.
-   [ ] **Frontend (Opcional):** Criar a página e os componentes para a gestão de ministérios.
-   [ ] **Testes:** Realizar testes manuais de todo o fluxo (criação, visualização pública, filtros).
-   [ ] **Deploy:** Publicar as alterações em ambiente de desenvolvimento/produção.

Este plano fornece uma base sólida para o desenvolvimento do Módulo de Atividades. A abordagem faseada (Backend -> Frontend) e a reutilização de componentes existentes garantirão uma implementação eficiente e de alta qualidade.
