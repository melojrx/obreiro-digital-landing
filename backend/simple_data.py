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

print("🚀 Criando dados básicos...")

# 1. Criar usuário admin para denominação
admin_user = User.objects.create_user(
    username="admin.denominacao",
    email="admin@denominacao.com.br", 
    first_name="Admin",
    last_name="Denominação",
    password="senha123"
)

# 2. Criar Denominação
denom = Denomination.objects.create(
    name="Assembleia de Deus",
    short_name="AD SP",
    description="Denominação pentecostal",
    administrator=admin_user,
    email="contato@adsp.com.br",
    phone="(11) 3456-7890",
    headquarters_address="Rua Central, 100",
    headquarters_city="São Paulo",
    headquarters_state="SP",
    headquarters_zipcode="01234-567",
    is_active=True
)
print(f"✅ Denominação: {denom.name}")

# 3. Criar Igreja
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
print(f"✅ Igreja: {igreja.name}")

# 4. Criar Filial
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
print(f"✅ Filial: {filial.name}")

# 5. Criar Pastor
pastor = User.objects.create_user(
    username="pastor.joao",
    email="pastor@igreja.com.br",
    first_name="João",
    last_name="Silva",
    password="senha123"
)

pastor_profile = UserProfile.objects.create(
    user=pastor,
    full_name="João Silva dos Santos",
    phone="(11) 99999-1111",
    birth_date=datetime(1975, 5, 15).date(),
    email_notifications=True
)

church_user = ChurchUser.objects.create(
    user=pastor,
    church=igreja,
    role="church_admin",
    can_access_admin=True,
    can_manage_members=True,
    can_manage_activities=True,
    is_active=True
)
print(f"✅ Pastor: {pastor.username}")

# 6. Criar Ministério
ministerio = Ministry.objects.create(
    church=igreja,
    name="Ministério de Louvor",
    description="Responsável pela música e adoração",
    is_active=True
)
print(f"✅ Ministério: {ministerio.name}")

# 7. Criar Membro
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
print(f"✅ Membro: {membro.first_name} {membro.last_name}")

# 8. Criar Visitante
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
print(f"✅ Visitante: {visitante.first_name} {visitante.last_name}")

# 9. Criar Atividade
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
print(f"✅ Atividade: {atividade.name}")

print("\n📊 Resumo Final:")
print(f"   • {Denomination.objects.count()} denominações")
print(f"   • {Church.objects.count()} igrejas")
print(f"   • {Branch.objects.count()} filiais")
print(f"   • {User.objects.filter(is_superuser=False).count()} usuários")
print(f"   • {Ministry.objects.count()} ministérios")  
print(f"   • {Member.objects.count()} membros")
print(f"   • {Visitor.objects.count()} visitantes")
print(f"   • {Activity.objects.count()} atividades")

print("\n🎉 SUCESSO! Dados de exemplo criados!")
print("🌐 Acesse: http://127.0.0.1:8000/admin/")
print("👤 Usuários disponíveis:")
print("   • admin / [sua senha] (Superusuário)")
print("   • pastor.joao / senha123 (Pastor)")
print("   • admin.denominacao / senha123 (Admin Denominação)") 