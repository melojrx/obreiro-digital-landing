# Migration to populate missing CPF and phone data

from django.db import migrations
import uuid


def populate_missing_data(apps, schema_editor):
    Member = apps.get_model('members', 'Member')
    
    # Update members with missing CPF
    members_without_cpf = Member.objects.filter(cpf__isnull=True)
    for member in members_without_cpf:
        # Generate a temporary CPF-like identifier
        temp_cpf = f"000{str(uuid.uuid4().int)[:8]}"
        member.cpf = temp_cpf[:11]  # Limit to 11 digits
        member.save()
    
    # Update members with missing phone
    members_without_phone = Member.objects.filter(phone__isnull=True)
    for member in members_without_phone:
        member.phone = "(00) 00000-0000"  # Temporary phone
        member.save()


def reverse_populate_missing_data(apps, schema_editor):
    # This is irreversible
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0013_membershipstatus_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_missing_data, reverse_populate_missing_data),
    ]