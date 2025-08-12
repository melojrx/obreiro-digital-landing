# Estratégia de Migração: Nova Estrutura MembershipStatus

## Visão Geral

Este documento descreve a estratégia de migração gradual do campo `ministerial_function` do modelo `Member` para a nova estrutura `MembershipStatus`, que permite histórico completo de mudanças ministeriais.

## Arquitetura Implementada

### Backend (Já Implementado)
- **Modelo `MembershipStatus`**: Nova tabela para histórico de status ministeriais
- **API Endpoints**: ViewSet completo para CRUD de status ministeriais
- **Compatibilidade**: Campo `ministerial_function` mantido durante transição
- **Serializers**: Suporte a ambas as estruturas (antiga e nova)

### Frontend (Implementado)
- **Interfaces TypeScript**: Suporte às novas estruturas de dados
- **Services**: Novo `membershipStatusService` para interação com API
- **Componentes**: Componentes atualizados para trabalhar com ambas estruturas
- **Hook Personalizado**: `useMembershipStatus` para facilitar o uso

## Componentes Atualizados

### 1. **MemberForm** ✅
- Nova aba "Status Ministerial" 
- Campo para definir função ministerial inicial
- Campo para observações sobre status inicial
- Compatibilidade com estrutura antiga mantida

### 2. **MembersTable** ✅  
- Exibe função ministerial atual da nova estrutura
- Fallback para campo antigo se nova estrutura não disponível
- Tooltip com histórico quando disponível
- HoverCard mostrando últimos 3 status

### 3. **MemberDetails** ✅
- Nova aba "Ministerial" com histórico completo
- Timeline visual de mudanças
- Integração com modal para adicionar/editar status
- Informações da função atual da nova estrutura

### 4. **MembershipStatusHistory** ✅ (Novo)
- Timeline visual de todas as mudanças
- Indicação de status atual
- Ações para editar/remover status
- Informações detalhadas (datas, duração, responsável)

### 5. **MembershipStatusModal** ✅ (Novo)
- Modal para adicionar novo status ministerial
- Modal para editar status existente
- Validação de datas e campos obrigatórios
- Suporte a observações e motivos

## Estratégia de Migração Gradual

### Fase 1: Dual Structure (ATUAL) ✅
- Ambas estruturas funcionam simultaneamente
- Interface detecta automaticamente qual estrutura usar
- Preferência para nova estrutura quando disponível
- Fallback para estrutura antiga quando necessário

```typescript
// Exemplo de fallback implementado
const currentFunction = member.current_ministerial_function?.status_display 
  || member.ministerial_function 
  || 'Membro';
```

### Fase 2: Migration Scripts (Backend)
- Scripts de migração movem dados de `ministerial_function` para `MembershipStatus`
- Manutenção de compatibilidade durante processo
- Validação de integridade de dados

### Fase 3: New Structure Only
- Remoção gradual da dependência do campo antigo
- Limpeza de código de fallback
- Otimização de consultas

## Endpoints de API

### Novos Endpoints Adicionados
```typescript
membershipStatus: {
  list: '/membership-status/',
  detail: (id: number) => `/membership-status/${id}/`,
  create: '/membership-status/',
  update: (id: number) => `/membership-status/${id}/`,
  delete: (id: number) => `/membership-status/${id}/`,
  
  // Endpoints específicos para membros
  memberHistory: (memberId: number) => `/members/${memberId}/status-history/`,
  currentStatus: (memberId: number) => `/members/${memberId}/current-status/`,
  changeStatus: (memberId: number) => `/members/${memberId}/change-status/`,
},
```

### Endpoints Existentes Mantidos
- Todos os endpoints de `/members/` continuam funcionando
- Campo `ministerial_function` ainda suportado durante transição

## Validações e Regras de Negócio

### Frontend
- Data final deve ser posterior à data efetiva
- Status atual só pode ter um por membro
- Validação de funções ministeriais disponíveis

### Backend (Implementado)
- Constraint de unicidade para status atual por membro
- Validações de transições de status permitidas
- Auditoria completa de mudanças

## Como Usar a Nova Estrutura

### 1. Para Exibir Função Atual
```typescript
// Preferir nova estrutura, fallback para antiga
const currentFunction = member.current_ministerial_function?.status_display 
  || member.ministerial_function 
  || 'Membro';
```

### 2. Para Gerenciar Status
```typescript
import { useMembershipStatus } from '@/hooks/useMembershipStatus';

const { 
  membershipStatuses, 
  isLoading, 
  createStatus, 
  changeStatus 
} = useMembershipStatus(memberId);

// Adicionar novo status
await createStatus({
  member: memberId,
  status: 'pastor',
  effective_date: '2024-01-01',
  reason: 'Ordenação pastoral'
});
```

### 3. Para Exibir Histórico
```typescript
import { MembershipStatusHistory } from '@/components/members/MembershipStatusHistory';

<MembershipStatusHistory
  memberStatuses={member.membership_statuses || []}
  memberId={member.id}
  memberName={member.full_name}
  canEdit={canEdit}
  onAddStatus={handleAddStatus}
  onEditStatus={handleEditStatus}
  onDeleteStatus={handleDeleteStatus}
/>
```

## Benefícios da Nova Estrutura

### 1. **Auditoria Completa** 📋
- Histórico completo de mudanças ministeriais
- Data e motivo de cada mudança
- Responsável pela alteração registrado

### 2. **Flexibilidade** 🔄
- Múltiplos status ao longo do tempo
- Possibilidade de correções históricas
- Suporte a períodos específicos

### 3. **Governança** 👨‍💼
- Controle de quem pode alterar status
- Validações de negócio centralizadas
- Rastreabilidade completa

### 4. **UX Melhorada** ✨
- Timeline visual de mudanças
- Informações contextuais (duração, etc.)
- Facilidade para adicionar/editar status

## Testes e Validação

### Casos de Teste Implementados
- [ ] Criação de membro com status inicial
- [ ] Exibição de função atual (nova vs antiga estrutura)
- [ ] Adição de novo status ministerial
- [ ] Edição de status existente
- [ ] Remoção de status histórico
- [ ] Validações de data e campos obrigatórios
- [ ] Fallback para estrutura antiga

### Validação Manual Recomendada
1. Criar novo membro com status ministerial inicial
2. Visualizar histórico na página de detalhes
3. Adicionar nova mudança de status
4. Verificar exibição na tabela de membros
5. Testar edição e remoção de status

## Rollback Strategy

Em caso de problemas, a estratégia de rollback é simples:

1. **Desabilitar nova interface**: Comentar componentes da nova estrutura
2. **Manter endpoints antigos**: Campo `ministerial_function` sempre disponível
3. **Reverter components**: Usar versões antigas dos componentes se necessário

## Conclusão

A implementação está completa e pronta para uso gradual. A estratégia de dual structure garante que não há breaking changes e permite migração suave dos dados quando conveniente.

### Próximos Passos
1. **Teste em ambiente de desenvolvimento** ✅ Implementado
2. **Migração de dados existentes** (Backend - quando apropriado)
3. **Remoção de código de fallback** (Fase futura)
4. **Otimizações de performance** (Fase futura)