# Documentação Técnica - Módulo de Visitantes

**Projeto:** Obreiro Digital  
**Data:** 6 de outubro de 2025  
**Versão:** 2.0  
**Autores:** Análise gerada por IA com revisão técnica

**Changelog v2.0:**
- Atualizado sistema de permissões para refletir novo modelo hierárquico
- CHURCH_ADMIN substitui DENOMINATION_ADMIN como papel principal
- Adicionado controle de acesso hierárquico aos QR Codes
- Documentado filtro automático de branches baseado em papéis
- QR Codes agora acessados via menu Visitantes

## 1. Arquitetura e Fluxo de Dados

O Módulo de Visitantes foi projetado para capturar informações de novos frequentadores de forma eficiente e segura, utilizando um sistema de QR Codes por filial (Branch), e para fornecer ferramentas administrativas para a gestão desses contatos.

### 1.1. Arquitetura Geral

- **Backend (Django REST Framework):** Fornece uma API RESTful para todas as operações. A lógica é encapsulada no app `visitors`, com forte acoplamento ao app `branches` para a funcionalidade de QR Code e ao app `churches` para o multi-tenant.
- **Frontend (React + TypeScript):** Consome a API do backend. Possui componentes para a página de registro pública (acessada via QR Code) e para a área administrativa (gestão de QR Codes e de visitantes).
- **Banco de Dados (PostgreSQL):** Armazena os dados dos visitantes, filiais e suas relações.
- **Multi-tenant:** O sistema é multi-tenant a nível de `Church` (Igreja). Todos os dados de visitantes e filiais são isolados por igreja, garantindo que uma igreja não tenha acesso aos dados de outra.

### 1.2. Fluxo de Dados Principal

#### a) Fluxo de Registro Público (QR Code)

1. **Geração do QR Code:** Um administrador acessa a página `GerenciarQRCodes.tsx`. O backend, no modelo `branches.Branch`, possui um campo `qr_code_uuid` e um método `generate_qr_code()` que cria uma imagem de QR Code apontando para a URL do frontend: `https://<FRONTEND_URL>/visit/{qr_code_uuid}`.
2. **Escaneamento:** O visitante escaneia o QR Code com seu celular.
3. **Validação:** O navegador abre a página `RegistroVisitante.tsx`. O componente extrai o `uuid` da URL e chama o serviço `validateQRCode`, que consulta o endpoint público da API `GET /api/v1/visitors/public/qr/{uuid}/validate/`. O backend verifica se o UUID corresponde a uma filial ativa que permite registros.
4. **Preenchimento do Formulário:** Se o QR Code for válido, a página exibe o formulário de registro com informações da filial. O formulário utiliza `react-hook-form` e `zod` para validação em tempo real.
5. **Submissão:** O visitante preenche e envia o formulário. O serviço `registerVisitorPublic` é chamado, enviando os dados para o endpoint `POST /api/v1/visitors/public/qr/{uuid}/register/`.
6. **Processamento no Backend:** A view `register_visitor` valida os dados com o `VisitorPublicRegistrationSerializer`, cria uma nova instância do modelo `Visitor`, associa-a à `Branch` e `Church` corretas (identificadas pelo UUID), e salva no banco de dados.
7. **Sucesso:** A API retorna uma resposta de sucesso. O frontend redireciona o usuário para a página `RegistroSucesso.tsx`, exibindo uma mensagem de confirmação.

#### b) Fluxo de Gestão Administrativa

1. **Login:** Um usuário com permissão acessa o sistema.
2. **Acesso à Página de Visitantes:** O usuário navega para a página `Visitantes.tsx`.
3. **Carregamento de Dados:** O hook `useVisitors` é ativado, chamando o serviço `getVisitors`. Este serviço faz uma requisição `GET` ao endpoint `GET /api/v1/visitors/admin/visitors/`.
4. **Filtragem no Backend:** O `VisitorViewSet` no backend recebe a requisição. Seu método `get_queryset` filtra automaticamente os visitantes para pertencerem apenas à igreja do usuário logado.
5. **Exibição:** Os dados são retornados ao frontend e exibidos na tabela `VisitorsTable`. O administrador pode filtrar, ordenar, editar e excluir visitantes.

---

## 2. Modelos de Banco de Dados (Backend)

A lógica de dados está centrada em dois modelos principais: `Visitor` e `Branch`.

### 2.1. `apps.visitors.models.Visitor`

