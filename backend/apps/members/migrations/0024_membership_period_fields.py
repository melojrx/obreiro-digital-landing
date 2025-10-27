from django.db import migrations, models
import datetime


def backfill_membership_start(apps, schema_editor):
    Member = apps.get_model('members', 'Member')
    for m in Member.objects.filter(membership_start_date__isnull=True).iterator():
        if m.membership_date:
            m.membership_start_date = m.membership_date
            m.save(update_fields=['membership_start_date', 'updated_at'])


class Migration(migrations.Migration):
    dependencies = [
        ('members', '0023_member_cpf_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='member',
            name='membership_end_date',
            field=models.DateField(blank=True, null=True, verbose_name='Fim da Membresia'),
        ),
        migrations.AddField(
            model_name='member',
            name='membership_start_date',
            field=models.DateField(blank=True, null=True, verbose_name='Início da Membresia'),
        ),
        migrations.RunPython(backfill_membership_start, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name='member',
            index=models.Index(fields=['membership_end_date'], name='members_mem_members_ba5341_idx'),
        ),
    ]

