**1 │ Bootstrap do projeto Django**
-----------------------------------

\# 1.1 dentro do venv

django-admin startproject config .

python manage.py startapp core \# utilidades comuns

python manage.py startapp accounts \# auth + ChurchUser

python manage.py startapp denominations

python manage.py startapp churches

python manage.py startapp branches

python manage.py startapp members

python manage.py startapp visitors

python manage.py startapp activities

> **Dica**: mantenha todos os apps de domínio em apps/&lt;nome&gt;/
> (pasta apps na raiz) para evitar poluir o namespace.

**2 │ Dependências adicionais**
-------------------------------

pip install djangorestframework django-filter

pip install psycopg2-binary \# ou asyncpg se for usar async

pip install python-dotenv \# configuração via .env

pip install drf-spectacular \# OpenAPI/Swagger

pip install django-cors-headers

pip install django-environ \# alternativa ao python-dotenv

pip install Pillow \# imagens

pip install qrcode\[pil\] \# QR Codes

pip install celery redis

> Salve tudo em requirements.txt:

pip freeze &gt; requirements.txt

**3 │ Configurações de ambiente (.env)**
----------------------------------------

Crie .env na raiz:

DJANGO\_SECRET\_KEY=change-me

DJANGO\_DEBUG=True

DATABASE\_URL=postgres://obreiro:obreiro@localhost:5432/obreiro

REDIS\_URL=redis://localhost:6379/0

ALLOWED\_HOSTS=127.0.0.1,localhost

No config/settings/base.py:

import environ, os

env = environ.Env()

environ.Env.read\_env(os.path.join(BASE\_DIR, ".env"))

SECRET\_KEY = env("DJANGO\_SECRET\_KEY")

DEBUG = env.bool("DJANGO\_DEBUG", default=False)

ALLOWED\_HOSTS = env.list("ALLOWED\_HOSTS", default=\[\])

DATABASES = {

"default": env.db("DATABASE\_URL")

}

Divida em settings/dev.py e settings/prod.py se desejar.

**4 │ Registrar apps e libs**
-----------------------------

Em config/settings/base.py:

INSTALLED\_APPS = \[

\# Django core

"django.contrib.admin", "django.contrib.auth",
"django.contrib.contenttypes",

"django.contrib.sessions", "django.contrib.messages",
"django.contrib.staticfiles",

\# Terceiros

"rest\_framework", "rest\_framework.authtoken",

"django\_filters", "corsheaders",

"drf\_spectacular",

\# Nossos apps

"core", "accounts", "denominations", "churches",

"branches", "members", "visitors", "activities",

\]

REST Framework:

REST\_FRAMEWORK = {

"DEFAULT\_SCHEMA\_CLASS": "drf\_spectacular.openapi.AutoSchema",

"DEFAULT\_AUTHENTICATION\_CLASSES": \[

"rest\_framework.authentication.TokenAuthentication",

\],

"DEFAULT\_PERMISSION\_CLASSES": \[

"rest\_framework.permissions.IsAuthenticated",

\],

"DEFAULT\_FILTER\_BACKENDS":
\["django\_filters.rest\_framework.DjangoFilterBackend"\],

}

**5 │ Banco + migrações iniciais**
----------------------------------

1.  Suba PostgreSQL (local ou Docker).

2.  Crie DB obreiro e usuário/password.

3.  Ajuste DATABASE\_URL no .env.

4.  Rode:

python manage.py makemigrations

python manage.py migrate

python manage.py createsuperuser

**6 │ Middleware multi-tenant**
-------------------------------

Em core/middleware.py:

from accounts.models import ChurchUser

class TenantMiddleware:

def \_\_init\_\_(self, get\_response): self.get\_response =
get\_response

def \_\_call\_\_(self, request):

user = request.user

request.church = None

request.branch = None

if user.is\_authenticated:

link = (

ChurchUser.objects

.select\_related("church", "branch")

.filter(user=user)

.first()

)

if link:

request.church = link.church

request.branch = link.branch

return self.get\_response(request)

Registre em MIDDLEWARE antes de views que dependem dele.

**7 │ Celery & Redis (assíncrono)**
-----------------------------------

-   celery.py dentro de config/.

-   tasks.py nas apps que precisarem.

-   Inicie **Redis** (docker run -p 6379:6379 redis:7).

-   Teste com tarefa simples (@shared\_task def ping(): return "pong").

**8 │ Docker (ambiente dev full-stack)**
----------------------------------------

docker-compose.yml minimal:

yaml

version: "3.9"

services:

web:

build: .

command: python manage.py runserver 0.0.0.0:8000

volumes: \[".:/code"\]

ports: \["8000:8000"\]

env\_file: .env

depends\_on: \[db, redis\]

db:

image: postgres:15

restart: always

environment:

- POSTGRES\_DB=obreiro

- POSTGRES\_USER=obreiro

- POSTGRES\_PASSWORD=obreiro

ports: \["5432:5432"\]

redis:

image: redis:7

ports: \["6379:6379"\]

Adicione Dockerfile:

dockerfile

FROM python:3.12-alpine

WORKDIR /code

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

**9 │ Primeiros endpoints DRF**
-------------------------------

-   Crie serializers.py, views.py e urls.py em cada app;

-   Use ModelViewSet;

-   Versione a API:

python

\# config/urls.py

from django.urls import path, include

urlpatterns = \[

path("admin/", admin.site.urls),

path("api/v1/", include("api.v1")),

path("schema/", SpectacularAPIView.as\_view(), name="schema"),

path("docs/", SpectacularSwaggerView.as\_view(url\_name="schema")),

\]

**10 │ Git & qualidade**
------------------------

echo ".env" &gt;&gt; .gitignore

pip install pre-commit black isort flake8

pre-commit install

Configure **Black** + **isort** no .pre-commit-config.yaml.

**Checklist rápido**
--------------------

-   **Virtualenv** ativo

-   Django & dependências instalados

-   Projeto config/ e apps criados

-   .env configurado

-   PostgreSQL/Redis em execução

-   Migrações aplicadas + superuser

-   Middleware multi-tenant operando

-   DRF + Swagger acessível em /docs/

-   Primeiros endpoints (ex.: ChurchViewSet) testados via Postman

-   Docker Compose levanta tudo com docker compose up