Este modelo armazena todas as informações sobre um visitante.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `church` | `ForeignKey` | **(Multi-tenant)** Link para a `churches.Church` à qual o visitante pertence. |
| `branch` | `ForeignKey` | Link para a `branches.Branch` onde o registro foi feito. |
| `converted_member` | `OneToOneField` | Link para o `members.Member` se o visitante for convertido. |
| `full_name`, `email`, `phone`, `birth_date`, `gender`, `cpf` | `CharField`, `EmailField`, etc. | Dados pessoais do visitante. |
| `city`, `state`, `address`, etc. | `CharField` | Dados de endereço. |
| `marital_status`, `ministry_interest`, `first_visit` | `CharField`, `TextField`, `BooleanField` | Informações eclesiásticas e de interesse. |
| `wants_prayer`, `wants_growth_group` | `BooleanField` | Intenções do visitante. |
| `qr_code_used` | `UUIDField` | Armazena o UUID do QR Code que originou o cadastro. |
| `registration_source` | `CharField` | Fonte do cadastro (`qr_code`, `admin_manual`). |
| `converted_to_member` | `BooleanField` | Flag que indica se o visitante foi convertido em membro. |
| `follow_up_status` | `CharField` | Status do acompanhamento (Pendente, Contatado, etc.). |

**Métodos Notáveis:**
- `age()`: Propriedade que calcula a idade do visitante.
- `convert_to_member()`: Lógica de negócio para converter um `Visitor` em um `members.Member`, transferindo os dados e atualizando o status.

### 2.2. `apps.branches.models.Branch`

Este modelo representa uma filial da igreja e contém a lógica do QR Code.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `church` | `ForeignKey` | **(Multi-tenant)** Link para a `churches.Church`. |
| `name`, `address`, `pastor`, etc. | `CharField`, `TextField`, `ForeignKey` | Dados da filial. |
| `qr_code_uuid` | `UUIDField` | **(Core)** Identificador único e secreto para a URL do QR Code. |
| `qr_code_image` | `ImageField` | Armazena a imagem PNG do QR Code gerada. |
| `qr_code_active` | `BooleanField` | Permite ativar ou desativar o QR Code sem precisar gerar um novo. |
| `allows_visitor_registration` | `BooleanField` | Controle de negócio para permitir ou bloquear novos registros. |
| `total_visitors_registered` | `PositiveIntegerField` | Contador de quantos registros foram feitos por este QR Code. |

**Métodos Notáveis:**
- `save()`: Sobrescrito para chamar `generate_qr_code()` na criação de uma nova filial.
- `generate_qr_code()`: Cria a URL do formulário público, gera a imagem do QR Code usando a biblioteca `qrcode`, e a salva no campo `qr_code_image`.
- `regenerate_qr_code()`: Gera um novo `qr_code_uuid` e uma nova imagem, invalidando o QR Code anterior. Essencial para segurança.
- `visitor_registration_url`: Propriedade que constrói a URL completa para o formulário público.

---

## 3. Endpoints da API (Backend)

A API é versionada e acessível sob o prefixo `/api/v1/visitors/`.

### 3.1. Endpoints Públicos

Não requerem autenticação.

- **`GET /public/qr/<uuid:qr_code_uuid>/validate/`**
  - **View:** `validate_qr_code`
  - **Permissão:** `AllowAny`
  - **Descrição:** Valida se um UUID de QR Code é válido, ativo e pertence a uma filial que permite registros. Retorna dados básicos da filial para o frontend.

- **`POST /public/qr/<uuid:qr_code_uuid>/register/`**
  - **View:** `register_visitor`
  - **Permissão:** `AllowAny`
  - **Serializer:** `VisitorPublicRegistrationSerializer`
  - **Descrição:** Recebe os dados do formulário público, valida-os e cria um novo registro de `Visitor`.

### 3.2. Endpoints Administrativos

Requerem autenticação e permissões adequadas. A maioria é gerenciada pelo `VisitorViewSet`.

- **`GET /admin/visitors/`**
  - **Descrição:** Lista todos os visitantes da igreja do usuário, com suporte a filtros, busca e ordenação.
  - **Serializer:** `VisitorListSerializer` (otimizado para listagem).

- **`POST /admin/visitors/`**
  - **Descrição:** Cria um novo visitante manualmente pelo painel administrativo.
  - **Serializer:** `VisitorSerializer`.

