# Generated manually for data migration
from django.db import migrations


def migrate_ministerial_functions(apps, schema_editor):
    """
    Migra dados de ministerial_function e ordination_date 
    do modelo Member para a nova tabela MembershipStatus
    """
    Member = apps.get_model('members', 'Member')
    MembershipStatus = apps.get_model('members', 'MembershipStatus')
    
    # Processa cada membro que tem função ministerial
    for member in Member.objects.exclude(ministerial_function='').exclude(ministerial_function=None):
        # Verifica se já existe um status para este membro
        existing_status = MembershipStatus.objects.filter(
            id_member=member,
            status=member.ministerial_function
        ).first()
        
        if not existing_status:
            # Cria novo registro de status ministerial
            MembershipStatus.objects.create(
                id_member=member,
                status=member.ministerial_function,
                ordination_date=member.ordination_date,
                is_active=True,
                observation='Migrado do sistema anterior',
                created_at=member.created_at,  # Preserva data original
                updated_at=member.updated_at
            )
            
            print(f"✓ Migrado status ministerial de {member.full_name}: {member.ministerial_function}")


def reverse_migration(apps, schema_editor):
    """
    Reverso da migração - restaura dados para Member
    """
    Member = apps.get_model('members', 'Member')
    MembershipStatus = apps.get_model('members', 'MembershipStatus')
    
    # Para cada membro, pega o status mais recente ativo
    for member in Member.objects.all():
        latest_status = MembershipStatus.objects.filter(
            id_member=member,
            is_active=True
        ).order_by('-created_at').first()
        
        if latest_status:
            member.ministerial_function = latest_status.status
            member.ordination_date = latest_status.ordination_date
            member.save(update_fields=['ministerial_function', 'ordination_date'])
            
            print(f"✓ Restaurado status ministerial de {member.full_name}: {latest_status.status}")


class Migration(migrations.Migration):
    
    dependencies = [
        ('members', '0003_merge_0002_alter_member_gender_0002_membershipstatus'),
    ]
    
    operations = [
        migrations.RunPython(
            migrate_ministerial_functions,
            reverse_migration,
            elidable=False  # Garante que não será otimizada em squash
        ),
    ]