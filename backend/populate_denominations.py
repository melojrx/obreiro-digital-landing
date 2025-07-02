#!/usr/bin/env python
"""
Script para popular o banco de dados com denominações padrão.
Execute: python manage.py shell < populate_denominations.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from apps.denominations.models import Denomination

User = get_user_model()

def create_default_denominations():
    """Criar denominações padrão brasileiras"""
    
    # Buscar um usuário administrador (ou criar um temporário)
    admin_user, created = User.objects.get_or_create(
        email='admin@obreirovirtual.com',
        defaults={
            'full_name': 'Administrador Sistema',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"✅ Usuário administrador criado: {admin_user.email}")
    
    # Denominações comuns no Brasil
    denominations_data = [
        {
            'name': 'Assembleia de Deus',
            'short_name': 'AD',
            'description': 'Assembleia de Deus - Denominação pentecostal tradicional',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Batista',
            'short_name': 'Batista',
            'description': 'Igreja Batista - Denominação evangélica tradicional',
            'headquarters_city': 'Rio de Janeiro',
            'headquarters_state': 'RJ',
        },
        {
            'name': 'Igreja Universal do Reino de Deus',
            'short_name': 'Universal',
            'description': 'Igreja Universal do Reino de Deus - Denominação neopentecostal',
            'headquarters_city': 'Rio de Janeiro',
            'headquarters_state': 'RJ',
        },
        {
            'name': 'Igreja do Evangelho Quadrangular',
            'short_name': 'Quadrangular',
            'description': 'Igreja do Evangelho Quadrangular - Denominação pentecostal',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Presbiteriana do Brasil',
            'short_name': 'Presbiteriana',
            'description': 'Igreja Presbiteriana do Brasil - Denominação reformada',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Metodista',
            'short_name': 'Metodista',
            'description': 'Igreja Metodista - Denominação protestante tradicional',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Congregação Cristã no Brasil',
            'short_name': 'CCB',
            'description': 'Congregação Cristã no Brasil - Denominação pentecostal',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Pentecostal Deus é Amor',
            'short_name': 'Deus é Amor',
            'description': 'Igreja Pentecostal Deus é Amor - Denominação pentecostal',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Adventista do Sétimo Dia',
            'short_name': 'Adventista',
            'description': 'Igreja Adventista do Sétimo Dia - Denominação protestante',
            'headquarters_city': 'Brasília',
            'headquarters_state': 'DF',
        },
        {
            'name': 'Igreja Internacional da Graça de Deus',
            'short_name': 'Internacional da Graça',
            'description': 'Igreja Internacional da Graça de Deus - Denominação neopentecostal',
            'headquarters_city': 'Rio de Janeiro',
            'headquarters_state': 'RJ',
        },
        {
            'name': 'Igreja Luterana',
            'short_name': 'Luterana',
            'description': 'Igreja Luterana - Denominação protestante tradicional',
            'headquarters_city': 'Porto Alegre',
            'headquarters_state': 'RS',
        },
        {
            'name': 'Igreja Apostólica Renascer em Cristo',
            'short_name': 'Renascer',
            'description': 'Igreja Apostólica Renascer em Cristo - Denominação neopentecostal',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Cristã Maranata',
            'short_name': 'Maranata',
            'description': 'Igreja Cristã Maranata - Denominação pentecostal',
            'headquarters_city': 'Vila Velha',
            'headquarters_state': 'ES',
        },
        {
            'name': 'Igreja O Brasil para Cristo',
            'short_name': 'Brasil para Cristo',
            'description': 'Igreja O Brasil para Cristo - Denominação pentecostal',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Igreja Episcopal Anglicana do Brasil',
            'short_name': 'Episcopal',
            'description': 'Igreja Episcopal Anglicana do Brasil - Denominação anglicana',
            'headquarters_city': 'Porto Alegre',
            'headquarters_state': 'RS',
        },
        {
            'name': 'Igreja Independente',
            'short_name': 'Independente',
            'description': 'Igreja Independente - Não filiada a denominação específica',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        },
        {
            'name': 'Outras Denominações',
            'short_name': 'Outras',
            'description': 'Outras denominações evangélicas',
            'headquarters_city': 'São Paulo',
            'headquarters_state': 'SP',
        }
    ]
    
    created_count = 0
    
    for denomination_data in denominations_data:
        denomination, created = Denomination.objects.get_or_create(
            name=denomination_data['name'],
            defaults={
                **denomination_data,
                'administrator': admin_user,
                'email': f"contato@{denomination_data['short_name'].lower().replace(' ', '')}.com.br",
                'phone': '(11) 0000-0000',
                'headquarters_address': f"Rua Principal, 123 - Centro",
                'headquarters_zipcode': '01000-000',
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Denominação criada: {denomination.name}")
        else:
            print(f"⚠️  Denominação já existe: {denomination.name}")
    
    print(f"\n🎉 Processo concluído! {created_count} denominações criadas.")
    print(f"📊 Total de denominações no banco: {Denomination.objects.count()}")

if __name__ == '__main__':
    print("🚀 Iniciando população do banco com denominações padrão...")
    create_default_denominations()
    print("✅ Processo finalizado!") 