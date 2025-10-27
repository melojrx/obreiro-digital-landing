"""
Comando para criar usuários de teste para todos os papéis do sistema.
Útil para desenvolvimento e testes das funcionalidades e permissões.

Perfis criados (conforme Sistema_de_Permissoes.md):
1. SUPER_ADMIN - Administrador da plataforma (desenvolvedores)
2. DENOMINATION_ADMIN - Administrador de denominação (múltiplas igrejas)
3. CHURCH_ADMIN - Administrador de igreja (igreja e filiais)
4. SECRETARY - Secretário (gestão de cadastros em branches específicas)

Uso:
python manage.py create_test_users
python manage.py create_test_users --clean  # Remove usuários anteriores
python manage.py create_test_users --password minhasenha  # Define senha customizada
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
    help = 'Cria usuários de teste para todos os 4 papéis do sistema (SUPER_ADMIN, DENOMINATION_ADMIN, CHURCH_ADMIN, SECRETARY)'

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

        self.stdout.write(self.style.SUCCESS('🚀 Criando usuários de teste para os 4 perfis do sistema...'))
        self.stdout.write(self.style.WARNING('📖 Baseado em: docs/Sistema_de_Permissoes.md (v2.0)'))

        if clean:
            self.clean_test_users()

        try:
            with transaction.atomic():
                # 1. Criar usuário temporário para satisfazer constraint da denominação
                temp_user, _ = User.objects.get_or_create(
                    email='temp@temp.com',
                    defaults={
                        'full_name': 'Temp User',
                        'phone': '(11) 99999-9999',
                        'is_profile_complete': True
                    }
                )
                temp_user.set_password(password)
                temp_user.save()

                # 2. Criar denominação de teste (usando temp_user como administrator temporário)
                denomination = self.create_test_denomination(temp_user)

                # 3. Criar SUPER_ADMIN agora que temos denominação
                users_created = []

                super_admin = self.create_super_admin(
                    email='superadmin@teste.com',
                    name='Super Admin (Plataforma)',
                    phone='(11) 91111-1111',
                    password=password,
                    description='Administrador da plataforma - Acesso total ao sistema',
                    denomination=denomination
                )
                users_created.append(super_admin)

                # 4. Atualizar denominação para usar super_admin como administrator
                denomination.administrator = super_admin['user']
                denomination.save()

                # 5. Deletar usuário temporário
                temp_user.delete()

                # 3. Criar igreja da denominação
                church_denominacao = self.create_test_church(denomination, name_suffix='Denominação')

                # 4. Criar igreja independente
                church_independente = self.create_test_church(denomination, name_suffix='Independente')

                # 5. Criar filiais da igreja independente
                branch_matriz = self.create_test_branch(church_independente, "Matriz Central", is_main=True)
                branch_norte = self.create_test_branch(church_independente, "Congregação Norte")
                branch_sul = self.create_test_branch(church_independente, "Congregação Sul")

                # 6. Criar usuários para cada papel
                # (SUPER_ADMIN já foi criado acima)

                # ========================================
                # CHURCH_ADMIN Denominação (Nível 3-like) - Administrador de denominação
                # (DENOMINATION_ADMIN ainda não implementado, usando CHURCH_ADMIN)
                # ========================================
                denomination_admin = self.create_test_user(
                    email='denominacao.admin@teste.com',
                    name='Admin da Denominação',
                    phone='(11) 92222-2222',
                    password=password,
                    church=church_denominacao,
                    role=RoleChoices.CHURCH_ADMIN,  # Usando CHURCH_ADMIN temporariamente
                    description='Administrador de denominação - Gerencia múltiplas igrejas (usa CHURCH_ADMIN por enquanto)'
                )
                users_created.append(denomination_admin)

                # ========================================
                # CHURCH_ADMIN (Nível 2) - Administrador de igreja
                # ========================================
                church_admin = self.create_test_user(
                    email='igreja.admin@teste.com',
                    name='Admin da Igreja',
                    phone='(11) 93333-3333',
                    password=password,
                    church=church_independente,
                    role=RoleChoices.CHURCH_ADMIN,
                    description='Administrador de igreja - Gerencia matriz e todas as filiais'
                )
                users_created.append(church_admin)

                # ========================================
                # SECRETARY (Nível 1) - Secretário
                # ========================================
                # Secretário com acesso à Matriz e Norte
                secretary_matriz = self.create_test_user(
                    email='secretario.matriz@teste.com',
                    name='Secretário - Matriz e Norte',
                    phone='(11) 94444-4444',
                    password=password,
                    church=church_independente,
                    role=RoleChoices.SECRETARY,
                    description='Secretário - Acesso à Matriz e Congregação Norte',
                    managed_branches=[branch_matriz, branch_norte]
                )
                users_created.append(secretary_matriz)

                # Secretário com acesso apenas à Congregação Sul
                secretary_sul = self.create_test_user(
                    email='secretario.sul@teste.com',
                    name='Secretário - Congregação Sul',
                    phone='(11) 95555-5555',
                    password=password,
                    church=church_independente,
                    role=RoleChoices.SECRETARY,
                    description='Secretário - Acesso apenas à Congregação Sul',
                    managed_branches=[branch_sul]
                )
                users_created.append(secretary_sul)

                self.stdout.write(self.style.SUCCESS('\n✅ Usuários de teste criados com sucesso!'))
                self.print_summary(users_created, denomination, [church_denominacao, church_independente], [branch_matriz, branch_norte, branch_sul], password)

        except Exception as e:
            raise CommandError(f'Erro ao criar usuários de teste: {str(e)}')

    def clean_test_users(self):
        """Remove usuários de teste existentes"""
        self.stdout.write('🧹 Limpando usuários de teste existentes...')

        # Ordem correta: Denominações -> Igrejas -> Usuários (respeitando foreign keys protegidas)

        # 1. Limpar denominação de teste primeiro (tem protected FK para User)
        test_denominations = Denomination.objects.filter(name__icontains='Denominação Teste')
        denom_count = test_denominations.count()
        test_denominations.delete()

        # 2. Limpar igrejas de teste
        test_churches = Church.objects.filter(name__icontains='Igreja Teste')
        church_count = test_churches.count()
        test_churches.delete()

        # 3. Limpar igreja administrativa
        Church.objects.filter(name='Obreiro Virtual - Administração').delete()

        # 4. Agora podemos deletar os usuários
        test_emails = [
            'superadmin@teste.com',
            'denominacao.admin@teste.com',
            'igreja.admin@teste.com',
            'secretario.matriz@teste.com',
            'secretario.sul@teste.com',
        ]

        deleted_users = User.objects.filter(email__in=test_emails)
        user_count = deleted_users.count()
        deleted_users.delete()

        self.stdout.write(f'✓ Removidos: {user_count} usuários, {church_count} igrejas, {denom_count} denominações')

    def create_test_denomination(self, administrator):
        """Cria denominação de teste"""
        denomination, created = Denomination.objects.get_or_create(
            name='Denominação Teste - Desenvolvimento',
            defaults={
                'short_name': 'Teste Dev',
                'description': 'Denominação criada para testes de desenvolvimento e permissões',
                'administrator': administrator,
                'email': 'denominacao@teste.com',
                'phone': '(11) 90000-0000',
                'headquarters_address': 'Rua dos Testes, 123',
                'headquarters_city': 'São Paulo',
                'headquarters_state': 'SP',
                'headquarters_zipcode': '01000-000',
                'allows_visitor_registration': True,
                'max_churches': 100,
                'max_members': 5000,
                'subscription_plan': 'denomination',
                'is_active': True
            }
        )

        if created:
            self.stdout.write('✓ Denominação de teste criada')
        else:
            self.stdout.write('✓ Denominação de teste encontrada')

        return denomination

    def create_test_church(self, denomination, name_suffix):
        """Cria igreja de teste"""
        church, created = Church.objects.get_or_create(
            name=f'Igreja Teste {name_suffix}',
            defaults={
                'short_name': f'Teste {name_suffix}',
                'denomination': denomination,
                'email': f'igreja{name_suffix.lower()}@teste.com',
                'phone': '(11) 98000-0001',
                'address': f'Avenida dos Testes {name_suffix}, 456',
                'city': 'São Paulo',
                'state': 'SP',
                'zipcode': '01000-000',
                'subscription_plan': 'professional',
                'is_active': True
            }
        )

        if created:
            self.stdout.write(f'✓ Igreja "{church.name}" criada')
        else:
            self.stdout.write(f'✓ Igreja "{church.name}" encontrada')

        return church

    def create_test_branch(self, church, name, is_main=False):
        """Cria filial de teste"""
        branch, created = Branch.objects.get_or_create(
            church=church,
            name=name,
            defaults={
                'short_name': name,
                'is_main': is_main,
                'address': f'Rua {name}, 789',
                'neighborhood': 'Centro',
                'city': church.city,
                'state': church.state,
                'zipcode': church.zipcode,
                'email': f'{name.lower().replace(" ", "").replace("ç", "c").replace("ã", "a")}@teste.com',
                'phone': church.phone,
                'allows_visitor_registration': True,
                'qr_code_active': True
            }
        )

        if created:
            self.stdout.write(f'✓ Filial "{name}" criada')

        return branch

    def create_super_admin(self, email, name, phone, password, description, denomination=None):
        """Cria SUPER_ADMIN - Administrador da plataforma"""
        # Criar usuário
        user, user_created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': name,
                'phone': phone,
                'is_profile_complete': True,
                'is_staff': True,  # Acesso ao Django Admin
                'is_superuser': True  # Superuser do Django
            }
        )

        if user_created:
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

        # Criar "igreja administrativa" para o SUPER_ADMIN
        church_defaults = {
            'short_name': 'Admin Platform',
            'email': 'admin@obreirovirtual.com',
            'phone': '(11) 99999-9999',
            'address': 'Endereço da Plataforma',
            'city': 'São Paulo',
            'state': 'SP',
            'zipcode': '01000-000',
            'subscription_plan': 'denomination'
        }

        if denomination:
            church_defaults['denomination'] = denomination

        platform_church, _ = Church.objects.get_or_create(
            name='Obreiro Virtual - Administração',
            defaults=church_defaults
        )

        # Criar ChurchUser com papel SUPER_ADMIN (bypassando validações)
        try:
            church_user = ChurchUser.objects.get(user=user, church=platform_church)
        except ChurchUser.DoesNotExist:
            church_user = ChurchUser(
                user=user,
                church=platform_church,
                role=RoleChoices.SUPER_ADMIN
            )
            # Usar super().save() para bypass validações (igual ao create_platform_admin.py)
            super(ChurchUser, church_user).save()

            # Configurar permissões manualmente
            church_user.can_manage_members = True
            church_user.can_manage_visitors = True
            church_user.can_manage_branches = True
            church_user.can_view_reports = True
            super(ChurchUser, church_user).save()

        return {
            'user': user,
            'church_user': church_user,
            'church': platform_church,
            'role': RoleChoices.SUPER_ADMIN,
            'description': description,
            'branches': 'Todas (acesso global)'
        }

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

        if not created and church_user.role != role:
            church_user.role = role
            church_user.save()

        # Configurar filiais gerenciadas (apenas para SECRETARY)
        if role == RoleChoices.SECRETARY and managed_branches:
            church_user.managed_branches.set(managed_branches)
            branches_info = ', '.join([b.name for b in managed_branches])
        else:
            branches_info = 'Todas da igreja' if role == RoleChoices.CHURCH_ADMIN else 'N/A'

        return {
            'user': user,
            'church_user': church_user,
            'church': church,
            'role': role,
            'description': description,
            'branches': branches_info
        }

    def print_summary(self, users_created, denomination, churches, branches, password):
        """Imprime resumo dos usuários criados"""
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('📋 RESUMO DOS USUÁRIOS DE TESTE CRIADOS'))
        self.stdout.write('='*70)

        self.stdout.write(f'\n🏛️  Denominação: {denomination.name}')
        self.stdout.write(f'🏪 Igrejas: {", ".join([c.short_name for c in churches])}')
        self.stdout.write(f'🏢 Filiais: {", ".join([b.name for b in branches])}')
        self.stdout.write(f'🔑 Senha padrão: {password}')

        self.stdout.write('\n👥 USUÁRIOS CRIADOS (4 PERFIS):')
        self.stdout.write('-'*70)

        # Agrupar por nível hierárquico
        role_order = {
            RoleChoices.SUPER_ADMIN: '4️⃣ ',
            # DENOMINATION_ADMIN não existe ainda, usando CHURCH_ADMIN: '3️⃣ ',
            RoleChoices.CHURCH_ADMIN: '2️⃣ ',
            RoleChoices.SECRETARY: '1️⃣ '
        }

        for user_data in users_created:
            user = user_data['user']
            role = user_data['role']
            description = user_data['description']
            church = user_data['church']
            branches = user_data['branches']

            level = role_order.get(role, '   ')

            self.stdout.write(f'\n{level}{self.style.SUCCESS(role)}')
            self.stdout.write(f'   📧 Email: {user.email}')
            self.stdout.write(f'   👤 Nome: {user.full_name}')
            self.stdout.write(f'   🏪 Igreja: {church.short_name}')
            self.stdout.write(f'   🏢 Filiais: {branches}')
            self.stdout.write(f'   📝 Descrição: {description}')

        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.WARNING('⚠️  IMPORTANTE:'))
        self.stdout.write('• Estes usuários são apenas para DESENVOLVIMENTO/TESTE')
        self.stdout.write('• Use --clean para remover antes de criar novos')
        self.stdout.write('• NUNCA use em produção!')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('📖 Documentação: docs/Sistema_de_Permissoes.md'))
        self.stdout.write('='*70)

        self.stdout.write('\n🎯 PRÓXIMOS PASSOS:')
        self.stdout.write('1. Acesse http://localhost:5173 (ou porta configurada)')
        self.stdout.write('2. Faça login com um dos emails acima')
        self.stdout.write(f'3. Senha: {password}')
        self.stdout.write('4. Teste as permissões de cada perfil!')
        self.stdout.write('')
