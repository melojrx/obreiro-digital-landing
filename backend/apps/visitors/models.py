"""
Visitors models - Sistema de visitantes com conversão para membros
Integrado com QR codes das filiais para registro automático
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import date, timedelta
from apps.core.models import (
    BaseModel, ActiveManager, TenantManager,
    GenderChoices
)
from apps.core.models import validate_cpf, phone_validator


class VisitorManager(TenantManager):
    """Manager especializado para visitantes"""
    
    def for_church(self, church):
        """Visitantes de uma igreja específica"""
        return self.get_queryset().filter(church=church)
    
    def active_for_church(self, church):
        """Visitantes ativos de uma igreja"""
        return self.for_church(church).filter(is_active=True)
    
    def for_branch(self, branch):
        """Visitantes de uma filial específica"""
        return self.get_queryset().filter(branch=branch)
    
    def recent_visitors(self, days=30):
        """Visitantes recentes (últimos X dias)"""
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff_date)
    
    def not_converted(self):
        """Visitantes que ainda não se tornaram membros"""
        return self.get_queryset().filter(converted_to_member=False)
    
    def converted(self):
        """Visitantes que se tornaram membros"""
        return self.get_queryset().filter(converted_to_member=True)
    
    def pending_approval(self):
        """Visitantes aguardando aprovação"""
        return self.get_queryset().filter(status='pending')


class Visitor(BaseModel):
    """
    Visitante - Pessoa que visitou a igreja via QR code.
    
    Sistema de registro de visitantes com:
    - Registro via QR code das filiais
    - Conversão para membro
    - Acompanhamento e follow-up
    - Relatórios de conversão
    """
    
    # =====================================
    # RELACIONAMENTOS (MULTI-TENANT)
    # =====================================
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='visitors',
        verbose_name="Igreja",
        help_text="Igreja que o visitante conheceu"
    )
    
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='visitors',
        verbose_name="Filial",
        help_text="Filial específica visitada"
    )
    
    # Membro convertido (se aplicável)
    converted_member = models.OneToOneField(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitor_origin',
        verbose_name="Membro Convertido",
        help_text="Membro criado a partir deste visitante"
    )
    
    # =====================================
    # DADOS PESSOAIS
    # =====================================
    
    full_name = models.CharField(
        "Nome Completo",
        max_length=200,
        help_text="Nome completo do visitante"
    )
    
    email = models.EmailField(
        "E-mail",
        help_text="E-mail do visitante"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        help_text="Telefone no formato (XX) XXXXX-XXXX"
    )
    
    # Dados opcionais
    birth_date = models.DateField(
        "Data de Nascimento",
        blank=True,
        null=True,
        help_text="Data de nascimento (opcional)"
    )
    
    gender = models.CharField(
        "Gênero",
        max_length=1,
        choices=GenderChoices.choices,
        blank=True,
        null=True,
        help_text="Gênero do visitante"
    )
    
    cpf = models.CharField(
        "CPF",
        max_length=14,
        blank=True,
        validators=[validate_cpf],
        help_text="CPF do visitante (opcional)"
    )
    
    # =====================================
    # DADOS DO REGISTRO
    # =====================================
    
    # Como chegou à igreja
    how_found_church = models.CharField(
        "Como conheceu a igreja",
        max_length=50,
        choices=[
            ('friend_invitation', 'Convite de amigo'),
            ('family_invitation', 'Convite da família'),
            ('social_media', 'Redes sociais'),
            ('google_search', 'Busca no Google'),
            ('event', 'Evento especial'),
            ('evangelism', 'Evangelismo'),
            ('passing_by', 'Passando em frente'),
            ('other', 'Outro'),
        ],
        default='other',
        help_text="Como o visitante conheceu a igreja"
    )
    
    # Interesse específico
    interest = models.CharField(
        "Interesse Principal",
        max_length=50,
        choices=[
            ('worship', 'Culto/Adoração'),
            ('bible_study', 'Estudo bíblico'),
            ('community', 'Comunidade'),
            ('help', 'Ajuda/Oração'),
            ('curiosity', 'Curiosidade'),
            ('family', 'Família/Filhos'),
            ('young', 'Jovens'),
            ('music', 'Música'),
            ('other', 'Outro'),
        ],
        default='worship',
        help_text="Principal interesse na igreja"
    )
    
    # Status do visitante
    status = models.CharField(
        "Status",
        max_length=20,
        choices=[
            ('pending', 'Pendente'),
            ('approved', 'Aprovado'),
            ('contacted', 'Contatado'),
            ('visiting', 'Visitando'),
            ('member', 'Virou membro'),
            ('inactive', 'Inativo'),
        ],
        default='approved',
        help_text="Status atual do visitante"
    )
    
    # =====================================
    # DADOS DE CONVERSÃO
    # =====================================
    
    converted_to_member = models.BooleanField(
        "Convertido para Membro",
        default=False,
        help_text="Se já se tornou membro da igreja"
    )
    
    conversion_date = models.DateTimeField(
        "Data de Conversão",
        blank=True,
        null=True,
        help_text="Data que se tornou membro"
    )
    
    conversion_notes = models.TextField(
        "Observações da Conversão",
        blank=True,
        help_text="Observações sobre o processo de conversão"
    )
    
    # =====================================
    # ACOMPANHAMENTO
    # =====================================
    
    visits_count = models.PositiveIntegerField(
        "Número de Visitas",
        default=1,
        help_text="Quantas vezes visitou a igreja"
    )
    
    last_visit_date = models.DateTimeField(
        "Última Visita",
        default=timezone.now,
        help_text="Data da última visita"
    )
    
    follow_up_needed = models.BooleanField(
        "Precisa de Follow-up",
        default=True,
        help_text="Se precisa de acompanhamento"
    )
    
    last_contact_date = models.DateTimeField(
        "Último Contato",
        blank=True,
        null=True,
        help_text="Data do último contato"
    )
    
    next_contact_date = models.DateTimeField(
        "Próximo Contato",
        blank=True,
        null=True,
        help_text="Data planejada para próximo contato"
    )
    
    # Observações gerais
    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações sobre o visitante"
    )
    
    # =====================================
    # DADOS TÉCNICOS
    # =====================================
    
    # IP de registro (para analytics)
    registration_ip = models.GenericIPAddressField(
        "IP de Registro",
        blank=True,
        null=True,
        help_text="IP usado no registro"
    )
    
    # Device info
    user_agent = models.TextField(
        "User Agent",
        blank=True,
        help_text="Informações do navegador/device"
    )
    
    # Preferências de contato
    accept_email_contact = models.BooleanField(
        "Aceita Contato por E-mail",
        default=True,
        help_text="Permite contato por e-mail"
    )
    
    accept_phone_contact = models.BooleanField(
        "Aceita Contato por Telefone",
        default=True,
        help_text="Permite contato por telefone"
    )
    
    accept_whatsapp_contact = models.BooleanField(
        "Aceita Contato por WhatsApp",
        default=True,
        help_text="Permite contato por WhatsApp"
    )
    
    # =====================================
    # MANAGERS
    # =====================================
    
    objects = TenantManager()
    
    class Meta:
        verbose_name = "Visitante"
        verbose_name_plural = "Visitantes"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['church', '-created_at']),
            models.Index(fields=['branch', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['converted_to_member']),
            models.Index(fields=['follow_up_needed']),
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['next_contact_date']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.branch.name}"
    
    def save(self, *args, **kwargs):
        """Override save para atualizações automáticas"""
        # Se foi convertido para membro, atualizar data
        if self.converted_to_member and not self.conversion_date:
            self.conversion_date = timezone.now()
        
        # Atualizar status se convertido
        if self.converted_to_member and self.status != 'member':
            self.status = 'member'
        
        super().save(*args, **kwargs)
    
    # =====================================
    # PROPRIEDADES CALCULADAS
    # =====================================
    
    @property
    def age(self):
        """Calcula idade se data de nascimento disponível"""
        if self.birth_date:
            today = date.today()
            return today.year - self.birth_date.year - (
                (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
        return None
    
    @property
    def days_since_registration(self):
        """Dias desde o primeiro registro"""
        return (timezone.now() - self.created_at).days
    
    @property
    def days_since_last_visit(self):
        """Dias desde a última visita"""
        return (timezone.now() - self.last_visit_date).days
    
    @property
    def is_recent_visitor(self):
        """Verifica se é visitante recente (últimos 30 dias)"""
        return self.days_since_registration <= 30
    
    @property
    def needs_urgent_follow_up(self):
        """Verifica se precisa de follow-up urgente"""
        if not self.follow_up_needed:
            return False
        
        # Se nunca foi contatado e tem mais de 7 dias
        if not self.last_contact_date and self.days_since_registration > 7:
            return True
        
        # Se tem próximo contato agendado e já passou
        if self.next_contact_date and timezone.now() > self.next_contact_date:
            return True
        
        return False
    
    @property
    def contact_preferences(self):
        """Lista de preferências de contato"""
        prefs = []
        if self.accept_email_contact:
            prefs.append("E-mail")
        if self.accept_phone_contact:
            prefs.append("Telefone")
        if self.accept_whatsapp_contact:
            prefs.append("WhatsApp")
        return prefs
    
    @property
    def conversion_probability(self):
        """Calcula probabilidade de conversão baseada em fatores"""
        score = 50  # Base de 50%
        
        # Fatores que aumentam a probabilidade
        if self.visits_count > 1:
            score += 20
        if self.visits_count > 3:
            score += 15
        if self.days_since_last_visit <= 7:
            score += 15
        if self.last_contact_date:
            score += 10
        if self.interest in ['worship', 'bible_study', 'community']:
            score += 10
        
        # Fatores que diminuem
        if self.days_since_last_visit > 30:
            score -= 20
        if self.days_since_last_visit > 60:
            score -= 30
        if not self.follow_up_needed:
            score -= 10
        
        return min(max(score, 0), 100)  # Entre 0 e 100
    
    # =====================================
    # MÉTODOS DE NEGÓCIO
    # =====================================
    
    def register_visit(self, notes=""):
        """Registra uma nova visita"""
        self.visits_count += 1
        self.last_visit_date = timezone.now()
        self.status = 'visiting'
        if notes:
            self.notes = f"{self.notes}\n[{timezone.now().strftime('%d/%m/%Y')}] Nova visita: {notes}".strip()
        self.save()
    
    def register_contact(self, contact_type, notes="", next_contact_in_days=7):
        """Registra um contato realizado"""
        self.last_contact_date = timezone.now()
        self.next_contact_date = timezone.now() + timedelta(days=next_contact_in_days)
        self.status = 'contacted'
        
        # Adicionar às observações
        contact_note = f"[{timezone.now().strftime('%d/%m/%Y')}] Contato via {contact_type}"
        if notes:
            contact_note += f": {notes}"
        
        if self.notes:
            self.notes = f"{self.notes}\n{contact_note}"
        else:
            self.notes = contact_note
        
        self.save()
    
    def convert_to_member(self, member_data=None, notes=""):
        """Converte visitante em membro"""
        if self.converted_to_member:
            return self.converted_member
        
        # Dados básicos do membro baseados no visitante
        if not member_data:
            member_data = {}
        
        member_defaults = {
            'church': self.church,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'birth_date': self.birth_date,
            'gender': self.gender,
            'cpf': self.cpf,
            'membership_date': date.today(),
            'accept_email': self.accept_email_contact,
            'accept_whatsapp': self.accept_whatsapp_contact,
        }
        
        # Mesclar dados fornecidos
        for key, value in member_data.items():
            member_defaults[key] = value
        
        # Criar membro
        from apps.members.models import Member
        member = Member.objects.create(**member_defaults)
        
        # Atualizar visitante
        self.converted_to_member = True
        self.converted_member = member
        self.conversion_date = timezone.now()
        self.conversion_notes = notes
        self.status = 'member'
        self.follow_up_needed = False
        self.save()
        
        # Atualizar estatísticas da filial
        self.branch.update_statistics()
        
        return member
    
    def schedule_follow_up(self, days_from_now=7, notes=""):
        """Agenda próximo follow-up"""
        self.next_contact_date = timezone.now() + timedelta(days=days_from_now)
        self.follow_up_needed = True
        
        if notes:
            note = f"[{timezone.now().strftime('%d/%m/%Y')}] Follow-up agendado para {self.next_contact_date.strftime('%d/%m/%Y')}: {notes}"
            if self.notes:
                self.notes = f"{self.notes}\n{note}"
            else:
                self.notes = note
        
        self.save()
    
    def mark_as_inactive(self, reason=""):
        """Marca visitante como inativo"""
        self.status = 'inactive'
        self.follow_up_needed = False
        
        if reason:
            note = f"[{timezone.now().strftime('%d/%m/%Y')}] Marcado como inativo: {reason}"
            if self.notes:
                self.notes = f"{self.notes}\n{note}"
            else:
                self.notes = note
        
        self.save()
    
    def get_visit_history(self):
        """Retorna histórico de visitas extraído das observações"""
        # Implementação simples - pode ser melhorada com model específico
        if not self.notes:
            return []
        
        lines = self.notes.split('\n')
        visits = []
        for line in lines:
            if 'Nova visita:' in line:
                visits.append(line.strip())
        
        return visits
    
    def get_contact_history(self):
        """Retorna histórico de contatos extraído das observações"""
        if not self.notes:
            return []
        
        lines = self.notes.split('\n')
        contacts = []
        for line in lines:
            if 'Contato via' in line:
                contacts.append(line.strip())
        
        return contacts


class VisitorFollowUp(BaseModel):
    """
    Follow-up de visitante - Acompanhamento sistemático.
    
    Permite agendar e rastrear contatos com visitantes
    para maximizar conversão para membros.
    """
    
    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.CASCADE,
        related_name='follow_ups',
        verbose_name="Visitante"
    )
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_follow_ups',
        verbose_name="Responsável",
        help_text="Usuário responsável pelo follow-up"
    )
    
    follow_up_type = models.CharField(
        "Tipo de Follow-up",
        max_length=20,
        choices=[
            ('call', 'Ligação'),
            ('whatsapp', 'WhatsApp'),
            ('email', 'E-mail'),
            ('visit', 'Visita pessoal'),
            ('invitation', 'Convite para evento'),
        ],
        help_text="Tipo de contato realizado"
    )
    
    scheduled_date = models.DateTimeField(
        "Data Agendada",
        help_text="Data/hora agendada para o follow-up"
    )
    
    completed_date = models.DateTimeField(
        "Data de Conclusão",
        blank=True,
        null=True,
        help_text="Data/hora que foi realizado"
    )
    
    status = models.CharField(
        "Status",
        max_length=20,
        choices=[
            ('scheduled', 'Agendado'),
            ('completed', 'Concluído'),
            ('cancelled', 'Cancelado'),
            ('rescheduled', 'Reagendado'),
        ],
        default='scheduled',
        help_text="Status do follow-up"
    )
    
    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações sobre o follow-up"
    )
    
    result = models.CharField(
        "Resultado",
        max_length=30,
        choices=[
            ('contact_made', 'Contato realizado'),
            ('no_answer', 'Não atendeu'),
            ('interested', 'Demonstrou interesse'),
            ('will_visit', 'Virá próximo culto'),
            ('not_interested', 'Não interessado'),
            ('wrong_number', 'Número errado'),
            ('requested_removal', 'Pediu remoção'),
        ],
        blank=True,
        help_text="Resultado do contato"
    )
    
    class Meta:
        verbose_name = "Follow-up de Visitante"
        verbose_name_plural = "Follow-ups de Visitantes"
        ordering = ['scheduled_date']
        indexes = [
            models.Index(fields=['visitor', 'scheduled_date']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['scheduled_date', 'status']),
        ]
    
    def __str__(self):
        return f"Follow-up: {self.visitor.full_name} - {self.get_follow_up_type_display()}"
    
    def mark_completed(self, result, notes=""):
        """Marca follow-up como concluído"""
        self.completed_date = timezone.now()
        self.status = 'completed'
        self.result = result
        if notes:
            self.notes = notes
        self.save()
        
        # Registrar no visitante
        self.visitor.register_contact(
            contact_type=self.get_follow_up_type_display(),
            notes=f"Resultado: {self.get_result_display()}. {notes}".strip()
        )
