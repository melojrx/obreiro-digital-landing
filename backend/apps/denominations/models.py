"""
Denominations models - Organizações guarda-chuva para múltiplas igrejas
Ex: Assembleia de Deus, Igreja Batista, Universal, etc.
"""

from django.db import models
from django.conf import settings
from apps.core.models import BaseModel, ActiveManager
from django.utils import timezone
from apps.core.models import SubscriptionPlanChoices, SubscriptionStatusChoices
from apps.core.models import validate_cnpj, phone_validator, cep_validator
from apps.accounts.models import LEGACY_DENOMINATION_ROLE


class Denomination(BaseModel):
    """
    Denominação - Organização guarda-chuva para múltiplas igrejas.
    
    Permite que um administrador gerencie múltiplas igrejas sob uma 
    denominação (ex: Assembleia de Deus Regional São Paulo).
    
    Funcionalidades:
    - Um usuário cria e administra a denominação
    - Pode adicionar múltiplas igrejas
    - Dashboard consolidado de todas as igrejas
    - Controle de permissões hierárquico
    """
    
    # Dados básicos
    name = models.CharField(
        "Nome da Denominação",
        max_length=200,
        help_text="Ex: Assembleia de Deus Regional São Paulo"
    )
    
    short_name = models.CharField(
        "Nome Curto",
        max_length=50,
        help_text="Ex: AD São Paulo"
    )
    
    description = models.TextField(
        "Descrição",
        blank=True,
        help_text="Descrição da denominação, história, missão"
    )
    
    # Administrador principal
    administrator = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='administered_denominations',
        verbose_name="Administrador Principal",
        help_text="Usuário que criou e administra esta denominação. Dono da Conta."
    )
    
    # Dados de contato da sede
    email = models.EmailField(
        "E-mail principal",
        help_text="E-mail oficial da denominação"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        help_text="Telefone da sede no formato (XX) XXXXX-XXXX"
    )
    
    website = models.URLField(
        "Website",
        blank=True,
        help_text="Site oficial da denominação"
    )
    
    # Endereço da sede
    headquarters_address = models.TextField(
        "Endereço da Sede",
        help_text="Endereço completo da sede da denominação"
    )
    
    headquarters_city = models.CharField(
        "Cidade da Sede",
        max_length=100
    )
    
    headquarters_state = models.CharField(
        "Estado da Sede",
        max_length=2,
        help_text="Sigla do estado (ex: SP, RJ, MG)"
    )
    
    headquarters_zipcode = models.CharField(
        "CEP da Sede",
        max_length=10,
        validators=[cep_validator],
        help_text="CEP no formato XXXXX-XXX"
    )
    
    # Dados legais (opcional)
    cnpj = models.CharField(
        "CNPJ",
        max_length=18,
        unique=True,
        blank=True,
        null=True,
        validators=[validate_cnpj],
        help_text="CNPJ da denominação (se aplicável)"
    )
    
    # Configurações
    logo = models.ImageField(
        "Logo",
        upload_to='denominations/logos/',
        blank=True,
        null=True,
        help_text="Logo oficial da denominação"
    )
    
    # Estatísticas calculadas
    total_churches = models.PositiveIntegerField(
        "Total de Igrejas",
        default=0,
        help_text="Calculado automaticamente"
    )
    
    total_members = models.PositiveIntegerField(
        "Total de Membros",
        default=0,
        help_text="Calculado automaticamente"
    )

    # =====================================
    # ASSINATURA / LIMITES / VISITANTES (NOVOS)
    # =====================================
    subscription_plan = models.CharField(
        "Plano de Assinatura",
        max_length=20,
        choices=SubscriptionPlanChoices.choices,
        default=SubscriptionPlanChoices.BASIC,
        help_text="Plano SaaS contratado para a denominação"
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
        null=True,
        blank=True,
        help_text="Data de término da assinatura"
    )

    trial_end_date = models.DateTimeField(
        "Fim do Período de Teste",
        null=True,
        blank=True,
        help_text="Data de fim do trial, quando em período de teste"
    )

    # Limites (0 = ilimitado)
    max_members = models.PositiveIntegerField(
        "Limite de Membros",
        default=0,
        help_text="Máximo de membros agregados. 0 = ilimitado"
    )

    max_churches = models.PositiveIntegerField(
        "Limite de Igrejas",
        default=1,
        help_text="Máximo de igrejas permitidas. 0 = ilimitado"
    )

    max_branches = models.PositiveIntegerField(
        "Limite de Filiais",
        default=0,
        help_text="Máximo de filiais por denominação (agregado). 0 = ilimitado"
    )

    # Visitantes (agregados)
    total_visitors = models.PositiveIntegerField(
        "Total de Visitantes",
        default=0,
        help_text="Total agregado de visitantes em todas as igrejas"
    )

    allows_visitor_registration = models.BooleanField(
        "Permite Registro de Visitantes",
        default=True,
        help_text="Default da denominação para permitir registro de visitantes"
    )

    total_visitors_registered = models.PositiveIntegerField(
        "Total de Visitantes Registrados",
        default=0,
        help_text="Total agregado de registros via QR code"
    )
    
    # Managers
    objects = models.Manager()
    active = ActiveManager()
    
    class Meta:
        verbose_name = "Denominação"
        verbose_name_plural = "Denominações"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['administrator']),
            models.Index(fields=['headquarters_state']),
            models.Index(fields=['subscription_status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.headquarters_city}/{self.headquarters_state})"
    
    def save(self, *args, **kwargs):
        """Override save para garantir consistência dos dados"""
        # Formatar campos antes de salvar
        if self.headquarters_state:
            self.headquarters_state = self.headquarters_state.upper()
        
        super().save(*args, **kwargs)
    
    @property
    def display_name(self):
        """Nome para exibição em interfaces"""
        return self.short_name if self.short_name else self.name
    
    @property
    def churches_count(self):
        """Número atual de igrejas ativas"""
        return self.churches.filter(is_active=True).count()
    
    @property
    def total_members_count(self):
        """Total de membros em todas as igrejas"""
        from apps.members.models import Member
        church_ids = self.churches.filter(is_active=True).values_list('id', flat=True)
        return Member.objects.filter(church_id__in=church_ids, is_active=True).count()
    
    def update_statistics(self):
        """Atualiza as estatísticas calculadas para a denominação.

        - total_churches: igrejas ativas
        - total_members: membros ativos (via Member)
        - total_visitors: soma de `Church.total_visitors`
        - total_visitors_registered: soma de `Church.total_visitors_registered`
        """
        from apps.churches.models import Church  # import local para evitar circular import
        from django.db.models import Sum

        self.total_churches = self.churches_count
        self.total_members = self.total_members_count

        church_qs = Church.objects.filter(denomination=self, is_active=True)
        agg = church_qs.aggregate(
            total_visitors_sum=Sum('total_visitors'),
            total_visitors_registered_sum=Sum('total_visitors_registered'),
        )
        self.total_visitors = int(agg.get('total_visitors_sum') or 0)
        self.total_visitors_registered = int(agg.get('total_visitors_registered_sum') or 0)

        self.save(update_fields=[
            'total_churches',
            'total_members',
            'total_visitors',
            'total_visitors_registered',
            'updated_at'
        ])
    
    def can_user_manage(self, user):
        """Verifica se um usuário pode gerenciar esta denominação"""
        return (
            user == self.administrator or
            user.is_superuser or
            user.church_users.filter(
                church__denomination=self,
                role__in=[LEGACY_DENOMINATION_ROLE, 'church_admin']
            ).exists()
        )
    
    def get_admin_dashboard_data(self):
        """Dados para dashboard do administrador da denominação"""
        churches = self.churches.filter(is_active=True)
        
        return {
            'total_churches': churches.count(),
            'total_members': self.total_members_count,
            'churches_by_state': churches.values('state').annotate(
                count=models.Count('id')
            ).order_by('-count'),
            'recent_churches': churches.order_by('-created_at')[:5],
        }
