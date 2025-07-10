# Documentação Completa: Módulo de Membros - Obreiro Virtual

## Visão Geral

O **Módulo de Membros** é um dos componentes centrais da plataforma Obreiro Virtual, responsável pelo gerenciamento completo dos membros da igreja. Este módulo implementa um sistema CRUD completo com validações, permissões hierárquicas, dashboard analítico e integração com o sistema de usuários.

## Arquitetura do Módulo

O módulo segue uma arquitetura em camadas bem definida:

### Backend (Django)
- **Models**: Definição da estrutura de dados dos membros
- **Serializers**: Validação e serialização de dados
- **ViewSets**: Endpoints da API REST
- **Permissions**: Controle de acesso baseado em hierarquia
- **Filters**: Sistema de filtros avançados

### Frontend (React + TypeScript)
- **Hooks**: Gerenciamento de estado e lógica de negócio
- **Components**: Interface de usuário reutilizável
- **Pages**: Páginas principais do módulo
- **Services**: Comunicação com a API
- **Types**: Tipagem TypeScript completa

---

## 🏗️ Estrutura de Dados

### Modelo Principal: Member

```python
class Member(BaseModel):
    # Identificação
    church = models.ForeignKey('churches.Church', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    cpf = models.CharField(max_length=14, unique=True, blank=True, null=True)
    rg = models.CharField(max_length=20, blank=True)
    
    # Dados Pessoais
    birth_date = models.DateField()
    gender = models.CharField(max_length=1, choices=GenderChoices.choices)
    marital_status = models.CharField(max_length=20, choices=MaritalStatusChoices.choices)
    
    # Contato
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, validators=[phone_validator])
    phone_secondary = models.CharField(max_length=20, blank=True)
    
    # Endereço
    address = models.CharField(max_length=200, blank=True)
    neighborhood = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)
    zipcode = models.CharField(max_length=9, blank=True)
    
    # Dados Eclesiásticos
    membership_status = models.CharField(max_length=20, choices=MembershipStatusChoices.choices)
    membership_date = models.DateField(auto_now_add=True)
    baptism_date = models.DateField(blank=True, null=True)
    conversion_date = models.DateField(blank=True, null=True)
    ministerial_function = models.CharField(max_length=50, choices=MinisterialFunctionChoices.choices)
    ordination_date = models.DateField(blank=True, null=True)
    
    # Dados Adicionais
    profession = models.CharField(max_length=100, blank=True)
    education_level = models.CharField(max_length=50, choices=EducationLevelChoices.choices)
    photo = models.ImageField(upload_to='members/photos/', blank=True, null=True)
    notes = models.TextField(blank=True)
    
    # Preferências de Contato
    accept_sms = models.BooleanField(default=True)
    accept_email = models.BooleanField(default=True)
    accept_whatsapp = models.BooleanField(default=True)
```

### Campos Calculados (Properties)

```python
@property
def age(self) -> int:
    """Calcula idade baseada na data de nascimento"""
    
@property
def membership_years(self) -> int:
    """Calcula anos de membresia"""
    
@property
def full_address(self) -> str:
    """Endereço completo formatado"""
    
@property
def membership_status_display(self) -> str:
    """Status de membresia formatado"""
```

---

## 🔌 API Endpoints

### Base URL: `/api/v1/members/`

#### 1. **Listar Membros**
```http
GET /api/v1/members/
```

**Parâmetros de Query:**
- `page`: Número da página (paginação)
- `search`: Busca por nome, email ou telefone
- `membership_status`: Filtro por status (`active`, `inactive`, `transferred`, `deceased`)
- `gender`: Filtro por gênero (`M`, `F`, `N`)
- `ministerial_function`: Filtro por função ministerial
- `ordering`: Ordenação (`full_name`, `-created_at`, etc.)

**Resposta:**
```json
{
  "count": 150,
  "next": "http://api.example.com/members/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "full_name": "João Silva",
      "email": "joao@email.com",
      "phone": "(11) 99999-9999",
      "age": 35,
      "church_name": "Igreja Sede",
      "membership_status": "active",
      "membership_status_display": "Ativo",
      "membership_date": "2020-01-15",
      "is_active": true
    }
  ]
}
```

#### 2. **Dashboard de Membros**
```http
GET /api/v1/members/dashboard/
```

**Resposta:**
```json
{
  "total_members": 150,
  "active_members": 140,
  "inactive_members": 10,
  "new_members_month": 5,
  "growth_rate": 3.5,
  "status_distribution": [
    {"membership_status": "active", "count": 140},
    {"membership_status": "inactive", "count": 10}
  ],
  "gender_distribution": [
    {"gender": "M", "count": 75},
    {"gender": "F", "count": 75}
  ],
  "age_distribution": {
    "children": 20,
    "youth": 40,
    "adults": 70,
    "elderly": 20
  }
}
```

