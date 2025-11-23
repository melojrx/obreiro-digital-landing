from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0023_alter_customuser_options_alter_customuser_table_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='email',
            field=models.EmailField(
                max_length=254,
                unique=True,
                verbose_name='E-mail',
                help_text='Endereço de e-mail para login',
            ),
        ),
    ]
