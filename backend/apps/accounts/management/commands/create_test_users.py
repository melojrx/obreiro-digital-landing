"""
Comando para criar usuários de teste para todos os papéis do sistema.
Útil para desenvolvimento e testes das funcionalidades e permissões.

Uso:
python manage.py create_test_users
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.accounts.models import ChurchUser, UserProfile
from apps.core.models import RoleChoices
from apps.churches.models import Church
from apps.branches.models import Branch
from apps.denominations.models import Denomination
from django.db import transaction
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Cria usuários de teste para todos os papéis do sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Remove usuários de teste existentes antes de criar novos'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='teste123',
            help='Senha para todos os usuários de teste (padrão: teste123)'
        )

    def handle(self, *args, **options):
        password = options['password']
        clean = options['clean']

        self.stdout.write(self.style.SUCCESS('🚀 Criando usuários de teste...'))

        if clean:
            self.clean_test_users()

        try:
            with transaction.atomic():
                # 1. Criar denominação de teste
                denomination = self.create_test_denomination()
                
                # 2. Criar igreja sede de teste
                church_sede = self.create_test_church(denomination, is_sede=True)
                
                # 3. Criar igreja filha de teste
                church_filha = self.create_test_church(denomination, is_sede=False)
                
                # 4. Criar filiais
                branch_sede = self.create_test_branch(church_sede, "Sede Principal")
                branch_filial1 = self.create_test_branch(church_sede, "Filial Norte")
                branch_filial2 = self.create_test_branch(church_sede, "Filial Sul")
                
                # 5. Criar usuários para cada papel
                users_created = []
                
                # DENOMINATION_ADMIN
                denomination_admin = self.create_test_user(
                    email='denominacao.admin@teste.com',
                    name='Admin Denominação',
                    phone='(11) 91111-1111',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.DENOMINATION_ADMIN,
                    description='Administrador da denominação - pode gerenciar todas as igrejas'
                )
                users_created.append(denomination_admin)
                
                # CHURCH_ADMIN (Igreja Sede)
                church_admin_sede = self.create_test_user(
                    email='igreja.admin@teste.com',
                    name='Admin Igreja Sede',
                    phone='(11) 92222-2222',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.CHURCH_ADMIN,
                    description='Administrador da igreja sede'
                )
                users_created.append(church_admin_sede)
                
                # CHURCH_ADMIN (Igreja Filha)
                church_admin_filha = self.create_test_user(
                    email='igreja.filha.admin@teste.com',
                    name='Admin Igreja Filha',
                    phone='(11) 92223-2223',
                    password=password,
                    church=church_filha,
                    role=RoleChoices.CHURCH_ADMIN,
                    description='Administrador da igreja filha'
                )
                users_created.append(church_admin_filha)
                
                # PASTOR
                pastor = self.create_test_user(
                    email='pastor@teste.com',
                    name='Pastor Principal',
                    phone='(11) 93333-3333',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.PASTOR,
                    description='Pastor da igreja'
                )
                users_created.append(pastor)
                
                # SECRETARY
                secretary = self.create_test_user(
                    email='secretario@teste.com',
                    name='Secretário Igreja',
                    phone='(11) 94444-4444',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.SECRETARY,
                    description='Secretário da igreja'
                )
                users_created.append(secretary)
                
                # LEADER (com filiais específicas)
                leader = self.create_test_user(
                    email='lider@teste.com',
                    name='Líder Filial Norte',
                    phone='(11) 95555-5555',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.LEADER,
                    description='Líder responsável pela filial norte',
                    managed_branches=[branch_filial1]
                )
                users_created.append(leader)
                
                # MEMBER (usuário comum)
                member = self.create_test_user(
                    email='membro@teste.com',
                    name='Membro Comum',
                    phone='(11) 96666-6666',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.MEMBER,
                    description='Membro comum da igreja'
                )
                users_created.append(member)
                
                # READ_ONLY
                readonly = self.create_test_user(
                    email='readonly@teste.com',
                    name='Usuário Somente Leitura',
                    phone='(11) 97777-7777',
                    password=password,
                    church=church_sede,
                    role=RoleChoices.READ_ONLY,
                    description='Usuário com acesso somente leitura'
                )
                users_created.append(readonly)

                self.stdout.write(self.style.SUCCESS('\n✅ Usuários de teste criados com sucesso!'))
                self.print_summary(users_created, denomination, [church_sede, church_filha], password)

        except Exception as e:
            raise CommandError(f'Erro ao criar usuários de teste: {str(e)}')

    def clean_test_users(self):
        """Remove usuários de teste existentes"""
        self.stdout.write('🧹 Limpando usuários de teste existentes...')
        
        test_emails = [
            'denominacao.admin@teste.com',
            'igreja.admin@teste.com',
            'igreja.filha.admin@teste.com',
            'pastor@teste.com',
            'secretario@teste.com',
            'lider@teste.com',
            'membro@teste.com',
            'readonly@teste.com'
        ]
        
        deleted_users = User.objects.filter(email__in=test_emails).delete()
        
        # Limpar igrejas de teste
        test_churches = Church.objects.filter(name__icontains='Teste').delete()
        
        # Limpar denominação de teste
        test_denominations = Denomination.objects.filter(name__icontains='Teste').delete()
        
        self.stdout.write(f'✓ Removidos: {deleted_users[0]} usuários, {test_churches[0]} igrejas, {test_denominations[0]} denominações')

    def create_test_denomination(self):
        """Cria denominação de teste"""
        denomination, created = Denomination.objects.get_or_create(
            name='Denominação Teste - Desenvolvimento',
            defaults={
                'short_name': 'Teste Dev',
                'description': 'Denominação criada para testes de desenvolvimento',
                'email': 'denominacao@teste.com',
                'phone': '(11) 90000-0000',
                'headquarters_address': 'Rua dos Testes, 123',
                'headquarters_city': 'São Paulo',
                'headquarters_state': 'SP',
                'headquarters_zipcode': '01000-000',
                'administrator_id': 1  # Será atualizado depois
            }
        )
        
        if created:
            self.stdout.write('✓ Denominação de teste criada')
        else:
            self.stdout.write('✓ Denominação de teste encontrada')
            
        return denomination

    def create_test_church(self, denomination, is_sede=True):
        """Cria igreja de teste"""
        suffix = 'Sede' if is_sede else 'Filha'
        
        church, created = Church.objects.get_or_create(
            name=f'Igreja Teste {suffix} - Desenvolvimento',
            defaults={
                'short_name': f'Teste {suffix}',
                'denomination': denomination,
                'email': f'igreja{suffix.lower()}@teste.com',
                'phone': f'(11) 9000{1 if is_sede else 2}-000{1 if is_sede else 2}',
                'address': f'Avenida dos Testes {suffix}, 456',
                'city': 'São Paulo',
                'state': 'SP',
                'zipcode': '01000-000',
                'subscription_plan': 'professional'
            }
        )
        
        if created:
            self.stdout.write(f'✓ Igreja {suffix} de teste criada')
        else:
            self.stdout.write(f'✓ Igreja {suffix} de teste encontrada')
            
        return church

    def create_test_branch(self, church, name):
        """Cria filial de teste"""
        branch, created = Branch.objects.get_or_create(
            church=church,
            name=name,
            defaults={
                'short_name': name,
                'address': f'Rua {name}, 789',
                'neighborhood': 'Centro',
                'city': church.city,
                'state': church.state,
                'zipcode': church.zipcode,
                'email': f'{name.lower().replace(" ", "")}@teste.com',
                'phone': church.phone
            }
        )
        
        if created:
            self.stdout.write(f'✓ Filial "{name}" criada')
            
        return branch

    def create_test_user(self, email, name, phone, password, church, role, description, managed_branches=None):
        """Cria usuário de teste com papel específico"""
        # Criar usuário
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': name,
                'phone': phone,
                'is_profile_complete': True
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            
            # Criar perfil
            UserProfile.objects.create(
                user=user,
                birth_date=date(1990, 1, 1),
                gender='M',
                bio=description,
                email_notifications=True,
                sms_notifications=False
            )
        
        # Criar ou atualizar ChurchUser
        church_user, created = ChurchUser.objects.get_or_create(
            user=user,
            church=church,
            defaults={'role': role}
        )
        
        if not created:
            church_user.role = role
            church_user.save()
        
        # Configurar filiais gerenciadas se fornecidas
        if managed_branches:
            church_user.managed_branches.set(managed_branches)
        
        return {
            'user': user,
            'church_user': church_user,
            'role': role,
            'description': description
        }

    def print_summary(self, users_created, denomination, churches, password):
        """Imprime resumo dos usuários criados"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📋 RESUMO DOS USUÁRIOS DE TESTE CRIADOS'))
        self.stdout.write('='*60)
        
        self.stdout.write(f'\n🏛️  Denominação: {denomination.name}')
        self.stdout.write(f'🏪 Igrejas: {", ".join([c.name for c in churches])}')
        self.stdout.write(f'🔑 Senha padrão: {password}')
        
        self.stdout.write('\n👥 USUÁRIOS CRIADOS:')
        self.stdout.write('-'*60)
        
        for user_data in users_created:
            user = user_data['user']
            role = user_data['role']
            description = user_data['description']
            
            self.stdout.write(f'📧 {user.email}')
            self.stdout.write(f'   👤 {user.full_name}')
            self.stdout.write(f'   🎭 {role} - {description}')
            self.stdout.write(f'   📱 {user.phone}')
            self.stdout.write('')
        
        self.stdout.write('='*60)
        self.stdout.write(self.style.WARNING('⚠️  IMPORTANTE:'))
        self.stdout.write('• Estes usuários são apenas para DESENVOLVIMENTO/TESTE')
        self.stdout.write('• Use --clean para remover antes de criar novos')
        self.stdout.write('• NUNCA use em produção!')
        self.stdout.write('='*60) 