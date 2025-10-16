from django.db import migrations, models


def mark_headquarters(apps, schema_editor):
    Branch = apps.get_model('branches', 'Branch')
    Church = apps.get_model('churches', 'Church')

    for branch in Branch.objects.all():
        church = branch.church
        if not church:
            continue

        name_matches = branch.name == f"{church.name} - Matriz"
        short_name_matches = branch.short_name in {church.short_name or '', 'Matriz'}

        if name_matches or short_name_matches:
            Branch.objects.filter(pk=branch.pk).update(is_headquarters=True)


def unmark_headquarters(apps, schema_editor):
    Branch = apps.get_model('branches', 'Branch')
    Branch.objects.update(is_headquarters=False)


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0003_remove_visitor_registration_url_if_exists'),
    ]

    operations = [
        migrations.AddField(
            model_name='branch',
            name='is_headquarters',
            field=models.BooleanField(
                default=False,
                help_text='Indica se esta filial representa a igreja sede',
                verbose_name='Filial Matriz',
            ),
        ),
        migrations.RunPython(mark_headquarters, reverse_code=unmark_headquarters),
    ]
