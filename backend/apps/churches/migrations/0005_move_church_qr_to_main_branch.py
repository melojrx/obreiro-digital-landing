from django.db import migrations


def move_qr_to_main_branch(apps, schema_editor):
    Church = apps.get_model('churches', 'Church')
    Branch = apps.get_model('branches', 'Branch')

    for church in Church.objects.all():
        # Garantir existência de filial principal
        branch = Branch.objects.filter(church_id=church.id, is_main=True).first()
        if not branch:
            branch = Branch.objects.filter(church_id=church.id).first()

        if not branch:
            # Criar uma filial principal básica se não existir nenhuma
            branch = Branch.objects.create(
                church_id=church.id,
                name=f"{church.name} - Matriz",
                short_name=church.short_name or 'Matriz',
                address=church.address or '',
                neighborhood='',
                city=church.city or '',
                state=church.state or '',
                zipcode=church.zipcode or '',
                phone=church.phone or '',
                email=church.email or '',
                is_main=True,
                is_active=True,
            )

        # Copiar flags/QR se a branch não tiver
        updated_fields = []
        if hasattr(church, 'allows_visitor_registration'):
            if getattr(branch, 'allows_visitor_registration', None) is None:
                branch.allows_visitor_registration = bool(church.allows_visitor_registration)
                updated_fields.append('allows_visitor_registration')

        # Copiar QR apenas se a branch não tiver imagem/uuid
        if hasattr(church, 'qr_code_uuid') and getattr(branch, 'qr_code_uuid', None) is None:
            branch.qr_code_uuid = church.qr_code_uuid
            updated_fields.append('qr_code_uuid')

        if hasattr(church, 'qr_code_image') and getattr(branch, 'qr_code_image', None) in (None, '') and church.qr_code_image:
            branch.qr_code_image = church.qr_code_image
            updated_fields.append('qr_code_image')

        if hasattr(church, 'qr_code_active') and getattr(branch, 'qr_code_active', None) is None:
            branch.qr_code_active = bool(church.qr_code_active)
            updated_fields.append('qr_code_active')

        if updated_fields:
            updated_fields.append('updated_at')
            branch.save(update_fields=updated_fields)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('churches', '0004_make_denomination_required'),
        # Garantir que Branch e campos relacionados já existam (usar última migração disponível)
        ('branches', '0006_rename_is_headquarters_to_is_main'),
    ]

    operations = [
        migrations.RunPython(move_qr_to_main_branch, noop),
    ]
