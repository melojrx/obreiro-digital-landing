"""
Activities models - Sistema de atividades, ministérios e eventos
Gestão completa das atividades da igreja por filial
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta
from apps.core.models import BaseModel, ActiveManager, TenantManager


class MinistryManager(TenantManager):
    """Manager para ministérios por igreja"""
    
    def for_church(self, church):
        """Ministérios de uma igreja específica"""
        return self.get_queryset().filter(church=church)
    
    def active_for_church(self, church):
        """Ministérios ativos de uma igreja"""
        return self.for_church(church).filter(is_active=True)


class Ministry(BaseModel):
    """
    Ministério - Departamentos/grupos da igreja.
    
    Ex: Louvor, Jovens, Crianças, Mulheres, Homens, etc.
    Cada ministério pode ter múltiplas atividades.
    """
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='ministries',
        verbose_name="Igreja",
        help_text="Igreja à qual o ministério pertence"
    )
    
    name = models.CharField(
        "Nome do Ministério",
        max_length=100,
        help_text="Nome do ministério (ex: Louvor, Jovens)"
    )
    
    description = models.TextField(
        "Descrição",
        blank=True,
        help_text="Descrição e propósito do ministério"
    )
    
    # Líder responsável
    leader = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_ministries',
        verbose_name="Líder",
        help_text="Líder responsável pelo ministério"
    )
    
    # Cor para identificação visual
    color = models.CharField(
        "Cor",
        max_length=7,
        default='#3b82f6',
        help_text="Cor hexadecimal para identificação visual"
    )
    
    # Ativo
    is_public = models.BooleanField(
        "Público",
        default=True,
        help_text="Se aparece publicamente para visitantes"
    )
    
    # Estatísticas
    total_members = models.PositiveIntegerField(
        "Total de Membros",
        default=0,
        help_text="Calculado automaticamente"
    )
    
    total_activities = models.PositiveIntegerField(
        "Total de Atividades",
        default=0,
        help_text="Calculado automaticamente"
    )
    
    # Managers
    objects = models.Manager()
    active = ActiveManager()
    church_ministries = MinistryManager()
    
    class Meta:
        verbose_name = "Ministério"
        verbose_name_plural = "Ministérios"
        unique_together = [['church', 'name']]
        ordering = ['church', 'name']
        indexes = [
            models.Index(fields=['church', 'name']),
            models.Index(fields=['church', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.church.short_name}"
    
    def update_statistics(self):
        """Atualiza estatísticas do ministério"""
        self.total_members = self.members.filter(is_active=True).count()
        self.total_activities = self.activities.filter(is_active=True).count()
        self.save(update_fields=['total_members', 'total_activities', 'updated_at'])


class ActivityManager(TenantManager):
    """Manager para atividades"""
    
    def for_church(self, church):
        """Atividades de uma igreja"""
        return self.get_queryset().filter(church=church)
    
    def for_branch(self, branch):
        """Atividades de uma filial"""
        return self.get_queryset().filter(branch=branch)
    
    def upcoming(self):
        """Atividades futuras"""
        return self.get_queryset().filter(
            start_datetime__gte=timezone.now(),
            is_active=True
        )
    
    def today(self):
        """Atividades de hoje"""
        today = timezone.now().date()
        return self.get_queryset().filter(
            start_datetime__date=today,
            is_active=True
        )
    
    def this_week(self):
        """Atividades desta semana"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        return self.get_queryset().filter(
            start_datetime__date__range=[week_start, week_end],
            is_active=True
        )


