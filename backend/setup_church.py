#!/usr/bin/env python
"""
Script para configurar igreja inicial e associar usuário administrador
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.churches.models import Church
from apps.accounts.models import ChurchUser
from django.utils import timezone

User = get_user_model()

def setup_church():
    print("🏢 Configurando igreja inicial...")
    
    # Buscar usuário admin existente
    try:
        admin_user = User.objects.get(email='admin@teste.com')
        print(f"✅ Usuário encontrado: {admin_user.email}")
    except User.DoesNotExist:
        print("❌ Usuário admin@teste.com não encontrado")
        return
    
    # Verificar se já existe uma igreja
    existing_church = Church.objects.first()
    if existing_church:
        print(f"✅ Igreja já existe: {existing_church.name}")
        church = existing_church
    else:
        # Criar igreja padrão
        church = Church.objects.create(
            name="Igreja Teste - Obreiro Digital",
            short_name="Igreja Teste",
            description="Igreja de teste para desenvolvimento do sistema Obreiro Digital",
            email="igreja@teste.com",
            phone="(85) 99999-9999",
            website="https://obreiro-digital.com",
            address="Rua Teste, 123",
            city="Fortaleza",
            state="CE",
            zipcode="60000-000",
            cnpj="00.000.000/0001-00",
            # Dados de assinatura
            subscription_plan="premium",
            subscription_status="active",
            subscription_start_date=timezone.now().date(),
            subscription_end_date=timezone.now().date() + timezone.timedelta(days=365),
            max_members=1000,
            max_branches=10,
            max_admins=5
        )
        print(f"✅ Igreja criada: {church.name}")
    
    # Verificar se usuário já está associado à igreja
    existing_association = ChurchUser.objects.filter(
        user=admin_user,
        church=church
    ).first()
    
    if existing_association:
        print(f"✅ Usuário já associado à igreja com role: {existing_association.role}")
    else:
        # Associar usuário à igreja como administrador
        church_user = ChurchUser.objects.create(
            user=admin_user,
            church=church,
            role="admin",
            can_access_admin=True,
            can_manage_members=True,
            can_manage_visitors=True,
            can_manage_activities=True,
            can_view_reports=True,
            can_manage_branches=True
        )
        print(f"✅ Usuário associado à igreja como: {church_user.role}")
    
    print("\n🎉 Configuração concluída!")
    print(f"Igreja: {church.name}")
    print(f"Usuário: {admin_user.email}")
    print(f"Role: {ChurchUser.objects.get(user=admin_user, church=church).role}")

if __name__ == "__main__":
    setup_church()
