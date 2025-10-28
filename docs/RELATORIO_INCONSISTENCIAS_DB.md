# Relatório de Inconsistências de Banco de Dados - Obreiro Virtual

**Data:** 27 de Outubro de 2025
**Ambiente Analisado:** DEV (Docker)
**Responsável:** Investigação Automatizada

---

## 🎯 Objetivo da Investigação

Identificar e documentar todas as inconsistências entre migrações Django e estado real do banco de dados antes de realizar deploy em produção, evitando repetição do problema ocorrido em 27/10/2025.

---

## 📊 Sumário Executivo

| Item | Status DEV | Status PROD (Relatado) |
|------|------------|------------------------|
| Tabela `members_membershipstatus` | ✅ Existe | ❌ Não existia |
| Migração 0013 aplicada | ✅ Sim | ⚠️ Marcada mas tabela missing |
| Migração 0018 duplicada | ⚠️ **SIM - PROBLEMA CRÍTICO** | ⚠️ **SIM - CAUSOU FALHA** |
| Dependências de migrações | ✅ Corretas | ❌ Quebradas (tabela missing) |

---

## 🔍 PROBLEMA CRÍTICO IDENTIFICADO

### 🚨 Migração 0018 Duplicada

#### Estado Atual no Banco de Dados DEV:

```
members  0018_make_cpf_unique_per_church                    2025-10-17 00:52:36
members  0018_member_branch_member_members_mem_church__ce62e1_idx  2025-10-23 03:19:35
```

#### Estado Atual no Código:

```bash
$ ls backend/apps/members/migrations/0018*.py
0018_member_branch_member_members_mem_church__ce62e1_idx.py  ← APENAS ESTA EXISTE
```

#### Análise:

1. **Migração Órfã:** `0018_make_cpf_unique_per_church` está marcada como aplicada no banco, mas **NÃO EXISTE MAIS NO CÓDIGO**
2. **Conflito de Numeração:** Duas migrações com o mesmo número (0018)
3. **Risco em Produção:** Ao tentar aplicar a migração atual (do código), pode haver conflito com a órfã

---

## 📋 Estado Completo das Migrações - App Members

### Migrações Aplicadas (25 total):

| # | Nome | Data Aplicação | Status Arquivo | Observações |
|---|------|----------------|----------------|-------------|
| 01 | 0001_initial | 2025-10-05 20:04:36 | ✅ Existe | OK |
| 02 | 0002_alter_member_gender | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 05 | 0005_add_spouse_fields | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 06 | 0006_remove_old_spouse_field | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 07 | 0007_add_children_count_field | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 08 | 0008_fix_spouse_name_null | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 09 | 0009_add_address_fields | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 10 | 0010_reset_membershipstatuslog | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 11 | 0011_add_ministerial_function_log_simple | 2025-10-05 20:04:38 | ✅ Existe | OK |
| 12 | 0012_membershipstatuslog_indexes | 2025-10-05 20:04:38 | ✅ Existe | OK |
| **13** | **0013_membershipstatus_and_more** | **2025-10-05 20:06:32** | ✅ **Existe** | **Cria tabela membershipstatus** |
| 15 | 0015_populate_missing_cpf_phone | 2025-10-05 20:09:52 | ✅ Existe | OK |
| 16 | 0016_make_cpf_phone_required | 2025-10-05 20:09:52 | ✅ Existe | OK |
| 17 | 0017_remove_ministerialfunctionlog | 2025-10-05 21:20:22 | ✅ Existe | OK |
| **18a** | **0018_make_cpf_unique_per_church** | **2025-10-17 00:52:36** | ❌ **NÃO EXISTE** | **⚠️ ÓRFÃ** |
| **18b** | **0018_member_branch_member** | **2025-10-23 03:19:35** | ✅ **Existe** | **⚠️ DUPLICADA** |
| 19 | 0019_ministerialfunctionhistory | 2025-10-23 11:55:59 | ✅ Existe | Depende de 0018b |
| 20 | 0020_rename_membershipstatus_fields | 2025-10-23 13:36:38 | ✅ Existe | Renomeia campos |
| 21 | 0021_update_membershipstatus_indexes | 2025-10-23 13:37:06 | ✅ Existe | OK |
| 22 | 0022_alter_membershipstatus_options | 2025-10-23 13:37:28 | ✅ Existe | OK |
| 23 | 0023_member_cpf_optional | 2025-10-23 14:53:07 | ✅ Existe | OK |
| 24 | 0024_membership_period_fields | 2025-10-27 14:48:35 | ✅ Existe | OK |
| 25 | 0025_membershipstatus_branch | 2025-10-27 14:52:14 | ✅ Existe | Adiciona branch |

---

## 🗄️ Estado Real do Banco de Dados

### Tabelas Existentes:

