"""
Comando Django para corrigir KPIs e estatísticas do sistema
Uso: python manage.py fix_system_kpis
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.members.models import Member
from apps.churches.models import Church
from apps.denominations.models import Denomination
from apps.accounts.models import ChurchUser

User = get_user_model()


class Command(BaseCommand):
    help = 'Corrige KPIs e estatísticas do sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix-leaders',
            action='store_true',
            help='Corrigir líderes sem User associado',
        )
        parser.add_argument(
            '--fix-church-kpis',
            action='store_true',
            help='Corrigir KPIs das igrejas',
        )
        parser.add_argument(
            '--fix-denomination-kpis',
            action='store_true',
            help='Corrigir KPIs das denominações',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Executar todas as correções',
        )

    def handle(self, *args, **options):
        if options['all']:
            options['fix_leaders'] = True
            options['fix_church_kpis'] = True
            options['fix_denomination_kpis'] = True

        if not any([options['fix_leaders'], options['fix_church_kpis'], options['fix_denomination_kpis']]):
            self.stdout.write(
                self.style.WARNING('Nenhuma opção selecionada. Use --all ou especifique as correções desejadas.')
            )
            return

        self.stdout.write(self.style.SUCCESS('🔧 Iniciando correções do sistema...'))

        if options['fix_leaders']:
            self.fix_leaders_without_users()

        if options['fix_church_kpis']:
            self.fix_church_kpis()

        if options['fix_denomination_kpis']:
            self.fix_denomination_kpis()

        self.stdout.write(self.style.SUCCESS('✅ Todas as correções concluídas!'))

    def fix_leaders_without_users(self):
        """Corrigir líderes sem User associado"""
        self.stdout.write('🔍 Corrigindo líderes sem User associado...')
        
        leaders_without_user = Member.objects.filter(
            ministerial_function__in=['leader', 'pastor', 'elder', 'deacon', 'deaconess'],
            is_active=True,
            user__isnull=True
        )
        
        count = 0
        for leader in leaders_without_user:
            # Tentar encontrar User existente pelo email
            existing_user = None
            if leader.email:
                try:
                    existing_user = User.objects.get(email=leader.email)
                except User.DoesNotExist:
                    pass
            
            if existing_user:
                # Associar ao User existente
                leader.user = existing_user
                leader.save()
                count += 1
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
                    
                    # Criar ChurchUser se não existir
                    ChurchUser.objects.get_or_create(
                        user=new_user,
                        church=leader.church,
                        defaults={
                            'role': 'leader',
                            'is_active': True
                        }
                    )
                    
                    count += 1
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Erro ao criar User para {leader.full_name}: {e}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ {count} líderes corrigidos')
        )

    def fix_church_kpis(self):
        """Corrigir KPIs das igrejas"""
        self.stdout.write('🔍 Corrigindo KPIs das igrejas...')
        
        churches = Church.objects.all()
        count = 0
        
        for church in churches:
            # Contar membros reais
            real_members = Member.objects.filter(church=church, is_active=True).count()
            
            # Contar visitantes reais
            real_visitors = 0
            try:
                from apps.visitors.models import Visitor
                real_visitors = Visitor.objects.filter(church=church).count()
            except:
                real_visitors = 0
            
            # Atualizar apenas se houver diferença
            if church.total_members != real_members or church.total_visitors != real_visitors:
                church.total_members = real_members
                church.total_visitors = real_visitors
                church.save(update_fields=['total_members', 'total_visitors', 'updated_at'])
                count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ {count} igrejas atualizadas')
        )

    def fix_denomination_kpis(self):
        """Corrigir KPIs das denominações"""
        self.stdout.write('🔍 Corrigindo KPIs das denominações...')
        
        denominations = Denomination.objects.all()
        count = 0
        
        for denomination in denominations:
            # Contar igrejas reais
            real_churches = denomination.churches.filter(is_active=True).count()
            
            # Contar membros reais de todas as igrejas
            church_ids = denomination.churches.filter(is_active=True).values_list('id', flat=True)
            real_total_members = Member.objects.filter(
                church_id__in=church_ids, 
                is_active=True
            ).count()
            
            # Atualizar apenas se houver diferença
            if denomination.total_churches != real_churches or denomination.total_members != real_total_members:
                denomination.total_churches = real_churches
                denomination.total_members = real_total_members
                denomination.save(update_fields=['total_churches', 'total_members', 'updated_at'])
                count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ {count} denominações atualizadas')
        )