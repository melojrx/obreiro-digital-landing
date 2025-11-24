from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0026_add_branch_transfer_log_and_first_membership_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='FamilyRelationship',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='UUID')),
                ('is_active', models.BooleanField(default=True, verbose_name='Ativo')),
                ('relation_type', models.CharField(choices=[('child', 'Filho(a)'), ('parent', 'Pai/Mãe')], max_length=10, verbose_name='Tipo de Relação')),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='family_links', to='members.member', verbose_name='Membro')),
                ('related_member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='related_family_links', to='members.member', verbose_name='Membro Relacionado')),
            ],
            options={
                'verbose_name': 'Relacionamento Familiar',
                'verbose_name_plural': 'Relacionamentos Familiares',
            },
        ),
        migrations.AddConstraint(
            model_name='familyrelationship',
            constraint=models.UniqueConstraint(fields=('member', 'related_member', 'relation_type'), name='unique_family_relationship'),
        ),
        migrations.AddConstraint(
            model_name='familyrelationship',
            constraint=models.CheckConstraint(
                check=~models.Q(member=models.F('related_member')),
                name='family_relationship_not_self'
            ),
        ),
        migrations.AddIndex(
            model_name='familyrelationship',
            index=models.Index(fields=['member', 'relation_type'], name='members_fam_member__7671b5_idx'),
        ),
        migrations.AddIndex(
            model_name='familyrelationship',
            index=models.Index(fields=['related_member', 'relation_type'], name='members_fam_related__1b8d2d_idx'),
        ),
    ]
