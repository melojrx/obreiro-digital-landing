# Documentação Completa: Sistema de Permissões e Papéis - Obreiro Virtual

**Versão:** 2.0 - Simplificada  
**Data:** Outubro 2025  
**Autor:** Júnior Melo

## Visão Geral

O **Obreiro Virtual** é uma plataforma SaaS multi-tenant para gestão eclesiástica que implementa um sistema hierárquico de permissões baseado em papéis. Esta documentação descreve como os diferentes níveis de usuário interagem com o sistema e como as permissões são aplicadas para garantir segurança e isolamento de dados.

## Arquitetura Multi-Tenant

O sistema segue uma arquitetura multi-tenant onde:
- **Cada igreja é um tenant independente** com dados completamente isolados
- **Denominações** podem agrupar múltiplas igrejas sob uma administração comum
- **Filiais (Branches)** são unidades físicas de uma igreja (Matriz e Congregações)
- **Usuários** podem ter diferentes papéis em diferentes contextos

---

## Hierarquia de Papéis (Simplificada)

### Níveis Hierárquicos

```
SUPER_ADMIN (Nível 4)         ← Desenvolvedores da plataforma
    ↓
DENOMINATION_ADMIN (Nível 3)  ← Administra múltiplas igrejas
    ↓
CHURCH_ADMIN (Nível 2)         ← Administra igreja específica (Matriz e Filiais)
    ↓
SECRETARY (Nível 1)            ← Gestão de cadastros (CRUD) de Membros e Visitantes
```

---

## Descrição Detalhada dos Papéis

### 1. **SUPER_ADMIN (Nível 4)**

**Papel:** Administrador da Plataforma SaaS

- **Escopo**: Sistema completo (toda a plataforma)
- **Descrição**: Administrador técnico da plataforma - EXCLUSIVO para desenvolvedores/donos
- **Acesso**: Irrestrito a todos os dados e funcionalidades
- **Contexto**: Transversal - acessa todas as denominações e igrejas

**Responsabilidades:**
- ✅ Manutenção técnica da plataforma
- ✅ Suporte técnico avançado
- ✅ Configurações globais do sistema
- ✅ Dashboard de faturamento e métricas SaaS
- ✅ Gestão de planos e assinaturas
- ✅ Auditoria de segurança

**⚠️ IMPORTANTE:** 
- Este papel **NUNCA** pode ser atribuído via cadastro normal da aplicação
- Só pode ser criado via comando de gerenciamento Django
- Possui `is_superuser=True` no Django

---

### 2. **DENOMINATION_ADMIN (Nível 3)**

**Papel:** Administrador de Denominação

- **Escopo**: Todas as igrejas de uma denominação específica
- **Descrição**: Usuário que criou e gerencia a conta da denominação
- **Acesso**: Gestão completa de todas as igrejas sob sua denominação
- **Contexto**: Múltiplas igrejas dentro da mesma denominação

**Responsabilidades:**
- ✅ Criar e gerenciar igrejas da denominação
- ✅ Definir CHURCH_ADMIN para cada igreja
- ✅ Visão consolidada de relatórios de todas as igrejas
- ✅ Gerenciar assinaturas e pagamentos da denominação
- ✅ Configurações globais da denominação
- ✅ Estatísticas e KPIs consolidados

**Permissões Específicas:**
- Acesso de leitura/escrita em todas as igrejas da denominação
- Criar novas igrejas
- Designar administradores de igreja
- Transferir membros entre igrejas da denominação

**Limitações:**
- ❌ Não acessa igrejas de outras denominações
- ❌ Não acessa funcionalidades da plataforma SaaS

---

### 3. **CHURCH_ADMIN (Nível 2)**

**Papel:** Administrador de Igreja

- **Escopo**: Uma igreja específica (Matriz) e todas as suas filiais (Congregações)
- **Descrição**: Administrador designado para gerenciar uma igreja completa
- **Acesso**: Gestão completa da igreja matriz e todas as filiais
- **Contexto**: Igreja específica + todas as branches

**Responsabilidades:**
- ✅ Gerenciar membros (CRUD completo)
- ✅ Gerenciar visitantes (CRUD completo)
- ✅ Criar e administrar filiais (branches)
- ✅ Configurar atividades e ministérios
- ✅ Gerar e gerenciar QR Codes das filiais
- ✅ Relatórios completos da igreja e filiais
- ✅ Configurações da igreja
- ✅ Designar SECRETARY para auxiliar na gestão