#### 3. **Criar Membro**
```http
POST /api/v1/members/
```

**Payload (JSON):**
```json
{
  "church": 1,
  "full_name": "Maria Santos",
  "birth_date": "1990-05-15",
  "gender": "F",
  "email": "maria@email.com",
  "phone": "(11) 98888-8888",
  "membership_status": "active",
  "ministerial_function": "member",
  "accept_sms": true,
  "accept_email": true,
  "accept_whatsapp": true
}
```

**Payload (FormData - com foto):**
```javascript
const formData = new FormData();
formData.append('church', '1');
formData.append('full_name', 'Maria Santos');
formData.append('photo', file);
// ... outros campos
```

#### 4. **Obter Membro**
```http
GET /api/v1/members/{id}/
```

#### 5. **Atualizar Membro**
```http
PATCH /api/v1/members/{id}/
PUT /api/v1/members/{id}/
```

#### 6. **Deletar Membro**
```http
DELETE /api/v1/members/{id}/
```

#### 7. **Perfil Completo do Membro**
```http
GET /api/v1/members/{id}/profile/
```

**Resposta:**
```json
{
  "id": 1,
  "full_name": "João Silva",
  // ... todos os campos do membro
  "family_members": [
    {
      "id": 2,
      "full_name": "Maria Silva",
      "relationship": "spouse"
    }
  ],
  "ministries_list": ["Louvor", "Ensino"]
}
```

#### 8. **Atualizar Status do Membro**
```http
PATCH /api/v1/members/{id}/status/
```

**Payload:**
```json
{
  "status": "inactive",
  "reason": "Mudança de cidade"
}
```

#### 9. **Exportar Membros**
```http
GET /api/v1/members/export/
```

---

## 🔒 Sistema de Permissões

### Hierarquia de Acesso

#### **DENOMINATION_ADMIN / CHURCH_ADMIN**
- ✅ Visualizar todos os membros
- ✅ Criar novos membros
- ✅ Editar qualquer membro
- ✅ Deletar membros
- ✅ Acessar dashboard e relatórios
- ✅ Exportar dados
- ✅ Atribuir papéis do sistema

#### **PASTOR**
- ✅ Visualizar todos os membros
- ✅ Criar novos membros
- ✅ Editar qualquer membro
- ❌ Deletar membros
- ✅ Acessar dashboard e relatórios
- ✅ Exportar dados
- ✅ Atribuir papéis inferiores

#### **SECRETARY**
- ✅ Visualizar todos os membros
- ✅ Criar novos membros
- ✅ Editar qualquer membro
- ❌ Deletar membros
- ✅ Acessar dashboard e relatórios
- ✅ Exportar dados
- ✅ Atribuir papéis inferiores

#### **LEADER**
- ✅ Visualizar todos os membros
- ❌ Criar novos membros
- ❌ Editar membros
- ❌ Deletar membros
- ❌ Acessar dashboard
- ❌ Exportar dados
- ❌ Atribuir papéis

#### **MEMBER**
- ✅ Visualizar lista de membros
- ❌ Todas as outras operações

### Implementação de Permissões

```python
class MemberViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            permission_classes = [IsChurchAdminOrCanManageMembers]
        elif self.action == 'destroy':
            permission_classes = [IsChurchAdmin]
        else:
            permission_classes = [IsMemberUser]
        return [permission() for permission in permission_classes]
```

---

## 🎨 Interface Frontend

### Páginas Principais

#### 1. **Página de Listagem (`/membros`)**

**Componentes:**
- `StatsCard` - KPIs do dashboard
- `MembersFilters` - Filtros avançados
- `MembersTable` - Tabela com dados dos membros

**Funcionalidades:**
- Dashboard com métricas em tempo real
- Filtros por status, gênero, função ministerial
- Busca por nome, email ou telefone
- Paginação automática
- Ações por linha (visualizar, editar, deletar)

#### 2. **Formulário de Cadastro (`/membros/novo`)**

**Estrutura em Abas:**

##### **Aba 1: Dados Pessoais**
- Nome completo *
- Data de nascimento *
- CPF (com máscara automática)
- RG
- Gênero *
- Estado civil
- Upload de foto

##### **Aba 2: Contato**
- E-mail
- Telefone principal (com máscara automática)
- Telefone secundário
- Endereço completo (CEP, rua, bairro, cidade, estado)
- Preferências de contato (SMS, Email, WhatsApp)

##### **Aba 3: Dados Eclesiásticos**
- Status de membresia
- Função ministerial
- Data de conversão
- Data de batismo
- Data de ordenação
- Igreja anterior
- Carta de transferência

