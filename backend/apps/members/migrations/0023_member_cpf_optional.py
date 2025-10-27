from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0022_alter_membershipstatus_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='member',
            name='cpf',
            field=models.CharField(blank=True, help_text='CPF do membro (opcional)', max_length=14, null=True, verbose_name='CPF'),
        ),
    ]

