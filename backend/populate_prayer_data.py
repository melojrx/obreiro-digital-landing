#!/usr/bin/env python3
"""
Script para popular dados de exemplo dos Pedidos de Oração
Baseado nas telas fornecidas pelo usuário
"""

import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.accounts.models import CustomUser
from apps.churches.models import Church
from apps.prayers.models import PrayerRequest, PrayerMessage, PrayerResponse


def create_sample_prayer_requests():
    """Cria pedidos de oração de exemplo baseados nas telas"""
    
    # Buscar usuários e igrejas existentes
    users = CustomUser.objects.filter(is_active=True)
    churches = Church.objects.all()
    
    if not users.exists() or not churches.exists():
        print("❌ Não foram encontrados usuários ou igrejas. Execute primeiro os dados base.")
        return
    
    # Dados de exemplo baseados nas telas
    sample_requests = [
        {
            'title': 'Finanças',
            'content': 'Gostaria de pedir oração por uma causa na justiça que avarãvel a mim.',
            'category': 'finance',
            'author': 'Rayssa',
            'days_ago': 2
        },
        {
            'title': 'Família', 
            'content': 'Tanto eu quanto minha irmã do coração, presente e de Deus, estamos passando por tempestades...',
            'category': 'family',
            'author': 'Priscila',
            'days_ago': 1
        },
        {
            'title': 'Crescimento',
            'content': 'Pedir a deus o crescimento das minhas vendas do comércio que deus me proporcionou a cuida...',
            'category': 'growth',
            'author': 'Patricia Castro',
            'days_ago': 7
        },
        {
            'title': 'Pessoal',
            'content': 'queria pedir oração pela restauração do meu relacionamento. que se for da vontade de deus, el...',
            'category': 'personal',
            'author': 'Ingrid',
            'days_ago': 5
        },
        {
            'title': 'Trabalho',
            'content': 'Perdi meu trabalho e quero pedir oração, quero que ele me ajude a largar amizades erradas e c...',
            'category': 'work',
            'author': 'Eduardo Henrique',
            'days_ago': 3
        },
        {
            'title': 'Saúde',
            'content': 'Venho passando por momentos de saúde muito ruins, por favor orem por mim, minha ansiedade...',
            'category': 'health',
            'author': 'Sol',
            'days_ago': 3
        },
        {
            'title': 'Pessoal',
            'content': 'Peço pela saúde de minha mãe que esta a 45 dias na uti e hj foi descoberto um tumor maligno cereb...',
            'category': 'personal',
            'author': 'Wilma Camila',
            'days_ago': 10
        },
        {
            'title': 'Pessoal',
            'content': 'meu irmão morreu mês passado perdio o emprego é quinta feira meu pai morreu não sei oq fazer t...',
            'category': 'personal',
            'author': 'Hugo',
            'days_ago': 4
        },
        {
            'title': 'Saúde',
            'content': 'peço oração pela saúde de um rapaz chamado Bruno, ele fez um transplante, está na UTI em estado gra...',
            'category': 'health',
            'author': 'Garciana',
            'days_ago': 8
        },
        {
            'title': 'Família',
            'content': 'Queria pedir que vocês estivessem em oração comigo pro meu filho Rian, que falou que é gay, eu o p...',
            'category': 'family',
            'author': 'Jocirema',
            'days_ago': 6
        },
        {
            'title': 'Família',
            'content': 'pelo meu filho Rian, que falou que é gay, eu o pai gj estamos muito tristes.',
            'category': 'family',
            'author': 'Josicrema',
            'days_ago': 6
        },
        {
            'title': 'Família',
            'content': 'Estou com um processo na justiça de coisas que meu falecido pai deveria ter pendencia em meu...',
            'category': 'family',
            'author': 'Mariana Almeida Pinheiro',
            'days_ago': 6
        },
        {
            'title': 'Conversão',
            'content': 'Eu estou frequentando a igreja sozinha com minha familia a bastante tempo, oro muito pro meu...',
            'category': 'conversion',
            'author': 'Luna Nogueira de Oliveira',
            'days_ago': 6
        },
        {
            'title': 'Finanças',
            'content': 'Gostaria de pedir orações pela saúde da minha vozinha Maria de Lourdes Oliveira Souza. e pel...',
            'category': 'finance',
            'author': 'Anna Nathaly',
            'days_ago': 4
        },
        {
            'title': 'Matrimonial',
            'content': 'Queria pedir oracao pelo meu esposo , ele e uma pessoa boa , passou por momentos ruins recen...',
            'category': 'marriage',
            'author': 'Rosa Oliveira',
            'days_ago': 1
        }
    ]
    
    created_count = 0
    
    for req_data in sample_requests:
        try:
            # Buscar ou criar usuário com base no nome
            author_name = req_data['author']
            name_parts = author_name.split(' ')
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            # Tentar encontrar usuário existente ou usar um aleatório
            author = users.filter(first_name__icontains=first_name).first()
            if not author:
                author = users.order_by('?').first()  # Usuário aleatório
            
            # Buscar igreja através do membro
            from apps.members.models import Member
            member = Member.objects.filter(user=author).first()
            church = member.church if member else churches.first()
            
            # Data de criação
            created_at = timezone.now() - timedelta(days=req_data['days_ago'])
            
            # Criar pedido
            prayer_request = PrayerRequest.objects.create(
                title=req_data['title'],
                content=req_data['content'],
                category=req_data['category'],
                author=author,
                church=church,
                status='active',
                created_at=created_at,
                updated_at=created_at
            )
            
            # Adicionar algumas orações e mensagens aleatórias
            # Buscar outros usuários da mesma igreja
            other_members = Member.objects.filter(church=church).exclude(user=author)[:5]
            other_users = [member.user for member in other_members if member.user]
            
            for i, user in enumerate(other_users):
                if i < 3:  # Primeiros 3 usuários estão orando
                    PrayerResponse.objects.create(
                        prayer_request=prayer_request,
                        user=user,
                        is_praying=True,
                        created_at=created_at + timedelta(hours=i+1)
                    )
                
                if i < 2:  # Primeiros 2 enviam mensagens
                    messages = [
                        "Estou orando por você! Deus tem o melhor para sua vida.",
                        "Que Deus abençoe e fortaleça você neste momento.",
                        "Orando pela sua situação. Deus é fiel!",
                        "Confiando que o Senhor cuidará de tudo. Força!",
                        "Você não está sozinho(a). Estamos orando!"
                    ]
                    
                    PrayerMessage.objects.create(
                        prayer_request=prayer_request,
                        author=user,
                        content=messages[i % len(messages)],
                        created_at=created_at + timedelta(hours=i*2+1)
                    )
            
            created_count += 1
            print(f"✅ Criado: {req_data['title']} - {req_data['category']}")
            
        except Exception as e:
            print(f"❌ Erro ao criar '{req_data['title']}': {e}")
    
    print(f"\n🎉 {created_count} pedidos de oração criados com sucesso!")


def main():
    """Função principal"""
    print("🙏 Populando dados de pedidos de oração...")
    create_sample_prayer_requests()
    print("✅ Processo concluído!")


if __name__ == '__main__':
    main()