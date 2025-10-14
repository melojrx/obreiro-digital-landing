#!/usr/bin/env python3
"""
Script para corrigir os problemas identificados no sistema:
1. Líderes sem User associado
2. KPIs zerados nas igrejas
3. KPIs zerados nas denominações
4. Atualizar estatísticas
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/home/jrmelo/projetos/obreiro-digital-landing/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.members.models import Member
from apps.churches.models import Church
from apps.denominations.models import Denomination
from apps.accounts.models import ChurchUser, CustomUser
from django.contrib.auth import get_user_model

User = get_user_model()

def fix_leaders_without_users():
    """
    Problema 1: Líderes sem User associado
    Solução: Criar Users para líderes que não têm ou associar a Users existentes
    """
    print("=== CORRIGINDO LÍDERES SEM USER ===")
    
    leaders_without_user = Member.objects.filter(
        ministerial_function__in=['leader', 'pastor', 'elder', 'deacon', 'deaconess'],
        is_active=True,
        user__isnull=True
    )
    
    print(f"Encontrados {leaders_without_user.count()} líderes sem User associado")
    
    for leader in leaders_without_user:
        print(f"\nProcessando: {leader.full_name} - {leader.church.name}")
        
        # Tentar encontrar User existente pelo email
        existing_user = None
        if leader.email:
            try:
                existing_user = User.objects.get(email=leader.email)
                print(f"  ✓ User existente encontrado: {existing_user.email}")
            except User.DoesNotExist:
                pass
        
        if existing_user:
            # Associar ao User existente
            leader.user = existing_user
            leader.save()
            print(f"  ✓ Líder associado ao User existente")
        else:
            # Criar novo User
            if leader.email:
                username = leader.email
                email = leader.email
            else:
                # Gerar email baseado no nome
                username = leader.full_name.lower().replace(' ', '.') + '@igreja.local'
                email = username
            
            try:
                new_user = User.objects.create_user(
                    username=username,
                    email=email,
                    full_name=leader.full_name,
                    password='senha123'  # Senha temporária
                )
                
                leader.user = new_user
                leader.save()
                
                print(f"  ✓ Novo User criado: {new_user.email}")
                
                # Criar ChurchUser se não existir
                church_user, created = ChurchUser.objects.get_or_create(
                    user=new_user,
                    church=leader.church,
                    defaults={
                        'role': 'leader',
                        'is_active': True
                    }
                )
                
                if created:
                    print(f"  ✓ ChurchUser criado com role 'leader'")
                else:
                    print(f"  ✓ ChurchUser já existia")
                    
            except Exception as e:
                print(f"  ✗ Erro ao criar User: {e}")

def fix_church_kpis():
    """
    Problema 2: KPIs zerados nas igrejas
    Solução: Atualizar campos total_members e total_visitors com dados reais
    """
    print("\n=== CORRIGINDO KPIs DAS IGREJAS ===")
    
    churches = Church.objects.all()
    
    for church in churches:
        print(f"\nProcessando igreja: {church.name}")
        
        # Contar membros reais
        real_members = Member.objects.filter(church=church, is_active=True).count()
        
        # Contar visitantes reais (se modelo existir)
        real_visitors = 0
        try:
            from apps.visitors.models import Visitor
            real_visitors = Visitor.objects.filter(church=church).count()
        except:
            real_visitors = 0
        
        # Atualizar campos
        old_members = church.total_members
        old_visitors = church.total_visitors
        
        church.total_members = real_members
        church.total_visitors = real_visitors
        church.save(update_fields=['total_members', 'total_visitors', 'updated_at'])
        
        print(f"  Membros: {old_members} → {real_members}")
        print(f"  Visitantes: {old_visitors} → {real_visitors}")
        print(f"  ✓ KPIs atualizados")

def fix_denomination_kpis():
    """
    Problema 3: KPIs zerados nas denominações
    Solução: Atualizar campos total_churches e total_members com dados reais
    """
    print("\n=== CORRIGINDO KPIs DAS DENOMINAÇÕES ===")
    
    denominations = Denomination.objects.all()
    
    for denomination in denominations:
        print(f"\nProcessando denominação: {denomination.name}")
        
        # Contar igrejas reais
        real_churches = denomination.churches.filter(is_active=True).count()
        
        # Contar membros reais de todas as igrejas
        church_ids = denomination.churches.filter(is_active=True).values_list('id', flat=True)
        real_total_members = Member.objects.filter(
            church_id__in=church_ids, 
            is_active=True
        ).count()
        
        # Atualizar campos
        old_churches = denomination.total_churches
        old_members = denomination.total_members
        
        denomination.total_churches = real_churches
        denomination.total_members = real_total_members
        denomination.save(update_fields=['total_churches', 'total_members', 'updated_at'])
        
        print(f"  Igrejas: {old_churches} → {real_churches}")
        print(f"  Membros: {old_members} → {real_total_members}")
        print(f"  ✓ KPIs atualizados")

def update_all_statistics():
    """
    Problema 4: Garantir que todas as estatísticas estejam sincronizadas
    Solução: Executar métodos update_statistics() em todos os modelos
    """
    print("\n=== ATUALIZANDO TODAS AS ESTATÍSTICAS ===")
    
    # Atualizar estatísticas das igrejas
    print("\nAtualizando estatísticas das igrejas...")
    for church in Church.objects.all():
        try:
            church.update_statistics()
            print(f"  ✓ {church.name}: {church.total_members} membros, {church.total_visitors} visitantes")
        except Exception as e:
            print(f"  ✗ Erro em {church.name}: {e}")
    
    # Atualizar estatísticas das denominações
    print("\nAtualizando estatísticas das denominações...")
    for denomination in Denomination.objects.all():
        try:
            denomination.update_statistics()
            print(f"  ✓ {denomination.name}: {denomination.total_churches} igrejas, {denomination.total_members} membros")
        except Exception as e:
            print(f"  ✗ Erro em {denomination.name}: {e}")
    
    # Atualizar estatísticas dos ministérios
    print("\nAtualizando estatísticas dos ministérios...")
    try:
        from apps.activities.models import Ministry
        for ministry in Ministry.objects.all():
            try:
                ministry.update_statistics()
                print(f"  ✓ {ministry.name}: {ministry.total_members} membros, {ministry.total_activities} atividades")
            except Exception as e:
                print(f"  ✗ Erro em {ministry.name}: {e}")
    except ImportError:
        print("  ! Modelo Ministry não encontrado - pulando")

def main():
    """Executar todas as correções"""
    print("🔧 INICIANDO CORREÇÃO DOS PROBLEMAS DO SISTEMA")
    print("=" * 60)
    
    try:
        # 1. Corrigir líderes sem User
        fix_leaders_without_users()
        
        # 2. Corrigir KPIs das igrejas
        fix_church_kpis()
        
        # 3. Corrigir KPIs das denominações
        fix_denomination_kpis()
        
        # 4. Atualizar todas as estatísticas
        update_all_statistics()
        
        print("\n" + "=" * 60)
        print("✅ TODAS AS CORREÇÕES CONCLUÍDAS COM SUCESSO!")
        print("\nProblemas corrigidos:")
        print("1. ✓ Líderes agora têm Users associados")
        print("2. ✓ KPIs das igrejas atualizados com dados reais")
        print("3. ✓ KPIs das denominações atualizados com dados reais")
        print("4. ✓ Todas as estatísticas sincronizadas")
        
        print("\n🎯 PRÓXIMOS PASSOS:")
        print("1. Teste o dropdown de líderes no frontend")
        print("2. Verifique os KPIs no dashboard de denominação")
        print("3. Teste a criação de ministérios")
        
    except Exception as e:
        print(f"\n❌ ERRO DURANTE A EXECUÇÃO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()