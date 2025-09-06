"""
Prayers models - Sistema de Pedidos de Oração
Sistema para compartilhamento de pedidos de oração entre membros
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.core.models import BaseModel, TenantManager
from apps.churches.models import Church


class PrayerCategoryChoices(models.TextChoices):
    """Choices para categorias de pedidos de oração"""
    PERSONAL = 'personal', 'Pessoal'
    FAMILY = 'family', 'Família'  
    HEALTH = 'health', 'Saúde'
    FINANCE = 'finance', 'Finanças'
    WORK = 'work', 'Trabalho'
    STUDIES = 'studies', 'Estudos'
    MARRIAGE = 'marriage', 'Matrimonial'
    CONVERSION = 'conversion', 'Conversão'
    MISSIONS = 'missions', 'Missões'
    TRAVEL = 'travel', 'Viagem'
    CHURCH = 'church', 'Igreja'
    THANKSGIVING = 'thanksgiving', 'Ação de Graças'
    NATION = 'nation', 'Nação'
    GROWTH = 'growth', 'Crescimento'


class PrayerStatusChoices(models.TextChoices):
    """Status do pedido de oração"""
    ACTIVE = 'active', 'Ativo'
    ANSWERED = 'answered', 'Respondido'
    CLOSED = 'closed', 'Fechado'
    PRIVATE = 'private', 'Privado'


class PrayerRequestManager(TenantManager):
    """Manager especializado para pedidos de oração"""
    
    def active_requests(self):
        """Pedidos ativos"""
        return self.get_queryset().filter(
            status=PrayerStatusChoices.ACTIVE,
            is_active=True
        )
    
    def for_church(self, church):
        """Pedidos de uma igreja específica"""
        return self.get_queryset().filter(church=church)
    
    def by_category(self, category):
        """Pedidos por categoria"""
        return self.get_queryset().filter(category=category)
    
    def recent(self, days=30):
        """Pedidos dos últimos N dias"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff_date)


class PrayerRequest(BaseModel):
    """
    Modelo para pedidos de oração
    """
    
    # Dados básicos
    title = models.CharField(
        "Título",
        max_length=100,
        help_text="Título curto do pedido (ex: Saúde da minha mãe)"
    )
    
    content = models.TextField(
        "Conteúdo",
        max_length=1000,
        help_text="Descrição detalhada do pedido"
    )
    
    category = models.CharField(
        "Categoria",
        max_length=20,
        choices=PrayerCategoryChoices.choices,
        default=PrayerCategoryChoices.PERSONAL
    )
    
    status = models.CharField(
        "Status",
        max_length=20,
        choices=PrayerStatusChoices.choices,
        default=PrayerStatusChoices.ACTIVE
    )
    
    # Relacionamentos
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prayer_requests',
        verbose_name="Autor"
    )
    
    church = models.ForeignKey(
        Church,
        on_delete=models.CASCADE,
        related_name='prayer_requests',
        verbose_name="Igreja",
        help_text="Igreja do autor do pedido"
    )
    
    # Configurações de privacidade
    is_anonymous = models.BooleanField(
        "Pedido Anônimo",
        default=False,
        help_text="Se verdadeiro, o nome do autor não será exibido"
    )
    
    allow_visit = models.BooleanField(
        "Permitir Visita",
        default=False,
        help_text="Permitir que membros ofereçam visitas"
    )
    
    allow_contact = models.BooleanField(
        "Permitir Contato",
        default=False,
        help_text="Permitir que membros entrem em contato"
    )
    
    publish_on_wall = models.BooleanField(
        "Publicar no Mural",
        default=True,
        help_text="Publicar no mural da igreja"
    )
    
    # Campos para upload de imagem (futuro)
    image = models.ImageField(
        "Imagem",
        upload_to='prayer_requests/%Y/%m/',
        blank=True,
        null=True,
        help_text="Imagem opcional para o pedido"
    )
    
    # Data de resposta/fechamento
    answered_at = models.DateTimeField(
        "Data da Resposta",
        blank=True,
        null=True,
        help_text="Data em que o pedido foi marcado como respondido"
    )
    
    answer_testimony = models.TextField(
        "Testemunho de Resposta",
        blank=True,
        help_text="Testemunho de como a oração foi respondida"
    )
    
    objects = PrayerRequestManager()
    
    class Meta:
        verbose_name = "Pedido de Oração"
        verbose_name_plural = "Pedidos de Oração"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['church', '-created_at']),
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        if self.is_anonymous:
            return f"[Anônimo] {self.title}"
        return f"{self.author.get_full_name()}: {self.title}"
    
    @property 
    def prayer_count(self):
        """Conta quantas pessoas oraram por este pedido"""
        return self.prayer_responses.filter(is_praying=True).count()
    
    @property
    def message_count(self):
        """Conta quantas mensagens de apoio foram enviadas"""
        return self.prayer_messages.count()
    
    def mark_as_answered(self, testimony=""):
        """Marca o pedido como respondido"""
        self.status = PrayerStatusChoices.ANSWERED
        self.answered_at = timezone.now()
        if testimony:
            self.answer_testimony = testimony
        self.save()
    
    def clean(self):
        """Validações customizadas"""
        super().clean()
        
        # Se é anônimo, não pode permitir visitas ou contatos
        if self.is_anonymous and (self.allow_visit or self.allow_contact):
            raise ValidationError(
                "Pedidos anônimos não podem permitir visitas ou contatos."
            )


class PrayerResponse(BaseModel):
    """
    Modelo para respostas aos pedidos (curtir/orar)
    """
    
    prayer_request = models.ForeignKey(
        PrayerRequest,
        on_delete=models.CASCADE,
        related_name='prayer_responses',
        verbose_name="Pedido de Oração"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prayer_responses',
        verbose_name="Usuário"
    )
    
    is_praying = models.BooleanField(
        "Está Orando",
        default=True,
        help_text="Se o usuário está orando por este pedido"
    )
    
    class Meta:
        verbose_name = "Resposta de Oração"
        verbose_name_plural = "Respostas de Oração"
        unique_together = ['prayer_request', 'user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['prayer_request', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        action = "orando por" if self.is_praying else "curtiu"
        return f"{self.user.get_full_name()} {action} {self.prayer_request.title}"


class PrayerMessage(BaseModel):
    """
    Modelo para mensagens de apoio aos pedidos
    """
    
    prayer_request = models.ForeignKey(
        PrayerRequest,
        on_delete=models.CASCADE,
        related_name='prayer_messages',
        verbose_name="Pedido de Oração"
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prayer_messages',
        verbose_name="Autor"
    )
    
    content = models.TextField(
        "Mensagem",
        max_length=500,
        help_text="Mensagem de apoio e encorajamento"
    )
    
    is_anonymous = models.BooleanField(
        "Mensagem Anônima",
        default=False,
        help_text="Se verdadeiro, o nome do autor não será exibido"
    )
    
    class Meta:
        verbose_name = "Mensagem de Apoio"
        verbose_name_plural = "Mensagens de Apoio"
        ordering = ['created_at']  # Mensagens em ordem cronológica
        indexes = [
            models.Index(fields=['prayer_request', 'created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        if self.is_anonymous:
            return f"[Anônimo] respondeu a {self.prayer_request.title}"
        return f"{self.author.get_full_name()} respondeu a {self.prayer_request.title}"
