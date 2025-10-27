# Plano de Atualização do Sistema de Permissões (v2)

Objetivo
- Atualizar e consolidar o sistema de permissões para refletir a hierarquia de papéis descrita em docs/Sistema_de_Permissoes.md, alinhando back e front à nova realidade branch‑aware (igreja/filial) e às mudanças recentes de dados (Visitors e Members com branch).

Escopo
- Backend (DRF): classes de permissão, escopo de queryset, validações por ação/objeto, endpoints auxiliares.
- Frontend: gating visual com `usePermissions`, coerência de ações com o backend.
- Migrações leves de dados para corrigir legados de roles/flags.

Status atual (batimento rápido)
- Classes existentes: `IsSuperUser`, `IsPlatformAdmin`, `IsChurchAdmin`, `IsBranchManager`, `IsMemberUser`, flags `CanManage*` (members, denominação etc.).
- ChurchUser já centraliza o papel legado de denominação em `CHURCH_ADMIN` + `can_manage_denomination` (ou `LEGACY_DENOMINATION_ROLE`).
- BranchViewSet usa apenas `[IsAuthenticated, IsMemberUser]` (afrouxado para ações sensíveis: toggle/regenerate QR e create/update/destroy).
- Visitor/Member ViewSets: escopo via `IsMemberUser`, mas criação/edição ainda pode carecer de verificação branch‑aware estrita para `SECRETARY` e coerência Church ↔ Branch.
- Front: `usePermissions` gateia ações, mas novas ações de Filiais (CRUD + QR) foram adicionadas e precisam refletir regras.

Lacunas identificadas
1) Escrita em Filiais (QR/toggle/regenerate, update/delete) liberada para qualquer membro autenticado da igreja (via `IsMemberUser`).
2) Escrita em Visitors/Members não valida, em todos os fluxos, que `SECRETARY` só atua nas branches atribuídas (objeto e payload).
3) Falta uma base comum de `get_queryset()` com escopo hierárquico (super → denom → igreja → branches designadas) para reduzir inconsistências entre ViewSets.
4) Ausência de um “alias” explícito `IsDenominationAdmin` (opcional) para fins de clareza, mapeado para `CHURCH_ADMIN + can_manage_denomination`/legado.
5) Front ainda não expõe granularidades específicas (p.ex. `canRegenerateQRCode`) — usa booleans genéricos, o que pode divergir do backend.

Fases de implementação

Fase P1 — Permissões por ação (backend)
- Branches
  - get_permissions() aplicado; leitura com `[IsAuthenticated, IsMemberUser]` e escrita validada manualmente.
  - Checagens implementadas no ViewSet:
    - create → valida `user.can_manage_church(church)` (igreja/denom)
    - toggle_qr_code/regenerate_qr_code → valida `user_can_manage_branch`
  - Object‑level: ChurchAdmin (igreja/denom) ou manager de branch pode agir; MEMBER não.
- Visitors
  - `create/update/partial_update/convert`: `[IsChurchAdmin | SecretaryBranchWrite]`
  - `list/retrieve`: `[IsAuthenticated, IsMemberUser]` (escopo por igreja/branches)
  - Nova permissão `SecretaryBranchWrite`: permite se `SECRETARY` e `visitor.branch` ∈ `managed_branches`.
- Members
  - `create/update/partial_update`: `[IsChurchAdmin | SecretaryBranchWrite]`
  - `list/retrieve`: `[IsAuthenticated, IsMemberUser]`
  - Transferência de branch: `[IsChurchAdmin]` (SECRETARY apenas solicita – opcional).
- Denomination endpoints
  - Adicionar alias `IsDenominationAdmin` (mapeado a ChurchAdmin com `can_manage_denomination` ou papel legado) para clareza onde relevante.

Aceite P1
- Usuário comum (MEMBER) não consegue editar branches, nem trocar/tocar QR.
- SECRETARY só consegue escrever em Visitors/Members cujas branches estão atribuídas a ele. (Aplicar na P1b/Visitors/Members)
- ChurchAdmin mantém acesso total na igreja (Matriz + todas as filiais). Denom Admin (equivalente) mantém poderes de tenant.

Nota sobre Denomination Admin
- Na plataforma, o usuário que assina via cadastro recebe capacidade de administrador do tenant (Denomination Admin). No modelo atual isso é representado como `CHURCH_ADMIN` com alcance de denominação via `can_manage_church(church)`.

Fase P2 — Escopo de queryset comum
- Criado `ChurchScopedQuerysetMixin` em `apps/core/mixins.py` com filtro padrão:
  - Superuser → all
  - ChurchAdmin → objetos da igreja ativa (todas as branches)
  - Secretary → restringe por `managed_branches` quando houver
  - Considera `request.church`/`request.branch` (middleware) e fallback para igreja ativa via ChurchUser
- Aplicado a: VisitorViewSet e MemberViewSet (Branches mantém lógica custom por ora).

Aceite P2
- Listagens de Visitors e Members respeitam a hierarquia/branches do usuário logado sem duplicar regras. Branches mantém escopo atual (mais amplo) até etapa de refino.

