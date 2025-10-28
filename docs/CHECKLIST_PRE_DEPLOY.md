# Checklist Pré-Deploy - Obreiro Virtual

**Versão:** 1.0
**Data:** 27 de Outubro de 2025
**Objetivo:** Garantir deploy seguro em produção após correção de inconsistências de banco de dados

---

## ⚠️ CONTEXTO

Em 27/10/2025, houve falha no deploy de produção devido a:
1. Migração 0013 marcada como aplicada, mas tabela não existia
2. Migração 0018 duplicada causando conflito
3. Estado inconsistente do banco de dados

Este checklist garante que não haverá repetição do problema.

---

## ✅ CHECKLIST PRÉ-DEPLOY

### FASE 1: Preparação do Ambiente DEV

- [ ] **1.1** Migração órfã 0018_make_cpf removida do banco DEV
  ```bash
  docker exec obreiro_backend_dev python manage.py showmigrations members | grep "0018"
  # Deve mostrar APENAS: 0018_member_branch_member_members_mem_church__ce62e1_idx
  ```

- [ ] **1.2** Nenhuma migração duplicada em DEV
  ```bash
  docker exec obreiro_backend_dev python -c "
  from django.db import connection
  import django, os
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  django.setup()
  cursor = connection.cursor()
  cursor.execute('''
      SELECT LEFT(name, 5) as num, COUNT(*)
      FROM django_migrations
      WHERE app = 'members'
      GROUP BY LEFT(name, 5)
      HAVING COUNT(*) > 1
  ''')
  if cursor.fetchall():
      print('❌ DUPLICATAS ENCONTRADAS!')
  else:
      print('✅ OK - Nenhuma duplicata')
  "
  ```

- [ ] **1.3** Tabela membershipstatus existe e está correta em DEV
  ```bash
  docker exec obreiro_backend_dev python -c "
  from django.db import connection
  import django, os
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  django.setup()
  cursor = connection.cursor()
  cursor.execute('SELECT column_name FROM information_schema.columns WHERE table_name = \"members_membershipstatus\" ORDER BY ordinal_position')
  columns = [r[0] for r in cursor.fetchall()]
  required = ['id', 'created_at', 'updated_at', 'uuid', 'is_active', 'status', 'effective_date', 'end_date', 'observation', 'member_id', 'branch_id']
  missing = [c for c in required if c not in columns]
  if missing:
      print(f'❌ Colunas faltando: {missing}')
  else:
      print('✅ OK - Todas as colunas presentes')
  "
  ```

- [ ] **1.4** Todas as migrações aplicadas em DEV sem erros
  ```bash
  docker exec obreiro_backend_dev python manage.py migrate --check
  # Deve retornar: No changes detected
  ```

- [ ] **1.5** Testes automatizados passando (se existirem)
  ```bash
  docker exec obreiro_backend_dev python manage.py test
  ```

- [ ] **1.6** Aplicação DEV funcionando corretamente
  ```bash
  curl -f http://localhost:5173/
  curl -f http://localhost:8000/api/v1/
  ```

---

### FASE 2: Preparação do Ambiente PROD

- [ ] **2.1** Acesso SSH à VPS de produção
  ```bash
  ssh user@obreiro-vps-ip
  ```

- [ ] **2.2** Containers de produção rodando
  ```bash
  docker ps | grep obreiro
  # Verificar: obreiro_backend_prod, obreiro_postgres_prod, obreiro_nginx_prod
  ```

- [ ] **2.3** Espaço em disco suficiente para backup (mínimo 1GB)
  ```bash
  df -h /root/obreiro-backups
  ```

- [ ] **2.4** Diretório de backups existe
  ```bash
  ls -la /root/obreiro-backups
  mkdir -p /root/obreiro-backups  # Se não existir
  ```

- [ ] **2.5** Script de deploy copiado para VPS
  ```bash
  # Na sua máquina local:
  scp scripts/deploy_migrations_safe.sh user@vps:/root/

  # Na VPS:
  chmod +x /root/deploy_migrations_safe.sh
  ```

- [ ] **2.6** Documentação de rollback acessível
  ```bash
  # Verificar que existe:
  ls /root/obreiro-backups/ROLLBACK_PROCEDURE.md
  ```

---

### FASE 3: Auditoria do Banco PROD

**⚠️ CRÍTICO:** Execute ANTES do deploy!

- [ ] **3.1** Verificar se tabela membershipstatus existe em PROD
  ```bash
  docker exec obreiro_backend_prod python -c "
  from django.db import connection
  import django, os
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  django.setup()
  cursor = connection.cursor()
  cursor.execute(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'members_membershipstatus')\")
  exists = cursor.fetchone()[0]
  print(f'Tabela existe: {exists}')
  if not exists:
      print('❌ CRÍTICO: Tabela não existe! Abortar deploy!')
  "
  ```

- [ ] **3.2** Verificar migrações 0018 em PROD
  ```bash
  docker exec obreiro_backend_prod python manage.py showmigrations members | grep "0018"
  # Verificar quantas migrações 0018 existem
  ```

- [ ] **3.3** Verificar se há migração órfã em PROD
  ```bash
  docker exec obreiro_backend_prod python -c "
  from django.db import connection
  import django, os
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  django.setup()
  cursor = connection.cursor()
  cursor.execute(\"SELECT EXISTS (SELECT FROM django_migrations WHERE app = 'members' AND name = '0018_make_cpf_unique_per_church')\")
  if cursor.fetchone()[0]:
      print('⚠️  Migração órfã encontrada - será removida pelo script')
  else:
      print('✅ Nenhuma migração órfã')
  "
  ```