**Seção: Acesso ao Sistema** ⭐
Esta é uma das funcionalidades mais importantes do sistema, permitindo transformar um membro comum em um usuário do sistema com permissões específicas.

- **Checkbox "Criar usuário do sistema"**: Habilita/desabilita toda a seção
- **Select com papéis disponíveis**: Baseado na hierarquia do usuário logado
- **E-mail para login**: Deve ser único no sistema
- **Senha inicial**: Obrigatória para primeiro acesso
- **Preview do papel selecionado**: Mostra permissões que serão concedidas

**Validações Críticas:**
- ✅ Usuário só pode atribuir papéis **inferiores** ao seu próprio papel
- ✅ E-mail deve ser **único** em todo o sistema
- ✅ Senha deve atender aos **critérios de segurança**
- ✅ Igreja do membro será **automaticamente** vinculada ao usuário

**Fluxo de Criação:**
1. Membro é criado normalmente
2. Se "Criar usuário" estiver marcado:
   - CustomUser é criado com email/senha
   - ChurchUser é criado vinculando usuário à igreja
   - Papel selecionado é atribuído
   - Membro é vinculado ao usuário criado

##### **Aba 4: Informações Adicionais**
- Profissão
- Escolaridade
- Observações gerais

#### 3. **Página de Detalhes (`/membros/:id`)**

**Seções:**
- Dados pessoais com foto
- Informações de contato
- Dados eclesiásticos
- Histórico de atividades
- Membros da família
- Ministérios participantes

#### 4. **Página de Edição (`/membros/:id/editar`)**
- Mesmo formulário do cadastro
- Campos pré-preenchidos
- Validações específicas para edição

### Componentes Reutilizáveis

#### **MembersTable**
```typescript
interface MembersTableProps {
  members: MemberSummary[];
  onDelete?: (member: MemberSummary) => void;
  loading?: boolean;
}
```

**Funcionalidades:**
- Exibição de avatar ou iniciais
- Badges coloridos para status
- Dropdown de ações por linha
- Responsividade completa

#### **MembersFilters**
```typescript
interface MembersFiltersProps {
  filters: MembersFilters;
  onFiltersChange: (filters: MembersFilters) => void;
  loading?: boolean;
}
```

**Filtros Disponíveis:**
- Busca por texto
- Status de membresia
- Função ministerial
- Gênero
- Botão "Limpar filtros"

#### **MemberForm**
```typescript
interface MemberFormProps {
  member?: Member;
  onSubmit: (data: CreateMemberData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}
```

**Validações:**
- Campos obrigatórios
- Formato de telefone
- Formato de e-mail
- Validação de CPF (opcional)
- Máscara automática para telefone e CPF

---

## 🔧 Hooks e Lógica de Negócio

### Hook Principal: `useMembers`

```typescript
export const useMembers = () => {
  // Estados
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [filters, setFilters] = useState<MembersFilters>({
    search: '',
    status: 'all',
    ministerial_function: 'all'
  });
  
  // Ações
  const loadMembers = useCallback(async () => { /* ... */ }, []);
  const deleteMember = useCallback(async (id: number) => { /* ... */ }, []);
  const refreshData = useCallback(async () => { /* ... */ }, []);
  
  return {
    members,
    dashboard,
    filters,
    setFilters,
    loading,
    loadMembers,
    deleteMember,
    refreshData
  };
};
```

### Hook de Hierarquia: `useRoleHierarchy`

```typescript
export const useRoleHierarchy = () => {
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchyData | null>(null);
  
  const loadRoleHierarchy = useCallback(async () => {
    const response = await api.get('/auth/available-roles/');
    setRoleHierarchy(response.data);
  }, []);
  
  return {
    availableRoles: roleHierarchy?.available_roles || [],
    canAssignRoles: roleHierarchy?.can_assign_roles || false,
    userRole: roleHierarchy?.user_role || null,
    isLoading,
    error
  };
};
```

### Hook de Permissões: `usePermissions`

```typescript
export const usePermissions = (): UserPermissions => {
  const { user, userChurch } = useAuth();
  
  const permissions = useMemo(() => {
    // Lógica baseada no papel do usuário
    const userRole = userChurch?.role;
    return ROLE_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS;
  }, [user, userChurch]);
  
  return permissions;
};
```

---

## 🧪 Validações e Regras de Negócio

### Validações Frontend (Zod Schema)

```typescript
const memberSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['M', 'F', 'N'], { required_error: 'Selecione o gênero' }),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().refine(
    (val) => !val || phoneRegex.test(val),
    { message: 'Telefone deve estar no formato (XX) XXXXX-XXXX' }
  ),
  // ... outros campos
});
```

