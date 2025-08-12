---
title: '[]{#_muh5ry8ueqw .anchor}1. Modelo Físico (DDL PostgreSQL)'
---

-- =========================================

-- 1. Tabelas de Domínio

-- =========================================

CREATE TABLE denomination (

id BIGSERIAL PRIMARY KEY,

name VARCHAR(200) NOT NULL,

headquarters\_city VARCHAR(100),

created\_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE church (

id BIGSERIAL PRIMARY KEY,

denomination\_id BIGINT REFERENCES denomination(id) ON DELETE SET NULL,

name VARCHAR(200) NOT NULL,

cnpj CHAR(18) NOT NULL UNIQUE,

email VARCHAR(254),

phone VARCHAR(20),

subscription\_plan VARCHAR(50),

subscription\_status VARCHAR(20),

subscription\_expires\_at TIMESTAMPTZ,

max\_members INTEGER DEFAULT 500,

max\_branches INTEGER DEFAULT 3,

features\_enabled JSONB DEFAULT '{}'::jsonb,

is\_active BOOLEAN DEFAULT TRUE,

created\_at TIMESTAMPTZ DEFAULT NOW(),

updated\_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE branch (

id BIGSERIAL PRIMARY KEY,

church\_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,

name VARCHAR(200) NOT NULL,

address TEXT,

pastor\_responsible VARCHAR(200),

qr\_code\_token UUID NOT NULL UNIQUE,

qr\_code\_active BOOLEAN DEFAULT TRUE,

visitor\_count INTEGER DEFAULT 0,

member\_count INTEGER DEFAULT 0,

is\_active BOOLEAN DEFAULT TRUE,

created\_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE (church\_id, name)

);

CREATE TABLE member (

id BIGSERIAL PRIMARY KEY,

church\_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,

branch\_id BIGINT NOT NULL REFERENCES branch(id) ON DELETE CASCADE,

name VARCHAR(200) NOT NULL,

email VARCHAR(254),

phone VARCHAR(20),

birth\_date DATE,

gender CHAR(1) CHECK (gender IN ('M','F')),

address TEXT,

neighborhood VARCHAR(100),

city VARCHAR(100),

state CHAR(2),

zipcode VARCHAR(10),

baptism\_date DATE,

conversion\_date DATE,

membership\_status VARCHAR(20) DEFAULT 'active',

ministerial\_function VARCHAR(100),

origin VARCHAR(50),

converted\_from\_visitor BOOLEAN DEFAULT FALSE,

is\_active BOOLEAN DEFAULT TRUE,

created\_at TIMESTAMPTZ DEFAULT NOW(),

updated\_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE visitor (

id BIGSERIAL PRIMARY KEY,

church\_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,

branch\_id BIGINT NOT NULL REFERENCES branch(id) ON DELETE CASCADE,

name VARCHAR(200) NOT NULL,

email VARCHAR(254),

phone VARCHAR(20),

age\_range VARCHAR(20),

interest\_level SMALLINT DEFAULT 1 CHECK (interest\_level BETWEEN 1 AND
5),

wants\_contact BOOLEAN DEFAULT FALSE,

visit\_reason TEXT,

converted\_to\_member BOOLEAN DEFAULT FALSE,

conversion\_date DATE,

member\_id BIGINT REFERENCES member(id),

registration\_source VARCHAR(20) DEFAULT 'qr\_code',

qr\_code\_used UUID,

is\_active BOOLEAN DEFAULT TRUE,

created\_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE activity (

id BIGSERIAL PRIMARY KEY,

church\_id BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,

branch\_id BIGINT NOT NULL REFERENCES branch(id) ON DELETE CASCADE,

title VARCHAR(200) NOT NULL,

type VARCHAR(50),

description TEXT,

start\_datetime TIMESTAMPTZ,

end\_datetime TIMESTAMPTZ,

is\_active BOOLEAN DEFAULT TRUE,

created\_at TIMESTAMPTZ DEFAULT NOW()

);

-- =========================================

-- 2. Controle de Acesso Multi-tenant

-- =========================================

CREATE TABLE church\_user (

user\_id BIGINT REFERENCES auth\_user(id) ON DELETE CASCADE,

church\_id BIGINT REFERENCES church(id) ON DELETE CASCADE,

branch\_id BIGINT REFERENCES branch(id) ON DELETE SET NULL,

role VARCHAR(50),

PRIMARY KEY (user\_id, church\_id)

);

-- Opcional — papéis em nível de denominação

CREATE TABLE denomination\_user (

user\_id BIGINT REFERENCES auth\_user(id) ON DELETE CASCADE,

denomination\_id BIGINT REFERENCES denomination(id) ON DELETE CASCADE,

role VARCHAR(50),

PRIMARY KEY (user\_id, denomination\_id)

);

-- =========================================

-- 3. Índices Auxiliares

-- =========================================

CREATE INDEX idx\_member\_church\_branch ON member(church\_id,
branch\_id);

CREATE INDEX idx\_visitor\_church\_branch ON visitor(church\_id,
branch\_id);

CREATE INDEX idx\_activity\_church\_branch ON activity(church\_id,
branch\_id);

CREATE INDEX idx\_visitor\_member\_id ON visitor(member\_id);

**2. Models Django**
--------------------

> Estrutura em **apps** independentes.\
> Cada app abaixo contém apenas o trecho models.py relevante.

### **2.1 core/models.py — bases e utilidades**

import uuid

from django.db import models

from django.utils import timezone

class TimeStampedModel(models.Model):

created\_at = models.DateTimeField(auto\_now\_add=True)

updated\_at = models.DateTimeField(auto\_now=True)

class Meta:

abstract = True

class ActiveQuerySet(models.QuerySet):

def active(self):

return self.filter(is\_active=True)

class ActiveManager(models.Manager):

def get\_queryset(self):

return ActiveQuerySet(self.model, using=self.\_db).active()

class TenantQuerySet(ActiveQuerySet):

def for\_church(self, church):

return self.filter(church=church)

class TenantManager(ActiveManager):

def get\_queryset(self):

return TenantQuerySet(self.model, using=self.\_db).active()

**2.2 denominations/[*models.py*](http://models.py)**

from django.db import models

from core.models import TimeStampedModel, ActiveManager

class Denomination(TimeStampedModel):

name = models.CharField(max\_length=200)

headquarters\_city = models.CharField(max\_length=100, blank=True)

objects = ActiveManager()

def \_\_str\_\_(self):

return self.name

**2.3 churches/[*models.py*](http://models.py)**

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

on\_delete=models.SET\_NULL,

related\_name="churches",

)

name = models.CharField(max\_length=200)

cnpj = models.CharField(max\_length=18, unique=True)

email = models.EmailField(blank=True)

phone = models.CharField(max\_length=20, blank=True)

subscription\_plan = models.CharField(max\_length=50, default="basic")

subscription\_status = models.CharField(

max\_length=20, choices=SubscriptionStatus.choices,
default=SubscriptionStatus.TRIAL

)

subscription\_expires\_at = models.DateTimeField(null=True, blank=True)

max\_members = models.PositiveIntegerField(default=500)

max\_branches = models.PositiveIntegerField(default=3)

features\_enabled = models.JSONField(default=dict)

is\_active = models.BooleanField(default=True)

objects = TenantManager()

class Meta:

ordering = \["name"\]

def \_\_str\_\_(self):

return self.name

**2.4 branches/[*models.py*](http://models.py)**

import uuid

from django.db import models

from core.models import TimeStampedModel, TenantManager

from churches.models import Church

class Branch(TimeStampedModel):

church = models.ForeignKey(

Church,

on\_delete=models.CASCADE,

related\_name="branches",

db\_index=True,

)

name = models.CharField(max\_length=200)

address = models.TextField(blank=True)

pastor\_responsible = models.CharField(max\_length=200, blank=True)

qr\_code\_token = models.UUIDField(default=uuid.uuid4, unique=True,
editable=False)

qr\_code\_active = models.BooleanField(default=True)

visitor\_count = models.PositiveIntegerField(default=0)

member\_count = models.PositiveIntegerField(default=0)

is\_active = models.BooleanField(default=True)

objects = TenantManager()

class Meta:

unique\_together = ("church", "name")

ordering = \["name"\]

def \_\_str\_\_(self):

return f"{self.name} — {self.church}"

**2.5 members/[*models.py*](http://models.py)**

from django.db import models

from core.models import TimeStampedModel, TenantManager

from churches.models import Church

from branches.models import Branch

class Member(TimeStampedModel):

class Gender(models.TextChoices):

MALE = "M", "Masculino"

FEMALE = "F", "Feminino"

church = models.ForeignKey(

Church, on\_delete=models.CASCADE, related\_name="members",
db\_index=True

)

branch = models.ForeignKey(

Branch, on\_delete=models.CASCADE, related\_name="members",
db\_index=True

)

\# Dados pessoais

name = models.CharField(max\_length=200)

email = models.EmailField(blank=True)

phone = models.CharField(max\_length=20, blank=True)

birth\_date = models.DateField(null=True, blank=True)

gender = models.CharField(max\_length=1, choices=Gender.choices,
blank=True)

\# Endereço

address = models.TextField(blank=True)

neighborhood = models.CharField(max\_length=100, blank=True)

city = models.CharField(max\_length=100, blank=True)

state = models.CharField(max\_length=2, blank=True)

zipcode = models.CharField(max\_length=10, blank=True)

\# Dados eclesiásticos

baptism\_date = models.DateField(null=True, blank=True)

conversion\_date = models.DateField(null=True, blank=True)

membership\_status = models.CharField(max\_length=20, default="active")

ministerial\_function = models.CharField(max\_length=100, blank=True)

origin = models.CharField(max\_length=50, blank=True)

converted\_from\_visitor = models.BooleanField(default=False)

is\_active = models.BooleanField(default=True)

objects = TenantManager()

class Meta:

ordering = \["name"\]

def \_\_str\_\_(self):

return self.name

**2.6 visitors/[*models.py*](http://models.py)**

import uuid

from django.db import models

from core.models import TimeStampedModel, TenantManager

from churches.models import Church

from branches.models import Branch

from members.models import Member

class Visitor(TimeStampedModel):

church = models.ForeignKey(Church, on\_delete=models.CASCADE,
related\_name="visitors")

branch = models.ForeignKey(Branch, on\_delete=models.CASCADE,
related\_name="visitors")

name = models.CharField(max\_length=200)

email = models.EmailField(blank=True)

phone = models.CharField(max\_length=20, blank=True)

age\_range = models.CharField(max\_length=20, blank=True)

interest\_level = models.PositiveSmallIntegerField(default=1)

wants\_contact = models.BooleanField(default=False)

visit\_reason = models.TextField(blank=True)

converted\_to\_member = models.BooleanField(default=False)

conversion\_date = models.DateField(null=True, blank=True)

member = models.OneToOneField(

Member, null=True, blank=True, on\_delete=models.SET\_NULL,
related\_name="origin\_visitor"

)

registration\_source = models.CharField(max\_length=20,
default="qr\_code")

qr\_code\_used = models.UUIDField(null=True, blank=True)

is\_active = models.BooleanField(default=True)

objects = TenantManager()

class Meta:

ordering = \["-created\_at"\]

def \_\_str\_\_(self):

return self.name

**2.7 activities/[*models.py*](http://models.py)**

from django.db import models

from core.models import TimeStampedModel, TenantManager

from churches.models import Church

from branches.models import Branch

class Activity(TimeStampedModel):

church = models.ForeignKey(Church, on\_delete=models.CASCADE,
related\_name="activities")

branch = models.ForeignKey(Branch, on\_delete=models.CASCADE,
related\_name="activities")

title = models.CharField(max\_length=200)

type = models.CharField(max\_length=50, blank=True)

description = models.TextField(blank=True)

start\_datetime = models.DateTimeField(null=True, blank=True)

end\_datetime = models.DateTimeField(null=True, blank=True)

is\_active = models.BooleanField(default=True)

objects = TenantManager()

class Meta:

ordering = \["-start\_datetime"\]

def \_\_str\_\_(self):

return self.title

**2.8 accounts/models.py — vínculo usuário × igreja**

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

user = models.ForeignKey(User, on\_delete=models.CASCADE,
related\_name="church\_links")

church = models.ForeignKey(Church, on\_delete=models.CASCADE,
related\_name="user\_links")

branch = models.ForeignKey(

Branch, null=True, blank=True, on\_delete=models.SET\_NULL,
related\_name="user\_links"

)

role = models.CharField(max\_length=50, choices=ROLE, default="staff")

class Meta:

unique\_together = ("user", "church")

verbose\_name = "Church User"

verbose\_name\_plural = "Church Users"

def \_\_str\_\_(self):

return f"{self.user} @ {self.church} ({self.role})"

**3. Próximos Passos**
----------------------

1.  **Registrar cada app no INSTALLED\_APPS.\
    > **

**Executar:\
\
python manage.py makemigrations**

**python manage.py migrate**

1.  2.  **Implementar o middleware multi-tenant para povoar
    > request.church/request.branch e aplicar o TenantManager por
    > padrão.\
    > **

3.  **Adicionar tests de restrição de acesso (um tenant não enxerga
    > dados de outro).\
    > **

4.  **Configurar admin.py para facilitar o gerenciamento inicial.\
    > **
