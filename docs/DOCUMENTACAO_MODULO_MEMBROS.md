# Documentação Técnica - Módulo de Membros

**Projeto:** Obreiro Digital  
**Data:** 31 de agosto de 2025  
**Versão:** 1.0  
**Autores:** Análise gerada por IA com revisão técnica

## 1. Visão Geral e Arquitetura

O módulo de **Membros** é um componente central do sistema Obreiro Digital, responsável por toda a gestão da membresia da igreja. Ele foi projetado para ser robusto, escalável e seguro, operando dentro de uma arquitetura multi-tenant onde cada igreja tem seus dados isolados.

### 1.1. Arquitetura Lógica

- **Backend (Django REST Framework):** Fornece uma API RESTful para todas as operações de CRUD (Criar, Ler, Atualizar, Deletar) de membros. A lógica de negócio, validações e permissões são centralizadas aqui.
- **Frontend (React + TypeScript):** Consome a API do backend para oferecer uma interface de usuário reativa e moderna para a gestão de membros. Utiliza `React Query` para caching e sincronização de estado com o servidor.
- **Banco de Dados (PostgreSQL):** Armazena todos os dados dos membros, com relacionamentos bem definidos para garantir a integridade referencial.

### 1.2. Fluxo de Dados Principal

O fluxo de interação entre os componentes segue o padrão:

```
Componente React (UI) -> Hook (useMembers) -> Service (membersService) -> API (Django ViewSet) -> Serializer -> Model (Banco de Dados)
```

### 1.3. Relacionamentos do Modelo

O modelo `Member` é o coração do módulo e se relaciona com várias outras entidades do sistema:

- **`Church` (Obrigatório):** Cada membro pertence a uma única `Church` (tenant). Este é o principal pilar do isolamento de dados.
- **`User` (Opcional):** Um membro pode ter um `User` associado, permitindo que ele acesse o sistema com permissões específicas.
- **`Branch` (Implícito via `Church`):** Embora não haja um `ForeignKey` direto para `Branch` no modelo `Member`, o relacionamento existe através da `Church`.
- **`Visitor` (Opcional):** Um membro pode ter sido originado de um registro de `Visitor`. O campo `visitor_origin` no modelo `Member` rastreia essa conversão.
- **`MembershipStatus` (Obrigatório):** Cada membro possui um histórico de status ministeriais, gerenciado pelo modelo `MembershipStatus`.

---

## 2. Modelos de Banco de Dados (Backend)

### 2.1. `apps.members.models.Member`

O modelo principal que armazena todas as informações dos membros.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| **Relacionamentos** |
| `church` | `ForeignKey('churches.Church')` | **(Multi-tenant)** Igreja à qual o membro pertence. |
| `user` | `OneToOneField(User)` | Link para usuário do sistema (se houver). |
| `visitor_origin` | `OneToOneField('visitors.Visitor')` | Link para visitante original (se conversão). |
| `spouse_member` | `ForeignKey('self')` | Link para cônjuge membro. |
| `responsible` | `ForeignKey('self')` | Responsável legal (para menores). |
| **Dados Pessoais** |
| `full_name` | `CharField(200)` | Nome completo do membro. |
| `cpf` | `CharField(14)` | CPF formatado (único). |
| `rg` | `CharField(20)` | Documento de identidade. |
| `birth_date` | `DateField` | Data de nascimento. |
| `gender` | `CharField(1)` | Gênero (M/F). |
| `marital_status` | `CharField(20)` | Estado civil. |
| `photo` | `ImageField` | Foto de perfil. |
| **Contato** |
| `email` | `EmailField` | E-mail pessoal. |
| `phone` | `CharField(20)` | Telefone principal. |
| `address`, `city`, `state`, `zipcode` | `CharField/TextField` | Endereço completo. |
| **Dados Eclesiásticos** |
| `membership_status` | `CharField(20)` | Status geral (`active`, `inactive`, etc.). |
| `membership_date` | `DateField` | Data que se tornou membro. |
| `baptism_date` | `DateField` | Data do batismo. |
| `conversion_date` | `DateField` | Data da conversão. |
| `previous_church` | `CharField(200)` | Igreja anterior. |
| `transfer_letter` | `BooleanField` | Possui carta de transferência. |
| **Dados Ministeriais** |
| `ministerial_function` | `CharField(100)` | Função ministerial principal. |
| `ordination_date` | `DateField` | Data de ordenação. |
| **Dados Familiares** |
| `spouse_name` | `CharField(200)` | Nome do cônjuge. |
| `spouse_is_member` | `BooleanField` | Cônjuge é membro. |
| `children_count` | `PositiveSmallIntegerField` | Quantidade de filhos. |
| **Outros** |
| `notes` | `TextField` | Observações gerais. |
| `is_active` | `BooleanField` | Status lógico do registro. |

