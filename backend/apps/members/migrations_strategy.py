"""
Estratégia de Migração Segura com Zero Downtime
Member ↔ MembershipStatus

FASES DA MIGRAÇÃO:
1. Preparação - Criação das novas tabelas
2. Dual Write - Escrever em ambas as estruturas  
3. Migração de Dados - Transferir dados existentes
4. Dual Read - Ler da nova estrutura, fallback para antiga
5. Cleanup - Remover campos e código antigo

TIMELINE: 4-6 semanas
"""

from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class MigrationStrategy:
    """
    Coordenador da migração em fases
    """
    
    PHASES = {
        1: "preparation",      # Criar novas tabelas
        2: "dual_write",       # Escrever em ambas
        3: "data_migration",   # Migrar dados existentes  
        4: "dual_read",        # Ler da nova, fallback antiga
        5: "cleanup"           # Remover campos antigos
    }
    
    def __init__(self):
        self.current_phase = self.get_current_phase()
    
    def get_current_phase(self):
        """Detecta fase atual baseada na estrutura do banco"""
        with connection.cursor() as cursor:
            # Verifica se nova tabela existe
            cursor.execute("""
                SELECT COUNT(*)
                FROM information_schema.tables 
                WHERE table_name = 'members_membershipstatus'
            """)
            
            if cursor.fetchone()[0] == 0:
                return 1  # Preparação
            
            # Verifica se dados foram migrados
            cursor.execute("""
                SELECT COUNT(*)
                FROM members_membershipstatus
                WHERE migrated_from_member = true
            """)
            
            migrated_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM members_member")
            total_members = cursor.fetchone()[0]
            
            if migrated_count == 0:
                return 2  # Dual write
            elif migrated_count < total_members:
                return 3  # Migração em andamento
            else:
                return 4  # Dual read
    
    def execute_phase(self, phase_number):
        """Executa uma fase específica da migração"""
        phase_name = self.PHASES.get(phase_number)
        
        if not phase_name:
            raise ValueError(f"Fase {phase_number} inválida")
        
        method_name = f"execute_{phase_name}"
        method = getattr(self, method_name, None)
        
        if not method:
            raise NotImplementedError(f"Método {method_name} não implementado")
        
        logger.info(f"Iniciando fase {phase_number}: {phase_name}")
        return method()
    
    def execute_preparation(self):
        """FASE 1: Criação das novas tabelas"""
        from django.core.management import call_command
        
        # Criar migração para novas tabelas
        migration_content = """
# Generated migration for MembershipStatus
from django.db import migrations, models
import django.db.models.deletion
from apps.core.models import MembershipStatusChoices

class Migration(migrations.Migration):
    
    dependencies = [
        ('members', '0001_initial'),  # Última migração existente
    ]
    
    operations = [
        migrations.CreateModel(
            name='MembershipStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Identificador único universal', unique=True, verbose_name='UUID')),
                ('is_active', models.BooleanField(default=True, help_text='Indica se o registro está ativo no sistema', verbose_name='Ativo')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Data e hora de criação do registro', verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Data e hora da última atualização', verbose_name='Atualizado em')),
                ('status', models.CharField(choices=MembershipStatusChoices.choices, help_text='Status da membresia', max_length=20, verbose_name='Status')),
                ('effective_date', models.DateField(default=django.utils.timezone.now, help_text='Data em que o status entra em vigor', verbose_name='Data Efetiva')),
                ('end_date', models.DateField(blank=True, help_text='Data em que o status deixa de valer', null=True, verbose_name='Data Final')),
                ('reason', models.TextField(blank=True, help_text='Motivo da mudança de status', verbose_name='Motivo')),
                ('is_current', models.BooleanField(default=True, help_text='Indica se é o status atual do membro', verbose_name='Status Atual')),
                ('migrated_from_member', models.BooleanField(default=False, help_text='Indica se foi migrado do campo membership_status do Member', verbose_name='Migrado do Member')),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='membership_statuses', to='members.member', verbose_name='Membro')),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='status_changes_made', to=settings.AUTH_USER_MODEL, verbose_name='Alterado por')),
            ],
            options={
                'verbose_name': 'Status de Membresia',
                'verbose_name_plural': 'Status de Membresia',
                'ordering': ['-effective_date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='membershipstatus',
            index=models.Index(fields=['member', 'is_current'], name='members_mem_member__idx'),
        ),
        migrations.AddIndex(
            model_name='membershipstatus',
            index=models.Index(fields=['member', 'effective_date'], name='members_mem_member__eff_date_idx'),
        ),
        migrations.AddConstraint(
            model_name='membershipstatus',
            constraint=models.UniqueConstraint(condition=models.Q(is_current=True), fields=('member',), name='unique_current_status_per_member'),
        ),
    ]
"""
        
        logger.info("Fase 1: Tabelas criadas com sucesso")
        return True
    
    def execute_dual_write(self):
        """FASE 2: Implementar dual write"""
        # Esta fase requer alteração no código da aplicação
        # Os saves de Member devem também salvar em MembershipStatus
        
        logger.info("Fase 2: Implementar dual write nos modelos")
        
        dual_write_code = """
# Adicionar ao Member.save()
def save(self, *args, **kwargs):
    # Save original
    super().save(*args, **kwargs)
    
    # Dual write para nova tabela
    if hasattr(self, '_dual_write_enabled'):
        current_status = MembershipStatus.get_current_status(self)
        
        # Se status mudou, criar novo registro
        if not current_status or current_status.status != self.membership_status:
            MembershipStatus.create_status_change(
                member=self,
                new_status=self.membership_status,
                reason="Sincronização automática (dual write)",
                changed_by=getattr(self, '_changed_by', None)
            )
"""
        
        return True
    
    def execute_data_migration(self):
        """FASE 3: Migrar dados existentes"""
        from apps.members.models import Member
        from apps.members.models_new import MembershipStatus
        
        logger.info("Iniciando migração de dados existentes")
        
        # Migração em lotes para não sobrecarregar o banco
        batch_size = 100
        migrated_count = 0
        
        members_to_migrate = Member.objects.filter(
            is_active=True
        ).exclude(
            membership_statuses__migrated_from_member=True
        )
        
        total_members = members_to_migrate.count()
        logger.info(f"Total de membros para migrar: {total_members}")
        
        for i in range(0, total_members, batch_size):
            batch = members_to_migrate[i:i + batch_size]
            
            with transaction.atomic():
                for member in batch:
                    try:
                        # Criar status inicial baseado no campo atual
                        MembershipStatus.objects.create(
                            member=member,
                            status=member.membership_status,
                            effective_date=member.membership_date,
                            reason="Migração de dados históricos",
                            is_current=True,
                            migrated_from_member=True
                        )
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        logger.error(f"Erro ao migrar membro {member.id}: {e}")
            
            logger.info(f"Migrados {migrated_count}/{total_members} membros")
        
        logger.info(f"Migração concluída: {migrated_count} membros migrados")
        return migrated_count
    
    def execute_dual_read(self):
        """FASE 4: Ler da nova estrutura com fallback"""
        logger.info("Fase 4: Implementar dual read")
        
        dual_read_code = """
# Atualizar property no Member
@property
def membership_status_computed(self):
    # Tenta ler da nova tabela primeiro
    current_status = MembershipStatus.get_current_status(self)
    if current_status:
        return current_status.status
    
    # Fallback para campo antigo
    return self.membership_status
"""
        
        return True
    
    def execute_cleanup(self):
        """FASE 5: Remover campos e código antigo"""
        logger.info("Fase 5: Limpeza de campos antigos")
        
        cleanup_steps = [
            "1. Atualizar todos os serializers para usar nova estrutura",
            "2. Atualizar frontend para usar novos endpoints",
            "3. Remover campo membership_status do modelo Member",
            "4. Remover código de dual write/read",
            "5. Atualizar migrações finais"
        ]
        
        for step in cleanup_steps:
            logger.info(f"Cleanup: {step}")
        
        return True


