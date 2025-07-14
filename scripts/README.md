# Scripts de Deploy e Manutenção

Este diretório contém scripts para facilitar o deploy e manutenção do sistema Obreiro Digital em produção.

## Scripts Disponíveis

### 1. deploy-prod.sh
Script principal para deploy em produção.

```bash
./scripts/deploy-prod.sh
```

**Funcionalidades:**
- Valida configurações antes do deploy
- Cria diretórios necessários
- Faz build das imagens Docker
- Executa migrações do banco
- Inicia todos os serviços
- Verifica se tudo está funcionando

**Pré-requisitos:**
- Arquivo `.env_prod` configurado
- Todas as senhas alteradas (não pode conter "CHANGE_THIS")
- Docker e Docker Compose instalados

### 2. backup.sh
Script para fazer backup do banco de dados e arquivos.

```bash
./scripts/backup.sh
```

**Funcionalidades:**
- Backup do banco PostgreSQL
- Backup dos arquivos de media
- Compressão automática
- Limpeza de backups antigos (>7 dias)
- Verificação de integridade

**Cron para backup automático:**
```bash
# Adicionar no crontab (crontab -e)
0 2 * * * /caminho/para/obreiro-digital-landing/scripts/backup.sh
```

### 3. restore.sh
Script para restaurar backup.

```bash
./scripts/restore.sh backup_file.sql.gz [media_backup.tar.gz]
```

**Funcionalidades:**
- Restore do banco de dados
- Restore dos arquivos de media (opcional)
- Backup de segurança antes do restore
- Reinicialização automática da aplicação

**Exemplo:**
```bash
./scripts/restore.sh backups/obreiro_backup_20250114_120000.sql.gz backups/media_backup_20250114_120000.tar.gz
```

### 4. monitoring.sh
Script para monitoramento do sistema.

```bash
./scripts/monitoring.sh
```

**Funcionalidades:**
- Status dos containers
- Health checks
- Logs em tempo real
- Uso de recursos
- Verificação de backups
- Reinicialização de serviços
- Limpeza de logs

**Modo interativo:**
```bash
./scripts/monitoring.sh
```

**Modo direto:**
```bash
./scripts/monitoring.sh 2>&1 | tee monitoring.log
```

## Configuração do Servidor

### 1. Preparação do VPS Ubuntu

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx (para SSL)
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configuração SSL

```bash
# Obter certificado SSL
sudo certbot --nginx -d obreiro.digital -d www.obreiro.digital

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configuração de Firewall

```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 4. Configuração de Backup Automático

```bash
# Adicionar no crontab do usuário
crontab -e

# Adicionar linhas:
0 2 * * * /caminho/para/obreiro-digital-landing/scripts/backup.sh
0 3 * * 0 /caminho/para/obreiro-digital-landing/scripts/monitoring.sh > /var/log/obreiro/weekly-check.log
```

## Monitoramento e Logs

### Localização dos Logs

```bash
# Logs da aplicação
tail -f /var/log/obreiro/django.log

# Logs do Docker
docker-compose -f docker-compose.prod.yml logs -f

# Logs do Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Comandos Úteis

```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Recursos utilizados
docker stats

# Limpar sistema
docker system prune -f

# Reiniciar aplicação
docker-compose -f docker-compose.prod.yml restart

# Parar aplicação
docker-compose -f docker-compose.prod.yml down

# Iniciar aplicação
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Problemas Comuns

1. **Container não inicia:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs nome_do_container
   ```

2. **Erro de permissão:**
   ```bash
   sudo chown -R $USER:$USER /var/log/obreiro
   ```

3. **Erro de SSL:**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Banco não conecta:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   ```

### Contatos de Suporte

Para suporte técnico, consulte a documentação completa em:
`backend/docs/Deploy e Containerização - Guia Completo.md`