**Métodos Importantes:**
- `age()`: Calcula idade baseada na data de nascimento
- `membership_years()`: Calcula anos de membresia
- `full_address()`: Retorna endereço formatado completo
- `save()`: Validações customizadas (datas, consistência)

### 2.2. `apps.members.models.MembershipStatus`

Modelo para histórico de funções ministeriais.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `member` | `ForeignKey(Member)` | Membro relacionado. |
| `status` | `CharField(50)` | Função ministerial. |
| `is_active` | `BooleanField` | Status atual ativo. |
| `ordination_date` | `DateField` | Data de ordenação. |
| `termination_date` | `DateField` | Data de término. |
| `observation` | `TextField` | Notas específicas. |

### 2.3. `apps.members.models.MemberTransferLog`

Modelo para registro de transferências entre igrejas.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `member` | `ForeignKey(Member)` | Membro transferido. |
| `origin_church` | `ForeignKey('churches.Church')` | Igreja de origem. |
| `destination_church` | `ForeignKey('churches.Church')` | Igreja de destino. |
| `transfer_date` | `DateTimeField` | Data da transferência. |
| `reason` | `TextField` | Motivo da transferência. |
| `approved_by` | `ForeignKey(User)` | Usuário que aprovou. |

---

## 3. API Endpoints (Backend)

### 3.1. Endpoints Principais

A API é acessível sob o prefixo `/api/v1/members/`.

| Endpoint | Método | Ação | Descrição | Permissões |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/members/` | `GET` | `list` | Lista membros com paginação e filtros | `IsAuthenticated` |
| `/api/v1/members/` | `POST` | `create` | Cria um novo membro | `CanManageMembers` |
| `/api/v1/members/{id}/` | `GET` | `retrieve` | Detalhes de um membro | `IsAuthenticated` |
| `/api/v1/members/{id}/` | `PUT/PATCH` | `update` | Atualiza um membro | `CanManageMembers` |
| `/api/v1/members/{id}/` | `DELETE` | `destroy` | Exclui um membro | `CanManageMembers` |

### 3.2. Endpoints Customizados

| Endpoint | Método | Descrição |
| :--- | :--- | :--- |
| `/api/v1/members/dashboard/` | `GET` | Estatísticas do dashboard |
| `/api/v1/members/{id}/profile/` | `GET` | Perfil completo com dados familiares |
| `/api/v1/members/{id}/upload_photo/` | `POST` | Upload de foto de perfil |
| `/api/v1/members/{id}/transfer/` | `POST` | Transferir membro para outra igreja |
| `/api/v1/members/bulk_action/` | `POST` | Ações em massa |
| `/api/v1/members/export/` | `GET` | Exportar dados (CSV/Excel) |

### 3.3. Parâmetros de Filtro e Busca

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `search` | `string` | Busca por nome, email ou CPF |
| `membership_status` | `string` | Filtra por status (`active`, `inactive`, etc.) |
| `ministerial_function` | `string` | Filtra por função ministerial |
| `gender` | `string` | Filtra por gênero (`M`, `F`) |
| `age_min` | `integer` | Idade mínima |
| `age_max` | `integer` | Idade máxima |
| `has_photo` | `boolean` | Possui foto de perfil |
| `page` | `integer` | Página da paginação |
| `page_size` | `integer` | Quantidade por página |

### 3.4. Exemplos de Requisições

**Criar Membro:**
```bash
curl -X POST http://localhost:8000/api/v1/members/ \
  -H "Authorization: Token <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva",
    "cpf": "123.456.789-01",
    "birth_date": "1990-05-15",
    "gender": "M",
    "email": "joao@example.com",
    "phone": "(11) 98765-4321",
    "membership_status": "active",
    "membership_date": "2023-01-01"
  }'
```

**Buscar Membros:**
```bash
curl "http://localhost:8000/api/v1/members/?search=João&membership_status=active&page=1" \
  -H "Authorization: Token <token>"
```

**Upload de Foto:**
```bash
curl -X POST http://localhost:8000/api/v1/members/1/upload_photo/ \
  -H "Authorization: Token <token>" \
  -F "photo=@photo.jpg"