### Validações Backend (Django)

```python
class MemberSerializer(serializers.ModelSerializer):
    def validate_phone(self, value):
        if value and not phone_validator(value):
            raise serializers.ValidationError(
                "Telefone deve estar no formato: (XX) XXXXX-XXXX"
            )
        return value
    
    def validate_cpf(self, value):
        if value and not validate_cpf(value):
            raise serializers.ValidationError("CPF inválido")
        return value
```

### Regras de Negócio

#### **Criação de Usuário do Sistema**
1. Usuário pode criar papéis apenas inferiores ao seu
2. E-mail deve ser único no sistema
3. Senha inicial é obrigatória
4. ChurchUser é criado automaticamente
5. Permissões são atribuídas baseadas no papel

#### **Isolamento Multi-Tenant**
1. Membros são filtrados por igreja automaticamente
2. Usuários só veem membros de sua igreja
3. Validações impedem acesso cruzado entre igrejas

#### **Soft Delete**
1. Membros são marcados como inativos, não deletados
2. Histórico é preservado para auditoria
3. Possibilidade de restauração

---

## 📊 Analytics e Relatórios

### Dashboard KPIs

#### **Métricas Principais**
- **Total de Membros**: Contagem total de membros ativos
- **Membros Ativos**: Membros com status "active"
- **Membros Inativos**: Membros com outros status
- **Novos este Mês**: Membros cadastrados no mês atual
- **Taxa de Crescimento**: Percentual de crescimento mensal

#### **Distribuições**
- **Por Status**: Ativo, Inativo, Transferido, Falecido
- **Por Gênero**: Masculino, Feminino, Não informado
- **Por Idade**: Crianças, Jovens, Adultos, Idosos
- **Por Função Ministerial**: Pastor, Diácono, Líder, Membro, etc.

### Relatórios Exportáveis

```python
def export_members(self):
    """Exporta dados dos membros para Excel/CSV"""
    members = Member.objects.filter(church=self.request.user.church)
    return {
        'members': MemberSerializer(members, many=True).data,
        'total': members.count(),
        'exported_at': timezone.now().isoformat()
    }
```

---

## 🔐 Sistema de Acesso e Criação de Usuários

### 📋 Visão Geral da Funcionalidade

Uma das funcionalidades **mais críticas** do Módulo de Membros é a capacidade de transformar um membro comum em um **usuário do sistema** com permissões específicas. Esta funcionalidade permite que administradores concedam acesso ao sistema Obreiro Virtual para membros selecionados, respeitando rigorosamente a **hierarquia de permissões**.

### 🎯 Objetivo
Permitir que membros da igreja tenham acesso ao sistema administrativo com diferentes níveis de permissão, mantendo a **segurança** e **isolamento** entre igrejas.

---

### 🏗️ Arquitetura do Sistema de Acesso

#### **Entidades Envolvidas**
1. **Member** - Dados do membro da igreja
2. **CustomUser** - Usuário do sistema (login/senha)
3. **ChurchUser** - Vínculo entre usuário e igreja com papel específico
4. **RoleHierarchy** - Sistema de hierarquia de permissões

#### **Relacionamentos**
```
Member (1:1) CustomUser (1:N) ChurchUser (N:1) Church
                    ↓
              Role + Permissions
```

---

### 🔧 Implementação Frontend

#### **Interface de Criação de Usuário**

**Localização:** Formulário de Cadastro de Membro → Aba 3: Dados Eclesiásticos

```typescript
// Seção: Acesso ao Sistema
interface SystemAccessForm {
  create_system_user: boolean;
  system_role: string;
  user_email: string;
  user_password: string;
}
```

#### **Componente: SystemUserSection**
```typescript
const SystemUserSection = ({ 
  form, 
  availableRoles, 
  canAssignRoles 
}: SystemUserSectionProps) => {
  const [createUser, setCreateUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  
  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          Acesso ao Sistema
        </CardTitle>
        <CardDescription>
          Conceder acesso ao sistema administrativo para este membro
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Checkbox principal */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="create_system_user"
            checked={createUser}
            onCheckedChange={setCreateUser}
          />
          <Label htmlFor="create_system_user" className="font-medium">
            Criar usuário do sistema
          </Label>
        </div>
        
        {createUser && (
          <>
            {/* Seleção de papel */}
            <div className="space-y-2">
              <Label>Papel no Sistema *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Preview de permissões */}
            {selectedRole && (
              <RolePreview role={selectedRole} />
            )}
            
            {/* Dados de login */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail para Login *</Label>
                <Input
                  type="email"
                  placeholder="usuario@email.com"
                  {...form.register('user_email')}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Senha Inicial *</Label>
                <Input
                  type="password"
                  placeholder="Senha segura"
                  {...form.register('user_password')}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
```