- [ ] **3.4** Documentar estado atual do banco PROD
  ```bash
  docker exec obreiro_backend_prod python manage.py showmigrations members > /tmp/prod_migrations_before_deploy.txt
  cat /tmp/prod_migrations_before_deploy.txt
  ```

---

### FASE 4: Comunicação e Planejamento

- [ ] **4.1** Usuários notificados sobre manutenção programada
  - [ ] Email enviado para admins
  - [ ] Aviso no sistema (se aplicável)
  - [ ] Janela de manutenção definida: ____________

- [ ] **4.2** Equipe técnica disponível durante deploy
  - [ ] Pessoa responsável: ____________
  - [ ] Backup técnico: ____________

- [ ] **4.3** Plano B definido
  - [ ] Procedimento de rollback testado
  - [ ] Script de rollback pronto
  - [ ] Tempo estimado de rollback: ~15 minutos

- [ ] **4.4** Monitoramento preparado
  - [ ] Logs sendo monitorados
  - [ ] Alertas configurados (se aplicável)

---

### FASE 5: Execução do Deploy

- [ ] **5.1** Backup do código atual em PROD
  ```bash
  cd /root/obreiro-digital-landing
  git log -1 --oneline > /tmp/commit_before_deploy.txt
  cat /tmp/commit_before_deploy.txt
  ```

- [ ] **5.2** Executar script de deploy seguro
  ```bash
  cd /root
  ./deploy_migrations_safe.sh
  ```

- [ ] **5.3** Verificar backup foi criado
  ```bash
  ls -lh /root/obreiro-backups/backup_pre_migration_*.sql.gz
  ```

- [ ] **5.4** Acompanhar logs do deploy
  ```bash
  # O script mostrará os logs em tempo real
  # Verificar se não há erros
  ```

- [ ] **5.5** Script concluiu sem erros
  - [ ] ✅ Auditoria passou
  - [ ] ✅ Migrações aplicadas
  - [ ] ✅ Validação pós-deploy OK

---

### FASE 6: Validação Pós-Deploy

- [ ] **6.1** Aplicação respondendo
  ```bash
  curl -f https://www.obreirovirtual.com/
  curl -f https://www.obreirovirtual.com/api/v1/
  ```

- [ ] **6.2** Login funcionando
  - [ ] Fazer login com usuário teste
  - [ ] Verificar dashboard carrega

- [ ] **6.3** Funcionalidades críticas testadas
  - [ ] Listar membros
  - [ ] Cadastrar novo membro
  - [ ] Listar visitantes
  - [ ] Gerar relatório

- [ ] **6.4** Verificar logs de erro
  ```bash
  docker logs obreiro_backend_prod --tail 100 | grep ERROR
  # Não deve haver erros críticos
  ```

- [ ] **6.5** Verificar migrações aplicadas corretamente
  ```bash
  docker exec obreiro_backend_prod python manage.py showmigrations members | tail -5
  # Verificar que 0025 está aplicada
  ```

- [ ] **6.6** Tabela membershipstatus com estrutura correta
  ```bash
  docker exec obreiro_backend_prod python -c "
  from django.db import connection
  import django, os
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
  django.setup()
  cursor = connection.cursor()
  cursor.execute('SELECT column_name FROM information_schema.columns WHERE table_name = \"members_membershipstatus\" ORDER BY ordinal_position')
  print('\\n'.join([r[0] for r in cursor.fetchall()]))
  # Verificar que branch_id está presente
  "
  ```

---

### FASE 7: Finalização

- [ ] **7.1** Documentar deploy
  - Data: ____________
  - Hora início: ____________
  - Hora fim: ____________
  - Resultado: [ ] Sucesso [ ] Rollback executado
  - Observações: ____________________________________________

- [ ] **7.2** Notificar usuários
  - [ ] Sistema de volta ao ar
  - [ ] Manutenção concluída

- [ ] **7.3** Backup pode ser arquivado
  ```bash
  # Mover backup para arquivo depois de 24h se tudo estiver OK
  mv /root/obreiro-backups/backup_pre_migration_*.sql.gz /root/obreiro-backups/archive/
  ```

- [ ] **7.4** Atualizar documentação
  - [ ] Marcar este checklist como completo
  - [ ] Atualizar README com nova versão
  - [ ] Commit de documentação

---

## 🚨 SE ALGO DER ERRADO

### Rollback Automático

O script `deploy_migrations_safe.sh` faz rollback automático em caso de erro.

### Rollback Manual

Se o script falhar antes do rollback automático:

```bash
# 1. Restaurar backup
BACKUP_FILE="/root/obreiro-backups/backup_pre_migration_XXXXXXXX_XXXXXX.sql.gz"
gunzip -c "$BACKUP_FILE" | docker exec -i obreiro_postgres_prod psql -U obreiro_prod -d obreiro_prod

# 2. Reverter código
cd /root/obreiro-digital-landing
git reset --hard COMMIT_HASH_ANTERIOR  # Ver /tmp/commit_before_deploy.txt

# 3. Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verificar funcionamento
curl -f https://www.obreirovirtual.com/
```

---

## 📞 Contatos de Emergência

- **Desenvolvedor Principal:** ____________
- **DBA/Sysadmin:** ____________
- **Suporte VPS:** ____________

---

## 📚 Documentos Relacionados

- [Relatório de Inconsistências](./RELATORIO_INCONSISTENCIAS_DB.md)
- [Sistema de Permissões](./Sistema_de_Permissoes.md)
- [Procedimento de Rollback](../obreiro-backups/ROLLBACK_PROCEDURE.md) (em PROD)

---

**✅ ESTE CHECKLIST DEVE SER COMPLETADO 100% ANTES DO DEPLOY!**

---

**Responsável pelo deploy:** ______________________________
**Data:** ____/____/________
**Assinatura:** ______________________________
