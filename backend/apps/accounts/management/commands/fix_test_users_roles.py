"""
Comando para corrigir papéis de sistema dos usuários de teste
Garante que usuários cadastrados como administradores tenham papéis de sistema adequados
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import ChurchUser, RoleChoices
from apps.churches.models import Church

User = get_user_model()


class Command(BaseCommand):
    help = 'Corrige papéis de sistema dos usuários de teste para que apareçam como administradores elegíveis'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔧 Iniciando correção de papéis de usuários de teste...'))
        
        # Mapear emails para papéis de sistema adequados
        user_role_mapping = {
            'denominacao.admin@teste.com': RoleChoices.CHURCH_ADMIN,  # Atualizado para CHURCH_ADMIN
            'igreja.admin@teste.com': RoleChoices.CHURCH_ADMIN,
            'igreja.filha.admin@teste.com': RoleChoices.CHURCH_ADMIN,
            'pastor@teste.com': RoleChoices.PASTOR,
            'secretario@teste.com': RoleChoices.SECRETARY,
            'lider@teste.com': RoleChoices.LEADER,
        }
        
        updated_count = 0
        
        for email, target_role in user_role_mapping.items():
            try:
                user = User.objects.get(email=email, is_active=True)
                
                # Buscar ChurchUser ativo para este usuário
                church_users = ChurchUser.objects.filter(user=user, is_active=True)
                
                if not church_users.exists():
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  Usuário {email} não tem ChurchUser ativo. Pulando...')
                    )
                    continue
                
                # Atualizar papel de sistema para todos os ChurchUser ativos
                for church_user in church_users:
                    old_role = church_user.role
                    church_user.role = target_role
                    church_user.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✅ {email}: {old_role} → {target_role} na igreja {church_user.church.name}'
                        )
                    )
                    updated_count += 1
                    
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Usuário {email} não encontrado. Pulando...')
                )
                continue
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Erro ao processar {email}: {str(e)}')
                )
                continue
        
        # Verificar se há usuários que podem ser administradores mas não têm papéis adequados
        self.stdout.write(self.style.SUCCESS('\n🔍 Verificando outros usuários que podem ser administradores...'))
        
        # Buscar usuários que são membros mas têm função ministerial de pastor
        from apps.members.models import Member
        from apps.core.models import MinisterialFunctionChoices
        
        pastor_members = Member.objects.filter(
            ministerial_function=MinisterialFunctionChoices.PASTOR,
            user__isnull=False,
            is_active=True
        ).select_related('user', 'church')
        
        for member in pastor_members:
            user = member.user
            church = member.church
            
            # Verificar se tem ChurchUser com papel adequado
            church_user = ChurchUser.objects.filter(
                user=user,
                church=church,
                is_active=True
            ).first()
            
            if church_user and church_user.role == RoleChoices.MEMBER:
                # Atualizar para PASTOR no sistema
                old_role = church_user.role
                church_user.role = RoleChoices.PASTOR
                church_user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ {user.email}: {old_role} → {RoleChoices.PASTOR} (função ministerial: Pastor)'
                    )
                )
                updated_count += 1
        
        # Resumo final
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Correção concluída! {updated_count} papéis atualizados.')
        )
        
        # Mostrar estatísticas finais
        self.stdout.write(self.style.SUCCESS('\n📊 Estatísticas finais:'))
        
        role_counts = {}
        for role_choice in RoleChoices.choices:
            role_code = role_choice[0]
            role_name = role_choice[1]
            count = ChurchUser.objects.filter(role=role_code, is_active=True).count()
            if count > 0:
                role_counts[role_name] = count
        
        for role_name, count in role_counts.items():
            self.stdout.write(f'  • {role_name}: {count} usuários')
        
        self.stdout.write(
            self.style.SUCCESS('\n✨ Agora os usuários com papéis administrativos aparecerão no dropdown!')
        )