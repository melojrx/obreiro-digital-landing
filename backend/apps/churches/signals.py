"""
Signals para Churches - Automação de QR Codes e Branches
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Church


@receiver(post_save, sender=Church)
def create_qr_code_and_main_branch_for_new_church(sender, instance, created, **kwargs):
    """
    Quando uma igreja é criada:
    1. Gera QR Code para a igreja (já feito no save())
    2. Cria automaticamente uma filial matriz com QR Code próprio
    """
    if created:  # Apenas quando a igreja é criada (não em updates)
        from apps.branches.models import Branch
        
        # Verificar se já existe alguma branch
        if not instance.branches.exists():
            print(f'\n🏗️ Criando branch matriz para igreja: {instance.name}')
            
            # Criar branch matriz
            branch = Branch.objects.create(
                church=instance,
                name=f'{instance.name} - Matriz',
                short_name='Sede Principal',
                address=instance.address,
                city=instance.city,
                state=instance.state,
                zipcode=instance.zipcode,
                phone=instance.phone,
                email=instance.email,
                is_active=True,
                allows_visitor_registration=True,
                neighborhood='Centro'  # Default
            )
            
            print(f'✅ Branch matriz criada: {branch.name}')
            print(f'   - QR Code UUID (Branch): {branch.qr_code_uuid}')
            print(f'   - QR Code Image (Branch): {bool(branch.qr_code_image)}')
