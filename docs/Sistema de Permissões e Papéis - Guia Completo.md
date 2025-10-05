# Documentação Completa: Sistema de Permissões e Papéis - Obreiro Virtual

## Visão Geral

O **Obreiro Virtual** é uma plataforma SaaS multi-tenant para gestão eclesiástica que implementa um sistema hierárquico de permissões baseado em papéis. Esta documentação descreve como os diferentes níveis de usuário interagem com o sistema e como as permissões são aplicadas para garantir segurança e isolamento de dados.

## Arquitetura Multi-Tenant

O sistema segue uma arquitetura multi-tenant onde:
- **Cada igreja é um tenant independente** com dados completamente isolados
- **Denominações** podem agrupar múltiplas igrejas sob uma administração comum
- **Filiais** são unidades físicas de uma igreja
- **Usuários** podem ter diferentes papéis em diferentes contextos

---

## Hierarquia de Papéis

### 1. **SuperUser (Django Admin) / Platform Admin**
- **Escopo**: Sistema completo (toda a plataforma SaaS)
- **Descrição**: Administrador técnico da plataforma - EXCLUSIVO para desenvolvedores/donos
- **Acesso**: Irrestrito a todos os dados e funcionalidades
- **Uso**: Manutenção técnica, suporte, configurações globais, dashboard de faturamento
- **⚠️ IMPORTANTE**: Este papel **NUNCA** pode ser atribuído via cadastro normal da aplicação

### 2. **Church Admin (Administrador da Igreja/Igrejas dentro do Sistema)**
- **Escopo**: Todas as igrejas de uma denominação ou igreja específica
- **Descrição**: Usuário que criou e paga pela conta da denominação/igreja
- **Acesso**: Gestão completa de todas as igrejas sob sua denominação (se aplicável) ou da igreja específica
- **Responsabilidades**:
  - Criar e gerenciar igrejas (no caso de denominações)
  - Gerenciar membros e visitantes
  - Criar e administrar filiais
  - Definir líderes e responsáveis (Branch Managers)
  - Configurar atividades e ministérios
  - Visão consolidada de relatórios
  - Gerenciar assinaturas e pagamentos
- **Nota**: Este papel **substitui** o antigo `DENOMINATION_ADMIN`, centralizando a administração de igrejas

### 3. **Branch Manager (Gestor de Filial)**
- **Escopo**: Filiais específicas atribuídas
- **Descrição**: Responsável por uma ou mais filiais específicas
- **Acesso**: Gestão limitada às filiais designadas
- **Responsabilidades**:
  - Gerenciar membros da filial
  - Acompanhar visitantes
  - Organizar atividades locais
  - Relatórios da filial

### 4. **Member User (Usuário Membro)**
- **Escopo**: Dados da própria igreja
- **Descrição**: Membro comum com acesso ao sistema
- **Acesso**: Visualização de dados gerais da igreja
- **Responsabilidades**:
  - Visualizar informações da igreja
  - Acessar calendário de atividades
  - Atualizar dados pessoais

### 5. **Visitor (Visitante)**
- **Escopo**: Dados próprios e atividades públicas
- **Descrição**: Pessoa que visitou a igreja via QR Code
- **Acesso**: Muito limitado, apenas dados próprios
- **Responsabilidades**:
  - Visualizar informações básicas da igreja
  - Receber comunicações direcionadas
  - Candidato à conversão para membro

---

## Sistema de Permissões

### Classes de Permissão Implementadas

#### `IsSuperUser`
```python
class IsSuperUser(BasePermission):
    """Permite acesso apenas a superusuários do Django."""
```
- **Uso**: Endpoints administrativos da plataforma
- **Verificação**: `request.user.is_superuser`
- **Aplicação**: Configurações globais, manutenção técnica

#### `IsPlatformAdmin`
```python
class IsPlatformAdmin(BasePermission):
    """Permite acesso a administradores da plataforma SaaS."""
```
- **Uso**: Dashboard de faturamento, gestão de clientes, estatísticas globais
- **Verificação**: `is_superuser` OU role `SUPER_ADMIN`
- **Aplicação**: Endpoints de administração da plataforma SaaS

#### `IsChurchAdmin`
```python
class IsChurchAdmin(BasePermission):
    """Permite acesso a administradores de igreja(s)."""
```
- **Uso**: Gestão completa de uma ou múltiplas igrejas (dependendo do contexto)
- **Verificação**: Role `CHURCH_ADMIN` na igreja do objeto
- **Aplicação**: CRUD de membros, filiais, atividades, gestão de múltiplas igrejas
- **Nota**: **Substitui** o antigo `IsDenominationAdmin`, centralizando toda gestão de igrejas