**Permissões Específicas:**
- Acesso total aos dados da igreja matriz
- Acesso total aos dados de todas as filiais
- Criar/editar/excluir membros em qualquer filial
- Criar/editar/excluir visitantes de qualquer filial
- Gerenciar estrutura de filiais
- Converter visitantes em membros

**Limitações:**
- ❌ Não acessa dados de outras igrejas
- ❌ Não pode criar novas igrejas
- ❌ Não gerencia configurações da denominação

---

### 4. **SECRETARY (Nível 1)**

**Papel:** Secretário(a) da Igreja

- **Escopo**: Filiais (branches) específicas atribuídas
- **Descrição**: Responsável pela gestão de cadastros de membros e visitantes
- **Acesso**: CRUD de membros e visitantes nas filiais designadas
- **Contexto**: Uma ou mais branches específicas

**Responsabilidades:**
- ✅ Cadastrar novos membros
- ✅ Atualizar dados de membros
- ✅ Cadastrar visitantes manualmente
- ✅ Atualizar dados de visitantes
- ✅ Fazer follow-up de visitantes
- ✅ Converter visitantes em membros
- ✅ Visualizar relatórios das filiais designadas
- ✅ Gerar listas e relatórios básicos

**Permissões Específicas:**
- CRUD completo de membros nas branches atribuídas
- CRUD completo de visitantes nas branches atribuídas
- Visualizar dados de membros e visitantes
- Exportar listas de membros/visitantes
- Registrar atividades de follow-up

**Limitações:**
- ❌ Não pode criar ou gerenciar filiais
- ❌ Não acessa branches não atribuídas
- ❌ Não pode gerar ou regenerar QR Codes
- ❌ Não acessa configurações da igreja
- ❌ Não pode excluir membros/visitantes (apenas inativar)
- ❌ Não acessa relatórios consolidados da igreja
- ❌ Não pode designar outros usuários

---

## Sistema de Permissões

### Classes de Permissão Implementadas

#### `IsSuperUser`
```python
class IsSuperUser(BasePermission):
    """
    Permite acesso apenas a superusuários do Django.
    Usado para endpoints administrativos da plataforma.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser
```
- **Verificação**: `request.user.is_superuser`
- **Aplicação**: Configurações globais, manutenção técnica, admin da plataforma

#### `IsDenominationAdmin`
```python
class IsDenominationAdmin(BasePermission):
    """
    Permite acesso a administradores de denominação.
    Verifica se usuário tem role DENOMINATION_ADMIN em qualquer igreja.
    """
    def has_permission(self, request, view):
        return request.user.church_users.filter(
            role='DENOMINATION_ADMIN'
        ).exists()
```
- **Verificação**: Role `DENOMINATION_ADMIN` em qualquer ChurchUser
- **Aplicação**: CRUD de igrejas, relatórios consolidados da denominação

#### `IsChurchAdmin`
```python
class IsChurchAdmin(BasePermission):
    """
    Permite acesso a administradores de igreja específica.
    Aceita também DENOMINATION_ADMIN como hierarquia superior.
    """
    def has_permission(self, request, view):
        return request.user.church_users.filter(
            role__in=['CHURCH_ADMIN', 'DENOMINATION_ADMIN']
        ).exists()
    
    def has_object_permission(self, request, view, obj):
        user_church = request.user.church_users.first().church
        return obj.church == user_church
```
- **Verificação**: Role `CHURCH_ADMIN` ou `DENOMINATION_ADMIN` na igreja do objeto
- **Aplicação**: CRUD de membros, visitantes, filiais, atividades