- **`GET /admin/visitors/{id}/`**
  - **Descrição:** Retorna os detalhes completos de um visitante específico.
  - **Serializer:** `VisitorSerializer`.

- **`PATCH /admin/visitors/{id}/`**
  - **Descrição:** Atualiza parcialmente os dados de um visitante.
  - **Serializer:** `VisitorSerializer`.

- **`DELETE /admin/visitors/{id}/`**
  - **Descrição:** Remove um visitante do sistema.

### 3.3. Ações Customizadas (Custom Actions)

- **`GET /admin/visitors/stats/`**
  - **Descrição:** Retorna estatísticas agregadas sobre os visitantes (total, últimos 30 dias, taxa de conversão, etc.).

- **`GET /admin/visitors/by_branch/`**
  - **Descrição:** Retorna estatísticas de visitantes agrupadas por filial.

- **`PATCH /admin/visitors/{id}/convert_to_member/`**
  - **Descrição:** Aciona o processo de conversão de um visitante para membro.
  - **Serializer:** `VisitorConversionSerializer`.

- **`POST /admin/visitors/bulk_action/`**
  - **Descrição:** Permite realizar ações em massa, como atualizar o status de follow-up de múltiplos visitantes de uma vez.
  - **Serializer:** `VisitorBulkActionSerializer`.

---

## 4. Componentes do Frontend

### 4.1. Páginas (Pages)

- **`pages/RegistroVisitante.tsx`**
  - **Função:** Formulário público para registro de visitantes.
  - **Lógica:**
    - Extrai o `uuid` da URL.
    - Valida o `uuid` com o serviço `validateQRCode`.
    - Renderiza um formulário controlado por `react-hook-form` com validação `zod`.
    - Implementa busca de endereço por CEP via API `viacep.com.br`.
    - Submete os dados usando `registerVisitorPublic`.

- **`pages/RegistroSucesso.tsx`**
  - **Função:** Página de confirmação exibida após um registro bem-sucedido.
  - **Lógica:** Apenas exibe informações de sucesso e próximos passos.

- **`pages/GerenciarQRCodes.tsx`**
  - **Função:** Painel para administradores gerenciarem os QR Codes de suas filiais.
  - **Lógica:**
    - Usa `branchService` para buscar os dados dos QR Codes.
    - Permite ao admin:
      - Ativar/desativar um QR Code (`toggleQRCode`).
      - Baixar a imagem do QR Code.
      - Copiar a URL de registro.
      - Regenerar um QR Code, invalidando o antigo (`regenerateQRCode`).

- **`pages/Visitantes.tsx`**
  - **Função:** Dashboard principal para a gestão de visitantes.
  - **Lógica:**
    - Usa o hook customizado `useVisitors` para gerenciar estado, filtros e chamadas de API.
    - Exibe KPIs (Key Performance Indicators) através do componente `StatsCard`.
    - Contém o componente `VisitorsFilters` para busca e filtragem.
    - Usa `VisitorsTable` (construído com `tanstack/react-table`) para exibir os dados de forma interativa.
    - Permite criar, editar e deletar visitantes.

### 4.2. Serviços (Services)

- **`services/visitorsService.ts`**
  - **Função:** Camada de abstração para todas as chamadas de API relacionadas a visitantes.
  - **Métodos Principais:** `validateQRCode`, `registerVisitorPublic`, `getVisitors`, `updateVisitor`, `convertVisitorToMember`.
  - **Responsabilidade:** Isolar a lógica de comunicação com a API dos componentes visuais.

- **`services/branchService.ts`**
  - **Função:** Similar ao `visitorsService`, mas para os endpoints de filiais e QR Codes.
  - **Métodos Principais:** `getBranchesQRCodes`, `toggleQRCode`, `regenerateQRCode`.

---

## 5. Sistema de Permissões

O sistema de permissões segue a arquitetura definida no documento **Sistema de Permissões e Papéis - Guia Completo**.

### 5.1. Hierarquia de Papéis

- **SUPER_ADMIN (Platform Admin):** Administrador da plataforma SaaS - acesso técnico total. Exclusivo para desenvolvedores/donos.
- **CHURCH_ADMIN:** Administrador de igreja(s) - papel principal do sistema. Pode gerenciar uma ou múltiplas igrejas (se fizerem parte de uma denominação). Este papel **substitui** o antigo `DENOMINATION_ADMIN`.
- **BRANCH_MANAGER:** Gestor de filiais específicas atribuídas.
- **PASTOR, SECRETARY, LEADER:** Papéis com permissões específicas dentro da igreja.
- **MEMBER:** Membro comum com acesso de visualização.
- **VISITOR:** Acesso muito limitado, apenas dados próprios.

