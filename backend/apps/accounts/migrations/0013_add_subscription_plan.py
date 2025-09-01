# Generated manually to fix missing subscription_plan field
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_remove_churchuser_can_create_churches_and_more'),
    ]

    operations = [
        # This migration represents the addition of subscription_plan field
        # The field was already added manually to the database
        migrations.RunSQL(
            "SELECT 1;",  # No-op, field already exists
            reverse_sql=migrations.RunSQL.noop,
        )
    ]