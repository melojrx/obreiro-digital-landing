## Plano de Implementação – CRUD de Filiais (UI + Fluxos)

Objetivo
- Uniformizar a UI da aba Filiais em `ChurchDetailsPage` para uma listagem em tabela (como a de Igrejas), adicionando ações por filial e preparando telas auxiliares (detalhes e edição), sem quebrar funcionalidades existentes.

Escopo
- Frontend apenas nesta fase: conversão de cards → tabela, ações na listagem, rotas para detalhes/edição, e recargas de dados após ações. Backend já possui endpoints necessários.

Checklist de Entrega
- [x] F1: Converter listagem da aba Filiais (cards) para tabela
- [x] F2: Adicionar ações por filial (Ver, Editar, Excluir, QR: Ativar/Desativar, Regenerar)
- [x] F3: Criar `BranchDetailsPage` com informações principais, QR e estatísticas
  - Estatísticas exibidas em cards (Total, 30 dias, 7 dias, Convertidos, Conversão %)
  - Ajuste de ordem dos campos de endereço no modal de edição: CEP, Endereço, Bairro, Estado, Cidade
  - Correção: Cidade pré-selecionada mesmo quando não retorna na lista da API (fallback adicionando cidade atual às opções)
  - UI do QR Code unificada com a página de visitantes (preview em moldura tracejada, URL com copiar, toggle ativo, ações Baixar/Testar/Regenerar e card de ajuda)
  - Card de Estatísticas movido para o topo da página de detalhes da filial
- [x] F4: Criar `EditBranchModal` (ou `EditBranchPage`) reaproveitando schema de criação
- [x] F5: Atualizar rotas (detalhes e edição) e navegação a partir da tabela
- [x] F6: Atualizar fluxos de recarga/estado após ações e criação
- [ ] F7: Sanity checks (GET/POST mínimos) – sem commit até aprovação

Referências de UI
- Tomar como referência a listagem de Igrejas (tabela, filtros e ações) – ver rota de gerenciamento de igrejas.
- A aba Filiais em `http://localhost:5173/denominacao/churches/:id` deve exibir a mesma linguagem visual (tabela com ações por linha).

Colunas sugeridas (Filiais)
- Filial: nome, short_name (se houver) e e-mail
- Localização: cidade, estado
- QRCode: badge “Ativo/Inativo” (status do QR), com tooltips
- Criada em: data amigável
- Ações: ícones/botões (Ver, Editar, Excluir, QR: Ativar/Desativar, Regenerar)

Ordenação e indicadores
- Filial Matriz aparece no topo da lista, com badge “Matriz”.
- Backend expõe `is_main` e alias `is_headquarters` no BranchSerializer para consistência.

Ações por linha
- Ver detalhes → navega para `/denominacao/branches/:id`
- Editar → abre `EditBranchModal` (ou navega para page se adotada)
- Excluir → diálogo de confirmação; em sucesso, remoção otimista e recarga
- QR Code → usar `branchService.toggleQRCode` e `branchService.regenerateQRCode`, com toasts e recarga

Filtros e utilidades (fase opcional dentro da tabela)
- Busca por nome/cidade/UF (quando simples)
- Dropdowns: Estado, Status (ativo/inativo), QR ativo
- Paginação: respeitar defaults da tabela de Igrejas

Endereços de arquivos (Frontend)
- Alterar
  - `frontend/src/pages/ChurchDetailsPage.tsx` (aba Filiais: cards → tabela + ações)
- Criar
  - `frontend/src/pages/BranchDetailsPage.tsx` (detalhes da filial)
  - `frontend/src/components/modals/EditBranchModal.tsx` (edição)
  - (alternativa) `frontend/src/pages/EditBranchPage.tsx` (se necessário)
- Rotas
  - `frontend/src/App.tsx`: adicionar rotas de detalhes e (opcional) edição

Serviços e Tipos já disponíveis
- `frontend/src/services/branchService.ts`:
  - `getBranch`, `updateBranch`, `patchBranch`, `deleteBranch`
  - `toggleQRCode`, `regenerateQRCode`, `getVisitorStats`
- `frontend/src/services/churchService.ts`:
  - `getChurchBranches` (usado para popular a tabela da aba)
- Tipos: `frontend/src/types/hierarchy.ts` (`BranchDetails` etc.)

Recarregos de dados (estado)
- Após criar/editar/excluir/toggle/regenerar:
  - Recarregar a lista de filiais (`churchService.getChurchBranches`)
  - Opcional: recarregar dados da igreja para atualizar contadores
  - Exibir toasts de sucesso/erro

Permissões
- Respeitar `usePermissions`: esconder/disable ações conforme capacidade do usuário (`canManageBranches`, `canDeleteBranches`, etc.)

Critérios de Aceite
- Tabela substitui completamente os cards na aba Filiais sem perda de informação.
- Ações por linha funcionam: Ver, Editar, Excluir, Ativar/Desativar QR, Regenerar QR.
- Atualização visual e de dados após ações sem refresh manual da página.
- Navegação para detalhes da filial funcionando.
- Nenhum regressão na criação de filial via `CreateBranchModal`.

Passos de Implementação (curtos)
1) Converter aba Filiais para tabela
2) Adicionar menu/botões de ações por filial
3) Criar página de detalhes da filial
4) Criar modal/página de edição
5) Adicionar rotas e navegação
6) Recarregar dados após ações
7) Executar sanity checks

Sanity Checks (mínimos)
- Listar filiais: renderiza tabela com dados e paginação.
- Toggle/Regenerar QR: mudança refletida na UI e toasts ok.
- Editar: alterar cidade/estado e ver atualização na tabela.
- Excluir: confirmar, remover e lista recarrega sem erros.
- Detalhes: renderiza informações e estatísticas de visitantes.

Riscos e Mitigações
- Inconsistências de dados (totais de membros/visitantes): Mitigar com fallback e labels claras.
- Permissões: garantir gating de ações; logs de erro amigáveis.
- Regressões: implementar por etapas e testar cada ação isoladamente.

Diário de Execução
- 1/7 F1 – Concluído (tabela com colunas Filial, Localização, QRCode, Criada em)
- 2/7 F2 – Concluído (ações Ver, Editar, Excluir, Toggle/Regenerar QR)
- 3/7 F3 – Concluído (BranchDetailsPage com QR e resumo de estatísticas)
- 4/7 F4 – Concluído (EditBranchModal)
- 5/7 F5 – Concluído (rota `/denominacao/branches/:id` e navegação “Ver detalhes”)
- 6/7 F6 – Concluído (recarregos após ações)
- 7/7 F7 – Pendente