#### `IsSecretary`
```python
class IsSecretary(BasePermission):
    """
    Permite acesso a secretários com contexto de filiais específicas.
    Verifica se pode gerenciar membros/visitantes nas branches atribuídas.
    """
    def has_permission(self, request, view):
        church_user = request.user.church_users.first()
        if not church_user:
            return False
        
        # Admins superiores também têm permissão
        if church_user.role in ['SUPER_ADMIN', 'DENOMINATION_ADMIN', 'CHURCH_ADMIN']:
            return True
        
        # Secretário precisa ter as permissões específicas
        if church_user.role == 'SECRETARY':
            return church_user.can_manage_members and church_user.can_manage_visitors
        
        return False
    
    def has_object_permission(self, request, view, obj):
        church_user = request.user.church_users.first()
        
        # Admins têm acesso total
        if church_user.role in ['CHURCH_ADMIN', 'DENOMINATION_ADMIN']:
            return True
        
        # Secretário só acessa objetos das branches atribuídas
        if church_user.role == 'SECRETARY':
            if hasattr(obj, 'branch'):
                return obj.branch in church_user.managed_branches.all()
        
        return False
```
- **Verificação**: Role `SECRETARY` + permissões específicas + contexto de branch
- **Aplicação**: CRUD de membros e visitantes em branches específicas

---

## Flags de Permissão no Modelo ChurchUser

O modelo `ChurchUser` possui campos booleanos que controlam permissões específicas:

```python
class ChurchUser(models.Model):
    """Vínculo entre User e Church com role e permissões"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='church_users')
    church = models.ForeignKey('churches.Church', on_delete=models.CASCADE)
    role = models.CharField(max_length=30, choices=RoleChoices.choices)
    
    # Flags de permissão específicas
    can_manage_members = models.BooleanField(default=False)
    can_manage_visitors = models.BooleanField(default=False)
    can_manage_branches = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    
    # Contexto de branches para SECRETARY
    managed_branches = models.ManyToManyField('branches.Branch', blank=True)
    
    is_active = models.BooleanField(default=True)
```

### Configuração Automática de Flags por Role

```python
def save(self, *args, **kwargs):
    """Configura flags automaticamente baseado no role"""
    
    if self.role == 'SUPER_ADMIN':
        self.can_manage_members = True
        self.can_manage_visitors = True
        self.can_manage_branches = True
        self.can_view_reports = True
    
    elif self.role == 'DENOMINATION_ADMIN':
        self.can_manage_members = True
        self.can_manage_visitors = True
        self.can_manage_branches = True
        self.can_view_reports = True
    
    elif self.role == 'CHURCH_ADMIN':
        self.can_manage_members = True
        self.can_manage_visitors = True
        self.can_manage_branches = True
        self.can_view_reports = True
    
    elif self.role == 'SECRETARY':
        self.can_manage_members = True
        self.can_manage_visitors = True
        self.can_manage_branches = False  # Não gerencia branches
        self.can_view_reports = True      # Apenas das branches atribuídas
    
    super().save(*args, **kwargs)
```

---

## Guia de Aplicação nas Views

### Padrão para ViewSets

```python
from apps.core.permissions import (
    IsChurchAdmin, 
    IsDenominationAdmin,
    IsSecretary
)

class BaseChurchViewSet(viewsets.ModelViewSet):
    """Base ViewSet com lógica comum de permissões e queryset"""
    
    def get_queryset(self):
        """Filtra automaticamente por contexto do usuário"""
        user = self.request.user
        church_user = user.church_users.first()
        
        if not church_user:
            return self.model.objects.none()
        
        # SUPER_ADMIN vê tudo (para manutenção)
        if user.is_superuser:
            return self.model.objects.all()
        
        # DENOMINATION_ADMIN vê todas as igrejas da denominação
        if church_user.role == 'DENOMINATION_ADMIN':
            return self.model.objects.filter(
                church__denomination=church_user.church.denomination
            )
        
        # CHURCH_ADMIN vê toda a igreja e filiais
        if church_user.role == 'CHURCH_ADMIN':
            return self.model.objects.filter(
                church=church_user.church
            )
        
        # SECRETARY vê apenas branches atribuídas
        if church_user.role == 'SECRETARY':
            managed_branches = church_user.managed_branches.all()
            return self.model.objects.filter(
                branch__in=managed_branches
            )
        
        return self.model.objects.none()
```

### Exemplo 1: Gestão de Membros

