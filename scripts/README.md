# 📜 Scripts de Automação - Obreiro Digital

Este diretório contém scripts especializados para automação de deploy, monitoramento e manutenção do sistema Obreiro Digital em desenvolvimento e produção.

## 📋 Scripts Disponíveis

### 🚀 **Deploy e Produção**

#### **1. deploy-procedure.sh** - *Deploy Seguro com Zero Downtime*
Script principal para deploy em produção com procedimentos avançados de segurança.

```bash
./scripts/deploy-procedure.sh
```

**🎯 Funcionalidades:**
- ✅ **Backup automático** antes de qualquer mudança
- ✅ **Validação de configurações** (.env_prod, dependências)
- ✅ **Build otimizado** com cache inteligente  
- ✅ **Migrações seguras** com rollback automático
- ✅ **Health checks** pós-deploy
- ✅ **Zero downtime** com blue-green deployment
- ✅ **Rollback automático** em caso de falha
- ✅ **Logs detalhados** de todo o processo

**📋 Pré-requisitos:**
- Arquivo `.env_prod` configurado e validado
- Docker e Docker Compose instalados
- Certificados SSL configurados
- Backup automático funcionando

---

#### **2. safe-pull.sh** - *Atualização Segura do Código*
Script para atualizar código do GitHub de forma segura em produção.

```bash
./scripts/safe-pull.sh
```

**🎯 Funcionalidades:**
- ✅ **Backup das configurações** atuais
- ✅ **Pull do código** com validação
- ✅ **Correção automática** de variáveis de ambiente
- ✅ **Rebuild inteligente** apenas do necessário
- ✅ **Migrações automáticas** se necessário
- ✅ **Correção de permissões** de mídia
- ✅ **Verificação pós-update** com health checks

**⚠️ Uso Recomendado:**
```bash
# Sempre use este script ao invés de git pull direto
./safe-pull.sh
```

---

### 🛠️ **Desenvolvimento**

#### **3. dev_setup.sh** - *Setup Ambiente de Desenvolvimento*
Script para configuração inicial do ambiente de desenvolvimento.

```bash
./scripts/dev_setup.sh
```

**🎯 Funcionalidades:**
- ✅ **Verificação de dependências** (Docker, Docker Compose)
- ✅ **Configuração de variáveis** de ambiente (.env_dev)
- ✅ **Inicialização dos containers** de desenvolvimento
- ✅ **Setup do banco** com dados de teste
- ✅ **Criação de usuários** de teste automática
- ✅ **Verificação de saúde** dos serviços

**📋 Para novos desenvolvedores:**
```bash
# Setup completo do ambiente
git clone <repo-url>
cd obreiro-digital-landing
./scripts/dev_setup.sh
```

---

### 📊 **Monitoramento e Manutenção**

#### **4. monitoring.sh** - *Sistema de Monitoramento Interativo*
Script completo de monitoramento com interface interativa.

```bash
./scripts/monitoring.sh
```

**🎯 Funcionalidades:**
- ✅ **Status dos containers** em tempo real
- ✅ **Health checks** automáticos
- ✅ **Uso de recursos** (CPU, RAM, Disco)
- ✅ **Logs centralizados** com filtros
- ✅ **Verificação de backups** automática
- ✅ **Reinicialização de serviços** emergencial
- ✅ **Limpeza de logs** e cache
- ✅ **Relatórios de performance** semanais

**💻 Menu Interativo:**
```
=== SISTEMA DE MONITORAMENTO OBREIRO DIGITAL ===
1. Status dos Containers
2. Health Checks Completos  
3. Uso de Recursos
4. Logs em Tempo Real
5. Verificar Backups
6. Reiniciar Serviços
7. Limpeza do Sistema
8. Relatório Semanal
0. Sair
```

**⚙️ Automação:**
```bash
# Cron para monitoramento automático
0 3 * * 0 /path/to/obreiro-digital-landing/scripts/monitoring.sh > /var/log/obreiro/weekly-check.log
```