class Activity(BaseModel):
    """
    Atividade - Evento/atividade específica da igreja.
    
    Pode ser: Culto, Célula, Ensaio, Evento, etc.
    Ligada a um ministério e uma filial.
    """
    
    # Relacionamentos
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name="Igreja",
        help_text="Igreja responsável"
    )
    
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name="Filial",
        help_text="Filial onde ocorre a atividade"
    )
    
    ministry = models.ForeignKey(
        Ministry,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name="Ministério",
        help_text="Ministério responsável"
    )
    
    # Dados básicos
    name = models.CharField(
        "Nome da Atividade",
        max_length=200,
        help_text="Nome da atividade (ex: Culto de Domingo)"
    )
    
    description = models.TextField(
        "Descrição",
        blank=True,
        help_text="Descrição detalhada da atividade"
    )
    
    activity_type = models.CharField(
        "Tipo de Atividade",
        max_length=30,
        choices=[
            ('worship', 'Culto'),
            ('prayer', 'Oração'),
            ('study', 'Estudo Bíblico'),
            ('cell', 'Célula'),
            ('rehearsal', 'Ensaio'),
            ('meeting', 'Reunião'),
            ('event', 'Evento'),
            ('conference', 'Conferência'),
            ('seminar', 'Seminário'),
            ('training', 'Treinamento'),
            ('outreach', 'Evangelismo'),
            ('service', 'Ação Social'),
            ('youth', 'Jovens'),
            ('children', 'Infantil'),
            ('other', 'Outro'),
        ],
        default='worship',
        help_text="Tipo da atividade"
    )
    
    # Data e hora
    start_datetime = models.DateTimeField(
        "Data/Hora de Início",
        help_text="Data e hora de início da atividade"
    )
    
    end_datetime = models.DateTimeField(
        "Data/Hora de Término",
        help_text="Data e hora de término da atividade"
    )

    # Recorrência
    is_recurring = models.BooleanField(
        "Atividade Recorrente",
        default=False,
        help_text="Se a atividade se repete"
    )
    
    recurrence_pattern = models.CharField(
        "Padrão de Recorrência",
        max_length=20,
        choices=[
            ('daily', 'Diário'),
            ('weekly', 'Semanal'),
            ('biweekly', 'Quinzenal'),
            ('monthly', 'Mensal'),
            ('custom', 'Personalizado'),
        ],
        blank=True,
        help_text="Como a atividade se repete"
    )
    
    recurrence_end_date = models.DateField(
        "Fim da Recorrência",
        blank=True,
        null=True,
        help_text="Data limite para atividade recorrente"
    )
    
    # Localização
    location = models.CharField(
        "Local",
        max_length=200,
        blank=True,
        help_text="Local específico (se diferente da filial)"
    )
    
    # Responsável
    responsible = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsible_activities',
        verbose_name="Responsável",
        help_text="Pessoa responsável pela atividade"
    )
    
    # Configurações
    max_participants = models.PositiveIntegerField(
        "Máximo de Participantes",
        blank=True,
        null=True,
        help_text="Limite de participantes (deixe vazio para ilimitado)"
    )
    
    requires_registration = models.BooleanField(
        "Requer Inscrição",
        default=False,
        help_text="Se requer inscrição prévia"
    )
    
    # Status e visibilidade
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)

    # Estatísticas
    participants_count = models.PositiveIntegerField(
        "Participantes Confirmados",
        default=0,
        help_text="Calculado automaticamente"
    )
    
    # Observações
    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações internas sobre a atividade"
    )
    
    # Managers
    objects = TenantManager()
    
    class Meta:
        verbose_name = "Atividade"
        verbose_name_plural = "Atividades"
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['church', '-start_datetime']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.start_datetime.strftime('%d/%m/%Y %H:%M')}"
    
    def clean(self):
        """Validações customizadas"""
        if self.end_datetime <= self.start_datetime:
            raise ValidationError("Data de término deve ser posterior ao início")
        
        if self.church != self.branch.church:
            raise ValidationError("Filial deve pertencer à mesma igreja")
        
        if self.ministry.church != self.church:
            raise ValidationError("Ministério deve pertencer à mesma igreja")
    
    @property
    def duration(self):
        """Duração da atividade"""
        return self.end_datetime - self.start_datetime
    
    @property
    def duration_hours(self):
        """Duração em horas"""
        return self.duration.total_seconds() / 3600
    
    @property
    def is_happening_now(self):
        """Verifica se está acontecendo agora"""
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime
    
    @property
    def is_upcoming(self):
        """Verifica se é futura"""
        return self.start_datetime > timezone.now()
    
    @property
    def is_past(self):
        """Verifica se já passou"""
        return self.end_datetime < timezone.now()
    
    @property
    def can_register(self):
        """Verifica se ainda pode se inscrever"""
        if not self.requires_registration:
            return False
        
        if self.max_participants:
            return self.participants_count < self.max_participants
        
        return self.is_upcoming
    
    def update_participants_count(self):
        """Atualiza contador de participantes"""
        self.participants_count = self.participants.filter(is_active=True).count()
        self.save(update_fields=['participants_count', 'updated_at'])


