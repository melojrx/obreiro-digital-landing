from django.db import migrations, models
import django.db.models


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0005_branch_unique_headquarters_per_church'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='branch',
            name='unique_headquarters_per_church',
        ),
        migrations.RenameField(
            model_name='branch',
            old_name='is_headquarters',
            new_name='is_main',
        ),
        migrations.AddConstraint(
            model_name='branch',
            constraint=models.UniqueConstraint(
                fields=['church'],
                condition=models.Q(is_main=True),
                name='unique_main_branch_per_church',
            ),
        ),
    ]