```

---

## 4. Frontend (React + TypeScript)

### 4.1. Estrutura de Componentes

```
frontend/src/
├── pages/
│   ├── Membros.tsx              # Lista principal
│   ├── NovoMembro.tsx           # Formulário de criação
│   ├── EditarMembro.tsx         # Formulário de edição
│   └── DetalhesMembro.tsx       # Visualização detalhada
├── components/members/
│   ├── MembersTable.tsx         # Tabela de membros
│   ├── MembersFilters.tsx       # Filtros e busca
│   ├── MemberForm.tsx           # Formulário completo
│   ├── MemberDetails.tsx        # Detalhes do perfil
│   └── MemberCard.tsx           # Card resumido
├── hooks/
│   └── useMembers.ts            # Hook customizado
└── services/
    └── membersService.ts        # Camada de API
```

### 4.2. Hook Customizado (`useMembers`)

O hook `useMembers` centraliza toda a lógica de estado e operações:

```typescript
export const useMembers = () => {
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    status: '',
    ministerial_function: '',
    page: 1,
  });

  // Queries
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['membersDashboard'],
    queryFn: membersService.getDashboard,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members', filters],
    queryFn: () => membersService.getMembers(filters),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateMemberData) => membersService.createMember(data),
    onSuccess: () => {
      toast.success('Membro criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  return {
    // Dados
    members: membersData?.results || [],
    dashboard,
    
    // Estados
    loading: dashboardLoading || membersLoading,
    
    // Filtros
    filters,
    setFilters,
    
    // Ações
    createMember: createMutation.mutateAsync,
    updateMember: updateMutation.mutateAsync,
    deleteMember: deleteMutation.mutateAsync,
  };
};
```

### 4.3. Serviço de API (`membersService`)

```typescript
class MembersService {
  private baseURL = '/members';

  async getMembers(params?: MemberFilters): Promise<PaginatedResponse<Member>> {
    const response = await api.get(this.baseURL, { params });
    return response.data;
  }

  async getMember(id: number): Promise<Member> {
    const response = await api.get(`${this.baseURL}/${id}/`);
    return response.data;
  }

  async createMember(data: CreateMemberData): Promise<Member> {
    const response = await api.post(this.baseURL, data);
    return response.data;
  }

  async updateMember(id: number, data: Partial<CreateMemberData>): Promise<Member> {
    const response = await api.patch(`${this.baseURL}/${id}/`, data);
    return response.data;
  }

  async uploadPhoto(id: number, file: File): Promise<Member> {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(`${this.baseURL}/${id}/upload_photo/`, formData);
    return response.data;
  }
}

export const membersService = new MembersService();
```

### 4.4. Validação de Formulários

O sistema usa `react-hook-form` + `zod` para validação:

```typescript
const memberSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  birth_date: z.string().refine(
    (date) => new Date(date) < new Date(),
    'Data de nascimento deve ser no passado'
  ),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  membership_status: z.enum(['active', 'inactive', 'transferred', 'deceased']),
});

type MemberFormData = z.infer<typeof memberSchema>;
```

---

## 5. Funcionalidades Avançadas

### 5.1. Sistema de Status e Transferências

#### Status de Membresia
- **`active`**: Membro ativo na igreja
- **`inactive`**: Membro inativo (não participa)
- **`transferred`**: Transferido para outra igreja
- **`deceased`**: Falecido
- **`disciplined`**: Sob disciplina eclesiástica
- **`visitor`**: Status temporário para novos registros

#### Processo de Transferência
1. Administrador inicia transferência na interface
2. Sistema cria registro em `MemberTransferLog`
3. Status do membro é alterado para `transferred`
4. Notificação é enviada para a igreja de destino
5. Igreja de destino pode aceitar ou rejeitar

```python
def transfer_member(member, destination_church, reason, approved_by):
    """Transfere membro para outra igreja"""
    # Criar log de transferência
    transfer_log = MemberTransferLog.objects.create(
        member=member,
        origin_church=member.church,
        destination_church=destination_church,
        reason=reason,
        approved_by=approved_by
    )
    
    # Atualizar status e igreja do membro
    member.membership_status = 'transferred'
    member.church = destination_church
    member.save()
    
    return transfer_log
