"""
Comando para regenerar QR codes de todas as filiais
Útil após alterações no FRONTEND_URL ou problemas com QR codes
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from apps.branches.models import Branch


class Command(BaseCommand):
    help = 'Regenera QR codes de todas as filiais com o FRONTEND_URL atual'

    def add_arguments(self, parser):
        parser.add_argument(
            '--church-id',
            type=int,
            help='ID da igreja específica (opcional)',
        )
        parser.add_argument(
            '--branch-id',
            type=int,
            help='ID da filial específica (opcional)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força regeneração mesmo se QR code já existe',
        )

    def handle(self, *args, **options):
        self.stdout.write(f"🔧 Regenerando QR codes com FRONTEND_URL: {settings.FRONTEND_URL}")
        
        # Filtrar filiais
        queryset = Branch.objects.filter(is_active=True)
        
        if options['church_id']:
            queryset = queryset.filter(church_id=options['church_id'])
            self.stdout.write(f"📍 Filtrando por igreja ID: {options['church_id']}")
            
        if options['branch_id']:
            queryset = queryset.filter(id=options['branch_id'])
            self.stdout.write(f"📍 Filtrando por filial ID: {options['branch_id']}")
        
        branches = queryset.select_related('church')
        total = branches.count()
        
        if total == 0:
            self.stdout.write(self.style.WARNING("⚠️ Nenhuma filial encontrada"))
            return
        
        self.stdout.write(f"📊 {total} filial(is) encontrada(s)")
        
        success_count = 0
        error_count = 0
        
        for branch in branches:
            try:
                # Verificar se precisa regenerar
                if not options['force'] and branch.qr_code_image and branch.visitor_registration_url:
                    # Verificar se a URL está correta
                    expected_url = f"{settings.FRONTEND_URL}/visit/{branch.qr_code_uuid}"
                    if branch.visitor_registration_url == expected_url:
                        self.stdout.write(f"✅ {branch.name} - QR code já atualizado")
                        success_count += 1
                        continue
                
                # Regenerar QR code
                branch.generate_qr_code()
                branch.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ {branch.church.short_name} - {branch.name}: QR code regenerado"
                    )
                )
                self.stdout.write(f"   URL: {branch.get_visitor_registration_url()}")
                
                success_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"❌ {branch.church.short_name} - {branch.name}: Erro - {e}"
                    )
                )
                error_count += 1
        
        # Resumo final
        self.stdout.write("\n" + "="*50)
        self.stdout.write(f"📊 RESUMO DA REGENERAÇÃO")
        self.stdout.write(f"✅ Sucesso: {success_count}")
        self.stdout.write(f"❌ Erros: {error_count}")
        self.stdout.write(f"📱 FRONTEND_URL utilizada: {settings.FRONTEND_URL}")
        
        if error_count == 0:
            self.stdout.write(self.style.SUCCESS("🎉 Todos os QR codes foram regenerados com sucesso!"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️ {error_count} erro(s) encontrado(s)"))