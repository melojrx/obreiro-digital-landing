from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import ChurchUser
from apps.branches.models import Branch


class Command(BaseCommand):
    help = "Preenche ChurchUser.active_branch para usuários existentes usando a filial matriz (is_main) da igreja, quando aplicável."

    def handle(self, *args, **options):
        updated = 0
        total = 0

        self.stdout.write(self.style.NOTICE("Iniciando backfill de active_branch..."))

        with transaction.atomic():
            # Seleciona ChurchUsers ativos sem active_branch definido
            church_users = ChurchUser.objects.select_related('church', 'active_branch').filter(
                is_active=True,
                active_branch__isnull=True,
                church__isnull=False,
            )

            total = church_users.count()

            for cu in church_users:
                try:
                    # Tenta encontrar a matriz da igreja
                    main_branch = Branch.objects.filter(
                        church=cu.church,
                        is_main=True,
                        is_active=True,
                    ).first()

                    if main_branch:
                        cu.active_branch = main_branch
                        cu.save(update_fields=['active_branch'])
                        updated += 1
                except Exception as e:
                    self.stderr.write(self.style.WARNING(f"Falha ao atualizar ChurchUser {cu.id}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Backfill concluído. Atualizados: {updated}/{total}"))
