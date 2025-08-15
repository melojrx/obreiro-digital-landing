# API de Igrejas - Documentação dos Endpoints

## Visão Geral

Este documento descreve todos os endpoints disponíveis para o gerenciamento de igrejas no sistema Obreiro Digital.

## Endpoints Principais

### 1. CRUD Básico de Igrejas

#### Listar Igrejas
```
GET /api/churches/
```
- **Descrição**: Lista todas as igrejas com filtros e paginação
- **Permissões**: Usuário autenticado (vê apenas suas igrejas)
- **Filtros disponíveis**:
  - `denomination`: ID da denominação
  - `state`: Estado (SP, RJ, etc.)
  - `city`: Cidade (busca parcial)
  - `subscription_plan`: Plano de assinatura
  - `subscription_status`: Status da assinatura
  - `total_members_min`: Mínimo de membros
  - `total_members_max`: Máximo de membros
  - `has_cnpj`: true/false
  - `has_main_pastor`: true/false
  - `subscription_expired`: true/false
- **Busca**: Por nome, nome fantasia, cidade, estado, email
- **Ordenação**: Por nome, cidade, data de criação, total de membros

#### Criar Igreja
```
POST /api/churches/
```
- **Descrição**: Cria uma nova igreja
- **Permissões**: CanCreateChurches
- **Validações**:
  - Email único por denominação
  - CNPJ único globalmente
  - Limites de igrejas por plano da denominação
  - Estado deve ter 2 caracteres

#### Detalhes da Igreja
```
GET /api/churches/{id}/
```
- **Descrição**: Retorna detalhes completos de uma igreja
- **Permissões**: Usuário deve ter acesso à igreja

#### Atualizar Igreja
```
PUT /api/churches/{id}/
PATCH /api/churches/{id}/
```
- **Descrição**: Atualiza dados da igreja (completa ou parcial)
- **Permissões**: IsChurchAdmin
- **Validações**: Mesmas do create (exceto limites de denominação)

#### Deletar Igreja (Soft Delete)
```
DELETE /api/churches/{id}/
```
- **Descrição**: Marca igreja como inativa ao invés de deletar
- **Permissões**: IsDenominationAdmin
- **Efeito**: Igreja fica inativa, estatísticas da denominação são atualizadas

### 2. Endpoints Especializados

#### Minhas Igrejas
```
GET /api/churches/my-churches/
```
- **Descrição**: Igrejas do usuário atual com paginação
- **Permissões**: Usuário autenticado

#### Igrejas por Denominação
```
GET /api/churches/by-denomination/{denomination_id}/
```
- **Descrição**: Lista igrejas de uma denominação específica
- **Permissões**: Usuário autenticado com acesso à denominação

#### Criação em Lote
```
POST /api/churches/bulk-create/
```
- **Descrição**: Cria múltiplas igrejas de uma vez
- **Permissões**: CanCreateChurches
- **Payload**: 
```json
{
  "churches": [
    {
      "name": "Igreja 1",
      "denomination": 1,
      "email": "igreja1@email.com",
      // ... outros campos
    }
  ]
}
```

### 3. Estatísticas e Relatórios

#### Estatísticas Detalhadas
```
GET /api/churches/{id}/statistics/
```
- **Descrição**: Estatísticas completas da igreja
- **Retorna**:
  - Funcionalidades do plano
  - Limites de assinatura
  - Contagem de filiais
  - Membros por faixa etária
  - Visitantes por mês (últimos 6 meses)
  - Indicadores de saúde da assinatura

#### Filiais
```
GET /api/churches/{id}/branches/
```
- **Descrição**: Lista filiais ativas da igreja
- **Permissões**: Usuário com acesso à igreja

#### Atualizar Estatísticas
```
POST /api/churches/{id}/update-statistics/
```
- **Descrição**: Força atualização das estatísticas
- **Permissões**: IsChurchAdmin

### 4. Gestão de Assinatura

#### Dados da Assinatura
```
GET /api/churches/{id}/subscription/
```
- **Descrição**: Informações da assinatura atual