#### `IsBranchManager`
```python
class IsBranchManager(BasePermission):
    """Permite acesso a gestores de filiais específicas."""
```
- **Uso**: Gestão de filiais designadas
- **Verificação**: Permissão `can_manage_branches` + filial em `managed_branches`
- **Aplicação**: CRUD de dados específicos da filial

#### `IsMemberUser`
```python
class IsMemberUser(BasePermission):
    """Permite acesso a membros da igreja."""
```
- **Uso**: Visualização de dados da igreja
- **Verificação**: Existência de ChurchUser ativo
- **Aplicação**: Endpoints de leitura, dados gerais

---

## Papéis Funcionais vs. Papéis de Sistema

### Papéis de Sistema (Permissões)
Controlam **o que o usuário pode fazer no sistema**:
- `SUPER_ADMIN` - Administrador da plataforma (desenvolvedores/donos)
- `CHURCH_ADMIN` - Administrador de igreja(s) e denominação
- `PASTOR` - Pastor com permissões específicas
- `SECRETARY` - Secretário com permissões administrativas limitadas
- `LEADER` - Líder de ministério ou departamento
- `MEMBER` - Membro comum

### Papéis Funcionais (Ministeriais)
Descrevem **a função na igreja** (campo `ministerial_function` no modelo Member):
- `pastor` - Pastor
- `deacon` - Diácono
- `elder` - Presbítero
- `evangelist` - Evangelista
- `missionary` - Missionário
- `leader` - Líder de ministério
- `member` - Membro comum

**Importante**: Um usuário pode ser `MEMBER` no sistema (permissões limitadas) mas ter função ministerial de `pastor` (papel na igreja).

---

## Fluxo: Visitante → Membro

### 1. **Registro como Visitante**
```python
# Via QR Code da filial
visitor = Visitor.objects.create(
    church=branch.church,
    branch=branch,
    full_name="João Silva",
    email="joao@email.com",
    phone="(11) 99999-9999",
    status='approved'
)
```

### 2. **Acompanhamento e Follow-up**
```python
# Sistema de follow-up automático
visitor.schedule_follow_up(days_from_now=7, notes="Primeira visita")
visitor.register_contact('whatsapp', 'Contatado via WhatsApp')
```

### 3. **Conversão para Membro**
```python
# Quando visitante decide se tornar membro
member = visitor.convert_to_member(
    member_data={
        'ministerial_function': 'member',
        'baptism_date': date.today(),
        'membership_date': date.today()
    },
    notes="Convertido após 3 visitas"
)
```

### 4. **Criação de Usuário do Sistema (Opcional)**
```python
# Se o membro precisar de acesso ao sistema
user = CustomUser.objects.create_user(
    email=member.email,
    full_name=member.full_name,
    phone=member.phone
)

# Vincular membro ao usuário
member.user = user
member.save()

# Criar vínculo com a igreja
ChurchUser.objects.create(
    user=user,
    church=member.church,
    role=RoleChoices.MEMBER  # Papel básico
)
```

---

## Guia de Aplicação nas Views

### Padrão Básico
```python
from apps.core.permissions import IsChurchAdmin, IsMemberUser

class ExampleViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
```

### Exemplos Específicos

#### 1. **Gestão de Membros**
```python
class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    
    def get_queryset(self):
        # Filtrar apenas membros da igreja do usuário
        church = self.get_user_church()
        return Member.objects.filter(church=church)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Apenas admins podem modificar membros
            permission_classes = [IsChurchAdmin]
        else:
            # Qualquer membro pode ver a lista
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
    
    def get_user_church(self):
        """Método auxiliar para obter a igreja do usuário"""
        return self.request.user.church_users.first().church
```

