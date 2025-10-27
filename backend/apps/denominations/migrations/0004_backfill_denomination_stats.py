from django.db import migrations


def backfill_denomination_stats(apps, schema_editor):
    Denomination = apps.get_model('denominations', 'Denomination')
    Church = apps.get_model('churches', 'Church')
    try:
        from django.db.models import Sum
    except Exception:
        Sum = None

    for denom in Denomination.objects.all():
        church_qs = Church.objects.filter(denomination_id=denom.id, is_active=True)
        total_churches = church_qs.count()
        total_members = church_qs.aggregate(tm=Sum('total_members'))['tm'] if Sum else None
        total_visitors = church_qs.aggregate(tv=Sum('total_visitors'))['tv'] if Sum else None
        total_visitors_registered = church_qs.aggregate(tvr=Sum('total_visitors_registered'))['tvr'] if Sum else None

        denom.total_churches = total_churches
        if total_members is not None:
            denom.total_members = int(total_members or 0)
        if total_visitors is not None:
            denom.total_visitors = int(total_visitors or 0)
        if total_visitors_registered is not None:
            denom.total_visitors_registered = int(total_visitors_registered or 0)
        denom.save(update_fields=['total_churches', 'total_members', 'total_visitors', 'total_visitors_registered', 'updated_at'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('denominations', '0003_denomination_allows_visitor_registration_and_more'),
        ('churches', '0004_make_denomination_required'),
    ]

    operations = [
        migrations.RunPython(backfill_denomination_stats, noop),
    ]