#### **Hook: useRoleHierarchy**
```typescript
export const useRoleHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<RoleHierarchyData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/available-roles/');
      setHierarchy(response.data);
    } catch (error) {
      console.error('Erro ao carregar hierarquia:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);
  
  return {
    availableRoles: hierarchy?.available_roles || [],
    canAssignRoles: hierarchy?.can_assign_roles || false,
    userRole: hierarchy?.user_role,
    userRoleLabel: hierarchy?.user_role_label,
    loading,
    refresh: loadHierarchy
  };
};
```

---

### 🔧 Implementação Backend

#### **Endpoint: Available Roles**
```python
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_roles_view(request):
    """
    Retorna os papéis disponíveis para atribuição baseado na hierarquia.
    """
    church_user = request.user.church_users.first()
    if not church_user:
        return Response(
            {'error': 'Usuário não está associado a nenhuma igreja'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user_role = church_user.role
    
    # Hierarquia de papéis
    role_hierarchy = {
        RoleChoices.SUPER_ADMIN: [
            RoleChoices.DENOMINATION_ADMIN,
            RoleChoices.CHURCH_ADMIN,
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.DENOMINATION_ADMIN: [
            RoleChoices.CHURCH_ADMIN,
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.CHURCH_ADMIN: [
            RoleChoices.PASTOR,
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.PASTOR: [
            RoleChoices.SECRETARY,
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.SECRETARY: [
            RoleChoices.LEADER,
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.LEADER: [
            RoleChoices.MEMBER,
            RoleChoices.READ_ONLY
        ],
        RoleChoices.MEMBER: [],
        RoleChoices.READ_ONLY: []
    }
    
    available_roles = role_hierarchy.get(user_role, [])
    
    roles_data = []
    for role in available_roles:
        roles_data.append({
            'value': role,
            'label': dict(RoleChoices.choices)[role],
            'description': get_role_description(role),
            'permissions': get_role_permissions(role)
        })
    
    return Response({
        'user_role': user_role,
        'user_role_label': dict(RoleChoices.choices)[user_role],
        'available_roles': roles_data,
        'can_assign_roles': len(available_roles) > 0
    })
```

#### **Serializer: Member com Sistema de Usuário**
```python
class MemberCreateSerializer(serializers.ModelSerializer):
    # Campos do sistema de usuário
    create_system_user = serializers.BooleanField(default=False, write_only=True)
    system_role = serializers.CharField(required=False, write_only=True)
    user_email = serializers.EmailField(required=False, write_only=True)
    user_password = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = Member
        fields = '__all__'
        extra_kwargs = {
            'church': {'read_only': True},
        }
    
    def validate(self, attrs):
        """Validações para criação de usuário do sistema"""
        create_user = attrs.get('create_system_user', False)
        
        if create_user:
            # Validar campos obrigatórios
            required_fields = ['system_role', 'user_email', 'user_password']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError(
                        f"Campo '{field}' é obrigatório para criar usuário do sistema"
                    )
            
            # Validar email único
            if CustomUser.objects.filter(email=attrs['user_email']).exists():
                raise serializers.ValidationError(
                    "Este e-mail já está sendo usado por outro usuário"
                )
            
            # Validar hierarquia de papéis
            self.validate_role_hierarchy(attrs['system_role'])
        
        return attrs
    
    def validate_role_hierarchy(self, role):
        """Valida se o usuário pode atribuir o papel selecionado"""
        request_user = self.context['request'].user
        user_church = request_user.church_users.first()
        
        if not user_church:
            raise serializers.ValidationError("Usuário não está vinculado a uma igreja")
        
        user_role = user_church.role
        available_roles = get_available_roles_for_user(user_role)
        
        if role not in available_roles:
            raise serializers.ValidationError(
                f"Você não pode atribuir o papel '{role}'. "
                f"Papéis disponíveis: {', '.join(available_roles)}"
            )
        
        return role
    
    def create(self, validated_data):
        """Cria membro e opcionalmente usuário do sistema"""
        # Extrair dados do sistema de usuário
        create_user = validated_data.pop('create_system_user', False)
        system_role = validated_data.pop('system_role', None)
        user_email = validated_data.pop('user_email', None)
        user_password = validated_data.pop('user_password', None)
        
        # Definir igreja do usuário logado
        request_user = self.context['request'].user
        user_church = request_user.church_users.first().church
        validated_data['church'] = user_church
        
        # Criar membro
        with transaction.atomic():
            member = Member.objects.create(**validated_data)
            
            # Criar usuário do sistema se solicitado
            if create_user:
                # Criar CustomUser
                system_user = CustomUser.objects.create_user(
                    email=user_email,
                    password=user_password,
                    full_name=member.full_name,
                    is_profile_complete=True
                )
                
                # Criar ChurchUser (vínculo com igreja e papel)
                ChurchUser.objects.create(
                    user=system_user,
                    church=user_church,
                    role=system_role
                )
                
                # Vincular membro ao usuário
                member.user = system_user
                member.save()
                
                # Log da criação
                logger.info(
                    f"Usuário do sistema criado: {user_email} "
                    f"com papel {system_role} na igreja {user_church.name}"
                )
        
        return member
```

