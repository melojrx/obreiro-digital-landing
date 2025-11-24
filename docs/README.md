# 📚 Documentação - Obreiro Virtual

Índice completo da documentação do projeto.

## 🚀 Deploy e CI/CD

### [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
**Configuração completa do GitHub Actions**
- Como configurar secrets
- Gerar chaves SSH
- Configurar environments
- Troubleshooting de workflows

### [COMANDOS_UTEIS_DEPLOY.md](./COMANDOS_UTEIS_DEPLOY.md)
**Guia de comandos para gerenciar HML**
- Comandos Docker
- Gerenciamento NGINX
- Visualização de logs
- Deploy manual
- Troubleshooting comum

### [TESTES_PRE_COMMIT.md](./TESTES_PRE_COMMIT.md)
**Checklist antes de fazer push**
- Validação local de código
- Testes automatizados
- Boas práticas de commit
- Scripts de validação

## 🔧 Configuração de Ambientes

### [ANALISE_E_PLANO_CORRECAO.md](../ANALISE_E_PLANO_CORRECAO.md)
**Análise e plano de correção do ambiente HML**
- Arquitetura correta
- Problemas identificados
- Procedimentos de correção
- Workflow de automação

### [PLANO_DASHBOARD_SUPER_ADMIN.md](./PLANO_DASHBOARD_SUPER_ADMIN.md)
**Planejamento do dashboard super admin**
- Funcionalidades
- Arquitetura
- Implementação

## 📖 Como Usar Esta Documentação

### Para Desenvolvedores:

1. **Antes de fazer commit:**
   - Leia: [TESTES_PRE_COMMIT.md](./TESTES_PRE_COMMIT.md)
   - Execute os testes locais
   - Siga as boas práticas

2. **Ao configurar CI/CD:**
   - Leia: [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
   - Configure os secrets
   - Teste o workflow manualmente

3. **Para gerenciar HML:**
   - Leia: [COMANDOS_UTEIS_DEPLOY.md](./COMANDOS_UTEIS_DEPLOY.md)
   - Use os comandos prontos
   - Consulte o troubleshooting

### Para DevOps:

1. **Configuração inicial:**
   - [ANALISE_E_PLANO_CORRECAO.md](../ANALISE_E_PLANO_CORRECAO.md) - Entender arquitetura
   - [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - Configurar automação

2. **Manutenção:**
   - [COMANDOS_UTEIS_DEPLOY.md](./COMANDOS_UTEIS_DEPLOY.md) - Comandos diários
   - Workflows em `.github/workflows/`

## 🔗 Links Rápidos

### Ambientes

- **HML:** https://hml.obreirovirtual.com
- **GitHub Actions:** [Ver workflows](https://github.com/seu-usuario/seu-repo/actions)

### Workflows

- **CI Tests:** `.github/workflows/ci-tests.yml`
- **Deploy HML:** `.github/workflows/deploy-hml.yml`
- **Notificações (exemplo):** `.github/workflows/notifications-example.yml.disabled`

### Comandos Úteis

```bash
# Ver status HML
cd /root/obreiro-hml && docker-compose -f docker-compose.hml.yml ps

# Logs backend
docker-compose -f docker-compose.hml.yml logs -f backend_hml

# Health check
curl https://hml.obreirovirtual.com/api/v1/

# Deploy manual
cd /root/obreiro-hml && git pull origin develop
```

## 🆘 Precisa de Ajuda?

1. **Consulte o documento relevante** acima
2. **Veja a seção de Troubleshooting** em cada documento
3. **Verifique os logs** do GitHub Actions ou da VPS
4. **Execute o health check** do ambiente

## 📝 Contribuindo

Ao adicionar nova documentação:

1. Crie o arquivo markdown na pasta `docs/`
2. Adicione uma entrada neste README.md
3. Use formatação consistente
4. Inclua exemplos práticos
5. Adicione seção de troubleshooting

## 🔄 Atualizações

Este índice é atualizado sempre que nova documentação é adicionada.

**Última atualização:** 2025-11-24

---

**Projeto:** Obreiro Virtual
**Versão:** 1.0.0