### 5.2. Controle de Acesso

- **Endpoints Públicos:** Acesso liberado via `permission_classes = [AllowAny]` nas views `validate_qr_code` e `register_visitor`.
- **Endpoints Administrativos:** O `VisitorViewSet` utiliza `permission_classes = [permissions.IsAuthenticated, IsMemberUser]`.
  - `IsAuthenticated`: Garante que o usuário esteja logado.
  - `IsMemberUser`: Uma permissão customizada (`apps.core.permissions`) que verifica se o usuário está associado a pelo menos uma igreja.
- **Isolamento de Dados (Multi-tenant):** A filtragem de dados por igreja não é feita na classe de permissão, mas sim no método `get_queryset` dos ViewSets. Ele inspeciona o `request.user` e filtra o queryset para retornar apenas dados da(s) igreja(s) do usuário. Isso garante o isolamento dos dados de forma robusta.
  - **CHURCH_ADMIN:** Acessa todas as filiais e visitantes de igrejas em sua denominação (ou apenas sua igreja se não houver denominação).
  - **BRANCH_MANAGER:** Acessa apenas filiais e visitantes das filiais atribuídas a ele.
  - **Outros papéis:** Acessam apenas dados de sua igreja.
- **Permissões de Ação:** Ações como criar ou deletar um visitante são controladas no frontend pelo hook `usePermissions`, que verifica se o usuário tem o papel (`role`) ou a flag de permissão (`canManageVisitors`) necessários.

### 5.3. Acesso aos QR Codes

O acesso aos QR Codes é filtrado hierarquicamente no backend:

```python
# Em BranchViewSet.get_queryset()
if church_user.role == RoleChoices.CHURCH_ADMIN:
    # Vê todas as filiais da denominação
    if church_user.church.denomination:
        denomination_churches = Church.objects.filter(
            denomination=church_user.church.denomination
        )
        # Retorna branches de todas essas igrejas
    else:
        # Retorna apenas branches de sua igreja
        
elif church_user.role == 'branch_manager':
    # Vê apenas branches atribuídas através de church_user.branches
    
else:
    # Outros papéis veem apenas branches de sua igreja
```

**Navegação no Frontend:**
- QR Codes são acessados através do menu **Visitantes → Gerenciar QR Codes**
- A visualização é automaticamente filtrada pelo backend baseada no papel do usuário
- Usuários com `canManageVisitors` podem ativar/desativar e baixar QR Codes

---

## 6. Fluxo de QR Codes (Detalhado)

1. **Criação da Filial:** Quando uma `Branch` é criada, o `qr_code_uuid` é gerado automaticamente (`default=uuid.uuid4`).
2. **Geração da Imagem:** O método `save()` da `Branch` chama `generate_qr_code()`. Este método:
   a. Constrói a URL: `f"{settings.FRONTEND_URL}/visit/{self.qr_code_uuid}"`.
   b. Usa a biblioteca `qrcode` para gerar uma imagem PNG a partir dessa URL.
   c. Salva a imagem no `ImageField` `qr_code_image`.
3. **Exibição no Admin:** A página `GerenciarQRCodes.tsx` busca os dados da filial, incluindo a URL da imagem do QR Code (`qr_code_url`) e a URL de destino (`visitor_registration_url`).
4. **Escaneamento e Redirecionamento:** O usuário escaneia a imagem. O app de câmera lê a URL e abre o navegador, que navega para a página `RegistroVisitante.tsx` com o `uuid` na URL.
5. **Regeneração:** Se um administrador clica em "Regenerar", o método `regenerate_qr_code()` no backend é chamado. Ele gera um **novo** `qr_code_uuid`, apaga a imagem antiga e cria uma nova. O QR Code antigo se torna instantaneamente inválido.

---

## 7. Guias de Manutenção e Troubleshooting

### 7.1. Problemas Comuns

**Problema: QR Code aparece como "inválido".**
- **Causas:**
  1. A filial foi desativada (`is_active=False`).
  2. O QR Code específico foi desativado (`qr_code_active=False`).
  3. A filial foi configurada para não permitir registros (`allows_visitor_registration=False`).
  4. A variável de ambiente `FRONTEND_URL` no backend está configurada incorretamente.