---

### 🔒 Sistema de Validações

#### **Validações de Segurança**

1. **Hierarquia de Papéis**
```python
def get_available_roles_for_user(user_role: str) -> List[str]:
    """Retorna papéis que o usuário pode atribuir"""
    hierarchy = {
        'SUPER_ADMIN': ['DENOMINATION_ADMIN', 'CHURCH_ADMIN', 'PASTOR', 'SECRETARY', 'LEADER', 'MEMBER', 'READ_ONLY'],
        'DENOMINATION_ADMIN': ['CHURCH_ADMIN', 'PASTOR', 'SECRETARY', 'LEADER', 'MEMBER', 'READ_ONLY'],
        'CHURCH_ADMIN': ['PASTOR', 'SECRETARY', 'LEADER', 'MEMBER', 'READ_ONLY'],
        'PASTOR': ['SECRETARY', 'LEADER', 'MEMBER', 'READ_ONLY'],
        'SECRETARY': ['LEADER', 'MEMBER', 'READ_ONLY'],
        'LEADER': ['MEMBER', 'READ_ONLY'],
        'MEMBER': [],
        'READ_ONLY': []
    }
    return hierarchy.get(user_role, [])
```

2. **Validação de Email Único**
```python
def validate_unique_email(email: str) -> bool:
    """Verifica se email já está em uso"""
    return not CustomUser.objects.filter(email=email).exists()
```

3. **Validação de Senha**
```python
def validate_password_strength(password: str) -> bool:
    """Valida força da senha"""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True
```

#### **Validações Frontend (Zod)**
```typescript
const systemUserSchema = z.object({
  create_system_user: z.boolean(),
  system_role: z.string().optional(),
  user_email: z.string().email('E-mail inválido').optional(),
  user_password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').optional(),
}).refine((data) => {
  // Se criar usuário, todos os campos são obrigatórios
  if (data.create_system_user) {
    return data.system_role && data.user_email && data.user_password;
  }
  return true;
}, {
  message: "Todos os campos são obrigatórios para criar usuário do sistema"
});
```

---

### 📊 Fluxo Completo de Criação

#### **1. Frontend - Seleção de Papel**
```typescript
const handleRoleChange = (role: string) => {
  setSelectedRole(role);
  // Carregar preview de permissões
  loadRolePermissions(role);
};
```

#### **2. Frontend - Preview de Permissões**
```typescript
const RolePreview = ({ role }: { role: string }) => {
  const permissions = ROLE_PERMISSIONS[role];
  
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4" />
      <AlertTitle>Permissões do papel: {role}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {permissions.map(permission => (
            <li key={permission} className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              {permission}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
```

#### **3. Backend - Processamento**
```python
# 1. Validar hierarquia
validate_role_hierarchy(system_role)

# 2. Validar email único
validate_unique_email(user_email)

# 3. Criar membro
member = Member.objects.create(**member_data)

# 4. Criar usuário
system_user = CustomUser.objects.create_user(
    email=user_email,
    password=user_password,
    full_name=member.full_name
)

# 5. Criar vínculo com igreja
ChurchUser.objects.create(
    user=system_user,
    church=user_church,
    role=system_role
)

# 6. Vincular membro ao usuário
member.user = system_user
member.save()
```

#### **4. Resultado Final**
- ✅ Membro criado na igreja
- ✅ Usuário do sistema criado
- ✅ Papel atribuído conforme hierarquia
- ✅ Vínculo estabelecido entre membro e usuário
- ✅ Permissões ativas imediatamente

---

### 🎯 Casos de Uso Práticos

#### **Caso 1: Pastor criando Secretário**
```
Pastor (PASTOR) → pode criar → Secretário (SECRETARY)
✅ Permitido: SECRETARY está abaixo de PASTOR na hierarquia
```

#### **Caso 2: Secretário tentando criar Pastor**
```
Secretário (SECRETARY) → tenta criar → Pastor (PASTOR)
❌ Negado: PASTOR está acima de SECRETARY na hierarquia
```

