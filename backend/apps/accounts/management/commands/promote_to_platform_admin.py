"""
Comando para promover um usuário existente a administrador da plataforma (SUPER_ADMIN).
Este comando é usado quando já existe um usuário no sistema que precisa ser promovido.

Uso:
python manage.py promote_to_platform_admin --email adminobreirovirtual@gmail.com
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.accounts.models import ChurchUser
from apps.core.models import RoleChoices
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Promove um usuário existente a administrador da plataforma (SUPER_ADMIN)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='E-mail do usuário a ser promovido'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a promoção mesmo se o usuário já tiver papel SUPER_ADMIN'
        )

    def handle(self, *args, **options):
        email = options['email']
        force = options['force']

        try:
            # Verificar se o usuário existe
            user = User.objects.get(email=email)
            self.stdout.write(f'✓ Usuário encontrado: {user.full_name} ({user.email})')

        except User.DoesNotExist:
            raise CommandError(f'Usuário com email {email} não encontrado.')

        # Verificar se já é SUPER_ADMIN
        existing_super_admin = user.church_users.filter(
            role=RoleChoices.SUPER_ADMIN,
            is_active=True
        ).first()

        if existing_super_admin and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'Usuário já possui papel SUPER_ADMIN na igreja: {existing_super_admin.church.name}'
                )
            )
            self.stdout.write('Use --force para forçar a atualização.')
            return

        try:
            with transaction.atomic():
                # Tornar o usuário um superuser do Django
                if not user.is_superuser:
                    user.is_superuser = True
                    user.is_staff = True
                    user.save()
                    self.stdout.write('✓ Usuário promovido a Django superuser')

                # Criar ou buscar a "igreja" administrativa para a plataforma
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
                else:
                    self.stdout.write('✓ Igreja administrativa encontrada')

                # Verificar se já existe ChurchUser para esta igreja
                church_user = user.church_users.filter(church=platform_church).first()

                if church_user:
                    # Atualizar papel existente
                    old_role = church_user.get_role_display()
                    church_user.role = RoleChoices.SUPER_ADMIN
                    
                    # Salvar sem chamar validação customizada
                    super(ChurchUser, church_user).save()
                    
                    self.stdout.write(f'✓ Papel atualizado de "{old_role}" para "Super Administrador"')
                else:
                    # Criar novo ChurchUser com papel SUPER_ADMIN
                    church_user = ChurchUser(
                        user=user,
                        church=platform_church,
                        role=RoleChoices.SUPER_ADMIN
                    )
                    
                    # Salvar sem chamar validação customizada
                    super(ChurchUser, church_user).save()
                    
                    self.stdout.write('✓ Vínculo com igreja administrativa criado')

                # Configurar todas as permissões
                church_user.can_access_admin = True
                church_user.can_manage_members = True
                church_user.can_manage_visitors = True
                church_user.can_manage_activities = True
                church_user.can_view_reports = True
                church_user.can_manage_branches = True
                
                # Salvar permissões
                super(ChurchUser, church_user).save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f'🎉 Usuário {user.full_name} promovido a SUPER_ADMIN com sucesso!'
                    )
                )
                self.stdout.write(
                    self.style.WARNING(
                        'ATENÇÃO: Este usuário agora tem acesso total à plataforma!'
                    )
                )

                # Mostrar resumo
                self.stdout.write('\n--- RESUMO DA PROMOÇÃO ---')
                self.stdout.write(f'Nome: {user.full_name}')
                self.stdout.write(f'Email: {user.email}')
                self.stdout.write(f'Django Superuser: {user.is_superuser}')
                self.stdout.write(f'Papel: {church_user.get_role_display()}')
                self.stdout.write(f'Igreja: {church_user.church.name}')

        except Exception as e:
            raise CommandError(f'Erro ao promover usuário: {str(e)}') 