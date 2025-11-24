# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD do projeto Obreiro Virtual.

## 📋 Workflows Disponíveis

### 1. CI - Testes Mínimos (`ci-tests.yml`)
- **Trigger:** Push/PR em `develop` ou `main`
- **Duração:** ~3-5 minutos
- **Objetivo:** Validar código antes do merge

### 2. Deploy HML (`deploy-hml.yml`)
- **Trigger:** Push em `develop` (ou manual)
- **Duração:** ~5-10 minutos
- **Objetivo:** Deploy automático para https://hml.obreirovirtual.com

## 🚀 Início Rápido

1. Configure os secrets necessários (ver `docs/GITHUB_ACTIONS_SETUP.md`)
2. Faça push para `develop`
3. Acompanhe em: https://github.com/seu-usuario/seu-repo/actions

## 📚 Documentação Completa

Ver: [`docs/GITHUB_ACTIONS_SETUP.md`](../../docs/GITHUB_ACTIONS_SETUP.md)

## 🔐 Secrets Necessários

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `HML_VPS_HOST` | IP da VPS de HML | `123.456.789.012` |
| `HML_VPS_USER` | Usuário SSH | `root` |
| `HML_VPS_SSH_KEY` | Chave privada SSH | `-----BEGIN OPENSSH...` |

## ⚡ Execução Manual

1. Vá em **Actions**
2. Selecione **Deploy para Homologação**
3. Clique em **Run workflow**
4. Escolha a branch `develop`
5. Clique em **Run workflow**
