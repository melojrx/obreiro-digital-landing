from django.db import migrations, models


def backfill_church_denomination(apps, schema_editor):
    Church = apps.get_model('churches', 'Church')
    Denomination = apps.get_model('denominations', 'Denomination')
    User = apps.get_model('accounts', 'CustomUser')

    # Verificar se há igrejas sem denominação
    churches_without = Church.objects.filter(denomination__isnull=True)
    if not churches_without.exists():
        return

    # Tentar obter um administrador para ser owner da denominação padrão
    admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

    # Criar denominação padrão, se necessário
    default_name = 'Denominação Padrão'
    default_short = 'Padrão'
    denom = Denomination.objects.filter(name=default_name).first()
    if not denom:
        denom = Denomination.objects.create(
            name=default_name,
            short_name=default_short,
            description='Criada automaticamente para backfill durante a migração',
            administrator=admin_user,
            email='default-denomination@example.com',
            phone='(11) 9999-9999',
            website='',
            headquarters_address='Endereço padrão',
            headquarters_city='São Paulo',
            headquarters_state='SP',
            headquarters_zipcode='12345-678',
        )

    # Atribuir denominação padrão para todas as igrejas sem vínculo
    churches_without.update(denomination=denom)


class Migration(migrations.Migration):

    dependencies = [
        ('denominations', '0001_initial'),
        ('accounts', '0001_initial'),
        ('churches', '0003_add_qr_code_to_church'),
    ]

    operations = [
        migrations.RunPython(backfill_church_denomination, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='church',
            name='denomination',
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name='churches',
                to='denominations.denomination',
                verbose_name='Denominação',
                help_text='Denominação à qual esta igreja pertence',
            ),
        ),
    ]