---

#### **5. backup.sh** - *Sistema de Backup Automático*
Script avançado para backup completo do sistema.

```bash
./scripts/backup.sh
```

**🎯 Funcionalidades:**
- ✅ **Backup do PostgreSQL** com pg_dump otimizado
- ✅ **Backup dos arquivos** de media comprimidos
- ✅ **Compressão inteligente** para economia de espaço
- ✅ **Verificação de integridade** automática
- ✅ **Rotação de backups** (mantém últimos 7)
- ✅ **Logs detalhados** de operações
- ✅ **Notificação** em caso de falha

**🔄 Backup Automático:**
```bash
# Adicionar no crontab para backup diário às 2h
crontab -e
0 2 * * * /path/to/obreiro-digital-landing/scripts/backup.sh
```

**📂 Estrutura de Backups:**
```
backups/
├── obreiro_backup_20250816_020000.sql.gz    # Banco de dados
├── media_backup_20250816_020000.tar.gz      # Arquivos de mídia
└── backup_log_20250816_020000.log           # Log da operação
```

---

#### **6. restore.sh** - *Restauração de Backup Segura*
Script para restauração segura de backups.

```bash
./scripts/restore.sh backup_file.sql.gz [media_backup.tar.gz]
```

**🎯 Funcionalidades:**
- ✅ **Backup de segurança** antes do restore
- ✅ **Restore do banco** com validação
- ✅ **Restore de mídia** opcional
- ✅ **Reinicialização automática** da aplicação
- ✅ **Verificação pós-restore** com health checks
- ✅ **Rollback automático** se falhar

**💡 Exemplos de Uso:**
```bash
# Restore apenas do banco
./scripts/restore.sh backups/obreiro_backup_20250816_020000.sql.gz

# Restore completo (banco + mídia)
./scripts/restore.sh backups/obreiro_backup_20250816_020000.sql.gz backups/media_backup_20250816_020000.tar.gz
```

---

### 🔧 **Utilitários**

#### **7. fix-media-permissions.sh** - *Correção de Permissões*
Script para corrigir permissões de arquivos de mídia.

```bash
./scripts/fix-media-permissions.sh
```

**🎯 Funcionalidades:**
- ✅ **Correção de proprietário** para uid 999 (appuser)
- ✅ **Permissões corretas** para leitura/escrita
- ✅ **Validação pós-correção** automática
- ✅ **Log de operações** detalhado

**⚠️ Quando usar:**
- Após upload de QR codes
- Quando há erros de "Permission denied"
- Após restore de backup

---

#### **8. validate-gitignore.sh** - *Validação de Segurança*
Script para validar configurações de segurança do .gitignore.

```bash
./scripts/validate-gitignore.sh
```

**🎯 Funcionalidades:**
- ✅ **Verificação de arquivos sensíveis** não versionados
- ✅ **Validação de .env** files
- ✅ **Checagem de secrets** no código
- ✅ **Relatório de segurança** detalhado
- ✅ **Sugestões de correção** automáticas

---

### 🐍 **Scripts Python**

#### **9. populate_production_test_data.py** - *Dados de Teste para Produção*
Script Python para popular ambiente de produção com dados de teste seguros.

```bash
cd backend && python manage.py shell -c "exec(open('../scripts/populate_production_test_data.py').read())"
```

**🎯 Funcionalidades:**
- ✅ **Criação de denominações** de teste
- ✅ **Usuários de teste** para validação
- ✅ **Dados seguros** sem informações sensíveis
- ✅ **Validação pós-criação** automática

---

## 🏗️ Fluxos de Uso Recomendados

### **🚀 Deploy em Produção**
```bash
# Fluxo completo de deploy
1. ./scripts/backup.sh                    # Backup preventivo
2. ./scripts/deploy-procedure.sh          # Deploy com zero downtime
3. ./scripts/monitoring.sh                # Verificação pós-deploy
```

