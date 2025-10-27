from django.db import migrations, models


def backfill_status_branch(apps, schema_editor):
    MembershipStatus = apps.get_model('members', 'MembershipStatus')
    Member = apps.get_model('members', 'Member')

    # Preencher branch do status usando a branch atual do membro quando status.branch estiver vazio
    for status in MembershipStatus.objects.filter(branch__isnull=True).select_related('member').iterator():
        member = status.member
        if member and member.branch_id:
            status.branch_id = member.branch_id
            status.save(update_fields=['branch', 'updated_at'])


class Migration(migrations.Migration):
    dependencies = [
        ('members', '0024_membership_period_fields'),
        ('branches', '0006_rename_is_headquarters_to_is_main'),
    ]

    operations = [
        migrations.AddField(
            model_name='membershipstatus',
            name='branch',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='membership_statuses', to='branches.branch', verbose_name='Filial'),
        ),
        migrations.AddIndex(
            model_name='membershipstatus',
            index=models.Index(fields=['branch'], name='members_mem_branch_idx'),
        ),
        migrations.RunPython(backfill_status_branch, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='membershipstatus',
            constraint=models.UniqueConstraint(condition=models.Q(('end_date__isnull', True)), fields=('member',), name='unique_current_membership_status_per_member'),
        ),
    ]

