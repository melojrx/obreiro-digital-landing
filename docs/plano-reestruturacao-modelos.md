# Plano de Reestruturação de Modelos (Denomination, Church, Branch)

Objetivo
- Alinhar os modelos aos campos do diagrama `docs/modelodedadosobreiro.png`, reduzir redundâncias e manter compatibilidade sem quebrar a aplicação.

Escopo Inicial
- Modelos: `Denomination`, `Church`, `Branch` (concluídos) e agora `Members`, `Visitors`, `MembershipStatus`.

Decisões Arquiteturais
- Plano/limites e métricas consolidadas podem existir em Denomination e/ou Church. Nesta fase:
  - Denomination passa a ter seus próprios campos de assinatura/limites e agregados de visitantes.
  - Church mantém assinatura/limites (suporte a plano por igreja) e caches agregados (members/visitors).
- QR Code e controle de registro de visitantes são efetivamente por Branch; Church passa a delegar (proxy) para a Branch principal.
- Migrações sempre aditivas antes de remoções; removemos campos apenas após data migration e compat.

Estado Atual x Alvo (resumo)
- Denomination: já possui base completa; faltam campos de assinatura/limites/visitantes (ver D1 abaixo).
- Church: já possui todos campos do alvo, mas `qr_code_*` e `allows_visitor_registration` são redundantes quando olhamos Branch; vamos migrar para Branch (C1–C3).
- Branch: já condiz com o alvo (inclui `is_main` que substitui semanticamente `is_headquarters`).

Trilhas e Fases

Trilha D — Denomination
- D1. Campos + Migração (aditivo)
  - Adicionar campos em `apps/denominations/models.py`:
    - Assinatura: `subscription_plan`, `subscription_status`, `subscription_start_date`, `subscription_end_date`, `trial_end_date`.
    - Limites: `max_members`, `max_churches`, `max_branches` (0 = ilimitado).
    - Visitantes: `total_visitors`, `allows_visitor_registration`, `total_visitors_registered`.
  - Criar migração com defaults seguros; sem alterações destrutivas.

- D2. Cálculo e Serializers
  - `Denomination.update_statistics()` passa a também agregar `total_visitors`/`total_visitors_registered` de Church/Visitors.
  - Data migration (RunPython) para backfill dos agregados.
  - Expor novos campos em `DenominationSerializer` (campos agregados como read-only).

- D3. Uso leve na aplicação
  - Onde já validamos criação de Church por plano, usar `max_churches` da denominação quando > 0; manter fallback por plano atual para compatibilidade.

Trilha C — Church/Branch
- C1. Compatibilidade (sem schema‑breaking)
  - Church deixa de persistir e passa a **delegar** QR e controle efetivo de registro de visitantes para a Branch principal (`is_main=True`).
  - `ChurchSerializer` expõe `qr_code_uuid/image/active` via `SerializerMethodField` que lê da main branch (read-only). Mantém campos no banco por compat (não escrevemos mais).
  - Endpoints de QR em Church passam a delegar para Branch principal (opcional, para clientes legados). Operações nativas permanecem em Branch.
  - Na criação de Branch, inicializar `allows_visitor_registration` com o valor default da Church (Church mantém como “default para novas branches”).

- C2. Migração de Dados
  - Migration que copia `Church.qr_code_*` para a `Branch` principal quando esta não possuir dados.
  - Verificar/garantir 1 main branch por Church (constraint já existe; validar dados antigos).

- C3. Remoção de Redundâncias
  - Remover de `apps/churches/models.py`: `qr_code_uuid`, `qr_code_image`, `qr_code_active`.
  - Ajustar serializers/views/tests; manter métodos que leem da Branch principal para preservar a resposta legada.

- C4. Flags de Visitantes
  - Tratar `Church.allows_visitor_registration` como “default para novas branches”. Controle efetivo fica em `Branch.allows_visitor_registration`.
  - (Opcional) Renomear futuramente para `default_branch_visitor_registration` (migração dedicada).

- C5. Agregações
  - Manter em Church caches agregados: `total_members`, `total_visitors`, `total_visitors_registered`. Atualizar em tasks/pontos críticos.

Trilha M — Members
- M1. Período de membresia (aditivo, compat)
  - Adicionar em `Member` os campos `membership_start_date` (DateField, null=True/blank=True) e `membership_end_date` (DateField, null=True/blank=True).
  - Data migration: popular `membership_start_date` com o valor de `membership_date` existente.
  - Serializers: expor `membership_start_date`/`membership_end_date`. Continuar aceitando `membership_date` (compat) — se apenas `membership_date` vier no payload, persistir em `membership_start_date` também.
  - Índices: adicionar índice em `membership_end_date`.
  - Validações: quando ambos preenchidos, `membership_end_date` > `membership_start_date`.

- M2. APIs/Front (compat)
  - Atualizar serializers de criação/atualização/lista para incluir os novos campos.
  - Front pode ler os campos novos sem remover `membership_date` ainda.
  - Futuro (S4): deprecar `membership_date` após validação.