| Tabela | Registros | Status |
|--------|-----------|--------|
| `members_member` | 17 | ✅ OK |
| `members_membershipstatus` | 0 | ✅ Existe (vazia) |
| `members_membershipstatuslog` | 8 | ✅ OK |
| `members_membertransferlog` | 0 | ✅ OK |
| `members_ministerialfunctionhistory` | 9 | ✅ OK |
| `members_member_ministries` | ? | ✅ Existe |

### Estrutura da Tabela `members_membershipstatus`:

| Coluna | Tipo | Nullable | Observação |
|--------|------|----------|------------|
| id | bigint | NOT NULL | PK |
| created_at | timestamp with time zone | NOT NULL | - |
| updated_at | timestamp with time zone | NOT NULL | - |
| uuid | uuid | NOT NULL | Unique |
| is_active | boolean | NOT NULL | - |
| status | varchar | NOT NULL | - |
| **effective_date** | date | NULL | **Era ordination_date** |
| **end_date** | date | NULL | **Era termination_date** |
| observation | text | NOT NULL | - |
| member_id | bigint | NOT NULL | FK → members_member |
| **branch_id** | bigint | NULL | **Adicionado em 0025** |

**✅ IMPORTANTE:** Campos foram renomeados pela migração 0020:
- `ordination_date` → `effective_date`
- `termination_date` → `end_date`

---

## 🔗 Análise de Dependências

### Cadeia de Migrações Críticas:

```
0013_membershipstatus_and_more
  ↓ Cria tabela members_membershipstatus
  ↓ Campos: ordination_date, termination_date

0018_member_branch_member_members_mem_church__ce62e1_idx
  ↓ Adiciona branch_id ao Member
  ↓ Depende de: 0017

0019_ministerialfunctionhistory_and_more
  ↓ Altera membershipstatus.status (choices)
  ↓ Depende de: 0018

0020_rename_membershipstatus_fields
  ↓ Renomeia: ordination_date → effective_date
  ↓ Renomeia: termination_date → end_date
  ↓ Depende de: 0019

0025_membershipstatus_branch_and_constraint
  ↓ Adiciona branch_id ao MembershipStatus
  ↓ Depende de: 0024
  ↓ Depende de: branches.0006
```

**✅ Dependências estão corretas no código atual**

---

## ⚠️ Comparação: DEV vs PROD

### O que funcionou em DEV:

1. ✅ Migração 0013 criou a tabela `members_membershipstatus`
2. ✅ Migrações 0019, 0020, 0025 aplicadas com sucesso
3. ⚠️ Migração órfã 0018_make_cpf existe no banco mas não causa problemas imediatos

### O que falhou em PROD (segundo relatório):

1. ❌ Migração 0013 marcada como aplicada
2. ❌ MAS tabela `members_membershipstatus` NÃO existia fisicamente
3. ❌ Migrações 0019, 0020, 0025 falharam (tabela não existia)
4. ❌ Conflito de migração 0018 duplicada

### Por que DEV está OK e PROD falhou?

**Hipóteses:**

1. **Reset de banco em DEV:** Provavelmente foi feito reset completo ou fresh migration em DEV após o problema
2. **Backup inconsistente em PROD:** O backup restaurado já continha a inconsistência (migração marcada sem tabela)
3. **Migração 0013 parcialmente aplicada em PROD:** Marcou como aplicada mas deu erro ao criar tabela (rollback parcial?)

---

## 🚨 Riscos Identificados para Deploy

### 🔴 Risco CRÍTICO - Migração 0018 Órfã

**Problema:**
- Banco de dados DEV tem `0018_make_cpf_unique_per_church` aplicada
- Código não tem mais essa migração
- Ao fazer deploy, Django pode tentar aplicar novamente a 0018 atual
- Pode causar:
  - Conflito de numeração
  - Erro de dependências
  - Falha no deploy

**Impacto:** 🔴 ALTO - Pode causar falha total no deploy

**Solução:** Remover registro órfão do banco antes do deploy

---

### 🟡 Risco MÉDIO - Estado Desconhecido do Banco PROD

**Problema:**
- Não sabemos o estado atual EXATO do banco de produção
- Foi feito rollback + correção manual
- Pode haver outras inconsistências não documentadas

**Impacto:** 🟡 MÉDIO - Pode causar erros durante migração

**Solução:** Fazer auditoria completa do banco PROD antes do próximo deploy

---

### 🟡 Risco MÉDIO - Falta de Teste de Migração em Ambiente Clone

**Problema:**
- Não há ambiente de staging/teste com clone de produção
- Migrações não foram testadas em ambiente idêntico a PROD

**Impacto:** 🟡 MÉDIO - Comportamento imprevisível em PROD

**Solução:** Criar procedimento de teste em clone de PROD

---

## ✅ Plano de Correção

### Etapa 1: Limpar Migração Órfã em DEV

```bash
# Conectar ao banco
docker exec obreiro_backend_dev python manage.py dbshell

# Remover registro órfão
DELETE FROM django_migrations
WHERE app = 'members'
AND name = '0018_make_cpf_unique_per_church';
```