```python
class MemberViewSet(BaseChurchViewSet):
    """ViewSet para gestão de membros"""
    serializer_class = MemberSerializer
    model = Member
    filterset_class = MemberFilterSet
    
    def get_permissions(self):
        """Permissões por ação"""
        
        # Criar membro: CHURCH_ADMIN ou SECRETARY
        if self.action == 'create':
            permission_classes = [IsAuthenticated, IsChurchAdmin | IsSecretary]
        
        # Atualizar membro: CHURCH_ADMIN ou SECRETARY
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsChurchAdmin | IsSecretary]
        
        # Deletar membro: Apenas CHURCH_ADMIN (SECRETARY não pode)
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsChurchAdmin]
        
        # Listar e visualizar: Todos autenticados com contexto
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Define church e branch automaticamente na criação"""
        church_user = self.request.user.church_users.first()
        
        # Se SECRETARY, usa a primeira branch atribuída
        if church_user.role == 'SECRETARY':
            branch = church_user.managed_branches.first()
            serializer.save(
                church=church_user.church,
                branch=branch
            )
        else:
            serializer.save(church=church_user.church)
```

### Exemplo 2: Gestão de Visitantes

```python
class VisitorViewSet(BaseChurchViewSet):
    """ViewSet para gestão de visitantes"""
    serializer_class = VisitorSerializer
    model = Visitor
    filterset_class = VisitorFilterSet
    
    def get_permissions(self):
        """Permissões por ação"""
        
        # Criar visitante: CHURCH_ADMIN ou SECRETARY
        if self.action == 'create':
            permission_classes = [IsAuthenticated, IsChurchAdmin | IsSecretary]
        
        # Atualizar visitante: CHURCH_ADMIN ou SECRETARY
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsChurchAdmin | IsSecretary]
        
        # Converter para membro: CHURCH_ADMIN ou SECRETARY
        elif self.action == 'convert_to_member':
            permission_classes = [IsAuthenticated, IsChurchAdmin | IsSecretary]
        
        # Deletar: Apenas CHURCH_ADMIN
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsChurchAdmin]
        
        # Listar e visualizar: Todos autenticados
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def convert_to_member(self, request, pk=None):
        """Converte visitante em membro"""
        visitor = self.get_object()
        church_user = request.user.church_users.first()
        
        # SECRETARY precisa que conversão seja aprovada por admin
        if church_user.role == 'SECRETARY':
            # Cria membro com status "pending_approval"
            member = visitor.convert_to_member(
                status='pending_approval',
                approved_by=None
            )
            return Response({
                'message': 'Conversão iniciada. Aguardando aprovação do administrador.',
                'member_id': member.id
            })
        
        # CHURCH_ADMIN pode aprovar diretamente
        else:
            member = visitor.convert_to_member(
                status='active',
                approved_by=request.user
            )
            return Response({
                'message': 'Visitante convertido em membro com sucesso.',
                'member_id': member.id
            })
```

### Exemplo 3: Gestão de Filiais (Branches)

```python
class BranchViewSet(viewsets.ModelViewSet):
    """ViewSet para gestão de filiais"""
    serializer_class = BranchSerializer
    filterset_class = BranchFilterSet
    
    def get_queryset(self):
        """Filtra branches por contexto do usuário"""
        user = self.request.user
        church_user = user.church_users.first()
        
        if not church_user:
            return Branch.objects.none()
        
        # Admins veem todas as branches da igreja
        if church_user.role in ['CHURCH_ADMIN', 'DENOMINATION_ADMIN']:
            return Branch.objects.filter(church=church_user.church)
        
        # SECRETARY vê apenas branches atribuídas
        elif church_user.role == 'SECRETARY':
            return church_user.managed_branches.all()
        
        return Branch.objects.none()
    
    def get_permissions(self):
        """Apenas CHURCH_ADMIN pode gerenciar branches"""
        
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsChurchAdmin]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def regenerate_qr_code(self, request, pk=None):
        """Regenera QR Code da filial - Apenas CHURCH_ADMIN"""
        branch = self.get_object()
        branch.regenerate_qr_code()
        
        serializer = self.get_serializer(branch)
        return Response(serializer.data)
```

---

## Fluxo de Trabalho: Visitante → Membro

### 1. Registro como Visitante (Via QR Code)

