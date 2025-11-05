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
    GenderChoices, MembershipStatusChoices, MinisterialFunctionChoices
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
    
    def by_membership_status(self, status):
        """Filtra por status de membresia"""
        return self.get_queryset().filter(membership_status=status)
    
    def for_church(self, church):
        """Membros de uma igreja específica"""
        return self.get_queryset().filter(church=church)

    def for_branch(self, branch):
        """Membros de uma filial específica"""
        return self.get_queryset().filter(branch=branch)
    
    def active_for_church(self, church):
        """Membros ativos de uma igreja"""
        return self.for_church(church).filter(
            is_active=True,
            membership_status=MembershipStatusChoices.ACTIVE
        )
    
    def by_ministerial_function(self, function):
        """Filtra por função ministerial"""
        return self.get_queryset().filter(ministerial_function=function)
    
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

    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
        verbose_name="Filial",
        help_text="Filial de referência do membro"
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
        blank=True,
        null=True,
        validators=[validate_cpf],
        help_text="CPF do membro (opcional)"
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
    
    # Referência ao cônjuge (se for membro da igreja)
    spouse = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='spouse_of',
        verbose_name="Cônjuge",
        help_text="Cônjuge (se for membro da igreja)"
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
        help_text="Telefone principal no formato (XX) XXXXX-XXXX (obrigatório)"
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
    
    # Status de membresia
    membership_status = models.CharField(
        "Status de Membresia",
        max_length=20,
        choices=MembershipStatusChoices.choices,
        default=MembershipStatusChoices.ACTIVE,
        help_text="Status atual da membresia"
    )
    
    # Datas importantes
    # Removido: conversion_date (migrado/abolido)
    
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

    # Campos novos (compat) – período explícito da membresia
    first_membership_date = models.DateField(
        "Primeira Membresia",
        blank=True,
        null=True,
        help_text="Data original de entrada na denominação/igreja (nunca muda após criação)"
    )
    
    membership_start_date = models.DateField(
        "Início da Membresia",
        blank=True,
        null=True,
        help_text="Data de início na congregação atual"
    )

    membership_end_date = models.DateField(
        "Fim da Membresia",
        blank=True,
        null=True,
        help_text="Data de término da membresia (se desligado)"
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
    
    ministerial_function = models.CharField(
        "Função Ministerial",
        max_length=100,
        choices=MinisterialFunctionChoices.choices,
        default=MinisterialFunctionChoices.MEMBER,
        blank=True,
        help_text="Função/cargo ministerial"
    )
    
    # Removido: ordination_date (migrado/abolido)
    
    ministries = models.ManyToManyField(
        'activities.Ministry',
        blank=True,
        related_name='members',
        verbose_name="Ministérios",
        help_text="Ministérios dos quais participa"
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
    
    objects = MemberManager()
    
    class Meta:
        verbose_name = "Membro"
        verbose_name_plural = "Membros"
        ordering = ['church', 'full_name']
        indexes = [
            models.Index(fields=['church', 'full_name']),
            models.Index(fields=['church', 'is_active']),
            models.Index(fields=['church', 'membership_status']),
            models.Index(fields=['church', 'branch']),
            models.Index(fields=['ministerial_function']),
            models.Index(fields=['cpf']),
            models.Index(fields=['birth_date']),
            models.Index(fields=['membership_date']),
            models.Index(fields=['membership_end_date']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.church.short_name}"
    
    def save(self, *args, **kwargs):
        """Override save para validações, formatações e sincronização de relacionamentos"""
        # Formatar campos
        if self.state:
            self.state = self.state.upper()
        
        # FASE 2: Definir first_membership_date apenas na criação
        if not self.pk and not self.first_membership_date and self.membership_start_date:
            self.first_membership_date = self.membership_start_date
        
        # Validar datas lógicas
        self._validate_dates()
        
        # Validar dados do cônjuge
        self._validate_spouse_data()

        if self.branch and self.branch.church_id != self.church_id:
            raise ValidationError("Filial selecionada não pertence à mesma igreja.")

        old_spouse = None
        old_membership_status = None
        if self.pk:
            try:
                old_instance = Member.objects.select_related('spouse').get(pk=self.pk)
                old_spouse = old_instance.spouse
                old_membership_status = old_instance.membership_status
            except Member.DoesNotExist:
                old_spouse = None
                old_membership_status = None
        
        super().save(*args, **kwargs)

        self._sync_spouse_relationship(old_spouse)
        self._update_spouse_on_death(old_membership_status)
    
    def _validate_dates(self):
        """Valida consistência das datas"""
        today = date.today()
        
        # Validar data de nascimento
        if self.birth_date and self.birth_date > today:
            raise ValidationError("Data de nascimento não pode ser no futuro")
        
        # Validar data de batismo
        if self.baptism_date:
            if self.birth_date and self.baptism_date < self.birth_date:
                raise ValidationError("Data de batismo não pode ser anterior ao nascimento")
            if self.baptism_date > today:
                raise ValidationError("Data de batismo não pode ser no futuro")
        
        # Validar data de membresia
        if self.membership_date:
            if self.birth_date and self.membership_date < self.birth_date:
                raise ValidationError("Data de membresia não pode ser anterior ao nascimento")
            if self.membership_date > today:
                raise ValidationError("Data de membresia não pode ser no futuro")

        # Validar período de membresia explícito
        if self.membership_start_date and self.birth_date and self.membership_start_date < self.birth_date:
            raise ValidationError("Início da membresia não pode ser anterior ao nascimento")
        if self.membership_start_date and self.membership_start_date > today:
            raise ValidationError("Início da membresia não pode ser no futuro")
        if self.membership_end_date and self.membership_start_date and self.membership_end_date <= self.membership_start_date:
            raise ValidationError("Fim da membresia deve ser posterior ao início")
    
    def _validate_spouse_data(self):
        """Valida consistência dos dados do cônjuge"""
        # Se não é casado, limpar dados do cônjuge
        if self.marital_status != 'married':
            self.spouse = None
            return
        
        # Se o cônjuge for o próprio membro, limpar
        if self.spouse == self:
            self.spouse = None

    def _sync_spouse_relationship(self, old_spouse):
        """Sincroniza relacionamento bidirecional de cônjuge após salvar"""
        # Cenário 1: membro deixou de ser casado ou definiu cônjuge não-membro
        if self.marital_status != 'married' or not self.spouse_id:
            if old_spouse and old_spouse.spouse_id == self.pk:
                Member.objects.filter(pk=old_spouse.pk).update(
                    spouse=None,
                    marital_status='single',
                    updated_at=timezone.now()
                )
            return

        # Cenário 2: membro casado com outro membro
        new_spouse = self.spouse

        # Cônjuge anterior diferente: limpar vínculo recíproco
        if old_spouse and old_spouse.pk != new_spouse.pk and old_spouse.spouse_id == self.pk:
            Member.objects.filter(pk=old_spouse.pk).update(
                spouse=None,
                marital_status='single',
                updated_at=timezone.now()
            )

        # Atualizar cônjuge atual para refletir o relacionamento
        if new_spouse.spouse_id != self.pk or new_spouse.marital_status != 'married':
            Member.objects.filter(pk=new_spouse.pk).update(
                spouse=self.pk,
                marital_status='married',
                updated_at=timezone.now()
            )

    def _update_spouse_on_death(self, old_membership_status):
        """Atualiza cônjuge quando membro falece"""
        if self.membership_status == 'deceased' and old_membership_status != 'deceased' and self.spouse_id:
            Member.objects.filter(pk=self.spouse_id).update(
                marital_status='widowed',
                spouse=None,
                updated_at=timezone.now()
            )
    
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
    
    # Removido: conversion_age (compatibilidade não necessária)
    
    @property
    def is_minor(self):
        """Verifica se é menor de idade"""
        return self.age and self.age < 18
    
    @property
    def is_active_member(self):
        """Verifica se é membro ativo"""
        return self.is_active
    
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
        if self.spouse:
            family.append(self.spouse)
        
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
    
    def update_membership_status(self, new_status, reason="", changed_by=None):
        """Atualiza status de membresia com log"""
        if new_status == self.membership_status:
            return  # Sem mudança
            
        old_status = self.membership_status
        self.membership_status = new_status
        self.save()
        
        # Criar log da mudança
        MembershipStatusLog.objects.create(
            member=self,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            reason=reason
        )
    
    
    
    
    def transfer_to_church(self, new_church, reason=""):
        """Transfere membro para outra igreja"""
        old_church = self.church
        self.church = new_church
        self.save()
        
        # Log da transferência
        MemberTransferLog.objects.create(
            member=self,
            from_church=old_church,
            to_church=new_church,
            reason=reason,
            transferred_by=None  # TODO: Adicionar usuário
        )


class MembershipStatus(BaseModel):
    """
    Status de membresia específico por membro
    Permite múltiplos status simultâneos e histórico completo
    """
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='membership_statuses',
        verbose_name="Membro"
    )

    # Nova referência opcional à filial onde a ordenação/status ocorreu
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='membership_statuses',
        verbose_name="Filial"
    )
    
    status = models.CharField(
        "Status",
        max_length=100,
        choices=MembershipStatusChoices.choices,
        help_text="Status de membresia"
    )
    
    effective_date = models.DateField(
        "Data Efetiva",
        blank=True,
        null=True,
        help_text="Data de início do status"
    )
    
    end_date = models.DateField(
        "Data de Término",
        blank=True,
        null=True,
        help_text="Data de fim do status (vazio se ainda ativo)"
    )
    
    observation = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações sobre este status"
    )
    
    class Meta:
        verbose_name = "Status de Membresia"
        verbose_name_plural = "Status de Membresia"
        ordering = ['-effective_date', '-created_at']
        indexes = [
            models.Index(fields=['member', '-effective_date']),
            models.Index(fields=['status', '-effective_date']),
            models.Index(fields=['branch']),
        ]
        constraints = [
            # Garante apenas um status 'atual' por membro quando end_date é nulo
            models.UniqueConstraint(
                fields=['member'],
                condition=models.Q(end_date__isnull=True),
                name='unique_current_membership_status_per_member'
            )
        ]
    
    def __str__(self):
        return f"{self.member.full_name} - {self.get_status_display()}"
    
    @property
    def is_current(self):
        """Verifica se é um status atual (sem data de término)"""
        return self.end_date is None
    
    def save(self, *args, **kwargs):
        """Validações no save"""
        if self.end_date and self.effective_date:
            if self.end_date <= self.effective_date:
                raise ValidationError("Data de término deve ser posterior à data de ordenação")
        
        super().save(*args, **kwargs)


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


