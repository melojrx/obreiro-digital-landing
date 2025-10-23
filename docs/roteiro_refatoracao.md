0) Escopo do MVP (revisado)

Inclui agora

Tenant por Denomination (middleware pronto).

Sem CRUD de Denomination para o usuário: o usuário escolhe a denominação no cadastro (lista pré-definida) ou “Outros”.

Gestão (CRUD + regras) somente de Churches e Branches.

Cadastro em 3 etapas (dados pessoais → denominação/endereço → plano).

Onboarding: criar Church e gerar Branch Matriz automaticamente (QRCode ativo).

Visitors (via QR Code público e via app).

Members (cadastro e listagem), com ações operando no nível de Branch.

Fora do MVP: Ministérios, Atividades, Equipes, Ordenações, Relatórios avançados.

Critérios de aceite do item 0

Nenhum endpoint de POST/PATCH/DELETE para Denomination disponível ao usuário comum.

GET /denominations (ou equivalente) pode existir para listagem/consulta no cadastro; “Outros” permitido.

1) Tenancy e Escopos

Meta: todos os endpoints respeitam tenant = Denomination; Church/Branch como escopos operacionais.

Tarefas

Middleware já atualizado: request.denomination, request.church, request.branch.

Aceite: request.denomination coerente com a igreja ativa do usuário; se o produto é “1 usuário → 1 denominação”, desabilite override por header para usuários não-staff (mantém para staff/backoffice apenas).

Filtragem por denom nas views do MVP (Denomination: somente leitura; Churches; Branches; Visitors; Members).

Aceite: dados de denom A não aparecem para quem tem acesso só à denom B.

Branch como escopo de operações: Visitors (sempre com branch), Members (ver item 3).

Aceite: any-create/update que envolva pessoa/visita identifica a branch envolvida.

2) Cadastro em 3 etapas

Etapa 1 (dados pessoais)

Validações client+server (idade ≥18, CPF único e válido, e-mail único, senha forte).

Persistência temporária no localStorage até o submit final.

Etapa 2 (denominação + endereço)

Lista pré-definida de denominações (IDs).

“Outros”: como não há CRUD para Denomination no app, defina o comportamento do MVP:

Opção recomendada (fluidez e duplicatas permitidas): ao finalizar o cadastro (endpoint final), criar automaticamente uma Denomination com o nome informado em “Outros” e vincular o usuário a ela (tenant).

Alternativa (operações internas): registrar só denomination_other_name no UserProfile e alguém do backoffice cria/associa a denom depois.

Aceite: o usuário consegue seguir mesmo com “Outros” sem telas de gestão de denominação.

Etapa 3 (plano)

POST /api/v1/auth/finalize-registration/ consolida Etapas 1+2+3.

Transação: cria User, UserProfile (com denomination_id ou cria denom se “Outros”), gera token, retorna needs_church_setup=True.

Aceite: resposta contém { token, user, needs_church_setup: true }.

3) Members e Branch (decisão do MVP)

Regra: “todas as ações em nível de Branch (matriz/filial)”.

Para MVP (simples e aderente):

Adotar member.branch (FK opcional) como “filial de referência” do membro.

Validação: member.branch.church == member.church.

Aceite: ao cadastrar/editar Member via app/admin, permitir branch; relatórios simples por branch passam a ser triviais.

(Se preferir adiar o campo branch em Member, siga com church-only e exija branch só nas ações operacionais. Mas a recomendação acima entrega mais aderência agora.)

4) Onboarding: Church e Branch Matriz automática

Backend

POST /api/v1/churches/ (ou .../create-first-church/).

Transação:

Criar Church com denomination_id do usuário.

Criar Branch Matriz automaticamente: is_main=True, qr_code_active=True.

Criar/confirmar ChurchUser (role church_admin, is_active=True) e marcar como ativa.

Retornar no payload a Church e a Branch Matriz.

Frontend

Receber Church + Branch Matriz; definir active_church/active_branch; redirecionar /dashboard.

Aceite

Exatamente uma matriz por church; qr_code_active=True; idempotência em recriações.

5) QR Code e Visitors

Modelo de QR

Token único em Branch (congregação).

Endpoint público

POST /api/v1/visitors/public/register?token=<qr_token>

Server resolve branch via token; deriva church/denomination.

Payload mínimo (nome/telefone/e-mail?); registration_source='qr_code'.

Aceite: visitante criado na branch correta via QR, com auditoria.

Endpoint autenticado (app/admin)

POST /api/v1/visitors/ com branch_id explícito (ou branch ativa), além de dados adicionais.

Aceite: fluxo simétrico ao público; regras de permissão aplicadas.

6) Members e Visitors (CRUD básico + filtros)

Members

CRUD + filtros (por branch_id, membership_status, datas).

Aceite: criação/edição respeita branch (se adotada); listagens respeitam denom.