#### Atualizar Assinatura
```
PUT /api/churches/{id}/subscription/
PATCH /api/churches/{id}/subscription/
```
- **Descrição**: Atualiza dados da assinatura
- **Permissões**: IsDenominationAdmin

### 5. Gestão de Administradores

#### Atribuir Administrador
```
POST /api/churches/{id}/assign-admin/
```
- **Descrição**: Atribui um usuário como administrador da igreja
- **Permissões**: CanManageChurchAdmins
- **Payload**:
```json
{
  "user_id": 123,
  "role": "church_admin"
}
```

#### Remover Administrador
```
POST /api/churches/{id}/remove-admin/
```
- **Descrição**: Remove um administrador da igreja
- **Permissões**: CanManageChurchAdmins
- **Payload**:
```json
{
  "user_id": 123
}
```

### 6. Endpoints de Denominação

#### Igrejas da Denominação
```
GET /api/denominations/{id}/churches/
```
- **Descrição**: Lista igrejas de uma denominação
- **Permissões**: IsDenominationAdmin para a denominação

#### Criar Igreja na Denominação
```
POST /api/denominations/{id}/churches/
```
- **Descrição**: Cria igreja diretamente vinculada à denominação
- **Permissões**: IsDenominationAdmin para a denominação

## Serializers Utilizados

### ChurchListSerializer
- **Uso**: Listagens otimizadas
- **Campos**: ID, nome, cidade, denominação, plano, status, total de membros

### ChurchDetailSerializer
- **Uso**: Visualização individual
- **Campos**: Todos os campos da igreja + informações relacionadas

### ChurchCreateSerializer
- **Uso**: Criação de igrejas
- **Validações**: Email único, CNPJ único, limites de denominação

### ChurchUpdateSerializer
- **Uso**: Atualizações
- **Validações**: Email único por denominação, CNPJ único

### ChurchStatisticsSerializer
- **Uso**: Estatísticas detalhadas
- **Campos**: Métricas calculadas, gráficos, indicadores

## Filtros e Busca

### Filtros Disponíveis
- **denomination**: Filtro por ID da denominação
- **state**: Estado (exato, case-insensitive)
- **city**: Cidade (contém)
- **subscription_plan**: Plano de assinatura
- **subscription_status**: Status da assinatura
- **total_members_min/max**: Range de membros
- **created_after/before**: Range de datas
- **has_cnpj**: Igreja tem CNPJ
- **has_main_pastor**: Igreja tem pastor principal
- **subscription_expired**: Assinatura expirada

### Busca
Busca por: nome, nome fantasia, cidade, estado, email

### Ordenação
Ordenação por: nome, cidade, data de criação, total de membros, data de expiração

## Permissões

### Hierarquia de Permissões
1. **Superuser**: Acesso total
2. **Platform Admin**: Acesso total
3. **Denomination Admin**: Igrejas da denominação
4. **Church Admin**: Próprias igrejas
5. **Usuário Regular**: Igrejas onde é membro

### Permissões Específicas
- **CanCreateChurches**: Criar igrejas
- **CanManageChurchAdmins**: Gerenciar administradores
- **IsChurchAdmin**: Administrar igreja específica
- **IsDenominationAdmin**: Administrar denominação

## Otimizações Implementadas

### Performance
- `select_related` para denominação e pastor principal
- `prefetch_related` para filiais
- Filtros em nível de banco
- Paginação automática

### Logging
- Todas as operações são logadas
- Inclui usuário, ação e detalhes relevantes
- Níveis: INFO para operações normais, WARNING para soft delete

### Validações
- Email único por denominação
- CNPJ único globalmente
- Limites de igrejas por plano
- Validação de formato de estado

## Códigos de Status HTTP

- **200**: Operação bem-sucedida
- **201**: Criação bem-sucedida
- **400**: Dados inválidos
- **401**: Não autenticado
- **403**: Sem permissão
- **404**: Recurso não encontrado
- **500**: Erro interno do servidor