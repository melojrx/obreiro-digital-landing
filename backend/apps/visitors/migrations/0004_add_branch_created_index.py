from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('visitors', '0006_fix_cpf_null'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='visitor',
            index=models.Index(fields=['branch', 'created_at'], name='visitors_bra_created_idx'),
        ),
    ]