Visitors

CRUD + listagem (por branch/igreja/denom).

Conversão para Member pode ficar pós-MVP.

7) Gestão (CRUD) — somente Churches e Branches (revisado)

Denomination

Sem CRUD para usuário. Apenas GET para listagem/consulta no cadastro (quando não usar “Outros”).

Se “Outros” → ver seção 2 (criação automática no finalize ou fluxo backoffice).

Church

CRUD sob a denom do usuário; ao criar, sempre gera Matriz.

Aceite: multi-church por denom, uma matriz por church (is_main=True único).

Branch

CRUD de congregações; qr_code_active toggle; is_main somente leitura (apenas a matriz).

Aceite: coerência de denom/church/branch em todos os vínculos.

8) Segurança e Permissões

ChurchUser define o papel (ex.: church_admin).

Throttling (DRF) em rotas públicas (QR) e auth.

Header X-Denomination-Id: desativado para usuários comuns (ou ignorado), permitido só a staff/backoffice.

Aceite: usuário sem permissão não troca de denom por header; QR público funciona sem login.

9) Banco e Integridade

Índices

Church(denomination_id)

Branch(church_id, is_main)

Visitor(church_id, branch_id, created_at)

(Se Member.branch_id existir) Member(church_id, branch_id)

Constraints

Branch: unique parcial garantindo uma matriz por church.

Consistência de FK entre member/visitor ↔ branch ↔ church ↔ denomination.

Aceite

Consultas comuns do dashboard sem N+1 (usar select_related/prefetch_related nos ViewSets do MVP).

10) Frontend (pontos de atenção)

Atualizações implementadas (status atual)

- Branch matriz: mantido o nome de campo `is_headquarters` (rename opcional adiado) e criada UniqueConstraint condicional garantindo uma matriz por igreja.
- Serializers de Branch já expõem `qr_code_uuid` e `visitor_registration_url` (usados no front para QR público).
- Endpoint de troca de escopo: `POST /auth/set-active-church/` agora aceita `branch_id` opcional para definir a filial ativa do usuário.
- Throttling DRF: adicionado throttle específico para QR público e autenticação, com escopos `qr_anon`/`qr_user` e `auth_anon`/`auth_user`. Aplicado em `visitors.validate_qr_code`, `visitors.register_visitor` e no `CustomAuthToken` (login).
- Frontend: adicionado `BranchSelector` na navbar, usando o mesmo endpoint de set-active-church com `branchId` e invalidando caches relevantes. Páginas de Membros/Visitantes agora exibem a filial ativa no header.
- Backfill de dados legados: comando `python manage.py backfill_active_branch` para preencher `ChurchUser.active_branch` com a filial matriz existente quando vazio.

Notas de migração

- Nova migração em `apps/branches/migrations/0005_branch_unique_headquarters_per_church.py` para a UniqueConstraint.
- Rodar `python manage.py migrate` (ou via Docker Compose no ambiente dev) e, se necessário, executar o comando `backfill_active_branch` em bases legadas.

Cadastro: Etapa 2 com “Outros” (enviar denomination_other_name ou deixar o backend criar a denom).

Onboarding: usar branch matriz retornada como ativa.

Visitors: tela pública (QR) e interna (branch escolhida/ativa).

Members: formulário com branch (se adotado), filtros por branch/status.

Chaves TanStack Query com tenant/branch: ['visitors', denominationId, branchId, filters].

11) Testes mínimos

Tenancy: usuário comum não troca denom via header; staff pode.

Onboarding: Church cria Matriz is_main=True + qr_code_active=True.

Visitors (QR): cria visitante na branch da matriz (ou filial do token).

Visitors (app) e Members: CRUD sob denom correta e branch coerente.

Gestão: Church/Branch OK; Denomination sem POST/PATCH/DELETE visíveis ao usuário.

12) DoD (Definition of Done) do MVP

Tenant efetivo por Denomination respeitado nos endpoints do MVP.

Cadastro 3 etapas funcional (com “Outros” sem exigir CRUD de Denomination).

Onboarding cria Church + Branch Matriz (QRCode ativo) e define branch ativa no front.

Visitors (QR + app) e Members operando por Branch.

Gestão somente de Churches/Branches conforme regras.

Testes mínimos OK; Swagger atualizado (sem rotas de mutação de Denomination para usuário).

To-Dos rápidos para o Codex (revisão final)

Remover do router qualquer POST/PATCH/DELETE de Denomination para perfis não-staff.

Ajustar permissões das views de Denomination para read-only (usuário) e full (staff/backoffice).

Atualizar Swagger/tags: “Denominations (read-only)”, “Churches (CRUD)”, “Branches (CRUD)”, “Visitors”, “Members”.

Se optar por criar a denom “Outros” automaticamente no finalize: documentar no endpoint e registrar a associação do usuário a essa denom recém-criada.
