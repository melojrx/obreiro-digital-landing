from django.db import models
from apps.core.models import BaseModel, TenantManager
from apps.core.models import phone_validator, validate_cpf
from apps.core.models import GenderChoices


class VisitorManager(TenantManager):
    """Manager para visitantes com filtros por igreja"""
    
    def pending_conversion(self, church):
        """Visitantes que ainda não foram convertidos em membros"""
        return self.filter(
            church=church,
            converted_to_member=False
        )
    
    def converted(self, church):
        """Visitantes já convertidos em membros"""
        return self.filter(
            church=church,
            converted_to_member=True
        )


class Visitor(BaseModel):
    """
    Visitantes registrados via QR Code das filiais
    """
    
    # =====================================
    # RELACIONAMENTOS (MULTI-TENANT)
    # =====================================
    
    church = models.ForeignKey(
        'churches.Church',
        on_delete=models.CASCADE,
        related_name='visitors',
        verbose_name="Igreja",
        null=True,
        blank=True
    )
    
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='visitors',
        verbose_name="Filial",
        null=True,
        blank=True
    )
    
    # Membro convertido (se aplicável)
    converted_member = models.OneToOneField(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitor_origin',
        verbose_name="Membro Convertido"
    )
    
    # =====================================
    # DADOS PESSOAIS
    # =====================================
    
    full_name = models.CharField(
        "Nome Completo",
        max_length=200,
        default=""
    )
    
    email = models.EmailField(
        "E-mail",
        default=""
    )
    
    phone = models.CharField(
        "Telefone",
        max_length=20,
        validators=[phone_validator],
        default=""
    )
    
    birth_date = models.DateField(
        "Data de Nascimento",
        blank=True,
        null=True
    )
    
    gender = models.CharField(
        "Gênero",
        max_length=1,
        choices=GenderChoices.choices,
        blank=True,
        null=True
    )
    
    cpf = models.CharField(
        "CPF",
        max_length=14,
        blank=True,
        validators=[validate_cpf]
    )
    
    # =====================================
    # ENDEREÇO
    # =====================================
    
    city = models.CharField(
        "Cidade",
        max_length=100,
        default=""
    )
    
    state = models.CharField(
        "Estado",
        max_length=2,
        default=""
    )
    
    neighborhood = models.CharField(
        "Bairro",
        max_length=100,
        default=""
    )
    
    zipcode = models.CharField(
        "CEP",
        max_length=10,
        default="",
        help_text="CEP no formato XXXXX-XXX"
    )
    
    address = models.CharField(
        "Endereço",
        max_length=200,
        default="",
        help_text="Rua, número, complemento"
    )
    
    # =====================================
    # DADOS ESPECÍFICOS DO FORMULÁRIO
    # =====================================
    
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
        default='single'
    )
    
    ministry_interest = models.TextField(
        "Interesse em Ministérios",
        blank=True
    )
    
    first_visit = models.BooleanField(
        "Primeira Visita",
        default=True
    )
    
    wants_prayer = models.BooleanField(
        "Quer Oração",
        default=False
    )
    
    wants_growth_group = models.BooleanField(
        "Interesse em Grupo de Crescimento",
        default=False
    )
    
    observations = models.TextField(
        "Observações",
        blank=True
    )
    
    # =====================================
    # ORIGEM E RASTREAMENTO
    # =====================================
    
    qr_code_used = models.UUIDField(
        "QR Code Utilizado",
        null=True,
        blank=True
    )
    
    registration_source = models.CharField(
        "Fonte do Cadastro",
        max_length=20,
        default='qr_code'
    )
    
    user_agent = models.TextField(
        "User Agent",
        blank=True
    )
    
    ip_address = models.GenericIPAddressField(
        "Endereço IP",
        blank=True,
        null=True
    )
    
    # =====================================
    # SISTEMA DE CONVERSÃO
    # =====================================
    
    converted_to_member = models.BooleanField(
        "Convertido para Membro",
        default=False
    )
    
    conversion_date = models.DateTimeField(
        "Data de Conversão",
        blank=True,
        null=True
    )
    
    conversion_notes = models.TextField(
        "Notas da Conversão",
        blank=True
    )
    
    # =====================================
    # ACOMPANHAMENTO
    # =====================================
    
    contact_attempts = models.PositiveIntegerField(
        "Tentativas de Contato",
        default=0
    )
    
    last_contact_date = models.DateTimeField(
        "Último Contato",
        blank=True,
        null=True
    )
    
    follow_up_status = models.CharField(
        "Status do Follow-up",
        max_length=20,
        choices=[
            ('pending', 'Pendente'),
            ('contacted', 'Contatado'),
            ('interested', 'Interessado'),
            ('not_interested', 'Não Interessado'),
            ('converted', 'Convertido'),
        ],
        default='pending'
    )
    
    # Managers
    objects = VisitorManager()
    
    class Meta:
        verbose_name = "Visitante"
        verbose_name_plural = "Visitantes"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['church', 'branch']),
            models.Index(fields=['church', 'converted_to_member']),
            models.Index(fields=['qr_code_used']),
        ]
    
    def __str__(self):
        return f"{self.full_name} - {self.branch.name}"
    
    @property
    def age(self):
        """Calcula idade baseada na data de nascimento"""
        if not self.birth_date:
            return None
        
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
    
    def convert_to_member(self, notes=""):
        """Converte visitante em membro"""
        if self.converted_to_member:
            return self.converted_member
        
        from apps.members.models import Member
        from django.utils import timezone
        
        # Criar membro baseado no visitante
        member = Member.objects.create(
            church=self.church,
            branch=self.branch,
            full_name=self.full_name,
            email=self.email,
            phone=self.phone,
            birth_date=self.birth_date,
            gender=self.gender,
            cpf=self.cpf,
            city=self.city,
            state=self.state,
            neighborhood=self.neighborhood,
            address=self.address,
            marital_status=self.marital_status,
            origin='visitante',
            converted_from_visitor=True
        )
        
        # Marcar conversão
        self.converted_to_member = True
        self.converted_member = member
        self.conversion_date = timezone.now()
        self.conversion_notes = notes
        self.follow_up_status = 'converted'
        self.save()
        
        return member