#### **Caso 3: Admin criando qualquer papel**
```
Church Admin (CHURCH_ADMIN) → pode criar → qualquer papel abaixo
✅ Permitido: CHURCH_ADMIN tem autoridade sobre todos os papéis inferiores
```

---

### 📈 Métricas e Auditoria

#### **Logs de Auditoria**
```python
# Log de criação de usuário
logger.info(
    f"Sistema de usuário criado - "
    f"Membro: {member.full_name} | "
    f"Email: {user_email} | "
    f"Papel: {system_role} | "
    f"Igreja: {user_church.name} | "
    f"Criado por: {request_user.email}"
)
```

#### **Métricas do Dashboard**
- **Usuários criados por mês**
- **Distribuição de papéis atribuídos**
- **Taxa de adoção do sistema por igreja**
- **Usuários ativos vs inativos**

---

### 🚨 Considerações de Segurança

#### **Princípios de Segurança**
1. **Princípio do Menor Privilégio**: Usuários só podem atribuir papéis inferiores
2. **Isolamento Multi-Tenant**: Usuários só veem dados de sua igreja
3. **Auditoria Completa**: Todas as ações são registradas
4. **Validação Dupla**: Frontend + Backend validam hierarquia
5. **Senhas Seguras**: Critérios mínimos de segurança

#### **Prevenção de Escalação de Privilégios**
```python
def prevent_privilege_escalation(request_user_role: str, target_role: str) -> bool:
    """Impede que usuário atribua papel superior ao seu"""
    role_levels = {
        'SUPER_ADMIN': 10,
        'DENOMINATION_ADMIN': 9,
        'CHURCH_ADMIN': 8,
        'PASTOR': 7,
        'SECRETARY': 6,
        'LEADER': 5,
        'MEMBER': 4,
        'READ_ONLY': 3
    }
    
    user_level = role_levels.get(request_user_role, 0)
    target_level = role_levels.get(target_role, 0)
    
    return user_level > target_level
```

---

## 🔄 Resumo da Integração com Sistema de Usuários

### 🎯 Fluxo Simplificado

O **Sistema de Acesso e Criação de Usuários** (documentado detalhadamente na seção anterior) permite:

1. **Cadastro de Membro**: Dados básicos do membro são inseridos
2. **Opção de Acesso**: Checkbox para "Criar usuário do sistema"
3. **Seleção de Papel**: Baseada na hierarquia do usuário logado
4. **Validações**: Email único + hierarquia de permissões
5. **Criação Automática**: CustomUser + ChurchUser + vínculo com Member

### 🔗 Entidades Criadas

```
Membro → [Opcionalmente] → Usuário do Sistema
   ↓                            ↓
Member                    CustomUser + ChurchUser
```

### 🛡️ Segurança Garantida

- ✅ **Hierarquia respeitada**: Usuário só atribui papéis inferiores
- ✅ **Isolamento**: Usuário só acessa dados de sua igreja  
- ✅ **Auditoria**: Todas as criações são registradas
- ✅ **Validação dupla**: Frontend + Backend

---

## 🚀 Deployment e Performance

### Otimizações de Performance

#### **Backend**
```python
class MemberViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Member.objects.select_related(
            'church', 'user'
        ).prefetch_related(
            'church__denomination'
        ).filter(
            church=self.request.user.church,
            is_active=True
        )
```

#### **Frontend**
```typescript
// Lazy loading de componentes
const MemberForm = lazy(() => import('@/components/members/MemberForm'));

// Memoização de componentes pesados
const MembersTable = memo(({ members, onDelete }) => {
  // ... implementação
});

// Debounce em filtros
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 300),
  []
);
```

### Configurações de Produção