```

### 5.2. Conversão de Visitantes

O fluxo de conversão é gerenciado através do endpoint específico:

```typescript
// Frontend - Conversão de visitante
const convertVisitorToMember = async (visitorId: number, memberData: Partial<CreateMemberData>) => {
  try {
    const response = await api.post(`/visitors/${visitorId}/convert_to_member/`, memberData);
    
    // Atualiza queries relacionadas
    queryClient.invalidateQueries(['members']);
    queryClient.invalidateQueries(['visitors']);
    
    toast.success('Visitante convertido em membro com sucesso!');
    return response.data;
  } catch (error) {
    toast.error('Erro ao converter visitante');
    throw error;
  }
};
```

### 5.3. Upload e Gestão de Fotos

#### Configuração do Upload
```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# models.py
photo = models.ImageField(
    upload_to='members/photos/',
    blank=True,
    null=True,
    validators=[
        FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']),
        validate_file_size
    ]
)
```

#### Componente de Upload
```typescript
const PhotoUpload: React.FC<{ memberId: number }> = ({ memberId }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await membersService.uploadPhoto(memberId, file);
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload">
      <input
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
};
```

### 5.4. Dashboard e Relatórios

O dashboard fornece métricas importantes:

```python
def get_dashboard_data(self, request):
    """Retorna dados para o dashboard de membros"""
    church = request.user.church
    
    members_qs = Member.objects.filter(church=church, is_active=True)
    
    # Estatísticas básicas
    total_members = members_qs.count()
    active_members = members_qs.filter(membership_status='active').count()
    new_members_month = members_qs.filter(
        membership_date__gte=timezone.now() - timedelta(days=30)
    ).count()
    
    # Estatísticas por gênero
    by_gender = members_qs.values('gender').annotate(
        count=Count('id')
    ).order_by('gender')
    
    # Estatísticas por função ministerial
    by_function = members_qs.exclude(
        ministerial_function__isnull=True
    ).values('ministerial_function').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Aniversariantes do mês
    current_month = timezone.now().month
    birthdays_month = members_qs.filter(
        birth_date__month=current_month
    ).order_by('birth_date')[:10]
    
    return Response({
        'total_members': total_members,
        'active_members': active_members,
        'new_members_month': new_members_month,
        'by_gender': by_gender,
        'by_function': by_function,
        'birthdays_month': MemberBirthdaySerializer(birthdays_month, many=True).data
    })