#### 2. **Gestão de Igrejas (Church Admin com Múltiplas Igrejas)**
```python
class ChurchViewSet(viewsets.ModelViewSet):
    serializer_class = ChurchSerializer
    permission_classes = [IsChurchAdmin]
    
    def get_queryset(self):
        # Church Admin pode gerenciar múltiplas igrejas da sua denominação
        user = self.request.user
        
        # Buscar todas as igrejas onde o usuário é CHURCH_ADMIN
        church_admins = user.church_users.filter(role=RoleChoices.CHURCH_ADMIN)
        
        # Se tem denominação, retorna todas as igrejas da denominação
        churches_with_denomination = Church.objects.filter(
            denomination__in=church_admins.values_list('church__denomination', flat=True)
        ).distinct()
        
        # Senão, retorna apenas a igreja específica
        return churches_with_denomination | Church.objects.filter(
            id__in=church_admins.values_list('church_id', flat=True)
        ).distinct()
    
    def perform_create(self, serializer):
        # Associar nova igreja à denominação do Church Admin
        user_church = self.request.user.church_users.filter(
            role=RoleChoices.CHURCH_ADMIN
        ).first().church
        
        if user_church.denomination:
            serializer.save(denomination=user_church.denomination)
        else:
            serializer.save()
```

#### 3. **Gestão de Filiais**
```python
class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    
    def get_queryset(self):
        church = self.get_user_church()
        queryset = Branch.objects.filter(church=church)
        
        # Se não é admin da igreja, filtrar apenas filiais gerenciadas
        church_user = self.request.user.church_users.get(church=church)
        if church_user.role != RoleChoices.CHURCH_ADMIN:
            if church_user.can_manage_branches:
                queryset = queryset.filter(
                    id__in=church_user.managed_branches.values_list('id', flat=True)
                )
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['create']:
            # Apenas admins podem criar filiais
            permission_classes = [IsChurchAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Admins ou gestores específicos podem editar
            permission_classes = [IsChurchAdmin | IsBranchManager]
        else:
            # Qualquer membro pode ver filiais
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
```

#### 4. **Gestão de Visitantes**
```python
class VisitorViewSet(viewsets.ModelViewSet):
    serializer_class = VisitorSerializer
    
    def get_queryset(self):
        church = self.get_user_church()
        queryset = Visitor.objects.filter(church=church)
        
        # Filtrar por filiais se usuário não é admin
        church_user = self.request.user.church_users.get(church=church)
        if church_user.role != RoleChoices.CHURCH_ADMIN:
            if church_user.can_manage_visitors:
                managed_branches = church_user.managed_branches.all()
                queryset = queryset.filter(branch__in=managed_branches)
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            # Usuários com permissão de gerenciar visitantes
            permission_classes = [CanManageVisitors]
        elif self.action == 'destroy':
            # Apenas admins podem deletar visitantes
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
```

### Permissões Customizadas Específicas

```python
class CanManageVisitors(BasePermission):
    """Verifica se pode gerenciar visitantes"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        church = view.get_user_church()
        try:
            church_user = request.user.church_users.get(church=church)
            return church_user.can_manage_visitors
        except:
            return False

class CanManageActivities(BasePermission):
    """Verifica se pode gerenciar atividades"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        church = view.get_user_church()
        try:
            church_user = request.user.church_users.get(church=church)
            return church_user.can_manage_activities
        except:
            return False
```

---

## Melhores Práticas

### 1. **Sempre Verificar Contexto da Igreja**
```python
def get_user_church(self):
    """Método padrão para obter igreja do usuário"""
    return self.request.user.church_users.first().church
```

### 2. **Usar Permissões Compostas**
```python
# Combinar permissões com OR
permission_classes = [IsChurchAdmin | IsBranchManager]

# Combinar com AND (usando múltiplas classes)
permission_classes = [IsMemberUser, CanManageMembers]
```

### 3. **Filtrar QuerySets por Contexto**
```python
def get_queryset(self):
    # Sempre filtrar pela igreja do usuário
    church = self.get_user_church()
    return MyModel.objects.filter(church=church)
```

### 4. **Tratar Exceções de Permissão**
```python
def get_permissions(self):
    try:
        # Lógica de permissão
        pass
    except AttributeError:
        # Fallback para permissão mais restritiva
        permission_classes = [IsSuperUser]
    return [permission() for permission in permission_classes]
```

---

## Casos de Uso Comuns

### 1. **Dashboard do Church Admin**
- Ver estatísticas de todas as igrejas (se gerencia múltiplas) ou da igreja específica
- Criar novas igrejas (se gerencia denominação)
- Designar gestores de filiais (Branch Managers)
- Gerenciar membros, visitantes e atividades
- Criar e configurar filiais
- Relatórios consolidados e individuais
- Gerenciar assinaturas e pagamentos

### 2. **Dashboard do Branch Manager**
- Acompanhar visitantes da filial
- Gerenciar atividades locais
- Relatórios de conversão
- Follow-up de visitantes

