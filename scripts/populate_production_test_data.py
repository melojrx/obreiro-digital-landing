#!/usr/bin/env python
"""
Script para popular dados de teste em produção para denomination.admin@teste.com
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.churches.models import Church
from apps.members.models import Member
from apps.visitors.models import Visitor
from apps.activities.models import Activity
from apps.accounts.models import ChurchUser, RoleChoices
from apps.denominations.models import Denomination

User = get_user_model()

def create_test_data():
    """Criar dados de teste para o usuário denomination.admin@teste.com"""
    
    print("🚀 Iniciando criação de dados de teste em produção...")
    
    # Buscar o usuário e sua denominação
    user = User.objects.filter(email='denominacao.admin@teste.com').first()
    if not user:
        print("❌ Usuário denominacao.admin@teste.com não encontrado!")
        return
    
    church_user = ChurchUser.objects.filter(user=user).first()
    if not church_user:
        print("❌ ChurchUser não encontrado para o usuário!")
        return
    
    denomination = church_user.church.denomination
    print(f"✅ Denominação encontrada: {denomination.name} (ID: {denomination.id})")
    
    # Dados das igrejas para criar
    churches_data = [
        {
            'name': 'Igreja Central São Paulo',
            'short_name': 'ICSP',
            'city': 'São Paulo',
            'state': 'SP',
            'address': 'Av. Paulista, 1500',
            'zipcode': '01310-100',
            'total_members': 450,
            'total_visitors': 120,
            'subscription_plan': 'premium',
            'is_branch': False
        },
        {
            'name': 'Igreja Filial Pinheiros',
            'short_name': 'IFP',
            'city': 'São Paulo',
            'state': 'SP',
            'address': 'Rua dos Pinheiros, 890',
            'zipcode': '05422-000',
            'total_members': 180,
            'total_visitors': 45,
            'subscription_plan': 'basic',
            'is_branch': True,
            'parent_church_name': 'Igreja Central São Paulo'
        },
        {
            'name': 'Igreja Filial Vila Mariana',
            'short_name': 'IFVM',
            'city': 'São Paulo',
            'state': 'SP',
            'address': 'Rua Domingos de Morais, 2500',
            'zipcode': '04036-100',
            'total_members': 220,
            'total_visitors': 60,
            'subscription_plan': 'basic',
            'is_branch': True,
            'parent_church_name': 'Igreja Central São Paulo'
        },
        {
            'name': 'Igreja Regional Rio de Janeiro',
            'short_name': 'IRRJ',
            'city': 'Rio de Janeiro',
            'state': 'RJ',
            'address': 'Av. Rio Branco, 100',
            'zipcode': '20040-020',
            'total_members': 380,
            'total_visitors': 95,
            'subscription_plan': 'premium',
            'is_branch': False
        },
        {
            'name': 'Igreja Filial Copacabana',
            'short_name': 'IFC',
            'city': 'Rio de Janeiro',
            'state': 'RJ',
            'address': 'Av. Atlântica, 2000',
            'zipcode': '22021-001',
            'total_members': 150,
            'total_visitors': 40,
            'subscription_plan': 'basic',
            'is_branch': True,
            'parent_church_name': 'Igreja Regional Rio de Janeiro'
        },
        {
            'name': 'Igreja Filial Barra da Tijuca',
            'short_name': 'IFBT',
            'city': 'Rio de Janeiro',
            'state': 'RJ',
            'address': 'Av. das Américas, 3500',
            'zipcode': '22640-102',
            'total_members': 200,
            'total_visitors': 55,
            'subscription_plan': 'basic',
            'is_branch': True,
            'parent_church_name': 'Igreja Regional Rio de Janeiro'
        },
        {
            'name': 'Igreja Sede Belo Horizonte',
            'short_name': 'ISBH',
            'city': 'Belo Horizonte',
            'state': 'MG',
            'address': 'Av. Afonso Pena, 1500',
            'zipcode': '30130-003',
            'total_members': 320,
            'total_visitors': 85,
            'subscription_plan': 'premium',
            'is_branch': False
        },
        {
            'name': 'Igreja Filial Savassi',
            'short_name': 'IFS',
            'city': 'Belo Horizonte',
            'state': 'MG',
            'address': 'Rua Pernambuco, 1000',
            'zipcode': '30130-150',
            'total_members': 120,
            'total_visitors': 30,
            'subscription_plan': 'basic',
            'is_branch': True,
            'parent_church_name': 'Igreja Sede Belo Horizonte'
        }
    ]
    
    created_churches = {}
    
    # Criar igrejas
    for church_data in churches_data:
        # Verificar se já existe
        existing = Church.objects.filter(
            name=church_data['name'],
            denomination=denomination
        ).first()
        
        if existing:
            print(f"⚠️  Igreja já existe: {church_data['name']}")
            created_churches[church_data['name']] = existing
            continue
        
        # Remover campos especiais
        is_branch = church_data.pop('is_branch', False)
        parent_church_name = church_data.pop('parent_church_name', None)
        
        # Criar igreja
        church = Church.objects.create(
            denomination=denomination,
            email=f"{church_data['short_name'].lower()}@obreirovirtual.com",
            phone=f"({random.randint(11, 99)}) {random.randint(3000, 9999)}-{random.randint(1000, 9999)}",
            subscription_status='active',
            is_active=True,
            **church_data
        )
        
        created_churches[church.name] = church
        print(f"✅ Igreja criada: {church.name}")
        
        # Criar usuário admin para a igreja (exceto filiais)
        if not is_branch:
            admin_email = f"admin.{church.short_name.lower()}@teste.com"
            admin_user, created = User.objects.get_or_create(
                email=admin_email,
                defaults={
                    'username': admin_email,
                    'first_name': 'Admin',
                    'last_name': church.short_name,
                    'is_active': True
                }
            )
            
            if created:
                admin_user.set_password('senha123')
                admin_user.save()
            
            # Criar ChurchUser
            ChurchUser.objects.get_or_create(
                user=admin_user,
                church=church,
                defaults={
                    'role': RoleChoices.CHURCH_ADMIN,
                    'is_active': True,
                    'can_manage_members': True,
                    'can_manage_activities': True,
                    'can_view_financial_reports': True
                }
            )
            print(f"  👤 Admin criado: {admin_email}")
    
    # Criar alguns membros para cada igreja
    print("\n📊 Criando membros de teste...")
    
    for church_name, church in created_churches.items():
        # Criar entre 10 e 30 membros por igreja
        num_members = random.randint(10, 30)
        
        for i in range(num_members):
            first_names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Lucas', 'Beatriz', 'Gabriel', 'Larissa']
            last_names = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira', 'Alves', 'Pereira', 'Rodrigues']
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            
            member = Member.objects.create(
                church=church,
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@exemplo.com",
                phone=f"({random.randint(11, 99)}) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                birth_date=timezone.now().date() - timedelta(days=random.randint(6570, 25550)),  # 18-70 anos
                gender=random.choice(['M', 'F']),
                marital_status=random.choice(['single', 'married', 'divorced', 'widowed']),
                address=f"Rua {random.choice(['das Flores', 'Principal', 'Central', 'do Comércio'])}, {random.randint(1, 999)}",
                city=church.city,
                state=church.state,
                zipcode=church.zipcode,
                member_since=timezone.now().date() - timedelta(days=random.randint(30, 1825)),  # 1 mês a 5 anos
                is_baptized=random.choice([True, True, True, False]),  # 75% batizados
                baptism_date=timezone.now().date() - timedelta(days=random.randint(30, 730)) if random.choice([True, False]) else None,
                is_active=random.choice([True, True, True, True, False]),  # 80% ativos
                membership_type=random.choice(['member', 'member', 'congregant']),
                notes=f"Membro criado automaticamente para testes - {datetime.now().strftime('%d/%m/%Y')}"
            )
        
        print(f"  ✅ {num_members} membros criados para {church.name}")
    
    # Criar alguns visitantes
    print("\n👥 Criando visitantes de teste...")
    
    for church_name, church in created_churches.items():
        # Criar entre 5 e 15 visitantes por igreja
        num_visitors = random.randint(5, 15)
        
        for i in range(num_visitors):
            first_names = ['Roberto', 'Fernanda', 'Marcelo', 'Patricia', 'Ricardo', 'Camila', 'Bruno', 'Amanda', 'Thiago', 'Isabela']
            last_names = ['Mendes', 'Barbosa', 'Cardoso', 'Teixeira', 'Correia', 'Dias', 'Monteiro', 'Nascimento', 'Moreira', 'Nunes']
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            
            visitor = Visitor.objects.create(
                church=church,
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@exemplo.com",
                phone=f"({random.randint(11, 99)}) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                visit_date=timezone.now().date() - timedelta(days=random.randint(1, 90)),
                how_did_you_hear=random.choice(['friend', 'internet', 'social_media', 'event', 'other']),
                interested_in_membership=random.choice([True, False]),
                notes=f"Visitante criado automaticamente para testes - {datetime.now().strftime('%d/%m/%Y')}"
            )
        
        print(f"  ✅ {num_visitors} visitantes criados para {church.name}")
    
    # Criar algumas atividades
    print("\n📅 Criando atividades de teste...")
    
    activity_types = [
        ('Culto Dominical', 'worship', 'Culto principal de domingo'),
        ('Escola Bíblica', 'education', 'Estudo bíblico semanal'),
        ('Reunião de Oração', 'prayer', 'Encontro de oração'),
        ('Grupo de Jovens', 'youth', 'Reunião do ministério jovem'),
        ('Ensaio do Coral', 'music', 'Ensaio do ministério de louvor'),
        ('Evangelismo', 'evangelism', 'Atividade evangelística'),
        ('Estudo Bíblico', 'education', 'Estudo bíblico em pequenos grupos'),
        ('Reunião de Mulheres', 'women', 'Ministério feminino'),
        ('Reunião de Homens', 'men', 'Ministério masculino'),
        ('Célula', 'small_group', 'Reunião em pequenos grupos')
    ]
    
    for church_name, church in created_churches.items():
        # Criar entre 5 e 10 atividades por igreja
        num_activities = random.randint(5, 10)
        
        for i in range(num_activities):
            activity_data = random.choice(activity_types)
            
            activity = Activity.objects.create(
                church=church,
                name=activity_data[0],
                activity_type=activity_data[1] if len(activity_data) > 1 else 'other',
                description=activity_data[2] if len(activity_data) > 2 else f"Atividade da igreja {church.name}",
                start_datetime=timezone.now() + timedelta(days=random.randint(1, 30)),
                duration_minutes=random.choice([60, 90, 120, 180]),
                location=random.choice(['Templo Principal', 'Salão de Eventos', 'Sala de Reuniões', 'Auditório']),
                is_recurring=random.choice([True, False]),
                recurrence_pattern=random.choice(['weekly', 'monthly', None]),
                max_participants=random.randint(20, 200),
                is_active=True,
                created_by=user
            )
        
        print(f"  ✅ {num_activities} atividades criadas para {church.name}")
    
    # Atualizar estatísticas da denominação
    print("\n📊 Atualizando estatísticas da denominação...")
    denomination.update_statistics()
    
    print("\n🎉 Dados de teste criados com sucesso!")
    print(f"✅ Total de igrejas: {len(created_churches)}")
    print(f"✅ Total de membros: {Member.objects.filter(church__denomination=denomination).count()}")
    print(f"✅ Total de visitantes: {Visitor.objects.filter(church__denomination=denomination).count()}")
    print(f"✅ Total de atividades: {Activity.objects.filter(church__denomination=denomination).count()}")

if __name__ == '__main__':
    create_test_data()