```

---

## 6. Sistema de Permissões e Segurança

### 6.1. Hierarquia de Permissões

O sistema opera com 8 níveis hierárquicos:

| Nível | Role | Descrição | Permissões no Módulo |
| :--- | :--- | :--- | :--- |
| 10 | `SUPER_ADMIN` | Admin da plataforma | Acesso total a todos os membros |
| 9 | `DENOMINATION_ADMIN` | Admin de denominação | Acesso a membros da denominação |
| 8 | `CHURCH_ADMIN` | Admin da igreja | Acesso total aos membros da igreja |
| 7 | `PASTOR` | Pastor da igreja | Acesso total aos membros da igreja |
| 6 | `SECRETARY` | Secretário | CRUD completo de membros |
| 5 | `LEADER` | Líder/Diácono | Visualizar e editar membros |
| 4 | `MEMBER` | Membro comum | Visualizar lista de membros |
| 3 | `READ_ONLY` | Apenas leitura | Visualizar informações básicas |

### 6.2. Implementação de Permissões

```python
# views.py
class MemberViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsMemberUser]
    
    def get_permissions(self):
        """Permissões específicas por ação"""
        if self.action in ['create', 'update', 'destroy', 'transfer']:
            permission_classes = [IsAuthenticated, CanManageMembers]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsMemberUser]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtro automático por igreja (multi-tenant)"""
        user = self.request.user
        
        if user.is_superuser:
            return Member.objects.all()
        
        # Filtrar por igreja do usuário
        church = getattr(user, 'church', None)
        if not church:
            return Member.objects.none()
            
        return Member.objects.filter(church=church, is_active=True)
```

### 6.3. Validações de Segurança

```python
# serializers.py
class MemberCreateSerializer(serializers.ModelSerializer):
    def validate_cpf(self, value):
        """Valida se CPF é único"""
        if Member.objects.filter(cpf=value, is_active=True).exists():
            raise serializers.ValidationError("CPF já está em uso")
        return value
    
    def validate_email(self, value):
        """Valida se email é único"""
        if Member.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("Email já está em uso")
        return value
    
    def validate(self, attrs):
        """Validações cross-field"""
        birth_date = attrs.get('birth_date')
        baptism_date = attrs.get('baptism_date')
        
        if birth_date and baptism_date:
            if baptism_date < birth_date:
                raise serializers.ValidationError(
                    "Data de batismo não pode ser anterior ao nascimento"
                )
        
        return attrs
```

---

## 7. Testes e Qualidade

### 7.1. Estrutura de Testes

```python
# tests/test_members.py
class MemberModelTests(TestCase):
    def setUp(self):
        self.church = Church.objects.create(name="Igreja Teste")
        self.member = Member.objects.create(
            church=self.church,
            full_name="João Silva",
            birth_date="1990-01-01"
        )
    
    def test_age_calculation(self):
        """Testa cálculo de idade"""
        expected_age = timezone.now().year - 1990
        self.assertEqual(self.member.age, expected_age)
    
    def test_cpf_uniqueness(self):
        """Testa unicidade do CPF"""
        with self.assertRaises(ValidationError):
            Member.objects.create(
                church=self.church,
                full_name="Maria Silva",
                cpf=self.member.cpf
            )

class MemberAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@test.com',
            password='testpass'
        )
        self.church = Church.objects.create(name="Igreja Teste")
        self.client.force_authenticate(user=self.user)
    
    def test_create_member(self):
        """Testa criação de membro via API"""
        data = {
            'full_name': 'João Silva',
            'cpf': '123.456.789-01',
            'birth_date': '1990-01-01',
            'membership_status': 'active'
        }
        response = self.client.post('/api/v1/members/', data)
        self.assertEqual(response.status_code, 201)
    
    def test_list_members_filtered_by_church(self):
        """Testa isolamento multi-tenant"""
        response = self.client.get('/api/v1/members/')
        self.assertEqual(response.status_code, 200)
        # Verificar se apenas membros da igreja do usuário são retornados
```

### 7.2. Comandos de Teste

```bash
# Executar todos os testes do módulo
python manage.py test apps.members

# Executar testes específicos
python manage.py test apps.members.tests.MemberModelTests

# Executar com cobertura
coverage run --source='.' manage.py test apps.members
coverage report
coverage html
```

---

## 8. Troubleshooting e Manutenção

### 8.1. Problemas Comuns

**Problema: Membro não aparece na lista**
- **Causa:** Filtros aplicados ou membro inativo
- **Solução:** Verificar filtros de status e busca
- **Debug:** Verificar no admin Django se `is_active=True`

**Problema: Erro "CPF já existe"**
- **Causa:** Tentativa de criar membro com CPF duplicado
- **Solução:** Buscar membro existente ou verificar formatação
- **Debug:** Query SQL: `SELECT * FROM members_member WHERE cpf = '...'`

**Problema: Upload de foto falha**
- **Causa:** Permissões de arquivo ou tamanho
- **Solução:** Verificar permissões da pasta `media/` e configuração Nginx
- **Debug:** Logs do Django e Nginx

**Problema: Conversão de visitante falha**
- **Causa:** Dados incompletos ou conflitos
- **Solução:** Verificar campos obrigatórios e validações
- **Debug:** Logs da API e dados do visitante

### 8.2. Logs e Monitoramento

```python
# settings.py - Configuração de logs
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'members_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/obreiro/members.log',
        },
    },
    'loggers': {
        'apps.members': {
            'handlers': ['members_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# views.py - Logging de ações
import logging
logger = logging.getLogger('apps.members')

def create(self, request, *args, **kwargs):
    logger.info(f"Criando membro: {request.data.get('full_name')} por {request.user.email}")
    response = super().create(request, *args, **kwargs)
    logger.info(f"Membro criado com ID: {response.data.get('id')}")
    return response
```

### 8.3. Comandos de Manutenção

```bash
# Reindexar busca de membros
python manage.py update_search_index

# Atualizar fotos sem URL
python manage.py fix_member_photos

# Verificar consistência de dados
python manage.py validate_members_data

# Backup de dados de membros
python manage.py backup_members --church-id=1 --output=/tmp/backup.json

# Migração de dados legados
python manage.py migrate_legacy_members --file=dados_antigos.csv
```

---

## 9. Deploy e Configuração

### 9.1. Variáveis de Ambiente

```env
# settings.py relacionados
MEDIA_URL=/media/
MEDIA_ROOT=/app/media
MAX_UPLOAD_SIZE=5242880  # 5MB

# Nginx
CLIENT_MAX_BODY_SIZE=10M

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/obreiro_db

# Email (para notificações)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### 9.2. Configuração de Produção

```yaml
# docker-compose.prod.yml
services:
  backend:
    volumes:
      - media_data:/app/media
    environment:
      - MEDIA_URL=/media/
      - MEDIA_ROOT=/app/media
  
  nginx:
    volumes:
      - media_data:/var/www/media
    
volumes:
  media_data:
```

```nginx
# nginx/prod.conf
location /media/ {
    alias /var/www/media/;
    expires 1y;
    access_log off;
    add_header Cache-Control "public, immutable";
}
```

### 9.3. Checklist de Deploy

- [ ] Migrações aplicadas (`python manage.py migrate`)
- [ ] Arquivos estáticos coletados (`python manage.py collectstatic`)
- [ ] Permissões da pasta media configuradas
- [ ] Nginx configurado para servir media files
- [ ] Backup dos dados configurado
- [ ] Logs configurados e funcionando
- [ ] Monitoramento de performance ativo
- [ ] SSL/HTTPS funcionando para uploads
- [ ] Validação de integridade de dados

### 9.4. Scripts de Deploy

```bash
#!/bin/bash
# deploy-members.sh

echo "Aplicando migrações..."
python manage.py migrate

echo "Validando dados de membros..."
python manage.py validate_members_data

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "Verificando permissões de media..."
chown -R www-data:www-data media/
chmod -R 755 media/

echo "Reiniciando serviços..."
systemctl reload nginx
systemctl restart gunicorn

echo "Deploy do módulo de membros concluído!"
```

---

## 10. Extensibilidade e Melhorias Futuras

### 10.1. Funcionalidades Planejadas

**Integração com Sistemas Externos:**
- Sincronização com sistemas de denominação
- Integração com plataformas de comunicação (WhatsApp, Email)
- Conexão com sistemas de contribuição financeira

**Melhorias de UX:**
- Importação em massa via CSV/Excel
- Geração automática de relatórios
- Dashboard personalizado por função
- Aplicativo mobile para consulta

**Analytics e Relatórios:**
- Métricas de crescimento de membresia
- Análise demográfica avançada
- Relatórios de aniversariantes automáticos
- Dashboards executivos

### 10.2. Arquitetura para Expansão

```python
# Padrão para extensões
class MemberExtension(ABC):
    @abstractmethod
    def process_member_data(self, member: Member) -> dict:
        pass
    
    @abstractmethod
    def validate_extension_data(self, data: dict) -> bool:
        pass

# Registro de extensões
MEMBER_EXTENSIONS = [
    'apps.members.extensions.FinancialExtension',
    'apps.members.extensions.MinistryExtension',
    'apps.members.extensions.CommunicationExtension',
]
```

### 10.3. API Versionamento

```python
# Para futuras versões da API
urlpatterns = [
    path('api/v1/', include('apps.members.urls.v1')),
    path('api/v2/', include('apps.members.urls.v2')),  # Futura versão
]

# Versionamento de serializers
class MemberSerializerV2(MemberSerializer):
    # Novos campos e validações
    social_networks = serializers.JSONField()
    emergency_contact = serializers.SerializerMethodField()
```

---

## 11. Conclusão

O Módulo de Membros representa uma das funcionalidades mais críticas do sistema Obreiro Digital. Sua implementação robusta, com foco em segurança, escalabilidade e usabilidade, fornece uma base sólida para a gestão eclesiástica moderna.

### Pontos Fortes da Implementação:
- ✅ **Isolamento Multi-tenant**: Dados completamente isolados por igreja
- ✅ **API RESTful Completa**: Endpoints bem documentados e testados
- ✅ **Interface Moderna**: React/TypeScript com experiência de usuário otimizada
- ✅ **Validações Robustas**: Múltiplas camadas de validação de dados
- ✅ **Sistema de Permissões**: Controle granular baseado em hierarquia
- ✅ **Extensibilidade**: Arquitetura preparada para futuras expansões

### Responsabilidades da Equipe de Manutenção:
1. **Monitorar** performance e logs regularmente
2. **Manter** testes atualizados conforme mudanças
3. **Validar** integridade de dados periodicamente
4. **Atualizar** documentação com novas funcionalidades
5. **Implementar** melhorias de segurança conforme necessário

Esta documentação deve ser considerada um documento vivo, atualizado sempre que houver mudanças significativas no módulo. Para dúvidas específicas ou cenários não cobertos, consulte os logs do sistema ou a equipe de desenvolvimento.

**Próxima revisão recomendada:** 30 de novembro de 2025