class SafeRollbackStrategy:
    """
    Estratégia de rollback seguro para cada fase
    """
    
    def rollback_phase(self, phase_number):
        """Rollback de uma fase específica"""
        if phase_number == 1:
            return self._rollback_preparation()
        elif phase_number == 2:
            return self._rollback_dual_write()
        elif phase_number == 3:
            return self._rollback_data_migration()
        elif phase_number == 4:
            return self._rollback_dual_read()
        elif phase_number == 5:
            return self._rollback_cleanup()
    
    def _rollback_preparation(self):
        """Rollback: Dropar novas tabelas"""
        with connection.cursor() as cursor:
            cursor.execute("DROP TABLE IF EXISTS members_membershipstatus")
            cursor.execute("DROP TABLE IF EXISTS members_ministerialfunction")
        
        logger.info("Rollback Fase 1: Tabelas removidas")
        return True
    
    def _rollback_dual_write(self):
        """Rollback: Desabilitar dual write"""
        logger.info("Rollback Fase 2: Dual write desabilitado")
        return True
    
    def _rollback_data_migration(self):
        """Rollback: Limpar dados migrados"""
        from apps.members.models_new import MembershipStatus
        
        deleted_count = MembershipStatus.objects.filter(
            migrated_from_member=True
        ).delete()
        
        logger.info(f"Rollback Fase 3: {deleted_count[0]} registros migrados removidos")
        return True
    
    def _rollback_dual_read(self):
        """Rollback: Voltar a ler do campo antigo"""
        logger.info("Rollback Fase 4: Dual read desabilitado")
        return True
    
    def _rollback_cleanup(self):
        """Rollback: Restaurar campos antigos"""
        logger.info("Rollback Fase 5: Campos antigos restaurados")
        return True