- **Solução:** Verifique essas configurações no painel de administração do Django para a `Branch` em questão.

**Problema: Formulário de registro dá erro ao enviar.**
- **Causas:**
  1. Erro de validação do `zod` no frontend (campos obrigatórios faltando, formato incorreto).
  2. Erro de validação do `Serializer` no backend.
  3. Erro de rede ou API offline.
- **Solução:**
  1. Abra o console do desenvolvedor no navegador (`F12`) e verifique a aba "Console" por erros de validação.
  2. Verifique a aba "Network" para ver a resposta da API. Se houver um erro 400, o corpo da resposta conterá os detalhes do erro de validação do backend.
  3. Verifique os logs do servidor Django para exceções não tratadas.

**Problema: Visitante recém-cadastrado não aparece na lista de administração.**
- **Causas:**
  1. O cache do navegador ou do estado do React está desatualizado.
  2. Um filtro está ativo na página `Visitantes.tsx`, ocultando o novo registro.
  3. O registro falhou silenciosamente (verificar logs da API).
- **Solução:**
  1. Atualize a página (`Ctrl+F5`).
  2. Limpe todos os filtros na interface de administração.
  3. Verifique os logs do servidor para confirmar se o registro foi salvo com sucesso.

### 7.2. Logs e Monitoramento

- **Logs do Django:** Configurados em `config/settings/base.py`. Verifique o arquivo de log configurado ou console do servidor.
- **Logs do Frontend:** Console do navegador (`F12` → Console). Erros de validação e network requests são logados aqui.
- **Monitoramento de QR Codes:** Use o endpoint `/api/v1/branches/qr_codes/` para verificar o status dos QR Codes programaticamente.

---

## 8. Exemplos de Uso

### 8.1. Exemplo de chamada API (cURL)

```bash
# Validar QR Code
curl -X GET https://api.obreirodigital.com/api/v1/visitors/public/qr/123e4567-e89b-12d3-a456-426614174000/validate/

# Registrar visitante
curl -X POST https://api.obreirodigital.com/api/v1/visitors/public/qr/123e4567-e89b-12d3-a456-426614174000/register/ \
-H "Content-Type: application/json" \
-d '{
    "full_name": "José da Silva",
    "email": "jose.silva@example.com",
    "city": "São Paulo",
    "state": "SP",
    "first_visit": true,
    "wants_prayer": true,
    "marital_status": "married"
}'
```

### 8.2. Exemplo de uso do serviço no Frontend

```typescript
import { registerVisitorPublic, VisitorPublicRegistration } from '@/services/visitorsService';

async function handleRegistration(uuid: string) {
  const visitorData: VisitorPublicRegistration = {
    full_name: "Maria Oliveira",
    email: "maria.o@example.com",
    city: "Rio de Janeiro",
    state: "RJ",
    first_visit: true,
    wants_prayer: false,
    wants_growth_group: true,
    marital_status: 'single'
  };

  try {
    const response = await registerVisitorPublic(uuid, visitorData);
    if (response.success) {
      console.log('Registro bem-sucedido!', response.visitor);
      // Redirecionar para a página de sucesso
    } else {
      console.error('Falha no registro:', response.details);
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
  }
}
```

### 8.3. Exemplo de regeneração de QR Code

```typescript
import { branchService } from '@/services/branchService';

async function regenerateQRCode(branchId: number) {
  try {
    const result = await branchService.regenerateQRCode(branchId);
    console.log('QR Code regenerado:', result.data.qr_code_uuid);
    // Atualizar interface
  } catch (error) {
    console.error('Erro ao regenerar:', error);
  }
}
```

---

## 9. Considerações de Segurança

### 9.1. Medidas Implementadas

- **Validação de Entrada:** A validação é feita em múltiplas camadas: `zod` no frontend, e `Serializers` no Django REST Framework no backend. Isso previne ataques de injeção de dados.
- **Proteção de Endpoints:** Endpoints administrativos são protegidos por autenticação e verificação de permissão. Endpoints públicos são limitados e não expõem dados sensíveis.
- **Segurança de QR Code:** O uso de UUIDs torna as URLs de registro não adivinháveis. A funcionalidade de "Regenerar QR Code" é um mecanismo de segurança crucial para invalidar uma URL que possa ter sido exposta ou alvo de abuso.
- **CSRF e XSS:** O Django oferece proteção nativa contra ataques de Cross-Site Request Forgery (CSRF). O React, por sua natureza, ajuda a mitigar ataques de Cross-Site Scripting (XSS) ao renderizar texto por padrão em vez de HTML bruto.
- **Multi-tenant Isolation:** Filtros automáticos no `get_queryset` garantem isolamento completo de dados entre igrejas.

