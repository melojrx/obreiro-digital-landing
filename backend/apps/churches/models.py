"""
Churches models - Igreja principal do sistema multi-tenant
Cada igreja é um tenant independente com seus próprios dados
"""

import qrcode
import uuid
from io import BytesIO
from django.db import models
from django.conf import settings
from django.core.files import File
from django.utils import timezone
from datetime import timedelta
from apps.core.models import BaseModel, ActiveManager, TenantManager
from apps.core.models import (
    validate_cnpj, phone_validator, cep_validator,
    SubscriptionPlanChoices, SubscriptionStatusChoices
)


class Church(BaseModel):
    """
    Igreja - Unidade principal do sistema multi-tenant.
    
    Cada igreja é um tenant independente com:
    - Assinatura SaaS própria
    - Dados isolados
    - Múltiplas filiais
    - Gerenciamento de membros e visitantes
    """
    
    # Relacionamento hierárquico
    denomination = models.ForeignKey(
        'denominations.Denomination',
        on_delete=models.CASCADE,
        related_name='churches',
        verbose_name="Denominação",
        blank=True,
        null=True,
        help_text="Denominação à qual esta igreja pertence (opcional)"
    )
    
    # Dados básicos da igreja
    name = models.CharField(
        "Nome da Igreja",
        max_length=200,
        help_text="Nome completo da igreja"
    )
    
    short_name = models.CharField(
        "Nome Fantasia",
        max_length=100,
        help_text="Nome popular ou abreviado"
    )
    
    description = models.TextField(
        "Descrição",
        blank=True,
        help_text="Descrição da igreja, missão, história"
    )
    
    # Dados de contato
    email = models.EmailField(
        "E-mail principal",
        help_text="E-mail oficial da igreja"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        help_text="Telefone no formato (XX) XXXXX-XXXX"
    )
    
    website = models.URLField(
        "Website",
        blank=True,
        help_text="Site da igreja"
    )
    
    # Endereço sede
    address = models.TextField(
        "Endereço",
        help_text="Endereço completo da sede"
    )
    
    city = models.CharField(
        "Cidade",
        max_length=100
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
    
    # Dados legais
    cnpj = models.CharField(
        "CNPJ",
        max_length=18,
        blank=True,
        null=True,
        validators=[validate_cnpj],
        help_text="CNPJ da igreja (se aplicável)"
    )
    
    # Pastor responsável
    main_pastor = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pastored_churches',
        verbose_name="Pastor Principal",
        help_text="Pastor responsável pela igreja"
    )
    
    # Dados visuais
    logo = models.ImageField(
        "Logo",
        upload_to='churches/logos/',
        blank=True,
        null=True,
        help_text="Logo da igreja"
    )
    
    cover_image = models.ImageField(
        "Imagem de Capa",
        upload_to='churches/covers/',
        blank=True,
        null=True,
        help_text="Imagem para banner/capa"
    )
    
    # =====================================
    # SISTEMA DE ASSINATURA SAAS
    # =====================================
    
    subscription_plan = models.CharField(
        "Plano de Assinatura",
        max_length=20,
        choices=SubscriptionPlanChoices.choices,
        default=SubscriptionPlanChoices.BASIC,
        help_text="Plano SaaS contratado"
    )
    
    subscription_status = models.CharField(
        "Status da Assinatura",
        max_length=20,
        choices=SubscriptionStatusChoices.choices,
        default=SubscriptionStatusChoices.TRIAL,
        help_text="Status atual da assinatura"
    )
    
    subscription_start_date = models.DateTimeField(
        "Início da Assinatura",
        default=timezone.now,
        help_text="Data de início da assinatura"
    )
    
    subscription_end_date = models.DateTimeField(
        "Fim da Assinatura",
        help_text="Data de vencimento da assinatura"
    )
    
    trial_end_date = models.DateTimeField(
        "Fim do Período de Teste",
        blank=True,
        null=True,
        help_text="Data de fim do trial gratuito"
    )
    
    # Limites do plano
    max_members = models.PositiveIntegerField(
        "Limite de Membros",
        default=50,
        help_text="Máximo de membros permitidos no plano"
    )
    
    max_branches = models.PositiveIntegerField(
        "Limite de Filiais",
        default=1,
        help_text="Máximo de filiais permitidas no plano"
    )
    
    # Estatísticas
    total_members = models.PositiveIntegerField(
        "Total de Membros",
        default=0,
        help_text="Calculado automaticamente"
    )
    
    total_visitors = models.PositiveIntegerField(
        "Total de Visitantes",
        default=0,
        help_text="Calculado automaticamente"
    )
    
    # =====================================
    # SISTEMA DE QR CODE PARA IGREJA
    # =====================================
    
    qr_code_uuid = models.UUIDField(
        "UUID do QR Code",
        default=uuid.uuid4,
        editable=False,
        unique=True,
        help_text="Identificador único para o QR Code da igreja (sede)"
    )
    
    qr_code_image = models.ImageField(
        "Imagem do QR Code",
        upload_to='churches/qr_codes/',
        blank=True,
        null=True,
        help_text="QR Code gerado automaticamente para registro de visitantes na sede"
    )
    
    qr_code_active = models.BooleanField(
        "QR Code Ativo",
        default=True,
        help_text="Permitir registros via QR Code da igreja"
    )
    
    allows_visitor_registration = models.BooleanField(
        "Permite Registro de Visitantes",
        default=True,
        help_text="Permitir que visitantes se registrem via QR Code"
    )
    
    total_visitors_registered = models.PositiveIntegerField(
        "Total de Visitantes Registrados",
        default=0,
        help_text="Contador de visitantes via QR Code"
    )
    
    # Managers
    objects = TenantManager()
    
    class Meta:
        verbose_name = "Igreja"
        verbose_name_plural = "Igrejas"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['denomination']),
            models.Index(fields=['state', 'city']),
            models.Index(fields=['subscription_plan']),
            models.Index(fields=['subscription_status']),
            models.Index(fields=['subscription_end_date']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.city}/{self.state}"
    
    def save(self, *args, **kwargs):
        """Override save para configurar assinatura inicial e gerar QR Code"""
        if not self.pk:  # Novo registro
            # Configurar trial de 15 dias
            if not self.trial_end_date:
                self.trial_end_date = timezone.now() + timedelta(days=15)
            
            # Configurar limites baseados no plano
            self.set_plan_limits()
            
            # Data de fim da assinatura (30 dias após início)
            if not self.subscription_end_date:
                self.subscription_end_date = self.subscription_start_date + timedelta(days=30)
        
        # Gerar QR Code se não existe
        if not self.qr_code_image:
            self.generate_qr_code()
        
        # Formatar campos
        if self.state:
            self.state = self.state.upper()
        
        # Tratar CNPJ vazio para evitar constraint unique
        if self.cnpj == '':
            self.cnpj = None
        
        super().save(*args, **kwargs)
    
    def set_plan_limits(self):
        """Configura limites baseados no plano de assinatura"""
        limits = {
            SubscriptionPlanChoices.BASIC: {
                'max_members': 50,
                'max_branches': 1,
            },
            SubscriptionPlanChoices.PROFESSIONAL: {
                'max_members': 200,
                'max_branches': 3,
            },
            SubscriptionPlanChoices.ENTERPRISE: {
                'max_members': 1000,
                'max_branches': 10,
            },
            SubscriptionPlanChoices.DENOMINATION: {
                'max_members': 999999,  # Ilimitado
                'max_branches': 999999,  # Ilimitado
            },
        }
        
        plan_limits = limits.get(self.subscription_plan, limits[SubscriptionPlanChoices.BASIC])
        self.max_members = plan_limits['max_members']
        self.max_branches = plan_limits['max_branches']
    
    @property
    def display_name(self):
        """Nome para exibição"""
        return self.short_name if self.short_name else self.name
    
    @property
    def full_address(self):
        """Endereço completo formatado"""
        return f"{self.address}, {self.city}/{self.state} - {self.zipcode}"
    
    @property
    def is_subscription_active(self):
        """Verifica se a assinatura está ativa"""
        return self.subscription_status == SubscriptionStatusChoices.ACTIVE
    
    @property
    def is_trial_active(self):
        """Verifica se está no período de trial"""
        return (
            self.subscription_status == SubscriptionStatusChoices.TRIAL and
            self.trial_end_date and
            timezone.now() <= self.trial_end_date
        )
    
    @property
    def days_until_expiration(self):
        """Dias até a expiração da assinatura"""
        if self.subscription_end_date:
            delta = self.subscription_end_date - timezone.now()
            return max(0, delta.days)
        return 0
    
    @property
    def subscription_expired(self):
        """Verifica se a assinatura expirou"""
        return timezone.now() > self.subscription_end_date
    
    @property
    def can_add_members(self):
        """Verifica se pode adicionar mais membros"""
        return self.total_members < self.max_members
    
    @property
    def can_add_branches(self):
        """Verifica se pode adicionar mais filiais"""
        current_branches = self.branches.filter(is_active=True, is_main=False).count()
        return self.max_branches < 0 or current_branches < self.max_branches
    
    def update_statistics(self):
        """Atualiza estatísticas calculadas"""
        # Importação local para evitar circular import
        from apps.members.models import Member
        from apps.visitors.models import Visitor
        
        self.total_members = Member.objects.filter(
            church=self, is_active=True
        ).count()
        
        self.total_visitors = Visitor.objects.filter(
            church=self, is_active=True
        ).count()
        
        self.save(update_fields=['total_members', 'total_visitors', 'updated_at'])
    
    def get_plan_features(self):
        """Retorna funcionalidades do plano atual"""
        features = {
            SubscriptionPlanChoices.BASIC: [
                'Até 50 membros',
                '1 filial',
                'Relatórios básicos',
                'Suporte por email'
            ],
            SubscriptionPlanChoices.PROFESSIONAL: [
                'Até 200 membros',
                'Até 3 filiais',
                'Relatórios avançados',
                'Dashboard analytics',
                'Suporte prioritário'
            ],
            SubscriptionPlanChoices.ENTERPRISE: [
                'Até 1000 membros',
                'Até 10 filiais',
                'Relatórios personalizados',
                'API access',
                'Suporte 24/7'
            ],
            SubscriptionPlanChoices.DENOMINATION: [
                'Membros ilimitados',
                'Filiais ilimitadas',
                'Dashboard consolidado',
                'Gestão de múltiplas igrejas',
                'Suporte dedicado'
            ]
        }
        
        return features.get(self.subscription_plan, [])
    
    def check_subscription_limits(self):
        """Verifica se está respeitando os limites do plano"""
        issues = []
        
        if self.total_members > self.max_members:
            issues.append(f"Excedeu limite de membros: {self.total_members}/{self.max_members}")

        current_branches = self.branches.filter(is_active=True, is_main=False).count()
        if self.max_branches >= 0 and current_branches > self.max_branches:
            issues.append(f"Excedeu limite de filiais: {current_branches}/{self.max_branches}")
        
        return issues
    
    def generate_qr_code(self):
        """Gera QR Code para esta igreja (sede)"""
        # URL do formulário React para a igreja
        url = f"{settings.FRONTEND_URL}/visit/church/{self.qr_code_uuid}"
        
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
        filename = f"church_qr_{self.qr_code_uuid}.png"
        self.qr_code_image.save(
            filename,
            File(buffer),
            save=False
        )
    
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
    def visitor_registration_url(self):
        """Retorna URL para registro de visitantes"""
        return f"{settings.FRONTEND_URL}/visit/church/{self.qr_code_uuid}"
    
    @property
    def qr_code_url(self):
        """Retorna URL completa da imagem do QR Code"""
        if self.qr_code_image:
            request = None
            # Tentar obter request do contexto
            try:
                from django.http import HttpRequest
                from threading import local
                _thread_locals = local()
                request = getattr(_thread_locals, 'request', None)
            except:
                pass
            
            if request:
                return request.build_absolute_uri(self.qr_code_image.url)
            else:
                # Fallback para URL relativa
                return self.qr_code_image.url
        return None