Trilha S — MembershipStatus
- S1. Branch + alias de datas (aditivo)
  - Adicionar `branch` (FK opcional) em `MembershipStatus` e data migration para preencher com `member.branch` quando existir.
  - Manter colunas atuais `effective_date`/`end_date`, mas expor aliases em serializer: `ordination_start_date` → `effective_date`, `ordination_end_date` → `end_date`.
  - Constraint: garantir apenas um status atual por membro (`UniqueConstraint(fields=['member'], condition=Q(end_date__isnull=True))`).
  - Índices: adicionar índice em `branch` e manter existentes.

  - Choices (Ordenações – cargos eclesiásticos)
    - O modelo MembershipStatus representará as ordenações/cargos do membro ao longo do tempo (log histórico).
    - STATUS_CHOICES a adotar (rótulos conforme diagrama):
      - `member` – Membro
      - `deacon` – Diácono
      - `deaconess` – Diaconisa
      - `elder` – Presbítero
      - `evangelist` – Evangelista
      - `pastor` – Pastor
      - `female_pastor` – Pastora
      - `missionary` – Missionário
      - `female_missionary` – Missionária
      - `leader` – Líder
      - `cooperator` – Cooperador(ra)
      - `auxiliary` – Auxiliar

    Observações de compatibilidade:
    - Manteremos o campo atual `status` (MembershipStatus) usando os valores acima.
    - Para coexistir com `MinisterialFunctionHistory`, iremos centralizar a cronologia das ordenações em `MembershipStatus` e manter `MinisterialFunctionHistory` como compat até migração futura (convergência opcional).

- S2. Regras de gravação / compat
  - No create/update, se `branch` não for informado, preencher com `member.branch`.
  - Validar `ordination_end_date` > `ordination_start_date` (já coberto no save).
  - Front: atualizar serviço para aceitar `branch` e `ordination_*` mantendo compat.

Trilha V — Visitors
- V1. Consistência/Índices
  - Modelo já compatível com o diagrama.
  - Avaliar inclusão de índice (`branch`, `created_at`) para consultas de recência por filial.
  - Validar normalização de `registration_source` em serializers (opcional).

- V2. Integração
  - Confirmar que conversão para membro preserva `branch` e respeita a regra de “um membro por branch”.
  - Church.update_statistics já agrega `total_visitors_registered` das branches.

Checklists (acompanhamento)
- [x] D1: Campos adicionados e migração aplicada
- [ ] D2: `update_statistics()` + backfill + serializers atualizados
- [ ] D3: Validação de uso de `max_churches` (>0) em criação de Church
- [ ] C1: Serializer Church delegando QR/flags para Branch principal (read‑only)
- [ ] C2: Data migration de QR para main branch + verificação de “uma main por Church”
- [ ] C3: Remoção de `qr_code_*` de Church + limpeza de referências
- [x] C4: Default de registro de visitantes da Church aplicado em novas Branches
- [x] C5: Rotina de agregação consistente (membros/visitantes) por Church/Denomination
- [x] M1: Members – adicionar membership_start_date/end_date + backfill + serializers
- [ ] M2: Members – atualizar APIs/Front (compat)
- [x] S1: MembershipStatus – adicionar branch + aliases datas + constraint + backfill
- [x] S2: MembershipStatus – regras de gravação/compat + front
- [x] V1: Visitors – índices/consistência
- [x] V2: Visitors – validação conversão/branch

Testes e Validação
- API
  - GET Denominations (list/retrieve) inclui campos novos e agregados corretos.
  - GET Church retorna dados de QR via Branch principal; comandos de QR funcionam via Branch.
  - Criação de Church respeita limite `max_churches` (>0) da Denomination.
  - Criação de Branch herda `allows_visitor_registration` da Church.
- Dados
  - Após migração, Branch principal possui QR (uuid/image/active) equivalente ao que existia em Church.

Riscos e Mitigações
- Church sem Branch principal: criar no `create` de Church (já implementado) e validar nos dados existentes; abortar operações de QR quando ausente, com mensagem clara.
- Clients legados consumindo `qr_code_*` via Church: manter resposta no serializer via delegação até a remoção definitiva.

Diário de Bordo (preencher durante execução)
- 2025‑10‑27 – D1 aplicado em dev. Migração criada (0003_*). Sem quebras.
- YYYY‑MM‑DD – D2 backfill executado. Totais conferidos.
- 2025‑10‑27 – C1 serializers delegando QR. Actions compat criadas.
- 2025‑10‑27 – C2 data migration QR → main branch aplicada.
- 2025‑10‑27 – C3 remoção de campos Church.qr_code_* e limpeza aplicada.
- 2025‑10‑27 – C4 herdando allows_visitor_registration em novas branches.
- 2025‑10‑27 – C5 agregação de total_visitors_registered em Church.update_statistics.
- 2025‑10‑27 – Planejamento M (Members), S (MembershipStatus) e V (Visitors) adicionado.
- 2025‑10‑27 – M1 concluído: campos de período de membresia adicionados, backfill, serializers.
- 2025‑10‑27 – S1 concluído: branch em MembershipStatus, aliases de datas, constraint e backfill.
- 2025‑10‑27 – S2 concluído: defaults/validações em serializer e compat no front.
- 2025‑10‑27 – V1 concluído: índice (branch, created_at) + normalização leve de registration_source.
- 2025‑10‑27 – V2 concluído: confirmado fluxo de conversão mantém branch e regra de lotação.
