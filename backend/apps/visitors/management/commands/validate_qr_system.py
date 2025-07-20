"""
Comando para validar todo o sistema de QR codes
Verifica se URLs estão corretas, endpoints funcionando, etc.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from apps.branches.models import Branch
import requests
from urllib.parse import urlparse


class Command(BaseCommand):
    help = 'Valida todo o sistema de QR codes e URLs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-api',
            action='store_true',
            help='Testa também os endpoints da API (requer rede)',
        )
        parser.add_argument(
            '--fix-urls',
            action='store_true', 
            help='Corrige URLs que estão incorretas',
        )

    def handle(self, *args, **options):
        self.stdout.write("🔍 Validando sistema de QR codes...")
        
        # Configuração atual
        frontend_url = settings.FRONTEND_URL
        self.stdout.write(f"📍 FRONTEND_URL configurado: {frontend_url}")
        
        # Buscar todas as filiais ativas
        branches = Branch.objects.filter(is_active=True).select_related('church')
        total_branches = branches.count()
        
        if total_branches == 0:
            self.stdout.write(self.style.WARNING("⚠️ Nenhuma filial ativa encontrada"))
            return
        
        self.stdout.write(f"📊 {total_branches} filial(is) encontrada(s)")
        
        # Contadores
        valid_count = 0
        invalid_count = 0
        fixed_count = 0
        
        # Validar cada filial
        for branch in branches:
            try:
                # Verificar URL gerada pela property
                expected_url = f"{frontend_url}/visit/{branch.qr_code_uuid}"
                actual_url = branch.visitor_registration_url
                
                if actual_url == expected_url:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ {branch.church.short_name} - {branch.name}: URL correta"
                        )
                    )
                    valid_count += 1
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f"❌ {branch.church.short_name} - {branch.name}: URL incorreta"
                        )
                    )
                    self.stdout.write(f"   Esperado: {expected_url}")
                    self.stdout.write(f"   Atual: {actual_url}")
                    invalid_count += 1
                    
                    # Corrigir se solicitado
                    if options['fix_urls']:
                        branch.generate_qr_code()
                        branch.save()
                        self.stdout.write(
                            self.style.SUCCESS(f"🔧 QR code regenerado para {branch.name}")
                        )
                        fixed_count += 1
                
                # Testar API se solicitado
                if options['test_api']:
                    self._test_api_endpoints(branch, frontend_url)
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"❌ Erro ao validar {branch.church.short_name} - {branch.name}: {e}"
                    )
                )
                invalid_count += 1
        
        # Resumo final
        self.stdout.write("\n" + "="*50)
        self.stdout.write("📊 RESUMO DA VALIDAÇÃO")
        self.stdout.write(f"✅ URLs válidas: {valid_count}")
        self.stdout.write(f"❌ URLs inválidas: {invalid_count}")
        if options['fix_urls']:
            self.stdout.write(f"🔧 URLs corrigidas: {fixed_count}")
        self.stdout.write(f"📱 FRONTEND_URL: {frontend_url}")
        
        # Validar configuração geral
        self._validate_general_config()
        
        if invalid_count == 0:
            self.stdout.write(self.style.SUCCESS("🎉 Todos os QR codes estão válidos!"))
        else:
            if options['fix_urls']:
                self.stdout.write(self.style.SUCCESS("🔧 Problemas corrigidos automaticamente"))
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠️ {invalid_count} problema(s) encontrado(s). Use --fix-urls para corrigir"
                    )
                )

    def _test_api_endpoints(self, branch, frontend_url):
        """Testa os endpoints da API para uma filial"""
        try:
            # Determinar base URL da API
            parsed_frontend = urlparse(frontend_url)
            if parsed_frontend.hostname in ['localhost', '127.0.0.1']:
                api_base = 'http://localhost:8000'
            else:
                api_base = f"{parsed_frontend.scheme}://{parsed_frontend.netloc}"
            
            # Testar endpoint de validação
            validate_url = f"{api_base}/api/v1/visitors/public/qr/{branch.qr_code_uuid}/validate/"
            
            try:
                response = requests.get(validate_url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('valid'):
                        self.stdout.write(f"   🌐 API validação: ✅ OK")
                    else:
                        self.stdout.write(f"   🌐 API validação: ❌ QR code inválido")
                else:
                    self.stdout.write(f"   🌐 API validação: ❌ Status {response.status_code}")
            except requests.RequestException as e:
                self.stdout.write(f"   🌐 API validação: ⚠️ Erro de rede ({e})")
                
        except Exception as e:
            self.stdout.write(f"   🌐 API teste: ❌ Erro ({e})")

    def _validate_general_config(self):
        """Valida configurações gerais do sistema"""
        self.stdout.write("\n🔧 Validando configuração geral...")
        
        # Verificar FRONTEND_URL
        frontend_url = settings.FRONTEND_URL
        parsed = urlparse(frontend_url)
        
        if not parsed.scheme:
            self.stdout.write(self.style.ERROR("❌ FRONTEND_URL deve ter esquema (http/https)"))
        elif not parsed.netloc:
            self.stdout.write(self.style.ERROR("❌ FRONTEND_URL deve ter domínio válido"))
        else:
            self.stdout.write(self.style.SUCCESS(f"✅ FRONTEND_URL válida: {frontend_url}"))
        
        # Verificar DEBUG
        if settings.DEBUG:
            self.stdout.write(self.style.WARNING("⚠️ DEBUG=True (desenvolvimento)"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ DEBUG=False (produção)"))
        
        # Verificar ALLOWED_HOSTS
        allowed_hosts = settings.ALLOWED_HOSTS
        if '*' in allowed_hosts:
            self.stdout.write(self.style.WARNING("⚠️ ALLOWED_HOSTS permite qualquer host (*)"))
        elif len(allowed_hosts) > 0:
            self.stdout.write(self.style.SUCCESS(f"✅ ALLOWED_HOSTS configurado: {allowed_hosts}"))
        else:
            self.stdout.write(self.style.ERROR("❌ ALLOWED_HOSTS não configurado"))
        
        # Verificar se app visitors está nas INSTALLED_APPS
        if 'apps.visitors' in settings.INSTALLED_APPS:
            self.stdout.write(self.style.SUCCESS("✅ App visitors está instalado"))
        else:
            self.stdout.write(self.style.ERROR("❌ App visitors não encontrado em INSTALLED_APPS"))