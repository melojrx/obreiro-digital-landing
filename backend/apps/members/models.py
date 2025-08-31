"""
Members models - Gestão de membros da igreja
Sistema completo de membresia com dados eclesiásticos
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import date, timedelta
from apps.core.models import (
    BaseModel, ActiveManager, TenantManager,
    GenderChoices, MembershipStatusChoices
)
from apps.core.models import validate_cpf, phone_validator, cep_validator


class MemberManager(TenantManager):
    """Manager especializado para membros"""
    
    def active_members(self):
        """Membros ativos"""
        return self.get_queryset().filter(
            is_active=True,
            membership_status=MembershipStatusChoices.ACTIVE
        )
    
    def for_church(self, church):
        """Membros de uma igreja específica"""
        return self.get_queryset().filter(church=church)
    
    def active_for_church(self, church):
        """Membros ativos de uma igreja"""
        return self.for_church(church).filter(
            is_active=True,
            membership_status=MembershipStatusChoices.ACTIVE
        )
    
    def by_age_range(self, min_age=None, max_age=None):
        """Filtra por faixa etária"""
        qs = self.get_queryset()
        
        if min_age:
            max_birth_date = date.today() - timedelta(days=min_age * 365)
            qs = qs.filter(birth_date__lte=max_birth_date)
        
        if max_age:
            min_birth_date = date.today() - timedelta(days=max_age * 365)
            qs = qs.filter(birth_date__gte=min_birth_date)
        
        return qs


class Member(BaseModel):
    """
    Membro da Igreja - Registro completo de membresia.
    
    Inclui dados pessoais, eclesiásticos, ministeriais e familiares.
    Base para todo o sistema de gestão de membros.
    """
    
    # =====================================
    # RELACIONAMENTOS (MULTI-TENANT)
    # =====================================
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name="Igreja",
        help_text="Igreja à qual o membro pertence"
    )
    
    # Usuário do sistema (opcional)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='member_profile',
        verbose_name="Usuário do Sistema",
        help_text="Usuário do sistema (se tiver acesso)"
    )
    
    # =====================================
    # DADOS PESSOAIS
    # =====================================
    
    # Nome completo
    full_name = models.CharField(
        "Nome Completo",
        max_length=200,
        help_text="Nome completo do membro"
    )
    
    # Documentos
    cpf = models.CharField(
        "CPF",
        max_length=14,
        unique=True,
        blank=True,
        null=True,
        validators=[validate_cpf],
        help_text="CPF do membro"
    )
    
    rg = models.CharField(
        "RG",
        max_length=20,
        blank=True,
        help_text="RG ou documento de identidade"
    )
    
    # Dados básicos
    birth_date = models.DateField(
        "Data de Nascimento",
        help_text="Data de nascimento"
    )
    
    gender = models.CharField(
        "Gênero",
        max_length=1,
        choices=GenderChoices.choices,
        blank=True,
        null=True,
        help_text="Gênero do membro"
    )
    
    marital_status = models.CharField(
        "Estado Civil",
        max_length=20,
        choices=[
            ('single', 'Solteiro(a)'),
            ('married', 'Casado(a)'),
            ('divorced', 'Divorciado(a)'),
            ('widowed', 'Viúvo(a)'),
            ('other', 'Outro'),
        ],
        default='single',
        help_text="Estado civil"
    )
    
    # =====================================
    # DADOS DO CÔNJUGE (quando casado)
    # =====================================
    
    spouse_name = models.CharField(
        "Nome do Cônjuge",
        max_length=200,
        blank=True,
        null=True,
        help_text="Nome completo do cônjuge (preencher se casado)"
    )
    
    spouse_is_member = models.BooleanField(
        "Cônjuge é Membro da Igreja",
        default=False,
        help_text="Marcar se o cônjuge também é membro desta igreja"
    )
    
    spouse_member = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='spouse_of',
        verbose_name="Cônjuge (Membro)",
        help_text="Selecionar o cônjuge se for membro da igreja"
    )
    
    # =====================================
    # DADOS FAMILIARES
    # =====================================
    
    children_count = models.PositiveSmallIntegerField(
        "Quantidade de Filhos",
        null=True,
        blank=True,
        help_text="Número de filhos (opcional)"
    )

    # Contato
    email = models.EmailField(
        "E-mail",
        blank=True,
        help_text="E-mail pessoal"
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        blank=True,
        help_text="Telefone principal no formato (XX) XXXXX-XXXX"
    )
    
    phone_secondary = models.CharField(
        "Telefone Secundário",
        max_length=20,
        validators=[phone_validator],
        blank=True,
        help_text="Telefone alternativo"
    )
    
    # =====================================
    # ENDEREÇO
    # =====================================
    
    address = models.TextField(
        "Endereço",
        blank=True,
        help_text="Endereço (rua, avenida, etc.)"
    )
    
    number = models.CharField(
        "Número",
        max_length=20,
        blank=True,
        help_text="Número da residência"
    )
    
    complement = models.CharField(
        "Complemento",
        max_length=100,
        blank=True,
        help_text="Complemento (apartamento, bloco, etc.)"
    )
    
    neighborhood = models.CharField(
        "Bairro",
        max_length=100,
        blank=True,
        help_text="Bairro"
    )
    
    city = models.CharField(
        "Cidade",
        max_length=100,
        blank=True,
        help_text="Cidade"
    )
    
    state = models.CharField(
        "Estado",
        max_length=2,
        blank=True,
        help_text="Sigla do estado (ex: SP)"
    )
    
    zipcode = models.CharField(
        "CEP",
        max_length=10,
        validators=[cep_validator],
        blank=True,
        help_text="CEP no formato XXXXX-XXX"
    )
    
    # =====================================
    # DADOS ECLESIÁSTICOS
    # =====================================
    
    membership_status = models.CharField(
        "Status de Membresia",
        max_length=20,
        choices=MembershipStatusChoices.choices,
        default=MembershipStatusChoices.ACTIVE,
        help_text="Status atual da membresia"
    )
    
    # Datas importantes
    conversion_date = models.DateField(
        "Data de Conversão",
        blank=True,
        null=True,
        help_text="Data da conversão/aceitação de Jesus"
    )
    
    baptism_date = models.DateField(
        "Data do Batismo",
        blank=True,
        null=True,
        help_text="Data do batismo nas águas"
    )
    
    membership_date = models.DateField(
        "Data de Membresia",
        default=date.today,
        help_text="Data de ingresso como membro"
    )
    
    # Dados de origem
    previous_church = models.CharField(
        "Igreja Anterior",
        max_length=200,
        blank=True,
        help_text="Nome da igreja anterior (se aplicável)"
    )
    
    transfer_letter = models.BooleanField(
        "Possui Carta de Transferência",
        default=False,
        help_text="Se veio com carta de transferência"
    )
    
    # =====================================
    # DADOS MINISTERIAIS
    # =====================================
    
    ministries = models.ManyToManyField(
        'activities.Ministry',
        blank=True,
        related_name='members',
        verbose_name="Ministérios",
        help_text="Ministérios dos quais participa"
    )
    
    ministerial_function = models.CharField(
        "Função Ministerial",
        max_length=100,
        blank=True,
        choices=[
            ('member', 'Membro'),
            ('deacon', 'Diácono'),
            ('deaconess', 'Diaconisa'),
            ('elder', 'Presbítero'),
            ('evangelist', 'Evangelista'),
            ('pastor', 'Pastor'),
            ('missionary', 'Missionário'),
            ('leader', 'Líder'),
            ('cooperator', 'Cooperador'),
            ('auxiliary', 'Auxiliar'),
        ],
        default='member',
        help_text="Função/cargo ministerial"
    )
    
    ordination_date = models.DateField(
        "Data de Ordenação",
        blank=True,
        null=True,
        help_text="Data de ordenação ministerial (se aplicável)"
    )
    
    # =====================================
    # DADOS FAMILIARES
    # =====================================
    
    # Responsável (para menores de idade)
    responsible = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dependents',
        verbose_name="Responsável",
        help_text="Responsável legal (para menores)"
    )
    
    # =====================================
    # DADOS ADICIONAIS
    # =====================================
    
    profession = models.CharField(
        "Profissão",
        max_length=100,
        blank=True,
        help_text="Profissão do membro"
    )
    
    education_level = models.CharField(
        "Escolaridade",
        max_length=30,
        choices=[
            ('elementary_incomplete', 'Fundamental Incompleto'),
            ('elementary_complete', 'Fundamental Completo'),
            ('high_school_incomplete', 'Médio Incompleto'),
            ('high_school_complete', 'Médio Completo'),
            ('higher_incomplete', 'Superior Incompleto'),
            ('higher_complete', 'Superior Completo'),
            ('postgraduate', 'Pós-graduação'),
            ('masters', 'Mestrado'),
            ('doctorate', 'Doutorado'),
        ],
        blank=True,
        help_text="Nível de escolaridade"
    )
    
    # Foto
    photo = models.ImageField(
        "Foto",
        upload_to='members/photos/',
        blank=True,
        null=True,
        help_text="Foto do membro"
    )
    
    # Observações
    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações gerais sobre o membro"
    )
    
    # Preferências de contato
    accept_sms = models.BooleanField(
        "Aceita SMS",
        default=True,
        help_text="Permite receber SMS"
    )
    
    accept_email = models.BooleanField(
        "Aceita E-mail",
        default=True,
        help_text="Permite receber e-mails"
    )
    
    accept_whatsapp = models.BooleanField(
        "Aceita WhatsApp",
        default=True,
        help_text="Permite contato via WhatsApp"
    )
    
    # =====================================
    # MANAGERS
    # =====================================
    
    objects = TenantManager()
    
    class Meta:
        verbose_name = "Membro"
        verbose_name_plural = "Membros"
        ordering = ['church', 'full_name']
        indexes = [
            models.Index(fields=['church', 'full_name']),
            models.Index(fields=['church', 'membership_status']),
            models.Index(fields=['church', 'is_active']),
            models.Index(fields=['cpf']),
            models.Index(fields=['birth_date']),
            models.Index(fields=['membership_date']),
            models.Index(fields=['ministerial_function']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.church.short_name}"
    
    def save(self, *args, **kwargs):
        """Override save para validações e formatações"""
        # Formatar campos
        if self.state:
            self.state = self.state.upper()
        
        # Validar datas lógicas
        if self.conversion_date and self.birth_date:
            if self.conversion_date < self.birth_date:
                raise ValidationError("Data de conversão não pode ser anterior ao nascimento")
        
        if self.baptism_date and self.conversion_date:
            if self.baptism_date < self.conversion_date:
                raise ValidationError("Data de batismo não pode ser anterior à conversão")
        
        # Validar dados do cônjuge
        self._validate_spouse_data()
        
        super().save(*args, **kwargs)
    
    def _validate_spouse_data(self):
        """Valida consistência dos dados do cônjuge"""
        # Se não é casado, limpar dados do cônjuge
        if self.marital_status != 'married':
            self.spouse_name = None
            self.spouse_is_member = False
            self.spouse_member = None
            return
        
        # Se spouse_member está preenchido, deve marcar spouse_is_member
        if self.spouse_member:
            self.spouse_is_member = True
            # Se um membro específico foi selecionado, usar o nome dele
            if self.spouse_member.full_name:
                self.spouse_name = self.spouse_member.full_name
        
        # Permitir que spouse_is_member seja True mesmo sem spouse_member
        # Isso facilita o cadastro quando o cônjuge ainda não foi cadastrado
        # A vinculação pode ser feita posteriormente através da edição
    
    # =====================================
    # PROPRIEDADES CALCULADAS
    # =====================================
    
    @property
    def age(self):
        """Calcula idade atual"""
        if self.birth_date:
            today = date.today()
            return today.year - self.birth_date.year - (
                (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
        return None
    
    @property
    def membership_years(self):
        """Calcula anos de membresia"""
        if self.membership_date:
            today = date.today()
            return today.year - self.membership_date.year - (
                (today.month, today.day) < (self.membership_date.month, self.membership_date.day)
            )
        return 0
    
    @property
    def is_minor(self):
        """Verifica se é menor de idade"""
        return self.age and self.age < 18
    
    @property
    def is_active_member(self):
        """Verifica se é membro ativo"""
        return (
            self.is_active and 
            self.membership_status == MembershipStatusChoices.ACTIVE
        )
    
    @property
    def full_address(self):
        """Endereço completo formatado"""
        if not self.address:
            return ""
        
        # Monta o endereço base
        address_parts = [self.address]
        
        # Adiciona número se existir
        if self.number:
            address_parts.append(f"nº {self.number}")
        
        # Adiciona complemento se existir
        if self.complement:
            address_parts.append(self.complement)
        
        # Junta o endereço base
        address_line = ", ".join(address_parts)
        parts = [address_line]
        
        # Adiciona bairro, cidade/estado e CEP
        if self.neighborhood:
            parts.append(f"Bairro {self.neighborhood}")
        if self.city and self.state:
            parts.append(f"{self.city}/{self.state}")
        if self.zipcode:
            parts.append(self.zipcode)
        
        return ", ".join(parts)
    
    @property
    def display_name(self):
        """Nome para exibição em listas"""
        return self.full_name
    
    @property
    def contact_preferences(self):
        """Preferências de contato resumidas"""
        prefs = []
        if self.accept_email:
            prefs.append("E-mail")
        if self.accept_sms:
            prefs.append("SMS")
        if self.accept_whatsapp:
            prefs.append("WhatsApp")
        return prefs
    
    # =====================================
    # MÉTODOS DE NEGÓCIO
    # =====================================
    
    def get_family_members(self):
        """Retorna membros da família (cônjuge + dependentes)"""
        family = []
        
        # Cônjuge
        if self.spouse_member:
            family.append(self.spouse_member)
        
        # Dependentes
        family.extend(self.dependents.filter(is_active=True))
        
        # Se é dependente, inclui responsável e irmãos
        if self.responsible:
            family.append(self.responsible)
            family.extend(
                self.responsible.dependents.filter(is_active=True).exclude(id=self.id)
            )
        
        return list(set(family))  # Remove duplicatas
    
    def can_be_responsible(self):
        """Verifica se pode ser responsável por menores"""
        return self.age and self.age >= 18
    
    def get_ministries_list(self):
        """Lista de ministérios como string"""
        return ", ".join([ministry.name for ministry in self.ministries.all()])
    
    def get_conversion_age(self):
        """Idade na conversão"""
        if self.conversion_date and self.birth_date:
            return self.conversion_date.year - self.birth_date.year - (
                (self.conversion_date.month, self.conversion_date.day) < 
                (self.birth_date.month, self.birth_date.day)
            )
        return None
    
    def update_membership_status(self, new_status, reason=""):
        """Atualiza status de membresia com log"""
        old_status = self.membership_status
        self.membership_status = new_status
        self.save()
        
        # Log da mudança
        MembershipStatusLog.objects.create(
            member=self,
            previous_status=old_status,
            new_status=new_status,
            reason=reason,
            changed_by=None  # TODO: Adicionar usuário quando implementar
        )
    
    def transfer_to_church(self, new_church, reason=""):
        """Transfere membro para outra igreja"""
        old_church = self.church
        self.church = new_church
        self.membership_status = MembershipStatusChoices.ACTIVE
        self.save()
        
        # Log da transferência
        MemberTransferLog.objects.create(
            member=self,
            from_church=old_church,
            to_church=new_church,
            reason=reason,
            transferred_by=None  # TODO: Adicionar usuário
        )


class MembershipStatusLog(BaseModel):
    """Log de mudanças de status de membresia"""
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='status_logs',
        verbose_name="Membro"
    )
    
    previous_status = models.CharField(
        "Status Anterior",
        max_length=20,
        choices=MembershipStatusChoices.choices
    )
    
    new_status = models.CharField(
        "Novo Status",
        max_length=20,
        choices=MembershipStatusChoices.choices
    )
    
    reason = models.TextField(
        "Motivo",
        blank=True,
        help_text="Motivo da mudança de status"
    )
    
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='member_status_changes',
        verbose_name="Alterado por"
    )
    
    class Meta:
        verbose_name = "Log de Status de Membresia"
        verbose_name_plural = "Logs de Status de Membresia"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.member.full_name}: {self.previous_status} → {self.new_status}"


class MemberTransferLog(BaseModel):
    """Log de transferências de membros entre igrejas"""
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='transfer_logs',
        verbose_name="Membro"
    )
    
    from_church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='members_transferred_out',
        verbose_name="Igreja de Origem"
    )
    
    to_church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='members_transferred_in',
        verbose_name="Igreja de Destino"
    )
    
    reason = models.TextField(
        "Motivo",
        blank=True,
        help_text="Motivo da transferência"
    )
    
    transferred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='member_transfers',
        verbose_name="Transferido por"
    )
    
    class Meta:
        verbose_name = "Log de Transferência"
        verbose_name_plural = "Logs de Transferências"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.member.full_name}: {self.from_church.short_name} → {self.to_church.short_name}"


# =====================================
# STATUS DE MEMBRESIA - NOVA ESTRUTURA
# =====================================
class MinisterialFunctionChoices(models.TextChoices):
    """Choices padronizados para funções ministeriais"""
    MEMBER = 'member', 'Membro'
    DEACON = 'deacon', 'Diácono'
    DEACONESS = 'deaconess', 'Diaconisa'
    ELDER = 'elder', 'Presbítero'
    EVANGELIST = 'evangelist', 'Evangelista'
    PASTOR = 'pastor', 'Pastor'
    FEMALE_PASTOR = 'female_pastor', 'Pastora'
    MISSIONARY = 'missionary', 'Missionário'
    FEMALE_MISSIONARY = 'female_missionary', 'Missionária'
    LEADER = 'leader', 'Líder'
    COOPERATOR = 'cooperator', 'Cooperador(a)'
    AUXILIARY = 'auxiliary', 'Auxiliar'


class MembershipStatus(models.Model):
    """
    Status de Membresia - Baseado na estrutura da tabela existente da branch dev/magnum
    """
    
    # Relacionamento com membro (nome do campo da migration: id_member)
    id_member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name='membership_statuses',
        verbose_name="Membro"
    )
    
    # Status ministerial
    status = models.CharField(
        max_length=20,
        choices=MinisterialFunctionChoices.choices,
        default=MinisterialFunctionChoices.MEMBER,
        help_text="Função/cargo ministerial"
    )
    
    # Flag ativo (nome do campo da migration: is_active)
    is_active = models.BooleanField(
        "Ativo/Inativo",
        default=True,
        help_text="Se o status está ativo/inativo"
    )
    
    # Datas importantes
    ordination_date = models.DateField(
        "Data de Ordenação",
        blank=True,
        null=True,
        help_text="Data de ordenação ministerial (se aplicável)"
    )
    
    termination_date = models.DateField(
        "Data de Término",
        blank=True,
        null=True,
        help_text="Data de término do status (se aplicável)"
    )
    
    # Observações
    observation = models.TextField(
        "Observação",
        blank=True,
        help_text="Observações sobre o status"
    )
    
    # Timestamps (da migration original)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Status de Membresia"
        verbose_name_plural = "Status de Membresia"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.id_member.full_name} - {self.get_status_display()}"
    
    @property
    def member(self):
        """Alias para compatibilidade"""
        return self.id_member
