# Generated migration: Convert DENOMINATION_ADMIN to CHURCH_ADMIN
from django.db import migrations


def convert_denomination_admin_to_church_admin(apps, schema_editor):
    """
    Converte todos os usuários com papel DENOMINATION_ADMIN para CHURCH_ADMIN.
    
    Esta migração é necessária devido à mudança no modelo de negócio onde:
    - O papel DENOMINATION_ADMIN foi removido
    - Suas responsabilidades foram absorvidas pelo CHURCH_ADMIN
    - CHURCH_ADMIN agora é o papel do usuário pagante que pode gerenciar
      uma ou múltiplas igrejas (se tiver uma denominação)
    """
    ChurchUser = apps.get_model('accounts', 'ChurchUser')
    
    # Contar quantos usuários serão afetados
    affected_count = ChurchUser.objects.filter(
        role='denomination_admin',
        is_active=True
    ).count()
    
    if affected_count > 0:
        print(f"\n{'='*80}")
        print(f"🔄 MIGRAÇÃO DE PAPÉIS: DENOMINATION_ADMIN → CHURCH_ADMIN")
        print(f"{'='*80}")
        print(f"📊 Total de registros a serem atualizados: {affected_count}")
        print(f"{'='*80}\n")
        
        # Atualizar todos os registros
        updated = ChurchUser.objects.filter(
            role='denomination_admin'
        ).update(role='church_admin')
        
        print(f"✅ {updated} registros atualizados com sucesso!")
        print(f"{'='*80}\n")
    else:
        print("\nℹ️  Nenhum registro com papel DENOMINATION_ADMIN encontrado.")


def reverse_conversion(apps, schema_editor):
    """
    Reversão da migração: converte CHURCH_ADMIN de volta para DENOMINATION_ADMIN.
    
    ATENÇÃO: Esta reversão é parcial e pode não ser precisa, pois não conseguimos
    distinguir entre CHURCH_ADMIN que eram originalmente DENOMINATION_ADMIN
    e CHURCH_ADMIN que já existiam antes.
    """
    ChurchUser = apps.get_model('accounts', 'ChurchUser')
    
    print("\n⚠️  AVISO: Esta reversão é parcial!")
    print("Não é possível distinguir entre CHURCH_ADMIN originais e convertidos.")
    print("Recomenda-se fazer backup dos dados antes de reverter.\n")
    
    # Aqui você poderia implementar lógica mais complexa se necessário
    # Por exemplo, converter apenas CHURCH_ADMIN que têm denominação
    
    # Por segurança, não fazemos nada na reversão automática
    print("ℹ️  Reversão não executada automaticamente por segurança.")


class Migration(migrations.Migration):
    """
    Migração para converter papéis de DENOMINATION_ADMIN para CHURCH_ADMIN.
    
    Esta é uma migração de dados crítica que reflete mudanças no modelo de negócio.
    """

    dependencies = [
        ('accounts', '0016_alter_customuser_email_and_more'),  # Última migração existente
    ]

    operations = [
        migrations.RunPython(
            convert_denomination_admin_to_church_admin,
            reverse_conversion
        ),
    ]
