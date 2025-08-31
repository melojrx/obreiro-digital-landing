# Generated manually - Reset MembershipStatusLog to simple structure
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('members', '0009_add_address_fields'),
    ]

    operations = [
        # Drop old complex table
        migrations.RunSQL(
            "DROP TABLE IF EXISTS members_membershipstatus CASCADE;",
            reverse_sql=migrations.RunSQL.noop
        ),
        
        # Remove old MembershipStatusLog and recreate with simple structure
        migrations.DeleteModel(
            name='MembershipStatusLog',
        ),
        
        migrations.CreateModel(
            name='MembershipStatusLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Data e hora de criação do registro', verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Data e hora da última atualização', verbose_name='Atualizado em')),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identificador único universal', unique=True, verbose_name='UUID')),
                ('is_active', models.BooleanField(default=True, help_text='Indica se o registro está ativo no sistema', verbose_name='Ativo')),
                ('old_status', models.CharField(choices=[('active', 'Ativo'), ('inactive', 'Inativo'), ('transferred', 'Transferido'), ('disciplined', 'Disciplinado'), ('deceased', 'Falecido')], help_text='Status anterior do membro', max_length=20, verbose_name='Status Anterior')),
                ('new_status', models.CharField(choices=[('active', 'Ativo'), ('inactive', 'Inativo'), ('transferred', 'Transferido'), ('disciplined', 'Disciplinado'), ('deceased', 'Falecido')], help_text='Novo status do membro', max_length=20, verbose_name='Novo Status')),
                ('reason', models.TextField(blank=True, help_text='Motivo da mudança de status', verbose_name='Motivo')),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='member_status_changes_made', to=settings.AUTH_USER_MODEL, verbose_name='Alterado por')),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status_history', to='members.member', verbose_name='Membro')),
            ],
            options={
                'verbose_name': 'Log de Status de Membresia',
                'verbose_name_plural': 'Logs de Status de Membresia',
                'ordering': ['-created_at'],
            },
        ),
        
        # Add indexes for performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS members_statuslog_member_created_idx ON members_membershipstatuslog (member_id, created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS members_statuslog_member_created_idx;"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS members_statuslog_status_created_idx ON members_membershipstatuslog (new_status, created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS members_statuslog_status_created_idx;"
        ),
    ]