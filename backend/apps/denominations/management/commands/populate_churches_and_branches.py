from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.denominations.models import Denomination
from apps.churches.models import Church
from apps.accounts.models import ChurchUser, RoleChoices
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula o banco de dados com igrejas e filiais para denominacao.admin@teste.com'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='denominacao.admin@teste.com',
            help='Email do usuário denominação admin (padrão: denominacao.admin@teste.com)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a criação mesmo se já existirem igrejas',
        )

    def handle(self, *args, **options):
        admin_email = options['email']
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Iniciando população de igrejas e filiais para {admin_email}...')
        )

        # Buscar o usuário administrador da denominação
        try:
            admin_user = User.objects.get(email=admin_email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Usuário {admin_email} não encontrado!')
            )
            return

        # Buscar a denominação do usuário
        try:
            denomination = admin_user.administered_denominations.filter(is_active=True).first()
            if not denomination:
                # Criar uma denominação para o usuário se não existir
                denomination = Denomination.objects.create(
                    name='Denominação Evangélica Brasil',
                    short_name='DEB',
                    description='Denominação evangélica nacional para demonstração',
                    administrator=admin_user,
                    email='contato@deb.org.br',
                    phone='(11) 99999-0000',
                    headquarters_city='São Paulo',
                    headquarters_state='SP',
                    headquarters_address='Rua Central, 123 - Centro',
                    headquarters_zipcode='01234-567',
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Denominação criada: {denomination.name}')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao encontrar/criar denominação: {e}')
            )
            return

        # Dados das igrejas a serem criadas
        churches_data = [
            {
                'name': 'Igreja Central São Paulo',
                'short_name': 'ICSP',
                'email': 'contato@icsp.com.br',
                'phone': '(11) 99999-1111',
                'address': 'Rua Central, 123',
                'city': 'São Paulo',
                'state': 'SP',
                'zipcode': '01234-567',
                'subscription_plan': 'premium',
                'subscription_status': 'active',
                'has_branches': True,
                'branches': [
                    {
                        'name': 'Filial Vila Mariana',
                        'address': 'Rua Vila Mariana, 456',
                        'city': 'São Paulo',
                        'phone': '(11) 98888-1111'
                    },
                    {
                        'name': 'Filial Mooca',
                        'address': 'Rua da Mooca, 789',
                        'city': 'São Paulo', 
                        'phone': '(11) 97777-1111'
                    }
                ]
            },
            {
                'name': 'Igreja Campinas',
                'short_name': 'IC',
                'email': 'contato@ic.com.br',
                'phone': '(19) 99999-4444',
                'address': 'Rua Campinas, 321',
                'city': 'Campinas',
                'state': 'SP',
                'zipcode': '13000-000',
                'subscription_plan': 'basic',
                'subscription_status': 'active',
                'has_branches': True,
                'branches': [
                    {
                        'name': 'Filial Barão Geraldo',
                        'address': 'Av. Albino J. B. de Oliveira, 1000',
                        'city': 'Campinas',
                        'phone': '(19) 98888-4444'
                    }
                ]
            },
            {
                'name': 'Igreja Santos',
                'short_name': 'IS',
                'email': 'contato@is.com.br',
                'phone': '(13) 99999-7777',
                'address': 'Rua Santos, 654',
                'city': 'Santos',
                'state': 'SP',
                'zipcode': '11000-000',
                'subscription_plan': 'standard',
                'subscription_status': 'active',
                'has_branches': False,
                'branches': []
            }
        ]

        created_churches = 0
        created_branches = 0

        for church_data in churches_data:
            # Verificar se a igreja já existe
            church, created = Church.objects.get_or_create(
                name=church_data['name'],
                denomination=denomination,
                defaults={
                    'short_name': church_data['short_name'],
                    'email': church_data['email'],
                    'phone': church_data['phone'],
                    'address': church_data['address'],
                    'city': church_data['city'],
                    'state': church_data['state'],
                    'zipcode': church_data['zipcode'],
                    'subscription_plan': church_data['subscription_plan'],
                    'subscription_status': church_data['subscription_status'],
                    'is_active': True,
                }
            )

            if created:
                created_churches += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Igreja criada: {church.name}')
                )

                # Criar ChurchUser para associar o admin da denominação à igreja
                church_user, cu_created = ChurchUser.objects.get_or_create(
                    user=admin_user,
                    church=church,
                    defaults={
                        'role': RoleChoices.DENOMINATION_ADMIN,
                        'can_manage_denomination': True,
                        'can_create_churches': True,
                        'can_view_financial_reports': True,
                        'is_active': True,
                    }
                )
                
                if cu_created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ ChurchUser criado para {admin_user.email} na igreja {church.name}')
                    )

                # Definir estatísticas iniciais realistas
                church.total_members = random.randint(300, 1500)
                church.total_visitors = random.randint(50, 200)
                church.save()

            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Igreja já existe: {church.name}')
                )

            # Criar filiais se especificadas
            if church_data['has_branches']:
                for branch_data in church_data['branches']:
                    try:
                        # Para este exemplo, vamos usar o modelo Church para filiais também
                        # mas marcando como filial da igreja principal
                        branch, branch_created = Church.objects.get_or_create(
                            name=branch_data['name'],
                            denomination=denomination,
                            defaults={
                                'short_name': branch_data['name'][:10],
                                'email': church.email,  # Usar email da igreja principal
                                'phone': branch_data['phone'],
                                'address': branch_data['address'],
                                'city': branch_data['city'],
                                'state': church.state,
                                'zipcode': church.zipcode,
                                'subscription_plan': church.subscription_plan,
                                'subscription_status': church.subscription_status,
                                'is_active': True,
                                # Se houver campo parent_church, usar: parent_church=church
                            }
                        )

                        if branch_created:
                            created_branches += 1
                            # Definir estatísticas para filial
                            branch.total_members = random.randint(80, 400)
                            branch.total_visitors = random.randint(20, 80)
                            branch.save()
                            
                            # Nota: branches_count será calculado dinamicamente se necessário
                            
                            self.stdout.write(
                                self.style.SUCCESS(f'✅ Filial criada: {branch.name}')
                            )

                            # Criar ChurchUser para a filial também
                            ChurchUser.objects.get_or_create(
                                user=admin_user,
                                church=branch,
                                defaults={
                                    'role': RoleChoices.DENOMINATION_ADMIN,
                                    'can_manage_denomination': True,
                                    'can_create_churches': True,
                                    'can_view_financial_reports': True,
                                    'is_active': True,
                                }
                            )

                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ Erro ao criar filial {branch_data["name"]}: {e}')
                        )

        # Atualizar estatísticas da denominação
        denomination.update_statistics()
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Processo concluído!')
        )
        self.stdout.write(
            self.style.SUCCESS(f'📊 {created_churches} igrejas criadas')
        )
        self.stdout.write(
            self.style.SUCCESS(f'📊 {created_branches} filiais criadas')
        )
        self.stdout.write(
            self.style.SUCCESS(f'📊 Denominação: {denomination.name}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'📊 Total de igrejas na denominação: {Church.objects.filter(denomination=denomination).count()}')
        )