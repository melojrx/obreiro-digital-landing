from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0019_ministerialfunctionhistory_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='membershipstatus',
            old_name='ordination_date',
            new_name='effective_date',
        ),
        migrations.RenameField(
            model_name='membershipstatus',
            old_name='termination_date',
            new_name='end_date',
        ),
    ]

