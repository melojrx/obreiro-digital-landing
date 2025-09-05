# Verificações de Segurança para Produção

## ✅ Checklist Pré-Deploy

### 1. Verificar estrutura da tabela em produção
```sql
-- Conectar no PostgreSQL de produção e executar:
\d accounts_churchuser

-- Verificar se existem os campos que a migração 0012 tenta remover:
-- - can_create_churches
-- - can_manage_church_admins  
-- - can_manage_denomination
-- - can_view_financial_reports
```

### 2. Verificar estado das migrações
```bash
# No ambiente de produção:
python manage.py showmigrations accounts
```

### 3. Backup obrigatório
```bash
# Fazer backup completo do banco antes do deploy:
pg_dump -h HOST -U USER -d DATABASE > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Teste em ambiente de staging
- Aplicar as migrações primeiro em um ambiente de staging
- Verificar se não há erros
- Testar funcionalidades críticas

## 🚨 Cenários de Risco

### Se a tabela em produção TEM os campos:
- A migração 0012 atual falhará
- Solução: Reverter para a versão original da migração 0012

### Se a tabela em produção NÃO TEM os campos:
- ✅ Migração atual é segura
- A operação no-op não causará problemas

## 📋 Plano de Rollback

1. **Rollback de código:**
   ```bash
   git revert <commit_hash>
   ```

2. **Rollback de migração (se necessário):**
   ```bash
   python manage.py migrate accounts 0011
   ```

3. **Restaurar backup:**
   ```bash
   psql -h HOST -U USER -d DATABASE < backup_file.sql
   ```

## ✅ Aprovação para Produção

- [ ] Backup realizado
- [ ] Estrutura da tabela verificada
- [ ] Teste em staging aprovado
- [ ] Plano de rollback preparado
- [ ] Janela de manutenção agendada (se necessário)