class BranchTransferLog(BaseModel):
    """
    Log de transferências de membros entre congregações (branches).
    Registra todo o histórico de movimentação entre matriz e filiais.
    """
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='branch_transfer_history',
        verbose_name="Membro"
    )
    
    from_branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='members_transferred_out',
        verbose_name="Congregação de Origem"
    )
    
    to_branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='members_transferred_in',
        verbose_name="Congregação de Destino"
    )
    
    # Preservar datas da membresia na congregação antiga
    previous_membership_start_date = models.DateField(
        "Data Início na Congregação Anterior",
        null=True,
        blank=True,
        help_text="Quando o membro entrou na congregação de origem"
    )
    
    # Data de transferência (redundante com created_at, mas mais explícito)
    transfer_date = models.DateField(
        "Data da Transferência",
        help_text="Data em que a transferência foi realizada"
    )
    
    transferred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='branch_transfers_made',
        verbose_name="Transferido por"
    )
    
    reason = models.TextField(
        "Motivo",
        blank=True,
        help_text="Motivo da transferência entre congregações"
    )
    
    # Informação adicional: tipo de transferência
    TRANSFER_TYPE_CHOICES = [
        ('same_church', 'Entre congregações da mesma igreja'),
        ('different_church', 'Entre igrejas diferentes (mesma denominação)'),
    ]
    
    transfer_type = models.CharField(
        "Tipo de Transferência",
        max_length=20,
        choices=TRANSFER_TYPE_CHOICES,
        default='same_church',
        help_text="Indica se a transferência foi dentro da mesma igreja ou entre igrejas"
    )
    
    class Meta:
        verbose_name = "Log de Transferência entre Congregações"
        verbose_name_plural = "Logs de Transferências entre Congregações"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member', '-created_at']),
            models.Index(fields=['from_branch', '-created_at']),
            models.Index(fields=['to_branch', '-created_at']),
            models.Index(fields=['transfer_date']),
        ]
    
    def __str__(self):
        return f"{self.member.full_name}: {self.from_branch.name} → {self.to_branch.name} ({self.transfer_date.strftime('%d/%m/%Y')})"
    
    @property
    def duration_in_previous_branch(self):
        """Calcula quanto tempo o membro ficou na congregação anterior (em dias)"""
        if self.previous_membership_start_date and self.transfer_date:
            return (self.transfer_date - self.previous_membership_start_date).days
        return None


