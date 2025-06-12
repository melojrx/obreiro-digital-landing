from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from accounts.models import UserProfile, ChurchUser
from denominations.models import Denomination
from churches.models import Church
from branches.models import Branch
from members.models import Member
from visitors.models import Visitor
from activities.models import Ministry, Activity

User = get_user_model()

print("🚀 Criando dados de exemplo...")

# 1. Criar Denominação
denom = Denomination.objects.create(
    name="Assembleia de Deus",
    description="Denominação pentecostal",
    founded_year=1911,
    is_active=True
)
print(f"✅ Denominação criada: {denom.name}")

# 2. Criar Igreja
igreja = Church.objects.create(
    denomination=denom,
    name="Igreja Central São Paulo",
    cnpj="12.345.678/0001-90",
    email="contato@igreja.com.br",
    phone="(11) 3456-7890",
    address="Rua das Flores, 123",
    city="São Paulo",
    state="SP",
    zip_code="01234-567",
    subscription_plan="premium",
    subscription_status="active",
    max_members=1000,
    max_branches=10,
    monthly_fee=Decimal("299.90"),
    is_active=True
)
print(f"✅ Igreja criada: {igreja.name}")

# 3. Criar Filial
filial = Branch.objects.create(
    church=igreja,
    name="Sede Central",
    address="Rua das Flores, 123",
    city="São Paulo",
    state="SP",
    zip_code="01234-567",
    phone="(11) 3456-7890",
    email="sede@igreja.com.br",
    capacity=500,
    is_headquarters=True,
    is_active=True
)
print(f"✅ Filial criada: {filial.name}")

# 4. Criar Usuário Pastor
pastor = User.objects.create_user(
    username="pastor.joao",
    email="pastor@igreja.com.br",
    first_name="João",
    last_name="Silva",
    password="senha123"
)

pastor_profile = UserProfile.objects.create(
    user=pastor,
    phone="(11) 99999-1111",
    birth_date=datetime(1975, 5, 15).date(),
    email_notifications=True,
    is_verified=True
)

church_user = ChurchUser.objects.create(
    user=pastor,
    church=igreja,
    role="admin",
    is_active=True,
    joined_at=datetime.now()
)
print(f"✅ Pastor criado: {pastor.username}")

# 5. Criar Ministério
ministerio = Ministry.objects.create(
    church=igreja,
    name="Ministério de Louvor",
    description="Responsável pela música",
    is_active=True
)
print(f"✅ Ministério criado: {ministerio.name}")

# 6. Criar Membro
membro = Member.objects.create(
    church=igreja,
    branch=filial,
    first_name="Ana",
    last_name="Costa",
    email="ana@email.com",
    phone="(11) 91111-1111",
    birth_date=datetime(1990, 3, 15).date(),
    address="Rua A, 123",
    city="São Paulo",
    state="SP",
    zip_code="01111-111",
    membership_status="active",
    is_active=True
)
print(f"✅ Membro criado: {membro.first_name} {membro.last_name}")

# 7. Criar Visitante
visitante = Visitor.objects.create(
    church=igreja,
    branch=filial,
    first_name="Lucas",
    last_name="Mendes",
    email="lucas@email.com",
    phone="(11) 96666-6666",
    birth_date=datetime(1988, 4, 20).date(),
    address="Rua F, 987",
    city="São Paulo",
    state="SP",
    zip_code="06666-666",
    first_visit_date=datetime.now().date(),
    visit_reason="Convite de amigo"
)
print(f"✅ Visitante criado: {visitante.first_name} {visitante.last_name}")

# 8. Criar Atividade
atividade = Activity.objects.create(
    church=igreja,
    branch=filial,
    ministry=ministerio,
    name="Culto Dominical",
    description="Culto principal de domingo",
    activity_type="worship",
    start_datetime=datetime.now() + timedelta(days=7, hours=10),
    end_datetime=datetime.now() + timedelta(days=7, hours=12),
    max_participants=500,
    requires_registration=False,
    is_active=True
)
print(f"✅ Atividade criada: {atividade.name}")

print("\n📊 Resumo:")
print(f"   • {Denomination.objects.count()} denominações")
print(f"   • {Church.objects.count()} igrejas")
print(f"   • {Branch.objects.count()} filiais")
print(f"   • {User.objects.filter(is_superuser=False).count()} usuários")
print(f"   • {Ministry.objects.count()} ministérios")
print(f"   • {Member.objects.count()} membros")
print(f"   • {Visitor.objects.count()} visitantes")
print(f"   • {Activity.objects.count()} atividades")

print("\n✅ Dados criados com sucesso!")
print("🌐 Acesse: http://127.0.0.1:8000/admin/")
print("👤 Login admin/senha ou pastor.joao/senha123") 