"""
Comando para criar administradores da plataforma (SUPER_ADMIN).
Este é o ÚNICO método seguro para criar usuários com papel SUPER_ADMIN.

Uso:
python manage.py create_platform_admin --email admin@obreirovirtual.com --name "Admin Principal"
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.accounts.models import ChurchUser
from apps.core.models import RoleChoices
import getpass

User = get_user_model()


class Command(BaseCommand):
    help = 'Cria um administrador da plataforma com papel SUPER_ADMIN'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='E-mail do administrador da plataforma'
        )
        parser.add_argument(
            '--name',
            type=str,
            required=True,
            help='Nome completo do administrador'
        )
        parser.add_argument(
            '--phone',
            type=str,
            default='',
            help='Telefone do administrador (opcional)'
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Senha (se não fornecida, será solicitada)'
        )

    def handle(self, *args, **options):
        email = options['email']
        name = options['name']
        phone = options['phone']
        password = options['password']

        # Verificar se já existe usuário com este email
        if User.objects.filter(email=email).exists():
            raise CommandError(f'Usuário com email {email} já existe.')

        # Solicitar senha se não fornecida
        if not password:
            password = getpass.getpass('Digite a senha para o administrador: ')
            password_confirm = getpass.getpass('Confirme a senha: ')
            
            if password != password_confirm:
                raise CommandError('Senhas não coincidem.')

        try:
            # Criar usuário
            self.stdout.write('Criando usuário...')
            user = User.objects.create_user(
                email=email,
                full_name=name,
                phone=phone,
                password=password
            )
            user.is_staff = True  # Acesso ao Django Admin
            user.is_superuser = True  # Superuser do Django
            user.is_profile_complete = True
            user.save()

            self.stdout.write(
                self.style.SUCCESS(f'✓ Usuário criado: {user.email}')
            )

            # Criar uma "igreja" fictícia para o admin da plataforma
            from apps.churches.models import Church
            platform_church, created = Church.objects.get_or_create(
                name='Obreiro Virtual - Administração',
                defaults={
                    'short_name': 'Admin Platform',
                    'email': 'admin@obreirovirtual.com',
                    'phone': '(11) 99999-9999',
                    'address': 'Endereço da Empresa',
                    'city': 'São Paulo',
                    'state': 'SP',
                    'zipcode': '01000-000',
                    'subscription_plan': 'denomination'
                }
            )

            if created:
                self.stdout.write('✓ Igreja administrativa criada')

            # Criar ChurchUser com papel SUPER_ADMIN
            # Temporariamente desabilitar a validação
            church_user = ChurchUser(
                user=user,
                church=platform_church,
                role=RoleChoices.SUPER_ADMIN
            )
            
            # Salvar sem chamar o método save() customizado
            super(ChurchUser, church_user).save()
            
            # Configurar permissões manualmente
            church_user.can_access_admin = True
            church_user.can_manage_members = True
            church_user.can_manage_visitors = True
            church_user.can_manage_activities = True
            church_user.can_view_reports = True
            church_user.can_manage_branches = True
            
            # Salvar novamente
            super(ChurchUser, church_user).save()

            self.stdout.write(
                self.style.SUCCESS(f'✓ Administrador da plataforma criado com sucesso!')
            )
            self.stdout.write(
                self.style.WARNING(
                    'ATENÇÃO: Este usuário tem acesso total à plataforma. '
                    'Use com responsabilidade!'
                )
            )

        except Exception as e:
            raise CommandError(f'Erro ao criar administrador: {str(e)}') 