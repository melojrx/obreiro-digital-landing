# Generated migration for making CPF and phone required

from django.db import migrations, models
import apps.core.models


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0015_populate_missing_cpf_phone'),
    ]

    operations = [
        migrations.AlterField(
            model_name='member',
            name='cpf',
            field=models.CharField(help_text='CPF do membro (obrigatório)', max_length=14, unique=True, validators=[apps.core.models.validate_cpf], verbose_name='CPF'),
        ),
        migrations.AlterField(
            model_name='member',
            name='phone',
            field=models.CharField(help_text='Telefone principal no formato (XX) XXXXX-XXXX (obrigatório)', max_length=20, validators=[apps.core.models.phone_validator], verbose_name='Telefone'),
        ),
    ]