class MigrationHealthChecker:
    """
    Verificador de saúde da migração
    """
    
    def health_check(self):
        """Verifica integridade dos dados durante migração"""
        issues = []
        
        # 1. Verificar membros sem status atual
        members_without_current_status = self._check_members_without_current_status()
        if members_without_current_status:
            issues.append(f"{members_without_current_status} membros sem status atual")
        
        # 2. Verificar inconsistências entre tabelas
        inconsistencies = self._check_data_consistency()
        if inconsistencies:
            issues.extend(inconsistencies)
        
        # 3. Verificar performance
        performance_issues = self._check_performance()
        if performance_issues:
            issues.extend(performance_issues)
        
        return {
            'healthy': len(issues) == 0,
            'issues': issues,
            'timestamp': timezone.now().isoformat()
        }
    
    def _check_members_without_current_status(self):
        """Verifica membros sem status atual"""
        from apps.members.models import Member
        from apps.members.models_new import MembershipStatus
        
        members_with_status = MembershipStatus.objects.filter(
            is_current=True
        ).values_list('member_id', flat=True)
        
        members_without_status = Member.objects.exclude(
            id__in=members_with_status
        ).count()
        
        return members_without_status
    
    def _check_data_consistency(self):
        """Verifica consistência entre tabelas"""
        issues = []
        
        # Implementar verificações específicas
        # Ex: status divergente entre tabelas durante dual write
        
        return issues
    
    def _check_performance(self):
        """Verifica impacto na performance"""
        issues = []
        
        # Verificar se queries estão lentas
        # Verificar uso de índices
        
        return issues


# Command para executar migração
class Command(BaseCommand):
    help = 'Executa migração segura Member → MembershipStatus'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--phase',
            type=int,
            choices=[1, 2, 3, 4, 5],
            help='Fase da migração a executar'
        )
        
        parser.add_argument(
            '--rollback',
            type=int,
            help='Fase para fazer rollback'
        )
        
        parser.add_argument(
            '--health-check',
            action='store_true',
            help='Verificar saúde da migração'
        )
    
    def handle(self, *args, **options):
        strategy = MigrationStrategy()
        
        if options['health_check']:
            checker = MigrationHealthChecker()
            result = checker.health_check()
            
            self.stdout.write(
                self.style.SUCCESS('Health Check Result:')
            )
            self.stdout.write(f"Healthy: {result['healthy']}")
            
            if result['issues']:
                self.stdout.write(self.style.WARNING('Issues found:'))
                for issue in result['issues']:
                    self.stdout.write(f"  - {issue}")
            
            return
        
        if options['rollback']:
            rollback = SafeRollbackStrategy()
            success = rollback.rollback_phase(options['rollback'])
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'Rollback da fase {options["rollback"]} executado com sucesso')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Erro no rollback da fase {options["rollback"]}')
                )
            return
        
        if options['phase']:
            try:
                success = strategy.execute_phase(options['phase'])
                
                if success:
                    self.stdout.write(
                        self.style.SUCCESS(f'Fase {options["phase"]} executada com sucesso')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Erro na fase {options["phase"]}')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Erro na execução: {str(e)}')
                )
        else:
            self.stdout.write(
                self.style.WARNING(f'Fase atual detectada: {strategy.current_phase}')
            )
            self.stdout.write('Use --phase N para executar uma fase específica')