### 9.2. Melhorias Recomendadas

- **Rate Limiting:** Implementar limitação de taxa de requisições no endpoint de registro público para mitigar spam e ataques DoS.
- **CAPTCHA:** Adicionar Google reCAPTCHA no formulário público para prevenir registros automatizados.
- **Logs de Auditoria:** Implementar logging detalhado de todas as operações de visitantes para auditoria de segurança.
- **Validação de E-mail:** Implementar verificação de e-mail para visitantes registrados.

---

## 10. Deploy e Configuração

### 10.1. Variáveis de Ambiente Críticas

```env
# Django Core
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# CORS (Frontend-Backend Communication)
CORS_ALLOWED_ORIGINS=https://app.obreirodigital.com
CORS_ALLOW_ALL_ORIGINS=False

# QR Code - CRÍTICO para funcionamento
FRONTEND_URL=https://app.obreirodigital.com

# Media Files
MEDIA_URL=/media/
MEDIA_ROOT=/app/media

# Email (para notificações)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@obreirodigital.com
EMAIL_HOST_PASSWORD=sua-senha-aqui
```

### 10.2. Comandos de Deploy

```bash
# Build e deploy com Docker
docker-compose -f docker-compose.prod.yml up -d

# Aplicar migrações
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Coletar arquivos estáticos
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Criar superuser (se necessário)
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 10.3. Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `FRONTEND_URL` aponta para o domínio correto
- [ ] `DEBUG=False` em produção
- [ ] `CORS_ALLOWED_ORIGINS` contém apenas domínios autorizados
- [ ] Certificado SSL configurado (HTTPS)
- [ ] Backup do banco de dados configurado
- [ ] Monitoramento de logs ativo
- [ ] Teste de QR Code funcionando end-to-end

---

## 11. Testes

### 11.1. Testes Automatizados

```bash
# Executar testes do backend
docker-compose -f docker-compose.dev.yml exec backend python manage.py test apps.visitors

# Executar testes específicos
docker-compose -f docker-compose.dev.yml exec backend python manage.py test apps.visitors.tests.test_qr_code_flow

# Executar testes com cobertura
docker-compose -f docker-compose.dev.yml exec backend coverage run --source='.' manage.py test apps.visitors
docker-compose -f docker-compose.dev.yml exec backend coverage report
```

### 11.2. Testes Manuais

**Fluxo Completo de QR Code:**
1. Acesse `/configuracoes/qr-codes`
2. Verifique se QR Codes estão listados
3. Teste ativar/desativar QR Code
4. Baixe a imagem do QR Code
5. Escaneie com celular
6. Preencha formulário completo
7. Verifique página de sucesso
8. Confirme visitante na lista administrativa

**Testes de Segurança:**
1. Tente acessar QR Code inativo
2. Tente acessar dados de outra igreja
3. Teste validação de formulários
4. Verifique isolamento de dados

---

## 12. Roadmap e Melhorias Futuras

### 12.1. Funcionalidades Planejadas

- **Notificações por E-mail:** Enviar e-mail de boas-vindas para visitantes
- **SMS/WhatsApp:** Integração para notificações móveis
- **Analytics Avançados:** Dashboard com métricas detalhadas
- **QR Code Dinâmico:** QR Codes que mudam baseado em eventos/horários
- **Integração CRM:** Conexão com sistemas externos de relacionamento

### 12.2. Otimizações Técnicas

- **Cache Redis:** Implementar cache para consultas frequentes
- **CDN:** Otimizar entrega de imagens de QR Code
- **API Versioning:** Preparar para versionamento da API
- **Testes E2E:** Implementar testes end-to-end com Playwright/Cypress

---

## Conclusão

O Módulo de Visitantes é uma peça fundamental do sistema Obreiro Digital, proporcionando uma experiência moderna e eficiente para captura e gestão de informações de novos frequentadores.

Esta documentação deve ser atualizada sempre que houver mudanças significativas no módulo. Para dúvidas específicas ou problemas não cobertos aqui, consulte os logs do sistema ou entre em contato com a equipe de desenvolvimento.

**Última atualização:** 6 de outubro de 2025  
**Próxima revisão recomendada:** 6 de janeiro de 2026
