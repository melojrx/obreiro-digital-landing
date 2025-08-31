# Generated manually - Add MinisterialFunctionLog without complex operations
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('members', '0010_reset_membershipstatuslog'),
    ]

    operations = [
        # Create MinisterialFunctionLog table
        migrations.CreateModel(
            name='MinisterialFunctionLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Data e hora de criação do registro', verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Data e hora da última atualização', verbose_name='Atualizado em')),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identificador único universal', unique=True, verbose_name='UUID')),
                ('is_active', models.BooleanField(default=True, help_text='Indica se o registro está ativo no sistema', verbose_name='Ativo')),
                ('old_function', models.CharField(choices=[('member', 'Membro'), ('deacon', 'Diácono'), ('deaconess', 'Diaconisa'), ('elder', 'Presbítero'), ('evangelist', 'Evangelista'), ('pastor', 'Pastor'), ('missionary', 'Missionário'), ('leader', 'Líder'), ('cooperator', 'Cooperador'), ('auxiliary', 'Auxiliar')], help_text='Função ministerial anterior', max_length=100, verbose_name='Função Anterior')),
                ('new_function', models.CharField(choices=[('member', 'Membro'), ('deacon', 'Diácono'), ('deaconess', 'Diaconisa'), ('elder', 'Presbítero'), ('evangelist', 'Evangelista'), ('pastor', 'Pastor'), ('missionary', 'Missionário'), ('leader', 'Líder'), ('cooperator', 'Cooperador'), ('auxiliary', 'Auxiliar')], help_text='Nova função ministerial', max_length=100, verbose_name='Nova Função')),
                ('effective_date', models.DateField(help_text='Data em que a função entra em vigor', verbose_name='Data Efetiva')),
                ('end_date', models.DateField(blank=True, help_text='Data final da função (vazio se ainda ativa)', null=True, verbose_name='Data Final')),
                ('observations', models.TextField(blank=True, help_text='Observações sobre a mudança de função', verbose_name='Observações')),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ministerial_changes_made', to=settings.AUTH_USER_MODEL, verbose_name='Alterado por')),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ministerial_history', to='members.member', verbose_name='Membro')),
            ],
            options={
                'verbose_name': 'Log de Função Ministerial',
                'verbose_name_plural': 'Logs de Função Ministerial',
                'ordering': ['-effective_date', '-created_at'],
            },
        ),
        
        # Add indexes for performance
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS members_ministerial_member_date_idx ON members_ministerialfunctionlog (member_id, effective_date DESC);",
            reverse_sql="DROP INDEX IF EXISTS members_ministerial_member_date_idx;"
        ),
        
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS members_ministerial_function_date_idx ON members_ministerialfunctionlog (new_function, effective_date DESC);",
            reverse_sql="DROP INDEX IF EXISTS members_ministerial_function_date_idx;"
        ),
    ]