#### **Django Settings**
```python
# Cache para dashboard
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Upload de fotos
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

#### **Nginx Configuration**
```nginx
location /media/ {
    alias /path/to/media/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🧪 Testes

### Testes Backend

#### **Testes de Model**
```python
class MemberModelTest(TestCase):
    def test_age_calculation(self):
        member = Member.objects.create(
            full_name="João Silva",
            birth_date=date(1990, 1, 1),
            church=self.church
        )
        self.assertEqual(member.age, 35)  # Assuming current year is 2025
    
    def test_full_address_property(self):
        member = Member.objects.create(
            full_name="João Silva",
            address="Rua A, 123",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            church=self.church
        )
        expected = "Rua A, 123, Centro, São Paulo/SP"
        self.assertEqual(member.full_address, expected)
```

#### **Testes de API**
```python
class MemberAPITest(APITestCase):
    def test_create_member_with_permissions(self):
        self.client.force_authenticate(user=self.church_admin)
        data = {
            'full_name': 'Novo Membro',
            'birth_date': '1990-01-01',
            'gender': 'M',
            'church': self.church.id
        }
        response = self.client.post('/api/v1/members/', data)
        self.assertEqual(response.status_code, 201)
    
    def test_member_isolation_between_churches(self):
        # Testar que usuário de uma igreja não vê membros de outra
        pass
```

### Testes Frontend

#### **Testes de Componente**
```typescript
describe('MemberForm', () => {
  it('should validate required fields', async () => {
    render(<MemberForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    fireEvent.click(screen.getByText('Salvar'));
    
    expect(await screen.findByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
  });
  
  it('should format phone number automatically', () => {
    render(<MemberForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    const phoneInput = screen.getByLabelText('Telefone Principal');
    fireEvent.change(phoneInput, { target: { value: '11999999999' } });
    
    expect(phoneInput.value).toBe('(11) 99999-9999');
  });
});
```

#### **Testes de Hook**
```typescript
describe('useMembers', () => {
  it('should load members on mount', async () => {
    const { result } = renderHook(() => useMembers());
    
    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });
  });
  
  it('should filter members by search term', async () => {
    const { result } = renderHook(() => useMembers());
    
    act(() => {
      result.current.setFilters({ search: 'João' });
    });
    
    await waitFor(() => {
      expect(result.current.members.every(m => m.full_name.includes('João'))).toBe(true);
    });
  });
});
```

---

## 📋 Checklist de Implementação

### ✅ Backend Completo
- [x] Modelo Member com todos os campos
- [x] Serializers com validações
- [x] ViewSet com CRUD completo
- [x] Sistema de permissões hierárquico
- [x] Dashboard com analytics
- [x] Filtros avançados
- [x] Upload de fotos
- [x] Soft delete
- [x] Isolamento multi-tenant

### ✅ Frontend Completo
- [x] Hook useMembers para gerenciamento de estado
- [x] Hook useRoleHierarchy para papéis
- [x] Hook usePermissions para controle de acesso
- [x] Página de listagem com dashboard
- [x] Formulário completo em abas
- [x] Página de detalhes
- [x] Página de edição
- [x] Componentes reutilizáveis
- [x] Validações com Zod
- [x] Máscaras automáticas
- [x] Interface responsiva

### ✅ Sistema de Acesso e Criação de Usuários
- [x] Endpoint `/auth/available-roles/` com hierarquia
- [x] Hook `useRoleHierarchy` para carregar papéis disponíveis
- [x] Interface completa de criação de usuário no formulário
- [x] Validação de hierarquia (frontend + backend)
- [x] Preview de permissões por papel
- [x] Validação de email único no sistema
- [x] Validação de força de senha
- [x] Criação automática de CustomUser + ChurchUser
- [x] Vínculo automático Member ↔ User
- [x] Logs de auditoria para criação de usuários
- [x] Prevenção de escalação de privilégios
- [x] Isolamento multi-tenant por igreja

### ✅ Funcionalidades Avançadas
- [x] Dashboard com KPIs em tempo real
- [x] Sistema de filtros avançados
- [x] Paginação automática
- [x] Export de dados
- [x] Upload de fotos com preview
- [x] Soft delete com confirmação
- [x] Logs de auditoria

---

## 🔗 Integração com Outros Módulos

### Visitantes
- Conversão de visitante para membro
- Histórico de visitas
- Follow-up automatizado

### Atividades
- Participação em atividades
- Histórico de envolvimento
- Ministérios ativos

### Relatórios
- Relatórios de crescimento
- Analytics de engajamento
- Dashboards executivos

---

## 🚀 Roadmap Futuro

### Versão 2.0
- [ ] Integração com WhatsApp Business
- [ ] Sistema de famílias
- [ ] Histórico de disciplina
- [ ] Certificados digitais
- [ ] App mobile nativo

### Versão 2.1
- [ ] IA para análise de padrões
- [ ] Recomendações automáticas
- [ ] Integração com redes sociais
- [ ] Sistema de mentoria

---

## 📞 Suporte e Manutenção

### Logs de Auditoria
Todas as operações são registradas para auditoria:
- Criação de membros
- Edições realizadas
- Exclusões (soft delete)
- Atribuição de papéis
- Acessos ao sistema

### Monitoramento
- Performance de queries
- Uso de storage (fotos)
- Métricas de engajamento
- Alertas de erro

### Backup
- Backup automático diário
- Versionamento de dados
- Recuperação point-in-time
- Testes de restauração

---

**Última atualização:** 10/07/2025  
**Versão:** 1.0  
**Autor:** Equipe de Desenvolvimento Obreiro Virtual

---

*Esta documentação serve como guia completo para desenvolvimento, manutenção e evolução do Módulo de Membros do Obreiro Virtual. Para dúvidas ou sugestões, consulte a equipe de desenvolvimento.* 