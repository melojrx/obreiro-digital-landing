---
title: |
    []{#_wiaxvn3fi7xn .anchor}Modelo Lógico — Obreiro Virtual (orientado a
    Django)
---

> Estrutura relacional **normalizada (3FN)** a ser implementada no
> PostgreSQL pela camada ORM do Django.\
> Chaves primárias (PK) em **negrito**, chaves estrangeiras (FK)
> indicadas com *asterisco*.

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**   **Tabela**                          **Colunas (tipo lógico)**                                          **Observações / Mapeamento Django**
  -------- ----------------------------------- ------------------------------------------------------------------ ----------------------------------------------------------------------------------------------------------------
  1        **denomination**                    **id** (int, auto)                                                 models.Model simples.
                                                                                                                  
                                               name (varchar 200)                                                 
                                                                                                                  
                                               headquarters\_city (varchar 100)                                   
                                                                                                                  
                                               created\_at (timestamp)                                            

  2        **church**                          **id** (int, auto)                                                 FK → Denomination, on\_delete=models.SET\_NULL (nullable para igreja independente).
                                                                                                                  
                                               denomination\_id\* (int)                                           
                                                                                                                  
                                               name (varchar 200)                                                 
                                                                                                                  
                                               cnpj (char 18, unique)                                             
                                                                                                                  
                                               email (varchar 254)                                                
                                                                                                                  
                                               phone (varchar 20)                                                 
                                                                                                                  
                                               subscription\_plan (varchar 50)                                    
                                                                                                                  
                                               subscription\_status (varchar 20)                                  
                                                                                                                  
                                               subscription\_expires\_at (timestamp)                              
                                                                                                                  
                                               max\_members (int, default 500)                                    
                                                                                                                  
                                               max\_branches (int, default 3)                                     
                                                                                                                  
                                               features\_enabled (json)                                           
                                                                                                                  
                                               is\_active (bool)                                                  
                                                                                                                  
                                               created\_at, updated\_at (timestamp)                               

  3        **branch**                          **id** (int, auto)                                                 FK → Church, CASCADE.
                                                                                                                  
                                               church\_id\* (int)                                                 
                                                                                                                  
                                               name (varchar 200)                                                 
                                                                                                                  
                                               address (text)                                                     
                                                                                                                  
                                               pastor\_responsible (varchar 200)                                  
                                                                                                                  
                                               qr\_code\_token (uuid, unique)                                     
                                                                                                                  
                                               qr\_code\_active (bool)                                            
                                                                                                                  
                                               visitor\_count (int)                                               
                                                                                                                  
                                               member\_count (int)                                                
                                                                                                                  
                                               is\_active (bool)                                                  
                                                                                                                  
                                               created\_at (timestamp)                                            

  4        **member**                          **id** (int, auto)                                                 FK → Church, Branch (ambos CASCADE).
                                                                                                                  
                                               church\_id\* (int)                                                 
                                                                                                                  
                                               branch\_id\* (int)                                                 
                                                                                                                  
                                               name (varchar 200)                                                 
                                                                                                                  
                                               email (varchar 254)                                                
                                                                                                                  
                                               phone (varchar 20)                                                 
                                                                                                                  
                                               birth\_date (date)                                                 
                                                                                                                  
                                               gender (char 1)                                                    
                                                                                                                  
                                               address (text) + neighborhood / city / state / zipcode (varchar)   
                                                                                                                  
                                               baptism\_date (date)                                               
                                                                                                                  
                                               conversion\_date (date)                                            
                                                                                                                  
                                               membership\_status (varchar 20)                                    
                                                                                                                  
                                               ministerial\_function (varchar 100)                                
                                                                                                                  
                                               origin (varchar 50)                                                
                                                                                                                  
                                               converted\_from\_visitor (bool)                                    
                                                                                                                  
                                               created\_at, updated\_at                                           

  5        **visitor**                         **id** (int, auto)                                                 FK → Member (nullable).
                                                                                                                  
                                               church\_id\* (int)                                                 
                                                                                                                  
                                               branch\_id\* (int)                                                 
                                                                                                                  
                                               name (varchar 200)                                                 
                                                                                                                  
                                               email (varchar 254)                                                
                                                                                                                  
                                               phone (varchar 20)                                                 
                                                                                                                  
                                               age\_range (varchar 20)                                            
                                                                                                                  
                                               interest\_level (smallint)                                         
                                                                                                                  
                                               wants\_contact (bool)                                              
                                                                                                                  
                                               visit\_reason (text)                                               
                                                                                                                  
                                               converted\_to\_member (bool)                                       
                                                                                                                  
                                               conversion\_date (date)                                            
                                                                                                                  
                                               member\_id\* (int, nullable)                                       
                                                                                                                  
                                               registration\_source (varchar 20)                                  
                                                                                                                  
                                               qr\_code\_used (uuid, nullable)                                    
                                                                                                                  
                                               created\_at (timestamp)                                            

  6        **activity**                        **id** (int, auto)                                                 Eventos / agendas.
                                                                                                                  
                                               church\_id\* (int)                                                 
                                                                                                                  
                                               branch\_id\* (int)                                                 
                                                                                                                  
                                               title (varchar 200)                                                
                                                                                                                  
                                               type (varchar 50)                                                  
                                                                                                                  
                                               description (text)                                                 
                                                                                                                  
                                               start\_datetime / end\_datetime (timestamp)                        
                                                                                                                  
                                               created\_at (timestamp)                                            

  7        **auth\_user**                      (padrão Django)                                                    Gerado por django.contrib.auth.

  8        **church\_user**                    **user\_id**\* (int)                                               **PK composta** (user\_id, church\_id). Permite que um mesmo login acesse vários tenants com papéis distintos.
                                                                                                                  
                                               **church\_id**\* (int)                                             
                                                                                                                  
                                               branch\_id\* (int, nullable)                                       
                                                                                                                  
                                               role (varchar 50)                                                  

  9        (opcional) **denomination\_user**   **user\_id**\*                                                     Só se precisar de permissões específicas no nível de denominação.
                                                                                                                  
                                               **denomination\_id**\*                                             
                                                                                                                  
                                               role (varchar 50)                                                  
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Notas de implementação no Django**
------------------------------------

  **Tema**                  **Prática recomendada**
  ------------------------- --------------------------------------------------------------------------------------------------------------------------
  **Chaves**                Use models.BigAutoField para PKs (DEFAULT\_AUTO\_FIELD).
  **FK multi-tenant**       Adicione db\_index=True em todas as FK que incluem church\_id para acelerar filtros do middleware.
  **JSON & UUID**           models.JSONField (PostgreSQL) e models.UUIDField(default=uuid.uuid4, editable=False).
  **Status / Choices**      Utilize TextChoices para subscription\_status, membership\_status, gender, etc.
  **Soft-delete**           Campos is\_active + managers customizados (objects = ActiveManager()), evitando deletar fisicamente.
  **Signals / Celery**      post\_save para atualizar contadores; delegar e-mails e KPIs a tasks Celery.
  **Partitioning futuro**   Avalie django-postgres-extra ou migração manual para particionar member/visitor por church\_id quando &gt;10⁶ registros.

Exemplo condensado de Model Django (Branch)

class Branch(models.Model):

church = models.ForeignKey(

"Church",

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

created\_at = models.DateTimeField(auto\_now\_add=True)

class Meta:

unique\_together = ("church", "name")

ordering = \["name"\]

def \_\_str\_\_(self):

return f"{self.name} • {self.church}"

Este **modelo lógico** serve como blueprint para gerar:

1.  **Migrations Django** (python manage.py makemigrations).

2.  **Documentação arquivável** na pasta /docs/modelo\_logico.md.

Com ele, a equipe mantém coerência entre design conceitual e
implementação real no ORM do Django.
