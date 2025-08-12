---
title: '[]{#_8p03o8bxxadd .anchor}Modelo Conceitual — Obreiro Virtual'
---

Documento de referência para a equipe de desenvolvimento.

Representa as entidades centrais e seus relacionamentos, alinhados ao
objetivo de prover uma plataforma **SaaS multi-tenant** para gestão
eclesiástica.

Visão Geral

Denomination ──┐

│1 N

▼

Church ──┐

│1 N

▼

Branch ─────▶ Activity

│

┌─────────┴─────────┐

│ │

▼ ▼

Member Visitor

│ 0..1

▼

Member

-   **Segregação multi-tenant**: todos os registros abaixo de *Church*
    > carregam a coluna church\_id.

-   **Conversão Visitante → Membro**: relacionamento opcional (*0..1*)
    > que referencia o membro criado.

**Entidades Principais**
------------------------

  **Entidade**       **Descrição rápida**                             **Atributos chave ¹**
  ------------------ ------------------------------------------------ --------------------------------------------------------------------
  **Denomination**   Estrutura guarda-chuva para múltiplas igrejas.   id, name, headquarters\_city
  **Church**         Tenant principal.                                id, denomination\_id\*, name, cnpj, subscription\_\*, …
  **Branch**         Filial física/ campus.                           id, church\_id\*, name, address, qr\_code\_token
  **Member**         Pessoa oficialmente membro.                      id, church\_id\*, branch\_id\*, name, membership\_status, …
  **Visitor**        Pessoa visitante (lead).                         id, church\_id\*, branch\_id\*, name, interest\_level, member\_id?
  **Activity**       Evento/agenda ministerial.                       id, church\_id\*, branch\_id\*, title, type, start\_datetime
  **User**           Conta de login (Django).                         id, email, password
  **ChurchUser**     Junção **User × Church** (papéis).               user\_id\*, church\_id\*, branch\_id?, role

¹ *PKs em negrito na base de dados; FK marcadas com **\***; opcionais
=?*.

**Relacionamentos**
-------------------

  **Associação**                  **Cardinalidade**                                                                        **Observações**
  ------------------------------- ---------------------------------------------------------------------------------------- -----------------
  **Denomination 1 — N Church**   Uma denominação possui várias igrejas; igreja pode existir sem denominação (nullable).   
  **Church 1 — N Branch**         Obriga cada filial a pertencer a uma única igreja.                                       
  **Branch 1 — N Member**         Segue visão de campus; membro sempre vinculado a filial.                                 
  **Branch 1 — N Visitor**        Visitantes cadastrados por filial (via QR).                                              
  **Branch 1 — N Activity**       Agenda local.                                                                            
  **Visitor 0..1 — 1 Member**     Conversão opcional; guarda member\_id quando visitante vira membro.                      
  **User N — M Church**           Resolvido por **ChurchUser**; define papéis (owner, admin, staff).                       

**Diagrama ER (Mermaid)**
-------------------------

erDiagram

DENOMINATION ||--o{ CHURCH : "1..N"

CHURCH ||--o{ BRANCH : "1..N"

BRANCH ||--o{ MEMBER : "1..N"

BRANCH ||--o{ VISITOR : "1..N"

BRANCH ||--o{ ACTIVITY : "1..N"

VISITOR }o--|| MEMBER : "0..1"

USER ||--o{ CHURCH\_USER : "1..N"

CHURCH ||--o{ CHURCH\_USER : "1..N"

DENOMINATION {

int id PK

varchar name

varchar headquarters\_city

}

CHURCH {

int id PK

int denomination\_id FK

varchar name

char(18) cnpj

varchar subscription\_plan

timestamp subscription\_expires\_at

}

BRANCH {

int id PK

int church\_id FK

varchar name

uuid qr\_code\_token

}

MEMBER {

int id PK

int church\_id FK

int branch\_id FK

varchar name

date baptism\_date

}

VISITOR {

int id PK

int church\_id FK

int branch\_id FK

int member\_id FK "nullable"

varchar name

smallint interest\_level

}

ACTIVITY {

int id PK

int church\_id FK

int branch\_id FK

varchar title

timestamp start\_datetime

}

USER {

int id PK

varchar email

varchar password

}

CHURCH\_USER {

int user\_id PK, FK

int church\_id PK, FK

int branch\_id FK "nullable"

varchar role

}

**Observações de Design**
-------------------------

1.  **Multi-tenant\
    > ** *Todas* as tabelas fracamente dependentes contêm church\_id →
    > isolamento garantido por middleware/ORM.

2.  **Soft-delete\
    > ** Campos is\_active ou status permitem desativar sem remover.

3.  **Escalabilidade\
    > ** Usar particionamento por church\_id em tabelas de alto volume
    > (*member*, *visitor*) quando necessário.

4.  **Auditoria\
    > ** Recomenda-se SimpleHistory ou tabela audit\_log para rastrear
    > alterações sensíveis.

  **Momento**                       **Entidade criada / ligada**                                                                                                                **Como o vínculo é feito**
  --------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------
  **Inscrição (wizard)**            auth\_user                                                                                                                                  Usuário raiz (owner)
                                    church (igreja-sede)                                                                                                                        church\_user (PK composta user\_id + church\_id) com role='owner'
                                    denomination (opcional)                                                                                                                     Se o usuário marcou “Tenho uma denominação”, a API chama POST /denominations/ e grava denomination\_id dentro da **church-sede**
  **Permissão nível denominação**   • O mesmo church\_user.role pode assumir valores como denomination\_owner ou denomination\_admin **OU**                                     Criar tabela extra denomination\_user (user\_id, denomination\_id, role) se quiser permissões separadas.
  **Acesso multi-church**           Quando o denomination\_owner abre o painel, a consulta exibe **todas** as igrejas onde church.denomination\_id = &lt;sua denominação&gt;.   

> Ou seja, **nenhuma entidade extra** é obrigatória para que o admin
> cadastre a denominação: basta usar a chave estrangeira
> denomination\_id em church e tratar o papel do usuário no campo role.

**Fluxo resumido**
------------------

1.  **Usuário escolhe “Sou denominação”\
    > ** → POST /api/v1/denominations/ (cria Denomination).

2.  Sistema cria **church-sede** já apontando denomination\_id.

3.  **church\_user** liga o usuário à igreja; campo role indica poderes
    > sobre a **denomination** (ex.: denomination\_owner).

4.  Ao adicionar novas igrejas, o admin define denomination\_id igual —
    > herdando o mesmo isolamento multi-tenant para todas.

### **Por que funciona?**

-   O middleware multi-tenant continua filtrando **church\_id**; assim,
    > a denominação nunca “vaza” dados entre tenants.

-   Se precisar de **escopo mais amplo** (ex.: relatórios agregados de
    > todas as igrejas da denominação), basta autorizar endpoints que
    > aceitam filtro denomination\_id somente para usuários com role
    > adequado.