```python
# Endpoint público - não requer autenticação
@api_view(['POST'])
@permission_classes([AllowAny])
def register_visitor(request, qr_code_uuid):
    """Registra visitante via QR Code"""
    
    # Valida branch pelo UUID
    try:
        branch = Branch.objects.get(
            qr_code_uuid=qr_code_uuid,
            qr_code_active=True,
            allows_visitor_registration=True
        )
    except Branch.DoesNotExist:
        return Response({'error': 'QR Code inválido'}, status=400)
    
    # Cria visitante
    serializer = VisitorPublicRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        visitor = serializer.save(
            church=branch.church,
            branch=branch,
            qr_code_used=qr_code_uuid,
            registration_source='qr_code'
        )
        return Response({
            'success': True,
            'visitor_id': visitor.id,
            'message': 'Cadastro realizado com sucesso!'
        })
    
    return Response(serializer.errors, status=400)
```

### 2. Acompanhamento (SECRETARY ou CHURCH_ADMIN)

```python
# SECRETARY pode atualizar follow-up
@action(detail=True, methods=['post'])
def add_follow_up(self, request, pk=None):
    """Adiciona nota de follow-up ao visitante"""
    visitor = self.get_object()
    
    # Verifica se tem permissão para esta branch
    church_user = request.user.church_users.first()
    if church_user.role == 'SECRETARY':
        if visitor.branch not in church_user.managed_branches.all():
            return Response({'error': 'Sem permissão para esta filial'}, status=403)
    
    note = request.data.get('note')
    visitor.follow_up_notes.create(
        note=note,
        created_by=request.user
    )
    
    return Response({'message': 'Follow-up registrado'})
```

### 3. Conversão para Membro

```python
# SECRETARY solicita conversão (requer aprovação)
# CHURCH_ADMIN aprova conversão diretamente

def convert_to_member(self, request, pk=None):
    """Converte visitante em membro"""
    visitor = self.get_object()
    church_user = request.user.church_users.first()
    member_data = request.data
    
    # Tanto SECRETARY quanto CHURCH_ADMIN podem converter diretamente
    member = Member.objects.create(
        church=visitor.church,
        branch=visitor.branch,
        full_name=visitor.full_name,
        email=visitor.email,
        phone=visitor.phone,
        membership_status='active',
        converted_from_visitor=visitor,
        created_by=request.user,
        **member_data
    )
    
    # Atualiza visitante
    visitor.converted_to_member = True
    visitor.converted_member = member
    visitor.save()
    
    return Response({
        'message': 'Visitante convertido em membro com sucesso.',
        'member_id': member.id
    })
```

---

## Casos de Uso Detalhados

### Caso 1: Dashboard do DENOMINATION_ADMIN

**Funcionalidades:**
- ✅ Ver estatísticas de todas as igrejas da denominação
- ✅ Criar novas igrejas
- ✅ Designar CHURCH_ADMIN para cada igreja
- ✅ Relatórios consolidados da denominação
- ✅ Visão de crescimento por igreja
- ✅ Comparativo entre igrejas

**Exemplo de Endpoint:**
```python
@action(detail=False, methods=['get'])
@permission_classes([IsDenominationAdmin])
def denomination_stats(self, request):
    """Estatísticas consolidadas da denominação"""
    church_user = request.user.church_users.first()
    denomination = church_user.church.denomination
    
    churches = Church.objects.filter(denomination=denomination)
    
    stats = {
        'total_churches': churches.count(),
        'total_members': Member.objects.filter(church__in=churches).count(),
        'total_visitors': Visitor.objects.filter(church__in=churches).count(),
        'churches': []
    }
    
    for church in churches:
        stats['churches'].append({
            'id': church.id,
            'name': church.name,
            'members': church.members.count(),
            'visitors': church.visitors.count(),
            'branches': church.branches.count()
        })
    
    return Response(stats)
```

---

### Caso 2: Dashboard do CHURCH_ADMIN

**Funcionalidades:**
- ✅ Gerenciar todos os membros da igreja
- ✅ Gerenciar todos os visitantes
- ✅ Criar e gerenciar filiais
- ✅ Gerar QR Codes para filiais
- ✅ Configurar atividades
- ✅ Relatórios completos da igreja
- ✅ Designar SECRETARY e atribuir branches