### **🔄 Atualização de Código**
```bash
# Para atualizações menores
./scripts/safe-pull.sh                    # Pull seguro com validações
```

### **🛠️ Setup de Desenvolvimento**
```bash
# Para novos desenvolvedores
git clone <repo-url>
cd obreiro-digital-landing
./scripts/dev_setup.sh                    # Setup completo
```

### **📊 Manutenção Semanal**
```bash
# Rotina de manutenção
1. ./scripts/monitoring.sh                # Relatório completo
2. ./scripts/backup.sh                    # Backup manual se necessário
3. ./scripts/validate-gitignore.sh        # Verificação de segurança
```

---

## ⚙️ Configurações de Sistema

### **🔧 Crontab Recomendado**

```bash
# Editar crontab
crontab -e

# Adicionar as seguintes linhas:
# Backup diário às 2h
0 2 * * * /path/to/obreiro-digital-landing/scripts/backup.sh

# Monitoramento semanal às 3h de domingo
0 3 * * 0 /path/to/obreiro-digital-landing/scripts/monitoring.sh > /var/log/obreiro/weekly-check.log

# Validação de segurança mensal
0 4 1 * * /path/to/obreiro-digital-landing/scripts/validate-gitignore.sh
```

### **📂 Estrutura de Logs**

```bash
# Criar diretórios de log
sudo mkdir -p /var/log/obreiro
sudo chown $USER:$USER /var/log/obreiro

# Logs principais
/var/log/obreiro/
├── backup.log           # Logs de backup
├── deploy.log           # Logs de deploy
├── monitoring.log       # Logs de monitoramento
├── weekly-check.log     # Relatórios semanais
└── error.log           # Logs de erro
```

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. Script não tem permissão de execução**
```bash
chmod +x scripts/*.sh
```

#### **2. Erro de "Docker não encontrado"**
```bash
# Verificar integração WSL (Windows)
docker --version
docker compose version

# Se não funcionar, verificar Docker Desktop WSL settings
```

#### **3. Backup falha por falta de espaço**
```bash
# Verificar espaço em disco
df -h

# Limpar backups antigos manualmente
find backups/ -name "*.gz" -mtime +7 -delete
```

#### **4. Deploy falha na migração**
```bash
# Verificar logs de migração
docker-compose -f docker-compose.prod.yml logs backend

# Rollback manual se necessário
./scripts/restore.sh <ultimo_backup_bom>
```

---

## 📊 Métricas dos Scripts

| Script | Linhas | Complexidade | Tempo Médio | Status |
|--------|--------|-------------|-------------|---------|
| `deploy-procedure.sh` | 300+ | Alta | ~5 min | ✅ Estável |
| `safe-pull.sh` | 200+ | Média | ~2 min | ✅ Estável |
| `monitoring.sh` | 250+ | Média | ~30s | ✅ Estável |
| `backup.sh` | 100+ | Baixa | ~1 min | ✅ Estável |
| `dev_setup.sh` | 80+ | Baixa | ~3 min | ✅ Estável |

---

## 🔗 Documentação Relacionada

- **[Deploy Orquestrado Completo](../docs/DEPLOY_ORQUESTRADO_COMPLETO.md)** - Guia completo de deploy
- **[Arquitetura Técnica](../docs/ARQUITETURA_TECNICA_COMPLETA.md)** - Visão técnica da infraestrutura
- **[Permissões e Segurança](../docs/PERMISSOES_SEGURANCA_SISTEMA_COMPLETO.md)** - Sistema de segurança

---

## 📞 Suporte

Para problemas com scripts:

1. **Verificar logs** em `/var/log/obreiro/`
2. **Executar em modo debug**: `bash -x script.sh`
3. **Consultar documentação** técnica completa
4. **Reportar issues** no GitHub com logs detalhados

---

**📜 Scripts desenvolvidos para automação enterprise do Obreiro Digital**

*Versão 2.0 - Agosto 2025 - Scripts otimizados e testados em produção*