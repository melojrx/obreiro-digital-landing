"""
Branches models - Filiais das igrejas com sistema de QR codes
Cada filial tem QR code único para registro de visitantes
"""

import qrcode
import uuid
from io import BytesIO
from django.db import models
from django.conf import settings
from django.core.files import File
from django.urls import reverse
from apps.core.models import BaseModel, ActiveManager, TenantManager
from apps.core.models import phone_validator, cep_validator


class BranchManager(TenantManager):
    """Manager customizado para filiais com filtros por igreja"""
    
    def for_church(self, church):
        """Retorna filiais de uma igreja específica"""
        return self.get_queryset().filter(church=church)
    
    def active_for_church(self, church):
        """Retorna apenas filiais ativas de uma igreja"""
        return self.for_church(church).filter(is_active=True)


class Branch(BaseModel):
    """
    Filial - Unidades da igreja com localização específica.
    
    Funcionalidades:
    - Cada filial tem QR code único
    - Visitantes escaneiam QR para se registrar
    - Geolocalização para cultos presenciais
    - Gestão independente de atividades
    """
    
    # Relacionamento com igreja (multi-tenant)
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='branches',
        verbose_name="Igreja",
        help_text="Igreja à qual esta filial pertence"
    )
    
    # Dados básicos
    name = models.CharField(
        "Nome da Filial",
        max_length=200,
        help_text="Nome da filial ou congregação"
    )
    
    short_name = models.CharField(
        "Nome Abreviado",
        max_length=50,
        help_text="Nome curto para exibição"
    )
    
    description = models.TextField(
        "Descrição",
        blank=True,
        help_text="Descrição da filial, histórico, ministérios"
    )
    
    # Contato
    email = models.EmailField(
        "E-mail",
        blank=True,
        help_text="E-mail específico da filial"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        blank=True,
        help_text="Telefone da filial no formato (XX) XXXXX-XXXX"
    )
    
    # Endereço completo
    address = models.TextField(
        "Endereço",
        help_text="Endereço completo da filial"
    )
    
    neighborhood = models.CharField(
        "Bairro",
        max_length=100,
        help_text="Bairro da filial"
    )
    
    city = models.CharField(
        "Cidade",
        max_length=100,
        help_text="Cidade da filial"
    )
    
    state = models.CharField(
        "Estado",
        max_length=2,
        help_text="Sigla do estado (ex: SP, RJ, MG)"
    )
    
    zipcode = models.CharField(
        "CEP",
        max_length=10,
        validators=[cep_validator],
        help_text="CEP no formato XXXXX-XXX"
    )
    
    # Geolocalização
    latitude = models.DecimalField(
        "Latitude",
        max_digits=10,
        decimal_places=8,
        blank=True,
        null=True,
        help_text="Coordenada de latitude para localização"
    )
    
    longitude = models.DecimalField(
        "Longitude",
        max_digits=11,
        decimal_places=8,
        blank=True,
        null=True,
        help_text="Coordenada de longitude para localização"
    )
    
    # Responsável pela filial
    pastor = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branches',
        verbose_name="Pastor Responsável",
        help_text="Pastor ou líder responsável pela filial"
    )
    
    # =====================================
    # SISTEMA DE QR CODE
    # =====================================
    
    qr_code_uuid = models.UUIDField(
        "UUID do QR Code",
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text="Identificador único para o QR code"
    )
    
    qr_code_image = models.ImageField(
        "Imagem do QR Code",
        upload_to='branches/qr_codes/',
        blank=True,
        null=True,
        help_text="Imagem do QR code gerada automaticamente"
    )
    
    qr_code_active = models.BooleanField(
        "QR Code Ativo",
        default=True,
        help_text="Se o QR code está ativo para registro de visitantes"
    )
    
    
    # Configurações da filial
    allows_visitor_registration = models.BooleanField(
        "Permite Registro de Visitantes",
        default=True,
        help_text="Se permite registro via QR code"
    )
    
    requires_visitor_approval = models.BooleanField(
        "Requer Aprovação de Visitantes",
        default=False,
        help_text="Se visitantes precisam de aprovação antes de aparecer no sistema"
    )
    
    # Estatísticas
    total_visitors_registered = models.PositiveIntegerField(
        "Total de Visitantes Registrados",
        default=0,
        help_text="Contador de visitantes registrados via QR code"
    )
    
    total_visitors = models.PositiveIntegerField(
        "Total de Visitantes",
        default=0,
        help_text="Total de visitantes registrados nesta filial"
    )
    
    total_activities = models.PositiveIntegerField(
        "Total de Atividades",
        default=0,
        help_text="Total de atividades realizadas nesta filial"
    )
    
    # Managers
    objects = TenantManager()
    
    class Meta:
        verbose_name = "Filial"
        verbose_name_plural = "Filiais"
        ordering = ['church', 'name']
        unique_together = [['church', 'name']]  # Nome único por igreja
        indexes = [
            models.Index(fields=['church', 'name']),
            models.Index(fields=['church', 'is_active']),
            models.Index(fields=['qr_code_uuid']),
            models.Index(fields=['state', 'city']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.church.short_name}"
    
    def save(self, *args, **kwargs):
        """Override save para gerar QR code automaticamente"""
        if not self.pk or not self.qr_code_image:
            # Gerar novo QR code se não existe
            self.generate_qr_code()
        
        # Formatar campos
        if self.state:
            self.state = self.state.upper()
        
        super().save(*args, **kwargs)
    
    def generate_qr_code(self):
        """Gera QR Code para esta filial"""
        from django.conf import settings
        
        # URL do formulário React
        url = f"{settings.FRONTEND_URL}/visit/{self.qr_code_uuid}"
        
        # Configurações do QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Adicionar dados e otimizar
        qr.add_data(url)
        qr.make(fit=True)
        
        # Criar imagem
        img = qr.make_image(
            fill_color="black",
            back_color="white"
        )
        
        # Converter para bytes
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Salvar no campo ImageField
        filename = f"qr_code_{self.qr_code_uuid}.png"
        self.qr_code_image.save(
            filename,
            File(buffer),
            save=False
        )
        
        # URL de registro é gerada automaticamente via property
    
    def get_visitor_registration_url(self):
        """Retorna URL para registro de visitantes"""
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/visit/{self.qr_code_uuid}"
    
    def regenerate_qr_code(self):
        """Regenera QR code (para caso de comprometimento de segurança)"""
        # Deletar imagem antiga se existe
        if self.qr_code_image:
            self.qr_code_image.delete(save=False)
        
        # Gerar novo UUID
        self.qr_code_uuid = uuid.uuid4()
        
        # Gerar nova imagem
        self.generate_qr_code()
        self.save()
    
    @property
    def display_name(self):
        """Nome para exibição"""
        return self.short_name if self.short_name else self.name
    
    @property
    def full_address(self):
        """Endereço completo formatado"""
        parts = [self.address]
        if self.neighborhood:
            parts.append(f"Bairro {self.neighborhood}")
        parts.append(f"{self.city}/{self.state}")
        parts.append(self.zipcode)
        return ", ".join(parts)
    
    @property
    def visitor_registration_url(self):
        """URL para registro de visitantes via QR code"""
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/visit/{self.qr_code_uuid}"
    
    @property
    def coordinates(self):
        """Retorna coordenadas se disponíveis"""
        if self.latitude and self.longitude:
            return {
                'latitude': float(self.latitude),
                'longitude': float(self.longitude)
            }
        return None
    
    def update_statistics(self):
        """Atualiza estatísticas da filial"""
        # Importação local para evitar circular import
        from apps.visitors.models import Visitor
        from apps.activities.models import Activity
        
        self.total_visitors = Visitor.objects.filter(
            branch=self, is_active=True
        ).count()
        
        self.total_activities = Activity.objects.filter(
            branch=self, is_active=True
        ).count()
        
        self.save(update_fields=['total_visitors', 'total_activities', 'updated_at'])
    
    def get_recent_visitors(self, days=30):
        """Retorna visitantes recentes (últimos X dias)"""
        from datetime import timedelta
        from django.utils import timezone
        from apps.visitors.models import Visitor
        
        cutoff_date = timezone.now() - timedelta(days=days)
        return Visitor.objects.filter(
            branch=self,
            created_at__gte=cutoff_date,
            is_active=True
        ).order_by('-created_at')
    
    def get_visitor_stats(self):
        """Estatísticas de visitantes para dashboard"""
        from datetime import timedelta
        from django.utils import timezone
        from django.db.models import Count
        from apps.visitors.models import Visitor
        
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        visitors_qs = Visitor.objects.filter(branch=self, is_active=True)
        
        return {
            'total': visitors_qs.count(),
            'last_30_days': visitors_qs.filter(created_at__gte=last_30_days).count(),
            'last_7_days': visitors_qs.filter(created_at__gte=last_7_days).count(),
            'converted_to_members': visitors_qs.filter(converted_to_member=True).count(),
            'conversion_rate': self._calculate_conversion_rate(),
        }
    
    def _calculate_conversion_rate(self):
        """Calcula taxa de conversão de visitantes para membros"""
        from apps.visitors.models import Visitor
        
        total_visitors = Visitor.objects.filter(branch=self, is_active=True).count()
        converted = Visitor.objects.filter(
            branch=self, 
            is_active=True, 
            converted_to_member=True
        ).count()
        
        if total_visitors > 0:
            return round((converted / total_visitors) * 100, 2)
        return 0.0