### 3. **Área do Member User**
- Ver informações da igreja
- Atualizar dados pessoais
- Acessar calendário de atividades
- Receber comunicações

---

## Considerações de Segurança

### 1. **Proteção do Papel SUPER_ADMIN**
- **NUNCA** pode ser atribuído via cadastro normal da aplicação
- Validações implementadas em múltiplas camadas:
  - Serializers (`UserCompleteRegistrationSerializer`, `ChurchUserCreateSerializer`)
  - Modelo (`ChurchUser.save()`)
  - Permissões (`IsPlatformAdmin`)
- Apenas desenvolvedores/donos da plataforma devem ter este papel
- Usado exclusivamente para administração da plataforma SaaS

#### **Como Criar um Administrador da Plataforma**

O papel `SUPER_ADMIN` **só pode ser criado** através do comando de gerenciamento Django:

```bash
# Comando básico (senha será solicitada interativamente)
python manage.py create_platform_admin \
  --email admin@obreirovirtual.com \
  --name "Admin Principal"

# Comando completo com todos os parâmetros
python manage.py create_platform_admin \
  --email admin@obreirovirtual.com \
  --name "Admin Principal" \
  --phone "(11) 99999-9999" \
  --password "senha_segura_aqui"
```

**Parâmetros disponíveis:**
- `--email` (obrigatório): E-mail do administrador
- `--name` (obrigatório): Nome completo do administrador  
- `--phone` (opcional): Telefone do administrador
- `--password` (opcional): Senha (se não fornecida, será solicitada)

**O que o comando faz:**
1. Cria um usuário Django com `is_superuser=True`
2. Cria uma "igreja administrativa" para vincular o usuário
3. Cria um `ChurchUser` com papel `SUPER_ADMIN`
4. Configura todas as permissões administrativas

⚠️ **IMPORTANTE**: Use este comando apenas para criar administradores legítimos da plataforma!

### 2. **Isolamento de Dados**
- Cada igreja é um tenant isolado
- Middleware aplica filtros automáticos
- Permissões verificam contexto da igreja

### 3. **Validação de Acesso**
- Sempre verificar se usuário pertence à igreja
- Validar permissões específicas para cada ação
- Logs de auditoria para ações sensíveis

### 4. **Tratamento de Erros**
- Retornar 403 para permissões negadas
- Retornar 404 para recursos inexistentes
- Não vazar informações sobre estrutura

---

## Estrutura de Arquivos

### Modelos Principais
- `apps/accounts/models.py` - CustomUser, ChurchUser, UserProfile
- `apps/denominations/models.py` - Denomination
- `apps/churches/models.py` - Church
- `apps/branches/models.py` - Branch
- `apps/members/models.py` - Member
- `apps/visitors/models.py` - Visitor

### Permissões
- `apps/core/permissions.py` - Classes de permissão customizadas
- `apps/core/models.py` - RoleChoices, BaseModel, TenantManager

### Views (Exemplo de Implementação)
- `apps/members/views.py` - MemberViewSet
- `apps/churches/views.py` - ChurchViewSet
- `apps/branches/views.py` - BranchViewSet
- `apps/visitors/views.py` - VisitorViewSet

### Comandos de Gerenciamento
- `apps/accounts/management/commands/create_platform_admin.py` - Criar administradores da plataforma

---

## Comandos de Gerenciamento Disponíveis

### `create_platform_admin`
Comando para criar administradores da plataforma com papel `SUPER_ADMIN`.

**Localização:** `backend/apps/accounts/management/commands/create_platform_admin.py`

**Uso:**
```bash
python manage.py create_platform_admin --email <email> --name <nome> [opções]
```

**Exemplos práticos:**
```bash
# Desenvolvimento local
python manage.py create_platform_admin \
  --email dev@obreirovirtual.com \
  --name "Desenvolvedor Principal"

# Produção
python manage.py create_platform_admin \
  --email admin@obreirovirtual.com \
  --name "Administrador Produção" \
  --phone "(11) 99999-9999"
```

**Validações implementadas:**
- Verifica se o email já existe
- Solicita confirmação de senha
- Cria estrutura completa (usuário + igreja administrativa + permissões)
- Configura automaticamente como `is_superuser=True`

---


Esta documentação serve como guia completo para implementar e manter o sistema de permissões do Obreiro Virtual, garantindo segurança, escalabilidade e facilidade de manutenção. 