class ActivityParticipant(BaseModel):
    """
    Participante de Atividade - Inscrição em atividades.
    
    Liga membros e visitantes às atividades.
    """
    
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name="Atividade"
    )
    
    # Pode ser membro ou visitante
    member = models.ForeignKey(
        'members.Member',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activity_participations',
        verbose_name="Membro"
    )
    
    visitor = models.ForeignKey(
        'visitors.Visitor',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activity_participations',
        verbose_name="Visitante"
    )
    
    # Status da participação
    status = models.CharField(
        "Status",
        max_length=20,
        choices=[
            ('registered', 'Inscrito'),
            ('confirmed', 'Confirmado'),
            ('present', 'Presente'),
            ('absent', 'Ausente'),
            ('cancelled', 'Cancelado'),
        ],
        default='registered',
        help_text="Status da participação"
    )
    
    # Data de inscrição
    registration_date = models.DateTimeField(
        "Data de Inscrição",
        auto_now_add=True
    )
    
    # Observações
    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações sobre a participação"
    )
    
    class Meta:
        verbose_name = "Participante de Atividade"
        verbose_name_plural = "Participantes de Atividades"
        unique_together = [
            ['activity', 'member'],
            ['activity', 'visitor']
        ]
        ordering = ['-registration_date']
        indexes = [
            models.Index(fields=['activity', 'status']),
            models.Index(fields=['member']),
            models.Index(fields=['visitor']),
        ]
    
    def __str__(self):
        participant = self.member or self.visitor
        participant_name = participant.full_name if participant else "Sem nome"
        return f"{participant_name} - {self.activity.name}"
    
    def clean(self):
        """Validações"""
        if not self.member and not self.visitor:
            raise ValidationError("Deve ser especificado membro ou visitante")
        
        if self.member and self.visitor:
            raise ValidationError("Não pode ser membro e visitante ao mesmo tempo")
    
    @property
    def participant_name(self):
        """Nome do participante"""
        if self.member:
            return self.member.full_name
        elif self.visitor:
            return self.visitor.full_name
        return "Sem nome"
    
    @property
    def participant_type(self):
        """Tipo do participante"""
        if self.member:
            return "Membro"
        elif self.visitor:
            return "Visitante"
        return "Indefinido"


class ActivityResource(BaseModel):
    """
    Recurso de Atividade - Recursos necessários para atividades.
    
    Ex: Microfone, Projetor, Cadeiras, etc.
    """
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='activity_resources',
        verbose_name="Igreja"
    )
    
    name = models.CharField(
        "Nome do Recurso",
        max_length=100,
        help_text="Nome do recurso (ex: Microfone sem fio)"
    )
    
    description = models.TextField(
        "Descrição",
        blank=True,
        help_text="Descrição detalhada do recurso"
    )
    
    resource_type = models.CharField(
        "Tipo de Recurso",
        max_length=30,
        choices=[
            ('audio', 'Áudio'),
            ('video', 'Vídeo'),
            ('lighting', 'Iluminação'),
            ('furniture', 'Mobiliário'),
            ('instrument', 'Instrumento'),
            ('tech', 'Tecnologia'),
            ('decoration', 'Decoração'),
            ('other', 'Outro'),
        ],
        default='other',
        help_text="Categoria do recurso"
    )
    
    quantity_available = models.PositiveIntegerField(
        "Quantidade Disponível",
        default=1,
        help_text="Quantidade disponível para uso"
    )
    
    # Responsável pela manutenção
    responsible = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_resources',
        verbose_name="Responsável"
    )
    
    class Meta:
        verbose_name = "Recurso"
        verbose_name_plural = "Recursos"
        unique_together = [['church', 'name']]
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.quantity_available}x)"


class ActivityResourceRequest(BaseModel):
    """
    Solicitação de Recurso - Recursos solicitados para atividades.
    """
    
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='resource_requests',
        verbose_name="Atividade"
    )
    
    resource = models.ForeignKey(
        ActivityResource,
        on_delete=models.CASCADE,
        related_name='requests',
        verbose_name="Recurso"
    )
    
    quantity_requested = models.PositiveIntegerField(
        "Quantidade Solicitada",
        default=1
    )
    
    status = models.CharField(
        "Status",
        max_length=20,
        choices=[
            ('pending', 'Pendente'),
            ('approved', 'Aprovado'),
            ('denied', 'Negado'),
            ('allocated', 'Alocado'),
            ('returned', 'Devolvido'),
        ],
        default='pending'
    )
    
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Solicitado por"
    )
    
    notes = models.TextField(
        "Observações",
        blank=True
    )
    
    class Meta:
        verbose_name = "Solicitação de Recurso"
        verbose_name_plural = "Solicitações de Recursos"
        unique_together = [['activity', 'resource']]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.resource.name} para {self.activity.name}"
