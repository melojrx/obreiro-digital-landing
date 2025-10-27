from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0021_update_membershipstatus_indexes'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='membershipstatus',
            options={'ordering': ['-effective_date', '-created_at'], 'verbose_name': 'Status de Membresia', 'verbose_name_plural': 'Status de Membresia'},
        ),
    ]