**Exemplo de Endpoint:**
```python
@action(detail=False, methods=['get'])
@permission_classes([IsChurchAdmin])
def church_dashboard(self, request):
    """Dashboard principal da igreja"""
    church_user = request.user.church_users.first()
    church = church_user.church
    
    stats = {
        'total_members': Member.objects.filter(church=church).count(),
        'active_members': Member.objects.filter(
            church=church,
            membership_status='active'
        ).count(),
        'total_visitors': Visitor.objects.filter(church=church).count(),
        'total_branches': Branch.objects.filter(church=church).count(),
        'by_branch': []
    }
    
    for branch in church.branches.all():
        stats['by_branch'].append({
            'id': branch.id,
            'name': branch.name,
            'members': branch.members.count(),
            'visitors': branch.visitors.count()
        })
    
    return Response(stats)
```

---

### Caso 3: Área do SECRETARY

**Funcionalidades:**
- ✅ Cadastrar novos membros nas branches atribuídas
- ✅ Atualizar dados de membros
- ✅ Cadastrar e acompanhar visitantes
- ✅ Fazer follow-up de visitantes
- ✅ Converter visitantes em membros
- ✅ Gerar relatórios das branches atribuídas
- ✅ Exportar listas

**Exemplo de Endpoint:**
```python
@action(detail=False, methods=['get'])
@permission_classes([IsSecretary])
def my_branches_stats(self, request):
    """Estatísticas das branches atribuídas ao secretário"""
    church_user = request.user.church_users.first()
    branches = church_user.managed_branches.all()
    
    stats = {
        'managed_branches': [],
        'total_members': 0,
        'total_visitors': 0
    }
    
    for branch in branches:
        members_count = Member.objects.filter(branch=branch).count()
        visitors_count = Visitor.objects.filter(branch=branch).count()
        
        stats['total_members'] += members_count
        stats['total_visitors'] += visitors_count
        
        stats['managed_branches'].append({
            'id': branch.id,
            'name': branch.name,
            'members': members_count,
            'visitors': visitors_count,
            'pending_follow_ups': Visitor.objects.filter(
                branch=branch,
                follow_up_status='pending'
            ).count()
        })
    
    return Response(stats)
```

---

## Considerações de Segurança

### 1. Proteção do Papel SUPER_ADMIN

- **NUNCA** pode ser atribuído via cadastro normal da aplicação
- Validações implementadas em múltiplas camadas:
  - Serializers (`ChurchUserCreateSerializer`)
  - Modelo (`ChurchUser.save()`)
  - Permissões (`IsPlatformAdmin`)
- Apenas desenvolvedores/donos da plataforma devem ter este papel
- Usado exclusivamente para administração da plataforma SaaS

#### Como Criar um SUPER_ADMIN

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

**O que o comando faz:**
1. Cria um usuário Django com `is_superuser=True`
2. Cria uma "igreja administrativa" para vincular o usuário
3. Cria um `ChurchUser` com papel `SUPER_ADMIN`
4. Configura todas as permissões administrativas

⚠️ **IMPORTANTE**: Use este comando apenas para criar administradores legítimos da plataforma!

---

### 2. Isolamento de Dados (Multi-Tenant)

```python
class TenantMiddleware:
    """Garante isolamento automático de dados por igreja"""
    
    def __call__(self, request):
        if request.user.is_authenticated:
            church_user = request.user.church_users.first()
            if church_user:
                request.church = church_user.church
                request.role = church_user.role
                request.managed_branches = church_user.managed_branches.all()
        
        response = self.get_response(request)
        return response
```

**Princípios:**
- Cada igreja é um tenant isolado
- Middleware aplica filtros automáticos
- Permissões verificam contexto da igreja
- SECRETARY tem contexto adicional de branches

---

### 3. Validação de Acesso

```python
def validate_access(user, obj):
    """Valida se usuário tem acesso ao objeto"""
    church_user = user.church_users.first()
    
    if not church_user:
        return False
    
    # SUPER_ADMIN tem acesso total
    if user.is_superuser:
        return True
    
    # DENOMINATION_ADMIN acessa igrejas da denominação
    if church_user.role == 'DENOMINATION_ADMIN':
        if hasattr(obj, 'church'):
            return obj.church.denomination == church_user.church.denomination
    
    # CHURCH_ADMIN acessa toda a igreja
    if church_user.role == 'CHURCH_ADMIN':
        if hasattr(obj, 'church'):
            return obj.church == church_user.church
    
    # SECRETARY acessa apenas suas branches
    if church_user.role == 'SECRETARY':
        if hasattr(obj, 'branch'):
            return obj.branch in church_user.managed_branches.all()
    
    return False
```

