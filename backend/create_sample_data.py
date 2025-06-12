#!/usr/bin/env python
"""
Script para criar dados de exemplo do ObreiroVirtual
Execute: python create_sample_data.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import UserProfile, ChurchUser
from denominations.models import Denomination
from churches.models import Church
from branches.models import Branch
from members.models import Member
from visitors.models import Visitor
from activities.models import Ministry, Activity

User = get_user_model()

def create_sample_data():
    print("🚀 Criando dados de exemplo para o ObreiroVirtual...")
    
    # 1. Criar Denominações
    print("\n📋 Criando denominações...")
    assembleia = Denomination.objects.create(
        name="Assembleia de Deus",
        description="Uma das maiores denominações pentecostais do Brasil",
        founded_year=1911,
        website="https://www.assembleiageral.org.br",
        is_active=True
    )
    
    batista = Denomination.objects.create(
        name="Convenção Batista Brasileira",
        description="Denominação batista tradicional",
        founded_year=1907,
        website="https://www.batistas.org.br",
        is_active=True
    )
    
    metodista = Denomination.objects.create(
        name="Igreja Metodista",
        description="Denominação metodista histórica",
        founded_year=1930,
        website="https://www.metodista.org.br",
        is_active=True
    )
    
    print(f"✅ Criadas {Denomination.objects.count()} denominações")
    
    # 2. Criar Igrejas
    print("\n🏛️ Criando igrejas...")
    igreja_central = Church.objects.create(
        denomination=assembleia,
        name="Igreja Central São Paulo",
        cnpj="12.345.678/0001-90",
        email="contato@igrejacentralsp.com.br",
        phone="(11) 3456-7890",
        address="Rua das Flores, 123",
        city="São Paulo",
        state="SP",
        zip_code="01234-567",
        subscription_plan="premium",
        subscription_status="active",
        trial_end_date=datetime.now().date() + timedelta(days=30),
        max_members=1000,
        max_branches=10,
        monthly_fee=Decimal("299.90"),
        is_active=True
    )
    
    igreja_vila = Church.objects.create(
        denomination=batista,
        name="Igreja Batista da Vila",
        cnpj="98.765.432/0001-10",
        email="contato@ibvila.com.br",
        phone="(11) 2345-6789",
        address="Av. Principal, 456",
        city="São Paulo",
        state="SP",
        zip_code="02345-678",
        subscription_plan="basic",
        subscription_status="active",
        trial_end_date=datetime.now().date() + timedelta(days=15),
        max_members=200,
        max_branches=3,
        monthly_fee=Decimal("99.90"),
        is_active=True
    )
    
    print(f"✅ Criadas {Church.objects.count()} igrejas")
    
    # 3. Criar Usuários e Perfis
    print("\n👥 Criando usuários...")
    
    # Pastor da Igreja Central
    pastor_user = User.objects.create_user(
        username="pastor.joao",
        email="pastor@igrejacentralsp.com.br",
        first_name="João",
        last_name="Silva",
        password="senha123"
    )
    
    pastor_profile = UserProfile.objects.create(
        user=pastor_user,
        phone="(11) 99999-1111",
        birth_date=datetime(1975, 5, 15).date(),
        email_notifications=True,
        sms_notifications=False,
        is_verified=True
    )
    
    church_user_pastor = ChurchUser.objects.create(
        user=pastor_user,
        church=igreja_central,
        role="admin",
        is_active=True,
        joined_at=datetime.now()
    )
    
    # Secretária da Igreja Central
    secretaria_user = User.objects.create_user(
        username="secretaria.maria",
        email="secretaria@igrejacentralsp.com.br",
        first_name="Maria",
        last_name="Santos",
        password="senha123"
    )
    
    secretaria_profile = UserProfile.objects.create(
        user=secretaria_user,
        phone="(11) 99999-2222",
        birth_date=datetime(1985, 8, 20).date(),
        email_notifications=True,
        sms_notifications=True,
        is_verified=True
    )
    
    church_user_secretaria = ChurchUser.objects.create(
        user=secretaria_user,
        church=igreja_central,
        role="staff",
        is_active=True,
        joined_at=datetime.now()
    )
    
    # Pastor da Igreja Batista
    pastor_batista = User.objects.create_user(
        username="pastor.carlos",
        email="pastor@ibvila.com.br",
        first_name="Carlos",
        last_name="Oliveira",
        password="senha123"
    )
    
    pastor_batista_profile = UserProfile.objects.create(
        user=pastor_batista,
        phone="(11) 99999-3333",
        birth_date=datetime(1970, 12, 10).date(),
        email_notifications=True,
        sms_notifications=False,
        is_verified=True
    )
    
    church_user_batista = ChurchUser.objects.create(
        user=pastor_batista,
        church=igreja_vila,
        role="admin",
        is_active=True,
        joined_at=datetime.now()
    )
    
    print(f"✅ Criados {User.objects.filter(is_superuser=False).count()} usuários")
    
    # 4. Criar Filiais
    print("\n🏢 Criando filiais...")
    
    # Filiais da Igreja Central
    sede_central = Branch.objects.create(
        church=igreja_central,
        name="Sede Central",
        address="Rua das Flores, 123",
        city="São Paulo",
        state="SP",
        zip_code="01234-567",
        phone="(11) 3456-7890",
        email="sede@igrejacentralsp.com.br",
        capacity=500,
        is_headquarters=True,
        is_active=True
    )
    
    filial_zona_norte = Branch.objects.create(
        church=igreja_central,
        name="Filial Zona Norte",
        address="Rua do Norte, 789",
        city="São Paulo",
        state="SP",
        zip_code="02345-678",
        phone="(11) 2345-6789",
        email="zonanorte@igrejacentralsp.com.br",
        capacity=200,
        is_headquarters=False,
        is_active=True
    )
    
    filial_zona_sul = Branch.objects.create(
        church=igreja_central,
        name="Filial Zona Sul",
        address="Av. do Sul, 456",
        city="São Paulo",
        state="SP",
        zip_code="04567-890",
        phone="(11) 4567-8901",
        email="zonasul@igrejacentralsp.com.br",
        capacity=150,
        is_headquarters=False,
        is_active=True
    )
    
    # Filial da Igreja Batista
    sede_batista = Branch.objects.create(
        church=igreja_vila,
        name="Sede Principal",
        address="Av. Principal, 456",
        city="São Paulo",
        state="SP",
        zip_code="02345-678",
        phone="(11) 2345-6789",
        email="sede@ibvila.com.br",
        capacity=300,
        is_headquarters=True,
        is_active=True
    )
    
    print(f"✅ Criadas {Branch.objects.count()} filiais")
    
    # 5. Criar Ministérios
    print("\n⛪ Criando ministérios...")
    
    # Ministérios da Igreja Central
    ministerio_louvor = Ministry.objects.create(
        church=igreja_central,
        name="Ministério de Louvor",
        description="Responsável pela música e adoração nos cultos",
        is_active=True
    )
    
    ministerio_jovens = Ministry.objects.create(
        church=igreja_central,
        name="Ministério de Jovens",
        description="Ministério focado nos jovens da igreja",
        is_active=True
    )
    
    ministerio_criancas = Ministry.objects.create(
        church=igreja_central,
        name="Ministério Infantil",
        description="Cuidado e ensino das crianças",
        is_active=True
    )
    
    ministerio_mulheres = Ministry.objects.create(
        church=igreja_central,
        name="Ministério de Mulheres",
        description="Ministério dedicado às mulheres da igreja",
        is_active=True
    )
    
    # Ministérios da Igreja Batista
    ministerio_ensino = Ministry.objects.create(
        church=igreja_vila,
        name="Ministério de Ensino",
        description="Responsável pelo ensino bíblico",
        is_active=True
    )
    
    print(f"✅ Criados {Ministry.objects.count()} ministérios")
    
    # 6. Criar Membros
    print("\n👨‍👩‍👧‍👦 Criando membros...")
    
    # Membros da Igreja Central
    membro1 = Member.objects.create(
        church=igreja_central,
        branch=sede_central,
        first_name="Ana",
        last_name="Costa",
        email="ana.costa@email.com",
        phone="(11) 91111-1111",
        birth_date=datetime(1990, 3, 15).date(),
        address="Rua A, 123",
        city="São Paulo",
        state="SP",
        zip_code="01111-111",
        membership_status="active",
        baptism_date=datetime(2010, 6, 20).date(),
        is_active=True
    )
    
    membro2 = Member.objects.create(
        church=igreja_central,
        branch=filial_zona_norte,
        first_name="Pedro",
        last_name="Almeida",
        email="pedro.almeida@email.com",
        phone="(11) 92222-2222",
        birth_date=datetime(1985, 7, 25).date(),
        address="Rua B, 456",
        city="São Paulo",
        state="SP",
        zip_code="02222-222",
        membership_status="active",
        baptism_date=datetime(2008, 12, 15).date(),
        is_active=True
    )
    
    membro3 = Member.objects.create(
        church=igreja_central,
        branch=filial_zona_sul,
        first_name="Carla",
        last_name="Ferreira",
        email="carla.ferreira@email.com",
        phone="(11) 93333-3333",
        birth_date=datetime(1995, 11, 30).date(),
        address="Rua C, 789",
        city="São Paulo",
        state="SP",
        zip_code="04444-444",
        membership_status="new",
        is_active=True
    )
    
    # Membros da Igreja Batista
    membro4 = Member.objects.create(
        church=igreja_vila,
        branch=sede_batista,
        first_name="Roberto",
        last_name="Lima",
        email="roberto.lima@email.com",
        phone="(11) 94444-4444",
        birth_date=datetime(1980, 2, 10).date(),
        address="Rua D, 321",
        city="São Paulo",
        state="SP",
        zip_code="03333-333",
        membership_status="active",
        baptism_date=datetime(2005, 9, 18).date(),
        is_active=True
    )
    
    membro5 = Member.objects.create(
        church=igreja_vila,
        branch=sede_batista,
        first_name="Juliana",
        last_name="Rocha",
        email="juliana.rocha@email.com",
        phone="(11) 95555-5555",
        birth_date=datetime(1992, 9, 5).date(),
        address="Rua E, 654",
        city="São Paulo",
        state="SP",
        zip_code="05555-555",
        membership_status="active",
        baptism_date=datetime(2015, 4, 12).date(),
        is_active=True
    )
    
    print(f"✅ Criados {Member.objects.count()} membros")
    
    # 7. Criar Visitantes
    print("\n🚶‍♀️ Criando visitantes...")
    
    # Visitantes da Igreja Central
    visitante1 = Visitor.objects.create(
        church=igreja_central,
        branch=sede_central,
        first_name="Lucas",
        last_name="Mendes",
        email="lucas.mendes@email.com",
        phone="(11) 96666-6666",
        birth_date=datetime(1988, 4, 20).date(),
        address="Rua F, 987",
        city="São Paulo",
        state="SP",
        zip_code="06666-666",
        first_visit_date=datetime.now().date() - timedelta(days=7),
        visit_reason="Convite de amigo",
        notes="Interessado em conhecer mais sobre a fé"
    )
    
    visitante2 = Visitor.objects.create(
        church=igreja_central,
        branch=filial_zona_norte,
        first_name="Fernanda",
        last_name="Souza",
        email="fernanda.souza@email.com",
        phone="(11) 97777-7777",
        birth_date=datetime(1993, 12, 3).date(),
        address="Rua G, 147",
        city="São Paulo",
        state="SP",
        zip_code="07777-777",
        first_visit_date=datetime.now().date() - timedelta(days=3),
        visit_reason="Interesse pessoal",
        notes="Primeira visita, gostou muito do culto"
    )
    
    # Visitantes da Igreja Batista
    visitante3 = Visitor.objects.create(
        church=igreja_vila,
        branch=sede_batista,
        first_name="Marcos",
        last_name="Silva",
        email="marcos.silva@email.com",
        phone="(11) 98888-8888",
        birth_date=datetime(1987, 6, 18).date(),
        address="Rua H, 258",
        city="São Paulo",
        state="SP",
        zip_code="08888-888",
        first_visit_date=datetime.now().date() - timedelta(days=14),
        visit_reason="Mudança de denominação",
        notes="Vem de igreja pentecostal, quer conhecer tradição batista"
    )
    
    print(f"✅ Criados {Visitor.objects.count()} visitantes")
    
    # 8. Criar Atividades
    print("\n📅 Criando atividades...")
    
    # Atividades da Igreja Central
    culto_domingo = Activity.objects.create(
        church=igreja_central,
        branch=sede_central,
        ministry=ministerio_louvor,
        name="Culto Dominical",
        description="Culto principal de domingo pela manhã",
        activity_type="worship",
        start_datetime=datetime.now() + timedelta(days=7, hours=10),
        end_datetime=datetime.now() + timedelta(days=7, hours=12),
        max_participants=500,
        requires_registration=False,
        is_active=True
    )
    
    estudo_biblico = Activity.objects.create(
        church=igreja_central,
        branch=filial_zona_norte,
        name="Estudo Bíblico",
        description="Estudo bíblico semanal às quartas-feiras",
        activity_type="study",
        start_datetime=datetime.now() + timedelta(days=3, hours=19, minutes=30),
        end_datetime=datetime.now() + timedelta(days=3, hours=21),
        max_participants=50,
        requires_registration=True,
        is_active=True
    )
    
    retiro_jovens = Activity.objects.create(
        church=igreja_central,
        ministry=ministerio_jovens,
        name="Retiro de Jovens",
        description="Retiro espiritual para jovens de 15 a 30 anos",
        activity_type="retreat",
        start_datetime=datetime.now() + timedelta(days=30, hours=18),
        end_datetime=datetime.now() + timedelta(days=32, hours=12),
        max_participants=80,
        requires_registration=True,
        registration_fee=Decimal("150.00"),
        is_active=True
    )
    
    # Atividades da Igreja Batista
    culto_batista = Activity.objects.create(
        church=igreja_vila,
        branch=sede_batista,
        ministry=ministerio_ensino,
        name="Culto de Ensino",
        description="Culto focado no ensino bíblico",
        activity_type="worship",
        start_datetime=datetime.now() + timedelta(days=5, hours=19),
        end_datetime=datetime.now() + timedelta(days=5, hours=21),
        max_participants=300,
        requires_registration=False,
        is_active=True
    )
    
    conferencia = Activity.objects.create(
        church=igreja_vila,
        branch=sede_batista,
        name="Conferência Anual",
        description="Conferência anual da igreja com palestrantes especiais",
        activity_type="conference",
        start_datetime=datetime.now() + timedelta(days=60, hours=19),
        end_datetime=datetime.now() + timedelta(days=62, hours=22),
        max_participants=500,
        requires_registration=True,
        registration_fee=Decimal("80.00"),
        is_active=True
    )
    
    print(f"✅ Criadas {Activity.objects.count()} atividades")
    
    # 9. Estatísticas Finais
    print("\n📊 Resumo dos dados criados:")
    print(f"   • {Denomination.objects.count()} denominações")
    print(f"   • {Church.objects.count()} igrejas")
    print(f"   • {Branch.objects.count()} filiais")
    print(f"   • {User.objects.filter(is_superuser=False).count()} usuários")
    print(f"   • {UserProfile.objects.count()} perfis de usuário")
    print(f"   • {ChurchUser.objects.count()} vínculos igreja-usuário")
    print(f"   • {Ministry.objects.count()} ministérios")
    print(f"   • {Member.objects.count()} membros")
    print(f"   • {Visitor.objects.count()} visitantes")
    print(f"   • {Activity.objects.count()} atividades")
    
    print("\n✅ Dados de exemplo criados com sucesso!")
    print("\n🌐 Acesse o admin em: http://127.0.0.1:8000/admin/")
    print("   Login: admin")
    print("   Senha: [a senha que você definiu]")
    
    print("\n👥 Usuários de teste criados:")
    print("   • pastor.joao / senha123 (Pastor - Igreja Central)")
    print("   • secretaria.maria / senha123 (Staff - Igreja Central)")
    print("   • pastor.carlos / senha123 (Pastor - Igreja Batista)")

if __name__ == "__main__":
    try:
        create_sample_data()
    except Exception as e:
        print(f"❌ Erro ao criar dados: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 