# =====================================
# AUDITORIA DE STATUS - SOLUÇÃO SIMPLES
# =====================================
class MembershipStatusLog(BaseModel):
    """
    Log de mudanças de status de membresia - SIMPLES E EFICIENTE
    Mantém histórico completo sem duplicar estrutura de dados
    """
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name="Membro"
    )
    
    old_status = models.CharField(
        "Status Anterior",
        max_length=20,
        help_text="Status anterior do membro"
    )
    
    new_status = models.CharField(
        "Novo Status", 
        max_length=20,
        help_text="Novo status do membro"
    )
    
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='member_status_changes_made',
        verbose_name="Alterado por"
    )
    
    reason = models.TextField(
        "Motivo",
        blank=True,
        help_text="Motivo da mudança de status"
    )
    
    # created_at herdado de BaseModel para timestamp automático
    
    class Meta:
        verbose_name = "Log de Status de Membresia" 
        verbose_name_plural = "Logs de Status de Membresia"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member', '-created_at']),
            models.Index(fields=['new_status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.member.full_name}: {self.old_status} → {self.new_status}"
    
    def get_old_status_display(self):
        """Retorna o nome legível do status anterior"""
        return dict(MembershipStatusChoices.choices).get(self.old_status, self.old_status or 'Sem status')
    
    def get_new_status_display(self):
        """Retorna o nome legível do novo status"""
        return dict(MembershipStatusChoices.choices).get(self.new_status, self.new_status or 'Desconhecido')


class MinisterialFunctionHistory(BaseModel):
    """
    Histórico de Função Ministerial do membro.
    Registra alterações de função com período de vigência.
    """
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='ministerial_function_history',
        verbose_name="Membro"
    )

    function = models.CharField(
        "Função",
        max_length=100,
        choices=MinisterialFunctionChoices.choices,
        help_text="Função ministerial atribuída"
    )

    start_date = models.DateField(
        "Data de Início",
        help_text="Data de início da função"
    )

    end_date = models.DateField(
        "Data de Fim",
        null=True,
        blank=True,
        help_text="Data de término da função (vazio se atual)"
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ministerial_function_changes_made',
        verbose_name="Alterado por"
    )

    notes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações sobre a mudança de função"
    )

    class Meta:
        verbose_name = "Histórico de Função Ministerial"
        verbose_name_plural = "Histórico de Funções Ministeriais"
        ordering = ['-start_date', '-created_at']
        indexes = [
            models.Index(fields=['member', '-start_date']),
            models.Index(fields=['function', '-start_date']),
        ]
        constraints = [
            # Garante apenas uma função 'atual' (sem end_date) por membro
            models.UniqueConstraint(
                fields=['member'],
                condition=models.Q(end_date__isnull=True),
                name='unique_current_ministerial_function_per_member'
            )
        ]

    def __str__(self):
        status = 'atual' if not self.end_date else f"até {self.end_date}"
        return f"{self.member.full_name} - {self.get_function_display()} ({self.start_date} {status})"

    @property
    def is_current(self):
        return self.end_date is None

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_date and self.end_date <= self.start_date:
            raise ValidationError("Data de fim deve ser posterior à data de início")
        
        # Evitar sobreposição de períodos para este membro
        from django.db.models import Q
        qs = MinisterialFunctionHistory.objects.filter(member=self.member).exclude(pk=self.pk)
        new_start = self.start_date
        new_end = self.end_date
        # Considerar None como infinito futuro
        overlaps = qs.filter(
            Q(end_date__isnull=True, start_date__lte=new_end if new_end else new_start) |
            Q(end_date__isnull=False, start_date__lte=(new_end or new_start)) & Q(end_date__gte=new_start)
        )
        if overlaps.exists():
            raise ValidationError("Período informado se sobrepõe a outro registro de função ministerial deste membro")
