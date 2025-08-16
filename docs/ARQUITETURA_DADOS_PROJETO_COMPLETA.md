# Arquitetura de Dados Completa - Obreiro Virtual

## Documentação Técnica da Plataforma SaaS Multi-tenant para Gestão Eclesiástica

---

## Índice

1. [Setup e Bootstrap do Projeto Django](#1-setup-e-bootstrap-do-projeto-django)
2. [Modelo Conceitual](#2-modelo-conceitual)
3. [Modelo Lógico](#3-modelo-lógico)
4. [Modelo Físico (DDL PostgreSQL)](#4-modelo-físico-ddl-postgresql)
5. [Implementação dos Models Django](#5-implementação-dos-models-django)
6. [Configurações e Estrutura do Projeto](#6-configurações-e-estrutura-do-projeto)

---

## 1. Setup e Bootstrap do Projeto Django

### 1.1 Criação do Projeto e Apps

```bash
# Dentro do venv
django-admin startproject config .

# Apps de domínio
python manage.py startapp core          # utilidades comuns
python manage.py startapp accounts      # auth + ChurchUser
python manage.py startapp denominations
python manage.py startapp churches
python manage.py startapp branches
python manage.py startapp members
python manage.py startapp visitors
python manage.py startapp activities
```

> **Dica**: mantenha todos os apps de domínio em `apps/<nome>/` (pasta apps na raiz) para evitar poluir o namespace.

### 1.2 Dependências Essenciais

```bash
pip install djangorestframework django-filter
pip install psycopg2-binary           # ou asyncpg se for usar async
pip install python-dotenv            # configuração via .env
pip install drf-spectacular           # OpenAPI/Swagger
pip install django-cors-headers
pip install django-environ           # alternativa ao python-dotenv
pip install Pillow                   # imagens
pip install qrcode[pil]              # QR Codes
pip install celery redis

# Salve tudo em requirements.txt:
pip freeze > requirements.txt
```

### 1.3 Configurações de Ambiente (.env)

Crie `.env` na raiz:

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DATABASE_URL=postgres://obreiro:obreiro@localhost:5432/obreiro
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=127.0.0.1,localhost
```

No `config/settings/base.py`:

```python
import environ, os

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

DATABASES = {
    "default": env.db("DATABASE_URL")
}
```

### 1.4 Registro de Apps e Configurações

Em `config/settings/base.py`:

```python
INSTALLED_APPS = [
    # Django core
    "django.contrib.admin", "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Terceiros
    "rest_framework", "rest_framework.authtoken",
    "django_filters", "corsheaders",
    "drf_spectacular",
    
    # Nossos apps
    "core", "accounts", "denominations", "churches",
    "branches", "members", "visitors", "activities",
]

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": 
        ["django_filters.rest_framework.DjangoFilterBackend"],
}
```

### 1.5 Middleware Multi-tenant

Em `core/middleware.py`:

```python
from accounts.models import ChurchUser

class TenantMiddleware:
    def __init__(self, get_response): 
        self.get_response = get_response
    
    def __call__(self, request):
        user = request.user
        request.church = None
        request.branch = None
        
        if user.is_authenticated:
            link = (
                ChurchUser.objects
                .select_related("church", "branch")
                .filter(user=user)
                .first()
            )
            
            if link:
                request.church = link.church
                request.branch = link.branch
        
        return self.get_response(request)
```

### 1.6 Docker Compose para Desenvolvimento

`docker-compose.yml`:

```yaml
version: "3.9"
services:
  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes: [".:/code"]
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [db, redis]
  
  db:
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_DB=obreiro
      - POSTGRES_USER=obreiro
      - POSTGRES_PASSWORD=obreiro
    ports: ["5432:5432"]
  
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

`Dockerfile`:

```dockerfile
FROM python:3.12-alpine
WORKDIR /code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

---

## 2. Modelo Conceitual

### 2.1 Visão Geral da Arquitetura

A plataforma é estruturada como um **SaaS multi-tenant** para gestão eclesiástica, com segregação completa de dados por igreja.

```
Denomination ──┐
               │1  N
               ▼
            Church ──┐
                     │1  N
                     ▼
                 Branch ─────▶ Activity
                     │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       Member              Visitor
          │                   │ 0..1
          ▼                   ▼
       Member              Member
```

### 2.2 Entidades Principais

| **Entidade**     | **Descrição rápida**                             | **Atributos chave**                                      |
|------------------|---------------------------------------------------|----------------------------------------------------------|
| **Denomination** | Estrutura guarda-chuva para múltiplas igrejas.   | id, name, headquarters_city                              |
| **Church**       | Tenant principal.                                | id, denomination_id*, name, cnpj, subscription_*, …     |
| **Branch**       | Filial física/ campus.                          | id, church_id*, name, address, qr_code_token            |
| **Member**       | Pessoa oficialmente membro.                     | id, church_id*, branch_id*, name, membership_status, …  |
| **Visitor**      | Pessoa visitante (lead).                        | id, church_id*, branch_id*, name, interest_level, member_id? |
| **Activity**     | Evento/agenda ministerial.                      | id, church_id*, branch_id*, title, type, start_datetime |
| **User**         | Conta de login (Django).                        | id, email, password                                     |
| **ChurchUser**   | Junção **User × Church** (papéis).              | user_id*, church_id*, branch_id?, role                  |

### 2.3 Relacionamentos

| **Associação**              | **Cardinalidade**                                                    | **Observações**                                          |
|-----------------------------|----------------------------------------------------------------------|----------------------------------------------------------|
| **Denomination 1 — N Church** | Uma denominação possui várias igrejas; igreja pode existir sem denominação (nullable). |  |
| **Church 1 — N Branch**     | Obriga cada filial a pertencer a uma única igreja.                   |                                                          |
| **Branch 1 — N Member**     | Segue visão de campus; membro sempre vinculado a filial.             |                                                          |
| **Branch 1 — N Visitor**    | Visitantes cadastrados por filial (via QR).                          |                                                          |
| **Branch 1 — N Activity**   | Agenda local.                                                        |                                                          |
| **Visitor 0..1 — 1 Member** | Conversão opcional; guarda member_id quando visitante vira membro.   |                                                          |
| **User N — M Church**       | Resolvido por **ChurchUser**; define papéis (owner, admin, staff).   |                                                          |

### 2.4 Diagrama ER (Mermaid)

```mermaid
erDiagram
    DENOMINATION ||--o{ CHURCH : "1..N"
    CHURCH ||--o{ BRANCH : "1..N"
    BRANCH ||--o{ MEMBER : "1..N"
    BRANCH ||--o{ VISITOR : "1..N"
    BRANCH ||--o{ ACTIVITY : "1..N"
    VISITOR }o--|| MEMBER : "0..1"
    USER ||--o{ CHURCH_USER : "1..N"
    CHURCH ||--o{ CHURCH_USER : "1..N"

    DENOMINATION {
        int id PK
        varchar name
        varchar headquarters_city
    }

    CHURCH {
        int id PK
        int denomination_id FK
        varchar name
        char(18) cnpj
        varchar subscription_plan
        timestamp subscription_expires_at
    }

    BRANCH {
        int id PK
        int church_id FK
        varchar name
        uuid qr_code_token
    }

    MEMBER {
        int id PK
        int church_id FK
        int branch_id FK
        varchar name
        date baptism_date
    }

    VISITOR {
        int id PK
        int church_id FK
        int branch_id FK
        int member_id FK "nullable"
        varchar name
        smallint interest_level
    }

    ACTIVITY {
        int id PK
        int church_id FK
        int branch_id FK
        varchar title
        timestamp start_datetime
    }

    USER {
        int id PK
        varchar email
        varchar password
    }

    CHURCH_USER {
        int user_id PK, FK
        int church_id PK, FK
        int branch_id FK "nullable"
        varchar role
    }
```

### 2.5 Observações de Design

1. **Multi-tenant**: *Todas* as tabelas fracamente dependentes contêm church_id → isolamento garantido por middleware/ORM.

2. **Soft-delete**: Campos is_active ou status permitem desativar sem remover.

3. **Escalabilidade**: Usar particionamento por church_id em tabelas de alto volume (*member*, *visitor*) quando necessário.

4. **Auditoria**: Recomenda-se SimpleHistory ou tabela audit_log para rastrear alterações sensíveis.

---

## 3. Modelo Lógico

### 3.1 Estrutura Relacional Normalizada (3FN)

Estrutura relacional **normalizada (3FN)** a ser implementada no PostgreSQL pela camada ORM do Django.

Chaves primárias (PK) em **negrito**, chaves estrangeiras (FK) indicadas com *asterisco*.

| **#** | **Tabela**                | **Colunas (tipo lógico)**                                    | **Observações / Mapeamento Django**                                        |
|-------|---------------------------|---------------------------------------------------------------|-----------------------------------------------------------------------------|
| 1     | **denomination**          | **id** (int, auto)                                          | models.Model simples.                                                       |
|       |                           | name (varchar 200)                                          |                                                                             |
|       |                           | headquarters_city (varchar 100)                             |                                                                             |
|       |                           | created_at (timestamp)                                      |                                                                             |
| 2     | **church**                | **id** (int, auto)                                          | FK → Denomination, on_delete=models.SET_NULL (nullable para igreja independente). |
|       |                           | denomination_id* (int)                                      |                                                                             |
|       |                           | name (varchar 200)                                          |                                                                             |
|       |                           | cnpj (char 18, unique)                                      |                                                                             |
|       |                           | email (varchar 254)                                         |                                                                             |
|       |                           | phone (varchar 20)                                          |                                                                             |
|       |                           | subscription_plan (varchar 50)                              |                                                                             |
|       |                           | subscription_status (varchar 20)                            |                                                                             |
|       |                           | subscription_expires_at (timestamp)                         |                                                                             |
|       |                           | max_members (int, default 500)                              |                                                                             |
|       |                           | max_branches (int, default 3)                               |                                                                             |
|       |                           | features_enabled (json)                                     |                                                                             |
|       |                           | is_active (bool)                                            |                                                                             |
|       |                           | created_at, updated_at (timestamp)                          |                                                                             |
| 3     | **branch**                | **id** (int, auto)                                          | FK → Church, CASCADE.                                                       |
|       |                           | church_id* (int)                                            |                                                                             |
|       |                           | name (varchar 200)                                          |                                                                             |
|       |                           | address (text)                                              |                                                                             |
|       |                           | pastor_responsible (varchar 200)                            |                                                                             |
|       |                           | qr_code_token (uuid, unique)                                |                                                                             |
|       |                           | qr_code_active (bool)                                       |                                                                             |
|       |                           | visitor_count (int)                                         |                                                                             |
|       |                           | member_count (int)                                          |                                                                             |
|       |                           | is_active (bool)                                            |                                                                             |
|       |                           | created_at (timestamp)                                      |                                                                             |
| 4     | **member**                | **id** (int, auto)                                          | FK → Church, Branch (ambos CASCADE).                                       |
|       |                           | church_id* (int)                                            |                                                                             |
|       |                           | branch_id* (int)                                            |                                                                             |
|       |                           | name (varchar 200)                                          |                                                                             |
|       |                           | email (varchar 254)                                         |                                                                             |
|       |                           | phone (varchar 20)                                          |                                                                             |
|       |                           | birth_date (date)                                           |                                                                             |
|       |                           | gender (char 1)                                             |                                                                             |
|       |                           | address (text) + neighborhood / city / state / zipcode (varchar) |                                                                             |
|       |                           | baptism_date (date)                                         |                                                                             |
|       |                           | conversion_date (date)                                      |                                                                             |
|       |                           | membership_status (varchar 20)                              |                                                                             |
|       |                           | ministerial_function (varchar 100)                          |                                                                             |
|       |                           | origin (varchar 50)                                         |                                                                             |
|       |                           | converted_from_visitor (bool)                               |                                                                             |
|       |                           | created_at, updated_at                                      |                                                                             |
| 5     | **visitor**               | **id** (int, auto)                                          | FK → Member (nullable).                                                     |
|       |                           | church_id* (int)                                            |                                                                             |
|       |                           | branch_id* (int)                                            |                                                                             |
|       |                           | name (varchar 200)                                          |                                                                             |
|       |                           | email (varchar 254)                                         |                                                                             |
|       |                           | phone (varchar 20)                                          |                                                                             |
|       |                           | age_range (varchar 20)                                      |                                                                             |
|       |                           | interest_level (smallint)                                   |                                                                             |
|       |                           | wants_contact (bool)                                        |                                                                             |
|       |                           | visit_reason (text)                                         |                                                                             |
|       |                           | converted_to_member (bool)                                  |                                                                             |
|       |                           | conversion_date (date)                                      |                                                                             |
|       |                           | member_id* (int, nullable)                                  |                                                                             |
|       |                           | registration_source (varchar 20)                            |                                                                             |
|       |                           | qr_code_used (uuid, nullable)                               |                                                                             |
|       |                           | created_at (timestamp)                                      |                                                                             |
| 6     | **activity**              | **id** (int, auto)                                          | Eventos / agendas.                                                          |
|       |                           | church_id* (int)                                            |                                                                             |
|       |                           | branch_id* (int)                                            |                                                                             |
|       |                           | title (varchar 200)                                         |                                                                             |
|       |                           | type (varchar 50)                                           |                                                                             |
|       |                           | description (text)                                          |                                                                             |
|       |                           | start_datetime / end_datetime (timestamp)                   |                                                                             |
|       |                           | created_at (timestamp)                                      |                                                                             |
| 7     | **auth_user**             | (padrão Django)                                             | Gerado por django.contrib.auth.                                            |
| 8     | **church_user**           | **user_id*** (int)                                          | **PK composta** (user_id, church_id). Permite que um mesmo login acesse vários tenants com papéis distintos. |
|       |                           | **church_id*** (int)                                        |                                                                             |
|       |                           | branch_id* (int, nullable)                                  |                                                                             |
|       |                           | role (varchar 50)                                           |                                                                             |

### 3.2 Notas de Implementação no Django

| **Tema**                | **Prática recomendada**                                                                        |
|-------------------------|-------------------------------------------------------------------------------------------------|
| **Chaves**              | Use models.BigAutoField para PKs (DEFAULT_AUTO_FIELD).                                        |
| **FK multi-tenant**     | Adicione db_index=True em todas as FK que incluem church_id para acelerar filtros do middleware. |
| **JSON & UUID**         | models.JSONField (PostgreSQL) e models.UUIDField(default=uuid.uuid4, editable=False).        |
| **Status / Choices**    | Utilize TextChoices para subscription_status, membership_status, gender, etc.                 |
| **Soft-delete**         | Campos is_active + managers customizados (objects = ActiveManager()), evitando deletar fisicamente. |
| **Signals / Celery**    | post_save para atualizar contadores; delegar e-mails e KPIs a tasks Celery.                  |
| **Partitioning futuro** | Avalie django-postgres-extra ou migração manual para particionar member/visitor por church_id quando >10⁶ registros. |

---

## 4. Modelo Físico (DDL PostgreSQL)

### 4.1 Tabelas de Domínio

```sql
-- =========================================
-- 1. Tabelas de Domínio
-- =========================================

CREATE TABLE denomination (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    headquarters_city VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE church (
    id BIGSERIAL PRIMARY KEY,
    denomination_id BIGINT REFERENCES denomination(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    cnpj CHAR(18) NOT NULL UNIQUE,
    email VARCHAR(254),
    phone VARCHAR(20),
    subscription_plan VARCHAR(50),
    subscription_status VARCHAR(20),
    subscription_expires_at TIMESTAMPTZ,
    max_members INTEGER DEFAULT 500,
    max_branches INTEGER DEFAULT 3,
    features_enabled JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branch (
    id BIGSERIAL PRIMARY KEY,
    church_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    pastor_responsible VARCHAR(200),
    qr_code_token UUID NOT NULL UNIQUE,
    qr_code_active BOOLEAN DEFAULT TRUE,
    visitor_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (church_id, name)
);

CREATE TABLE member (
    id BIGSERIAL PRIMARY KEY,
    church_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(20),
    birth_date DATE,
    gender CHAR(1) CHECK (gender IN ('M','F')),
    address TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state CHAR(2),
    zipcode VARCHAR(10),
    baptism_date DATE,
    conversion_date DATE,
    membership_status VARCHAR(20) DEFAULT 'active',
    ministerial_function VARCHAR(100),
    origin VARCHAR(50),
    converted_from_visitor BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visitor (
    id BIGSERIAL PRIMARY KEY,
    church_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(20),
    age_range VARCHAR(20),
    interest_level SMALLINT DEFAULT 1 CHECK (interest_level BETWEEN 1 AND 5),
    wants_contact BOOLEAN DEFAULT FALSE,
    visit_reason TEXT,
    converted_to_member BOOLEAN DEFAULT FALSE,
    conversion_date DATE,
    member_id BIGINT REFERENCES member(id),
    registration_source VARCHAR(20) DEFAULT 'qr_code',
    qr_code_used UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity (
    id BIGSERIAL PRIMARY KEY,
    church_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Controle de Acesso Multi-tenant

```sql
-- =========================================
-- 2. Controle de Acesso Multi-tenant
-- =========================================

CREATE TABLE church_user (
    user_id BIGINT REFERENCES auth_user(id) ON DELETE CASCADE,
    church_id BIGINT REFERENCES church(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branch(id) ON DELETE SET NULL,
    role VARCHAR(50),
    PRIMARY KEY (user_id, church_id)
);

-- Opcional — papéis em nível de denominação
CREATE TABLE denomination_user (
    user_id BIGINT REFERENCES auth_user(id) ON DELETE CASCADE,
    denomination_id BIGINT REFERENCES denomination(id) ON DELETE CASCADE,
    role VARCHAR(50),
    PRIMARY KEY (user_id, denomination_id)
);
```

### 4.3 Índices Auxiliares

```sql
-- =========================================
-- 3. Índices Auxiliares
-- =========================================

CREATE INDEX idx_member_church_branch ON member(church_id, branch_id);
CREATE INDEX idx_visitor_church_branch ON visitor(church_id, branch_id);
CREATE INDEX idx_activity_church_branch ON activity(church_id, branch_id);
CREATE INDEX idx_visitor_member_id ON visitor(member_id);
```

---

## 5. Implementação dos Models Django

### 5.1 core/models.py — Bases e Utilidades

```python
import uuid
from django.db import models
from django.utils import timezone

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class ActiveQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

class ActiveManager(models.Manager):
    def get_queryset(self):
        return ActiveQuerySet(self.model, using=self._db).active()

class TenantQuerySet(ActiveQuerySet):
    def for_church(self, church):
        return self.filter(church=church)

class TenantManager(ActiveManager):
    def get_queryset(self):
        return TenantQuerySet(self.model, using=self._db).active()
```

### 5.2 denominations/models.py

```python
from django.db import models
from core.models import TimeStampedModel, ActiveManager

class Denomination(TimeStampedModel):
    name = models.CharField(max_length=200)
    headquarters_city = models.CharField(max_length=100, blank=True)
    
    objects = ActiveManager()
    
    def __str__(self):
        return self.name
```

### 5.3 churches/models.py

```python
import uuid
from django.db import models
from core.models import TimeStampedModel, TenantManager
from denominations.models import Denomination

class Church(TimeStampedModel):
    class SubscriptionStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        TRIAL = "trial", "Trial"
        PAUSED = "paused", "Paused"
    
    denomination = models.ForeignKey(
        Denomination,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="churches",
    )
    name = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    subscription_plan = models.CharField(max_length=50, default="basic")
    subscription_status = models.CharField(
        max_length=20, choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.TRIAL
    )
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    max_members = models.PositiveIntegerField(default=500)
    max_branches = models.PositiveIntegerField(default=3)
    features_enabled = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    
    objects = TenantManager()
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return self.name
```

### 5.4 branches/models.py

```python
import uuid
from django.db import models
from core.models import TimeStampedModel, TenantManager
from churches.models import Church

class Branch(TimeStampedModel):
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name="branches",
        db_index=True,
    )
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    pastor_responsible = models.CharField(max_length=200, blank=True)
    qr_code_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    qr_code_active = models.BooleanField(default=True)
    visitor_count = models.PositiveIntegerField(default=0)
    member_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    objects = TenantManager()
    
    class Meta:
        unique_together = ("church", "name")
        ordering = ["name"]
    
    def __str__(self):
        return f"{self.name} — {self.church}"
```

### 5.5 members/models.py

```python
from django.db import models
from core.models import TimeStampedModel, TenantManager
from churches.models import Church
from branches.models import Branch

class Member(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = "M", "Masculino"
        FEMALE = "F", "Feminino"
    
    church = models.ForeignKey(
        Church, on_delete=models.CASCADE, related_name="members", db_index=True
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="members", db_index=True
    )
    
    # Dados pessoais
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, blank=True)
    
    # Endereço
    address = models.TextField(blank=True)
    neighborhood = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)
    zipcode = models.CharField(max_length=10, blank=True)
    
    # Dados eclesiásticos
    baptism_date = models.DateField(null=True, blank=True)
    conversion_date = models.DateField(null=True, blank=True)
    membership_status = models.CharField(max_length=20, default="active")
    ministerial_function = models.CharField(max_length=100, blank=True)
    origin = models.CharField(max_length=50, blank=True)
    converted_from_visitor = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    objects = TenantManager()
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return self.name
```

### 5.6 visitors/models.py

```python
import uuid
from django.db import models
from core.models import TimeStampedModel, TenantManager
from churches.models import Church
from branches.models import Branch
from members.models import Member

class Visitor(TimeStampedModel):
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name="visitors")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="visitors")
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    age_range = models.CharField(max_length=20, blank=True)
    interest_level = models.PositiveSmallIntegerField(default=1)
    wants_contact = models.BooleanField(default=False)
    visit_reason = models.TextField(blank=True)
    converted_to_member = models.BooleanField(default=False)
    conversion_date = models.DateField(null=True, blank=True)
    member = models.OneToOneField(
        Member, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="origin_visitor"
    )
    registration_source = models.CharField(max_length=20, default="qr_code")
    qr_code_used = models.UUIDField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    objects = TenantManager()
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.name
```

### 5.7 activities/models.py

```python
from django.db import models
from core.models import TimeStampedModel, TenantManager
from churches.models import Church
from branches.models import Branch

class Activity(TimeStampedModel):
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name="activities")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="activities")
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    objects = TenantManager()
    
    class Meta:
        ordering = ["-start_datetime"]
    
    def __str__(self):
        return self.title
```

### 5.8 accounts/models.py — Vínculo Usuário × Igreja

```python
from django.contrib.auth.models import User
from django.db import models
from churches.models import Church
from branches.models import Branch

class ChurchUser(models.Model):
    ROLE = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("staff", "Staff"),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="church_links")
    church = models.ForeignKey(Church, on_delete=models.CASCADE, related_name="user_links")
    branch = models.ForeignKey(
        Branch, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="user_links"
    )
    role = models.CharField(max_length=50, choices=ROLE, default="staff")
    
    class Meta:
        unique_together = ("user", "church")
        verbose_name = "Church User"
        verbose_name_plural = "Church Users"
    
    def __str__(self):
        return f"{self.user} @ {self.church} ({self.role})"
```

---

## 6. Configurações e Estrutura do Projeto

### 6.1 URLs e API Versioning

```python
# config/urls.py
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("api.v1")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema")),
]
```

### 6.2 Celery & Redis (Assíncrono)

- `celery.py` dentro de `config/`.
- `tasks.py` nas apps que precisarem.
- Inicie **Redis** (docker run -p 6379:6379 redis:7).
- Teste com tarefa simples (`@shared_task def ping(): return "pong"`).

### 6.3 Git & Qualidade de Código

```bash
echo ".env" >> .gitignore
pip install pre-commit black isort flake8
pre-commit install
```

Configure **Black** + **isort** no `.pre-commit-config.yaml`.

### 6.4 Banco + Migrações Iniciais

1. Suba PostgreSQL (local ou Docker).
2. Crie DB obreiro e usuário/password.
3. Ajuste DATABASE_URL no .env.
4. Rode:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

---

## Checklist de Implementação

- [ ] **Virtualenv** ativo
- [ ] Django & dependências instalados
- [ ] Projeto config/ e apps criados
- [ ] .env configurado
- [ ] PostgreSQL/Redis em execução
- [ ] Migrações aplicadas + superuser
- [ ] Middleware multi-tenant operando
- [ ] DRF + Swagger acessível em /docs/
- [ ] Primeiros endpoints (ex.: ChurchViewSet) testados via Postman
- [ ] Docker Compose levanta tudo com `docker compose up`

---

## Próximos Passos

1. **Registrar cada app no INSTALLED_APPS.**
2. **Executar**: 
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
3. **Implementar o middleware multi-tenant** para povoar `request.church`/`request.branch` e aplicar o TenantManager por padrão.
4. **Adicionar tests de restrição de acesso** (um tenant não enxerga dados de outro).
5. **Configurar admin.py** para facilitar o gerenciamento inicial.

---

Este documento serve como:
- **Documentação completa da arquitetura de dados**
- **Guia de setup do projeto Django** 
- **Referência dos modelos de dados** (conceitual → lógico → físico)
- **Manual de configuração e bootstrap**

A estrutura flui naturalmente do setup inicial até a implementação final dos modelos de dados, garantindo uma base sólida para o desenvolvimento da plataforma SaaS multi-tenant.