---

### 4. Tratamento de Erros

```python
# Exemplo de tratamento de erros em ViewSet
def get_object(self):
    """Sobrescreve get_object para validar acesso"""
    obj = super().get_object()
    
    if not validate_access(self.request.user, obj):
        raise PermissionDenied('Você não tem permissão para acessar este recurso')
    
    return obj

# Respostas de erro padronizadas
HTTP_403_FORBIDDEN = 'Você não tem permissão para realizar esta ação'
HTTP_404_NOT_FOUND = 'Recurso não encontrado'  # Não revela existência
```

---

## Estrutura de Arquivos

### Modelos Principais
```
backend/apps/
├── accounts/
│   └── models.py           # CustomUser, ChurchUser, UserProfile
├── denominations/
│   └── models.py           # Denomination
├── churches/
│   └── models.py           # Church
├── branches/
│   └── models.py           # Branch
├── members/
│   └── models.py           # Member
└── visitors/
    └── models.py           # Visitor
```

### Permissões
```
backend/apps/core/
├── permissions.py          # Classes de permissão customizadas
├── models.py               # RoleChoices, BaseModel, TenantManager
└── middleware.py           # TenantMiddleware
```

### Views
```
backend/apps/
├── members/
│   └── views.py            # MemberViewSet
├── visitors/
│   └── views.py            # VisitorViewSet
├── branches/
│   └── views.py            # BranchViewSet
└── churches/
    └── views.py            # ChurchViewSet
```

### Comandos de Gerenciamento
```
backend/apps/accounts/management/commands/
└── create_platform_admin.py    # Criar SUPER_ADMIN
```

---

## Comandos de Gerenciamento

### create_platform_admin

Cria administradores da plataforma com papel `SUPER_ADMIN`.

**Localização:** `backend/apps/accounts/management/commands/create_platform_admin.py`

**Uso:**
```bash
python manage.py create_platform_admin --email <email> --name <nome> [opções]
```

**Exemplos:**
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

## Tabela Resumo de Permissões

| Funcionalidade | SUPER_ADMIN | DENOMINATION_ADMIN | CHURCH_ADMIN | SECRETARY |
|----------------|-------------|-------------------|--------------|-----------|
| **Administração Plataforma** | ✅ | ❌ | ❌ | ❌ |
| **Criar Igrejas** | ✅ | ✅ | ❌ | ❌ |
| **Gerenciar Igrejas** | ✅ | ✅ (da denominação) | ✅ (própria) | ❌ |
| **Criar Filiais** | ✅ | ✅ | ✅ | ❌ |
| **Gerenciar Filiais** | ✅ | ✅ | ✅ | ❌ |
| **Criar Membros** | ✅ | ✅ | ✅ | ✅ (nas branches) |
| **Editar Membros** | ✅ | ✅ | ✅ | ✅ (nas branches) |
| **Excluir Membros** | ✅ | ✅ | ✅ | ❌ |
| **Criar Visitantes** | ✅ | ✅ | ✅ | ✅ (nas branches) |
| **Editar Visitantes** | ✅ | ✅ | ✅ | ✅ (nas branches) |
| **Excluir Visitantes** | ✅ | ✅ | ✅ | ❌ |
| **Converter Visitante** | ✅ | ✅ | ✅ | ✅ |
| **Gerar QR Codes** | ✅ | ✅ | ✅ | ❌ |
| **Relatórios Globais** | ✅ | ✅ (denominação) | ✅ (igreja) | ✅ (branches) |
| **Configurações** | ✅ | ✅ | ✅ | ❌ |
| **Designar Usuários** | ✅ | ✅ | ✅ | ❌ |

---

## Migração de Papéis Antigos

Se o sistema já estava em produção com a estrutura anterior de 8 papéis, use este comando para migrar:

```bash
python manage.py migrate_roles
```