### Etapa 2: Validar Estado do Banco DEV

```bash
# Verificar migrações
docker exec obreiro_backend_dev python manage.py showmigrations members

# Verificar tabelas
docker exec obreiro_backend_dev python -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'members_%'\")
for row in cursor.fetchall():
    print(row[0])
"
```

### Etapa 3: Testar Migrações do Zero

```bash
# Criar fresh database de teste
docker exec obreiro_postgres_dev createdb obreiro_test

# Aplicar todas as migrações
docker exec obreiro_backend_dev python manage.py migrate --database=test

# Validar resultado
docker exec obreiro_backend_dev python manage.py check --database=test
```

### Etapa 4: Preparar Script de Deploy Seguro

Ver seção "Script de Deploy Seguro" abaixo.

---

## 🔧 Script de Deploy Seguro (Para PROD)

```bash
#!/bin/bash
# deploy_migrations_safe.sh

set -e  # Parar em caso de erro

echo "=== BACKUP PRÉ-DEPLOY ==="
BACKUP_FILE="/root/obreiro-backups/backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec obreiro_postgres_prod pg_dump -U obreiro_prod obreiro_prod | gzip > "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

echo ""
echo "=== AUDITORIA DO BANCO ==="
docker exec obreiro_backend_prod python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()

# Verificar se membershipstatus existe
cursor.execute(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'members_membershipstatus')\")
exists = cursor.fetchone()[0]
print(f'Tabela members_membershipstatus existe: {exists}')

if not exists:
    print('⚠️  ATENÇÃO: Tabela critical está faltando!')
    exit(1)

# Verificar migrações órfãs
cursor.execute(\"SELECT name FROM django_migrations WHERE app = 'members' AND name LIKE '%0018%' ORDER BY name\")
migrations_0018 = cursor.fetchall()
if len(migrations_0018) > 1:
    print(f'⚠️  ATENÇÃO: {len(migrations_0018)} migrações 0018 encontradas!')
    for m in migrations_0018:
        print(f'  - {m[0]}')
    exit(1)

print('✅ Auditoria OK')
"

if [ $? -ne 0 ]; then
    echo "❌ Auditoria falhou! Abortando deploy."
    exit 1
fi

echo ""
echo "=== APLICAR MIGRAÇÕES ==="
docker exec obreiro_backend_prod python manage.py migrate --no-input

if [ $? -eq 0 ]; then
    echo "✅ Migrações aplicadas com sucesso!"
else
    echo "❌ Erro ao aplicar migrações!"
    echo "Iniciando rollback..."

    # Restaurar backup
    gunzip -c "$BACKUP_FILE" | docker exec -i obreiro_postgres_prod psql -U obreiro_prod -d obreiro_prod

    echo "✅ Rollback completo"
    exit 1
fi

echo ""
echo "=== VALIDAÇÃO PÓS-DEPLOY ==="
docker exec obreiro_backend_prod python manage.py check

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
```

---

## 📝 Checklist Pré-Deploy

Antes de fazer deploy em produção, verificar:

- [ ] Migração órfã 0018_make_cpf removida do banco DEV
- [ ] Todas as migrações aplicadas em DEV sem erros
- [ ] Testes automatizados passando
- [ ] Backup de produção criado
- [ ] Script de rollback testado
- [ ] Auditoria do banco PROD executada
- [ ] Estado do banco PROD documentado
- [ ] Usuários notificados sobre manutenção
- [ ] Plano B preparado (rollback manual se script falhar)

---

## 🎯 Recomendações Finais

### 🔴 CRÍTICO - Fazer ANTES do próximo deploy:

1. **Limpar migração órfã em DEV e PROD**
2. **Criar ambiente de teste clone de PROD**
3. **Testar migrações em ambiente clone**
4. **Documentar estado atual do banco PROD**

### 🟡 IMPORTANTE - Fazer a médio prazo:

1. **Implementar CI/CD com teste de migrações**
2. **Criar scripts automatizados de validação**
3. **Implementar monitoramento de integridade do banco**
4. **Criar procedimento de rollback automático**

### 🟢 BOAS PRÁTICAS - Melhorias futuras:

1. **Usar migrations squashing para consolidar migrações antigas**
2. **Implementar staging environment**
3. **Adicionar testes de integração para migrações**
4. **Documentar processo de migração no README**

---

## 📚 Arquivos Relacionados

- `backend/apps/members/migrations/` - Arquivos de migração
- `docs/Sistema_de_Permissoes.md` - Sistema de permissões
- `/root/obreiro-backups/` (PROD) - Backups do banco
- `docker-compose.prod.yml` - Configuração de produção

---

**Próxima Ação Recomendada:** Executar FASE 2 - Corrigir inconsistências em DEV (limpar migração órfã)

---

**Documento gerado automaticamente em:** 27 de Outubro de 2025
**Versão:** 1.0
**Status:** 🔴 AÇÃO NECESSÁRIA
