from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0020_rename_membershipstatus_fields'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='membershipstatus',
            name='members_mem_member__cba717_idx',
        ),
        migrations.RemoveIndex(
            model_name='membershipstatus',
            name='members_mem_status_28fd50_idx',
        ),
        migrations.AddIndex(
            model_name='membershipstatus',
            index=models.Index(fields=['member', '-effective_date'], name='members_mem_member__eff_idx'),
        ),
        migrations.AddIndex(
            model_name='membershipstatus',
            index=models.Index(fields=['status', '-effective_date'], name='members_mem_status_eff_idx'),
        ),
    ]