**O que o comando faz:**
```python
# Mapeamento de papéis antigos → novos
ROLE_MAPPING = {
    'PASTOR': 'CHURCH_ADMIN',
    'LEADER': 'SECRETARY',
    'MEMBER': None,  # Remove acesso ao sistema
    'READ_ONLY': None,  # Remove acesso ao sistema
}

# Atualiza ChurchUser
for church_user in ChurchUser.objects.all():
    old_role = church_user.role
    new_role = ROLE_MAPPING.get(old_role)
    
    if new_role:
        church_user.role = new_role
        church_user.save()
    elif old_role in ['MEMBER', 'READ_ONLY']:
        # Remove vínculo ChurchUser (usuário perde acesso ao sistema)
        church_user.delete()
```

---

## Melhores Práticas

### 1. Sempre Verificar Contexto

```python
def get_user_context(self):
    """Obtém contexto completo do usuário"""
    church_user = self.request.user.church_users.first()
    
    return {
        'user': self.request.user,
        'church_user': church_user,
        'church': church_user.church if church_user else None,
        'role': church_user.role if church_user else None,
        'managed_branches': church_user.managed_branches.all() if church_user else []
    }
```

### 2. Usar Permissões Compostas

```python
# Combinar permissões com OR
permission_classes = [IsChurchAdmin | IsSecretary]

# Combinar com AND (usando múltiplas classes)
permission_classes = [IsAuthenticated, IsChurchAdmin]
```

### 3. Filtrar QuerySets por Contexto

```python
def get_queryset(self):
    """Sempre filtrar automaticamente"""
    context = self.get_user_context()
    
    # Exemplo para membros
    if context['role'] == 'SECRETARY':
        return Member.objects.filter(
            branch__in=context['managed_branches']
        )
    
    return Member.objects.filter(church=context['church'])
```

### 4. Validar Permissões de Objeto

```python
def has_object_permission(self, request, view, obj):
    """Valida permissão específica do objeto"""
    church_user = request.user.church_users.first()
    
    # Admins têm acesso total
    if church_user.role in ['CHURCH_ADMIN', 'DENOMINATION_ADMIN']:
        return obj.church == church_user.church
    
    # SECRETARY só acessa objetos de suas branches
    if church_user.role == 'SECRETARY':
        return obj.branch in church_user.managed_branches.all()
    
    return False
```

---

## Controles Recentes de Segurança

- ✅ **Bloqueio de autopromoção**: requisições ao endpoint `POST /api/churches/{id}/assign_admin/` agora validam a hierarquia do solicitante. Apenas Church Admin ou Super Admin podem alterar seu próprio papel e somente papéis de nível igual ou inferior podem ser concedidos a terceiros. Tentativas bloqueadas são registradas em log com contexto (ator, alvo e igreja).
- ✅ **Interface protegida para autoedição**: ao editar o próprio cadastro de membro, o card “Acesso ao Sistema” é exibido apenas como leitura, eliminando o seletor de papéis e prevenindo ajustes acidentais.
- ✅ **Auditoria reforçada**: toda tentativa negada de alteração de permissão gera entrada de log (`warning`), indicando motivo e dados relevantes para acompanhamento.

Estas medidas evitam escalonamento indevido de privilégios e fortalecem o fluxo de aprovação de papéis.

## Conclusão

Esta documentação apresenta o sistema simplificado de permissões do **Obreiro Virtual**, com apenas 4 níveis hierárquicos claramente definidos:

1. **SUPER_ADMIN (Nível 4)** - Desenvolvedores da plataforma
2. **DENOMINATION_ADMIN (Nível 3)** - Administra múltiplas igrejas
3. **CHURCH_ADMIN (Nível 2)** - Administra igreja e filiais
4. **SECRETARY (Nível 1)** - Gestão de cadastros em branches específicas

Este modelo simplificado oferece:
- ✅ **Clareza** na hierarquia de permissões
- ✅ **Segurança** com isolamento multi-tenant
- ✅ **Flexibilidade** com contexto de branches para secretários
- ✅ **Escalabilidade** para crescimento da plataforma
- ✅ **Manutenibilidade** com código mais limpo e direto

A implementação garante que cada usuário tenha acesso apenas aos dados e funcionalidades apropriadas ao seu papel, mantendo a integridade e segurança do sistema.

---

**Última atualização:** Outubro 2025  
**Versão:** 2.0  
**Autor:** Júnior Melo  
**Projeto:** Obreiro Virtual - Sistema de Gestão Eclesiástica