Fase P3 — Validações de coerência (serializers)
- MembersSerializer/VisitorsSerializer
  - Validar: `branch.church == church` no payload (quando ambos existirem).
  - Validar: `SECRETARY` só pode enviar `branch` dentro de `managed_branches`.
  - Rejeitar update que tente mover objetos para branch de outra igreja.
- MembershipStatus
  - Validar branch do status compatível com `member.branch` (se definido) e com igreja do usuário.

Aceite P3
- Payloads inválidos por church/branch retornam 400 com mensagem clara.
- SECRETARY não consegue “forçar” branch que não administra.

Fase P4 — Frontend (gating e UX)
- `usePermissions`
  - Expor granularidades: `canManageBranches`, `canToggleQR`, `canRegenerateQR`, `canDeleteBranch`, `canEditBranch`, `canManageMembers`, `canManageVisitors`.
  - Mapear para `ChurchUser` (CHURCH_ADMIN tudo true; SECRETARY: false para gestão de branches e QR; true para membros/visitantes nas branches).
- Componentes atualizados
  - ChurchDetailsPage → esconder/disable ações de QR/editar/excluir conforme permissões.
  - BranchDetailsPage → trocar botões por read‑only quando não permitido.
  - Visitors/Members → formular permissões de criação/edição baseadas na branch ativa/selecionada e nas `managed_branches`.

Aceite P4
- Usuário sem permissão não vê/ou não consegue clicar em ações proibidas.
- SECRETARY consegue operar apenas nas suas branches na UI (ex.: selector de branch respeita lista atribuída).

Fase P5 — Migração/Backfill e hardening
- Dados legados
  - Normalizar `ChurchUser.role == denomination_admin` → `CHURCH_ADMIN` + flag `can_manage_denomination=True` (já tratado no `save()`, confirmar backfill em massa).
  - Garantir que `managed_branches` pertençam à mesma igreja de `ChurchUser` (script de auditoria + correção).
  - Preencher `active_branch` coerente para usuários chave (script já existe; reexecutar se necessário).
- DB Constraints (opcionais, se viáveis agora)
  - Constraint: todas as `managed_branches` precisam ter `church_id == church_user.church_id` (pode ser validação em `clean()` + sinal post‑add M2M).

Aceite P5
- Nenhum `managed_branches` com igreja diferente.
- Papéis legados corrigidos/centralizados.

Fase P6 — Testes e Sanity Checks
- Unit tests (DRF):
  - BranchViewSet: ChurchAdmin pode create/update/destroy/toggle/regenerate; Secretary não pode; Member não pode.
  - Visitor/Member ViewSets: Secretary pode escrever apenas nas branches atribuídas; ChurchAdmin total; Member somente leitura.
  - Serializer validations: church/branch coerentes.
- End‑to‑end rápidos:
  - SECRETARY tenta editar visitante de branch não atribuída → 403.
  - Toggle QR como MEMBER → 403.
  - ChurchAdmin cria branch e vê nas listagens e detalhes.

Mudanças de código propostas (resumo)
- backend/apps/branches/views.py
  - `get_permissions()` por ação; usar `IsChurchAdmin`, `IsBranchManager`, `IsMemberUser` conforme método.
- backend/apps/visitors/views.py e backend/apps/members/views.py
  - `get_permissions()` por ação e `get_queryset()` via mixin comum.
  - Nova permissão `SecretaryBranchWrite` ou reutilizar `IsBranchManager` quando o objeto tiver `branch`.
- backend/apps/core/permissions.py
  - Adicionar `IsDenominationAdmin` (alias) e `SecretaryBranchWrite` (separado de branch manager de filiais).
  - Reforçar `IsMemberUser` apenas para leitura.
- backend/apps/accounts/models.py
  - Auditorias/métodos helper: `get_accessible_branches()` já disponível; usar.
- frontend/src/hooks/usePermissions.tsx
  - Expor novos capabilities e consumir em ChurchDetails/BranchDetails/Visitors/Members.

Roteiro de entrega (incremental, sem quebras)
1) P1 (Branches por ação) → validação manual das rotas de QR/CRUD
2) P2 (Mixin querysets) → aplicar a Branch/Visitor/Member
3) P3 (Validações serializers)
4) P4 (UI gating) → ChurchDetails/BranchDetails/Visitors/Members
5) P5 (Migração leve + auditoria)
6) P6 (Testes)

Critérios de aceite finais
- A leitura continua funcionando para usuários ligados à igreja.
- Escrita só é possível conforme papel/branch atribuída.
- Ações sensíveis de Filiais (QR/CRUD) restritas a ChurchAdmin/Managers.
- Front e back apresentam comportamento idêntico para o mesmo usuário.

Anotações
- Mantemos compatibilidade com o legado de `denomination_admin` via normalização para `CHURCH_ADMIN`.
- A regra “um membro pertence a uma branch por vez” já está refletida no modelo/validações recentes e deve ser respeitada em todas as operações (transferência dedicada).
