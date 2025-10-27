# 🏛️ Obreiro Virtual — Sistema de Gestão Eclesiástica

Plataforma SaaS para gestão de denominações, igrejas (matriz) e filiais (branches), com módulos de membros e visitantes, QR Code para cadastro e sistema de permissões hierárquico. Backend em Django + DRF e frontend em React + TypeScript.

## 🚀 Início Rápido (Dev)

### Pré‑requisitos
- Docker e Docker Compose
- Git

### 1) Configurar ambiente
```bash
git clone https://github.com/melojrx/obreiro-digital-landing.git
cd obreiro-digital-landing

# Variáveis de ambiente (dev)
cp .env_dev.example .env_dev

# Opcional: dê permissão aos scripts
chmod +x scripts/*.sh
```

### 2) Subir os serviços
```bash
# Método recomendado (orquestrado)
docker compose -f docker-compose.dev.yml up -d --build

# Alternativa guiada
./scripts/dev_setup.sh
```

### 3) Aplicar migrações e criar usuário
```bash
# Aplicar migrações
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Criar superusuário (admin Django)
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

### 4) Acessos úteis
- Frontend: http://localhost:5173
- API (DRF): http://localhost:8000/api/v1/
- Admin Django: http://localhost:8000/admin/
- Schema Swagger: http://localhost:8000/api/v1/schema/swagger-ui/

## 🔐 Papéis e Permissões (válidos hoje)

- DENOMINATION_ADMIN (nível 3) — administra todas as igrejas do tenant (denominação).
- CHURCH_ADMIN (nível 2) — administra uma igreja (matriz) e todas as suas filiais.
- SECRETARY (nível 1) — CRUD de Membros e Visitantes apenas nas filiais atribuídas.

Notas importantes:
- Usuário que assina/cria a conta via plataforma recebe automaticamente o papel `DENOMINATION_ADMIN` do seu tenant.
- Não existem mais papéis “Pastor”, “Somente leitura”, “Líder”, etc. Mantenha a UI sincronizada com esses três papéis.

Documentação detalhada: `docs/Sistema_de_Permissoes.md`

## 🧭 Fluxos principais (MVP)

- Filiais: criação, edição, detalhes, ativar/desativar/regenerar QR Code e listagem em tabela unificada.
- Visitantes: cadastro público por QR, gestão administrativa e estatísticas por filial.
- Membros: CRUD completo, transferência assistida entre filiais dentro da mesma igreja, criação de acesso ao sistema a partir do cadastro.
- Perfil: atualização de dados pessoais e dados de igreja (endpoints expostos e integrados ao frontend).

Docs dos planos e decisões:
- `docs/plano-reestruturacao-modelos.md`
- `docs/plano-crud-filiais.md`
- `docs/plano-permissoes.md`
- `docs/roteiro_refatoracao.md`
- `docs/modelodedadosobreiro.png`

## 🛠️ Comandos úteis (Docker Compose)

```bash
# Subir/derrubar serviços
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml down

# Logs
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend

# Migrações / shell
docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
docker compose -f docker-compose.dev.yml exec backend python manage.py shell

# Testes (se configurados)
docker compose -f docker-compose.dev.yml exec backend python manage.py test

# Reiniciar um serviço específico
docker compose -f docker-compose.dev.yml restart frontend
docker compose -f docker-compose.dev.yml restart backend
```

## 💡 Troubleshooting (dev)

- Erro CORS/Network no login (vite → backend):
  - Verifique `FRONTEND_URL=http://localhost:5173` e `CORS_ALLOW_ALL_ORIGINS=True` no `.env_dev` do backend.
  - Reinicie o backend: `docker compose -f docker-compose.dev.yml restart backend`.

- Endpoint 404 (ex.: `/users/update_personal_data/`):
  - Rode migrações e reinicie o backend.
  - Confirme a URL base usada pelo frontend (`/api/v1/`).

- Frontend não reflete alterações:
  - `docker compose -f docker-compose.dev.yml restart frontend` e limpe o cache do navegador.

- Membro criado sem branch na lista:
  - Garanta que a igreja ativa tem ao menos uma branch (matriz). O backend já tenta associar automaticamente à branch ativa/primeira.

- Login redireciona para cadastro após “criar acesso ao sistema”:
  - Certifique-se de que o vínculo `ChurchUser` foi criado e está ativo para a igreja; faça logout/login novamente.

## 📚 Documentação

- Sistema de Permissões: `docs/Sistema_de_Permissoes.md`
- Plano de reestruturação de modelos: `docs/plano-reestruturacao-modelos.md`
- Plano CRUD de Filiais: `docs/plano-crud-filiais.md`
- Plano de permissões (passo a passo): `docs/plano-permissoes.md`
- Roteiro de refatoração: `docs/roteiro_refatoracao.md`
- Modelo de dados: `docs/modelodedadosobreiro.png`

## 📦 Desenvolvimento local (opcional, sem Docker)

Requer Python 3.11+ e Node 18+ configurados na máquina. Útil apenas para debugging rápido.

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## 🤝 Contribuição

- Trabalhamos via PR em branches de feature/fix. Abra PRs descritivos com contexto, mudanças, impacto e rollback.
- Siga os documentos na pasta `docs/` como fonte da verdade das decisões de arquitetura e permissões.

## 📞 Suporte

- Issues: https://github.com/melojrx/obreiro-digital-landing/issues
- Documentação: pasta `docs/`

---

Este README reflete o estado atual do MVP após a remodelagem de modelos (Denomination/Church/Branch), ajustes de permissões (DENOMINATION_ADMIN, CHURCH_ADMIN, SECRETARY), CRUD completo de filiais no frontend e fluxos de Membros/Visitantes integrados.

